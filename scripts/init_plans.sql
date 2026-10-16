CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    type VARCHAR(50) NOT NULL DEFAULT 'fixed',
    commission_percentage NUMERIC DEFAULT 0,
    billing_cycle VARCHAR(50) NOT NULL DEFAULT 'monthly',
    features JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to active plans" ON plans;
DROP POLICY IF EXISTS "Allow admin full access to plans" ON plans;

CREATE POLICY "Allow public read access to active plans"
    ON plans FOR SELECT
    USING (is_active = true);

CREATE POLICY "Allow admin full access to plans"
    ON plans FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE TABLE IF NOT EXISTS restaurant_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES plans(id),
    status TEXT NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE restaurant_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow owners to read their subscriptions" ON restaurant_subscriptions;
DROP POLICY IF EXISTS "Allow admins full access to subscriptions" ON restaurant_subscriptions;

CREATE POLICY "Allow owners to read their subscriptions"
    ON restaurant_subscriptions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM restaurants WHERE id = restaurant_id AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Allow admins full access to subscriptions"
    ON restaurant_subscriptions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Delete existing default if any, and insert the required 3 plans:
DELETE FROM plans WHERE is_default = true OR type IN ('free', 'fixed', 'commission');

INSERT INTO plans (name, description, price, type, commission_percentage, billing_cycle, features, is_active, is_default)
VALUES
('Plan Gratis (30 Días)', 'Ideal para empezar. Limitado a categorías y productos básicos.', 0, 'free', 0, 'monthly', 
 '{"max_categories": 3, "max_products": 20, "max_orders_per_month": 50, "allow_loyalty": false, "allow_coupons": false, "allow_pos": false}'::jsonb, true, true),

('Plan por Comisión', 'Pagas solo si vendes. Todas las funciones liberadas a cambio de una pequeña comisión.', 0, 'commission', 5.0, 'monthly', 
 '{"max_categories": null, "max_products": null, "max_orders_per_month": null, "allow_loyalty": true, "allow_coupons": true, "allow_pos": true}'::jsonb, true, false),

('Plan Fijo Ilimitado', 'Acceso total a la plataforma sin comisiones, por un único pago fijo.', 49.99, 'fixed', 0, 'monthly', 
 '{"max_categories": null, "max_products": null, "max_orders_per_month": null, "allow_loyalty": true, "allow_coupons": true, "allow_pos": true}'::jsonb, true, false);

