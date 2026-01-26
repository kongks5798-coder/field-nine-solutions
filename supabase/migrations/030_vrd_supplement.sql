-- =============================================
-- VRD 26SS Supplementary Schema
-- Run this AFTER tables are created
-- =============================================

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_vrd_orders_customer_email ON vrd_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_vrd_orders_status ON vrd_orders(status);
CREATE INDEX IF NOT EXISTS idx_vrd_orders_created_at ON vrd_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vrd_orders_stripe_pi ON vrd_orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_vrd_payment_logs_order ON vrd_payment_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_vrd_inventory_product ON vrd_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_vrd_customers_email ON vrd_customers(email);

-- Function: Decrement Inventory
CREATE OR REPLACE FUNCTION decrement_vrd_inventory(
    p_product_id TEXT,
    p_color TEXT,
    p_quantity INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE vrd_inventory
    SET
        quantity = quantity - p_quantity,
        updated_at = NOW()
    WHERE product_id = p_product_id
    AND color = p_color
    AND quantity >= p_quantity;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_vrd_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS vrd_orders_updated_at ON vrd_orders;
CREATE TRIGGER vrd_orders_updated_at
    BEFORE UPDATE ON vrd_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_vrd_updated_at();

DROP TRIGGER IF EXISTS vrd_inventory_updated_at ON vrd_inventory;
CREATE TRIGGER vrd_inventory_updated_at
    BEFORE UPDATE ON vrd_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_vrd_updated_at();

DROP TRIGGER IF EXISTS vrd_customers_updated_at ON vrd_customers;
CREATE TRIGGER vrd_customers_updated_at
    BEFORE UPDATE ON vrd_customers
    FOR EACH ROW
    EXECUTE FUNCTION update_vrd_updated_at();

-- Row Level Security
ALTER TABLE vrd_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE vrd_payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vrd_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE vrd_customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Service role has full access to vrd_orders" ON vrd_orders;
DROP POLICY IF EXISTS "Service role has full access to vrd_payment_logs" ON vrd_payment_logs;
DROP POLICY IF EXISTS "Service role has full access to vrd_inventory" ON vrd_inventory;
DROP POLICY IF EXISTS "Service role has full access to vrd_customers" ON vrd_customers;
DROP POLICY IF EXISTS "Anyone can view vrd_inventory" ON vrd_inventory;

CREATE POLICY "Service role has full access to vrd_orders"
    ON vrd_orders FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to vrd_payment_logs"
    ON vrd_payment_logs FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to vrd_inventory"
    ON vrd_inventory FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to vrd_customers"
    ON vrd_customers FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Anyone can view vrd_inventory"
    ON vrd_inventory FOR SELECT
    USING (true);

-- Initial Inventory Data
INSERT INTO vrd_inventory (product_id, color, size, quantity) VALUES
    -- Armor-Compression Leggings
    ('vrd-armor-leggings', 'Jet Black', 'XS', 30),
    ('vrd-armor-leggings', 'Jet Black', 'S', 50),
    ('vrd-armor-leggings', 'Jet Black', 'M', 40),
    ('vrd-armor-leggings', 'Jet Black', 'L', 30),
    ('vrd-armor-leggings', 'Jet Black', 'XL', 20),
    ('vrd-armor-leggings', 'Deep Charcoal', 'XS', 25),
    ('vrd-armor-leggings', 'Deep Charcoal', 'S', 40),
    ('vrd-armor-leggings', 'Deep Charcoal', 'M', 35),
    ('vrd-armor-leggings', 'Deep Charcoal', 'L', 25),
    ('vrd-armor-leggings', 'Deep Charcoal', 'XL', 15),
    ('vrd-armor-leggings', 'Steel Blue', 'XS', 20),
    ('vrd-armor-leggings', 'Steel Blue', 'S', 30),
    ('vrd-armor-leggings', 'Steel Blue', 'M', 25),
    ('vrd-armor-leggings', 'Steel Blue', 'L', 20),
    ('vrd-armor-leggings', 'Steel Blue', 'XL', 10),
    -- Signature Support Sports Top
    ('vrd-signature-top', 'Sand Ivory', 'XS', 40),
    ('vrd-signature-top', 'Sand Ivory', 'S', 60),
    ('vrd-signature-top', 'Sand Ivory', 'M', 50),
    ('vrd-signature-top', 'Sand Ivory', 'L', 40),
    ('vrd-signature-top', 'Sand Ivory', 'XL', 25),
    ('vrd-signature-top', 'Jet Black', 'XS', 35),
    ('vrd-signature-top', 'Jet Black', 'S', 55),
    ('vrd-signature-top', 'Jet Black', 'M', 45),
    ('vrd-signature-top', 'Jet Black', 'L', 35),
    ('vrd-signature-top', 'Jet Black', 'XL', 20),
    -- V-Taper Crop Sweat
    ('vrd-vtaper-sweat', 'Jet Black', 'S', 30),
    ('vrd-vtaper-sweat', 'Jet Black', 'M', 40),
    ('vrd-vtaper-sweat', 'Jet Black', 'L', 30),
    ('vrd-vtaper-sweat', 'Jet Black', 'XL', 15),
    ('vrd-vtaper-sweat', 'Sand Ivory', 'S', 30),
    ('vrd-vtaper-sweat', 'Sand Ivory', 'M', 40),
    ('vrd-vtaper-sweat', 'Sand Ivory', 'L', 30),
    ('vrd-vtaper-sweat', 'Sand Ivory', 'XL', 15),
    -- Giant Overfit Tee
    ('vrd-giant-tee', 'Sand Ivory', 'M', 80),
    ('vrd-giant-tee', 'Sand Ivory', 'L', 100),
    ('vrd-giant-tee', 'Sand Ivory', 'XL', 80),
    ('vrd-giant-tee', 'Sand Ivory', 'XXL', 50),
    ('vrd-giant-tee', 'Jet Black', 'M', 70),
    ('vrd-giant-tee', 'Jet Black', 'L', 90),
    ('vrd-giant-tee', 'Jet Black', 'XL', 70),
    ('vrd-giant-tee', 'Jet Black', 'XXL', 45),
    -- Technical Ethereal Windbreaker
    ('vrd-ethereal-windbreaker', 'Deep Charcoal', 'S', 20),
    ('vrd-ethereal-windbreaker', 'Deep Charcoal', 'M', 30),
    ('vrd-ethereal-windbreaker', 'Deep Charcoal', 'L', 25),
    ('vrd-ethereal-windbreaker', 'Deep Charcoal', 'XL', 15),
    ('vrd-ethereal-windbreaker', 'Sand Ivory', 'S', 15),
    ('vrd-ethereal-windbreaker', 'Sand Ivory', 'M', 25),
    ('vrd-ethereal-windbreaker', 'Sand Ivory', 'L', 20),
    ('vrd-ethereal-windbreaker', 'Sand Ivory', 'XL', 10),
    -- Aura Finisher Ballcap
    ('vrd-aura-cap', 'Jet Black', 'FREE', 200),
    ('vrd-aura-cap', 'Sand Ivory', 'FREE', 150),
    ('vrd-aura-cap', 'Deep Charcoal', 'FREE', 100)
ON CONFLICT (product_id, color, size) DO UPDATE
SET quantity = EXCLUDED.quantity;

-- Analytics Views
CREATE OR REPLACE VIEW vrd_sales_summary AS
SELECT
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as order_count,
    SUM(total) as total_revenue,
    SUM(discount) as total_discounts,
    AVG(total) as avg_order_value,
    currency
FROM vrd_orders
WHERE status IN ('paid', 'processing', 'shipped', 'delivered')
GROUP BY DATE_TRUNC('day', created_at), currency
ORDER BY date DESC;

CREATE OR REPLACE VIEW vrd_inventory_status AS
SELECT
    product_id,
    color,
    SUM(quantity) as total_quantity,
    SUM(reserved) as total_reserved,
    SUM(quantity) - SUM(reserved) as available,
    MIN(CASE WHEN quantity <= low_stock_threshold THEN true ELSE false END) as is_low_stock
FROM vrd_inventory
GROUP BY product_id, color
ORDER BY product_id, color;

-- Verification
SELECT 'VRD Schema Applied Successfully' as status;
