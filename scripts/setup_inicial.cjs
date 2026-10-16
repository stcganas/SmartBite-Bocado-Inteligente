/**
 * SmartBite — Setup inicial completo
 * Crea: usuario super admin + restaurante demo + productos + ruleta
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vaqiqcaxfmsijyuqucwm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhcWlxY2F4Zm1zaWp5dXF1Y3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjE1OTQ4NCwiZXhwIjoyMTA3NzM1NDg0fQ.eDDlY7rA9w5nWv4VpExS0EXbbIsNnH1089FUNRgbM4A';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ─── CONFIGURACIÓN DEL ADMIN ───────────────────────────────────────────────
const ADMIN_EMAIL    = 'admin@smartbite.co';
const ADMIN_PASSWORD = 'SmartBite2026!';
const ADMIN_NAME     = 'Super Admin SmartBite';

// ─── RESTAURANTE DEMO ──────────────────────────────────────────────────────
const RESTAURANT = {
  name: 'La Parrilla de Don Juan',
  type: 'restaurant',
  business_type: 'physical',
  business_category: 'restaurant',
  description: 'Los mejores cortes a la parrilla, hamburguesas artesanales y combos especiales. Ingredientes frescos, sabores auténticos.',
  phone: '+57 320 555 0101',
  address: 'Calle 72 # 10-35, Bogotá',
  department: 'Cundinamarca',
  city: 'Bogotá',
  has_delivery: true,
  handles_promotions: true,
  delivery_fee: 4500,
  is_active: true,
  status: 'approved',
  commission_rate: 5.0,
  merit_score: 92,
  coordinates: { lat: 4.6573, lng: -74.0529 },
  logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80',
  cover_image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80',
  opening_hours: 'Lun-Dom 11:00am - 10:00pm',
  schedule: {
    monday:    { open: '11:00', close: '22:00', isOpen: true },
    tuesday:   { open: '11:00', close: '22:00', isOpen: true },
    wednesday: { open: '11:00', close: '22:00', isOpen: true },
    thursday:  { open: '11:00', close: '22:00', isOpen: true },
    friday:    { open: '11:00', close: '23:00', isOpen: true },
    saturday:  { open: '11:00', close: '23:00', isOpen: true },
    sunday:    { open: '12:00', close: '21:00', isOpen: true },
  }
};

// ─── CATEGORÍAS DEL MENÚ ───────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Parrillas y Asados',   description: 'Cortes premium a la parrilla',      sort_order: 1 },
  { name: 'Hamburguesas',         description: 'Hamburguesas artesanales 180g',       sort_order: 2 },
  { name: 'Combos y Especiales',  description: 'La mejor relación calidad-precio',    sort_order: 3 },
  { name: 'Acompañamientos',      description: 'Papas, ensaladas y más',              sort_order: 4 },
  { name: 'Bebidas',              description: 'Frescas y naturales',                 sort_order: 5 },
  { name: 'Postres',              description: 'Dulce final perfecto',                sort_order: 6 },
];

// ─── PRODUCTOS (se asignan categorías por index) ───────────────────────────
const PRODUCTS_BY_CAT = {
  'Parrillas y Asados': [
    {
      name: 'Chuletón de Res 400g',
      description: 'Corte premium de res, marinado 24h, servido con chimichurri casero y papas rústicas.',
      price: 62000,
      is_featured: true,
      points_multiplier: 2.0,
      images: ['https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=600&q=80'],
    },
    {
      name: 'Costillas BBQ Full Rack',
      description: '½ rack de costillas de cerdo bañadas en salsa BBQ ahumada, con coleslaw y pan de ajo.',
      price: 54000,
      is_featured: true,
      points_multiplier: 1.5,
      images: ['https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80'],
    },
    {
      name: 'Pollo a la Parrilla',
      description: 'Pechuga entera marinada con hierbas, a la parrilla de carbón. Servida con arroz y ensalada.',
      price: 38000,
      points_multiplier: 1.0,
      images: ['https://images.unsplash.com/photo-1598515213692-375f79e41a57?w=600&q=80'],
    },
    {
      name: 'Picada Parrillera (2 pers)',
      description: 'Chorizos, morcilla, costillitas, chicharrón y papas criollas. Perfecta para compartir.',
      price: 79000,
      is_featured: true,
      points_multiplier: 2.0,
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
      price: 36000,
      has_discount: true,
      discount_percentage: 10,
      discount_price: 32400,
      is_featured: true,
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
      description: '2 Burger Clásicas + 2 Pollos a la parrilla + 4 papas fritas + 4 gaseosas. ¡El más pedido!',
      price: 148000,
      has_discount: true,
      discount_percentage: 15,
      discount_price: 125800,
      is_featured: true,
      isPartOfCombo: true,
      points_multiplier: 2.5,
      images: ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80'],
    },
    {
      name: 'Combo Pareja',
      description: '2 Burger Doble BBQ + 2 papas fritas + 2 bebidas. Romance a la parrilla.',
      price: 85000,
      has_discount: true,
      discount_percentage: 12,
      discount_price: 74800,
      isPartOfCombo: true,
      points_multiplier: 1.5,
      images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80'],
    },
    {
      name: 'Menú del Día',
      description: 'Sopa del día + plato fuerte (pollo o carne) + jugo natural + postre del día.',
      price: 22000,
      is_promotion: true,
      points_multiplier: 1.0,
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
      description: 'Cerveza artesanal con clámato, limón, salsa inglesa y chamoy. Solo mayores de edad.',
      price: 18000,
      images: ['https://images.unsplash.com/photo-1603394630688-0ecf8040c6bc?w=600&q=80'],
    },
  ],
  'Postres': [
    {
      name: 'Brownie con Helado',
      description: 'Brownie de chocolate belga tibio con helado de vainilla, coulis de frutos rojos y nueces.',
      price: 18000,
      is_featured: true,
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
      description: 'Bizcocho esponjoso bañado en tres leches, crema chantillí y canela. Receta de la abuela.',
      price: 14000,
      images: ['https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=600&q=80'],
    },
  ],
};

// ─── SEGMENTOS DE RULETA ───────────────────────────────────────────────────
const WHEEL_SEGMENTS = [
  { label: '10% descuento',          color: '#FF8A00', probability: 25, type: 'discount',   value: 10 },
  { label: '🪙 50 monedas',           color: '#F59E0B', probability: 20, type: 'coins',      value: 50 },
  { label: 'Postre GRATIS',          color: '#10B981', probability: 10, type: 'free_item',   value: 'Tres Leches' },
  { label: '¡Inténtalo de nuevo!',   color: '#6B7280', probability: 20, type: 'retry',       value: 0  },
  { label: '20% descuento',          color: '#EF4444', probability: 8,  type: 'discount',   value: 20 },
  { label: '🪙 100 monedas',          color: '#D4AF37', probability: 10, type: 'coins',      value: 100 },
  { label: 'Bebida GRATIS',          color: '#8B5CF6', probability: 5,  type: 'free_item',   value: 'Limonada de Coco' },
  { label: '¡Premio mayor! -30%',    color: '#EC4899', probability: 2,  type: 'discount',   value: 30 },
];

// ─── RESEÑAS DEMO ──────────────────────────────────────────────────────────
const REVIEWS_DEMO = [
  { user_name: 'María García', rating: 5, comment: '¡Excelente! El chuletón venía perfecto al punto. El servicio fue muy rápido y la comida llegó caliente. Definitivamente vuelvo.' },
  { user_name: 'Carlos Rodríguez', rating: 5, comment: 'Las costillas BBQ son lo mejor que he probado en Bogotá. La salsa ahumada es increíble. Muy recomendado.' },
  { user_name: 'Ana López', rating: 4, comment: 'Buena comida y buena presentación. Las papas rústicas con cheddar son deliciosas. Tardan un poco pero vale la pena la espera.' },
  { user_name: 'Diego Martínez', rating: 5, comment: 'Pedí el combo familiar para una reunión y todos quedaron encantados. Las porciones son muy generosas. ¡10/10!' },
  { user_name: 'Laura Sánchez', rating: 4, comment: 'Me encantó la Burger Mushroom Swiss. Los hongos y el queso suizo son una combinación perfecta. Volveré pronto.' },
];

// ═══════════════════════════════════════════════════════════════════════════
//  FUNCIONES PRINCIPALES
// ═══════════════════════════════════════════════════════════════════════════

async function createAdminUser() {
  console.log('\n══════════════════════════════════════');
  console.log('  PASO 1: Crear usuario super admin');
  console.log('══════════════════════════════════════');

  // Crear en Supabase Auth con el Admin API
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,     // confirmar email automáticamente
    user_metadata: { display_name: ADMIN_NAME, role: 'admin' }
  });

  if (authError) {
    if (authError.message?.includes('already been registered')) {
      console.log('ℹ️  El usuario admin ya existe en Auth. Buscando su UUID...');
      const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;
      const existing = listData.users.find(u => u.email === ADMIN_EMAIL);
      if (!existing) throw new Error('No se pudo encontrar el usuario admin existente.');
      return existing.id;
    }
    throw authError;
  }

  const userId = authData.user.id;
  console.log(`✅ Usuario Auth creado: ${ADMIN_EMAIL} (UUID: ${userId})`);
  return userId;
}

async function upsertAdminInAppUsers(userId) {
  console.log('\n  → Registrando en app_users con role = admin...');
  const { error } = await supabase.from('app_users').upsert({
    id: userId,
    email: ADMIN_EMAIL,
    role: 'admin',
    status: 'active',
    display_name: ADMIN_NAME,
    phone: '+57 310 000 0000',
    city: 'Bogotá',
    department: 'Cundinamarca',
    profile_completed: true,
    loyalty_points: 0,
    loyalty_coins: 0,
  }, { onConflict: 'id' });

  if (error) throw error;
  console.log('✅ Usuario admin registrado en app_users.');
}

async function createRestaurant(ownerId) {
  console.log('\n══════════════════════════════════════');
  console.log('  PASO 2: Crear restaurante demo');
  console.log('══════════════════════════════════════');

  const { data, error } = await supabase.from('restaurants').insert({
    ...RESTAURANT,
    user_id: ownerId,
  }).select().single();

  if (error) throw error;
  console.log(`✅ Restaurante creado: "${data.name}" (ID: ${data.id})`);
  return data;
}

async function createCategories(restaurantId) {
  console.log('\n  → Creando categorías del menú...');
  const toInsert = CATEGORIES.map(c => ({ ...c, restaurant_id: restaurantId }));
  const { data, error } = await supabase.from('categories').insert(toInsert).select();
  if (error) throw error;
  console.log(`✅ ${data.length} categorías creadas.`);

  // Retornar mapa nombre → id
  const map = {};
  data.forEach(c => { map[c.name] = c.id; });
  return map;
}

async function createProducts(restaurantId, catMap) {
  console.log('\n  → Creando productos...');
  const products = [];

  for (const [catName, items] of Object.entries(PRODUCTS_BY_CAT)) {
    const catId = catMap[catName];
    for (const p of items) {
      products.push({
        restaurant_id: restaurantId,
        category_id: catId,
        category: catName,
        available: true,
        has_discount: false,
        discount_percentage: 0,
        is_promotion: false,
        isPartOfCombo: false,
        is_featured: false,
        points_multiplier: 1.0,
        recommended_product_ids: [],
        ...p,
      });
    }
  }

  const { data, error } = await supabase.from('products').insert(products).select('id, name');
  if (error) throw error;
  console.log(`✅ ${data.length} productos creados.`);
  return data;
}

async function createWheelConfig(restaurantId) {
  console.log('\n══════════════════════════════════════');
  console.log('  PASO 3: Configurar Ruleta Pay');
  console.log('══════════════════════════════════════');

  const { data, error } = await supabase.from('wheel_configs').upsert({
    restaurant_id: restaurantId,
    segments: WHEEL_SEGMENTS,
    is_active: true,
    min_order_amount: 20000,
  }, { onConflict: 'restaurant_id' }).select().single();

  if (error) throw error;
  console.log(`✅ Ruleta configurada con ${WHEEL_SEGMENTS.length} segmentos.`);
  console.log(`   Monto mínimo para girar: $${data.min_order_amount.toLocaleString('es-CO')}`);
}

async function createPlan(restaurantId) {
  console.log('\n  → Asignando Plan Básico Gratuito al restaurante...');
  const { error } = await supabase.from('restaurant_subscriptions').upsert({
    restaurant_id: restaurantId,
    plan_id: '11111111-1111-1111-1111-111111111111', // Plan Básico (del seed)
    status: 'active',
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }, { onConflict: 'restaurant_id' });
  if (error) {
    console.warn('  ⚠️  No se pudo asignar plan (puede no existir FK):', error.message);
  } else {
    console.log('✅ Plan Básico Gratuito asignado.');
  }
}

async function createReviews(restaurantId) {
  console.log('\n  → Creando reseñas de demostración...');
  const toInsert = REVIEWS_DEMO.map(r => ({ ...r, restaurant_id: restaurantId, status: 'approved' }));
  const { error } = await supabase.from('reviews').insert(toInsert);
  if (error) throw error;
  console.log(`✅ ${REVIEWS_DEMO.length} reseñas creadas.`);
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  SmartBite — Setup Inicial Completo    ║');
  console.log('╚════════════════════════════════════════╝');

  try {
    // 1. Crear admin en Supabase Auth
    const adminId = await createAdminUser();

    // 2. Registrar admin en app_users
    await upsertAdminInAppUsers(adminId);

    // 3. Crear restaurante demo con el admin como dueño
    const restaurant = await createRestaurant(adminId);

    // 4. Categorías y productos
    const catMap = await createCategories(restaurant.id);
    await createProducts(restaurant.id, catMap);

    // 5. Ruleta Pay
    await createWheelConfig(restaurant.id);

    // 6. Suscripción al plan
    await createPlan(restaurant.id);

    // 7. Reseñas demo
    await createReviews(restaurant.id);

    // ─── RESUMEN ───────────────────────────────────────────────────────
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  ✅ SETUP COMPLETADO EXITOSAMENTE       ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('\n📋 CREDENCIALES DEL SUPER ADMIN:');
    console.log(`   Email:      ${ADMIN_EMAIL}`);
    console.log(`   Contraseña: ${ADMIN_PASSWORD}`);
    console.log(`   Rol:        admin`);
    console.log('\n🌐 Accede a la app:');
    console.log('   http://localhost:3000/auth');
    console.log('   → Dashboard Admin: http://localhost:3000/platform');
    console.log('\n🍔 Restaurante demo creado:');
    console.log(`   "${restaurant.name}" (ID: ${restaurant.id})`);
    console.log(`   URL: http://localhost:3000/r/${restaurant.id}`);
    console.log('\n🎰 Ruleta Pay: ACTIVA (mínimo $20.000)');
    console.log('🪙 Monedas: 10 por pedido (configurado en platform_settings)');

  } catch (err) {
    console.error('\n❌ ERROR durante el setup:', err.message || err);
    console.error(err);
    process.exit(1);
  }
}

main();
