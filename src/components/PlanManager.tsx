import React, { useState } from 'react';
import { Plan } from '../store/db';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { db } from '../store/db';
import { toast } from 'sonner';

interface PlanManagerProps {
  plans: Plan[];
  onPlansChange: () => void;
}

export function PlanManager({ plans, onPlansChange }: PlanManagerProps) {
  const [editingPlan, setEditingPlan] = useState<Partial<Plan> | null>(null);

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    try {
       // Make sure features is an object
       if (typeof editingPlan.features === 'string') {
          try {
             editingPlan.features = JSON.parse(editingPlan.features);
          } catch(e) {
             editingPlan.features = {};
          }
       }
       
      const { error } = await db.savePlan(editingPlan, editingPlan.id);
      if (error) throw error;
      toast.success(editingPlan.id ? 'Plan actualizado' : 'Plan creado');
      setEditingPlan(null);
      onPlansChange();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Error al guardar el plan');
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este plan?')) return;
    try {
      const { error } = await db.deletePlan(id);
      if (error) throw error;
      toast.success('Plan eliminado');
      onPlansChange();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Error al eliminar el plan');
    }
  };

  const handleCreateNew = () => {
    setEditingPlan({
       name: '',
       description: '',
       price: 0,
       type: 'fixed',
       commission_percentage: 0,
       billingCycle: 'monthly',
       features: {
          max_categories: 5,
          max_products: 50,
          max_orders_per_month: 100,
          allow_loyalty: false,
          allow_coupons: false,
          allow_pos: false,
          allow_roulette: false,
          allow_points_rewards: false,
          allow_gamification: false,
          allow_referrals: false,
          allow_qr_menu: false,
          allow_waiter_call: false,
          allow_ai_assistant: false,
          allow_own_drivers: false,
          allow_marketing: false
       },
       isActive: true,
       isDefault: false
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-neutral-900">Gestión de Planes</h2>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-on-surface rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="relative bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
            {plan.isDefault && (
               <span className="absolute -top-3 right-4 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                  Defecto
               </span>
            )}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-neutral-900">{plan.name}</h3>
                <p className="text-sm text-on-surface-variant font-medium uppercase tracking-wider">{plan.type === 'free' ? 'Gratis' : plan.type === 'commission' ? 'Comisión' : 'Fijo'}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingPlan(plan)}
                  className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeletePlan(plan.id)}
                  className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <p className="text-neutral-600 text-sm mb-4 h-10 line-clamp-2">{plan.description}</p>
            
            <div className="mb-4">
               <span className="text-3xl font-black text-neutral-900">${plan.price}</span>
               {plan.type === 'commission' ? (
                  <span className="text-sm text-on-surface-variant ml-1">+ {plan.commission_percentage}% / venta</span>
               ) : (
                  <span className="text-sm text-on-surface-variant ml-1">/ {plan.billingCycle}</span>
               )}
            </div>

            <div className="space-y-2 mb-4">
              <h4 className="font-semibold text-neutral-900 text-sm">Características:</h4>
              <ul className="text-sm text-neutral-600 space-y-1">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  {plan.features.max_categories === null ? 'Categorías Ilimitadas' : `${plan.features.max_categories || 0} Categorías`}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  {plan.features.max_products === null ? 'Productos Ilimitados' : `${plan.features.max_products || 0} Productos`}
                </li>
                <li className="flex items-center gap-2">
                  {(plan.features.allow_loyalty) ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-400" />}
                  Fidelización (Monedas de Oro)
                </li>
                <li className="flex items-center gap-2">
                  {(plan.features.allow_loyalty && plan.features.allow_points_rewards) ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-400" />}
                  Desbloqueo de Premios
                </li>
                <li className="flex items-center gap-2">
                  {(plan.features.allow_coupons) ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-400" />}
                  Cupones de Descuento
                </li>
                <li className="flex items-center gap-2">
                  {(plan.features.allow_pos) ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-400" />}
                  Sistema POS
                </li>
                <li className="flex items-center gap-2">
                  {(plan.features.allow_roulette) ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-400" />}
                  Ruleta de Premios
                </li>
                <li className="flex items-center gap-2">
                  {(plan.features.allow_gamification) ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-400" />}
                  Gamificación Interactiva
                </li>
                <li className="flex items-center gap-2">
                  {(plan.features.allow_referrals) ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-400" />}
                  Programa de Referidos
                </li>
                <li className="flex items-center gap-2">
                  {(plan.features.allow_qr_menu) ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-400" />}
                  Menú Digital QR
                </li>
                <li className="flex items-center gap-2">
                  {(plan.features.allow_waiter_call) ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-400" />}
                  Llamado de Mesero
                </li>
                <li className="flex items-center gap-2">
                  {(plan.features.allow_ai_assistant) ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-400" />}
                  Asistente Ventas IA
                </li>
                <li className="flex items-center gap-2">
                  {(plan.features.allow_own_drivers) ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-400" />}
                  Repartidores Propios
                </li>
                <li className="flex items-center gap-2">
                  {(plan.features.allow_marketing) ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-400" />}
                  Marketing y Campañas
                </li>
              </ul>
            </div>
            
            <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${plan.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {plan.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {editingPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-black text-neutral-900 mb-6">
              {editingPlan.id ? 'Editar Plan' : 'Nuevo Plan'}
            </h2>
            <form onSubmit={handleSavePlan} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-neutral-700 mb-2">Nombre del Plan</label>
                   <input
                     type="text"
                     value={editingPlan.name || ''}
                     onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                     className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-neutral-900"
                     required
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-neutral-700 mb-2">Tipo de Plan</label>
                   <select
                     value={editingPlan.type || 'fixed'}
                     onChange={(e) => setEditingPlan({ ...editingPlan, type: e.target.value as 'free' | 'fixed' | 'commission' })}
                     className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-neutral-900"
                   >
                     <option value="free">Gratis (Limitado)</option>
                     <option value="fixed">Pago Fijo</option>
                     <option value="commission">Pago por Comisión</option>
                   </select>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-neutral-700 mb-2">Precio Base ($)</label>
                   <input
                     type="number"
                     step="0.01"
                     value={editingPlan.price || 0}
                     onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) })}
                     className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-neutral-900"
                     required
                   />
                 </div>

                 {editingPlan.type === 'commission' && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">% de Comisión por Venta</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editingPlan.commission_percentage || 0}
                        onChange={(e) => setEditingPlan({ ...editingPlan, commission_percentage: parseFloat(e.target.value) })}
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-neutral-900"
                        required
                      />
                    </div>
                 )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Descripción</label>
                <textarea
                  value={editingPlan.description || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px] text-neutral-900"
                  required
                />
              </div>

              <div>
                <h4 className="font-bold text-neutral-900 mb-4 border-b border-neutral-100 pb-2">Características y Límites</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-neutral-700 mb-1">Límite de Categorías</label>
                     <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          value={editingPlan.features?.max_categories === null ? '' : editingPlan.features?.max_categories || 0}
                          onChange={(e) => setEditingPlan({ 
                             ...editingPlan, 
                             features: { ...editingPlan.features, max_categories: e.target.value ? parseInt(e.target.value) : null } 
                          })}
                          disabled={editingPlan.features?.max_categories === null}
                          className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl disabled:opacity-50"
                        />
                        <label className="flex items-center gap-2 whitespace-nowrap text-sm cursor-pointer">
                           <input 
                              type="checkbox" 
                              checked={editingPlan.features?.max_categories === null}
                              onChange={(e) => setEditingPlan({
                                 ...editingPlan,
                                 features: { ...editingPlan.features, max_categories: e.target.checked ? null : 5 }
                              })}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                           />
                           Ilimitado
                        </label>
                     </div>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-neutral-700 mb-1">Límite de Productos</label>
                     <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          value={editingPlan.features?.max_products === null ? '' : editingPlan.features?.max_products || 0}
                          onChange={(e) => setEditingPlan({ 
                             ...editingPlan, 
                             features: { ...editingPlan.features, max_products: e.target.value ? parseInt(e.target.value) : null } 
                          })}
                          disabled={editingPlan.features?.max_products === null}
                          className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl disabled:opacity-50"
                        />
                        <label className="flex items-center gap-2 whitespace-nowrap text-sm cursor-pointer">
                           <input 
                              type="checkbox" 
                              checked={editingPlan.features?.max_products === null}
                              onChange={(e) => setEditingPlan({
                                 ...editingPlan,
                                 features: { ...editingPlan.features, max_products: e.target.checked ? null : 50 }
                              })}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                           />
                           Ilimitado
                        </label>
                     </div>
                   </div>

                   <div className="col-span-2 space-y-3 mt-2">
                      <label className="flex items-center gap-3 cursor-pointer p-3 bg-neutral-50 rounded-xl border border-neutral-100 hover:border-indigo-200 transition-colors">
                         <input 
                            type="checkbox" 
                            checked={editingPlan.features?.allow_loyalty || false}
                            onChange={(e) => setEditingPlan({
                               ...editingPlan,
                               features: { ...editingPlan.features, allow_loyalty: e.target.checked }
                            })}
                            className="w-5 h-5 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                         />
                         <div>
                            <div className="font-semibold text-neutral-900 text-sm">Programa de Fidelización</div>
                            <div className="text-xs text-on-surface-variant">Permite al restaurante acumular monedas de oro y premios</div>
                         </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer p-3 bg-neutral-50 rounded-xl border border-neutral-100 hover:border-indigo-200 transition-colors">
                         <input 
                            type="checkbox" 
                            checked={(editingPlan.features?.allow_loyalty && editingPlan.features?.allow_points_rewards) || false}
                            disabled={!editingPlan.features?.allow_loyalty}
                            onChange={(e) => setEditingPlan({
                               ...editingPlan,
                               features: { ...editingPlan.features, allow_points_rewards: e.target.checked }
                            })}
                            className="w-5 h-5 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                         />
                         <div className={!editingPlan.features?.allow_loyalty ? 'opacity-50' : ''}>
                            <div className="font-semibold text-neutral-900 text-sm">Desbloqueo de Premios por Monedas de Oro</div>
                            <div className="text-xs text-on-surface-variant">Habilita el canje de monedas de oro por productos o recompensas</div>
                         </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer p-3 bg-neutral-50 rounded-xl border border-neutral-100 hover:border-indigo-200 transition-colors">
                         <input 
                            type="checkbox" 
                            checked={editingPlan.features?.allow_roulette || false}
                            onChange={(e) => setEditingPlan({
                               ...editingPlan,
                               features: { ...editingPlan.features, allow_roulette: e.target.checked }
                            })}
                            className="w-5 h-5 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                         />
                         <div>
                            <div className="font-semibold text-neutral-900 text-sm">Dinámica de Ruleta de Premios</div>
                            <div className="text-xs text-on-surface-variant">Permite configurar una ruleta interactiva para los clientes</div>
                         </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer p-3 bg-neutral-50 rounded-xl border border-neutral-100 hover:border-indigo-200 transition-colors">
                         <input 
                            type="checkbox" 
                            checked={editingPlan.features?.allow_gamification || false}
                            onChange={(e) => setEditingPlan({
                               ...editingPlan,
                               features: { ...editingPlan.features, allow_gamification: e.target.checked }
                            })}
                            className="w-5 h-5 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                         />
                         <div>
                            <div className="font-semibold text-neutral-900 text-sm">Gamificación Interactiva (Niveles y Retos)</div>
                            <div className="text-xs text-on-surface-variant">Habilita misiones, niveles y retos visuales para los clientes del restaurante</div>
                         </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer p-3 bg-neutral-50 rounded-xl border border-neutral-100 hover:border-indigo-200 transition-colors">
                         <input 
                            type="checkbox" 
                            checked={editingPlan.features?.allow_referrals || false}
                            onChange={(e) => setEditingPlan({
                               ...editingPlan,
                               features: { ...editingPlan.features, allow_referrals: e.target.checked }
                            })}
                            className="w-5 h-5 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                         />
                         <div>
                            <div className="font-semibold text-neutral-900 text-sm">Programa de Referidos</div>
                            <div className="text-xs text-on-surface-variant">Permite premiar a los usuarios por invitar a amigos a usar la app</div>
                         </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer p-3 bg-neutral-50 rounded-xl border border-neutral-100 hover:border-indigo-200 transition-colors">
                         <input 
                            type="checkbox" 
                            checked={editingPlan.features?.allow_coupons || false}
                            onChange={(e) => setEditingPlan({
                               ...editingPlan,
                               features: { ...editingPlan.features, allow_coupons: e.target.checked }
                            })}
                            className="w-5 h-5 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                         />
                         <div>
                            <div className="font-semibold text-neutral-900 text-sm">Cupones de Descuento</div>
                            <div className="text-xs text-on-surface-variant">Habilita la creación de códigos promocionales</div>
                         </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer p-3 bg-neutral-50 rounded-xl border border-neutral-100 hover:border-indigo-200 transition-colors">
                         <input 
                            type="checkbox" 
                            checked={editingPlan.features?.allow_pos || false}
                            onChange={(e) => setEditingPlan({
                               ...editingPlan,
                               features: { ...editingPlan.features, allow_pos: e.target.checked }
                            })}
                            className="w-5 h-5 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                         />
                         <div>
                            <div className="font-semibold text-neutral-900 text-sm">Sistema POS y Meseros</div>
                            <div className="text-xs text-on-surface-variant">Permite gestionar mesas, meseros e imprimir tickets</div>
                         </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer p-3 bg-neutral-50 rounded-xl border border-neutral-100 hover:border-indigo-200 transition-colors">
                         <input 
                            type="checkbox" 
                            checked={editingPlan.features?.allow_qr_menu || false}
                            onChange={(e) => setEditingPlan({
                               ...editingPlan,
                               features: { ...editingPlan.features, allow_qr_menu: e.target.checked }
                            })}
                            className="w-5 h-5 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                         />
                         <div>
                            <div className="font-semibold text-neutral-900 text-sm">Menú Digital QR</div>
                            <div className="text-xs text-on-surface-variant">Permite crear códigos QR para el local y las mesas</div>
                         </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer p-3 bg-neutral-50 rounded-xl border border-neutral-100 hover:border-indigo-200 transition-colors">
                         <input 
                            type="checkbox" 
                            checked={editingPlan.features?.allow_waiter_call || false}
                            onChange={(e) => setEditingPlan({
                               ...editingPlan,
                               features: { ...editingPlan.features, allow_waiter_call: e.target.checked }
                            })}
                            className="w-5 h-5 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                         />
                         <div>
                            <div className="font-semibold text-neutral-900 text-sm">Llamado de Mesero</div>
                            <div className="text-xs text-on-surface-variant">Los clientes pueden llamar al mesero desde la app o QR</div>
                         </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer p-3 bg-neutral-50 rounded-xl border border-neutral-100 hover:border-indigo-200 transition-colors">
                         <input 
                            type="checkbox" 
                            checked={editingPlan.features?.allow_ai_assistant || false}
                            onChange={(e) => setEditingPlan({
                               ...editingPlan,
                               features: { ...editingPlan.features, allow_ai_assistant: e.target.checked }
                            })}
                            className="w-5 h-5 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                         />
                         <div>
                            <div className="font-semibold text-neutral-900 text-sm">Asistente Ventas IA</div>
                            <div className="text-xs text-on-surface-variant">Desbloquea recomendaciones de ventas inteligentes creadas por IA</div>
                         </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer p-3 bg-neutral-50 rounded-xl border border-neutral-100 hover:border-indigo-200 transition-colors">
                         <input 
                            type="checkbox" 
                            checked={editingPlan.features?.allow_own_drivers || false}
                            onChange={(e) => setEditingPlan({
                               ...editingPlan,
                               features: { ...editingPlan.features, allow_own_drivers: e.target.checked }
                            })}
                            className="w-5 h-5 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                         />
                         <div>
                            <div className="font-semibold text-neutral-900 text-sm">Repartidores Propios</div>
                            <div className="text-xs text-on-surface-variant">Permite al restaurante gestionar su propia flota de domiciliarios</div>
                         </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer p-3 bg-neutral-50 rounded-xl border border-neutral-100 hover:border-indigo-200 transition-colors">
                         <input 
                            type="checkbox" 
                            checked={editingPlan.features?.allow_marketing || false}
                            onChange={(e) => setEditingPlan({
                               ...editingPlan,
                               features: { ...editingPlan.features, allow_marketing: e.target.checked }
                            })}
                            className="w-5 h-5 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                         />
                         <div>
                            <div className="font-semibold text-neutral-900 text-sm">Marketing y Campañas</div>
                            <div className="text-xs text-on-surface-variant">Habilita envío de notificaciones y emails de mercadeo</div>
                         </div>
                      </label>
                    </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-neutral-200">

                <div className="flex gap-6">
                   <label className="flex items-center gap-2 cursor-pointer">
                     <input
                       type="checkbox"
                       checked={editingPlan.isActive !== false}
                       onChange={(e) => setEditingPlan({ ...editingPlan, isActive: e.target.checked })}
                       className="rounded text-indigo-600 focus:ring-indigo-500"
                     />
                     <span className="text-sm font-medium text-neutral-700">Plan Activo</span>
                   </label>
                   
                   <label className="flex items-center gap-2 cursor-pointer">
                     <input
                       type="checkbox"
                       checked={editingPlan.isDefault || false}
                       onChange={(e) => setEditingPlan({ ...editingPlan, isDefault: e.target.checked })}
                       className="rounded text-indigo-600 focus:ring-indigo-500"
                     />
                     <span className="text-sm font-medium text-neutral-700">Por defecto al registrarse</span>
                   </label>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingPlan(null)}
                    className="px-6 py-2 border border-neutral-200 text-neutral-700 rounded-xl font-medium hover:bg-neutral-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 text-on-surface rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
