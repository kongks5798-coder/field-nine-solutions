-- ═══════════════════════════════════════════════════════════════════════════════
-- SYSTEM CONFIG TABLE - FIELD NINE NEXUS
-- ═══════════════════════════════════════════════════════════════════════════════
-- Stores system-wide configuration including OAuth tokens
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key);

-- RLS Policies (Service Role Only)
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Only service role can access (for security - contains tokens)
CREATE POLICY "Service role only" ON system_config
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Comment
COMMENT ON TABLE system_config IS 'System configuration storage for OAuth tokens and settings';
