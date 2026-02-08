-- ============================================
-- Field Nine: Products Table Update (user_id 연결)
-- ============================================
-- 목적: 모든 상품을 user_id와 연결하고 매입가/판매가/마진율 추가
-- 실행: Supabase Dashboard > SQL Editor > New Query > 붙여넣기 > Run

-- ============================================
-- 1. PRODUCTS 테이블에 user_id 컬럼 추가
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================
-- 2. 매입가, 판매가, 마진율 컬럼 추가
-- ============================================
DO $$ 
BEGIN
    -- 매입가 (원가)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'cost_price'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN cost_price DECIMAL(10, 2);
    END IF;
    
    -- 판매가 (기존 price를 판매가로 사용, 별도 컬럼 추가)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'selling_price'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN selling_price DECIMAL(10, 2);
        
        -- 기존 price 값을 selling_price로 복사
        UPDATE public.products 
        SET selling_price = price 
        WHERE selling_price IS NULL;
    END IF;
    
    -- 마진율 (계산된 컬럼)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'margin_rate'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN margin_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
            CASE 
                WHEN selling_price > 0 AND cost_price > 0 
                THEN ROUND(((selling_price - cost_price) / selling_price * 100)::numeric, 2)
                ELSE 0
            END
        ) STORED;
    END IF;
END $$;

-- ============================================
-- 3. INDEX 추가
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_user_barcode ON public.products(user_id, barcode);

-- ============================================
-- 4. RLS 정책 업데이트 (user_id 기반)
-- ============================================
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Authenticated users can read products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;

-- 새로운 정책: 사용자는 자신의 상품만 조회 가능
CREATE POLICY "Users can view own products"
    ON public.products FOR SELECT
    USING (auth.uid() = user_id);

-- 새로운 정책: 사용자는 자신의 상품만 생성 가능
CREATE POLICY "Users can insert own products"
    ON public.products FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 새로운 정책: 사용자는 자신의 상품만 수정 가능
CREATE POLICY "Users can update own products"
    ON public.products FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 새로운 정책: 사용자는 자신의 상품만 삭제 가능
CREATE POLICY "Users can delete own products"
    ON public.products FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 완료!
-- ============================================
