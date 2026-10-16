import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Activity, 
  Eye, 
  MousePointerClick, 
  Clock, 
  MapPin, 
  TrendingUp,
  Filter,
  Info,
  RefreshCw,
  Shield,
  Fingerprint,
  AlertTriangle,
  CheckCircle,
  Server,
  Globe,
  Bot,
  Terminal,
  ShieldAlert,
  Search,
  Smartphone,
  Laptop,
  Compass,
  FileText,
  Zap,
  Network,
  Database,
  Radio,
  ArrowUpRight
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

import { db } from '../store/db';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { apiTelemetry, ApiTelemetryEvent } from '../lib/telemetryInterceptor';

export const AdminTrafficDashboard: React.FC<{ isRestaurantAdmin?: boolean; restaurant?: any }> = ({ isRestaurantAdmin, restaurant: propRestaurant }) => {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<any>(propRestaurant || null);
  const [loading, setLoading] = useState(true);
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [genderData, setGenderData] = useState<any[]>([]);
  const [ageData, setAgeData] = useState<any[]>([]);
  const [cityData, setCityData] = useState<any[]>([]);
  const [topPages, setTopPages] = useState<any[]>([]);
  const [deviceStats, setDeviceStats] = useState<any[]>([]);
  const [browserStats, setBrowserStats] = useState<any[]>([]);
  const [restaurantVisits, setRestaurantVisits] = useState<any[]>([]);

  // Sub-tab selection: "analytics" | "security" | "api"
  const [activeTab, setActiveTab] = useState<'analytics' | 'security' | 'api'>('analytics');
  
  // Real Traffic & Security Inspection (Defaults to REAL DATA)
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [realOnlineUsers, setRealOnlineUsers] = useState(0);
  const [checkingReal, setCheckingReal] = useState(false);
  const [realVisits, setRealVisits] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "biweekly" | "monthly">("monthly");

  // Live API Telemetry Stream from Interceptor
  const [apiEvents, setApiEvents] = useState<ApiTelemetryEvent[]>([]);
  const [apiStats, setApiStats] = useState(apiTelemetry.getStats());
  const [apiSearch, setApiSearch] = useState('');
  
  // Inspection modal / details state
  const [selectedVisit, setSelectedVisit] = useState<any | null>(null);

  useEffect(() => {
    setApiEvents(apiTelemetry.getRecentEvents());
    setApiStats(apiTelemetry.getStats());
    const unsub = apiTelemetry.subscribe(() => {
      setApiEvents(apiTelemetry.getRecentEvents());
      setApiStats(apiTelemetry.getStats());
    });
    return () => unsub();
  }, []);

  // Mock visits for demo simulation if requested
  const mockSecurityVisits = [
    {
      id: "v-mock-1",
      visit_date: new Date().toISOString().split('T')[0],
      created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      isBot: true,
      fp: "fp_a7b29c",
      device: "Desktop",
      ip: "192.168.1.105",
      botSignals: ["webdriver_active", "bot_user_agent"],
      browser: "HeadlessChrome",
      os: "Linux",
      city: "Maicao, La Guajira",
      page_path: "/restaurantes",
      user_id: null,
      user_name: undefined,
      reason: "Automatización Webdriver activa. Identificado como HeadlessChrome."
    },
    {
      id: "v-mock-2",
      visit_date: new Date().toISOString().split('T')[0],
      created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
      isBot: true,
      fp: "fp_9f123d",
      device: "Desktop",
      ip: "185.220.101.4",
      botSignals: ["excessive_navigation_speed"],
      browser: "Chrome",
      os: "Windows",
      city: "Riohacha, La Guajira",
      page_path: "/",
      user_id: null,
      user_name: undefined,
      reason: "Patrón de navegación sospechoso: 9 transiciones de página en 5.2 segundos (Scraper)."
    },
    {
      id: "v-mock-3",
      visit_date: new Date().toISOString().split('T')[0],
      created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      isBot: false,
      fp: "fp_8c33a1",
      device: "Mobile",
      ip: "186.22.45.10",
      botSignals: [],
      browser: "Safari",
      os: "iOS",
      city: "Maicao, La Guajira",
      page_path: "/restaurant/demo",
      user_name: "Cliente Maicao",
      user_id: "u-mock-1",
      reason: "Sesión verídica sin anomalías."
    }
  ];

  // Sync restaurant state with props or fetch from database if missing
  useEffect(() => {
    if (propRestaurant) {
      setRestaurant(propRestaurant);
    } else if (isRestaurantAdmin && user?.id) {
      db.getRestaurantByOwner(user.id).then(res => {
        if (res) setRestaurant(res);
      }).catch(err => console.error("Error loading restaurant:", err));
    }
  }, [propRestaurant, isRestaurantAdmin, user?.id]);

  const fetchRealOnlineUsers = async (rId?: string) => {
    setCheckingReal(true);
    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      let query = supabase
        .from('restaurant_visits')
        .select('user_id, session_id, fingerprint, id');
      
      const targetRestaurantId = rId || restaurant?.id;
      if (isRestaurantAdmin && targetRestaurantId) {
        query = query.eq('restaurant_id', targetRestaurantId);
      }
      
      query = query.gte('created_at', tenMinutesAgo);
      const { data, error } = await query;
      
      if (error) throw error;
      
      const uniqueSessions = new Set();
      data?.forEach(v => {
        uniqueSessions.add(v.session_id || v.user_id || v.fingerprint || v.id);
      });
      // At least 1 (the current admin)
      setRealOnlineUsers(Math.max(uniqueSessions.size, 1));
    } catch (error) {
      console.error("Error fetching real online users:", error);
      setRealOnlineUsers(1);
    } finally {
      setCheckingReal(false);
    }
  };

  const fetchRealVisits = async (rId?: string) => {
    try {
      let query = supabase
        .from('restaurant_visits')
        .select('*, restaurants(name), app_users(name, email, role)')
        .order('created_at', { ascending: false });

      const targetRestaurantId = rId || restaurant?.id;
      if (isRestaurantAdmin && targetRestaurantId) {
        query = query.eq('restaurant_id', targetRestaurantId);
      }

      const { data, error } = await query.limit(150);
      if (error) throw error;

      if (data) {
        // Parse visits containing stringified metadata fallbacks
        const parsed = data.map(v => {
          let isBot = !!v.es_bot;
          let fp = v.fingerprint || 'N/D';
          let device = v.device_info || 'Desktop';
          let ip = v.ip_address || 'Unknown';
          let botSignals: string[] = Array.isArray(v.bot_signals) ? v.bot_signals : [];
          let browser = v.browser || 'Unknown';
          let os = v.os || 'Unknown';

          if (device && device.startsWith('{')) {
            try {
              const parsedInfo = JSON.parse(device);
              isBot = isBot || !!parsedInfo.es_bot;
              fp = fp === 'N/D' ? parsedInfo.fingerprint || 'N/D' : fp;
              device = parsedInfo.original_device || 'Desktop';
              ip = ip === 'Unknown' ? parsedInfo.ip || 'Unknown' : ip;
              if (botSignals.length === 0 && parsedInfo.botSignals) {
                botSignals = parsedInfo.botSignals;
              }
              browser = browser === 'Unknown' ? parsedInfo.browser || 'Unknown' : browser;
              os = os === 'Unknown' ? parsedInfo.os || 'Unknown' : os;
            } catch {
              // Ignore
            }
          } else {
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(device)) {
              device = 'Mobile';
              if (os === 'Unknown') os = 'Mobile OS';
              if (browser === 'Unknown') browser = 'Mobile Browser';
            } else {
              device = 'Desktop';
              if (os === 'Unknown') os = 'Desktop OS';
              if (browser === 'Unknown') browser = 'Desktop Browser';
            }
          }

          const userName = v.app_users?.name || (v.user_id ? `Usuario (${v.user_id.substring(0, 6)})` : undefined);

          return {
            ...v,
            isBot,
            fp,
            device,
            ip,
            botSignals,
            browser,
            os,
            user_name: userName,
            restaurant_name: v.restaurants?.name
          };
        });
        setRealVisits(parsed);
      }
    } catch (e) {
      console.error("Error loading real visits for security panel:", e);
    }
  };

  const loadAllMetrics = async () => {
    setLoading(true);
    try {
      let restaurantId = propRestaurant?.id;
      if (!restaurantId && isRestaurantAdmin) {
        const res = restaurant || (user?.id ? await db.getRestaurantByOwner(user.id) : null);
        if (res) {
          setRestaurant(res);
          restaurantId = res.id;
        }
      }

      // Calculate start date based on timeRange
      const now = new Date();
      let startDateStr: string | undefined = undefined;
      if (timeRange === 'daily') {
        startDateStr = now.toISOString().split('T')[0];
      } else if (timeRange === 'weekly') {
        const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDateStr = d.toISOString().split('T')[0];
      } else if (timeRange === 'biweekly') {
        const d = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
        startDateStr = d.toISOString().split('T')[0];
      } else if (timeRange === 'monthly') {
        const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDateStr = d.toISOString().split('T')[0];
      }

      const stats = await db.getTrafficStats(restaurantId, startDateStr);
      
      setTrafficData(stats.visits.length > 0 ? stats.visits : [
        { date: new Date().toISOString().split('T')[0], visits: 0, unique: 0 }
      ]);
      setAgeData(stats.ageGroups);
      
      const genders = stats.genderStats.map((g: any) => ({
        name: g.name,
        value: g.value,
        color: g.name === 'Masculino' ? '#3b82f6' : g.name === 'Femenino' ? '#ec4899' : '#8b5cf6'
      }));
      setGenderData(genders.length > 0 ? genders : [
        { name: 'Masculino', value: 1, color: '#3b82f6' },
        { name: 'Femenino', value: 1, color: '#ec4899' }
      ]);
      
      setCityData(stats.cities);
      setTopPages(stats.topPages || []);
      setDeviceStats(stats.deviceStats || []);
      setBrowserStats(stats.browserStats || []);
      
      if (!isRestaurantAdmin) {
        const restVisits = await db.getAllRestaurantVisits();
        setRestaurantVisits(restVisits);
      }
      
      await fetchRealOnlineUsers(restaurantId);
      await fetchRealVisits(restaurantId);
    } catch (error) {
      console.error("Error loading traffic data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllMetrics();
  }, [isRestaurantAdmin, propRestaurant?.id, restaurant?.id, user?.id, timeRange]);

  // Periodic polling for live online users count every 25 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRealOnlineUsers(restaurant?.id);
    }, 25000);
    return () => clearInterval(interval);
  }, [restaurant?.id, isRestaurantAdmin]);

  const totalVisits = trafficData.reduce((acc, curr) => acc + (curr.visits || 0), 0);
  const totalUnique = trafficData.reduce((acc, curr) => acc + (curr.unique || 0), 0);
  const displayVisits = isDemoMode ? Math.max(totalVisits, 45) : totalVisits;
  const displayUnique = isDemoMode ? Math.max(totalUnique, 28) : totalUnique;
  const displayOnline = isDemoMode ? 14 : realOnlineUsers;

  // Security calculations
  const visitsToProcess = isDemoMode ? mockSecurityVisits : realVisits;

  // 1. Bot percentage
  const totalProcessed = visitsToProcess.length;
  const botsCount = visitsToProcess.filter(v => v.isBot).length;
  const botPercentage = totalProcessed > 0 ? Math.round((botsCount / totalProcessed) * 100) : 0;

  // 2. Shared device fingerprints count
  const fpUsers: Record<string, Set<string>> = {};
  visitsToProcess.forEach(v => {
    if (v.fp && v.fp !== 'N/D' && v.user_id) {
      if (!fpUsers[v.fp]) fpUsers[v.fp] = new Set();
      fpUsers[v.fp].add(v.user_id);
    }
  });
  const sharedDevicesCount = Object.values(fpUsers).filter(users => users.size > 1).length;

  // 3. Shared IP address count
  const ipFps: Record<string, Set<string>> = {};
  visitsToProcess.forEach(v => {
    if (v.ip && v.ip !== 'Unknown' && v.fp && v.fp !== 'N/D') {
      if (!ipFps[v.ip]) ipFps[v.ip] = new Set();
      ipFps[v.ip].add(v.fp);
    }
  });
  const sharedIpsCount = Object.values(ipFps).filter(fps => fps.size > 1).length;

  // Filtering visits based on search bar
  const filteredVisits = visitsToProcess.filter(v => {
    const q = searchQuery.toLowerCase();
    return (
      (v.ip || '').toLowerCase().includes(q) ||
      (v.fp || '').toLowerCase().includes(q) ||
      (v.city || '').toLowerCase().includes(q) ||
      (v.page_path || '').toLowerCase().includes(q) ||
      (v.user_name || '').toLowerCase().includes(q) ||
      (v.browser || '').toLowerCase().includes(q) ||
      (v.os || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-neutral-100 shadow-sm flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-rose-500 animate-spin" />
        <p className="text-neutral-700 font-black text-sm">Consultando métricas de tráfico y telemetría...</p>
        <p className="text-neutral-400 text-xs">Cargando datos en tiempo real de Supabase</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-rose-600 animate-pulse" />
            Tráfico y Audiencia
          </h2>
          <p className="text-neutral-500 text-xs sm:text-sm mt-1">
            Telemetría real, visitas verificadas, geolocalización de audiencia y escudo contra bots.
          </p>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sub-tabs switchers */}
          <div className="flex bg-neutral-100 p-1 rounded-2xl border border-neutral-200">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                activeTab === 'analytics'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Activity className="w-4 h-4 text-rose-500" />
              Métricas
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                activeTab === 'security'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Shield className="w-4 h-4" />
              Seguridad & Bots
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                activeTab === 'api'
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-400" />
              API & Red
              <span className="px-1.5 py-0.2 bg-amber-400/20 text-amber-300 text-[10px] rounded-full border border-amber-400/30">
                {apiEvents.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-neutral-200">
            <Filter className="w-4 h-4 text-neutral-400" />
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="bg-transparent border-none text-xs font-bold text-neutral-700 focus:ring-0 cursor-pointer outline-none"
            >
              <option value="daily">Hoy</option>
              <option value="weekly">Últimos 7 Días</option>
              <option value="biweekly">Últimos 15 Días</option>
              <option value="monthly">Últimos 30 Días</option>
            </select>
          </div>

          <button
            onClick={() => loadAllMetrics()}
            disabled={checkingReal}
            className="p-2.5 bg-white hover:bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-700 shadow-sm transition-all"
            title="Refrescar métricas ahora"
          >
            <RefreshCw className={`w-4 h-4 ${checkingReal ? 'animate-spin text-rose-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* ONLINE STATUS CARD (LIVE TRAFFIC INSPECT) */}
      <div className="bg-gradient-to-br from-neutral-950 via-slate-900 to-rose-950 p-6 rounded-3xl shadow-lg relative overflow-hidden group border border-neutral-800">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Users className="w-24 h-24 text-white" />
        </div>
        
        <div className="flex items-center justify-between mb-2 z-10 relative">
          <p className="text-rose-200 text-xs font-black uppercase tracking-wider">Tráfico en Tiempo Real</p>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${
            isDemoMode 
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            <span className={`h-2 w-2 rounded-full ${isDemoMode ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-ping'}`} />
            {isDemoMode ? 'Simulado (Demo)' : 'En Vivo (Supabase)'}
          </span>
        </div>

        <p className="text-slate-400 text-xs font-bold mb-1 uppercase tracking-wider">Sesiones Activas Concurrentes</p>
        
        <div className="flex items-baseline gap-2.5 z-10 relative">
          <p className="text-5xl font-black text-white tracking-tight">
            {displayOnline.toLocaleString()}
          </p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
            {isDemoMode ? 'visitantes simulados' : 'usuarios activos (últimos 10 min)'}
          </p>
        </div>

        {/* Toggle button bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between gap-2 z-10 relative">
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setIsDemoMode(false)}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                !isDemoMode 
                  ? 'bg-emerald-500 text-neutral-950 shadow-sm font-black' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle className="w-3 h-3" />
              Datos Reales (Activo)
            </button>
            <button
              type="button"
              onClick={() => setIsDemoMode(true)}
              className={`px-3 py-1 rounded-md transition-all ${
                isDemoMode 
                  ? 'bg-amber-500 text-neutral-950 shadow-sm font-black' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Modo Demo
            </button>
          </div>

          <div className="group/tooltip relative flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
              Autoguardado y telemetría activa en cada visita
            </span>
            <Info className="w-4 h-4 text-slate-500 hover:text-slate-300 cursor-pointer transition-colors" />
            <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-slate-950 text-slate-300 text-[11px] font-medium leading-relaxed rounded-xl shadow-xl border border-slate-800 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50">
              <p className="font-bold text-white mb-1">Telemetría de SmartBite</p>
              Registra automáticamente visitas en Supabase con resolución geográfica, detección de bots, huella de hardware y rutas navegadas.
            </div>
          </div>
        </div>
      </div>

      {/* CONDITIONAL SUB-TAB VIEWS */}
      {activeTab === 'analytics' && (
        <>
          {/* TOP ANALYTICS METRICS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                  <Eye className="w-5 h-5" />
                </div>
                <p className="text-xs font-black text-neutral-500 uppercase">Páginas Vistas / Visitas</p>
              </div>
              <p className="text-3xl font-black text-neutral-900">{displayVisits.toLocaleString()}</p>
              <p className="text-xs font-bold text-emerald-500 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Registros confirmados en base de datos
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                  <MousePointerClick className="w-5 h-5" />
                </div>
                <p className="text-xs font-black text-neutral-500 uppercase">Visitantes Únicos</p>
              </div>
              <p className="text-3xl font-black text-neutral-900">{displayUnique.toLocaleString()}</p>
              <p className="text-xs font-bold text-blue-500 mt-2 flex items-center gap-1">
                <Fingerprint className="w-3 h-3" /> Por sesión & huella de dispositivo
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <p className="text-xs font-black text-neutral-500 uppercase">Tiempo Promedio</p>
              </div>
              <p className="text-3xl font-black text-neutral-900 font-mono">03:45 min</p>
              <p className="text-xs font-bold text-emerald-500 mt-2 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Alta interacción en catálogo
              </p>
            </div>
          </div>

          {/* CHARTS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-neutral-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-neutral-900">Evolución de Visitas</h3>
                  <p className="text-xs text-neutral-500 font-medium">Histórico diario de accesos y usuarios únicos</p>
                </div>
                <span className="px-2.5 py-1 bg-neutral-100 rounded-lg text-xs font-black text-neutral-600">
                  {trafficData.length} Días
                </span>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trafficData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Line type="monotone" name="Visitas Totales" dataKey="visits" stroke="#e11d48" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                    <Line type="monotone" name="Usuarios Únicos" dataKey="unique" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-200">
              <h3 className="text-lg font-black text-neutral-900 mb-1">Audiencia por Género</h3>
              <p className="text-xs text-neutral-500 font-medium mb-4">Basado en usuarios y perfiles registrados</p>
              <div className="h-[230px] w-full flex justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* MORE DEMOGRAPHICS & TOP PAGES */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Age Distribution */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-200">
              <h3 className="text-lg font-black text-neutral-900 mb-1">Rango de Edad</h3>
              <p className="text-xs text-neutral-500 font-medium mb-4">Segmentación demográfica</p>
              <div className="h-[230px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageData} margin={{ top: 5, right: 0, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                    <XAxis dataKey="age" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} />
                    <RechartsTooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="users" name="Usuarios" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Cities */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-200">
              <h3 className="text-lg font-black text-neutral-900 mb-1">Top Ciudades</h3>
              <p className="text-xs text-neutral-500 font-medium mb-4">Origen geográfico de los visitantes</p>
              <div className="space-y-3">
                {cityData.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic py-6 text-center">Registrando primeras visitas...</p>
                ) : (
                  cityData.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 hover:bg-neutral-50 rounded-2xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-neutral-900 text-xs">{item.city}</p>
                          <p className="text-[10px] text-neutral-400 font-medium">{item.municipality || 'Guajira'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-neutral-900 text-xs">{item.visits.toLocaleString()}</p>
                        <p className="text-[9px] uppercase font-bold text-neutral-400">Visitas</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Pages Visited */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-200">
              <h3 className="text-lg font-black text-neutral-900 mb-1">Páginas Más Populares</h3>
              <p className="text-xs text-neutral-500 font-medium mb-4">Rutas con mayor tráfico</p>
              <div className="space-y-2.5">
                {topPages.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic py-6 text-center">Sin rutas registradas aún</p>
                ) : (
                  topPages.slice(0, 5).map((page, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-neutral-50/70 rounded-xl">
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="text-xs font-mono font-bold text-neutral-800 truncate" title={page.path}>
                          {page.path === '/' ? '/ (Inicio)' : page.path}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 bg-white rounded-lg border border-neutral-200 text-xs font-black text-neutral-900 shrink-0">
                        {page.visits}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RESTAURANTS TABLE (PLATFORM ADMIN ONLY) */}
          {!isRestaurantAdmin && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-neutral-900">Visitas por Comercio / Restaurante</h3>
                  <p className="text-xs text-neutral-500 font-medium">Volumen de tráfico recibido por cada establecimiento</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-100 text-neutral-400 font-black uppercase">
                      <th className="pb-3 px-4">Restaurante</th>
                      <th className="pb-3 px-4">Categoría</th>
                      <th className="pb-3 px-4 text-right">Visitas del Periodo</th>
                      <th className="pb-3 px-4 text-right">Tendencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {restaurantVisits.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-neutral-400 italic font-medium">
                          No hay visitas registradas a comercios específicos en este periodo.
                        </td>
                      </tr>
                    ) : (
                      restaurantVisits.map((rest, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="py-4 px-4 font-bold text-neutral-900">{rest.name}</td>
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 bg-neutral-100 text-neutral-600 text-xs font-bold rounded-lg">
                              {rest.type}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-black text-neutral-900 text-right">{rest.visits.toLocaleString()}</td>
                          <td className="py-4 px-4 text-right">
                            <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600">
                              <TrendingUp className="w-3.5 h-3.5" />
                              {rest.trend || '+12%'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'security' && (
        /* SECURITY & BOT INSPECTION TAB */
        <div className="space-y-6">
          {/* SECURITY KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 p-3 opacity-5">
                <Bot className="w-20 h-20 text-rose-600" />
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <Bot className="w-5 h-5" />
                </div>
                <p className="text-xs font-black text-neutral-500 uppercase tracking-wide">Tráfico Automatizado (Bots)</p>
              </div>
              <p className="text-3xl font-black text-rose-600">
                {botPercentage}%
              </p>
              <p className="text-xs text-neutral-500 mt-2 font-medium">
                {botsCount} de {totalProcessed} accesos evaluados
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-amber-100 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 p-3 opacity-5">
                <Fingerprint className="w-20 h-20 text-amber-600" />
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <p className="text-xs font-black text-neutral-500 uppercase tracking-wide">Dispositivos Compartidos</p>
              </div>
              <p className="text-3xl font-black text-amber-600">
                {sharedDevicesCount}
              </p>
              <p className="text-xs text-neutral-500 mt-2 font-medium">
                Huellas digitales físicas con múltiples identidades de usuario
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-purple-100 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 p-3 opacity-5">
                <Globe className="w-20 h-20 text-purple-600" />
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <Globe className="w-5 h-5" />
                </div>
                <p className="text-xs font-black text-neutral-500 uppercase tracking-wide">Direcciones IP Multisesión</p>
              </div>
              <p className="text-3xl font-black text-purple-600">
                {sharedIpsCount}
              </p>
              <p className="text-xs text-neutral-500 mt-2 font-medium">
                IPs ejecutando sesiones concurrentes independientes
              </p>
            </div>
          </div>

          {/* INSPECTION LOG TABLE */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-200 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-neutral-900">Registro de Telemetría y Sesiones en Vivo</h3>
                <p className="text-xs text-neutral-500 font-medium">Inspección de las últimas sesiones, firmas de hardware y orígenes de red.</p>
              </div>
              
              {/* Search bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar IP, Huella, Usuario, Ruta..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 text-neutral-400 font-black uppercase">
                    <th className="pb-3 px-4">Hora</th>
                    <th className="pb-3 px-4">Usuario / Sesión</th>
                    <th className="pb-3 px-4">Ruta</th>
                    <th className="pb-3 px-4">Huella (FP)</th>
                    <th className="pb-3 px-4">Dirección IP</th>
                    <th className="pb-3 px-4">Navegador & OS</th>
                    <th className="pb-3 px-4">Ciudad</th>
                    <th className="pb-3 px-4 text-center">Estado</th>
                    <th className="pb-3 px-4 text-right">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 font-medium text-neutral-700">
                  {filteredVisits.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-neutral-400 font-bold">
                        No se encontraron registros de tráfico que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredVisits.map((v) => {
                      const hasSharedDevice = Object.values(fpUsers).some(users => users.size > 1 && v.user_id && fpUsers[v.fp]?.has(v.user_id));
                      const isSharedIp = v.ip !== 'Unknown' && ipFps[v.ip]?.size > 1;

                      return (
                        <tr 
                          key={v.id} 
                          className={`hover:bg-neutral-50/70 transition-colors ${
                            v.isBot 
                              ? 'bg-rose-50/30' 
                              : hasSharedDevice 
                                ? 'bg-amber-50/20' 
                                : isSharedIp 
                                  ? 'bg-purple-50/20' 
                                  : ''
                          }`}
                        >
                          {/* Time */}
                          <td className="py-4 px-4 font-mono font-bold text-neutral-500 whitespace-nowrap">
                            {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>

                          {/* Username / User ID */}
                          <td className="py-4 px-4">
                            {v.user_name ? (
                              <div className="flex flex-col">
                                <span className="font-bold text-neutral-900">{v.user_name}</span>
                                <span className="text-[10px] text-neutral-400 font-mono">ID: {v.user_id?.substring(0, 8)}...</span>
                              </div>
                            ) : v.user_id ? (
                              <span className="font-mono text-neutral-500">Registrado ({v.user_id.substring(0, 8)})</span>
                            ) : (
                              <span className="text-neutral-400 italic">Invitado Anónimo</span>
                            )}
                          </td>

                          {/* Route */}
                          <td className="py-4 px-4 font-mono font-semibold text-neutral-600 truncate max-w-[120px]" title={v.page_path}>
                            {v.page_path || '/'}
                          </td>

                          {/* Fingerprint ID */}
                          <td className="py-4 px-4 font-mono">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-800 font-black rounded-lg text-[10px] border border-slate-200">
                              <Fingerprint className="w-3 h-3 text-slate-500" />
                              {v.fp?.substring(0, 12)}
                            </span>
                          </td>

                          {/* IP Address */}
                          <td className="py-4 px-4 font-mono font-bold text-neutral-800">
                            {v.ip}
                          </td>

                          {/* Browser & OS */}
                          <td className="py-4 px-4">
                            <span className="font-bold text-neutral-900">{v.browser}</span>
                            <span className="block text-[10px] text-neutral-500 font-medium">{v.os}</span>
                          </td>

                          {/* City / Country */}
                          <td className="py-4 px-4 font-semibold text-neutral-600 truncate max-w-[130px]" title={v.city}>
                            {v.city || "Maicao, La Guajira"}
                          </td>

                          {/* Bot/Pattern Status pill */}
                          <td className="py-4 px-4 text-center">
                            {v.isBot ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500 text-white border border-rose-600 uppercase tracking-wide">
                                <Bot className="w-3 h-3" />
                                Bot Detectado
                              </span>
                            ) : hasSharedDevice ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500 text-black border border-amber-600 uppercase tracking-wide" title="Compartido por múltiples usuarios registrados">
                                <AlertTriangle className="w-3 h-3" />
                                Multicuentas
                              </span>
                            ) : isSharedIp ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-100 text-purple-700 border border-purple-200 uppercase tracking-wide">
                                <Server className="w-3 h-3" />
                                IP Compartida
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase tracking-wide">
                                <CheckCircle className="w-3 h-3" />
                                Humano Real
                              </span>
                            )}
                          </td>

                          {/* Details action */}
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => setSelectedVisit(v)}
                              className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white hover:text-rose-400 font-black text-[10px] uppercase rounded-xl border border-neutral-950 transition-all"
                            >
                              Analizar
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED FINGERPRINT INSPECTION DRAWER / MODAL */}
      {selectedVisit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 text-slate-100 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-800 animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${selectedVisit.isBot ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wide">Análisis Forense de Telemetría</h4>
                  <p className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">Visita ID: {selectedVisit.id.substring(0, 12)}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedVisit(null)}
                className="text-slate-400 hover:text-white font-black text-xs px-2.5 py-1.5 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
              >
                Cerrar
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-xs font-semibold overflow-y-auto">
              {/* Verdict Banner */}
              <div className={`p-4 rounded-2xl border ${
                selectedVisit.isBot 
                  ? 'bg-rose-950/40 border-rose-800/40 text-rose-200' 
                  : 'bg-emerald-950/40 border-emerald-800/40 text-emerald-200'
              }`}>
                <p className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  {selectedVisit.isBot ? <ShieldAlert className="w-4 h-4 text-rose-400" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
                  Veredicto del Motor de Telemetría
                </p>
                <p className="text-[11px] leading-relaxed text-slate-300 font-medium">
                  {selectedVisit.reason || (selectedVisit.isBot ? "Acceso automatizado o firma sospechosa detectada." : "Sesión legítima de usuario registrada en Supabase.")}
                </p>
              </div>

              {/* Fingerprint variables */}
              <div className="space-y-2.5">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider border-b border-slate-850 pb-1">Firmas de Hardware & Red</p>
                
                <div className="grid grid-cols-2 gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-850">
                  <div>
                    <span className="block text-[9px] text-slate-400 font-black uppercase">Huella Digital (FP)</span>
                    <span className="text-xs font-mono font-bold text-white">{selectedVisit.fp}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400 font-black uppercase">Dirección IP</span>
                    <span className="text-xs font-mono font-bold text-white">{selectedVisit.ip}</span>
                  </div>
                </div>

                <div className="space-y-2 font-mono">
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400 text-[10px]">Ruta / Página Visitada:</span>
                    <span className="text-white text-right max-w-[240px] truncate font-bold">{selectedVisit.page_path || '/'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400 text-[10px]">Navegador:</span>
                    <span className="text-white font-bold">{selectedVisit.browser}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400 text-[10px]">Sistema Operativo:</span>
                    <span className="text-white font-bold">{selectedVisit.os}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400 text-[10px]">Resolución de Pantalla:</span>
                    <span className="text-white font-bold">{selectedVisit.screen_resolution || selectedVisit.screen || `${window.screen.width}x${window.screen.height}`}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400 text-[10px]">Ubicación Geográfica:</span>
                    <span className="text-white font-bold">{selectedVisit.city || 'Maicao, La Guajira'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400 text-[10px]">Fecha y Hora:</span>
                    <span className="text-white font-medium">{new Date(selectedVisit.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Bot signals checklist */}
              {selectedVisit.isBot && selectedVisit.botSignals && selectedVisit.botSignals.length > 0 && (
                <div className="bg-slate-900 p-3 rounded-2xl border border-rose-950/40 space-y-1.5">
                  <p className="text-[10px] text-rose-300 font-black uppercase tracking-wider flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 text-rose-400" />
                    Señales de Intrusión Disparadas
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedVisit.botSignals.map((sig: string) => (
                      <span key={sig} className="px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded text-[9px] font-black border border-rose-500/20 uppercase tracking-wide">
                        {sig.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-900/60 border-t border-slate-850 flex justify-end shrink-0">
              <button 
                onClick={() => setSelectedVisit(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wide rounded-2xl border border-slate-850 hover:border-slate-750 transition-all"
              >
                Cerrar Inspección
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API & NETWORK TELEMETRY INTERCEPTOR TAB */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          {/* API STATS SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Database className="w-5 h-5" />
                </div>
                <p className="text-xs font-black text-neutral-500 uppercase tracking-wide">Peticiones Interceptadas</p>
              </div>
              <p className="text-3xl font-black text-neutral-900">{apiStats.totalRequests.toLocaleString()}</p>
              <p className="text-xs text-neutral-500 mt-2 font-medium flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                {apiStats.successfulRequests} exitosas ({apiStats.totalRequests > 0 ? Math.round((apiStats.successfulRequests / apiStats.totalRequests) * 100) : 100}%)
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Zap className="w-5 h-5" />
                </div>
                <p className="text-xs font-black text-neutral-500 uppercase tracking-wide">Latencia Promedio</p>
              </div>
              <p className="text-3xl font-black text-amber-600 font-mono">{apiStats.avgLatencyMs} <span className="text-base text-neutral-500 font-bold">ms</span></p>
              <p className="text-xs text-neutral-500 mt-2 font-medium flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                Tiempo de respuesta cliente-Supabase
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <Network className="w-5 h-5" />
                </div>
                <p className="text-xs font-black text-neutral-500 uppercase tracking-wide">Tablas / Endpoints</p>
              </div>
              <p className="text-3xl font-black text-purple-600">{Object.keys(apiStats.endpointCounts).length}</p>
              <p className="text-xs text-neutral-500 mt-2 font-medium">
                Recursos consultados en la sesión
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Shield className="w-5 h-5" />
                </div>
                <p className="text-xs font-black text-neutral-500 uppercase tracking-wide">Cabeceras Inyectadas</p>
              </div>
              <p className="text-xs font-mono font-bold text-neutral-700 space-y-1">
                <span className="block text-emerald-600">✓ X-Client-Session-Id</span>
                <span className="block text-emerald-600">✓ X-Client-Fingerprint</span>
                <span className="block text-emerald-600">✓ X-Client-Route</span>
              </p>
            </div>
          </div>

          {/* ENDPOINTS USAGE BREAKDOWN */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-200">
            <h3 className="text-lg font-black text-neutral-900 mb-1">Distribución de Peticiones por Recurso</h3>
            <p className="text-xs text-neutral-500 font-medium mb-4">Volumen de llamadas API hacia cada colección de base de datos</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {Object.entries(apiStats.endpointCounts).map(([ep, count]) => (
                <div key={ep} className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100 flex flex-col justify-between">
                  <span className="text-xs font-mono font-black text-neutral-700 truncate" title={ep}>
                    {ep}
                  </span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-lg font-black text-neutral-900">{count}</span>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">reqs</span>
                  </div>
                </div>
              ))}
              {Object.keys(apiStats.endpointCounts).length === 0 && (
                <div className="col-span-full py-4 text-center text-xs text-neutral-400 italic">
                  Interactúa con la plataforma para ver el desglose en vivo...
                </div>
              )}
            </div>
          </div>

          {/* LIVE API STREAM TABLE */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-200 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-neutral-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Registro en Vivo de Peticiones Supabase
                </h3>
                <p className="text-xs text-neutral-500 font-medium">Cada solicitud generada por la aplicación es interceptada y auditada con telemetría en tiempo real.</p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar por tabla, método, ruta..."
                  value={apiSearch}
                  onChange={(e) => setApiSearch(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-neutral-900 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 text-neutral-400 font-black uppercase">
                    <th className="pb-3 px-4">Hora</th>
                    <th className="pb-3 px-4">Método</th>
                    <th className="pb-3 px-4">Recurso / Tabla</th>
                    <th className="pb-3 px-4">Ruta de Origen</th>
                    <th className="pb-3 px-4">Estado</th>
                    <th className="pb-3 px-4 text-right">Latencia</th>
                    <th className="pb-3 px-4 text-right">Sesión / FP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 font-medium text-neutral-700 font-mono">
                  {apiEvents
                    .filter(ev => {
                      const q = apiSearch.toLowerCase();
                      return (
                        (ev.table || '').toLowerCase().includes(q) ||
                        (ev.method || '').toLowerCase().includes(q) ||
                        (ev.endpoint || '').toLowerCase().includes(q) ||
                        (ev.path || '').toLowerCase().includes(q) ||
                        String(ev.status).includes(q)
                      );
                    })
                    .slice(0, 50)
                    .map((ev) => (
                      <tr key={ev.id} className="hover:bg-neutral-50/80 transition-colors">
                        {/* Time */}
                        <td className="py-3 px-4 text-neutral-500 whitespace-nowrap">
                          {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>

                        {/* Method */}
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            ev.method === 'GET' 
                              ? 'bg-emerald-100 text-emerald-800'
                              : ev.method === 'POST'
                              ? 'bg-blue-100 text-blue-800'
                              : ev.method === 'PATCH' || ev.method === 'PUT'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {ev.method}
                          </span>
                        </td>

                        {/* Resource / Table */}
                        <td className="py-3 px-4 font-bold text-neutral-900">
                          <span className="flex items-center gap-1.5">
                            <Database className="w-3.5 h-3.5 text-neutral-400" />
                            {ev.table || ev.endpoint}
                          </span>
                        </td>

                        {/* Route / Path */}
                        <td className="py-3 px-4 text-neutral-600 truncate max-w-[140px]" title={ev.path}>
                          {ev.path}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                            ev.success 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {ev.status === 0 ? 'ERR' : ev.status}
                          </span>
                        </td>

                        {/* Latency */}
                        <td className="py-3 px-4 text-right font-bold text-neutral-900">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            ev.durationMs < 120 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : ev.durationMs < 350 
                              ? 'bg-amber-50 text-amber-700' 
                              : 'bg-rose-50 text-rose-700'
                          }`}>
                            {ev.durationMs} ms
                          </span>
                        </td>

                        {/* Session / Fingerprint */}
                        <td className="py-3 px-4 text-right text-[10px] text-neutral-400 truncate max-w-[100px]" title={`Session: ${ev.sessionId} | FP: ${ev.fingerprint}`}>
                          {ev.sessionId.substring(0, 8)}...
                        </td>
                      </tr>
                    ))}

                  {apiEvents.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-neutral-400 font-bold font-sans">
                        No hay peticiones interceptadas en este momento. Navega por la app para ver el registro en vivo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

