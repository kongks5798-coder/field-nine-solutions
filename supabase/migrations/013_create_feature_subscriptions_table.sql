-- ============================================
-- Field Nine: Feature Subscriptions Table (기능 구독 관리)
-- ============================================
-- 목적: 100가지 기능 중 활성화된 기능 관리 및 월 구독료 관리
-- 실행: Supabase Dashboard > SQL Editor > New Query > 붙여넣기 > Run
-- 
-- ============================================

-- 1. Feature Subscriptions 테이블 생성
CREATE TABLE IF NOT EXISTS public.feature_subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  feature_id TEXT NOT NULL UNIQUE, -- 100가지 기능 중 ID (예: "ai-demand-forecast")
  feature_name TEXT NOT NULL, -- 기능명 (예: "AI 수요예측")
  is_active BOOLEAN NOT NULL DEFAULT false, -- 활성화 여부
  monthly_fee INTEGER NOT NULL DEFAULT 0 CHECK (monthly_fee >= 0), -- 월 구독료 (원)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. 인덱스 생성 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_feature_subscriptions_feature_id ON public.feature_subscriptions(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_subscriptions_is_active ON public.feature_subscriptions(is_active);

-- 3. updated_at 자동 업데이트 트리거
DROP TRIGGER IF EXISTS update_feature_subscriptions_updated_at ON public.feature_subscriptions;
CREATE TRIGGER update_feature_subscriptions_updated_at
  BEFORE UPDATE ON public.feature_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. 코멘트 추가 (문서화)
COMMENT ON TABLE public.feature_subscriptions IS 'Field Nine: 기능 구독 관리 테이블';
COMMENT ON COLUMN public.feature_subscriptions.id IS '고유 식별자 (Prisma cuid)';
COMMENT ON COLUMN public.feature_subscriptions.feature_id IS '기능 ID (예: "ai-demand-forecast")';
COMMENT ON COLUMN public.feature_subscriptions.feature_name IS '기능명 (예: "AI 수요예측")';
COMMENT ON COLUMN public.feature_subscriptions.is_active IS '활성화 여부';
COMMENT ON COLUMN public.feature_subscriptions.monthly_fee IS '월 구독료 (원)';

-- 5. 샘플 데이터 삽입 (선택사항)
-- 100가지 기능 중 일부 예시
INSERT INTO public.feature_subscriptions (feature_id, feature_name, is_active, monthly_fee)
VALUES
  ('ai-demand-forecast', 'AI 수요예측', false, 50000),
  ('auto-reorder', '자동 재주문', false, 30000),
  ('multi-channel-sync', '다채널 동기화', false, 40000),
  ('inventory-optimization', '재고 최적화', false, 60000),
  ('sales-analytics', '판매 분석', false, 35000)
ON CONFLICT (feature_id) DO NOTHING;

-- ============================================
-- 완료 메시지
-- ============================================
-- 
-- ✅ 테이블 생성 완료
-- ✅ 인덱스 생성 완료
-- ✅ 트리거 설정 완료
-- ✅ 샘플 데이터 삽입 완료
-- 
-- 다음 단계:
-- 1. Prisma migrate 실행
-- 2. Prisma Client 생성
-- 3. 기능 구독 관리 UI 구현
-- 
-- ============================================
