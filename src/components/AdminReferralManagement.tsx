import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, RefreshCw, CheckCircle, XCircle, Star, TrendingUp, Settings, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/format';
import { toast } from 'sonner';

export function AdminReferralManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'requests' | 'settings'>('requests');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platformSettings, setPlatformSettings] = useState<any>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchReferralUsers = async () => {
    setLoading(true);
    try {
      // 1. Fetch users and their referral enrollments
      // We need their id, basic info, referralCode, and extra_anniversaries mapped to anniversaries
      const { data: appUsers, error: usersError } = await supabase
        .from('app_users')
        .select('id, display_name, email, phone, referral_code, referral_balance, max_referral_invites, max_restaurant_affiliations, extra_anniversaries');

      if (usersError) throw usersError;

      // Filter only users who are actually enrolled in at least one referral program
      // An enrollment in extra_anniversaries looks like { type: 'referral_enrollment', date: restaurantId }
      const enrolledUsers = (appUsers || []).map((u: any) => ({
        ...u,
        anniversaries: u.extra_anniversaries || []
      })).filter((u: any) => 
        u.anniversaries && u.anniversaries.some((a: any) => a.type === 'referral_enrollment')
      );

      // 2. Fetch restaurants to map names
      const { data: restaurants, error: restError } = await supabase
        .from('restaurants')
        .select('id, name, referral_enabled, referral_commission_type, referral_commission_value');

      if (restError) throw restError;

      // 3. (Optional) Fetch referrals to count used invites
      const { data: referrals, error: refError } = await supabase
        .from('referrals')
        .select('referrer_id, referred_id');
        
      const allUsers = await (await import('../store/db')).db.getAppUsers();

      if (refError) throw refError;

      // Format data
      const formattedUsers = enrolledUsers.map((u: any) => {
        // Find enrolled restaurants
        const enrolledRestaurantIds = u.anniversaries
          .filter((a: any) => a.type === 'referral_enrollment')
          .map((a: any) => a.date);

        const uRestaurants = restaurants.filter(r => enrolledRestaurantIds.includes(r.id));
        
        // Count total used invites
        let usedInvitesCount = referrals.filter(r => r.referrer_id === u.id).length;
        
        // Add global referrals via referredBy
        const globalCount = allUsers.filter(allU => allU.referredBy === u.id && !referrals.some(r => r.referred_id === allU.id)).length;
        usedInvitesCount += globalCount;
        
        // Find if they are globally banned from referrals (for admin approval/rejection mock status if needed, 
        // for now just use a boolean based on something, or we can just add an 'is_ambassador_active' in the future).
        // For now, let's look if they have referralBalance.
        return {
          ...u,
          restaurants: uRestaurants,
          usedInvitesCount,
          maxInvites: u.max_referral_invites || 20,
          maxAffiliations: u.max_restaurant_affiliations || 5,
          status: 'active'
        };
      });

      setUsers(formattedUsers);

      // fetch pending requests
      try {
        const { db } = await import('../store/db');
        const reqs = await db.getReferralRequests();
        setRequests(reqs.filter((r: any) => r.status === 'pending'));
        
        const settings = await db.getPlatformSettings();
        setPlatformSettings(settings);
      } catch (err) {
        console.warn('Error fetching requests', err);
      }

    } catch (err) {
      console.error("Error fetching referral users:", err);
      toast.error("Error al cargar embajadores");
    } finally {
      setLoading(false);
    }
  };

  
  const handleApproveRequest = async (request: any) => {
    try {
      const { db } = await import('../store/db');
      await db.updateReferralRequestStatus(request.id, 'approved');
      
      if (request.restaurantId === 'platform_affiliation_limit') {
        const { data: user } = await supabase.from('app_users').select('max_restaurant_affiliations').eq('id', request.userId).single();
        const currentLimit = user?.max_restaurant_affiliations || 5;
        const newLimit = currentLimit + 5; // Default increment of 5
        
        await supabase.from('app_users').update({ max_restaurant_affiliations: newLimit }).eq('id', request.userId);
        
        await db.saveNotification({
          userId: request.userId,
          title: `¡Límite de Afiliaciones Aumentado! 📈🚀`,
          body: `¡Felicidades! Tu solicitud fue aprobada con éxito. Ahora tienes autorizado afiliarte hasta a ${newLimit} restaurantes en la plataforma. ¡A seguir creciendo! 🌟`,
          type: 'direct'
        });
      } else {
        // Update user extra_anniversaries
        const { data: user } = await supabase.from('app_users').select('extra_anniversaries').eq('id', request.userId).single();
        let annivs = user?.extra_anniversaries || [];
        if (!annivs.some((a: any) => a.type === 'referral_enrollment' && a.date === request.restaurantId)) {
           annivs.push({ type: 'referral_enrollment', date: request.restaurantId });
           await supabase.from('app_users').update({ extra_anniversaries: annivs }).eq('id', request.userId);
        }
        
        await db.saveNotification({
          userId: request.userId,
          title: `¡Solicitud Aprobada con Éxito! 🎉🥳`,
          body: `¡Excelente noticia! Has sido aceptado oficialmente en el programa de referidos de ${request.restaurantName}. ¡Empieza a invitar y acumula beneficios hoy mismo! 👥💰`,
          type: 'direct'
        });
      }
      
      toast.success("Solicitud aprobada");
      fetchReferralUsers();
    } catch (err) {
      console.error(err);
      toast.error("Error al aprobar");
    }
  };

  const handleRejectRequest = async (request: any) => {
    try {
      const { db } = await import('../store/db');
      await db.updateReferralRequestStatus(request.id, 'rejected');
      toast.success("Solicitud rechazada");
      fetchReferralUsers();
    } catch (err) {
      console.error(err);
      toast.error("Error al rechazar");
    }
  };

  useEffect(() => {
    fetchReferralUsers();
  }, []);

  const handleUpdateLimit = async (userId: string, newLimit: number) => {
    try {
      const { error } = await supabase
        .from('app_users')
        .update({ max_referral_invites: newLimit })
        .eq('id', userId);
        
      if (error) throw error;
      toast.success("Límite de invitaciones actualizado");
      fetchReferralUsers();
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar límite");
    }
  };

  const handleUpdateAffiliationLimit = async (userId: string, newLimit: number) => {
    try {
      const { error } = await supabase
        .from('app_users')
        .update({ max_restaurant_affiliations: newLimit })
        .eq('id', userId);
        
      if (error) throw error;
      toast.success("Límite de afiliaciones actualizado");
      fetchReferralUsers();
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar límite");
    }
  };

  const handleSaveSettings = async () => {
    if (!platformSettings) return;
    setSavingSettings(true);
    try {
      const { db } = await import('../store/db');
      await db.updatePlatformSettings(platformSettings);
      toast.success("Configuración actualizada");
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar configuración");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRejectUser = async (userId: string) => {
    // In a full implementation, you might remove them from the referral program globally
    // or set a flag. Since we just remove them from restaurant's program via anniversaries usually,
    // we can clear all their referral_enrollment anniversaries for now, or just ban them.
    if (!window.confirm("¿Estás seguro de que deseas revocar el acceso al programa de referidos para este usuario?")) return;

    try {
      const { data: user } = await supabase.from('app_users').select('extra_anniversaries').eq('id', userId).single();
      let annivs = user?.extra_anniversaries || [];
      
      // Remove all referral enrollments
      annivs = annivs.filter((a: any) => a.type !== 'referral_enrollment');
      
      const { error } = await supabase.from('app_users').update({ extra_anniversaries: annivs }).eq('id', userId);
      if (error) throw error;
      
      toast.success("Acceso revocado exitosamente");
      fetchReferralUsers();
    } catch (err) {
      console.error(err);
      toast.error("Error al revocar usuario");
    }
  };

  const filteredUsers = users.filter(u => 
    (u.display_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.referral_code || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-indigo-950 flex items-center gap-2">
            <Users className="w-8 h-8 text-indigo-600" />
            Control de Embajadores (Referidos)
          </h2>
          <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mt-1">
            Administración del Programa de Referencias
          </p>
        </div>
        <button
          onClick={fetchReferralUsers}
          className="bg-white border border-neutral-200 text-neutral-700 font-black text-xs px-4 py-2.5 rounded-xl shadow-sm uppercase tracking-widest flex items-center gap-2 hover:bg-neutral-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Metrics Row */}
            
      <div className="flex gap-4 mb-6 border-b border-outline pb-4 overflow-x-auto">
         <button onClick={() => setActiveSubTab('requests')} className={`px-4 py-2 font-bold rounded-xl transition-all ${activeSubTab === 'requests' ? 'bg-primary text-white' : 'bg-surface-variant text-on-surface-muted hover:text-on-surface'}`}>
           Solicitudes Pendientes ({requests.length})
         </button>
         <button onClick={() => setActiveSubTab('users')} className={`px-4 py-2 font-bold rounded-xl transition-all ${activeSubTab === 'users' ? 'bg-primary text-white' : 'bg-surface-variant text-on-surface-muted hover:text-on-surface'}`}>
           Usuarios Activos ({filteredUsers.length})
         </button>
         <button onClick={() => setActiveSubTab('settings')} className={`px-4 py-2 font-bold rounded-xl transition-all flex items-center gap-2 ${activeSubTab === 'settings' ? 'bg-primary text-white' : 'bg-surface-variant text-on-surface-muted hover:text-on-surface'}`}>
           <Settings className="w-4 h-4" /> Configuración
         </button>
      </div>
      
      {activeSubTab === 'requests' ? (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="text-center py-12 text-on-surface-muted">No hay solicitudes pendientes</div>
          ) : (
            requests.map(req => (
              <div key={req.id} className="bg-surface-variant p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-outline">
                <div>
                   <h3 className="font-bold text-on-surface text-lg">{req.userName} <span className="text-sm font-medium text-on-surface-muted">({req.userEmail})</span></h3>
                   <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${req.restaurantId === 'platform_affiliation_limit' ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'}`}>
                     {req.restaurantId === 'platform_affiliation_limit' ? 'Aumento de Límite' : 'Inscripción Restaurante'}
                   </span>
                   <p className="text-sm text-on-surface-variant mt-1">
                     {req.restaurantId === 'platform_affiliation_limit' ? 'Solicita aumentar límite de afiliaciones' : `Solicita unirse a: ${req.restaurantName}`}
                   </p>
                   <p className="text-xs text-on-surface-muted">Tel: {req.userPhone}</p>
                </div>
                <div className="flex items-center gap-3">
                   <button onClick={() => handleApproveRequest(req)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                     <CheckCircle className="w-4 h-4" /> Aprobar
                   </button>
                   <button onClick={() => handleRejectRequest(req)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                     <XCircle className="w-4 h-4" /> Rechazar
                   </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : activeSubTab === 'settings' ? (
        <div className="glass-card p-8 rounded-3xl max-w-2xl">
          <h3 className="text-xl font-black text-on-surface mb-6 flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-500" />
            Configuración Global de Referidos
          </h3>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-on-surface-muted uppercase tracking-wider mb-2">
                  Afiliaciones Gratuitas por Defecto
                </label>
                <input 
                  type="number" 
                  value={platformSettings?.referralSettings?.maxFreeAffiliations ?? 5} 
                  onChange={(e) => setPlatformSettings({
                    ...platformSettings,
                    referralSettings: {
                      ...platformSettings?.referralSettings,
                      maxFreeAffiliations: parseInt(e.target.value) || 0
                    }
                  })}
                  className="w-full bg-surface-variant border border-outline rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-primary outline-none text-neutral-900"
                />
                <p className="text-xs text-on-surface-muted mt-2">
                  Número de restaurantes a los que un usuario puede afiliarse sin costo adicional.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface-muted uppercase tracking-wider mb-2">
                  Enlaces de Invitación por Defecto
                </label>
                <input 
                  type="number" 
                  value={platformSettings?.referralSettings?.defaultMaxReferralLinks ?? 20} 
                  onChange={(e) => setPlatformSettings({
                    ...platformSettings,
                    referralSettings: {
                      ...platformSettings?.referralSettings,
                      defaultMaxReferralLinks: parseInt(e.target.value) || 0
                    }
                  })}
                  className="w-full bg-surface-variant border border-outline rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-primary outline-none text-neutral-900"
                />
                <p className="text-xs text-on-surface-muted mt-2">
                  Límite global inicial de códigos de invitación y enlaces de recomendación por usuario.
                </p>
              </div>
            </div>

            <button 
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="bg-primary hover:bg-primary-dark text-white font-black px-8 py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            >
              <Save className="w-5 h-5" />
              {savingSettings ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.length === 0 ? (
            <div className="col-span-full py-12 text-center text-on-surface-muted font-medium bg-surface-variant rounded-3xl border border-outline border-dashed">
              No se encontraron embajadores
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="bg-surface-base rounded-[2rem] border border-outline overflow-hidden shadow-lg relative group">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-primary flex items-center justify-center shadow-inner">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <button 
                      onClick={() => handleRejectUser(user.id)}
                      className="text-xs text-red-500 font-bold bg-red-500/10 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                      Revocar
                    </button>
                  </div>
                  
                  <h3 className="font-black text-xl text-on-surface mb-1 truncate">{user.display_name}</h3>
                  <p className="text-xs text-on-surface-muted font-medium mb-4">{user.email}</p>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm border-b border-outline pb-3">
                      <span className="text-on-surface-variant font-medium">Billetera</span>
                      <span className="font-black text-emerald-500">
                        {formatCurrency(user.referral_balance || 0)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm border-b border-outline pb-3">
                      <span className="text-on-surface-variant font-medium">Invitaciones Usadas</span>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-on-surface">{user.usedInvitesCount} / {user.maxInvites}</span>
                        <button 
                          onClick={() => {
                            const n = prompt("Nuevo límite de invitaciones:", user.maxInvites.toString());
                            if (n) handleUpdateLimit(user.id, parseInt(n));
                          }}
                          className="p-1 hover:bg-surface-variant rounded text-primary"
                        >
                          <Settings className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm border-b border-outline pb-3">
                      <span className="text-on-surface-variant font-medium">Afiliaciones</span>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-on-surface">{user.restaurants?.length || 0} / {user.maxAffiliations}</span>
                        <button 
                          onClick={() => {
                            const n = prompt("Nuevo límite de afiliaciones:", user.maxAffiliations.toString());
                            if (n) handleUpdateAffiliationLimit(user.id, parseInt(n));
                          }}
                          className="p-1 hover:bg-surface-variant rounded text-primary"
                        >
                          <Settings className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
</div>
  );
}