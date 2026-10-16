import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  Send,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { db, SupportTicket, Restaurant } from '../store/db';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';

const SupportTickets = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // New ticket form
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [ticketsData, restaurantsData] = await Promise.all([
        db.getUserSupportTickets(user!.id),
        db.getRestaurants()
      ]);
      setTickets(ticketsData);
      setRestaurants(restaurantsData);
    } catch (error) {
      console.error('Error fetching support data:', error);
      toast.error('Error al cargar tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) return;

    setSubmitting(true);
    try {
      const { error } = await db.createSupportTicket({
        userId: user!.id,
        restaurantId: restaurantId || undefined,
        subject,
        description,
        priority
      });

      if (error) throw error;

      toast.success('Ticket creado correctamente');
      setSubject('');
      setDescription('');
      setRestaurantId('');
      setIsCreating(false);
      fetchData();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('No se pudo crear el ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700';
      case 'in_progress': return 'bg-amber-100 text-amber-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      case 'closed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (prio: string) => {
    switch (prio) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-amber-500';
      case 'low': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Inicia sesión</h2>
          <p className="text-gray-600 mb-6">Debes estar ingresado para gestionar tus tickets de soporte.</p>
          <Link 
            to="/auth" 
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-on-surface bg-orange-600 hover:bg-orange-700 transition-colors"
          >
            Ir a Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="glass-card text-on-surface border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Soporte Técnico</h1>
          </div>
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 bg-orange-600 text-on-surface px-4 py-2 rounded-xl text-sm font-semibold hover:bg-orange-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nuevo Ticket
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {isCreating ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Crear Nueva Solicitud</h2>
              <button 
                onClick={() => setIsCreating(false)}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium"
              >
                Cancelar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ej: Problema con un pedido, Error en el menú..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Restaurante Relacionado (Opcional)</label>
                <select
                  value={restaurantId}
                  onChange={(e) => setRestaurantId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all glass-card text-on-surface"
                >
                  <option value="">General / Plataforma</option>
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-2 px-4 rounded-xl border text-sm font-medium capitalize transition-all ${
                        priority === p 
                          ? 'border-orange-500 bg-orange-50 text-orange-700' 
                          : 'border-gray-200 glass-card text-on-surface text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {p === 'low' ? 'Baja' : p === 'medium' ? 'Media' : 'Alta'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del Problema</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe detalladamente qué está ocurriendo..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-orange-600 text-on-surface py-4 rounded-xl font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Enviar Ticket
                  </>
                )}
              </button>
            </form>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-orange-50 p-6 rounded-2xl border border-orange-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-600 rounded-xl text-on-surface">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">¿Necesitas ayuda?</h3>
                  <p className="text-gray-600 text-sm">Nuestro equipo de soporte está listo para asistirte.</p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-900">Tus Tickets Recientes</h2>
                <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                  {tickets.length} solicitudes
                </span>
              </div>

              {loading ? (
                <div className="p-12 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
                  <p className="text-gray-500 text-sm">Cargando tus solicitudes...</p>
                </div>
              ) : tickets.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {tickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      to={`/support/ticket/${ticket.id}`}
                      className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex gap-4">
                        <div className="relative">
                          {ticket.restaurant ? (
                            <img 
                              src={ticket.restaurant.logo} 
                              alt={ticket.restaurant.name}
                              className="w-12 h-12 rounded-xl object-cover border border-gray-100"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                              <AlertCircle className="w-6 h-6" />
                            </div>
                          )}
                          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(ticket.status === 'open' ? 'open' : ticket.status === 'resolved' ? 'resolved' : 'in_progress').split(' ')[0]}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                              {ticket.subject}
                            </h4>
                            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${getStatusColor(ticket.status)}`}>
                              {ticket.status === 'open' ? 'Pendiente' : ticket.status === 'in_progress' ? 'En Trámite' : ticket.status === 'resolved' ? 'Resuelto' : 'Cerrado'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-1 mb-2">
                            {ticket.description}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </span>
                            {ticket.restaurant && (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {ticket.restaurant.name}
                              </span>
                            )}
                            <span className={`font-medium ${getPriorityColor(ticket.priority)}`}>
                              Prioridad {ticket.priority === 'high' ? 'Alta' : ticket.priority === 'medium' ? 'Media' : 'Baja'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-400 transition-transform group-hover:translate-x-1" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">Sin tickets activos</h3>
                  <p className="text-gray-500 text-sm mb-6">No tienes ninguna solicitud de soporte abierta en este momento.</p>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="text-orange-600 font-bold hover:text-orange-700 transition-colors"
                  >
                    Crear mi primer ticket
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SupportTickets;
