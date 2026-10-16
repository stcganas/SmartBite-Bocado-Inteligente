import React, { useState, useEffect } from 'react';
import { 
  Trophy, Gift, ChevronRight, Star, ShoppingBag, 
  Loader2, BadgePercent, Ticket, Utensils, 
  X, CheckCircle2, AlertCircle, Store,
  Clock, Sparkles
} from 'lucide-react';
import { db, LoyaltyPoints, LoyaltyReward, Restaurant } from '../store/db';
import { GoldCoinIcon } from './GoldCoinIcon';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { formatCurrency } from '../utils/format';

export const LoyaltyWallet: React.FC = () => {
  console.log('LoyaltyWallet rendering');
  const { user } = useAuth();
  const [loyaltyData, setLoyaltyData] = useState<(LoyaltyPoints & { restaurant: Restaurant })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<(LoyaltyPoints & { restaurant: Restaurant }) | null>(null);
  const [availableRewards, setAvailableRewards] = useState<LoyaltyReward[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [rewardLevels, setRewardLevels] = useState<Record<string, string>>({});
  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetchLoyaltyData();
    fetchTransactions();
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;
    try {
      const data = await db.getLoyaltyTransactions(user.id);
      setTransactions(data);
    } catch (err) {
      console.warn('Error fetching transactions', err);
    }
  };

  const fetchLoyaltyData = async () => {
    console.log('LoyaltyWallet fetching data for user:', user?.id);
    setLoading(true);
    try {
      if (user) {
        const data = await db.getAllUserLoyaltyPoints(user.id);
        console.log('LoyaltyWallet fetched data:', data);
        setLoyaltyData(data || []);
      } else {
        console.log('LoyaltyWallet no user');
        setLoyaltyData([]);
      }
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
      setLoyaltyData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRestaurant = async (data: LoyaltyPoints & { restaurant: Restaurant }) => {
    setSelectedRestaurant(data);
    setLoadingRewards(true);
    try {
      const [rewards, levelsData, reqData, tasksData] = await Promise.all([
        db.getLoyaltyRewards(data.restaurantId),
        db.getGamificationLevels(data.restaurantId),
        db.getRewardLevelRequirements(data.restaurantId),
        db.getGamificationTasks(data.restaurantId)
      ]);
      setAvailableRewards(rewards);
      setLevels(levelsData);
      setRewardLevels(reqData);
      setTasks(tasksData);
    } catch (error) {
      toast.error('Error al cargar premios disponibles');
    } finally {
      setLoadingRewards(false);
    }
  };

  const getUserCurrentLevel = () => {
    if (!selectedRestaurant || levels.length === 0) return null;
    const sorted = [...levels].sort((a,b) => b.pointsRequired - a.pointsRequired); // descending
    return sorted.find(l => selectedRestaurant.totalEarned >= l.pointsRequired) || sorted[sorted.length - 1]; // or highest lower bound
  };

  const handleRedeem = async (reward: LoyaltyReward) => {
    if (!user || !selectedRestaurant) return;
    
    if (selectedRestaurant.pointsBalance < reward.pointsCost) {
      toast.error('No tienes suficientes monedas de oro para este premio');
      return;
    }

    setIsRedeeming(true);
    try {
      await db.redeemLoyaltyReward(user.id, selectedRestaurant.restaurantId, reward.id, reward.pointsCost);
      toast.success(`¡Canje solicitado! Presenta tu ticket en ${selectedRestaurant.restaurant.name}`);
      
      // Update local state
      const updatedBalance = selectedRestaurant.pointsBalance - reward.pointsCost;
      setSelectedRestaurant({ ...selectedRestaurant, pointsBalance: updatedBalance });
      setLoyaltyData(prev => prev.map(d => d.id === selectedRestaurant.id ? { ...d, pointsBalance: updatedBalance } : d));
      
    } catch (error: any) {
      toast.error(error.message || 'Error al canjear monedas de oro');
    } finally {
      setIsRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  console.log('LoyaltyWallet rendering, data count:', loyaltyData.length);

  return (
    <div className="space-y-6">
      {/* Explicación diferencia de monedas de oro */}
      <div className="bg-orange-50 border border-orange-100 rounded-[2.5rem] p-6 flex flex-col md:flex-row items-center gap-4 text-neutral-800 shadow-sm font-sans">
        <div className="w-12 h-12 bg-orange-100 border border-orange-200 text-orange-600 rounded-2xl flex flex-shrink-0 items-center justify-center">
          <GoldCoinIcon className="w-6 h-6 animate-pulse" />
        </div>
        <div className="text-center md:text-left flex-1">
          <p className="text-sm font-black text-neutral-900 mb-0.5">💰 Baúl de Monedas de Oro e Interacciones</p>
          <p className="text-[11px] text-neutral-700 leading-relaxed font-semibold">
            Las <strong>Monedas de Oro</strong> que obtienes al completar pedidos van automáticamente a tu <strong>Baúl de Monedas de Oro</strong> por cada restaurante. Éstas monedas de oro te servirán para comprar giros en la ruleta o canjear por productos. Ganas 1 moneda por cada $10.000 consumidos.
          </p>
        </div>
      </div>

      {/* Horizontal Scroll of Loyalty Cards */}
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {loyaltyData.length === 0 ? (
          <div className="w-full py-12 bg-white rounded-3xl border border-neutral-100 flex flex-col items-center justify-center text-center px-8 shadow-sm">
            <Sparkles className="w-12 h-12 text-orange-200 mb-4" />
            <h4 className="font-black text-neutral-900 text-lg">Aún no tienes monedas de oro registrados</h4>
            <p className="text-on-surface-variant text-sm mt-1 max-w-xs">¡Haz tu primer pedido y empieza a acumular beneficios!</p>
          </div>
        ) : (
          loyaltyData.map((data) => (
            <motion.button
              key={data.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelectRestaurant(data)}
              className={`flex-shrink-0 w-72 p-6 rounded-[32px] transition-all relative overflow-hidden golden-glow-module ${
                selectedRestaurant?.id === data.id 
                ? 'bg-orange-600/20 border-orange-500 text-on-surface shadow-xl shadow-orange-200' 
                : 'bg-[#0B0B0B] border-neutral-100/10 text-neutral-900 shadow-sm'
              }`}
            >
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center overflow-hidden border border-white/30">
                    {data.restaurant?.logo ? (
                      <img src={data.restaurant.logo} alt={data.restaurant.name} className="w-full h-full object-cover" />
                    ) : (
                      <Store className={`w-5 h-5 ${selectedRestaurant?.id === data.id ? 'text-on-surface' : 'text-on-surface-muted'}`} />
                    )}
                  </div>
                  <span className={`font-black text-sm truncate ${selectedRestaurant?.id === data.id ? 'text-on-surface' : 'text-neutral-900'}`}>
                    {data.restaurant?.name}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${selectedRestaurant?.id === data.id ? 'text-orange-200' : 'text-on-surface-muted'}`}>
                    Baúl de Monedas de Oro Disponibles
                  </p>
                  <p className="text-4xl font-black">{data.pointsBalance}</p>
                </div>

                <div className={`mt-6 pt-4 border-t ${selectedRestaurant?.id === data.id ? 'border-white/20' : 'border-neutral-50'} flex items-center justify-between`}>
                  <div className="flex items-center gap-1 text-[10px] font-bold">
                    <Star className="w-3 h-3 fill-current" />
                    Ganados: {data.totalEarned}
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Decorative Circle */}
              <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 ${selectedRestaurant?.id === data.id ? 'bg-white' : 'bg-orange-500'}`} />
            </motion.button>
          ))
        )}
      </div>

      {/* Selected Restaurant Rewards */}
      <AnimatePresence mode="wait">
        {selectedRestaurant && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[40px] p-8 border border-neutral-100 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                  <Gift className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-neutral-900 tracking-tight">Premios en {selectedRestaurant.restaurant.name}</h3>
                  <p className="text-on-surface-variant text-sm font-medium">Canjea tus monedas de oro por comida, cupones y más.</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRestaurant(null)}
                className="p-3 bg-neutral-50 rounded-2xl text-on-surface-muted hover:bg-neutral-100 transition-all self-start sm:self-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingRewards ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              </div>
            ) : (
              <div className="space-y-12">
                {/* Gamification Status */}
                {levels.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Level Card */}
                    <div className="bg-purple-900 rounded-3xl p-6 text-on-surface relative overflow-hidden shadow-xl shadow-purple-900/20">
                      <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-600 rounded-full blur-3xl opacity-50" />
                      {(() => {
                        const lvl = getUserCurrentLevel();
                        if (!lvl) return null;
                        const nextLvl = levels.find(l => l.pointsRequired > lvl.pointsRequired);
                        const progress = nextLvl ? Math.min(100, (selectedRestaurant.totalEarned / nextLvl.pointsRequired) * 100) : 100;

                        return (
                          <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                               <p className="text-xs font-black uppercase tracking-widest text-purple-300 mb-1">Tu Nivel Actual</p>
                               <div className="flex items-center gap-3">
                                 <span className="text-3xl">{lvl.icon}</span>
                                 <h4 className="text-3xl font-black">{lvl.name}</h4>
                               </div>
                            </div>
                            <div className="mt-6">
                               {nextLvl ? (
                                 <>
                                   <div className="flex justify-between text-xs font-bold text-purple-200 mb-2">
                                     <span>{selectedRestaurant.totalEarned} monedas de oro</span>
                                     <span>{nextLvl.pointsRequired} monedas de oro para {nextLvl.name}</span>
                                   </div>
                                   <div className="w-full h-3 bg-purple-950/50 rounded-full overflow-hidden border border-purple-800">
                                     <div className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-400 rounded-full" style={{ width: `${progress}%` }} />
                                   </div>
                                 </>
                               ) : (
                                 <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-800/50 rounded-xl text-purple-200 font-bold text-sm">
                                   <Star className="w-4 h-4 fill-current" />
                                   ¡Nivel Máximo Alcanzado!
                                 </div>
                               )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Pending Tasks */}
                    <div className="bg-white rounded-3xl p-6 border-2 border-dashed border-blue-200 text-center flex flex-col justify-center items-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl opacity-50" />
                      <CheckCircle2 className="w-10 h-10 text-blue-400 mb-3" />
                      <h4 className="text-xl font-black text-neutral-900 mb-1">Misiones Disponibles</h4>
                      <p className="text-on-surface-variant text-sm font-medium mb-4">Completa tareas y gana monedas de oro extra</p>
                      <button className="px-6 py-2.5 bg-blue-600 text-on-surface rounded-xl font-black text-sm shadow-lg shadow-blue-200 hover:scale-105 transition-all">
                        Ver {tasks.length} tareas
                      </button>
                    </div>
                  </div>
                )}

                {/* Rewards List */}
                <div>
                  <h4 className="text-xl font-black text-neutral-900 mb-6 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-orange-500" />
                    Catálogo de Premios
                  </h4>
                  {availableRewards.length === 0 ? (
                    <div className="py-20 text-center bg-neutral-50 rounded-3xl border border-neutral-100">
                      <Utensils className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
                      <p className="text-on-surface-muted font-bold">Este restaurante aún no tiene premios disponibles.</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Progress Line connecting rewards */}
                      <div className="absolute left-10 top-8 bottom-8 w-1 bg-neutral-100 rounded-full hidden md:block"></div>
                      
                      <div className="space-y-6">
                        {availableRewards.sort((a,b) => a.pointsCost - b.pointsCost).map((reward, index) => {
                          const reqLevelId = rewardLevels[reward.id];
                          const reqLevel = levels.find(l => l.id === reqLevelId);
                          const userLevel = getUserCurrentLevel();
                          const meetsLevel = !reqLevel || (userLevel && userLevel.pointsRequired >= reqLevel.pointsRequired);
                          const isUnlocked = selectedRestaurant.pointsBalance >= reward.pointsCost && meetsLevel;
                          const progress = Math.min(100, (selectedRestaurant.pointsBalance / reward.pointsCost) * 100);
                          
                          return (
                      <div key={reward.id} className={`group relative bg-white rounded-3xl p-6 border-2 transition-all flex flex-col md:flex-row items-start gap-6 ${isUnlocked ? 'border-orange-500 shadow-lg shadow-orange-100' : 'border-neutral-100 opacity-80'}`}>
                        {/* Decorative timeline node */}
                        <div className={`hidden md:flex absolute -left-[18px] top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-4 border-white items-center justify-center z-10 ${isUnlocked ? 'bg-orange-500' : 'bg-neutral-200'}`}>
                          {isUnlocked ? <CheckCircle2 className="w-4 h-4 text-on-surface" /> : <span className="text-[10px] font-black text-on-surface-variant">{index + 1}</span>}
                        </div>

                        <div className="w-24 h-24 bg-neutral-50 rounded-2xl flex-shrink-0 flex items-center justify-center border border-neutral-100 overflow-hidden shadow-sm relative">
                          {isUnlocked && <div className="absolute inset-0 bg-orange-500/10 pointer-events-none" />}
                          {reward.imageUrl ? (
                            <img src={reward.imageUrl} className="w-full h-full object-cover" alt={reward.title} />
                          ) : (
                            reward.rewardType === 'coupon' ? <Ticket className={`w-10 h-10 ${isUnlocked ? 'text-orange-500' : 'text-on-surface-variant'}`} /> : <ShoppingBag className={`w-10 h-10 ${isUnlocked ? 'text-orange-500' : 'text-on-surface-variant'}`} />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className={`font-black text-lg transition-colors truncate ${isUnlocked ? 'text-neutral-900 group-hover:text-orange-600' : 'text-on-surface-variant'}`}>{reward.title}</h4>
                            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${isUnlocked ? 'bg-orange-100 text-orange-600' : 'bg-neutral-100 text-on-surface-variant'}`}>
                              <Trophy className="w-3.5 h-3.5" /> {reward.pointsCost} 🪙
                            </div>
                          </div>
                          <p className="text-sm text-on-surface-variant line-clamp-2 mb-4 leading-relaxed font-medium">
                            {reward.description}
                          </p>

                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-on-surface-muted mb-1">
                              <span>Progreso</span>
                              <span>{selectedRestaurant.pointsBalance} / {reward.pointsCost} PTS</span>
                            </div>
                            <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-1000 ${isUnlocked ? 'bg-orange-500' : 'bg-orange-300'}`} 
                                style={{ width: `${progress}%` }} 
                              />
                            </div>
                          </div>
                          
                          {!meetsLevel && reqLevel && (
                             <div className="mb-4 bg-purple-50 p-3 rounded-xl border border-purple-100 flex gap-3 items-center">
                               <Star className="w-5 h-5 text-purple-500" />
                               <p className="text-xs font-bold text-purple-700">Requiere Nivel {reqLevel.name}. Te faltan {reqLevel.pointsRequired - selectedRestaurant.totalEarned} monedas de oro totales para alcanzarlo.</p>
                             </div>
                          )}

                          <button 
                            disabled={!isUnlocked || isRedeeming}
                            onClick={() => handleRedeem(reward)}
                            className={`w-full py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                              isUnlocked
                              ? 'bg-orange-600 text-on-surface shadow-lg shadow-orange-100 hover:scale-[1.02] active:scale-[0.98]'
                              : 'bg-neutral-100 text-on-surface-muted cursor-not-allowed'
                            }`}
                          >
                            {isRedeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                              isUnlocked ? '¡Desbloquear Premio!' : (meetsLevel ? `Faltan ${reward.pointsCost - selectedRestaurant.pointsBalance} monedas de oro` : `Aumenta tu nivel primero`)
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
           </div>
          </div>
        )}
      </motion.div>
        )}
      </AnimatePresence>

      {/* Info Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[32px] p-8 text-on-surface relative overflow-hidden shadow-xl shadow-emerald-100">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[32px] flex items-center justify-center border border-white/30 shrink-0">
            <Trophy className="w-10 h-10 text-on-surface" />
          </div>
          <div className="text-center md:text-left">
            <h4 className="text-2xl font-black mb-2">¡Tus compras valen más!</h4>
            <p className="text-emerald-50 text-sm font-medium leading-relaxed max-w-md">
              Cada pedido que realizas en tus restaurantes favoritos acumula monedas de oro automáticamente. 
              ¡Canjéalos por platos gratis o descuentos exclusivos!
            </p>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles className="w-32 h-32" />
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-[32px] p-8 border border-neutral-100 shadow-sm mt-8">
        <h4 className="text-xl font-black text-neutral-900 mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" />
          Historial del Baúl de Monedas de Oro
        </h4>
        
        {transactions.length === 0 ? (
          <div className="py-12 text-center bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
             <p className="text-on-surface-muted font-bold text-sm">Aún no tienes movimientos de monedas de oro.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 8).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100/50 hover:bg-neutral-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl flex items-center justify-center ${t.type === 'earned' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {t.type === 'earned' ? '✨' : '🎁'}
                  </div>
                  <div>
                    <p className="font-bold text-neutral-900 text-sm leading-none mb-1">{t.description}</p>
                    <p className="text-[10px] text-on-surface-muted font-black uppercase tracking-widest">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className={`font-black text-sm px-3 py-1 rounded-lg ${t.type === 'earned' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {t.type === 'earned' ? '+' : '-'}{t.points} 🪙
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
