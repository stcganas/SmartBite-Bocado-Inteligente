import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'direct' | 'broadcast' | 'system' | 'order_status' | 'loyalty_points' | 'wheel_prize' | 'loyalty_redemption' | 'wheel_prize_delivered';
  is_read: boolean;
  created_at: string;
  metadata?: any;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const fetchNotifications = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('app_notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (error) {
          if (error.code === '42P01') {
            console.warn('[NotificationContext] app_notifications table missing. Please run the SQL setup script.');
          } else {
            console.warn('[NotificationContext] Error fetching notifications:', error);
          }
          return;
        }

        if (data) {
          setNotifications(data);
        }
      } catch (err) {
        console.error('[NotificationContext] Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    // Initial load
    fetchNotifications();

    // Setup polling removed as it was redundant
    // const interval = setInterval(() => fetchNotifications(), 10000);

    const channel = supabase
      .channel(`user_notifications_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'app_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('[NotificationContext] Realtime INSERT received:', payload);
          const newNotif = payload.new as AppNotification;
          
          // Trigger toast side-effect cleanly outside of the nested state modifier callback
          toast.success(newNotif.title || "Notificación de SmartBite", {
            description: newNotif.body,
            icon: '🔔',
          });

          setNotifications(prev => {
            // Avoid duplicates
            if (prev.some(p => p.id === newNotif.id)) return prev;
            return [newNotif, ...prev];
          });
        }
      )
      .subscribe((status) => {
        console.log('[NotificationContext] Subscription status for', user.id, ':', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('app_notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('app_notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase
      .from('app_notifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting notification:', error);
      toast.error('No se pudo eliminar la notificación');
      return;
    }
    
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success('Notificación eliminada');
  };

  const deleteAllNotifications = async () => {
    if (!user) return;
    
    try {
      const { error, count } = await supabase
        .from('app_notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting all notifications:', error);
        toast.error('No se pudieron eliminar las notificaciones: ' + error.message);
        return;
      }
      
      setNotifications([]);
      toast.success('Bandeja de notificaciones vacía');
    } catch (err) {
      console.error('Unexpected error during delete:', err);
      toast.error('Ocurrió un error inesperado al borrar');
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount: notifications.filter(n => !n.is_read).length,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      deleteAllNotifications,
      loading
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
