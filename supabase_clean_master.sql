-- ==============================================================================
-- SMARTBITE ("SU BOCADO INTELIGENTE") - MASTER DATABASE SCHEMA (CLEAN INSTALL)
-- ==============================================================================
-- Este script crea y configura desde cero toda la base de datos de SmartBite
-- en un nuevo proyecto de Supabase.
-- Ejecución: Abre tu consola de Supabase -> SQL Editor -> Pega todo este código -> Run.
-- ==============================================================================

-- 1. HABILITAR EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLAS PRINCIPALES
-- ==============================================================================

-- 2.1 CONFIGURACIÓN GLOBAL DE LA PLATAFORMA
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id BIGINT PRIMARY KEY DEFAULT 1,
    hero_title TEXT DEFAULT 'Descubre los Mejores Sabores',
    hero_subtitle TEXT DEFAULT 'Pide a domicilio de los mejores restaurantes y comercios de tu ciudad. Rápido, fácil y delicioso.',
    hero_image TEXT DEFAULT 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80',
    footer_banner_image TEXT DEFAULT 'https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&q=80',
    footer_banner_link TEXT DEFAULT '/auth',
    food_categories JSONB DEFAULT '[]'::jsonb,
    business_categories JSONB DEFAULT '[]'::jsonb,
    banners JSONB DEFAULT '[]'::jsonb,
    payment_gateways JSONB DEFAULT '{"appName": "SmartBite"}'::jsonb,
    gamification_settings JSONB DEFAULT '{}'::jsonb,
    referral_settings JSONB DEFAULT '{}'::jsonb,
    onboarding_settings JSONB DEFAULT '{}'::jsonb,
    featured_restaurants_limit INTEGER DEFAULT 10,
    banner_animation_speed INTEGER DEFAULT 5000,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.2 PERFILES DE USUARIOS (EXTENSIÓN DE AUTH)
CREATE TABLE IF NOT EXISTS public.app_users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user', -- 'user' | 'restaurant' | 'driver' | 'representative' | 'admin'
    status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'paused' | 'banned'
    display_name TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    department TEXT,
    avatar_url TEXT,
    loyalty_points INTEGER DEFAULT 0,
    loyalty_coins INTEGER DEFAULT 0,
    referral_code TEXT UNIQUE,
    referred_by UUID,
    profile_completed BOOLEAN DEFAULT false,
    is_guest BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.3 RESTAURANTES Y COMERCIOS
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    name TEXT NOT NULL,
    type TEXT,
    business_type TEXT DEFAULT 'physical', -- 'physical' | 'online'
    business_category TEXT DEFAULT 'restaurant',
    description TEXT,
    logo TEXT,
    cover_image TEXT,
    phone TEXT,
    address TEXT,
    department TEXT,
    city TEXT,
    handles_promotions BOOLEAN DEFAULT false,
    has_delivery BOOLEAN DEFAULT true,
    delivery_fee NUMERIC(12,2) DEFAULT 0,
    opening_hours TEXT,
    is_active BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'approved', -- 'pending' | 'approved' | 'rejected'
    commission_rate NUMERIC(5,2) DEFAULT 5.0,
    merit_score INTEGER DEFAULT 0,
    coordinates JSONB DEFAULT '{"lat": 4.6097, "lng": -74.0817}'::jsonb,
    schedule JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.4 CATEGORÍAS DE MENÚ DE CADA RESTAURANTE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.5 PRODUCTOS Y PLATOS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id UUID,
    category TEXT,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL DEFAULT 0,
    images TEXT[] DEFAULT '{}',
    available BOOLEAN DEFAULT true,
    has_discount BOOLEAN DEFAULT false,
    discount_percentage NUMERIC(5,2) DEFAULT 0,
    discount_price NUMERIC(12,2),
    is_promotion BOOLEAN DEFAULT false,
    isPartOfCombo BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    points_multiplier NUMERIC(5,2) DEFAULT 1.0,
    recommended_product_ids TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.6 PEDIDOS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
    user_id UUID,
    driver_id UUID,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    delivery_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
    discount NUMERIC(12,2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'pending', -- 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled'
    payment_method TEXT DEFAULT 'cash', -- 'cash' | 'wompi' | 'mercadopago' | 'transfer'
    payment_status TEXT DEFAULT 'pending', -- 'pending' | 'paid' | 'failed'
    delivery_address TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    notes TEXT,
    is_invoiced BOOLEAN DEFAULT false,
    invoice_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.7 PLANES DE SUSCRIPCIÓN PARA COMERCIOS
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12,2) DEFAULT 0,
    type TEXT DEFAULT 'free', -- 'free' | 'fixed' | 'commission'
    commission_percentage NUMERIC(5,2) DEFAULT 0,
    billing_cycle TEXT DEFAULT 'monthly', -- 'weekly' | 'biweekly' | 'monthly' | 'yearly'
    features JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.8 SUSCRIPCIONES ACTIVAS DE COMERCIOS
