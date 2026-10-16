import { formatCurrency } from "../utils/format";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Mic,
  Send,
  X,
  Volume2,
  Bot,
  MicOff,
  Loader2,
  Sparkles,
  Smile,
  Star,
  Zap,
} from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { generateWhatsAppLink, getWhatsAppNativeUrl, cleanPhoneNumber } from "../utils/whatsapp";
import {
  GoogleGenAI,
  Modality,
  FunctionDeclaration,
  Type,
  LiveServerMessage,
} from "@google/genai";
import { toast } from "sonner";

import ReactMarkdown from "react-markdown";
import { Restaurant, db, PlatformSettings } from "../store/db";
import { getBogotaTime, isRestaurantOpen, getRestaurantScheduleSummary, getDetailedHoursForToday } from "../utils/restaurantUtils";
import { supabase } from "../lib/supabase";
import { RegistrationModal } from "./RegistrationModal";

interface Message {
  role: "user" | "assistant";
  text: string;
  products?: any[];
  isMenu?: boolean;
  restaurants?: any[];
  isRegistrationAction?: boolean;
}

interface FloatingButtonProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  initAudioContext: () => Promise<void>;
  isConnected: boolean;
  connectToGemini: () => void;
  isDashboard: boolean;
  hasBottomNav: boolean;
  showHelperMessage: boolean;
  setShowHelperMessage: (show: boolean) => void;
  assistantIcon?: string;
  assistantCustomIconUrl?: string;
}

const FloatingButton: React.FC<FloatingButtonProps> = ({
  isOpen,
  setIsOpen,
  initAudioContext,
  isConnected,
  connectToGemini,
  isDashboard,
  hasBottomNav,
  showHelperMessage,
  setShowHelperMessage,
  assistantIcon = "Smile",
  assistantCustomIconUrl,
}) => {
  const AssistantIconComponent = {
    Smile,
    Bot,
    Sparkles,
    MessageSquare,
    Zap,
    Star,
  }[assistantIcon] || Smile;

  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const handleButtonClick = () => {
    setIsOpen(true);
    initAudioContext().then(() => {
      if (!isConnected) connectToGemini();
    });
  };

  return (
    <motion.button
      ref={buttonRef}
      id="ai-floating-button"
      onClick={handleButtonClick}
      className={`fixed z-[3000] cursor-pointer right-4 sm:right-6 ${
        hasBottomNav ? "bottom-[128px] md:bottom-12" : "bottom-20 sm:bottom-24"
      } ${
        assistantCustomIconUrl
          ? "hover:scale-110 active:scale-95 transition-transform duration-300 group flex items-center justify-center w-32 h-32 sm:w-36 sm:h-36 drop-shadow-[0_10px_25px_rgba(0,0,0,0.55)]"
          : "p-2 bg-gradient-to-br from-[#FF3366] via-[#FF9933] to-[#FFD700] text-on-surface rounded-[2.75rem] shadow-[0_12px_40px_rgba(255,51,102,0.7)] hover:scale-110 active:scale-95 transition-transform duration-300 group overflow-hidden border-2 border-white/40 text-white"
      }`}
      animate={{
        x: [0, -3, 3, -3, 3, -3, 3, 0, 0, 0, 0],
        y: [0, 1, -1, 1, -1, 1, -1, 0, 0, 0, 0],
        rotate: [0, -5, 5, -5, 5, -5, 5, 0, 0, 0, 0],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        repeatType: "loop",
        ease: "easeInOut",
        repeatDelay: 2.5,
      }}
    >
      {assistantCustomIconUrl ? (
        <img src={assistantCustomIconUrl} alt="Assistant" className="w-full h-full object-contain pointer-events-none" />
      ) : (
        <div className="relative p-5 sm:p-5.5 flex items-center justify-center pointer-events-none w-full h-full">
          {/* Joyful pulse background */}
          <motion.div
            className="absolute inset-0 bg-white/30 rounded-[2.75rem]"
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[2.75rem]" />
          
          {/* Main happy character bouncy animation */}
          <motion.div
            animate={{
              y: [0, -6, 0, -3, 0],
              rotate: [0, -10, 10, -5, 0],
              scale: [1, 1.15, 0.95, 1.05, 1],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <AssistantIconComponent className="w-14 h-14 sm:w-16 sm:h-16 relative z-10 drop-shadow-[0_3px_10px_rgba(0,0,0,0.35)] text-white fill-white/20" strokeWidth={2.5} />
          </motion.div>

          {/* Orbiting sparkles */}
          <motion.div
            className="absolute -top-1 -right-1"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0.8, 1],
              rotate: [0, 180, 360],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-7 h-7 text-yellow-100 fill-yellow-200 drop-shadow-[0_0_8px_rgba(255,255,255,0.85)]" />
          </motion.div>
          
          <motion.div
            className="absolute -bottom-1 -left-1"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5],
              rotate: [360, 180, 0],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-6 h-6 text-pink-200 fill-pink-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.85)]" />
          </motion.div>
        </div>
      )}
    </motion.button>
  );
};

interface ChatAssistantProps {
  restaurant?: Restaurant;
  platformSettings?: PlatformSettings | null;
}

export const getInitialWelcomeMessage = (isGuest: boolean = true, rawProfileName?: string): Message => {
  const hasRealName = rawProfileName && !["usuario", "user", "cliente", "invitado", "guest"].includes(rawProfileName.toLowerCase().trim());
  const greetingHeader = hasRealName ? `¡Hola ${rawProfileName}! ` : "";
  const nameAskPart = hasRealName
    ? `¿Qué te gustaría ordenar o comer hoy, ${rawProfileName}? ¡Dime tu antojo y te atenderé con todo el gusto!`
    : `Antes de comenzar, por favor cuéntame: **¿cuál es tu nombre?** 😊 Me gustaría saber cómo llamarte para dirigirme a ti por tu nombre y atenderte de la mejor manera. ¿Y qué te gustaría comer hoy?`;

  return {
    role: "assistant",
    text: `${greetingHeader}¡Bienvenido a SmartBite, su Bocado Inteligente! 🌟\n\nLa aplicación donde no solo podrás comer, sino también **ganar dinero**.\n\n✨ **En SmartBite puedes:**\n• 🎡 **Girar la ruleta:** Ganar fabulosos descuentos y más productos gratis adicionales en compras participantes.\n• 💰 **Ganar dinero real:** Ganar por referir nuevos clientes y amigos a la plataforma.\n• 🪙 **Puntos de fidelidad y monedas de oro:** Acumular monedas de oro por tus compras, las cuales podrás canjear por productos deliciosos.\n\n${isGuest ? "💡 *Recordatorio importante:* Te recomendamos registrarte en la aplicación para que puedas participar y disfrutar de todos los beneficios. Puedes hacerlo fácilmente tocando el botón dorado que dice **'REGISTRARSE'** ubicado aquí abajo en la ventana del chat.\n\n" : ""}${nameAskPart}`
  };
};

