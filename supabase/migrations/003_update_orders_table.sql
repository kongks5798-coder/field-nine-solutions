-- ============================================
-- Field Nine: Orders Table Update (user_id 연결)
-- ============================================
-- 목적: 모든 주문을 user_id와 엄격하게 연결
-- 실행: Supabase Dashboard > SQL Editor > New Query > 붙여넣기 > Run

-- ============================================
-- 1. ORDERS 테이블에 user_id 컬럼 추가 (없는 경우)
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================
-- 2. 기존 주문 데이터에 user_id 설정 (선택사항)
-- ============================================
-- 주의: 이 부분은 기존 데이터가 있을 때만 실행
-- UPDATE public.orders 
-- SET user_id = (SELECT id FROM public.users LIMIT 1)
-- WHERE user_id IS NULL;

-- ============================================
-- 3. user_id를 NOT NULL로 변경 (기존 데이터 처리 후)
-- ============================================
-- ALTER TABLE public.orders 
-- ALTER COLUMN user_id SET NOT NULL;

-- ============================================
-- 4. INDEX 추가
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON public.orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_user_created_at ON public.orders(user_id, created_at DESC);

-- ============================================
-- 5. RLS 정책 업데이트 (user_id 기반)
-- ============================================
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Authenticated users can read orders" ON public.orders;
DROP POLICY IF EXISTS "Employees can manage orders" ON public.orders;

-- 새로운 정책: 사용자는 자신의 주문만 조회 가능
CREATE POLICY "Users can view own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id);

-- 새로운 정책: 사용자는 자신의 주문만 생성 가능
CREATE POLICY "Users can insert own orders"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 새로운 정책: 사용자는 자신의 주문만 수정 가능
CREATE POLICY "Users can update own orders"
    ON public.orders FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 새로운 정책: 사용자는 자신의 주문만 삭제 가능
CREATE POLICY "Users can delete own orders"
    ON public.orders FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 6. STORES와 ORDERS 연결 (store_id 추가)
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'store_id'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
    END IF;
END $$;

-- ============================================
-- 완료!
-- ============================================
