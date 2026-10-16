import { supabase } from '../lib/supabase';
import type { AppUser, Referral, WithdrawalRequest, Order, Restaurant } from '../store/db';
const getDb = async () => (await import('../store/db')).db;

export const referralService = {
  /**
   * Generates a unique referral code for a user
   */
  generateReferralCode: (displayName: string = 'USER'): string => {
    const prefix = displayName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'U');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${random}`;
  },

  /**
   * Ensures a user has a referral code, generating one if missing
   */
  ensureReferralCode: async (user: AppUser): Promise<string> => {
    if (user.referralCode) return user.referralCode;
    
    const newCode = referralService.generateReferralCode(user.displayName || user.email.split('@')[0]);
    await (await getDb()).updateAppUser(user.id, { referralCode: newCode });
    return newCode;
  },

  /**
   * Processes a referral link/code usage.
   * Links a new user to the referrer for a specific restaurant.
   */
  linkReferral: async (referredId: string, referralCode: string, restaurantId: string): Promise<boolean> => {
    try {
      // Find the referrer by code
      const { data: referrer, error: referrerError } = await supabase
        .from('app_users')
        .select('id')
        .eq('referral_code', referralCode)
        .maybeSingle();

      if (referrerError || !referrer) {
        console.error('Referral code not found');
        return false;
      }

      if (referrer.id === referredId) {
        console.error('Cannot refer yourself');
        return false;
      }

      // Check if already referred for this restaurant
      const { data: existing } = await supabase
        .from('referrals')
        .select('id')
        .eq('referred_id', referredId)
        .eq('restaurant_id', restaurantId)
        .maybeSingle();

      if (existing) return true;

      // Create referral record
      const { error: referralError } = await supabase
        .from('referrals')
        .insert({
          referrer_id: referrer.id,
          referred_id: referredId,
          restaurant_id: restaurantId,
          status: 'active',
          created_at: new Date().toISOString()
        });

      if (referralError) throw referralError;

      // Update user to track who referred them globally
      await (await getDb()).updateAppUser(referredId, { referredBy: referrer.id });

      // Notify the referrer asynchronously in background without awaiting to prevent registration lag
      try {
        getDb().then(async (dbStore) => {
          const referredUser = await dbStore.getAppUser(referredId);
          const identifier = referredUser?.displayName || referredUser?.email?.split('@')[0] || 'Un nuevo usuario';
          dbStore.saveNotification({
            userId: referrer.id,
            title: "¡Nuevo Referido de Embajador Registrado! 🤝🚀",
            body: `¡Felicidades! ${identifier} se unió exitosamente usando tu código de invitación. ¡Comenzarás a ganar atractivas comisiones por sus primeros pedidos! 🎉💸`,
            type: "referral_link",
            metadata: { referredId }
          }).catch(e => console.error("Error async-saving referral link notification:", e));
        }).catch(err => console.error("Error fetching db in referral link notification:", err));
      } catch (notifErr) {
        console.error('Error initiating referrer notification:', notifErr);
      }

      return true;
    } catch (error) {
      console.error('Error linking referral:', error);
      return false;
    }
  },

  /**
   * Calculates and applies commission to a referrer's balance when an order is completed.
   */
  processOrderCommission: async (order: Order): Promise<void> => {
    try {
      if (order.status !== 'completed' || !order.customerId) return;

      // 1. Find if this customer was referred for this restaurant (or globally via platform)
      let referrerId = null;
      
      const { data: referral } = await supabase
        .from('referrals')
        .select('referrer_id')
        .eq('referred_id', order.customerId)
        .in('restaurant_id', [order.restaurantId, 'platform'])
        .limit(1);
        
      if (referral && referral.length > 0) {
        referrerId = referral[0].referrer_id;
      }
      
      if (!referrerId) {
         // Fallback to checking the app user's referredBy field globally
         const customer = await (await getDb()).getAppUser(order.customerId);
         if (customer?.referredBy) {
            referrerId = customer.referredBy;
         }
      }

      if (!referrerId) return;

      // 2. Get restaurant referral settings
      const restaurant = await (await getDb()).getRestaurant(order.restaurantId);
      if (!restaurant || !restaurant.referralEnabled) return;

      // 3. Calculate commission
      let commission = 0;
      if (restaurant.referralCommissionType === 'fixed') {
        commission = restaurant.referralCommissionValue || 0;
      } else if (restaurant.referralCommissionType === 'percentage') {
        const percentage = restaurant.referralCommissionValue || 0;
        commission = (order.total * percentage) / 100;
      }

      if (commission <= 0) return;

      // 4. Update referrer's balance
      const referrer = await (await getDb()).getAppUser(referrerId);
      if (!referrer) return;

      // Ensure referrer is enrolled in this restaurant's referral program
      const isEnrolled = referrer.anniversaries?.some(
        (a) => a.type === 'referral_enrollment' && a.date === order.restaurantId
      );
      if (!isEnrolled) {
        console.log(`Referrer user ${referrer.id} is not enrolled in restaurant ${order.restaurantId} referral program. Commission skipped.`);
        return;
      }

      const newBalance = (referrer.referralBalance || 0) + commission;
      await (await getDb()).updateAppUser(referrer.id, { referralBalance: newBalance });

      // Notify the referrer asynchronously in background without awaiting to keep application speed ultra-high
      try {
        (async () => {
          const { formatCurrency } = await import('../utils/format');
          const dbStore = await getDb();
          dbStore.saveNotification({
            userId: referrer.id,
            title: "¡Comisión Acreditada! 💰🎉",
            body: `¡Excelente trabajo! Has ganado ${formatCurrency(commission)} de comisión por un pedido de tu referido en ${restaurant.name}. ¡Sigue acumulando ganancias! 📈🏆`,
            type: "referral_commission",
            orderId: order.id
          }).catch(e => console.error("Error saving referral commission async notification:", e));
        })();
      } catch (notifErr) {
        console.error('Error launching async referral commission notification:', notifErr);
      }

      // 5. Create a transaction record (using loyalty_transactions as a base or similar)
      // For now, we'll just track via balance, but in a real system we'd log this.
      console.log(`Applied referral commission of ${commission} to ${referrer.id} for order ${order.id}`);

    } catch (error) {
      console.error('Error processing referral commission:', error);
    }
  },

  /**
   * Fetches transparent list of orders placed by referrals
   */
  getReferralOrders: async (userId: string) => {
    try {
      // 1. Get referred users list
      const { data: referrals, error: refError } = await supabase
        .from('referrals')
        .select('referred_id')
        .eq('referrer_id', userId);

      let referredIds: string[] = [];
      if (referrals) {
        referredIds = referrals.map(r => r.referred_id);
      }
      
      const allUsers = await (await getDb()).getAppUsers();
      allUsers.forEach(u => {
         if (u.referredBy === userId && !referredIds.includes(u.id)) {
            referredIds.push(u.id);
         }
      });

      if (referredIds.length === 0) return [];

      // 2. Fetch completed orders from these users where status is completed
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .in('customer_id', referredIds)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (ordersError || !orders) return [];

      // 3. For each order, fetch restaurant to check referral settings and calculate commission
      const enrichedOrders = await Promise.all(orders.map(async (order) => {
        const restaurant = await (await getDb()).getRestaurant(order.restaurant_id);
        let commission = 0;
        if (restaurant && restaurant.referralEnabled) {
          // Check if referrer is enrolled in this restaurant
          const referrer = await (await getDb()).getAppUser(userId);
          const isEnrolled = referrer?.anniversaries?.some(
            (a) => a.type === 'referral_enrollment' && a.date === order.restaurant_id
          );
          if (isEnrolled) {
            if (restaurant.referralCommissionType === 'fixed') {
              commission = restaurant.referralCommissionValue || 0;
            } else if (restaurant.referralCommissionType === 'percentage') {
              const percentage = restaurant.referralCommissionValue || 0;
              commission = (order.total * percentage) / 100;
            }
          }
        }
        return {
          id: order.id,
          createdAt: order.created_at,
          total: order.total,
          status: order.status,
          customerName: order.customer_name,
          restaurantName: order.restaurant_name || restaurant?.name || "Restaurante",
          commission
        };
      }));

      return enrichedOrders;
    } catch (err) {
      console.error('Error in getReferralOrders:', err);
      return [];
    }
  },

  /**
   * Fetches the referral history for a user at a specific restaurant
   */
  getReferralHistory: async (userId: string, restaurantId: string) => {
    try {
      // Get all global referrals to include
      const allUsers = await (await getDb()).getAppUsers();
      const globalReferrals = allUsers.filter(u => u.referredBy === userId).map(u => ({
          id: u.id + '_global',
          status: 'active',
          created_at: u.createdAt || new Date().toISOString(),
          referred: {
            display_name: u.displayName,
            email: u.email,
            avatar_url: u.avatarUrl
          }
      }));

      // if querying by restaurantId specifically, we still include global referrals since they apply everywhere
      let data: any[] = [];
      if (restaurantId) {
          const { data: qData } = await supabase
            .from('referrals')
            .select('*')
            .eq('referrer_id', userId)
            .eq('restaurant_id', restaurantId);
          if (qData) {
             for (const d of qData) {
                const u = allUsers.find(x => x.id === d.referred_id);
                if (u && !globalReferrals.some(g => g.id === u.id + '_global')) {
                   data.push({
                      id: d.id,
                      status: d.status,
                      created_at: d.created_at,
                      referred: { display_name: u.displayName, email: u.email, avatar_url: u.avatarUrl }
                   });
                }
             }
          }
      }
      
      // when empty restaurantId, we just get them all
      if (!restaurantId || restaurantId === '') {
          const { data: qData2 } = await supabase
            .from('referrals')
            .select('*')
            .eq('referrer_id', userId);
          if (qData2) {
             for (const d of qData2) {
                const u = allUsers.find(x => x.id === d.referred_id);
                if (u && !globalReferrals.some(g => g.id === u.id + '_global')) {
                   data.push({
                      id: d.id,
                      status: d.status,
                      created_at: d.created_at,
                      referred: { display_name: u.displayName, email: u.email, avatar_url: u.avatarUrl }
                   });
                }
             }
          }
      }

      data = [...data, ...globalReferrals];
      return data;
    } catch (error) {
      console.error('Error fetching referral history:', error);
      return [];
    }
  },

  /**
   * Creates a withdrawal request
   */
  requestWithdrawal: async (request: Omit<WithdrawalRequest, 'id' | 'status' | 'createdAt'>): Promise<boolean> => {
    try {
      const user = await (await getDb()).getAppUser(request.userId);
      if (!user || (user.referralBalance || 0) < request.amount) {
        throw new Error('Insufficient balance');
      }

      const { error } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: request.userId,
          restaurant_id: request.restaurantId,
          amount: request.amount,
          method: request.method,
          nequi_number: request.nequiNumber,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      
      // Notify Super Admins
      try {
        fetch("/api/notifications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: "all_admins",
            title: `Nueva solicitud de retiro: ${user.displayName || 'Embajador'}`,
            body: `${user.displayName || 'Un embajador'} solicita retirar $${request.amount.toLocaleString()} vía ${request.method}.`,
            data: { type: "withdrawal_request" }
          })
        }).catch(e => console.warn("Failed sending async admin withdrawal push:", e));
      } catch (notifErr) {
        console.warn("Failed to notify admins of withdrawal request", notifErr);
      }

      // Notify the user in the app as confirmation in background
      try {
        getDb().then(dbStore => {
          dbStore.saveNotification({
            userId: user.id,
            title: "Retiro de Fondos en Proceso ⏳🏦",
            body: `¡Tu solicitud de retiro por $${request.amount.toLocaleString()} COP ha sido recibida con éxito! Nuestro equipo de administración pronto la procesará. ¡Gracias por confiar en nosotros! 🚀🤝`,
            type: "withdrawal_pending"
          }).catch(e => console.error("Error async-saving withdrawal pending notification:", e));
        }).catch(err => console.error("Error getting db for withdrawal notification:", err));
      } catch (notifErr) {
        console.error("Error launching async withdrawal notification:", notifErr);
      }

      // Deduct balance immediately or mark as pending? 
      // Usually, it's better to deduct and then refund if rejected.
      const newBalance = (user.referralBalance || 0) - request.amount;
      await (await getDb()).updateAppUser(user.id, { referralBalance: newBalance });

      return true;
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      return false;
    }
  },

  /**
   * Fetches withdrawal requests for a restaurant (for admin view)
   */
  getRestaurantWithdrawals: async (restaurantId: string): Promise<WithdrawalRequest[]> => {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data.map(d => ({
      id: d.id,
      userId: d.user_id,
      restaurantId: d.restaurant_id,
      amount: d.amount,
      method: d.method,
      nequiNumber: d.nequi_number,
      status: d.status,
      createdAt: d.created_at,
      processedAt: d.processed_at
    }));
  },

  /**
   * Fetches referral analysis and statistics for a restaurant
   */
  getRestaurantReferralStats: async (restaurantId: string) => {
    try {
      // 1. Fetch all referrals for this restaurant
      const { data: referrals, error: refError } = await supabase
        .from('referrals')
        .select('id, referrer_id, referred_id, status, created_at')
        .eq('restaurant_id', restaurantId);

      if (refError || !referrals) {
        return { enrolledStats: [], unsubscribedStats: [], salesList: [], totals: { totalSales: 0, totalCommissions: 0 } };
      }

      // 2. Fetch all completed orders for this restaurant
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, created_at, customer_id, customer_name, total, status')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'completed');

      if (ordersError || !orders) {
        return { enrolledStats: [], unsubscribedStats: [], salesList: [], totals: { totalSales: 0, totalCommissions: 0 } };
      }

      // 3. Get all app users
      const allUsers = await (await getDb()).getAppUsers();
      const usersMap = new Map(allUsers.map(u => [u.id, u]));

      // Define statistics structures
      const enrolledStatsMap = new Map<string, {
        user: AppUser;
        referralsCount: number;
        totalSalesGenerated: number;
        totalCommissionsEarned: number;
        status: 'active' | 'suspended';
      }>();

      const unsubscribedStatsMap = new Map<string, {
        user: AppUser;
        referralsCount: number;
        totalSalesGenerated: number;
        totalCommissionsEarned: number;
        status: 'unsubscribed';
      }>();

      // Categorize users based on their anniversaries (extra_anniversaries)
      allUsers.forEach(u => {
        const isEnrolled = u.anniversaries?.some(
          (a) => a.type === 'referral_enrollment' && a.date === restaurantId
        );
        const isUnsubscribed = u.anniversaries?.some(
          (a) => a.type === 'referral_unsubscribed' && a.date === restaurantId
        );

        if (isEnrolled) {
          enrolledStatsMap.set(u.id, {
            user: u,
            referralsCount: 0,
            totalSalesGenerated: 0,
            totalCommissionsEarned: 0,
            status: (u.status === 'paused') ? 'suspended' : 'active'
          });
        } else if (isUnsubscribed) {
          unsubscribedStatsMap.set(u.id, {
            user: u,
            referralsCount: 0,
            totalSalesGenerated: 0,
            totalCommissionsEarned: 0,
            status: 'unsubscribed'
          });
        }
      });

      // Fill direct referrals count
      allUsers.forEach(u => {
        if (!u.referredBy) return;
        const activeItem = enrolledStatsMap.get(u.referredBy);
        if (activeItem) {
          activeItem.referralsCount += 1;
        } else {
          const unsubItem = unsubscribedStatsMap.get(u.referredBy);
          if (unsubItem) {
            unsubItem.referralsCount += 1;
          }
        }
      });
      // also check direct referrals table just in case they aren't globally captured
      referrals.forEach(ref => {
        if (allUsers.find(u => u.id === ref.referred_id)?.referredBy === ref.referrer_id) return; // already counted above
        const activeItem = enrolledStatsMap.get(ref.referrer_id);
        if (activeItem) {
          activeItem.referralsCount += 1;
        } else {
          const unsubItem = unsubscribedStatsMap.get(ref.referrer_id);
          if (unsubItem) {
            unsubItem.referralsCount += 1;
          }
        }
      });

      // Get restaurant info for commission value calculation
      const restaurant = await (await getDb()).getRestaurant(restaurantId);
      const commissionType = restaurant?.referralCommissionType || 'percentage';
      const commissionValue = restaurant?.referralCommissionValue || 0;

      let totalSales = 0;
      let totalCommissions = 0;

      // Map and calculate referrals sales & commissions
      const salesList = orders.map(order => {
        const referral = referrals.find(r => r.referred_id === order.customer_id);
        let referrerId = referral ? referral.referrer_id : null;
        
        if (!referrerId) {
          const customer = usersMap.get(order.customer_id);
          if (customer?.referredBy) {
            referrerId = customer.referredBy;
          }
        }
        
        if (!referrerId) return null; // Not referred
        const referrerStats = enrolledStatsMap.get(referrerId) || unsubscribedStatsMap.get(referrerId);
        
        let commission = 0;
        if (commissionType === 'fixed') {
          commission = commissionValue;
        } else {
          commission = (order.total * commissionValue) / 100;
        }

        if (referrerStats) {
          referrerStats.totalSalesGenerated += order.total;
          referrerStats.totalCommissionsEarned += commission;
        }

        totalSales += order.total;
        totalCommissions += commission;

        const referrerUser = usersMap.get(referrerId);

        return {
          id: order.id,
          createdAt: order.created_at,
          customerName: order.customer_name,
          total: order.total,
          referrerName: referrerUser?.displayName || 'Referente Desconocido',
          referrerEmail: referrerUser?.email || '',
          referrerId: referrerId,
          commission: commission
        };
      }).filter(Boolean);

      return {
        enrolledStats: Array.from(enrolledStatsMap.values()),
        unsubscribedStats: Array.from(unsubscribedStatsMap.values()),
        salesList: salesList as any[],
        totals: {
          totalSales,
          totalCommissions
        }
      };
    } catch (err) {
      console.error('Error in getRestaurantReferralStats:', err);
      return { enrolledStats: [], unsubscribedStats: [], salesList: [], totals: { totalSales: 0, totalCommissions: 0 } };
    }
  },

  /**
   * Unregisters/bans a user from the referral program of this restaurant
   */
  unregisterUser: async (userId: string, restaurantId: string): Promise<boolean> => {
    try {
      const user = await (await getDb()).getAppUser(userId);
      if (!user) return false;

      // Remove enrollment, add unsubscribed tag
      const filteredAnniversaries = (user.anniversaries || []).filter(
        (a) => !(a.type === 'referral_enrollment' && a.date === restaurantId)
      );

      // Check if already has unsubscribed tag, otherwise add
      const hasUnsubscribedTag = filteredAnniversaries.some(
        (a) => a.type === 'referral_unsubscribed' && a.date === restaurantId
      );

      const finalAnniversaries = hasUnsubscribedTag 
        ? filteredAnniversaries 
        : [...filteredAnniversaries, { type: 'referral_unsubscribed', date: restaurantId }];

      await (await getDb()).updateAppUser(userId, { anniversaries: finalAnniversaries });

      // Save notification
      await (await getDb()).saveNotification({
        userId: userId,
        title: "Baja del Programa de Referidos ⚠️",
        body: `Te informamos que tu cuenta ha sido dada de baja del programa de referidos del restaurante de forma oficial. ¡Esperamos verte participar pronto en más sorpresas! 🌟`,
        type: 'direct'
      });

      return true;
    } catch (err) {
      console.error('Error in unregisterUser:', err);
      return false;
    }
  },

  /**
   * Re-registers / restores a user to the referral program
   */
  reRegisterUser: async (userId: string, restaurantId: string): Promise<boolean> => {
    try {
      const user = await (await getDb()).getAppUser(userId);
      if (!user) return false;

      // Remove unsubscribed tag, add enrollment
      const filteredAnniversaries = (user.anniversaries || []).filter(
        (a) => !(a.type === 'referral_unsubscribed' && a.date === restaurantId)
      );

      const hasEnrollmentTag = filteredAnniversaries.some(
        (a) => a.type === 'referral_enrollment' && a.date === restaurantId
      );

      const finalAnniversaries = hasEnrollmentTag
        ? filteredAnniversaries
        : [...filteredAnniversaries, { type: 'referral_enrollment', date: restaurantId }];

      await (await getDb()).updateAppUser(userId, { anniversaries: finalAnniversaries });

      // Save notification
      await (await getDb()).saveNotification({
        userId: userId,
        title: "¡Programa de Referidos Reactivado Oficialmente! 🎉🚀",
        body: `¡Noticias increíbles! Tu cuenta ha sido reactivada en el exclusivo programa de referidos del restaurante. ¡Es tu gran oportunidad para seguir recomendando y ganando comisiones espectaculares! 💸🤩`,
        type: 'direct'
      });

      return true;
    } catch (err) {
      console.error('Error in reRegisterUser:', err);
      return false;
    }
  }
};
