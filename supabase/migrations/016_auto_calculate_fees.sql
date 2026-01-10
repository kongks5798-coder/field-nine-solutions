-- ============================================
-- Field Nine: 수수료 자동 계산 (상용화 필수)
-- ============================================
-- 목적: 주문 생성 시 플랫폼 수수료, 결제 수수료 자동 계산
-- 실행: Supabase Dashboard > SQL Editor > New Query > 붙여넣기 > Run
-- ============================================

-- ============================================
-- 1. 플랫폼별 수수료율 조회 함수
-- ============================================
CREATE OR REPLACE FUNCTION public.get_platform_fee_rate(platform_name TEXT)
RETURNS DECIMAL(5, 2) AS $$
BEGIN
    -- 플랫폼별 기본 수수료율 (실제 운영 시 stores 테이블에서 가져올 수 있음)
    RETURN CASE platform_name
        WHEN 'naver' THEN 5.0  -- 네이버 스마트스토어: 5%
        WHEN 'coupang' THEN 8.0  -- 쿠팡: 8%
        WHEN '11st' THEN 7.0  -- 11번가: 7%
        WHEN 'gmarket' THEN 6.0  -- 지마켓: 6%
        WHEN 'auction' THEN 6.0  -- 옥션: 6%
        WHEN 'shopify' THEN 2.9  -- 쇼피파이: 2.9%
        WHEN 'woocommerce' THEN 0.0  -- 우커머스: 0% (자체 호스팅)
        ELSE 5.0  -- 기본값: 5%
    END;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. 결제 수수료율 조회 함수
-- ============================================
CREATE OR REPLACE FUNCTION public.get_payment_fee_rate(payment_method_name TEXT)
RETURNS DECIMAL(5, 2) AS $$
BEGIN
    -- 결제 수단별 수수료율
    RETURN CASE payment_method_name
        WHEN 'card' THEN 2.5  -- 카드: 2.5%
        WHEN 'account_transfer' THEN 0.0  -- 계좌이체: 0%
        WHEN 'virtual_account' THEN 0.0  -- 가상계좌: 0%
        WHEN 'mobile' THEN 3.0  -- 모바일: 3%
        ELSE 2.5  -- 기본값: 2.5%
    END;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. 주문 생성 시 수수료 자동 계산
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_calculate_fees()
RETURNS TRIGGER AS $$
DECLARE
    v_platform TEXT;
    v_payment_method TEXT;
    v_platform_fee_rate DECIMAL(5, 2);
    v_payment_fee_rate DECIMAL(5, 2);
    v_platform_fee DECIMAL(10, 2);
    v_payment_fee DECIMAL(10, 2);
BEGIN
    -- 주문 생성 시에만 계산
    IF TG_OP = 'INSERT' THEN
        -- 스토어 정보에서 플랫폼 가져오기
        IF NEW.store_id IS NOT NULL THEN
            SELECT platform INTO v_platform
            FROM public.stores
            WHERE id = NEW.store_id;
        END IF;
        
        -- 플랫폼 수수료 계산
        IF v_platform IS NOT NULL THEN
            v_platform_fee_rate := public.get_platform_fee_rate(v_platform);
            v_platform_fee := NEW.product_amount * (v_platform_fee_rate / 100.0);
        ELSE
            v_platform_fee := 0;
        END IF;
        
        -- 결제 수수료 계산
        IF NEW.payment_method IS NOT NULL THEN
            v_payment_fee_rate := public.get_payment_fee_rate(NEW.payment_method);
            v_payment_fee := NEW.total_amount * (v_payment_fee_rate / 100.0);
        ELSE
            v_payment_fee := 0;
        END IF;
        
        -- 수수료 업데이트
        NEW.platform_fee := v_platform_fee;
        NEW.payment_fee := v_payment_fee;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_calculate_fees ON public.orders;
CREATE TRIGGER trigger_auto_calculate_fees
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_calculate_fees();

-- ============================================
-- 4. 주문 수정 시 수수료 재계산 (product_amount 변경 시)
-- ============================================
CREATE OR REPLACE FUNCTION public.recalculate_fees_on_update()
RETURNS TRIGGER AS $$
DECLARE
    v_platform TEXT;
    v_payment_method TEXT;
    v_platform_fee_rate DECIMAL(5, 2);
    v_payment_fee_rate DECIMAL(5, 2);
BEGIN
    -- product_amount가 변경된 경우에만 재계산
    IF OLD.product_amount != NEW.product_amount THEN
        -- 스토어 정보에서 플랫폼 가져오기
        IF NEW.store_id IS NOT NULL THEN
            SELECT platform INTO v_platform
            FROM public.stores
            WHERE id = NEW.store_id;
        END IF;
        
        -- 플랫폼 수수료 재계산
        IF v_platform IS NOT NULL THEN
            v_platform_fee_rate := public.get_platform_fee_rate(v_platform);
            NEW.platform_fee := NEW.product_amount * (v_platform_fee_rate / 100.0);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_recalculate_fees_on_update ON public.orders;
CREATE TRIGGER trigger_recalculate_fees_on_update
    BEFORE UPDATE OF product_amount ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.recalculate_fees_on_update();

-- ============================================
-- 완료!
-- ============================================
-- 이제 주문 생성 시 플랫폼 수수료와 결제 수수료가 자동으로 계산됩니다.
-- ============================================
