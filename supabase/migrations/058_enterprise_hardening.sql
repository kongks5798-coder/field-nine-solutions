-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 58: ENTERPRISE HARDENING SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════════

-- ============================================
-- Virtual Cards Table
-- ============================================

CREATE TABLE IF NOT EXISTS virtual_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  card_number_masked VARCHAR(19) NOT NULL, -- **** **** **** 1234
  card_number_hash TEXT NOT NULL, -- Encrypted full number
  cvv_hash TEXT NOT NULL, -- Encrypted CVV
  expiry_month VARCHAR(2) NOT NULL,
  expiry_year VARCHAR(2) NOT NULL,
  cardholder_name VARCHAR(100) NOT NULL,
  balance DECIMAL(15, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'KRW',
  status VARCHAR(20) DEFAULT 'active', -- active, frozen, expired, cancelled
  daily_limit DECIMAL(15, 2) DEFAULT 5000000, -- 500만원
  monthly_limit DECIMAL(15, 2) DEFAULT 50000000, -- 5000만원
  daily_spent DECIMAL(15, 2) DEFAULT 0,
  monthly_spent DECIMAL(15, 2) DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_virtual_cards_user ON virtual_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_virtual_cards_wallet ON virtual_cards(wallet_id);
CREATE INDEX IF NOT EXISTS idx_virtual_cards_status ON virtual_cards(status);
CREATE INDEX IF NOT EXISTS idx_virtual_cards_expires ON virtual_cards(expires_at) WHERE status = 'active';

-- ============================================
-- Virtual Card Transactions Table
-- ============================================

CREATE TABLE IF NOT EXISTS virtual_card_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES virtual_cards(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL, -- purchase, refund, topup, withdrawal
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'KRW',
  merchant_name VARCHAR(100),
  merchant_id VARCHAR(50),
  merchant_category VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, reversed
  authorization_code VARCHAR(50),
  reference_id VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_card_tx_card ON virtual_card_transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_card_tx_status ON virtual_card_transactions(status);
CREATE INDEX IF NOT EXISTS idx_card_tx_created ON virtual_card_transactions(created_at DESC);

-- ============================================
-- Real Audit Logs Table
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id VARCHAR(50) NOT NULL UNIQUE, -- AUD-{timestamp}-{random}
  event_type VARCHAR(50) NOT NULL, -- AUTH, ACCESS, DATA_CHANGE, PAYMENT, COMPLIANCE, SECURITY
  event_subtype VARCHAR(50), -- LOGIN, LOGOUT, VIEW, CREATE, UPDATE, DELETE, etc.
  severity VARCHAR(20) DEFAULT 'INFO', -- DEBUG, INFO, WARNING, ERROR, CRITICAL
  actor_id UUID REFERENCES auth.users(id),
  actor_type VARCHAR(20) DEFAULT 'user', -- user, system, admin, api
  actor_ip VARCHAR(45), -- IPv4 or IPv6
  actor_user_agent TEXT,
  resource_type VARCHAR(50), -- user, wallet, payment, card, referral, etc.
  resource_id VARCHAR(100),
  action VARCHAR(100) NOT NULL, -- Detailed action description
  status VARCHAR(20) DEFAULT 'success', -- success, failure, pending
  details JSONB DEFAULT '{}', -- Additional context
  before_state JSONB, -- State before change
  after_state JSONB, -- State after change
  risk_score INTEGER DEFAULT 0, -- 0-100, higher = more risky
  compliance_tags TEXT[] DEFAULT '{}', -- GDPR, PCI-DSS, ISO27001, etc.
  session_id VARCHAR(100),
  request_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Cryptographic integrity
  hash_chain VARCHAR(64), -- SHA-256 of previous record for tamper detection
  signature VARCHAR(256) -- Digital signature for non-repudiation
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity) WHERE severity IN ('ERROR', 'CRITICAL');
CREATE INDEX IF NOT EXISTS idx_audit_logs_risk ON audit_logs(risk_score DESC) WHERE risk_score > 50;

-- ============================================
-- Analytics Aggregations Table
-- ============================================

CREATE TABLE IF NOT EXISTS analytics_daily (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,

  -- User metrics
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  returning_users INTEGER DEFAULT 0,
  churned_users INTEGER DEFAULT 0,

  -- Revenue metrics
  total_revenue DECIMAL(15, 2) DEFAULT 0,
  payment_count INTEGER DEFAULT 0,
  average_order_value DECIMAL(15, 2) DEFAULT 0,
  refund_amount DECIMAL(15, 2) DEFAULT 0,

  -- Referral metrics
  new_referrals INTEGER DEFAULT 0,
  referral_conversions INTEGER DEFAULT 0,
  referral_rewards_paid DECIMAL(15, 2) DEFAULT 0,

  -- VIBE-ID metrics
  vibe_analyses INTEGER DEFAULT 0,
  viral_cards_generated INTEGER DEFAULT 0,
  viral_shares INTEGER DEFAULT 0,

  -- Engagement metrics
  page_views INTEGER DEFAULT 0,
  unique_sessions INTEGER DEFAULT 0,
  average_session_duration INTEGER DEFAULT 0, -- seconds
  bounce_rate DECIMAL(5, 2) DEFAULT 0, -- percentage

  -- System metrics
  api_requests INTEGER DEFAULT 0,
  api_errors INTEGER DEFAULT 0,
  average_latency_ms INTEGER DEFAULT 0,

  -- Breakdown by source
  revenue_by_source JSONB DEFAULT '{}', -- {stripe: 1000, toss: 2000, etc.}
  users_by_country JSONB DEFAULT '{}', -- {KR: 100, US: 50, etc.}

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON analytics_daily(date DESC);

-- ============================================
-- Notification Queue Table
-- ============================================

CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  channel VARCHAR(20) NOT NULL, -- email, sms, push, kakao, slack
  template_id VARCHAR(50) NOT NULL,
  recipient VARCHAR(200) NOT NULL, -- email address, phone number, etc.
  subject VARCHAR(200),
  content TEXT NOT NULL,
  content_ko TEXT,
  priority VARCHAR(10) DEFAULT 'normal', -- low, normal, high, urgent
  status VARCHAR(20) DEFAULT 'pending', -- pending, sending, sent, failed, cancelled
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notification_queue_user ON notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_channel ON notification_queue(channel);

-- ============================================
-- Performance Metrics Table
-- ============================================

CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name VARCHAR(100) NOT NULL,
  metric_type VARCHAR(20) NOT NULL, -- counter, gauge, histogram
  value DECIMAL(15, 4) NOT NULL,
  tags JSONB DEFAULT '{}', -- {endpoint: '/api/xxx', method: 'POST', etc.}
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partition by time for efficient storage (optional)
CREATE INDEX IF NOT EXISTS idx_perf_metrics_name ON performance_metrics(metric_name, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_perf_metrics_time ON performance_metrics(recorded_at DESC);

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE virtual_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Virtual Cards: Users see only their own
CREATE POLICY "virtual_cards_read_own" ON virtual_cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "virtual_cards_insert_own" ON virtual_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "virtual_cards_update_own" ON virtual_cards
  FOR UPDATE USING (auth.uid() = user_id);

-- Virtual Card Transactions: Users see only their own cards' transactions
CREATE POLICY "card_tx_read_own" ON virtual_card_transactions
  FOR SELECT USING (
    card_id IN (SELECT id FROM virtual_cards WHERE user_id = auth.uid())
  );

-- Audit Logs: Service role only (security sensitive)
CREATE POLICY "audit_logs_service_only" ON audit_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Analytics: Admin only
CREATE POLICY "analytics_admin_only" ON analytics_daily
  FOR SELECT USING (auth.role() = 'service_role');

-- Notification Queue: Users see only their own
CREATE POLICY "notifications_read_own" ON notification_queue
  FOR SELECT USING (auth.uid() = user_id);

-- Performance Metrics: Service role only
CREATE POLICY "perf_metrics_service_only" ON performance_metrics
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- Functions
-- ============================================

-- Function to generate audit event ID
CREATE OR REPLACE FUNCTION generate_audit_event_id()
RETURNS VARCHAR AS $$
BEGIN
  RETURN 'AUD-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || '-' ||
         SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8);
END;
$$ LANGUAGE plpgsql;

-- Function to log audit event
CREATE OR REPLACE FUNCTION log_audit_event(
  p_event_type VARCHAR,
  p_event_subtype VARCHAR,
  p_actor_id UUID,
  p_resource_type VARCHAR,
  p_resource_id VARCHAR,
  p_action VARCHAR,
  p_status VARCHAR DEFAULT 'success',
  p_details JSONB DEFAULT '{}',
  p_severity VARCHAR DEFAULT 'INFO',
  p_risk_score INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_event_id VARCHAR;
  v_audit_id UUID;
  v_last_hash VARCHAR;
BEGIN
  v_event_id := generate_audit_event_id();

  -- Get last hash for chain
  SELECT hash_chain INTO v_last_hash
  FROM audit_logs
  ORDER BY created_at DESC
  LIMIT 1;

  INSERT INTO audit_logs (
    event_id, event_type, event_subtype, actor_id, actor_type,
    resource_type, resource_id, action, status, details, severity, risk_score,
    hash_chain
  ) VALUES (
    v_event_id, p_event_type, p_event_subtype, p_actor_id, 'user',
    p_resource_type, p_resource_id, p_action, p_status, p_details, p_severity, p_risk_score,
    ENCODE(SHA256((COALESCE(v_last_hash, '') || v_event_id)::BYTEA), 'hex')
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;

-- Function to aggregate daily analytics
CREATE OR REPLACE FUNCTION aggregate_daily_analytics(p_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO analytics_daily (date, new_users, active_users, total_revenue, payment_count)
  SELECT
    p_date,
    (SELECT COUNT(*) FROM profiles WHERE DATE(created_at) = p_date),
    (SELECT COUNT(DISTINCT user_id) FROM audit_logs WHERE DATE(created_at) = p_date AND actor_id IS NOT NULL),
    COALESCE((SELECT SUM(amount) FROM payments WHERE DATE(created_at) = p_date AND status = 'completed'), 0),
    (SELECT COUNT(*) FROM payments WHERE DATE(created_at) = p_date AND status = 'completed')
  ON CONFLICT (date) DO UPDATE SET
    new_users = EXCLUDED.new_users,
    active_users = EXCLUDED.active_users,
    total_revenue = EXCLUDED.total_revenue,
    payment_count = EXCLUDED.payment_count,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to reset daily card spending limits
CREATE OR REPLACE FUNCTION reset_daily_card_limits()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE virtual_cards
  SET daily_spent = 0
  WHERE status = 'active';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to reset monthly card spending limits
CREATE OR REPLACE FUNCTION reset_monthly_card_limits()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE virtual_cards
  SET monthly_spent = 0
  WHERE status = 'active';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to expire old cards
CREATE OR REPLACE FUNCTION expire_virtual_cards()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE virtual_cards
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Triggers
-- ============================================

-- Trigger to auto-set card expiry date
CREATE OR REPLACE FUNCTION set_card_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NOW() + INTERVAL '3 years';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_card_expiry
BEFORE INSERT ON virtual_cards
FOR EACH ROW
EXECUTE FUNCTION set_card_expiry();

-- Trigger to update card balance on transaction
CREATE OR REPLACE FUNCTION update_card_balance_on_tx()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.transaction_type = 'purchase' THEN
    UPDATE virtual_cards
    SET balance = balance - NEW.amount,
        daily_spent = daily_spent + NEW.amount,
        monthly_spent = monthly_spent + NEW.amount,
        last_used_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.card_id;
  ELSIF NEW.status = 'completed' AND NEW.transaction_type = 'refund' THEN
    UPDATE virtual_cards
    SET balance = balance + NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.card_id;
  ELSIF NEW.status = 'completed' AND NEW.transaction_type = 'topup' THEN
    UPDATE virtual_cards
    SET balance = balance + NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.card_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_card_balance
AFTER INSERT OR UPDATE OF status ON virtual_card_transactions
FOR EACH ROW
EXECUTE FUNCTION update_card_balance_on_tx();

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE virtual_cards IS 'User virtual cards for domestic merchant payments';
COMMENT ON TABLE virtual_card_transactions IS 'Transaction history for virtual card payments';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for compliance (ISO 27001, PCI-DSS)';
COMMENT ON TABLE analytics_daily IS 'Daily aggregated analytics metrics';
COMMENT ON TABLE notification_queue IS 'Queue for multi-channel notifications';
COMMENT ON TABLE performance_metrics IS 'Application performance metrics for monitoring';

COMMENT ON COLUMN audit_logs.hash_chain IS 'SHA-256 chain for tamper detection';
COMMENT ON COLUMN virtual_cards.daily_limit IS 'Maximum daily spending limit in KRW';
COMMENT ON COLUMN virtual_cards.monthly_limit IS 'Maximum monthly spending limit in KRW';