CREATE TABLE IF NOT EXISTS public.restaurant_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.plans(id) ON DELETE RESTRICT,
    status TEXT DEFAULT 'active', -- 'active' | 'past_due' | 'canceled' | 'unpaid'
    current_period_start TIMESTAMPTZ DEFAULT now(),
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.9 FACTURAS DE LA PLATAFORMA (COBROS DE PLANES / COMISIONES)
CREATE TABLE IF NOT EXISTS public.platform_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'subscription', -- 'subscription' | 'commission'
    status TEXT DEFAULT 'pending', -- 'pending' | 'paid' | 'failed'
    due_date TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    payment_method TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.10 RESEÑAS Y CALIFICACIONES
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    user_id UUID,
    user_name TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    reply TEXT,
    status TEXT DEFAULT 'approved',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.11 CUPONES DE DESCUENTO
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT DEFAULT 'percentage', -- 'percentage' | 'fixed'
    discount_value NUMERIC(12,2) NOT NULL,
    min_order NUMERIC(12,2) DEFAULT 0,
    max_discount NUMERIC(12,2),
    expiration_date TIMESTAMPTZ,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.12 SISTEMA DE REFERIDOS Y EMBAJADORES
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL,
    referred_id UUID NOT NULL,
    restaurant_id UUID,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.referral_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_phone TEXT,
    restaurant_id UUID,
    restaurant_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    payment_method TEXT NOT NULL,
    account_details JSONB NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    processed_at TIMESTAMPTZ
);

-- 2.13 RULETA PAY (RULETA DE LA SUERTE Y PREMIOS)
CREATE TABLE IF NOT EXISTS public.wheel_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE UNIQUE,
    segments JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    min_order_amount NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wheel_prizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    prize_text TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending' | 'claimed'
    is_prize BOOLEAN DEFAULT true,
    restaurant_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.14 PANTALLAS DE SPLASH Y ONBOARDING DINÁMICO
CREATE TABLE IF NOT EXISTS public.splash_screens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    is_active BOOLEAN DEFAULT false,
    settings JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.15 MÚSICA AMBIENTAL IN-APP
CREATE TABLE IF NOT EXISTS public.background_music (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.16 NOTIFICACIONES INTERNAS
CREATE TABLE IF NOT EXISTS public.app_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT DEFAULT 'system',
    is_read BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.17 CAMPAÑAS PUSH (ONESIGNAL)
CREATE TABLE IF NOT EXISTS public.notification_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID,
    restaurant_id UUID,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    target_segment TEXT NOT NULL,
    sent_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scheduled_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT NOT NULL,
    target_segment TEXT NOT NULL,
    restaurant_id UUID,
    scheduled_for TIMESTAMPTZ NOT NULL,
    is_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.18 TICKETS DE SOPORTE
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    restaurant_id UUID,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open', -- 'open' | 'in_progress' | 'resolved' | 'closed'
    priority TEXT NOT NULL DEFAULT 'medium', -- 'low' | 'medium' | 'high' | 'urgent'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.19 ESTRATEGIAS Y BASE DE CONOCIMIENTO DE IA
CREATE TABLE IF NOT EXISTS public.ai_marketing_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    target_products TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'draft',
    impact TEXT DEFAULT 'Medio',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.20 MÉTRICAS DE TRÁFICO Y VISITAS
CREATE TABLE IF NOT EXISTS public.restaurant_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    visitor_id TEXT,
    device_type TEXT,
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.21 INTEGRACIÓN SOCIAL (META GRAPH API / FACEBOOK / INSTAGRAM)
CREATE TABLE IF NOT EXISTS public.social_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_url TEXT,
    platforms TEXT[] DEFAULT '{"facebook","instagram"}',
    status TEXT DEFAULT 'published',
    fb_post_id TEXT,
    ig_media_id TEXT,
    impressions INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.22 PERFILES DE REPARTIDORES
CREATE TABLE IF NOT EXISTS public.driver_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    vehicle_type TEXT DEFAULT 'motorcycle', -- 'motorcycle' | 'bicycle' | 'car'
    vehicle_plate TEXT,
    is_online BOOLEAN DEFAULT false,
    current_lat NUMERIC(10,7),
    current_lng NUMERIC(10,7),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);


