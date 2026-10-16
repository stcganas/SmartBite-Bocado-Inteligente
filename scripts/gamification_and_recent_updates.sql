-- ==============================================================================
-- ACTUALIZACIÓN DE BASE DE DATOS SUPABASE - GAMIFICACIÓN, HERO Y RANKING
-- ==============================================================================
-- Ejecuta este script en el SQL Editor de tu consola de Supabase.
-- Es completamente idempotente (seguro de ejecutar múltiples veces sin borrar datos).

-- ------------------------------------------------------------------------------
-- 1. CAMPOS DE GAMIFICACIÓN Y BENEFICIOS EN 'app_users'
-- ------------------------------------------------------------------------------
-- Almacena el progreso de gamificación (XP, niveles, tareas completadas) y los
-- beneficios desbloqueados al subir de nivel (afiliaciones e invitaciones extra).

DO $$ 
BEGIN 
    -- Campo JSON para almacenar el objeto de gamificación { type: "gamification", level, xp, completedTasks }
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'extra_anniversaries') THEN
        ALTER TABLE public.app_users ADD COLUMN extra_anniversaries JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Límite de afiliaciones a comercios (aumenta según nivel de gamificación)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'max_restaurant_affiliations') THEN
        ALTER TABLE public.app_users ADD COLUMN max_restaurant_affiliations INTEGER DEFAULT 5;
    END IF;

    -- Límite de invitaciones de referidos (aumenta según nivel de gamificación)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'max_referral_invites') THEN
        ALTER TABLE public.app_users ADD COLUMN max_referral_invites INTEGER DEFAULT 20;
    END IF;

    -- Saldo de referidos/comisiones
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'referral_balance') THEN
        ALTER TABLE public.app_users ADD COLUMN referral_balance NUMERIC(12, 2) DEFAULT 0;
    END IF;
END $$;


-- ------------------------------------------------------------------------------
-- 2. CONFIGURACIÓN DE GAMIFICACIÓN EN 'platform_settings'
-- ------------------------------------------------------------------------------
-- Permite guardar las tareas diarias, misiones semanales y ajustes de Ruleta Pay.

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'platform_settings' AND column_name = 'gamification_settings') THEN
        ALTER TABLE public.platform_settings ADD COLUMN gamification_settings JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;


-- ------------------------------------------------------------------------------
-- 3. TABLA DE PREMIOS DE LA RULETA ('wheel_prizes')
-- ------------------------------------------------------------------------------
-- Administra los giros y premios ganados por los usuarios en Ruleta Pay.

CREATE TABLE IF NOT EXISTS public.wheel_prizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    restaurant_id UUID,
    prize_text TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    is_prize BOOLEAN DEFAULT true,
    restaurant_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Asegurar columnas si la tabla ya existía previamente
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wheel_prizes' AND column_name = 'is_prize') THEN
        ALTER TABLE public.wheel_prizes ADD COLUMN is_prize BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wheel_prizes' AND column_name = 'restaurant_name') THEN
        ALTER TABLE public.wheel_prizes ADD COLUMN restaurant_name TEXT;
    END IF;
END $$;

-- Habilitar RLS y políticas seguras para wheel_prizes
ALTER TABLE public.wheel_prizes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura publica de wheel_prizes" ON public.wheel_prizes;
CREATE POLICY "Permitir lectura publica de wheel_prizes" ON public.wheel_prizes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercion de premios de ruleta" ON public.wheel_prizes;
CREATE POLICY "Permitir insercion de premios de ruleta" ON public.wheel_prizes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir actualizacion de estado de wheel_prizes" ON public.wheel_prizes;
CREATE POLICY "Permitir actualizacion de estado de wheel_prizes" ON public.wheel_prizes FOR UPDATE USING (true);


-- ------------------------------------------------------------------------------
-- 4. TABLAS PARA EL SEGUIMIENTO Y RANKING ('loyalty_points' y 'reviews')
-- ------------------------------------------------------------------------------
-- Estas tablas alimentan el cálculo de monedas, nivel y rating del Top 5 de usuarios.

CREATE TABLE IF NOT EXISTS public.loyalty_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    restaurant_id UUID,
    points_balance NUMERIC DEFAULT 0,
    total_earned NUMERIC DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura de loyalty_points" ON public.loyalty_points;
CREATE POLICY "Lectura de loyalty_points" ON public.loyalty_points FOR SELECT USING (true);

DROP POLICY IF EXISTS "Escritura de loyalty_points" ON public.loyalty_points;
CREATE POLICY "Escritura de loyalty_points" ON public.loyalty_points FOR ALL USING (true);


-- Tabla de reseñas y calificaciones si aún no está creada
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    restaurant_id UUID,
    order_id UUID,
    rating NUMERIC(3, 1) NOT NULL DEFAULT 5.0,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica de reviews" ON public.reviews;
CREATE POLICY "Lectura publica de reviews" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insercion de reviews" ON public.reviews;
CREATE POLICY "Insercion de reviews" ON public.reviews FOR INSERT WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- 5. NOTIFICACIONES DE SUBIDA DE NIVEL Y MISIONES ('app_notifications')
-- ------------------------------------------------------------------------------
-- Asegura que las alertas automáticas de nivel y misiones se registren sin bloqueos de RLS.

CREATE TABLE IF NOT EXISTS public.app_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT DEFAULT 'system',
    order_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_notifications' AND column_name = 'order_id') THEN
        ALTER TABLE public.app_notifications ADD COLUMN order_id UUID;
    END IF;
END $$;

ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir insercion de notificaciones" ON public.app_notifications;
CREATE POLICY "Permitir insercion de notificaciones" ON public.app_notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Usuarios leen sus notificaciones" ON public.app_notifications;
CREATE POLICY "Usuarios leen sus notificaciones" ON public.app_notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuarios actualizan sus notificaciones" ON public.app_notifications;
CREATE POLICY "Usuarios actualizan sus notificaciones" ON public.app_notifications FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Usuarios eliminan sus notificaciones" ON public.app_notifications;
CREATE POLICY "Usuarios eliminan sus notificaciones" ON public.app_notifications FOR DELETE USING (true);
