-- ============================================
-- K-UNIVERSAL P0 Database Migration
-- Creates missing production tables
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. Payment Idempotency Table
-- Prevents duplicate payments
-- ============================================
CREATE TABLE IF NOT EXISTS payment_idempotency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key VARCHAR(255) NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_path VARCHAR(500) NOT NULL,
  request_method VARCHAR(10) NOT NULL,
  request_hash VARCHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  response_status INTEGER,
  response_body JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,

  -- Unique constraint on key + user
  CONSTRAINT unique_idempotency_key_user UNIQUE (idempotency_key, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_idempotency_key ON payment_idempotency(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_payment_idempotency_user ON payment_idempotency(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_idempotency_expires ON payment_idempotency(expires_at);
CREATE INDEX IF NOT EXISTS idx_payment_idempotency_status ON payment_idempotency(status);

-- ============================================
-- 2. Bookings Table
-- Flight and hotel bookings
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Booking type and reference
  booking_type VARCHAR(20) NOT NULL CHECK (booking_type IN ('flight', 'hotel', 'package')),
  external_reference VARCHAR(255),
  confirmation_number VARCHAR(100),

  -- Status tracking
  status VARCHAR(30) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'pending_payment', 'confirmed', 'cancelled', 'refunded', 'completed', 'failed')),
  payment_status VARCHAR(20) DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'refunded', 'failed')),
  payment_reference VARCHAR(255),
  payment_completed_at TIMESTAMPTZ,

  -- Booking details (JSON for flexibility)
  details JSONB NOT NULL DEFAULT '{}',

  -- Pricing
  currency VARCHAR(3) NOT NULL DEFAULT 'KRW',
  base_price DECIMAL(12, 2) NOT NULL,
  markup DECIMAL(12, 2) DEFAULT 0,
  taxes DECIMAL(12, 2) DEFAULT 0,
  total_price DECIMAL(12, 2) NOT NULL,

  -- Contact info
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),

  -- Provider info
  provider VARCHAR(50), -- 'amadeus', 'duffel', 'stay22', etc.
  provider_booking_id VARCHAR(255),

  -- Metadata
  metadata JSONB DEFAULT '{}',
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_type ON bookings(booking_type);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_ref ON bookings(payment_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_confirmation ON bookings(confirmation_number);

-- ============================================
-- 3. Payments Table
-- All payment transactions
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,

  -- Payment info
  payment_provider VARCHAR(30) NOT NULL
    CHECK (payment_provider IN ('toss', 'paypal', 'stripe', 'wallet', 'kakao_pay', 'lemonsqueezy')),
  payment_method VARCHAR(50), -- 'card', 'virtual_account', 'paypal_balance', etc.

  -- External references
  provider_payment_id VARCHAR(255),
  provider_order_id VARCHAR(255),

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partial_refund')),

  -- Amount
  currency VARCHAR(3) NOT NULL DEFAULT 'KRW',
  amount DECIMAL(12, 2) NOT NULL,
  fee DECIMAL(12, 2) DEFAULT 0,
  net_amount DECIMAL(12, 2),

  -- Refund tracking
  refund_amount DECIMAL(12, 2) DEFAULT 0,
  refund_reason TEXT,
  refunded_at TIMESTAMPTZ,

  -- Card info (masked)
  card_last_four VARCHAR(4),
  card_brand VARCHAR(20),

  -- Payer info
  payer_email VARCHAR(255),
  payer_name VARCHAR(255),

  -- Metadata
  metadata JSONB DEFAULT '{}',
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_provider ON payments(payment_provider);
CREATE INDEX IF NOT EXISTS idx_payments_provider_id ON payments(provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);

-- ============================================
-- 4. Audit Logs Table
-- Security and compliance audit trail
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Action info
  action VARCHAR(100) NOT NULL,
  action_category VARCHAR(50) NOT NULL
    CHECK (action_category IN ('auth', 'payment', 'booking', 'admin', 'security', 'webhook', 'api', 'user')),

  -- Actor info
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_ip VARCHAR(45),
  actor_user_agent TEXT,
  actor_session_id VARCHAR(255),

  -- Resource info
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(255),

  -- Result
  result VARCHAR(20) NOT NULL CHECK (result IN ('success', 'failure', 'error', 'denied')),
  error_message TEXT,

  -- Details
  old_value JSONB,
  new_value JSONB,
  metadata JSONB DEFAULT '{}',

  -- Request context
  request_id VARCHAR(100),
  request_path VARCHAR(500),
  request_method VARCHAR(10),

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_category ON audit_logs(action_category);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_result ON audit_logs(result);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_request ON audit_logs(request_id);

-- ============================================
-- 5. Rate Limiting Table
-- Persistent rate limit tracking
-- ============================================
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identifier (can be user_id, ip, api_key)
  identifier_type VARCHAR(20) NOT NULL CHECK (identifier_type IN ('user', 'ip', 'api_key', 'combined')),
  identifier_value VARCHAR(255) NOT NULL,

  -- Endpoint/action being limited
  endpoint VARCHAR(255) NOT NULL,

  -- Limit tracking
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_end TIMESTAMPTZ NOT NULL,

  -- Configuration
  max_requests INTEGER NOT NULL,

  -- Status
  is_blocked BOOLEAN DEFAULT FALSE,
  blocked_until TIMESTAMPTZ,
  block_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint
  CONSTRAINT unique_rate_limit UNIQUE (identifier_type, identifier_value, endpoint)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier ON rate_limits(identifier_type, identifier_value);
CREATE INDEX IF NOT EXISTS idx_rate_limit_endpoint ON rate_limits(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limit_window ON rate_limits(window_end);
CREATE INDEX IF NOT EXISTS idx_rate_limit_blocked ON rate_limits(is_blocked) WHERE is_blocked = TRUE;

-- ============================================
-- 6. RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE payment_idempotency ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Payment Idempotency: Users can only access their own records
CREATE POLICY "Users can view own idempotency records" ON payment_idempotency
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own idempotency records" ON payment_idempotency
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own idempotency records" ON payment_idempotency
  FOR UPDATE USING (auth.uid() = user_id);

-- Bookings: Users can only access their own bookings
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = user_id);

-- Payments: Users can only access their own payments
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Audit Logs: Users can only view their own audit logs
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = actor_user_id);

