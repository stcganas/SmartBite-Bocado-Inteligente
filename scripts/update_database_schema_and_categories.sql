-- ==============================================================================
-- ACTUALIZACIÓN INTEGRAL DE BASE DE DATOS SUPABASE:
-- CATEGORÍAS DE NEGOCIO (11 SLIDES), NEGOCIOS VINCULADOS, BANNERS Y MARKETING
-- ==============================================================================
-- Copia y pega este script completo en el SQL Editor de tu consola de Supabase.
-- Es 100% seguro de ejecutar múltiples veces (idempotente) y no borra datos existentes.

-- ------------------------------------------------------------------------------
-- 1. TABLA: PLATFORM_SETTINGS Y ACTUALIZACIÓN DE LAS 11 CATEGORÍAS DE NEGOCIO
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.platform_settings (
    id BIGINT PRIMARY KEY DEFAULT 1,
    hero_title TEXT DEFAULT 'Descubre los Mejores Sabores',
    hero_subtitle TEXT DEFAULT 'Pide a domicilio de los mejores restaurantes y comercios de tu ciudad.',
    hero_image TEXT DEFAULT 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80',
    footer_banner_image TEXT DEFAULT 'https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&q=80',
    footer_banner_link TEXT DEFAULT '/auth',
    food_categories JSONB DEFAULT '[]'::jsonb,
    business_categories JSONB DEFAULT '[]'::jsonb,
    banners JSONB DEFAULT '[]'::jsonb,
    payment_gateways JSONB DEFAULT '{}'::jsonb,
    gamification_settings JSONB DEFAULT '{}'::jsonb,
    referral_settings JSONB DEFAULT '{}'::jsonb,
    onboarding_settings JSONB DEFAULT '{}'::jsonb,
    featured_restaurants_limit INTEGER DEFAULT 10,
    banner_animation_speed INTEGER DEFAULT 5000,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Asegurar columnas individuales si la tabla ya existía previamente
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'platform_settings' AND column_name = 'business_categories') THEN
        ALTER TABLE public.platform_settings ADD COLUMN business_categories JSONB DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'platform_settings' AND column_name = 'food_categories') THEN
        ALTER TABLE public.platform_settings ADD COLUMN food_categories JSONB DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'platform_settings' AND column_name = 'banners') THEN
        ALTER TABLE public.platform_settings ADD COLUMN banners JSONB DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'platform_settings' AND column_name = 'payment_gateways') THEN
        ALTER TABLE public.platform_settings ADD COLUMN payment_gateways JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'platform_settings' AND column_name = 'gamification_settings') THEN
        ALTER TABLE public.platform_settings ADD COLUMN gamification_settings JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'platform_settings' AND column_name = 'referral_settings') THEN
        ALTER TABLE public.platform_settings ADD COLUMN referral_settings JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'platform_settings' AND column_name = 'onboarding_settings') THEN
        ALTER TABLE public.platform_settings ADD COLUMN onboarding_settings JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'platform_settings' AND column_name = 'created_at') THEN
        ALTER TABLE public.platform_settings ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'platform_settings' AND column_name = 'updated_at') THEN
        ALTER TABLE public.platform_settings ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- Habilitar RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica platform_settings" ON public.platform_settings;
CREATE POLICY "Lectura publica platform_settings" ON public.platform_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Modificacion platform_settings" ON public.platform_settings;
CREATE POLICY "Modificacion platform_settings" ON public.platform_settings FOR ALL USING (true);

