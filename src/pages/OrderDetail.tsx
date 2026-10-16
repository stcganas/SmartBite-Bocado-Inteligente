import { formatCurrency } from '../utils/format';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, Order } from '../store/db';
import { ArrowLeft, Clock, CheckCircle2, X, ChefHat, Truck, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, appUser } = useAuth();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!order || order.status === 'cancelled' || order.status === 'completed' || order.status === 'shipped' || order.status === 'on_the_way' || order.status === 'rejected') {
      setTimeLeft(0);
      return;
    }

    const calculateTimeLeft = () => {
      const createdAtTime = new Date(order.createdAt).getTime();
      const limitTime = createdAtTime + 5 * 60 * 1000; // 5 minutes
      const now = Date.now();
      const diffMs = limitTime - now;
      return Math.max(0, Math.floor(diffMs / 1000));
    };

    const initialDiff = calculateTimeLeft();
    setTimeLeft(initialDiff);

    if (initialDiff <= 0) return;

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [order]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!window.confirm("¿Estás seguro de que quieres cancelar este pedido? Se le notificará inmediatamente al restaurante.")) {
      return;
    }

    setCancelling(true);
    try {
      const displayName = appUser?.displayName || user?.email || "Cliente de SmartBite";
      await db.cancelOrderByCustomer(order.id, displayName);
      toast.success("Tu pedido ha sido cancelado exitosamente.");
      
      setOrder(prev => prev ? { ...prev, status: 'cancelled' } : null);
    } catch (err: any) {
      toast.error(err?.message || "Ocurrió un error al intentar cancelar el pedido.");
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await db.getOrder(id);
      if (error) {
        toast.error('Error al cargar detalles del pedido');
      } else {
        setOrder(data);
      }
      setLoading(false);
    };
    fetchOrder();

    if (id) {
      const unsubscribe = db.subscribeToOrderUpdates(id, (updatedOrder) => {
        setOrder(updatedOrder);
        toast.info(`Estado del pedido actualizado: ${updatedOrder.status.toUpperCase()}`, {
          icon: '📦',
          duration: 4000
        });
      });
      return () => { unsubscribe(); };
    }

  }, [id]);

  if (loading) return <div className="p-8 text-center">Cargando pedido...</div>;
  if (!order) return <div className="p-8 text-center">Pedido no encontrado.</div>;

  // Determine current step
  let currentStep = 0;
  if (order.status === 'pending') currentStep = 1;
  else if (['approved', 'accepted', 'preparing'].includes(order.status)) currentStep = 2;
  else if (['assigned', 'shipped', 'on_the_way'].includes(order.status)) currentStep = 3;
  else if (order.status === 'completed') currentStep = 4;
  else if (['cancelled', 'rejected'].includes(order.status)) currentStep = -1; // Error state

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <Link to="/" className="flex items-center gap-2 mb-6 text-primary font-bold">
        <ArrowLeft className="w-5 h-5" /> Volver al Inicio
      </Link>
      
      <div className="glass-card text-on-surface rounded-[2.5rem] p-6 sm:p-8 shadow-elevation-2 border border-outline overflow-hidden relative">
        <div className="absolute top-0 right-0 p-6 sm:p-8">
           <div className={`px-4 py-2 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] ${
             order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
             order.status === 'rejected' || order.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
             'bg-amber-100 text-amber-700'
           }`}>
             {order.status}
           </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black mb-8 tracking-tight text-on-surface">Estado del Pedido</h2>
        
        {/* Live Tracking Timeline */}
        {currentStep !== -1 ? (
          <div className="mb-12 relative px-4">
            <div className="absolute top-1/2 left-8 right-8 h-1.5 bg-surface-variant -translate-y-1/2 rounded-full hidden sm:block">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${(currentStep - 1) * 33.33}%` }}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between relative z-10 gap-6 sm:gap-0">
              {[
                { step: 1, label: 'Recibido', icon: Clock, color: currentStep >= 1 ? 'bg-emerald-500 text-white' : 'bg-surface-variant text-on-surface-muted', pulse: currentStep === 1 },
                { step: 2, label: 'Preparando', icon: ChefHat, color: currentStep >= 2 ? 'bg-emerald-500 text-white' : 'bg-surface-variant text-on-surface-muted', pulse: currentStep === 2 },
                { step: 3, label: 'En Camino', icon: Truck, color: currentStep >= 3 ? 'bg-emerald-500 text-white' : 'bg-surface-variant text-on-surface-muted', pulse: currentStep === 3 },
                { step: 4, label: 'Entregado', icon: CheckCircle2, color: currentStep >= 4 ? 'bg-emerald-500 text-white' : 'bg-surface-variant text-on-surface-muted', pulse: currentStep === 4 }
              ].map((s) => (
                <div key={s.step} className="flex sm:flex-col items-center gap-4 sm:gap-2">
                  <div className="relative">
                    {s.pulse && <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-50" />}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-4 border-white ${s.color} transition-all duration-500 shadow-lg relative z-10`}>
                      <s.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex-1 sm:text-center">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${currentStep >= s.step ? 'text-on-surface' : 'text-on-surface-muted'}`}>
                      {s.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-12 p-6 bg-rose-50 rounded-3xl border border-rose-100 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4">
              <X className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-lg font-black text-rose-950 mb-1">Pedido {order.status === 'cancelled' ? 'Cancelado' : 'Rechazado'}</h3>
            <p className="text-sm text-rose-700 font-medium">Este pedido no pudo ser procesado o fue cancelado.</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-surface-base rounded-2xl">
              <span className="font-black text-[10px] uppercase tracking-widest text-on-surface-muted block mb-1">ID Pedido</span>
              <span className="font-black text-on-surface text-sm">#{order.id.slice(-6).toUpperCase()}</span>
            </div>
            <div className="p-4 bg-surface-base rounded-2xl">
              <span className="font-black text-[10px] uppercase tracking-widest text-on-surface-muted block mb-1">Fecha</span>
              <span className="font-black text-on-surface text-sm">{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {timeLeft > 0 && currentStep === 1 && (
            <div className="p-5 bg-rose-50 rounded-[2rem] border border-rose-100/80 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-on-surface shrink-0 animate-pulse">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-rose-950 leading-tight">¿Deseas cancelar el pedido?</h4>
                  <p className="text-xs text-rose-700 font-bold mt-0.5">
                    Tienes <span className="font-black text-rose-950 underline">{formatTime(timeLeft)}</span> para cancelar antes de que el restaurante inicie preparación.
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="w-full md:w-auto bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-on-surface text-[11px] font-black uppercase tracking-widest px-6 py-3 rounded-2xl transition-all shadow-md shadow-rose-600/15 shrink-0 disabled:opacity-50"
              >
                {cancelling ? "Cancelando..." : "Cancelar Pedido"}
              </button>
            </div>
          )}

          <div className="space-y-4 pt-4 border-t border-outline">
            <h3 className="font-black text-xs uppercase tracking-widest text-on-surface-muted">Información de Entrega</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-surface-variant rounded-lg flex items-center justify-center text-on-surface-muted shrink-0">
                   <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-muted leading-none mb-1">Destinatario</p>
                  <p className="font-bold text-on-surface">{order.recipientName || order.customerName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-surface-variant rounded-lg flex items-center justify-center text-on-surface-muted shrink-0">
                   <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-muted leading-none mb-1">Teléfono</p>
                  <p className="font-bold text-on-surface">{order.customerPhone || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-surface-variant rounded-lg flex items-center justify-center text-on-surface-muted shrink-0">
                   <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-muted leading-none mb-1">Dirección</p>
                  <p className="font-bold text-on-surface">{order.address || (order.tableNumber ? `Mesa ${order.tableNumber}` : 'N/A')}</p>
                </div>
              </div>
            </div>
          </div>

          {order.note && (
            <div className="p-5 bg-amber-50 rounded-[2rem] border border-amber-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-1">Instrucciones Especiales</p>
              <p className="font-medium text-amber-900">{order.note}</p>
            </div>
          )}
          
          <div className="mt-8 pt-8 border-t border-outline">
            <h3 className="font-black text-xs uppercase tracking-widest text-on-surface-muted mb-4">Productos</h3>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-surface-base/50 p-4 rounded-2xl border border-outline/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-black text-xs shrink-0">
                      {item.quantity}x
                    </div>
                    <span className="font-bold text-on-surface">{(item as any).product?.name || (item as any).name}</span>
                  </div>
                  <span className="font-black text-on-surface shrink-0 ml-4">{formatCurrency((((item as any).product?.price || (item as any).price || 0) * item.quantity))}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-outline space-y-2">
              <div className="flex justify-between items-center text-on-surface-muted font-bold">
                <span>Subtotal</span>
                <span>{formatCurrency((order.total - (order.tipAmount || 0)))}</span>
              </div>
              {order.tipAmount > 0 && (
                <div className="flex justify-between items-center text-emerald-600 font-bold">
                  <span>Propina</span>
                  <span>+{formatCurrency(order.tipAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2">
                <span className="text-xl font-black text-on-surface">Total</span>
                <span className="text-3xl font-black text-primary">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