-- Rate Limits: Service role only (no user access)
-- No user policies - managed by service role only

-- ============================================
-- 7. Service Role Policies (for webhooks/background jobs)
-- ============================================

-- Allow service role full access to all tables
CREATE POLICY "Service role full access to payment_idempotency" ON payment_idempotency
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to bookings" ON bookings
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to payments" ON payments
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to audit_logs" ON audit_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to rate_limits" ON rate_limits
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- 8. Updated_at Trigger Function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_payment_idempotency_updated_at ON payment_idempotency;
CREATE TRIGGER update_payment_idempotency_updated_at
  BEFORE UPDATE ON payment_idempotency
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rate_limits_updated_at ON rate_limits;
CREATE TRIGGER update_rate_limits_updated_at
  BEFORE UPDATE ON rate_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. Cleanup Functions
-- ============================================

-- Function to clean expired idempotency records
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM payment_idempotency
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired rate limit windows
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM rate_limits
  WHERE window_end < NOW() - INTERVAL '1 hour';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. Comments for documentation
-- ============================================
COMMENT ON TABLE payment_idempotency IS 'Prevents duplicate payment processing';
COMMENT ON TABLE bookings IS 'Flight and hotel booking records';
COMMENT ON TABLE payments IS 'Payment transaction records';
COMMENT ON TABLE audit_logs IS 'Security and compliance audit trail';
COMMENT ON TABLE rate_limits IS 'API rate limiting tracking';

COMMENT ON COLUMN payment_idempotency.status IS 'pending, processing, completed, failed';
COMMENT ON COLUMN bookings.status IS 'pending, pending_payment, confirmed, cancelled, refunded, completed, failed';
COMMENT ON COLUMN payments.status IS 'pending, processing, completed, failed, cancelled, refunded, partial_refund';
COMMENT ON COLUMN audit_logs.action_category IS 'auth, payment, booking, admin, security, webhook, api, user';

-- ============================================
-- Migration Complete
-- ============================================
