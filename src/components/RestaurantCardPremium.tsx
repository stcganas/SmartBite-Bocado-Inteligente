import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Star, User, Clock, MapPin, Share2, Award, Gift, TrendingUp, Store, CheckCircle, Navigation, Users, Zap, RefreshCcw, Trophy } from 'lucide-react';
import { calculateRestaurantMeritScore } from '../utils/meritSystem';
import { getCategoryVisual } from '../utils/categoryTheme';
import { ProximityInfo } from '../utils/restaurantUtils';


// Using exact colors from prompt:
// Background: #050505
// Surface: #0E0E0E  
// Surface Elevated: #151515
// Gold: #FFB100
// Orange: #FF8A00 
// Red Gold: #E45A24
// Text Primary: #FFFFFF
// Text Secondary: #BFBFBF
// Success: #00D26A

interface RestaurantCardPremiumProps {
  restaurant: any;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
  rating: { average: number; count: number } | null;
  isOpen: boolean;
  proximity?: ProximityInfo;
}

export function RestaurantCardPremium({
  restaurant: r,
  isFavorite,
  onToggleFavorite,
  rating,
  isOpen,
  proximity,
}: RestaurantCardPremiumProps) {
  const navigate = useNavigate();

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: r.name,
        text: `¡Mira este restaurante en SmartBite!`,
        url: window.location.origin + `/r/${r.id}`
      });
    }
  };

  const isNew = !rating || rating.count < 10;
  const ratingValue = rating?.average ? rating.average.toFixed(1) : "5.0";
  const reviewCount = rating?.count || 12;

  const meritInfo = calculateRestaurantMeritScore(r, reviewCount, parseFloat(ratingValue));

  const realDistanceText = proximity?.formattedDistance || (r.city ? `En ${r.city}` : "Cercano");
  const deliveryTime = `${((r.name.length % 4) + 2) * 10} - ${((r.name.length % 4) + 2) * 10 + 10} min`;
  const orderCount = Math.floor(Math.random() * 5) + 1; // +1.2K etc

  return (
    <Link
      to={`/r/${r.id}`}
      className="shrink-0 w-[340px] md:w-[380px] snap-start rounded-[24px] overflow-hidden group transition-all active:scale-[0.98] relative flex flex-col hover:-translate-y-1 golden-glow-module"
    >
      {/* 1. Hero Image (Aspect Ratio 16:10 approx, covering around 55-65% height visually, let's use a fixed height or aspect ratio class) */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-[#0B0B0B]">
        {r.coverImage || r.logo ? (
          <img
            src={r.coverImage || r.logo || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000"}
            alt={r.name}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
             <Store className="w-16 h-16 text-neutral-800" />
          </div>
        )}
        {/* Dark overlay with depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent opacity-90" />
        <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.5)] pointer-events-none" />

        {/* 2. Top floating badges */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
          {/* Status Badge & Business Category Badge */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div 
              className="backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border"
              style={{ 
                backgroundColor: 'rgba(0,0,0,0.4)',
                borderColor: isOpen ? 'rgba(0, 210, 106, 0.3)' : 'rgba(255, 255, 255, 0.1)'
              }}
            >
              <div 
                className={`w-2 h-2 rounded-full ${isOpen ? 'animate-pulse' : ''}`}
                style={{
                  backgroundColor: isOpen ? '#00D26A' : '#BFBFBF',
                  boxShadow: isOpen ? '0 0 8px rgba(0,210,106,0.8)' : 'none'
                }}
              />
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface">
                {isOpen ? "Abierto" : "Cerrado"}
              </span>
            </div>

            {(() => {
              const catVisual = getCategoryVisual(r.businessCategory || r.type);
              const CatIcon = catVisual.icon;
              return (
                <div 
                  className="backdrop-blur-md px-2.5 py-1.5 rounded-full flex items-center gap-1.5 border"
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    borderColor: 'rgba(255,255,255,0.15)',
                  }}
                >
                  <CatIcon className="w-3.5 h-3.5" style={{ color: catVisual.accentColor }} strokeWidth={2.5} />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-200">
                    {catVisual.shortName}
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Right Action Badges */}
          <div className="flex gap-2">
            {isNew && (
              <div 
                className="backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border"
                style={{ 
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  borderColor: 'rgba(255,177,0,0.3)',
                }}
              >
                <Star className="w-3.5 h-3.5 fill-current" style={{ color: '#FFB100' }} />
                <span className="text-[11px] font-bold text-on-surface">Nuevo</span>
              </div>
            )}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleShare(e);
              }}
              className="w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center border hover:bg-white/10 transition-colors"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <Share2 className="w-4 h-4 text-on-surface" />
            </button>
            <button
              onClick={(e) => onToggleFavorite(e, r.id)}
              className="w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center border transition-all hover:bg-white/10 active:scale-95"
              style={{ 
                backgroundColor: 'rgba(0,0,0,0.4)', 
                borderColor: isFavorite ? 'rgba(255,138,0,0.5)' : 'rgba(255,255,255,0.1)' 
              }}
            >
              <Heart 
                className={`w-4 h-4 transition-colors ${isFavorite ? "fill-current" : ""}`} 
                style={{ color: isFavorite ? '#FF8A00' : '#FFFFFF' }}
              />
            </button>
          </div>
        </div>

        {/* 3. Banner SmartBite Rewards */}
        {r.referralEnabled && (
          <div className="absolute top-[45%] right-0 translate-x-2 group-hover:translate-x-0 transition-transform">
             <div 
               className="relative overflow-hidden flex items-center gap-2 pr-4 pl-3 py-1.5 rounded-l-2xl border-y border-l"
               style={{
                 backgroundColor: '#000000',
                 borderColor: 'rgba(255,177,0,0.5)',
                 boxShadow: '0 0 15px rgba(255,177,0,0.2), inset 0 0 10px rgba(255,177,0,0.1)'
               }}
             >
               {/* Shimmer Effect */}
               <div className="absolute inset-0 -translate-x-[150%] animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
               
               <Award className="w-6 h-6 shrink-0" style={{ color: '#FFB100', filter: 'drop-shadow(0 0 5px rgba(255,177,0,0.5))' }} />
               <div className="flex flex-col">
                 <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface">Gana</span>
                 <span className="text-[13px] font-black leading-none uppercase tracking-widest" style={{ color: '#FFB100', textShadow: '0 0 8px rgba(255,177,0,0.4)' }}>
                   X5 ORO 🪙
                 </span>
               </div>
             </div>
             
             {/* New Tag Below Monedas de Oro X5 */}
             <div 
               onClick={(e) => {
                 e.preventDefault();
                 e.stopPropagation();
                 navigate(`/referrals-info/${r.id}`);
               }}
               className="relative overflow-hidden flex items-center justify-between gap-1.5 pr-2 pl-3 py-1.5 rounded-l-xl border-y border-l mt-1.5 cursor-pointer"
               style={{
                 backgroundColor: '#000000',
                 borderColor: 'rgba(255,177,0,0.5)',
                 boxShadow: '0 0 10px rgba(255,177,0,0.2), inset 0 0 8px rgba(255,177,0,0.1)'
               }}
             >
               <div className="absolute inset-0 -translate-x-[150%] animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
               <div className="flex flex-col">
                 <span className="text-[11px] font-black leading-tight" style={{ color: '#FFB100', textShadow: '0 0 8px rgba(255,177,0,0.4)' }}>
                   Refiere y Gana
                 </span>
                 <div className="flex items-center gap-1 mt-0.5">
                   <User className="w-3 h-3 shrink-0" style={{ color: '#FFB100' }} />
                   <span className="text-[8px] text-white font-bold tracking-wider leading-none">
                     Trabaja con nosotros
                   </span>
                 </div>
               </div>
               <span 
                 className="text-[8px] font-black uppercase px-2 py-0.5 rounded shadow-sm shrink-0 ml-1"
                 style={{ backgroundColor: '#FFB100', color: '#000000' }}
               >
                 Ver
               </span>
             </div>
          </div>
        )}

        {/* 4. Avatar / Logo Restaurante */}
        <div className="absolute bottom-4 left-6 z-10 flex flex-col justify-end">
          <div 
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-2xl relative bg-[#0E0E0E] flex items-center justify-center p-1"
            style={{
               border: '2px solid #FFB100',
               boxShadow: '0 8px 25px rgba(0,0,0,0.6), 0 0 15px rgba(255,177,0,0.3)',
               transform: 'translateY(1.5rem)'
            }}
          >
             <div className="w-full h-full rounded-[14px] overflow-hidden bg-[#050505]">
                {r.logo ? (
                  <img src={r.logo} alt={r.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <Store className="w-8 h-8 m-auto text-[#FFB100]" />
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-6 pb-6 pt-8 flex-1 flex flex-col" style={{ backgroundColor: '#050505' }}>
        
        {/* Gamification Indicator */}
        {r.gamificationEnabled && (
          <div className="flex items-center gap-1.5 mb-2 w-fit bg-emerald-500/10 backdrop-blur-md px-2.5 py-1 rounded-lg border border-emerald-500/20">
            <Trophy className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/20" />
            <span className="text-[10px] font-black tracking-wider uppercase text-emerald-400">Tareas y niveles activos</span>
          </div>
        )}

        {/* 5. Información principal */}
        <div className="flex items-start justify-between gap-4 mb-1">
          <div className="flex items-center gap-2 min-w-0">
             <h3 className="font-[800] text-2xl truncate" style={{ color: '#FFFFFF', fontFamily: '"Inter", sans-serif' }}>
               {r.name}
             </h3>
             {r.luckyWheelEnabled && (
               <div className="flex items-center gap-2 shrink-0 bg-white/10 backdrop-blur-xl px-3 py-1 rounded-full border border-white/20 ml-1 shadow-[0_0_15px_rgba(255,177,0,0.2)]">
                 <span className="text-xl animate-spin-slow" style={{ animationDuration: '4s' }}>🎡</span>
                 <span className="text-[10px] font-black tracking-[0.05em] uppercase text-white drop-shadow-sm">Ruleta Activa</span>
               </div>
             )}
             <CheckCircle className="w-5 h-5 shrink-0" style={{ color: '#FFB100' }} />
          </div>
        </div>
        
        {(() => {
          const catVisual = getCategoryVisual(r.businessCategory || r.type);
          const CatIcon = catVisual.icon;
          return (
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] font-bold text-neutral-300">
                <CatIcon className="w-3.5 h-3.5" style={{ color: catVisual.accentColor }} strokeWidth={2.2} />
                <span className="capitalize">{r.type || catVisual.shortName}</span>
              </span>
              {r.cuisine && (
                <span className="text-[12px] font-medium text-neutral-400">
                  • {r.cuisine}
                </span>
              )}
            </div>
          );
        })()}

        {/* 6. Métricas destacadas */}
        <div className="flex items-center gap-3 text-[14px] font-[600] mb-5">
           <div className="flex items-center gap-1.5" style={{ color: '#FFB100' }}>
             <Star className="w-4 h-4 fill-current" />
             <span>{ratingValue}</span>
             <span style={{ color: '#BFBFBF', fontWeight: 400 }}>({reviewCount} reseñas)</span>
           </div>
           <span style={{ color: '#FFB100' }}>•</span>
           <span style={{ color: '#FFB100' }}>$$</span>
           <span style={{ color: '#FFB100' }}>•</span>
           <span className="flex items-center gap-1 font-bold" style={{ color: '#FFFFFF' }}>
             <Navigation className="w-3 h-3 text-[#FF8A00] rotate-45 inline" />
             {realDistanceText}
           </span>
        </div>

        {/* 7. Panel de información rápida */}
        <div 
          className="rounded-[16px] p-4 flex justify-between items-center mb-5 border gap-2"
          style={{ backgroundColor: '#0E0E0E', borderColor: 'rgba(255,255,255,0.05)' }}
        >
           <div className="flex flex-col items-center gap-1.5 flex-1 border-r border-white/5 px-1 text-center">
              <Clock className="w-4 h-4 opacity-90 drop-shadow-sm" style={{ color: '#FFB100' }} />
              <div className="flex flex-col items-center w-full">
                <span className="text-[13px] font-[800] text-white leading-tight truncate w-full">{deliveryTime}</span>
                <span className="text-[9px] uppercase tracking-widest font-black text-[#8A8A8E] mt-0.5">Entrega</span>
              </div>
           </div>

           <div className="flex flex-col items-center gap-1.5 flex-1 border-r border-white/5 px-1 text-center">
              <Zap className="w-4 h-4 opacity-90 drop-shadow-sm" style={{ color: '#00D26A' }} />
              <div className="flex flex-col items-center w-full">
                <span className="text-[13px] font-[800] leading-tight truncate w-full" style={{ color: '#00D26A' }}>Gratis</span>
                <span className="text-[9px] uppercase tracking-widest font-black text-[#8A8A8E] mt-0.5">Envío</span>
              </div>
           </div>

           <div className="flex flex-col items-center gap-1.5 flex-1 border-r border-white/5 px-1 text-center">
              <Award className="w-4 h-4 opacity-90 drop-shadow-sm" style={{ color: '#FFB100' }} />
              <div className="flex flex-col items-center w-full">
                <span className="text-[13px] font-[800] text-white leading-tight truncate w-full" title={`XP: ${meritInfo.score}`}>Nivel {meritInfo.level}</span>
                <span className="text-[9px] uppercase tracking-widest font-black text-[#8A8A8E] mt-0.5">Restaurante</span>
              </div>
           </div>

           <div className="flex flex-col items-center gap-1.5 flex-1 px-1 text-center">
              <Users className="w-4 h-4 opacity-90 drop-shadow-sm text-white" />
              <div className="flex flex-col items-center w-full">
                <span className="text-[13px] font-[800] text-white leading-tight truncate w-full">+{orderCount}.2K</span>
                <span className="text-[9px] uppercase tracking-widest font-black text-[#8A8A8E] mt-0.5">Pedidos</span>
              </div>
           </div>
        </div>

        {/* 8. Descripción corta */}
        <p className="text-[13px] leading-relaxed line-clamp-2 mb-6" style={{ color: '#BFBFBF' }}>
          {r.description || r.highlightMessage || `Disfruta de la mejor calidad y servicio. Ingredientes frescos, recetas tradicionales y todo el sabor que buscas a un clic.`}
        </p>

        {/* Spacer to push the CTA to bottom if needed */}
        <div className="mt-auto" />

        {/* 9. CTA Principal */}
        <button 
           onClick={(e) => {
             e.preventDefault(); // allow link to handle
             navigate(`/r/${r.id}`);
           }}
           className="w-full h-[56px] rounded-[16px] flex items-center justify-center gap-2 font-[800] text-[15px] uppercase tracking-wider relative overflow-hidden transition-all active:scale-95 group-hover:shadow-[0_0_20px_rgba(255,138,0,0.3)]"
           style={{
             background: 'linear-gradient(to right, #FF8A00, #FFB100)',
             color: '#000000',
           }}
        >
           <span className="relative z-10">Ver Menú</span>
           <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="absolute inset-0 translate-x-[-100%] group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12" />
        </button>

        {/* 10. Beneficios SmartBite */}
        <div 
          className="mt-4 pt-4 flex items-center justify-between gap-2 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
            <div className="flex items-center gap-1.5">
               <div className="w-5 h-5 rounded-full flex items-center justify-center bg-[#151515] border border-[#FFB100]/20">
                 <Award className="w-3 h-3" style={{ color: '#FFB100' }} />
               </div>
               <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#FFB100' }}>X5 Oro 🪙</span>
            </div>
            <div className="flex items-center gap-1.5">
               <div className="w-5 h-5 rounded-full flex items-center justify-center bg-[#151515] border border-[#FFB100]/20">
                 <Gift className="w-3 h-3" style={{ color: '#FFB100' }} />
               </div>
               <span className="text-[10px] font-[600]" style={{ color: '#BFBFBF' }}>Premios</span>
            </div>
            <div className="flex items-center gap-1.5">
               <div className="w-5 h-5 rounded-full flex items-center justify-center bg-[#151515] border border-[#FFB100]/20">
                 <TrendingUp className="w-3 h-3" style={{ color: '#FFB100' }} />
               </div>
               <span className="text-[10px] font-[600]" style={{ color: '#BFBFBF' }}>Niveles</span>
            </div>
        </div>

      </div>
    </Link>
  );
}
