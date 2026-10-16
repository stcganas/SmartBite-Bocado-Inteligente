import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Users, 
  Gift, 
  TrendingUp, 
  ArrowLeft, 
  CheckCircle2, X, 
  Share2, 
  Info, 
  Sparkles, 
  BadgePercent, 
  Coins,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { db, Restaurant, PlatformSettings } from '../store/db';
import { toast } from 'sonner';
import { formatCurrency } from '../utils/format';

export default function ReferralProgramInfo() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const { user, appUser, refreshAppUser } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [hasAffiliationLimitRequest, setHasAffiliationLimitRequest] = useState(false);
  const [isRequestingLimit, setIsRequestingLimit] = useState(false);


  useEffect(() => {
    
    async function loadData() {
      try {
        let currentRestaurantId = restaurantId;
        
        // Fallback to the first available restaurant if none is provided via URL
        if (!currentRestaurantId) {
           const allRestaurants = await db.getRestaurants();
           const available = allRestaurants.filter(r => r.referralEnabled);
           if (available.length > 0) {
              currentRestaurantId = available[0].id;
           } else if (allRestaurants.length > 0) {
              currentRestaurantId = allRestaurants[0].id;
           }
        }
        
        if (!currentRestaurantId) return;

        const r = await db.getRestaurant(currentRestaurantId);
        setRestaurant(r);
        
        // check pending request if user is logged in
        if (appUser) {
           const reqs = await db.getReferralRequests();
           const pending = reqs.find(req => req.restaurantId === currentRestaurantId && req.userId === appUser.id && req.status === 'pending');
           if (pending) setHasPendingRequest(true);
           
           const limitRequest = reqs.find(req => req.restaurantId === 'platform_affiliation_limit' && req.userId === appUser.id && req.status === 'pending');
           if (limitRequest) setHasAffiliationLimitRequest(true);
        }

        const settings = await db.getPlatformSettings();
        setPlatformSettings(settings);
      } catch (err) {
        console.error("Error loading restaurant info:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [restaurantId]);

  const isEnrolled = appUser?.anniversaries?.some(
    (a) => a.type === 'referral_enrollment' && a.date === restaurant?.id
  );

  const userAffiliationsCount = appUser?.anniversaries?.filter(a => a.type === 'referral_enrollment').length || 0;
  const maxAffiliations = appUser?.maxRestaurantAffiliations || platformSettings?.referralSettings?.maxFreeAffiliations || 5;
  const reachedLimit = userAffiliationsCount >= maxAffiliations;

  const handleEnrollClick = () => {
    if (!user || !appUser) {
      toast.error('Inicia sesión para inscribirte al programa');
      navigate('/auth', { state: { from: restaurant?.id ? `/referrals-info/${restaurant.id}` : '/referrals-info' } });
      return;
    }
    if (isEnrolled) {
      toast.info('Ya estás inscrito en este programa');
      return;
    }
    if (reachedLimit) {
      return; // Handled by UI showing different state
    }
    setShowConfirmModal(true);
  };

  const handleRequestMoreSlots = async () => {
    if (!user || !appUser) return;
    setIsRequestingLimit(true);
    try {
      await db.createReferralRequest({
        userId: appUser.id,
        userName: appUser.displayName || 'Usuario sin nombre',
        userEmail: appUser.email || user.email || 'Sin correo',
        userPhone: appUser.phone || 'Sin número',
        restaurantId: 'platform_affiliation_limit',
        restaurantName: 'Aumento de Límite de Afiliaciones'
      });
      setHasAffiliationLimitRequest(true);
      toast.success('Solicitud enviada al administrador.');
    } catch (err) {
      console.error(err);
      toast.error('Error al enviar solicitud');
    } finally {
      setIsRequestingLimit(false);
    }
  };

  const submitEnrollRequest = async () => {
    if (!user || !appUser || !restaurant) return;
    setIsEnrolling(true);
    try {
      await db.createReferralRequest({
        userId: appUser.id,
        userName: appUser.displayName || 'Usuario sin nombre',
        userEmail: appUser.email || user.email || 'Sin correo',
        userPhone: appUser.phone || 'Sin número',
        restaurantId: restaurant.id,
        restaurantName: restaurant.name
      });
      setHasPendingRequest(true);
      setShowConfirmModal(false);
      
      // Notify Super Admins
      try {
        await fetch("/api/notifications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: "all_admins",
            title: `Nueva solicitud de referido: ${appUser.displayName}`,
            body: `${appUser.displayName} ha solicitado unirse al programa de referidos de ${restaurant.name}.`,
            data: { type: "referral_request" }
          })
        });
      } catch (notifErr) {
        console.warn("Failed to notify admins of new enrollment request", notifErr);
      }

      toast.success('Solicitud enviada con éxito. Será revisada por un administrador.');
    } catch(err) {
      console.error(err);
      toast.error('Ocurrió un error al enviar la solicitud');
    } finally {
      setIsEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!restaurant || !restaurant.referralEnabled) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-surface-variant rounded-full flex items-center justify-center mx-auto mb-6">
          <Info className="w-8 h-8 text-on-surface-muted" />
        </div>
        <h3 className="text-xl font-black mb-2 text-on-surface">Programa No Encontrado</h3>
        <p className="text-on-surface-muted mb-6 font-medium">Este restaurante no tiene un programa de referidos activo actualmente.</p>
        <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-surface-variant text-on-surface font-black rounded-2xl hover:bg-surface-light transition-all">
          <ArrowLeft className="w-4 h-4" /> Volver al Inicio
        </Link>
      </div>
    );
  }

  const commissionStr = restaurant.referralCommissionType === 'percentage' 
    ? `${restaurant.referralCommissionValue}% del total de cada pedido`
    : `${formatCurrency(restaurant.referralCommissionValue || 0)} fijos por pedido`;

  return (
    <div className="min-h-screen bg-surface-variant/30 py-6 sm:py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center gap-2 text-xs font-black uppercase text-on-surface-muted hover:text-on-surface transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        {/* Hero banner explaining Refer and Earn */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-orange-950 rounded-[2.5rem] p-8 sm:p-12 text-on-surface relative overflow-hidden border border-white/10 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4 max-w-lg">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 glass-card text-on-surface/10 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-orange-400">
                <Sparkles className="w-3 h-3 text-orange-400 animate-pulse" /> Programa Especial de Referencia
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none text-on-surface">
                Refiere, Gana y Comparte en <span className="text-transparent bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text">{restaurant.name}</span>
              </h1>
              <p className="text-sm font-medium text-indigo-100/80 leading-relaxed">
                ¡Es momento de convertir tu recomendación en ganancias reales! Recomienda a tus amigos {restaurant.name} y llévate una recompensa en efectivo por cada uno de sus pedidos completados.
              </p>
            </div>
            
            <div className="glass-card text-on-surface/5 border border-white/10 backdrop-blur-md rounded-3xl p-6 text-center shrink-0 w-full md:w-56 flex flex-col justify-center items-center gap-2">
              <div className="p-3 bg-orange-500/20 text-orange-400 rounded-2xl">
                {restaurant.referralCommissionType === 'percentage' ? (
                  <BadgePercent className="w-8 h-8" />
                ) : (
                  <Coins className="w-8 h-8" />
                )}
              </div>
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider">Tu Recompensa</p>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-on-surface leading-none">
                {restaurant.referralCommissionType === 'percentage' 
                  ? `${restaurant.referralCommissionValue}%`
                  : formatCurrency(restaurant.referralCommissionValue || 0)}
              </h3>
              <p className="text-[9px] text-on-surface-muted font-bold leading-tight uppercase tracking-widest text-center mt-1">Por cada compra efectuada</p>
            </div>
          </div>
        </div>

        {/* Explain the Steps detailedly */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Users,
              color: 'text-indigo-600 bg-indigo-50',
              title: '1. Regístrate',
              desc: 'Inscríbete gratis al programa con un solo clic. Te daremos tu propio código de referencia.'
            },
            {
              icon: Share2,
              color: 'text-orange-600 bg-orange-50',
              title: '2. Comparte',
              desc: 'Envía tu enlace o código a tus conocidos, familiares y amigos que quieran disfrutar la mejor comida.'
            },
            {
              icon: Gift,
              color: 'text-emerald-600 bg-emerald-50',
              title: '3. Recibe Fondos',
              desc: 'En cuanto tu referido reciba su pedido, recibirás tu comisión directo en tu balance acumulado.'
            }
          ].map((step, idx) => {
            const IconComponent = step.icon;
            return (
              <div key={idx} className="glass-card p-6 rounded-[2rem] border border-outline shadow-sm space-y-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${step.color}`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="font-black text-base text-on-surface leading-none">{step.title}</h3>
                <p className="text-xs text-on-surface-muted font-medium leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Details and transparency panel */}
        <div className="glass-card text-on-surface rounded-[2.5rem] border border-outline p-8 sm:p-10 shadow-sm space-y-6">
          <h2 className="text-xl font-black tracking-tight text-on-surface">Transparencia y Condiciones del Programa</h2>
          
          <div className="space-y-4">
            <div className="flex gap-4 items-start p-4 bg-surface-base rounded-2xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-on-surface text-sm">Comisiones automáticas</p>
                <p className="text-on-surface-muted text-xs font-medium leading-relaxed mt-0.5">
                  El sistema detecta automáticamente cuando una referencia tuya hace una compra. El pago de la comisión ({commissionStr}) se aplica en tiempo real a tu saldo una vez que el restaurante marca el pedido como completado.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start p-4 bg-surface-base rounded-2xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-on-surface text-sm">Monitoreo en Vivo</p>
                <p className="text-on-surface-muted text-xs font-medium leading-relaxed mt-0.5">
                  Desde tu Panel de Perfil de la aplicación podrás ver la lista completa de todas las compras hechas por tus referidos para ofrecerte total claridad. Te llegará una notificación de inmediato por la app y notificación push en tu celular cada vez que uno de tus referidos compre.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start p-4 bg-surface-base rounded-2xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-on-surface text-sm">Retiros Rápidos a Nequi</p>
                <p className="text-on-surface-muted text-xs font-medium leading-relaxed mt-0.5">
                  Puedes solicitar la transferencia de tu saldo acumulado cuando gustes. Podrás ingresar tu número de celular Nequi y el restaurante enviará los fondos en un plazo máximo de 24 horas hábiles.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start p-4 bg-orange-50 border border-orange-200 rounded-2xl">
              <Info className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-orange-700 text-sm italic">¡Nota Importante!</p>
                <p className="text-orange-900/80 text-[11px] font-bold leading-relaxed mt-1">
                  Solo ganarás comisiones por las compras que tus referidos realicen en <span className="font-black underline">{restaurant.name}</span>. 
                  Si tus referidos compran en otros restaurantes donde no estás afiliado, no generarás ganancias de esas ventas. 
                  ¡Inscríbete a los programas de otros restaurantes si deseas ganar de ellos también!
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-outline pt-8 flex flex-col items-center justify-center gap-4">
            {isEnrolled ? (
              <div className="w-full text-center space-y-4">
                <div className="inline-flex items-center gap-2 bg-emerald-50 px-6 py-3 border border-emerald-100 text-emerald-700 font-black rounded-full text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 animate-bounce" /> ¡Ya estás inscrito en este programa!
                </div>
                <p className="text-xs text-on-surface-muted font-bold max-w-md mx-auto">
                  Ve a tu menú de perfil y comparte tu código de referido para empezar a acumular saldo.
                </p>
                <div className="flex justify-center gap-4 pt-2">
                  <Link 
                    to="/profile?tab=referral" 
                    className="px-6 py-3 bg-surface-variant hover:bg-surface-light text-on-surface font-black rounded-2xl text-xs uppercase tracking-wider"
                  >
                    Ver mi Panel de Referidos
                  </Link>
                </div>
              </div>
            ) : hasPendingRequest ? (
              <div className="w-full text-center space-y-4">
                <div className="inline-flex items-center gap-2 bg-amber-50 px-6 py-3 border border-amber-100 text-amber-700 font-black rounded-full text-sm">
                  <TrendingUp className="w-5 h-5 text-amber-600 animate-pulse" /> Solicitud en revisión
                </div>
                <p className="text-xs text-on-surface-muted font-bold max-w-md mx-auto">
                  Tu solicitud ha sido enviada al administrador. Recibirás una notificación cuando sea aprobada.
                </p>
              </div>
            ) : reachedLimit ? (
              <div className="w-full text-center space-y-6">
                <div className="bg-rose-50 text-rose-700 px-6 py-6 rounded-3xl border border-rose-100 flex flex-col items-center justify-center gap-3">
                  <div className="p-3 bg-white rounded-2xl shadow-sm">
                    <Info className="w-8 h-8 text-rose-500" />
                  </div>
                  <h4 className="font-black text-lg">Límite de Afiliaciones Alcanzado</h4>
                  <p className="text-xs font-bold text-rose-600/80 max-w-xs mx-auto leading-relaxed">
                    Actualmente tienes un límite de {maxAffiliations} restaurantes gratuitos. Solicita un aumento de cupo para unirte a más programas.
                  </p>
                </div>
                
                {hasAffiliationLimitRequest ? (
                  <div className="flex items-center gap-2 text-indigo-600 font-black justify-center bg-indigo-50 px-8 py-4 rounded-2xl border border-indigo-100 uppercase tracking-widest text-xs">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Solicitud de cupos enviada
                  </div>
                ) : (
                  <button 
                    onClick={handleRequestMoreSlots}
                    disabled={isRequestingLimit}
                    className="w-full max-w-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-300 text-white h-16 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 transition-all active:scale-95 duration-200"
                  >
                    {isRequestingLimit ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Solicitar más Cupos de Afiliación
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={handleEnrollClick}
                disabled={isEnrolling}
                className="w-full max-w-md bg-orange-600 hover:bg-orange-500 disabled:bg-neutral-300 text-on-surface h-16 rounded-[1.5rem] font-black text-base uppercase tracking-widest shadow-xl shadow-orange-600/30 flex items-center justify-center gap-3 transition-all active:scale-95 duration-200"
                id="referral_program_enroll_btn"
              >
                {isEnrolling ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5 animate-pulse" />
                    Inscribirme al programa
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      
      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-base border border-outline rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-4 right-4 text-on-surface-muted hover:text-on-surface bg-surface-variant rounded-full p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-black text-on-surface mb-2">Confirmar Solicitud</h3>
            <p className="text-sm text-on-surface-muted mb-4 font-medium">
              Al confirmar, enviaremos tus datos registrados a <b>{restaurant?.name}</b> y al Super Administrador para tu aprobación.
            </p>
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-4">
              <p className="text-[10px] text-orange-800 font-bold leading-tight">
                ⚠️ RECUERDA: Solo ganarás comisiones de los pedidos realizados específicamente en este restaurante ({restaurant?.name}).
              </p>
            </div>
            <div className="bg-surface-variant rounded-xl p-3 mb-6">
               <p className="text-xs text-on-surface-variant font-bold uppercase mb-1">Tus datos a enviar:</p>
               <p className="text-sm text-on-surface font-medium">Nombre: {appUser?.displayName || 'Asignado'}</p>
               <p className="text-sm text-on-surface font-medium">Email: {appUser?.email || user?.email || 'N/A'}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-3 bg-surface-variant text-on-surface font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={submitEnrollRequest}
                disabled={isEnrolling}
                className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl flex items-center justify-center"
              >
                {isEnrolling ? <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent" /> : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
