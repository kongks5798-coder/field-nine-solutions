-- ============================================
-- Field Nine: OMS Core Schema (상용 주문관리시스템)
-- ============================================
-- 목적: 온라인 셀러를 위한 완벽한 주문관리시스템 데이터 구조
-- 실행: Supabase Dashboard > SQL Editor > New Query > 붙여넣기 > Run
-- 
-- 이 스키마는 다음 4가지 핵심 테이블을 생성합니다:
-- 1. stores: 연동된 스토어 관리
-- 2. products: 상품 마스터 (순이익 계산 및 재고 관리)
-- 3. orders: 통합 주문 데이터 (모든 마켓의 주문을 하나로 통합)
-- 4. order_items: 주문 상세 품목 (한 주문에 여러 상품 포함)
-- ============================================

-- ============================================
-- 1. STORES TABLE (연동된 스토어 관리)
-- ============================================
-- 용도: 유저가 여러 마켓(네이버, 쿠팡, 11번가 등)을 연동할 때 사용
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 스토어 기본 정보
    platform TEXT NOT NULL CHECK (platform IN ('naver', 'coupang', '11st', 'gmarket', 'auction', 'shopify', 'woocommerce', 'custom')),
    -- platform: 마켓플레이스 플랫폼 (네이버, 쿠팡, 11번가 등)
    
    store_name TEXT NOT NULL,
    -- store_name: 스토어 이름 (예: "내 네이버 스토어")
    
    -- API 인증 정보 (실제 운영 시 암호화 저장 권장)
    api_key TEXT,
    -- api_key: 마켓플레이스 API 키 (외부 시스템과 연동 시 사용)
    
    refresh_token TEXT,
    -- refresh_token: OAuth 리프레시 토큰 (토큰 갱신 시 사용)
    
    -- 스토어 상태
    is_active BOOLEAN DEFAULT TRUE,
    -- is_active: 스토어 활성화 여부 (false면 동기화 제외)
    
    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 제약 조건
    CONSTRAINT unique_user_store_name UNIQUE (user_id, store_name)
);

-- stores 테이블 주석
COMMENT ON TABLE public.stores IS '연동된 스토어 관리 테이블 - 유저가 여러 마켓을 연동할 때 사용';
COMMENT ON COLUMN public.stores.platform IS '마켓플레이스 플랫폼 (naver, coupang, 11st 등)';
COMMENT ON COLUMN public.stores.store_name IS '스토어 이름';
COMMENT ON COLUMN public.stores.api_key IS '마켓플레이스 API 키 (암호화 저장 권장)';
COMMENT ON COLUMN public.stores.refresh_token IS 'OAuth 리프레시 토큰';
COMMENT ON COLUMN public.stores.is_active IS '스토어 활성화 여부';

-- ============================================
-- 2. PRODUCTS TABLE (상품 마스터)
-- ============================================
-- 용도: 순이익 계산 및 재고 관리의 기준 데이터
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 상품 기본 정보
    name TEXT NOT NULL,
    -- name: 상품명
    
    sku TEXT NOT NULL,
    -- sku: 재고관리코드 (Stock Keeping Unit) - 유저가 관리하는 상품 코드
    
    -- 가격 정보
    cost_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    -- cost_price: 매입원가 (상품을 구매한 가격)
    
    sale_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    -- sale_price: 판매가 (고객에게 판매하는 가격)
    
    margin_rate DECIMAL(5, 2) DEFAULT 0,
    -- margin_rate: 마진율 (%) - (판매가 - 원가) / 판매가 * 100
    -- 이 값은 Trigger를 통해 자동으로 계산됨
    
    -- 재고 관리
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    -- stock_quantity: 현재 재고 수량
    
    -- 상품 이미지
    thumbnail_url TEXT,
    -- thumbnail_url: 상품 썸네일 이미지 URL
    
    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 제약 조건
    CONSTRAINT unique_user_sku UNIQUE (user_id, sku),
    CONSTRAINT valid_prices CHECK (sale_price >= 0 AND cost_price >= 0),
    CONSTRAINT valid_margin CHECK (margin_rate >= -100 AND margin_rate <= 100)
);

-- products 테이블 주석
COMMENT ON TABLE public.products IS '상품 마스터 테이블 - 순이익 계산 및 재고 관리의 기준 데이터';
COMMENT ON COLUMN public.products.name IS '상품명';
COMMENT ON COLUMN public.products.sku IS '재고관리코드 (Stock Keeping Unit)';
COMMENT ON COLUMN public.products.cost_price IS '매입원가 (상품을 구매한 가격)';
COMMENT ON COLUMN public.products.sale_price IS '판매가 (고객에게 판매하는 가격)';
COMMENT ON COLUMN public.products.margin_rate IS '마진율 (%) - (판매가 - 원가) / 판매가 * 100 (자동 계산)';
COMMENT ON COLUMN public.products.stock_quantity IS '현재 재고 수량';
COMMENT ON COLUMN public.products.thumbnail_url IS '상품 썸네일 이미지 URL';

