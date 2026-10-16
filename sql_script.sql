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
