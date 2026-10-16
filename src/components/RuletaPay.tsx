import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Trophy,
  Sparkles,
  RefreshCcw,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  Settings,
  Coins,
  ChevronDown,
  Gift,
  CheckCircle,
  HelpCircle,
  ArrowLeft,
  Sliders,
  Store,
  Save
} from "lucide-react";
import confetti from "canvas-confetti";
import { useAuth } from "../contexts/AuthContext";
import { db, WheelSegment } from "../store/db";
import { toast } from "sonner";
import { GoldCoinIcon } from './GoldCoinIcon';

const DEFAULT_SEGMENTS: WheelSegment[] = [
  { text: "10 Monedas de Oro", isPrize: true, color: "#9c27b0", value: "10 Monedas de Oro" },
  { text: "Sigue Participando", isPrize: false, color: "#2B2B2B", value: "Sigue Participando" },
  { text: "Bebida Gratis", isPrize: true, color: "#FF6B6B", value: "Bebida Gratis" },
  { text: "Vuelve a Girar", isPrize: true, color: "#00bcd4", value: "Vuelve a Girar" },
  { text: "20 Monedas de Oro", isPrize: true, color: "#4caf50", value: "20 Monedas de Oro" },
  { text: "Intenta de Nuevo", isPrize: false, color: "#3A3A3A", value: "Intenta de Nuevo" },
  { text: "Hamburguesa Gratis", isPrize: true, color: "#FF9F43", value: "Hamburguesa Gratis" },
  { text: "5 Monedas de Oro", isPrize: true, color: "#ff9800", value: "5 Monedas de Oro" },
];

