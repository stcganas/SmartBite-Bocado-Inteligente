-- SMARTBITE DATABASE SETUP SQL
-- Run this in your Supabase SQL Editor

-- 1. BACKGROUND MUSIC TRACKS
CREATE TABLE IF NOT EXISTS public.background_music (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for background_music
ALTER TABLE public.background_music ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public background_music are viewable by everyone" ON public.background_music;
CREATE POLICY "Public background_music are viewable by everyone" ON public.background_music FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can do everything on background_music" ON public.background_music;
CREATE POLICY "Admins can do everything on background_music" ON public.background_music FOR ALL USING (true);

-- 2. SPLASH SCREENS
CREATE TABLE IF NOT EXISTS public.splash_screens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    is_active BOOLEAN DEFAULT false,
    settings JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for splash_screens
ALTER TABLE public.splash_screens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public splash_screens are viewable by everyone" ON public.splash_screens;
CREATE POLICY "Public splash_screens are viewable by everyone" ON public.splash_screens FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can do everything on splash_screens" ON public.splash_screens;
CREATE POLICY "Admins can do everything on splash_screens" ON public.splash_screens FOR ALL USING (true);

-- 3. REFERRAL REQUESTS
CREATE TABLE IF NOT EXISTS public.referral_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_phone TEXT,
    restaurant_id UUID NOT NULL,
    restaurant_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for referral_requests
ALTER TABLE public.referral_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own referral requests" ON public.referral_requests;
CREATE POLICY "Users can view their own referral requests" ON public.referral_requests FOR SELECT USING (auth.uid()::text = user_id::text);
DROP POLICY IF EXISTS "Admins can do everything on referral_requests" ON public.referral_requests;
CREATE POLICY "Admins can do everything on referral_requests" ON public.referral_requests FOR ALL USING (true);

-- 4. NOTIFICATION CAMPAIGNS
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

-- 5. SCHEDULED NOTIFICATIONS
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

-- 6. WHEEL PRIZES (Ruleta Pay)
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

-- Add column if missing in wheel_prizes (example of field update)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wheel_prizes' AND column_name='is_prize') THEN
        ALTER TABLE public.wheel_prizes ADD COLUMN is_prize BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 7. SUPPORT TICKETS (For Representative Applications & Support Queries)
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    restaurant_id UUID,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    priority TEXT NOT NULL DEFAULT 'medium',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for support_tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert tickets so public representative filings work immediately
DROP POLICY IF EXISTS "Allow public insert to support_tickets" ON public.support_tickets;
CREATE POLICY "Allow public insert to support_tickets" ON public.support_tickets FOR INSERT WITH CHECK (true);

-- Allow reading tickets for administrative or user tracking purposes
DROP POLICY IF EXISTS "Allow select support_tickets" ON public.support_tickets;
CREATE POLICY "Allow select support_tickets" ON public.support_tickets FOR SELECT USING (true);

-- Allow updating ticket status or assignment
DROP POLICY IF EXISTS "Allow update support_tickets" ON public.support_tickets;
CREATE POLICY "Allow update support_tickets" ON public.support_tickets FOR UPDATE USING (true);

-- Allow deleting tickets if necessary
DROP POLICY IF EXISTS "Allow delete support_tickets" ON public.support_tickets;
CREATE POLICY "Allow delete support_tickets" ON public.support_tickets FOR DELETE USING (true);


-- 8. APP NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.app_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT DEFAULT 'system',
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for app_notifications
ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notifications" ON public.app_notifications;
CREATE POLICY "Users can read own notifications" ON public.app_notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.app_notifications;
CREATE POLICY "Users can update own notifications" ON public.app_notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.app_notifications;
CREATE POLICY "Users can delete own notifications" ON public.app_notifications FOR DELETE USING (auth.uid() = user_id);


-- 9. AI MARKETING STRATEGIES
CREATE TABLE IF NOT EXISTS public.ai_marketing_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    target_products JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'draft',
    impact TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for ai_marketing_strategies
ALTER TABLE public.ai_marketing_strategies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can select ai_marketing_strategies" ON public.ai_marketing_strategies;
CREATE POLICY "Anyone can select ai_marketing_strategies" ON public.ai_marketing_strategies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert/update/delete ai_marketing_strategies" ON public.ai_marketing_strategies;
CREATE POLICY "Anyone can insert/update/delete ai_marketing_strategies" ON public.ai_marketing_strategies FOR ALL USING (true);

-- Create table for tracking visits per restaurant
CREATE TABLE IF NOT EXISTS public.restaurant_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL, -- Referencia a app_users, NO a users
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  device_info TEXT,
  city TEXT,
  gender TEXT,
  age_range TEXT
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_restaurant_visits_restaurant_id ON public.restaurant_visits(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_visits_date ON public.restaurant_visits(visit_date);
CREATE TABLE IF NOT EXISTS public.app_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  device_info TEXT,
  city TEXT,
  gender TEXT,
  age_range TEXT
);
CREATE INDEX IF NOT EXISTS idx_app_visits_date ON public.app_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_app_visits_rest_id ON public.app_visits(restaurant_id);
-- Create table for tracking visits globally and per restaurant
CREATE TABLE IF NOT EXISTS public.restaurant_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL, 
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  device_info TEXT,
  city TEXT,
  gender TEXT,
  age_range TEXT,
  es_bot BOOLEAN DEFAULT FALSE,
  fingerprint TEXT
);

-- Alter table queries for existing tables
ALTER TABLE public.restaurant_visits ADD COLUMN IF NOT EXISTS es_bot BOOLEAN DEFAULT FALSE;
ALTER TABLE public.restaurant_visits ADD COLUMN IF NOT EXISTS fingerprint TEXT;

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_restaurant_visits_rest_id ON public.restaurant_visits(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_visits_date ON public.restaurant_visits(visit_date);
