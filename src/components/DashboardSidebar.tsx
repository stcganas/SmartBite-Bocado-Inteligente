import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X, 
  LogOut, 
  LucideIcon,
  Search,
  Home
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

export interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number | string;
  color?: string;
  inactiveColor?: string;
  activeClass?: string;
}

export interface SidebarGroup {
  title?: string;
  items: SidebarItem[];
}

interface DashboardSidebarProps {
  groups: SidebarGroup[];
  activeId: string;
  onItemClick: (id: string) => void;
  title: string;
  subtitle?: string;
  logo?: React.ReactNode;
  onLogout?: () => void;
  showHomeLink?: boolean;
  isMobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  groups,
  activeId,
  onItemClick,
  title,
  subtitle,
  logo,
  onLogout,
  showHomeLink = false,
  isMobileOpen: controlledIsMobileOpen,
  onMobileOpenChange
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [internalIsMobileOpen, setInternalIsMobileOpen] = useState(false);
  
  const isMobileOpen = controlledIsMobileOpen !== undefined ? controlledIsMobileOpen : internalIsMobileOpen;
  const setIsMobileOpen = onMobileOpenChange || setInternalIsMobileOpen;

  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const SidebarContent = (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0A1A2F]/80 via-[#16213E]/80 to-[#0A1A2F]/80 backdrop-blur-3xl border-r border-white/10 shadow-2xl">
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-white/5 h-24">
        <div className={cn("flex items-center gap-3 transition-opacity duration-300", isCollapsed ? "opacity-0 invisible w-0" : "opacity-100 visible")}>
          {logo || (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
              <span className="text-on-surface font-black text-xl italic uppercase">S</span>
            </div>
          )}
          <div className="min-w-0">
            <h2 className="font-black text-on-surface tracking-tighter truncate leading-tight uppercase text-sm">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[10px] font-black text-indigo-300/60 uppercase tracking-widest truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        {/* Toggle Desktop */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-indigo-200 items-center justify-center transition-colors border border-white/5"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Close Mobile */}
        <button 
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-indigo-200 flex items-center justify-center transition-colors border border-white/5"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar - Aesthetic only for now or functional if needed */}
      {!isCollapsed && (
        <div className="px-6 py-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300 group-focus-within:text-orange-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-on-surface placeholder:text-indigo-300/50 focus:bg-white/10 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
            />
          </div>
        </div>
      )}

      {/* Items */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {groups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {group.title && !isCollapsed && (
              <h3 className="px-3 mb-2 text-[10px] font-black text-indigo-300/60 uppercase tracking-widest truncate">
                {group.title}
              </h3>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onItemClick(item.id);
                    if (window.innerWidth < 768) setIsMobileOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all relative group overflow-hidden active:scale-[0.98]",
                    activeId === item.id 
                      ? (item.activeClass || "bg-orange-600 text-on-surface shadow-xl shadow-orange-500/20") 
                      : "text-indigo-200 hover:bg-white/5 border border-transparent"
                  )}
                >
                  {activeId === item.id && !item.activeClass && (
                    <motion.div 
                      layoutId="activeTabSidebar"
                      className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-400 opacity-20"
                    />
                  )}
                  <item.icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", activeId === item.id ? (item.activeClass ? "" : "text-on-surface") : (item.inactiveColor || "group-hover:text-orange-500"))} />
                  {!isCollapsed && (
                    <span className="text-xs font-black uppercase tracking-widest truncate relative z-10">
                      {item.label}
                    </span>
                  )}
                  {!isCollapsed && item.badge !== undefined && (typeof item.badge === 'number' ? item.badge > 0 : !!item.badge) && (
                    <span className={cn(
                      "ml-auto px-2 py-0.5 rounded-full text-[10px] font-black",
                      activeId === item.id ? "bg-white text-orange-600" : "bg-orange-100 text-orange-600"
                    )}>
                      {item.badge}
                    </span>
                  )}
                  
                  {/* Tooltip for collapsed mode */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-6 px-3 py-2 bg-orange-600 text-on-surface text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
                      {item.label}
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-orange-600" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5 flex flex-col gap-2">
        {showHomeLink && (
          <Link
            to="/"
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl text-indigo-200 hover:bg-white/5 hover:text-on-surface transition-all group overflow-hidden active:scale-[0.98]",
              isCollapsed && "justify-center"
            )}
          >
            <Home className="w-5 h-5 shrink-0 group-hover:scale-110 group-hover:-translate-x-0.5 transition-all text-orange-500" />
            {!isCollapsed && (
              <span className="text-xs font-black uppercase tracking-widest truncate">
                Ir a Inicio
              </span>
            )}
          </Link>
        )}
        {onLogout && (
          <button 
            onClick={onLogout}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl text-indigo-200 hover:bg-rose-500/20 hover:text-rose-400 transition-all group overflow-hidden active:scale-[0.98]",
              isCollapsed && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5 shrink-0 group-hover:scale-110 group-hover:-translate-x-0.5 transition-all" />
            {!isCollapsed && (
              <span className="text-xs font-black uppercase tracking-widest truncate">
                Cerrar Sesión
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Trigger */}
      {controlledIsMobileOpen === undefined && (
        <div className="md:hidden fixed top-24 left-4 z-40">
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="w-12 h-12 rounded-2xl bg-white shadow-xl border border-neutral-100 flex items-center justify-center text-orange-600 active:scale-90 transition-transform"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-indigo-950/80 backdrop-blur-sm z-[60] md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-72 z-[70] md:hidden h-full"
          >
            {SidebarContent}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:block transition-all duration-300 ease-in-out h-screen sticky top-0 shrink-0 z-50",
        isCollapsed ? "w-20" : "w-72"
      )}>
        {SidebarContent}
      </aside>
    </>
  );
};
