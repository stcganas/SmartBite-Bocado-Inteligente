import { formatCurrency } from '../utils/format';
import React, { useState, useEffect } from 'react';
import { db, Order, DriverProfile } from '../store/db';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { 
  Car, MapPin, Package, CheckCircle2, Clock, 
  Power, Navigation, Phone, DollarSign, 
  ChevronRight, AlertCircle, History, LayoutDashboard,
  Bike, Truck, LogOut, Bell, Inbox
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useOneSignal } from '../hooks/useOneSignal';
import { DashboardSidebar } from '../components/DashboardSidebar';

type DriverOrder = Order & { 
  restaurantName: string; 
  restaurantAddress: string; 
  restaurantPhone: string;
  customerAddress?: string;
};

import { NotificationInbox } from '../components/NotificationInbox';
import { useNotifications } from '../contexts/NotificationContext';

export default function DriverDashboard() {
  const { user, appUser, signOut } = useAuth();
  const { isInitialized, requestPermission } = useOneSignal();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [availableOrders, setAvailableOrders] = useState<DriverOrder[]>([]);
  const [activeOrders, setActiveOrders] = useState<DriverOrder[]>([]);
  const [historyOrders, setHistoryOrders] = useState<DriverOrder[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [deliverySteps, setDeliverySteps] = useState<Record<string, 'assigned' | 'at_restaurant' | 'items_received' | 'on_the_way' | 'completed'>>({});
  const [pingOrder, setPingOrder] = useState<DriverOrder | null>(null);
  const [pingTimer, setPingTimer] = useState<number>(30);
  const [cashDeposited, setCashDeposited] = useState<number>(0);

  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'history' | 'inbox' | 'wallet'>(() => {
    const params = new URLSearchParams(location.search);
    const tabOption = params.get("tab");
    return (tabOption as any) || 'available';
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabOption = params.get("tab");
    if (tabOption) {
      setActiveTab(tabOption as any);
    }
  }, [location.search]);
  const fetchData = async () => {
    if (!user) return;
    try {
      const [pData, aData, dData] = await Promise.all([
        db.getDriverProfile(user.id),
        db.getAvailableOrdersForDrivers(),
        db.getDriverOrders(user.id)
      ]);

      setProfile(pData);
      setAvailableOrders(aData as DriverOrder[]);
      
      const active = (dData as DriverOrder[]).filter(o => o.status === 'on_the_way' || o.status === 'shipped' || o.status === 'assigned' || o.status === 'preparing');
      const history = (dData as DriverOrder[]).filter(o => o.status === 'completed');
      
      setActiveOrders(active);
      setHistoryOrders(history);

      // Trigger Radar Ping modal if driver is online and there are available orders
      if (pData?.isOnline && aData.length > 0 && !pingOrder) {
        setPingOrder(aData[0] as DriverOrder);
        setPingTimer(30);
      }
    } catch (error) {
      console.error('Error fetching driver data:', error);
      toast.error('Error al cargar datos');
    } flexFinally();
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (pingOrder && pingTimer > 0) {
      timer = setInterval(() => {
        setPingTimer(prev => {
          if (prev <= 1) {
            setPingOrder(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [pingOrder, pingTimer]);

  const handleAdvanceStep = async (orderId: string, currentStep: string) => {
    let nextStep: 'assigned' | 'at_restaurant' | 'items_received' | 'on_the_way' | 'completed' = 'at_restaurant';
    let dbStatus: any = 'preparing';
    let toastMessage = 'Camino al restaurante';

    if (!currentStep || currentStep === 'assigned') {
      nextStep = 'at_restaurant';
      toastMessage = 'Confirmaste llegada al restaurante';
    } else if (currentStep === 'at_restaurant') {
      nextStep = 'items_received';
      dbStatus = 'on_the_way';
      toastMessage = 'Alimentos recibidos en mostrador';
    } else if (currentStep === 'items_received') {
      nextStep = 'on_the_way';
      dbStatus = 'on_the_way';
      toastMessage = 'En camino a la dirección del cliente';
    } else if (currentStep === 'on_the_way') {
      nextStep = 'completed';
      dbStatus = 'completed';
      toastMessage = 'Pedido entregado con éxito al cliente';
    }

    setDeliverySteps(prev => ({ ...prev, [orderId]: nextStep }));

    if (dbStatus) {
      await db.updateOrderStatus(orderId, dbStatus);
    }

    toast.success(toastMessage);
    if (nextStep === 'completed') {
      fetchData();
    }
  };

  const flexFinally = () => setLoading(false);

  useEffect(() => {
    fetchData();
    // Poll for new orders every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleToggleOnline = async () => {
    if (!profile || !user) return;
    
    if (profile.approvalStatus !== 'approved') {
      toast.error('Tu cuenta aún no ha sido aprobada por el administrador');
      return;
    }

    const newStatus = !profile.isOnline;
    const { error } = await db.updateDriverProfile(user.id, { isOnline: newStatus });
    if (!error) {
      setProfile({ ...profile, isOnline: newStatus });
      toast.success(newStatus ? 'Ahora estás en línea' : 'Ahora estás fuera de línea');
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    if (!user || !profile?.isOnline) {
      toast.error('Debes estar en línea para aceptar pedidos');
      return;
    }
    
    try {
      const { error } = await db.assignDriverToOrder(orderId, user.id);
      if (error) throw error;
      toast.success('¡Pedido aceptado exitosamente!');
      setPingOrder(null);
      fetchData();
      setActiveTab('active');
    } catch (error: any) {
      toast.error('Error al aceptar pedido: ' + error.message);
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      const { error } = await db.updateOrderStatus(orderId, 'completed');
      if (error) throw error;
      toast.success('Pedido entregado con éxito');
      fetchData();
    } catch (error: any) {
      toast.error('Error al completar pedido: ' + error.message);
    }
  };

  const sidebarGroups = [
    {
      title: 'Entregas & Radar',
      items: [
        { id: 'available', label: 'Radar & Pedidos', icon: Package, badge: availableOrders.length > 0 ? availableOrders.length : undefined },
        { id: 'active', label: 'En Ruta', icon: Navigation, badge: activeOrders.length > 0 ? activeOrders.length : undefined },
        { id: 'wallet', label: 'Billetera & Deudas', icon: DollarSign },
        { id: 'history', label: 'Historial', icon: History },
      ]
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-base">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const totalEarnings = historyOrders.reduce((sum, order) => sum + (order.total * 0.1), 0); // Mock 10% commission for driver

  return (
    <div className="flex min-h-[100dvh] bg-[#0B0B0B] text-on-surface overflow-hidden relative">
      {/* Ambient Depth Orbs */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-[#FF8A00]/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-[#FFB347]/5 rounded-full blur-[100px] pointer-events-none" />
      
      <DashboardSidebar 
        title={appUser?.displayName || 'Driver Panel'}
        subtitle="Repartidor"
        groups={sidebarGroups}
        activeId={activeTab}
        onItemClick={(id) => setActiveTab(id as any)}
        logo={<Bike className="w-8 h-8 text-on-surface" />}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative z-10">
        {profile?.approvalStatus !== 'approved' && (
          <div className="bg-amber-50 border-b border-amber-100 p-4 shrink-0">
            <div className="max-w-7xl mx-auto flex items-center gap-3 text-amber-800">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div className="text-sm font-medium">
                {profile?.approvalStatus === 'pending' ? (
                  'Tu cuenta está pendiente de aprobación. Podrás recibir pedidos una vez que el administrador revise tus documentos.'
                ) : (
                  'Tu cuenta ha sido rechazada. Por favor contacta al soporte para más información.'
                )}
              </div>
            </div>
          </div>
        )}

        {/* Header Hero Section */}
        <div className="relative h-64 overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.6),transparent_70%)]"></div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-50 via-neutral-50/10 to-transparent"></div>
          
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-12 flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
            <motion.div 
              initial={{ y: 20, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-surface-base0/30 blur-2xl rounded-full"></div>
              <div className="w-32 h-32 rounded-3xl glass-card border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden relative z-10 transition-transform hover:scale-105 duration-500 cursor-pointer">
                <div className="w-full h-full bg-surface-base flex items-center justify-center">
                  <Truck className="w-14 h-14 text-on-surface" />
                </div>
              </div>
            </motion.div>
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex-1 min-w-0 pb-1"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                <h1 className="text-4xl font-black text-on-surface tracking-tighter truncate drop-shadow-sm uppercase">
                  {appUser?.displayName || 'Repartidor'}
                </h1>
                <div className="flex gap-2">
                   <button 
                    onClick={handleToggleOnline}
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all flex items-center gap-2 ${
                      profile?.isOnline 
                        ? 'bg-emerald-500 text-on-surface shadow-emerald-500/20' 
                        : 'bg-surface-variant text-on-surface-muted shadow-neutral-200/20'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    {profile?.isOnline ? 'En Línea' : 'Desconectado'}
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
                <div className="flex flex-col text-[#FF8A00] text-sm font-black bg-[#111] px-4 py-2 rounded-2xl border border-[#333]">
                  <span className="text-[10px] uppercase tracking-widest text-neutral-500">Hoy</span>
                  <div className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> {(totalEarnings * 0.3).toLocaleString()}</div>
                </div>
                <div className="flex flex-col text-white text-sm font-black bg-[#111] px-4 py-2 rounded-2xl border border-[#333]">
                  <span className="text-[10px] uppercase tracking-widest text-neutral-500">Semana</span>
                  <div className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> {totalEarnings.toLocaleString()}</div>
                </div>
                
                <div className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-2xl border bg-[#111] border-[#333]">
                  {profile?.approvalStatus === 'approved' ? (
                    <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> <span className="text-emerald-500">Docs Aprobados</span></>
                  ) : (
                    <><Clock className="w-4 h-4 text-[#FF8A00]" /> <span className="text-[#FF8A00]">En Revisión</span></>
                  )}
                </div>

                {profile?.isOnline && (
                   <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold bg-emerald-500/10 px-4 py-3 rounded-2xl border border-emerald-500/20">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    Buscando...
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="px-6 sm:px-12 pb-24 w-full">
          <main className="mt-8">
            <AnimatePresence mode="wait">
              {activeTab === 'inbox' && (
                <motion.div
                  key="inbox"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="glass-card rounded-3xl shadow-sm border border-outline p-8 space-y-6"
                >
                  <NotificationInbox />
                </motion.div>
              )}
          {activeTab === 'available' && (
            <motion.div 
              key="available"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {availableOrders.length > 0 ? (
                availableOrders.map(order => (
                  <div key={order.id} className="bg-[#1C1C1C] p-5 rounded-[2rem] shadow-lg border border-[#333333] flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-[#FF8A00]" />
                    <div className="flex justify-between items-start mb-4 pl-3">
                      <div>
                        <h3 className="font-black text-lg text-white leading-tight mb-1">{order.restaurantName}</h3>
                        <p className="text-xs font-bold text-neutral-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {order.restaurantAddress}
                        </p>
                      </div>
                      <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-xl text-sm font-black whitespace-nowrap">{formatCurrency(order.total)}</div>
                    </div>
                    
                    <div className="flex items-center gap-4 py-4 border-y border-[#333333] mb-4 pl-3">
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Package className="w-3 h-3"/> Entrega</p>
                        <p className="font-bold text-white text-sm">{order.customerAddress || 'Dirección del cliente'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1"><Clock className="w-3 h-3 inline"/> Est.</p>
                        <p className="font-bold text-white">~15 min</p>
                      </div>
                    </div>

                    <div className="mt-auto pl-3 flex gap-2">
                      <a href={`https://waze.com/ul?q=${encodeURIComponent(order.restaurantAddress)}`} target="_blank" rel="noreferrer" className="flex-1 h-12 bg-[#2A2A2A] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#333333] transition-all active:scale-95 flex items-center justify-center gap-2 text-xs">
                        <Navigation className="w-4 h-4" /> Mapa
                      </a>
                      <button 
                        onClick={() => handleAcceptOrder(order.id)}
                        className="flex-[2] h-12 bg-[#FF8A00] text-[#111] rounded-2xl font-black uppercase tracking-widest hover:bg-[#E67A00] transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 text-xs"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Aceptar
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-[#1C1C1C] rounded-[2.5rem] border border-dashed border-[#333333] col-span-full">
                  <Package className="w-12 h-12 text-[#333] mx-auto mb-4" />
                  <p className="text-neutral-400 font-bold">No hay pedidos disponibles en este momento.</p>
                  <p className="text-neutral-500 text-xs mt-1">Mantente en línea para recibir notificaciones.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'active' && (
            <motion.div 
              key="active"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {activeOrders.length > 0 ? (
                activeOrders.map(order => {
                  const currentStep = deliverySteps[order.id] || 'assigned';
                  return (
                    <div key={order.id} className="bg-[#1C1C1C] p-5 rounded-[2rem] shadow-lg border border-[#FF8A00]/30 ring-4 ring-[#FF8A00]/10 flex flex-col relative">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="bg-[#FF8A00] text-[#111] text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest mb-2 inline-block">
                            {currentStep === 'assigned' && '1. Camino al Local'}
                            {currentStep === 'at_restaurant' && '2. En Restaurante'}
                            {currentStep === 'items_received' && '3. Alimentos Listos'}
                            {currentStep === 'on_the_way' && '4. En Camino al Cliente'}
                            {currentStep === 'completed' && 'Entregado'}
                          </span>
                          <h3 className="font-black text-xl text-white">{order.restaurantName}</h3>
                        </div>
                      </div>

                      {/* Step Timeline Indicator */}
                      <div className="grid grid-cols-4 gap-1 mb-4">
                        <div className={`h-1.5 rounded-full ${['assigned','at_restaurant','items_received','on_the_way','completed'].includes(currentStep) ? 'bg-[#FF8A00]' : 'bg-[#333]'}`} />
                        <div className={`h-1.5 rounded-full ${['at_restaurant','items_received','on_the_way','completed'].includes(currentStep) ? 'bg-[#FF8A00]' : 'bg-[#333]'}`} />
                        <div className={`h-1.5 rounded-full ${['items_received','on_the_way','completed'].includes(currentStep) ? 'bg-[#FF8A00]' : 'bg-[#333]'}`} />
                        <div className={`h-1.5 rounded-full ${['on_the_way','completed'].includes(currentStep) ? 'bg-[#FF8A00]' : 'bg-[#333]'}`} />
                      </div>

                      <div className="space-y-4 mb-6">
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center gap-1 pt-1">
                            <div className="w-3 h-3 rounded-full bg-[#FF8A00]" />
                            <div className="w-0.5 h-10 bg-[#333]" />
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                          </div>
                          <div className="flex-1 space-y-3">
                            <div>
                              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Punto A - Local</p>
                              <p className="font-bold text-white text-sm">{order.restaurantAddress}</p>
                              <a href={`https://waze.com/ul?q=${encodeURIComponent(order.restaurantAddress)}`} target="_blank" rel="noreferrer" className="text-[#FF8A00] text-xs font-bold inline-flex items-center gap-1 hover:underline mt-0.5">
                                <Navigation className="w-3 h-3" /> Abrir Waze / Maps
                              </a>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Punto B - Cliente</p>
                              <p className="font-bold text-white text-sm">{order.customerAddress || 'Dirección del cliente'}</p>
                              <p className="text-xs text-neutral-400 font-medium">{order.customerName}</p>
                              <div className="flex gap-2 mt-2">
                                <a href={`https://waze.com/ul?q=${encodeURIComponent(order.customerAddress || '')}`} target="_blank" rel="noreferrer" className="bg-[#2A2A2A] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                                  <Navigation className="w-3 h-3" /> GPS
                                </a>
                                <a href={`https://wa.me/57${order.customerPhone}`} target="_blank" rel="noreferrer" className="bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> WhatsApp
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {order.paymentMethod === 'cash' && (
                        <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl mb-4 text-xs font-bold text-amber-400 flex items-center gap-2">
                          <DollarSign className="w-4 h-4 shrink-0" />
                          Cobro en Efectivo: Cobra {formatCurrency(order.total)} al cliente
                        </div>
                      )}

                      <div className="mt-auto space-y-2">
                        {currentStep === 'assigned' && (
                          <button 
                            onClick={() => handleAdvanceStep(order.id, 'assigned')}
                            className="w-full h-12 bg-[#FF8A00] text-[#111] rounded-2xl font-black uppercase tracking-widest hover:bg-[#E67A00] transition-all flex items-center justify-center gap-2 text-xs"
                          >
                            <MapPin className="w-4 h-4" /> LLegué al Restaurante
                          </button>
                        )}
                        {currentStep === 'at_restaurant' && (
                          <button 
                            onClick={() => handleAdvanceStep(order.id, 'at_restaurant')}
                            className="w-full h-12 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 text-xs"
                          >
                            <Package className="w-4 h-4" /> Recibí los Alimentos
                          </button>
                        )}
                        {currentStep === 'items_received' && (
                          <button 
                            onClick={() => handleAdvanceStep(order.id, 'items_received')}
                            className="w-full h-12 bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 text-xs"
                          >
                            <Navigation className="w-4 h-4" /> Iniciar Ruta al Cliente
                          </button>
                        )}
                        {currentStep === 'on_the_way' && (
                          <button 
                            onClick={() => handleAdvanceStep(order.id, 'on_the_way')}
                            className="w-full h-14 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
                          >
                            <CheckCircle2 className="w-5 h-5" /> Confirmar Entrega
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 bg-[#1C1C1C] rounded-[2.5rem] border border-dashed border-[#333333] col-span-full">
                  <Navigation className="w-12 h-12 text-[#333] mx-auto mb-4" />
                  <p className="text-neutral-400 font-bold">No tienes pedidos en ruta.</p>
                  <button 
                    onClick={() => setActiveTab('available')}
                    className="mt-4 text-[#FF8A00] font-black text-sm uppercase tracking-widest hover:underline"
                  >
                    Buscar Pedidos
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'wallet' && (
            <motion.div
              key="wallet"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Wallet Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#1C1C1C] p-6 rounded-[2rem] border border-[#333]">
                  <p className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-1">Saldo a Favor (Tarjetas/Nequi)</p>
                  <h3 className="text-3xl font-black text-emerald-400">{formatCurrency(totalEarnings)}</h3>
                  <p className="text-[11px] text-neutral-500 mt-2">Transferible a tu cuenta bancaria registrada</p>
                </div>

                <div className="bg-[#1C1C1C] p-6 rounded-[2rem] border border-[#333]">
                  <p className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-1">Deuda Efectivo Cobrado</p>
                  <h3 className="text-3xl font-black text-amber-400">{formatCurrency(Math.max(0, 120000 - cashDeposited))}</h3>
                  <p className="text-[11px] text-neutral-500 mt-2">Efectivo retenido pendiente por consignar</p>
                </div>

                <div className="bg-[#1C1C1C] p-6 rounded-[2rem] border border-[#333]">
                  <p className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-1">Balance Neto Tartera</p>
                  <h3 className={`text-3xl font-black ${totalEarnings - (120000 - cashDeposited) >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                    {formatCurrency(totalEarnings - (120000 - cashDeposited))}
                  </h3>
                  <p className="text-[11px] text-neutral-500 mt-2">Estado de cuenta semanal en línea</p>
                </div>
              </div>

              {/* Wallet Actions & Consignation */}
              <div className="bg-[#1C1C1C] p-6 rounded-[2rem] border border-[#333] flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-black text-white text-lg">Consignación de Efectivo Recaudado</h4>
                  <p className="text-xs text-neutral-400 mt-1">Realiza la consignación a la cuenta concentradora SmartBite para liberar tu cupo de efectivo.</p>
                </div>
                <button
                  onClick={() => {
                    setCashDeposited(prev => prev + 50000);
                    toast.success('Consignación reportada. Se ha actualizado tu deuda en efectivo.');
                  }}
                  className="px-6 py-3 bg-[#FF8A00] text-[#111] rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#E67A00] transition-all shrink-0"
                >
                  Reportar Consignación ($50,000)
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {historyOrders.length > 0 ? (
                historyOrders.map(order => (
                  <div key={order.id} className="bg-[#1C1C1C] p-5 rounded-[2rem] shadow-sm border border-[#333333] flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#2A2A2A] rounded-2xl flex items-center justify-center text-emerald-500">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white truncate">{order.restaurantName}</h4>
                      <p className="text-xs text-neutral-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-white">{formatCurrency((order.total * 0.1))}</p>
                      <p className="text-[10px] font-bold text-emerald-500 uppercase">Ganancia</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-[#1C1C1C] rounded-[2.5rem] border border-dashed border-[#333333] col-span-full">
                  <History className="w-12 h-12 text-[#333] mx-auto mb-4" />
                  <p className="text-neutral-400 font-bold">Aún no has completado entregas.</p>
                </div>
              )}
            </motion.div>
          )}
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Radar Ping Modal Alert for incoming orders */}
      <AnimatePresence>
        {pingOrder && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-[#1C1C1C] border-2 border-[#FF8A00] rounded-[2.5rem] p-6 max-w-md w-full shadow-2xl relative overflow-hidden text-center space-y-6">
              <div className="absolute top-0 left-0 right-0 h-2 bg-[#FF8A00] animate-pulse" />
              
              <div className="flex items-center justify-between">
                <span className="bg-[#FF8A00]/20 text-[#FF8A00] px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5 animate-bounce" /> Nuevo Pedido Cercano
                </span>
                <span className="text-xl font-black text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full font-mono">
                  {pingTimer}s
                </span>
              </div>

              <div>
                <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">Tarifa Estimada de Ganancia</p>
                <h2 className="text-4xl font-black text-emerald-400 mt-1">{formatCurrency(pingOrder.total * 0.15)}</h2>
              </div>

              <div className="space-y-3 bg-[#262626] p-4 rounded-2xl text-left border border-[#333]">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#FF8A00] mt-1 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-neutral-500 uppercase">Punto A - Recogida</p>
                    <p className="font-bold text-white text-sm">{pingOrder.restaurantName}</p>
                    <p className="text-xs text-neutral-400">{pingOrder.restaurantAddress}</p>
                  </div>
                </div>

                <div className="border-t border-[#333] pt-3 flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-neutral-500 uppercase">Punto B - Entrega</p>
                    <p className="font-bold text-white text-sm">{pingOrder.customerAddress || 'Dirección de entrega'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setPingOrder(null)}
                  className="py-3.5 bg-[#2A2A2A] text-neutral-300 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#333]"
                >
                  Rechazar
                </button>
                <button
                  onClick={() => handleAcceptOrder(pingOrder.id)}
                  className="py-3.5 bg-[#FF8A00] text-[#111] rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#E67A00] shadow-lg shadow-[#FF8A00]/20"
                >
                  Aceptar Pedido
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
