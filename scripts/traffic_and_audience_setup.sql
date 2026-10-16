-- ==============================================================================
-- TABLA Y CONFIGURACIÓN COMPLETA DE TRÁFICO, AUDIENCIA Y TELEMETRÍA (SMARTBITE)
-- ==============================================================================
-- Ejecuta este script en el SQL Editor de tu consola de Supabase.
-- Es completamente idempotente (seguro de ejecutar múltiples veces sin borrar datos).

-- 1. CREACIÓN / ACTUALIZACIÓN DE LA TABLA 'restaurant_visits'
CREATE TABLE IF NOT EXISTS public.restaurant_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
    visit_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    page_path TEXT DEFAULT '/',
    session_id TEXT,
    ip_address TEXT DEFAULT 'Unknown',
    browser TEXT DEFAULT 'Unknown',
    os TEXT DEFAULT 'Unknown',
    screen_resolution TEXT,
    city TEXT,
    gender TEXT,
    age_range TEXT,
    fingerprint TEXT,
    es_bot BOOLEAN DEFAULT false,
    bot_signals JSONB DEFAULT '[]'::jsonb,
    device_info TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Asegurar columnas si la tabla ya existía previamente con menos campos
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_visits' AND column_name = 'visit_date') THEN
        ALTER TABLE public.restaurant_visits ADD COLUMN visit_date DATE DEFAULT CURRENT_DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_visits' AND column_name = 'page_path') THEN
        ALTER TABLE public.restaurant_visits ADD COLUMN page_path TEXT DEFAULT '/';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_visits' AND column_name = 'session_id') THEN
        ALTER TABLE public.restaurant_visits ADD COLUMN session_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_visits' AND column_name = 'ip_address') THEN
        ALTER TABLE public.restaurant_visits ADD COLUMN ip_address TEXT DEFAULT 'Unknown';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_visits' AND column_name = 'browser') THEN
        ALTER TABLE public.restaurant_visits ADD COLUMN browser TEXT DEFAULT 'Unknown';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_visits' AND column_name = 'os') THEN
        ALTER TABLE public.restaurant_visits ADD COLUMN os TEXT DEFAULT 'Unknown';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_visits' AND column_name = 'screen_resolution') THEN
        ALTER TABLE public.restaurant_visits ADD COLUMN screen_resolution TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_visits' AND column_name = 'city') THEN
        ALTER TABLE public.restaurant_visits ADD COLUMN city TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_visits' AND column_name = 'gender') THEN
        ALTER TABLE public.restaurant_visits ADD COLUMN gender TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_visits' AND column_name = 'age_range') THEN
        ALTER TABLE public.restaurant_visits ADD COLUMN age_range TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_visits' AND column_name = 'fingerprint') THEN
        ALTER TABLE public.restaurant_visits ADD COLUMN fingerprint TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_visits' AND column_name = 'es_bot') THEN
        ALTER TABLE public.restaurant_visits ADD COLUMN es_bot BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_visits' AND column_name = 'bot_signals') THEN
        ALTER TABLE public.restaurant_visits ADD COLUMN bot_signals JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_visits' AND column_name = 'device_info') THEN
        ALTER TABLE public.restaurant_visits ADD COLUMN device_info TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_visits' AND column_name = 'metadata') THEN
        ALTER TABLE public.restaurant_visits ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 2. ÍNDICES DE ALTO RENDIMIENTO PARA CONSULTAS DE TRÁFICO Y AUDIENCIA
CREATE INDEX IF NOT EXISTS idx_restaurant_visits_created_at ON public.restaurant_visits (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_restaurant_visits_visit_date ON public.restaurant_visits (visit_date);
CREATE INDEX IF NOT EXISTS idx_restaurant_visits_restaurant_id ON public.restaurant_visits (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_visits_user_id ON public.restaurant_visits (user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_visits_fingerprint ON public.restaurant_visits (fingerprint);
CREATE INDEX IF NOT EXISTS idx_restaurant_visits_session_id ON public.restaurant_visits (session_id);

-- 3. POLÍTICAS DE SEGURIDAD (RLS)
-- Permitir que cualquier visitante (anónimo o autenticado) inserte su registro de visita sin bloqueo
ALTER TABLE public.restaurant_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir insercion publica de visitas" ON public.restaurant_visits;
CREATE POLICY "Permitir insercion publica de visitas" ON public.restaurant_visits 
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura de visitas" ON public.restaurant_visits;
CREATE POLICY "Permitir lectura de visitas" ON public.restaurant_visits 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir eliminacion de visitas antiguas" ON public.restaurant_visits;
CREATE POLICY "Permitir eliminacion de visitas antiguas" ON public.restaurant_visits 
FOR DELETE USING (true);
