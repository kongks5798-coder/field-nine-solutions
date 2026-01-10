-- ============================================
-- Field Nine: 자동 재고 차감 트리거 (상용화 필수)
-- ============================================
-- 목적: 주문 생성 시 재고 자동 차감 (실제 재고 관리)
-- 실행: Supabase Dashboard > SQL Editor > New Query > 붙여넣기 > Run
--
-- 중요: 이 트리거는 order_items INSERT 시 실제 재고를 차감합니다.
--       reserved_quantity가 아닌 stock_quantity를 차감합니다.
-- ============================================

-- ============================================
-- 1. 재고 자동 차감 함수 (실제 재고 차감)
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_deduct_inventory()
RETURNS TRIGGER AS $$
DECLARE
    v_product_id UUID;
    v_quantity INTEGER;
    v_current_stock INTEGER;
BEGIN
    -- INSERT인 경우 (주문 생성)
    IF TG_OP = 'INSERT' THEN
        v_product_id := NEW.product_id;
        v_quantity := NEW.quantity;
        
        -- product_id가 NULL이면 재고 차감하지 않음 (외부 상품 등)
        IF v_product_id IS NULL THEN
            RETURN NEW;
        END IF;
        
        -- 현재 재고 확인
        SELECT stock_quantity INTO v_current_stock
        FROM public.products
        WHERE id = v_product_id;
        
        -- 재고 부족 체크
        IF v_current_stock IS NULL THEN
            RAISE EXCEPTION 'Product not found: %', v_product_id;
        END IF;
        
        IF v_current_stock < v_quantity THEN
            RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', v_current_stock, v_quantity;
        END IF;
        
        -- 재고 차감 (트랜잭션 안전)
        UPDATE public.products
        SET 
            stock_quantity = stock_quantity - v_quantity,
            updated_at = NOW()
        WHERE id = v_product_id;
        
        RETURN NEW;
    
    -- DELETE인 경우 (주문 취소/삭제)
    ELSIF TG_OP = 'DELETE' THEN
        v_product_id := OLD.product_id;
        v_quantity := OLD.quantity;
        
        -- product_id가 NULL이면 재고 복구하지 않음
        IF v_product_id IS NULL THEN
            RETURN OLD;
        END IF;
        
        -- 재고 복구 (주문 취소 시)
        UPDATE public.products
        SET 
            stock_quantity = stock_quantity + v_quantity,
            updated_at = NOW()
        WHERE id = v_product_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. 트리거 생성 (order_items INSERT/DELETE 시)
-- ============================================
DROP TRIGGER IF EXISTS trigger_auto_deduct_inventory ON public.order_items;
CREATE TRIGGER trigger_auto_deduct_inventory
    AFTER INSERT OR DELETE ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_deduct_inventory();

-- ============================================
-- 3. 주문 상태 변경 시 재고 복구 (주문 취소 시)
-- ============================================
CREATE OR REPLACE FUNCTION public.restore_inventory_on_cancel()
RETURNS TRIGGER AS $$
DECLARE
    v_item RECORD;
BEGIN
    -- 주문이 취소되거나 환불된 경우 재고 복구
    IF OLD.status != NEW.status AND 
       (NEW.status = 'cancelled' OR NEW.status = 'refunded') AND
       (OLD.status != 'cancelled' AND OLD.status != 'refunded') THEN
        
        -- 해당 주문의 모든 상품 재고 복구
        FOR v_item IN 
            SELECT product_id, quantity
            FROM public.order_items
            WHERE order_id = NEW.id AND product_id IS NOT NULL
        LOOP
            UPDATE public.products
            SET 
                stock_quantity = stock_quantity + v_item.quantity,
                updated_at = NOW()
            WHERE id = v_item.product_id;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_restore_inventory_on_cancel ON public.orders;
CREATE TRIGGER trigger_restore_inventory_on_cancel
    AFTER UPDATE OF status ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.restore_inventory_on_cancel();

-- ============================================
-- 완료!
-- ============================================
-- 이제 주문 생성 시 자동으로 재고가 차감됩니다.
-- 주문 취소 시 자동으로 재고가 복구됩니다.
-- ============================================
