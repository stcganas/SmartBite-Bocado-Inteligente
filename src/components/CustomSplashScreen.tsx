import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlatformSettings } from '../store/db';

export const CustomSplashScreen = ({
  onComplete,
  platformSettings,
}: {
  onComplete: () => void;
  platformSettings: PlatformSettings | null;
}) => {
  const [slideIndex, setSlideIndex] = React.useState(0);
  const splash = platformSettings?.splashSettings;

  React.useEffect(() => {
    // Determine minLoadTime either from custom settings duration or fallback
    const minLoadTime = splash?.duration || 300;

    let slideInterval: NodeJS.Timeout | null = null;

    if (splash?.type === "slideshow" && splash.slides.length > 1) {
      slideInterval = setInterval(() => {
        setSlideIndex((prev) => (prev + 1) % splash.slides.length);
      }, (splash.duration / splash.slides.length));
    }

    const timer = setTimeout(() => {
      if (slideInterval) clearInterval(slideInterval);
      onComplete();
    }, minLoadTime);

    return () => {
      if (slideInterval) clearInterval(slideInterval);
      clearTimeout(timer);
    };
  }, [onComplete, splash]);

  // If no splash settings yet or splash is disabled in settings, just finish immediately
  // But wait, the previous code always showed splash. We should show it by default but respect disabled.
  React.useEffect(() => {
    if (splash && splash.enabled === false) {
      onComplete();
    }
  }, [splash, onComplete]);

  if (splash && splash.enabled === false) return null;

  // Use custom colors/styles if provided, otherwise defaults
  const bgColor = splash?.backgroundColor || "#0a0a0a";
  const textColor = splash?.globalTextColor || "#ffffff";
  const fontFamily = splash?.globalTypography || "sans-serif";
  const currentSlideUrl = splash?.slides[slideIndex]?.url || platformSettings?.appLogo || "";
  
  const getYoutubeEmbedUrl = (url: string) => {
    let videoId = '';
    try {
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      } else if (url.includes('youtube.com/watch')) {
        videoId = new URL(url).searchParams.get('v') || '';
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}` : url;
    } catch {
      return url;
    }
  };
  
  const AnimatedText = ({ config, className }: { config: any, className?: string }) => {
    if (!config || !config.text) return null;
    const style = { color: config.color || textColor };
    const baseClass = `${className || ''} text-${config.size || '3xl'} font-${config.weight || 'bold'}`;
    
    switch (config.effect) {
      case 'typing':
        return (
          <motion.div initial="hidden" animate="show" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }} className={`flex space-x-1 justify-center ${baseClass}`} style={style}>
            {config.text.split("").map((char: string, i: number) => (
              <motion.span key={i} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>{char === " " ? "\u00A0" : char}</motion.span>
            ))}
          </motion.div>
        );
      case 'bounce':
        return <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: [0, -20, 0], opacity: 1 }} transition={{ delay: 0.2, type: "spring" }} className={baseClass} style={style}>{config.text}</motion.div>;
      case 'slideUp':
        return <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className={baseClass} style={style}>{config.text}</motion.div>;
      case 'slideDown':
        return <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className={baseClass} style={style}>{config.text}</motion.div>;
      case 'slideLeft':
        return <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className={baseClass} style={style}>{config.text}</motion.div>;
      case 'slideRight':
        return <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className={baseClass} style={style}>{config.text}</motion.div>;
      case 'fade':
        return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }} className={baseClass} style={style}>{config.text}</motion.div>;
      case 'zoom':
        return <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }} className={baseClass} style={style}>{config.text}</motion.div>;
      case 'flip':
        return <motion.div initial={{ rotateX: 90, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} transition={{ duration: 0.8 }} className={baseClass} style={style}>{config.text}</motion.div>;
      default:
        return <div className={baseClass} style={style}>{config.text}</div>;
    }
  };

  const getTextsByPosition = (pos: string) => {
     const texts = [];
     if (splash?.title?.position === pos) texts.push(splash.title);
     if (splash?.subtitle?.position === pos) texts.push(splash.subtitle);
     if (splash?.floatingTexts) {
        texts.push(...splash.floatingTexts.filter(t => t.position === pos));
     }
     return texts;
  };

  return (
    <div 
      className="fixed inset-0 flex flex-col items-center justify-center z-[99999] overflow-hidden"
      style={{ backgroundColor: bgColor, fontFamily }}
    >
      {/* Audio Element */}
      {splash?.audioUrl && !splash.audioUrl.includes('youtube') && !splash.audioUrl.includes('youtu.be') && (
        <audio 
          autoPlay 
          loop 
          src={splash.audioUrl}
          onError={(e) => {
            console.warn("App: Splash audio failed to load gracefully.");
            e.currentTarget.removeAttribute('src');
            e.currentTarget.load();
          }}
        />
      )}

      {/* Main Content Container */}
      <div className="relative flex flex-col items-center max-w-sm px-6 text-center w-full h-full justify-center py-10">
         
         <div className="flex-1 w-full flex flex-col items-center justify-end pb-8 gap-2">
            {getTextsByPosition('top').map(t => <AnimatedText key={t.id} config={t} />)}
         </div>
         
         <div className="w-full flex flex-col items-center justify-center gap-2">
             {getTextsByPosition('middle').map(t => <AnimatedText key={t.id} config={t} />)}
             
             {/* Media (Image or Video) */}
             {splash?.type === "video" && currentSlideUrl ? (
                 currentSlideUrl.includes('youtube.com') || currentSlideUrl.includes('youtu.be') ? (
                   <iframe 
                     src={getYoutubeEmbedUrl(currentSlideUrl)} 
                     className="w-full aspect-video rounded-[2rem] shadow-2xl my-6 border-0"
                     allow="autoplay; encrypted-media"
                     allowFullScreen
                   />
                 ) : (
                   <video 
                     src={currentSlideUrl} 
                     autoPlay 
                     loop 
                     muted={!splash.audioUrl} 
                     playsInline
                     className="w-full max-w-[16rem] h-auto rounded-[2rem] object-cover shadow-2xl my-6"
                      onError={(e) => {
                        console.warn("App: Splash video failed to load gracefully.");
                        e.currentTarget.removeAttribute('src');
                        e.currentTarget.load();
                      }}
                   />
                 )
             ) : (
               <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlideUrl}
                    initial={{ opacity: 0, scale: splash?.imageEffect === "zoom" ? 0.8 : 1 }}
                    animate={{ opacity: 1, scale: splash?.imageEffect === "zoom" ? 1.1 : 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: splash?.imageEffect === "zoom" ? 4 : 0.5, ease: "easeInOut" }}
                    className={`flex items-center justify-center relative ${splash?.imageEffect === 'pan' ? 'animate-[pan_10s_ease-in-out_infinite_alternate]' : ''}`}
                    style={{ 
                      width: `${splash?.imageScale ?? 50}vw`, 
                      height: `${splash?.imageScale ?? 50}vh`,
                      maxHeight: '100vh',
                      maxWidth: '100vw'
                    }}
                  >
                    <img
                      src={currentSlideUrl}
                      alt="Splash Media"
                      className={`w-full h-full ${splash?.imageScale === 100 ? 'object-cover' : 'object-contain'}`}
                      referrerPolicy="no-referrer"
                    />
                  </motion.div>
               </AnimatePresence>
             )}
             
             {getTextsByPosition('image-caption').map(t => <AnimatedText key={t.id} config={t} />)}
         </div>

         <div className="flex-1 w-full flex flex-col items-center justify-start pt-8 gap-2">
             {getTextsByPosition('bottom').map(t => <AnimatedText key={t.id} config={t} />)}
         </div>
         
         <div className="absolute bottom-6 w-full flex flex-col items-center justify-center gap-2">
             {getTextsByPosition('footer').map(t => <AnimatedText key={t.id} config={t} />)}
         </div>
         
         {!splash?.title?.text && (
            <div className="w-48 h-1 bg-surface-base rounded-full overflow-hidden absolute bottom-12 opacity-30">
              <motion.div
                initial={{ left: "-100%" }}
                animate={{ left: "100%" }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="absolute w-2/3 h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
              />
            </div>
         )}
      </div>
    </div>
  );
};
