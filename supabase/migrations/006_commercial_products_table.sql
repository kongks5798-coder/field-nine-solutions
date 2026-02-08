-- ============================================
-- Field Nine: Commercial Products Table (상용 SaaS 수준)
-- ============================================
-- 목적: 상품 마스터 데이터 (SKU, 원가, 판매가, 재고 등)
-- 실행: Supabase Dashboard > SQL Editor > New Query > 붙여넣기 > Run

-- ============================================
-- 1. PRODUCTS TABLE (상용 수준)
-- ============================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- 상품 식별자
    sku TEXT NOT NULL, -- Stock Keeping Unit (유저가 관리하는 상품 코드)
    barcode TEXT, -- 바코드 (EAN-13, UPC 등)
    external_product_id TEXT, -- 외부 플랫폼의 상품 ID
    
    -- 기본 정보
    name TEXT NOT NULL,
    name_en TEXT, -- 영문명
    description TEXT, -- 상품 설명
    description_en TEXT, -- 영문 설명
    
    -- 가격 정보
    cost_price DECIMAL(12, 2) NOT NULL DEFAULT 0, -- 매입가 (원가)
    sale_price DECIMAL(12, 2) NOT NULL DEFAULT 0, -- 판매가
    retail_price DECIMAL(12, 2), -- 소매가 (참고용)
    
    -- 마진 계산 (계산된 컬럼)
    margin_amount DECIMAL(12, 2) GENERATED ALWAYS AS (sale_price - cost_price) STORED,
    margin_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE 
            WHEN sale_price > 0 AND cost_price > 0 
            THEN ROUND(((sale_price - cost_price) / sale_price * 100)::numeric, 2)
            ELSE 0
        END
    ) STORED,
    
    -- 재고 관리
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0), -- 현재 재고 수량
    reserved_quantity INTEGER DEFAULT 0 CHECK (reserved_quantity >= 0), -- 예약된 수량 (주문 대기 중)
    available_quantity INTEGER GENERATED ALWAYS AS (stock_quantity - reserved_quantity) STORED, -- 가용 재고
    min_stock_level INTEGER DEFAULT 0, -- 최소 재고 수준 (알림용)
    max_stock_level INTEGER, -- 최대 재고 수준
    
    -- 배송 정보
    weight_kg DECIMAL(8, 3), -- 무게 (kg)
    dimensions_cm TEXT, -- 크기 (예: "30x20x10")
    shipping_fee DECIMAL(10, 2) DEFAULT 0, -- 기본 배송비
    free_shipping_threshold DECIMAL(10, 2), -- 무료배송 기준 금액
    
    -- 이미지 및 미디어
    image_url TEXT, -- 대표 이미지 URL
    image_urls TEXT[], -- 추가 이미지 URL 배열
    video_url TEXT, -- 상품 영상 URL
    
    -- 카테고리
    category TEXT, -- 대분류
    subcategory TEXT, -- 중분류
    tags TEXT[], -- 태그 배열
    
    -- 판매 상태
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued', 'out_of_stock')),
    is_visible BOOLEAN DEFAULT TRUE, -- 고객에게 노출 여부
    
    -- 옵션 정보 (JSONB)
    -- 예: {"color": ["red", "blue"], "size": ["S", "M", "L"]}
    options JSONB DEFAULT '{}'::jsonb,
    
    -- 플랫폼별 정보 (JSONB)
    -- 예: {"naver": {"product_id": "12345"}, "coupang": {"product_id": "67890"}}
    platform_data JSONB DEFAULT '{}'::jsonb,
    
    -- 추가 메타데이터
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 제약 조건
    CONSTRAINT unique_user_sku UNIQUE (user_id, sku),
    CONSTRAINT valid_prices CHECK (sale_price >= 0 AND cost_price >= 0),
    CONSTRAINT valid_margin CHECK (sale_price >= cost_price OR sale_price = 0)
);

-- ============================================
-- 2. INDEXES (성능 최적화)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_user_sku ON public.products(user_id, sku);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON public.products(stock_quantity) WHERE stock_quantity < min_stock_level; -- 재고 부족 알림용

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view own products" ON public.products;
DROP POLICY IF EXISTS "Users can insert own products" ON public.products;
DROP POLICY IF EXISTS "Users can update own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete own products" ON public.products;

-- 사용자는 자신의 상품만 조회 가능
CREATE POLICY "Users can view own products"
    ON public.products FOR SELECT
    USING (auth.uid() = user_id);

-- 사용자는 자신의 상품만 생성 가능
CREATE POLICY "Users can insert own products"
    ON public.products FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 상품만 수정 가능
CREATE POLICY "Users can update own products"
    ON public.products FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 상품만 삭제 가능
CREATE POLICY "Users can delete own products"
    ON public.products FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 4. UPDATED_AT TRIGGER
-- ============================================
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. STOCK UPDATE FUNCTION
-- ============================================
-- 재고 업데이트 시 예약 수량 자동 계산
CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- 주문 생성 시 예약 수량 증가
    IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'order_items' THEN
        UPDATE public.products
        SET reserved_quantity = reserved_quantity + NEW.quantity
        WHERE id = NEW.product_id;
        RETURN NEW;
    END IF;
    
    -- 주문 취소/삭제 시 예약 수량 감소
    IF TG_OP = 'DELETE' AND TG_TABLE_NAME = 'order_items' THEN
        UPDATE public.products
        SET reserved_quantity = GREATEST(0, reserved_quantity - OLD.quantity)
        WHERE id = OLD.product_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 주문 상세 생성/삭제 시 재고 업데이트 트리거
DROP TRIGGER IF EXISTS trigger_update_stock_on_order_item ON public.order_items;
CREATE TRIGGER trigger_update_stock_on_order_item
    AFTER INSERT OR DELETE ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_product_stock();

-- ============================================
-- 완료!
-- ============================================
