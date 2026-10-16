import { clearStaleSupabaseTokens } from './utils';

/**
 * SmartBite API Telemetry Middleware & Interceptor
 * Intercepts all outgoing client-side requests to Supabase and API services.
 * Captures request latency, endpoints, status codes, payload metrics, and active session context.
 */

export interface ApiTelemetryEvent {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  endpoint: string;
  table?: string;
  status: number;
  durationMs: number;
  success: boolean;
  sessionId: string;
  fingerprint: string;
  path: string;
  error?: string;
}

type TelemetryListener = (event: ApiTelemetryEvent) => void;

class ApiTelemetryManager {
  private static instance: ApiTelemetryManager;
  private ringBuffer: ApiTelemetryEvent[] = [];
  private maxBufferSize = 150;
  private listeners: Set<TelemetryListener> = new Set();
  private stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalDurationMs: 0,
    endpointCounts: {} as Record<string, number>,
  };

  private constructor() {}

  public static getInstance(): ApiTelemetryManager {
    if (!ApiTelemetryManager.instance) {
      ApiTelemetryManager.instance = new ApiTelemetryManager();
    }
    return ApiTelemetryManager.instance;
  }

  public getSessionId(): string {
    try {
      let sess = sessionStorage.getItem('sb_session_id');
      if (!sess) {
        sess = `sess_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
        sessionStorage.setItem('sb_session_id', sess);
      }
      return sess;
    } catch {
      return 'sess_fallback';
    }
  }

  public getFingerprint(): string {
    try {
      return localStorage.getItem('sb_device_fp') || 'fp_unknown';
    } catch {
      return 'fp_fallback';
    }
  }

  public getCurrentPath(): string {
    try {
      return typeof window !== 'undefined' ? window.location.pathname : '/';
    } catch {
      return '/';
    }
  }

  public recordEvent(event: ApiTelemetryEvent) {
    this.ringBuffer.unshift(event);
    if (this.ringBuffer.length > this.maxBufferSize) {
      this.ringBuffer.pop();
    }

    // Update aggregated stats
    this.stats.totalRequests++;
    if (event.success) {
      this.stats.successfulRequests++;
    } else {
      this.stats.failedRequests++;
    }
    this.stats.totalDurationMs += event.durationMs;
    const epKey = event.table || event.endpoint;
    this.stats.endpointCounts[epKey] = (this.stats.endpointCounts[epKey] || 0) + 1;

    // Notify live subscribers (e.g. Admin Traffic Dashboard)
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.warn('Error in telemetry listener:', err);
      }
    });
  }

  public getRecentEvents(): ApiTelemetryEvent[] {
    return [...this.ringBuffer];
  }

  public getStats() {
    const avgLatency = this.stats.totalRequests > 0 
      ? Math.round(this.stats.totalDurationMs / this.stats.totalRequests) 
      : 0;

    return {
      ...this.stats,
      avgLatencyMs: avgLatency,
      recentEvents: this.getRecentEvents(),
    };
  }

  public subscribe(listener: TelemetryListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const apiTelemetry = ApiTelemetryManager.getInstance();

/**
 * Custom Fetch Interceptor for Supabase and HTTP Services
 */
export const createTelemetryFetch = (baseFetch: typeof fetch = fetch): typeof fetch => {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const startTime = performance.now();
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const method = (init?.method || 'GET').toUpperCase();
    
    // Parse target endpoint/table
    let endpoint = 'unknown';
    let table: string | undefined = undefined;
    try {
      const parsedUrl = new URL(urlStr, window?.location?.origin || 'http://localhost');
      endpoint = parsedUrl.pathname;
      const restMatch = parsedUrl.pathname.match(/\/rest\/v1\/([^/?#]+)/);
      if (restMatch && restMatch[1]) {
        table = restMatch[1];
      } else if (parsedUrl.pathname.includes('/auth/v1/')) {
        table = 'auth';
      } else if (parsedUrl.pathname.includes('/storage/v1/')) {
        table = 'storage';
      }
    } catch {
      endpoint = urlStr.substring(0, 40);
    }

    // Skip recording internal telemetry logging calls to prevent infinite loops
    const isInternalTelemetry = urlStr.includes('restaurant_visits') && method === 'POST';

    // Enrich outgoing request headers with telemetry metadata
    const headers = new Headers(init?.headers || {});
    const sessionId = apiTelemetry.getSessionId();
    const fingerprint = apiTelemetry.getFingerprint();
    const currentPath = apiTelemetry.getCurrentPath();

    if (!headers.has('X-Client-Session-Id')) {
      headers.set('X-Client-Session-Id', sessionId);
    }
    if (!headers.has('X-Client-Fingerprint')) {
      headers.set('X-Client-Fingerprint', fingerprint);
    }
    if (!headers.has('X-Client-Route')) {
      headers.set('X-Client-Route', encodeURIComponent(currentPath));
    }

    const modifiedInit: RequestInit = {
      ...init,
      headers,
    };

    try {
      const response = await baseFetch(input, modifiedInit);
      const durationMs = Math.round(performance.now() - startTime);

      // Auto-heal invalid refresh token errors returned by Supabase Auth
      if ((response.status === 400 || response.status === 401) && urlStr.includes('/auth/v1/')) {
        try {
          const clone = response.clone();
          clone.text().then(text => {
            if (
              text.includes('Refresh Token Not Found') ||
              text.includes('Invalid Refresh Token') ||
              text.includes('refresh_token_not_found') ||
              text.includes('invalid_grant')
            ) {
              console.warn('[TelemetryInterceptor] Stale Supabase refresh token detected. Auto-clearing local auth state...');
              clearStaleSupabaseTokens();
            }
          }).catch(() => {});
        } catch (e) {}
      }

      if (!isInternalTelemetry) {
        const event: ApiTelemetryEvent = {
          id: `api_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date().toISOString(),
          method,
          url: urlStr,
          endpoint,
          table,
          status: response.status,
          durationMs,
          success: response.ok,
          sessionId,
          fingerprint,
          path: currentPath,
        };

        apiTelemetry.recordEvent(event);
      }

      return response;
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - startTime);

      if (!isInternalTelemetry) {
        const event: ApiTelemetryEvent = {
          id: `api_err_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date().toISOString(),
          method,
          url: urlStr,
          endpoint,
          table,
          status: 0,
          durationMs,
          success: false,
          sessionId,
          fingerprint,
          path: currentPath,
          error: err?.message || 'Network request failed',
        };

        apiTelemetry.recordEvent(event);
      }

      throw err;
    }
  };
};
