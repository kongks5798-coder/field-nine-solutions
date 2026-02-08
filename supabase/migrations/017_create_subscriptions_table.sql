-- ============================================
-- Field Nine: Subscriptions Table (구독 관리)
-- ============================================
-- 목적: 사용자 구독 플랜 관리 및 결제 정보 저장
-- 실행: Supabase Dashboard > SQL Editor > New Query > 붙여넣기 > Run
-- ============================================

-- 1. Subscriptions 테이블 생성
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL, -- 'free', 'premium', 'team', 'business', 'enterprise'
  plan_name TEXT NOT NULL, -- '무료', '프리미엄', '팀', '사업', '기업'
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired', 'failed')),
  payment_id TEXT, -- Toss Payments paymentKey
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  failed_at TIMESTAMPTZ,
  fail_reason TEXT,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON public.subscriptions(plan_id);

-- 3. RLS 정책 (사용자는 자신의 구독만 조회/수정 가능)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
  ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- 5. users 테이블에 구독 정보 컬럼 추가 (없는 경우)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'subscription_plan'
  ) THEN
    ALTER TABLE public.users ADD COLUMN subscription_plan TEXT;
    ALTER TABLE public.users ADD COLUMN subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'expired'));
  END IF;
END $$;

-- 6. 코멘트 추가
COMMENT ON TABLE public.subscriptions IS 'Field Nine: 사용자 구독 관리 테이블';
COMMENT ON COLUMN public.subscriptions.user_id IS '사용자 ID (auth.users 참조)';
COMMENT ON COLUMN public.subscriptions.plan_id IS '플랜 ID (free, premium, team, business, enterprise)';
COMMENT ON COLUMN public.subscriptions.status IS '구독 상태 (pending, active, cancelled, expired, failed)';
COMMENT ON COLUMN public.subscriptions.payment_id IS 'Toss Payments paymentKey';
