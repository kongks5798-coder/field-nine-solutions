-- ============================================
-- Field Nine: Mall Inventory Table (쇼핑몰별 재고 분배)
-- ============================================
-- 목적: 쿠팡, 네이버, 자사몰 등 각 쇼핑몰에 할당된 재고를 분배 관리
-- 실행: Supabase Dashboard > SQL Editor > New Query > 붙여넣기 > Run
-- 
-- ============================================

-- 1. Mall Inventory 테이블 생성
CREATE TABLE IF NOT EXISTS public.mall_inventory (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  mall_name TEXT NOT NULL, -- 쇼핑몰 이름 (쿠팡, 네이버, 자사몰 등)
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0), -- 해당 몰에 할당된 재고 수량
  product_id TEXT NOT NULL, -- Product 테이블과 연결 (Prisma cuid 형식)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- 제약 조건: 같은 상품에 같은 쇼핑몰은 하나만 존재
  CONSTRAINT unique_product_mall UNIQUE (product_id, mall_name)
);

-- 2. 인덱스 생성 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_mall_inventory_product_id ON public.mall_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_mall_inventory_mall_name ON public.mall_inventory(mall_name);

-- 3. updated_at 자동 업데이트 트리거
DROP TRIGGER IF EXISTS update_mall_inventory_updated_at ON public.mall_inventory;
CREATE TRIGGER update_mall_inventory_updated_at
  BEFORE UPDATE ON public.mall_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. 코멘트 추가 (문서화)
COMMENT ON TABLE public.mall_inventory IS 'Field Nine: 쇼핑몰별 재고 분배 테이블';
COMMENT ON COLUMN public.mall_inventory.id IS '고유 식별자 (Prisma cuid)';
COMMENT ON COLUMN public.mall_inventory.mall_name IS '쇼핑몰 이름 (쿠팡, 네이버, 자사몰 등)';
COMMENT ON COLUMN public.mall_inventory.stock IS '해당 몰에 할당된 재고 수량';
COMMENT ON COLUMN public.mall_inventory.product_id IS '상품 ID (Product 테이블 참조)';

-- ============================================
-- 완료 메시지
-- ============================================
-- 
-- ✅ 테이블 생성 완료
-- ✅ 인덱스 생성 완료
-- ✅ 트리거 설정 완료
-- 
-- 다음 단계:
-- 1. Prisma migrate 실행
-- 2. Prisma Client 생성
-- 3. 쇼핑몰별 재고 분배 기능 구현
-- 
-- ============================================