-- ============================================
-- 3. ORDERS TABLE (통합 주문 데이터)
-- ============================================
-- 용도: 모든 마켓의 주문을 하나로 모으는 메인 테이블
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    -- store_id: 어느 스토어에서 온 주문인지 (stores 테이블 참조)
    
    -- 주문 식별자
    market_order_id TEXT NOT NULL,
    -- market_order_id: 마켓측 주문번호 (예: 네이버 주문번호, 쿠팡 주문번호)
    
    -- 주문 일시
    order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- order_date: 주문 일시
    
    -- 고객 정보
    customer_name TEXT NOT NULL,
    -- customer_name: 고객 이름
    
    -- 금액 정보
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    -- total_amount: 주문 총액 (최종 결제 금액)
    
    -- 주문 상태
    status TEXT NOT NULL DEFAULT 'PAID' CHECK (status IN ('PAID', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
    -- status: 주문 상태
    --   - PAID: 결제 완료 (주문 접수)
    --   - PREPARING: 상품 준비 중
    --   - SHIPPED: 배송 중
    --   - DELIVERED: 배송 완료
    --   - CANCELLED: 주문 취소
    
    -- 배송 정보
    tracking_number TEXT,
    -- tracking_number: 송장번호 (택배사 송장 번호)
    
    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 제약 조건
    CONSTRAINT unique_user_market_order_id UNIQUE (user_id, market_order_id),
    CONSTRAINT valid_total_amount CHECK (total_amount >= 0)
);

-- orders 테이블 주석
COMMENT ON TABLE public.orders IS '통합 주문 데이터 테이블 - 모든 마켓의 주문을 하나로 모음';
COMMENT ON COLUMN public.orders.store_id IS '어느 스토어에서 온 주문인지 (stores 테이블 참조)';
COMMENT ON COLUMN public.orders.market_order_id IS '마켓측 주문번호 (예: 네이버 주문번호, 쿠팡 주문번호)';
COMMENT ON COLUMN public.orders.order_date IS '주문 일시';
COMMENT ON COLUMN public.orders.customer_name IS '고객 이름';
COMMENT ON COLUMN public.orders.total_amount IS '주문 총액 (최종 결제 금액)';
COMMENT ON COLUMN public.orders.status IS '주문 상태 (PAID: 결제완료, PREPARING: 준비중, SHIPPED: 배송중, DELIVERED: 배송완료, CANCELLED: 취소)';
COMMENT ON COLUMN public.orders.tracking_number IS '송장번호 (택배사 송장 번호)';

-- ============================================
-- 4. ORDER_ITEMS TABLE (주문 상세 품목)
-- ============================================
-- 용도: 한 주문에 여러 상품이 있을 경우를 대비
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    -- order_id: 어느 주문에 속하는지 (orders 테이블 참조)
    
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    -- product_id: 어느 상품인지 (products 테이블 참조, 옵션 - 상품이 삭제되어도 주문 기록은 유지)
    
    -- 상품 정보 (스냅샷 - 상품이 변경되어도 주문 당시 정보 유지)
    product_name TEXT NOT NULL,
    -- product_name: 주문 당시 상품명 (스냅샷)
    
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    -- quantity: 주문 수량
    
    unit_price DECIMAL(12, 2) NOT NULL,
    -- unit_price: 주문 당시 단가 (스냅샷)
    
    option_name TEXT,
    -- option_name: 옵션명 (예: "색상: 빨강, 사이즈: L")
    
    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 제약 조건
    CONSTRAINT valid_unit_price CHECK (unit_price >= 0)
);

-- order_items 테이블 주석
COMMENT ON TABLE public.order_items IS '주문 상세 품목 테이블 - 한 주문에 여러 상품이 있을 경우를 대비';
COMMENT ON COLUMN public.order_items.order_id IS '어느 주문에 속하는지 (orders 테이블 참조)';
COMMENT ON COLUMN public.order_items.product_id IS '어느 상품인지 (products 테이블 참조, 옵션)';
COMMENT ON COLUMN public.order_items.product_name IS '주문 당시 상품명 (스냅샷)';
COMMENT ON COLUMN public.order_items.quantity IS '주문 수량';
COMMENT ON COLUMN public.order_items.unit_price IS '주문 당시 단가 (스냅샷)';
COMMENT ON COLUMN public.order_items.option_name IS '옵션명 (예: "색상: 빨강, 사이즈: L")';

