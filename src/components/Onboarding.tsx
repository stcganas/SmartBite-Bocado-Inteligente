import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronRight, ChevronLeft, Volume2, VolumeX } from "lucide-react";
import { PlatformSettings, OnboardingScreen } from "../store/db";

interface OnboardingProps {
  onComplete?: () => void;
  platformSettings?: PlatformSettings | null;
  standaloneFlowId?: string; // If embedded somewhere else
}

export const Onboarding: React.FC<OnboardingProps> = ({
  onComplete,
  platformSettings,
  standaloneFlowId,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const navigate = useNavigate();
  const { flowId: routeFlowId } = useParams();
  
  const targetFlowId = standaloneFlowId || routeFlowId || 'user';
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Determine steps
  const [steps] = useState(() => {
    let rawScreens: OnboardingScreen[] = [];
    let isActive = true;
    
    if (platformSettings?.onboardingSettings) {
       const settings = platformSettings.onboardingSettings;
       if (targetFlowId === 'user') {
          isActive = settings.isUserActive !== false;
          if (isActive) rawScreens = settings.user || [];
       }
       else if (targetFlowId === 'restaurant') {
          isActive = settings.isRestaurantActive !== false;
          if (isActive) rawScreens = settings.restaurant || [];
       }
       else if (targetFlowId === 'driver') {
          isActive = settings.isDriverActive !== false;
          if (isActive) rawScreens = settings.driver || [];
       }
       else {
          const customFlow = settings.customFlows?.find(f => f.id === targetFlowId);
          if (customFlow) {
              isActive = customFlow.isActive !== false;
              if (isActive) rawScreens = customFlow.screens;
          }
       }
    }

    if (rawScreens.length === 0 && targetFlowId === 'user' && isActive) {
      rawScreens = [{
        id: "default-1", title: "Bienvenido al Menú Digital", description: "La forma más inteligente de pedir tu comida favorita.",
        image: "",
        mediaType: 'image',
        bgFrom: "#fb923c", bgTo: "#f59e0b", status: "active" as const,
        textColor: '#1f2937', typography: 'sans-serif'
      }];
    }

    const now = new Date();
    return rawScreens.filter((s) => {
      if (s.status === "inactive" || s.status === "paused") return false;
      if (s.publishDate && new Date(s.publishDate) > now) return false;
      if (s.expiryDate && new Date(s.expiryDate) < now) return false;
      return true;
    });
  });

  useEffect(() => {
    if (steps.length === 0 && onComplete) {
      onComplete();
    }
  }, [steps, onComplete]);

  // Audio Playback
  useEffect(() => {
    if (!steps[currentStep]) return;
    const currentAudioUrl = steps[currentStep].audioUrl;
    let isMounted = true;
    
    const playAudio = async () => {
      if (currentAudioUrl && !isMuted && !currentAudioUrl.includes('youtube') && !currentAudioUrl.includes('youtu.be')) {
        if (audioRef.current) {
           audioRef.current.src = currentAudioUrl;
           try {
             await audioRef.current.play();
           } catch (e) {
             console.log("Onboarding play failed/interrupted:", e);
           }
        } else {
           const audio = new Audio(currentAudioUrl);
           audio.loop = true;
           audioRef.current = audio;
           try {
             await audio.play();
           } catch (e) {
             console.log("Onboarding play failed/interrupted:", e);
           }
        }
      } else {
         if (audioRef.current) {
            audioRef.current.pause();
         }
      }
    };

    playAudio();

    return () => {
      isMounted = false;
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [currentStep, steps, isMuted]);

  if (steps.length === 0) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
       handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    if (audioRef.current) audioRef.current.pause();
    if (onComplete) {
       onComplete();
    } else if (routeFlowId) {
       navigate('/');
    }
  };

  const currentScreen = steps[currentStep];

  if (!currentScreen) return null;

  const getYoutubeEmbedUrl = (url?: string) => {
    if (!url) return '';
    let videoId = '';
    try {
      if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
      else if (url.includes('youtube.com/watch')) videoId = new URL(url).searchParams.get('v') || '';
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${isMuted?1:0}&loop=1&playlist=${videoId}&controls=0` : url;
    } catch { return url; }
  };

  const getTextVariants = (effect: string = 'none'): any => {
    switch (effect) {
      case 'fade': return { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 1 } } };
      case 'bounce': return { initial: { y: -50, opacity: 0 }, animate: { y: 0, opacity: 1, transition: { type: 'spring', bounce: 0.5 } } };
      case 'slideUp': return { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1, transition: { duration: 0.6 } } };
      case 'zoom': return { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1, transition: { duration: 0.6 } } };
      default: return { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
    }
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  return (
    <div className={`fixed inset-0 flex flex-col z-[100000] overflow-hidden ${currentScreen.layout === 'full' ? 'bg-black text-white' : 'bg-white text-neutral-900'}`} style={{ fontFamily: currentScreen.typography || 'sans-serif' }}>
      
      {/* Top Controls */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
        {currentScreen.audioUrl && (
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5"/> : <Volume2 className="w-5 h-5"/>}
          </button>
        )}
        <button
          onClick={handleFinish}
          className="px-4 py-2 text-on-surface-muted font-bold text-sm transition-colors rounded-full hover:text-neutral-600"
        >
          Saltar
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
           key={currentStep}
           initial={{ opacity: 0, x: 50 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: -50 }}
           transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
           className="flex-1 flex flex-col h-full relative"
           drag="x"
           dragConstraints={{ left: 0, right: 0 }}
           dragElastic={0.2}
           onDragEnd={(e, { offset, velocity }) => {
             const swipe = swipePower(offset.x, velocity.x);

             if (swipe < -swipeConfidenceThreshold) {
               handleNext();
             } else if (swipe > swipeConfidenceThreshold) {
               handlePrev();
             }
           }}
        >
          {/* Subtle background blob for the visual area */}
          <div className="absolute inset-0 opacity-[0.05]" style={{ background: `linear-gradient(to bottom right, ${currentScreen.bgFrom}, ${currentScreen.bgTo})` }} />

          {/* Top Section (Visual) */}
          <div className={currentScreen.layout === 'full' ? "absolute inset-0 w-full h-full z-10 p-0 m-0" : "flex-[0_0_70%] max-h-[70vh] relative flex items-center justify-center p-8 mt-10"}>
             {currentScreen.mediaType === 'video' ? (
                <motion.iframe
                   initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }}
                   src={getYoutubeEmbedUrl(currentScreen.image)}
                   className={currentScreen.layout === 'full' ? "w-full h-full object-cover relative z-10 bg-black pointer-events-auto scale-[1.3]" : "w-full h-full max-w-2xl object-cover rounded-3xl shadow-lg relative z-10 bg-black pointer-events-auto"}
                   allow="autoplay; encrypted-media"
                />
              ) : (
                <motion.img
                  initial={{ scale: currentScreen.imageEffect === 'zoom' ? 0.9 : 0.95, opacity: 0 }}
                  animate={{ scale: currentScreen.imageEffect === 'zoom' ? 1.05 : 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: currentScreen.imageEffect === 'zoom' ? 5 : 0.6 }}
                  src={currentScreen.image}
                  className={currentScreen.layout === 'full' ? "w-full h-full object-cover relative z-10 pointer-events-none select-none animate-fade-in" : "w-full h-full object-contain max-w-md relative z-10 origin-center mix-blend-multiply pointer-events-none select-none"}
                  draggable={false}
                />
              )}
          </div>

          {/* Texts Section */}
<div className={currentScreen.layout === 'full' ? "absolute bottom-0 inset-x-0 bg-transparent flex flex-col items-center px-8 pb-8 pt-0 z-30" : "flex-[0_0_30%] max-h-[30vh] flex flex-col items-center justify-between px-8 pt-4 pb-6 bg-white z-10 border-t border-neutral-100"}>
              {currentScreen.layout !== 'full' ? (
                 <div className="text-center space-y-4 max-w-sm mx-auto flex-1">
                    <motion.h2
                      {...getTextVariants(currentScreen.titleEffect)}
                      className="text-2xl sm:text-3xl font-black tracking-tight"
                      style={{ color: currentScreen.textColor && currentScreen.textColor !== '#ffffff' ? currentScreen.textColor : '#171717' }} 
                    >
                      {currentScreen.title}
                    </motion.h2>
                    <motion.p
                      {...getTextVariants(currentScreen.descriptionEffect)}
                      className="text-on-surface-variant text-sm sm:text-base leading-relaxed font-medium"
                    >
                      {currentScreen.description}
                    </motion.p>
                 </div>
              ) : (
                 <div className="h-0 opacity-0 pointer-events-none" />
              )}

             {/* Bottom Nav */}
             <div className="w-full max-w-md flex items-center justify-between pb-4 mt-8">
                <div className="flex items-center gap-2">
                  {steps.map((s, idx) => {
                    const isActive = idx === currentStep;
                    return (
                      <div
                        key={idx}
                        className={`h-2 rounded-full transition-all duration-300 ${isActive ? "w-6" : currentScreen.layout === 'full' ? "w-2 bg-white/30" : "w-2 bg-neutral-200"}`}
                        style={{ background: isActive ? `linear-gradient(to right, ${currentScreen.bgFrom}, ${currentScreen.bgTo})` : undefined }}
                      />
                    );
                  })}
                </div>

                {currentStep < steps.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-xl active:scale-95 text-on-surface"
                    style={currentScreen.layout === 'full' ? { backgroundColor: '#ffffff', color: '#000000' } : { background: `linear-gradient(to bottom right, ${currentScreen.bgFrom}, ${currentScreen.bgTo})` }}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                ) : (
                  <button
                    onClick={handleFinish}
                    className="px-8 py-3.5 rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-xl active:scale-95 text-on-surface font-bold"
                    style={currentScreen.layout === 'full' ? { backgroundColor: '#ffffff', color: '#000000' } : { background: `linear-gradient(to right, ${currentScreen.bgFrom}, ${currentScreen.bgTo})` }}
                  >
                    Comenzar
                  </button>
                )}
             </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
