-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 56: REFERRAL PRODUCTION SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════════

-- ============================================
-- Referral Codes Table (Enhanced)
-- ============================================

CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  custom_alias VARCHAR(30) UNIQUE,
  total_uses INTEGER DEFAULT 0,
  total_earnings DECIMAL(15, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_active ON referral_codes(is_active, code);

-- ============================================
-- Referral Relations Table
-- ============================================

CREATE TABLE IF NOT EXISTS referral_relations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_used VARCHAR(20) REFERENCES referral_codes(code),
  tier INTEGER DEFAULT 1, -- 1 = direct, 2 = indirect
  status VARCHAR(20) DEFAULT 'pending', -- pending, active, inactive, fraudulent
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,

  -- Prevent duplicate referrals
  CONSTRAINT unique_referral_pair UNIQUE (referrer_id, referee_id),
  -- Prevent self-referral
  CONSTRAINT no_self_referral CHECK (referrer_id != referee_id)
);

CREATE INDEX IF NOT EXISTS idx_referral_relations_referrer ON referral_relations(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_relations_referee ON referral_relations(referee_id);
CREATE INDEX IF NOT EXISTS idx_referral_relations_status ON referral_relations(status);
CREATE INDEX IF NOT EXISTS idx_referral_relations_tier ON referral_relations(tier);

-- ============================================
-- Referral Rewards Table (Enhanced)
-- ============================================

CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL, -- SIGNUP_BONUS, TRADING_COMMISSION, STAKING_BONUS, MILESTONE, LEADERBOARD
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'KAUS',
  from_user_id UUID REFERENCES auth.users(id),
  description TEXT NOT NULL,
  description_ko TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, claimable, claimed, expired, cancelled
  metadata JSONB DEFAULT '{}',
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  CONSTRAINT valid_reward_status CHECK (status IN ('pending', 'claimable', 'claimed', 'expired', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_user ON referral_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON referral_rewards(status);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_type ON referral_rewards(type);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_expires ON referral_rewards(expires_at) WHERE status = 'claimable';

-- ============================================
-- Referral Campaigns Table
-- ============================================

CREATE TABLE IF NOT EXISTS referral_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_ko VARCHAR(100),
  description TEXT,
  description_ko TEXT,
  bonus_multiplier DECIMAL(4, 2) DEFAULT 1.0,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_campaigns_active ON referral_campaigns(is_active, start_date, end_date);

-- ============================================
-- Referral Fraud Log Table
-- ============================================

CREATE TABLE IF NOT EXISTS referral_fraud_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  relation_id UUID REFERENCES referral_relations(id),
  fraud_type VARCHAR(50) NOT NULL, -- SELF_REFERRAL, HIGH_VELOCITY, DUPLICATE_IP, DISPOSABLE_EMAIL
  score INTEGER NOT NULL,
  flags TEXT[] DEFAULT '{}',
  action_taken VARCHAR(30), -- BLOCKED, FLAGGED, REVIEWED, CLEARED
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_log_user ON referral_fraud_log(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_log_type ON referral_fraud_log(fraud_type);
CREATE INDEX IF NOT EXISTS idx_fraud_log_action ON referral_fraud_log(action_taken);

-- ============================================
-- System Health Check Table
-- ============================================

CREATE TABLE IF NOT EXISTS system_health_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL, -- healthy, degraded, down
  latency_ms INTEGER,
  message TEXT,
  metadata JSONB DEFAULT '{}',
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_checks_service ON system_health_checks(service, checked_at DESC);

-- Partition by time for efficient cleanup
-- In production, consider partitioning this table

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_fraud_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_checks ENABLE ROW LEVEL SECURITY;

-- Referral codes: Users see only their own
CREATE POLICY "referral_codes_read_own" ON referral_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "referral_codes_insert_own" ON referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Referral relations: Users see relations they're part of
CREATE POLICY "referral_relations_read_involved" ON referral_relations
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- Referral rewards: Users see only their own
CREATE POLICY "referral_rewards_read_own" ON referral_rewards
  FOR SELECT USING (auth.uid() = user_id);

-- Campaigns: Public read
CREATE POLICY "referral_campaigns_read_all" ON referral_campaigns
  FOR SELECT USING (true);

-- Fraud log: Admin only (handled at API level)
CREATE POLICY "fraud_log_admin_only" ON referral_fraud_log
  FOR ALL USING (false); -- Blocked by default, accessed via service role

-- Health checks: Service role only
CREATE POLICY "health_checks_service_only" ON system_health_checks
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- Functions
-- ============================================

-- Function to get referral leaderboard
CREATE OR REPLACE FUNCTION get_referral_leaderboard(
  start_date TIMESTAMPTZ DEFAULT NULL,
  result_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  total_referrals BIGINT,
  total_earnings DECIMAL,
  monthly_referrals BIGINT,
  monthly_earnings DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rc.user_id,
    p.full_name,
    p.avatar_url,
    COALESCE((
      SELECT COUNT(*) FROM referral_relations rr
      WHERE rr.referrer_id = rc.user_id AND rr.status = 'active'
    ), 0)::BIGINT as total_referrals,
    COALESCE((
      SELECT SUM(amount) FROM referral_rewards rw
      WHERE rw.user_id = rc.user_id AND rw.status = 'claimed'
    ), 0)::DECIMAL as total_earnings,
    COALESCE((
      SELECT COUNT(*) FROM referral_relations rr
      WHERE rr.referrer_id = rc.user_id
        AND rr.status = 'active'
        AND (start_date IS NULL OR rr.created_at >= start_date)
    ), 0)::BIGINT as monthly_referrals,
    COALESCE((
      SELECT SUM(amount) FROM referral_rewards rw
      WHERE rw.user_id = rc.user_id
        AND rw.status = 'claimed'
        AND (start_date IS NULL OR rw.claimed_at >= start_date)
    ), 0)::DECIMAL as monthly_earnings
  FROM referral_codes rc
  LEFT JOIN profiles p ON p.user_id = rc.user_id
  WHERE rc.is_active = true
  ORDER BY total_referrals DESC, total_earnings DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-expire rewards
CREATE OR REPLACE FUNCTION expire_referral_rewards()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE referral_rewards
  SET status = 'expired'
  WHERE status = 'claimable'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update referral stats on new referral
CREATE OR REPLACE FUNCTION update_referral_code_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE referral_codes
    SET total_uses = total_uses + 1,
        updated_at = NOW()
    WHERE code = NEW.code_used;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_referral_stats
AFTER INSERT OR UPDATE OF status ON referral_relations
FOR EACH ROW
EXECUTE FUNCTION update_referral_code_stats();

-- ============================================
-- Scheduled Jobs (for Supabase pg_cron)
-- ============================================

-- Run reward expiration daily at midnight
-- SELECT cron.schedule('expire-rewards', '0 0 * * *', 'SELECT expire_referral_rewards()');

-- ============================================
-- Initial Data
-- ============================================

-- Insert default campaign
INSERT INTO referral_campaigns (name, name_ko, description, description_ko, bonus_multiplier, start_date, end_date, is_active)
VALUES (
  'Welcome Campaign',
  '웰컴 캠페인',
  'Default welcome bonus for new referrals',
  '신규 추천인을 위한 기본 웰컴 보너스',
  1.0,
  '2026-01-01',
  '2026-12-31',
  true
) ON CONFLICT DO NOTHING;

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE referral_codes IS 'User referral codes with usage tracking';
COMMENT ON TABLE referral_relations IS 'Referral relationships between users (direct and indirect)';
COMMENT ON TABLE referral_rewards IS 'Rewards earned through referral program';
COMMENT ON TABLE referral_campaigns IS 'Time-limited referral bonus campaigns';
COMMENT ON TABLE referral_fraud_log IS 'Fraud detection audit log';
COMMENT ON TABLE system_health_checks IS 'Production health monitoring records';

COMMENT ON COLUMN referral_relations.tier IS '1 = direct referral, 2 = indirect (2nd level)';
COMMENT ON COLUMN referral_rewards.status IS 'pending -> claimable -> claimed/expired';