-- ==============================================================================
-- 3. STORAGE: BUCKET DE ASSETS
-- ==============================================================================

-- Crear el bucket de almacenamiento si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'restaurant-assets',
    'restaurant-assets',
    true,
    52428800, -- 50MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'video/mp4']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 52428800;

-- Políticas de Storage para el bucket restaurant-assets
DROP POLICY IF EXISTS "Public view on restaurant-assets" ON storage.objects;
CREATE POLICY "Public view on restaurant-assets" ON storage.objects
FOR SELECT USING (bucket_id = 'restaurant-assets');

DROP POLICY IF EXISTS "Public insert on restaurant-assets" ON storage.objects;
CREATE POLICY "Public insert on restaurant-assets" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'restaurant-assets');

DROP POLICY IF EXISTS "Public update on restaurant-assets" ON storage.objects;
CREATE POLICY "Public update on restaurant-assets" ON storage.objects
FOR UPDATE USING (bucket_id = 'restaurant-assets');

DROP POLICY IF EXISTS "Public delete on restaurant-assets" ON storage.objects;
CREATE POLICY "Public delete on restaurant-assets" ON storage.objects
FOR DELETE USING (bucket_id = 'restaurant-assets');


-- ==============================================================================
-- 4. POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- ==============================================================================

DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'platform_settings', 'app_users', 'restaurants', 'categories', 'products',
        'orders', 'plans', 'restaurant_subscriptions', 'platform_invoices',
        'reviews', 'coupons', 'referrals', 'referral_requests', 'withdrawal_requests',
        'wheel_configs', 'wheel_prizes', 'splash_screens', 'background_music',
        'app_notifications', 'notification_campaigns', 'scheduled_notifications',
        'support_tickets', 'ai_marketing_strategies', 'restaurant_visits',
        'social_posts', 'driver_profiles'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Permiso_total_%s" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "Permiso_total_%s" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
    END LOOP;
END $$;


-- ==============================================================================
-- 5. DATOS SEMILLA INICIALES (SEED DATA)
-- ==============================================================================

-- 5.1 CONFIGURACIÓN DE PLATAFORMA CON LAS 11 CATEGORÍAS COMPLETAS
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
    payment_gateways,
    gamification_settings
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
    '{"appName": "SmartBite", "hideHeroSlider": false, "hideBusinessCategoryNav": false, "hideFoodCategoryChips": false}'::jsonb,
    '{"coinsPerOrder": 10, "pointsPerCurrency": 1, "parchisEnabled": true, "rouletteEnabled": true}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    business_categories = EXCLUDED.business_categories,
    food_categories = EXCLUDED.food_categories,
    payment_gateways = EXCLUDED.payment_gateways;

-- 5.2 PLANES DE SUSCRIPCIÓN PREDETERMINADOS PARA COMERCIOS
INSERT INTO public.plans (id, name, description, price, type, commission_percentage, billing_cycle, is_active, is_default, features)
VALUES 
    (
        '11111111-1111-1111-1111-111111111111',
        'Plan Básico Gratuito',
        'Comienza a vender sin costos fijos mensuales. Solo 5% de comisión por venta completada.',
        0,
        'free',
        5.0,
        'monthly',
        true,
        true,
        '{"maxProducts": 50, "aiAssistant": true, "qrMenu": true, "marketingHub": false}'::jsonb
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        'Plan Profesional',
        'Tarifa fija mensual sin comisiones por pedido. Ideal para restaurantes consolidados.',
        49000,
        'fixed',
        0.0,
        'monthly',
        true,
        false,
        '{"maxProducts": 500, "aiAssistant": true, "qrMenu": true, "marketingHub": true, "socialIntegration": true}'::jsonb
    ),
    (
        '33333333-3333-3333-3333-333333333333',
        'Plan Comisión Reducida',
        'Comisión preferencial del 3% con herramientas avanzadas de fidelización y Ruleta Pay.',
        0,
        'commission',
        3.0,
        'monthly',
        true,
        false,
        '{"maxProducts": 200, "aiAssistant": true, "qrMenu": true, "wheelPay": true, "prioritySupport": true}'::jsonb
    )
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- ¡INSTALACIÓN COMPLETADA EXITOSAMENTE!
-- ==============================================================================
