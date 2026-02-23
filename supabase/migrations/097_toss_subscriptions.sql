-- 096: TossPayments 구독 추적 칼럼 추가
-- subscriptions 테이블에 Toss 결제 키 저장 (환불·취소 및 구독 추적용)

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS toss_payment_key TEXT,
  ADD COLUMN IF NOT EXISTS toss_order_id    TEXT;

-- toss_order_id 유니크 인덱스 (upsert onConflict 사용)
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_toss_order_id
  ON public.subscriptions(toss_order_id)
  WHERE toss_order_id IS NOT NULL;

-- 조회 성능용 인덱스
CREATE INDEX IF NOT EXISTS idx_subscriptions_toss_payment_key
  ON public.subscriptions(toss_payment_key)
  WHERE toss_payment_key IS NOT NULL;

-- profiles 테이블에 plan_updated_at 칼럼 추가 (없을 경우)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_updated_at TIMESTAMPTZ;
