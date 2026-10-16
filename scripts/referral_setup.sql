-- Código SQL para configurar el sistema de referidos en Supabase

-- 1. Crear la tabla de referidos (referrals)
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_referral UNIQUE (referrer_id, referred_id)
);

-- Asegurarse de que el RLS (Row Level Security) está activo
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Políticas de la tabla referrals
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can read their own referrals" ON public.referrals;
    DROP POLICY IF EXISTS "Admins have full access to referrals" ON public.referrals;
    DROP POLICY IF EXISTS "Allow inserts during referral flow" ON public.referrals;
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

CREATE POLICY "Users can read their own referrals" 
ON public.referrals FOR SELECT 
USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Allow inserts during referral flow" 
ON public.referrals FOR INSERT 
WITH CHECK (true); -- La capa de API maneja la seguridad

CREATE POLICY "Admins have full access to referrals" 
ON public.referrals FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role IN ('admin', 'restaurant')
  )
);

-- 2. Crear la tabla de solicitudes de retiro (withdrawal_requests)
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    method VARCHAR(50) NOT NULL,
    nequi_number VARCHAR(50),
    bank_name VARCHAR(100),
    account_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can read their own withdrawal requests" ON public.withdrawal_requests;
    DROP POLICY IF EXISTS "Users can insert their own withdrawal requests" ON public.withdrawal_requests;
    DROP POLICY IF EXISTS "Admins have full access to withdrawal requests" ON public.withdrawal_requests;
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

CREATE POLICY "Users can read their own withdrawal requests" 
ON public.withdrawal_requests FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own withdrawal requests" 
ON public.withdrawal_requests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins have full access to withdrawal requests" 
ON public.withdrawal_requests FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role IN ('admin', 'restaurant')
  )
);

-- 3. Actualizar la tabla app_users si no tiene las columnas necesarias
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.app_users ADD COLUMN referral_code VARCHAR(100) UNIQUE;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
    
    BEGIN
        ALTER TABLE public.app_users ADD COLUMN referred_by VARCHAR(100);
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;

    BEGIN
        ALTER TABLE public.app_users ADD COLUMN referral_balance NUMERIC(10, 2) DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
    
    BEGIN
        ALTER TABLE public.app_users ADD COLUMN max_referral_invites INTEGER DEFAULT 20;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
END $$;

-- 3.5. Actualizar la tabla withdrawal_requests si no tiene las columnas necesarias para el panel comercial de embajadores
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.withdrawal_requests ADD COLUMN bank_name VARCHAR(100);
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;

    BEGIN
        ALTER TABLE public.withdrawal_requests ADD COLUMN account_number VARCHAR(100);
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
END $$;

-- 4. Actualizar la tabla restaurants si no tiene las columnas necesarias
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.restaurants ADD COLUMN referral_enabled BOOLEAN DEFAULT false;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
    
    BEGIN
        ALTER TABLE public.restaurants ADD COLUMN referral_commission_type VARCHAR(20) DEFAULT 'percentage';
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;

    BEGIN
        ALTER TABLE public.restaurants ADD COLUMN referral_commission_value NUMERIC(10, 2) DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
END $$;

-- 5. Crear índices para optimizar las consultas del dashboard
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON public.referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_restaurant_id ON public.referrals(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_app_users_referral_code ON public.app_users(referral_code);

-- ¡Completado!
