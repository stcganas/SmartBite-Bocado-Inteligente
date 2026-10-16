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
