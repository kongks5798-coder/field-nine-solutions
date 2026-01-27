-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 55: NEXUS RWA SYNC & VIBE-ID INTELLIGENCE SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════════

-- ============================================
-- Energy Generation Data Table
-- ============================================

CREATE TABLE IF NOT EXISTS energy_generation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source VARCHAR(50) NOT NULL DEFAULT 'yeongdong_solar',
  output_mw DECIMAL(10, 4) NOT NULL,
  output_kw DECIMAL(12, 2) NOT NULL,
  utilization_percent DECIMAL(5, 2) NOT NULL,
  weather_condition VARCHAR(50),
  temperature DECIMAL(5, 2),
  solar_irradiance INTEGER,
  smp_price DECIMAL(10, 2),
  kaus_generated INTEGER,
  revenue_krw DECIMAL(15, 2),
  revenue_usd DECIMAL(12, 2),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_utilization CHECK (utilization_percent >= 0 AND utilization_percent <= 100),
  CONSTRAINT valid_output CHECK (output_mw >= 0 AND output_kw >= 0)
);

-- Index for time-series queries
CREATE INDEX IF NOT EXISTS idx_energy_generation_source_time
ON energy_generation(source, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_energy_generation_recorded_at
ON energy_generation(recorded_at DESC);

-- ============================================
-- Energy Orderbook Snapshots Table
-- ============================================

CREATE TABLE IF NOT EXISTS energy_orderbook_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  spread DECIMAL(8, 4) NOT NULL,
  mid_price DECIMAL(10, 6) NOT NULL,
  available_energy DECIMAL(12, 2) NOT NULL,
  liquidity_score INTEGER NOT NULL,
  best_bid_price DECIMAL(10, 6),
  best_bid_quantity DECIMAL(12, 2),
  best_ask_price DECIMAL(10, 6),
  best_ask_quantity DECIMAL(12, 2),
  total_bid_volume DECIMAL(15, 2),
  total_ask_volume DECIMAL(15, 2),
  market_condition VARCHAR(20) NOT NULL, -- 'surplus', 'balanced', 'deficit'
  price_direction VARCHAR(10) NOT NULL, -- 'up', 'stable', 'down'
  volatility INTEGER NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_liquidity_score CHECK (liquidity_score >= 0 AND liquidity_score <= 100)
);

CREATE INDEX IF NOT EXISTS idx_orderbook_snapshots_time
ON energy_orderbook_snapshots(recorded_at DESC);

-- ============================================
-- VIBE Coupons Table
-- ============================================

CREATE TABLE IF NOT EXISTS vibe_coupons (
  id VARCHAR(50) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(30) NOT NULL UNIQUE,
  vibe_type VARCHAR(30) NOT NULL,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
  discount_value DECIMAL(10, 2) NOT NULL,
  max_discount DECIMAL(10, 2),
  min_purchase DECIMAL(10, 2) NOT NULL DEFAULT 50000,
  applicable_products TEXT[] DEFAULT '{}',
  applicable_categories TEXT[] DEFAULT '{}',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at TIMESTAMPTZ,
  order_id VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  personal_message TEXT,
  personal_message_ko TEXT,

  -- Constraints
  CONSTRAINT valid_discount_type CHECK (discount_type IN ('percentage', 'fixed', 'free_item')),
  CONSTRAINT valid_vibe_type CHECK (vibe_type IN (
    'silent-luxury', 'urban-explorer', 'nature-seeker', 'culture-lover',
    'beach-soul', 'adventure-spirit', 'foodie-wanderer', 'minimalist', 'romantic-dreamer'
  ))
);

CREATE INDEX IF NOT EXISTS idx_vibe_coupons_user ON vibe_coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_vibe_coupons_code ON vibe_coupons(code);
CREATE INDEX IF NOT EXISTS idx_vibe_coupons_active ON vibe_coupons(user_id, is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_vibe_coupons_vibe_type ON vibe_coupons(vibe_type);

-- ============================================
-- VIBE Analysis History Table
-- ============================================

CREATE TABLE IF NOT EXISTS vibe_analysis_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id VARCHAR(100),
  primary_vibe VARCHAR(30) NOT NULL,
  secondary_vibe VARCHAR(30),
  confidence DECIMAL(4, 3) NOT NULL,
  traits TEXT[] DEFAULT '{}',
  color_palette TEXT[] DEFAULT '{}',
  image_hash VARCHAR(64), -- SHA256 of image for deduplication
  coupon_generated BOOLEAN DEFAULT false,
  coupon_id VARCHAR(50) REFERENCES vibe_coupons(id),
  analysis_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_confidence CHECK (confidence >= 0 AND confidence <= 1)
);

