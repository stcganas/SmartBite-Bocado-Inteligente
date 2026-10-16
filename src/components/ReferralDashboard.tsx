import React, { useState, useEffect } from "react";
import { 
  Users, 
  Share2, 
  DollarSign, 
  Copy, 
  CheckCircle2, 
  ChevronRight, 
  AlertCircle,
  TrendingUp,
  Wallet,
  Smartphone,
  ArrowUpRight,
  History,
  Info,
  XCircle,
  Store
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { referralService } from "../services/referralService";
import { db } from "../store/db";
import { formatCurrency } from "../utils/format";
import { toast } from "sonner";

export const ReferralDashboard: React.FC = () => {
  const { user, appUser, refreshAppUser } = useAuth();
  const [referralHistory, setReferralHistory] = useState<any[]>([]);
  const [referralOrders, setReferralOrders] = useState<any[]>([]);
  const [enrolledRestaurants, setEnrolledRestaurants] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<"referrals" | "orders" | "restaurants">("referrals");
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [nequiNumber, setNequiNumber] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState<"nequi" | "cash" | "product">("nequi");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && appUser) {
      if (!appUser.referralCode) {
        // Automatically generate if missing
        referralService.ensureReferralCode(appUser).then(() => {
          if (refreshAppUser) refreshAppUser();
        });
      }
      // For now, we'll fetch the history without a restaurant filter to show overall status
      fetchData();
    }
  }, [user, appUser?.id, appUser?.referralCode, JSON.stringify(appUser?.anniversaries)]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // In a multi-restaurant system, the balance might be globally tracked or restaurant-specific.
      // Based on the store/db structure, we added referralBalance to app_users (global).
      // History could be filtered if needed.
      const [history, orders, restaurants] = await Promise.all([
        referralService.getReferralHistory(user.id, ""),
        referralService.getReferralOrders(user.id),
        db.getRestaurants()
      ]);
      setReferralHistory(history);
      setReferralOrders(orders);
      
      
      if (appUser?.anniversaries) {
        const enrolledIds = appUser.anniversaries
          .filter(a => a.type === "referral_enrollment")
          .map(a => a.date);
        setEnrolledRestaurants(restaurants.filter(r => enrolledIds.includes(r.id)));
      }
      
      try {
         const reqs = await db.getReferralRequests();
         setPendingRequests(reqs.filter((r: any) => r.userId === appUser?.id && r.status === 'pending'));
      } catch (e) {
         console.warn(e);
      }

    } catch (error) {
      console.error("Error fetching referral data:", error);
    } finally {
      setLoading(false);
    }
  };

  const maxInvites = (appUser as any)?.maxReferralInvites || 20;
  const remainingInvites = Math.max(0, maxInvites - referralHistory.length);

  const handleCopyLink = () => {
    if (!appUser?.referralCode) return;
    const link = `https://SmartBite.click/auth?ref=${appUser.referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success("¡Enlace copiado!");
  };

  const handleCopyCode = () => {
    if (remainingInvites <= 0) {
      toast.error("Has alcanzado tu límite de invitaciones. Contacta a soporte para más.");
      return;
    }
    if (appUser?.referralCode) {
      navigator.clipboard.writeText(appUser.referralCode);
      toast.success("¡Código copiado!");
    }
  };

  const handleShareWhatsApp = () => {
    if (remainingInvites <= 0) {
      toast.error("Has alcanzado tu límite de invitaciones. Contacta a soporte.");
      return;
    }
    if (!appUser?.referralCode) return;
    
    // We use a professional baseline message
    const baseUrl = 'https://SmartBite.click';
    const shareUrl = `${baseUrl}/auth?ref=${appUser.referralCode}`;
    const message = encodeURIComponent(
      `¡Hola! Te invito a probar SmartBite 🍔, la mejor app para pedir comida. \n\nRegístrate usando mi código: *${appUser.referralCode}* o usa este enlace: \n${shareUrl} \n\n¡Ambos ganaremos premios! 🚀`
    );
    
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const handleWithdrawRequest = async () => {
    if (!user || !appUser) return;
    
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }

    if (amount > (appUser.referralBalance || 0)) {
      toast.error("Saldo insuficiente");
      return;
    }

    if (withdrawMethod === "nequi" && !nequiNumber) {
      toast.error("Ingresa tu número de Nequi");
      return;
    }

    setIsSubmitting(true);
    try {
      // For withdrawal, we might need a restaurant context if the money comes from a specific one.
      // But if it's a platform-wide balance, we can use a dummy or general ID.
      // Let's assume for now withdrawals are handled at the platform level or default restaurant.
      const restaurantId = referralHistory[0]?.restaurantId || "platform";
      
      const success = await referralService.requestWithdrawal({
        userId: user.id,
        restaurantId: restaurantId,
        amount: amount,
        method: withdrawMethod,
        nequiNumber: withdrawMethod === "nequi" ? nequiNumber : undefined
      });

      if (success) {
        toast.success("Solicitud de retiro enviada con éxito");
        setShowWithdrawModal(false);
        setWithdrawAmount("");
        setNequiNumber("");
        if (refreshAppUser) await refreshAppUser();
        fetchData();
      } else {
        toast.error("No se pudo procesar la solicitud");
      }
    } catch (error) {
      toast.error("Error al procesar el retiro");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header & Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-[#0B0B0B] p-8 rounded-[2.5rem] text-on-surface relative overflow-hidden shadow-2xl group border border-white/10 golden-glow-module">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-orange-500/20 transition-all duration-700 pointer-events-none" />
          <div className="relative z-10 space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-orange-400 font-black uppercase tracking-[0.2em] text-[10px]">Tu Estatus de Referido</p>
                <h3 className="text-3xl font-black tracking-tight text-on-surface">Invita Amigos y Gana</h3>
              </div>
              <div className="glass-card/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                <Users className="w-6 h-6 text-orange-400" />
              </div>
            </div>

            <div className="flex flex-wrap gap-8 py-4">
              <div>
                <p className="text-indigo-300/60 font-bold text-xs uppercase tracking-widest mb-1">Referidos Totales</p>
                <p className="text-3xl font-black text-on-surface">{referralHistory.length}</p>
              </div>
              <div className="w-px h-12 glass-card/10" />
              <div>
                <p className="text-indigo-300/60 font-bold text-xs uppercase tracking-widest mb-1">Tasa de Conversión</p>
                <p className="text-3xl font-black text-on-surface">
                  {referralHistory.length > 0 ? "100%" : "0%"}
                </p>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleShareWhatsApp}
                disabled={remainingInvites <= 0}
                className="flex-1 bg-orange-600 hover:bg-orange-500 disabled:bg-neutral-600 text-on-surface px-8 py-4 rounded-2xl font-black shadow-lg shadow-orange-950/40 flex items-center justify-center gap-3 active:scale-95 transition-all border border-orange-400/20"
              >
                <Share2 className="w-5 h-5" />
                Compartir por WhatsApp {remainingInvites <= 0 ? "(Límite)" : ""}
              </button>
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-[#0B0B0B] p-8 rounded-[2.5rem] border border-outline shadow-2xl flex flex-col justify-between group golden-glow-module">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet className="w-6 h-6 text-orange-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-on-surface-muted font-black text-[10px] uppercase tracking-widest mb-1">Saldo Disponible</p>
              <h4 className="text-4xl font-black text-on-surface tracking-tighter">
                {formatCurrency(appUser?.referralBalance || 0)}
              </h4>
            </div>
          </div>
          
          <button 
            onClick={() => setShowWithdrawModal(true)}
            className="w-full mt-8 bg-orange-600 hover:bg-orange-500 text-on-surface h-14 rounded-2xl font-black flex items-center justify-center gap-2 group/btn active:scale-95 transition-all shadow-xl shadow-orange-200"
          >
            <DollarSign className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
            Retirar Fondos
          </button>
        </div>
      </div>

      {/* Referral Link & Code Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0B0B0B] p-6 rounded-[2rem] border border-outline shadow-sm flex flex-col gap-4 golden-glow-module">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Info className="w-5 h-5" />
            </div>
            <h4 className="font-black text-sm uppercase tracking-widest">¿Cómo funciona?</h4>
          </div>
          <ul className="space-y-3">
            {[
              "Comparte tu código o enlace único.",
              "Tus amigos se registran y hacen un pedido.",
              "Recibes una comisión por cada compra que realicen.",
              "Retira tu dinero en efectivo a tu cuenta Nequi."
            ].map((step, i) => (
              <li key={i} className="flex gap-3 text-sm font-medium text-on-surface-muted">
                <span className="flex-shrink-0 w-6 h-6 bg-surface-variant rounded-full flex items-center justify-center text-[10px] font-black">{i + 1}</span>
                {step}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#0B0B0B] p-6 rounded-[2rem] border border-outline shadow-sm flex flex-col justify-center gap-6 golden-glow-module">
          <div className="space-y-4">
            <h4 className="font-black text-sm uppercase tracking-widest text-center">Tu Código de Invitación</h4>
            
            <div className="flex flex-col gap-4">
              {/* Code Box */}
              <div className="relative group/copy">
                <div 
                  className="bg-surface-base px-6 py-8 rounded-3xl border-2 border-dashed border-orange-500/50 text-center font-black text-4xl sm:text-5xl tracking-[0.3em] shadow-inner text-orange-600 mb-2"
                  style={{ textShadow: '0px 2px 4px rgba(234,88,12,0.2)' }}
                >
                  {appUser?.referralCode}
                </div>
                <button 
                  onClick={handleCopyCode}
                  className="absolute right-4 top-1/2 -translate-y-[60%] p-4 bg-orange-100 text-orange-600 rounded-2xl shadow-lg border border-orange-200 hover:bg-orange-600 hover:text-white transition-all active:scale-95 flex items-center justify-center"
                  title="Copiar Código"
                >
                  <Copy className="w-6 h-6" />
                </button>
              </div>
              
              {/* Link Box */}
              <button 
                onClick={handleCopyLink}
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white px-6 py-4 rounded-2xl font-black shadow-lg shadow-neutral-900/20 flex items-center justify-center gap-3 active:scale-95 transition-all outline-none border border-neutral-700"
              >
                <Share2 className="w-5 h-5" />
                Copiar Enlace de Invitación
              </button>
            </div>
            
            <div className="flex justify-between items-center bg-surface-variant p-3 rounded-xl border border-outline/50 mt-4">
               <div>
                  <p className="text-[10px] font-black uppercase text-on-surface-muted tracking-widest leading-none mb-1">Invitaciones Restantes</p>
                  <p className="text-xl font-black text-on-surface leading-none">{remainingInvites} / {maxInvites}</p>
               </div>
               <button 
                 onClick={() => toast.info("Comunícate con soporte para habilitar más enviós al terminar tu cuota inicial.")}
                 className="text-[9px] font-black text-orange-400 border border-orange-500/30 px-3 py-1.5 rounded-full hover:bg-orange-500/10 transition-colors"
               >
                 PEDIR MÁS
               </button>
            </div>
            <p className="text-center text-xs font-bold text-on-surface-muted">Toca para copiar y pegar donde quieras</p>
          </div>
        </div>
      </div>

      
      {/* Programas Inscritos (moved outside of tabs) */}
      <div className="glass-card rounded-[2.5rem] border border-outline shadow-sm overflow-hidden mt-6 mb-6">
        <div className="p-6 border-b border-neutral-50 bg-zinc-50/50">
          <h3 className="text-lg font-black text-on-surface flex items-center gap-2 mb-1">
            <Store className="w-5 h-5 text-indigo-500" />
            Programas Inscritos
          </h3>
          <p className="text-sm text-on-surface-muted font-medium">Restaurantes de los cuales eres embajador</p>
        </div>
        <div className="space-y-6 p-6">
          {pendingRequests.length > 0 && (
            <div className="mb-2">
              <h4 className="text-on-surface-variant font-black mb-3">Solicitudes Pendientes</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pendingRequests.map(req => (
                  <div key={req.id} className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex justify-between items-center">
                    <div>
                        <p className="font-bold text-amber-900">{req.restaurantName}</p>
                        <p className="text-xs text-amber-700/80 font-medium">Esperando aprobación</p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {enrolledRestaurants.length === 0 && pendingRequests.length === 0 ? (
            <div className="py-8 text-center px-6">
              <div className="w-12 h-12 bg-surface-variant rounded-full flex items-center justify-center mx-auto mb-4">
                <Info className="w-6 h-6 text-on-surface-variant" />
              </div>
              <h5 className="font-black text-on-surface mb-2">Aún no estás inscrito en programas</h5>
              <p className="text-on-surface-muted text-sm max-w-[280px] mx-auto font-medium">
                Explora el inicio y únete a un programa de referidos.
              </p>
            </div>
          ) : enrolledRestaurants.length > 0 ? (
            <div>
              {pendingRequests.length > 0 && (
                <h4 className="text-on-surface-variant font-black mb-3 mt-2">Afiliaciones Activas</h4>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {enrolledRestaurants.map(r => (
                  <div key={r.id} className="bg-surface-base border border-outline p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-surface-base rounded-xl overflow-hidden shrink-0">
                      <img src={r.logo || r.coverImage || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=150"} alt={r.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-black text-on-surface text-sm">{r.name}</h5>
                      <p className="text-[10px] text-on-surface-muted font-bold uppercase tracking-widest">
                        Comisión: {r.referralCommissionType === "percentage" ? `${r.referralCommissionValue}%` : formatCurrency(r.referralCommissionValue || 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

{/* Tabs Switcher for Referral lists and purchases */}
      <div className="glass-card rounded-[2.5rem] border border-outline shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-50 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-zinc-50/50">
          <div className="flex gap-2 bg-surface-variant p-1.5 rounded-2xl">
            <button
              onClick={() => setActiveSubTab("referrals")}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                activeSubTab === "referrals"
                  ? "glass-card text-on-surface shadow-sm"
                  : "text-on-surface-muted hover:text-on-surface"
              }`}
            >
              Mis Referidos ({referralHistory.length})
            </button>
            <button
              onClick={() => setActiveSubTab("orders")}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                activeSubTab === "orders"
                  ? "glass-card text-on-surface shadow-sm"
                  : "text-on-surface-muted hover:text-on-surface"
              }`}
            >
              Compras ({referralOrders.length})
            </button>
            
          </div>

          <span className="px-4 py-1.5 glass-card border border-outline text-on-surface-muted rounded-full text-[10px] font-black tracking-widest uppercase shadow-sm">
            {activeSubTab === "referrals" ? "Lista de Invitados" : "Transparencia de Compras"}
          </span>
        </div>

        <div className="overflow-x-auto">
          {activeSubTab === "referrals" ? (
            referralHistory.length === 0 ? (
              <div className="py-20 text-center px-6">
                <div className="w-16 h-16 bg-surface-variant rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-on-surface-variant" />
                </div>
                <h5 className="font-black text-on-surface mb-2">Aún no tienes referidos</h5>
                <p className="text-on-surface-muted text-sm max-w-[240px] mx-auto font-medium">Comienza a compartir tu enlace para ganar tus primeras comisiones.</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-base border-b border-outline italic">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-muted">Usuario</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-muted">Fecha</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-muted">Estado</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-muted text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {referralHistory.map((ref) => (
                    <tr key={ref.id} className="hover:bg-surface-base/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-black text-orange-600 border border-white shadow-sm">
                            {ref.referred.avatar_url ? (
                              <img src={ref.referred.avatar_url} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              ref.referred.display_name?.charAt(0) || "U"
                            )}
                          </div>
                          <div>
                            <p className="font-black text-sm text-on-surface">{ref.referred.display_name}</p>
                            <p className="text-xs text-on-surface-muted font-medium">{ref.referred.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-on-surface-muted">{new Date(ref.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${ref.status === 'active' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-muted">
                            {ref.status === 'active' ? 'Activo' : 'Completado'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button className="p-2 text-on-surface-variant hover:text-zinc-900 transition-colors">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : activeSubTab === "orders" ? (
            referralOrders.length === 0 ? (
              <div className="py-20 text-center px-6">
                <div className="w-16 h-16 bg-surface-variant rounded-full flex items-center justify-center mx-auto mb-6">
                  <History className="w-8 h-8 text-on-surface-variant" />
                </div>
                <h5 className="font-black text-on-surface mb-2">Sin compras registradas</h5>
                <p className="text-on-surface-muted text-sm max-w-[280px] mx-auto font-medium">
                  Aquí verás las compras realizadas por tus referidos y las comisiones generadas en tiempo real.
                </p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-base border-b border-outline italic">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-muted">Referido e ID</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-muted">Restaurante</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-muted">Total Gastado</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-muted text-right">Ganancia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {referralOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-surface-base/50 transition-colors group">
                      <td className="px-8 py-6">
                        <p className="font-black text-sm text-on-surface">{order.customerName}</p>
                        <p className="text-[10px] text-on-surface-muted font-bold tracking-widest uppercase">ID: #{order.id.slice(0, 8)}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-xs font-black text-on-surface-variant uppercase tracking-wide">{order.restaurantName}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-black text-on-surface">{formatCurrency(order.total || 0)}</p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full text-xs font-black">
                          + {formatCurrency(order.commission || 0)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 relative z-20 pb-6">
              
              {pendingRequests.length > 0 && (
                <div className="mx-6 mt-6">
                  <h3 className="text-on-surface font-black mb-4">Solicitudes Pendientes</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {pendingRequests.map(req => (
                      <div key={req.id} className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex justify-between items-center">
                        <div>
                           <p className="font-bold text-amber-900">{req.restaurantName}</p>
                           <p className="text-xs text-amber-700/80 font-medium">Esperando aprobación</p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                           <TrendingUp className="w-4 h-4 animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              
              
              {enrolledRestaurants.length === 0 ? (
                <div className="py-20 text-center px-6">
                  <div className="w-16 h-16 bg-surface-variant rounded-full flex items-center justify-center mx-auto mb-6">
                    <Info className="w-8 h-8 text-on-surface-variant" />
                  </div>
                  <h5 className="font-black text-on-surface mb-2">Aún no estás inscrito en restaurantes</h5>
                  <p className="text-on-surface-muted text-sm max-w-[280px] mx-auto font-medium">
                    Explora restaurantes y únete a sus programas de referidos.
                  </p>
                </div>
              ) : (
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {enrolledRestaurants.map(r => (
                    <div key={r.id} className="bg-surface-base border border-outline p-4 rounded-2xl flex items-center gap-4">
                       <div className="w-12 h-12 bg-surface-base rounded-xl overflow-hidden shrink-0">
                         <img src={r.logo || r.coverImage || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=150"} alt={r.name} className="w-full h-full object-cover" />
                       </div>
                       <div className="flex-1">
                         <h5 className="font-black text-on-surface text-sm">{r.name}</h5>
                         <p className="text-[10px] text-on-surface-muted font-bold uppercase tracking-widest">
                           Comisión: {r.referralCommissionType === "percentage" ? `${r.referralCommissionValue}%` : formatCurrency(r.referralCommissionValue)}
                         </p>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Withdrawal Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWithdrawModal(false)}
              className="absolute inset-0 bg-blue-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card/95 backdrop-blur-xl w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative z-10 overflow-hidden border border-white/20"
            >
              <div className="absolute top-0 right-0 p-8">
                <button 
                  onClick={() => setShowWithdrawModal(false)}
                  className="p-3 hover:bg-surface-variant rounded-full transition-colors"
                >
                  <XCircle className="w-6 h-6 text-on-surface-variant" />
                </button>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-orange-600 rounded-[1.2rem] flex items-center justify-center shadow-lg shadow-orange-600/20">
                    <Wallet className="w-7 h-7 text-on-surface" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-on-surface tracking-tight">Retirar Ganancias</h3>
                    <p className="text-on-surface-muted font-medium text-sm">Transferencia directa a tu cuenta Nequi</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Amount Input */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-muted px-1">Monto a retirar</label>
                    <div className="relative">
                      <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-muted w-5 h-5" />
                      <input 
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-surface-base border-2 border-outline rounded-[1.2rem] py-5 px-14 font-black text-xl text-on-surface focus:outline-none focus:border-zinc-900 transition-all placeholder:text-neutral-200"
                      />
                    </div>
                    <div className="flex justify-between items-center px-1">
                      <p className="text-[10px] font-black text-on-surface-muted">Saldo disponible: {formatCurrency(appUser?.referralBalance || 0)}</p>
                      <button 
                        onClick={() => setWithdrawAmount((appUser?.referralBalance || 0).toString())}
                        className="text-[10px] font-black text-orange-600 uppercase hover:underline"
                      >
                        Retirar todo
                      </button>
                    </div>
                  </div>

                  {/* Method Selection (Nequi focused) */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-muted px-1">Método de pago</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setWithdrawMethod("nequi")}
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                          withdrawMethod === "nequi" 
                          ? "border-zinc-900 bg-zinc-50" 
                          : "border-outline hover:border-outline"
                        }`}
                      >
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="font-black text-xs uppercase">Nequi</span>
                      </button>
                      <button 
                        disabled
                        className="flex items-center gap-3 p-4 rounded-2xl border-2 border-neutral-50 opacity-50 cursor-not-allowed"
                      >
                        <div className="w-10 h-10 bg-surface-variant rounded-xl flex items-center justify-center">
                          <Wallet className="w-5 h-5 text-on-surface-muted" />
                        </div>
                        <span className="font-black text-xs uppercase">Efectivo</span>
                      </button>
                    </div>
                  </div>

                  {/* Nequi Number */}
                  {withdrawMethod === "nequi" && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-3"
                    >
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-muted px-1">Número de celular Nequi</label>
                      <div className="relative">
                        <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-muted w-5 h-5" />
                        <input 
                          type="tel"
                          value={nequiNumber}
                          onChange={(e) => setNequiNumber(e.target.value)}
                          placeholder="300 000 0000"
                          className="w-full bg-surface-base border-2 border-outline rounded-[1.2rem] py-5 px-14 font-black text-xl text-on-surface focus:outline-none focus:border-orange-500 transition-all placeholder:text-neutral-200"
                        />
                      </div>
                    </motion.div>
                  )}

                  <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100 flex gap-4">
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                    <p className="text-[10px] leading-relaxed font-bold text-orange-800 uppercase tracking-wider">
                      Las solicitudes de retiro son procesadas en un máximo de 24 horas hábiles por el restaurante. Serás notificado una vez se complete la transferencia.
                    </p>
                  </div>

                  <button 
                    onClick={handleWithdrawRequest}
                    disabled={isSubmitting}
                    className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-neutral-300 text-on-surface h-16 rounded-[1.5rem] font-black text-base uppercase tracking-widest shadow-xl shadow-orange-600/20 flex items-center justify-center gap-3 transition-all active:scale-95"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <ArrowUpRight className="w-5 h-5" />
                        Confirmar Retiro
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
