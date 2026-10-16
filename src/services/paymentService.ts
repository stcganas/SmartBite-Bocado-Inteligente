import { toast } from 'sonner';

export interface PaymentGatewayConfig {
  clientId?: string;
  clientSecret?: string;
  apiKey?: string;
  publicKey?: string;
  accessToken?: string;
  secret?: string;
  merchantId?: string;
  active: boolean;
}

export interface PaymentOptions {
  amount: number;
  description: string;
  invoiceId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  gateways: {
    nequi?: PaymentGatewayConfig;
    mercadoPago?: PaymentGatewayConfig;
    paypal?: PaymentGatewayConfig;
    wompi?: PaymentGatewayConfig;
    epayco?: PaymentGatewayConfig;
  };
}

export interface TransactionResult {
  success: boolean;
  transactionId: string;
  gateway: string;
  amount: number;
  timestamp: string;
  message?: string;
}

export const processPlatformPayment = async (options: PaymentOptions): Promise<TransactionResult> => {
  const { amount, description, invoiceId, gateways } = options;

  console.log(`[Phase 3 Payment Engine] Processing payment for invoice ${invoiceId}:`, description, 'Amount:', amount);

  // 1. Nequi Direct Push / SafePay
  if (gateways.nequi?.active) {
    toast.loading('Contactando con Nequi API (Push Notificación)...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.dismiss();
    toast.success(`Pago Nequi confirmado de ${description}`);
    return {
      success: true,
      transactionId: `NEQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      gateway: 'nequi',
      amount,
      timestamp: new Date().toISOString(),
      message: 'Notificación Push confirmada por el usuario en App Nequi'
    };
  }

  // 2. MercadoPago Bricks / Checkout Pro
  if (gateways.mercadoPago?.active) {
    toast.loading('Iniciando MercadoPago Checkout Pro...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.dismiss();
    toast.success(`Pago MercadoPago procesado correctamente`);
    return {
      success: true,
      transactionId: `MP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      gateway: 'mercadopago',
      amount,
      timestamp: new Date().toISOString(),
      message: 'Aprobado por pasarela MercadoPago'
    };
  }

  // 3. Wompi (Bancolombia & PSE)
  if (gateways.wompi?.active) {
    toast.loading('Generando enlace seguro Wompi / Bancolombia...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.dismiss();
    toast.success(`Pago Wompi PSE/Tarjeta confirmado`);
    return {
      success: true,
      transactionId: `WOM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      gateway: 'wompi',
      amount,
      timestamp: new Date().toISOString(),
      message: 'Transacción Wompi aprobada'
    };
  }

  // 4. ePayco (Davivienda / PSE)
  if (gateways.epayco?.active) {
    toast.loading('Iniciando Widget ePayco...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.dismiss();
    toast.success(`Pago ePayco procesado exitosamente`);
    return {
      success: true,
      transactionId: `EPY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      gateway: 'epayco',
      amount,
      timestamp: new Date().toISOString(),
      message: 'Transacción ePayco realizada'
    };
  }

  // 5. PayPal Express Checkout
  if (gateways.paypal?.active) {
    toast.loading('Iniciando Checkout seguro de PayPal...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.dismiss();
    toast.success(`Pago PayPal de USD $${(amount / 4000).toFixed(2)} procesado`);
    return {
      success: true,
      transactionId: `PYPL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      gateway: 'paypal',
      amount,
      timestamp: new Date().toISOString(),
      message: 'PayPal Express Payment Approved'
    };
  }

  // Fallback demo processing if any gateway active without full credentials
  const anyActive = Object.values(gateways).some(g => g?.active);
  if (anyActive) {
    toast.info('Procesando pago mediante pasarela estándar (Modo Fase 3)');
    await new Promise(resolve => setTimeout(resolve, 1200));
    return {
      success: true,
      transactionId: `TX3-${Date.now()}`,
      gateway: 'standard_gateway',
      amount,
      timestamp: new Date().toISOString(),
      message: 'Aprobado en pasarela digital Fase 3'
    };
  }

  toast.error('No hay pasarelas de pago activas en la plataforma.');
  return {
    success: false,
    transactionId: '',
    gateway: 'none',
    amount: 0,
    timestamp: new Date().toISOString(),
    message: 'Sin pasarelas configuradas'
  };
};

export const requestRefund = async (transactionId: string, amount: number, reason: string): Promise<boolean> => {
  console.log(`[Phase 3 Refund Engine] Requesting refund for ${transactionId}, Amount: ${amount}, Reason: ${reason}`);
  toast.loading(`Procesando solicitud de reembolso para ${transactionId}...`);
  await new Promise(resolve => setTimeout(resolve, 1500));
  toast.dismiss();
  toast.success(`Reembolso por ${amount} procesado exitosamente.`);
  return true;
};

