-- ============================================
-- Field Nine: Add total_cost to orders table
-- ============================================
-- 목적: orders 테이블에 total_cost 컬럼 추가 (순이익 계산용)
-- 실행: Supabase Dashboard > SQL Editor > New Query > 붙여넣기 > Run

-- total_cost 컬럼 추가 (주문의 총 원가)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(12, 2) DEFAULT 0;

-- 컬럼 주석 추가
COMMENT ON COLUMN public.orders.total_cost IS '주문의 총 원가 (상품 원가 합계) - 순이익 계산에 사용';

-- 기존 주문의 total_cost를 0으로 설정 (실제 원가는 order_items에서 계산 가능)
UPDATE public.orders 
SET total_cost = 0 
WHERE total_cost IS NULL;

-- NOT NULL 제약 조건 추가
ALTER TABLE public.orders 
ALTER COLUMN total_cost SET NOT NULL;

-- 인덱스 추가 (통계 쿼리 성능 향상)
CREATE INDEX IF NOT EXISTS idx_orders_total_cost ON public.orders(total_cost);
