-- ============================================================
-- Migration 093: 사용량 기반 후불 청구 시스템
-- ============================================================

-- ── monthly_usage: 월별 사용량 집계 ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.monthly_usage (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  billing_period TEXT        NOT NULL,   -- 'YYYY-MM'
  ai_calls       INTEGER     NOT NULL DEFAULT 0,
  tokens_used    INTEGER     NOT NULL DEFAULT 0,
  amount_krw     INTEGER     NOT NULL DEFAULT 0,  -- 원화 청구 예정 금액
  status         TEXT        NOT NULL DEFAULT 'open',  -- open | invoiced | paid | failed
  stripe_invoice_id TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, billing_period)
);

ALTER TABLE public.monthly_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "usage_read_own"    ON public.monthly_usage;
DROP POLICY IF EXISTS "usage_service_all" ON public.monthly_usage;
CREATE POLICY "usage_read_own"    ON public.monthly_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "usage_service_all" ON public.monthly_usage FOR ALL   USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS monthly_usage_user_period ON public.monthly_usage(user_id, billing_period DESC);

-- ── spending_caps: 사용자별 월 한도 ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.spending_caps (
  user_id        UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_limit  INTEGER     NOT NULL DEFAULT 50000,   -- 기본 5만원
  warn_threshold INTEGER     NOT NULL DEFAULT 40000,   -- 경고 4만원 (80%)
  hard_limit     INTEGER     NOT NULL DEFAULT 50000,   -- 강제 정지 5만원
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.spending_caps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "caps_own"         ON public.spending_caps;
DROP POLICY IF EXISTS "caps_service_all" ON public.spending_caps;
CREATE POLICY "caps_own"         ON public.spending_caps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "caps_service_all" ON public.spending_caps FOR ALL   USING (auth.role() = 'service_role');

-- ── usage_records: AI 호출 개별 기록 (기존 테이블 컬럼 보강) ────────
ALTER TABLE public.usage_records
  ADD COLUMN IF NOT EXISTS tokens   INTEGER  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS model    TEXT     DEFAULT 'gpt-4o-mini',
  ADD COLUMN IF NOT EXISTS amount   INTEGER  DEFAULT 0;   -- 원화

-- ── 신규 가입 시 spending_cap 자동 생성 트리거 ──────────────────────
CREATE OR REPLACE FUNCTION public.init_spending_cap()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.spending_caps (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_created_cap ON auth.users;
CREATE TRIGGER on_user_created_cap
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.init_spending_cap();