-- ============================================
-- 5. INDEXES (성능 최적화)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON public.stores(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_platform ON public.stores(platform);
CREATE INDEX IF NOT EXISTS idx_stores_is_active ON public.stores(is_active);

CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_user_sku ON public.products(user_id, sku);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON public.orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_market_order_id ON public.orders(user_id, market_order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- ============================================
-- 6. TRIGGER: margin_rate 자동 계산
-- ============================================
-- products 테이블에서 cost_price나 sale_price가 변경되면
-- margin_rate를 자동으로 계산하여 업데이트

-- Trigger 함수 생성
CREATE OR REPLACE FUNCTION public.calculate_margin_rate()
RETURNS TRIGGER AS $$
BEGIN
    -- margin_rate 계산: (판매가 - 원가) / 판매가 * 100
    -- 판매가가 0이면 마진율을 0으로 설정
    IF NEW.sale_price > 0 THEN
        NEW.margin_rate := ROUND(((NEW.sale_price - NEW.cost_price) / NEW.sale_price * 100)::numeric, 2);
    ELSE
        NEW.margin_rate := 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger 생성 (INSERT 및 UPDATE 시 실행)
DROP TRIGGER IF EXISTS trigger_calculate_margin_rate ON public.products;
CREATE TRIGGER trigger_calculate_margin_rate
    BEFORE INSERT OR UPDATE OF cost_price, sale_price ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_margin_rate();

-- Trigger 함수 주석
COMMENT ON FUNCTION public.calculate_margin_rate() IS 'products 테이블의 cost_price나 sale_price가 변경되면 margin_rate를 자동으로 계산하여 업데이트';

-- ============================================
-- 7. TRIGGER: updated_at 자동 업데이트
-- ============================================
-- 모든 테이블의 updated_at 컬럼을 자동으로 업데이트

-- 기존 함수가 있으면 재사용, 없으면 생성
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 Trigger 적용
DROP TRIGGER IF EXISTS update_stores_updated_at ON public.stores;
CREATE TRIGGER update_stores_updated_at
    BEFORE UPDATE ON public.stores
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- 모든 테이블에 RLS 활성화 및 정책 적용
-- 사용자는 본인의 데이터만 조회/수정/삭제 가능

-- STORES 테이블 RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own stores" ON public.stores;
CREATE POLICY "Users can view own stores"
    ON public.stores FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own stores" ON public.stores;
CREATE POLICY "Users can insert own stores"
    ON public.stores FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own stores" ON public.stores;
CREATE POLICY "Users can update own stores"
    ON public.stores FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own stores" ON public.stores;
CREATE POLICY "Users can delete own stores"
    ON public.stores FOR DELETE
    USING (auth.uid() = user_id);

-- PRODUCTS 테이블 RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own products" ON public.products;
CREATE POLICY "Users can view own products"
    ON public.products FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own products" ON public.products;
CREATE POLICY "Users can insert own products"
    ON public.products FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own products" ON public.products;
CREATE POLICY "Users can update own products"
    ON public.products FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own products" ON public.products;
CREATE POLICY "Users can delete own products"
    ON public.products FOR DELETE
    USING (auth.uid() = user_id);

-- ORDERS 테이블 RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
CREATE POLICY "Users can insert own orders"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
CREATE POLICY "Users can update own orders"
    ON public.orders FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own orders" ON public.orders;
CREATE POLICY "Users can delete own orders"
    ON public.orders FOR DELETE
    USING (auth.uid() = user_id);

-- ORDER_ITEMS 테이블 RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;
CREATE POLICY "Users can insert own order items"
    ON public.order_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own order items" ON public.order_items;
CREATE POLICY "Users can update own order items"
    ON public.order_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own order items" ON public.order_items;
CREATE POLICY "Users can delete own order items"
    ON public.order_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- ============================================
-- 완료!
-- ============================================
-- 이제 Supabase Dashboard > Table Editor에서 다음 테이블들이 생성된 것을 확인할 수 있습니다:
-- 1. stores: 연동된 스토어 관리
-- 2. products: 상품 마스터 (margin_rate 자동 계산)
-- 3. orders: 통합 주문 데이터
-- 4. order_items: 주문 상세 품목
--
-- 모든 테이블은 RLS 정책이 적용되어 사용자는 본인의 데이터만 조회/수정/삭제할 수 있습니다.
-- products 테이블의 cost_price나 sale_price가 변경되면 margin_rate가 자동으로 계산됩니다.
