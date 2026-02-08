-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 57: VIBE-ID VIRAL LOOP SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════════

-- ============================================
-- VIBE Analyses Table
-- ============================================

CREATE TABLE IF NOT EXISTS vibe_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  vibe_type VARCHAR(30) NOT NULL, -- primary archetype
  secondary_vibe VARCHAR(30),
  confidence DECIMAL(4, 2) DEFAULT 0.85,
  traits TEXT[] DEFAULT '{}',
  color_palette TEXT[] DEFAULT '{}',
  description TEXT,
  description_ko TEXT,
  image_hash VARCHAR(64), -- optional: hash of analyzed image for dedup
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vibe_analyses_user ON vibe_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_vibe_analyses_type ON vibe_analyses(vibe_type);

-- ============================================
-- Share Events Table (Analytics)
-- ============================================

CREATE TABLE IF NOT EXISTS share_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  card_id VARCHAR(50),
  platform VARCHAR(30) NOT NULL, -- instagram, twitter, native, clipboard, download
  referral_code VARCHAR(20),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_share_events_user ON share_events(user_id);
CREATE INDEX IF NOT EXISTS idx_share_events_platform ON share_events(platform);
CREATE INDEX IF NOT EXISTS idx_share_events_created ON share_events(created_at DESC);

-- ============================================
-- Viral Cards Table (Generated Cards)
-- ============================================

CREATE TABLE IF NOT EXISTS viral_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id VARCHAR(50) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sovereign_number INTEGER,
  referral_code VARCHAR(20),
  vibe_type VARCHAR(30),
  format VARCHAR(20) DEFAULT 'story', -- story, post, square
  share_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_viral_cards_user ON viral_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_viral_cards_card_id ON viral_cards(card_id);
CREATE INDEX IF NOT EXISTS idx_viral_cards_referral ON viral_cards(referral_code);

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE vibe_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE viral_cards ENABLE ROW LEVEL SECURITY;

-- VIBE Analyses: Users see only their own
CREATE POLICY "vibe_analyses_read_own" ON vibe_analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "vibe_analyses_insert_own" ON vibe_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vibe_analyses_update_own" ON vibe_analyses
  FOR UPDATE USING (auth.uid() = user_id);

-- Share Events: Users can insert their own, read their own
CREATE POLICY "share_events_read_own" ON share_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "share_events_insert_own" ON share_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Viral Cards: Users see only their own
CREATE POLICY "viral_cards_read_own" ON viral_cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "viral_cards_insert_own" ON viral_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "viral_cards_update_own" ON viral_cards
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- Functions
-- ============================================

-- Function to track card click (from QR/link)
CREATE OR REPLACE FUNCTION track_card_click(p_card_id VARCHAR)
RETURNS VOID AS $$
BEGIN
  UPDATE viral_cards
  SET click_count = click_count + 1
  WHERE card_id = p_card_id;
END;
$$ LANGUAGE plpgsql;

-- Function to track card conversion (successful referral)
CREATE OR REPLACE FUNCTION track_card_conversion(p_card_id VARCHAR)
RETURNS VOID AS $$
BEGIN
  UPDATE viral_cards
  SET conversion_count = conversion_count + 1
  WHERE card_id = p_card_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get viral analytics summary
CREATE OR REPLACE FUNCTION get_viral_analytics(p_user_id UUID)
RETURNS TABLE (
  total_shares BIGINT,
  total_clicks BIGINT,
  total_conversions BIGINT,
  conversion_rate DECIMAL,
  top_platform TEXT,
  top_vibe_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE((SELECT COUNT(*) FROM share_events WHERE user_id = p_user_id), 0)::BIGINT as total_shares,
    COALESCE((SELECT SUM(click_count) FROM viral_cards WHERE user_id = p_user_id), 0)::BIGINT as total_clicks,
    COALESCE((SELECT SUM(conversion_count) FROM viral_cards WHERE user_id = p_user_id), 0)::BIGINT as total_conversions,
    CASE
      WHEN (SELECT SUM(click_count) FROM viral_cards WHERE user_id = p_user_id) > 0
      THEN ((SELECT SUM(conversion_count) FROM viral_cards WHERE user_id = p_user_id)::DECIMAL /
            (SELECT SUM(click_count) FROM viral_cards WHERE user_id = p_user_id)::DECIMAL * 100)
      ELSE 0
    END as conversion_rate,
    (SELECT platform FROM share_events WHERE user_id = p_user_id
     GROUP BY platform ORDER BY COUNT(*) DESC LIMIT 1) as top_platform,
    (SELECT vibe_type FROM viral_cards WHERE user_id = p_user_id
     GROUP BY vibe_type ORDER BY COUNT(*) DESC LIMIT 1) as top_vibe_type;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Triggers
-- ============================================

-- Trigger to increment share count when share event is logged
CREATE OR REPLACE FUNCTION increment_share_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE viral_cards
  SET share_count = share_count + 1
  WHERE card_id = NEW.card_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_share
AFTER INSERT ON share_events
FOR EACH ROW
WHEN (NEW.card_id IS NOT NULL)
EXECUTE FUNCTION increment_share_count();

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE vibe_analyses IS 'User VIBE-ID analysis results from GPT-4o Vision';
COMMENT ON TABLE share_events IS 'Social sharing analytics for viral cards';
COMMENT ON TABLE viral_cards IS 'Generated viral aura cards with tracking metrics';

COMMENT ON COLUMN vibe_analyses.vibe_type IS 'Primary vibe archetype (e.g., silent-luxury, urban-explorer)';
COMMENT ON COLUMN share_events.platform IS 'Social platform: instagram, twitter, native, clipboard, download';
COMMENT ON COLUMN viral_cards.conversion_count IS 'Number of successful referrals from this card';
