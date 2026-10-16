import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { db, Restaurant, Product, Banner, PlatformSettings } from "../store/db";
import { LuckyWheel } from "../components/LuckyWheel";
import { RuletaPay } from "../components/RuletaPay";
import {
  Search,
  MapPin,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
  Tag,
  Mail,
  Car,
  Hotel,
  Package,
  Trophy,
  Crown,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Filter,
  X,
  Utensils,
  Settings,
  BellRing,
  Bell,
  Trash2,
  Truck,
  RefreshCcw,
  Loader2,
  Heart,
  User as UserIcon,
  ImageIcon,
  Store,
  Users,
  ShoppingBag,
  ShieldAlert,
  Download,
  Activity,
  Receipt,
  UtensilsCrossed,
  Navigation,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { useNotifications } from "../contexts/NotificationContext";
import {
  isRestaurantOpen,
  getBogotaTime,
  getRestaurantProximity,
  batchResolveRestaurantDistances,
} from "../utils/restaurantUtils";
import { RealDistanceResult } from "../services/mapboxService";
import { useAuth } from "../contexts/AuthContext";
import { getDepartments, getCitiesByDepartment } from "../utils/colombiaData";
import { toast } from "sonner";
import { formatCurrency } from "../utils/format";
import { useCart } from "../contexts/CartContext";
import { ProductDetailModal } from "../components/ProductDetailModal";
import { RestaurantCardPremium } from "../components/RestaurantCardPremium";
import { calculateRestaurantMeritScore } from "../utils/meritSystem";
import { BusinessCategoryNav, CategoryCircleChip } from "../components/CategoryNavItems";
import { getCategoryVisual, matchRestaurantToCategory } from "../utils/categoryTheme";
import { getWhatsAppNativeUrl } from "../utils/whatsapp";

// --- SUB-COMPONENTS ---

interface HomeHeroProps {
  settings: any;
  onExploreClick: (category: string) => void;
}

const HomeHero: React.FC<HomeHeroProps> = ({ settings, onExploreClick }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [activeSlideIdx, setActiveSlideIdx] = React.useState(0);

  const slides = React.useMemo(() => {
    const activeCustomBanners = (settings?.heroBanners || []).filter(
      (b) => b.active,
    );
    const bizCats = (settings?.businessCategories || []).filter((bc) => bc.active);
    const firstCat = bizCats.find((c) => c.id === "restaurant") || bizCats[0];

    const welcomeSlide = {
      id: firstCat?.id || "restaurant",
      title: "Bienvenido a",
      subtitle: firstCat?.subtitle || "Tus comidas favoritas a la puerta de tu casa.",
      image: firstCat?.image,
      opacity:
        settings?.heroImageOpacity !== undefined
          ? settings.heroImageOpacity / 100
          : 0.6,
      fromColor: firstCat?.fromColor || "from-neutral-900 via-neutral-800",
      toColor: firstCat?.toColor || "to-[#FF8A00]/60",
      shadowColor:
        firstCat?.shadowColor ||
        "shadow-[0_4px_20px_rgba(255,138,0,0.3)] border-[#FF8A00]/40",
      isWelcome: true,
      actionText: firstCat?.title || "Explorar Restaurantes",
    };

    if (activeCustomBanners.length > 0) {
      return [
        welcomeSlide,
        ...activeCustomBanners.map((b, idx) => {
          const fallbackCat = bizCats[(idx + 1) % bizCats.length] || firstCat;
          return {
            id: b.actionUrl || "restaurant",
            title: b.title || "Explora",
            subtitle: b.content || "",
            image: b.imageUrl,
            opacity: 0.6,
            fromColor: fallbackCat?.fromColor || "from-neutral-900 via-neutral-800",
            toColor: fallbackCat?.toColor || "to-[#8B5CF6]/60",
            shadowColor:
              fallbackCat?.shadowColor ||
              "shadow-[0_4px_20px_rgba(139,92,246,0.3)] border-[#8B5CF6]/40",
            isWelcome: false,
            actionText: "Explorar",
          };
        }),
      ];
    }

    const otherCats = bizCats.filter((c) => c.id !== firstCat?.id);
    return [
      welcomeSlide,
      ...otherCats.map((cat) => ({
        id: cat.id,
        title: cat.title,
        subtitle: cat.subtitle,
        image: cat.image || getCategoryVisual(cat.id).imageUrl,
        opacity: 0.6,
        fromColor: cat.fromColor || "from-neutral-900 via-neutral-800",
        toColor: cat.toColor || "to-[#10B981]/60",
        shadowColor:
          cat.shadowColor ||
          "shadow-[0_4px_20px_rgba(16,185,129,0.3)] border-[#10B981]/40",
        isWelcome: false,
        actionText: `Ir a ${cat.title.replace("Explorar ", "")}`,
      })),
    ];
  }, [settings]);

  const handleScroll = React.useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      if (clientWidth > 0) {
        const idx = Math.round(scrollLeft / clientWidth);
        setActiveSlideIdx(idx);
      }
    }
  }, []);

  const goToSlide = (idx: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: idx * scrollRef.current.clientWidth,
        behavior: "smooth",
      });
      setActiveSlideIdx(idx);
    }
  };

  React.useEffect(() => {
    // Pre-load images
    slides.forEach((slide) => {
      if (slide.image) {
        const img = new Image();
        img.src = slide.image;
      }
    });

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
          setActiveSlideIdx(0);
        } else {
          scrollRef.current.scrollBy({ left: clientWidth, behavior: "smooth" });
          setActiveSlideIdx((prev) => (prev + 1) % slides.length);
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [slides]);

  return (
    <div className="relative w-full rounded-2xl sm:rounded-[2rem] overflow-hidden min-h-[260px] sm:min-h-[340px] md:min-h-[380px] shadow-[0_8px_30px_rgba(0,0,0,0.6)] group golden-glow-module">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar absolute inset-0"
      >
        {slides.map((slide, idx) => {
          const catVisual = getCategoryVisual(slide.id);

          return (
            <div
              key={idx}
              className="w-full h-full shrink-0 snap-center relative"
            >
              {/* Bottom and side gradient for contrast so the card and photo balance gracefully */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-0 bg-[#0B0B0B]">
                <img
                  src={slide.image || catVisual?.imageUrl}
                  alt={slide.title}
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  style={{ opacity: 1 }}
                  onError={(e) => {
                    if (catVisual?.imageUrl && e.currentTarget.src !== catVisual.imageUrl) {
                      e.currentTarget.src = catVisual.imageUrl;
                    }
                  }}
                />
              </div>

              {/* Contenedor alineado a la parte inferior izquierda */}
              <div className="relative z-20 h-full p-2.5 sm:p-4 pb-2.5 sm:pb-3.5 flex flex-col justify-end items-start pointer-events-none">
                {/* Tarjeta interna compacta, moderna e interactiva */}
                <div
                  onClick={() => onExploreClick(slide.id as any)}
                  className="pointer-events-auto bg-black/70 hover:bg-black/85 backdrop-blur-xl p-2.5 sm:p-3.5 rounded-2xl border border-white/15 hover:border-amber-400/50 shadow-[0_8px_25px_rgba(0,0,0,0.7)] max-w-[210px] sm:max-w-[250px] cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] group/hero-card"
                >
                  {/* Category Chip Badge */}
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-white/10 text-white/95 border border-white/15 backdrop-blur-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{catVisual?.emoji || "✨"}</span>
                      <span className="tracking-wide truncate max-w-[90px]">{catVisual?.name || "Categoría"}</span>
                    </span>
                    <span className="text-[9px] font-mono font-medium text-white/50 shrink-0">
                      {idx + 1}/{slides.length}
                    </span>
                  </div>

                  {/* Título conciso */}
                  {slide.isWelcome ? (
                    <h2 className="text-xs sm:text-sm font-normal text-white leading-tight drop-shadow-md">
                      {slide.title}{" "}
                      <span className="font-black bg-gradient-to-r from-red-400 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
                        {settings?.appName || "SmartBite"}
                      </span>
                    </h2>
                  ) : (
                    <h2 className="text-xs sm:text-sm font-black text-white leading-tight drop-shadow-md group-hover/hero-card:text-amber-300 transition-colors truncate">
                      {slide.title}
                    </h2>
                  )}

                  {/* Subtítulo ultra compacto (1 línea en móvil) */}
                  {slide.subtitle && (
                    <p className="text-[10px] sm:text-[11px] text-neutral-300/80 font-medium leading-snug drop-shadow line-clamp-1 mt-0.5 mb-2">
                      {slide.subtitle}
                    </p>
                  )}

                  {/* Botón CTA moderno, pequeño e interactivo */}
                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onExploreClick(slide.id as any);
                      }}
                      className={`w-fit bg-gradient-to-r ${slide.fromColor} ${slide.toColor} text-white font-bold text-[10px] sm:text-[11px] px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl ${slide.shadowColor} flex items-center gap-1 border border-white/20 hover:scale-105 active:scale-95 transition-all shadow-md group/btn`}
                    >
                      <span className="truncate">{slide.actionText}</span>
                      <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform shrink-0" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navegación interactiva de slides (Paginación moderna inferior derecha) */}
      <div className="absolute bottom-3.5 right-3.5 sm:bottom-5 sm:right-6 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/10 shadow-lg">
        <button
          type="button"
          onClick={() => goToSlide(activeSlideIdx - 1 < 0 ? slides.length - 1 : activeSlideIdx - 1)}
          className="w-5 h-5 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          title="Slide anterior"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-1 px-1">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goToSlide(i)}
              className={`transition-all duration-300 rounded-full ${
                activeSlideIdx === i
                  ? "w-5 sm:w-6 h-1.5 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                  : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"
              }`}
              title={`Ir al slide ${i + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => goToSlide((activeSlideIdx + 1) % slides.length)}
          className="w-5 h-5 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          title="Slide siguiente"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

interface HomeSearchResultsProps {
  processedRestaurants: Restaurant[];
  filteredProducts: Product[];
  currentTime: Date;
  isRestaurantOpen: (r: Restaurant, time: Date) => boolean;
  navigate: (path: string) => void;
  formatCurrency: (amount: number) => string;
  favoriteProducts: Set<string>;
  onToggleProductFavorite: (e: React.MouseEvent, id: string) => void;
  onProductClick: (p: Product) => void;
  user: any;
  setLoginPromptOpen: (open: boolean) => void;
  restaurants: Restaurant[];
}

const HomeSearchResults: React.FC<HomeSearchResultsProps> = ({
  processedRestaurants,
  filteredProducts,
  currentTime,
  isRestaurantOpen,
  navigate,
  formatCurrency,
  favoriteProducts,
  onToggleProductFavorite,
  onProductClick,
  user,
  setLoginPromptOpen,
  restaurants,
}) => {
  return (
    <div className="px-4 py-6">
      <h2 className="text-xl font-bold mb-4">Resultados de búsqueda</h2>

      {processedRestaurants.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3 text-on-surface-variant">
            Restaurantes
          </h3>
          <div className="space-y-4">
            {processedRestaurants.map((r) => (
              <Link
                key={r.id}
                to={`/r/${r.id}`}
                className="flex items-center gap-4 bg-[#0B0B0B] p-3 rounded-2xl shadow-sm group golden-glow-module"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-base flex items-center justify-center shrink-0">
                  {r.logo ? (
                    <img
                      src={r.logo}
                      alt={r.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store className="w-8 h-8 text-neutral-200" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-on-surface">{r.name}</h4>
                  <p className="text-sm text-on-surface-muted">{r.type}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {!isRestaurantOpen(r, currentTime) ? (
                      <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded-md inline-block">
                        Cerrado
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                        Abierto
                      </span>
                    )}
                    {r.referralEnabled && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          navigate(`/referrals-info/${r.id}`);
                        }}
                        className="text-[9px] font-black text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 uppercase tracking-widest px-2 py-0.5 rounded-md inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        🎁 Refiere y Gana
                      </button>
                    )}
                    {r.highlightMessage && (
                      <motion.span
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md"
                      >
                        Aviso.! {r.highlightMessage}
                      </motion.span>
                    )}
                  </div>
                </div>
                <div className="bg-orange-500 text-on-surface px-3 py-2 rounded-xl text-xs font-black shadow-md group-hover:scale-105 transition-transform shrink-0">
                  Ver
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {filteredProducts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-on-surface-variant">
            Platos
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map((p) => {
              const rest = restaurants.find((r) => r.id === p.restaurantId);
              return (
                <Link
                  key={p.id}
                  to={`/r/${p.restaurantId}`}
                  className="bg-[#0B0B0B] rounded-[1.5rem] shadow-sm overflow-hidden flex flex-col golden-glow-module"
                >
                  <div className="h-32 w-full bg-surface-variant relative flex items-center justify-center">
                    {p.images[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ShoppingBag className="w-10 h-10 text-on-surface-variant" />
                    )}
                    {rest && (
                      <div className="absolute top-2 left-2 max-w-[70%] z-10">
                        <span className="bg-black/80 backdrop-blur-md text-[#FFB057] text-[10px] font-black px-2 py-1 rounded-lg truncate block border border-white/10 shadow-lg">
                          {rest.name}
                        </span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        onClick={(e) => onToggleProductFavorite(e, p.id)}
                        className={`p-1.5 rounded-xl backdrop-blur-md shadow-lg border border-white/20 transition-all active:scale-90 ${
                          favoriteProducts.has(p.id)
                            ? "bg-rose-500/80 text-on-surface"
                            : "bg-surface/80 text-on-surface"
                        }`}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${favoriteProducts.has(p.id) ? "fill-current" : ""}`}
                        />
                      </button>
                    </div>
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <h4 className="font-bold text-on-surface text-sm line-clamp-1">
                      {p.name}
                    </h4>
                    <div className="mt-auto pt-2 flex items-center justify-between">
                      <span className="text-xs font-black text-orange-500">
                        {formatCurrency(p.price)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (!user) {
                            setLoginPromptOpen(true);
                          } else {
                            onProductClick(p);
                          }
                        }}
                        className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center text-on-surface shadow-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

function AnimatedBannerSlider({
  banners,
  speed,
  heightClass = "h-40",
  centeredText = false,
}: {
  banners: Banner[];
  speed: number;
  heightClass?: string;
  centeredText?: boolean;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (speed <= 0 || banners.length <= 1) return;
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          scrollRef.current.scrollBy({ left: clientWidth, behavior: "smooth" });
        }
      }
    }, speed * 1000);
    return () => clearInterval(interval);
  }, [speed, banners.length]);

  if (banners.length === 0)
    return <div className="p-4 text-center">No hay banners disponibles.</div>;

  return (
    <div
      className={`relative w-full ${heightClass} rounded-[2rem] overflow-hidden bg-surface-variant hero-banner-glow`}
    >
      <div
        ref={scrollRef}
        className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
      >
        {banners.map((banner, idx) => (
          <div
            key={idx}
            className="w-full h-full shrink-0 snap-center relative"
          >
            {banner.imageUrl ? (
              <img
                src={banner.imageUrl}
                alt={banner.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-surface-variant flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-on-surface-muted" />
              </div>
            )}
            {centeredText ? (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4">
                <h3 className="text-on-surface font-bold text-xl text-center tracking-wide">
                  {banner.title}
                </h3>
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                <h3 className="text-on-surface font-bold text-lg">
                  {banner.title}
                </h3>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function InteractiveRestaurantCardSlider({
  restaurants,
  favoriteRestaurants,
  handleToggleFavorite,
  restaurantRatings,
  currentTime,
  realDistancesMap,
  userLocation,
}: {
  restaurants: Restaurant[];
  favoriteRestaurants: Set<string>;
  handleToggleFavorite: (e: React.MouseEvent, id: string) => void;
  restaurantRatings: Record<string, { average: number; count: number }>;
  currentTime: Date;
  realDistancesMap?: Record<string, RealDistanceResult>;
  userLocation?: {
    lat?: number | null;
    lng?: number | null;
    city?: string | null;
    address?: string | null;
  };
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic card width calculation (card + 24px gap)
  const getCardWidth = () => {
    if (!containerRef.current) return 364;
    const firstCard = containerRef.current.querySelector<HTMLElement>('[data-restaurant-card]');
    if (firstCard) {
      return firstCard.offsetWidth + 24;
    }
    return 364;
  };

  const scrollToCard = (index: number) => {
    if (!containerRef.current) return;
    const count = restaurants.length;
    if (count === 0) return;

    const targetIndex = ((index % count) + count) % count;
    const cardWidth = getCardWidth();

    containerRef.current.scrollTo({
      left: targetIndex * cardWidth,
      behavior: "smooth",
    });
    setActiveIndex(targetIndex);
  };

  const handleNext = () => {
    handleUserActivity();
    scrollToCard(activeIndex + 1);
  };

  const handlePrev = () => {
    handleUserActivity();
    scrollToCard(activeIndex - 1);
  };

  const handleUserActivity = () => {
    setIsInteracting(true);
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
    resumeTimeoutRef.current = setTimeout(() => {
      setIsInteracting(false);
    }, 3000);
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const cardWidth = getCardWidth();
    if (cardWidth > 0) {
      const newIndex = Math.round(containerRef.current.scrollLeft / cardWidth);
      if (newIndex >= 0 && newIndex < restaurants.length && newIndex !== activeIndex) {
        setActiveIndex(newIndex);
      }
    }
  };

  // Auto-advance every 2.8 seconds
  useEffect(() => {
    if (restaurants.length <= 1 || isInteracting) return;

    const interval = setInterval(() => {
      if (!containerRef.current) return;
      const count = restaurants.length;
      const cardWidth = getCardWidth();
      const nextIndex = (activeIndex + 1) % count;

      containerRef.current.scrollTo({
        left: nextIndex * cardWidth,
        behavior: "smooth",
      });
      setActiveIndex(nextIndex);
    }, 2800);

    return () => clearInterval(interval);
  }, [restaurants.length, isInteracting, activeIndex]);

  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, []);

  return (
    <div
      className="relative group/slider w-full"
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => {
        if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
        resumeTimeoutRef.current = setTimeout(() => setIsInteracting(false), 2000);
      }}
      onTouchStart={handleUserActivity}
      onTouchMove={handleUserActivity}
      onWheel={handleUserActivity}
    >
      {/* Visual Navigation Header & Slide Indicator */}
      {restaurants.length > 1 && (
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#FFD700] bg-black/60 backdrop-blur-md border border-[#FFD700]/30 px-3 py-1 rounded-full shadow-lg shadow-[#FFD700]/5 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#FF8A00] animate-ping" />
              <span>↔ Desliza para explorar</span>
            </span>
            <span className="text-[11px] font-bold text-neutral-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
              {activeIndex + 1} de {restaurants.length}
            </span>
          </div>

          {/* Quick arrow controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              aria-label="Restaurante anterior"
              className="w-8 h-8 rounded-full bg-[#121212] border border-white/10 text-white hover:bg-[#FF8A00] hover:text-black hover:border-[#FF8A00] transition-all active:scale-90 flex items-center justify-center shadow-lg"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Siguiente restaurante"
              className="w-8 h-8 rounded-full bg-[#121212] border border-white/10 text-white hover:bg-[#FF8A00] hover:text-black hover:border-[#FF8A00] transition-all active:scale-90 flex items-center justify-center shadow-lg"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* Floating directional buttons on desktop hover */}
      {restaurants.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            aria-label="Deslizar a la izquierda"
            className="hidden md:flex absolute -left-4 top-[50%] -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-white items-center justify-center shadow-[0_4px_25px_rgba(0,0,0,0.8)] hover:bg-[#FF8A00] hover:text-black hover:border-[#FF8A00] hover:scale-110 active:scale-95 transition-all opacity-0 group-hover/slider:opacity-100"
          >
            <ChevronLeft className="w-6 h-6 stroke-[3]" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Deslizar a la derecha"
            className="hidden md:flex absolute -right-4 top-[50%] -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-white items-center justify-center shadow-[0_4px_25px_rgba(0,0,0,0.8)] hover:bg-[#FF8A00] hover:text-black hover:border-[#FF8A00] hover:scale-110 active:scale-95 transition-all opacity-0 group-hover/slider:opacity-100"
          >
            <ChevronRight className="w-6 h-6 stroke-[3]" />
          </button>
        </>
      )}

      {/* Scrollable Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-6 pb-4 -mx-4 px-4 scroll-smooth"
        style={{ scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}
      >
        {restaurants.map((r) => {
          const prox = userLocation
            ? getRestaurantProximity(r, userLocation, realDistancesMap?.[r.id])
            : undefined;
          return (
            <div key={r.id} data-restaurant-card className="snap-start shrink-0">
              <RestaurantCardPremium
                restaurant={r}
                isFavorite={favoriteRestaurants.has(r.id)}
                onToggleFavorite={(e) => handleToggleFavorite(e, r.id)}
                rating={restaurantRatings[r.id] || null}
                isOpen={isRestaurantOpen(r, currentTime)}
                proximity={prox}
              />
            </div>
          );
        })}
      </div>

      {/* Interactive Dots Pagination */}
      {restaurants.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {restaurants.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                handleUserActivity();
                scrollToCard(idx);
              }}
              aria-label={`Ir al restaurante ${idx + 1}`}
              className={`transition-all duration-300 rounded-full ${
                idx === activeIndex
                  ? "w-7 h-2 bg-gradient-to-r from-[#FF8A00] to-[#FFD700] shadow-[0_0_12px_rgba(255,138,0,0.8)]"
                  : "w-2 h-2 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FeaturedRestaurantsSlider({
  restaurants,
  speed = 5,
  currentTime,
  favoriteRestaurants,
  handleToggleFavorite,
  restaurantRatings,
  userLocation,
  realDistancesMap,
}: {
  restaurants: Restaurant[];
  speed?: number;
  currentTime: Date;
  favoriteRestaurants: Set<string>;
  handleToggleFavorite: (e: React.MouseEvent, id: string) => void;
  restaurantRatings: Record<string, { average: number; count: number }>;
  userLocation?: {
    lat?: number | null;
    lng?: number | null;
    city?: string | null;
    address?: string | null;
  };
  realDistancesMap?: Record<string, RealDistanceResult>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  if (restaurants.length === 0)
    return (
      <div className="p-4 text-center">No hay restaurantes disponibles.</div>
    );

  const getCardWidth = () => {
    if (!containerRef.current) return 196;
    const firstCard = containerRef.current.querySelector<HTMLElement>('[data-featured-card]');
    if (firstCard) {
      return firstCard.offsetWidth + 16;
    }
    return 196;
  };

  const scrollToCard = (index: number) => {
    if (!containerRef.current) return;
    const count = restaurants.length;
    if (count === 0) return;
    const targetIndex = ((index % count) + count) % count;
    const cardWidth = getCardWidth();

    containerRef.current.scrollTo({
      left: targetIndex * cardWidth,
      behavior: "smooth",
    });
    setActiveIndex(targetIndex);
  };

  const handleNext = () => {
    handleActivity();
    scrollToCard(activeIndex + 1);
  };

  const handlePrev = () => {
    handleActivity();
    scrollToCard(activeIndex - 1);
  };

  const handleActivity = () => {
    setIsPaused(true);
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 3000);
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const cardWidth = getCardWidth();
    if (cardWidth > 0) {
      const newIndex = Math.round(containerRef.current.scrollLeft / cardWidth);
      if (newIndex >= 0 && newIndex < restaurants.length && newIndex !== activeIndex) {
        setActiveIndex(newIndex);
      }
    }
  };

  // Auto-slide every 3 seconds
  useEffect(() => {
    if (isPaused || restaurants.length <= 1) return;

    const interval = setInterval(() => {
      if (!containerRef.current) return;
      const count = restaurants.length;
      const cardWidth = getCardWidth();
      const nextIndex = (activeIndex + 1) % count;

      containerRef.current.scrollTo({
        left: nextIndex * cardWidth,
        behavior: "smooth",
      });
      setActiveIndex(nextIndex);
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused, restaurants.length, activeIndex]);

  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, []);

  return (
    <div
      className="relative group/featured w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
        resumeTimeoutRef.current = setTimeout(() => setIsPaused(false), 2000);
      }}
      onTouchStart={handleActivity}
      onTouchMove={handleActivity}
    >
      {/* Floating navigation controls for featured */}
      {restaurants.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            aria-label="Anterior destacado"
            className="hidden md:flex absolute -left-3 top-[40%] -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white items-center justify-center shadow-lg hover:bg-[#FF8A00] hover:text-black transition-all opacity-0 group-hover/featured:opacity-100"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Siguiente destacado"
            className="hidden md:flex absolute -right-3 top-[40%] -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white items-center justify-center shadow-lg hover:bg-[#FF8A00] hover:text-black transition-all opacity-0 group-hover/featured:opacity-100"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </>
      )}

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="relative overflow-x-auto hide-scrollbar -mx-4 px-4 bg-transparent flex gap-4 snap-x snap-mandatory scroll-smooth"
        style={{ scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}
      >
        {restaurants.map((r, idx) => (
          <Link
            key={`${r.id}-${idx}`}
            data-featured-card
            to={`/r/${r.id}`}
            className="group relative flex flex-col p-3 rounded-[1.8rem] bg-[#0B0B0B] overflow-hidden transition-all active:scale-[0.98] w-[180px] shrink-0 snap-start shadow-[0_4px_20px_rgba(0,0,0,0.3)] golden-glow-module"
          >
            <div className="relative h-[130px] w-full rounded-[1.2rem] overflow-hidden flex items-center justify-center bg-zinc-800">
              {r.logo ? (
                <img
                  src={r.logo}
                  alt={r.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Store className="w-10 h-10 text-neutral-200" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

              {/* Distance badge if userLocation provided */}
              {(() => {
                if (!userLocation) return null;
                const prox = getRestaurantProximity(r, userLocation, realDistancesMap?.[r.id]);
                return (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-[#FFD700]/30 text-[#FFD700] text-[10px] font-black flex items-center gap-1 z-10 shadow-sm">
                    <Navigation className="w-2.5 h-2.5 fill-current rotate-45 text-[#FF8A00]" />
                    <span>{prox.formattedDistance}</span>
                    {realDistancesMap?.[r.id]?.isRealDriving && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Ruta real Mapbox" />
                    )}
                  </div>
                );
              })()}

              <button
                onClick={(e) => handleToggleFavorite(e, r.id)}
                className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all active:scale-90 z-10 flex items-center justify-center ${
                  favoriteRestaurants.has(r.id)
                    ? "bg-[#FF8A00] text-on-surface shadow-lg shadow-[#FF8A00]/20"
                    : "bg-black/30 text-on-surface hover:bg-black/50"
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${favoriteRestaurants.has(r.id) ? "fill-current" : ""}`}
                />
              </button>

              {!isRestaurantOpen(r, currentTime) && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <span className="bg-rose-500 text-on-surface text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Cerrado
                  </span>
                </div>
              )}
            </div>

            <div className="pt-3 px-1">
              <h3 className="font-bold text-on-surface text-[13px] truncate tracking-tight mb-1">
                {r.name}
              </h3>
              <div className="flex items-center gap-2 text-[11px] font-medium text-[#A0A0A0]">
                <div className="flex items-center gap-0.5 text-on-surface">
                  <Star className="w-3.5 h-3.5 text-[#FFB347] fill-current" />
                  <span>
                    {restaurantRatings[r.id]?.average
                      ? restaurantRatings[r.id].average.toFixed(1)
                      : "4.5"}
                  </span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#A0A0A0]" />
                  <span>
                    {(r.name.length % 2 === 0 ? "20-30" : "30-45") + " min"}
                  </span>
                </div>
              </div>
              <div className="mt-1.5 flex">
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-sm">
                  Envío gratis
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const { user, appUser, setLoginPromptOpen } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Search and Filtering State
  const [activeBusinessCategory, setActiveBusinessCategory] =
    useState<string>("restaurant");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [minRating, setMinRating] = useState<string | number | null>(null);
  const [maxDeliveryTime, setMaxDeliveryTime] = useState<
    string | number | null
  >(null);
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [filterFeatured, setFilterFeatured] = useState<any>(false);
  const [showFilters, setShowFilters] = useState(false);

  // User Location State
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [userCity, setUserCity] = useState(
    localStorage.getItem("userCity") || "",
  );
  const [userDepartment, setUserDepartment] = useState(
    localStorage.getItem("userDepartment") || "",
  );
  const [userAddress, setUserAddress] = useState(
    localStorage.getItem("userAddress") || "",
  );

  // Persist location changes
  useEffect(() => {
    if (userCity) localStorage.setItem("userCity", userCity);
    if (userDepartment) localStorage.setItem("userDepartment", userDepartment);
    if (userAddress) localStorage.setItem("userAddress", userAddress);
  }, [userCity, userDepartment, userAddress]);
  const [isLocating, setIsLocating] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [manualAddress, setManualAddress] = useState("");

  const [selectedProductForModal, setSelectedProductForModal] =
    useState<Product | null>(null);
  const { addToCart } = useCart();
  const userName =
    appUser?.displayName?.split(" ")[0] ||
    user?.user_metadata?.full_name?.split(" ")[0] ||
    "Usuario";
  const userAvatar =
    appUser?.avatarUrl ||
    user?.user_metadata?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`;
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteAllNotifications,
  } = useNotifications();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isRestaurantsLoading, setIsRestaurantsLoading] = useState(true);

  // Mapbox real driving distances map
  const [realDistancesMap, setRealDistancesMap] = useState<Record<string, RealDistanceResult>>({});

  // Batch calculate real Mapbox driving distances when restaurants or location changes
  useEffect(() => {
    if (!restaurants || restaurants.length === 0) return;
    let isMounted = true;
    batchResolveRestaurantDistances(restaurants, {
      lat: userLat,
      lng: userLng,
      city: userCity || "Maicao",
      address: userAddress,
    }).then((map) => {
      if (isMounted) setRealDistancesMap(map);
    }).catch((err) => {
      console.warn("Mapbox batch distance failed in Home:", err);
    });

    return () => {
      isMounted = false;
    };
  }, [restaurants, userLat, userLng, userCity, userAddress]);
  const [allProducts, setAllProducts] = useState<
    (Product & { restaurantId: string; restaurantName: string })[]
  >([]);
  const [popularDishes, setPopularDishes] = useState<
    (Product & { restaurantId: string; restaurantName: string })[]
  >([]);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);

  const businessCategories = React.useMemo(() => {
    return (settings?.businessCategories || []).filter((bc) => bc.active);
  }, [settings]);

  // Sincronizar categoría activa si la actual fue desactivada o eliminada
  useEffect(() => {
    if (businessCategories.length > 0) {
      const exists = businessCategories.some((c) => c.id === activeBusinessCategory);
      if (!exists) {
        setActiveBusinessCategory(businessCategories[0].id);
      }
    }
  }, [businessCategories, activeBusinessCategory]);
  const [restaurantRatings, setRestaurantRatings] = useState<
    Record<string, { average: number; count: number }>
  >({});
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<Set<string>>(
    new Set(),
  );
  const [favoriteProducts, setFavoriteProducts] = useState<Set<string>>(
    new Set(),
  );

  const [activeOrder, setActiveOrder] = useState<any>(null);

  // Ruleta Pay State
  const [showRuletaPay, setShowRuletaPay] = useState(false);
  const [userLoyaltyPoints, setUserLoyaltyPoints] = useState<number>(2450);
  const [userLiveLevel, setUserLiveLevel] = useState<number>(1);
  const [userXP, setUserXP] = useState<number>(0);

  useEffect(() => {
    const fetchUserPointsAndLevel = async () => {
      if (!user) {
        setUserLoyaltyPoints(2450); // Fallback mockup
        setUserLiveLevel(1);
        setUserXP(0);
        return;
      }
      try {
        const points = await db.getUserLoyaltyPoints(user.id);
        setUserLoyaltyPoints(points);

        const gamData = await db.getUserGamification(user.id);
        if (gamData) {
          setUserLiveLevel(gamData.level || 1);
          setUserXP(gamData.xp || 0);
        }
      } catch (err) {
        console.error(
          "Error fetching loyalty points/gamification on Home",
          err,
        );
      }
    };
    fetchUserPointsAndLevel();
  }, [user]);

  const levelDetails = useMemo(() => {
    const level = userLiveLevel;
    const currentPoints = userXP;
    const nextLimit = level * 50;
    const prevLimit = (level - 1) * 50;
    const pointsRemaining = nextLimit - currentPoints;
    const percent = Math.max(
      0,
      Math.min(100, ((currentPoints - prevLimit) / 50) * 100),
    );

    // Determine the next reward description based on gamification levels
    let nextRewardDesc = "Beneficios Exclusivos";
    if (level < 2) nextRewardDesc = "Activar membresía base";
    else if (level < 5) nextRewardDesc = "Descuentos en Envíos";
    else if (level < 10) nextRewardDesc = "Cupones de Bebidas";
    else nextRewardDesc = "Nivel VIP Global";

    return {
      level,
      currentPoints,
      nextLevelPoints: nextLimit,
      pointsRemaining: pointsRemaining > 0 ? pointsRemaining : 0,
      progressPercent: percent,
      nextRewardPoints: `${nextLimit}`,
      nextRewardDesc,
    };
  }, [userLiveLevel, userXP]);

  // Lucky Wheel State
  const [pendingSpin, setPendingSpin] = useState<any>(null);
  const [showWheelBanner, setShowWheelBanner] = useState(false);
  const [wheelCountdown, setWheelCountdown] = useState(0);
  const [showWheelModal, setShowWheelModal] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [wonPrizeData, setWonPrizeData] = useState<{
    text: string;
    isPrize: boolean;
  } | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const checkWheel = () => {
      const data = localStorage.getItem("pendingWheelSpin");
      if (data) {
        try {
          const parsed = JSON.parse(data);
          const elapsed = Math.floor((Date.now() - parsed.timestamp) / 1000);
          const remaining = Math.max(0, (parsed.countdown || 60) - elapsed);

          if (remaining > 0 || elapsed < (parsed.countdown || 60) + 300) {
            setPendingSpin(parsed);
            setWheelCountdown(remaining);
            setShowWheelBanner(true);

            // Auto open modal when timer reaches zero
            if (remaining === 0 && !showWheelModal) {
              setShowWheelModal(true);
            }
          } else {
            localStorage.removeItem("pendingWheelSpin");
            setShowWheelBanner(false);
          }
        } catch (e) {
          localStorage.removeItem("pendingWheelSpin");
          setShowWheelBanner(false);
        }
      }
    };

    checkWheel();

    // Interval that checks LS and handles countdown
    timer = setInterval(() => {
      checkWheel();
    }, 1000);

    return () => clearInterval(timer);
  }, [showWheelModal]);

  useEffect(() => {
    const fetchActiveOrder = async () => {
      let active = null;
      if (user) {
        const userOrders = await db.getUserOrders(user.id);
        active =
          userOrders.find(
            (o) => !["completed", "cancelled", "rejected"].includes(o.status),
          ) || null;
      }

      if (!active) {
        const lastOrderId = localStorage.getItem("lastOrderId");
        if (lastOrderId) {
          const { data } = await db.getOrder(lastOrderId);
          if (
            data &&
            !["completed", "cancelled", "rejected"].includes(data.status)
          ) {
            active = data;
          } else {
            localStorage.removeItem("lastOrderId");
          }
        }
      }
      setActiveOrder(active);
    };

    fetchActiveOrder();

    window.addEventListener("new-guest-order", fetchActiveOrder);

    let unsubscribe = () => {};
    if (user) {
      unsubscribe = db.subscribeToUserOrders(user.id, (updatedOrders) => {
        const active = updatedOrders.find(
          (o) => !["completed", "cancelled", "rejected"].includes(o.status),
        );
        if (active) setActiveOrder(active);
      });
    }

    const interval = setInterval(fetchActiveOrder, 30000);

    return () => {
      window.removeEventListener("new-guest-order", fetchActiveOrder);
      unsubscribe();
      clearInterval(interval);
    };
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  useEffect(() => {
    const fetchCoreData = async () => {
      try {
        const [rData, sData] = await Promise.all([
          db.getRestaurants(),
          db.getPlatformSettings(),
        ]);
        setRestaurants(rData);
        setSettings(sData);

        // Initial partial mapping for ratings if it's coming from restaurant object now
        const initialRatings: Record<
          string,
          { average: number; count: number }
        > = {};
        rData.forEach((r) => {
          if (r.rating !== undefined) {
            initialRatings[r.id] = {
              average: r.rating || 0,
              count: r.reviewsCount || 0,
            };
          }
        });
        setRestaurantRatings(initialRatings);
      } catch (error) {
        console.error("Home: Error loading core data:", error);
      } finally {
        setIsRestaurantsLoading(false);
      }
    };

    const fetchProductData = async () => {
      try {
        // Fetch popular dishes separately (fast)
        const popular = await db.getPopularProducts(8);
        setPopularDishes(popular);

        // Fetch all products only if needed?
        // For now, fetch them in background so search is ready
        const pData = await db.getAllProducts();
        setAllProducts(pData);
      } catch (error) {
        console.error("Home: Error loading products:", error);
      }
    };

    fetchCoreData();
    fetchProductData();

    // Fetch favorites
    if (user) {
      db.getUserFavorites(user.id).then((favs) => {
        setFavoriteRestaurants(new Set(favs.map((r) => r.id)));
      });
      db.getUserProductFavorites(user.id).then((favs) => {
        setFavoriteProducts(new Set(favs.map((p) => p.id)));
      });
    }

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, [user]);

  const requestLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      setIsLocating(false);
      setModalStep(1);
      setShowLocationModal(true);
      return;
    }

    let resolved = false;

    // Fallback manual por si el navegador bloquea el callback silenciosamente
    const fallbackTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn("Geolocalización demoró demasiado. Usando modal manual.");
        setIsLocating(false);
        setModalStep(1);
        setShowLocationModal(true);
      }
    }, 8000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(fallbackTimer);
        try {
          const { latitude, longitude } = position.coords;
          setUserLat(latitude);
          setUserLng(longitude);
          const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

          if (!mapboxToken) {
            console.warn(
              "Mapbox token no configurado. Mostrando modal manual.",
            );
            setIsLocating(false);
            setModalStep(1);
            setShowLocationModal(true);
            return;
          }

          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}&types=place,region&language=es`,
          );

          const data = await response.json();

          if (data.features && data.features.length > 0) {
            let foundCity = null;
            let foundDepartment = null;

            data.features.forEach((feature: any) => {
              if (feature.place_type.includes("place")) {
                foundCity = feature.text;
              }
              if (feature.place_type.includes("region")) {
                foundDepartment = feature.text;
              }
            });

            if (foundCity) {
              const normalizedCity = foundCity
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");
              let matchedCity = foundCity;

              const allDepts = getDepartments();
              for (const dept of allDepts) {
                const cities = getCitiesByDepartment(dept);
                const match = cities.find(
                  (c) =>
                    c
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .toLowerCase() === normalizedCity.toLowerCase(),
                );
                if (match) {
                  matchedCity = match;
                  foundDepartment = dept;
                  break;
                }
              }

              setUserCity(matchedCity);
              if (foundDepartment) setUserDepartment(foundDepartment);
              // Also ensure we show modal if we only got city but no address
              if (!localStorage.getItem("userAddress")) {
                setModalStep(2);
                setShowLocationModal(true);
              }
            } else {
              setModalStep(1);
              setShowLocationModal(true);
            }
          } else {
            setModalStep(1);
            setShowLocationModal(true);
          }
        } catch (error) {
          console.error("Error al obtener ubicación:", error);
          setModalStep(1);
          setShowLocationModal(true);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(fallbackTimer);
        console.warn("Error de geolocalización (permitido o esperado):", error);
        setIsLocating(false);
        setModalStep(1);
        setShowLocationModal(true);
      },
      { timeout: 10000 },
    );
  };

  useEffect(() => {
    if (!userCity && !showLocationModal) {
      requestLocation();
    }
  }, []);

  // Distance Helper
  const getDistance = (
    lat1?: number,
    lon1?: number,
    lat2?: number,
    lon2?: number,
  ) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 999999; // Fallback distance
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const normalizeCityName = (city: string) => {
    if (!city) return "";
    return city
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  // Filter and Sort Logic
  const processedRestaurants = [...restaurants]
    .filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.type.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" ||
        r.type.toLowerCase() === selectedCategory.toLowerCase();

      // Sincronización robusta con categoría de negocio y comercios
      const matchesBusinessCategory = matchRestaurantToCategory(r, activeBusinessCategory);

      const isActive = !r.status || r.status === "active";

      const realRating = restaurantRatings[r.id]?.average || 0;
      const mockDeliveryTime = ((r.name.length % 4) + 2) * 10;

      const matchesRating =
        minRating === null || realRating >= Number(minRating);
      const matchesTime =
        maxDeliveryTime === null || mockDeliveryTime <= Number(maxDeliveryTime);
      const matchesFeatured = !filterFeatured || r.isFeatured;

      // Location matching is moved to sorting priority to fulfill user request of showing "all organized"
      const matchesLocation = true;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesBusinessCategory &&
        matchesRating &&
        matchesTime &&
        matchesFeatured &&
        isActive
      );
    })
    .sort((a, b) => {
      // Priority 1: City Match (User's city first)
      const normalizedUserCity = normalizeCityName(userCity || "");
      const aInCity = normalizeCityName(a.city || "") === normalizedUserCity;
      const bInCity = normalizeCityName(b.city || "") === normalizedUserCity;

      if (aInCity && !bInCity) return -1;
      if (!aInCity && bInCity) return 1;

      // Priority 2: Department Match (User's department next)
      const normalizedUserDep = normalizeCityName(userDepartment || "");
      const aInDep =
        normalizeCityName(a.department || "") === normalizedUserDep;
      const bInDep =
        normalizeCityName(b.department || "") === normalizedUserDep;

      if (aInDep && !bInDep) return -1;
      if (!aInDep && bInDep) return 1;

      // Priority 3: Proximity / Distance to user GPS or address
      const userLoc = {
        lat: userLat,
        lng: userLng,
        city: userCity || "Maicao",
        address: userAddress,
      };
      const proxA = getRestaurantProximity(a, userLoc);
      const proxB = getRestaurantProximity(b, userLoc);
      const distDiff = proxA.distanceKm - proxB.distanceKm;

      if (Math.abs(distDiff) > 0.05) {
        return distDiff;
      }

      // Priority 4: Merit Score
      const aRating = restaurantRatings[a.id]?.average || 0;
      const bRating = restaurantRatings[b.id]?.average || 0;
      const aReviews = restaurantRatings[a.id]?.count || 0;
      const bReviews = restaurantRatings[b.id]?.count || 0;

      const aMerit = calculateRestaurantMeritScore(a, aReviews, aRating).score;
      const bMerit = calculateRestaurantMeritScore(b, bReviews, bRating).score;

      return bMerit - aMerit;
    });

  // Fallback if everything is filtered out
  const finalRestaurants = processedRestaurants;

  const allFilteredProducts = allProducts
    .filter((p) => {
      const restaurant = restaurants.find((r) => r.id === p.restaurantId);
      if (!restaurant) return false;

      const normalizedRestCity = normalizeCityName(restaurant.city || "");
      const normalizedUserCity = normalizeCityName(userCity || "");
      const normalizedRestDep = normalizeCityName(restaurant.department || "");
      const normalizedUserDep = normalizeCityName(userDepartment || "");

      const matchesLocation =
        !userCity ||
        (normalizedRestCity === normalizedUserCity &&
          (!userDepartment || normalizedRestDep === normalizedUserDep));

      const isActive = restaurant.status === "active";

      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" ||
        p.category.toLowerCase() === selectedCategory.toLowerCase();

      let matchesPrice = true;
      if (priceRange === "$") matchesPrice = p.price < 15000;
      else if (priceRange === "$$")
        matchesPrice = p.price >= 15000 && p.price <= 30000;
      else if (priceRange === "$$$") matchesPrice = p.price > 30000;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesPrice &&
        isActive &&
        matchesLocation
      );
    })
    .sort((a, b) => {
      const rA = restaurants.find((r) => r.id === a.restaurantId);
      const rB = restaurants.find((r) => r.id === b.restaurantId);

      if (!rA || !rB) return 0;

      const aRating = restaurantRatings[rA.id]?.average || 0;
      const bRating = restaurantRatings[rB.id]?.average || 0;
      const aReviews = restaurantRatings[rA.id]?.count || 0;
      const bReviews = restaurantRatings[rB.id]?.count || 0;

      const aMerit = calculateRestaurantMeritScore(rA, aReviews, aRating).score;
      const bMerit = calculateRestaurantMeritScore(rB, bReviews, bRating).score;

      if (aMerit !== bMerit) {
        return bMerit - aMerit;
      }

      return (
        getDistance(
          userLat || undefined,
          userLng || undefined,
          rA.latitude,
          rA.longitude,
        ) -
        getDistance(
          userLat || undefined,
          userLng || undefined,
          rB.latitude,
          rB.longitude,
        )
      );
    });

  const isSearchActive =
    search.trim().length > 0 ||
    (selectedCategory !== "all" && selectedCategory !== "") ||
    (minRating !== null && minRating !== undefined) ||
    (maxDeliveryTime !== null && maxDeliveryTime !== undefined) ||
    (priceRange !== null && priceRange !== undefined && priceRange !== "");

  const filteredProducts = allFilteredProducts;

  // Extract all active banners from settings
  const allBanners = (settings?.banners || []).filter((b) => b.active);

  const displayBanners = allBanners;

  const promotions = filteredProducts.filter(
    (p) => p.hasDiscount || p.isPromotion,
  );

  // All restaurants sorted strictly by proximity for the location section
  const cityProximityRestaurants = useMemo(() => {
    const userLoc = {
      lat: userLat,
      lng: userLng,
      city: userCity || "Maicao",
      address: userAddress,
    };

    // Filter active restaurants matching search if any
    const activeList = restaurants.filter((r) => {
      const isActive = !r.status || r.status === "active";
      if (!isActive) return false;
      if (search.trim()) {
        const matchesSearch =
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.type.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;
      }
      return true;
    });

    const withProx = activeList.map((r) => ({
      restaurant: r,
      proximity: getRestaurantProximity(r, userLoc, realDistancesMap[r.id]),
    }));

    // Sort strictly by proximity (closest to user first)
    withProx.sort((a, b) => {
      const metersA = typeof a.proximity.distanceMeters === "number" && !isNaN(a.proximity.distanceMeters)
        ? a.proximity.distanceMeters
        : (a.proximity.distanceKm || 0) * 1000;
      const metersB = typeof b.proximity.distanceMeters === "number" && !isNaN(b.proximity.distanceMeters)
        ? b.proximity.distanceMeters
        : (b.proximity.distanceKm || 0) * 1000;
      return metersA - metersB;
    });

    return withProx;
  }, [restaurants, realDistancesMap, userLat, userLng, userCity, userAddress, search]);

  // Featured Restaurants
  const limit = settings?.featuredRestaurantsLimit || 5;
  const displayFeatured = userCity
    ? cityProximityRestaurants.map((x) => x.restaurant)
    : processedRestaurants.filter((r) => r.isFeatured).slice(0, limit);

  const handleToggleFavorite = async (
    e: React.MouseEvent,
    restaurantId: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Inicia sesión para guardar tus favoritos");
      return;
    }
    try {
      const added = await db.toggleFavorite(user.id, restaurantId);
      setFavoriteRestaurants((prev) => {
        const next = new Set(prev);
        if (added) next.add(restaurantId);
        else next.delete(restaurantId);
        return next;
      });
      toast.success(
        added ? "Restaurante agregado a favoritos" : "Eliminado de favoritos",
      );
    } catch (error) {
      toast.error("Error al actualizar favoritos");
    }
  };

  const handleToggleProductFavorite = async (
    e: React.MouseEvent,
    productId: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Inicia sesión para guardar tus favoritos");
      return;
    }
    try {
      const added = await db.toggleProductFavorite(user.id, productId);
      setFavoriteProducts((prev) => {
        const next = new Set(prev);
        if (added) next.add(productId);
        else next.delete(productId);
        return next;
      });
      toast.success(
        added ? "Producto agregado a favoritos" : "Eliminado de favoritos",
      );
    } catch (error) {
      toast.error("Error al actualizar favoritos");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this might go to a dedicated search results page
  };

  return (
    <div className="flex-1 w-full bg-surface-base pb-20 overflow-x-hidden">
      {/* Lucky Wheel Countdown Banner */}
      <AnimatePresence>
        {showWheelBanner && wheelCountdown > 0 && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-0 left-0 right-0 z-[200] bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 px-6 py-3 shadow-xl flex items-center justify-between pointer-events-auto"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                <RefreshCcw
                  className="w-5 h-5 text-on-surface animate-spin"
                  style={{ animationDuration: "3s" }}
                />
              </div>
              <div>
                <p className="text-on-surface font-black text-xs uppercase tracking-widest leading-none mb-1">
                  ¡Felicidades!
                </p>
                <p className="text-on-surface/90 text-[10px] font-bold truncate max-w-[200px] sm:max-w-md">
                  Has ganado un giro en la ruleta por tu compra en{" "}
                  {pendingSpin?.restaurantName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10 shrink-0 ml-4">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-on-surface/60 uppercase tracking-tighter leading-none mb-0.5">
                  Inicia en
                </span>
                <span className="text-xl font-black text-on-surface tabular-nums">
                  {wheelCountdown}s
                </span>
              </div>
              <div className="w-px h-6 bg-white/20 mx-1" />
              <button
                onClick={() => setShowWheelModal(true)}
                className="bg-white text-orange-600 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
              >
                Girar Ya
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lucky Wheel Modal */}
      <AnimatePresence>
        {showWheelModal && pendingSpin && (
          <LuckyWheel
            segments={pendingSpin.segments}
            onClose={() => {
              setShowWheelModal(false);
              setShowWheelBanner(false);

              if (pendingSpin && pendingSpin.whatsappPhone) {
                let rawPhone = pendingSpin.whatsappPhone.replace(/\D/g, "");
                if (rawPhone.length > 0) {
                  if (!rawPhone.startsWith("57") || rawPhone.length <= 10) {
                    if (rawPhone.startsWith("0"))
                      rawPhone = rawPhone.substring(1);
                    if (rawPhone.length <= 10) rawPhone = "57" + rawPhone;
                  }

                  let wpMsg =
                    pendingSpin.orderMessage ||
                    `*🍔 NUEVO PEDIDO*\nRestaurante: ${pendingSpin.restaurantName}\nTotal: $${pendingSpin.total}`;

                  if (hasSpun && wonPrizeData) {
                    if (wonPrizeData.isPrize !== false) {
                      wpMsg += `\n\n🎁 *PREMIO GANADO EN RULETA:* ${wonPrizeData.text}`;
                    } else {
                      wpMsg += `\n\n💬 *MENSAJE DE RULETA:* ${wonPrizeData.text}`;
                    }
                  }

                  const wpUrl = getWhatsAppNativeUrl(wpMsg, rawPhone);
                  setTimeout(() => {
                    window.location.href = wpUrl;
                  }, 500);
                }
              }

              localStorage.removeItem("pendingWheelSpin");
              setHasSpun(false);
              setWonPrizeData(null);
            }}
            onWin={async (prize, isPrize) => {
              setHasSpun(true);
              setWonPrizeData({ text: prize, isPrize: isPrize !== false });

              if (pendingSpin) {
                try {
                  const isPointsObj = /moneda|monedas|pts|pt/i.test(prize);
                  const isDelivered = isPointsObj;
                  let savedPrize = null;

                  if (isPointsObj && user) {
                    const matchNum = prize.match(/\d+/);
                    const numPointsGain = matchNum
                      ? parseInt(matchNum[0], 10)
                      : 5;
                    await db.addLoyaltyPoints(
                      user.id,
                      numPointsGain,
                      `Premio Ruleta: ${prize}`,
                      undefined,
                      pendingSpin.restaurantId,
                    );
                  }

                  try {
                    const { data } = await db.saveWheelPrize({
                      userId: user?.id || "guest",
                      restaurantId: pendingSpin.restaurantId,
                      prizeText: prize,
                      isPrize: isPrize !== false,
                      status: isDelivered ? "delivered" : "pending",
                    });
                    savedPrize = data;
                  } catch (e) {
                    console.warn("Could not save to wheel_prizes table:", e);
                  }

                  if (!savedPrize) {
                    savedPrize = {
                      id: "guest-" + Date.now(),
                      restaurant_id: pendingSpin.restaurantId,
                      prize_text: prize,
                      is_prize: isPrize !== false,
                      status: isDelivered ? "delivered" : "pending",
                    };
                  }

                  const lastOrderId = localStorage.getItem("lastOrderId");
                  if (lastOrderId) {
                    await db.addPrizeToOrder(lastOrderId, savedPrize);
                  }

                  if (isPrize !== false) {
                    toast.success(
                      `¡Felicidades! Ganaste: ${prize}. ${isPointsObj ? "Añadidos a tu baúl al instante." : user ? "Reclámalo en tu panel de 'Mis Premios'." : "Aparecerá en el resumen de tu pedido."}`,
                      {
                        icon: "🎁",
                        duration: 6000,
                      },
                    );
                  } else {
                    toast.success(`Mira lo que salió: ${prize}`, {
                      icon: "💬",
                      duration: 6000,
                    });
                  }
                } catch (err) {
                  console.error("Error saving prize:", err);
                  toast.error("Error al guardar tu premio, contacta soporte.");
                }
              } else {
                if (isPrize !== false) {
                  toast.success(`¡Felicidades! Ganaste: ${prize}`, {
                    icon: "🎁",
                    duration: 6000,
                  });
                } else {
                  toast.success(`Mira lo que salió: ${prize}`, {
                    icon: "💬",
                    duration: 6000,
                  });
                }
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Premium Ruleta Pay fullscreen overlay */}
      <AnimatePresence>
        {showRuletaPay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] overflow-y-auto bg-neutral-950/90 backdrop-blur-md flex items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full h-full sm:min-h-0 sm:h-auto max-w-4xl bg-neutral-900 border-0 sm:border border-neutral-800 rounded-none sm:rounded-3xl overflow-y-auto overflow-x-hidden relative shadow-2xl"
            >
              <button
                onClick={() => setShowRuletaPay(false)}
                className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-neutral-950/60 text-neutral-400 hover:text-white border border-neutral-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="p-0 sm:p-2 h-full flex flex-col justify-center min-h-[100svh] sm:min-h-0">
                <RuletaPay onClose={() => setShowRuletaPay(false)} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location Modal */}
      <AnimatePresence>
        {showLocationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-[#0B0B0B] rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl overflow-hidden border border-white/10 relative golden-glow-module"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[80px] rounded-full pointer-events-none" />

              <div className="flex justify-between items-center mb-8 relative z-10">
                <h3 className="text-2xl font-black text-on-surface tracking-tight">
                  {modalStep === 2 ? "Confirmar Dirección" : "Tu Ubicación"}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowLocationModal(false);
                    setModalStep(1);
                  }}
                  className="p-2.5 bg-white/5 rounded-2xl text-on-surface-muted hover:text-on-surface hover:bg-white/10 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <AnimatePresence mode="wait">
                {modalStep === 1 ? (
                  <motion.div
                    key="step1"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    className="space-y-6 relative z-10"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        requestLocation();
                      }}
                      className="w-full flex items-center justify-center gap-3 bg-orange-600 hover:bg-orange-500 text-on-surface py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-orange-600/20 active:scale-95"
                    >
                      <MapPin className="w-5 h-5" />
                      Usar mi ubicación actual
                    </button>

                    <div className="relative flex items-center py-2">
                      <div className="flex-grow border-t border-white/5"></div>
                      <span className="flex-shrink-0 mx-4 text-on-surface-muted text-[10px] font-black uppercase tracking-[0.2em]">
                        o selecciona manualmente
                      </span>
                      <div className="flex-grow border-t border-white/5"></div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-on-surface-muted uppercase tracking-[0.2em] ml-1 mb-2 block">
                          Departamento
                        </label>
                        <select
                          value={userDepartment || ""}
                          onChange={(e) => {
                            setUserDepartment(e.target.value);
                            setUserCity("");
                          }}
                          className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-on-surface focus:outline-none focus:border-orange-500 transition-all appearance-none font-bold"
                        >
                          <option value="" className="bg-[#1A1A1A]">
                            Selecciona un departamento
                          </option>
                          {getDepartments().map((dep) => (
                            <option
                              key={dep}
                              value={dep}
                              className="bg-[#1A1A1A]"
                            >
                              {dep}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-on-surface-muted uppercase tracking-[0.2em] ml-1 mb-2 block">
                          Ciudad / Municipio
                        </label>
                        <select
                          value={userCity || ""}
                          onChange={(e) => {
                            setUserCity(e.target.value);
                            setModalStep(2);
                          }}
                          disabled={!userDepartment}
                          className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-on-surface focus:outline-none focus:border-orange-500 transition-all appearance-none disabled:opacity-30 font-bold"
                        >
                          <option value="" className="bg-[#1A1A1A]">
                            Selecciona una ciudad
                          </option>
                          {userDepartment &&
                            getCitiesByDepartment(userDepartment).map((c) => (
                              <option
                                key={c}
                                value={c}
                                className="bg-[#1A1A1A]"
                              >
                                {c}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="step2"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-6 relative z-10"
                  >
                    <div className="bg-orange-600/10 p-5 rounded-2xl border border-orange-600/20">
                      <p className="text-xs text-orange-200 font-medium leading-relaxed">
                        Para mostrarte los mejores locales en{" "}
                        <span className="font-extrabold text-orange-400">
                          {userCity}
                        </span>
                        , necesitamos confirmar tu dirección.
                      </p>
                    </div>

                    {appUser?.addresses && appUser.addresses.length > 0 ? (
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-on-surface-muted uppercase tracking-[0.2em] ml-1 block">
                          Tus direcciones guardadas
                        </label>
                        <div className="max-h-[160px] overflow-y-auto pr-2 space-y-3 no-scrollbar">
                          {appUser.addresses.map((addr) => (
                            <button
                              key={addr.id}
                              type="button"
                              onClick={() => {
                                setUserAddress(addr.address);
                                setShowLocationModal(false);
                                setModalStep(1);
                                toast.success(
                                  `Ubicación confirmada en ${userCity}`,
                                );
                              }}
                              className={`w-full flex items-start gap-4 p-4 rounded-2xl border transition-all text-left group ${
                                userAddress === addr.address
                                  ? "bg-orange-600/20 border-orange-500 shadow-lg shadow-orange-600/10"
                                  : "bg-white/5 border-white/5 hover:border-orange-500/30"
                              }`}
                            >
                              <div
                                className={`mt-0.5 p-2.5 rounded-xl transition-colors ${userAddress === addr.address ? "bg-orange-600 text-on-surface shadow-lg shadow-orange-600/20" : "bg-white/5 text-on-surface-muted group-hover:bg-white/10"}`}
                              >
                                <Hotel className="w-4 h-4" />
                              </div>
                              <div className="flex-1">
                                <p
                                  className={`font-black text-xs uppercase tracking-wider ${userAddress === addr.address ? "text-orange-400" : "text-on-surface"}`}
                                >
                                  {addr.name}
                                </p>
                                <p className="text-[11px] text-on-surface-muted font-bold mt-1 line-clamp-1">
                                  {addr.address}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-on-surface-muted uppercase tracking-[0.2em] ml-1 block">
                        {appUser?.addresses?.length
                          ? "O ingresa una nueva"
                          : "Ingresa tu dirección"}
                      </label>
                      <div className="relative group">
                        <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-muted group-focus-within:text-orange-500 transition-colors" />
                        <input
                          type="text"
                          value={manualAddress}
                          onChange={(e) => setManualAddress(e.target.value)}
                          placeholder="Calle, Número, Barrio..."
                          className="w-full pl-14 pr-5 py-5 bg-white/5 border border-white/10 rounded-2xl text-on-surface font-bold text-base placeholder:text-on-surface-muted/50 focus:outline-none focus:border-orange-500 focus:bg-white/10 transition-all"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={!manualAddress.trim()}
                        onClick={() => {
                          setUserAddress(manualAddress);
                          setShowLocationModal(false);
                          setModalStep(1);
                          toast.success(`Ubicación confirmada en ${userCity}`);
                        }}
                        className="w-full bg-orange-600 hover:bg-orange-500 text-on-surface py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-600/20 transition-all disabled:opacity-30 disabled:grayscale active:scale-95"
                      >
                        Confirmar Ubicación
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setModalStep(1)}
                      className="w-full py-2 text-on-surface-muted text-[10px] font-black uppercase tracking-widest hover:text-orange-400 transition-colors"
                    >
                      ← Cambiar Ciudad
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Order Tracking Banner */}
      <AnimatePresence>
        {activeOrder && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-4 pt-4 relative group"
          >
            <button
              onClick={() => setActiveOrder(null)}
              className="absolute top-6 right-6 z-10 p-1 bg-white/10 hover:bg-white/20 rounded-full text-on-surface transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <Link
              to={`/orders/${activeOrder.id}`}
              className="block bg-gradient-to-r from-orange-500 to-rose-500 rounded-3xl p-5 text-on-surface shadow-xl shadow-orange-500/20 relative overflow-hidden group"
            >
              <div className="absolute right-0 top-0 h-full w-32 bg-white/10 -skew-x-12 translate-x-16 group-hover:translate-x-8 transition-transform duration-700" />
              <div className="relative flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                      <Truck className="w-6 h-6 text-on-surface" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-0.5">
                        Estado del Pedido
                      </p>
                      <h3 className="text-lg font-black leading-tight flex items-center gap-2">
                        {activeOrder.status === "pending" &&
                          "📍 Buscando Restaurante..."}
                        {activeOrder.status === "approved" &&
                          "✅ En Restaurante"}
                        {activeOrder.status === "preparing" &&
                          "🍳 Preparando..."}
                        {(activeOrder.status === "shipped" ||
                          activeOrder.status === "on_the_way") &&
                          "🛵 En camino..."}
                        {activeOrder.status === "completed" && "📦 Entregado"}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md">
                    <span className="text-xs font-black">Rastrear</span>
                    <ChevronRight size={16} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 relative z-10">
                  {/* Telemetría */}
                  <div className="col-span-2 bg-black/20 rounded-2xl p-3 border border-white/10 flex flex-col items-center justify-center text-center gap-1.5 backdrop-blur-md shadow-inner transition-all hover:bg-black/30">
                    <Activity className="w-5 h-5 opacity-90 drop-shadow-md text-white" />
                    <span className="font-bold text-sm truncate max-w-full text-white">
                      {activeOrder.status === "pending" &&
                        "Buscando restaurante..."}
                      {activeOrder.status === "approved" &&
                        "En espera de preparación"}
                      {activeOrder.status === "preparing" &&
                        "En cocina - Preparando"}
                      {(activeOrder.status === "shipped" ||
                        activeOrder.status === "on_the_way") &&
                        "En ruta al destino"}
                      {activeOrder.status === "completed" &&
                        "Pedido entregado con éxito"}
                    </span>
                    <span className="opacity-70 text-[9px] uppercase font-black tracking-widest leading-none">
                      Telemetría
                    </span>
                  </div>

                  {/* Entrega */}
                  <div className="bg-black/20 rounded-2xl p-3 border border-white/10 flex flex-col items-center justify-center text-center gap-1.5 backdrop-blur-md shadow-inner transition-all hover:bg-black/30 w-full overflow-hidden">
                    <UserIcon className="w-5 h-5 opacity-80 text-white" />
                    <span className="font-bold text-xs truncate max-w-[90%] text-white">
                      {activeOrder.recipientName ||
                        activeOrder.customerName ||
                        "Cliente"}
                    </span>
                    <span className="opacity-70 text-[9px] uppercase font-black tracking-widest leading-none">
                      Entrega
                    </span>
                  </div>

                  {/* Envío */}
                  <div className="bg-black/20 rounded-2xl p-3 border border-white/10 flex flex-col items-center justify-center text-center gap-1.5 backdrop-blur-md shadow-inner transition-all hover:bg-black/30 w-full overflow-hidden">
                    <MapPin className="w-5 h-5 opacity-80 text-white" />
                    <span
                      className="font-bold text-xs truncate max-w-[90%] text-white"
                      title={activeOrder.address || "N/A"}
                    >
                      {activeOrder.address || "N/A"}
                    </span>
                    <span className="opacity-70 text-[9px] uppercase font-black tracking-widest leading-none">
                      Envío
                    </span>
                  </div>

                  {/* Restaurante */}
                  <div className="bg-black/20 rounded-2xl p-3 border border-white/10 flex flex-col items-center justify-center text-center gap-1.5 backdrop-blur-md shadow-inner transition-all hover:bg-black/30 w-full overflow-hidden">
                    <Store className="w-5 h-5 opacity-80 text-white" />
                    <span
                      className="font-bold text-xs truncate max-w-[90%] text-white"
                      title={activeOrder.restaurantName || "N/A"}
                    >
                      {activeOrder.restaurantName || "N/A"}
                    </span>
                    <span className="opacity-70 text-[9px] uppercase font-black tracking-widest leading-none">
                      Restaurante
                    </span>
                  </div>

                  {/* Pedido */}
                  <div className="bg-black/20 rounded-2xl p-3 border border-white/10 flex flex-col items-center justify-center text-center gap-1.5 backdrop-blur-md shadow-inner transition-all hover:bg-black/30 w-full overflow-hidden">
                    <Receipt className="w-5 h-5 opacity-80 text-white" />
                    <span className="font-bold text-xs truncate max-w-[90%] text-white">
                      {activeOrder.total
                        ? formatCurrency(activeOrder.total)
                        : "$0"}
                    </span>
                    <span className="opacity-70 text-[9px] uppercase font-black tracking-widest leading-none">
                      Pedido
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width:
                      activeOrder.status === "pending"
                        ? "15%"
                        : activeOrder.status === "approved"
                          ? "35%"
                          : activeOrder.status === "preparing"
                            ? "60%"
                            : activeOrder.status === "shipped" ||
                                activeOrder.status === "on_the_way"
                              ? "85%"
                              : "100%",
                  }}
                  className="h-full bg-white transition-all duration-1000"
                />
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECCIÓN 1 - HERO PRINCIPAL */}
      {!settings?.hideHeroSlider && (
        <div className="px-4 sm:px-6 mt-4">
          <HomeHero
            settings={settings}
            onExploreClick={(category) => {
              setActiveBusinessCategory(category);
              const element = document.getElementById("restaurants");
              if (element) {
                element.scrollIntoView({ behavior: "smooth" });
              }
            }}
          />
        </div>
      )}

      {/* SECCIÓN 2 - FILTRO DESLIZANTE DE CATEGORÍAS DE NEGOCIO (Restaurantes, Salsamentarías, Verdulerías, etc.) */}
      {!settings?.hideBusinessCategoryNav && businessCategories && businessCategories.length > 0 && (
        <div className="px-4 py-2 mb-1">
          <BusinessCategoryNav
            categories={businessCategories}
            activeCategoryId={activeBusinessCategory}
            onSelectCategory={(id) => {
              setActiveBusinessCategory(id);
              setSelectedCategory("all");
            }}
          />
        </div>
      )}

      {/* Advanced Filters Modal */}
      <AnimatePresence>
        {showFilters && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-outline flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="text-xl font-black text-on-surface">
                  Filtros Avanzados
                </h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-surface-variant rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-on-surface-muted" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-8">
                {/* Rating Filter */}
                <div>
                  <h4 className="font-bold text-on-surface mb-4 flex items-center gap-2">
                    <Star className="w-4 h-4 text-orange-500" />
                    Calificación Mínima
                  </h4>
                  <div className="flex gap-2">
                    {[3, 4, 4.5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() =>
                          setMinRating(minRating === rating ? null : rating)
                        }
                        className={`flex-1 py-2 rounded-xl font-bold text-sm border transition-all ${
                          minRating === rating
                            ? "bg-orange-50 border-orange-500 text-orange-600"
                            : "bg-white border-outline text-on-surface-muted hover:border-orange-300"
                        }`}
                      >
                        {rating}+ ⭐
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delivery Time Filter */}
                <div>
                  <h4 className="font-bold text-on-surface mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    Tiempo de Entrega
                  </h4>
                  <div className="flex gap-2">
                    {[20, 30, 45].map((time) => (
                      <button
                        key={time}
                        onClick={() =>
                          setMaxDeliveryTime(
                            maxDeliveryTime === time ? null : time,
                          )
                        }
                        className={`flex-1 py-2 rounded-xl font-bold text-sm border transition-all ${
                          maxDeliveryTime === time
                            ? "bg-orange-50 border-orange-500 text-orange-600"
                            : "bg-white border-outline text-on-surface-muted hover:border-orange-300"
                        }`}
                      >
                        &lt; {time} min
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range Filter */}
                <div>
                  <h4 className="font-bold text-on-surface mb-4 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-orange-500" />
                    Rango de Precio
                  </h4>
                  <div className="flex gap-2">
                    {["$", "$$", "$$$"].map((price) => (
                      <button
                        key={price}
                        onClick={() =>
                          setPriceRange(priceRange === price ? null : price)
                        }
                        className={`flex-1 py-2 rounded-xl font-bold text-sm border transition-all ${
                          priceRange === price
                            ? "bg-orange-50 border-orange-500 text-orange-600"
                            : "bg-white border-outline text-on-surface-muted hover:border-orange-300"
                        }`}
                      >
                        {price}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-outline bg-surface-base flex gap-3 sticky bottom-0">
                <button
                  onClick={() => {
                    setMinRating(null);
                    setMaxDeliveryTime(null);
                    setPriceRange(null);
                    setSelectedCategory("all");
                  }}
                  className="px-6 py-3 text-on-surface-muted font-bold hover:bg-surface-variant rounded-xl transition-colors"
                >
                  Limpiar
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 py-3 bg-orange-500 text-on-surface font-black rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                >
                  Aplicar Filtros
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SECCIÓN 3 - CHIPS DE ESPECIALIDADES / COMIDA (Opcional si están configurados y activos) */}
      {!settings?.hideFoodCategoryChips &&
        (settings?.foodCategories || []).filter((fc: any) => fc.active !== false).length > 0 && (
          <div className="px-4 mt-2">
            <div className="flex overflow-x-auto no-scrollbar gap-4 sm:gap-5 py-2 -mx-4 px-6 mb-2">
              {[
                { id: "all", name: "Todos", icon: "✨" },
                ...((settings?.foodCategories || []).filter((fc: any) => fc.active !== false)),
              ].map((cat: any) => {
                const categoryValue = cat.id === "all" ? "all" : cat.name;
                const isActive =
                  selectedCategory.toLowerCase() === categoryValue.toLowerCase();
                return (
                  <CategoryCircleChip
                    key={cat.id}
                    category={cat}
                    isActive={isActive}
                    onSelect={() => {
                      if (cat.id === "all") {
                        setSelectedCategory("all");
                      } else {
                        setSelectedCategory(categoryValue);
                      }
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

      {isSearchActive ? (
        // Search Results View
        <HomeSearchResults
          processedRestaurants={processedRestaurants}
          filteredProducts={filteredProducts}
          currentTime={currentTime}
          isRestaurantOpen={isRestaurantOpen}
          navigate={navigate}
          formatCurrency={formatCurrency}
          favoriteProducts={favoriteProducts}
          onToggleProductFavorite={handleToggleProductFavorite}
          onProductClick={setSelectedProductForModal}
          user={user}
          setLoginPromptOpen={setLoginPromptOpen}
          restaurants={restaurants}
        />
      ) : (
        // Main Home View
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-4 pt-2"
        >
          {/* Nearest Restaurants */}
          <motion.div
            variants={itemVariants}
            className="px-4 py-4"
            id="restaurants"
          >
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3.5">
                  {(() => {
                    const visual = getCategoryVisual(activeBusinessCategory);
                    const HeaderIcon = visual.icon;
                    return (
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-white/20 bg-gradient-to-br ${visual.gradient} shadow-lg shrink-0`}
                        style={{ boxShadow: `0 6px 20px ${visual.glowColor}` }}
                      >
                        <HeaderIcon className="w-6 h-6 text-white drop-shadow-md" strokeWidth={2.3} />
                      </div>
                    );
                  })()}
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tighter capitalize">
                      {businessCategories.find((c) => c.id === activeBusinessCategory)
                        ?.title.replace("Explorar ", "") || "Negocios"}
                    </h2>
                    <p className="text-on-surface-variant text-xs sm:text-sm font-medium">
                      {businessCategories.find((c) => c.id === activeBusinessCategory)
                        ?.subtitle || "Los mejores de tu zona"}
                    </p>
                  </div>
                </div>
                <button className="w-12 h-12 rounded-2xl bg-surface-variant/50 flex items-center justify-center text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-all">
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              {isRestaurantsLoading ? (
                <div className="flex overflow-x-auto no-scrollbar gap-6 pb-4 -mx-4 px-4">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="shrink-0 w-[340px] md:w-[380px] h-[450px] rounded-[24px] bg-surface-variant animate-pulse"
                    />
                  ))}
                </div>
              ) : finalRestaurants.length > 0 ? (
                <InteractiveRestaurantCardSlider
                  restaurants={finalRestaurants}
                  favoriteRestaurants={favoriteRestaurants}
                  handleToggleFavorite={handleToggleFavorite}
                  restaurantRatings={restaurantRatings}
                  currentTime={currentTime}
                  realDistancesMap={realDistancesMap}
                  userLocation={{
                    lat: userLat,
                    lng: userLng,
                    city: userCity || "Maicao",
                    address: userAddress,
                  }}
                />
              ) : (
                <div className="py-12 px-4 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-outline">
                  <div className="bg-orange-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MapPin className="w-10 h-10 text-orange-400" />
                  </div>
                  <h3 className="text-xl font-black text-on-surface mb-2 tracking-tight">
                    No hay restaurantes en {userCity || "tu zona"}
                  </h3>
                  <p className="text-on-surface-muted text-sm mb-8 max-w-sm mx-auto font-medium leading-relaxed">
                    Estamos trabajando para llegar pronto a{" "}
                    {userCity || "esta ubicación"}. ¿Aún no ves tu restaurante?
                    Verifica tu ubicación o ve todos los restaurantes.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => {
                        localStorage.removeItem("smartbite_city");
                        setUserCity("");
                        toast.info("Mostrando todos los restaurantes");
                      }}
                      className="px-8 py-4 bg-orange-600 text-on-surface rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-orange-700 transition-all shadow-xl shadow-orange-100 active:scale-95"
                    >
                      Ver todos
                    </button>
                    <button
                      onClick={() => setShowLocationModal(true)}
                      className="px-8 py-4 bg-surface-variant text-on-surface-muted rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-surface-variant transition-all active:scale-95"
                    >
                      Cambiar Ciudad
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Popular Dishes */}
          <motion.div variants={itemVariants} className="px-4">
            <h2 className="text-xl font-bold text-on-surface mb-2">
              Platos Populares
            </h2>
            <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 pb-2 -mx-4 px-4">
              {popularDishes.length === 0
                ? [1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="shrink-0 w-[160px] h-[220px] rounded-[1.5rem] bg-surface-variant animate-pulse"
                    />
                  ))
                : popularDishes.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        if (!user) {
                          setLoginPromptOpen(true);
                        } else {
                          setSelectedProductForModal(p);
                        }
                      }}
                      className="snap-start shrink-0 w-[160px] flex flex-col gap-2 cursor-pointer group bg-[#0B0B0B] rounded-[1.5rem] p-3 golden-glow-module"
                    >
                      <div className="w-full aspect-square rounded-xl overflow-hidden bg-surface-variant shadow-sm relative flex items-center justify-center">
                        {p.images[0] ? (
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <ShoppingBag className="w-10 h-10 text-on-surface-variant" />
                        )}
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={(e) =>
                              handleToggleProductFavorite(e, p.id)
                            }
                            className={`p-1.5 rounded-xl backdrop-blur-md shadow-lg border border-white/20 transition-all active:scale-90 ${
                              favoriteProducts.has(p.id)
                                ? "bg-rose-500/80 text-on-surface"
                                : "bg-surface/80 text-on-surface"
                            }`}
                          >
                            <Heart
                              className={`w-3.5 h-3.5 ${favoriteProducts.has(p.id) ? "fill-current" : ""}`}
                            />
                          </button>
                        </div>
                        {(() => {
                          const restaurant = restaurants.find(
                            (r) => r.id === p.restaurantId,
                          );
                          if (
                            restaurant &&
                            !isRestaurantOpen(restaurant, currentTime)
                          ) {
                            return (
                              <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                                <span className="bg-rose-500 text-on-surface text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">
                                  No disponible
                                </span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-on-surface line-clamp-1 group-hover:text-orange-500 transition-colors">
                          {p.name}
                        </h4>
                        <p className="text-xs text-on-surface-muted line-clamp-1 flex items-center gap-1">
                          {(() => {
                            const restaurant = restaurants.find(
                              (r) => r.id === p.restaurantId,
                            );
                            const visual = getCategoryVisual(
                              restaurant?.businessCategory ||
                              restaurant?.type ||
                              p.category
                            );
                            const DishCatIcon = visual.icon;
                            return (
                              <>
                                <DishCatIcon
                                  className="w-3.5 h-3.5 inline shrink-0"
                                  style={{ color: visual.accentColor }}
                                  strokeWidth={2.4}
                                />
                                <span className="truncate font-medium">
                                  {p.restaurantName}
                                </span>
                              </>
                            );
                          })()}
                        </p>
                        {(() => {
                          const restaurant = restaurants.find(
                            (r) => r.id === p.restaurantId,
                          );
                          const hasIndividualDiscount =
                            p.discountPercentage && p.discountPercentage > 0;
                          const hasGeneralDiscount =
                            restaurant?.generalDiscountEnabled &&
                            restaurant.generalDiscount &&
                            restaurant.generalDiscount > 0;

                          if (hasIndividualDiscount || hasGeneralDiscount) {
                            const perc =
                              p.discountPercentage ||
                              restaurant?.generalDiscount ||
                              0;
                            const discPrice = p.discountPercentage
                              ? p.discountPrice || p.price
                              : Math.round(p.price * (1 - perc / 100));
                            return (
                              <div className="flex flex-col mt-1">
                                <span className="text-on-surface-muted text-[10px] line-through font-bold">
                                  {formatCurrency(p.price)}
                                </span>
                                <span className="text-orange-600 font-bold text-sm leading-none">
                                  {formatCurrency(discPrice)}
                                </span>
                              </div>
                            );
                          }

                          return (
                            <p className="text-orange-600 font-bold text-sm mt-1">
                              {formatCurrency(p.price)}
                            </p>
                          );
                        })()}
                        {p.pointsMultiplier && p.pointsMultiplier > 1 && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[#FFD700] bg-[#FF8A00]/10 border border-[#FFD700]/30 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest shadow-sm w-fit uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] animate-pulse shadow-[0_0_8px_rgba(255,215,0,0.8)]" />
                            X{p.pointsMultiplier} Oro 🪙
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
            </div>
          </motion.div>

          {/* Featured / City Restaurants */}
          {displayFeatured.length > 0 && (
            <motion.div
              variants={itemVariants}
              className="px-6 relative w-full mb-6 mt-4"
            >
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-[18px] font-bold text-on-surface tracking-tight">
                    {userCity
                      ? `Restaurantes en ${userCity}`
                      : "Restaurantes destacados"}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    navigate(
                      userCity
                        ? `/restaurantes?city=${encodeURIComponent(userCity)}`
                        : "/restaurantes"
                    );
                  }}
                  className="text-[12px] font-semibold text-[#FF8A00] tracking-wide relative top-[2px] hover:underline flex items-center gap-0.5 active:scale-95 transition-all"
                >
                  <span>Ver todos</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <FeaturedRestaurantsSlider
                restaurants={displayFeatured}
                currentTime={currentTime}
                favoriteRestaurants={favoriteRestaurants}
                handleToggleFavorite={handleToggleFavorite}
                restaurantRatings={restaurantRatings}
                userLocation={{
                  lat: userLat,
                  lng: userLng,
                  city: userCity || "Maicao",
                  address: userAddress,
                }}
                realDistancesMap={realDistancesMap}
              />
            </motion.div>
          )}

          {/* SECCIÓN 6 - PROMOCIONES VIP */}
          <div className="px-6 mb-8">
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-[18px] font-bold text-on-surface tracking-tight text-shadow-sm glow-text">
                {" "}
                Promociones VIP{" "}
              </h2>
              <span className="text-[12px] font-medium text-[#FF8A00] cursor-pointer hover:underline">
                Ver todas <ChevronRight className="w-3 h-3 inline pb-0.5" />
              </span>
            </div>

            <div className="flex overflow-x-auto no-scrollbar gap-4 pb-4">
              {/* Promo Card 1 */}
              <div className="relative w-[300px] shrink-0 h-[140px] rounded-[1.5rem] overflow-hidden bg-[#0B0B0B] cursor-pointer hover:scale-[1.02] transition-transform shadow-[0_8px_20px_rgba(0,0,0,0.4)] golden-glow-module">
                <div className="absolute inset-x-0 bottom-0 top-[20%] bg-gradient-to-r from-black/90 to-transparent z-10 pointer-events-none"></div>
                <div className="absolute right-0 top-0 w-[60%] h-full bg-[url('https://images.unsplash.com/photo-1544148103-0773bf10d330?fit=crop&w=400&q=80')] bg-cover bg-center opacity-60"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent pointer-events-none"></div>

                <div className="relative z-20 p-5 flex flex-col justify-center h-full w-[65%]">
                  <span className="bg-gradient-to-r from-[#FF8A00] to-[#FF9E2A] text-on-surface text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full w-fit mb-2 shadow-[0_2px_10px_rgba(255,138,0,0.4)]">
                    Oferta VIP
                  </span>
                  <h3 className="text-3xl font-black text-on-surface leading-none mb-1">
                    20% <span className="text-[12px] font-bold">DTO.</span>
                  </h3>
                  <p className="text-[10px] text-[#A0A0A0] leading-tight">
                    En platos seleccionados
                  </p>
                </div>
              </div>

              {/* Promo Card 2 */}
              <div className="relative w-[300px] shrink-0 h-[140px] rounded-[1.5rem] overflow-hidden bg-[#0B0B0B] cursor-pointer hover:scale-[1.02] transition-transform shadow-[0_8px_20px_rgba(0,0,0,0.4)] golden-glow-module">
                <div className="absolute inset-x-0 bottom-0 top-[20%] bg-gradient-to-r from-black/90 to-transparent z-10 pointer-events-none"></div>
                <div className="absolute right-0 top-0 w-[60%] h-full bg-[url('https://images.unsplash.com/photo-1526367790999-0150786686a2?fit=crop&w=400&q=80')] bg-cover bg-center opacity-50"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent pointer-events-none"></div>

                <div className="relative z-20 p-5 flex flex-col justify-center h-full w-[65%]">
                  <h3 className="text-[18px] font-bold text-on-surface leading-none mb-2 tracking-wide uppercase">
                    Envío Gratis
                  </h3>
                  <p className="text-[11px] text-[#A0A0A0] leading-tight font-medium">
                    Por compras superiores a <br />
                    <span className="text-on-surface font-bold text-sm leading-[1.8]">
                      $25.000
                    </span>
                  </p>
                </div>
              </div>

              {/* Promo Card 3 */}
              <div className="relative w-[300px] shrink-0 h-[140px] rounded-[1.5rem] overflow-hidden bg-[#0B0B0B] cursor-pointer hover:scale-[1.02] transition-transform shadow-[0_8px_20px_rgba(0,0,0,0.4)] golden-glow-module">
                <div className="absolute inset-x-0 bottom-0 top-[20%] bg-gradient-to-r from-black/90 to-transparent z-10 pointer-events-none"></div>
                <div className="absolute right-0 top-0 w-[60%] h-full bg-[url('https://images.unsplash.com/photo-1549488344-c6e0bf643eb6?fit=crop&w=400&q=80')] bg-cover bg-center opacity-50"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent pointer-events-none"></div>

                <div className="relative z-20 p-5 flex flex-col justify-center h-full w-[65%]">
                  <h3 className="text-[18px] font-bold text-on-surface leading-none mb-2 tracking-wide uppercase">
                    Bebida Gratis
                  </h3>
                  <p className="text-[11px] text-[#A0A0A0] leading-tight font-medium">
                    En tu primera compra
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 7 - TOP USUARIOS SMARTBITE */}
          <div className="px-6 mb-8 mt-2">
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-[18px] font-bold text-on-surface tracking-tight glow-text text-shadow-sm">
                {" "}
                Top embajadores{" "}
              </h2>
              <span className="text-[12px] font-medium text-[#FF8A00] cursor-pointer hover:underline">
                Ver ranking <ChevronRight className="w-3 h-3 inline pb-0.5" />
              </span>
            </div>

            <div className="flex overflow-x-auto no-scrollbar gap-4 pb-4">
              {/* Ranking Items */}
              {[
                {
                  pos: 1,
                  name: "Manuel G.",
                  level: "Nivel VIP",
                  points: "12,540 XP",
                  avatar: "https://randomuser.me/api/portraits/men/32.jpg",
                },
                {
                  pos: 2,
                  name: "Carolina R.",
                  level: "Nivel 4",
                  points: "8,750 XP",
                  avatar: "https://randomuser.me/api/portraits/women/44.jpg",
                },
                {
                  pos: 3,
                  name: "Andrés M.",
                  level: "Nivel 3",
                  points: "6,230 XP",
                  avatar: "https://randomuser.me/api/portraits/men/55.jpg",
                },
                {
                  pos: 4,
                  name: "Laura T.",
                  level: "Nivel 2",
                  points: "4,120 XP",
                  avatar: "https://randomuser.me/api/portraits/women/68.jpg",
                },
                {
                  pos: 5,
                  name: "Diego C.",
                  level: "Nivel 2",
                  points: "3,860 XP",
                  avatar: "https://randomuser.me/api/portraits/men/70.jpg",
                },
              ].map((user) => (
                <div
                  key={user.pos}
                  className={`relative w-[130px] shrink-0 rounded-[1.5rem] bg-[#0B0B0B] border p-4 flex flex-col items-center justify-center gap-2 shadow-[0_5px_15px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-transform ${user.pos === 1 ? "border-[#FFD700]/50 shadow-[0_0_20px_rgba(255,215,0,0.15)] bg-gradient-to-b from-[#2A2A2A] to-[#121212]" : "border-transparent golden-glow-module"}`}
                >
                  {/* Badge Rank */}
                  <div
                    className={`absolute -top-3 -left-2 w-[35px] h-[35px] flex items-center justify-center font-black text-[13px] drop-shadow-md ${user.pos === 1 ? "text-yellow-900 bg-gradient-to-br from-[#FFD700] to-[#FFA500]" : user.pos === 2 ? "text-gray-900 bg-gradient-to-br from-[#E0E0E0] to-[#A0A0A0]" : user.pos === 3 ? "text-amber-900 bg-gradient-to-br from-[#CD7F32] to-[#8B4513]" : "text-on-surface bg-[#333]"} rounded-full border-[3px] border-[#121212] z-10`}
                  >
                    {user.pos}
                  </div>
                  <div
                    className={`w-[60px] h-[60px] rounded-full overflow-hidden border-[3px] mb-1 relative ${user.pos === 1 ? "border-[#FF8A00]" : "border-[#333333]"}`}
                  >
                    <img
                      src={user.avatar}
                      className="w-full h-full object-cover"
                      alt={user.name}
                      referrerPolicy="no-referrer"
                    />
                    {user.pos === 1 && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    )}
                  </div>
                  <div className="text-center w-full">
                    <h4 className="text-[12px] font-bold text-on-surface mb-0.5 line-clamp-1">
                      {user.name}
                    </h4>
                    <div className="text-[10px] font-medium text-[#A0A0A0]">
                      {user.level}
                    </div>
                    <div className="text-[11px] font-black text-[#FF8A00] drop-shadow-[0_0_5px_rgba(255,138,0,0.4)] mt-0.5">
                      {user.points}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN NUEVA - CONVOCATORIA REPRESENTANTES COMERCIALES */}
          <div className="px-6 mb-8 mt-4">
            <div
              className="relative group w-full rounded-[2rem] overflow-hidden bg-[#0A0A0B] border border-[#D4AF37]/35 flex flex-col sm:flex-row items-center justify-between p-6 sm:p-8 shadow-[0_10px_30px_rgba(255,215,0,0.05)] cursor-pointer hover:border-[#D4AF37] transition-all"
              onClick={() => navigate("/representante")}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/45 to-transparent z-10 pointer-events-none"></div>
              <div className="absolute inset-x-0 bottom-0 top-[20%] bg-gradient-to-r from-black/90 to-transparent z-10 pointer-events-none"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none"></div>
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#D4AF37] opacity-10 blur-[60px] rounded-full pointer-events-none"></div>

              <div className="relative z-20 flex flex-col gap-2 max-w-full sm:max-w-[70%] text-left">
                <span className="bg-amber-500/15 text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full w-fit mb-1 border border-[#D4AF37]/30">
                  ¡Únete al equipo comercial! 🚀
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-on-surface tracking-tight leading-snug">
                  ¿Quieres ser{" "}
                  <span className="text-[#D4AF37]">
                    Representante Comercial
                  </span>{" "}
                  Oficial?
                </h3>
                <p className="text-xs text-zinc-400 max-w-lg mt-1 font-medium leading-relaxed">
                  Ayuda a restaurantes locales a digitalizar sus ventas. Recibe
                  atractivas comisiones recurrentes y capacitación 100% gratuita
                  de alto nivel.
                </p>
              </div>
              <div className="relative z-20 mt-4 sm:mt-0 shrink-0">
                <button className="px-6 py-3 bg-gradient-to-r from-amber-400 to-[#D4AF37] text-black font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-transform flex items-center gap-2 shadow-[0_5px_15px_rgba(212,175,55,0.2)]">
                  Postularme gratis
                  <ChevronRight className="w-4 h-4" strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>

          {/* SECCIÓN 8 - CTA FINAL */}
          <div className="px-6 mb-[120px]">
            <div
              onClick={() => {
                const element = document.getElementById("restaurants");
                if (element) {
                  element.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="relative cursor-pointer group w-full rounded-[2rem] overflow-hidden bg-[#0B0B0B] flex flex-col sm:flex-row items-center justify-between p-6 sm:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.5)] min-h-[160px] golden-glow-module"
            >
              <div className="absolute inset-x-0 bottom-0 top-[20%] bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none"></div>
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1615886676140-5bfa2276532d?fit=crop&w=1200&q=80')] bg-cover bg-center opacity-30 mix-blend-screen group-hover:scale-105 transition-transform duration-700"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 to-[#FF8A00]/10 pointer-events-none"></div>

              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#FF8A00] opacity-20 blur-[50px] rounded-full pointer-events-none"></div>

              <div className="relative z-20 flex flex-col gap-2 max-w-[70%] sm:max-w-[60%] h-full justify-center">
                <h3 className="text-xl sm:text-2xl font-normal text-on-surface leading-tight drop-shadow-md">
                  Cada compra te acerca a<br />
                  <span className="text-[#FF8A00] font-bold">
                    tu próximo premio
                  </span>
                </h3>
              </div>
              <div className="relative z-20 mt-4 sm:mt-0 self-start sm:self-center h-full flex items-center">
                <button className="bg-gradient-to-r from-[#FF8A00] to-[#FF9E2A] text-on-surface font-bold text-[13px] px-6 py-3 rounded-full flex items-center justify-center gap-3 shadow-[0_4px_20px_rgba(255,138,0,0.4)] active:scale-95 hover:scale-105 transition-transform w-[160px]">
                  Explorar ahora
                  <ChevronRight className="w-4 h-4" strokeWidth={3} />
                </button>
              </div>
            </div>
            {/* Hidden div as scroll target */}
            <div
              id="restaurantes-destacados"
              className="invisible h-0 mt-8"
            ></div>
          </div>
        </motion.div>
      )}

      <ProductDetailModal
        product={selectedProductForModal}
        isOpen={selectedProductForModal !== null}
        onClose={() => setSelectedProductForModal(null)}
        onAddToCart={(p, qty) => {
          const restaurant = restaurants.find((r) => r.id === p.restaurantId);
          const hasIndividualDiscount =
            p.discountPercentage && p.discountPercentage > 0;
          const hasGeneralDiscount =
            restaurant?.generalDiscountEnabled &&
            restaurant.generalDiscount &&
            restaurant.generalDiscount > 0;

          let finalPrice = p.price;
          if (hasIndividualDiscount) {
            finalPrice = p.discountPrice || p.price;
          } else if (hasGeneralDiscount) {
            finalPrice = Math.round(
              p.price * (1 - (restaurant?.generalDiscount || 0) / 100),
            );
          }

          const productWithCorrectPrice = {
            ...p,
            price: finalPrice,
            originalPrice: p.price,
          };

          const res = addToCart(productWithCorrectPrice, qty);
          if (res && !res.success) {
            if (res.error === "NOT_LOGGED_IN") {
              // Notification Context will handle warning, but we prevent toast.success
              return;
            }
            toast.error(
              `Ya tienes productos del restaurante "${res.existingRestaurantName}" en tu carrito. Por favor finaliza tu pedido o vacía el carrito para poder ordenar de otro restaurante.`,
              {
                duration: 5000,
              },
            );
            return;
          }
          toast.success(`${p.name} (${qty}) añadido al carrito!`);
        }}
        onGoToRestaurant={(rid) => navigate(`/r/${rid}`)}
        generalDiscount={
          restaurants.find(
            (r) => r.id === selectedProductForModal?.restaurantId,
          )?.generalDiscount
        }
        generalDiscountEnabled={
          restaurants.find(
            (r) => r.id === selectedProductForModal?.restaurantId,
          )?.generalDiscountEnabled
        }
      />
    </div>
  );
}
