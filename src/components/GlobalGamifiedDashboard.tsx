import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Trophy, Target, Star, Gift, CheckCircle2, Award, 
  Zap, ChevronRight, Activity, Wallet, TrendingUp, Gem, Crown, 
  Hexagon, RefreshCcw, ShoppingBag, Flame, CreditCard, Sparkles, CheckCircle, Pizza, Store, Gamepad2, Utensils
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../store/db';
import { LoyaltyTransaction } from '../store/db';
import { toast } from 'sonner';
import { GoldCoinIcon } from './GoldCoinIcon';

interface GlobalGamifiedDashboardProps {
  loyaltyPoints: number;
  loyaltyTransactions: LoyaltyTransaction[];
  initialTab?: 'program' | 'wheel' | 'levels' | 'tasks';
}

export const GlobalGamifiedDashboard: React.FC<GlobalGamifiedDashboardProps> = ({
  loyaltyPoints,
  loyaltyTransactions,
  initialTab = 'program'
}) => {
  const { user, appUser } = useAuth();
  
  // Real-time states for custom gamification
  const [userLevel, setUserLevel] = useState<number>(1);
  const [userXP, setUserXP] = useState<number>(0);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  
  const [dailyTasks, setDailyTasks] = useState<any[]>([]);
  const [weeklyMissions, setWeeklyMissions] = useState<any[]>([]);
  const [wheelPrizes, setWheelPrizes] = useState<any[]>([]);
  const [selectedDayTab, setSelectedDayTab] = useState<number>(new Date().getDay());
  const [activeInnerTab, setActiveInnerTab] = useState<'program' | 'wheel' | 'levels' | 'tasks'>(initialTab);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActiveInnerTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    fetchGamificationData();
  }, [user]);

  const fetchGamificationData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch live user progression
      const userProgress = await db.getUserGamification(user.id);
      setUserLevel(userProgress.level || 1);
      setUserXP(userProgress.xp || 0);
      setCompletedTaskIds(userProgress.completedTasks || []);

      // 2. Fetch live settings and published tasks/missions
      const settings = await db.getPlatformSettings();
      const gamSettings = settings?.gamificationSettings || { dailyTasks: [], weeklyMissions: [] };
      
      // Filter only published ones
      const publishedDailies = (gamSettings.dailyTasks || []).filter((t: any) => t.isPublished !== false);
      const publishedWeeklies = (gamSettings.weeklyMissions || []).filter((m: any) => m.isPublished !== false);

      setDailyTasks(publishedDailies);
      setWeeklyMissions(publishedWeeklies);

      // 3. Fetch wheel prizes
      const prizes = await db.getUserWheelPrizes(user.id);
      setWheelPrizes(prizes || []);

    } catch (err) {
      console.error("Error fetching gamification elements", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (task: any) => {
    if (!user) return;
    if (completedTaskIds.includes(task.id)) {
      toast.info("Ya completaste esta misión el día de hoy.");
      return;
    }

    try {
      const rewardPoints = task.xpReward || task.pointsReward || 15;
      const res = await db.completeGamificationTask(user.id, task.id, rewardPoints);
      
      if (res.error) {
        toast.error("Error al registrar cumplimiento.");
        return;
      }

      toast.success(
        <div className="flex flex-col gap-1 text-neutral-900">
          <p className="font-bold flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-amber-500" /> ¡Misión Completada!</p>
          <p className="text-xs font-semibold">Ganaste +{rewardPoints} XP para tu membresía global.</p>
          {res.levelUpgraded && (
            <p className="text-xs font-black text-purple-700 animate-pulse mt-1">
              🎉 ¡SUBISTE AL NIVEL {res.newLevel}! Se ampliaron tus cupos máximos en el sistema.
            </p>
          )}
        </div>
      );

      // Refresh data
      await fetchGamificationData();
      
    } catch (err) {
      console.error(err);
      toast.error("No se pudo completar la tarea");
    }
  };

  const getTaskIcon = (type: string, title?: string) => {
    const t = title?.toLowerCase() || '';
    if (t.includes('facebook') || t.includes('instagram')) return <Sparkles className="w-5 h-5 text-pink-500" />;
    if (t.includes('favorito') || t.includes('guarda')) return <Star className="w-5 h-5 text-amber-500" />;
    if (t.includes('juega') || t.includes('parqués') || t.includes('parques')) return <Trophy className="w-5 h-5 text-purple-500" />;
    if (t.includes('recompensa') || t.includes('promoción') || t.includes('promocion') || t.includes('bono')) return <Gift className="w-5 h-5 text-emerald-500" />;
    if (t.includes('producto') || t.includes('destacado')) return <Pizza className="w-5 h-5 text-orange-500" />;
    if (t.includes('restaurante')) return <Utensils className="w-5 h-5 text-red-500" />;
    if (t.includes('tienda') || t.includes('visita')) return <Store className="w-5 h-5 text-blue-500" />;
    if (t.includes('ruleta') || t.includes('tirar')) return <Gamepad2 className="w-5 h-5 text-rose-500" />;
    if (t.includes('ranking')) return <Crown className="w-5 h-5 text-yellow-500" />;

    switch (type) {
      case 'order':
      case 'orders_count':
        return <ShoppingBag className="w-5 h-5 text-primary" />;
      case 'review':
      case 'reviews_count':
        return <Star className="w-5 h-5 text-amber-500" />;
      case 'invite':
      case 'invites_count':
        return <Trophy className="w-5 h-5 text-emerald-500" />;
      default:
        return <Flame className="w-5 h-5 text-red-500" />;
    }
  };

  // Levels representations (100 levels)
  const getLevelsList = () => {
    const list = [];
    for (let i = 1; i <= 100; i++) {
      list.push({
        id: `lvl-${i}`,
        level: i,
        name: `Membresía Nivel ${i}`,
        pointsRequired: (i - 1) * 50,
        benefits: [
          `${Math.min(20, Math.floor(i / 10) * 2)}% Descuento Envío`,
          `Asociada a ${5 + Math.floor(i / 5)} restaurantes.`,
          `${20 + Math.floor(i / 3) * 2} enlaces de invitación`
        ]
      });
    }
    return list;
  };

  const levelsList = getLevelsList();
  const currentLvlObj = levelsList.find(l => l.level === userLevel) || levelsList[0];
  const nextLvlObj = levelsList.find(l => l.level === (userLevel + 1));

  // Visual XP progress towards the next level
  const pointsRemaining = nextLvlObj ? (nextLvlObj.pointsRequired - userXP) : 0;
  const xpInCurrentLevel = userXP - currentLvlObj.pointsRequired;
  const progressRatio = nextLvlObj ? (xpInCurrentLevel / 50) * 100 : 100;
  const percentageProgress = Math.max(0, Math.min(100, progressRatio));

  const tabs = [
    { id: 'program', label: 'Estatus Global VIP', icon: Crown },
    { id: 'tasks', label: 'Desafíos Activos', icon: Flame },
    { id: 'levels', label: 'Jerarquía de Niveles (1-100)', icon: Target },
    { id: 'wheel', label: 'Mis Premios Obtenidos', icon: RefreshCcw },
  ] as const;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-32 font-sans overflow-hidden">
      
      {/* 1. Header Card displaying Separate Points warning */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-[2.5rem] p-6 border border-purple-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-purple-500/10 blur-[90px] rounded-full" />
        <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-2xl flex items-center justify-center flex-shrink-0 animate-bounce">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">⭐ Membresías y Monedas de Oro</h3>
            <p className="text-xs text-purple-200/90 leading-relaxed mt-1">
              Los <b>Puntos XP</b> son para subir de nivel global. Son <b>independientes de las Monedas de Oro 🪙</b> que ganas por cada $10.000 en compras. Las monedas se usan para la ruleta y canjes en restaurantes, mientras que el XP desbloquea beneficios permanentes en la plataforma.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Premium Gamification Progress Banner */}
      <motion.div className="relative rounded-[2rem] p-8 md:p-10 text-white overflow-hidden bg-[#0B0B0B] border border-gray-800 golden-glow-module">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-stretch gap-10">
           
           <div className="flex-1 w-full text-center md:text-left flex flex-col justify-center">
             <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
               <div className="bg-purple-500/10 border border-purple-500/30 px-4 py-1.5 rounded-full flex items-center gap-2">
                 <Crown className="w-4 h-4 text-purple-400 glow-text" />
                 <span className="text-xs font-bold tracking-widest text-purple-400 uppercase">Miembro Elite - Nivel {userLevel}</span>
               </div>
             </div>
             
             <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-2 text-white drop-shadow-md">
                Tus Consumos y <span className="text-purple-500 glow-text">XP Global</span>
             </h2>
             <p className="text-sm text-white/70 max-w-md mt-1 leading-normal">
                Completa misiones patrocinadas en toda la plataforma para optimizar tu estatus de usuario y adquirir mejores condiciones automáticas.
             </p>

             {/* Progress Bar representation */}
             <div className="mt-8 relative w-full max-w-xl">
                 <div className="flex justify-between items-end mb-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-white/70 tracking-widest mb-1">XP Total Acumulada</p>
                      <div className="text-3xl font-light tracking-tight font-mono text-white glow-text">{userXP} <span className="text-sm font-semibold text-primary font-sans">XP</span></div>
                    </div>
                    {nextLvlObj && (
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase text-white/70 tracking-widest mb-1">Nivel {userLevel + 1} Reclimable</p>
                        <div className="text-lg font-light tracking-tight font-mono text-white">{nextLvlObj.pointsRequired} <span className="text-xs font-semibold text-white/70 font-sans">XP</span></div>
                      </div>
                    )}
                 </div>
                 {nextLvlObj ? (
                    <div className="space-y-2">
                      <div className="relative h-3.5 bg-gray-800 rounded-full overflow-hidden shadow-inner border border-gray-700">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentageProgress}%` }}
                          transition={{ duration: 1.2, ease: 'easeOut' }}
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 to-indigo-600 opacity-90 shadow-[0_0_15px_rgba(156,39,176,0.5)] rounded-full"
                        />
                      </div>
                      <p className="text-[10px] text-white/70 font-bold font-mono">Faltan {pointsRemaining} XP para alcanzar el Nivel {userLevel + 1}</p>
                    </div>
                 ) : (
                    <div className="inline-flex flex-col items-center justify-center w-full bg-primary/10 border border-primary/20 rounded-xl py-3">
                       <Crown className="w-6 h-6 text-gold mb-1 glow-text" />
                       <span className="text-sm font-bold text-gold uppercase tracking-widest">Nivel Máximo Elite Alcanzado (Nivel 100)</span>
                    </div>
                 )}
             </div>
           </div>

           {/* 3D Black Card Representation */}
           <div className="w-full max-w-[320px] shrink-0 [perspective:1000px] mx-auto md:mx-0">
              <motion.div 
                initial={{ rotateY: -10, rotateX: 10 }}
                whileHover={{ rotateY: 0, rotateX: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="w-full aspect-[1.586/1] rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950 p-6 border border-purple-500/30 shadow-[0_15px_50px_-10px_rgba(156,39,176,0.35)] relative overflow-hidden flex flex-col justify-between cursor-pointer group"
                style={{ transformStyle: 'preserve-3d' }}
              >
                 <div className="absolute top-[-50%] right-[-50%] w-full h-full bg-gradient-to-b from-white/10 to-transparent rotate-45 pointer-events-none group-hover:translate-x-full transition-transform duration-1000" />
                 
                 <div className="flex justify-between items-start z-10 relative">
                   <div className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-white tracking-tighter glow-text">Bite Club Gold</div>
                   <CreditCard className="w-8 h-8 text-on-surface/40" />
                 </div>
                 
                 <div className="flex flex-col gap-3 [transform:translateZ(30px)] mt-auto z-10 relative">
                   <div className="flex justify-between items-end">
                     <div>
                       <p className="text-[9px] text-purple-200 uppercase tracking-widest font-bold mb-1">Socio Embajador</p>
                       <p className="text-xs font-black tracking-widest uppercase text-white truncate max-w-[150px]">
                         {appUser?.displayName || user?.user_metadata?.name || 'TITULAR'}
                       </p>
                     </div>
                     <div className="text-right">
                       <p className="text-[9px] text-purple-200 uppercase tracking-widest font-bold mb-1">Rango Club</p>
                       <p className="text-xs font-black text-purple-300 tracking-wider font-mono uppercase">Nivel {userLevel}</p>
                     </div>
                   </div>
                 </div>
              </motion.div>
           </div>
        </div>
      </motion.div>

      {/* Navigation Tabs as a premium Slide/Swipe Menu */}
      <div className="flex gap-2.5 pb-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] whitespace-nowrap snap-x snap-mandatory flex-nowrap -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
        {tabs.map((tab) => {
           const isActive = activeInnerTab === tab.id;
           return (
             <button
               key={tab.id}
               onClick={() => setActiveInnerTab(tab.id)}
               className={`flex-shrink-0 snap-start flex items-center gap-2 px-5 py-3 rounded-xl font-bold uppercase tracking-widest text-[11px] whitespace-nowrap transition-all border ${
                 isActive 
                 ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-600/20' 
                 : 'bg-surface-variant border-transparent text-on-surface-muted hover:bg-surface-light hover:border-outline'
               }`}
             >
               <tab.icon className="w-4 h-4" />
               {tab.label}
             </button>
           );
        })}
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeInnerTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeInnerTab === 'program' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 space-y-6">
                 {/* Promociones e Incentivos Activos */}
                 <div className="bg-[#0B0B0B] p-8 border border-gray-800 relative overflow-hidden golden-glow-module rounded-[2rem]">
                    <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                       <Crown className="w-5 h-5 text-purple-500" />
                       Tus Beneficios Activos del Nivel {userLevel}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="bg-surface-base p-5 rounded-2xl border border-outline transition-all">
                          <span className="font-mono text-[9px] uppercase font-black text-purple-600 bg-purple-100 px-2 py-1 rounded-lg">Asociación de Negociación</span>
                          <h4 className="font-bold text-on-surface mt-2 mb-1">Cupo de Restaurantes</h4>
                          <p className="text-xs text-on-surface-muted">Puedes afiliarte a <b>{5 + Math.floor(userLevel / 5)}</b> restaurantes de la plataforma.</p>
                       </div>
                       <div className="bg-surface-base p-5 rounded-2xl border border-outline transition-all">
                          <span className="font-mono text-[9px] uppercase font-black text-indigo-600 bg-indigo-100 px-2 py-1 rounded-lg">Estadísticas Programadas</span>
                          <h4 className="font-bold text-on-surface mt-2 mb-1">Cupo de Enlaces</h4>
                          <p className="text-xs text-on-surface-muted">Tienes permitido registrar <b>{20 + Math.floor(userLevel / 3) * 2}</b> enlaces de invitaciones únicas.</p>
                       </div>
                       <div className="bg-surface-base p-5 rounded-2xl border border-outline transition-all">
                          <span className="font-mono text-[9px] uppercase font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">Descuento Global</span>
                          <h4 className="font-bold text-on-surface mt-2 mb-1">Descuento del Club</h4>
                          <p className="text-xs text-on-surface-muted">Tu nivel cuenta con <b>{Math.min(20, Math.floor(userLevel / 10) * 2)}%</b> de descuento real en toda la plataforma.</p>
                       </div>
                       <div className="bg-surface-base p-5 rounded-2xl border border-outline transition-all">
                          <span className="font-mono text-[9px] uppercase font-black text-amber-600 bg-amber-100 px-2 py-1 rounded-lg">Acceso Total</span>
                          <h4 className="font-bold text-on-surface mt-2 mb-1">Soporte Directo</h4>
                          <p className="text-xs text-on-surface-muted">Soporte prioritario 24/7 disponible directamente en tu panel VIP.</p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                <div className="bg-[#0B0B0B] p-6 border border-gray-800 hover:border-purple-500/30 transition-all golden-glow-module rounded-[1.5rem]">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-bold text-white text-sm">Resumen Transacciones</h4>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Últimos movimientos</span>
                  </div>
                  <div className="space-y-4">
                    {loyaltyTransactions.length > 0 ? (
                      loyaltyTransactions.slice(0,5).map((t) => (
                        <div key={t.id} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex flex-shrink-0 items-center justify-center border ${t.type === 'earned' ? 'bg-purple-600/10 border-purple-500/20 text-purple-500' : 'bg-gray-800 border-gray-700 text-white/70'}`}>
                            {t.type === 'earned' ? '+' : '-'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white text-xs truncate mb-0.5">{t.description}</p>
                            <p className="text-[10px] text-white/50 font-mono">{new Date(t.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="font-mono font-bold text-sm text-white">
                            {t.type === 'earned' ? '+' : '-'}{t.points}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 flex flex-col items-center justify-center text-center">
                        <Activity className="w-8 h-8 text-on-surface-muted mb-2 animate-pulse" />
                        <p className="text-xs font-medium text-white/70">Sin movimientos recientes</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeInnerTab === 'tasks' && (
            <div className="space-y-8">
              {/* Daily Tasks Title */}
              <div className="bg-[#0B0B0B] p-6 border border-gray-800 golden-glow-module rounded-[1.5rem]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-purple-600 animate-pulse" />
                    Misiones y Tareas Diarias Publicadas
                  </h3>
                  <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full sm:w-auto bg-gray-800/80 p-1 rounded-2xl border border-gray-700">
                    {[
                      { id: 1, label: 'Lun' },
                      { id: 2, label: 'Mar' },
                      { id: 3, label: 'Mié' },
                      { id: 4, label: 'Jue' },
                      { id: 5, label: 'Vie' },
                      { id: 6, label: 'Sáb' },
                      { id: 0, label: 'Dom' },
                      { id: 7, label: 'Todos' }
                    ].map(day => (
                      <button
                        key={day.id}
                        onClick={() => setSelectedDayTab(day.id)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                          selectedDayTab === day.id
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {dailyTasks.filter((t: any) => t.dayOfWeek === selectedDayTab || (t.dayOfWeek === undefined && selectedDayTab === 1) || selectedDayTab === 7).length === 0 ? (
                  <div className="text-center py-8 text-white/70 text-sm font-semibold border border-gray-700 border-dashed rounded-2xl bg-gray-800/50">
                    No hay tareas para hoy. ¡Vuelve mañana para nuevos retos de la comunidad!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dailyTasks.filter((t: any) => t.dayOfWeek === selectedDayTab || (t.dayOfWeek === undefined && selectedDayTab === 1) || selectedDayTab === 7).map((task) => {
                      const isCompleted = completedTaskIds.includes(task.id);
                      return (
                        <div key={task.id} className={`p-6 rounded-2xl border transition-all flex flex-col justify-between bg-surface-base ${isCompleted ? 'border-emerald-500/50' : 'border-outline hover:border-purple-500/50'}`}>
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-10 h-10 shrink-0 bg-surface-variant border border-outline text-on-surface rounded-xl flex items-center justify-center shadow-sm">
                                {getTaskIcon(task.type, task.title)}
                              </div>
                              <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg tracking-widest ${isCompleted ? 'bg-emerald-500/10 text-emerald-500' : 'bg-surface-variant text-on-surface-muted'}`}>
                                {isCompleted ? '✓ Completado' : 'Pendiente'}
                              </span>
                            </div>
                            <h4 className="font-black text-on-surface text-sm mb-1">{task.title}</h4>
                            <p className="text-xs text-on-surface-muted leading-relaxed line-clamp-3 mb-4">{task.description}</p>
                          </div>
                          
                          <div className="pt-4 border-t border-outline border-dashed">
                            {isCompleted ? (
                              <button disabled className="w-full bg-emerald-500/10 text-emerald-500 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Completada (+{task.xpReward} XP ganados)
                              </button>
                            ) : (
                              <button
                                onClick={() => handleCompleteTask(task)}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-purple-600/10 flex items-center justify-center gap-1.5"
                              >
                                Completar Misión (+{task.xpReward} XP)
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Weekly Missions Tile */}
              <div className="glass-card p-6 border border-outline">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black tracking-tight text-on-surface flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary animate-bounce" />
                    Misiones Semanales de Temporada
                  </h3>
                  <span className="text-xs bg-indigo-500/10 text-primary border border-indigo-500/20 px-3 py-1 rounded-full font-black uppercase tracking-wider font-mono">Semanal</span>
                </div>
                
                {weeklyMissions.length === 0 ? (
                  <div className="text-center py-8 text-on-surface-muted text-sm font-semibold border border-outline border-dashed rounded-2xl bg-surface-variant/20">
                    No hay misiones semanales en esta temporada. ¡Vuelve el fin de semana!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {weeklyMissions.map((task) => {
                      const isCompleted = completedTaskIds.includes(task.id);
                      return (
                        <div key={task.id} className={`p-6 rounded-2xl border transition-all flex flex-col justify-between bg-surface-base ${isCompleted ? 'border-emerald-500/50' : 'border-outline hover:border-indigo-500/50'}`}>
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-10 h-10 shrink-0 bg-surface-variant border border-outline text-on-surface rounded-xl flex items-center justify-center shadow-sm">
                                {getTaskIcon(task.type, task.title)}
                              </div>
                              <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg tracking-widest ${isCompleted ? 'bg-emerald-500/10 text-emerald-500' : 'bg-surface-variant text-on-surface-muted'}`}>
                                {isCompleted ? '✓ Completado' : 'Pendiente'}
                              </span>
                            </div>
                            <h4 className="font-black text-on-surface text-sm mb-1">{task.title}</h4>
                            <p className="text-xs text-on-surface-muted leading-relaxed line-clamp-3 mb-4">{task.description}</p>
                          </div>
                          
                          <div className="pt-4 border-t border-outline border-dashed">
                            {isCompleted ? (
                              <button disabled className="w-full bg-emerald-500/10 text-emerald-500 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Completada (+{task.xpReward} XP ganados)
                              </button>
                            ) : (
                              <button
                                onClick={() => handleCompleteTask(task)}
                                className="w-full bg-primary hover:bg-primary-dark text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5"
                              >
                                Completar Misión (+{task.xpReward} XP)
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeInnerTab === 'levels' && (
            <motion.div className="glass-card p-6 md:p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-black tracking-tight text-on-surface flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-500" />
                    Jerarquía de Membresías Oro (Niveles 1 al 100)
                  </h3>
                  <p className="text-xs text-on-surface-muted mt-1">Conoce qué recompensas permanentes obtienes al progresar en los niveles con XP.</p>
                </div>
              </div>
              
              <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 snap-x group">
                 {levelsList.slice(0, 100).map((lvl, idx) => {
                    const isCurrent = userLevel === lvl.level;
                    const isUnlocked = userLevel >= lvl.level;
                    
                    return (
                      <div key={lvl.id} className={`relative p-5 rounded-[2rem] border flex flex-col items-center text-center transition-all min-w-[170px] flex-shrink-0 snap-start bg-surface-base ${isCurrent ? 'border-purple-500 ring-2 ring-purple-500/50 shadow-[0_0_20px_rgba(156,39,176,0.25)]' : (isUnlocked ? 'border-outline hover:border-purple-300' : 'border-outline/50 opacity-40 grayscale')}`}>
                         {isCurrent && (
                           <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-[8px] uppercase font-black tracking-widest px-3 py-1 rounded-full whitespace-nowrap text-white">
                             Tu Rango
                           </div>
                         )}
                         <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl mb-4 ${isCurrent ? 'bg-purple-100 border-2 border-purple-500 text-purple-600' : (isUnlocked ? 'bg-surface-variant border border-outline text-on-surface' : 'bg-surface-variant text-gray-300')}`}>
                           {isCurrent ? <Crown className="w-6 h-6 text-purple-600" /> : <Star className="w-5 h-5 text-on-surface-muted" />}
                         </div>
                         <h4 className={`font-black text-xs mb-1 uppercase tracking-widest ${isCurrent ? 'text-purple-600 font-black' : 'text-on-surface'}`}>Nivel {lvl.level}</h4>
                         <p className="text-[9px] font-bold text-on-surface-muted font-mono mb-4">{(lvl.level - 1) * 50} XP REQ</p>
                         
                         <div className={`mt-auto px-2 py-2 rounded-xl flex flex-col gap-1 items-center justify-center w-full min-h-[60px] ${isCurrent ? 'bg-purple-50 text-purple-700' : 'bg-surface-variant text-on-surface-muted'}`}>
                           {lvl.benefits.map((benefit: string, i: number) => (
                              <span key={i} className="text-[9px] font-bold whitespace-normal leading-tight text-center">{benefit}</span>
                           ))}
                         </div>
                      </div>
                    );
                 })}
              </div>
            </motion.div>
          )}

          {activeInnerTab === 'wheel' && (
            <div className="glass-card p-8 md:p-10 min-h-[400px]">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center">
                  <Gift className="w-6 h-6 text-purple-400 glow-text" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-on-surface font-sans">Mi Baúl de Premios y Sorpresas 🎡</h3>
                  <p className="text-sm text-on-surface-muted font-medium">Recompensas que has ganado en la ruleta de compra.</p>
                </div>
              </div>

              {wheelPrizes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                   <div className="w-16 h-16 bg-surface-base border border-outline rounded-full flex items-center justify-center mb-4">
                      <RefreshCcw className="w-8 h-8 text-gray-300 animate-spin-slow" />
                   </div>
                   <h4 className="font-bold text-on-surface">Aún no hay premios</h4>
                   <p className="text-sm text-on-surface-muted mt-1 max-w-xs">Participa en la ruleta de tus restaurantes para ganar.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-sans">
                   {wheelPrizes.map((prize) => (
                      <div key={prize.id} className="p-5 rounded-2xl border border-outline bg-surface-base hover:border-purple-500/50 transition-all group">
                         <div className="flex items-center gap-4 mb-3">
                            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-600">
                               <Gift className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                               <p className="font-bold text-on-surface truncate text-sm">{prize.prizeText}</p>
                               <p className="text-[10px] text-on-surface-muted uppercase font-black tracking-widest">{prize.restaurantName || 'Global'}</p>
                            </div>
                         </div>
                         <div className="flex items-center justify-between mt-4 pt-4 border-t border-outline">
                            <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg ${prize.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-surface-variant text-on-surface-muted'}`}>
                               {prize.status === 'delivered' ? 'Canjeado' : 'Pendiente'}
                            </span>
                            <span className="text-[10px] text-on-surface-muted font-mono">{new Date(prize.createdAt).toLocaleDateString()}</span>
                         </div>
                      </div>
                   ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};
