-- ============================================
-- Field Nine Production Database Schema
-- ============================================
-- 실행 방법: Supabase Dashboard > SQL Editor > New Query > 붙여넣기 > Run

-- ============================================
-- 1. EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. PROFILES TABLE (사용자 정보)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. PRODUCTS TABLE (상품 정보)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barcode TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    category TEXT,
    weight_kg DECIMAL(8, 2),
    dimensions_cm TEXT, -- "LxWxH" 형식
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. LOCATIONS TABLE (WMS 계층 구조)
-- ============================================
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_code TEXT NOT NULL, -- 예: "A", "B", "C"
    rack_code TEXT NOT NULL, -- 예: "A-01", "B-02"
    level_code TEXT NOT NULL, -- 예: "1", "2", "3"
    bin_code TEXT NOT NULL, -- 예: "01", "02"
    full_path TEXT GENERATED ALWAYS AS (zone_code || '-' || rack_code || '-' || level_code || '-' || bin_code) STORED,
    capacity INTEGER DEFAULT 100, -- 최대 수용 가능한 상품 개수
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(zone_code, rack_code, level_code, bin_code)
);

-- ============================================
-- 5. INVENTORY TABLE (재고 정보)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reserved_quantity INTEGER DEFAULT 0 CHECK (reserved_quantity >= 0),
    last_counted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, location_id)
);

-- ============================================
-- 6. ORDERS TABLE (외부 주문 통합)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_order_id TEXT UNIQUE NOT NULL, -- 외부 쇼핑몰 주문번호
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    shipping_address TEXT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'picked', 'packed', 'shipped', 'delivered', 'cancelled')),
    source TEXT, -- 'shopify', 'woocommerce', 'manual' 등
    metadata JSONB, -- 외부 시스템의 추가 데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. ORDER_ITEMS TABLE (주문 상세)
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. INDEXES (성능 최적화)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_locations_full_path ON locations(full_path);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory(location_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ============================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- PROFILES Policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- PRODUCTS Policies (모든 인증된 사용자는 읽기/쓰기 가능)
CREATE POLICY "Authenticated users can read products"
    ON products FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert products"
    ON products FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update products"
    ON products FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- LOCATIONS Policies
CREATE POLICY "Authenticated users can read locations"
    ON locations FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Employees can manage locations"
    ON locations FOR ALL
    USING (auth.role() = 'authenticated');

-- INVENTORY Policies
CREATE POLICY "Authenticated users can read inventory"
    ON inventory FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Employees can update inventory"
    ON inventory FOR ALL
    USING (auth.role() = 'authenticated');

-- ORDERS Policies
CREATE POLICY "Authenticated users can read orders"
    ON orders FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Employees can manage orders"
    ON orders FOR ALL
    USING (auth.role() = 'authenticated');

-- ORDER_ITEMS Policies
CREATE POLICY "Authenticated users can read order items"
    ON order_items FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Employees can manage order items"
    ON order_items FOR ALL
    USING (auth.role() = 'authenticated');

-- ============================================
-- 10. FUNCTIONS & TRIGGERS
-- ============================================

-- Updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated_at 트리거 적용
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 11. INITIAL DATA (선택사항)
-- ============================================

-- 샘플 Zone/Rack/Level/Bin 생성
INSERT INTO locations (zone_code, rack_code, level_code, bin_code, capacity) VALUES
    ('A', 'A-01', '1', '01', 100),
    ('A', 'A-01', '1', '02', 100),
    ('A', 'A-01', '2', '01', 100),
    ('A', 'A-01', '2', '02', 100),
    ('B', 'B-01', '1', '01', 100),
    ('B', 'B-01', '1', '02', 100)
ON CONFLICT DO NOTHING;

-- ============================================
-- 완료!
-- ============================================
-- 이제 Supabase Dashboard > Table Editor에서 테이블들이 생성된 것을 확인할 수 있습니다.
