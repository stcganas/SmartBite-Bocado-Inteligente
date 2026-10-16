-- ==============================================================================
-- ACTUALIZACIÓN FINAL DE BASE DE DATOS SUPABASE
-- ==============================================================================
-- Copia y pega este script completo en el SQL Editor de tu consola de Supabase.
-- Realiza:
-- 1. Eliminación de la tabla y datos de "reward_modules" (módulo slider de recompensas).
-- 2. Asegura que la tabla "platform_settings" tenga todas las columnas requeridas, incluyendo "updated_at".
-- 3. Inserta/Sincroniza las 11 categorías de negocio oficiales para que aparezcan en el despliegue.
-- 4. Remueve cualquier restricción o check constraint limitante en la tabla de restaurantes.
-- ==============================================================================

-- 1. ELIMINACIÓN COMPLETAMENTE DEL MÓDULO SLIDER DE RECOMPENSAS
DROP TABLE IF EXISTS public.reward_modules CASCADE;

-- 2. ASEGURAR TABLA PLATFORM_SETTINGS Y COLUMNAS INDIVIDUALES
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

-- Asegurar columnas individuales por si la tabla fue creada con un esquema previo diferente
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS hero_title TEXT DEFAULT 'Descubre los Mejores Sabores';
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS hero_subtitle TEXT DEFAULT 'Pide a domicilio de los mejores restaurantes y comercios de tu ciudad.';
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS hero_image TEXT DEFAULT 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80';
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS footer_banner_image TEXT DEFAULT 'https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&q=80';
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS footer_banner_link TEXT DEFAULT '/auth';
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS food_categories JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS business_categories JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS banners JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS payment_gateways JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS gamification_settings JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS referral_settings JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS onboarding_settings JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS featured_restaurants_limit INTEGER DEFAULT 10;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS banner_animation_speed INTEGER DEFAULT 5000;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Habilitar RLS en platform_settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica platform_settings" ON public.platform_settings;
CREATE POLICY "Lectura publica platform_settings" ON public.platform_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Modificacion platform_settings" ON public.platform_settings;
CREATE POLICY "Modificacion platform_settings" ON public.platform_settings FOR ALL USING (true);

-- 3. INSERTAR O ACTUALIZAR FILA ID = 1 CON LAS 11 CATEGORÍAS COMPLETAS Y ACTIVAS
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
    payment_gateways = COALESCE(public.platform_settings.payment_gateways, '{}'::jsonb) || '{"hideHeroSlider": false, "hideBusinessCategoryNav": false, "hideFoodCategoryChips": false}'::jsonb,
    updated_at = now();


-- 4. ELIMINAR CUALQUIER CHECK CONSTRAINT RESTRICTIVO EN LA TABLA DE RESTAURANTES
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

-- Asegurar columnas de la tabla restaurants
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'business_category') THEN
        ALTER TABLE public.restaurants ADD COLUMN business_category TEXT DEFAULT 'restaurant';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'business_type') THEN
        ALTER TABLE public.restaurants ADD COLUMN business_type TEXT DEFAULT 'physical';
    END IF;
END $$;

-- Sincronizar lógicamente restaurantes existentes a sus respectivas categorías oficiales
UPDATE public.restaurants 
SET business_category = 'salsamentaria'
WHERE (LOWER(name) LIKE '%salsamentar%' OR LOWER(type) LIKE '%salsamentar%')
  AND (business_category IS NULL OR business_category = 'restaurant' OR business_category = '');

UPDATE public.restaurants 
SET business_category = 'grocery'
WHERE (LOWER(name) LIKE '%verdul%' OR LOWER(type) LIKE '%verdul%' OR LOWER(name) LIKE '%frut%')
  AND (business_category IS NULL OR business_category = 'restaurant' OR business_category = '');

UPDATE public.restaurants 
SET business_category = 'bakery'
WHERE (LOWER(name) LIKE '%panader%' OR LOWER(type) LIKE '%panader%' OR LOWER(name) LIKE '%reposter%')
  AND (business_category IS NULL OR business_category = 'restaurant' OR business_category = '');

UPDATE public.restaurants 
SET business_category = 'liquor'
WHERE (LOWER(name) LIKE '%licor%' OR LOWER(type) LIKE '%licor%' OR LOWER(name) LIKE '%estanco%')
  AND (business_category IS NULL OR business_category = 'restaurant' OR business_category = '');

UPDATE public.restaurants 
SET business_category = 'pharmacy'
WHERE (LOWER(name) LIKE '%droguer%' OR LOWER(name) LIKE '%farmac%')
  AND (business_category IS NULL OR business_category = 'restaurant' OR business_category = '');

UPDATE public.restaurants 
SET business_category = 'ice_cream'
WHERE (LOWER(name) LIKE '%helad%' OR LOWER(name) LIKE '%gelato%')
  AND (business_category IS NULL OR business_category = 'restaurant' OR business_category = '');

UPDATE public.restaurants 
SET business_category = 'general_store'
WHERE (LOWER(name) LIKE '%viveres%' OR LOWER(name) LIKE '%abarrot%' OR LOWER(name) LIKE '%tienda%')
  AND (business_category IS NULL OR business_category = 'restaurant' OR business_category = '');

UPDATE public.restaurants 
SET business_category = 'cevicheria'
WHERE (LOWER(name) LIKE '%cevich%')
  AND (business_category IS NULL OR business_category = 'restaurant' OR business_category = '');

UPDATE public.restaurants 
SET business_category = 'seafood'
WHERE (LOWER(name) LIKE '%pescad%' OR LOWER(name) LIKE '%marisc%')
  AND (business_category IS NULL OR business_category = 'restaurant' OR business_category = '');

UPDATE public.restaurants 
SET business_category = 'coffee'
WHERE (LOWER(name) LIKE '%cafe%' OR LOWER(type) LIKE '%cafe%')
  AND (business_category IS NULL OR business_category = 'restaurant' OR business_category = '');

CREATE INDEX IF NOT EXISTS idx_restaurants_business_category ON public.restaurants(business_category);

-- NOTIFICACIÓN DE ÉXITO INTEGRAL
SELECT '¡Sincronización de Base de Datos Supabase completada con éxito!' AS resultado;
