import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, GripVertical } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { db } from '../store/db';
import { motion } from 'framer-motion';

export const BackgroundMusic: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [hidePlayer, setHidePlayer] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasManuallyPaused = useRef<boolean>(false);
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin') || 
                       location.pathname.startsWith('/platform') ||
                       location.pathname.startsWith('/driver');

  // Load configuration
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await db.getPlatformSettings();
        const url = settings?.backgroundMusicUrl || null;
        setMusicUrl(url);
        setHidePlayer(!!settings?.hideMusicPlayer);
      } catch (e) {
        console.error("Error loading music settings:", e);
      }
    };

    loadSettings();

    window.addEventListener("background-music-update", loadSettings);
    return () => {
      window.removeEventListener("background-music-update", loadSettings);
    };
  }, []);

  // Soft pause/play on admin route navigation
  useEffect(() => {
    if (audioRef.current) {
      if (isAdminRoute) {
        // Pause silently if entering admin routes
        audioRef.current.pause();
        setIsPlaying(false);
      } else if (musicUrl && !hasManuallyPaused.current && !isPlaying) {
        // Try to resume when coming back to client-facing pages
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          // Ignore autoplay blocks on route changes
        });
      }
    }
  }, [isAdminRoute, musicUrl, isPlaying]);

  // Handle first interaction auto-play
  useEffect(() => {
    if (!musicUrl || isPlaying || isAdminRoute || hasManuallyPaused.current) return;

    const startAudioOnInteraction = async () => {
      if (audioRef.current && !isPlaying && !hasManuallyPaused.current && !isAdminRoute) {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
          removeListeners();
        } catch (e) {
          // Playback failed or was interrupted, ignore
        }
      }
    };

    const removeListeners = () => {
      document.removeEventListener('click', startAudioOnInteraction);
      document.removeEventListener('keydown', startAudioOnInteraction);
      document.removeEventListener('touchstart', startAudioOnInteraction);
    };

    document.addEventListener('click', startAudioOnInteraction);
    document.addEventListener('keydown', startAudioOnInteraction);
    document.addEventListener('touchstart', startAudioOnInteraction);

    return () => {
      removeListeners();
    };
  }, [musicUrl, isPlaying, isAdminRoute]);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      hasManuallyPaused.current = true;
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        hasManuallyPaused.current = false;
      } catch (e) {
        console.error("BackgroundMusic: Playback failed:", e);
      }
    }
  };

  // We render the <audio> element only when a valid musicUrl exists to avoid "No supported sources" state.
  return (
    <>
      {/* Hidden background audio element - Only rendered when we have a valid source */}
      {musicUrl && (
        <audio
          ref={audioRef}
          src={musicUrl}
          loop
          preload="auto"
          id="bg-music-audio-element"
        />
      )}

      {/* Floating control widget (Only visible on client-facing routes, musicUrl is set and is not hidden) */}
      {!isAdminRoute && musicUrl && !hidePlayer && (
        <motion.div 
          drag
          dragMomentum={false}
          dragElastic={0.1}
          dragConstraints={{ left: -1000, right: 0, top: -1000, bottom: 0 }}
          className="fixed bottom-[100px] right-6 z-[9999] flex items-center gap-3 select-none pointer-events-auto p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.4)] rounded-full bg-neutral-900/80 backdrop-blur-xl border border-white/10"
          id="bg-music-player-container"
        >
          {/* Drag Handle */}
          <div className="cursor-grab active:cursor-grabbing text-white/50 hover:text-white p-2 sm:p-1 flex items-center justify-center transition-colors">
            <GripVertical className="w-5 h-5 pointer-events-none" />
          </div>

          {isPlaying && (
            <div 
              className="bg-black/60 border border-neutral-700/50 py-2 px-3.5 rounded-2xl flex items-center gap-2.5 shadow-inner"
              id="bg-music-waves"
            >
              <div className="flex gap-0.5 items-end h-3 w-5 pointer-events-none">
                {[1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className="w-1 bg-orange-500 rounded-full animate-pulse"
                    style={{
                      height: i === 1 ? '10px' : i === 2 ? '6px' : i === 3 ? '12px' : '4px',
                      animationDuration: i === 1 ? '0.6s' : i === 2 ? '0.8s' : i === 3 ? '0.5s' : '0.7s',
                      animationIterationCount: 'infinite'
                    }}
                  />
                ))}
              </div>
              <span className="text-[10px] font-black text-neutral-200 uppercase tracking-widest leading-none font-sans pointer-events-none">
                Música
              </span>
            </div>
          )}

          <button
            id="bg-music-toggle-btn"
            onClick={togglePlay}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
              isPlaying 
                ? 'bg-orange-500 text-white hover:bg-orange-600 hover:scale-105 active:scale-95' 
                : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 hover:scale-105 active:scale-95 border border-neutral-800'
            }`}
            title={isPlaying ? "Silenciar" : "Escuchar música"}
            type="button"
          >
            {isPlaying ? (
              <Volume2 className="w-5 h-5 pointer-events-none" />
            ) : (
              <VolumeX className="w-5 h-5 pointer-events-none" />
            )}
          </button>
        </motion.div>
      )}
    </>
  );
};