-- ACTUALIZAR O INSERTAR LA FILA ID = 1 CON LAS 11 CATEGORÍAS COMPLETAS Y VISIBILIDAD
INSERT INTO public.platform_settings (
    id,
    hero_title,
    hero_subtitle,
    hero_image,
    footer_banner_image,
    footer_banner_link,
    featured_restaurants_limit,
    banner_animation_speed,
    food_categories,
    business_categories,
    payment_gateways
) VALUES (
    1,
    'Descubre los Mejores Sabores',
    'Pide a domicilio de los mejores restaurantes y comercios de tu ciudad. Rápido, fácil y delicioso.',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&q=80',
    '/auth',
    10,
    5000,
    '[
      {"id": "pizza", "name": "Pizza", "icon": "🍕", "imageUrl": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80"},
      {"id": "burger", "name": "Hamburguesas", "icon": "🍔", "imageUrl": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80"},
      {"id": "sushi", "name": "Sushi", "icon": "🍣", "imageUrl": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=400&q=80"},
      {"id": "healthy", "name": "Saludable", "icon": "🥗", "imageUrl": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80"},
      {"id": "tacos", "name": "Tacos", "icon": "🌮", "imageUrl": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80"},
      {"id": "dessert", "name": "Postres", "icon": "🍰", "imageUrl": "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=400&q=80"},
      {"id": "drinks", "name": "Bebidas", "icon": "🥤", "imageUrl": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80"}
    ]'::jsonb,
    '[
      {
        "id": "restaurant",
        "title": "Explorar Restaurantes",
        "subtitle": "Tus comidas favoritas a la puerta de tu casa.",
        "image": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1000&auto=format&fit=crop",
        "active": true,
        "fromColor": "from-neutral-900 via-neutral-800",
        "toColor": "to-[#FF8A00]/60",
        "shadowColor": "shadow-[0_4px_20px_rgba(255,138,0,0.3)] border-[#FF8A00]/40",
        "dotColor": "bg-[#FF8A00]"
      },
      {
        "id": "salsamentaria",
        "title": "Explorar Salsamentarías",
        "subtitle": "Los mejores embutidos, quesos y carnes frías.",
        "image": "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1000&auto=format&fit=crop",
        "active": true,
        "fromColor": "from-neutral-900 via-neutral-800",
        "toColor": "to-rose-600/60",
        "shadowColor": "shadow-[0_4px_20px_rgba(244,63,94,0.3)] border-rose-500/40",
        "dotColor": "bg-rose-500"
      },
      {
        "id": "grocery",
        "title": "Explorar Verdulerías",
        "subtitle": "Frutas, verduras y legumbres frescas cada día.",
        "image": "https://images.unsplash.com/photo-1610348725531-843dff563e2c?q=80&w=1000&auto=format&fit=crop",
        "active": true,
        "fromColor": "from-neutral-900 via-neutral-800",
        "toColor": "to-[#10B981]/60",
        "shadowColor": "shadow-[0_4px_20px_rgba(16,185,129,0.3)] border-[#10B981]/40",
        "dotColor": "bg-[#10B981]"
      },
      {
        "id": "bakery",
        "title": "Explorar Panaderías",
        "subtitle": "Pan recién horneado, repostería y pastelería.",
        "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1000&auto=format&fit=crop",
        "active": true,
        "fromColor": "from-neutral-900 via-neutral-800",
        "toColor": "to-amber-600/60",
        "shadowColor": "shadow-[0_4px_20px_rgba(217,119,6,0.3)] border-amber-500/40",
        "dotColor": "bg-amber-500"
      },
      {
        "id": "liquor",
        "title": "Explorar Licores",
        "subtitle": "Bebidas, vinos, cervezas y licores para toda ocasión.",
        "image": "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?q=80&w=1000&auto=format&fit=crop",
        "active": true,
        "fromColor": "from-neutral-900 via-neutral-800",
        "toColor": "to-[#8B5CF6]/60",
        "shadowColor": "shadow-[0_4px_20px_rgba(139,92,246,0.3)] border-[#8B5CF6]/40",
        "dotColor": "bg-[#8B5CF6]"
      },
      {
        "id": "pharmacy",
        "title": "Farmacias y Salud",
        "subtitle": "Medicamentos y productos de salud y cuidado personal.",
        "image": "https://images.unsplash.com/photo-1587854685352-25d82ae39c93?q=80&w=1000&auto=format&fit=crop",
        "active": true,
        "fromColor": "from-neutral-900 via-neutral-800",
        "toColor": "to-cyan-600/60",
        "shadowColor": "shadow-[0_4px_20px_rgba(6,182,212,0.3)] border-cyan-500/40",
        "dotColor": "bg-cyan-500"
      },
      {
        "id": "ice_cream",
        "title": "Heladerías y Postres",
        "subtitle": "Tus helados favoritos y postres refrescantes.",
        "image": "https://images.unsplash.com/photo-1501443762994-82bd5dabb892?q=80&w=1000&auto=format&fit=crop",
        "active": true,
        "fromColor": "from-neutral-900 via-neutral-800",
        "toColor": "to-pink-500/60",
        "shadowColor": "shadow-[0_4px_20px_rgba(236,72,153,0.3)] border-pink-500/40",
        "dotColor": "bg-pink-500"
      },
      {
        "id": "general_store",
        "title": "Víveres y Abarrotes",
        "subtitle": "Todo para tu despensa y hogar en un solo lugar.",
        "image": "https://images.unsplash.com/photo-1534723452862-4c874018d66d?q=80&w=1000&auto=format&fit=crop",
        "active": true,
        "fromColor": "from-neutral-900 via-neutral-800",
        "toColor": "to-yellow-600/60",
        "shadowColor": "shadow-[0_4px_20px_rgba(202,138,4,0.3)] border-yellow-500/40",
        "dotColor": "bg-yellow-500"
      },
      {
        "id": "cevicheria",
        "title": "Cevicherías",
        "subtitle": "Los mejores ceviches frescos y cocteles.",
        "image": "https://images.unsplash.com/photo-1535401481945-c0f1ad0a6a5d?q=80&w=1000&auto=format&fit=crop",
        "active": true,
        "fromColor": "from-neutral-900 via-neutral-800",
        "toColor": "to-teal-500/60",
        "shadowColor": "shadow-[0_4px_20px_rgba(20,184,166,0.3)] border-teal-400/40",
        "dotColor": "bg-teal-500"
      },
      {
        "id": "seafood",
        "title": "Pescados y Mariscos",
        "subtitle": "Frescura y sabor del mar en tu mesa.",
        "image": "https://images.unsplash.com/photo-1551489186-cf8726f514f8?q=80&w=1000&auto=format&fit=crop",
        "active": true,
        "fromColor": "from-neutral-900 via-neutral-800",
        "toColor": "to-blue-600/60",
        "shadowColor": "shadow-[0_4px_20px_rgba(2,132,199,0.3)] border-blue-500/40",
        "dotColor": "bg-blue-500"
      },
      {
        "id": "coffee",
        "title": "Cafeterías",
        "subtitle": "El mejor café especial, repostería y desayunos.",
        "image": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1000&auto=format&fit=crop",
        "active": true,
        "fromColor": "from-neutral-900 via-neutral-800",
        "toColor": "to-orange-700/60",
        "shadowColor": "shadow-[0_4px_20px_rgba(194,65,12,0.3)] border-orange-500/40",
        "dotColor": "bg-orange-500"
      }
    ]'::jsonb,
    '{"hideHeroSlider": false, "hideBusinessCategoryNav": false, "hideFoodCategoryChips": false, "appName": "SmartBite"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    business_categories = EXCLUDED.business_categories,
    food_categories = EXCLUDED.food_categories,
    payment_gateways = COALESCE(public.platform_settings.payment_gateways, '{}'::jsonb) || '{"hideHeroSlider": false, "hideBusinessCategoryNav": false, "hideFoodCategoryChips": false}'::jsonb;


-- ------------------------------------------------------------------------------
-- 2. TABLA: RESTAURANTS (LIMPIEZA DE CONSTRAINTS Y SINCRONIZACIÓN DE CATEGORÍAS)
-- ------------------------------------------------------------------------------

-- Eliminar cualquier CHECK CONSTRAINT restrictivo que impida categorías personalizadas
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.restaurants'::regclass
          AND contype = 'c'
          AND (conname LIKE '%business_category%' OR conname LIKE '%chk_business%')
    ) LOOP
        EXECUTE 'ALTER TABLE public.restaurants DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- Asegurar que la columna business_category exista como TEXT libre
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'business_category') THEN
        ALTER TABLE public.restaurants ADD COLUMN business_category TEXT DEFAULT 'restaurant';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'business_type') THEN
        ALTER TABLE public.restaurants ADD COLUMN business_type TEXT DEFAULT 'physical';
    END IF;
END $$;

-- Sincronizar restaurantes existentes según su tipo o nombre si están como 'restaurant' por defecto
UPDATE public.restaurants 
SET business_category = 'salsamentaria'
WHERE (LOWER(name) LIKE '%salsamentar%' OR LOWER(type) LIKE '%salsamentar%' OR payment_gateways->>'businessCategory' = 'salsamentaria')
  AND (business_category IS NULL OR business_category = 'restaurant' OR business_category = '');

UPDATE public.restaurants 
SET business_category = 'grocery'
WHERE (LOWER(name) LIKE '%verdul%' OR LOWER(type) LIKE '%verdul%' OR LOWER(name) LIKE '%frut%' OR payment_gateways->>'businessCategory' = 'grocery')
  AND (business_category IS NULL OR business_category = 'restaurant' OR business_category = '');

UPDATE public.restaurants 
SET business_category = 'bakery'
WHERE (LOWER(name) LIKE '%panader%' OR LOWER(type) LIKE '%panader%' OR LOWER(name) LIKE '%reposter%' OR payment_gateways->>'businessCategory' = 'bakery')
  AND (business_category IS NULL OR business_category = 'restaurant' OR business_category = '');

UPDATE public.restaurants 
SET business_category = 'liquor'
WHERE (LOWER(name) LIKE '%licor%' OR LOWER(type) LIKE '%licor%' OR LOWER(name) LIKE '%estanco%' OR payment_gateways->>'businessCategory' = 'liquor')
  AND (business_category IS NULL OR business_category = 'restaurant' OR business_category = '');

UPDATE public.restaurants 
SET business_category = 'pharmacy'
WHERE (LOWER(name) LIKE '%droguer%' OR LOWER(name) LIKE '%farmac%' OR payment_gateways->>'businessCategory' = 'pharmacy')
  AND (business_category IS NULL OR business_category = 'restaurant' OR business_category = '');

UPDATE public.restaurants 
SET business_category = 'ice_cream'
WHERE (LOWER(name) LIKE '%helad%' OR LOWER(name) LIKE '%gelato%' OR payment_gateways->>'businessCategory' = 'ice_cream')
  AND (business_category IS NULL OR business_category = 'restaurant' OR business_category = '');

UPDATE public.restaurants 
SET business_category = 'general_store'
WHERE (LOWER(name) LIKE '%viveres%' OR LOWER(name) LIKE '%abarrot%' OR LOWER(name) LIKE '%tienda%' OR payment_gateways->>'businessCategory' = 'general_store')
  AND (business_category IS NULL OR business_category = 'restaurant' OR business_category = '');

UPDATE public.restaurants 
SET business_category = 'cevicheria'
WHERE (LOWER(name) LIKE '%cevich%' OR payment_gateways->>'businessCategory' = 'cevicheria')
  AND (business_category IS NULL OR business_category = 'restaurant' OR business_category = '');

UPDATE public.restaurants 
SET business_category = 'seafood'
WHERE (LOWER(name) LIKE '%pescad%' OR LOWER(name) LIKE '%marisc%' OR payment_gateways->>'businessCategory' = 'seafood')
  AND (business_category IS NULL OR business_category = 'restaurant' OR business_category = '');

UPDATE public.restaurants 
SET business_category = 'coffee'
WHERE (LOWER(name) LIKE '%cafe%' OR LOWER(type) LIKE '%cafe%' OR payment_gateways->>'businessCategory' = 'coffee')
  AND (business_category IS NULL OR business_category = 'restaurant' OR business_category = '');

-- Índice para búsquedas ultrarrápidas por categoría de negocio
CREATE INDEX IF NOT EXISTS idx_restaurants_business_category ON public.restaurants(business_category);


-- ------------------------------------------------------------------------------
-- 3. TABLA: MÓDULOS DE RECOMPENSAS / GAMIFICACIÓN ('reward_modules')
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reward_modules (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    button_text TEXT DEFAULT 'Ir',
    path TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Si la columna id ya existía como UUID, convertirla a TEXT de forma segura
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'reward_modules' 
          AND column_name = 'id' 
          AND data_type = 'uuid'
    ) THEN
        ALTER TABLE public.reward_modules ALTER COLUMN id TYPE TEXT USING id::text;
    END IF;
END $$;

ALTER TABLE public.reward_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica reward_modules" ON public.reward_modules;
CREATE POLICY "Lectura publica reward_modules" ON public.reward_modules FOR SELECT USING (true);

DROP POLICY IF EXISTS "Modificacion reward_modules" ON public.reward_modules;
CREATE POLICY "Modificacion reward_modules" ON public.reward_modules FOR ALL USING (true);

-- Insertar o actualizar módulos base usando IDs de texto
INSERT INTO public.reward_modules (id, title, description, image_url, button_text, path, is_active, sort_order)
VALUES
    ('default-ruleta', 'Ruleta Pay', 'Gira y gana increíbles premios diarios y monedas de oro.', 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80', 'Girar', '/gamification', true, 1),
    ('default-parchis', 'Parchís Online', 'Juega partidas con amigos y compite por grandes recompensas.', 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80', 'Jugar', '/parchis', true, 2),
    ('default-referidos', 'Programa de Referidos', 'Invita a tus amigos y gana comisiones en cada compra.', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80', 'Invitar', '/referrals', true, 3)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    button_text = EXCLUDED.button_text,
    path = EXCLUDED.path,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order;

-- ------------------------------------------------------------------------------
-- NOTIFICACIÓN DE ÉXITO
-- ------------------------------------------------------------------------------
SELECT '¡Base de datos de Supabase actualizada exitosamente con 11 categorías de negocio, sincronización de comercios y módulos activos!' AS resultado;
