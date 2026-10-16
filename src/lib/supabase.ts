import { createClient } from '@supabase/supabase-js';
import { createTelemetryFetch } from './telemetryInterceptor';
import { clearStaleSupabaseTokens } from './utils';

export { clearStaleSupabaseTokens };

// Proactively sanitize corrupted, malformed, or already-expired tokens before Supabase starts
if (typeof window !== 'undefined') {
  try {
    const nowSec = Math.floor(Date.now() / 1000);
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('sb-') && k.endsWith('-auth-token'))) {
        const val = localStorage.getItem(k);
        if (!val || val === 'undefined' || val === 'null') {
          localStorage.removeItem(k);
        } else {
          try {
            const parsed = JSON.parse(val);
            if (!parsed || (!parsed.access_token && !parsed.refresh_token)) {
              localStorage.removeItem(k);
            } else if (parsed.expires_at && parsed.expires_at <= nowSec + 30) {
              // Token already expired; remove immediately to avoid "Invalid Refresh Token" on startup
              localStorage.removeItem(k);
            }
          } catch {
            localStorage.removeItem(k);
          }
        }
      }
    }
  } catch (e) {}
}

const url = (typeof window !== 'undefined' && (window as any).__SUPABASE_URL__) || import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const key = (typeof window !== 'undefined' && (window as any).__SUPABASE_ANON_KEY__) || import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Custom lock function to avoid navigator.locks AbortError when multiple requests/tabs run in parallel
    lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
      return await fn();
    },
  },
  global: {
    fetch: createTelemetryFetch(fetch),
  },
});

