import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useAnimationFrame } from "framer-motion";
import {
  X,
  Trophy,
  Sparkles,
  RefreshCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import confetti from "canvas-confetti";
import { WheelSegment } from "../store/db";

interface LuckyWheelProps {
  segments: WheelSegment[];
  onClose: () => void;
  onWin: (prize: string, isPrize?: boolean) => void;
  restaurantName?: string;
  spinDuration?: number;
  autoSpin?: boolean;
}

// Predefined vibrant colors to avoid repeats
const COLOR_PALETTE = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FFA07A",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#82E0AA",
  "#F1948A",
  "#85C1E9",
];

const GLOBAL_SPOKEN_MAP: Record<string, number> = {};

export const LuckyWheel: React.FC<LuckyWheelProps> = ({
  segments = [],
  onClose,
  onWin,
  restaurantName = "SmartBite",
  spinDuration = 3,
  autoSpin = false,
}) => {
  const safeSegments = (Array.isArray(segments) && segments.length > 0 ? segments : [{ text: "Giro Gratis", isPrize: true }])
    .map((seg: any, idx: number) => {
      const rawText = String(seg?.text || seg?.label || seg?.prize_text || seg?.prizeText || `Premio ${idx + 1}`).trim();
      const isRetry = seg?.type === 'retry' || /inténtalo|suerte|gracias|nada|perdiste/i.test(rawText);
      const isPrize = seg?.isPrize !== undefined ? Boolean(seg.isPrize) : !isRetry;
      return {
        text: rawText || "Premio",
        isPrize,
        color: seg?.color || COLOR_PALETTE[idx % COLOR_PALETTE.length],
        type: seg?.type,
        value: seg?.value
      };
    });
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winningSegmentIndex, setWinningSegmentIndex] = useState<number | null>(
    null,
  );
  const [isMuted, setIsMuted] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [hasAutoSpun, setHasAutoSpun] = useState(false);
  const greetedRef = useRef(false);
  const spunRef = useRef(false);
  const autoSpunRef = useRef(false);
  const winSpokenRef = useRef(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const lastSegmentRef = useRef<number>(-1);

  // AI TTS Helper
  const speak = useCallback(
    async (text: string) => {
      if (isMuted) return;

      const now = Date.now();
      if (GLOBAL_SPOKEN_MAP[text] && now - GLOBAL_SPOKEN_MAP[text] < 15000) {
        return; // Prevent repeating same text within 15 seconds
      }
      GLOBAL_SPOKEN_MAP[text] = now;

      try {
        const res = await fetch("/api/ai/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voiceName: "Puck" })
        });
        
        if (!res.ok) throw new Error("TTS Proxy failed");
        const data = await res.json();
        const base64Audio = data.inlineData?.data;
        if (base64Audio) {
          // Remove potential data URI prefix
          const base64Clean = base64Audio.replace(
            /^data:audio\/\w+;base64,/,
            "",
          );

          // Convert base64 to Blob
          const byteCharacters = atob(base64Clean);
          const byteArray = new Uint8Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteArray[i] = byteCharacters.charCodeAt(i);
          }

          const mimeType = data.inlineData?.mimeType || "audio/wav";
          const blob = new Blob([byteArray], { type: mimeType });
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);

          await audio.play();
        }
      } catch (e) {
        console.warn("TTS Error / Audio playback issue, falling back to local TTS:", e);
        // Fallback to browser TTS if Gemini fails or lacks key
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "es-ES";
        window.speechSynthesis.speak(utterance);
      }
    },
    [isMuted],
  );

  // Initial Greeting
  useEffect(() => {
    if (!greetedRef.current) {
      greetedRef.current = true;
      speak(
        `¡A girar la ruleta de ${restaurantName}! ¡Mucha suerte!`,
      );
      setHasGreeted(true);
    }
  }, [restaurantName, speak]);

  // Auto Spin Logic
  useEffect(() => {
    if (autoSpin && !autoSpunRef.current && hasGreeted && !isSpinning) {
      autoSpunRef.current = true;
      const timer = setTimeout(() => {
        spinWheel();
        setHasAutoSpun(true);
      }, 1000); // Shorter wait
      return () => clearTimeout(timer);
    }
  }, [autoSpin, hasGreeted, isSpinning]);

  // Click Sound Effect
  const playClick = useCallback(() => {
    if (isMuted) return;
    if (!audioCtx.current) {
      audioCtx.current = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
    }
    const osc = audioCtx.current.createOscillator();
    const gain = audioCtx.current.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(150, audioCtx.current.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      40,
      audioCtx.current.currentTime + 0.1,
    );

    gain.gain.setValueAtTime(0.1, audioCtx.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      audioCtx.current.currentTime + 0.1,
    );

    osc.connect(gain);
    gain.connect(audioCtx.current.destination);

    osc.start();
    osc.stop(audioCtx.current.currentTime + 0.1);
  }, [isMuted]);

  // Track rotation to play click sounds
  useAnimationFrame((time) => {
    if (!isSpinning) return;

    // Get current rotation from the DOM if possible or estimate
    // Since we use motion for rotation, we can track the current visual rotation
    const segmentAngle = 360 / safeSegments.length;
    const currentRotation = rotation; // This is a bit simplified as rotation is the target
    // In a real scenario, we might want a custom hook for the animated value
  });

  const spinWheel = () => {
    if (isSpinning || spunRef.current) return;
    spunRef.current = true;

    setIsSpinning(true);
    setWinningSegmentIndex(null);

    // Random rotation between 8 and 12 full turns + random extra degree
    const extraDegrees = Math.random() * 360;
    const spins = 8 + Math.floor(Math.random() * 4);
    const totalRotation = rotation + spins * 360 + extraDegrees;

    setRotation(totalRotation);

    // Click sound simulation during spin
    let currentDeg = rotation;
    const step = () => {
      if (!isSpinning) return;
      // This is a rough estimation of click sounds
      // For more precision, we'd use a custom animation loop
    };

    // Calculate winning segment after animation
    // The pointer is at the VERY TOP (90 deg in our SVG coordinate)
    // 0 deg in SVG usually starts at 3 o'clock (right)
    // To have 0 deg at top, we rotate the whole SVG -90deg or adjust math.
    // Let's assume 0 deg is at the TOP for our math.
    const segmentAngle = 360 / safeSegments.length;
    const finalRotationNormalized = totalRotation % 360;

    // The pointer is at top (0 deg).
    // If we rotate wheel X deg clockwise, the segment at top was at -X deg initially.
    let index = Math.floor(
      ((360 - finalRotationNormalized) % 360) / segmentAngle,
    );
    if (index < 0) index += safeSegments.length;

    setTimeout(() => {
      setIsSpinning(false);
      setWinningSegmentIndex(index);
      confetti({
        particleCount: 200,
        spread: 90,
        origin: { y: 0.6 },
        colors: COLOR_PALETTE,
      });

      const prizeName = safeSegments[index].text;
      const isPrize = safeSegments[index].isPrize;
      if (!winSpokenRef.current) {
        winSpokenRef.current = true;
        if (isPrize !== false) {
          speak(`¡Bárbaro! Ganaste: ${prizeName}. ¡Aprovéchalo!`);
        } else {
          speak(`Oh, salió: ${prizeName}. ¡Para la próxima!`);
        }
      }
      onWin(prizeName, isPrize);
    }, spinDuration * 1000);
  };

  const segmentAngle = 360 / safeSegments.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-[#0B0B0B] rounded-[2.5rem] p-6 sm:p-8 w-full max-w-md relative overflow-y-auto max-h-[90vh] text-center shadow-2xl golden-glow-module"
      >
        <div className="absolute top-6 left-6 flex gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full bg-neutral-900 border border-neutral-800 text-on-surface-variant hover:bg-neutral-800"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
        </div>

        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-neutral-900 border border-neutral-800 text-on-surface-variant hover:bg-neutral-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-on-surface mb-2">
            ¡Gira y Gana!
          </h2>
          <p className="text-on-surface-muted font-medium text-sm sm:text-base">
            Tienes un giro gratis en la ruleta de {restaurantName}.
          </p>
        </div>

        <div className="relative aspect-square w-full max-w-[250px] sm:max-w-[300px] mx-auto mb-6 sm:mb-10 bg-[#1A1A1A] rounded-full border-[10px] sm:border-[16px] border-[#1A1A1A] flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          {/* Outer Glowing Lights Ring */}
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 360) / 24;
            const rad = (angle * Math.PI) / 180;
            const radius = 48.5; 
            const x = 50 + radius * Math.cos(rad);
            const y = 50 + radius * Math.sin(rad);
            return (
              <div
                key={i}
                className="absolute rounded-full shadow-[0_0_8px_#FFF3C2] animate-pulse z-10"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: "translate(-50%, -50%)",
                  width: "3.5%",
                  height: "3.5%",
                  backgroundColor: "#FFF2C5",
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            );
          })}

          {/* Pointer Adjusted - Teardrop shape */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[60%] sm:-translate-y-[50%] z-40 drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)]">
            <svg width="40" height="54" viewBox="0 0 40 54" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-auto sm:w-10">
              <path d="M20 53L3.8 28.5C0.5 23.5 0 17 0.5 14C1 10 3.5 5 10 2C15.5 -0.5 24.5 -0.5 30 2C36.5 5 39 10 39.5 14C40 17 39.5 23.5 36.2 28.5L20 53Z" fill="white"/>
              <path d="M20 46L8 27.5C5.8 24 5.3 19.3 5.7 17.2C6 14.3 7.8 10.7 12.3 8.5C16.2 6.5 23.4 6.5 27.5 8.5C32.1 10.6 33.9 14.2 34.2 17.2C34.6 19.3 34.1 23.9 32 27.5L20 46Z" fill="#FACC15"/>
              <circle cx="20" cy="16" r="6" fill="white"/>
            </svg>
          </div>

          {/* The Wheel */}
          <motion.div
            ref={wheelRef}
            animate={{ rotate: rotation }}
            transition={{ duration: spinDuration, ease: [0.15, 0, 0.15, 1] }}
            onUpdate={(latest) => {
              // Play click sound whenever we cross a segment boundary
              const currentRotation =
                typeof latest.rotate === "number" ? latest.rotate : 0;
              const segment = Math.floor(currentRotation / segmentAngle);
              if (segment !== lastSegmentRef.current) {
                playClick();
                lastSegmentRef.current = segment;
              }
            }}
            className="w-full h-full rounded-full border-[8px] sm:border-[12px] border-[#3A3A3A] shadow-inner overflow-hidden relative"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {safeSegments.map((seg, i) => {
                const startAngle = i * segmentAngle;
                const endAngle = (i + 1) * segmentAngle;

                const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

                const largeArcFlag = segmentAngle > 180 ? 1 : 0;

                // Use segment custom color if specified, fallback to palette
                const color = seg.color || COLOR_PALETTE[i % COLOR_PALETTE.length];

                return (
                  <path
                    key={i}
                    d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                    fill={color}
                    stroke="#3A3A3A"
                    strokeWidth="1.5"
                  />
                );
              })}

              {safeSegments.map((seg, i) => {
                const angle = i * segmentAngle + segmentAngle / 2;
                
                let line1 = seg.text || "Premio";
                let line2 = "";
                
                const words = (seg.text || "Premio").split(' ');
                if (words.length > 1) {
                  if (words[0].includes('%') || words[0].includes('$') || words[0].toLowerCase() === 'envío') {
                    line1 = words[0];
                    line2 = words.slice(1).join(' ');
                  } else {
                    const mid = Math.ceil(words.length / 2);
                    line1 = words.slice(0, mid).join(' ');
                    line2 = words.slice(mid).join(' ');
                  }
                }
                
                return (
                  <text
                    key={`text-${i}`}
                    x="72"
                    y="50"
                    transform={`rotate(${angle}, 50, 50)`}
                    fill="white"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                    }}
                  >
                   {line2 ? (
                     <>
                       <tspan x="72" dy="-3" fontSize="5.5" fontWeight="900" letterSpacing="0.02em">{line1}</tspan>
                       <tspan x="72" dy="6" fontSize="2.8" fontWeight="800" fill="#EEEEEE">{line2}</tspan>
                     </>
                   ) : (
                     <tspan x="72" dy="0" fontSize="4.5" fontWeight="900">{line1}</tspan>
                   )}
                  </text>
                );
              })}
            </svg>

            {/* Inner shadows and highlights */}
            <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,0.7)] pointer-events-none" />
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent_60%)] pointer-events-none" />

            {/* Center piece */}
            <div className="absolute inset-0 m-auto w-[24%] h-[24%] rounded-full bg-[#1A1A1A] border-[4px] sm:border-[6px] border-[#3A3A3A] flex flex-col items-center justify-center z-10 shadow-[0_5px_15px_rgba(0,0,0,1)]">
              <div className="text-white font-black italic tracking-tighter text-sm sm:text-lg leading-none" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)"}}>
                ¡GIRÁ
              </div>
              <div className="text-[#FACC15] font-black italic tracking-tighter text-xs sm:text-[14px] leading-none mt-0.5" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)"}}>
                Y GANÁ!
              </div>
            </div>
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {winningSegmentIndex === null ? (
            <motion.button
              key="spin-btn"
              disabled={isSpinning}
              onClick={spinWheel}
              className={`w-full py-4 sm:py-5 rounded-2xl font-black text-base sm:text-lg tracking-widest transition-all ${
                isSpinning
                  ? "bg-neutral-200 text-on-surface-muted cursor-not-allowed"
                  : "bg-primary text-on-surface shadow-[0_8px_0_rgb(180,63,63)] hover:translate-y-[2px] hover:shadow-[0_6px_0_rgb(180,63,63)] active:translate-y-[8px] active:shadow-none"
              }`}
            >
              {isSpinning ? (
                <div className="flex items-center justify-center gap-2">
                  <RefreshCcw className="w-5 h-5 animate-spin" />
                  GIRANDO...
                </div>
              ) : (
                "¡GIRAR AHORA!"
              )}
            </motion.button>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-4 sm:p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl sm:rounded-3xl border-2 border-amber-200 shadow-inner">
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-amber-600 mb-2">
                  {safeSegments[winningSegmentIndex].isPrize !== false
                    ? "¡FELICIDADES!"
                    : "¡MIRA LO QUE SALIÓ!"}
                </p>
                <motion.p
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="text-lg sm:text-xl font-bold text-amber-900 drop-shadow-sm break-words px-2"
                >
                  {safeSegments[winningSegmentIndex].text}
                </motion.p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-4 sm:py-5 rounded-2xl bg-surface-variant text-on-surface font-black tracking-widest hover:bg-surface-base transition-all shadow-xl text-sm sm:text-base flex items-center justify-center"
              >
                {safeSegments[winningSegmentIndex].isPrize !== false
                  ? "RECLAMAR PREMIO"
                  : "CONTINUAR"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.3em] opacity-40">
          <Sparkles className="w-3 h-3" />
          <span>SmartBite Experience</span>
        </div>
      </motion.div>
    </motion.div>
  );
};
