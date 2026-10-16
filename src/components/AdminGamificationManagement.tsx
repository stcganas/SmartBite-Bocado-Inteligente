import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Star, Calendar, Target, Plus, Trash2, 
  Save, Eye, EyeOff, LayoutList, Medal, Award,
  ListTodo, Sparkles, PlusCircle, CheckCircle2, ChevronRight,
  Gift, Clock, Check, User, RefreshCcw, UploadCloud,
  Crown, Search, Filter, ArrowUpDown, Flame, ShoppingBag,
  ExternalLink, X, ChevronDown, CheckCircle, ShieldAlert
} from 'lucide-react';
import { db } from '../store/db';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { RuletaPay } from './RuletaPay';
import { GoldCoinIcon } from './GoldCoinIcon';
import { formatImageUrl } from '../lib/utils';
import { TopUsersChart } from './TopUsersChart';

interface DailyTask {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  type: 'order' | 'review' | 'invite' | 'profile' | 'custom';
  targetCount: number;
  dayOfWeek: number; // 0=Domingo, 1=Lunes, 2=Martes... 6=Sabado, o 7=Todos
  isPublished: boolean;
  createdAt: string;
}

interface WeeklyMission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  type: 'orders_count' | 'reviews_count' | 'invites_count' | 'custom';
  targetCount: number;
  isPublished: boolean;
  createdAt: string;
}

