import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { BellRing, CheckCircle2, Trash2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export function NotificationInbox() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications, loading } = useNotifications();

  const handleMarkAllAsRead = async () => {
    let hasUnread = notifications.some(n => !n.is_read);
    if (!hasUnread) return;
    
    await markAllAsRead();
    toast.success("Todas las notificaciones marcadas como leídas");
  };

  const handleDeleteAll = async () => {
    if (window.confirm("¿Seguro que quieres eliminar todas las notificaciones?")) {
      await deleteAllNotifications();
      toast.success("Bandeja de notificaciones limpia");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-on-surface-variant">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold">Cargando notificaciones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-on-surface tracking-tight flex items-center gap-3">
            Centro de Notificaciones
            {unreadCount > 0 && (
              <span className="text-sm bg-error text-on-error px-2 py-0.5 rounded-full font-bold">
                {unreadCount} nuevas
              </span>
            )}
          </h2>
          <p className="text-on-surface-variant font-medium mt-1">
            Mantente al tanto de tus avisos y promociones.
          </p>
        </div>
        
        <div className="flex gap-2 self-start md:self-auto">
          {notifications.some(n => !n.is_read) && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/10 px-4 py-2 rounded-xl transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Marcar como leídas
            </button>
          )}
          
          {notifications.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-error hover:bg-error/10 px-4 py-2 rounded-xl transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Limpiar bandeja
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-12 text-center rounded-3xl border border-dashed border-outline-variant bg-surface-variant/20"
            >
              <BellRing className="w-12 h-12 text-on-surface-variant/50 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-on-surface mb-2">Todo al día</h3>
              <p className="text-on-surface-variant">No tienes notificaciones pendientes.</p>
            </motion.div>
          ) : (
            notifications.map((notif) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={notif.id}
                className={`group relative overflow-hidden p-5 sm:p-6 rounded-3xl transition-all ${
                  !notif.is_read 
                    ? 'bg-primary/5 shadow-sm border border-primary/20 ring-1 ring-primary/10' 
                    : 'bg-surface border border-outline-variant hover:border-outline shadow-sm'
                }`}
                onClick={() => !notif.is_read && markAsRead(notif.id)}
              >
                {!notif.is_read && (
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                )}
                
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0 pr-8">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h4 className={`text-lg font-black truncate tracking-tight ${!notif.is_read ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                        {notif.title}
                      </h4>
                      {!notif.is_read && (
                        <span className="shrink-0 w-2 h-2 rounded-full bg-primary"></span>
                      )}
                    </div>
                    <p className={`text-base leading-relaxed ${!notif.is_read ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`}>
                      {notif.body}
                    </p>
                    <p className="text-xs font-bold text-on-surface-variant/60 mt-3 flex justify-between items-center">
                      <span>{new Date(notif.created_at).toLocaleDateString()} a las {new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </p>
                  </div>
                  
                  <div className="shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      className="p-2 sm:p-3 text-on-surface-variant/50 hover:text-error hover:bg-error/10 rounded-full transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      title="Eliminar notificación"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
