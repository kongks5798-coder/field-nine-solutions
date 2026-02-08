-- ============================================
-- Field Nine: Commercial Order Items Table (상용 SaaS 수준)
-- ============================================
-- 목적: 주문 상세 품목 (한 주문에 여러 상품이 포함될 수 있음)
-- 실행: Supabase Dashboard > SQL Editor > New Query > 붙여넣기 > Run

-- ============================================
-- 1. ORDER_ITEMS TABLE (상용 수준)
-- ============================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    
    -- 상품 정보 (상품이 삭제되어도 주문 기록은 유지)
    product_sku TEXT, -- 상품 SKU (스냅샷)
    product_name TEXT NOT NULL, -- 상품명 (스냅샷)
    product_image_url TEXT, -- 상품 이미지 (스냅샷)
    
    -- 수량 및 가격
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(12, 2) NOT NULL, -- 단가 (판매가, 스냅샷)
    unit_cost DECIMAL(12, 2) DEFAULT 0, -- 단가 (원가, 스냅샷)
    subtotal DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED, -- 소계 (수량 × 단가)
    total_cost DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * unit_cost) STORED, -- 총 원가
    
    -- 할인 정보
    discount_amount DECIMAL(10, 2) DEFAULT 0, -- 할인 금액
    discount_rate DECIMAL(5, 2) DEFAULT 0, -- 할인율 (%)
    final_price DECIMAL(12, 2) GENERATED ALWAYS AS (
        (quantity * unit_price) - discount_amount
    ) STORED, -- 최종 금액 (소계 - 할인)
    
    -- 수익 계산
    profit_amount DECIMAL(12, 2) GENERATED ALWAYS AS (
        (quantity * unit_price) - discount_amount - (quantity * unit_cost)
    ) STORED, -- 수익 (최종 금액 - 총 원가)
    profit_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE 
            WHEN (quantity * unit_price) - discount_amount > 0 
            THEN ROUND((profit_amount / ((quantity * unit_price) - discount_amount) * 100)::numeric, 2)
            ELSE 0
        END
    ) STORED, -- 수익률 (%)
    
    -- 옵션 정보 (JSONB)
    -- 예: {"color": "red", "size": "L", "custom_option": "engraving"}
    options JSONB DEFAULT '{}'::jsonb,
    
    -- 외부 플랫폼 정보
    external_item_id TEXT, -- 외부 플랫폼의 주문 상품 ID
    external_variant_id TEXT, -- 외부 플랫폼의 상품 옵션 ID
    
    -- 추가 메타데이터
    metadata JSONB DEFAULT '{}'::jsonb,
    notes TEXT, -- 관리자 메모
    
    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 제약 조건
    CONSTRAINT valid_prices CHECK (unit_price >= 0 AND unit_cost >= 0),
    CONSTRAINT valid_discount CHECK (discount_amount >= 0 AND discount_rate >= 0 AND discount_rate <= 100)
);

-- ============================================
-- 2. INDEXES (성능 최적화)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_sku ON public.order_items(product_sku);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can update own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can delete own order items" ON public.order_items;

-- 사용자는 자신의 주문 상세만 조회 가능 (orders 테이블을 통해)
CREATE POLICY "Users can view own order items"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- 사용자는 자신의 주문 상세만 생성 가능
CREATE POLICY "Users can insert own order items"
    ON public.order_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- 사용자는 자신의 주문 상세만 수정 가능
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

-- 사용자는 자신의 주문 상세만 삭제 가능
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
-- 4. UPDATED_AT TRIGGER
-- ============================================
DROP TRIGGER IF EXISTS update_order_items_updated_at ON public.order_items;
CREATE TRIGGER update_order_items_updated_at
    BEFORE UPDATE ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. ORDER TOTALS UPDATE FUNCTION
-- ============================================
-- 주문 상세 생성/수정/삭제 시 주문 총액 자동 업데이트
CREATE OR REPLACE FUNCTION public.update_order_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_order_id UUID;
    v_product_amount DECIMAL(12, 2);
    v_total_cost DECIMAL(12, 2);
BEGIN
    -- 삭제인 경우 OLD, 그 외는 NEW 사용
    IF TG_OP = 'DELETE' THEN
        v_order_id := OLD.order_id;
    ELSE
        v_order_id := NEW.order_id;
    END IF;
    
    -- 주문의 상품 금액 합계 계산
    SELECT 
        COALESCE(SUM(final_price), 0),
        COALESCE(SUM(total_cost), 0)
    INTO v_product_amount, v_total_cost
    FROM public.order_items
    WHERE order_id = v_order_id;
    
    -- 주문 테이블 업데이트
    UPDATE public.orders
    SET 
        product_amount = v_product_amount,
        total_cost = v_total_cost,
        updated_at = NOW()
    WHERE id = v_order_id;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 주문 상세 변경 시 주문 총액 업데이트 트리거
DROP TRIGGER IF EXISTS trigger_update_order_totals ON public.order_items;
CREATE TRIGGER trigger_update_order_totals
    AFTER INSERT OR UPDATE OR DELETE ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_order_totals();

-- ============================================
-- 완료!
-- ============================================
