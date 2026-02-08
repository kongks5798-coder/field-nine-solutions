-- ============================================
-- Field Nine: Commercial Orders Table (상용 SaaS 수준)
-- ============================================
-- 목적: 통합 주문 테이블 (모든 플랫폼의 주문을 통합 관리)
-- 실행: Supabase Dashboard > SQL Editor > New Query > 붙여넣기 > Run

-- ============================================
-- 1. ORDERS TABLE (상용 수준)
-- ============================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    
    -- 주문 식별자
    order_number TEXT NOT NULL, -- 내부 주문번호 (자동 생성)
    market_order_id TEXT NOT NULL, -- 외부 플랫폼 주문번호 (예: 네이버 주문번호)
    market_order_number TEXT, -- 외부 플랫폼 주문번호 (표시용)
    
    -- 주문 상태 (상세)
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',        -- 주문 접수 대기
        'confirmed',      -- 주문 확인됨
        'preparing',      -- 상품 준비 중
        'ready_to_ship',  -- 배송 준비 완료
        'shipping',       -- 배송 중
        'delivered',      -- 배송 완료
        'cancelled',      -- 주문 취소
        'refunded',       -- 환불 완료
        'exchanged'       -- 교환 완료
    )),
    status_updated_at TIMESTAMPTZ, -- 상태 변경 시각
    
    -- 고객 정보
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT NOT NULL,
    customer_id TEXT, -- 외부 플랫폼의 고객 ID
    
    -- 배송 정보
    shipping_name TEXT, -- 수령인 이름 (고객과 다를 수 있음)
    shipping_phone TEXT NOT NULL, -- 수령인 전화번호
    shipping_address TEXT NOT NULL, -- 배송지 주소
    shipping_address_detail TEXT, -- 배송지 상세 주소
    shipping_postcode TEXT, -- 우편번호
    shipping_memo TEXT, -- 배송 메모
    shipping_method TEXT, -- 배송 방법 (일반배송, 택배, 퀵서비스 등)
    shipping_company TEXT, -- 택배사 (CJ대한통운, 한진택배 등)
    tracking_number TEXT, -- 송장번호
    
    -- 금액 정보
    product_amount DECIMAL(12, 2) NOT NULL DEFAULT 0, -- 상품 금액 합계
    shipping_fee DECIMAL(10, 2) DEFAULT 0, -- 배송비
    discount_amount DECIMAL(10, 2) DEFAULT 0, -- 할인 금액
    platform_fee DECIMAL(10, 2) DEFAULT 0, -- 플랫폼 수수료
    payment_fee DECIMAL(10, 2) DEFAULT 0, -- 결제 수수료
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0, -- 최종 결제 금액
    
    -- 수익 계산 (계산된 컬럼)
    total_cost DECIMAL(12, 2) DEFAULT 0, -- 총 원가 (상품 원가 합계)
    net_profit DECIMAL(12, 2) GENERATED ALWAYS AS (
        total_amount - total_cost - platform_fee - payment_fee - shipping_fee
    ) STORED, -- 순이익
    profit_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE 
            WHEN total_amount > 0 
            THEN ROUND((net_profit / total_amount * 100)::numeric, 2)
            ELSE 0
        END
    ) STORED, -- 수익률 (%)
    
    -- 결제 정보
    payment_method TEXT, -- 결제 수단 (카드, 계좌이체, 가상계좌 등)
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    paid_at TIMESTAMPTZ, -- 결제 완료 시각
    payment_id TEXT, -- 결제 시스템의 결제 ID
    
    -- 주문 일시
    ordered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- 주문 일시
    confirmed_at TIMESTAMPTZ, -- 주문 확인 시각
    shipped_at TIMESTAMPTZ, -- 배송 시작 시각
    delivered_at TIMESTAMPTZ, -- 배송 완료 시각
    
    -- 취소/환불 정보
    cancelled_at TIMESTAMPTZ,
    cancelled_reason TEXT, -- 취소 사유
    refunded_at TIMESTAMPTZ,
    refunded_amount DECIMAL(12, 2), -- 환불 금액
    refunded_reason TEXT, -- 환불 사유
    
    -- 플랫폼별 메타데이터
    platform_data JSONB DEFAULT '{}'::jsonb, -- 플랫폼별 추가 데이터
    
    -- 추가 메타데이터
    metadata JSONB DEFAULT '{}'::jsonb,
    notes TEXT, -- 관리자 메모
    
    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 제약 조건
    CONSTRAINT unique_user_market_order_id UNIQUE (user_id, market_order_id),
    CONSTRAINT valid_amounts CHECK (
        total_amount >= 0 AND 
        product_amount >= 0 AND 
        shipping_fee >= 0 AND 
        discount_amount >= 0 AND
        platform_fee >= 0 AND
        payment_fee >= 0
    )
);

-- ============================================
-- 2. INDEXES (성능 최적화)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON public.orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_ordered_at ON public.orders(ordered_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_ordered_at ON public.orders(user_id, ordered_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_market_order_id ON public.orders(market_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can delete own orders" ON public.orders;

-- 사용자는 자신의 주문만 조회 가능
CREATE POLICY "Users can view own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id);

-- 사용자는 자신의 주문만 생성 가능
CREATE POLICY "Users can insert own orders"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 주문만 수정 가능
CREATE POLICY "Users can update own orders"
    ON public.orders FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 주문만 삭제 가능
CREATE POLICY "Users can delete own orders"
    ON public.orders FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 4. UPDATED_AT TRIGGER
-- ============================================
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. ORDER NUMBER GENERATION FUNCTION
-- ============================================
-- 주문번호 자동 생성 함수 (예: ORD-20240101-0001)
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE
    v_date TEXT;
    v_sequence INTEGER;
    v_order_number TEXT;
BEGIN
    v_date := TO_CHAR(NOW(), 'YYYYMMDD');
    
    -- 오늘 날짜의 주문 수 확인
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO v_sequence
    FROM public.orders
    WHERE order_number LIKE 'ORD-' || v_date || '-%';
    
    v_order_number := 'ORD-' || v_date || '-' || LPAD(v_sequence::TEXT, 4, '0');
    
    RETURN v_order_number;
END;
$$ LANGUAGE plpgsql;

-- 주문 생성 시 주문번호 자동 생성 트리거
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := public.generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_order_number ON public.orders;
CREATE TRIGGER trigger_set_order_number
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.set_order_number();

-- ============================================
-- 6. STATUS UPDATE FUNCTION
-- ============================================
-- 주문 상태 변경 시 상태 변경 시각 업데이트
CREATE OR REPLACE FUNCTION public.update_order_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status != NEW.status THEN
        NEW.status_updated_at := NOW();
        
        -- 상태별 시각 업데이트
        CASE NEW.status
            WHEN 'confirmed' THEN NEW.confirmed_at := NOW();
            WHEN 'shipping' THEN NEW.shipped_at := NOW();
            WHEN 'delivered' THEN NEW.delivered_at := NOW();
            WHEN 'cancelled' THEN NEW.cancelled_at := NOW();
            WHEN 'refunded' THEN NEW.refunded_at := NOW();
        END CASE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_order_status_timestamp ON public.orders;
CREATE TRIGGER trigger_update_order_status_timestamp
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_order_status_timestamp();

-- ============================================
-- 완료!
-- ============================================
