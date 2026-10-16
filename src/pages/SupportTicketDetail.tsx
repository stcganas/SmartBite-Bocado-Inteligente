import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Clock, 
  MessageSquare, 
  AlertCircle,
  Loader2,
  User,
  Building2,
  Calendar,
  Settings
} from 'lucide-react';
import { db, SupportTicket } from '../store/db';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const SupportTicketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, appUser } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && id) {
      fetchTicket();
    }
  }, [user, id]);

  const fetchTicket = async () => {
    try {
      const ticketData = await db.getSupportTicketById(id!);
      if (ticketData) {
        setTicket(ticketData);
      } else {
        toast.error('Ticket no encontrado');
        navigate('/support');
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
      toast.error('No se pudo cargar el ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: SupportTicket['status']) => {
    if (!id || !user) return;
    try {
      const { error } = await db.updateSupportTicketStatus(id, newStatus);
      if (error) throw error;
      toast.success('Estado actualizado');
      fetchTicket();
    } catch (error) {
      toast.error('No se pudo actualizar el estado');
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Abierto';
      case 'in_progress': return 'En Proceso';
      case 'resolved': return 'Resuelto';
      case 'closed': return 'Cerrado';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'in_progress': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'resolved': return 'bg-green-100 text-green-700 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="glass-card text-on-surface border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Detalles del Ticket</h1>
            <p className="text-xs text-gray-500">ID: {ticket.id.split('-')[0].toUpperCase()}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusColor(ticket.status)}`}>
                  {getStatusLabel(ticket.status)}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
                  ticket.priority === 'high' ? 'bg-red-50 text-red-700 border-red-100' :
                  ticket.priority === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                  'bg-blue-50 text-blue-700 border-blue-100'
                }`}>
                  {ticket.priority === 'high' ? 'Prioridad Alta' : 
                   ticket.priority === 'medium' ? 'Prioridad Media' : 
                   'Prioridad Baja'}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">{ticket.subject}</h2>
              
              <div className="prose prose-orange max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {ticket.description}
                </p>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-100">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Creado: {new Date(ticket.createdAt).toLocaleDateString()} {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Timeline Placeholder */}
            <div className="glass-card rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-8">
                <MessageSquare className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-gray-900">Historial de Actividad</h3>
              </div>

              <div className="relative space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                {/* Status Update Example */}
                <div className="relative pl-10">
                  <div className="absolute left-0 top-1 p-1 glass-card text-on-surface border-2 border-orange-500 rounded-full z-10">
                    <Clock className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Ticket Creado</p>
                    <p className="text-sm text-gray-500 mb-1">Tu solicitud ha sido recibida y está a la espera de ser procesada.</p>
                    <p className="text-[10px] text-gray-400">{new Date(ticket.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div className="relative pl-10">
                  <div className="absolute left-0 top-1 p-1 bg-gray-100 rounded-full z-10">
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 text-gray-400 italic">Esperando respuesta del soporte...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="glass-card rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                Usuario
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                  {appUser?.displayName?.[0] || user?.email?.[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{appUser?.displayName || 'Usuario'}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>

              <hr className="my-6 border-gray-50" />

              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                Relacionado con
              </h3>
              {ticket.restaurant ? (
                <Link 
                  to={`/restaurant/${ticket.restaurant.id}`}
                  className="flex items-center gap-3 hover:bg-gray-50 p-2 -m-2 rounded-xl transition-colors"
                >
                  <img 
                    src={ticket.restaurant.logo} 
                    alt={ticket.restaurant.name}
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{ticket.restaurant.name}</p>
                    <p className="text-xs text-orange-600 font-medium">Ver restaurante</p>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center text-gray-500">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">Soporte General</p>
                </div>
              )}
            </div>

            {(appUser?.role === 'admin' || (appUser?.role === 'restaurant' && ticket.restaurantId)) && (
              <div className="glass-card rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-gray-400" />
                  Gestionar Ticket
                </h3>
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 font-medium">Actualizar estado de la solicitud:</p>
                  <div className="flex flex-col gap-2">
                    {(['open', 'in_progress', 'resolved', 'closed'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleUpdateStatus(status)}
                        disabled={ticket.status === status}
                        className={`w-full py-2.5 px-4 rounded-xl text-sm font-bold border transition-all ${
                          ticket.status === status
                            ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed'
                            : 'glass-card text-on-surface text-gray-700 border-gray-200 hover:border-orange-500 hover:text-orange-600'
                        }`}
                      >
                        Marcar como {getStatusLabel(status)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-orange-600 rounded-2xl p-6 text-on-surface text-center shadow-lg shadow-orange-600/20">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-bold mb-2">¿Tienes más dudas?</p>
              <p className="text-xs text-orange-100 mb-4">Nuestro equipo suele responder en menos de 24 horas hábiles.</p>
              <a 
                href={`mailto:soporte@smartbite.com?subject=Re: Ticket ${ticket.id}`} 
                className="block w-full py-3 glass-card text-on-surface text-orange-600 rounded-xl text-sm font-bold hover:bg-orange-50 transition-colors"
              >
                Enviar correo directo
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SupportTicketDetail;
