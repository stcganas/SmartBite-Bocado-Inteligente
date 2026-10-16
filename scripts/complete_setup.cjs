/**
 * SmartBite — Completa el setup que quedó interrumpido.
 * El admin, restaurante y categorías ya existen.
 * Falta: productos, ruleta, suscripción y reseñas.
 * 
 * Causa del fallo anterior: PostgreSQL convierte isPartOfCombo → ispartofcombo
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vaqiqcaxfmsijyuqucwm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhcWlxY2F4Zm1zaWp5dXF1Y3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjE1OTQ4NCwiZXhwIjoyMTA3NzM1NDg0fQ.eDDlY7rA9w5nWv4VpExS0EXbbIsNnH1089FUNRgbM4A';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// IDs ya creados en la sesión anterior
const RESTAURANT_ID = 'df5f8a47-4260-4a2c-ba56-9944f4758752';

// Categoría IDs (ya existen en BD)
const CAT_IDS = {
  'Parrillas y Asados':  '9b4cf566-c542-4559-99c3-7334d8d68f8a',
  'Hamburguesas':        'eb413cbf-4771-4e26-88b0-15cc8c8187ae',
  'Combos y Especiales': '3e891765-1194-4d79-bed1-d79d452e23bd',
  'Acompañamientos':     'dd8e9cfc-3231-4fa3-b504-8aef224c5782',
  'Bebidas':             'd9c2aa14-f922-4d63-87e3-cdf55be9fa76',
  'Postres':             'b709c66f-4f81-43e4-8536-447cc7c80e09',
};

// ─── PRODUCTOS ─────────────────────────────────────────────────────────────
// NOTA: La columna en PostgreSQL es "ispartofcombo" (lowercase), no camelCase
const PRODUCTS_BY_CAT = {
  'Parrillas y Asados': [
    {
      name: 'Chuletón de Res 400g',
      description: 'Corte premium de res, marinado 24h, servido con chimichurri casero y papas rústicas.',
      price: 62000, is_featured: true, points_multiplier: 2.0,
      images: ['https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=600&q=80'],
    },
    {
      name: 'Costillas BBQ Full Rack',
      description: '½ rack de costillas de cerdo bañadas en salsa BBQ ahumada, con coleslaw y pan de ajo.',
      price: 54000, is_featured: true, points_multiplier: 1.5,
      images: ['https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80'],
    },
    {
      name: 'Pollo a la Parrilla',
      description: 'Pechuga entera marinada con hierbas, a la parrilla de carbón. Con arroz y ensalada.',
      price: 38000, points_multiplier: 1.0,
      images: ['https://images.unsplash.com/photo-1598515213692-375f79e41a57?w=600&q=80'],
    },
    {
      name: 'Picada Parrillera (2 pers)',
      description: 'Chorizos, morcilla, costillitas, chicharrón y papas criollas. Perfecta para compartir.',
      price: 79000, is_featured: true, points_multiplier: 2.0,
      images: ['https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&q=80'],
    },
  ],
  'Hamburguesas': [
    {
      name: 'Burger Clásica Don Juan',
      description: 'Carne angus 180g, queso cheddar, lechuga, tomate, cebolla caramelizada y salsa especial.',
      price: 28000,
      images: ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80'],
    },
    {
      name: 'Burger Doble BBQ',
      description: 'Doble carne 160g + doble queso + bacon crocante + salsa BBQ + aros de cebolla.',
      price: 36000, has_discount: true, discount_percentage: 10, discount_price: 32400, is_featured: true,
      images: ['https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80'],
    },
    {
      name: 'Burger Mushroom Swiss',
      description: 'Carne angus, hongos salteados, queso suizo derretido, mayonesa de trufa y rúcula fresca.',
      price: 34000,
      images: ['https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80'],
    },
    {
      name: 'Veggie Burger',
      description: 'Medallón de lentejas y quinoa, aguacate, tomate cherry, queso brie y pesto de albahaca.',
      price: 30000,
      images: ['https://images.unsplash.com/photo-1520072959219-c595dc870360?w=600&q=80'],
    },
  ],
  'Combos y Especiales': [
    {
      name: 'Combo Familiar (4 pers)',
      description: '2 Burger Clásicas + 2 Pollos a la parrilla + 4 papas fritas + 4 gaseosas.',
      price: 148000, has_discount: true, discount_percentage: 15, discount_price: 125800,
      is_featured: true, ispartofcombo: true, points_multiplier: 2.5,
      images: ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80'],
    },
    {
      name: 'Combo Pareja',
      description: '2 Burger Doble BBQ + 2 papas fritas + 2 bebidas. Romance a la parrilla.',
      price: 85000, has_discount: true, discount_percentage: 12, discount_price: 74800,
      ispartofcombo: true, points_multiplier: 1.5,
      images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80'],
    },
    {
      name: 'Menú del Día',
      description: 'Sopa del día + plato fuerte (pollo o carne) + jugo natural + postre del día.',
      price: 22000, is_promotion: true, points_multiplier: 1.0,
      images: ['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80'],
    },
  ],
  'Acompañamientos': [
    {
      name: 'Papas Fritas Clásicas',
      description: 'Papas cortadas a mano, fritas en aceite de girasol, con sal marina y salsa rosada.',
      price: 9500,
      images: ['https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80'],
    },
    {
      name: 'Papas Rústicas con Cheddar',
      description: 'Papas en gajos al horno con piel, cubiertas de cheddar fundido y cebollín.',
      price: 13500,
      images: ['https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600&q=80'],
    },
    {
      name: 'Ensalada César',
      description: 'Lechuga romana, crutones artesanales, parmesano rallado y aderezo césar casero.',
      price: 16000,
      images: ['https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&q=80'],
    },
    {
      name: 'Yuca Frita con Guacamole',
      description: 'Yuca crujiente por fuera, suave por dentro, acompañada de guacamole fresco.',
      price: 12000,
      images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80'],
    },
  ],
  'Bebidas': [
    {
      name: 'Limonada de Coco',
      description: 'Limonada fresca con leche de coco y un toque de menta. Refrescante y tropical.',
      price: 10000,
      images: ['https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80'],
    },
    {
      name: 'Jugo Natural 500ml',
      description: 'Elige entre maracuyá, mango, lulo, mora o guanábana. Recién exprimido.',
      price: 8500,
      images: ['https://images.unsplash.com/photo-1546171753-97d7676e4602?w=600&q=80'],
    },
    {
      name: 'Gaseosa o Agua',
      description: 'Coca-Cola, Sprite, Postobón o agua mineral con o sin gas 350ml.',
      price: 5500,
      images: ['https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600&q=80'],
    },
    {
      name: 'Michelada Artesanal',
      description: 'Cerveza artesanal con clámato, limón, salsa inglesa y chamoy.',
      price: 18000,
      images: ['https://images.unsplash.com/photo-1603394630688-0ecf8040c6bc?w=600&q=80'],
    },
  ],
  'Postres': [
    {
      name: 'Brownie con Helado',
      description: 'Brownie de chocolate belga tibio con helado de vainilla, coulis de frutos rojos.',
      price: 18000, is_featured: true,
      images: ['https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&q=80'],
    },
    {
      name: 'Cheesecake de Frutos Rojos',
      description: 'Cheesecake cremoso con base de galleta, coulis de fresas y frambuesas frescas.',
      price: 16000,
      images: ['https://images.unsplash.com/photo-1567171466295-4afa63d45416?w=600&q=80'],
    },
    {
      name: 'Tres Leches',
      description: 'Bizcocho esponjoso bañado en tres leches, crema chantillí y canela.',
      price: 14000,
      images: ['https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=600&q=80'],
    },
  ],
};

// ─── RULETA PAY ────────────────────────────────────────────────────────────
const WHEEL_SEGMENTS = [
  { label: '10% descuento',        color: '#FF8A00', probability: 25, type: 'discount',  value: 10 },
  { label: '50 monedas',           color: '#F59E0B', probability: 20, type: 'coins',     value: 50 },
  { label: 'Postre GRATIS',        color: '#10B981', probability: 10, type: 'free_item', value: 'Tres Leches' },
  { label: 'Inténtalo de nuevo',   color: '#6B7280', probability: 20, type: 'retry',     value: 0 },
  { label: '20% descuento',        color: '#EF4444', probability: 8,  type: 'discount',  value: 20 },
  { label: '100 monedas',          color: '#D4AF37', probability: 10, type: 'coins',     value: 100 },
  { label: 'Bebida GRATIS',        color: '#8B5CF6', probability: 5,  type: 'free_item', value: 'Limonada de Coco' },
  { label: 'Premio mayor -30%',    color: '#EC4899', probability: 2,  type: 'discount',  value: 30 },
];

// ─── RESEÑAS ───────────────────────────────────────────────────────────────
const REVIEWS = [
  { user_name: 'María García',      rating: 5, comment: '¡Excelente! El chuletón venía perfecto al punto. Servicio rápido y comida caliente.' },
  { user_name: 'Carlos Rodríguez',  rating: 5, comment: 'Las costillas BBQ son lo mejor que he probado. La salsa ahumada es increíble.' },
  { user_name: 'Ana López',         rating: 4, comment: 'Buena comida y buena presentación. Las papas rústicas con cheddar son deliciosas.' },
  { user_name: 'Diego Martínez',    rating: 5, comment: 'Pedí el combo familiar y todos quedaron encantados. Porciones generosas. 10/10!' },
  { user_name: 'Laura Sánchez',     rating: 4, comment: 'Me encantó la Burger Mushroom Swiss. Hongos y queso suizo: combinación perfecta.' },
];

// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║  SmartBite — Completar setup (productos+)     ║');
  console.log('╚════════════════════════════════════════════════╝');

  // ── 1. Productos ──────────────────────────────────────────────
  console.log('\n── Insertando productos...');
  const products = [];
  for (const [catName, items] of Object.entries(PRODUCTS_BY_CAT)) {
    const catId = CAT_IDS[catName];
    if (!catId) { console.warn('  ⚠ categoría no encontrada:', catName); continue; }
    for (const p of items) {
      products.push({
        restaurant_id: RESTAURANT_ID,
        category_id: catId,
        category: catName,
        available: true,
        has_discount: p.has_discount || false,
        discount_percentage: p.discount_percentage || 0,
        discount_price: p.discount_price || null,
        is_promotion: p.is_promotion || false,
        ispartofcombo: p.ispartofcombo || false,   // ← lowercase!
        is_featured: p.is_featured || false,
        points_multiplier: p.points_multiplier || 1.0,
        recommended_product_ids: [],
        name: p.name,
        description: p.description,
        price: p.price,
        images: p.images || [],
      });
    }
  }

  const { data: prodData, error: prodErr } = await supabase.from('products').insert(products).select('id, name');
  if (prodErr) { console.error('❌ Error en productos:', prodErr.message); process.exit(1); }
  console.log(`✅ ${prodData.length} productos creados.`);

  // ── 2. Ruleta Pay ─────────────────────────────────────────────
  console.log('\n── Configurando Ruleta Pay...');
  const { error: wheelErr } = await supabase.from('wheel_configs').upsert({
    restaurant_id: RESTAURANT_ID,
    segments: WHEEL_SEGMENTS,
    is_active: true,
    min_order_amount: 20000,
  }, { onConflict: 'restaurant_id' });
  if (wheelErr) { console.error('❌ Error en ruleta:', wheelErr.message); }
  else { console.log('✅ Ruleta configurada (8 segmentos, mínimo $20.000).'); }

  // ── 3. Suscripción al plan gratuito ───────────────────────────
  console.log('\n── Asignando Plan Básico Gratuito...');
  const { error: subErr } = await supabase.from('restaurant_subscriptions').insert({
    restaurant_id: RESTAURANT_ID,
    plan_id: '11111111-1111-1111-1111-111111111111',
    status: 'active',
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
  });
  if (subErr) { console.warn('  ⚠ Suscripción:', subErr.message); }
  else { console.log('✅ Plan Básico Gratuito asignado.'); }

  // ── 4. Reseñas ────────────────────────────────────────────────
  console.log('\n── Insertando reseñas...');
  const reviewsToInsert = REVIEWS.map(r => ({ ...r, restaurant_id: RESTAURANT_ID, status: 'approved' }));
  const { error: revErr } = await supabase.from('reviews').insert(reviewsToInsert);
  if (revErr) { console.error('❌ Error en reseñas:', revErr.message); }
  else { console.log(`✅ ${REVIEWS.length} reseñas creadas.`); }

  // ── Resumen ───────────────────────────────────────────────────
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  ✅ SETUP COMPLETADO                            ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`\n  Productos: ${prodData.length}`);
  console.log('  Ruleta: activa');
  console.log('  Suscripción: Plan Básico Gratuito');
  console.log(`  Reseñas: ${REVIEWS.length}`);
  console.log(`\n  🌐 Ver restaurante: http://localhost:3000/r/${RESTAURANT_ID}`);
  console.log('  🎰 Ruleta activa con pedidos ≥ $20.000');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
