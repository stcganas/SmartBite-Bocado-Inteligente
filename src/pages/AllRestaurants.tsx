import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Search,
  SlidersHorizontal,
  Navigation,
  Crosshair,
  Star,
  Clock,
  Heart,
  ChevronDown,
  X,
  Store,
  CheckCircle,
  Sparkles,
  LayoutGrid,
  List,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { db, Restaurant } from "../store/db";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../utils/format";
import {
  getRestaurantProximity,
  isRestaurantOpen,
  getBogotaTime,
  batchResolveRestaurantDistances,
  ProximityInfo,
} from "../utils/restaurantUtils";
import { RealDistanceResult } from "../services/mapboxService";
import { getDepartments, getCitiesByDepartment } from "../utils/colombiaData";
import { RestaurantGridCard } from "../components/RestaurantGridCard";

export default function AllRestaurants() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Location State
  const [userCity, setUserCity] = useState(
    () => searchParams.get("city") || localStorage.getItem("userCity") || "Maicao"
  );
  const [userDepartment, setUserDepartment] = useState(
    () => searchParams.get("dept") || localStorage.getItem("userDepartment") || "La Guajira"
  );
  const [userAddress, setUserAddress] = useState(
    () => localStorage.getItem("userAddress") || ""
  );
  const [userLat, setUserLat] = useState<number | null>(() => {
    const lat = localStorage.getItem("userLat");
    return lat ? parseFloat(lat) : null;
  });
  const [userLng, setUserLng] = useState<number | null>(() => {
    const lng = localStorage.getItem("userLng");
    return lng ? parseFloat(lng) : null;
  });
  const [isLocating, setIsLocating] = useState(false);

  // Data State
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [realDistancesMap, setRealDistancesMap] = useState<Record<string, RealDistanceResult>>({});
  const [isResolvingDistances, setIsResolvingDistances] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [restaurantRatings, setRestaurantRatings] = useState<
    Record<string, { average: number; count: number }>
  >({});
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<Set<string>>(new Set());
  const [currentTime] = useState(getBogotaTime());

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"distance" | "rating" | "deliveryFee">("distance");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Location selector modal
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [tempDept, setTempDept] = useState(userDepartment);
  const [tempCity, setTempCity] = useState(userCity);
  const [tempAddress, setTempAddress] = useState(userAddress);

  // Load restaurants and ratings
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setIsLoading(true);
        const rData = await db.getRestaurants();

        if (!isMounted) return;

        setRestaurants(rData);

        // Compute ratings map from restaurant attributes
        const ratingsMap: Record<string, { average: number; count: number }> = {};
        rData.forEach((r) => {
          ratingsMap[r.id] = {
            average: r.rating !== undefined && r.rating !== null ? r.rating : 4.8,
            count: r.reviewsCount || 12,
          };
        });
        setRestaurantRatings(ratingsMap);

        // Fetch user favorites if logged in
        if (user) {
          try {
            const favs = await db.getUserFavorites(user.id);
            setFavoriteRestaurants(new Set(favs.map((f) => f.id)));
          } catch {
            // non-fatal
          }
        }
      } catch (err) {
        console.error("Error cargando restaurantes:", err);
        toast.error("Error al cargar restaurantes");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Batch calculate real Mapbox driving distances whenever restaurants or user location changes
  useEffect(() => {
    if (!restaurants || restaurants.length === 0) return;

    let isMounted = true;
    const fetchDistances = async () => {
      try {
        setIsResolvingDistances(true);
        const map = await batchResolveRestaurantDistances(restaurants, {
          lat: userLat,
          lng: userLng,
          city: userCity || "Maicao",
          address: userAddress,
        });
        if (isMounted) {
          setRealDistancesMap(map);
        }
      } catch (err) {
        console.warn("Error resolving Mapbox distances:", err);
      } finally {
        if (isMounted) setIsResolvingDistances(false);
      }
    };

    fetchDistances();

    return () => {
      isMounted = false;
    };
  }, [restaurants, userLat, userLng, userCity, userAddress]);

  // Handle GPS location request
  const requestGPSLocation = () => {
    if (!navigator.geolocation) {
      toast.error("La geolocalización no es compatible con este dispositivo");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLat(lat);
        setUserLng(lng);
        localStorage.setItem("userLat", lat.toString());
        localStorage.setItem("userLng", lng.toString());

        // Reverse geocoding via Mapbox if token exists
        const token = import.meta.env.VITE_MAPBOX_TOKEN;
        if (token) {
          try {
            const res = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&types=place,region&language=es`
            );
            const data = await res.json();
            if (data.features?.length) {
              let detectedCity = null;
              let detectedDept = null;
              data.features.forEach((feat: any) => {
                if (feat.place_type.includes("place")) detectedCity = feat.text;
                if (feat.place_type.includes("region")) detectedDept = feat.text;
              });
              if (detectedCity) {
                setUserCity(detectedCity);
                localStorage.setItem("userCity", detectedCity);
              }
              if (detectedDept) {
                setUserDepartment(detectedDept);
                localStorage.setItem("userDepartment", detectedDept);
              }
            }
          } catch {
            // silent fallback
          }
        }
        setIsLocating(false);
        toast.success("Ubicación GPS actualizada con éxito");
      },
      (err) => {
        setIsLocating(false);
        console.warn("GPS error:", err);
        toast.error("No se pudo obtener el GPS. Puedes elegir tu municipio manualmente.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Toggle favorite
  const handleToggleFavorite = async (e: React.MouseEvent, restaurantId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Inicia sesión para guardar favoritos");
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
      toast.success(added ? "Agregado a favoritos" : "Eliminado de favoritos");
    } catch {
      toast.error("Error al actualizar favoritos");
    }
  };

  // Save manual location
  const handleSaveLocation = () => {
    setUserDepartment(tempDept);
    setUserCity(tempCity);
    setUserAddress(tempAddress);
    localStorage.setItem("userDepartment", tempDept);
    localStorage.setItem("userCity", tempCity);
    if (tempAddress) localStorage.setItem("userAddress", tempAddress);
    setShowLocationModal(false);
    toast.success(`Ubicación actualizada: ${tempCity}, ${tempDept}`);
  };

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    restaurants.forEach((r) => {
      if (r.type) set.add(r.type);
    });
    return Array.from(set).sort();
  }, [restaurants]);

  // Compute proximity and apply filters
  const sortedAndFilteredRestaurants = useMemo(() => {
    const userLoc = {
      lat: userLat,
      lng: userLng,
      city: userCity || "Maicao",
      address: userAddress,
    };

    // Calculate proximity for every active restaurant using real Mapbox distances if available
    const withProx = restaurants
      .filter((r) => !r.status || r.status === "active")
      .map((r) => ({
        restaurant: r,
        proximity: getRestaurantProximity(r, userLoc, realDistancesMap[r.id]),
        isOpen: isRestaurantOpen(r, currentTime),
        rating: restaurantRatings[r.id]?.average || r.rating || 4.5,
      }));

    // Apply filters
    let filtered = withProx.filter(({ restaurant: r, isOpen }) => {
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = r.name.toLowerCase().includes(term);
        const matchesType = r.type?.toLowerCase().includes(term);
        const matchesDesc = r.description?.toLowerCase().includes(term);
        if (!matchesName && !matchesType && !matchesDesc) return false;
      }

      // Category filter
      if (selectedCategory !== "all") {
        if (r.type?.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      }

      // Only open filter
      if (onlyOpen && !isOpen) return false;

      return true;
    });

    // Helper to get reliable meters for numerical comparison
    const getDistanceMeters = (p: typeof withProx[0]["proximity"]): number => {
      if (typeof p.distanceMeters === "number" && !isNaN(p.distanceMeters)) {
        return p.distanceMeters;
      }
      if (typeof p.distanceKm === "number" && !isNaN(p.distanceKm)) {
        return Math.round(p.distanceKm * 1000);
      }
      return 99999999;
    };

    // Sort order (closest first: strictly top to bottom)
    return [...filtered].sort((a, b) => {
      if (sortBy === "distance") {
        const distA = getDistanceMeters(a.proximity);
        const distB = getDistanceMeters(b.proximity);
        if (distA !== distB) {
          return distA - distB; // Ascending: strictly closest (e.g. 200m, 500m, 1.2km) to furthest
        }
        // Tie breaker 1: rating
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        // Tie breaker 2: name
        return a.restaurant.name.localeCompare(b.restaurant.name);
      } else if (sortBy === "rating") {
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        const distA = getDistanceMeters(a.proximity);
        const distB = getDistanceMeters(b.proximity);
        return distA - distB;
      } else if (sortBy === "deliveryFee") {
        const feeA = typeof a.restaurant.deliveryFee === "number" ? a.restaurant.deliveryFee : 0;
        const feeB = typeof b.restaurant.deliveryFee === "number" ? b.restaurant.deliveryFee : 0;
        if (feeA !== feeB) {
          return feeA - feeB;
        }
        const distA = getDistanceMeters(a.proximity);
        const distB = getDistanceMeters(b.proximity);
        return distA - distB;
      }

      const distA = getDistanceMeters(a.proximity);
      const distB = getDistanceMeters(b.proximity);
      return distA - distB;
    });
  }, [
    restaurants,
    realDistancesMap,
    userLat,
    userLng,
    userCity,
    userAddress,
    searchTerm,
    selectedCategory,
    onlyOpen,
    sortBy,
    currentTime,
    restaurantRatings,
  ]);

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-24 selection:bg-[#FF8A00] selection:text-black">
      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          {/* Back button and page title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 active:scale-90 border border-white/10 flex items-center justify-center text-white transition-all shadow-sm"
              title="Volver al inicio"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-[#FF8A00]" />
                  <span>Restaurantes en {userCity || "tu zona"}</span>
                </h1>
                <span className="text-[11px] font-black text-[#FF8A00] bg-[#FF8A00]/10 border border-[#FF8A00]/25 px-2 py-0.5 rounded-full">
                  {sortedAndFilteredRestaurants.length} disponibles
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-medium flex items-center gap-1 mt-0.5">
                <Navigation className="w-3 h-3 text-[#FF8A00] rotate-45 shrink-0" />
                <span>Organizados desde el más cercano a tu ubicación</span>
              </p>
            </div>
          </div>

          {/* Location button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLocationModal(true)}
              className="flex items-center gap-1.5 bg-[#151515] hover:bg-[#202020] border border-white/10 hover:border-[#FF8A00]/40 px-3 py-1.5 rounded-full text-xs font-bold transition-all text-neutral-200 active:scale-95 shadow-sm"
            >
              <MapPin className="w-3.5 h-3.5 text-[#FF8A00] shrink-0" />
              <span className="max-w-[120px] sm:max-w-[180px] truncate">{userCity || "Maicao"}</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            <button
              onClick={requestGPSLocation}
              disabled={isLocating}
              title="Actualizar con mi GPS"
              className="w-8 h-8 rounded-full bg-[#151515] hover:bg-[#FF8A00]/20 border border-white/10 hover:border-[#FF8A00]/40 flex items-center justify-center text-[#FF8A00] transition-all active:scale-90"
            >
              <Crosshair className={`w-4 h-4 ${isLocating ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Search and Quick Filters Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-3 pt-1 flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
          {/* Search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, comida o tipo..."
              className="w-full bg-[#141414] border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#FF8A00] transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Secondary Controls: Sort & Layout */}
          <div className="flex items-center gap-2 self-end sm:self-auto overflow-x-auto hide-scrollbar py-0.5">
            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#141414] border border-white/10 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-neutral-200 focus:outline-none focus:border-[#FF8A00]"
            >
              <option value="distance">📍 Lo más cercano</option>
              <option value="rating">⭐ Mejor calificados</option>
              <option value="deliveryFee">🛵 Menor costo de envío</option>
            </select>

            {/* Filter Open Toggle */}
            <button
              onClick={() => setOnlyOpen(!onlyOpen)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 ${
                onlyOpen
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  : "bg-[#141414] text-neutral-400 border-white/10 hover:text-white"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${onlyOpen ? "bg-emerald-400" : "bg-neutral-500"}`} />
              <span>Abiertos</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#141414] p-0.5 rounded-xl border border-white/10">
              <button
                onClick={() => setViewMode("grid")}
                title="Cuadrícula 2x2"
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "grid" ? "bg-[#FF8A00] text-black shadow" : "text-neutral-400 hover:text-white"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                title="Vista en lista"
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "list" ? "bg-[#FF8A00] text-black shadow" : "text-neutral-400 hover:text-white"
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Horizontal Scroll Chips */}
        {categories.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-2.5 flex items-center gap-2 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
                selectedCategory === "all"
                  ? "bg-[#FF8A00] text-black shadow-md shadow-[#FF8A00]/20"
                  : "bg-[#141414] text-neutral-400 hover:text-white border border-white/5"
              }`}
            >
              Todos los tipos
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? "bg-[#FF8A00] text-black shadow-md shadow-[#FF8A00]/20"
                    : "bg-[#141414] text-neutral-400 hover:text-white border border-white/5"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Proximity helper banner */}
        <div className="mb-5 bg-gradient-to-r from-[#FF8A00]/10 via-[#FF8A00]/5 to-transparent border border-[#FF8A00]/20 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF8A00]/20 flex items-center justify-center text-[#FF8A00] shrink-0">
              <Navigation className="w-4 h-4 rotate-45" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-white">
                Restaurantes ordenados por cercanía geográfica
              </p>
              <p className="text-[11px] text-neutral-400">
                {userAddress
                  ? `Calculado respecto a tu dirección: "${userAddress}" en ${userCity}`
                  : userLat && userLng
                  ? `Calculado con tu posición GPS exacta en tiempo real`
                  : `Calculado desde el centro urbano de ${userCity || "Maicao"}`}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowLocationModal(true)}
            className="text-[11px] font-bold text-[#FF8A00] hover:underline whitespace-nowrap bg-[#FF8A00]/10 px-2.5 py-1.5 rounded-lg border border-[#FF8A00]/25"
          >
            Cambiar zona
          </button>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="rounded-[1.5rem] bg-[#121212] border border-white/5 h-[260px] animate-pulse"
              />
            ))}
          </div>
        ) : sortedAndFilteredRestaurants.length > 0 ? (
          viewMode === "grid" ? (
            /* 2x2 Grid on Mobile, expanding naturally on larger screens */
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {sortedAndFilteredRestaurants.map(({ restaurant: r, proximity }) => (
                <RestaurantGridCard
                  key={r.id}
                  restaurant={r}
                  currentTime={currentTime}
                  isFavorite={favoriteRestaurants.has(r.id)}
                  onToggleFavorite={handleToggleFavorite}
                  rating={restaurantRatings[r.id] || null}
                  proximity={proximity}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
          ) : (
            /* List mode */
            <div className="flex flex-col gap-3">
              {sortedAndFilteredRestaurants.map(({ restaurant: r, proximity }) => {
                const isOpen = isRestaurantOpen(r, currentTime);
                const rating = restaurantRatings[r.id]?.average || 4.8;
                return (
                  <div
                    key={r.id}
                    onClick={() => navigate(`/r/${r.id}`)}
                    className="cursor-pointer flex items-center gap-3 p-3 rounded-2xl bg-[#0E0E0E] border border-white/5 hover:border-[#FF8A00]/40 transition-all active:scale-[0.99] group shadow-lg"
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-neutral-900 overflow-hidden relative shrink-0">
                      <img
                        src={
                          r.coverImage ||
                          r.logo ||
                          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=300"
                        }
                        alt={r.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <span
                        className={`absolute bottom-1 left-1 text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                          isOpen ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                        }`}
                      >
                        {isOpen ? "Abierto" : "Cerrado"}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h3 className="text-sm font-bold text-white group-hover:text-[#FF8A00] transition-colors truncate">
                          {r.name}
                        </h3>
                        <span className="text-[10px] font-bold text-[#FFD700] bg-black/60 border border-[#FFD700]/30 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                          <Navigation className="w-2.5 h-2.5 fill-current rotate-45 text-[#FF8A00]" />
                          {proximity.formattedDistance}
                        </span>
                      </div>

                      <p className="text-[11px] text-neutral-400 truncate mb-2">
                        {r.type || "Restaurante"} {r.address ? `• ${r.address}` : `• ${r.city}`}
                      </p>

                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="flex items-center gap-1 text-white font-bold">
                          <Star className="w-3.5 h-3.5 text-[#FFB347] fill-current" />
                          {rating.toFixed(1)}
                        </span>
                        <span className="text-neutral-500">•</span>
                        <span className="flex items-center gap-1 text-neutral-400">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          20-35 min
                        </span>
                        <span className="text-neutral-500">•</span>
                        <span className="text-emerald-400 font-bold text-[10px]">
                          {r.deliveryFee ? formatCurrency(r.deliveryFee) : "Envío gratis"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Empty state */
          <div className="text-center py-16 px-4 bg-[#0E0E0E] rounded-3xl border border-white/5 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#FF8A00]/10 flex items-center justify-center mx-auto mb-4 text-[#FF8A00]">
              <Store className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              No se encontraron restaurantes
            </h3>
            <p className="text-xs text-neutral-400 mb-6">
              No hay restaurantes con los filtros aplicados en {userCity || "esta ubicación"}.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                  setOnlyOpen(false);
                }}
                className="px-4 py-2 bg-[#FF8A00] text-black font-bold text-xs rounded-xl hover:bg-[#FFA033] transition-colors"
              >
                Restablecer filtros
              </button>
              <button
                onClick={() => setShowLocationModal(true)}
                className="px-4 py-2 bg-white/5 text-white font-bold text-xs rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
              >
                Cambiar municipio
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Location Modal */}
      <AnimatePresence>
        {showLocationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#121212] border border-white/10 rounded-3xl p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#FF8A00]" />
                  <h3 className="text-base font-bold text-white">
                    Seleccionar ubicación
                  </h3>
                </div>
                <button
                  onClick={() => setShowLocationModal(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5">
                {/* Department */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 mb-1 uppercase tracking-wider">
                    Departamento
                  </label>
                  <select
                    value={tempDept}
                    onChange={(e) => {
                      setTempDept(e.target.value);
                      const cities = getCitiesByDepartment(e.target.value);
                      setTempCity(cities[0] || "");
                    }}
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#FF8A00]"
                  >
                    {getDepartments().map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* City / Municipality */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 mb-1 uppercase tracking-wider">
                    Municipio / Ciudad
                  </label>
                  <select
                    value={tempCity}
                    onChange={(e) => setTempCity(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#FF8A00]"
                  >
                    {getCitiesByDepartment(tempDept).map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Address (Optional) */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 mb-1 uppercase tracking-wider">
                    Dirección (para mayor precisión)
                  </label>
                  <input
                    type="text"
                    value={tempAddress}
                    onChange={(e) => setTempAddress(e.target.value)}
                    placeholder="Ej. Calle 16 # 10-25"
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FF8A00]"
                  />
                </div>

                {/* GPS button inside modal */}
                <button
                  type="button"
                  onClick={() => {
                    requestGPSLocation();
                    setShowLocationModal(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#FF8A00]/10 hover:bg-[#FF8A00]/20 border border-[#FF8A00]/30 text-[#FF8A00] text-xs font-bold transition-all active:scale-[0.98]"
                >
                  <Crosshair className="w-4 h-4" />
                  <span>Usar mi GPS actual en tiempo real</span>
                </button>

                {/* Action buttons */}
                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLocationModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveLocation}
                    className="flex-1 py-2.5 rounded-xl bg-[#FF8A00] hover:bg-[#FFA033] text-black text-xs font-black transition-colors"
                  >
                    Aplicar ubicación
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
