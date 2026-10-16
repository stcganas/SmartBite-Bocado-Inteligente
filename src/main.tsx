import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { SafeBoundary } from './SafeBoundary';
import AppWrapper from './App';
import { clearStaleSupabaseTokens } from './lib/supabase';

window.addEventListener('unhandledrejection', (event) => {
  const errorMsg = event.reason?.message || event.reason?.error_description || String(event.reason) || '';
  if (
    errorMsg.includes('Refresh Token') || 
    errorMsg.includes('refresh_token') ||
    errorMsg.includes('invalid_grant') ||
    errorMsg.includes('session_not_found') ||
    errorMsg.includes('Network request failed') ||
    errorMsg.includes("Lock broken by another request") ||
    errorMsg.includes("steal") ||
    (errorMsg.includes('AbortError') && errorMsg.includes('Lock'))
  ) {
    if (errorMsg.includes('Refresh Token') || errorMsg.includes('refresh_token') || errorMsg.includes('invalid_grant')) {
      clearStaleSupabaseTokens();
    }
    console.warn('Caught unhandled Promise rejection (safe recovery):', errorMsg);
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
  }
});

window.addEventListener('error', (event) => {
  const errorMsg = event.error?.message || event.error?.error_description || event.message || '';
  if (
    errorMsg.includes('Refresh Token') || 
    errorMsg.includes('refresh_token') ||
    errorMsg.includes('invalid_grant') ||
    errorMsg.includes('session_not_found')
  ) {
    clearStaleSupabaseTokens();
    console.warn('Caught unhandled window error (safe recovery):', errorMsg);
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
  }
});

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <SafeBoundary>
        <AppWrapper />
      </SafeBoundary>
    </StrictMode>
  );
}
