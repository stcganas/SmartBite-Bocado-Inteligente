import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  
  // Base64 strings are returned as is
  if (url.startsWith('data:')) return url;
  
  // Format URLs containing /supabase/storage/v1/object/public/... to be relative /supabase/storage/v1/object/public/...
  const match = url.match(/\/supabase\/storage\/v1\/object\/public\/.+$/);
  if (match) {
    return match[0];
  }
  
  // Format raw supabase.co domain URLs to go through the local /supabase proxy
  const supabaseCoMatch = url.match(/https:\/\/[a-zA-Z0-9_-]+\.supabase\.co\/storage\/v1\/object\/public\/(.+)$/);
  if (supabaseCoMatch) {
    return `/supabase/storage/v1/object/public/${supabaseCoMatch[1]}`;
  }

  return url;
}

export function clearStaleSupabaseTokens() {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('sb-') || k.includes('supabase') || k.includes('auth-token') || k === 'supabase.auth.token')) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch (e) {}
    });
    try {
      sessionStorage.removeItem('sb_session_id');
      sessionStorage.removeItem('auth_reload_attempted');
    } catch (e) {}
  } catch (e) {
    // Storage access may be restricted in some iframe sandboxes
  }
}

