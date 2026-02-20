-- FieldNine 빌링 시스템 마이그레이션
-- Stripe + Polar 연동, 사용량 기반 청구, 환불 계산

-- profiles 테이블에 결제 관련 컬럼 추가
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS polar_customer_id  TEXT;

-- 구독 테이블
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan                  TEXT NOT NULL DEFAULT 'starter',
  status                TEXT NOT NULL DEFAULT 'active',
  -- Stripe
  stripe_customer_id    TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id       TEXT,
  -- Polar
  polar_subscription_id TEXT,
  -- 금액 (원화)
  original_price        INTEGER DEFAULT 0,   -- 정가 (KRW)
  discounted_price      INTEGER DEFAULT 0,   -- 결제금액 (KRW)
  -- 기간
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  cancel_at_period_end  BOOLEAN DEFAULT FALSE,
  canceled_at           TIMESTAMPTZ,
  -- 감사
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 사용량 기록 테이블
CREATE TABLE IF NOT EXISTS public.usage_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,       -- 'ai_call' | 'storage_gb'
  quantity    INTEGER DEFAULT 1,
  unit_price  INTEGER DEFAULT 0,   -- KRW per unit
  billed      BOOLEAN DEFAULT FALSE,
  billing_period DATE,             -- YYYY-MM (당월)
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 청구 이벤트 감사 로그
CREATE TABLE IF NOT EXISTS public.billing_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,       -- subscription_created | payment_succeeded | refund_issued | overage_charged | subscription_canceled
  amount      INTEGER DEFAULT 0,   -- KRW
  description TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 초과 청구 테이블 (월별 자동 정산)
CREATE TABLE IF NOT EXISTS public.overage_charges (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  period       TEXT NOT NULL,      -- 'YYYY-MM'
  ai_calls     INTEGER DEFAULT 0,  -- 초과 AI 호출 수
  storage_gb   NUMERIC DEFAULT 0,  -- 초과 스토리지 GB
  ai_amount    INTEGER DEFAULT 0,  -- KRW
  storage_amount INTEGER DEFAULT 0,-- KRW
  total_amount INTEGER DEFAULT 0,  -- KRW
  charged      BOOLEAN DEFAULT FALSE,
  stripe_invoice_id TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.subscriptions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overage_charges ENABLE ROW LEVEL SECURITY;

-- 본인 데이터만 읽기
CREATE POLICY "sub_select_own"     ON public.subscriptions   FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "usage_select_own"   ON public.usage_records   FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "event_select_own"   ON public.billing_events  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "overage_select_own" ON public.overage_charges FOR SELECT USING (auth.uid() = user_id);

-- 서비스 롤 전체 접근 (웹훅 처리용)
CREATE POLICY "sub_service_all"     ON public.subscriptions   FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "usage_service_all"   ON public.usage_records   FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "event_service_all"   ON public.billing_events  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "overage_service_all" ON public.overage_charges FOR ALL USING (auth.role() = 'service_role');

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_subscriptions_user   ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_user_period    ON public.usage_records(user_id, billing_period);
CREATE INDEX IF NOT EXISTS idx_overage_user_period  ON public.overage_charges(user_id, period);
