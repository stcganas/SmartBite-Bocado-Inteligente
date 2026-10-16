import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Loader2, ArrowUpRight, HelpCircle, ShieldAlert, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useOneSignal } from '../hooks/useOneSignal';
import { toast } from 'sonner';

export const PushNotificationBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showBlockedHelp, setShowBlockedHelp] = useState(false);
  const [showIframeWarning, setShowIframeWarning] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const { user, loading } = useAuth();
  const { isInitialized, requestPermission } = useOneSignal();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.self !== window.top) {
      setShowIframeWarning(true);
    }
  }, []);

  useEffect(() => {
    let active = true;
    
    const checkPermission = async () => {
      if (!user || loading || !isInitialized) return;

      const lastShown = localStorage.getItem('push_banner_last_shown');
      const now = Date.now();
      
      if (lastShown) {
        const lastTime = parseInt(lastShown, 10);
        if (!isNaN(lastTime) && (now - lastTime) < (24 * 60 * 60 * 1000)) { // 24 hours cooldown once dismissed
          return;
        }
      }

      try {
        if (typeof window !== 'undefined' && 'Notification' in window && window.Notification) {
          try {
            const permission = window.Notification.permission;
            console.log('Banner Check:', { 
              permission, 
              isInitialized, 
              user: user?.id, 
              loading, 
              hasLastShown: !!lastShown
            });
            
            if (permission === 'default' && active) {
               console.log('Banner: Showing because permission is default');
               setShowBanner(true);
            } else if (permission === 'denied' && active) {
               // If it's already denied, let's keep the option open but not auto-show
               // unless they interact in pages that need notifications.
            }
          } catch (err) {
            console.warn('Banner: Error checking Notification permission:', err);
          }
        }
      } catch (e) {
        console.warn('Banner: Notification check failed safely:', e);
      }
    };

    checkPermission();
    return () => { active = false; };
  }, [user, loading, isInitialized]);

  const handleOpenInNewTab = () => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank');
    }
  };

  const handleAccept = async () => {
    setLoadingAction(true);
    try {
      if (window.Notification?.permission === 'denied') {
        setShowBlockedHelp(true);
        setLoadingAction(false);
        return;
      }

      const granted = await requestPermission();
      
      if (granted || window.Notification?.permission === 'granted') {
         toast.success('¡Notificaciones activadas!');
         setShowBanner(false);
      } else if ((window.Notification?.permission as string) === 'denied' || !granted) {
         setShowBlockedHelp(true);
      }
      
      localStorage.setItem('push_banner_last_shown', Date.now().toString());
    } catch (e) {
      console.error('Error prompting for notifications:', e);
      toast.error('Ocurrió un error al activar notificaciones');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('push_banner_last_shown', Date.now().toString());
    setShowBanner(false);
  };

  // Check if we already have permissions to trigger guide
  const isCurrentlyBlocked = typeof window !== 'undefined' && window.Notification?.permission === 'denied';

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-4 left-4 right-4 z-[9999999] md:left-auto md:right-4 md:w-96"
          >
            <div className="bg-surface-variant text-on-surface p-5 rounded-2xl shadow-2xl border border-neutral-800/80 flex items-start gap-4 backdrop-blur-md">
              <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-orange-600/30">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                  ¡Mantente al día! 🔔
                </h4>
                {showIframeWarning ? (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 p-3 rounded-xl mt-2 text-xs font-medium space-y-2">
                    <p>
                      ⚠️ Estás visualizando la app dentro de una vista rápida bloqueada. Los navegadores inhabilitan el registro de alertas web push en previsualizaciones incrustadas.
                    </p>
                    <button
                      onClick={handleOpenInNewTab}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg text-[11px] font-black uppercase tracking-wider transition-all shadow-md shadow-yellow-500/20"
                    >
                      Abrir en pestaña nueva <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs text-on-surface-muted mt-1 leading-relaxed">
                      Activa las alertas web push para enterarte de cada cambio en tus ordenes, estado de la Ruleta y promos exclusivas.
                    </p>
                    {isCurrentlyBlocked && (
                      <p className="text-[11px] text-red-400 font-bold mt-1 inline-flex items-center gap-1">
                        ⚠️ Actualmente denegado por el navegador
                      </p>
                    )}
                  </div>
                )}
                
                {!showIframeWarning && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleAccept}
                      disabled={loadingAction}
                      className="bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20"
                    >
                      {loadingAction && <Loader2 className="w-3 h-3 animate-spin" />}
                      {loadingAction ? 'Activando...' : isCurrentlyBlocked ? 'Ver cómo activar 🔓' : 'Activar alertas push'}
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest px-3 py-2.5 hover:text-white transition-colors"
                    >
                      Quizás luego
                    </button>
                  </div>
                )}
              </div>
              <button 
                onClick={handleDismiss}
                className="text-on-surface-variant hover:text-white transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guide Diagnostic Modal when Permissions are currently Blocked */}
      <AnimatePresence>
        {showBlockedHelp && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-md w-full relative space-y-6 shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/35 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">Notificaciones Bloqueadas</h3>
                  <p className="text-xs text-neutral-400 font-medium">Habilítalas en 3 simples pasos</p>
                </div>
                <button
                  onClick={() => setShowBlockedHelp(false)}
                  className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Has bloqueado previamente las notificaciones de este sitio en la configuración del navegador. Sigue estos pasos para habilitarlas:
                </p>

                <div className="space-y-3.5">
                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-orange-600/10 border border-orange-600 text-orange-500 text-xs font-black flex items-center justify-center shrink-0">
                      1
                    </span>
                    <p className="text-xs text-neutral-200 leading-relaxed">
                      Haz clic en el <strong>icono del candado</strong> o <strong>controles de sitio (ajustes)</strong> a la izquierda de la dirección URL en la barra de arriba del navegador.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-orange-600/10 border border-orange-600 text-orange-500 text-xs font-black flex items-center justify-center shrink-0">
                      2
                    </span>
                    <p className="text-xs text-neutral-200 leading-relaxed">
                      Busca la opción de <strong>Notificaciones</strong> y cambia el estado de <span className="text-red-400 font-bold">Bloqueado</span> a <span className="text-emerald-400 font-bold">Permitir (Allow)</span>.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-orange-600/10 border border-orange-600 text-orange-500 text-xs font-black flex items-center justify-center shrink-0">
                      3
                    </span>
                    <p className="text-xs text-neutral-200 leading-relaxed">
                      <strong>Vuelve a cargar</strong> esta pestaña para activar las alertas push al instante.
                    </p>
                  </div>
                </div>

                {showIframeWarning && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 p-3 rounded-xl mt-2 text-xs font-medium space-y-1">
                    <p className="font-bold">⚠️ Recuerda:</p>
                    <p className="text-[11px] leading-relaxed">
                      Estás en papelera o ventana incrustada de previsualización. Las notificaciones reales NO se guardarán si permaneces dentro del frame.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowBlockedHelp(false)}
                  className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                >
                  Entendido, cerrar
                </button>
                {showIframeWarning && (
                  <button
                    onClick={handleOpenInNewTab}
                    className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                  >
                    Abrir nueva pestaña <ArrowUpRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