export const AdminGamificationManagement: React.FC = () => {
  const [platformSettings, setPlatformSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUploadingBoard, setIsUploadingBoard] = useState(false);
  const boardFileInputRef = useRef<HTMLInputElement>(null);
  const [activeSubTab, setActiveSubTab] = useState<'daily' | 'weekly' | 'levels' | 'ranking' | 'ruleta_pay' | 'ruleta_prizes' | 'parchis'>('daily');
  
  const [allPlatformPrizes, setAllPlatformPrizes] = useState<any[]>([]);
  const [prizesLoading, setPrizesLoading] = useState(false);

  // Tracking and Ranking states
  const [rankingUsers, setRankingUsers] = useState<any[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevelRange, setFilterLevelRange] = useState<'all' | '1-5' | '6-20' | '21-50' | '51+'>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'xp' | 'level' | 'tasks' | 'orders' | 'rating' | 'coins'>('xp');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);
  const [grantingXPUserId, setGrantingXPUserId] = useState<string | null>(null);
  const [xpToGrant, setXpToGrant] = useState<number>(50);
  const [isGranting, setIsGranting] = useState(false);

  // Input states for new daily task
  const [newDaily, setNewDaily] = useState({
    title: '',
    description: '',
    xpReward: 10,
    type: 'custom' as DailyTask['type'],
    targetCount: 1,
    dayOfWeek: new Date().getDay(),
  });
  const [editingDailyId, setEditingDailyId] = useState<string | null>(null);

  const [selectedDayTab, setSelectedDayTab] = useState<number>(new Date().getDay());

  // Input states for new weekly mission

  const [newWeekly, setNewWeekly] = useState({
    title: '',
    description: '',
    xpReward: 40,
    type: 'custom' as WeeklyMission['type'],
    targetCount: 3,
  });
  const [editingWeeklyId, setEditingWeeklyId] = useState<string | null>(null);

  useEffect(() => {
    fetchGamificationSettings();
  }, []);

  const fetchGamificationSettings = async () => {
    setLoading(true);
    try {
      const settings = await db.getPlatformSettings();
      setPlatformSettings(settings);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar la configuración de gamificación');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPlatformPrizes = async () => {
    setPrizesLoading(true);
    try {
      const data = await db.getAllPlatformWheelPrizes();
      setAllPlatformPrizes(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar la lista de premios de la ruleta');
    } finally {
      setPrizesLoading(false);
    }
  };

  const handleApprovePrize = async (prizeId: string) => {
    try {
      await db.updateWheelPrizeStatus(prizeId, 'delivered');
      toast.success('¡Premio aprobado y entregado con éxito!');
      fetchAllPlatformPrizes();
    } catch (err) {
      console.error(err);
      toast.error('No se pudo actualizar el estado del premio.');
    }
  };

  useEffect(() => {
    if (activeSubTab === 'ruleta_prizes') {
      fetchAllPlatformPrizes();
    }
    if (activeSubTab === 'ranking') {
      fetchRankingData();
    }
  }, [activeSubTab]);

  const fetchRankingData = async () => {
    setRankingLoading(true);
    try {
      const users = await db.getAppUsers().catch(() => []);
      
      let reviewsData: any[] = [];
      try {
        const { data } = await supabase.from('reviews').select('user_id, rating');
        reviewsData = data || [];
      } catch (e) {
        console.warn('Reviews fetch failed', e);
      }

      let ordersData: any[] = [];
      try {
        const { data } = await supabase.from('orders').select('id, customer_id, total, status');
        ordersData = data || [];
      } catch (e) {
        console.warn('Orders fetch failed', e);
      }

      let pointsData: any[] = [];
      try {
        const { data } = await supabase.from('loyalty_points').select('user_id, points_balance');
        pointsData = data || [];
      } catch (e) {
        console.warn('Loyalty points fetch failed', e);
      }

      // Map reviews by user_id
      const reviewsByUser: Record<string, { count: number; totalRating: number }> = {};
      reviewsData.forEach((r: any) => {
        if (!r.user_id) return;
        if (!reviewsByUser[r.user_id]) reviewsByUser[r.user_id] = { count: 0, totalRating: 0 };
        reviewsByUser[r.user_id].count += 1;
        reviewsByUser[r.user_id].totalRating += Number(r.rating) || 0;
      });

      // Map orders by customer_id
      const ordersByUser: Record<string, { count: number; totalSpent: number }> = {};
      ordersData.forEach((o: any) => {
        if (!o.customer_id) return;
        if (!ordersByUser[o.customer_id]) ordersByUser[o.customer_id] = { count: 0, totalSpent: 0 };
        if (o.status !== 'cancelled' && o.status !== 'rejected') {
          ordersByUser[o.customer_id].count += 1;
          ordersByUser[o.customer_id].totalSpent += Number(o.total) || 0;
        }
      });

      // Map points by user_id
      const pointsByUser: Record<string, number> = {};
      pointsData.forEach((p: any) => {
        if (p.user_id) {
          pointsByUser[p.user_id] = (pointsByUser[p.user_id] || 0) + (Number(p.points_balance) || 0);
        }
      });

      // Transform users with gamification stats
      const formattedUsers = (users || []).map((u: any) => {
        const gameObj = (u.anniversaries || []).find((item: any) => item.type === 'gamification');
        const level = Math.max(1, Number(gameObj?.level) || 1);
        const xp = Math.max(0, Number(gameObj?.xp) || 0);
        const completedTasks: string[] = Array.isArray(gameObj?.completedTasks) ? gameObj.completedTasks : [];
        const userReviews = reviewsByUser[u.id] || { count: 0, totalRating: 0 };
        const avgRating = userReviews.count > 0 ? (userReviews.totalRating / userReviews.count) : 0;
        const userOrders = ordersByUser[u.id] || { count: 0, totalSpent: 0 };
        const goldCoins = pointsByUser[u.id] || 0;

        return {
          id: u.id,
          displayName: u.displayName || u.email?.split('@')[0] || 'Usuario',
          email: u.email || 'Sin correo',
          phone: u.phone || '',
          role: u.role || 'user',
          status: u.status || 'active',
          createdAt: u.createdAt,
          avatarUrl: u.avatarUrl,
          level,
          xp,
          completedTasks,
          completedTasksCount: completedTasks.length,
          ordersCount: userOrders.count,
          totalSpent: userOrders.totalSpent,
          reviewsCount: userReviews.count,
          avgRating: Number(avgRating.toFixed(1)),
          goldCoins,
          lastGamificationUpdate: gameObj?.updatedAt || null,
        };
      });

      setRankingUsers(formattedUsers);
    } catch (err) {
      console.error("Error loading ranking data:", err);
      toast.error("Error al cargar datos del ranking");
    } finally {
      setRankingLoading(false);
    }
  };

  const handleGrantXP = async (userId: string, amount: number) => {
    if (!amount || amount <= 0) {
      toast.error("Ingresa una cantidad válida de XP");
      return;
    }
    setIsGranting(true);
    try {
      const res = await db.updateUserXP(userId, amount);
      if (res.error) throw res.error;
      toast.success(`¡Se han otorgado +${amount} XP exitosamente! ${res.levelUpgraded ? `(¡Subió al Nivel ${res.newLevel}!)` : ''}`);
      setGrantingXPUserId(null);
      fetchRankingData();
    } catch (err) {
      console.error("Error granting XP:", err);
      toast.error("No se pudo otorgar los puntos XP");
    } finally {
      setIsGranting(false);
    }
  };

  const saveSettings = async (updatedSettings: any) => {
    setSaving(true);
    try {
      await db.updatePlatformSettings(updatedSettings);
      setPlatformSettings(updatedSettings);
      toast.success('Configuración guardada exitosamente');
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDailyTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDaily.title.trim() || !newDaily.description.trim()) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    const currentGamification = platformSettings?.gamificationSettings || {
      dailyTasks: [],
      weeklyMissions: [],
    };

    let updatedTasks = [...(currentGamification.dailyTasks || [])];

    if (editingDailyId) {
      updatedTasks = updatedTasks.map(t => 
        t.id === editingDailyId 
          ? {
              ...t,
              title: newDaily.title,
              description: newDaily.description,
              xpReward: Number(newDaily.xpReward) || 10,
              type: newDaily.type,
              targetCount: Number(newDaily.targetCount) || 1,
              dayOfWeek: Number(newDaily.dayOfWeek),
            } 
          : t
      );
      toast.success('Tarea diaria actualizada');
    } else {
      const newTask: DailyTask = {
        id: 'dt-' + Math.random().toString(36).substr(2, 9),
        title: newDaily.title,
        description: newDaily.description,
        xpReward: Number(newDaily.xpReward) || 10,
        type: newDaily.type,
        targetCount: Number(newDaily.targetCount) || 1,
        dayOfWeek: Number(newDaily.dayOfWeek),
        isPublished: true,
        createdAt: new Date().toISOString(),
      };
      updatedTasks.push(newTask);
      toast.success('Tarea diaria creada');
    }

    const updatedGamification = {
      ...currentGamification,
      dailyTasks: updatedTasks
    };

    const updatedSettings = {
      ...platformSettings,
      gamificationSettings: updatedGamification
    };

    await saveSettings(updatedSettings);
    
    // Reset form
    setNewDaily({
      title: '',
      description: '',
      xpReward: 10,
      type: 'custom',
      targetCount: 1,
      dayOfWeek: new Date().getDay(),
    });
    setEditingDailyId(null);
  };

  const handleEditDaily = (task: DailyTask) => {
    setNewDaily({
      title: task.title,
      description: task.description,
      xpReward: task.xpReward,
      type: task.type,
      targetCount: task.targetCount,
      dayOfWeek: task.dayOfWeek || 1,
    });
    setEditingDailyId(task.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddWeeklyMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeekly.title.trim() || !newWeekly.description.trim()) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    const currentGamification = platformSettings?.gamificationSettings || {
      dailyTasks: [],
      weeklyMissions: [],
    };

    let updatedMissions = [...(currentGamification.weeklyMissions || [])];

    if (editingWeeklyId) {
      updatedMissions = updatedMissions.map(m => 
        m.id === editingWeeklyId 
          ? {
              ...m,
              title: newWeekly.title,
              description: newWeekly.description,
              xpReward: Number(newWeekly.xpReward) || 40,
              type: newWeekly.type,
              targetCount: Number(newWeekly.targetCount) || 1,
            } 
          : m
      );
      toast.success('Misión semanal actualizada');
    } else {
      const newMis: WeeklyMission = {
        id: 'wm-' + Math.random().toString(36).substr(2, 9),
        title: newWeekly.title,
        description: newWeekly.description,
        xpReward: Number(newWeekly.xpReward) || 40,
        type: newWeekly.type,
        targetCount: Number(newWeekly.targetCount) || 1,
        isPublished: true,
        createdAt: new Date().toISOString(),
      };
      updatedMissions.push(newMis);
      toast.success('Misión semanal creada');
    }

    const updatedGamification = {
      ...currentGamification,
      weeklyMissions: updatedMissions
    };

    const updatedSettings = {
      ...platformSettings,
      gamificationSettings: updatedGamification
    };

    await saveSettings(updatedSettings);
    
    // Reset form
    setNewWeekly({
      title: '',
      description: '',
      xpReward: 40,
      type: 'custom',
      targetCount: 3,
    });
    setEditingWeeklyId(null);
  };

  const handleEditWeekly = (mission: WeeklyMission) => {
    setNewWeekly({
      title: mission.title,
      description: mission.description,
      xpReward: mission.xpReward,
      type: mission.type,
      targetCount: mission.targetCount,
    });
    setEditingWeeklyId(mission.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleDailyPublish = async (id: string) => {
    if (!platformSettings) return;
    const currentGamification = platformSettings.gamificationSettings || { dailyTasks: [], weeklyMissions: [] };
    
    const updatedTasks = (currentGamification.dailyTasks || []).map((t: any) => 
      t.id === id ? { ...t, isPublished: !t.isPublished } : t
    );

    const updatedSettings = {
      ...platformSettings,
      gamificationSettings: {
        ...currentGamification,
        dailyTasks: updatedTasks
      }
    };

    await saveSettings(updatedSettings);
  };

  const handleToggleWeeklyPublish = async (id: string) => {
    if (!platformSettings) return;
    const currentGamification = platformSettings.gamificationSettings || { dailyTasks: [], weeklyMissions: [] };
    
    const updatedMissions = (currentGamification.weeklyMissions || []).map((m: any) => 
      m.id === id ? { ...m, isPublished: !m.isPublished } : m
    );

    const updatedSettings = {
      ...platformSettings,
      gamificationSettings: {
        ...currentGamification,
        weeklyMissions: updatedMissions
      }
    };

    await saveSettings(updatedSettings);
  };

  const handleDeleteDaily = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta tarea diaria?')) return;
    if (!platformSettings) return;
    const currentGamification = platformSettings.gamificationSettings || { dailyTasks: [], weeklyMissions: [] };
    
    const updatedTasks = (currentGamification.dailyTasks || []).filter((t: any) => t.id !== id);

    const updatedSettings = {
      ...platformSettings,
      gamificationSettings: {
        ...currentGamification,
        dailyTasks: updatedTasks
      }
    };

    await saveSettings(updatedSettings);
  };

  const handleDeleteWeekly = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta misión semanal?')) return;
    if (!platformSettings) return;
    const currentGamification = platformSettings.gamificationSettings || { dailyTasks: [], weeklyMissions: [] };
    
    const updatedMissions = (currentGamification.weeklyMissions || []).filter((m: any) => m.id !== id);

    const updatedSettings = {
      ...platformSettings,
      gamificationSettings: {
        ...currentGamification,
        weeklyMissions: updatedMissions
      }
    };

    await saveSettings(updatedSettings);
  };

  // Pre-generate helper representation for 100 levels
  const getLevelsArray = () => {
    const arr = [];
    for (let i = 1; i <= 100; i++) {
      arr.push({
        level: i,
        xpRequired: 50,
        rewards: {
          discountPercentage: Math.min(20, Math.floor(i / 10) * 2), // max 20%
          extraAffiliationSpots: Math.floor(i / 5), // +1 spot every 5 levels
          extraInviteLinkSpots: Math.floor(i / 3) * 2, // +2 spots every 3 levels
        }
      });
    }
    return arr;
  };

  const dailyTasks = platformSettings?.gamificationSettings?.dailyTasks || [];
  const weeklyMissions = platformSettings?.gamificationSettings?.weeklyMissions || [];
  const levels = getLevelsArray();

  const getTaskInfo = (taskId: string) => {
    const daily = dailyTasks.find((t: any) => t.id === taskId);
    if (daily) return { title: daily.title, type: 'Diaria' as const, xp: daily.xpReward, description: daily.description };
    const weekly = weeklyMissions.find((m: any) => m.id === taskId);
    if (weekly) return { title: weekly.title, type: 'Semanal' as const, xp: weekly.xpReward, description: weekly.description };
    return { title: taskId, type: 'Personalizada' as const, xp: 0, description: 'Desafío completado por el usuario' };
  };

  const getLevelBadge = (level: number) => {
    if (level >= 75) return { name: 'Mítico Legendario', color: 'bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-purple-500/20 text-amber-400 border-amber-500/30' };
    if (level >= 50) return { name: 'Diamante Élite', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' };
    if (level >= 25) return { name: 'Platino Maestro', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' };
    if (level >= 10) return { name: 'Oro Experto', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
    if (level >= 5) return { name: 'Plata Avanzado', color: 'bg-slate-400/15 text-slate-300 border-slate-400/30' };
    return { name: 'Bronce Explorador', color: 'bg-amber-700/15 text-amber-600 border-amber-700/30' };
  };

  const filteredAndSortedUsers = React.useMemo(() => {
    let result = [...rankingUsers];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u => 
        u.displayName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q)
      );
    }

    // Filter by level range
    if (filterLevelRange === '1-5') result = result.filter(u => u.level <= 5);
    else if (filterLevelRange === '6-20') result = result.filter(u => u.level >= 6 && u.level <= 20);
    else if (filterLevelRange === '21-50') result = result.filter(u => u.level >= 21 && u.level <= 50);
    else if (filterLevelRange === '51+') result = result.filter(u => u.level >= 51);

    // Filter by role
    if (filterRole !== 'all') {
      result = result.filter(u => u.role === filterRole);
    }

    // Sort
    result.sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortBy === 'xp') {
        valA = a.xp;
        valB = b.xp;
      } else if (sortBy === 'level') {
        valA = a.level;
        valB = b.level;
      } else if (sortBy === 'tasks') {
        valA = a.completedTasksCount;
        valB = b.completedTasksCount;
      } else if (sortBy === 'orders') {
        valA = a.ordersCount;
        valB = b.ordersCount;
      } else if (sortBy === 'rating') {
        valA = a.avgRating;
        valB = b.avgRating;
      } else if (sortBy === 'coins') {
        valA = a.goldCoins;
        valB = b.goldCoins;
      }

      if (sortOrder === 'desc') return valB - valA;
      return valA - valB;
    });

    return result;
  }, [rankingUsers, searchQuery, filterLevelRange, filterRole, sortBy, sortOrder]);

  const topThree = React.useMemo(() => {
    const sorted = [...rankingUsers].sort((a, b) => b.xp - a.xp || b.completedTasksCount - a.completedTasksCount);
    return sorted.slice(0, 3);
  }, [rankingUsers]);

  const totalGamificationUsers = rankingUsers.length;
  const highestLevelUser = React.useMemo(() => {
    if (rankingUsers.length === 0) return null;
    return [...rankingUsers].sort((a, b) => b.level - a.level || b.xp - a.xp)[0];
  }, [rankingUsers]);
  const totalCompletedTasksPlatform = React.useMemo(() => {
    return rankingUsers.reduce((acc, u) => acc + (u.completedTasksCount || 0), 0);
  }, [rankingUsers]);
  const totalXpIssuedPlatform = React.useMemo(() => {
    return rankingUsers.reduce((acc, u) => acc + (u.xp || 0), 0);
  }, [rankingUsers]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Sparkles className="w-12 h-12 text-primary animate-pulse" />
        <p className="text-on-surface-muted font-bold text-sm uppercase tracking-widest">Cargando Sistema de Gamificación...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl w-full px-1 sm:px-0">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-variant p-4 sm:p-6 md:p-8 rounded-3xl border border-outline shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-tr from-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-yellow-500/20 shrink-0">
            <Trophy className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-on-surface tracking-tight">Administración de Gamificación</h2>
            <p className="text-on-surface-muted text-xs sm:text-sm font-medium mt-1">Crea tareas, misiones y supervisa el progreso de 100 niveles de usuarios de la plataforma.</p>
          </div>
        </div>
      </div>

      {/* Navigation Subtabs as a responsive Swipe/Slide Menu */}
      <div className="flex gap-2.5 border-b border-outline pb-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] whitespace-nowrap snap-x snap-mandatory flex-nowrap -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
        <button
          onClick={() => setActiveSubTab('daily')}
          className={`flex-shrink-0 snap-start flex items-center gap-2 px-5 py-3 font-black text-[11px] uppercase tracking-wider transition-all rounded-xl border ${
            activeSubTab === 'daily'
              ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25'
              : 'text-on-surface-muted border-transparent hover:bg-surface-variant'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Tareas Diarias ({dailyTasks.length})
        </button>
        <button
          onClick={() => setActiveSubTab('weekly')}
          className={`flex-shrink-0 snap-start flex items-center gap-2 px-5 py-3 font-black text-[11px] uppercase tracking-wider transition-all rounded-xl border ${
            activeSubTab === 'weekly'
              ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25'
              : 'text-on-surface-muted border-transparent hover:bg-surface-variant'
          }`}
        >
          <Target className="w-4 h-4" />
          Misiones Semanales ({weeklyMissions.length})
        </button>
        <button
          onClick={() => setActiveSubTab('levels')}
          className={`flex-shrink-0 snap-start flex items-center gap-2 px-5 py-3 font-black text-[11px] uppercase tracking-wider transition-all rounded-xl border ${
            activeSubTab === 'levels'
              ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25'
              : 'text-on-surface-muted border-transparent hover:bg-surface-variant'
          }`}
        >
          <Medal className="w-4 h-4" />
          Nivelación Completa (100+)
        </button>
        <button
          onClick={() => setActiveSubTab('ranking')}
          className={`flex-shrink-0 snap-start flex items-center gap-2 px-5 py-3 font-black text-[11px] uppercase tracking-wider transition-all rounded-xl border ${
            activeSubTab === 'ranking'
              ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25'
              : 'text-on-surface-muted border-transparent hover:bg-surface-variant'
          }`}
        >
          <Crown className="w-4 h-4 text-amber-400" />
          Seguimiento y Ranking
          {rankingUsers.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[9px] font-black bg-amber-500/20 text-amber-300 rounded-full border border-amber-400/30">
              {rankingUsers.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('ruleta_pay')}
          className={`flex-shrink-0 snap-start flex items-center gap-2 px-5 py-3 font-black text-[11px] uppercase tracking-wider transition-all rounded-xl border ${
            activeSubTab === 'ruleta_pay'
              ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25'
              : 'text-on-surface-muted border-transparent hover:bg-surface-variant'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Ruleta Pay (Administrar)
        </button>
        <button
          onClick={() => setActiveSubTab('ruleta_prizes')}
          className={`flex-shrink-0 snap-start flex items-center gap-2 px-5 py-3 font-black text-[11px] uppercase tracking-wider transition-all rounded-xl border ${
            activeSubTab === 'ruleta_prizes'
              ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25'
              : 'text-on-surface-muted border-transparent hover:bg-surface-variant'
          }`}
        >
          <Award className="w-4 h-4" />
          Premios Ruleta Pay
          {allPlatformPrizes.filter((p) => p.status === 'pending').length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[9px] font-black bg-purple-600 text-white rounded-full animate-pulse border border-purple-400">
              {allPlatformPrizes.filter((p) => p.status === 'pending').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('parchis')}
          className={`flex-shrink-0 snap-start flex items-center gap-2 px-5 py-3 font-black text-[11px] uppercase tracking-wider transition-all rounded-xl border ${
            activeSubTab === 'parchis'
              ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25'
              : 'text-on-surface-muted border-transparent hover:bg-surface-variant'
          }`}
        >
          <LayoutList className="w-4 h-4" />
          Config. Parchís
        </button>
      </div>

      {/* Tab Area content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          className="space-y-8"
        >
          {activeSubTab === 'daily' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Add form */}
              <div className="bg-surface-base p-6 rounded-3xl border border-outline shadow-sm h-fit">
                <h3 className="text-lg font-black text-on-surface mb-6 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-primary" />
                  {editingDailyId ? 'Editar Tarea Diaria' : 'Nueva Tarea Diaria'}
                </h3>
                <form onSubmit={handleAddDailyTask} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-muted uppercase tracking-wider mb-2">Tema / Título</label>
                    <input
                      type="text"
                      className="w-full bg-surface-variant border border-outline rounded-xl px-4 py-3 font-semibold text-on-surface placeholder-neutral-500 outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Ej. Completa un Pedido"
                      required
                      value={newDaily.title}
                      onChange={e => setNewDaily({ ...newDaily, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-muted uppercase tracking-wider mb-2">Descripción Inteligente</label>
                    <textarea
                      className="w-full bg-surface-variant border border-outline rounded-xl px-4 py-3 font-semibold text-on-surface placeholder-neutral-500 outline-none focus:ring-2 focus:ring-primary h-24 resize-none"
                      placeholder="Ej. Haz tu comida favorita el día de hoy con un pedido exitoso."
                      required
                      value={newDaily.description}
                      onChange={e => setNewDaily({ ...newDaily, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-muted uppercase tracking-wider mb-2">XP Recompensa</label>
                      <input
                        type="number"
                        className="w-full bg-surface-variant border border-outline rounded-xl px-4 py-3 font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary font-mono"
                        min={1}
                        value={newDaily.xpReward}
                        onChange={e => setNewDaily({ ...newDaily, xpReward: parseInt(e.target.value) || 10 })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-muted uppercase tracking-wider mb-2">Meta de Cantidad</label>
                      <input
                        type="number"
                        className="w-full bg-surface-variant border border-outline rounded-xl px-4 py-3 font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary font-mono"
                        min={1}
                        value={newDaily.targetCount}
                        onChange={e => setNewDaily({ ...newDaily, targetCount: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-muted uppercase tracking-wider mb-2">Acción de Detección</label>
                    <select
                      className="w-full bg-surface-variant border border-outline rounded-xl px-4 py-3 font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary"
                      value={newDaily.type}
                      onChange={e => setNewDaily({ ...newDaily, type: e.target.value as any })}
                    >
                      <option value="order">Registrar Pedido Exitoso 🍔</option>
                      <option value="review">Publicar Reseña Estrella ⭐</option>
                      <option value="invite">Invitar Amigo por Link / Código 🤝</option>
                      <option value="profile">Completar Perfil de Usuario 👤</option>
                      <option value="custom">Acciones de Plataforma Personalizadas 📌</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-muted uppercase tracking-wider mb-2">Día de la Semana</label>
                    <select
                      className="w-full bg-surface-variant border border-outline rounded-xl px-4 py-3 font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary"
                      value={newDaily.dayOfWeek}
                      onChange={e => setNewDaily({ ...newDaily, dayOfWeek: parseInt(e.target.value) })}
                    >
                      <option value={1}>Lunes</option>
                      <option value={2}>Martes</option>
                      <option value={3}>Miércoles</option>
                      <option value={4}>Jueves</option>
                      <option value={5}>Viernes</option>
                      <option value={6}>Sábado</option>
                      <option value={0}>Domingo</option>
                      <option value={7}>Todos los días</option>
                    </select>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      {saving ? 'Guardando...' : (editingDailyId ? 'Actualizar Tarea' : 'Publicar Tarea Diaria')}
                    </button>
                    {editingDailyId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDailyId(null);
                          setNewDaily({ title: '', description: '', xpReward: 10, type: 'custom', targetCount: 1, dayOfWeek: 1 });
                        }}
                        className="bg-surface-variant hover:bg-gray-200 text-on-surface-muted font-bold py-3.5 px-4 rounded-xl transition-all"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* List dailies */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-lg font-black text-on-surface flex items-center gap-2">
                    <ListTodo className="w-5 h-5 text-primary" />
                    Listado de Tareas
                  </h3>
                  {/* Sliding Tabs Day Selector */}
                  <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full sm:w-auto bg-surface-variant p-1 rounded-2xl border border-outline">
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
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-on-surface-muted hover:bg-surface-base'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
                {dailyTasks.filter((t: any) => t.dayOfWeek === selectedDayTab || (t.dayOfWeek === undefined && selectedDayTab === 1) || selectedDayTab === 7).length === 0 ? (
                  <div className="border border-outline border-dashed p-12 text-center rounded-3xl text-on-surface-muted font-semibold bg-surface-variant/30">
                    Aún no hay tareas diarias programadas para este día. ¡Crea la primera a la izquierda!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dailyTasks.filter((t: any) => t.dayOfWeek === selectedDayTab || (t.dayOfWeek === undefined && selectedDayTab === 1) || selectedDayTab === 7).map((task: any) => (
                      <div key={task.id} className="bg-surface-variant p-5 rounded-2xl border border-outline flex flex-col justify-between hover:border-slate-400 transition-all">
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-3">
                            <span className="bg-blue-600/10 text-blue-500 border border-blue-500/20 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                              {task.type === 'order' && '🛒 PEDIDO'}
                              {task.type === 'review' && '⭐ RESEÑA'}
                              {task.type === 'invite' && '🤝 INVITACIÓN'}
                              {task.type === 'profile' && '👤 PERFIL'}
                              {task.type === 'custom' && '📌 GENERAL'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleEditDaily(task)}
                                className="p-1.5 bg-blue-600/10 border border-blue-500/20 text-blue-500 rounded-lg hover:bg-blue-600/20 transition-all"
                                title="Editar Tarea"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                              </button>
                              <button
                                onClick={() => handleToggleDailyPublish(task.id)}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  task.isPublished 
                                    ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-600/20' 
                                    : 'bg-neutral-600/10 border-neutral-500/20 text-neutral-500 hover:bg-neutral-600/20'
                                }`}
                                title={task.isPublished ? "Pausar Tarea" : "Publicar Tarea"}
                              >
                                {task.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleDeleteDaily(task.id)}
                                className="p-1.5 bg-rose-600/10 border border-rose-500/20 text-rose-500 rounded-lg hover:bg-rose-600/20 transition-all border-none"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <h4 className="font-black text-on-surface text-sm mb-1">{task.title}</h4>
                          <p className="text-xs text-on-surface-muted leading-relaxed line-clamp-3 mb-4">{task.description}</p>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-outline border-dashed mt-auto">
                          <span className="text-[10px] text-on-surface-muted font-bold font-mono">Meta: {task.targetCount}x veces</span>
                          <span className="font-mono text-xs font-bold text-primary">+{task.xpReward} XP</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSubTab === 'weekly' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Add form */}
              <div className="bg-surface-base p-6 rounded-3xl border border-outline shadow-sm h-fit">
                <h3 className="text-lg font-black text-on-surface mb-6 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-primary" />
                  {editingWeeklyId ? 'Editar Misión Semanal' : 'Nueva Misión Semanal'}
                </h3>
                <form onSubmit={handleAddWeeklyMission} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-muted uppercase tracking-wider mb-2">Tema / Título</label>
                    <input
                      type="text"
                      className="w-full bg-surface-variant border border-outline rounded-xl px-4 py-3 font-semibold text-on-surface placeholder-neutral-500 outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Ej. Gran Comensal Semanal"
                      required
                      value={newWeekly.title}
                      onChange={e => setNewWeekly({ ...newWeekly, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-muted uppercase tracking-wider mb-2">Descripción Inteligente</label>
                    <textarea
                      className="w-full bg-surface-variant border border-outline rounded-xl px-4 py-3 font-semibold text-on-surface placeholder-neutral-500 outline-none focus:ring-2 focus:ring-primary h-24 resize-none"
                      placeholder="Ej. Completa una serie de 3 pedidos de la plataforma para validar el envío prioritario gratis."
                      required
                      value={newWeekly.description}
                      onChange={e => setNewWeekly({ ...newWeekly, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-muted uppercase tracking-wider mb-2">XP Recompensa</label>
                      <input
                        type="number"
                        className="w-full bg-surface-variant border border-outline rounded-xl px-4 py-3 font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary font-mono"
                        min={1}
                        value={newWeekly.xpReward}
                        onChange={e => setNewWeekly({ ...newWeekly, xpReward: parseInt(e.target.value) || 40 })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-muted uppercase tracking-wider mb-2">Cantidad Requerida</label>
                      <input
                        type="number"
                        className="w-full bg-surface-variant border border-outline rounded-xl px-4 py-3 font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary font-mono"
                        min={1}
                        value={newWeekly.targetCount}
                        onChange={e => setNewWeekly({ ...newWeekly, targetCount: parseInt(e.target.value) || 3 })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-muted uppercase tracking-wider mb-2">Filtro de Detección</label>
                    <select
                      className="w-full bg-surface-variant border border-outline rounded-xl px-4 py-3 font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary"
                      value={newWeekly.type}
                      onChange={e => setNewWeekly({ ...newWeekly, type: e.target.value as any })}
                    >
                      <option value="orders_count">Acumular Pedidos Completados (Semana) 🛒</option>
                      <option value="reviews_count">Acumular Calificaciones Enviadas 📝</option>
                      <option value="invites_count">Acumular Afiliaciones Exitosas de Amigos 👥</option>
                      <option value="custom">Retos de Comunidad / General 📌</option>
                    </select>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      {saving ? 'Guardando...' : (editingWeeklyId ? 'Actualizar Misión' : 'Publicar Misión Semanal')}
                    </button>
                    {editingWeeklyId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingWeeklyId(null);
                          setNewWeekly({ title: '', description: '', xpReward: 40, type: 'custom', targetCount: 3 });
                        }}
                        className="bg-surface-variant hover:bg-gray-200 text-on-surface-muted font-bold py-3.5 px-4 rounded-xl transition-all"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* List weeklies */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-lg font-black text-on-surface flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-amber-500" />
                  Listado de Misiones
                </h3>
                {weeklyMissions.length === 0 ? (
                  <div className="border border-outline border-dashed p-12 text-center rounded-3xl text-on-surface-muted font-semibold bg-surface-variant/30">
                    Aún no hay misiones semanales publicadas. ¡Crea la de este fin de semana en el panel!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {weeklyMissions.map((task: any) => (
                      <div key={task.id} className="bg-surface-variant p-5 rounded-2xl border border-outline flex flex-col justify-between hover:border-slate-400 transition-all">
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-3">
                            <span className="bg-purple-600/10 text-purple-500 border border-purple-500/20 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                              {task.type === 'orders_count' && '⚡ PEDIDOS ACUMULADOS'}
                              {task.type === 'reviews_count' && '✍️ RESEÑAS ACUMULADAS'}
                              {task.type === 'invites_count' && '👥 AMIGOS REGISTRADOS'}
                              {task.type === 'custom' && '📌 MISIÓN GENERAL'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleEditWeekly(task)}
                                className="p-1.5 bg-blue-600/10 border border-blue-500/20 text-blue-500 rounded-lg hover:bg-blue-600/20 transition-all"
                                title="Editar Misión"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                              </button>
                              <button
                                onClick={() => handleToggleWeeklyPublish(task.id)}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  task.isPublished 
                                    ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-600/20' 
                                    : 'bg-neutral-600/10 border-neutral-500/20 text-neutral-500 hover:bg-neutral-600/20'
                                }`}
                                title={task.isPublished ? "Pausar Misión" : "Publicar Misión"}
                              >
                                {task.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleDeleteWeekly(task.id)}
                                className="p-1.5 bg-rose-600/10 border border-rose-500/20 text-rose-500 rounded-lg hover:bg-rose-600/20 transition-all border-none"
                              >
                                <Trash2 className="w-4 h-4 animate-shake" />
                              </button>
                            </div>
                          </div>
                          <h4 className="font-black text-on-surface text-sm mb-1">{task.title}</h4>
                          <p className="text-xs text-on-surface-muted leading-relaxed line-clamp-3 mb-4">{task.description}</p>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-outline border-dashed mt-auto">
                          <span className="text-[10px] text-on-surface-muted font-bold font-mono">Meta: {task.targetCount}x veces</span>
                          <span className="font-mono text-xs font-bold text-purple-500">+{task.xpReward} XP</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSubTab === 'levels' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-tr from-[#9c27b0]/20 to-[#673ab7]/20 border border-purple-500/20 p-6 rounded-3xl">
                <h3 className="text-lg font-black text-on-surface mb-2 flex items-center gap-2">
                  <Medal className="w-6 h-6 text-purple-500" />
                  Jerarquía de Progresión Automática (100 Niveles Estables)
                </h3>
                <p className="text-xs text-on-surface-muted leading-normal">
                  Los usuarios suben de nivel automáticamente acumulando puntos XP ganados por tareas. Cada nivel requiere <b>exactamente 50 XP</b>. Al subir, se actualizan sus variables permanentemente en la base de datos (más cupos de invitaciones con enlaces y más asociaciones de restaurantes).
                </p>
              </div>

              <div className="max-h-[500px] overflow-y-auto overflow-x-auto rounded-3xl border border-outline bg-surface-variant w-full">
                <table className="min-w-[700px] sm:min-w-0 w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-base border-b border-outline">
                      <th className="p-4 text-xs font-black uppercase tracking-wider text-on-surface-muted">Nivel</th>
                      <th className="p-4 text-xs font-black uppercase tracking-wider text-on-surface-muted">XP Acumulada Requerida</th>
                      <th className="p-4 text-xs font-black uppercase tracking-wider text-on-surface-muted">Beneficio Descuento Globlal</th>
                      <th className="p-4 text-xs font-black uppercase tracking-wider text-on-surface-muted">Cupo de Restaurantes (Afiliaciones)</th>
                      <th className="p-4 text-xs font-black uppercase tracking-wider text-on-surface-muted">Cupo de Enlaces de Invitación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {levels.map((lvl) => (
                      <tr key={lvl.level} className="border-b border-outline hover:bg-white/50 transition-all font-mono text-xs">
                        <td className="p-4 font-black flex items-center gap-2 text-primary font-sans">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          Nivel {lvl.level}
                        </td>
                        <td className="p-4 font-bold text-on-surface-muted">{(lvl.level - 1) * 50} XP - {lvl.level * 50 - 1} XP</td>
                        <td className="p-4 text-purple-600 font-bold">{lvl.rewards.discountPercentage}% Descuento General</td>
                        <td className="p-4 font-sans text-[11px] font-bold">Default (5) + {lvl.rewards.extraAffiliationSpots} (Total: {5 + lvl.rewards.extraAffiliationSpots})</td>
                        <td className="p-4 font-sans text-[11px] font-bold">Default (20) + {lvl.rewards.extraInviteLinkSpots} (Total: {20 + lvl.rewards.extraInviteLinkSpots})</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === 'ranking' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-primary/10 border border-amber-500/20 p-5 sm:p-7 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-on-surface flex items-center gap-2.5">
                    <Crown className="w-6 h-6 text-amber-400 animate-bounce" />
                    Seguimiento de Tareas, Misiones y Ranking de Usuarios
                  </h3>
                  <p className="text-xs sm:text-sm text-on-surface-muted mt-1 max-w-2xl leading-normal">
                    Supervisa el cumplimiento de tareas y misiones de los clientes, sus niveles alcanzados, historial de actividad, pedidos y calificaciones en tiempo real.
                  </p>
                </div>
                <button
                  onClick={fetchRankingData}
                  disabled={rankingLoading}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl self-start md:self-auto flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all shrink-0"
                >
                  <RefreshCcw className={`w-3.5 h-3.5 ${rankingLoading ? 'animate-spin' : ''}`} />
                  {rankingLoading ? 'Actualizando...' : 'Actualizar Ranking'}
                </button>
              </div>

              {/* KPIs de Gamificación */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 sm:p-5 bg-surface-variant border border-outline rounded-2xl text-left">
                  <span className="text-[10px] font-bold text-on-surface-muted uppercase tracking-widest block mb-1">
                    Usuarios Totales
                  </span>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl sm:text-2xl font-black font-mono text-on-surface">{totalGamificationUsers}</p>
                    <span className="text-[10px] text-emerald-500 font-bold">En el sistema</span>
                  </div>
                </div>

                <div className="p-4 sm:p-5 bg-amber-500/5 border border-amber-500/15 rounded-2xl text-left">
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mb-1">
                    Nivel Más Alto
                  </span>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl sm:text-2xl font-black font-mono text-amber-400">
                      Nivel {highestLevelUser?.level || 1}
                    </p>
                    <span className="text-[10px] text-on-surface-muted truncate max-w-[90px]">
                      {highestLevelUser?.displayName || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="p-4 sm:p-5 bg-purple-500/5 border border-purple-500/15 rounded-2xl text-left">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block mb-1">
                    Tareas Completadas
                  </span>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl sm:text-2xl font-black font-mono text-purple-400">
                      {totalCompletedTasksPlatform}
                    </p>
                    <span className="text-[10px] text-purple-400/80 font-bold">Misiones</span>
                  </div>
                </div>

                <div className="p-4 sm:p-5 bg-primary/5 border border-primary/15 rounded-2xl text-left">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest block mb-1">
                    XP Total Emitido
                  </span>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl sm:text-2xl font-black font-mono text-primary">
                      {totalXpIssuedPlatform.toLocaleString()}
                    </p>
                    <span className="text-[10px] text-primary/80 font-bold">Puntos XP</span>
                  </div>
                </div>
              </div>

              {/* Componente de Visualización de Datos con Recharts: Top 5 Rating y Nivel */}
              <TopUsersChart
                users={rankingUsers}
                onSelectUser={(user) => setSelectedUserDetail(user)}
              />

              {/* Podio Top 3 */}
              {topThree.length > 0 && (
                <div className="bg-surface-variant/40 border border-outline rounded-3xl p-5 sm:p-6">
                  <h4 className="text-xs font-black uppercase tracking-wider text-on-surface-muted mb-4 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    Podio de Honor - Usuarios Más Destacados
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {topThree.map((user, idx) => {
                      const isFirst = idx === 0;
                      const isSecond = idx === 1;
                      const isThird = idx === 2;

                      const medalColor = isFirst 
                        ? 'from-amber-400 to-yellow-500 border-amber-400 text-amber-950 shadow-amber-500/25' 
                        : isSecond 
                        ? 'from-slate-300 to-slate-400 border-slate-300 text-slate-900 shadow-slate-400/20' 
                        : 'from-amber-700 to-amber-800 border-amber-600 text-amber-100 shadow-amber-700/20';

                      const badgeStyle = isFirst
                        ? 'border-amber-400/40 bg-amber-400/10'
                        : isSecond
                        ? 'border-slate-300/30 bg-slate-300/10'
                        : 'border-amber-600/30 bg-amber-600/10';

                      return (
                        <div
                          key={user.id}
                          className={`relative p-5 rounded-2xl border ${badgeStyle} flex flex-col justify-between overflow-hidden bg-gradient-to-b from-surface-variant to-surface-base transition-all hover:scale-[1.02] shadow-lg`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                {user.avatarUrl ? (
                                  <img
                                    src={user.avatarUrl}
                                    alt={user.displayName}
                                    className="w-12 h-12 rounded-xl object-cover border border-white/20"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-amber-500 flex items-center justify-center text-white font-black text-lg shadow-md">
                                    {user.displayName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-tr ${medalColor} font-black text-xs flex items-center justify-center border-2 border-surface-base shadow-sm`}>
                                  {isFirst ? '1' : isSecond ? '2' : '3'}
                                </div>
                              </div>
                              <div className="min-w-0">
                                <h5 className="font-extrabold text-sm text-on-surface truncate">{user.displayName}</h5>
                                <p className="text-[11px] text-on-surface-muted truncate">{user.email}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                              Nivel {user.level}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-outline my-2 text-center">
                            <div>
                              <span className="text-[9px] uppercase tracking-wider text-on-surface-muted block font-bold">XP</span>
                              <span className="text-xs font-black font-mono text-primary">{user.xp}</span>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase tracking-wider text-on-surface-muted block font-bold">Tareas</span>
                              <span className="text-xs font-black font-mono text-purple-400">{user.completedTasksCount}</span>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase tracking-wider text-on-surface-muted block font-bold">Pedidos</span>
                              <span className="text-xs font-black font-mono text-emerald-500">{user.ordersCount}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => setSelectedUserDetail(user)}
                              className="flex-1 py-1.5 px-3 bg-surface-base hover:bg-surface-variant border border-outline text-on-surface text-[11px] font-bold rounded-lg transition-all text-center"
                            >
                              Ver Desglose
                            </button>
                            <button
                              onClick={() => {
                                setGrantingXPUserId(user.id);
                                setXpToGrant(50);
                              }}
                              className="py-1.5 px-3 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-[11px] font-bold rounded-lg transition-all"
                              title="Bonificar XP"
                            >
                              + XP
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Filtros y Buscador */}
              <div className="bg-surface-variant p-4 rounded-2xl border border-outline space-y-3">
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                  {/* Buscador */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-on-surface-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar usuario por nombre, email o teléfono..."
                      className="w-full pl-10 pr-4 py-2.5 bg-surface-base border border-outline rounded-xl text-xs text-on-surface outline-none focus:ring-2 focus:ring-primary"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-muted hover:text-on-surface"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filtro Rango de Nivel */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                    <span className="text-[10px] font-bold uppercase text-on-surface-muted tracking-wider shrink-0 flex items-center gap-1 mr-1">
                      <Filter className="w-3 h-3" /> Nivel:
                    </span>
                    {(['all', '1-5', '6-20', '21-50', '51+'] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => setFilterLevelRange(range)}
                        className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg transition-all shrink-0 ${
                          filterLevelRange === range
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-surface-base text-on-surface-muted hover:text-on-surface border border-outline'
                        }`}
                      >
                        {range === 'all' ? 'Todos' : range === '51+' ? 'Nv 51+' : `Nv ${range}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-outline/50 text-xs">
                  {/* Filtro Rol */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-on-surface-muted uppercase">Rol:</span>
                    <select
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                      className="bg-surface-base border border-outline rounded-lg px-2.5 py-1 text-xs text-on-surface font-medium outline-none"
                    >
                      <option value="all">Todos los roles</option>
                      <option value="user">Clientes / Usuarios</option>
                      <option value="restaurant">Restaurantes</option>
                      <option value="driver">Repartidores</option>
                      <option value="admin">Administradores</option>
                    </select>
                  </div>

                  {/* Ordenar por */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-on-surface-muted uppercase flex items-center gap-1">
                      <ArrowUpDown className="w-3 h-3" /> Ordenar:
                    </span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-surface-base border border-outline rounded-lg px-2.5 py-1 text-xs text-on-surface font-medium outline-none"
                    >
                      <option value="xp">Puntos XP acumulados</option>
                      <option value="level">Nivel de Usuario</option>
                      <option value="tasks">Tareas Completadas</option>
                      <option value="orders">Pedidos Realizados</option>
                      <option value="rating">Rating / Calificación</option>
                      <option value="coins">Monedas de Oro 🪙</option>
                    </select>

                    <button
                      onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                      className="p-1.5 bg-surface-base border border-outline rounded-lg text-on-surface-muted hover:text-on-surface"
                      title={sortOrder === 'desc' ? 'Mayor a menor' : 'Menor a mayor'}
                    >
                      {sortOrder === 'desc' ? '↓ Mayor' : '↑ Menor'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabla de Seguimiento de Usuarios */}
              <div className="overflow-x-auto rounded-3xl border border-outline bg-surface-variant w-full shadow-sm">
                {rankingLoading ? (
                  <div className="py-20 text-center space-y-3">
                    <RefreshCcw className="w-8 h-8 text-primary animate-spin mx-auto" />
                    <p className="text-xs font-bold text-on-surface-muted uppercase tracking-wider">Cargando datos de gamificación...</p>
                  </div>
                ) : filteredAndSortedUsers.length === 0 ? (
                  <div className="py-16 text-center p-6 space-y-2">
                    <User className="w-10 h-10 text-on-surface-muted/40 mx-auto" />
                    <h5 className="font-bold text-sm text-on-surface">No se encontraron usuarios</h5>
                    <p className="text-xs text-on-surface-muted max-w-sm mx-auto">
                      Intenta cambiar los términos de búsqueda o los filtros de nivel para ver más registros.
                    </p>
                  </div>
                ) : (
                  <table className="min-w-[850px] w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-base border-b border-outline">
                        <th className="p-4 text-[10px] font-black uppercase tracking-wider text-on-surface-muted text-center w-14">#</th>
                        <th className="p-4 text-[10px] font-black uppercase tracking-wider text-on-surface-muted">Usuario</th>
                        <th className="p-4 text-[10px] font-black uppercase tracking-wider text-on-surface-muted">Nivel y Progreso</th>
                        <th className="p-4 text-[10px] font-black uppercase tracking-wider text-on-surface-muted text-center">XP Total</th>
                        <th className="p-4 text-[10px] font-black uppercase tracking-wider text-on-surface-muted text-center">Tareas Hechas</th>
                        <th className="p-4 text-[10px] font-black uppercase tracking-wider text-on-surface-muted text-center">Pedidos</th>
                        <th className="p-4 text-[10px] font-black uppercase tracking-wider text-on-surface-muted text-center">Rating ⭐</th>
                        <th className="p-4 text-[10px] font-black uppercase tracking-wider text-on-surface-muted text-center">Monedas</th>
                        <th className="p-4 text-[10px] font-black uppercase tracking-wider text-on-surface-muted text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline">
                      {filteredAndSortedUsers.map((user, index) => {
                        const rankNumber = index + 1;
                        const badgeInfo = getLevelBadge(user.level);
                        const progressInLevel = user.xp % 50;
                        const progressPercent = Math.min(100, Math.round((progressInLevel / 50) * 100));

                        return (
                          <tr key={user.id} className="hover:bg-white/5 transition-all text-xs">
                            {/* Puesto */}
                            <td className="p-4 text-center font-mono font-bold">
                              {rankNumber === 1 ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black shadow-sm text-xs">🥇</span>
                              ) : rankNumber === 2 ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-900 font-black shadow-sm text-xs">🥈</span>
                              ) : rankNumber === 3 ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-amber-100 font-black shadow-sm text-xs">🥉</span>
                              ) : (
                                <span className="text-on-surface-muted font-bold text-xs">{rankNumber}</span>
                              )}
                            </td>

                            {/* Usuario */}
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                {user.avatarUrl ? (
                                  <img
                                    src={user.avatarUrl}
                                    alt={user.displayName}
                                    className="w-9 h-9 rounded-xl object-cover border border-outline shrink-0"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-amber-500 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-sm">
                                    {user.displayName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <h6 className="font-extrabold text-on-surface truncate text-xs">{user.displayName}</h6>
                                    <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-surface-base text-on-surface-muted uppercase">
                                      {user.role}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-on-surface-muted truncate">{user.email}</p>
                                  {user.phone && (
                                    <p className="text-[10px] text-on-surface-muted font-mono">📞 {user.phone}</p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Nivel & Progreso */}
                            <td className="p-4">
                              <div className="space-y-1.5 min-w-[140px]">
                                <div className="flex items-center justify-between">
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${badgeInfo.color}`}>
                                    Nivel {user.level} • {badgeInfo.name}
                                  </span>
                                  <span className="text-[10px] font-mono text-on-surface-muted font-bold">
                                    {progressInLevel}/50 XP
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-surface-base rounded-full overflow-hidden border border-outline/30">
                                  <div
                                    className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full transition-all duration-500"
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* XP Total */}
                            <td className="p-4 text-center font-mono font-black text-primary text-xs">
                              {user.xp} XP
                            </td>

                            {/* Tareas Hechas */}
                            <td className="p-4 text-center">
                              <button
                                onClick={() => setSelectedUserDetail(user)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 font-mono font-bold text-xs border border-purple-500/20 transition-all"
                                title="Ver tareas completadas por este usuario"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                                {user.completedTasksCount}
                              </button>
                            </td>

                            {/* Pedidos */}
                            <td className="p-4 text-center font-mono">
                              <span className="font-bold text-emerald-500">{user.ordersCount}</span>
                              {user.totalSpent > 0 && (
                                <span className="block text-[10px] text-on-surface-muted">
                                  ${user.totalSpent.toLocaleString()}
                                </span>
                              )}
                            </td>

                            {/* Rating / Reseñas */}
                            <td className="p-4 text-center">
                              {user.reviewsCount > 0 ? (
                                <div className="inline-flex items-center gap-1 text-amber-400 font-bold font-mono">
                                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                  <span>{user.avgRating}</span>
                                  <span className="text-[10px] text-on-surface-muted font-normal">({user.reviewsCount})</span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-on-surface-muted italic">Sin reseñas</span>
                              )}
                            </td>

                            {/* Monedas */}
                            <td className="p-4 text-center font-mono font-bold text-amber-400">
                              <div className="inline-flex items-center gap-1">
                                <GoldCoinIcon className="w-3.5 h-3.5" />
                                <span>{user.goldCoins}</span>
                              </div>
                            </td>

                            {/* Acciones */}
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setSelectedUserDetail(user)}
                                  className="p-1.5 bg-surface-base hover:bg-primary hover:text-white border border-outline rounded-lg text-on-surface-muted transition-all"
                                  title="Ver ficha completa de misiones y perfil"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setGrantingXPUserId(user.id);
                                    setXpToGrant(50);
                                  }}
                                  className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/25 rounded-lg text-[10px] font-black transition-all flex items-center gap-1"
                                  title="Otorgar bonificación de XP"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  +XP
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Formulario / Inline Dialog para Otorgar Bonificación de XP */}
              {grantingXPUserId && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-surface-variant border border-outline rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-500/15 rounded-2xl text-amber-400">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-black text-on-surface text-base">Bonificar Puntos de Experiencia (XP)</h4>
                          <p className="text-xs text-on-surface-muted">
                            Usuario: <span className="font-bold text-on-surface">{rankingUsers.find(u => u.id === grantingXPUserId)?.displayName}</span>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setGrantingXPUserId(null)}
                        className="text-on-surface-muted hover:text-on-surface"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-3 pt-2">
                      <label className="text-xs font-bold text-on-surface uppercase tracking-wider block">
                        Cantidad de XP a Otorgar
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="5"
                        value={xpToGrant}
                        onChange={(e) => setXpToGrant(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-surface-base border border-outline rounded-xl p-3 text-lg font-mono font-black text-on-surface outline-none focus:ring-2 focus:ring-primary"
                        placeholder="50"
                      />

                      <div className="flex items-center gap-2">
                        {[25, 50, 100, 250, 500].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setXpToGrant(amt)}
                            className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                              xpToGrant === amt
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-surface-base text-on-surface-muted border-outline hover:text-on-surface'
                            }`}
                          >
                            +{amt}
                          </button>
                        ))}
                      </div>

                      <p className="text-[11px] text-on-surface-muted leading-relaxed">
                        💡 Recuerda que cada <b>50 XP</b> hace que el usuario suba un nivel de forma automática, activando sus descuentos y notificaciones en la app.
                      </p>
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-outline">
                      <button
                        type="button"
                        onClick={() => setGrantingXPUserId(null)}
                        className="flex-1 py-2.5 bg-surface-base border border-outline text-on-surface font-bold text-xs rounded-xl hover:bg-surface-variant transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={isGranting}
                        onClick={() => handleGrantXP(grantingXPUserId, xpToGrant)}
                        className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                      >
                        {isGranting ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {isGranting ? 'Otorgando...' : 'Confirmar Bonificación'}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Modal de Detalle Completo del Usuario */}
              {selectedUserDetail && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-surface-variant border border-outline rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl my-8 space-y-5"
                  >
                    {/* Header modal */}
                    <div className="flex items-start justify-between gap-4 pb-4 border-b border-outline">
                      <div className="flex items-center gap-3.5">
                        {selectedUserDetail.avatarUrl ? (
                          <img
                            src={selectedUserDetail.avatarUrl}
                            alt={selectedUserDetail.displayName}
                            className="w-14 h-14 rounded-2xl object-cover border border-outline shadow-md"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-amber-500 flex items-center justify-center text-white font-black text-xl shadow-md">
                            {selectedUserDetail.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-black text-on-surface">{selectedUserDetail.displayName}</h4>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {selectedUserDetail.role}
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-muted">{selectedUserDetail.email}</p>
                          {selectedUserDetail.phone && (
                            <p className="text-xs text-on-surface-muted font-mono">📞 {selectedUserDetail.phone}</p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedUserDetail(null)}
                        className="p-2 text-on-surface-muted hover:text-on-surface hover:bg-surface-base rounded-xl transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Resumen de Métricas de Gamificación */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-surface-base border border-outline rounded-xl text-center">
                        <span className="text-[9px] uppercase font-bold text-on-surface-muted block">Nivel Actual</span>
                        <span className="text-lg font-black font-mono text-primary">Nivel {selectedUserDetail.level}</span>
                      </div>
                      <div className="p-3 bg-surface-base border border-outline rounded-xl text-center">
                        <span className="text-[9px] uppercase font-bold text-on-surface-muted block">XP Acumulado</span>
                        <span className="text-lg font-black font-mono text-amber-400">{selectedUserDetail.xp} XP</span>
                      </div>
                      <div className="p-3 bg-surface-base border border-outline rounded-xl text-center">
                        <span className="text-[9px] uppercase font-bold text-on-surface-muted block">Pedidos Realizados</span>
                        <span className="text-lg font-black font-mono text-emerald-500">{selectedUserDetail.ordersCount}</span>
                      </div>
                      <div className="p-3 bg-surface-base border border-outline rounded-xl text-center">
                        <span className="text-[9px] uppercase font-bold text-on-surface-muted block">Monedas de Oro</span>
                        <span className="text-lg font-black font-mono text-amber-500 flex items-center justify-center gap-1">
                          <GoldCoinIcon className="w-4 h-4" />
                          {selectedUserDetail.goldCoins}
                        </span>
                      </div>
                    </div>

                    {/* Tareas y Misiones Cumplidas */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-extrabold text-sm text-on-surface flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          Desafíos y Misiones Cumplidas ({selectedUserDetail.completedTasks.length})
                        </h5>
                        {selectedUserDetail.lastGamificationUpdate && (
                          <span className="text-[10px] text-on-surface-muted font-mono">
                            Último progreso: {new Date(selectedUserDetail.lastGamificationUpdate).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {selectedUserDetail.completedTasks.length === 0 ? (
                        <div className="p-6 bg-surface-base/50 rounded-2xl border border-dashed border-outline text-center text-xs text-on-surface-muted">
                          Este usuario aún no ha reclamado tareas diarias o misiones semanales.
                        </div>
                      ) : (
                        <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                          {selectedUserDetail.completedTasks.map((taskId: string, tIdx: number) => {
                            const taskInfo = getTaskInfo(taskId);
                            return (
                              <div
                                key={`${taskId}-${tIdx}`}
                                className="p-3 bg-surface-base border border-outline rounded-xl flex items-center justify-between gap-3 text-left"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                                    <Check className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-on-surface truncate">{taskInfo.title}</p>
                                    <p className="text-[10px] text-on-surface-muted truncate">{taskInfo.description}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                    {taskInfo.type}
                                  </span>
                                  {taskInfo.xp > 0 && (
                                    <span className="text-xs font-mono font-black text-primary">
                                      +{taskInfo.xp} XP
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Botón rápido para otorgar XP desde la ficha */}
                    <div className="pt-3 border-t border-outline flex items-center justify-between gap-3">
                      <button
                        onClick={() => {
                          const targetId = selectedUserDetail.id;
                          setSelectedUserDetail(null);
                          setGrantingXPUserId(targetId);
                          setXpToGrant(50);
                        }}
                        className="px-4 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 font-bold text-xs rounded-xl transition-all flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Bonificar XP a este usuario
                      </button>

                      <button
                        onClick={() => setSelectedUserDetail(null)}
                        className="px-5 py-2.5 bg-surface-base hover:bg-surface-variant border border-outline text-on-surface font-bold text-xs rounded-xl transition-all"
                      >
                        Cerrar Ficha
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'ruleta_pay' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-tr from-[#FF8A00]/10 to-[#FF9F43]/10 border border-[#FF8A00]/20 p-6 rounded-3xl">
                <h3 className="text-[#FF8A00] font-black text-lg mb-2 flex items-center gap-2">
                  <Sparkles className="w-6 h-6" />
                  Personalización Global de la Ruleta Pay
                </h3>
                <p className="text-xs text-on-surface-muted leading-normal">
                  Aquí puedes definir las opciones, colores, recompensas y el costo de giro para la ruleta pagá que juegan los usuarios generales de la plataforma. Cualquier cambio que hagas aquí se verá plasmado en tiempo real para todos los clientes al girar la ruleta. Haz clic en "Guardar Configuración" en la sección de personalización para confirmar.
                </p>
              </div>
              <div className="bg-neutral-950 p-6 rounded-3xl border border-outline">
                <RuletaPay adminMode={true} />
              </div>
            </div>
          )}

          {activeSubTab === 'parchis' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1A1A1A] rounded-2xl p-6 border border-white/5 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-amber-500/20 rounded-2xl">
                  <LayoutList className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Configuración del Parchís</h3>
                  <p className="text-sm text-on-surface-muted">Personaliza el tablero y la experiencia del juego</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">URL del Tablero (Imagen)</label>
                  <p className="text-xs text-on-surface-muted mb-3 italic">Sube una imagen cuadrada (1:1) o pega una URL directa.</p>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={platformSettings?.gamificationSettings?.parchisConfig?.boardImageUrl || ''}
                        onChange={(e) => {
                          const newSettings = JSON.parse(JSON.stringify(platformSettings));
                          if (!newSettings.gamificationSettings) newSettings.gamificationSettings = {};
                          if (!newSettings.gamificationSettings.parchisConfig) newSettings.gamificationSettings.parchisConfig = {};
                          newSettings.gamificationSettings.parchisConfig.boardImageUrl = e.target.value;
                          setPlatformSettings(newSettings);
                        }}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="https://ejemplo.com/tablero.png"
                      />
                      <button
                        onClick={() => {
                          const newSettings = JSON.parse(JSON.stringify(platformSettings));
                          if (!newSettings.gamificationSettings) newSettings.gamificationSettings = {};
                          if (!newSettings.gamificationSettings.parchisConfig) newSettings.gamificationSettings.parchisConfig = {};
                          newSettings.gamificationSettings.parchisConfig.boardImageUrl = "";
                          setPlatformSettings(newSettings);
                          saveSettings(newSettings);
                        }}
                        className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-500 p-3 rounded-xl border border-rose-500/20 transition-all"
                        title="Eliminar Imagen"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <input 
                        type="file" 
                        ref={boardFileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !platformSettings) return;

                          try {
                            setIsUploadingBoard(true);
                            const fileName = `parchis/board-${Date.now()}-${file.name}`;
                            const { url, error } = await db.uploadImage(file, fileName);
                            
                            if (error) throw error;
                            if (url) {
                              const newSettings = JSON.parse(JSON.stringify(platformSettings));
                              if (!newSettings.gamificationSettings) newSettings.gamificationSettings = {};
                              if (!newSettings.gamificationSettings.parchisConfig) newSettings.gamificationSettings.parchisConfig = {};
                              newSettings.gamificationSettings.parchisConfig.boardImageUrl = url;
                              setPlatformSettings(newSettings);
                              await saveSettings(newSettings);
                              toast.success("Tablero subido con éxito");
                            }
                          } catch (err) {
                            console.error("Error uploading board:", err);
                            toast.error("Error al subir el tablero");
                          } finally {
                            setIsUploadingBoard(false);
                          }
                        }}
                      />
                      <button
                        onClick={() => boardFileInputRef.current?.click()}
                        disabled={isUploadingBoard}
                        className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
                      >
                        {isUploadingBoard ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4 text-emerald-500" />}
                        {isUploadingBoard ? 'Subiendo...' : 'Cargar Nueva Imagen'}
                      </button>
                      <button
                        onClick={() => saveSettings(platformSettings)}
                        disabled={saving}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-amber-600/20"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Guardando...' : 'Guardar Todo'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Vista Previa Actual
                    </h4>
                    {(!platformSettings?.gamificationSettings?.parchisConfig?.boardImageUrl || platformSettings?.gamificationSettings?.parchisConfig?.boardImageUrl === '/tablero-parques.png') && (
                      <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-black border border-amber-500/20">USANDO POR DEFECTO</span>
                    )}
                  </div>
                  <div className="w-full aspect-square max-w-[300px] mx-auto bg-neutral-900 rounded-xl overflow-hidden border border-white/10 relative shadow-inner">
                    <img 
                      src={(!platformSettings?.gamificationSettings?.parchisConfig?.boardImageUrl || platformSettings?.gamificationSettings?.parchisConfig?.boardImageUrl === '/tablero-parques.png') ? "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Parchis_board.svg/1024px-Parchis_board.svg.png" : formatImageUrl(platformSettings?.gamificationSettings?.parchisConfig?.boardImageUrl)} 
                      alt="Preview" 
                      className="w-full h-full object-contain"
                      key={platformSettings?.gamificationSettings?.parchisConfig?.boardImageUrl || 'none'}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeSubTab === 'ruleta_prizes' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-950/40 via-slate-900/40 to-indigo-950/40 border border-purple-500/20 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-purple-400 font-black text-lg mb-1 flex items-center gap-2">
                    <Award className="w-6 h-6 animate-pulse" />
                    Baúl de Aprobaciones y Entregas - Ruleta Pay
                  </h3>
                  <p className="text-xs text-on-surface-muted max-w-xl leading-normal">
                    Los premios de monedas de oro de la ruleta se acreditan de manera automática. Los premios que corresponden a <b>artículos físicos o canjes especiales</b> entran a este baúl para que verifiques su cobro/pago y los marques como entregados una vez se entregue el artículo al usuario.
                  </p>
                </div>
                <button
                  onClick={fetchAllPlatformPrizes}
                  className="px-4 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-bold text-xs rounded-xl border border-purple-500/30 self-start md:self-auto flex items-center gap-1.5 transition-all"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  Actualizar Lista
                </button>
              </div>

              {/* Estadísticas Rápidas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-surface-variant border border-outline rounded-2xl text-left">
                  <span className="text-[10px] font-bold text-on-surface-muted uppercase tracking-widest block mb-1">Total de Premios Ganados</span>
                  <p className="text-2xl font-black font-mono text-on-surface">{allPlatformPrizes.length}</p>
                </div>
                <div className="p-5 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-left">
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mb-1">Esperando Pago / Aprobación</span>
                  <p className="text-2xl font-black font-mono text-amber-500">
                    {allPlatformPrizes.filter((p) => p.status === 'pending').length}
                  </p>
                </div>
                <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-left">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest block mb-1">Entregados con Éxito</span>
                  <p className="text-2xl font-black font-mono text-emerald-500">
                    {allPlatformPrizes.filter((p) => p.status === 'delivered').length}
                  </p>
                </div>
              </div>

              {/* Contenedor Principal */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* COLUMNA 1: APROBACIONES PENDIENTES */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-500">Artículos en Espera de Pago ({allPlatformPrizes.filter((p) => p.status === 'pending').length})</h4>
                  </div>

                  {prizesLoading ? (
                    <div className="py-12 text-center text-xs text-on-surface-muted italic">Cargando premios...</div>
                  ) : allPlatformPrizes.filter((p) => p.status === 'pending').length === 0 ? (
                    <p className="text-xs text-on-surface-muted/70 bg-surface-variant/20 border border-outline border-dashed p-8 rounded-2xl text-left italic">
                      No hay artículos pendientes de aprobación actualmente. ¡Los usuarios están al día o solo han ganado monedas de oro!
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {allPlatformPrizes.filter((p) => p.status === 'pending').map((prize) => (
                        <div key={prize.id} className="p-5 rounded-2xl border border-amber-500/20 bg-gradient-to-b from-neutral-900/50 to-neutral-950 p-5 rounded-2xl border border-outline relative overflow-hidden group">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[10px] bg-purple-500/10 text-purple-400 font-extrabold px-2 py-0.5 rounded-md tracking-wider">
                                  {prize.restaurantName || "Bite Club"}
                                </span>
                                <span className="text-[10px] text-on-surface-muted font-mono">{prize.createdAt ? new Date(prize.createdAt).toLocaleDateString() : 'Ayer'}</span>
                              </div>
                              <h5 className="font-extrabold text-[#FF8A00] text-sm text-left">{prize.prizeText}</h5>
                            </div>
                            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                              <Gift className="w-5 h-5 animate-pulse" />
                            </div>
                          </div>

                          <div className="space-y-1.5 py-3 border-t border-b border-white/5 my-3 text-left">
                            <p className="text-xs font-bold text-white flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-on-surface-muted" />
                              {prize.userName}
                            </p>
                            {prize.userPhone && (
                              <p className="text-[11px] font-mono text-on-surface-muted">
                                📞 {prize.userPhone}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => handleApprovePrize(prize.id)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md shadow-emerald-900/10 flex items-center justify-center gap-1.5 mt-2"
                          >
                            <Check className="w-4 h-4" />
                            Aprobar Pago & Entregar Artículo
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* COLUMNA 2: HISTORIAL DE ENTREGAS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-emerald-500">Historial de Entregas Completas</h4>
                  </div>

                  {prizesLoading ? (
                    <div className="py-12 text-center text-xs text-on-surface-muted italic">Cargando historial...</div>
                  ) : allPlatformPrizes.filter((p) => p.status === 'delivered').length === 0 ? (
                    <p className="text-xs text-on-surface-muted/70 bg-surface-variant/20 border border-outline border-dashed p-8 rounded-2xl text-left italic">
                      Aún no hay ningún artículo entregado registrado en el historial.
                    </p>
                  ) : (
                    <div className="max-h-[600px] overflow-y-auto space-y-3 pr-1">
                      {allPlatformPrizes.filter((p) => p.status === 'delivered').map((prize) => (
                        <div key={prize.id} className="p-4 rounded-xl border border-outline bg-surface-variant/40 flex items-center justify-between gap-4 text-left">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[9px] font-black tracking-widest text-[#FF8A00] uppercase">{prize.restaurantName || "Bite Club"}</span>
                              <span className="text-[10px] text-on-surface-muted font-mono">{prize.createdAt ? new Date(prize.createdAt).toLocaleDateString() : 'Hoy'}</span>
                            </div>
                            <h5 className="font-bold text-on-surface text-xs truncate max-w-[200px] sm:max-w-none">{prize.prizeText}</h5>
                            <p className="text-[11px] text-on-surface-muted mt-0.5">Usuario: <span className="font-bold text-on-surface">{prize.userName}</span></p>
                          </div>
                          <span className="text-[9px] font-black uppercase text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                            <Check className="w-3 h-3" />
                            Entregado
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
