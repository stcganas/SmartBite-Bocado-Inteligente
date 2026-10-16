import { formatCurrency } from '../utils/format';
import { db } from '../store/db';
import { toast } from 'sonner';

export const runBillingEngine = async () => {
  console.log('Starting Billing Engine process...');
  const logs: string[] = [];

  try {
    // 1. Process Subscription Renewals
    const pendingSubs = await db.getPendingSubscriptionRenewals();
    logs.push(`Encontradas ${pendingSubs.length} suscripciones para renovar.`);
    
    for (const sub of pendingSubs) {
      if (!sub.plans) continue;
      
      const nextEndDate = calculateNextPeriodEnd(sub.current_period_end, sub.plans.billing_cycle);
      
      // Generate Invoice
      await db.savePlatformInvoice({
        restaurantId: sub.restaurant_id,
        amount: sub.plans.price,
        description: `Renovación Plan: ${sub.plans.name}`,
        type: 'subscription',
        status: 'pending',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days limit
      });

      // Update Subscription Period
      await db.saveRestaurantSubscription({
        currentPeriodStart: sub.current_period_end,
        currentPeriodEnd: nextEndDate.toISOString(),
      }, sub.id);
      
      logs.push(`Renovada suscripción de "${sub.restaurants.name}"`);
    }

    // 2. Process Commission Cuts
    const restaurants = await db.getRestaurants();
    const settings = await db.getPlatformSettings();
    
    for (const res of restaurants) {
      const uninvoicedOrders = await db.getUninvoicedOrders(res.id);
      if (uninvoicedOrders.length === 0) continue;

      const commissionAmount = uninvoicedOrders.reduce((sum, o) => 
        sum + (Number(o.total) * (Number(res.commissionRate || 5) / 100)), 0
      );

      if (commissionAmount > 0) {
        // Here we could check if today is the cut day based on settings.commissionCycle
        // For simplicity in this demo, we consolidate whenever requested
        const { data: invoice, error: invError } = await (db.savePlatformInvoice({
          restaurantId: res.id,
          amount: commissionAmount,
          description: `Consolidado Comisiones (${uninvoicedOrders.length} pedidos)`,
          type: 'commission',
          status: 'pending',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }) as any);

        if (!invError && invoice) {
          await db.markOrdersAsInvoiced(uninvoicedOrders.map(o => o.id), invoice[0].id);
          logs.push(`Generada factura de comisiones para "${res.name}" (${formatCurrency(commissionAmount)})`);
        }
      }
    }

    toast.success('Facturación procesada correctamente');
    return { success: true, logs };
  } catch (error) {
    console.error('Billing Engine Error:', error);
    toast.error('Error al procesar la facturación');
    return { success: false, logs };
  }
};

function calculateNextPeriodEnd(currentEnd: string, cycle: string): Date {
  const date = new Date(currentEnd);
  switch (cycle) {
    case 'weekly': date.setDate(date.getDate() + 7); break;
    case 'biweekly': date.setDate(date.getDate() + 15); break;
    case 'monthly': date.setMonth(date.getMonth() + 1); break;
    case 'yearly': date.setFullYear(date.getFullYear() + 1); break;
    default: date.setMonth(date.getMonth() + 1);
  }
  return date;
}
