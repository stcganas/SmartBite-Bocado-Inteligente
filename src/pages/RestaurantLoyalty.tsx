import React, { useState, useEffect } from 'react';
import { 
  Trophy, Gift, Plus, Trash2, Edit2, ChevronRight, 
  Settings, Users, Star, DollarSign, Save, AlertCircle,
  Loader2, CheckCircle2, Ticket, ShoppingBag, UtensilsCrossed, Dices, Clock,
  Percent, TrendingUp, Share2, Wallet, RefreshCcw, Smartphone,
  Search, Ban, ShieldAlert, BadgeCheck, History
} from 'lucide-react';
import { db, LoyaltyReward, LoyaltyRedemption, Restaurant, WheelConfig, WheelPrize, WheelSegment, WithdrawalRequest } from '../store/db';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { formatCurrency } from '../utils/format';
import { referralService } from '../services/referralService';
import { supabase } from '../lib/supabase';
import { RestaurantReferralCharts } from '../components/RestaurantReferralCharts';

export const RestaurantLoyalty: React.FC<{ restaurant: Restaurant; onUpdate?: () => void }> = ({ restaurant, onUpdate }) => {
  if (!restaurant?.id) {
    return (
      <div className="p-8 text-center glass-card text-on-surface rounded-3xl border border-outline shadow-sm">
        <p className="text-on-surface-muted font-medium">No se pudo cargar la información del restaurante.</p>
      </div>
    );
  }

  const { user } = useAuth();
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [redemptions, setRedemptions] = useState<LoyaltyRedemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(restaurant.loyaltyEnabled || false);
  const [gamificationEnabled, setGamificationEnabled] = useState(restaurant.gamificationEnabled || false);
  const [pointsPerDollar, setPointsPerDollar] = useState(restaurant.loyaltyPointsPerDollar || 1);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [editingReward, setEditingReward] = useState<any>(null);

  // Gamification state
  const [activeTab, setActiveTab] = useState<'loyalty' | 'wheel' | 'levels' | 'tasks' | 'referrals'>('loyalty');
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [referralSettings, setReferralSettings] = useState({
    enabled: restaurant?.referralEnabled || false,
    commissionType: restaurant?.referralCommissionType || 'percentage',
    commissionValue: restaurant?.referralCommissionValue || 5
  });

  useEffect(() => {
    setReferralSettings({
      enabled: restaurant?.referralEnabled || false,
      commissionType: restaurant?.referralCommissionType || 'percentage',
      commissionValue: restaurant?.referralCommissionValue || 5
    });
    setLoyaltyEnabled(restaurant.loyaltyEnabled || false);
    setGamificationEnabled(restaurant.gamificationEnabled || false);
    setPointsPerDollar(restaurant.loyaltyPointsPerDollar || 1);
}, [restaurant.id, restaurant.referralEnabled, restaurant.referralCommissionType, restaurant.referralCommissionValue, restaurant.loyaltyEnabled, restaurant.loyaltyPointsPerDollar, restaurant.gamificationEnabled]);

  useEffect(() => {
    if (restaurant?.id) {
      fetchWithdrawals();
      fetchReferralStats();
    }
  }, [restaurant?.id]);

  const [referralStats, setReferralStats] = useState<{
    enrolledStats: any[];
    unsubscribedStats: any[];
    salesList: any[];
    totals: { totalSales: number; totalCommissions: number };
  } | null>(null);
  const [loadingReferralStats, setLoadingReferralStats] = useState(true);
  const [referralSearch, setReferralSearch] = useState('');
  const [activeReferralSubTab, setActiveReferralSubTab] = useState<'graficos' | 'inscritos' | 'ventas' | 'bajas'>('graficos');
  const [selectedUserReferrals, setSelectedUserReferrals] = useState<any[] | null>(null);
  const [selectedUserObject, setSelectedUserObject] = useState<any | null>(null);

  const fetchReferralStats = async () => {
    if (!restaurant?.id) return;
    setLoadingReferralStats(true);
    try {
      const stats = await referralService.getRestaurantReferralStats(restaurant.id);
      setReferralStats(stats);
    } catch (err) {
      console.error("Error loading referral stats:", err);
    } finally {
      setLoadingReferralStats(false);
    }
  };

  const handleUnregisterUser = async (userId: string) => {
    if (!confirm("¿Estás seguro de que deseas dar de baja a este embajador del programa de referidos? El usuario ya no acumulará ganancias por pedidos de sus recomendados.")) return;
    try {
      const success = await referralService.unregisterUser(userId, restaurant.id);
      if (success) {
        toast.success("Usuario dado de baja exitosamente");
        fetchReferralStats();
      } else {
        toast.error("No se pudo dar de baja al usuario");
      }
    } catch (err) {
      console.error(err);
      toast.error("Ocurrió un error");
    }
  };

  const handleReRegisterUser = async (userId: string) => {
    try {
      const success = await referralService.reRegisterUser(userId, restaurant.id);
      if (success) {
        toast.success("Usuario reactivado existosamente");
        fetchReferralStats();
      } else {
        toast.error("No se pudo reactivar al usuario");
      }
    } catch (err) {
      console.error(err);
      toast.error("Ocurrió un error");
    }
  };

  const handleViewReferrals = async (userStats: any) => {
    setSelectedUserObject(userStats.user);
    try {
      const referrals = await referralService.getReferralHistory(userStats.user.id, restaurant.id);
      setSelectedUserReferrals(referrals);
    } catch (err) {
      console.error(err);
      toast.error("No se pudo cargar la lista de referencias");
    }
  };

  const fetchWithdrawals = async () => {
    if (!restaurant?.id) return;
    const data = await referralService.getRestaurantWithdrawals(restaurant.id);
    setWithdrawals(data);
  };

  const [isUpdatingReferralStatus, setIsUpdatingReferralStatus] = useState(false);
  const handleToggleReferral = async (newValue: boolean) => {
    if (isUpdatingReferralStatus) return;
    setIsUpdatingReferralStatus(true);
    
    // Optimistic update
    setReferralSettings(prev => ({...prev, enabled: newValue}));
    
    try {
      const { error } = await db.updateRestaurant(restaurant.id, {
        referralEnabled: newValue
      });
      
      if (error) {
        toast.error("No se pudo actualizar el estado: " + error.message);
        // Revert on error
        setReferralSettings(prev => ({...prev, enabled: !newValue}));
      } else {
        toast.success(newValue ? "Programa de referidos activado" : "Programa desactivado");
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      toast.error("Error al actualizar estado");
      setReferralSettings(prev => ({...prev, enabled: !newValue}));
    } finally {
      setIsUpdatingReferralStatus(false);
    }
  };

  const handleUpdateSettings = async () => {
    if (!restaurant?.id || isUpdatingReferralStatus) return;
    setIsUpdatingReferralStatus(true);
    try {
      const { error } = await db.updateRestaurant(restaurant.id, {
        referralEnabled: referralSettings.enabled,
        referralCommissionType: referralSettings.commissionType as any,
        referralCommissionValue: referralSettings.commissionValue
      });
      if (error) throw error;
      toast.success("Ajustes de referidos actualizados");
      if (onUpdate) onUpdate();
    } catch (error: any) {
      toast.error("Error al actualizar ajustes: " + error.message);
    } finally {
      setIsUpdatingReferralStatus(false);
    }
  };

  const handleProcessWithdrawal = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      // Get request details first
      const { data: request } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (!request) throw new Error("Solicitud no encontrada");

      const { error } = await supabase
        .from('withdrawal_requests')
        .update({ status, processed_at: new Date().toISOString() })
        .eq('id', requestId);
      
      if (error) throw error;

      // Notify the user
      try {
        await db.saveNotification({
          userId: request.user_id,
          title: status === 'approved' ? '¡Retiro Aprobado Exitosamente! ✅💸' : 'Atención: Retiro Rechazado ❌🛑',
          body: status === 'approved' 
            ? `¡Excelentes noticias! Tu solicitud de retiro de ${formatCurrency(request.amount)} ha sido procesada con éxito. El dinero va en camino a tu cuenta. ¡Sigue así! 🚀`
            : `Lamentablemente tu solicitud de retiro de ${formatCurrency(request.amount)} ha sido rechazada. Tu saldo ha sido devuelto a tu cuenta de forma segura. Contáctanos si tienes consultas. 🤝`,
          type: "withdrawal_update",
          metadata: { requestId, status }
        });

        // If rejected, refund balance
        if (status === 'rejected') {
          const userProfile = await db.getAppUser(request.user_id);
          if (userProfile) {
            await db.updateAppUser(request.user_id, {
              referralBalance: (userProfile.referralBalance || 0) + request.amount
            });
          }
        }
      } catch (notifErr) {
        console.error('Error in post-processing withdrawal:', notifErr);
      }

      toast.success(`Solicitud ${status === 'approved' ? 'aprobada' : 'rechazada'}`);
      fetchWithdrawals();
    } catch (error) {
      toast.error("Error al procesar solicitud");
    }
  };
  
  const [levels, setLevels] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [rewardLevels, setRewardLevels] = useState<Record<string, string>>({});

  const [showLevelModal, setShowLevelModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState<any>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  const [wheelConfig, setWheelConfig] = useState<WheelConfig | null>(null);
  const [wheelPrizes, setWheelPrizes] = useState<WheelPrize[]>([]);
  const [isEditingWheel, setIsEditingWheel] = useState(false);

  useEffect(() => {
    fetchLoyaltyData();
  }, [restaurant.id]);

  const fetchLoyaltyData = async () => {
    setLoading(true);
    try {
      const [rewardsData, redemptionsData, configData, prizesData, levelsData, tasksData, reqData] = await Promise.all([
        db.getLoyaltyRewards(restaurant.id),
        db.getRestaurantRedemptions(restaurant.id),
        db.getWheelConfig(restaurant.id),
        db.getRestaurantWheelPrizes(restaurant.id),
        db.getGamificationLevels(restaurant.id),
        db.getGamificationTasks(restaurant.id),
        db.getRewardLevelRequirements(restaurant.id)
      ]);
      
      setRewards(Array.isArray(rewardsData) ? rewardsData : []);
      setRedemptions(Array.isArray(redemptionsData) ? redemptionsData : []);
      setLevels(Array.isArray(levelsData) ? levelsData : []);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setRewardLevels(reqData || {});
      
      const defaultConfig = {
        restaurantId: restaurant.id,
        isActive: false,
        segments: [
          { text: '10% Dcto', color: '#FF6B6B', value: '10_percent' },
          { text: 'Postre Gratis', color: '#4ECDC4', value: 'free_dessert' },
          { text: '¡Sigue intentando!', color: '#45B7D1', value: 'nothing' },
          { text: 'Envío Gratis', color: '#FFA07A', value: 'free_delivery' },
          { text: 'Bebida Gratis', color: '#BB8FCE', value: 'free_drink' },
          { text: '¡Sigue intentando!', color: '#F7DC6F', value: 'nothing' },
        ]
      };
      
      setWheelConfig((configData && configData.segments) ? configData : (defaultConfig as any));
      setWheelPrizes(Array.isArray(prizesData) ? prizesData : []);

    } catch (error) {
      console.error('Error fetching loyalty data:', error);
      toast.error('Error al cargar datos del programa de monedas de oro');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await db.updateRestaurant(restaurant.id, {
        loyaltyEnabled,
        loyaltyPointsPerDollar: pointsPerDollar
      } as any);
      toast.success('Configuración guardada correctamente');
      setIsEditingSettings(false);
    } catch (error) {
      toast.error('Error al guardar configuración');
    }
  };

  const handleSaveReward = async () => {
    if (!editingReward?.title || !editingReward?.pointsCost) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    try {
      const savedReward = await db.saveLoyaltyReward({
        ...editingReward,
        restaurantId: restaurant.id
      } as LoyaltyReward);
      
      if (editingReward.requiredLevelId) {
        await db.saveRewardLevelRequirement(restaurant.id, savedReward.id, editingReward.requiredLevelId);
      } else if (editingReward.id) {
        // If editing and cleared, remove it
        await db.saveRewardLevelRequirement(restaurant.id, savedReward.id, "");
      }

      toast.success(editingReward.id ? 'Premio actualizado' : 'Premio creado');
      setShowRewardModal(false);
      setEditingReward(null);
      fetchLoyaltyData();
    } catch (error: any) {
      console.error('Error al guardar el premio:', error);
      toast.error(`Error al guardar: ${error?.message || 'Revisa permisos'}`);
    }
  };

  const handleDeleteReward = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este premio?')) return;
    try {
      await db.deleteLoyaltyReward(id);
      toast.success('Premio eliminado');
      fetchLoyaltyData();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const handleUpdateRedemptionStatus = async (id: string, status: 'completed' | 'cancelled') => {
    try {
      await db.updateRedemptionStatus(id, status);
      toast.success('Estado actualizado');
      fetchLoyaltyData();
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const handleSaveWheelSettings = async () => {
    if (!wheelConfig) return;
    try {
      await db.saveWheelConfig(wheelConfig);
      toast.success('Configuración de ruleta guardada');
      setIsEditingWheel(false);
      fetchLoyaltyData();
    } catch (error) {
      toast.error('Error al guardar configuración de ruleta');
    }
  };

  const handleSaveLevel = async () => {
    if (!editingLevel?.name || editingLevel?.pointsRequired === undefined) return toast.error("Completa nombre y monedas de oro requeridos");
    await db.saveGamificationLevel({ ...editingLevel, restaurantId: restaurant.id });
    toast.success("Nivel guardado");
    setShowLevelModal(false);
    fetchLoyaltyData();
  };

  const handleDeleteLevel = async (id: string) => {
    if(!confirm("¿Eliminar nivel?")) return;
    await db.deleteGamificationLevel(restaurant.id, id);
    toast.success("Nivel eliminado");
    fetchLoyaltyData();
  };

  const handleSaveTask = async () => {
    if (!editingTask?.name || !editingTask?.pointsReward) return toast.error("Completa nombre y recompensa");
    await db.saveGamificationTask({ ...editingTask, restaurantId: restaurant.id });
    toast.success("Tarea guardada");
    setShowTaskModal(false);
    fetchLoyaltyData();
  };

  const handleDeleteTask = async (id: string) => {
    if(!confirm("¿Eliminar tarea?")) return;
    await db.deleteGamificationTask(restaurant.id, id);
    toast.success("Tarea eliminada");
    fetchLoyaltyData();
  };

  const handleUpdatePrizeStatus = async (id: string, status: 'delivered' | 'pending') => {
    try {
      await db.updateWheelPrizeStatus(id, status);
      toast.success('Premio actualizado');
      fetchLoyaltyData();
    } catch (error) {
      toast.error('Error al actualizar premio');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-4" />
        <p className="text-on-surface-muted font-medium">Cargando programa de monedas de oro...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Gamification Navigation Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-card text-on-surface/95 backdrop-blur-md rounded-[2.5rem] p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline sticky top-4 z-40"
      >
        <div className="relative group/tabs">
          <div className="flex overflow-x-auto gap-2 no-scrollbar snap-x overflow-y-hidden px-1 scroll-smooth">
            {[
              { id: 'loyalty' as const, label: 'Programa de Monedas', icon: Trophy },
              { id: 'wheel' as const, label: 'Ruleta', icon: Dices },
              { id: 'levels' as const, label: 'Niveles', icon: Star },
              { id: 'tasks' as const, label: 'Tareas', icon: CheckCircle2 },
              { id: 'referrals' as const, label: 'Referidos', icon: Users }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 snap-start flex items-center gap-3 px-6 py-3.5 rounded-[1.8rem] transition-all duration-300 whitespace-nowrap font-black text-[11px] uppercase tracking-widest border ${
                    isActive 
                    ? 'bg-zinc-950 text-orange-500 shadow-xl shadow-orange-500/10 border-zinc-800' 
                    : 'text-on-surface-muted bg-surface-base/60 border-outline/90 shadow-[0_2px_6px_rgba(0,0,0,0.02)] hover:bg-surface-base hover:text-on-surface-variant hover:border-neutral-300/80'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${isActive ? 'text-orange-500' : 'text-on-surface-muted'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
          {/* Subtle overflow indicators */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white/95 to-transparent pointer-events-none rounded-l-3xl opacity-0 group-hover/tabs:opacity-100 transition-opacity" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/95 to-transparent pointer-events-none rounded-r-3xl opacity-0 group-hover/tabs:opacity-100 transition-opacity" />
        </div>
      </motion.div>

      {activeTab === 'referrals' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Settings Section */}
          <div className="glass-card p-8 rounded-[2.5rem] border border-outline shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                  <Settings className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-on-surface tracking-tight">Configuración de Referidos</h3>
                  <p className="text-on-surface-muted font-medium text-sm">Gestiona cómo funciona tu sistema de viralización</p>
                </div>
              </div>
              <button 
                onClick={handleUpdateSettings}
                className="bg-zinc-900 text-on-surface px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-zinc-800 transition-all active:scale-95"
              >
                Guardar Cambios
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="p-6 bg-surface-base rounded-[2rem] border border-outline space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-black text-sm uppercase tracking-widest text-on-surface">Estado del Programa</p>
                      <p className="text-xs text-on-surface-muted font-medium">Habilitar programa de referidos para clientes</p>
                    </div>
                    <label className={`relative inline-flex items-center ${isUpdatingReferralStatus ? 'cursor-wait opacity-50' : 'cursor-pointer'}`}>
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={referralSettings.enabled}
                        disabled={isUpdatingReferralStatus}
                        onChange={(e) => handleToggleReferral(e.target.checked)}
                      />
                      <div className="w-14 h-7 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:glass-card text-on-surface after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-600 font-black"></div>
                    </label>
                  </div>
                </div>

                <div className="p-6 bg-surface-base rounded-[2rem] border border-outline space-y-6">
                  <div>
                    <p className="font-black text-sm uppercase tracking-widest text-on-surface mb-4">Modelo de Comisión</p>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setReferralSettings({...referralSettings, commissionType: 'percentage'})}
                        className={`p-4 rounded-2xl border-2 transition-all text-left ${
                          referralSettings.commissionType === 'percentage' 
                          ? 'border-zinc-900 glass-card text-on-surface shadow-md' 
                          : 'border-transparent hover:border-outline'
                        }`}
                      >
                        <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                          <Percent className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="font-black text-xs uppercase tracking-widest">Porcentaje</p>
                        <p className="text-[10px] text-on-surface-muted font-bold mt-1">Por cada compra</p>
                      </button>
                      <button 
                        onClick={() => setReferralSettings({...referralSettings, commissionType: 'fixed'})}
                        className={`p-4 rounded-2xl border-2 transition-all text-left ${
                          referralSettings.commissionType === 'fixed' 
                          ? 'border-zinc-900 glass-card text-on-surface shadow-md' 
                          : 'border-transparent hover:border-outline'
                        }`}
                      >
                        <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                        </div>
                        <p className="font-black text-xs uppercase tracking-widest">Fijo</p>
                        <p className="text-[10px] text-on-surface-muted font-bold mt-1">Valor exacto</p>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-muted px-1">
                      Valor de la Comisión {referralSettings.commissionType === 'percentage' ? '(%)' : '($)'}
                    </label>
                    <input 
                      type="number"
                      value={referralSettings.commissionValue}
                      onChange={(e) => setReferralSettings({...referralSettings, commissionValue: parseFloat(e.target.value)})}
                      className="w-full glass-card text-on-surface border-2 border-outline rounded-xl py-3 px-4 font-black text-lg focus:outline-none focus:border-zinc-900 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 bg-zinc-900 rounded-[2.5rem] text-zinc-400 space-y-6 flex flex-col justify-center border-4 border-zinc-800">
                <div className="w-12 h-12 glass-card text-on-surface/10 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-on-surface tracking-tight mb-2">Simulación de Programa</h4>
                  <p className="text-sm font-bold leading-relaxed">
                    Si un cliente referido hace una compra de <span className="text-on-surface">$100,000</span>, 
                    el referente recibirá <span className="text-orange-500 font-black">
                      {referralSettings.commissionType === 'percentage' 
                        ? formatCurrency(100000 * (referralSettings.commissionValue / 100))
                        : formatCurrency(referralSettings.commissionValue)}
                    </span> en su saldo disponible.
                  </p>
                </div>
                <div className="pt-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center animate-pulse">
                    <Share2 className="w-5 h-5 text-orange-500" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Recuerda incentivar el uso del sistema</p>
                </div>
              </div>
            </div>
          </div>

          {/* Withdrawal Requests Section */}
          <div className="glass-card text-on-surface rounded-[2.5rem] border border-outline shadow-sm overflow-hidden">
            <div className="p-8 border-b border-neutral-50 flex justify-between items-center bg-zinc-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 glass-card rounded-2xl shadow-sm flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-on-surface-muted" />
                </div>
                <div>
                  <h4 className="font-black text-xl tracking-tight">Solicitudes de Retiro</h4>
                  <p className="text-xs text-on-surface-muted font-medium">Pagos pendientes a Nequi de tus embajadores</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={fetchWithdrawals}
                  className="p-3 glass-card text-on-surface border border-outline text-on-surface-muted rounded-xl hover:text-zinc-900 transition-colors"
                >
                  <RefreshCcw className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {withdrawals.length === 0 ? (
                <div className="py-20 text-center px-6">
                  <div className="w-16 h-16 bg-surface-base rounded-full flex items-center justify-center mx-auto mb-6">
                    <Smartphone className="w-8 h-8 text-neutral-200" />
                  </div>
                  <h5 className="font-black text-on-surface mb-2">No hay solicitudes pendientes</h5>
                  <p className="text-on-surface-muted text-sm max-w-[240px] mx-auto font-medium">Cuando los usuarios soliciten retiro a Nequi, aparecerán aquí.</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-base border-b border-outline italic">
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-muted">Usuario / Nequi</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-muted">Monto</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-muted">Fecha</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-muted">Estatus</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-muted text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {withdrawals.map((req) => (
                      <tr key={req.id} className="hover:bg-surface-base/50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center font-black text-purple-600">
                              <Smartphone className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-black text-sm text-on-surface">{req.nequiNumber}</p>
                              <p className="text-[10px] text-on-surface-muted font-bold uppercase tracking-widest italic leading-none">Vía Nequi</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-lg font-black text-emerald-600">{formatCurrency(req.amount)}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm font-bold text-on-surface-muted">{new Date(req.createdAt).toLocaleDateString()}</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            req.status === 'pending' ? 'bg-orange-100 text-orange-600' : 
                            req.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {req.status === 'pending' ? 'Pendiente' : req.status === 'approved' ? 'Pagado' : 'Rechazado'}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          {req.status === 'pending' && (
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleProcessWithdrawal(req.id, 'approved')}
                                className="px-6 py-2.5 bg-emerald-600 text-on-surface rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20"
                              >
                                Aprobar Pago
                              </button>
                              <button 
                                onClick={() => handleProcessWithdrawal(req.id, 'rejected')}
                                className="px-6 py-2.5 bg-surface-variant text-on-surface-muted rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-surface-variant transition-all"
                              >
                                Rechazar
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Ambassador & Referrals Program Operations Area */}
          <div className="glass-card text-on-surface rounded-[2.5rem] border border-outline shadow-sm overflow-hidden p-8 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h4 className="font-black text-xl tracking-tight text-on-surface">Control de Embajadores y Referidos</h4>
                <p className="text-xs text-on-surface-muted font-medium">Monitorea los inscritos, ventas generadas, comisiones y bajas</p>
              </div>
              <button 
                onClick={fetchReferralStats}
                type="button"
                className="p-3 bg-surface-base text-on-surface-muted rounded-xl hover:text-zinc-900 transition-colors flex items-center gap-2 text-xs font-black uppercase tracking-wider"
              >
                <RefreshCcw className="w-4 h-4" />
                Actualizar Datos
              </button>
            </div>

            {/* Quick Metrics of the Referral Program */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/50">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Inscritos Activos</span>
                <h5 className="text-3xl font-black text-indigo-950 mt-1 leading-none">{referralStats?.enrolledStats.length || 0}</h5>
              </div>
              <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100/50">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Ventas Registradas</span>
                <h5 className="text-3xl font-black text-emerald-950 mt-1 leading-none">
                  {formatCurrency(referralStats?.totals.totalSales || 0)}
                </h5>
              </div>
              <div className="p-6 bg-orange-50/50 rounded-3xl border border-orange-100/50">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">Comisiones Pagadas</span>
                <h5 className="text-3xl font-black text-orange-950 mt-1 leading-none">
                  {formatCurrency(referralStats?.totals.totalCommissions || 0)}
                </h5>
              </div>
              <div className="p-6 bg-rose-50/50 rounded-3xl border border-rose-100/50">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">Dados de Baja</span>
                <h5 className="text-3xl font-black text-rose-950 mt-1 leading-none">{referralStats?.unsubscribedStats.length || 0}</h5>
              </div>
            </div>

            {/* Sub-tabs and Search Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center pt-2 border-t border-outline">
              <div className="flex gap-1.5 bg-surface-variant p-1.5 rounded-2xl w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveReferralSubTab('graficos')}
                  className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all leading-none ${
                    activeReferralSubTab === 'graficos'
                      ? "glass-card text-on-surface shadow-sm"
                      : "text-on-surface-muted hover:text-on-surface"
                  }`}
                >
                  Gráficos
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReferralSubTab('inscritos')}
                  className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all leading-none ${
                    activeReferralSubTab === 'inscritos'
                      ? "glass-card text-on-surface text-on-surface shadow-sm"
                      : "text-on-surface-muted hover:text-on-surface"
                  }`}
                >
                  Inscritos ({referralStats?.enrolledStats.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReferralSubTab('ventas')}
                  className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all leading-none ${
                    activeReferralSubTab === 'ventas'
                      ? "glass-card text-on-surface text-on-surface shadow-sm"
                      : "text-on-surface-muted hover:text-on-surface"
                  }`}
                >
                  Ventas ({referralStats?.salesList.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReferralSubTab('bajas')}
                  className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all leading-none ${
                    activeReferralSubTab === 'bajas'
                      ? "glass-card text-on-surface text-on-surface shadow-sm"
                      : "text-on-surface-muted hover:text-on-surface"
                  }`}
                >
                  Dados de Baja ({referralStats?.unsubscribedStats.length || 0})
                </button>
              </div>

              {/* Search user component */}
              <div className="relative flex-1 max-w-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-on-surface-muted" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar embajador por nombre o email..."
                  value={referralSearch}
                  onChange={(e) => setReferralSearch(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-surface-base border-0 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-orange-500 tracking-wide text-on-surface"
                />
              </div>
            </div>

            {/* Dynamic tables based on tab */}
            {loadingReferralStats ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-on-surface-muted animate-spin mb-4" />
                <p className="text-xs text-on-surface-muted font-bold uppercase tracking-widest">Cargando reporte de referidos...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {activeReferralSubTab === 'graficos' && (
                  <RestaurantReferralCharts salesList={referralStats?.salesList || []} />
                )}

                {/* 1. ACTIVE EMBASSY SUBSCRIBERS */}
                {activeReferralSubTab === 'inscritos' && (
                  <div>
                    {(() => {
                      const filteredList = (referralStats?.enrolledStats || []).filter(item => {
                        const q = referralSearch.toLowerCase();
                        return (
                          item.user.id.toLowerCase().includes(q) ||
                          (item.user.displayName || '').toLowerCase().includes(q) ||
                          item.user.email.toLowerCase().includes(q) ||
                          (item.user.referralCode || '').toLowerCase().includes(q)
                        );
                      });

                      if (filteredList.length === 0) {
                        return (
                          <div className="py-16 text-center text-on-surface-muted">
                            <Users className="w-12 h-12 text-on-surface-variant mx-auto mb-4" />
                            <p className="font-bold text-on-surface text-sm">No se encontraron embajadores</p>
                            <p className="text-xs font-semibold text-on-surface-muted mt-2">Prueba modificando la búsqueda o asegúrate de que tengan el programa activo.</p>
                          </div>
                        );
                      }

                      return (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-surface-base border-b border-outline text-[10px] font-black uppercase tracking-widest text-on-surface-muted">
                              <th className="px-6 py-4">Usuario</th>
                              <th className="px-6 py-4">Código Referido</th>
                              <th className="px-6 py-4 text-center">Referidos Directos</th>
                              <th className="px-6 py-4 text-right">Ventas Generadas</th>
                              <th className="px-6 py-4 text-right">Ganancia Referidos</th>
                              <th className="px-6 py-4 text-right">Saldo Actual</th>
                              <th className="px-6 py-4 text-center">Estado</th>
                              <th className="px-6 py-4 text-right">Operaciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-50">
                            {filteredList.map((item) => (
                              <tr key={item.user.id} className="hover:bg-surface-base/50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-surface-variant flex items-center justify-center font-black text-on-surface-muted border border-outline text-sm overflow-hidden flex-shrink-0">
                                      {item.user.avatarUrl ? (
                                        <img src={item.user.avatarUrl} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                                      ) : (
                                        item.user.displayName?.charAt(0).toUpperCase() || 'U'
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-black text-xs text-on-surface">{item.user.displayName || 'Sin Nombre'}</p>
                                      <p className="text-[10px] text-on-surface-muted font-bold">{item.user.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="font-mono text-xs font-black bg-surface-variant px-2 py-1 rounded text-on-surface-variant">
                                    {item.user.referralCode || 'N/A'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center font-bold text-on-surface-variant text-xs">
                                  {item.referralsCount}
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-on-surface text-xs">
                                  {formatCurrency(item.totalSalesGenerated)}
                                </td>
                                <td className="px-6 py-4 text-right font-black text-emerald-600 text-xs text-nowrap">
                                  {formatCurrency(item.totalCommissionsEarned)}
                                </td>
                                <td className="px-6 py-4 text-right font-black text-purple-600 text-xs text-nowrap">
                                  {formatCurrency(item.user.referralBalance || 0)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className={`inline-block px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                    item.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
                                  }`}>
                                    {item.status === 'active' ? 'Activo' : 'Suspendido'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => handleViewReferrals(item)}
                                      type="button"
                                      className="px-3 py-1.5 bg-surface-variant text-on-surface-muted hover:bg-surface-variant transition-all text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1"
                                    >
                                      <History className="w-3 h-3" /> Ver Referidos
                                    </button>
                                    <button
                                      onClick={() => handleUnregisterUser(item.user.id)}
                                      type="button"
                                      className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 transition-all text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1"
                                    >
                                      <Ban className="w-3 h-3" /> Dar de baja
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                )}

                {/* 2. SALES GENERATED DETAILED HISTORIC LOG */}
                {activeReferralSubTab === 'ventas' && (
                  <div>
                    {(() => {
                      const filteredList = (referralStats?.salesList || []).filter(item => {
                        const q = referralSearch.toLowerCase();
                        return (
                          item.orderId?.toLowerCase().includes(q) ||
                          item.customerName?.toLowerCase().includes(q) ||
                          item.referrerName?.toLowerCase().includes(q) ||
                          item.referrerEmail?.toLowerCase().includes(q)
                        );
                      });

                      if (filteredList.length === 0) {
                        return (
                          <div className="py-16 text-center text-on-surface-muted">
                            <ShoppingBag className="w-12 h-12 text-on-surface-variant mx-auto mb-4" />
                            <p className="font-bold text-on-surface text-sm">No hay compras vinculadas registradas</p>
                            <p className="text-xs font-semibold text-on-surface-muted mt-2">Cuando un cliente referido por un embajador complete un pedido, se reflejará aquí.</p>
                          </div>
                        );
                      }

                      return (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-surface-base border-b border-outline text-[10px] font-black uppercase tracking-widest text-on-surface-muted">
                              <th className="px-6 py-4">ID Pedido / Fecha</th>
                              <th className="px-6 py-4">Cliente Referido</th>
                              <th className="px-6 py-4 text-right">Total Compra de Referido</th>
                              <th className="px-6 py-4">Sponsor/Embajador Referente</th>
                              <th className="px-6 py-4 text-right">Comisión Generada</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-50">
                            {filteredList.map((item) => (
                              <tr key={item.id} className="hover:bg-surface-base/50 transition-colors">
                                <td className="px-6 py-4">
                                  <p className="font-mono text-xs font-black text-on-surface">#{item.id.slice(0, 8)}</p>
                                  <p className="text-[10px] text-on-surface-muted font-bold">{new Date(item.createdAt).toLocaleString()}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="font-bold text-xs text-on-surface">{item.customerName}</p>
                                </td>
                                <td className="px-6 py-4 text-right font-black text-on-surface text-xs">
                                  {formatCurrency(item.total)}
                                </td>
                                <td className="px-6 py-4">
                                  <p className="font-bold text-xs text-on-surface">{item.referrerName}</p>
                                  <p className="text-[10px] text-on-surface-muted font-medium">{item.referrerEmail}</p>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full font-black text-[11px]">
                                    + {formatCurrency(item.commission)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                )}

                {/* 3. DADOS DE BAJA SECTION */}
                {activeReferralSubTab === 'bajas' && (
                  <div>
                    {(() => {
                      const filteredList = (referralStats?.unsubscribedStats || []).filter(item => {
                        const q = referralSearch.toLowerCase();
                        return (
                          item.user.id.toLowerCase().includes(q) ||
                          (item.user.displayName || '').toLowerCase().includes(q) ||
                          item.user.email.toLowerCase().includes(q)
                        );
                      });

                      if (filteredList.length === 0) {
                        return (
                          <div className="py-16 text-center text-on-surface-muted">
                            <ShieldAlert className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
                            <p className="font-bold text-on-surface text-xs uppercase tracking-wider">Sin bajas registradas</p>
                            <p className="text-[11px] font-semibold text-on-surface-muted mt-1">Todos tus embajadores inscritos permanecen en la clasificación activa.</p>
                          </div>
                        );
                      }

                      return (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-surface-base border-b border-outline text-[10px] font-black uppercase tracking-widest text-on-surface-muted">
                              <th className="px-6 py-4">Usuario</th>
                              <th className="px-6 py-4">Código Anterior</th>
                              <th className="px-6 py-4 text-center">Referidos Totales</th>
                              <th className="px-6 py-4 text-right">Total Ventas Históricas</th>
                              <th className="px-6 py-4 text-right">Ganancias Totales Acumuladas</th>
                              <th className="px-6 py-4 text-center">Estado</th>
                              <th className="px-6 py-4 text-right">Operación</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-50">
                            {filteredList.map((item) => (
                              <tr key={item.user.id} className="hover:bg-surface-base/50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-surface-variant flex items-center justify-center font-black text-on-surface-muted border border-outline text-sm overflow-hidden flex-shrink-0 flex-shrink-0">
                                      {item.user.avatarUrl ? (
                                        <img src={item.user.avatarUrl} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                                      ) : (
                                        item.user.displayName?.charAt(0).toUpperCase() || 'U'
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-black text-xs text-on-surface-muted line-through">{item.user.displayName || 'Sin Nombre'}</p>
                                      <p className="text-[10px] text-on-surface-muted font-bold">{item.user.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="font-mono text-xs font-bold text-on-surface-muted">
                                    {item.user.referralCode || 'N/A'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center font-bold text-on-surface-muted text-xs">
                                  {item.referralsCount}
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-on-surface-muted text-xs text-nowrap">
                                  {formatCurrency(item.totalSalesGenerated)}
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-on-surface-muted text-xs text-nowrap">
                                  {formatCurrency(item.totalCommissionsEarned)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-600 border border-red-200">
                                    Dado de Baja
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button
                                    onClick={() => handleReRegisterUser(item.user.id)}
                                    type="button"
                                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-on-surface transition-all text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1"
                                  >
                                    <BadgeCheck className="w-3 h-3" /> Reactivar Embajador
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* References list Modal */}
            <AnimatePresence>
              {selectedUserReferrals !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="glass-card text-on-surface rounded-[2.5rem] w-full max-w-lg p-8 overflow-hidden shadow-2xl relative max-h-[80vh] flex flex-col"
                  >
                    <div className="flex justify-between items-center pb-4 border-b border-outline mb-6 flex-shrink-0">
                      <div>
                        <h4 className="font-black text-lg text-neutral-950">Lista de Referencias</h4>
                        <p className="text-[11px] font-bold text-on-surface-muted uppercase tracking-widest mt-1">Recomendados por {selectedUserObject?.displayName || 'Embajador'}</p>
                      </div>
                      <button 
                        onClick={() => setSelectedUserReferrals(null)}
                        type="button"
                        className="p-2 text-on-surface-muted hover:text-on-surface bg-surface-base rounded-full"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="overflow-y-auto flex-1 space-y-4 pr-1">
                      {selectedUserReferrals.length === 0 ? (
                        <div className="py-12 text-center text-on-surface-muted">
                          <Users className="w-12 h-12 text-on-surface-variant mx-auto mb-4" />
                          <p className="font-bold text-on-surface text-sm">Este embajador aún no tiene registros</p>
                          <p className="text-xs font-semibold text-on-surface-muted mt-2">Sus contactos aún no se han registrado en tu restaurante con el enlace.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedUserReferrals.map((ref: any) => (
                            <div key={ref.id} className="p-4 bg-surface-base rounded-2xl border border-outline flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center font-black text-orange-600 text-xs">
                                  {ref.referred?.display_name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div>
                                  <p className="font-bold text-xs text-on-surface">{ref.referred?.display_name || 'Alguien que compró'}</p>
                                  <p className="text-[10px] text-on-surface-muted font-bold leading-none">{ref.referred?.email || 'email no disponible'}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-bold text-on-surface-muted border-b border-outline pb-0.5 mb-0.5">Fecha de registro</p>
                                <p className="text-xs font-black text-on-surface">{new Date(ref.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-6 border-t border-outline mt-6 flex-shrink-0">
                      <button
                        onClick={() => setSelectedUserReferrals(null)}
                        type="button"
                        className="w-full py-4 bg-surface-variant hover:bg-surface-light text-on-surface font-black text-xs uppercase tracking-widest rounded-2xl transition-all"
                      >
                        Cerrar Lista
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {activeTab === 'loyalty' && (
        <>
          {/* Header & Settings */}
          <div className="glass-card text-on-surface rounded-3xl p-8 border border-outline shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center">
              <Trophy className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-on-surface tracking-tight">Gamificación y Fidelización</h2>
                {gamificationEnabled && (
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                    SISTEMA ACTIVO
                  </span>
                )}
              </div>
              <p className="text-on-surface-muted font-medium">Gestiona monedas de oro, niveles, tareas y la ruleta de premios para tus clientes.</p>
            </div>
          </div>
          <button 
            onClick={() => setIsEditingSettings(!isEditingSettings)}
            className="flex items-center gap-2 px-6 py-3 bg-surface-variant text-on-surface rounded-2xl font-bold text-sm hover:scale-105 active:scale-95 transition-all"
          >
            <Settings className="w-4 h-4" />
            {isEditingSettings ? 'Cerrar Ajustes' : 'Configurar Programa'}
          </button>
        </div>

        <AnimatePresence>
          {isEditingSettings && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-8 pt-8 border-t border-outline"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-12 h-6 rounded-full transition-all flex items-center p-1 ${loyaltyEnabled ? 'bg-orange-500' : 'bg-surface-variant'}`}>
                      <input type="checkbox" className="hidden" checked={loyaltyEnabled} onChange={async (e) => {
                         const newValue = e.target.checked;
                         setLoyaltyEnabled(newValue);
                         try {
                           await db.updateRestaurant(restaurant.id, {
                             loyaltyEnabled: newValue
                           } as any);
                           toast.success(newValue ? 'Programa activado' : 'Programa desactivado');
                         } catch (error) {
                           toast.error('Error al guardar cambio');
                           setLoyaltyEnabled(!newValue);
                         }
                      }} />
                      <div 
                        className="w-4 h-4 glass-card rounded-full shadow-sm transition-transform" 
                        style={{ transform: loyaltyEnabled ? 'translateX(24px)' : 'translateX(0)' }}
                      />
                    </div>
                    <span className="font-bold text-on-surface-variant">Activar programa de monedas de oro</span>
                  </label>
                  <p className="text-xs text-on-surface-muted max-w-sm">
                    Si se activa, los usuarios ganarán monedas de oro automáticamente con cada compra completada.
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-12 h-6 rounded-full transition-all flex items-center p-1 ${gamificationEnabled ? 'bg-emerald-500' : 'bg-surface-variant'}`}>
                      <input type="checkbox" className="hidden" checked={gamificationEnabled} onChange={async (e) => {
                         const newValue = e.target.checked;
                         setGamificationEnabled(newValue);
                         try {
                           await db.updateRestaurant(restaurant.id, {
                             gamificationEnabled: newValue
                           } as any);
                           toast.success(newValue ? 'Sistema de tareas y niveles activado' : 'Sistema desactivado');
                         } catch (error) {
                           toast.error('Error al guardar cambio');
                           setGamificationEnabled(!newValue);
                         }
                      }} />
                      <div 
                        className="w-4 h-4 glass-card rounded-full shadow-sm transition-transform" 
                        style={{ transform: gamificationEnabled ? 'translateX(24px)' : 'translateX(0)' }}
                      />
                    </div>
                    <span className="font-bold text-on-surface-variant">Activar sistema de tareas y niveles</span>
                  </label>
                  <p className="text-xs text-on-surface-muted max-w-sm">
                    Si se activa, los usuarios podrán ver y completar tareas para subir de nivel y obtener beneficios.
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-black text-on-surface uppercase tracking-widest mb-2">Monedas de Oro por cada $10.000 gastados</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-muted" />
                    <input 
                      type="number"
                      value={pointsPerDollar === 0 ? "" : (pointsPerDollar || "")}
                      onChange={(e) => setPointsPerDollar(e.target.value ? Number(e.target.value) : 0)}
                      className="w-full pl-10 pr-4 py-3 bg-surface-base border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 font-black text-on-surface"
                      placeholder="Ej: 1"
                    />
                  </div>
                  <p className="text-xs text-on-surface-muted">
                    Ejemplo: Si configuras 1 moneda de oro, el usuario ganará 1 moneda de oro por cada $10.000 pesos de compra. Si configuras 2, ganará 2 monedas de oro por cada $10.000 pesos de compra.
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button 
                  onClick={handleSaveSettings}
                  className="flex items-center gap-2 px-8 py-3 bg-orange-600 text-on-surface rounded-2xl font-black shadow-lg shadow-orange-200 hover:scale-105 active:scale-95 transition-all"
                >
                  <Save className="w-5 h-5" />
                  Guardar Cambios
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Rewards Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-orange-600" />
              <h3 className="text-xl font-black text-on-surface tracking-tight">Catálogo de Premios</h3>
            </div>
            <button 
              onClick={() => {
                setEditingReward({ rewardType: 'item', isActive: true, pointsCost: 100 });
                setShowRewardModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-xl font-bold text-sm hover:bg-orange-100 transition-all"
            >
              <Plus className="w-4 h-4" />
              Nuevo Premio
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewards.length === 0 ? (
              <div className="md:col-span-2 py-12 bg-surface-base rounded-3xl border-2 border-dashed border-outline flex flex-col items-center justify-center text-center px-4">
                <UtensilsCrossed className="w-12 h-12 text-on-surface-variant mb-4" />
                <p className="font-bold text-on-surface">No hay premios configurados</p>
                <p className="text-sm text-on-surface-muted mt-2">Crea incentivos para que tus clientes vuelvan siempre.</p>
              </div>
            ) : (
              rewards.map(reward => (
                <div key={reward.id} className="glass-card p-6 rounded-3xl border border-outline shadow-sm hover:border-orange-100 transition-all flex items-start gap-4 group">
                  <div className="w-16 h-16 bg-surface-variant rounded-2xl flex-shrink-0 flex items-center justify-center">
                    {reward.imageUrl ? (
                      <img src={reward.imageUrl} className="w-full h-full object-cover rounded-2xl" alt={reward.title} />
                    ) : (
                      reward.rewardType === 'coupon' ? <Ticket className="w-8 h-8 text-on-surface-muted" /> : <ShoppingBag className="w-8 h-8 text-on-surface-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-black text-on-surface truncate">{reward.title}</h4>
                      <div className="bg-orange-600 text-on-surface text-[10px] px-2 py-1 rounded-full font-black uppercase">
                        {reward.pointsCost} monedas de oro
                      </div>
                    </div>
                    <p className="text-xs text-on-surface-muted line-clamp-2 mb-3">{reward.description}</p>
                    
                    {rewardLevels[reward.id] && levels.find(l => l.id === rewardLevels[reward.id]) && (
                      <div className="flex items-center gap-1 text-[10px] bg-purple-50 text-purple-600 px-2 py-1 rounded-md w-fit mb-3 font-bold uppercase">
                        <Star className="w-3 h-3" />
                        Req. Nivel {levels.find(l => l.id === rewardLevels[reward.id])?.name}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setEditingReward({ ...reward, requiredLevelId: rewardLevels[reward.id] || "" });
                          setShowRewardModal(true);
                        }}
                        className="p-2 bg-surface-base text-on-surface-muted rounded-lg hover:text-orange-600 hover:bg-orange-50 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteReward(reward.id)}
                        className="p-2 bg-surface-base text-on-surface-muted rounded-lg hover:text-red-600 hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Redemptions History */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h3 className="text-xl font-black text-on-surface tracking-tight">Canjes Pendientes</h3>
          </div>

          <div className="space-y-4">
            {redemptions.filter(r => r.status === 'pending').length === 0 ? (
              <div className="py-12 bg-surface-base rounded-3xl border-2 border-dashed border-outline flex flex-col items-center justify-center text-center px-4">
                <Users className="w-12 h-12 text-on-surface-variant mb-4" />
                <p className="font-bold text-on-surface">Todo al día</p>
                <p className="text-sm text-on-surface-muted mt-2">No hay solicitudes de canje pendientes por entregar.</p>
              </div>
            ) : (
              redemptions.filter(r => r.status === 'pending').map(redemption => (
                <div key={redemption.id} className="glass-card p-5 rounded-3xl border border-outline shadow-sm space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Premio a entregar</p>
                      <p className="font-black text-on-surface">{redemption.reward?.title || 'Premio eliminado'}</p>
                    </div>
                    <div className="bg-surface-variant px-3 py-1 rounded-full text-[10px] font-black text-on-surface-muted uppercase">
                      ID: {redemption.id.slice(0, 5)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleUpdateRedemptionStatus(redemption.id, 'completed')}
                      className="flex-1 py-3 bg-green-600 text-on-surface rounded-xl font-black text-xs hover:bg-green-700 transition-all"
                    >
                      Completar Entrega
                    </button>
                    <button 
                      onClick={() => handleUpdateRedemptionStatus(redemption.id, 'cancelled')}
                      className="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-black text-xs hover:bg-red-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Reward Modal */}
      <AnimatePresence>
        {showRewardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card text-on-surface rounded-[40px] w-full max-w-lg p-10 overflow-hidden shadow-2xl"
            >
              <h3 className="text-2xl font-black text-on-surface mb-8">{editingReward?.id ? 'Editar Premio' : 'Nuevo Premio'}</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">Título del Premio</label>
                  <input 
                    type="text"
                    value={editingReward?.title || ''}
                    onChange={(e) => setEditingReward(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-6 py-4 bg-surface-base border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 font-bold text-on-surface"
                    placeholder="Ej: Burger Clásica Gratis"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">Descripción</label>
                  <textarea 
                    value={editingReward?.description || ''}
                    onChange={(e) => setEditingReward(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-6 py-4 bg-surface-base border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 font-bold text-on-surface min-h-[100px]"
                    placeholder="Detalles sobre lo que el cliente obtiene."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">Costo en Monedas de Oro</label>
                    <input 
                      type="number"
                      value={editingReward?.pointsCost === 0 ? "" : (editingReward?.pointsCost || "")}
                      onChange={(e) => setEditingReward(prev => ({ ...prev, pointsCost: e.target.value ? Number(e.target.value) : 0 }))}
                      className="w-full px-6 py-4 bg-surface-base border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 font-black text-on-surface"
                      placeholder="Ej: 500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">Tipo</label>
                    <select 
                      value={editingReward?.rewardType || 'item'}
                      onChange={(e) => setEditingReward(prev => ({ ...prev, rewardType: e.target.value as any }))}
                      className="w-full px-6 py-4 bg-surface-base border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 font-bold text-on-surface"
                    >
                      <option value="item">Producto Gratis</option>
                      <option value="coupon">Cupón de Descuento</option>
                      <option value="service">Servicio/Otro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">Nivel Requerido (Opcional)</label>
                  <select 
                    value={editingReward?.requiredLevelId || ""}
                    onChange={(e) => setEditingReward(prev => ({ ...prev, requiredLevelId: e.target.value }))}
                    className="w-full px-6 py-4 bg-surface-base border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 font-bold text-on-surface"
                  >
                    <option value="">Cualquier nivel</option>
                    {levels.map(level => (
                      <option key={level.id} value={level.id}>{level.icon} Nivel {level.name} (Min. {level.pointsRequired} monedas de oro)</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <button 
                    onClick={() => {
                      setShowRewardModal(false);
                      setEditingReward(null);
                    }}
                    className="flex-1 py-4 bg-surface-variant text-on-surface-muted rounded-2xl font-black hover:bg-surface-variant transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSaveReward}
                    className="flex-1 py-4 bg-orange-600 text-on-surface rounded-2xl font-black shadow-lg shadow-orange-200 hover:scale-105 active:scale-95 transition-all"
                  >
                    {editingReward?.id ? 'Actualizar' : 'Crear Premio'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </>
      )}
      
      {activeTab === 'wheel' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card text-on-surface rounded-3xl p-8 border border-outline shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Dices className="w-40 h-40" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
                      <Dices className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-on-surface tracking-tight">Ruleta de la Suerte</h2>
                      <p className="text-on-surface-muted font-medium">Configura los premios y segmentos de la ruleta interactiva.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsEditingWheel(!isEditingWheel)}
                    className="flex items-center gap-2 px-6 py-3 bg-surface-variant text-on-surface rounded-2xl font-bold text-sm hover:scale-105 active:scale-95 transition-all"
                  >
                    <Settings className="w-4 h-4" />
                    {isEditingWheel ? 'Cerrar Ajustes' : 'Configurar Ruleta'}
                  </button>
                </div>

                <AnimatePresence>
                  {isEditingWheel && wheelConfig && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mb-8"
                    >
                      <div className="pt-6 border-t border-outline space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-12 h-6 rounded-full transition-all flex items-center p-1 ${wheelConfig.isActive ? 'bg-emerald-500' : 'bg-surface-variant'}`}>
                              <div 
                                className="w-4 h-4 glass-card rounded-full shadow-sm transition-transform" 
                                style={{ transform: wheelConfig.isActive ? 'translateX(24px)' : 'translateX(0)' }}
                                onClick={() => setWheelConfig({ ...wheelConfig, isActive: !wheelConfig.isActive })}
                              />
                            </div>
                            <span className="font-bold text-on-surface-variant">Ruleta Activa</span>
                          </label>
                        </div>
                          <div className="space-y-4">
                          <h4 className="font-black text-on-surface">Segmentos de la Ruleta</h4>
                          {Array.isArray(wheelConfig?.segments) && wheelConfig.segments.map((segment, index) => (
                            <div key={index} className="flex gap-4 items-center bg-surface-base p-4 rounded-2xl">
                              <div className="w-8 h-8 rounded-full border border-outline" style={{ backgroundColor: segment?.color || "#ccc" }} />
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={segment?.text || ""}
                                  onChange={(e) => {
                                    if (!wheelConfig) return;
                                    const newSegments = [...wheelConfig.segments];
                                    newSegments[index].text = e.target.value;
                                    setWheelConfig({ ...wheelConfig, segments: newSegments });
                                  }}
                                  className="w-full px-4 py-2 glass-card text-on-surface border border-outline rounded-xl font-bold focus:ring-2 focus:ring-emerald-500"
                                  placeholder="Texto del segmento"
                                />
                              </div>
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={segment?.value || ""}
                                  onChange={(e) => {
                                    if (!wheelConfig) return;
                                    const newSegments = [...wheelConfig.segments];
                                    newSegments[index].value = e.target.value;
                                    setWheelConfig({ ...wheelConfig, segments: newSegments });
                                  }}
                                  className="w-full px-4 py-2 glass-card text-on-surface border border-outline rounded-xl font-bold focus:ring-2 focus:ring-emerald-500"
                                  placeholder="Valor interno (ej: free_drink)"
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-end pt-4">
                          <button 
                            onClick={handleSaveWheelSettings}
                            className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-on-surface rounded-2xl font-black shadow-lg shadow-emerald-200 hover:scale-105 active:scale-95 transition-all"
                          >
                            <Save className="w-5 h-5" />
                            Guardar Ruleta
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Visualizer */}
                {!isEditingWheel && wheelConfig && (
                  <div>
                    <h3 className="font-black text-on-surface mb-4">Vista previa de premios en la ruleta</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {wheelConfig.segments.map((segment, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-surface-base rounded-xl border border-outline">
                          <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: segment.color }} />
                          <span className="font-bold text-sm text-on-surface-variant truncate">{segment.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Delivery list for wheel prizes */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-emerald-600" />
              <h3 className="text-xl font-black text-on-surface tracking-tight">Premios por Entregar</h3>
            </div>

            <div className="space-y-4">
              {wheelPrizes.filter(p => p.status === 'pending').length === 0 ? (
                <div className="py-12 bg-surface-base rounded-3xl border-2 border-dashed border-outline flex flex-col items-center justify-center text-center px-4">
                  <Dices className="w-12 h-12 text-on-surface-variant mb-4" />
                  <p className="font-bold text-on-surface">Nada pendiente</p>
                  <p className="text-sm text-on-surface-muted mt-2">Los premios ganados aparecerán aquí para entrega.</p>
                </div>
              ) : (
                wheelPrizes.filter(p => p.status === 'pending').map(prize => (
                  <div key={prize.id} className="glass-card p-5 rounded-3xl border border-outline shadow-sm space-y-4">
                    <div className="flex flex-col">
                       <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Premio Ganado</p>
                       <p className="font-black text-on-surface mb-2">{prize.prizeText}</p>
                       <div className="text-xs text-on-surface-muted font-medium bg-surface-base p-2 rounded-lg border border-outline">
                         <strong>Ganador:</strong> {prize.userName || 'Usuario Anónimo'} <br/>
                         {prize.userPhone && <span><strong>Tel:</strong> {prize.userPhone}</span>}
                       </div>
                    </div>
                    
                    <button 
                      onClick={() => handleUpdatePrizeStatus(prize.id, 'delivered')}
                      className="w-full py-3 bg-emerald-600 text-on-surface rounded-xl font-black text-xs hover:bg-emerald-700 transition-all flex justify-center items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Marcar como Entregado
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {activeTab === 'levels' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-purple-600" />
              <h3 className="text-xl font-black text-on-surface tracking-tight">Niveles de Gamificación</h3>
            </div>
            <button 
              onClick={() => {
                setEditingLevel({ pointsRequired: 0 });
                setShowLevelModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl font-bold text-sm hover:bg-purple-100 transition-all"
            >
              <Plus className="w-4 h-4" />
              Nuevo Nivel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {levels.length === 0 ? (
              <div className="col-span-full py-12 bg-surface-base rounded-3xl border-2 border-dashed border-outline flex flex-col items-center justify-center text-center px-4">
                <Star className="w-12 h-12 text-on-surface-variant mb-4" />
                <p className="font-bold text-on-surface">No hay niveles configurados</p>
                <p className="text-sm text-on-surface-muted mt-2">Crea niveles para recompensar a tus usuarios.</p>
              </div>
            ) : (
              levels.map(level => (
                <div key={level.id} className="glass-card p-6 rounded-3xl border border-outline shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 font-bold text-4xl" style={{ color: level.color }}>
                    {level.icon}
                  </div>
                  <h4 className="font-black text-xl mb-1 text-on-surface">{level.name}</h4>
                  <div className="text-sm font-bold bg-surface-variant w-fit px-3 py-1 rounded-full text-on-surface-muted mb-4">
                    {level.pointsRequired} monedas de oro
                  </div>
                  <ul className="text-sm text-on-surface-muted space-y-2 mb-6">
                    {(level.benefits || []).map((b: string, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                         <CheckCircle2 className="w-3 h-3 text-purple-500" />
                         {b}
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setEditingLevel(level);
                        setShowLevelModal(true);
                      }}
                      className="p-2 bg-surface-base text-on-surface-muted rounded-lg hover:text-purple-600 hover:bg-purple-50 transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteLevel(level.id)}
                      className="p-2 bg-surface-base text-on-surface-muted rounded-lg hover:text-red-600 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="space-y-6 animate-in fade-in duration-500">
           <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <h3 className="text-xl font-black text-on-surface tracking-tight">Misiones y Tareas</h3>
            </div>
            <button 
              onClick={() => {
                setEditingTask({ pointsReward: 10, type: 'one-time' });
                setShowTaskModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100 transition-all"
            >
              <Plus className="w-4 h-4" />
              Nueva Tarea
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.length === 0 ? (
              <div className="col-span-full py-12 bg-surface-base rounded-3xl border-2 border-dashed border-outline flex flex-col items-center justify-center text-center px-4">
                <CheckCircle2 className="w-12 h-12 text-on-surface-variant mb-4" />
                <p className="font-bold text-on-surface">No hay tareas configuradas</p>
                <p className="text-sm text-on-surface-muted mt-2">Crea tareas para que ganen monedas de oro extra.</p>
              </div>
            ) : (
              tasks.map(task => (
                <div key={task.id} className="glass-card p-6 rounded-3xl border border-outline shadow-sm flex gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                    {task.icon || '🚀'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-black text-on-surface">{task.name}</h4>
                      <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                        +{task.pointsReward} monedas de oro
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-muted mb-2">{task.description}</p>
                    <div className="flex gap-2">
                       <button onClick={() => { setEditingTask(task); setShowTaskModal(true); }} className="text-xs text-blue-600 font-black">Editar</button>
                       <button onClick={() => handleDeleteTask(task.id)} className="text-xs text-rose-600 font-black">Eliminar</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modals for Levels and Tasks */}
      <AnimatePresence>
        {showLevelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card text-on-surface rounded-[40px] w-full max-w-lg p-10 overflow-hidden shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-black text-on-surface mb-8">{editingLevel?.id ? 'Editar Nivel' : 'Nuevo Nivel'}</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">Nombre del Nivel</label>
                  <input type="text" value={editingLevel?.name || ''} onChange={(e) => setEditingLevel({...editingLevel, name: e.target.value})} className="w-full px-6 py-4 bg-surface-base border-0 rounded-2xl focus:ring-2 focus:ring-purple-500 font-bold text-on-surface" placeholder="Ej: Oro" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">Monedas de Oro (Desde)</label>
                    <input type="number" value={editingLevel?.pointsRequired ?? ''} onChange={(e) => setEditingLevel({...editingLevel, pointsRequired: Number(e.target.value)})} className="w-full px-6 py-4 bg-surface-base border-0 rounded-2xl focus:ring-2 focus:ring-purple-500 font-black text-on-surface" placeholder="Ej: 500" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">Icono (Emoji)</label>
                    <input type="text" value={editingLevel?.icon || ''} onChange={(e) => setEditingLevel({...editingLevel, icon: e.target.value})} className="w-full px-6 py-4 bg-surface-base border-0 rounded-2xl focus:ring-2 focus:ring-purple-500 font-black text-on-surface" placeholder="Ej: 👑" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">Beneficios (Separados por coma)</label>
                  <textarea value={(editingLevel?.benefits || []).join(', ')} onChange={(e) => setEditingLevel({...editingLevel, benefits: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} className="w-full px-6 py-4 bg-surface-base border-0 rounded-2xl focus:ring-2 focus:ring-purple-500 font-bold text-on-surface min-h-[100px]" placeholder="Envío gratis, Soporte PRI..." />
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setShowLevelModal(false)} className="flex-1 py-4 bg-surface-variant text-on-surface-muted rounded-2xl font-black">Cancelar</button>
                  <button onClick={handleSaveLevel} className="flex-1 py-4 bg-purple-600 text-on-surface rounded-2xl font-black shadow-lg shadow-purple-200">Guardar</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        
        {showTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card text-on-surface rounded-[40px] w-full max-w-lg p-10 overflow-hidden shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-black text-on-surface mb-8">{editingTask?.id ? 'Editar Tarea' : 'Nueva Tarea'}</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">Nombre de Tarea</label>
                  <input type="text" value={editingTask?.name || ''} onChange={(e) => setEditingTask({...editingTask, name: e.target.value})} className="w-full px-6 py-4 bg-surface-base border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-on-surface" placeholder="Ej: Síguenos en IG" />
                </div>
                <div>
                  <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">Descripción</label>
                  <textarea value={editingTask?.description || ''} onChange={(e) => setEditingTask({...editingTask, description: e.target.value})} className="w-full px-6 py-4 bg-surface-base border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-on-surface" placeholder="Breve explicación" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">Monedas de Oro</label>
                    <input type="number" value={editingTask?.pointsReward ?? ''} onChange={(e) => setEditingTask({...editingTask, pointsReward: Number(e.target.value)})} className="w-full px-6 py-4 bg-surface-base border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 font-black text-on-surface" placeholder="Ej: 50" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">Icono</label>
                    <input type="text" value={editingTask?.icon || ''} onChange={(e) => setEditingTask({...editingTask, icon: e.target.value})} className="w-full px-6 py-4 bg-surface-base border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 font-black text-on-surface" placeholder="Ej: 📱" />
                  </div>
                </div>
                <div>
                    <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">URL de acción (Opcional)</label>
                    <input type="text" value={editingTask?.actionUrl || ''} onChange={(e) => setEditingTask({...editingTask, actionUrl: e.target.value})} className="w-full px-6 py-4 bg-surface-base border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 font-black text-on-surface text-sm" placeholder="https://instagram.com/..." />
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setShowTaskModal(false)} className="flex-1 py-4 bg-surface-variant text-on-surface-muted rounded-2xl font-black">Cancelar</button>
                  <button onClick={handleSaveTask} className="flex-1 py-4 bg-blue-600 text-on-surface rounded-2xl font-black shadow-lg shadow-blue-200">Guardar</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
