-- TrendStream 구독 시스템 스키마
-- Supabase SQL Editor에서 실행

-- 구독 플랜 테이블
CREATE TABLE IF NOT EXISTS subscription_plans (
    id TEXT PRIMARY KEY, -- 'free', 'pro', 'business'
    name TEXT NOT NULL,
    price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
    price_yearly DECIMAL(10, 2) NOT NULL DEFAULT 0,
    max_analyses_per_month INTEGER NOT NULL DEFAULT 10,
    features TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기본 플랜 데이터 삽입
INSERT INTO subscription_plans (id, name, price_monthly, price_yearly, max_analyses_per_month, features)
VALUES
    ('free', 'Free', 0, 0, 10, ARRAY['기본 분석', '최근 10개 히스토리']),
    ('pro', 'Pro', 29, 290, 100, ARRAY['무제한 분석', '전체 히스토리', '우선 지원']),
    ('business', 'Business', 99, 990, 1000, ARRAY['무제한 분석', 'API 접근', '전담 지원', '커스텀 리포트'])
ON CONFLICT (id) DO NOTHING;

-- 사용자 구독 테이블
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    payment_provider TEXT, -- 'stripe', 'toss'
    payment_id TEXT, -- 외부 결제 시스템 ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용량 추적 테이블
CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL, -- 월별 사용량 추적
    analyses_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, period_start)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_period ON usage_tracking(user_id, period_start);

-- RLS 활성화
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- 정책: 모든 사용자가 플랜 조회 가능
CREATE POLICY "Anyone can view subscription plans"
    ON subscription_plans
    FOR SELECT
    USING (true);

-- 정책: 사용자는 자신의 구독만 조회/수정 가능
CREATE POLICY "Users can view their own subscriptions"
    ON user_subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
    ON user_subscriptions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
    ON user_subscriptions
    FOR UPDATE
    USING (auth.uid() = user_id);

-- 정책: 사용자는 자신의 사용량만 조회/수정 가능
CREATE POLICY "Users can view their own usage"
    ON usage_tracking
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
    ON usage_tracking
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage"
    ON usage_tracking
    FOR UPDATE
    USING (auth.uid() = user_id);

-- 업데이트 시간 자동 갱신 트리거
CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at
    BEFORE UPDATE ON usage_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
