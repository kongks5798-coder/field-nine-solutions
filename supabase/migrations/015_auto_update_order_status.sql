-- ============================================
-- Field Nine: 주문 상태 자동 전환 (상용화 필수)
-- ============================================
-- 목적: 송장번호 입력 시 자동으로 SHIPPED 상태로 전환
-- 실행: Supabase Dashboard > SQL Editor > New Query > 붙여넣기 > Run
-- ============================================

-- ============================================
-- 1. 송장번호 입력 시 배송 중 상태로 자동 전환
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_update_status_on_tracking()
RETURNS TRIGGER AS $$
BEGIN
    -- 송장번호가 입력되고, 주문 상태가 아직 배송 중이 아닌 경우
    IF NEW.tracking_number IS NOT NULL AND 
       NEW.tracking_number != '' AND
       (OLD.tracking_number IS NULL OR OLD.tracking_number = '') AND
       NEW.status != 'shipping' AND
       NEW.status != 'delivered' AND
       NEW.status != 'cancelled' AND
       NEW.status != 'refunded' THEN
        
        -- 배송 중 상태로 자동 전환
        NEW.status := 'shipping';
        NEW.shipped_at := NOW();
        NEW.status_updated_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_update_status_on_tracking ON public.orders;
CREATE TRIGGER trigger_auto_update_status_on_tracking
    BEFORE UPDATE OF tracking_number ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_update_status_on_tracking();

-- ============================================
-- 2. 주문 확인 시 preparing 상태로 자동 전환
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_update_status_on_confirm()
RETURNS TRIGGER AS $$
BEGIN
    -- 주문이 확인되고, 아직 준비 중이 아닌 경우
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        -- 준비 중 상태로 자동 전환
        NEW.status := 'preparing';
        NEW.status_updated_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_update_status_on_confirm ON public.orders;
CREATE TRIGGER trigger_auto_update_status_on_confirm
    BEFORE UPDATE OF status ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_update_status_on_confirm();

-- ============================================
-- 완료!
-- ============================================
-- 이제 송장번호 입력 시 자동으로 배송 중 상태로 전환됩니다.
-- 주문 확인 시 자동으로 준비 중 상태로 전환됩니다.
-- ============================================
