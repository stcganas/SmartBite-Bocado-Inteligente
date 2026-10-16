import React from "react";
import { motion } from "framer-motion";
import { getCategoryVisual, CategoryVisualConfig } from "../utils/categoryTheme";

interface BusinessCategoryNavProps {
  categories: Array<{
    id: string;
    title: string;
    image?: string;
    fromColor?: string;
    toColor?: string;
    shadowColor?: string;
    dotColor?: string;
    active?: boolean;
    icon?: string;
  }>;
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
}

export const BusinessCategoryNav: React.FC<BusinessCategoryNavProps> = ({
  categories,
  activeCategoryId,
  onSelectCategory,
}) => {
  return (
    <div className="w-full py-2">
      <div className="flex bg-[#111111]/90 backdrop-blur-xl p-2 rounded-2xl gap-2.5 w-full max-w-4xl mx-auto shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/10 overflow-x-auto no-scrollbar">
        {categories.map((cat) => {
          const config = getCategoryVisual(cat.id);
          const Icon = config.icon;
          const isActive = activeCategoryId === cat.id;
          const displayName = cat.title.replace("Explorar ", "");

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`relative flex-1 min-w-[105px] sm:min-w-[120px] flex flex-col items-center gap-2 py-2.5 px-3 rounded-xl transition-all duration-300 group overflow-hidden border ${
                isActive
                  ? `bg-gradient-to-b from-white/15 via-white/5 to-transparent ${config.activeBorder} shadow-lg`
                  : "bg-transparent border-transparent hover:bg-white/5 text-neutral-400 hover:text-white"
              }`}
              style={{
                boxShadow: isActive ? `0 8px 24px ${config.glowColor}` : undefined,
              }}
            >
              {/* Active Ambient Glow Background */}
              {isActive && (
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none blur-md bg-gradient-to-r"
                  style={{
                    backgroundImage: `linear-gradient(to bottom right, ${config.accentColor}, transparent)`,
                  }}
                />
              )}

              {/* Icon Container with Gradient / Image */}
              <div
                className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-300 overflow-hidden shadow-md border ${
                  isActive
                    ? `bg-gradient-to-br ${config.gradient} border-white/40 scale-105 shadow-[0_4px_12px_rgba(0,0,0,0.4)]`
                    : "bg-[#1C1C1C] border-white/10 group-hover:border-white/20 group-hover:scale-105"
                }`}
              >
                {/* Visual Image Background with Overlay */}
                <img
                  src={cat.image || config.imageUrl}
                  alt={displayName}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                    isActive ? "opacity-35 mix-blend-overlay scale-110" : "opacity-20 group-hover:opacity-30"
                  }`}
                  loading="lazy"
                  onError={(e) => {
                    if (config?.imageUrl && e.currentTarget.src !== config.imageUrl) {
                      e.currentTarget.src = config.imageUrl;
                    }
                  }}
                />

                {/* Primary Vector Icon */}
                <Icon
                  className={`relative z-10 w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 ${
                    isActive
                      ? "text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] scale-110"
                      : "text-neutral-300 group-hover:text-white"
                  }`}
                  strokeWidth={2.2}
                />
              </div>

              {/* Category Title */}
              <span
                className={`relative z-10 text-[11px] sm:text-xs font-black tracking-wide truncate max-w-full uppercase transition-colors ${
                  isActive ? "text-white" : "text-neutral-400 group-hover:text-neutral-200"
                }`}
              >
                {displayName}
              </span>

              {/* Active Bottom Pip */}
              {isActive && (
                <motion.div
                  layoutId="activeBusinessCategoryPip"
                  className="w-5 h-1 rounded-full bg-white shadow-[0_0_8px_#ffffff]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface CategoryCircleChipProps {
  category: {
    id: string;
    name: string;
    icon?: string;
    imageUrl?: string;
  };
  isActive: boolean;
  onSelect: () => void;
}

export const CategoryCircleChip: React.FC<CategoryCircleChipProps> = ({
  category,
  isActive,
  onSelect,
}) => {
  const config = getCategoryVisual(category.id || category.name);
  const Icon = config.icon;
  const imageSource = category.imageUrl || config.imageUrl;

  return (
    <button
      onClick={onSelect}
      className="flex flex-col items-center gap-2 group shrink-0 transition-transform active:scale-95 focus:outline-none"
    >
      {/* Circle Container */}
      <div
        className={`relative w-[54px] h-[54px] sm:w-[62px] sm:h-[62px] rounded-2xl flex items-center justify-center transition-all duration-300 border-2 overflow-hidden ${
          isActive
            ? `${config.activeBorder} scale-110 shadow-lg`
            : "bg-[#141414] border-white/10 hover:border-white/30 shadow-md group-hover:scale-105"
        }`}
        style={{
          boxShadow: isActive ? `0 6px 20px ${config.glowColor}` : undefined,
        }}
      >
        {/* Background Image / Texture */}
        {imageSource && (
          <img
            src={imageSource}
            alt={category.name}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${
              isActive
                ? "opacity-90 scale-105"
                : "opacity-60 group-hover:opacity-85 grayscale-[0.2] group-hover:grayscale-0"
            }`}
            loading="lazy"
            onError={(e) => {
              if (config?.imageUrl && e.currentTarget.src !== config.imageUrl) {
                e.currentTarget.src = config.imageUrl;
              }
            }}
          />
        )}

        {/* Gradient Overlay for Legibility */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            isActive
              ? `bg-gradient-to-t ${config.gradient} opacity-60 mix-blend-hard-light`
              : "bg-gradient-to-t from-black/80 via-black/40 to-black/20 group-hover:from-black/60"
          }`}
        />

        {/* Icon Floating on Center with subtle badge backdrop */}
        <div
          className={`relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center backdrop-blur-md transition-all ${
            isActive
              ? "bg-black/50 text-white border border-white/40 shadow-sm"
              : "bg-black/40 text-white/90 border border-white/10 group-hover:bg-black/50 group-hover:text-white"
          }`}
        >
          <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2.5} />
        </div>

        {/* Active Ring Indicator */}
        {isActive && (
          <div className="absolute inset-0 border-2 border-white/60 rounded-2xl pointer-events-none z-20" />
        )}
      </div>

      {/* Label */}
      <span
        className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-center max-w-[70px] truncate transition-colors ${
          isActive
            ? "text-orange-400 font-extrabold"
            : "text-neutral-400 group-hover:text-neutral-200"
        }`}
      >
        {category.name}
      </span>
    </button>
  );
};

export const BusinessTypeBadge: React.FC<{
  businessCategory?: string;
  cuisineOrType?: string;
  className?: string;
}> = ({ businessCategory, cuisineOrType, className = "" }) => {
  const config = getCategoryVisual(businessCategory || cuisineOrType);
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border backdrop-blur-md ${config.badgeBg} ${className}`}
    >
      <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
      <span className="capitalize">{config.shortName || cuisineOrType}</span>
    </div>
  );
};
