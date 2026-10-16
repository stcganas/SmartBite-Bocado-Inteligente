-- ==============================================================================
-- ACTUALIZACIÓN INTEGRAL SUPABASE: SLIDER DE CATEGORÍAS Y META SOCIAL SUITE
-- ==============================================================================
-- Copia y pega este script completo en el SQL Editor de tu consola de Supabase.
-- Es 100% idempotente (seguro de ejecutar múltiples veces sin borrar datos existentes).

-- ------------------------------------------------------------------------------
-- 1. CONFIGURACIÓN DE PLATAFORMA Y CATEGORÍAS DE NEGOCIO ('platform_settings')
-- ------------------------------------------------------------------------------

-- Asegurar tabla base de platform_settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id BIGINT PRIMARY KEY DEFAULT 1,
    hero_title TEXT DEFAULT 'Pide comida, víveres y más',
    hero_subtitle TEXT DEFAULT 'Los mejores restaurantes y comercios en tu puerta',
    hero_image TEXT,
    footer_banner_image TEXT,
    footer_banner_link TEXT,
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

-- Asegurar columnas individuales en platform_settings si ya existía
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
END $$;

-- RLS para platform_settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de platform_settings" ON public.platform_settings;
CREATE POLICY "Lectura pública de platform_settings" ON public.platform_settings 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Modificación libre de platform_settings" ON public.platform_settings;
CREATE POLICY "Modificación libre de platform_settings" ON public.platform_settings 
    FOR ALL USING (true);

-- Insertar fila inicial si está vacía
INSERT INTO public.platform_settings (id, hero_title, hero_subtitle)
VALUES (1, 'Pide comida, víveres y más', 'Los mejores restaurantes y comercios en tu puerta')
ON CONFLICT (id) DO NOTHING;


-- ------------------------------------------------------------------------------
-- 2. CONFIGURACIÓN GLOBAL META APP ('platform_meta_config')
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_meta_config (
    id BIGINT PRIMARY KEY DEFAULT 1,
    app_id TEXT,
    app_secret TEXT,
    global_page_id TEXT,
    global_access_token TEXT,
    webhook_verify_token TEXT,
    is_live_mode BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.platform_meta_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo en platform_meta_config" ON public.platform_meta_config;
CREATE POLICY "Permitir todo en platform_meta_config" ON public.platform_meta_config 
    FOR ALL USING (true);

INSERT INTO public.platform_meta_config (id, is_live_mode)
VALUES (1, false)
ON CONFLICT (id) DO NOTHING;


-- ------------------------------------------------------------------------------
-- 3. CUENTAS VINCULADAS META (FACEBOOK / INSTAGRAM) POR RESTAURANTE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.restaurant_meta_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL,
    page_id TEXT,
    page_name TEXT,
    access_token TEXT,
    token_type TEXT DEFAULT 'page_access_token',
    is_never_expiring BOOLEAN DEFAULT false,
    token_expires_at TIMESTAMPTZ,
    instagram_id TEXT,
    instagram_username TEXT,
    is_simulated BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    last_health_check TIMESTAMPTZ DEFAULT now(),
    health_status TEXT DEFAULT 'healthy',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Asegurar columnas si la tabla ya existía
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_meta_accounts' AND column_name = 'token_type') THEN
        ALTER TABLE public.restaurant_meta_accounts ADD COLUMN token_type TEXT DEFAULT 'page_access_token';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_meta_accounts' AND column_name = 'is_never_expiring') THEN
        ALTER TABLE public.restaurant_meta_accounts ADD COLUMN is_never_expiring BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_meta_accounts' AND column_name = 'health_status') THEN
        ALTER TABLE public.restaurant_meta_accounts ADD COLUMN health_status TEXT DEFAULT 'healthy';
    END IF;
END $$;

ALTER TABLE public.restaurant_meta_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura de cuentas meta por restaurante" ON public.restaurant_meta_accounts;
CREATE POLICY "Lectura de cuentas meta por restaurante" ON public.restaurant_meta_accounts 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Gestión de cuentas meta" ON public.restaurant_meta_accounts;
CREATE POLICY "Gestión de cuentas meta" ON public.restaurant_meta_accounts 
    FOR ALL USING (true);


-- ------------------------------------------------------------------------------
-- 4. PUBLICACIONES SOCIALES ('meta_social_posts')
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.meta_social_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL,
    product_id UUID,
    product_name TEXT,
    caption TEXT NOT NULL,
    image_url TEXT,
    smart_link TEXT,
    publish_to_facebook BOOLEAN DEFAULT true,
    publish_to_instagram BOOLEAN DEFAULT true,
    facebook_post_id TEXT,
    instagram_post_id TEXT,
    status TEXT DEFAULT 'published',
    is_simulated BOOLEAN DEFAULT false,
    metrics JSONB DEFAULT '{"impressions": 0, "reactions": 0, "comments": 0, "shares": 0, "clicks": 0}'::jsonb,
    error_message TEXT,
    published_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Asegurar columnas si la tabla ya existía
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meta_social_posts' AND column_name = 'metrics') THEN
        ALTER TABLE public.meta_social_posts ADD COLUMN metrics JSONB DEFAULT '{"impressions": 0, "reactions": 0, "comments": 0, "shares": 0, "clicks": 0}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meta_social_posts' AND column_name = 'smart_link') THEN
        ALTER TABLE public.meta_social_posts ADD COLUMN smart_link TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meta_social_posts' AND column_name = 'is_simulated') THEN
        ALTER TABLE public.meta_social_posts ADD COLUMN is_simulated BOOLEAN DEFAULT false;
    END IF;
END $$;

ALTER TABLE public.meta_social_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica de meta_social_posts" ON public.meta_social_posts;
CREATE POLICY "Lectura publica de meta_social_posts" ON public.meta_social_posts 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Gestion de meta_social_posts" ON public.meta_social_posts;
CREATE POLICY "Gestion de meta_social_posts" ON public.meta_social_posts 
    FOR ALL USING (true);


-- ------------------------------------------------------------------------------
-- 5. ANALÍTICA DE CLICS EN SMART LINKS ('meta_post_clicks')
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.meta_post_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.meta_social_posts(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL,
    ip_hash TEXT,
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.meta_post_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Insercion y lectura de clics" ON public.meta_post_clicks;
CREATE POLICY "Insercion y lectura de clics" ON public.meta_post_clicks 
    FOR ALL USING (true);


-- ------------------------------------------------------------------------------
-- 6. ÍNDICES DE RENDIMIENTO
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_meta_posts_restaurant_id ON public.meta_social_posts(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_meta_posts_published_at ON public.meta_social_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_meta_accounts_restaurant_id ON public.restaurant_meta_accounts(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_meta_clicks_post_id ON public.meta_post_clicks(post_id);

-- FIN DEL SCRIPT
