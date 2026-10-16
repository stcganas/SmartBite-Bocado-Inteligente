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
