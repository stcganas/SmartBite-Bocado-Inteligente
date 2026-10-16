import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from "react-dom";
import { Bell, Check, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

interface NotificationDropdownProps {
  getDashboardLink: () => string;
}

export function NotificationModal({ isOpen, onClose, getDashboardLink }: { isOpen: boolean; onClose: () => void; getDashboardLink: () => string }) {
  const { notifications, markAsRead, deleteAllNotifications, loading, unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = async (id: string) => {
    await markAsRead(id);
    onClose();
    navigate(`${getDashboardLink()}?tab=inbox`);
  };

  const handleClearAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteAllNotifications();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop for closing */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md z-0 cursor-pointer pointer-events-auto"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            className="w-full max-w-lg bg-surface rounded-[2.5rem] shadow-2xl border border-white/10 z-10 overflow-hidden flex flex-col max-h-[85vh] relative pointer-events-auto"
          >
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-surface flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-black text-on-surface tracking-tight leading-none uppercase text-sm">Notificaciones</h3>
                  {unreadCount > 0 && (
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">
                      {unreadCount} nuevas hoy
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Limpiar</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 bg-surface-variant hover:bg-surface-light rounded-xl text-on-surface-variant transition-all hover:rotate-90 active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 no-scrollbar bg-surface/50">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-sm font-bold text-on-surface-muted">Cargando avisos...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-neutral-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                    <Bell className="w-8 h-8 text-neutral-500" />
                  </div>
                  <p className="text-on-surface font-black uppercase text-xs tracking-widest">¡Todo al día!</p>
                  <p className="text-[10px] text-on-surface-muted mt-2 tracking-wide font-medium">No tienes notificaciones pendientes</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.slice(0, 10).map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif.id)}
                      className={`p-5 hover:bg-white/5 cursor-pointer transition-all text-left w-full block group relative ${!notif.is_read ? 'bg-primary/5' : ''}`}
                    >
                      {!notif.is_read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full shadow-[0_0_8px_rgba(255,138,0,0.5)]" />
                      )}
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`text-sm font-black tracking-tight leading-tight pr-4 ${!notif.is_read ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                          {notif.title}
                        </h4>
                        {notif.is_read ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <div className="w-2 h-2 bg-primary rounded-full shrink-0 shadow-sm shadow-primary/40 animate-pulse" />
                        )}
                      </div>
                      <p className={`text-xs leading-relaxed line-clamp-2 ${!notif.is_read ? 'text-on-surface-variant font-medium' : 'text-on-surface-muted'}`}>
                        {notif.body}
                      </p>
                      <div className="mt-2.5 flex items-center justify-between">
                        <p className="text-[9px] font-bold text-on-surface-muted/60 uppercase tracking-wider">
                          {new Date(notif.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} • {new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                        {!notif.is_read && (
                          <span className="text-[8px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-md">
                            Nueva
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/5 bg-surface flex-shrink-0">
              <Link
                to={`${getDashboardLink()}?tab=inbox`}
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full py-4 bg-surface-variant text-on-surface border border-outline/10 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:border-primary transition-all shadow-lg active:scale-[0.98]"
              >
                Ver bandeja de entrada
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function NotificationDropdown({ getDashboardLink }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-full transition-all"
        title="Notificaciones"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-error text-on-error text-[10px] font-black rounded-full flex items-center justify-center border-2 border-surface animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        getDashboardLink={getDashboardLink} 
      />
    </div>
  );
}