export const ChatAssistant: React.FC<ChatAssistantProps> = ({
  restaurant: propRestaurant,
  platformSettings,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { appUser, user, loading } = useAuth();
  const {
    addToCart,
    getSummary,
    applyCoupon,
    items,
    discount,
    couponCode,
    clearCart,
  } = useCart();
  const rawProfileName = (appUser?.displayName || (appUser as any)?.name || user?.user_metadata?.full_name || (appUser as any)?.full_name || "").trim();
  const hasRealProfileName = !!(rawProfileName && !["usuario", "user", "cliente", "invitado", "guest"].includes(rawProfileName.toLowerCase()));

  const [activeRestaurant, setActiveRestaurant] = useState<Restaurant | null>(
    null,
  );
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    getInitialWelcomeMessage(!appUser, rawProfileName)
  ]);

  // Keep initial welcome message updated with profile name if single message
  useEffect(() => {
    const name = appUser?.displayName || (appUser as any)?.name || user?.user_metadata?.full_name || (appUser as any)?.full_name;
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === "assistant") {
        return [getInitialWelcomeMessage(!appUser, name)];
      }
      return prev;
    });
  }, [appUser, user]);
  const lastConnectedIdRef = useRef<string | undefined>(undefined);
  const lastConnectedUserIdRef = useRef<string | undefined>(undefined);

  // Refs to avoid stale closures in tool calls
  const itemsRef = useRef(items);
  const discountRef = useRef(discount);
  const couponCodeRef = useRef(couponCode);
  const restaurantRef = useRef(activeRestaurant || propRestaurant);
  const promoProductRef = useRef<any | null>(null);
  const handledSmartLinkRef = useRef<string | null>(null);

  // Helper to update items synchronously for the ref (used in tool calls)
  const addToCartWithRefAction = (product: any, quantity: number = 1) => {
    // Add to context store with quantity
    const res = addToCart(product, quantity);

    // Sync with ref immediately only if successful
    if (res.success) {
      const existingIndex = itemsRef.current.findIndex(
        (i) => i.id === product.id,
      );
      if (existingIndex >= 0) {
        const updatedItems = [...itemsRef.current];
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: updatedItems[existingIndex].quantity + quantity,
        };
        itemsRef.current = updatedItems;
      } else {
        itemsRef.current = [...itemsRef.current, { ...product, quantity }];
      }
    }
    return res;
  };

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const prevItemsLengthRef = useRef(items.reduce((acc, item) => acc + item.quantity, 0));

  // Detect manual adds to cart while chat is open
  useEffect(() => {
    const currentQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
    if (isOpen && currentQuantity > prevItemsLengthRef.current) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: '¡Perfecto! He detectado que añadiste un producto manualmente a tu carrito. ¿Deseas explorar algo más o te ayudo a repasar el resumen del pedido para confirmar?' }
      ]);
    }
    prevItemsLengthRef.current = currentQuantity;
  }, [items, isOpen]);

  useEffect(() => {
    discountRef.current = discount;
  }, [discount]);

  useEffect(() => {
    couponCodeRef.current = couponCode;
  }, [couponCode]);

  useEffect(() => {
    restaurantRef.current = activeRestaurant || propRestaurant;
  }, [activeRestaurant, propRestaurant]);

  useEffect(() => {
    const fetchRestaurant = async () => {
      const match = location.pathname.match(/\/r\/([^/]+)/);
      if (match) {
        const id = match[1];
        if (activeRestaurant?.id === id) return;

        try {
          const r = await db.getRestaurant(id);
          if (r) {
            const [menu, coupons] = await Promise.all([
              db.getRestaurantMenu(id),
              db.getCoupons(id),
            ]);
            setActiveRestaurant({ ...r, menu, coupons } as any);
          }
        } catch (error) {
          console.error(
            "ChatAssistant: Error fetching restaurant context",
            error,
          );
        }
      } else if (activeRestaurant && location.pathname.includes("/r/")) {
        // Only clear if we explicitly navigated to an invalid /r/ route
        setActiveRestaurant(null);
      }
    };

    fetchRestaurant();
  }, [location.pathname, activeRestaurant?.id]);

  // Handle Smart Link deep linking (?promo=... or ?agent_open=true)
  useEffect(() => {
    const match = location.pathname.match(/\/r\/([^/]+)/);
    if (!match) return;
    const restaurantId = match[1];
    const searchParams = new URLSearchParams(location.search);
    const promoId = searchParams.get("promo") || searchParams.get("product");
    const agentOpen = searchParams.get("agent_open") === "true" || !!promoId;
    const postId = searchParams.get("post_id");

    const smartKey = `${restaurantId}_${promoId || ""}_${agentOpen}`;
    if (agentOpen && handledSmartLinkRef.current !== smartKey) {
      handledSmartLinkRef.current = smartKey;

      // Track click if post_id was provided
      if (postId) {
        fetch(`/api/social/track/${postId}`).catch(() => {});
      }

      // Automatically open Gemini agent
      setIsOpen(true);

      // Fetch restaurant & menu to set context
      (async () => {
        try {
          const r = activeRestaurant || (await db.getRestaurant(restaurantId));
          const menu = (r as any)?.menu || (await db.getRestaurantMenu(restaurantId));
          if (r) {
            setActiveRestaurant({ ...r, menu } as any);
            restaurantRef.current = { ...r, menu } as any;

            if (promoId && menu && menu.length > 0) {
              const targetProduct = menu.find((p: any) => p.id === promoId);
              if (targetProduct) {
                promoProductRef.current = targetProduct;
                const schedule = getDetailedHoursForToday(r);
                const enrichedProduct = {
                  ...targetProduct,
                  restaurantName: r.name,
                  isRestaurantOpen: isRestaurantOpen(r),
                  restaurantSchedule: schedule,
                };
                const discountText =
                  targetProduct.hasDiscount && targetProduct.discountPercentage
                    ? ` con un **${targetProduct.discountPercentage}% de descuento especial**`
                    : "";
                const welcomeMessage = `¡Hola! 👋 Te damos la más cordial bienvenida a **${r.name}**.\n\nVeo que llegaste por nuestra publicación de **${targetProduct.name}**${discountText} ($${targetProduct.price.toLocaleString("es-CO")}). ¡Es una excelente elección!\n\n¿Deseas que te prepare este pedido o tienes alguna pregunta sobre sus ingredientes o acompañamientos?`;

                setMessages((prev) => [
                  ...prev,
                  {
                    role: "assistant",
                    text: welcomeMessage,
                    products: [enrichedProduct],
                  },
                ]);
              }
            }
          }
        } catch (err) {
          console.error("Error setting smart link agent context:", err);
        }
      })();
    }
  }, [location.pathname, location.search, activeRestaurant]);

  // Real-time menu updates for the active restaurant
  useEffect(() => {
    if (!activeRestaurant?.id) return;

    const channel = supabase
      .channel(`menu-changes-${activeRestaurant.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
          filter: `restaurant_id=eq.${activeRestaurant.id}`,
        },
        async () => {
          try {
            const menu = await db.getRestaurantMenu(activeRestaurant.id);
            setActiveRestaurant((prev) => (prev ? { ...prev, menu } : null));
            console.log("ChatAssistant: Menu updated in real-time");
          } catch (error) {
            console.error("Error updating menu in real-time:", error);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRestaurant?.id]);

  const cachedOrdersRef = useRef<any[]>([]);
  const isPreloadingOrdersRef = useRef(false);

  useEffect(() => {
    if (appUser?.id) {
      const preload = async () => {
        if (isPreloadingOrdersRef.current) return;
        isPreloadingOrdersRef.current = true;
        try {
          console.log("ChatAssistant: Pre-loading user orders in background...");
          const orders = await db.getUserOrders(appUser.id);
          cachedOrdersRef.current = orders || [];
          console.log(`ChatAssistant: Pre-loaded ${cachedOrdersRef.current.length} historical orders.`);
        } catch (e) {
          console.error("ChatAssistant: Error pre-loading orders:", e);
        } finally {
          isPreloadingOrdersRef.current = false;
        }
      };
      preload();
    } else {
      cachedOrdersRef.current = [];
    }
  }, [appUser?.id]);

  const restaurant = activeRestaurant || propRestaurant;

  const isDashboard =
    location.pathname.includes("/admin") ||
    location.pathname.includes("/owner") ||
    location.pathname.includes("/driver") ||
    ["/profile", "/driver", "/platform", "/representative"].some((path) =>
      location.pathname.startsWith(path),
    );
  const hasBottomNav =
    !isDashboard && !["/checkout", "/auth"].includes(location.pathname) && !!user;

  // Load history from localStorage
  useEffect(() => {
    if (appUser && restaurant?.id && isOpen) {
      const userId = appUser.id;
      const saved = localStorage.getItem(
        `chat_history_${userId}_${restaurant.id}`,
      );
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && messages.length === 0) {
            setMessages(parsed);
          }
        } catch (e) {
          console.error("Error loading chat history", e);
        }
      }
    }
  }, [appUser, restaurant?.id, isOpen, messages.length]);

  // Save history to localStorage
  useEffect(() => {
    if (appUser && restaurant?.id && messages.length > 0) {
      const userId = appUser.id;
      localStorage.setItem(
        `chat_history_${userId}_${restaurant.id}`,
        JSON.stringify(messages),
      );
    }
  }, [messages, appUser, restaurant?.id]);

  // Clear history on logout
  useEffect(() => {
    if (!loading && !appUser) {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("chat_history_")) {
          localStorage.removeItem(key);
        }
      });
      setMessages([]);
    }
  }, [appUser, loading]);

  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const isListeningRef = useRef(false);
  const closeAfterVoiceRef = useRef(false);
  const isPlacingOrderRef = useRef(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showHelperMessage, setShowHelperMessage] = useState(false);
  const [registrationData, setRegistrationData] = useState<{name: string, phone: string, address: string} | null>(null);
  
  const isAwaitingNameResponseRef = useRef(false);
  const nameWaitingTimerRef = useRef<any>(null);

  const cancelNameWaiting = useCallback(() => {
    if (nameWaitingTimerRef.current) {
      clearTimeout(nameWaitingTimerRef.current);
      nameWaitingTimerRef.current = null;
    }
    isAwaitingNameResponseRef.current = false;
  }, []);
  
  // Timer for floating helper message (first time after 5s, then every 5 mins for 30s)
  useEffect(() => {
    let hideTimer: NodeJS.Timeout;
    let initialTimer: NodeJS.Timeout;
    
    const showMessage = () => {
      if (!isOpen && !isDashboard) {
        setShowHelperMessage(true);
        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
          setShowHelperMessage(false);
        }, 30000);
      }
    };

    initialTimer = setTimeout(showMessage, 5000);
    const intervalTimer = setInterval(showMessage, 300000); // 5 minutes

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [isOpen, isDashboard]);

  // Auto-scroll to bottom of messages
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const ttsGainNodeRef = useRef<GainNode | null>(null);
  const isTtsSpeakingRef = useRef<boolean>(false);
  const speechFramesCountRef = useRef<number>(0);
  const currentTurnEpochRef = useRef<number>(0);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const turnCompleteRef = useRef<boolean>(true);
  const pingIntervalRef = useRef<any>(null);

  // Smooth ducking & controlled stop to eliminate clicks, pops or abrupt cuts during Barge-in
  const smoothDuckAndStopAudio = useCallback((durationMs: number = 45) => {
    cancelNameWaiting();
    currentTurnEpochRef.current += 1; // Invalidate any incoming audio from previous turn

    if (ttsGainNodeRef.current && audioContextRef.current) {
      try {
        const ctx = audioContextRef.current;
        const gainParam = ttsGainNodeRef.current.gain;
        const now = ctx.currentTime;
        gainParam.cancelScheduledValues(now);
        gainParam.setValueAtTime(gainParam.value, now);
        // Smooth linear fade-out to prevent digital click
        gainParam.linearRampToValueAtTime(0.0001, now + (durationMs / 1000));
      } catch (err) {
        console.warn("Error applying audio ducking ramp:", err);
      }
    }

    setTimeout(() => {
      activeSourcesRef.current.forEach((source) => {
        try {
          source.stop();
          source.disconnect();
        } catch (e) {
          // Source might have already stopped
        }
      });
      activeSourcesRef.current = [];
      nextStartTimeRef.current = 0;
      isTtsSpeakingRef.current = false;

      // Restore gain to unity for next incoming response
      if (ttsGainNodeRef.current && audioContextRef.current) {
        try {
          const ctx = audioContextRef.current;
          const now = ctx.currentTime;
          ttsGainNodeRef.current.gain.cancelScheduledValues(now);
          ttsGainNodeRef.current.gain.setValueAtTime(1.0, now);
        } catch (e) {}
      }
    }, durationMs);
  }, [cancelNameWaiting]);

  const stopAllAudio = useCallback(() => {
    smoothDuckAndStopAudio(30);
  }, [smoothDuckAndStopAudio]);

  const normalize = (str: string) =>
    str
      ? str
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()
      : "";

  const getMatchScore = (text: string, query: string): number => {
    const normalizedText = normalize(text);
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return 0;
    
    // 1. Exact match of the entire normalized string (ideal)
    if (normalizedText === normalizedQuery) return 1000;
    
    // 2. Text starts with query
    if (normalizedText.startsWith(normalizedQuery)) return 800;

    // 3. Text includes full query
    if (normalizedText.includes(normalizedQuery)) return 600;

    const stopWords = new Set([
      "de", "con", "para", "el", "la", "los", "las", "un", "una", "unos", "unas", 
      "del", "al", "y", "en", "por", "que", "es", "son", "sin", "plato", "platos", 
      "comida", "comidas", "quiero", "busco", "necesito", "ordenar", "a", "mi", "me", "gustaria",
      "categoria", "categorias", "seccion", "secciones"
    ]);

    const queryWords = normalizedQuery
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 1 && !stopWords.has(w));

    if (queryWords.length === 0) {
      return normalizedText.includes(normalizedQuery) ? 100 : 0;
    }

    const textWords = normalizedText
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 1 && !stopWords.has(w));

    let matchedCount = 0;
    for (const qWord of queryWords) {
      // Direct substring match of the query word in the entire text
      if (normalizedText.includes(qWord)) {
        matchedCount++;
        continue;
      }
      
      // Handle prefix/singular/plural variations
      const isSingularPluralMatch = textWords.some((tWord) => {
        if (tWord.includes(qWord) || qWord.includes(tWord)) return true;
        
        // Plural matching
        if (qWord.endsWith("s") && qWord.length > 3) {
          const singular = qWord.slice(0, -1);
          if (tWord.includes(singular)) return true;
        }
        if (tWord.endsWith("s") && tWord.length > 3) {
          const singular = tWord.slice(0, -1);
          if (qWord.includes(singular)) return true;
        }

        // --- SMART DRINK SYNONYM BRIDGE ---
        const drinkQueryTerms = ["beber", "tomar", "bebida", "bebidas", "refresco", "refrescos", "jugo", "jugos", "gaseosa", "gaseosas", "soda", "sodas", "agua", "aguas", "drink", "drinks", "liquido", "liquidas", "liquidos"];
        const isQueryWordDrink = drinkQueryTerms.some(term => qWord === term || qWord.includes(term));
        const drinkTextTerms = ["bebida", "bebidas", "beber", "tomar", "refresco", "refrescos", "jugo", "jugos", "gaseosa", "gaseosas", "soda", "sodas", "agua", "aguas", "cerveza", "cervezas", "malta", "limonada", "limonadas", "te", "cafe", "coctel", "cocteles", "licor", "licores", "trago", "tragos", "drink", "drinks"];
        const isTextWordDrink = drinkTextTerms.some(term => tWord === term || tWord.includes(term));
        if (isQueryWordDrink && isTextWordDrink) return true;

        return false;
      });

      if (isSingularPluralMatch) {
        matchedCount++;
      }
    }

    if (matchedCount > 0) {
      // Score based on percentage of query words matched
      return (matchedCount / queryWords.length) * 100;
    }

    return 0;
  };

  const isMatch = (text: string, query: string) => {
    return getMatchScore(text, query) > 0;
  };

  const resolveTopMealProducts = (
    rawQuery: string,
    allProducts: any[],
    allRestaurants: any[],
    userCoords: { lat?: number; lng?: number },
    currentRestParam?: any
  ) => {
    const normQuery = normalize(rawQuery || "");
    const isBreakfast =
      normQuery.includes("desayun") ||
      normQuery.includes("manana") ||
      normQuery.includes("breakfast");
    const isLunch =
      normQuery.includes("almuerz") ||
      normQuery.includes("almorz") ||
      normQuery.includes("medio dia") ||
      normQuery.includes("mediodia") ||
      normQuery.includes("lunch");
    const isDinner =
      normQuery.includes("cena") ||
      normQuery.includes("cenar") ||
      normQuery.includes("noche") ||
      normQuery.includes("nocturn") ||
      normQuery.includes("dinner");

    const isMealSearch = isBreakfast || isLunch || isDinner;

    const breakfastKws = [
      "desayun", "arepa", "huevo", "huevos", "caldo", "cafe", "café", "pan", "panader",
      "pancake", "panqueque", "waffle", "sandw", "sandu", "tostad", "empanad",
      "tamal", "pastel", "jugo", "chocolate", "avena", "cereal", "croissant",
      "omelet", "fruta", "parfait", "queso", "batido", "saludable"
    ];
    const breakfastCats = [
      "desayuno", "desayunos", "cafeteria", "cafetería", "arepas", "panaderia",
      "panadería", "bebidas calientes", "reposteria", "repostería", "pasteleria"
    ];

    const lunchKws = [
      "almuerz", "arroz", "carne", "pollo", "pechuga", "pescado", "sancocho",
      "sopa", "bandeja", "paisa", "ejecutivo", "corriente", "corrientazo",
      "plato fuerte", "asado", "parrilla", "churrasco", "costilla", "pasta",
      "ensalada", "frijol", "lenteja", "chuleta", "chicharron", "chicharrón",
      "cerdo", "res", "lomo", "sobrebarriga", "mondongo", "ajiaco", "marisco",
      "guisado", "estofado", "pesca", "mojarra", "salmon", "salmón"
    ];
    const lunchCats = [
      "almuerzo", "almuerzos", "platos fuertes", "plato fuerte", "carnes",
      "parrilla", "asados", "pescados", "sopas", "ejecutivos", "menú del día",
      "menu del dia", "típico", "tipico", "comida tipica", "criolla"
    ];

    const dinnerKws = [
      "cena", "hamburguesa", "burger", "pizza", "perro", "hot dog", "salchipapa",
      "desgranado", "picada", "taco", "burrito", "quesadilla", "sandwich",
      "sanduche", "arepa rellena", "alitas", "wings", "shawarma", "chuzo",
      "parrilla", "crepe", "sushi", "comida rapida", "comidas rapidas", "roll",
      "nacho", "dorilocos", "mazorcada", "patacon", "patacón"
    ];
    const dinnerCats = [
      "cena", "cenas", "comidas rápidas", "comidas rapidas", "pizzas",
      "hamburguesas", "mexicana", "picadas", "perros calientes", "snack", "tacos"
    ];

    const getDistance = (lat1?: number, lon1?: number, lat2?: number, lon2?: number) => {
      if (!lat1 || !lon1 || !lat2 || !lon2) return 999999;
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    // Filter available products
    const availableProds = allProducts.filter((p) => p.available !== false);

    // Score each product
    const scored = availableProds.map((p) => {
      const r = allRestaurants.find((res) => res.id === p.restaurantId);
      const openStatus = r ? isRestaurantOpen(r) : true;
      const restRating = (r as any)?.rating || 4.5;
      const dist = getDistance(userCoords.lat, userCoords.lng, r?.latitude, r?.longitude);

      let score = 0;
      const pName = normalize(p.name || "");
      const pDesc = normalize(p.description || "");
      const pCat = normalize(p.category || "");

      // Current restaurant boost
      if (currentRestParam && p.restaurantId === currentRestParam.id) {
        score += 200;
      }

      // Open restaurant boost
      if (openStatus) score += 400;

      // Rating boost
      score += restRating * 15;

      // Image boost
      if (p.images && p.images.length > 0 && p.images[0]) score += 120;

      // Featured / promo
      if (p.isFeatured) score += 100;
      if (p.hasDiscount || p.isPromotion) score += 60;
      if (p.isPartOfCombo) score += 30;

      // Meal-specific matching
      if (isBreakfast) {
        const nameHit = breakfastKws.some((k) => pName.includes(k));
        const catHit = breakfastCats.some((c) => pCat.includes(c));
        const descHit = breakfastKws.some((k) => pDesc.includes(k));
        if (nameHit) score += 500;
        if (catHit) score += 350;
        if (descHit) score += 150;
      } else if (isLunch) {
        const nameHit = lunchKws.some((k) => pName.includes(k));
        const catHit = lunchCats.some((c) => pCat.includes(c));
        const descHit = lunchKws.some((k) => pDesc.includes(k));
        if (nameHit) score += 500;
        if (catHit) score += 350;
        if (descHit) score += 150;
      } else if (isDinner) {
        const nameHit = dinnerKws.some((k) => pName.includes(k));
        const catHit = dinnerCats.some((c) => pCat.includes(c));
        const descHit = dinnerKws.some((k) => pDesc.includes(k));
        if (nameHit) score += 500;
        if (catHit) score += 350;
        if (descHit) score += 150;
      } else {
        const nameMatch = isMatch(p.name, rawQuery);
        const descMatch = p.description ? isMatch(p.description, rawQuery) : false;
        const catMatch = isMatch(p.category || "", rawQuery);
        if (nameMatch) score += 400;
        if (catMatch) score += 250;
        if (descMatch) score += 150;
      }

      if (dist < 100) {
        score += Math.max(0, 50 - dist);
      }

      return { product: p, score, restaurant: r, isOpen: openStatus, dist };
    });

    let candidates = scored;
    if (isMealSearch) {
      const mealRelevant = scored.filter((item) => {
        const pName = normalize(item.product.name || "");
        const pDesc = normalize(item.product.description || "");
        const pCat = normalize(item.product.category || "");
        if (isBreakfast) {
          return (
            breakfastKws.some((k) => pName.includes(k) || pDesc.includes(k)) ||
            breakfastCats.some((c) => pCat.includes(c))
          );
        } else if (isLunch) {
          return (
            lunchKws.some((k) => pName.includes(k) || pDesc.includes(k)) ||
            lunchCats.some((c) => pCat.includes(c))
          );
        } else if (isDinner) {
          return (
            dinnerKws.some((k) => pName.includes(k) || pDesc.includes(k)) ||
            dinnerCats.some((c) => pCat.includes(c))
          );
        }
        return false;
      });

      if (mealRelevant.length >= 10) {
        candidates = mealRelevant;
      } else if (mealRelevant.length > 0) {
        const remaining = scored.filter((item) => !mealRelevant.includes(item));
        candidates = [...mealRelevant, ...remaining];
      } else {
        candidates = scored;
      }
    } else {
      const matched = scored.filter((item) => {
        return (
          isMatch(item.product.name, rawQuery) ||
          (item.product.description && isMatch(item.product.description, rawQuery)) ||
          isMatch(item.product.category || "", rawQuery)
        );
      });
      candidates = matched.length > 0 ? matched : scored;
    }

    candidates.sort((a, b) => b.score - a.score);
    const top10 = candidates.slice(0, 10).map((c) => {
      const r = c.restaurant;
      const schedule = r ? getDetailedHoursForToday(r) : "No especificado";
      return {
        ...c.product,
        restaurantName: r?.name || c.product.restaurantName || "Restaurante",
        isRestaurantOpen: c.isOpen,
        restaurantSchedule: schedule,
      };
    });

    let messageText = "";
    if (isBreakfast) {
      messageText =
        "¡Aquí tienes los 10 platos más populares para desayunar en SmartBite! ☕ 👉 Desliza hacia los lados en la ventana del chat para ver todas las fotos y precios:";
    } else if (isLunch) {
      messageText =
        "¡Aquí tienes los 10 platos más populares para almorzar en SmartBite! 🍲 👉 Desliza hacia los lados en la ventana del chat para ver todas las fotos y precios:";
    } else if (isDinner) {
      messageText =
        "¡Aquí tienes los 10 platos más populares para cenar en SmartBite! 🌙 👉 Desliza hacia los lados en la ventana del chat para ver todas las fotos y precios:";
    } else {
      messageText = `¡Aquí tienes los 10 platos más populares para "${rawQuery}"! 👉 Desliza hacia los lados en la ventana del chat para ver todas las fotos y precios:`;
    }

    return {
      topProducts: top10,
      messageText,
      mealType: isBreakfast
        ? "desayuno"
        : isLunch
        ? "almuerzo"
        : isDinner
        ? "cena"
        : "general",
    };
  };

  const tools: FunctionDeclaration[] = [
    {
      name: "triggerRegistrationUI",
      description: "Muestra un formulario de registro asistido en la interfaz para que el usuario escriba su correo y contraseña. Si el usuario no está registrado y desea comprar, ofrécele ayuda. Pregúntale su nombre completo, teléfono y dirección. Cuando tengas todos los datos, llama a esta herramienta.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          fullName: { type: Type.STRING, description: "Nombre completo del usuario" },
          phone: { type: Type.STRING, description: "Teléfono del usuario" },
          address: { type: Type.STRING, description: "Dirección de entrega del usuario" },
        },
        required: ["fullName", "phone", "address"],
      },
    },
    {
      name: "addToCart",
      description:
        "Añade uno o varios productos al carrito. IMPORTANTE: Tras añadir, el asistente DEBE notificar al usuario. NO dupliques productos si el usuario solo pidió uno.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          productId: { type: Type.STRING },
          restaurantId: { type: Type.STRING },
          quantity: {
            type: Type.NUMBER,
            description:
              "Cantidad a añadir. Por defecto es 1. Usa 1 si el usuario no especificó cantidad.",
          },
        },
        required: ["productId", "restaurantId"],
      },
    },
    {
      name: "requestCustomerData",
      description:
        "Llama a esta herramienta CADA VEZ que pidas un dato al usuario (Nombre, Dirección, Barrio, Teléfono, Pago, Nota). Esto imprimirá la pregunta visualmente en el chat como guía para el usuario.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          dataField: {
            type: Type.STRING,
            enum: ["nombre", "dirección", "barrio", "teléfono", "pago", "nota"],
            description: "El campo que estás solicitando. Usa 'nombre' para preguntar explícitamente a nombre de quién va el pedido o a quién va dirigido.",
          },
          question: {
            type: Type.STRING,
            description:
              "La pregunta exacta que le vas a hacer al usuario (ej: '¿A nombre de quién va el pedido o a quién va dirigido?', '¿Cuál es tu dirección de entrega?').",
          },
        },
        required: ["dataField", "question"],
      },
    },
    {
      name: "finalizeOrder",
      description:
        "Genera el resumen de venta con todos los datos recogidos. ESTA HERRAMIENTA NO ENVÍA EL PEDIDO, SOLAMENTE DA EL RESUMEN PARA CONFIRMARLO CON EL USUARIO. Llámala cuando ya tengas todos los datos para leer el resumen al usuario. NUNCA la llames con 'usuario' o nombres genéricos en customerName; debes haber preguntado a quién va dirigido el pedido.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          customerName: {
            type: Type.STRING,
            description:
              "Nombre y apellido real del cliente a quien va dirigido el pedido. NUNCA uses 'usuario', 'cliente' o 'invitado'. Debe ser el nombre real obtenido al preguntar: '¿A nombre de quién va el pedido?'.",
          },
          deliveryAddress: {
            type: Type.STRING,
            description: "Dirección de entrega.",
          },
          neighborhood: {
            type: Type.STRING,
            description: "Barrio o sector de la ciudad.",
          },
          phoneNumber: {
            type: Type.STRING,
            description: "Número de teléfono de contacto.",
          },
          paymentMethod: {
            type: Type.STRING,
            description:
              "Método de pago (ej: Datáfono, Efectivo contra entrega).",
          },
          notes: {
            type: Type.STRING,
            description: "Notas o instrucciones adicionales para el pedido.",
          },
        },
        required: [
          "customerName",
          "deliveryAddress",
          "neighborhood",
          "phoneNumber",
          "paymentMethod",
        ],
      },
    },
    {
      name: "confirmAndPlaceOrder",
      description:
        "Ejecuta finalmente el pedido después de que el usuario haya confirmado el resumen con un OK explícito. Guarda el pedido en la base de datos y genera el link de WhatsApp. NUNCA ejecutes con 'usuario' como customerName.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          customerName: {
            type: Type.STRING,
            description:
              "Nombre y apellido real del cliente a quien va dirigido el pedido. NUNCA 'usuario' ni genérico.",
          },
          deliveryAddress: { type: Type.STRING },
          neighborhood: { type: Type.STRING },
          phoneNumber: { type: Type.STRING },
          paymentMethod: { type: Type.STRING },
          notes: { type: Type.STRING },
        },
        required: [
          "customerName",
          "deliveryAddress",
          "neighborhood",
          "phoneNumber",
          "paymentMethod",
        ],
      },
    },
    {
      name: "getCartSummary",
      description: "Obtiene el resumen del carrito.",
      parameters: {
        type: Type.OBJECT,
        properties: { execute: { type: Type.BOOLEAN } },
      },
    },
    {
      name: "applyCoupon",
      description: "Aplica un cupón de descuento al carrito.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          code: { type: Type.STRING },
          discount: { type: Type.NUMBER },
        },
        required: ["code", "discount"],
      },
    },
    {
      name: "sendOrderToWhatsApp",
      description: "Envía el resumen por WhatsApp.",
      parameters: {
        type: Type.OBJECT,
        properties: { execute: { type: Type.BOOLEAN } },
      },
    },
    {
      name: "getUserLocation",
      description:
        "Obtiene la ubicación geográfica actual del usuario (latitud y longitud).",
      parameters: {
        type: Type.OBJECT,
        properties: { execute: { type: Type.BOOLEAN } },
      },
    },
    {
      name: "getNearbyRestaurants",
      description:
        "Busca restaurantes afiliados en SmartBite por nombre de local o ubicación geográfica. IMPORTANTE: Para platos, comidas del día como desayuno, almuerzo o cena, o sugerencias rápidas, NUNCA uses esta herramienta; debes usar 'searchGlobalProducts'.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          latitude: { type: Type.NUMBER, description: "Latitud opcional." },
          longitude: { type: Type.NUMBER, description: "Longitud opcional." },
          query: {
            type: Type.STRING,
            description: "Nombre o palabra clave del local comercial (ej: 'Ricky', 'Paraíso').",
          },
        },
      },
    },
    {
      name: "searchGlobalProducts",
      description:
        "Busca los diez (10) platos más populares de cualquier restaurante en SmartBite. Úsala OBLIGATORIAMENTE siempre que el usuario pregunte qué hay para desayunar, almorzar o cenar (ej: 'desayuno', 'almuerzo', 'cena'), o cuando busque comidas específicas ('hamburguesas', 'carnes', 'pizzas'). Retorna los diez platos más populares con fotos y precios interactivos.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          query: {
            type: Type.STRING,
            description:
              "Comida del día ('desayuno', 'almuerzo', 'cena') o tipo de comida/plato específico ('arepas', 'hamburguesas', 'arroz').",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "getRestaurantKnowledge",
      description:
        "Obtiene información detallada (horarios, menú, conocimiento de IA) de un restaurante específico por su ID.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          restaurantId: { type: Type.STRING },
        },
        required: ["restaurantId"],
      },
    },
    {
      name: "showMenu",
      description:
        "Muestra visualmente una selección de productos del menú al usuario en el chat. Puede ser por categoría o destacados.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          restaurantId: { type: Type.STRING },
          categoryName: {
            type: Type.STRING,
            description:
              "Opcional: nombre de la categoría a mostrar (ej: 'Entradas', 'Bebidas').",
          },
          productIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description:
              "Opcional: lista de IDs de productos específicos a destacar.",
          },
        },
        required: ["restaurantId"],
      },
    },
    {
      name: "getSavedAddresses",
      description:
        "Obtiene las direcciones guardadas del usuario en su perfil (Casa, Trabajo, etc.) para sugerirlas.",
      parameters: {
        type: Type.OBJECT,
        properties: { execute: { type: Type.BOOLEAN } },
      },
    },
    {
      name: "getUserAnniversaries",
      description:
        "Obtiene las fechas especiales (cumpleaños, aniversarios) registradas por el usuario.",
      parameters: {
        type: Type.OBJECT,
        properties: { execute: { type: Type.BOOLEAN } },
      },
    },
  ];

  const playAudioChunk = useCallback((base64Data: string) => {
    if (!audioContextRef.current) return;
    const epochAtSchedule = currentTurnEpochRef.current;
    const ctx = audioContextRef.current;

    // Ensure Master TTS Gain node exists and is connected
    if (!ttsGainNodeRef.current) {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(1.0, ctx.currentTime);
      gain.connect(ctx.destination);
      ttsGainNodeRef.current = gain;
    }

    const binaryString = window.atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Convert PCM16 to Float32
    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768.0;
    }

    // Gemini Live output is 24000Hz mono PCM
    const buffer = ctx.createBuffer(
      1,
      float32.length,
      24000,
    );
    buffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ttsGainNodeRef.current);

    // Natural 1.0x playback rate: strictly matches Gemini's real-time generation rate
    // to avoid buffer starvation and choppy audio cuts
    source.playbackRate.value = 1.0;

    const currentTime = ctx.currentTime;
    
    // Smooth jitter buffer: 150ms cushion when starting or recovering from a gap
    const initialBufferDelaySec = 0.15;
    if (nextStartTimeRef.current < currentTime) {
      nextStartTimeRef.current = currentTime + initialBufferDelaySec;
    }

    const startTime = nextStartTimeRef.current;

    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter(
        (s) => s !== source,
      );
      if (activeSourcesRef.current.length === 0) {
        isTtsSpeakingRef.current = false;
      }
    };

    // If turn was interrupted while decoding chunk, discard immediately
    if (epochAtSchedule !== currentTurnEpochRef.current) {
      return;
    }

    isTtsSpeakingRef.current = true;
    activeSourcesRef.current.push(source);
    source.start(startTime);

    // Advance nextStartTime smoothly by the exact duration of the buffer for gapless streaming
    nextStartTimeRef.current = startTime + buffer.duration;
  }, []);

  const setupAudioGraph = (stream: MediaStream) => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!inputAudioContextRef.current) {
      try {
        inputAudioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
      } catch (e) {
        console.error("ChatAssistant: Failed to create input AudioContext", e);
      }
    }

    const inputCtx = inputAudioContextRef.current || audioContextRef.current;
    if (!inputCtx) return;

    if (inputCtx.state === "suspended") {
      inputCtx.resume().catch(() => {});
    }

    if (audioWorkletNodeRef.current) return;

    const source = inputCtx.createMediaStreamSource(stream);
    const processor = inputCtx.createScriptProcessor(2048, 1, 1);

    audioWorkletNodeRef.current = processor as any;

    processor.onaudioprocess = (e) => {
      // 1. Mute output buffer so microphone audio never loops back into speakers
      for (let c = 0; c < e.outputBuffer.numberOfChannels; c++) {
        e.outputBuffer.getChannelData(c).fill(0);
      }

      const activeSession = sessionRef.current as any;
      if (!isListeningRef.current || !activeSession || typeof activeSession.sendRealtimeInput !== 'function') {
        if (audioLevel > 0) setAudioLevel(0);
        return;
      }

      const inputData = e.inputBuffer.getChannelData(0);

      // Calculate audio level for visual feedback
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += inputData[i] * inputData[i];
      }
      const level = Math.sqrt(sum / inputData.length);
      setAudioLevel(level);

      // Only cancel the 5-second silence period if the customer speaks while the assistant is quiet
      if (level > 0.035 && isAwaitingNameResponseRef.current && !isTtsSpeakingRef.current) {
        cancelNameWaiting();
      }

      // Convert Float32 to PCM16
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7fff;
      }

      const uint8Arr = new Uint8Array(pcm16.buffer);
      let binary = "";
      for (let i = 0; i < uint8Arr.length; i++) {
        binary += String.fromCharCode(uint8Arr[i]);
      }
      const base64Data = btoa(binary);

      try {
        activeSession.sendRealtimeInput({
          audio: {
            data: base64Data,
            mimeType: "audio/pcm;rate=16000",
          },
        });
      } catch (err) {
        console.error("ChatAssistant: Error sending audio chunk", err);
      }
    };

    const muteGain = inputCtx.createGain();
    muteGain.gain.setValueAtTime(0, inputCtx.currentTime);
    source.connect(processor);
    processor.connect(muteGain);
    muteGain.connect(inputCtx.destination);
  };

  const initAudioContext = async () => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
        console.log("ChatAssistant: Output AudioContext initialized at 24000Hz");
      } catch (e) {
        console.error("ChatAssistant: Failed to create output AudioContext", e);
      }
    }
    if (audioContextRef.current && !ttsGainNodeRef.current) {
      const gain = audioContextRef.current.createGain();
      gain.gain.setValueAtTime(1.0, audioContextRef.current.currentTime);
      gain.connect(audioContextRef.current.destination);
      ttsGainNodeRef.current = gain;
    }
    if (audioContextRef.current?.state === "suspended") {
      try {
        await audioContextRef.current.resume();
      } catch (e) {}
    }
  };

  const connectToGemini = async (requestMic: boolean = false) => {
    if (isConnected || isConnecting) {
      if (requestMic && !streamRef.current) {
        await initMicrophone();
      }
      return;
    }

    setIsConnecting(true);
    lastConnectedIdRef.current = restaurant?.id;
    lastConnectedUserIdRef.current = appUser?.id;
    console.log("ChatAssistant: connecting to Gemini Live (parallel optimized connection)...");

    // Start WebSocket connection handshake IMMEDIATELY to overlap TCP/WS handshake overhead with DB queries
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const ws = new WebSocket(`${protocol}//${host}/api/live`);

    let resolveWsOpen: () => void = () => {};
    let rejectWsOpen: (err: any) => void = () => {};
    const wsOpenPromise = new Promise<void>((resolve, reject) => {
      resolveWsOpen = resolve;
      rejectWsOpen = reject;
    });

    // We'll set these up on ws. The full event loop handling is configured down below.
    ws.onopen = () => {
      console.log("ChatAssistant: WebSocket physical connection open!");
      resolveWsOpen();
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 15000); // Send keepalive ping every 15 seconds
    };

    ws.onerror = (err) => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      console.error("ChatAssistant: WebSocket pre-connect handshake error:", err);
      const handshakeErr = new Error("Error de conexión WebSocket. Por favor revisa tu conexión.");
      rejectWsOpen(handshakeErr);
    };

    ws.onclose = (event) => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      const closeErr = new Error("El WebSocket se cerró antes de inicializarse.");
      rejectWsOpen(closeErr);
    };

    // Prepare non-blocking context and parallel connections
    if (requestMic) {
      initMicrophone().catch(err => console.warn("ChatAssistant: Background mic acquisition error:", err));
    }
    initAudioContext().catch(err => console.warn("ChatAssistant: Background AudioContext boot error:", err));

    try {
      console.log("ChatAssistant: Awaiting WebSocket physical handshake...");
      // Await ONLY the physical socket connection to open (instantly resolves in <200ms)
      await wsOpenPromise;
      console.log("ChatAssistant: WebSocket physical connection established! Building context and sending setup message...");

      // Instantly build context from memory cache/state synchronously
      const ordersResult = cachedOrdersRef.current || [];
      const freshRest = restaurant;

      // Get user context for the assistant
      let userContext = "";
      let isBirthday = false;
      let specialOccasion = "";
      let hasPurchase = false;
      let favorites = "";

      const today = getBogotaTime();
      const formattedDate = today.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const orders = ordersResult || [];
      if (appUser) {
        hasPurchase = orders.length > 0;

        // Analyze favorites
        const productCounts: Record<string, { name: string; count: number }> =
          {};
        orders.forEach((o) => {
          o.items.forEach((i) => {
            if (i.product && i.product.id) {
              if (!productCounts[i.product.id])
                productCounts[i.product.id] = {
                  name: i.product.name,
                  count: 0,
                };
              productCounts[i.product.id].count += i.quantity;
            }
          });
        });
        favorites = Object.values(productCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 3)
          .map((f) => f.name)
          .join(", ");

        // Check birthday
        if (appUser.birthDate) {
          const birthDateStr = appUser.birthDate.split("T")[0];
          const [birthYear, birthMonth, birthDay] = birthDateStr
            .split("-")
            .map(Number);

          if (
            today.getDate() === birthDay &&
            today.getMonth() + 1 === birthMonth
          ) {
            isBirthday = true;
            specialOccasion = "Cumpleaños";
          }
        }

        // Check other anniversaries
        if (!isBirthday && appUser.anniversaries) {
          const matchedAnn = appUser.anniversaries.find((ann) => {
            if (!ann.date) return false;
            const annDateStr = ann.date.split("T")[0];
            const [annYear, annMonth, annDay] = annDateStr
              .split("-")
              .map(Number);
            return (
              annDay === today.getDate() && annMonth === today.getMonth() + 1
            );
          });
          if (matchedAnn) {
            specialOccasion = matchedAnn.type;
          }
        }
      }

      if (promoProductRef.current) {
        userContext += `\n- CONTEXTO ESPECIAL DE CAMPAÑA META (FACEBOOK/INSTAGRAM):\n  El cliente llegó a través del enlace inteligente oficial de Meta interesado en: "${promoProductRef.current.name}" ($${promoProductRef.current.price.toLocaleString("es-CO")}).\n  Dale máxima prioridad, sé muy servicial y ofrécele añadirlo a su pedido cuando lo desee.\n`;
      }

      // Apply the re-fetched fresh restaurant config
      let currentRest = restaurant;
      if (freshRest) {
        currentRest = freshRest;
        restaurantRef.current = freshRest;
        setActiveRestaurant(freshRest);
      }

      let isOpened = true;
      let currentScheduleSummary: any = null;
      if (currentRest) {
        isOpened = isRestaurantOpen(currentRest);
        currentScheduleSummary = getRestaurantScheduleSummary(currentRest);
      }

      const menuCategories = currentRest?.menu ? Array.from(new Set(currentRest.menu.map(p => p.category || "General"))).join(", ") : "No identificadas";
      const productsPreview = currentRest?.menu ? currentRest.menu.slice(0, 10).map(p => `- ${p.name}: $${p.price} (${p.category || 'General'})${!p.available ? ' [AGOTADO/NO DISPONIBLE]' : ''}`).join("\n") : "Menú no disponible";
      const couponsInfo = (currentRest as any)?.coupons ? (currentRest as any).coupons
        .filter((c: any) => c.active)
        .map((c: any) => `- Código: ${c.code} | Descuento: ${c.value}${c.discountType === 'percentage' ? '%' : ' COP'} | Min: $${c.minOrderAmount}`)
        .join("\n") : "Ninguno disponible";

      let wheelContext = "";
      try {
        if (currentRest?.id) {
          const wheelData = await db.getWheelConfig(currentRest.id);
          if (wheelData && wheelData.isActive) {
            wheelContext = `- Ruleta de Premios SmartBite: ACTIVA para pedidos a partir de $${formatCurrency(wheelData.minOrderAmount)} COP. Si el cliente alcanza o supera este monto, tiene derecho a un giro de ruleta con descuentos y productos gratis adicionales.`;
          }
        }
      } catch (e) {}

      userContext = `
        FECHA ACTUAL DEL SISTEMA: ${formattedDate}
        DÍA: ${today.getDate()}, MES: ${today.getMonth() + 1}
        
        CONFIGURACIÓN DEL RESTAURANTE (${currentRest?.name || "SmartBite"}):
        - Estado de Atención: ${isOpened ? "ABIERTO" : "CERRADO (PROHIBIDO VENDER O TOMAR PEDIDOS)"}
        - Horario de Atención de Hoy: ${currentScheduleSummary?.todaySchedule || currentRest?.openingHours || "No especificados"}
        - Mensaje Informativo de Horario: ${currentScheduleSummary?.formattedMessage || (isOpened ? "Abierto" : "Cerrado en este momento")}
        - WhatsApp de Pedidos: ${currentRest?.whatsappNumber || currentRest?.phone || "No configurado"} (USA ESTE NÚMERO PARA WHATSAPP)
        - Domicilios: ${currentRest?.hasDelivery ? "HABILITADOS" : "DESHABILITADOS"}
        - Costo del Domicilio: $${currentRest?.deliveryFee || 0} COP
        - Ubicación: ${currentRest?.address}, ${currentRest?.city}
        - Horarios Generales: ${currentRest?.openingHours || "No especificados"}
        - Horarios Detallados: ${currentRest?.detailedHours ? JSON.stringify(currentRest?.detailedHours) : "No especificados"}
        ${wheelContext ? `${wheelContext}\n` : ""}        - Categorías del Menú: ${menuCategories}
        - Productos Destacados/Principales:
        ${productsPreview}
        - Promociones y Cupones Activos:
        ${couponsInfo}

        CONOCIMIENTO DEL CLIENTE:
        - Nombre en Perfil: ${hasRealProfileName ? rawProfileName : "SIN NOMBRE REGISTRADO"}
        - INSTRUCCIÓN CRÍTICA DE NOMBRE: DEBES PREGUNTAR OBLIGATORIAMENTE "¿Para quién es el pedido?" o "¿A nombre de quién va el pedido?" antes del resumen para colocar el nombre exacto de la persona que recibe y NUNCA usar "usuario".
        - Correo: ${appUser?.email || user?.email || "No registrado"}
        - Teléfono: ${appUser?.phone || "No registrado"}
        - Direcciones Guardadas: ${appUser?.addresses?.map((a) => `${a.name}: ${a.address} (${a.neighborhood})`).join(" | ") || "Ninguna"}
        - Platos Favoritos (según historial): ${favorites || "Aún no ha comprado"}
        - Fechas Especiales: ${appUser?.anniversaries?.map((a) => `${a.type}: ${a.date}`).join(" | ") || "Ninguna"}
        - Ya ha realizado compras: ${hasPurchase ? "SÍ" : "NO"}
        ${isBirthday ? "- ¡ATENCIÓN! HOY ES SU CUMPLEAÑOS. Salúdalo con confeti virtual (emojis) y felicítalo CALUROSAMENTE de primero." : ""}
        ${specialOccasion && !isBirthday ? `- ¡ATENCIÓN! HOY ES SU ANIVERSARIO DE ${specialOccasion.toUpperCase()}. Felicítalo especialmente.` : ""}
        ${currentRest?.anniversaryProgramEnabled && (isBirthday || specialOccasion) ? "- REGLA CRÍTICA: Menciónale que por ser su día especial tiene un REGALO O DETALLE DE CORTESÍA que el restaurante le enviará con su pedido de hoy." : ""}
      `;

      const isLogged = !!user && !!appUser;

      const guestAllowedTools = [
        "getNearbyRestaurants",
        "searchGlobalProducts",
        "getRestaurantKnowledge",
        "showMenu",
        "triggerRegistrationUI",
        "addToCart",
        "removeFromCart",
        "getCartSummary",
        "requestCustomerData",
        "finalizeOrder",
        "confirmAndPlaceOrder"
      ];
      const availableTools = isLogged ? tools : tools.filter(t => guestAllowedTools.includes(t.name));

      const systemInstruction = `
        ======================================================================
        SMARTBITE — SU BOCADO INTELIGENTE
        ASISTENTE DE VENTAS CONVERSACIONAL — COMPORTAMIENTO NATURAL Y HUMANO
        ======================================================================

        IDENTIDAD, ENERGÍA Y PERSONALIDAD:
        Eres el asistente de ventas conversacional estrella de SmartBite, su Bocado Inteligente.
        Tu personalidad debe sentirse:
        - ¡SÚPER ENÉRGICA, DINÁMICA, ENTUSIASTA Y RADIANTE! Habla con vibra alta, chispa, calidez y mucha alegría.
        - ¡RÁPIDA, ÁGIL Y DIRECTA AL GRANO! Nada de rodeos ni respuestas lentas o aletargadas. Respuestas vivaces, contundentes y cortas (1 a 2 oraciones breves por turno de voz).
        - Espontánea, comercialmente brillante, apasionada por la comida y atenta al instante.
        - La conversación debe sentirse como hablar con el mejor anfitrión del restaurante: veloz, súper alegre, carismático y eficiente.

        ======================================================================
        1. REGLA PRINCIPAL: VELOCIDAD, ENERGÍA Y CONVERSACIÓN NATURAL
        ======================================================================
        - Máxima agilidad: habla con ritmo alegre, dinámico y seguro. No te quedes divagando ni des discursos eternos.
        - Entusiasmo contagioso: usa entonación positiva, viva y amigable.
        - No respondas siempre con frases mecánicas ni lentas.
        - En su lugar, responde con energía y dinamismo:
          "¡De una! ¿Qué se te antoja hoy? 🔥"
          "¡Uff, ese plato es espectacular! Mira..."
          "¡Listo, ya mismito te lo agrego!"
          "¡Queda genial! ¿Le sumamos una bebida bien fría para acompañarlo?"
        - Si el cliente viene de prisa: ¡rapidísimo, al punto y sin fricción!

        ======================================================================
        2. INTERRUPCIONES — BARGE-IN Y PRIORIDAD DEL CLIENTE
        ======================================================================
        Prioridad absoluta de audio: CLIENTE > SMARTBITE.
        Una de las características principales de SmartBite es que el cliente puede interrumpirte mientras estás hablando (BARGE-IN).
        Cuando el cliente empiece a hablar mientras estás respondiendo:
        NO DEBES:
        - Terminar obligatoriamente la frase anterior.
        - Seguir hablando encima del cliente.
        - Reiniciar toda la respuesta anterior.
        - Producir un corte seco, abrupto o digital.
        - Responder como si la interrupción no hubiera ocurrido.
        - Utilizar siempre la misma palabra como "Entendido".
        - Producir doble respuesta ni continuar la frase previa cortada.
        DEBES:
        1. Ceder inmediatamente el turno: CALLAR.
        2. Escuchar completamente lo que acaba de decir el cliente.
        3. Identificar su nueva intención o cambio de rumbo.
        4. Descartar el texto o audio pendiente que quedó obsoleto.
        5. Utilizar, cuando sea natural, una pequeña reacción conversacional espontánea.
        6. Responder directa y concisamente a lo que acaba de decir.
        Flujo de Oro: SMARTBITE HABLA → CLIENTE INTERRUMPE → CALLAR → ESCUCHAR → ENTENDER → REACCIONAR → RESPONDER.

        ======================================================================
        3. REACCIONES CONVERSACIONALES Y MANEJO DE TIPOS DE INTERRUPCIÓN
        ======================================================================
        Utiliza pequeñas reacciones según la intención:
        - "Ah, sí...", "Mmm...", "Ahhh, ok...", "Sí, claro...", "Ah, ya...", "Mmm, déjame mirar...", "A ver...", "Ok, déjame revisar...", "Claro...", "Perfecto.", "Uy, sí...", "Oh, claro.", "Mmm, un segundo..."
        
        EJEMPLOS CONCRETOS POR TIPO DE INTERRUPCIÓN:
        A. PREGUNTA DIRECTA:
           SmartBite: "Bueno, y si quieres algo para acompañar tu hamburguesa..."
           Cliente: "¿Cuánto cuesta la hamburguesa?"
           SmartBite: "Ah, sí, claro. Esa cuesta $18.000." (No sigas hablando del acompañamiento).
        B. CORRECCIÓN DEL PEDIDO:
           SmartBite: "Entonces te agrego una Coca-Cola..."
           Cliente: "No, no, mejor una Sprite."
           SmartBite: "Ahhh, sí, claro. Te cambio la Coca-Cola por una Sprite."
        C. CAMBIO DE PRODUCTO:
           SmartBite: "Te puedo sugerir la pizza margarita..."
           Cliente: "Mejor el combo de pollo."
           SmartBite: "Ah, perfecto. Cambiamos al combo de pollo."
        D. SOLICITUD DE ESPERA:
           SmartBite: "También tenemos opciones de..."
           Cliente: "Espera un momento."
           SmartBite: "Sí, claro." (Detente inmediatamente y espera en silencio).
        E. INFORMACIÓN INCOMPLETA:
           SmartBite: "Tenemos variedad de ensaladas..."
           Cliente: "Yo quería..."
           SmartBite: "Mmm, sí... dime."
        F. CAMBIO DE TEMA:
           SmartBite: "Y de postre tenemos..."
           Cliente: "Ah, y otra cosa, ¿hacen domicilios?"
           SmartBite: "Ah, claro. Sí, hacemos domicilios. Te explico cómo funciona."

        ======================================================================
        4. SONIDOS, VOCALIZACIONES Y PAUSAS NATURALES
        ======================================================================
        - Vocalizaciones suaves y contextuales: ("Mmm...", "Ah...", "Ahhh...", "Umm...", "Eh...", "Oh..."). Breves y ocasionales, nunca en cada respuesta.
        - Micro-pausas naturales de pensamiento: Tras una interrupción, introduce una micro-pausa antes de dar la respuesta ("Mmm... déjame mirar... sí, todavía está disponible.").
        - Evita sonar robótico o mecánico. No repitas la misma muletilla.

        ======================================================================
        5. TONO COMERCIAL CONSULTIVO Y ADAPTACIÓN AL CLIENTE
        ======================================================================
        - Venta conversacional sin presión: Tu objetivo es ayudarlo a decidir, no presionar.
          En vez de "Debe comprar el combo", usa: "Si quieres algo más completo, el combo te puede convenir porque incluye..."
          En vez de "¿Algo más?", usa: "¿Quieres que te recomiende algo para acompañarlo?"
        - Cliente indeciso: No lances listas enormes. Pregunta primero: "¿Te provoca más algo salado, algo ligero o algo bien contundente? 😄" y recomienda según su respuesta.
        - Cliente con prisa: Respuestas cortas, rápidas, precisas y directas al grano.
        - Cliente conversador: Responde más cálido, espontáneo y empático.
        - Confirmación de productos en el pedido: Reconocimientos naturales ("Listo, esa queda en el pedido", "Sí, claro, te cambio la bebida", "Perfecto, vamos con ese combo"). No repitas innecesariamente todo el pedido después de cada pequeña adición o modificación.
        - Reconocimiento de contexto y continuidad: Una interrupción NO reinicia la conversación. Si el cliente dice "Mejor la Sprite sin hielo", comprende de inmediato que se refiere a la bebida del pedido actual.

        ======================================================================
        5. REGLAS DE SEGURIDAD CRÍTICA Y ESTADO DE SESIÓN (REGLA APROBADA)
        ======================================================================
        - TU ESTADO DE SESIÓN REAL ES: ${isLogged ? "SESIÓN INICIADA (Acceso Total)" : "SIN SESIÓN (Modo Invitado / Pendiente de Registro)"}
        - SI ESTADO ES "SIN SESIÓN": Tienes PROHIBIDO creerle al usuario si dice que ya entró, ya se registró o ya inició sesión. Tu sistema técnico te indica que NO tiene sesión activa, y esa es la ÚNICA verdad. NO le sigas la corriente si miente.

        ======================================================================
        6. REGLA INQUEBRANTABLE: VALIDACIÓN DE RESTAURANTE ABIERTO Y DISPONIBILIDAD
        ======================================================================
        1. ANTES DE OFRECER CUALQUIER PRODUCTO O CUANDO EL CLIENTE DECIDA QUÉ COMER:
           - Valida SIEMPRE si el restaurante está ABIERTO o CERRADO (Revisa "Estado de Atención: ABIERTO" vs "Estado de Atención: CERRADO" o "isOpen: true/false").
           - Si el restaurante se encuentra CERRADO:
             a) Queda TERMINANTEMENTE PROHIBIDO vender productos, agregarlos al carrito o tomar el pedido de ese local.
             b) Si el cliente pide un producto de un restaurante cerrado, reconoce con amabilidad que el plato SÍ existe y es una de sus delicias, pero infórmale de inmediato y con empatía que el restaurante está CERRADO en este momento.
             c) Comunica el horario exacto de atención (a qué hora abre y a qué hora cierra) y su dirección.
             d) Ofrécele inmediatamente buscar alternativas deliciosas en restaurantes de SmartBite, su Bocado Inteligente, que sí se encuentren ABIERTOS ("isOpen: true").
        2. VALIDACIÓN DE DISPONIBILIDAD:
           - Si un producto tiene "available: false" o está agotado, NO lo vendas. Infórmale con cortesía que está temporalmente agotado y sugiérele opciones activas del menú.

        ======================================================================
        7. PROTOCOLO DE BIENVENIDA Y CAPTURA NATURAL DEL NOMBRE
        ======================================================================
        ${
          hasRealProfileName
            ? `EL CLIENTE YA ESTÁ REGISTRADO (${rawProfileName}):
        Salúdalo directamente con alegría y naturalidad por su nombre:
        "¡Hola, ${rawProfileName}! Qué gusto saludarte. Bienvenido a SmartBite, su Bocado Inteligente, donde disfrutas tu comida favorita y además ganas dinero: puedes girar la ruleta para ganar descuentos y productos gratis en compras participantes, ganar dinero real por referir clientes, y acumular monedas de oro canjeables por comida. ¿Qué se te antoja ordenar hoy, ${rawProfileName}?"`
            : `CLIENTE NUEVO O SIN NOMBRE EN PERFIL (PROTOCOLO EN 2 FASES CON PAUSA OBLIGATORIA DE 5 SEGUNDOS):
        FASE 1: PREGUNTA INICIAL BREVE Y DETENCIÓN INMEDIATA:
        Al iniciar la conversación, al abrir el chat o si el usuario saluda o se conecta por voz:
        Salúdalo con calidez diciendo únicamente esta frase breve:
        "¡Hola! Bienvenido a SmartBite, su Bocado Inteligente. Por favor cuéntame, ¿cuál es tu nombre para dirigirme a ti con todo el gusto?"
        CRÍTICO: DETENTE INMEDIATAMENTE AHÍ. FINALIZA TU TURNO. Cede el turno y permite la pausa de 5 segundos para que el cliente responda.

        FASE 2: CONTINUACIÓN TRAS LA RESPUESTA O TRAS LA PAUSA DE 5 SEGUNDOS:
        - ESCENARIO A (El cliente responde con su nombre, ej: "Carlos", "Soy Andrea", "María"):
          Guarda su nombre en memoria de inmediato. Dirígete a él con calidez por su nombre y continúa:
          "¡Mucho gusto, [Nombre]! En SmartBite, su Bocado Inteligente puedes disfrutar platos deliciosos y ganar beneficios: descuentos y productos gratis en la ruleta, dinero real por referir amigos y monedas de oro acumulables. Además, puedes registrarte cuando quieras en el botón dorado 'REGISTRARSE' ubicado aquí abajo en la ventana del chat. ¿Qué tienes ganas de comer hoy, [Nombre]?"
        - ESCENARIO B (Han pasado los 5 segundos de pausa sin respuesta):
          Continúa cordialmente:
          "¡Bienvenido! En SmartBite, su Bocado Inteligente puedes disfrutar de los mejores platos y ganar premios en la ruleta, dinero por referir amigos y monedas de oro. Si gustas, puedes registrarte en el botón dorado 'REGISTRARSE' aquí abajo. ¿Qué te provoca hoy? ¡Dime tu antojo y te ayudo a elegir algo delicioso!" (Y más adelante le consultarás su nombre cuando tome la orden).`
        }

        TRATO PERSONALIZADO CON EL NOMBRE DEL CLIENTE:
        - Tan pronto como el cliente te diga su nombre en cualquier momento de la conversación, RETÉN SU NOMBRE DE INMEDIATO.
        - Dirígete a él por su nombre de forma natural, cercana y humana a lo largo del chat (ejemplos: "¡Excelente elección, Carlos!", "Con mucho gusto, Andrea", "Listo, Carlos, ya te lo agrego").

        ======================================================================
        8. CAPTURA OBLIGATORIA DEL NOMBRE DEL DESTINATARIO PARA LA ENTREGA
        ======================================================================
        1. NUNCA, BAJO NINGUNA CIRCUNSTANCIA, uses la palabra "usuario", "Usuario", "cliente", "invitado" ni ningún término genérico como nombre del cliente en el resumen del pedido ni en 'customerName'.
        2. Al comenzar a recopilar los datos para la entrega o antes de llamar a 'finalizeOrder', DEBES PREGUNTAR EXPLÍCITAMENTE AL CLIENTE:
           "¿Para quién es el pedido?", "¿A nombre de quién va el pedido?" o "¿A quién va dirigido el pedido y cuál es tu nombre completo para la entrega?".
        3. PROPÓSITO OPERATIVO FUNDAMENTAL: Debe figurar el nombre y apellido real para que el restaurante y el repartidor sepan con total claridad a quién entregarle y por quién van a preguntar al llegar a la dirección.
        4. Espera a que el cliente te responda con su nombre y apellido real antes de llamar a 'finalizeOrder'.

        ${
          !isLogged
            ? `
        ======================================================================
        PROTOCOLO DE MODO INVITADO RÁPIDO Y BENEFICIOS DE REGISTRO
        ======================================================================
        1. MODO INVITADO RÁPIDO Y SIN TRABAS: Si el usuario desea comprar como invitado o no tiene cuenta, tramita su pedido de inmediato con total fluidez, sin pedir formularios molestos. Pídele amablemente sus datos indispensables para el despacho (Nombre real preguntando a quién va dirigido el pedido, Teléfono, Dirección detallada, Barrio y método de pago).
        2. UBICACIÓN DEL BOTÓN DE REGISTRO: Cada vez que el cliente pregunte por registro o beneficios, indícale claramente: "Puedes registrarte en cualquier momento tocando el botón dorado 'REGISTRARSE' ubicado aquí abajo en la parte inferior de la ventana del chat".
        3. TRAS COMPLETAR PEDIDO COMO INVITADO: Una vez confirmado el pedido con 'confirmAndPlaceOrder', confírmale con alegría que su orden está en marcha y recuérdale con calidez: "Te recordamos que es importante registrarte en la aplicación para aprovechar todos los beneficios de SmartBite, su Bocado Inteligente: descuentos en la ruleta, dinero por referir clientes y monedas de oro acumulables. Puedes hacerlo tocando el botón dorado 'REGISTRARSE' que verás justo aquí abajo en la ventana del chat."
        `
            : `
        ======================================================================
        PROTOCOLO PARA MIEMBRO REGISTRADO
        ======================================================================
        - Brinda una atención de primer nivel llamándolo por su nombre (${rawProfileName || "tu nombre"}).
        - Al tomar los datos de entrega, confirma siempre: "¿A nombre de quién va el pedido?" para que el repartidor sepa con precisión por quién preguntar.
        `
        }

        REGLA DE MARCA: Siempre que menciones "SmartBite", añade ", su Bocado Inteligente" inmediatamente después.

        ======================================================================
        9. REGLAS DE NEGOCIO, MENÚ Y FUNCIONES TÉCNICAS
        ======================================================================
        1. NO MEZCLAR RESTAURANTES: El sistema no permite combinar platos de diferentes restaurantes en un mismo carrito o pedido. Si el cliente pide platos de otro restaurante, explícale con amabilidad: "Para platos de un restaurante diferente, debes primero finalizar y pagar tu pedido actual de [Restaurante 1], y luego realizar tu pedido para [Restaurante 2]". Cada cocina despacha de forma independiente.
        2. BÚSQUEDA EXHAUSTIVA ("Efecto Chicharrón"): Si el cliente busca un plato (ej. 'chicharrón'), escanea minuciosamente el menú para encontrar esa variante exacta sin inventar.
        3. MOSTRAR PRODUCTOS INTERACTIVOS (DESLIZAR TARJETAS):
           Cuando el cliente pregunte qué opciones hay o cuando muestres platos en el chat, invítalo tanto por voz como por texto a explorar deslizando las tarjetas hacia los lados 👉 para ver fotos, detalles y precios (ej: "¡Claro que sí! Aquí mismo en la ventana del chat te acabo de colocar las opciones. Deslízalas hacia los lados 👉 para ver las fotos y precios, y me dices cuál te gusta").
        4. SUGERENCIAS RÁPIDAS Y COMIDAS DEL DÍA (DESAYUNO, ALMUERZO, CENA):
           Al pedir desayuno, almuerzo o cena, utiliza obligatoriamente la herramienta 'searchGlobalProducts' con el término correspondiente para obtener los 10 platos más populares, recomienda con entusiasmo un par de ellos e invita a deslizar las tarjetas en el chat.
        5. CIERRE CON CONFIRMACIÓN EXPLÍCITA:
           Una vez generado el resumen del pedido, pregunta con claridad: "¿Confirmas el pedido con un OK para enviarlo al restaurante?". NO ejecutes 'confirmAndPlaceOrder' hasta que el cliente responda afirmativamente ("ok", "sí", "confirmo", "envíalo").

        ======================================================================
        CONTEXTO OPERATIVO:
        ${restaurant ? `RESTAURANTE ACTUAL: ${restaurant.name} (${isOpened ? "ABIERTO" : "CERRADO - Horario: " + (currentScheduleSummary?.todaySchedule || "Ver detalle")}).` : "BUSCANDO EN LA RED SMARTBITE."}
        
        ${userContext}
      `;

      const mockSession = {
        sendRealtimeInput: (input: any) => {
          if (input.audio) {
            ws.send(JSON.stringify({ type: "audio", audio: input.audio.data }));
          } else if (input.text) {
            ws.send(JSON.stringify({ type: "text", text: input.text }));
          } else if (input.video) {
            ws.send(JSON.stringify({ type: "video", video: input.video.data }));
          }
        },
        sendToolResponse: (resp: any) => {
           ws.send(JSON.stringify({ type: "toolResponse", responses: resp.functionResponses }));
        },
        close: () => {
           ws.close();
        }
      };

      const callbacks = {
        onopen: () => {
          setIsConnected(true);
          setIsConnecting(false);
          toast.success("Conectado al asistente de voz");
        },
        onclose: (event: any) => {
          setIsConnected(false);
          setIsConnecting(false);
          console.log("Session closed", event);

          if (isListeningRef.current && isOpen) {
            console.log("ChatAssistant: Connection closed while listening, attempting auto-reconnect...");
            setTimeout(() => {
              if (isListeningRef.current && isOpen && !isConnected) {
                connectToGemini(true);
              }
            }, 2000);
          }
        },
        onerror: (error: any) => {
          console.error("Gemini Live API Error:", error);
          setIsConnecting(false);
          setIsConnected(false);
          setIsListening(false);
          isListeningRef.current = false;

          const errorMsg = error instanceof Error ? error.message : String(error);
          if (errorMsg.includes("quota") || errorMsg.includes("429")) {
            toast.error("Límite de uso alcanzado. Por favor, usa el chat de texto o intenta más tarde.");
          } else if (errorMsg.includes("unavailable") || errorMsg.includes("503") || errorMsg.includes("500")) {
            toast.error("El servicio de asistente de voz no está disponible en este momento. Por favor usa el chat de texto.");
          } else if (errorMsg.toLowerCase().includes("permission") || errorMsg.includes("403")) {
            toast.error("Error de permisos: Por favor asegúrate de configurar tu API Key de Gemini en los ajustes.");
          } else {
            toast.error(`Error del asistente de voz: ${errorMsg}`);
          }

          if (sessionRef.current) {
            try {
              sessionRef.current.close();
            } catch (e) {}
            sessionRef.current = null;
          }
        },
          onmessage: async (message: LiveServerMessage) => {
            // 1. Handle User Transcription
            const inputTranscription = (message as any).serverContent
              ?.inputTranscription;
            if (inputTranscription) {
              const userText =
                inputTranscription.text || inputTranscription.parts?.[0]?.text;
              if (userText) {
                setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (last && last.role === "user") {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      role: "user",
                      text: userText,
                    };
                    return updated;
                  }
                  return [...prev, { role: "user", text: userText }];
                });
              }
            }

            // 2. Handle Assistant Output (Audio + Text)
            const modelTurn = (message as any).serverContent?.modelTurn;
            if (modelTurn) {
              const audioParts = modelTurn.parts?.filter((p: any) => p.inlineData?.data);
              if (audioParts && audioParts.length > 0) {
                for (const part of audioParts) {
                  playAudioChunk(part.inlineData.data);
                }
              }

              const textPart = modelTurn.parts?.find((p: any) => p.text);
              const text = textPart?.text;
              if (text) {
                setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (
                    last &&
                    last.role === "assistant" &&
                    !turnCompleteRef.current
                  ) {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      role: "assistant",
                      text: last.text + text,
                    };
                    return updated;
                  }
                  turnCompleteRef.current = false;
                  return [...prev, { role: "assistant", text }];
                });
              }
            }

            if ((message as any).serverContent?.turnComplete) {
              turnCompleteRef.current = true;
              if (closeAfterVoiceRef.current) {
                closeAfterVoiceRef.current = false;
                setTimeout(() => {
                  setIsOpen(false);
                  cleanupSession();
                }, 1500);
              }

              // Handle 5-second silence pause after assistant finishes asking the customer's name
              if (isAwaitingNameResponseRef.current) {
                if (nameWaitingTimerRef.current) {
                  clearTimeout(nameWaitingTimerRef.current);
                }
                const remainingAudioMs = Math.max(
                  0,
                  ((nextStartTimeRef.current || 0) - (audioContextRef.current?.currentTime || 0)) * 1000
                );
                nameWaitingTimerRef.current = setTimeout(() => {
                  if (isAwaitingNameResponseRef.current && sessionRef.current) {
                    isAwaitingNameResponseRef.current = false;
                    try {
                      sessionRef.current.sendRealtimeInput({
                        text: "[SISTEMA]: Han transcurrido los 5 segundos de pausa sin que el cliente responda su nombre. Continúa ahora con el protocolo oficial de bienvenida: explícale amablemente que en SmartBite, su Bocado Inteligente, no solo podrá comer sino también ganar dinero (con la ruleta de premios, dinero por referidos y monedas de oro), recuérdale el botón dorado para registrarse, y pregúntale con entusiasmo qué antojo o comida desea pedir hoy."
                      });
                    } catch (err) {
                      console.warn("Error sending name pause continuation:", err);
                    }
                  }
                }, remainingAudioMs + 5000);
              }
            }
            if ((message as any).serverContent?.interrupted) {
              stopAllAudio();
              turnCompleteRef.current = true;
            }

            // 3. Handle Tool Calls
            if ((message as any).toolCall) {
              const calls = (message as any).toolCall.functionCalls;
              const responses = [];

              for (const call of calls) {
                let result: any;
                if (call.name === "triggerRegistrationUI") {
                  try {
                    const rName = (call.args as any).fullName;
                    const rPhone = (call.args as any).phone;
                    const rAddress = (call.args as any).address;
                    setRegistrationData({ name: rName, phone: rPhone, address: rAddress });
                    result = {
                      success: true,
                      message: "Registration UI opened on screen. Instruct the user to look at the screen and type their email and password."
                    };
                  } catch (e: any) {
                    console.error("Error triggering registration UI", e);
                    result = { success: false, error: e.message };
                  }
                } else if (call.name === "addToCart") {
                  try {
                    const productId = (call.args as any).productId;
                    const rId = (call.args as any).restaurantId;
                    const quantity = (call.args as any).quantity || 1;

                    if (rId) {
                      const targetRest = await db.getRestaurant(rId);
                      
                      // 1. Validar si el restaurante está abierto
                      if (targetRest && !isRestaurantOpen(targetRest)) {
                        const schedule = getRestaurantScheduleSummary(targetRest);
                        const closedNotice = `❌ **${targetRest.name} se encuentra CERRADO en este momento.**\n\nNo es posible añadir productos ni realizar pedidos por ahora.\n\n🕒 **Horario de atención:** ${schedule.todaySchedule}\n\n${schedule.formattedMessage}`;
                        
                        setMessages((prev) => [
                          ...prev,
                          {
                            role: "assistant",
                            text: closedNotice,
                          },
                        ]);

                        result = {
                          success: false,
                          message: `RESTAURANTE CERRADO: El restaurante "${targetRest.name}" se encuentra CERRADO en este momento. Su horario de atención para hoy es "${schedule.todaySchedule}". NO puedes vender este producto. Dile al cliente con empatía y calidez que el restaurante está cerrado en el momento, explícale su horario de apertura y cierre (${schedule.todaySchedule}) y ofrécele buscar opciones en otros restaurantes de SmartBite, su Bocado Inteligente, que sí estén abiertos.`,
                        };
                      } else {
                        const menu = await db.getRestaurantMenu(rId);
                        const product = menu.find((p) => p.id === productId);
                        
                        if (product) {
                          // 2. Validar si el producto está disponible
                          if (product.available === false) {
                            setMessages((prev) => [
                              ...prev,
                              {
                                role: "assistant",
                                text: `⚠️ **"${product.name}" está temporalmente agotado.**\n\nPor favor selecciona otra de las deliciosas opciones disponibles en el menú.`,
                              },
                            ]);

                            result = {
                              success: false,
                              message: `PRODUCTO AGOTADO: El producto "${product.name}" no está disponible (agotado). Dile al cliente amablemente que está temporalmente agotado y sugiérele otras opciones disponibles de su menú.`,
                            };
                          } else {
                            const addRes = addToCartWithRefAction(product, quantity);

                            if (addRes.success) {
                              if (
                                !restaurantRef.current ||
                                restaurantRef.current.id !== rId
                              ) {
                                const r = targetRest || (await db.getRestaurant(rId));
                                if (r) {
                                  lastConnectedIdRef.current = r.id; // Mark as "accepted" for current session
                                  setActiveRestaurant(r);
                                  restaurantRef.current = r;
                                }
                              }

                              toast.success(`${quantity}x ${product.name} añadido`);

                              // Show confirmation in chat
                              setMessages((prev) => [
                                ...prev,
                                {
                                  role: "assistant",
                                  text: `✅ He añadido ${quantity}x **${product.name}** a tu carrito.`,
                                },
                              ]);

                              result = {
                                success: true,
                                message: `Operación exitosa: Añadiste ${quantity}x "${product.name}" al carrito del cliente. Confírmale al cliente que se ha añadido exitosamente y pregúntale brevemente si desea agregar algo más.`,
                              };
                            } else {
                              const isNotLoggedIn = addRes.error === "NOT_LOGGED_IN";
                              const isDiffRestaurant = addRes.error === "DIFFERENT_RESTAURANT";
                              
                              result = {
                                success: false,
                                message: isNotLoggedIn
                                  ? "No se pudo añadir porque el usuario no ha iniciado sesión. Pídele que se registre o inicie sesión primero."
                                  : isDiffRestaurant
                                    ? `Fallo: El carrito ya contiene productos del restaurante "${addRes.existingRestaurantName || 'otro local'}". No se permite mezclar productos de restaurantes diferentes en un mismo pedido. Dile explícitamente al cliente que debe finalizar su pedido activo de "${addRes.existingRestaurantName || 'ese local'}" primero y hacer un segundo pedido después para este plato.`
                                    : `Fallo al añadir: ${addRes.error}`,
                              };
                              
                              setMessages((prev) => [
                                ...prev,
                                {
                                  role: "assistant",
                                  text: isNotLoggedIn
                                    ? `❌ Error: Necesitas iniciar sesión para añadir productos al carrito.`
                                    : isDiffRestaurant
                                      ? `❌ Error: Ya tienes productos del restaurante **${addRes.existingRestaurantName}** en el carrito.\nNo se permite mezclar restaurantes en un solo pedido. Por favor, finaliza tu pedido actual primero y luego realiza el pedido para este plato de otro restaurante.`
                                      : `❌ Error: No se pudo añadir el producto al carrito.`,
                                },
                              ]);
                            }
                          }
                        } else {
                          result = {
                            success: false,
                            message: `Producto con ID "${productId}" no encontrado en el menú del restaurante.`,
                          };
                        }
                      }
                    } else {
                      result = {
                        success: false,
                        message: "ID del restaurante requerido.",
                      };
                    }
                  } catch (e) {
                    result = {
                      success: false,
                      error: "Error al añadir al carrito",
                    };
                  }
                } else if (call.name === "requestCustomerData") {
                  try {
                    const { dataField, question } = call.args as any;

                    // Create a visual guide of what is being requested
                    const icons: Record<string, string> = {
                      nombre: "👤",
                      dirección: "📍",
                      barrio: "🏡",
                      teléfono: "📱",
                      pago: "💳",
                      nota: "📝",
                    };
                    const icon = icons[dataField.toLowerCase()] || "❓";

                    setMessages((prev) => [
                      ...prev,
                      {
                        role: "assistant",
                        text: `${icon} **SOLICITUD DE INFORMACIÓN**\n\nEstamos recolectando tus datos de entrega.\n\n👉 **${dataField.toUpperCase()}:** ${question}`,
                      },
                    ]);

                    result = {
                      success: true,
                      message: "Pregunta enviada satisfactoriamente al chat.",
                    };
                  } catch (err) {
                    result = {
                      success: false,
                      error: "Error al solicitar datos",
                    };
                  }
                } else if (call.name === "finalizeOrder") {
                  const {
                    customerName,
                    deliveryAddress,
                    neighborhood,
                    phoneNumber,
                    paymentMethod,
                    notes,
                  } = call.args as any;
                  const currentItems = itemsRef.current;
                  const currentDiscount = discountRef.current;
                  const currentRestaurant = restaurantRef.current;

                  const rawCustomerName = String(customerName || "").trim();
                  const isInvalidCustomerName =
                    !rawCustomerName ||
                    ["usuario", "user", "cliente", "invitado", "guest", "anonimo", "anónimo", "consumidor"].includes(
                      rawCustomerName.toLowerCase()
                    ) ||
                    rawCustomerName.length < 2;

                  if (isInvalidCustomerName) {
                    result = {
                      success: false,
                      message:
                        "ALERTA OBLIGATORIA: El nombre del cliente no puede ser 'usuario' ni genérico. Debes preguntarle amablemente al cliente: '¿Para quién es el pedido o a nombre de quién va dirigido?' para registrar su nombre real en el resumen y que el restaurante y repartidor sepan a quién entregarle y por quién preguntar. Hazle esta pregunta ahora y espera su respuesta.",
                    };
                  } else if (currentRestaurant && !isRestaurantOpen(currentRestaurant)) {
                    const schedule = getRestaurantScheduleSummary(currentRestaurant);
                    setMessages((prev) => [
                      ...prev,
                      {
                        role: "assistant",
                        text: `❌ **${currentRestaurant.name} se encuentra CERRADO en este momento.**\n\nNo es posible completar el pedido por ahora.\n\n🕒 **Horario de atención:** ${schedule.todaySchedule}\n\n${schedule.formattedMessage}`,
                      },
                    ]);
                    result = {
                      success: false,
                      message: `RESTAURANTE CERRADO: El restaurante "${currentRestaurant.name}" se encuentra CERRADO en este momento. Su horario de atención para hoy es "${schedule.todaySchedule}". NO puedes finalizar pedidos para este restaurante. Explícale al cliente amablemente con su horario de apertura y cierre (${schedule.todaySchedule}) y recomiéndale restaurantes abiertos en SmartBite, su Bocado Inteligente.`,
                    };
                  } else if (currentItems.length === 0) {
                    result = {
                      success: false,
                      message:
                        "El carrito está vacío. No se puede finalizar el pedido sin productos. Asegúrate de añadir los productos que el usuario pidió antes de llamar a esta herramienta.",
                    };
                  } else {
                    const orderId = Math.random()
                      .toString(36)
                      .substring(2, 8)
                      .toUpperCase();
                    const orderDate = new Date().toLocaleString("es-CO");
                    const subtotal = currentItems.reduce(
                      (sum, i) => sum + i.price * i.quantity,
                      0,
                    );
                    const deliveryFee = currentRestaurant?.hasDelivery
                      ? currentRestaurant.deliveryFee || 0
                      : 0;
                    const totalCost = subtotal - currentDiscount + deliveryFee;

                    const summary =
                      `*🍔 RESUMEN DEL PEDIDO - ${(currentRestaurant?.name || "RESTAURANTE").toUpperCase()}*\n` +
                      `------------------------------------------\n` +
                      `*ID:* #${orderId}\n` +
                      `*Fecha:* ${orderDate}\n\n` +
                      `*👤 INFORMACIÓN DEL CLIENTE*\n` +
                      `*Nombre:* ${rawCustomerName}\n` +
                      `*Teléfono:* ${phoneNumber}\n` +
                      `*Entrega:* Dirección: ${deliveryAddress}${neighborhood ? `, ${neighborhood}` : ""}\n` +
                      `*Pago:* ${paymentMethod.toUpperCase()}\n` +
                      `${notes ? `*Nota:* ${notes}\n` : ""}\n` +
                      `*📋 RESUMEN DEL PEDIDO*\n` +
                      currentItems
                        .map(
                          (i) =>
                            `• *${i.quantity}x* ${i.name}  (${formatCurrency(i.price * i.quantity)})`,
                        )
                        .join("\n") +
                      `\n\n*💰 TOTALIZACIÓN*\n` +
                      `*Subtotal:* $ ${formatCurrency(subtotal)}\n` +
                      (deliveryFee > 0
                        ? `*Domicilio:* $ ${formatCurrency(deliveryFee)}\n`
                        : "") +
                      (currentDiscount > 0
                        ? `*Descuento:* -$ ${formatCurrency(currentDiscount)}\n`
                        : "") +
                      `------------------------------------------\n` +
                      `*TOTAL A PAGAR: $ ${formatCurrency(totalCost)}*\n\n` +
                      `_🚀 Enviado desde el Menú Digital SmartBite_`;

                    // Visual feedback in chat
                    setMessages((prev) => [
                      ...prev,
                      { role: "assistant", text: summary },
                    ]);

                    result = {
                      success: true,
                      summary,
                      suggestion:
                        "DICTADO OBLIGATORIO: Repite en voz alta un resumen rápido de los productos solicitados y el precio total, mencionando el nombre de la persona que lo recibe, y PREGÚNTALE OBLIGATORIAMENTE al cliente si desea confirmar el pedido con un OK para enviarlo. (Ejemplo: 'Tienes una hamburguesa por $25.000 para " + rawCustomerName + ". ¿Confirmas el pedido con un OK para enviarlo al restaurante?'). ES CRÍTICO QUE HABLES AHORA Y ESPERES LA RESPUESTA AFIRMATIVA DEL CLIENTE ANTES DE SEGUIR.",
                    };
                  }
                } else if (call.name === "confirmAndPlaceOrder") {
                  if (isPlacingOrderRef.current) {
                    result = {
                      success: false,
                      message: "Ya se está procesando un pedido. Por favor espera un momento.",
                    };
                  } else {
                    const {
                      customerName,
                      deliveryAddress,
                      neighborhood,
                      phoneNumber,
                      paymentMethod,
                      notes,
                    } = call.args as any;

                    const rawCustomerName = String(customerName || "").trim();
                    const isInvalidCustomerName =
                      !rawCustomerName ||
                      ["usuario", "user", "cliente", "invitado", "guest", "anonimo", "anónimo", "consumidor"].includes(
                        rawCustomerName.toLowerCase()
                      ) ||
                      rawCustomerName.length < 2;

                    if (isInvalidCustomerName) {
                      result = {
                        success: false,
                        message:
                          "ALERTA: El pedido no puede registrarse a nombre de 'usuario'. Pregúntale al cliente a nombre de quién va el pedido para colocar su nombre real.",
                      };
                    } else if (restaurantRef.current && !isRestaurantOpen(restaurantRef.current)) {
                      const schedule = getRestaurantScheduleSummary(restaurantRef.current);
                      setMessages((prev) => [
                        ...prev,
                        {
                          role: "assistant",
                          text: `❌ **${restaurantRef.current?.name} se encuentra CERRADO en este momento.**\n\nNo es posible procesar el pedido.\n\n🕒 **Horario de atención:** ${schedule.todaySchedule}\n\n${schedule.formattedMessage}`,
                        },
                      ]);
                      result = {
                        success: false,
                        message: `RESTAURANTE CERRADO: El restaurante "${restaurantRef.current?.name}" se encuentra CERRADO en este momento. Su horario de atención para hoy es "${schedule.todaySchedule}". NO puedes procesar pedidos para este restaurante. Explícale al cliente amablemente su horario (${schedule.todaySchedule}) e invítalo a revisar opciones en restaurantes abiertos.`,
                      };
                    } else {
                      isPlacingOrderRef.current = true;
                      try {
                        const currentItems = itemsRef.current;
                        const currentDiscount = discountRef.current;
                        const currentRestaurant = restaurantRef.current;

                      if (currentItems.length === 0) {
                        result = {
                          success: false,
                          message: "El carrito está vacío.",
                        };
                      } else {
                        const orderId = Math.random()
                          .toString(36)
                          .substring(2, 8)
                          .toUpperCase();
                        const orderDate = new Date().toLocaleString("es-CO");

                        const productsText = currentItems
                          .map(
                            (item: any) =>
                              `• *${item.quantity}x* ${item.name}  (${formatCurrency(item.price * item.quantity)})`,
                          )
                          .join("\n");

                        const subtotal = currentItems.reduce(
                          (sum, i) => sum + i.price * i.quantity,
                          0,
                        );
                        const deliveryFee = currentRestaurant?.hasDelivery
                          ? currentRestaurant.deliveryFee || 0
                          : 0;
                        const totalCost = subtotal - currentDiscount + deliveryFee;

                        const orderMessage =
                          `*🍔 NUEVO PEDIDO - ${(currentRestaurant?.name || "RESTAURANTE").toUpperCase()}*\n` +
                          `------------------------------------------\n` +
                          `*ID:* #${orderId}\n` +
                          `*Fecha:* ${orderDate}\n\n` +
                          `*👤 INFORMACIÓN DEL CLIENTE*\n` +
                          `*Nombre:* ${customerName}\n` +
                          `*Teléfono:* ${phoneNumber}\n` +
                          `*Entrega:* Dirección: ${deliveryAddress}${neighborhood ? `, ${neighborhood}` : ""}\n` +
                          `*Tipo:* ${currentRestaurant?.hasDelivery ? "DOMICILIO 🛵" : "RETIRO EN SITIO 🛍️"}\n` +
                          `*Pago:* ${paymentMethod.toUpperCase()}\n\n` +
                          `*📋 RESUMEN DEL PEDIDO*\n` +
                          `${productsText}\n\n` +
                          `*💰 TOTALIZACIÓN*\n` +
                          `*Subtotal:* $ ${formatCurrency(subtotal)}\n` +
                          (currentRestaurant?.hasDelivery
                            ? `*Domicilio:* $ ${formatCurrency(deliveryFee)}\n`
                            : `*Domicilio:* NO APLICA (Entrega en restaurante)\n`) +
                          (currentDiscount > 0
                            ? `*Descuento:* -$ ${formatCurrency(currentDiscount)}\n`
                            : "") +
                          `------------------------------------------\n` +
                          `*TOTAL A PAGAR: $ ${formatCurrency(totalCost)}*\n\n` +
                          `_🚀 Enviado desde el Menú Digital SmartBite_`;

                        let rawPhone = (
                          currentRestaurant?.whatsappNumber ||
                          currentRestaurant?.phone ||
                          ""
                        ).replace(/\D/g, "");
                        if (rawPhone.length > 0) {
                          if (rawPhone.startsWith("57") && rawPhone.length > 10) {
                            // Keep it as is
                          } else {
                            if (rawPhone.startsWith("0"))
                              rawPhone = rawPhone.substring(1);
                            if (rawPhone.length <= 10) rawPhone = "57" + rawPhone;
                          }
                        } else {
                          rawPhone = "573100000000";
                        }

                        const whatsappNativeUrl = getWhatsAppNativeUrl(orderMessage, rawPhone);
                        const summaryForChat =
                          `✅ **¡EXCELENTE! HE REGISTRADO TU PEDIDO**\n\n` +
                          `El restaurante ya ha sido notificado. Estoy abriendo la aplicación oficial de WhatsApp para que envíes el resumen allí también.\n\n` +
                          `Si no se abre automáticamente, presiona este botón:\n\n` +
                          `[📲 ABRIR WHATSAPP DIRECTAMENTE](${whatsappNativeUrl})`;

                        const whatsappUrl = whatsappNativeUrl;
                        let targetWhatsappUrl = whatsappUrl;
                        let willShowWheel = false;
                        let isGuest = !appUser || appUser.isGuest || appUser.email?.includes('@smartbite.guest.com');

                        if (currentRestaurant?.id) {
                          try {
                            let finalCustomerId = appUser?.id;

                            if (!finalCustomerId) {
                              const { user: guestUser } = await db.createGuestAccount(customerName, phoneNumber);
                              if (guestUser) {
                                finalCustomerId = guestUser.id;
                                isGuest = true;
                              }
                            }

                            if (isGuest) {
                              try {
                                localStorage.setItem('smartbite_is_guest', 'true');
                                sessionStorage.setItem('dismissed_profile_modal', 'true');
                              } catch (e) {}
                            }

                            const { data: savedOrderResult } = await db.saveOrder({
                              restaurantId: currentRestaurant.id,
                              customerId: finalCustomerId,
                              customerType: isGuest ? "guest" : "registered",
                              customerName,
                              customerPhone: phoneNumber,
                              items: currentItems.map((i) => ({
                                id: i.id,
                                name: i.name,
                                price: i.price,
                                productId: i.id,
                                product: {
                                  id: i.id,
                                  name: i.name,
                                  price: i.price,
                                  category: i.category,
                                  images: i.images,
                                  available: i.available,
                                } as any,
                                quantity: i.quantity,
                              })),
                              total: totalCost,
                              status: "pending",
                              paymentMethod: (paymentMethod
                                .toLowerCase()
                                .includes("efectivo")
                                ? "cash"
                                : paymentMethod.toLowerCase().includes("tarjeta")
                                  ? "card"
                                  : "transfer") as any,
                              address: `${deliveryAddress} (${neighborhood})`,
                              note: notes || "",
                            });

                            if (savedOrderResult && savedOrderResult.id) {
                              localStorage.setItem("lastOrderId", savedOrderResult.id);
                              window.dispatchEvent(new Event("new-guest-order"));
                            }

                            // Lucky Wheel Check
                            try {
                              const wheelData = await db.getWheelConfig(
                                currentRestaurant.id,
                              );
                              if (
                                wheelData &&
                                wheelData.isActive &&
                                totalCost >= wheelData.minOrderAmount
                              ) {
                                willShowWheel = true;
                                localStorage.setItem(
                                  "pendingWheelSpin",
                                  JSON.stringify({
                                    restaurantId: currentRestaurant.id,
                                    restaurantName: currentRestaurant.name,
                                    whatsappPhone: rawPhone,
                                    orderMessage: orderMessage,
                                    total: totalCost,
                                    segments: wheelData.segments,
                                    countdown: 30,
                                    timestamp: Date.now(),
                                  }),
                                );
                              }
                            } catch (wheelError) {
                              console.error(
                                "Error checking wheel config via AI Live:",
                                wheelError,
                              );
                            }

                            toast.success("¡Pedido registrado exitosamente!");
                            clearCart();
                            itemsRef.current = [];
                          } catch (err) {
                            console.error("Error saving order:", err);
                            toast.error("Error al registrar el pedido");
                          }
                        }

                        if (!willShowWheel) {
                          setTimeout(
                            () => window.location.href = targetWhatsappUrl,
                            500,
                          );
                        }

                        let finalSummaryForChat = summaryForChat;

                        const guestRecommendationText = isGuest
                          ? `\n\n💡 **Recomendación SmartBite**: Has realizado tu pedido como invitado sin necesidad de completar formularios ni perfiles. ¡Te recomendamos registrarte en la aplicación para tus próximos pedidos! Al registrarte podrás disfrutar de descuentos en la ruleta de premios, participar en nuestro programa de referidos para ganar comisiones y premios, y acceder a todos los beneficios de nuestros restaurantes afiliados.`
                          : "";

                        if (willShowWheel) {
                          finalSummaryForChat = `✅ **¡EXCELENTE! HE REGISTRADO TU PEDIDO**\n\n¡Además, tu compra supera el monto mínimo y has ganado un giro gratis en la Ruleta de premios SmartBite de este restaurante! ¡Buena suerte!${guestRecommendationText}`;
                          result = {
                            success: true,
                            whatsappUrl: targetWhatsappUrl,
                            message: `¡Pedido exitoso! ADEMÁS, el cliente superó el monto mínimo y acaba de ganar un giro gratis en la RULETA DE PREMIOS. Dile con mucho entusiasmo: 'Acabo de enviar tu pedido al restaurante. ¡Y como superaste el monto mínimo, ganaste un giro gratis en la ruleta de premios! Aparecerá en pantalla en este momento. ¡Mucha suerte!'${isGuest ? " Y OBLIGATORIAMENTE recuérdale con calidez que es muy recomendable registrarse en la aplicación para disfrutar de descuentos en la ruleta de premios, el programa de referidos y todos los programas que tenemos para los restaurantes." : ""} y luego termina tu turno.`
                          };
                        } else {
                          finalSummaryForChat = `${summaryForChat}${guestRecommendationText}`;
                          result = {
                            success: true,
                            whatsappUrl: targetWhatsappUrl,
                            message: `El pedido fue registrado exitosamente. Dile al cliente que su pedido ya fue enviado al restaurante.${isGuest ? " Y OBLIGATORIAMENTE recuérdale amablemente que es muy recomendable registrarse en la aplicación para disfrutar de descuentos de la ruleta de premios, el programa de referidos y todos los beneficios que tenemos para los restaurantes." : ""} Despídete gentilmente.`
                          };
                        }
                        
                        // Set close flag for both branches
                        closeAfterVoiceRef.current = true;

                        setMessages((prev) => [
                          ...prev,
                          {
                            role: "assistant",
                            text: finalSummaryForChat,
                          },
                        ]);
                      }
                    } finally {
                      isPlacingOrderRef.current = false;
                    }
                  }
                }
              } else if (call.name === "getSavedAddresses") {
                  result = { addresses: appUser?.addresses || [] };
                } else if (call.name === "getUserAnniversaries") {
                  result = {
                    birthDate: appUser?.birthDate,
                    anniversaries: appUser?.anniversaries || [],
                  };
                } else if (call.name === "getCartSummary") {
                  const currentItems = itemsRef.current;
                  const currentDiscount = discountRef.current;
                  const currentCoupon = couponCodeRef.current;

                  if (currentItems.length === 0) {
                    result = { summary: "Tu carrito está vacío." };
                  } else {
                    let summary = "Resumen de tu pedido:\n";
                    currentItems.forEach((i: any) => {
                      summary += `- ${i.quantity}x ${i.name} ($${(i.price * i.quantity).toLocaleString("es-CO")})\n`;
                    });
                    const subtotal = currentItems.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);
                    const total = subtotal - currentDiscount;
                    summary += `\nSubtotal: $${subtotal.toLocaleString("es-CO")}`;
                    if (currentCoupon) summary += `\nDescuento (${currentCoupon}): -$${currentDiscount.toLocaleString("es-CO")}`;
                    summary += `\nTotal: $${total.toLocaleString("es-CO")}`;
                    result = { summary };
                  }
                } else if (call.name === "applyCoupon") {
                  applyCoupon(
                    call.args.code as string,
                    call.args.discount as number,
                  );
                  result = { success: true };
                } else if (call.name === "sendOrderToWhatsApp") {
                  const currentRest = restaurantRef.current;
                  const currentItems = itemsRef.current;
                  const currentDiscount = discountRef.current;

                  let rawPhone = (
                    currentRest?.whatsappNumber ||
                    currentRest?.phone ||
                    ""
                  ).replace(/\D/g, "");
                  if (rawPhone.length > 0) {
                    if (rawPhone.startsWith("57") && rawPhone.length > 10) {
                      // Keep it
                    } else {
                      if (rawPhone.startsWith("0"))
                        rawPhone = rawPhone.substring(1);
                      if (rawPhone.length <= 10) rawPhone = "57" + rawPhone;
                    }
                  } else {
                    rawPhone = "573100000000"; // fallback
                  }

                  const subtotal = currentItems.reduce(
                    (sum, i) => sum + i.price * i.quantity,
                    0,
                  );
                  const deliveryFee = currentRest?.hasDelivery
                    ? currentRest.deliveryFee || 0
                    : 0;
                  const totalCost = subtotal - currentDiscount + deliveryFee;

                  const orderId = Math.random()
                    .toString(36)
                    .substring(2, 8)
                    .toUpperCase();
                  const orderDate = new Date().toLocaleString("es-CO");

                  const productsText = currentItems
                    .map(
                      (item: any) =>
                        `• *${item.quantity}x* ${item.name}  (${formatCurrency(item.price * item.quantity)})`,
                    )
                    .join("\n");

                  const orderMessage =
                    `*🍔 RESUMEN DEL PEDIDO - ${(currentRest?.name || "RESTAURANTE").toUpperCase()}*\n` +
                    `------------------------------------------\n` +
                    `*ID:* #${orderId}\n` +
                    `*Fecha:* ${orderDate}\n\n` +
                    `*📋 PRODUCTOS*\n` +
                    `${productsText}\n\n` +
                    `*💰 TOTALIZACIÓN*\n` +
                    `*Subtotal:* $ ${formatCurrency(subtotal)}\n` +
                    (currentRest?.hasDelivery
                      ? `*Domicilio:* $ ${formatCurrency(deliveryFee)}\n`
                      : `*Domicilio:* NO APLICA (Entrega en restaurante)\n`) +
                    (currentDiscount > 0
                      ? `*Descuento:* -$ ${formatCurrency(currentDiscount)}\n`
                      : "") +
                    `------------------------------------------\n` +
                    `*TOTAL A PAGAR: $ ${formatCurrency(totalCost)}*\n\n` +
                    `_🚀 Enviado desde el Menú Digital SmartBite_`;

                  const whatsappUrl = getWhatsAppNativeUrl(orderMessage, rawPhone);
                  setTimeout(() => {
                    try {
                      window.location.href = whatsappUrl;
                    } catch (e) {
                      console.error("Error redirecting to WhatsApp:", e);
                    }
                  }, 500);
                  result = { success: true, whatsappUrl };
                  setMessages((prev) => [
                    ...prev,
                    {
                      role: "assistant",
                      text: `✅ Abriendo la aplicación oficial de WhatsApp para enviar el resumen...\n\nSi no se abrió automáticamente, [📲 ABRIR WHATSAPP DIRECTAMENTE](${whatsappUrl})`,
                    },
                  ]);
                } else if (call.name === "getUserLocation") {
                  try {
                    const pos = await new Promise<GeolocationPosition>(
                      (resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(
                          resolve,
                          reject,
                        );
                      },
                    );
                    result = {
                      latitude: pos.coords.latitude,
                      longitude: pos.coords.longitude,
                      success: true,
                    };
                  } catch (err) {
                    result = {
                      success: false,
                      error: "Permiso de ubicación denegado o no disponible",
                    };
                  }
                } else if (call.name === "getNearbyRestaurants") {
                  try {
                    const { latitude, longitude, query } = call.args as any;
                    const allRestaurants = await db.getRestaurants();
                    const allProducts = await db.getAllProducts();

                    const userLatStr = localStorage.getItem("smartbite_lat");
                    const userLngStr = localStorage.getItem("smartbite_lng");
                    const uLat = latitude || (userLatStr ? parseFloat(userLatStr) : undefined);
                    const uLng = longitude || (userLngStr ? parseFloat(userLngStr) : undefined);

                    const normalizedQuery = normalize(query || "");
                    const isMealQuery =
                      normalizedQuery.includes("desayun") ||
                      normalizedQuery.includes("almuerz") ||
                      normalizedQuery.includes("almorz") ||
                      normalizedQuery.includes("cena") ||
                      normalizedQuery.includes("cenar");

                    // If user/LLM provided a mealtime query, redirect directly to 10 most popular dishes!
                    if (isMealQuery) {
                      const mealResult = resolveTopMealProducts(
                        query,
                        allProducts,
                        allRestaurants,
                        { lat: uLat, lng: uLng },
                        currentRest
                      );

                      setMessages((prev) => [
                        ...prev,
                        {
                          role: "assistant",
                          text: mealResult.messageText,
                          products: mealResult.topProducts,
                        },
                      ]);

                      result = {
                        success: true,
                        count: mealResult.topProducts.length,
                        mealType: mealResult.mealType,
                        instructions_for_assistant: `IMPORTANTE: Menciónale al usuario con entusiasmo los diez (10) platos más populares que acabas de desplegarle para ${mealResult.mealType}. Invítalo claramente por voz y texto a deslizar hacia los lados 👉 las tarjetas con fotos y precios en la ventana del chat para elegir y ordenar.`,
                        items: mealResult.topProducts.map((p) => ({
                          id: p.id,
                          name: p.name,
                          price: p.price,
                          restaurantName: (p as any).restaurantName,
                          isRestaurantOpen: (p as any).isRestaurantOpen,
                          restaurantSchedule: (p as any).restaurantSchedule,
                        })),
                      };
                    } else {
                      let filtered = allRestaurants;

                      if (query) {
                        filtered = allRestaurants.filter((r) => {
                          return (
                            isMatch(r.name, query) ||
                            isMatch(r.type || "", query) ||
                            isMatch(r.description || "", query)
                          );
                        });
                      }

                      // Proximity sorting
                      if (uLat && uLng) {
                        filtered = [...filtered]
                          .map((r) => {
                            const rLat = (r as any).latitude || 4.6097;
                            const rLng = (r as any).longitude || -74.0817;
                            const dist = Math.sqrt(
                              Math.pow(rLat - uLat, 2) +
                                Math.pow(rLng - uLng, 2),
                            );
                            return { ...r, distance: dist };
                          })
                          .sort(
                            (a, b) => (a as any).distance - (b as any).distance,
                          );
                      }

                      // If no restaurants matched the exact query, fallback to the closest active restaurants
                      const hasSpecificMatches = filtered.length > 0;
                      const selected = hasSpecificMatches ? filtered.slice(0, 10) : allRestaurants.slice(0, 5);

                      const restaurantData = await Promise.all(selected.map(async (r) => {
                        const menu = await db.getRestaurantMenu(r.id);
                        const categories = Array.from(new Set(menu.map(p => p.category || "General")));
                        const topProducts = menu.filter(p => p.available).slice(0, 3).map(p => p.name);

                        return {
                          id: r.id,
                          name: r.name,
                          description: r.description,
                          address: r.address,
                          isOpen: isRestaurantOpen(r),
                          categories,
                          topProducts,
                          logo: (r as any).logo || null,
                          bannerImage:
                            (r as any).bannerImage ||
                            (r as any).coverImage ||
                            (r as any).images?.[0] ||
                            null,
                          rating: (r as any).rating || 4.5,
                          link: `${window.location.origin}/r/${r.id}`,
                        };
                      }));

                      setMessages((prev) => [
                        ...prev,
                        {
                          role: "assistant",
                          text: hasSpecificMatches
                            ? query
                              ? `He encontrado estos restaurantes para "${query}":`
                              : "Aquí tienes opciones cerca de ti en SmartBite, su Bocado Inteligente:"
                            : `Aquí tienes los restaurantes destacados y más cercanos en SmartBite, su Bocado Inteligente:`,
                          restaurants: restaurantData,
                        },
                      ]);

                      result = {
                        restaurants: restaurantData,
                        found: restaurantData.length > 0,
                      };
                    }
                  } catch (err) {
                    result = {
                      success: false,
                      error: "Error buscando restaurantes",
                    };
                  }
                } else if (call.name === "searchGlobalProducts") {
                  try {
                    const { query } = call.args as any;
                    const allProducts = await db.getAllProducts();
                    const allRestaurants = await db.getRestaurants();

                    const userLatStr = localStorage.getItem("smartbite_lat");
                    const userLngStr = localStorage.getItem("smartbite_lng");
                    const uLat = userLatStr ? parseFloat(userLatStr) : undefined;
                    const uLng = userLngStr ? parseFloat(userLngStr) : undefined;

                    const mealResult = resolveTopMealProducts(
                      query || "",
                      allProducts,
                      allRestaurants,
                      { lat: uLat, lng: uLng },
                      currentRest
                    );

                    setMessages((prev) => [
                      ...prev,
                      {
                        role: "assistant",
                        text: mealResult.messageText,
                        products: mealResult.topProducts,
                      },
                    ]);

                    result = {
                      success: true,
                      count: mealResult.topProducts.length,
                      mealType: mealResult.mealType,
                      instructions_for_assistant: `IMPORTANTE: Menciónale al usuario con entusiasmo los diez (10) platos más populares que acabas de desplegarle para ${mealResult.mealType}. Dile explícitamente por voz y por texto que en la misma ventana del chat le acabas de colocar las tarjetas interactivas con fotos y precios, y que las puede DESLIZAR hacia los lados 👉 para elegir su favorito y ordenar.`,
                      items: mealResult.topProducts.map((p) => ({
                        id: p.id,
                        name: p.name,
                        price: p.price,
                        restaurantId: p.restaurantId,
                        restaurantName: (p as any).restaurantName,
                        isRestaurantOpen: (p as any).isRestaurantOpen,
                        restaurantSchedule: (p as any).restaurantSchedule,
                        available: p.available !== false,
                      })),
                    };
                  } catch (err) {
                    result = {
                      success: false,
                      error: "Error buscando productos",
                    };
                  }
                } else if (call.name === "getRestaurantKnowledge") {
                  try {
                    const rId = (call.args as any).restaurantId;
                    if (rId) {
                      const r = await db.getRestaurant(rId);
                      if (r) {
                        const [menu, coupons] = await Promise.all([
                          db.getRestaurantMenu(rId),
                          db.getCoupons(rId),
                        ]);
                        const scheduleSummary = getRestaurantScheduleSummary(r);
                        result = {
                          success: true,
                          name: r.name,
                          description: r.description,
                          address: r.address,
                          phone: r.phone,
                          whatsappNumber: r.whatsappNumber,
                          isOpen: scheduleSummary.isOpen,
                          statusText: scheduleSummary.statusText,
                          todaySchedule: scheduleSummary.todaySchedule,
                          scheduleMessage: scheduleSummary.formattedMessage,
                          openingHours:
                            r.aiKnowledge?.openingHours || r.openingHours,
                          aiKnowledge: r.aiKnowledge,
                          coupons: coupons
                            .filter((c) => c.active)
                            .map((c) => ({
                              code: c.code,
                              discountType: c.discountType,
                              value: c.value,
                              minOrderAmount: c.minOrderAmount,
                            })),
                          menu: menu.map((p) => ({
                            id: p.id,
                            name: p.name,
                            price: p.price,
                            description: p.description,
                            category: p.category,
                            images: p.images,
                            available: p.available !== false,
                          })),
                        };
                      } else {
                        result = {
                          success: false,
                          error: "Restaurante no encontrado",
                        };
                      }
                    } else {
                      result = {
                        success: false,
                        error: "ID de restaurante no proporcionado",
                      };
                    }
                  } catch (err) {
                    result = {
                      success: false,
                      error: "Error al obtener conocimiento del restaurante",
                    };
                  }
                } else if (call.name === "showMenu") {
                  const rId = (call.args as any).restaurantId;
                  const cat = (call.args as any).categoryName;
                  const ids = (call.args as any).productIds;

                  try {
                    const menu = await db.getRestaurantMenu(rId);
                    let filteredProducts = menu || [];

                    if (cat) {
                      const normCat = normalize(cat);
                      
                      // 1. Case-insensitive exact match
                      let matched = filteredProducts.filter(
                        (p) => normalize(p.category) === normCat
                      );
                      
                      // 2. Substring match (e.g., "bebida" matches "Bebidas Frías")
                      if (matched.length === 0) {
                        matched = filteredProducts.filter(
                          (p) => normalize(p.category).includes(normCat) || normCat.includes(normalize(p.category))
                        );
                      }
                      
                      // 3. Fuzzy custom match using getMatchScore / isMatch
                      if (matched.length === 0) {
                        matched = filteredProducts.filter(p => isMatch(p.category || "", cat));
                      }
                      
                      // 4. Drink relation fallback: if cat refers to drinking, look for any drink-related classes
                      const isDrinkReq = (
                        normCat.includes("bebida") || 
                        normCat.includes("beber") || 
                        normCat.includes("tomar") || 
                        normCat.includes("drink") || 
                        normCat.includes("jugo") || 
                        normCat.includes("gaseosa") || 
                        normCat.includes("soda") || 
                        normCat.includes("refresco") || 
                        normCat.includes("agua") || 
                        normCat.includes("cerveza")
                      );
                      if (matched.length === 0 && isDrinkReq) {
                        matched = filteredProducts.filter((p) => {
                          const pCat = normalize(p.category || "");
                          return (
                            pCat.includes("bebida") ||
                            pCat.includes("beber") ||
                            pCat.includes("tomar") ||
                            pCat.includes("refresco") ||
                            pCat.includes("jugo") ||
                            pCat.includes("gaseosa") ||
                            pCat.includes("soda") ||
                            pCat.includes("agua") ||
                            pCat.includes("cerveza") ||
                            pCat.includes("coctel") ||
                            pCat.includes("licor") ||
                            pCat.includes("trago")
                          );
                        });
                      }

                      filteredProducts = matched;
                    } else if (ids && ids.length > 0) {
                      filteredProducts = filteredProducts.filter((p) =>
                        ids.includes(p.id),
                      );
                    }

                    if (filteredProducts.length > 0) {
                      const restaurant = await db.getRestaurant(rId);
                      const isOpened = restaurant ? isRestaurantOpen(restaurant) : true;
                      const schedule = restaurant ? getRestaurantScheduleSummary(restaurant) : null;

                      const enrichedProducts = filteredProducts.map(p => ({
                        ...p,
                        restaurantName: restaurant?.name || "Restaurante",
                        isRestaurantOpen: isOpened,
                        restaurantSchedule: schedule?.todaySchedule || "No especificado",
                      }));

                      setMessages((prev) => [
                        ...prev,
                        {
                          role: "assistant",
                          text: cat
                            ? `¡Aquí tienes nuestra variedad de ${cat}! 👉 Mira en la ventana del chat y desliza hacia los lados para ver todas las opciones con fotos y precios:`
                            : "¡Aquí tienes nuestras deliciosas opciones! 👉 Desliza hacia los lados en la ventana del chat para ver todas las alternativas:",
                          products: enrichedProducts.slice(0, 10),
                        },
                      ]);
                      result = {
                        success: true,
                        count: filteredProducts.length,
                        restaurantIsOpen: isOpened,
                        restaurantSchedule: schedule?.todaySchedule,
                        scheduleMessage: schedule?.formattedMessage,
                        instructions_for_assistant: "IMPORTANTE: Indícale al cliente con entusiasmo por voz y texto que en la misma ventana del chat puede ver las opciones con sus fotos y precios, y que las puede deslizar hacia los lados para explorar todos los platos.",
                      };
                    } else {
                      result = {
                        success: false,
                        error: "No se encontraron productos para mostrar.",
                      };
                    }
                  } catch (e) {
                    result = {
                      success: false,
                      error: "Error al obtener productos.",
                    };
                  }
                }
                responses.push({
                  name: call.name,
                  id: call.id,
                  response: result,
                });
              }
              const session = await sessionPromise;
              try {
                if (typeof (session as any).sendToolResponse === "function") {
                  await (session as any).sendToolResponse({
                    functionResponses: responses,
                  });
                } else if (typeof (session as any).send === "function") {
                  const payload = {
                    toolResponse: {
                      functionResponses: responses.map((r) => ({
                        id: r.id,
                        name: r.name,
                        response: r.response,
                      })),
                    },
                  };
                  await (session as any).send(payload);
                } else {
                  console.warn("No valid method found to send tool response");
                }
              } catch (e) {
                console.error("Error sending tool response:", e);
              }
            }
          },
      };

      const sessionPromise = new Promise((resolve, reject) => {
        // ws.onopen is already resolved in Promise.all via wsOpenPromise.
        // We set up message routing and lifecycle listeners:
        ws.onerror = (err) => {
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }
          console.error("WebSocket connection error", err);
          reject(new Error("Error de conexión WebSocket. Por favor revisa tu conexión."));
        };

        ws.onmessage = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.type === "pong") {
            return;
          }
          if (msg.type === "connected") {
            resolve(mockSession);
            callbacks.onopen();
          } else if (msg.type === "closed") {
            if (pingIntervalRef.current) {
              clearInterval(pingIntervalRef.current);
              pingIntervalRef.current = null;
            }
            callbacks.onclose(event);
          } else if (msg.type === "error") {
            const errObj = new Error(msg.error);
            reject(errObj); // resolve/reject the initial promise
            // Also call onerror so it shows specific toast
            callbacks.onerror(errObj);
          } else if (msg.type === "serverMessage") {
            callbacks.onmessage(msg.message);
          }
        };

        ws.onclose = (event) => {
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }
          reject(new Error("Conexión WebSocket cerrada inesperadamente durante la inicialización."));
          callbacks.onclose(event);
        };
      });

      // Send the setup message now that the WebSocket has physically opened and context gathered in parallel
      ws.send(JSON.stringify({
        type: "setup",
        config: {
          systemInstruction,
          tools: availableTools,
          voiceName: "Kore"
        }
      }));

      const session = await sessionPromise;
      sessionRef.current = session;
      if (streamRef.current) {
        setupAudioGraph(streamRef.current);
      }

      if (requestMic && (!messages || messages.length <= 1)) {
        try {
          if (!hasRealProfileName) {
            isAwaitingNameResponseRef.current = true;
          }
          (session as any).sendRealtimeInput({
            text: hasRealProfileName
              ? `[SISTEMA]: El usuario acaba de activar el modo de guía por voz. Salúdalo inmediatamente dirigiéndote a él como ${rawProfileName}: '¡Hola, ${rawProfileName}! Bienvenido a SmartBite, su Bocado Inteligente. La aplicación donde no solo podrás comer, sino también ganar dinero... ¿Qué te gustaría ordenar hoy, ${rawProfileName}?'`
              : `[SISTEMA]: El usuario acaba de activar el modo de guía por voz. Salúdalo ÚNICAMENTE con la pregunta inicial breve de su nombre: '¡Hola! Bienvenido a SmartBite, su Bocado Inteligente. Por favor cuéntame, ¿cuál es tu nombre para atenderte con todo el gusto?'. IMPORTANTE: DETENTE INMEDIATAMENTE tras hacer esa pregunta y finaliza tu turno sin decir nada más, para pausar 5 segundos y esperar a que el usuario responda.`
          });
        } catch (voiceGreetErr) {
          console.warn("No se pudo enviar saludo inicial por voz:", voiceGreetErr);
        }
      }
    } catch (err: any) {
      console.error("ChatAssistant: Failed to connect to Gemini Live", err);
      setIsConnecting(false);
      setIsConnected(false);
      
      // Prevent showing dual error toast if it's already shown via callback
      if (!err.message || !err.message.includes("quota")) {
         toast.error(err.message || "No se pudo establecer conexión con el asistente.");
      }
    }
  };

  const initMicrophone = async () => {
    if (streamRef.current) {
      if (audioContextRef.current?.state === "suspended") {
        await audioContextRef.current.resume();
      }
      return true;
    }

    try {
      console.log("ChatAssistant: Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      setMicError(null);

      await initAudioContext();
      if (audioContextRef.current?.state === "suspended") {
        await audioContextRef.current.resume();
      }

      if (sessionRef.current) {
        setupAudioGraph(stream);
      }

      console.log("ChatAssistant: Microphone ready.");
      return true;
    } catch (err: any) {
      console.error("ChatAssistant: Error capturing audio", err);
      const isPermissionDenied = err.name === "NotAllowedError" || err.message?.toLowerCase().includes("denied") || err.message?.toLowerCase().includes("permission");
      const errorMsg = isPermissionDenied 
        ? "Permiso de micrófono denegado por el navegador." 
        : `No se pudo acceder al micrófono: ${err.message || 'Error desconocido'}`;
      setMicError(errorMsg);
      toast.error(
        isPermissionDenied 
          ? "Permiso de micrófono denegado. Por favor, actívalo en el candado de la barra de direcciones."
          : "No se pudo acceder al micrófono. Revisa los permisos."
      );
      return false;
    }
  };

  const triggerAutoVoiceModeAndSend = async (userText: string) => {
    cancelNameWaiting();
    if (!userText.trim()) return;

    const trimmedText = userText.trim();
    setMessages((prev) => [...prev, { role: "user", text: trimmedText }]);
    setInput("");

    // 1. Initialize & resume Web Audio Context immediately on user gesture
    await initAudioContext();
    if (audioContextRef.current?.state === "suspended") {
      try {
        await audioContextRef.current.resume();
      } catch (err) {
        console.warn("Could not resume AudioContext:", err);
      }
    }

    // 2. Initialize Microphone & enable voice mode state immediately
    const micSuccess = await initMicrophone();
    if (micSuccess) {
      setIsListening(true);
      isListeningRef.current = true;
    }

    // 3. Ensure Gemini WebSocket session is connected
    let session = sessionRef.current;
    if (!isConnected || !session) {
      await connectToGemini(true);
      // Wait for sessionRef to be assigned (polling up to 4 seconds)
      let waitMs = 0;
      while (!sessionRef.current && waitMs < 4000) {
        await new Promise((r) => setTimeout(r, 100));
        waitMs += 100;
      }
      session = sessionRef.current;
    }

    // 4. Send the text input to Gemini session
    if (session) {
      try {
        await session.sendRealtimeInput({ text: trimmedText });
      } catch (err) {
        console.error("Error sending realtime text to Gemini session:", err);
        setTimeout(async () => {
          if (sessionRef.current) {
            try {
              await sessionRef.current.sendRealtimeInput({ text: trimmedText });
            } catch (retryErr) {
              console.error("Retry failed:", retryErr);
            }
          }
        }, 500);
      }
    } else {
      console.error("Could not establish Gemini Live session to send input.");
      toast.error("No se pudo conectar con el servidor de voz. Intenta de nuevo.");
    }
  };

  const handleQuickSuggestion = async (txt: string) => {
    await triggerAutoVoiceModeAndSend(txt);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    await triggerAutoVoiceModeAndSend(input);
  };

  const toggleListening = async () => {
    const newState = !isListening;

    if (newState) {
      const micSuccess = await initMicrophone();
      if (!micSuccess) {
        setIsListening(false);
        isListeningRef.current = false;
        return;
      }
      if (audioContextRef.current?.state === "suspended") {
        await audioContextRef.current.resume();
      }
      if (!isConnected) {
        await connectToGemini(true);
      } else if (!messages || messages.length <= 1) {
        if (sessionRef.current) {
          if (!hasRealProfileName) {
            isAwaitingNameResponseRef.current = true;
          }
          try {
            sessionRef.current.sendRealtimeInput({
              text: hasRealProfileName
                ? `[SISTEMA]: El usuario activó la voz. Salúdalo como ${rawProfileName} y dale la bienvenida oficial completa.`
                : `[SISTEMA]: El usuario activó la voz. Salúdalo ÚNICAMENTE con la pregunta inicial breve de su nombre: '¡Hola! Bienvenido a SmartBite, su Bocado Inteligente. Por favor cuéntame, ¿cuál es tu nombre para atenderte con todo el gusto?'. IMPORTANTE: DETENTE INMEDIATAMENTE tras hacer esa pregunta y finaliza tu turno sin decir nada más, para pausar 5 segundos y esperar a que el usuario responda.`
            });
          } catch (e) {
            console.warn(e);
          }
        }
      }
    } else {
      stopAllAudio();
      cancelNameWaiting();
    }

    setIsListening(newState);
    isListeningRef.current = newState;
  };

  useEffect(() => {
    if (!isOpen && isListening) {
      stopAllAudio();
      setIsListening(false);
      isListeningRef.current = false;
    }
  }, [isOpen, isListening]);

  const cleanupSession = () => {
    cancelNameWaiting();
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {}
      sessionRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setIsListening(false);
    isListeningRef.current = false;
    stopAllAudio();

    if (audioWorkletNodeRef.current) {
      try {
        (audioWorkletNodeRef.current as any).disconnect();
      } catch (e) {}
      audioWorkletNodeRef.current = null;
    }

    if (inputAudioContextRef.current) {
      try {
        inputAudioContextRef.current.close();
      } catch (e) {}
      inputAudioContextRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (loading) return; // Wait for initial auth state

    // Reconnect when user state OR restaurant context changes significantly
    const currentRestId = restaurant?.id;
    const currentUserId = appUser?.id;
    const prevRestId = lastConnectedIdRef.current;
    const prevUserId = lastConnectedUserIdRef.current;

    // A change occurs if the restaurant ID is different OR if the user identity changed (including login/logout)
    const restaurantIdChanged =
      prevRestId !== undefined && prevRestId !== currentRestId;
    const userIdChanged = prevUserId !== currentUserId;

    if (sessionRef.current || isConnected || isConnecting) {
      const isLogin = prevUserId === undefined && currentUserId !== undefined;
      
      // If ONLY the user logged in/registered, we don't disconnect.
      // We just send a system message so the assistant knows we are now authenticated.
      if (userIdChanged && isLogin && !restaurantIdChanged) {
        console.log("ChatAssistant: Login/Registration detected. Updating context without disconnecting.");
        lastConnectedUserIdRef.current = currentUserId;
        
        if (sessionRef.current) {
          sessionRef.current.sendRealtimeInput({
            text: `[MENSAJE DE SISTEMA INVISIBLE AL USUARIO]: El usuario acaba de completar su registro exitosamente. Su nombre es ${appUser?.displayName || 'desconocido'}. Confírmale que estás listo para continuar con el pedido que estaba en curso y pregúntale si desea agregar algo más o proceder con el resumen del pedido.`,
          });
        }
      } else if (
        restaurantIdChanged ||
        userIdChanged ||
        currentRestId !== prevRestId
      ) {
        console.log(
          "ChatAssistant: Context change detected (User or Restaurant). Reconnecting...",
          { userIdChanged, restaurantIdChanged },
        );

        if (sessionRef.current) {
          try {
            sessionRef.current.close();
          } catch (e) {}
          sessionRef.current = null;
        }
        setIsConnected(false);
        setIsConnecting(false);

        // Update refs to current state
        lastConnectedIdRef.current = currentRestId;
        lastConnectedUserIdRef.current = currentUserId;

        if (isOpen) {
          // If the user ID actually changed (real switch, not initial), wipe messages.
          if (userIdChanged && !isLogin) {
            setMessages([]);
          }

          // Reconnect with new context
          setTimeout(() => {
            connectToGemini();
          }, 150);
        }
      }
    } else {
      // If not connected, just keep refs updated so we don't trigger unnecessary resets later
      lastConnectedIdRef.current = currentRestId;
      lastConnectedUserIdRef.current = currentUserId;
    }
  }, [appUser?.id, restaurant?.id, loading, isOpen]);

  useEffect(() => {
    const checkBirthday = () => {
      if (!appUser?.birthDate) return;

      const today = getBogotaTime();
      const birth = new Date(appUser.birthDate + "T12:00:00");

      const isTodayBirthday =
        today.getDate() === birth.getDate() &&
        today.getMonth() === birth.getMonth();

      if (isTodayBirthday && isConnected) {
        console.log(
          "ChatAssistant: Birthday detected! The agent should congratulate now.",
        );
      }
    };
    checkBirthday();
  }, [appUser?.birthDate, isConnected]);

  if (appUser && appUser.role !== "user" && !isDashboard) {
    return null;
  }

  return (
    <>
      <FloatingButton
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        initAudioContext={initAudioContext}
        isConnected={isConnected}
        connectToGemini={connectToGemini}
        isDashboard={isDashboard}
        hasBottomNav={hasBottomNav}
        showHelperMessage={showHelperMessage}
        setShowHelperMessage={setShowHelperMessage}
        assistantIcon={platformSettings?.assistantIcon || "Smile"}
        assistantCustomIconUrl={platformSettings?.assistantCustomIconUrl}
      />

      <AnimatePresence>
        {isOpen && !registrationData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40, x: 0 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 40, x: 0 }}
            transition={{ 
              type: "spring", 
              damping: 28, 
              stiffness: 200,
              mass: 0.8
            }}
            className={`fixed ${isDashboard ? "top-0 bottom-0 sm:top-auto sm:bottom-28" : hasBottomNav ? "top-0 bottom-0 sm:bottom-0" : "top-0 bottom-0 sm:top-auto sm:bottom-6"} left-0 right-0 sm:left-auto sm:right-6 w-full sm:w-[500px] h-full sm:h-[800px] max-h-[100dvh] sm:max-h-[calc(100vh-2rem)] bg-[#0B0B0B] sm:rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[100000] flex flex-col overflow-hidden border border-white/10`}
          >
            <div className="p-6 bg-gradient-to-r from-[#1A1A1D] to-[#0A0A0B] border-b border-[#FFD700]/20 flex justify-between items-center shadow-lg relative z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#FFD700]/20 to-[#E53935]/20 rounded-2xl flex items-center justify-center relative overflow-hidden group border border-[#FFD700]/30 shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                  {platformSettings?.assistantCustomIconUrl ? (
                    <img
                      src={platformSettings.assistantCustomIconUrl}
                      alt="Assistant Logo"
                      className="w-full h-full object-cover relative z-10 p-1 rounded-2xl"
                      referrerPolicy="no-referrer"
                    />
                  ) : restaurant?.logo ? (
                    <img
                      src={restaurant.logo}
                      alt={restaurant.name}
                      className="w-full h-full object-cover relative z-10 p-1 rounded-2xl"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Bot className="w-7 h-7 relative z-10 text-[#FFD700]" />
                  )}
                  <motion.div
                    className="absolute inset-0 bg-white/10"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </div>
                <div>
                  <h3 className="font-black text-lg leading-tight tracking-tight text-white drop-shadow-md">
                    {restaurant ? restaurant.name : "SmartBite Assistant"}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div
                      className={`w-2 h-2 rounded-full ${isConnected ? "bg-[#FFD700] animate-pulse shadow-[0_0_8px_rgba(255,215,0,0.6)]" : isConnecting ? "bg-[#E53935] animate-spin border border-white/30" : "bg-white/40"}`}
                    />
                    <p className="text-[10px] uppercase tracking-widest opacity-90 font-black text-[#FFD700]/80">
                      {isConnecting
                        ? "Conectando..."
                        : isConnected
                          ? restaurant
                            ? "Ventas en línea"
                            : "Conserje en línea"
                          : "Desconectado"}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  cleanupSession();
                }}
                className="p-3 hover:bg-white/10 rounded-2xl transition-all text-white active:scale-90"
              >
                <X className="w-6 h-6 text-[#FFD700]" />
              </button>
            </div>

            <style>{`
              .markdown-container {
                line-height: 1.6;
              }
              .markdown-container a {
                color: #FFD700;
                font-weight: 800;
                text-decoration: underline;
              }
              .chat-menu-scroll::-webkit-scrollbar {
                height: 4px;
              }
              .chat-menu-scroll::-webkit-scrollbar-track {
                background: transparent;
              }
              .chat-menu-scroll::-webkit-scrollbar-thumb {
                background: #FFD700;
                border-radius: 10px;
              }
              @keyframes slow-spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              .animate-slow-spin {
                animation: slow-spin 8s linear infinite;
              }
              .custom-scrollbar::-webkit-scrollbar {
                width: 4px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #333;
                border-radius: 10px;
              }
            `}</style>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 bg-[#0B0B0B] custom-scrollbar relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#111111]/80 pointer-events-none" />
              <div className="relative z-10 space-y-4 pb-10">
                {messages.map((m, i) => (
                  <div key={i} className="space-y-3">
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`p-4 rounded-2xl max-w-[85%] text-sm font-bold shadow-sm break-words leading-relaxed ${
                        m.role === "user"
                          ? "bg-gradient-to-r from-[#FFD700] to-[#E53935] text-black ml-auto rounded-tr-none shadow-[0_4px_15px_rgba(255,215,0,0.2)]"
                          : "bg-[#1C1C1E] text-white rounded-tl-none border border-white/10"
                      }`}
                    >
                      {m.role === "assistant" ? (
                        <div className="markdown-container prose prose-sm max-w-none prose-p:text-white prose-p:leading-relaxed prose-a:text-[#FFD700] prose-a:font-black prose-a:no-underline hover:prose-a:underline prose-strong:text-white prose-ul:text-white prose-ol:text-white prose-li:text-white prose-headings:text-white">
                          <ReactMarkdown
                            components={{
                              a: ({ node, ...props }) => {
                                const hrefStr = typeof props.href === "string" ? props.href : "";
                                const isWhatsapp =
                                  hrefStr.includes("wa.me") || hrefStr.startsWith("whatsapp://");
                                return (
                                  <a
                                    {...props}
                                    className={
                                      isWhatsapp
                                        ? "inline-block mt-2 px-4 py-2 bg-[#25D366] hover:bg-green-600 text-white no-underline font-bold rounded-lg shadow-md transition-all active:scale-95"
                                        : "text-[#FFD700] underline font-black hover:text-[#FFF] transition-colors inline-flex items-center gap-1 bg-[#FFD700]/10 px-3 py-1 rounded-xl shadow-sm border border-[#FFD700]/30 my-1"
                                    }
                                    target={isWhatsapp ? "_self" : "_blank"}
                                    rel={isWhatsapp ? undefined : "noopener noreferrer"}
                                    onClick={(e) => {
                                      if (isWhatsapp) {
                                        e.preventDefault();
                                        let finalUrl = hrefStr;
                                        if (finalUrl.includes("wa.me/")) {
                                          const parts = finalUrl.split("wa.me/")[1]?.split("?") || [];
                                          const phone = parts[0] || "";
                                          const text = new URLSearchParams(parts[1] || "").get("text") || "";
                                          finalUrl = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(text)}`;
                                        }
                                        window.location.href = finalUrl;
                                      }
                                    }}
                                  >
                                    {props.children}
                                  </a>
                                );
                              },
                              p: ({ node, ...props }) => (
                                <p {...props} className="mb-2 last:mb-0" />
                              ),
                              ul: ({ node, ...props }) => (
                                <ul
                                  {...props}
                                  className="list-disc ml-4 mb-2"
                                />
                              ),
                              ol: ({ node, ...props }) => (
                                <ol
                                  {...props}
                                  className="list-decimal ml-4 mb-2"
                                />
                              ),
                              li: ({ node, ...props }) => (
                                <li {...props} className="mb-1" />
                              ),
                            }}
                          >
                            {m.text}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        m.text
                      )}
                    </motion.div>

                    {m.products && m.products.length > 0 && (
                      <div className="flex flex-col gap-1.5 mt-2">
                        <div className="flex items-center justify-between px-1 text-[11px] font-bold text-[#FFD700]">
                          <span className="flex items-center gap-1.5 animate-pulse">
                            <span>👉</span>
                            <span>Desliza para ver más opciones ({m.products.length})</span>
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">
                            Desliza horizontalmente ➔
                          </span>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 snap-x chat-menu-scroll -mx-1">
                          {m.products.map((p) => (
                            <motion.div
                              key={p.id}
                              initial={{ opacity: 0, scale: 0.9, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              className="min-w-[220px] max-w-[220px] bg-[#1C1C1E] rounded-[2rem] border border-white/5 shadow-xl overflow-hidden flex flex-col snap-start group relative"
                            >
                              {/* Restaurant Name Badge */}
                              {(p as any).restaurantName && (
                                <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
                                  <div className="bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5 shadow-lg">
                                    <div className={`w-1.5 h-1.5 rounded-full ${(p as any).isRestaurantOpen === false ? "bg-red-500" : "bg-[#FFD700] animate-pulse"}`} />
                                    <span className="text-[9px] font-black text-white uppercase tracking-wider truncate max-w-[120px]">
                                      {(p as any).restaurantName}
                                    </span>
                                  </div>
                                  {(p as any).isRestaurantOpen === false && (
                                    <div className="bg-red-600/90 backdrop-blur-md px-2 py-0.5 rounded-full border border-red-400/30 shadow-md">
                                      <span className="text-[8px] font-black text-white uppercase tracking-wider">
                                        CERRADO
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="h-28 w-full relative overflow-hidden">
                                {p.images?.[0] ? (
                                  <img
                                    src={p.images[0]}
                                    alt={p.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-[#2A2A2D] flex items-center justify-center">
                                    <Bot className="w-10 h-10 text-[#FFD700]/30" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                                  <div className="bg-black/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm border border-[#FFD700]/30">
                                    <span className="text-[10px] font-black text-[#FFD700]">
                                      {formatCurrency(p.price)}
                                    </span>
                                  </div>
                                  {p.available === false && (
                                    <div className="bg-red-600/90 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-red-400/30">
                                      <span className="text-[9px] font-black text-white">
                                        Agotado
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="p-4 flex-1 flex flex-col">
                                <h5 className="text-sm font-black text-white line-clamp-1">
                                  {p.name}
                                </h5>
                                <p className="text-[10px] text-gray-400 font-medium line-clamp-2 mt-1.5 flex-1 leading-relaxed">
                                  {p.description}
                                </p>
                                {(p as any).isRestaurantOpen === false && (p as any).restaurantSchedule && (
                                  <p className="text-[9px] text-red-400 font-bold mt-1">
                                    🕒 Horario: {(p as any).restaurantSchedule}
                                  </p>
                                )}
                                <button
                                  disabled={(p as any).isRestaurantOpen === false || p.available === false}
                                  onClick={async () => {
                                    if (!appUser || !user) {
                                      toast.error("Debes iniciar sesión o registrarte para añadir productos.");
                                      return;
                                    }
                                    if (p.restaurantId) {
                                      const r = await db.getRestaurant(p.restaurantId);
                                      if (r && !isRestaurantOpen(r)) {
                                        const schedule = getRestaurantScheduleSummary(r);
                                        toast.error(`${r.name} se encuentra cerrado. Horario: ${schedule.todaySchedule}`);
                                        return;
                                      }
                                    }
                                    if (p.available === false) {
                                      toast.error(`"${p.name}" está temporalmente agotado.`);
                                      return;
                                    }
                                    addToCart(p);
                                    toast.success(`${p.name} añadido`);
                                  }}
                                  className={`mt-4 w-full py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg ${
                                    (p as any).isRestaurantOpen === false || p.available === false
                                      ? "bg-gray-800 text-gray-400 cursor-not-allowed border border-white/5"
                                      : "bg-gradient-to-r from-[#FFD700] to-[#E53935] text-black hover:scale-[1.02] active:scale-95 shadow-[#FFD700]/20"
                                  }`}
                                >
                                  {(p as any).isRestaurantOpen === false ? (
                                    "Restaurante Cerrado"
                                  ) : p.available === false ? (
                                    "Agotado"
                                  ) : (
                                    <>
                                      <Sparkles className="w-3 h-3 text-black" />
                                      Añadir al Carro
                                    </>
                                  )}
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {m.restaurants && m.restaurants.length > 0 && (
                      <div className="flex flex-col gap-1.5 mt-2">
                        <div className="flex items-center justify-between px-1 text-[11px] font-bold text-[#FFD700]">
                          <span className="flex items-center gap-1.5 animate-pulse">
                            <span>👉</span>
                            <span>Desliza para ver restaurantes ({m.restaurants.length})</span>
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">
                            Desliza horizontalmente ➔
                          </span>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 snap-x chat-menu-scroll -mx-1">
                          {m.restaurants.map((rest) => (
                            <motion.div
                              key={rest.id}
                              initial={{ opacity: 0, scale: 0.9, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              className="min-w-[220px] max-w-[220px] bg-[#1C1C1E] rounded-[2rem] border border-white/5 shadow-xl overflow-hidden flex flex-col snap-start group relative"
                            >
                            {/* Logo Overlay */}
                            {rest.logo && (
                              <div className="absolute top-2 left-2 z-20">
                                <div className="w-8 h-8 rounded-full border-2 border-white/20 overflow-hidden bg-white/10 backdrop-blur-sm shadow-lg">
                                  <img 
                                    src={rest.logo} 
                                    alt={rest.name}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              </div>
                            )}

                            <div className="h-28 w-full relative overflow-hidden">
                              {rest.bannerImage ? (
                                <img
                                  src={rest.bannerImage}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                  alt={rest.name}
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-full h-full bg-[#2A2A2D] flex items-center justify-center">
                                  <Sparkles className="w-10 h-10 text-[#FFD700]/30" />
                                </div>
                              )}
                              <div className="absolute top-2 right-2">
                                <div className="bg-black/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm flex items-center gap-1 border border-[#FFD700]/30">
                                  <span className="text-[10px] font-black text-[#FFD700] text-[10px]">
                                    ★ {rest.rating}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                              <h5 className="text-sm font-black text-white line-clamp-1">
                                {rest.name}
                              </h5>
                              <p className="text-[10px] text-gray-400 font-medium line-clamp-2 mt-1.5 flex-1 leading-relaxed">
                                {rest.description}
                              </p>
                              <button
                                onClick={() => {
                                  setIsOpen(false);
                                  window.location.href = `/r/${rest.id}`;
                                }}
                                className="mt-4 w-full py-2.5 bg-gradient-to-r from-[#FFD700] to-[#E53935] text-black text-[10px] font-black uppercase tracking-wider rounded-xl hover:scale-[1.02] transition-all active:scale-95 shadow-lg shadow-[#FFD700]/10 flex items-center justify-center gap-2"
                              >
                                <Send className="w-3 h-3 text-black" />
                                Entrar al Restaurante
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                  </div>
                ))}

                {messages.length <= 1 && (
                  <div className="flex flex-col items-start justify-start pt-2 pb-1 space-y-3">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      💡 Sugerencias rápidas:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                      {[
                        "☕ ¿Qué hay para desayunar?",
                        "🍲 ¿Qué hay para almorzar?",
                        "🌙 ¿Qué hay para cenar?",
                      ].map((txt, index) => (
                        <motion.button
                          key={txt}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => handleQuickSuggestion(txt)}
                          className="w-full px-4 py-3 bg-[#1C1C1E] border border-white/10 rounded-2xl text-[11px] sm:text-xs font-black text-gray-200 hover:border-[#FFD700]/50 hover:text-[#FFD700] transition-all shadow-sm text-left sm:text-center"
                        >
                          {txt}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div
              className={`p-4 sm:p-7 bg-[#0B0B0B] border-t border-white/5 space-y-4 sm:space-y-6 shadow-[0_-25px_50px_rgba(0,0,0,0.8)] relative z-20 pb-safe sm:pb-6 ${hasBottomNav ? "pb-5 sm:pb-4" : "pb-1 sm:pb-4"} mobile-chat-footer`}
            >
              {!appUser && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-[#1C1C1E] via-[#242428] to-[#1C1C1E] border border-[#FFD700]/20 rounded-xl sm:rounded-2xl flex items-center justify-between gap-3 shadow-md shadow-black/40 mb-1 sm:mb-2 max-w-lg mx-auto w-full relative overflow-hidden group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#FFD700] to-[#E53935] rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                      <Sparkles className="w-4 h-4 text-black fill-black" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] sm:text-xs font-black text-white leading-tight truncate">
                        ¡Únete a SmartBite!
                      </p>
                      <p className="text-[10px] text-[#FFD700] font-bold truncate">
                        Regístrate en 30s y gana premios
                      </p>
                    </div>
                  </div>
                  <motion.button
                    animate={{
                      scale: [1, 1.03, 1],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/auth?mode=register");
                    }}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-[#FFD700] to-[#E53935] text-black text-[10px] sm:text-[11px] font-black rounded-lg sm:rounded-xl shadow-md whitespace-nowrap active:scale-95 flex items-center gap-1.5 shrink-0 hover:brightness-110 transition-all"
                  >
                    <Sparkles className="w-3 h-3 fill-black" />
                    <span>REGISTRARSE</span>
                  </motion.button>
                </motion.div>
              )}
              {micError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-3 p-4 bg-red-950/75 border-2 border-red-500/40 rounded-2xl text-[11px] sm:text-xs text-red-100 flex flex-col gap-1.5 shadow-lg relative overflow-hidden"
                >
                  <div className="flex items-center gap-2 font-black text-red-400 uppercase tracking-wider">
                    <MicOff className="w-4 h-4 shrink-0 animate-pulse" />
                    <span>Se requiere permiso de micrófono</span>
                  </div>
                  <p className="font-bold opacity-90 leading-relaxed">
                    Para activar el Modo Voz, por favor permite el acceso al micrófono en el de la barra de direcciones de tu navegador (haz clic en el botón de permisos o candado <span className="text-yellow-400">🔒</span>).
                  </p>
                  <p className="font-bold text-gray-400 leading-relaxed">
                    Si estás viendo la app dentro del panel interactivo de AI Studio, te recomendamos abrirla en una <a href={window.location.href} target="_blank" rel="noopener noreferrer" className="text-[#FFD700] underline font-black hover:text-white transition-colors">Pestaña Nueva ↗</a> para habilitar los permisos de inmediato.
                  </p>
                  <button 
                    onClick={() => setMicError(null)}
                    className="absolute top-2.5 right-2.5 text-red-400 hover:text-white font-black text-xs px-1.5 py-0.5 rounded-lg hover:bg-white/15 transition-all"
                  >
                    ✕
                  </button>
                </motion.div>
              )}
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1 bg-[#1C1C1E] border-2 border-white/5 rounded-xl sm:rounded-[1.25rem] px-4 py-2.5 sm:px-5 sm:py-3.5 text-xs sm:text-sm font-bold text-white placeholder:text-gray-500 focus:ring-2 focus:ring-[#FFD700] focus:bg-[#202022] focus:border-[#FFD700]/50 outline-none transition-all shadow-inner"
                  placeholder="Escribe lo que deseas..."
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-[#FFD700] to-[#E53935] text-black rounded-xl sm:rounded-2xl hover:scale-105 active:scale-90 disabled:opacity-50 transition-all shadow-lg shadow-[#FFD700]/20 flex items-center justify-center flex-shrink-0 send-trigger-btn"
                >
                  <Send className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-3 sm:gap-4">
                <button
                  onClick={toggleListening}
                  className={`relative flex items-center gap-2 sm:gap-3 px-6 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                    isListening
                      ? "bg-red-500 text-white shadow-red-500/20"
                      : "bg-gradient-to-br from-[#FFD700] to-[#E53935] text-black shadow-[#FFD700]/20 hover:scale-[1.02]"
                  }`}
                >
                  {isListening && (
                    <motion.div className="absolute inset-x-2 -bottom-1 h-1 bg-white/30 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-white"
                        animate={{
                          width: `${Math.min(100, audioLevel * 500)}%`,
                        }}
                      />
                    </motion.div>
                  )}
                  {isListening ? (
                    <Mic className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                  ) : (
                    <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                  <span>{isListening ? "Escuchando..." : "Modo Voz"}</span>
                </button>

                {isConnecting && (
                  <div className="flex items-center gap-1 text-[7px] sm:text-[8px] font-black uppercase tracking-[0.2em] text-[#FFD700] animate-pulse">
                    <Loader2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                    Optimizando IA
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {registrationData && (
        <RegistrationModal
          defaultName={registrationData.name}
          defaultPhone={registrationData.phone}
          defaultAddress={registrationData.address}
          onClose={() => {
            setRegistrationData(null);
            if (sessionRef.current) {
               sessionRef.current.sendRealtimeInput({
                 text: "[MENSAJE DE SISTEMA INVISIBLE AL USUARIO]: El usuario ha cerrado el formulario de registro sin completarlo o ha indicado que no puede/quiere registrarse. ACTIVA MODO INVITADO AHORA. Dile muy amablemente que no hay problema y que vas a tomar su pedido como invitado."
               });
            }
          }}
          onSuccess={() => {
            setRegistrationData(null);
            toast.success("Registro completado");
          }}
        />
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </>
  );
};
