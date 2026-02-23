-- 상태 값 제약 조건 추가 (ENUM 대신 CHECK 제약 — 마이그레이션 호환성)
ALTER TABLE subscriptions
  ADD CONSTRAINT chk_subscription_status
  CHECK (status IN ('active', 'past_due', 'canceled', 'refunded', 'expired', 'trialing'));

-- billing_events 타입 제약
ALTER TABLE billing_events
  ADD CONSTRAINT chk_billing_event_type
  CHECK (type IN ('payment', 'refund', 'top_up', 'usage', 'subscription_created', 'subscription_canceled'));

-- 음수 잔액 방지
ALTER TABLE profiles
  ADD CONSTRAINT chk_nonnegative_tokens
  CHECK (tokens >= 0);

-- 인덱스 추가 (자주 조회되는 패턴)
CREATE INDEX IF NOT EXISTS idx_billing_events_user_type ON billing_events(user_id, type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_cowork_docs_shared ON cowork_docs(is_shared) WHERE is_shared = true;
