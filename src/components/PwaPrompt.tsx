import { useState, useEffect } from 'react';

export default function PwaPrompt() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Detectar si ya está instalada o en modo standalone
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
      return;
    }

    // Detectar iOS / Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // Mostrar popup en iOS tras 2 segundos para incentivar la descarga
      setTimeout(() => setShowPrompt(true), 2000);
    }

    // Verificar si ya se capturó el evento precozmente en index.html
    const alreadyCaptured = (window as any).deferredPrompt;
    if (alreadyCaptured) {
      console.log('Using early captured prompt');
      setInstallPrompt(alreadyCaptured);
      setShowPrompt(true);
    }

    // Interceptar prompt de Chrome/Android/Desktop
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowPrompt(true);
    };

    const handleEarlyCaptured = () => {
      const e = (window as any).deferredPrompt;
      if (e) {
        setInstallPrompt(e);
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-captured', handleEarlyCaptured);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-captured', handleEarlyCaptured);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setInstallPrompt(null);
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-emerald-900 text-white z-[100] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      <div className="mb-3 sm:mb-0 text-sm flex items-center gap-3">
        <div className="bg-amber-500 text-emerald-950 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
          <img src="/logo-192.png" alt="SmartBite Logo" className="w-8 h-8 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </div>
        <div>
          <p className="font-bold text-amber-400 text-base">Instala SmartBite App</p>
          {isIOS ? (
            <p className="text-emerald-100 text-xs mt-1">Toca el ícono de <b className="text-white">Compartir</b> y selecciona <b className="text-white">Agregar a inicio</b></p>
          ) : (
            <p className="text-emerald-100 text-xs mt-1">Accede más rápido y fácil a todas nuestras funciones de pedidos.</p>
          )}
        </div>
      </div>
      
      <div className="flex gap-2 w-full sm:w-auto shrink-0">
        {!isIOS && (
          <button onClick={handleInstallClick} className="flex-1 sm:flex-none bg-amber-500 text-emerald-950 px-6 py-2 rounded-lg font-bold hover:bg-amber-400 active:scale-95 transition-all outline-none">
            Instalar
          </button>
        )}
        <button onClick={() => setShowPrompt(false)} className="flex-1 sm:flex-none bg-emerald-800 text-white border border-emerald-700 px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 active:scale-95 transition-all outline-none">
          Cerrar
        </button>
      </div>
    </div>
  );
}