CREATE INDEX IF NOT EXISTS idx_vibe_analysis_user ON vibe_analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_vibe_analysis_session ON vibe_analysis_history(session_id);
CREATE INDEX IF NOT EXISTS idx_vibe_analysis_time ON vibe_analysis_history(created_at DESC);

-- ============================================
-- RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE energy_generation ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_orderbook_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_analysis_history ENABLE ROW LEVEL SECURITY;

-- Energy generation: Public read, service role write
CREATE POLICY "energy_generation_read_all" ON energy_generation
  FOR SELECT USING (true);

CREATE POLICY "energy_generation_insert_service" ON energy_generation
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Orderbook snapshots: Public read, service role write
CREATE POLICY "orderbook_snapshots_read_all" ON energy_orderbook_snapshots
  FOR SELECT USING (true);

CREATE POLICY "orderbook_snapshots_insert_service" ON energy_orderbook_snapshots
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Vibe coupons: Users can only see their own coupons
CREATE POLICY "vibe_coupons_read_own" ON vibe_coupons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "vibe_coupons_insert_service" ON vibe_coupons
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);

CREATE POLICY "vibe_coupons_update_service" ON vibe_coupons
  FOR UPDATE USING (auth.role() = 'service_role' OR auth.uid() = user_id);

-- Vibe analysis history: Users can see their own, anonymous allowed
CREATE POLICY "vibe_analysis_read_own" ON vibe_analysis_history
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "vibe_analysis_insert" ON vibe_analysis_history
  FOR INSERT WITH CHECK (true);

-- ============================================
-- Functions
-- ============================================

-- Function to get daily energy summary
CREATE OR REPLACE FUNCTION get_daily_energy_summary(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  date DATE,
  total_output_mwh DECIMAL,
  avg_utilization DECIMAL,
  total_kaus_generated BIGINT,
  total_revenue_krw DECIMAL,
  peak_output_mw DECIMAL,
  records_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    target_date as date,
    SUM(output_mw) / 60 as total_output_mwh, -- Convert to MWh (assuming per-minute records)
    AVG(utilization_percent) as avg_utilization,
    SUM(kaus_generated)::BIGINT as total_kaus_generated,
    SUM(revenue_krw) as total_revenue_krw,
    MAX(output_mw) as peak_output_mw,
    COUNT(*)::BIGINT as records_count
  FROM energy_generation
  WHERE DATE(recorded_at) = target_date
    AND source = 'yeongdong_solar'
  GROUP BY target_date;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-expire coupons
CREATE OR REPLACE FUNCTION expire_old_coupons()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE vibe_coupons
  SET is_active = false
  WHERE is_active = true
    AND expires_at < NOW()
    AND used_at IS NULL;

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Triggers
-- ============================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE energy_generation IS 'Real-time solar generation data from Yeongdong farm';
COMMENT ON TABLE energy_orderbook_snapshots IS 'Historical orderbook state for analytics';
COMMENT ON TABLE vibe_coupons IS 'Personal discount coupons generated from VIBE-ID analysis';
COMMENT ON TABLE vibe_analysis_history IS 'History of all VIBE-ID selfie analyses';

COMMENT ON COLUMN energy_generation.source IS 'Energy source identifier (yeongdong_solar)';
COMMENT ON COLUMN energy_generation.smp_price IS 'System Marginal Price in KRW/kWh';
COMMENT ON COLUMN energy_generation.kaus_generated IS 'KAUS tokens generated (10 KAUS per kWh)';

COMMENT ON COLUMN vibe_coupons.vibe_type IS 'VIBE archetype that triggered this coupon';
COMMENT ON COLUMN vibe_coupons.applicable_products IS 'Array of product IDs this coupon applies to';
COMMENT ON COLUMN vibe_coupons.applicable_categories IS 'Array of categories this coupon applies to';