export const RuletaPay: React.FC<{ onClose?: () => void; adminMode?: boolean }> = ({ onClose, adminMode = false }) => {
  const { user } = useAuth();
  
  // App logic states
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestId, setSelectedRestId] = useState<string>("");
  const [pointsBalance, setPointsBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  // Customization and configuration rules
  const [spinCost, setSpinCost] = useState<number>(1);
  const [segments, setSegments] = useState<WheelSegment[]>(DEFAULT_SEGMENTS);
  const [showSettings, setShowSettings] = useState<boolean>(adminMode);
  
  // Segment editor states
  const [newSegmentText, setNewSegmentText] = useState("");
  const [newSegmentIsPrize, setNewSegmentIsPrize] = useState(true);
  const [newSegmentColor, setNewSegmentColor] = useState("#FF6B6B");

  // Wheel animation states
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winningIndex, setWinningIndex] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showPrizesModal, setShowPrizesModal] = useState(false);
  
  // Sound generation refs
  const audioCtx = useRef<AudioContext | null>(null);
  const lastSegmentRef = useRef<number>(-1);
  const spinDuration = 4; // in seconds

  // Fetch wheel config from DB
  useEffect(() => {
    const fetchGlobalConfig = async () => {
      try {
        const config = await db.getWheelConfig("global_ruleta_pay");
        if (config) {
          if (config.segments && config.segments.length > 0) {
            setSegments(config.segments);
          }
          if (config.minOrderAmount) {
            setSpinCost(config.minOrderAmount);
          }
        }
      } catch (err) {
        console.error("Error loading global ruleta pay config:", err);
      }
    };
    fetchGlobalConfig();
  }, []);

  // Fetch user loyalty points per restaurant
  const loadUserData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get all restaurant loyalty accounts
      const userPointsList = await db.getAllUserLoyaltyPoints(user.id);
      setRestaurants(userPointsList || []);
      
      if (userPointsList && userPointsList.length > 0) {
        // Find if current selection is still valid, else default to first
        const stillValid = userPointsList.some(r => r.restaurantId === selectedRestId);
        if (stillValid) {
          const matched = userPointsList.find(r => r.restaurantId === selectedRestId);
          setPointsBalance(matched?.pointsBalance || 0);
        } else {
          setSelectedRestId(userPointsList[0].restaurantId);
          setPointsBalance(userPointsList[0].pointsBalance || 0);
        }
      } else {
        setSelectedRestId("");
        setPointsBalance(0);
      }
    } catch (e) {
      console.error("Error loading user points for Ruleta Pay", e);
    } finally {
      setLoading(false);
    }
  }, [user, selectedRestId]);

  useEffect(() => {
    loadUserData();
  }, [user]);

  // Update localized state when selected restaurant changes
  const handleRestaurantChange = (id: string) => {
    setSelectedRestId(id);
    const matched = restaurants.find(r => r.restaurantId === id);
    setPointsBalance(matched?.pointsBalance || 0);
    setWinningIndex(null);
  };

  // Sound effect trigger
  const playClickSound = useCallback(() => {
    if (isMuted) return;
    try {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtx.current.state === "suspended") {
        audioCtx.current.resume();
      }
      const osc = audioCtx.current.createOscillator();
      const gain = audioCtx.current.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(300, audioCtx.current.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, audioCtx.current.currentTime + 0.08);

      gain.gain.setValueAtTime(0.08, audioCtx.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(audioCtx.current.destination);

      osc.start();
      osc.stop(audioCtx.current.currentTime + 0.08);
    } catch {
      // Silent error for audio contexts restrictions
    }
  }, [isMuted]);

  // Handle configuration edits
  const handleAddSegment = () => {
    if (!newSegmentText.trim()) {
      toast.warning("El texto de la casilla no puede estar vacío");
      return;
    }
    if (segments.length >= 12) {
      toast.info("La ruleta puede tener un máximo de 12 cuotas");
      return;
    }
    const updated = [
      ...segments,
      { text: newSegmentText.trim(), isPrize: newSegmentIsPrize, color: newSegmentColor, value: newSegmentText.trim() }
    ];
    setSegments(updated);
    setNewSegmentText("");
    // Standard color alternation recommendation
    const nextColors = ["#FF6B6B", "#4ECDC4", "#FF9F43", "#BB8FCE", "#54A0FF", "#1DD1A1"];
    setNewSegmentColor(nextColors[updated.length % nextColors.length]);
    toast.success("Premio agregado a la ruleta");
  };

  const handleDeleteSegment = (index: number) => {
    if (segments.length <= 3) {
      toast.warning("La ruleta debe tener al menos 3 opciones.");
      return;
    }
    const updated = segments.filter((_, i) => i !== index);
    setSegments(updated);
    toast.info("Opción eliminada");
  };

  const handleResetSettings = () => {
    setSegments(DEFAULT_SEGMENTS);
    setSpinCost(100);
    toast.success("Se restauró la configuración original de premios.");
  };

  const handleSaveConfig = async () => {
    setSubmitting(true);
    try {
      await db.saveWheelConfig({
        restaurantId: "global_ruleta_pay",
        isActive: true,
        minOrderAmount: spinCost,
        countdownSeconds: 0,
        spinDuration: 4,
        segments: segments,
      });
      toast.success("🎉 ¡Configuración de Ruleta Pay guardada con éxito en la plataforma!");
    } catch (err: any) {
      console.error("Error saving global wheel config:", err);
      toast.error(err?.message || "Ocurrió un error al guardar la configuración.");
    } finally {
      setSubmitting(false);
    }
  };

  // Main spin handler
  const handleSpinWheel = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión para girar la ruleta.");
      return;
    }
    if (!selectedRestId) {
      toast.warning("Por favor afíliate y acumula monedas de oro por compra para poder girar.");
      return;
    }
    if (pointsBalance < spinCost) {
      toast.error(`Monedas de oro por compra insuficientes. El giro cuesta ${spinCost} monedas de oro, y cuentas con ${pointsBalance} monedas de oro de compra.`);
      return;
    }
    if (isSpinning) return;

    setSubmitting(true);
    try {
      // 1. Spend the points first under the selected restaurant
      const matchedRestaurant = restaurants.find(r => r.restaurantId === selectedRestId);
      const restName = matchedRestaurant?.restaurant?.name || "Restaurante";
      
      await db.spendRestaurantLoyaltyPoints(
        user.id,
        selectedRestId,
        spinCost,
        `Giro de Ruleta Pay en ${restName}`
      );

      // Decrement the local state point balance gracefully
      setPointsBalance(prev => prev - spinCost);
      
      // 2. Set up animation target degrees
      setIsSpinning(true);
      setWinningIndex(null);

      const segmentAngle = 360 / segments.length;
      const extraDegrees = Math.random() * 360;
      // Guarantee 6-9 rotations for cinematic visual tension
      const spins = 6 + Math.floor(Math.random() * 4);
      const targetRotation = rotation + spins * 360 + extraDegrees;

      setRotation(targetRotation);

      // 3. Compute final winning item placement
      // Standard SVG layout helper matching LuckyWheel
      const normalizedDegrees = targetRotation % 360;
      let winnerIndex = Math.floor(
        ((360 - normalizedDegrees) % 360) / segmentAngle
      );
      if (winnerIndex < 0) winnerIndex += segments.length;

      // Track boundaries during continuous rotation to emit ticking sound
      const totalPoints = spins * segments.length;
      let tickCounter = 0;
      const tickInterval = setInterval(() => {
        tickCounter++;
        if (tickCounter <= totalPoints) {
          playClickSound();
        } else {
          clearInterval(tickInterval);
        }
      }, (spinDuration * 1000) / totalPoints);

      setTimeout(async () => {
        clearInterval(tickInterval);
        setIsSpinning(false);
        setWinningIndex(winnerIndex);
        setSubmitting(false);

        const earnedPrize = segments[winnerIndex];
        const prizeText = earnedPrize.text.trim();
        const isVuelveGirar = /vuelve a girar|giro extra|spin again/i.test(prizeText);
        const isPoints = /moneda|monedas|pts|pt/i.test(prizeText);

        if (isVuelveGirar) {
          try {
            // Re-credit the spin cost immediately (effectively giving a retry/free spin option)
            await db.addLoyaltyPoints(
              user.id,
              spinCost,
              `Reembolso por Vuelve a Girar en Ruleta Pay (${restName})`,
              undefined,
              selectedRestId
            );
            toast.success(`🎡 ¡Vuelve a Girar! Se te han devuelto tus ${spinCost} monedas de oro. ¡Prueba otra vez gratis!`);
          } catch (err) {
            console.error("Error refunding points for Vuelve a girar:", err);
          }
        } else if (isPoints) {
          // Play celebration confetti
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: segments.map(s => s.color)
          });

          // Extract digits to determine point count
          const matchNum = prizeText.match(/\d+/);
          const numPointsGain = matchNum ? parseInt(matchNum[0], 10) : 5;

          try {
            // Credited immediately without approval
            await db.addLoyaltyPoints(
              user.id,
              numPointsGain,
              `Premio Ruleta Pay en ${restName}: ${prizeText}`,
              undefined,
              selectedRestId
            );

            // Save in database as instantly delivered
            await db.saveWheelPrize({
              userId: user.id,
              restaurantId: selectedRestId,
              restaurantName: restName,
              prizeText: prizeText,
              isPrize: true,
              status: "delivered"
            });

            toast.success(`🎉 ¡Felicidades! Ganaste ${numPointsGain} monedas de oro. ¡Añadidos a tu cuenta al instante!`);
          } catch (err) {
            console.error("Error saving credited points prize:", err);
            toast.error("Ocurrió un error al procesar tus monedas de oro.");
          }
        } else if (earnedPrize.isPrize) {
          // Play celebration confetti
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: segments.map(s => s.color)
          });

          // It's a non-point article. Save it as "pending" (espera de pago / aprobación del super admin)
          try {
            await db.saveWheelPrize({
              userId: user.id,
              restaurantId: selectedRestId,
              restaurantName: restName,
              prizeText: prizeText,
              isPrize: true,
              status: "pending"
            });
            toast.success(`🎁 ¡Felicidades! Ganaste: "${prizeText}". Tu artículo quedó guardado en tu Baúl de Premios en espera de aprobación por el súper admin.`);
          } catch (err) {
            console.error("Error saving pending article prize", err);
            toast.error("Tuvimos un problema guardando tu premio en el Baúl. Contacta a soporte.");
          }
        } else {
          // Non-prize message segment: do nothing database-wise
          toast.info(`🍀 Resultado: "${prizeText}". ¡Suerte en el próximo giro!`);
        }

        // Refresh user's actual live points in the local array
        loadUserData();

      }, spinDuration * 1000);

    } catch (err: any) {
      console.error("Spin error", err);
      toast.error(err?.message || "Ocurrió un error al procesar tu giro.");
      setSubmitting(false);
    }
  };

  const segmentAngle = 360 / segments.length;

  return (
    <div className="w-full max-w-5xl mx-auto px-0 md:px-4 py-0 md:py-8 font-sans">
      <div className="flex flex-col md:flex-row items-stretch gap-0 md:gap-8 relative min-h-[100svh] md:min-h-0">
        
        {/* LEFT COLUMN: THE PREMIUM INTERACTIVE WHEEL PANEL */}
        <div className="flex-1 bg-[#0B0B0B] rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-center shadow-2xl relative overflow-hidden golden-glow-module">
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 blur-[80px] rounded-full pointer-events-none" />
          
          <div>
            {/* Header section with back / title */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-[#FF8A00]/10 p-2.5 rounded-xl border border-[#FF8A00]/20">
                  <Coins className="w-5 h-5 text-[#FF8A00]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                    Ruleta Pay <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Premium</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Apuesta tus monedas desde tu botín. Ideal para usuarios arriesgados que buscan multiplicar sus ganancias.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2.5 rounded-xl bg-neutral-950/60 text-neutral-400 hover:text-white border border-neutral-800 transition-all cursor-pointer"
                  title="Activar/Silenciar efectos"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                {adminMode && (
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-2.5 rounded-xl text-neutral-400 border transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${showSettings ? "bg-[#FF8A00] text-neutral-950 border-[#FF8A00]" : "bg-neutral-950/60 hover:text-white border-neutral-800"}`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Personalizar</span>
                  </button>
                )}
              </div>
            </div>

            {/* Selector de Restaurante e Info de Balance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 bg-neutral-950/50 p-4 border border-neutral-800/80 rounded-2xl">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-black text-[#FF8A00] block mb-1.5 flex items-center gap-1">
                  <Store className="w-3.5 h-3.5" />
                  Selecciona el Restaurante:
                </label>
                {restaurants.length > 0 ? (
                  <div className="relative">
                    <select
                      value={selectedRestId}
                      onChange={(e) => handleRestaurantChange(e.target.value)}
                      disabled={isSpinning}
                      className="w-full bg-neutral-900 text-white rounded-xl border border-neutral-800 px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-[#FF8A00] transition-colors appearance-none cursor-pointer"
                    >
                      {restaurants.map((item) => (
                        <option key={item.restaurantId} value={item.restaurantId}>
                          {item.restaurant?.name || "Sin Nombre"}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-neutral-400">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-neutral-400 mt-1.5 font-semibold">
                    No tienes monedas de oro por compra aún. ¡Haz un pedido para empezar!
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-center">
                <span className="text-[10px] uppercase tracking-widest font-black text-neutral-400 block mb-1">
                  Monedas de oro válidas disponibles:
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-2xl font-black text-white tracking-tight glow-text-orange font-mono">
                    {pointsBalance}
                  </span>
                  <span className="text-xs font-bold text-[#FF8A00]">monedas de oro</span>
                </div>
                <p className="text-[9px] text-neutral-400 font-medium leading-normal mt-1">
                  ⚠️ Monedas de oro válidas de compra excluyen las recompensas de tareas de gamificación.
                </p>
              </div>
            </div>
            
            {/* WHEEL DRAWING AREA */}
            <div className="relative aspect-square w-full max-w-[350px] sm:max-w-[430px] mx-auto my-6 sm:my-8 bg-[#1A1A1A] rounded-full border-[10px] sm:border-[16px] border-[#1A1A1A] flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
              
              {/* Outer Golden/Orange Glowing Lights Ring */}
              {Array.from({ length: 24 }).map((_, i) => {
                const angle = (i * 360) / 24;
                const rad = (angle * Math.PI) / 180;
                const radius = 48.5; // percentage within the container
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
                      width: "3%",
                      height: "3%",
                      backgroundColor: "#FFF2C5",
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                );
              })}
              
              {/* Pointing Needle marker on top */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[60%] sm:-translate-y-[50%] z-40 drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)]">
                <svg width="40" height="54" viewBox="0 0 40 54" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-auto sm:w-10">
                  <path d="M20 53L3.8 28.5C0.5 23.5 0 17 0.5 14C1 10 3.5 5 10 2C15.5 -0.5 24.5 -0.5 30 2C36.5 5 39 10 39.5 14C40 17 39.5 23.5 36.2 28.5L20 53Z" fill="white"/>
                  <path d="M20 46L8 27.5C5.8 24 5.3 19.3 5.7 17.2C6 14.3 7.8 10.7 12.3 8.5C16.2 6.5 23.4 6.5 27.5 8.5C32.1 10.6 33.9 14.2 34.2 17.2C34.6 19.3 34.1 23.9 32 27.5L20 46Z" fill="#FACC15"/>
                  <circle cx="20" cy="16" r="6" fill="white"/>
                </svg>
              </div>

              {/* The Actual Wheel with dynamic rotation */}
              <motion.div
                animate={{ rotate: rotation }}
                transition={{ duration: spinDuration, ease: [0.15, 0, 0.15, 1] }}
                className="w-full h-full rounded-full border-[8px] sm:border-[12px] border-[#3A3A3A] shadow-inner overflow-hidden relative"
              >
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {segments.map((seg, i) => {
                    const startAngle = i * segmentAngle;
                    const endAngle = (i + 1) * segmentAngle;

                    const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                    const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                    const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                    const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

                    const largeArcFlag = segmentAngle > 180 ? 1 : 0;

                    return (
                      <path
                        key={i}
                        d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                        fill={seg.color}
                        stroke="#3A3A3A"
                        strokeWidth="1.5"
                      />
                    );
                  })}

                  {segments.map((seg, i) => {
                    const angle = i * segmentAngle + segmentAngle / 2;
                    let line1 = seg.text;
                    let line2 = "";
                    
                    const words = seg.text.split(' ');
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
                           <tspan x="72" dy="-3" fontSize="5" fontWeight="900" letterSpacing="0.02em">{line1}</tspan>
                           <tspan x="72" dy="6" fontSize="2.8" fontWeight="800" fill="#EEEEEE">{line2}</tspan>
                         </>
                       ) : (
                         <tspan x="72" dy="0" fontSize="4.5" fontWeight="900">{line1}</tspan>
                       )}
                      </text>
                    );
                  })}
                </svg>

                {/* Inner radial gradient shadow for realism */}
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent_60%)] pointer-events-none" />
                <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,0.7)] pointer-events-none" />

                {/* Center Core Button Frame */}
                <div className="absolute inset-0 m-auto w-[24%] h-[24%] rounded-full bg-[#1A1A1A] border-[4px] sm:border-[6px] border-[#3A3A3A] flex flex-col items-center justify-center z-10 shadow-[0_5px_15px_rgba(0,0,0,1)]">
                  <div className="text-white font-black italic tracking-tighter text-sm sm:text-2xl leading-none" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)"}}>
                    ¡GIRÁ
                  </div>
                  <div className="text-[#FACC15] font-black italic tracking-tighter text-xs sm:text-xl leading-none mt-0.5" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)"}}>
                    Y GANÁ!
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Spinning Indicator or Result Show */}
            <AnimatePresence mode="wait">
              {winningIndex === null ? (
                <button
                  type="button"
                  disabled={isSpinning || submitting}
                  onClick={handleSpinWheel}
                  className={`w-full py-4 rounded-[1.2rem] font-bold text-sm tracking-widest transition-all cursor-pointer ${
                    isSpinning || submitting
                      ? "bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed"
                      : "bg-[#FF8A00] text-[#121212] font-black uppercase shadow-lg shadow-[#FF8A00]/10 hover:shadow-[#FF8A00]/25 active:scale-95"
                  }`}
                >
                  {isSpinning ? "RUEDA EN MOVIMIENTO..." : `PAGAR Y GIRAR (${spinCost} 🪙)`}
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-neutral-950/60 p-4 rounded-2xl border border-neutral-800 text-center space-y-3"
                >
                  <div>
                    <span className="text-[10px] text-[#A0A0A0] font-black uppercase tracking-wider">Premio Obtenido</span>
                    <h4 className={`text-lg font-black mt-1 ${segments[winningIndex].isPrize ? "text-amber-400" : "text-neutral-400"}`}>
                      {segments[winningIndex].text}
                    </h4>
                  </div>
                  <button
                    onClick={() => setWinningIndex(null)}
                    className="w-full py-3.5 mt-2 rounded-[1rem] bg-[#FF8A00] hover:bg-[#E05300] text-[#121212] font-black uppercase text-xs transition-all cursor-pointer shadow-lg shadow-[#FF8A00]/25 active:scale-95 flex items-center justify-center gap-2 tracking-wider"
                  >
                    <RefreshCcw className="w-4 h-4 font-black" />
                    ¡Volver a Girar! (-${spinCost} 🪙)
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* View Prizes Button */}
            {!isSpinning && winningIndex === null && (
              <button
                type="button"
                onClick={() => setShowPrizesModal(true)}
                className="w-full mt-3 py-3 rounded-[1rem] bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Gift className="w-4 h-4" />
                Consultar premios disponibles
              </button>
            )}
            
          </div>
        </div>

        {/* RIGHT COLUMN: REAL-TIME CUSTOMIZATION DRAWER AND HOW-TO */}
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full md:w-[380px] bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-6"
          >
            <div>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-500" />
                  <h4 className="font-bold text-neutral-200">Personalizar Ruleta</h4>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-neutral-500 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-neutral-400 text-xs mt-1 leading-normal">
                Modifica el costo de cada tirada y redefine la lista de recompensas de tu ruleta rápidamente.
              </p>
            </div>

            {/* Configurar Costo */}
            <div className="bg-neutral-950/40 p-4 rounded-xl border border-neutral-800 space-y-3">
              <label className="text-neutral-400 text-xs font-semibold block">Coste de cada Giro (Monedas de Oro, mín. 1 🪙):</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSpinCost(prev => Math.max(1, prev - 1))}
                  className="w-10 h-10 bg-neutral-900 hover:bg-neutral-850 active:scale-95 text-white border border-neutral-800 font-bold transition-all flex items-center justify-center text-lg rounded-lg"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={spinCost}
                  onChange={(e) => {
                    const value = Math.max(1, parseInt(e.target.value) || 1);
                    setSpinCost(value);
                  }}
                  className="flex-1 bg-neutral-900 text-white border border-neutral-800 rounded-lg text-center font-bold text-sm h-10 focus:outline-none focus:border-[#FF8A00]"
                />
                <button
                  type="button"
                  onClick={() => setSpinCost(prev => prev + 1)}
                  className="w-10 h-10 bg-neutral-900 hover:bg-neutral-850 active:scale-95 text-white border border-neutral-800 font-bold transition-all flex items-center justify-center text-lg rounded-lg"
                >
                  +
                </button>
              </div>
              <div className="flex gap-1 overflow-x-auto no-scrollbar pt-1">
                {[1, 5, 10, 50, 100, 250].map((cost) => (
                  <button
                    key={cost}
                    type="button"
                    onClick={() => setSpinCost(cost)}
                    className={`flex-1 min-w-[48px] py-1.5 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                      spinCost === cost
                        ? "bg-[#FF8A00] text-neutral-950 border-[#FF8A00]"
                        : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    {cost === 1 ? "1 🪙" : `${cost}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Listado de Opciones del Círculo */}
            <div className="space-y-3">
              <span className="text-neutral-400 text-xs font-bold block">Tiras actuales ({segments.length}/10):</span>
              <div className="max-h-[160px] overflow-y-auto no-scrollbar border border-neutral-800 rounded-xl bg-neutral-950/30 p-2 space-y-1.5">
                {segments.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-neutral-950/70 py-1.5 px-2.5 rounded-lg border border-neutral-800/80">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-white truncate font-semibold">{item.text}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded uppercase font-black tracking-wider flex-shrink-0" style={{ backgroundColor: item.isPrize ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: item.isPrize ? "#10B981" : "#EF4444" }}>
                        {item.isPrize ? "Pre" : "Msg"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteSegment(idx)}
                      className="text-neutral-500 hover:text-red-400 transition-colors p-1 cursor-pointer"
                      title="Eliminar opción"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Añadir nueva Opción */}
            <div className="bg-neutral-950/40 p-4.5 rounded-xl border border-neutral-800 space-y-3">
              <span className="text-neutral-400 text-xs font-semibold block">Añadir nueva opción:</span>
              <input
                type="text"
                placeholder="Título del premio (ej: Envío Gratis)"
                value={newSegmentText}
                onChange={(e) => setNewSegmentText(e.target.value)}
                className="w-full bg-neutral-900 text-white border border-neutral-800 rounded-lg text-xs px-2.5 py-2 font-semibold focus:outline-none focus:border-[#FF8A00]"
              />
              <div className="flex gap-2 justify-between items-center text-xs text-neutral-400 font-semibold">
                <span>¿Es premio canjeable?</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setNewSegmentIsPrize(true)}
                    className={`px-2 py-1 rounded border leading-none text-[10px] uppercase font-semibold cursor-pointer ${newSegmentIsPrize ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-neutral-900 border-[#FF8A00]/10"}`}
                  >
                    Sí
                  </button>
                  <button
                    onClick={() => setNewSegmentIsPrize(false)}
                    className={`px-2 py-1 rounded border leading-none text-[10px] uppercase font-semibold cursor-pointer ${!newSegmentIsPrize ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-neutral-900 border-[#FF8A00]/10"}`}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Selector de color rápido */}
              <div className="flex gap-1.5 justify-center py-1">
                {["#FF6B6B", "#4ECDC4", "#FF9F43", "#BB8FCE", "#54A0FF", "#1DD1A1", "#FFD2D2", "#A29BFE"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewSegmentColor(c)}
                    className={`w-5.5 h-5.5 rounded-full border-2 transition-all cursor-pointer ${newSegmentColor === c ? "border-white scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              <button
                onClick={handleAddSegment}
                className="w-full bg-neutral-800 hover:bg-neutral-700 hover:text-white text-neutral-300 font-black text-xs py-2 rounded-lg border border-neutral-700 transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Opción</span>
              </button>
            </div>

            {/* Reset */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSaveConfig}
                disabled={submitting}
                className="w-full bg-[#FF8A00] hover:bg-[#FF8A00]/90 text-neutral-950 font-black text-xs py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(255,138,0,0.3)]"
              >
                <Save className="w-4 h-4" />
                <span>{submitting ? "Guardando..." : "Guardar Configuración"}</span>
              </button>
              <button
                onClick={handleResetSettings}
                className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 font-bold text-xs py-2 rounded-xl transition-all cursor-pointer"
              >
                Restaurar Defectos
              </button>
            </div>

          </motion.div>
        )}
      </div>

      {/* MODAL DE PREMIOS DISPONIBLES */}
      <AnimatePresence>
        {showPrizesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[11000] bg-neutral-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowPrizesModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 150 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 150 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-neutral-900 border-t sm:border border-neutral-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setShowPrizesModal(false)}
                className="absolute top-5 right-5 text-neutral-500 hover:text-white transition-colors cursor-pointer bg-neutral-800 p-1.5 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 mb-1">
                <Gift className="w-5 h-5 text-[#FF8A00]" />
                <h3 className="text-lg font-black text-white">Premios de la Ruleta</h3>
              </div>
              <p className="text-xs text-neutral-400 mb-6 font-medium">Estos son los premios que puedes llevarte con este giro, están sujetos a disponibilidad del establecimiento.</p>
              
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-2 mb-2">
                {segments.map((seg, idx) => (
                  <div key={idx} className={`flex items-center gap-3 p-3.5 rounded-xl border ${seg.isPrize ? "border-amber-500/20 bg-amber-500/5" : "border-neutral-800/80 bg-neutral-950/50"}`}>
                    <div className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: seg.color }} />
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <p className={`text-sm font-bold truncate ${seg.isPrize ? "text-amber-400" : "text-neutral-300"}`}>
                        {seg.text}
                      </p>
                      {seg.isPrize && <Sparkles className="w-3.5 h-3.5 text-amber-500/50" />}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
