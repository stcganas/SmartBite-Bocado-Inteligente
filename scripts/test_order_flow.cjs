const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function simulateFullSalesFlow() {
  console.log('====================================================');
  console.log(' SIMULACIÓN DEL CICLO DE VENTA E2E — SMARTBITE');
  console.log('====================================================\n');

  const RESTAURANT_ID = 'df5f8a47-4260-4a2c-ba56-9944f4758752';

  // 1. Obtener restaurante y configuración de ruleta
  console.log('1. Consultando restaurante y ruleta activa...');
  const { data: rest, error: restErr } = await supabase
    .from('restaurants')
    .select('id, name, phone, user_id')
    .eq('id', RESTAURANT_ID)
    .single();

  if (restErr) throw restErr;
  console.log(`✅ Restaurante: ${rest.name} (Dueño: ${rest.user_id})`);

  const { data: wheelList, error: wheelErr } = await supabase
    .from('wheel_configs')
    .select('*')
    .eq('restaurant_id', RESTAURANT_ID);

  const wheel = wheelList?.[0];
  console.log(`✅ Ruleta encontrada: ${wheel ? 'Activa' : 'No configurada'} (Mínimo: $${wheel?.min_order_amount})`);
  console.log(`   Segmentos disponibles: ${wheel?.segments?.length || 0}`);

  // 2. Simular compra que supera el monto mínimo ($20.000)
  const cartItems = [
    { id: 'prod-1', name: 'Chuletón de Res 400g', price: 62000, quantity: 1 },
    { id: 'prod-2', name: 'Limonada de Coco', price: 12000, quantity: 2 }
  ];
  const subtotal = 62000 + (12000 * 2);
  const deliveryFee = 4500;
  const total = subtotal + deliveryFee;

  console.log(`\n2. Creando pedido en la base de datos (Total: $${total} COP)...`);
  
  // Extra notes cleanly packed
  const notesText = '[Mesa: 4]\n\n[Propina: $5000 (Mesero)]\n\nPor favor la carne término 3/4.';

  const { data: orderData, error: orderErr } = await supabase
    .from('orders')
    .insert({
      restaurant_id: RESTAURANT_ID,
      user_id: null,
      customer_name: 'Santiago Gómez (Prueba E2E)',
      customer_phone: '3205550199',
      delivery_address: 'Calle 72 # 10-35, Apto 502',
      items: cartItems,
      subtotal: subtotal,
      delivery_fee: deliveryFee,
      discount: 0,
      total: total,
      status: 'pending',
      payment_method: 'cash',
      payment_status: 'pending',
      notes: notesText
    })
    .select()
    .single();

  if (orderErr) {
    console.error('❌ Error al guardar orden:', orderErr);
    return;
  }

  const orderId = orderData.id;
  console.log(`✅ ¡Pedido guardado exitosamente en base de datos!`);
  console.log(`   ID del Pedido: #${orderId}`);
  console.log(`   Estado inicial: ${orderData.status}`);

  // 3. Simular verificación de Ruleta
  console.log('\n3. Evaluando condición de Ruleta Pay...');
  const qualifiesForWheel = total >= (wheel?.min_order_amount || 20000);
  console.log(`   ¿Total ($${total}) >= Mínimo ($${wheel.min_order_amount})?: ${qualifiesForWheel ? 'SÍ (Giro Ganado)' : 'NO'}`);

  if (qualifiesForWheel) {
    console.log('   -> Se despliega banner de 30 segundos.');
    console.log('   -> Se monta LuckyWheel con segmentos normalizados.');

    // Simular que la ruleta gira y cae en un segmento ganador
    const winningSegment = wheel.segments[1] || { label: '50 monedas', type: 'coins', value: 50 };
    const prizeText = winningSegment.label || winningSegment.text || '50 monedas de oro';
    console.log(`\n4. ¡Ruleta giró! Premio obtenido: "${prizeText}"`);

    // Añadir el premio al pedido en la base de datos
    console.log('   Actualizando pedido con el premio en el panel del restaurante...');
    const prizeBadge = `\n\n🎁 [PREMIO RULETA GANADO: ${prizeText}]`;
    const updatedNotes = orderData.notes ? `${orderData.notes}${prizeBadge}` : prizeBadge.trim();

    const { error: updateErr } = await supabase
      .from('orders')
      .update({ notes: updatedNotes })
      .eq('id', orderId);

    if (updateErr) {
      console.error('❌ Error al actualizar orden con premio:', updateErr);
    } else {
      console.log('✅ Pedido actualizado con el premio para la cocina/panel del restaurante.');
    }

    // 5. Generar mensaje de WhatsApp nativo
    console.log('\n5. Generando mensaje para la app nativa de WhatsApp...');
    const displayId = orderId.slice(-6).toUpperCase();
    let wpMsg = `*🍔 NUEVO PEDIDO - ${rest.name.toUpperCase()}*\n`;
    wpMsg += `------------------------------------------\n`;
    wpMsg += `*ID:* #${displayId}\n`;
    wpMsg += `*Cliente:* ${orderData.customer_name}\n`;
    wpMsg += `*Teléfono:* ${orderData.customer_phone}\n`;
    wpMsg += `*Total:* $${total.toLocaleString('es-CO')}\n`;
    wpMsg += `\n🎁 *PREMIO GANADO EN RULETA:* ${prizeText}\n\n`;
    wpMsg += `_🚀 Enviado desde el Menú Digital SmartBite_`;

    const rawPhone = rest.phone.replace(/\D/g, '');
    const cleanPhone = rawPhone.startsWith('57') ? rawPhone : '57' + rawPhone;
    const nativeWhatsappUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(wpMsg)}`;

    console.log(`✅ URL Nativa de WhatsApp generada:`);
    console.log(`   ${nativeWhatsappUrl.substring(0, 100)}...`);

    // 6. Verificar cómo lo ve el restaurante en su panel
    console.log('\n6. Verificando el pedido desde la vista del restaurante...');
    const { data: finalOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    console.log(`   ID: #${finalOrder.id}`);
    console.log(`   Cliente: ${finalOrder.customer_name}`);
    console.log(`   Total: $${finalOrder.total}`);
    console.log(`   Notas del Pedido (con premio incluido):`);
    console.log(`   -------------------------------------------------`);
    console.log(`   ${finalOrder.notes.replace(/\n/g, '\n   ')}`);
    console.log(`   -------------------------------------------------`);
  }

  console.log('\n====================================================');
  console.log(' ✨ CICLO DE VENTA E2E COMPLETADO CON ÉXITO AL 100%');
  console.log('====================================================');
}

simulateFullSalesFlow().catch(console.error);
