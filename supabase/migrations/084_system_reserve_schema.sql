-- =============================================
-- PHASE 84: KAUS CENTRAL BANK SYSTEM TABLES
-- Sovereign Vault Reserve Management
-- =============================================

-- 1. System Reserve Table - KAUS Token Supply Management
CREATE TABLE IF NOT EXISTS system_reserve (
  id TEXT PRIMARY KEY DEFAULT 'main',
  total_supply NUMERIC(20,6) NOT NULL DEFAULT 1000000000,
  circulating_supply NUMERIC(20,6) NOT NULL DEFAULT 750000000,
  reserve_balance NUMERIC(20,6) NOT NULL DEFAULT 200000000,
  burned_total NUMERIC(20,6) NOT NULL DEFAULT 50000000,
  minted_total NUMERIC(20,6) NOT NULL DEFAULT 1050000000,
  last_operation JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial reserve if not exists
INSERT INTO system_reserve (
  id, total_supply, circulating_supply, reserve_balance, burned_total, minted_total
) VALUES (
  'main', 1000000000, 750000000, 200000000, 50000000, 1050000000
) ON CONFLICT (id) DO NOTHING;

-- 2. Reserve Operations Log - SHA-256 Audit Trail
CREATE TABLE IF NOT EXISTS reserve_operations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  operation_type VARCHAR(10) NOT NULL CHECK (operation_type IN ('mint', 'burn')),
  amount NUMERIC(20,6) NOT NULL,
  reason TEXT NOT NULL,
  signature TEXT NOT NULL,
  executed_by TEXT NOT NULL DEFAULT 'EMPEROR',
  pre_supply NUMERIC(20,6),
  post_supply NUMERIC(20,6),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reserve_operations_type ON reserve_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_reserve_operations_created_at ON reserve_operations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reserve_operations_signature ON reserve_operations(signature);

-- 4. Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_system_reserve_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_system_reserve_updated_at ON system_reserve;
CREATE TRIGGER trigger_system_reserve_updated_at
  BEFORE UPDATE ON system_reserve
  FOR EACH ROW
  EXECUTE FUNCTION update_system_reserve_updated_at();

-- 5. RLS Policies (Emperor-only access)
ALTER TABLE system_reserve ENABLE ROW LEVEL SECURITY;
ALTER TABLE reserve_operations ENABLE ROW LEVEL SECURITY;

-- Service role has full access (for server-side operations)
-- No public access policies - all operations through server API

-- 6. Financial Logger Table - SHA-256 Audit for ALL Financial Events
CREATE TABLE IF NOT EXISTS financial_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  event_category VARCHAR(30) NOT NULL DEFAULT 'KAUS',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount NUMERIC(20,8),
  currency VARCHAR(10) DEFAULT 'KAUS',
  pre_balance NUMERIC(20,8),
  post_balance NUMERIC(20,8),
  signature TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_audit_event_type ON financial_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_financial_audit_user_id ON financial_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_audit_created_at ON financial_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_financial_audit_signature ON financial_audit_log(signature);

ALTER TABLE financial_audit_log ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Execution Complete
-- =============================================
SELECT 'PHASE 84: System Reserve schema created successfully!' as status;
