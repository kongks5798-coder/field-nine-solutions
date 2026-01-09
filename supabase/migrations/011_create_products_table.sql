-- ============================================
-- Field Nine: Products Table Migration
-- ============================================
-- 
-- 이 스크립트는 Supabase SQL Editor에서 실행하세요.
-- 
-- 실행 방법:
-- 1. Supabase 대시보드 접속: https://supabase.com/dashboard
-- 2. 프로젝트 선택
-- 3. 왼쪽 메뉴에서 "SQL Editor" 클릭
-- 4. "New query" 버튼 클릭
-- 5. 아래 전체 SQL 코드를 복사하여 붙여넣기
-- 6. "Run" 버튼 클릭 (또는 Ctrl+Enter)
-- 
-- ============================================

-- 1. Products 테이블 생성
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  cost DECIMAL(12, 2) CHECK (cost >= 0),
  category TEXT,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- 2. 인덱스 생성 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock) WHERE stock < 10;

-- 3. updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. updated_at 트리거 생성
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Row Level Security (RLS) 활성화
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 6. RLS 정책 생성
-- 정책 1: 사용자는 자신의 상품만 조회 가능
DROP POLICY IF EXISTS "Users can view their own products" ON public.products;
CREATE POLICY "Users can view their own products"
  ON public.products
  FOR SELECT
  USING (auth.uid() = user_id);

-- 정책 2: 사용자는 자신의 상품만 추가 가능
DROP POLICY IF EXISTS "Users can insert their own products" ON public.products;
CREATE POLICY "Users can insert their own products"
  ON public.products
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 정책 3: 사용자는 자신의 상품만 수정 가능
DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
CREATE POLICY "Users can update their own products"
  ON public.products
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 정책 4: 사용자는 자신의 상품만 삭제 가능
DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;
CREATE POLICY "Users can delete their own products"
  ON public.products
  FOR DELETE
  USING (auth.uid() = user_id);

-- 7. 코멘트 추가 (문서화)
COMMENT ON TABLE public.products IS 'Field Nine: 상품 재고 관리 테이블';
COMMENT ON COLUMN public.products.id IS '고유 식별자 (UUID)';
COMMENT ON COLUMN public.products.name IS '상품명';
COMMENT ON COLUMN public.products.sku IS 'Stock Keeping Unit (상품 코드, 고유값)';
COMMENT ON COLUMN public.products.price IS '판매가 (원)';
COMMENT ON COLUMN public.products.stock IS '재고 수량';
COMMENT ON COLUMN public.products.cost IS '원가 (원)';
COMMENT ON COLUMN public.products.category IS '카테고리';
COMMENT ON COLUMN public.products.image_url IS '상품 이미지 URL';
COMMENT ON COLUMN public.products.user_id IS '소유자 사용자 ID (RLS용)';

-- ============================================
-- 완료 메시지
-- ============================================
-- 
-- ✅ 테이블 생성 완료
-- ✅ 인덱스 생성 완료
-- ✅ RLS 정책 설정 완료
-- 
-- 다음 단계:
-- 1. .env.local 파일에 Supabase 키 추가
-- 2. 앱 재시작 (npm run dev)
-- 3. /dashboard/inventory 페이지에서 테스트
-- 
-- ============================================
