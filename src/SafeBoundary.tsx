import React, { Component, ReactNode } from "react";
import { clearStaleSupabaseTokens } from "./lib/supabase";

export class SafeBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: any}> {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error: any) {
    const msg = error?.message || String(error);
    if (
      msg.includes('Refresh Token') || 
      msg.includes('refresh_token') || 
      msg.includes('invalid_grant') ||
      msg.includes('session_not_found')
    ) {
      clearStaleSupabaseTokens();
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }
  componentDidCatch(error: any) {
    const msg = error?.message || String(error);
    
    // Explicit recovery for common Auth/Network issues that crash the app
    if (
      msg.includes('Refresh Token') || 
      msg.includes('refresh_token') || 
      msg.includes('invalid_grant') ||
      msg.includes('session_not_found')
    ) {
      console.warn("SafeBoundary: Gracefully recovered from stale session token.");
      clearStaleSupabaseTokens();
      this.setState({ hasError: false, error: null });
      return;
    }

    console.error("Uncaught error:", error);
  }

  handleClearAndReload = () => {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch(e) {}
    window.location.href = '/';
  };
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-neutral-950 flex flex-col items-center justify-center p-8 text-center z-[999999]">
          <div className="w-20 h-20 bg-orange-600/10 rounded-full flex items-center justify-center mb-6">
            <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Algo no salió como esperábamos</h1>
          <p className="text-neutral-400 max-w-sm mb-8">
            La aplicación ha encontrado un problema técnico inesperado. No te preocupes, tus datos no se han perdido.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20 active:scale-95"
            >
              Recargar Aplicación
            </button>
            <button 
              onClick={this.handleClearAndReload}
              className="px-8 py-3 bg-neutral-800 text-white rounded-xl font-bold hover:bg-neutral-700 transition-all border border-neutral-700 active:scale-95"
            >
              Cerrar Sesión y Volver al Inicio
            </button>
          </div>
          
          <details className="mt-12 text-left w-full max-w-2xl bg-black/40 rounded-xl border border-neutral-800 p-4">
             <summary className="text-xs text-neutral-500 cursor-pointer hover:text-neutral-300 transition-colors uppercase tracking-widest font-bold">
               Ver detalles técnicos
             </summary>
             <div className="mt-4">
               <pre className="text-[10px] text-red-400 overflow-auto max-h-48 leading-relaxed">
                 {String(this.state.error?.message)}
                 {"\n\n"}
                 {String(this.state.error?.stack)}
               </pre>
             </div>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}
