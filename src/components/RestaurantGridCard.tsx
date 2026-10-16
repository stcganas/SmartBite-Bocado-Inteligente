import React from "react";
import { Link } from "react-router-dom";
import { Heart, Star, Clock, MapPin, Store, Sparkles, Navigation } from "lucide-react";
import { Restaurant } from "../store/db";
import { isRestaurantOpen, ProximityInfo } from "../utils/restaurantUtils";
import { getCategoryVisual } from "../utils/categoryTheme";

interface RestaurantGridCardProps {
  restaurant: Restaurant;
  currentTime: Date;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
  rating: { average: number; count: number } | null;
  proximity: ProximityInfo;
  formatCurrency: (amount: number) => string;
}

export const RestaurantGridCard: React.FC<RestaurantGridCardProps> = ({
  restaurant: r,
  currentTime,
  isFavorite,
  onToggleFavorite,
  rating,
  proximity,
  formatCurrency,
}) => {
  const isOpen = isRestaurantOpen(r, currentTime);
  const visual = getCategoryVisual(r.businessCategory || r.type || "restaurant");
  const CategoryIcon = visual.icon;

  const ratingAvg = rating?.average ? rating.average.toFixed(1) : "4.8";
  const ratingCount = rating?.count || 15;
  const deliveryTime = `${((r.name.length % 3) + 2) * 10}-${((r.name.length % 3) + 2) * 10 + 15} min`;

  return (
    <Link
      to={`/r/${r.id}`}
      className="group flex flex-col rounded-[1.5rem] bg-[#0B0B0B] border border-white/5 hover:border-[#FF8A00]/40 overflow-hidden transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] shadow-lg shadow-black/40 golden-glow-module"
    >
      {/* Media / Cover / Logo */}
      <div className="relative w-full aspect-[4/3] bg-zinc-900 overflow-hidden flex items-center justify-center">
        {r.coverImage || r.logo ? (
          <img
            src={r.coverImage || r.logo}
            alt={r.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src =
                "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600";
            }}
          />
        ) : (
          <Store className="w-10 h-10 text-neutral-600" />
        )}

        {/* Gradient shade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 z-10">
          {/* Proximity / Distance Badge */}
          <div
            className="bg-black/80 backdrop-blur-md border border-[#FFD700]/40 text-[#FFD700] px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px] sm:text-[11px] font-black tracking-wide shadow-md"
            title={
              proximity.distanceMeters
                ? `Distancia real: ${proximity.distanceMeters} metros (${(
                    proximity.distanceMeters / 1000
                  ).toFixed(2)} km)${
                    proximity.formattedDuration
                      ? ` • ~${proximity.formattedDuration} en ruta`
                      : ""
                  }`
                : "Distancia aproximada"
            }
          >
            <Navigation className="w-2.5 h-2.5 fill-current rotate-45 text-[#FF8A00]" />
            <span>{proximity.formattedDistance}</span>
            {proximity.isRealDriving && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Calculado con ruta real Mapbox" />
            )}
          </div>

          {/* Favorite button */}
          <button
            onClick={(e) => onToggleFavorite(e, r.id)}
            aria-label="Favorito"
            className={`p-1.5 rounded-full backdrop-blur-md transition-all active:scale-90 shadow-md ${
              isFavorite
                ? "bg-[#FF8A00] text-white"
                : "bg-black/40 text-white/80 hover:bg-black/60 hover:text-white"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* Bottom badges over image */}
        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between z-10">
          {/* Open/Close status */}
          <span
            className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-md ${
              isOpen
                ? "bg-emerald-500 text-white"
                : "bg-rose-500/90 text-white backdrop-blur-xs"
            }`}
          >
            {isOpen ? "Abierto" : "Cerrado"}
          </span>

          {r.isFeatured && (
            <span className="bg-[#FF8A00]/90 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase flex items-center gap-0.5 shadow-md">
              <Sparkles className="w-2.5 h-2.5 fill-current" />
              TOP
            </span>
          )}
        </div>
      </div>

      {/* Info Container */}
      <div className="p-3 flex flex-col flex-1 justify-between gap-2">
        <div>
          {/* Title */}
          <h3 className="font-bold text-[13px] sm:text-[14px] text-white group-hover:text-[#FF8A00] transition-colors line-clamp-1 leading-snug">
            {r.name}
          </h3>

          {/* Category & Address info */}
          <div className="flex items-center gap-1 text-[11px] text-neutral-400 mt-1 line-clamp-1">
            <CategoryIcon
              className="w-3 h-3 shrink-0"
              style={{ color: visual.accentColor }}
              strokeWidth={2.5}
            />
            <span className="truncate">{r.type || "Restaurante"}</span>
            {r.address ? (
              <>
                <span className="text-neutral-600">•</span>
                <span className="truncate text-[10px] text-neutral-500">
                  {r.address}
                </span>
              </>
            ) : r.city ? (
              <>
                <span className="text-neutral-600">•</span>
                <span className="truncate text-[10px] text-neutral-500">
                  {r.city}
                </span>
              </>
            ) : null}
          </div>
        </div>

        {/* Rating, Delivery time & Fee */}
        <div className="pt-2 border-t border-white/5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1 text-white font-bold">
              <Star className="w-3.5 h-3.5 text-[#FFB347] fill-current" />
              <span>{ratingAvg}</span>
              <span className="text-neutral-500 text-[10px] font-normal">
                ({ratingCount})
              </span>
            </div>

            <div className="flex items-center gap-1 text-neutral-400 text-[10px] font-medium">
              <Clock className="w-3 h-3 text-neutral-500" />
              <span>{deliveryTime}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              {r.deliveryFee && r.deliveryFee > 0
                ? `Envío ${formatCurrency(r.deliveryFee)}`
                : "Envío Gratis"}
            </span>

            <span className="text-[10px] font-semibold text-[#FF8A00] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Ver menú →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
