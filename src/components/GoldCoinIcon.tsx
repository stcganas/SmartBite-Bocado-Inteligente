import React from 'react';

export const GoldCoinIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4 inline-block" }) => (
  <svg 
    className={`${className} drop-shadow-sm`} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Outer bevel/glow */}
    <circle cx="12" cy="12" r="11" fill="url(#goldGradient)" stroke="#B8860B" strokeWidth="1"/>
    {/* Inner ring */}
    <circle cx="12" cy="12" r="8" fill="url(#innerGoldGradient)" stroke="#DAA520" strokeWidth="1"/>
    {/* Center detailing (star or currency symbol) */}
    <path d="M12 6.5l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z" fill="#FFF8DC" opacity="0.8"/>
    <defs>
      <linearGradient id="goldGradient" x1="1" y1="1" x2="23" y2="23" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFDF00"/>
        <stop offset="0.5" stopColor="#D4AF37"/>
        <stop offset="1" stopColor="#996515"/>
      </linearGradient>
      <linearGradient id="innerGoldGradient" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFEA70"/>
        <stop offset="0.5" stopColor="#FFD700"/>
        <stop offset="1" stopColor="#DAA520"/>
      </linearGradient>
    </defs>
  </svg>
);
