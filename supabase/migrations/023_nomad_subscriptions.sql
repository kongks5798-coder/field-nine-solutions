-- ============================================
-- NOMAD - Subscription & eSIM Schema
-- Global Travel Subscription Service
-- ============================================

-- ============================================
-- 1. SUBSCRIPTIONS TABLE
-- User subscription management
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_id TEXT NOT NULL DEFAULT 'free' CHECK (plan_id IN ('free', 'explorer', 'traveler', 'nomad', 'business')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  -- Usage tracking
  esim_data_used_mb INTEGER DEFAULT 0,
  esim_data_limit_mb INTEGER DEFAULT 0, -- -1 for unlimited
  ai_chats_used INTEGER DEFAULT 0,
  ai_chats_limit INTEGER DEFAULT 5, -- -1 for unlimited
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 2. ESIM_PURCHASES TABLE
-- eSIM purchase history
-- ============================================
CREATE TABLE IF NOT EXISTS esim_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id),
  package_id TEXT NOT NULL,
  package_name TEXT NOT NULL,
  destination TEXT NOT NULL,
  destination_code TEXT NOT NULL,
  data_limit_mb INTEGER NOT NULL, -- -1 for unlimited
  data_used_mb INTEGER DEFAULT 0,
  validity_days INTEGER NOT NULL,
  price DECIMAL(10, 2) DEFAULT 0, -- 0 if included in subscription
  currency TEXT DEFAULT 'USD',
  -- eSIM details
  qr_code TEXT,
  qr_code_url TEXT,
  activation_code TEXT,
  smdp_address TEXT,
  iccid TEXT,
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'depleted')),
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for esim_purchases
ALTER TABLE esim_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own eSIMs"
  ON esim_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own eSIMs"
  ON esim_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. TRAVEL_BOOKINGS TABLE
-- Hotel, Flight, Activity bookings (affiliate)
-- ============================================
CREATE TABLE IF NOT EXISTS travel_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hotel', 'flight', 'activity', 'car', 'transfer')),
  provider TEXT NOT NULL, -- booking.com, skyscanner, klook, etc.
  provider_booking_id TEXT,
  affiliate_link TEXT,
  -- Booking details
  destination TEXT NOT NULL,
  destination_code TEXT,
  check_in DATE,
  check_out DATE,
  guests INTEGER DEFAULT 1,
  -- Pricing
  total_amount DECIMAL(12, 2),
  currency TEXT DEFAULT 'USD',
  cashback_amount DECIMAL(10, 2) DEFAULT 0,
  cashback_status TEXT DEFAULT 'pending' CHECK (cashback_status IN ('pending', 'confirmed', 'paid', 'expired')),
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'canceled', 'completed')),
  booking_details JSONB DEFAULT '{}'::jsonb,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for travel_bookings
ALTER TABLE travel_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON travel_bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookings"
  ON travel_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. AI_CHAT_HISTORY TABLE
-- AI Concierge conversation history
-- ============================================
CREATE TABLE IF NOT EXISTS ai_chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for ai_chat_history
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat history"
  ON ai_chat_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat history"
  ON ai_chat_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. SAVED_DESTINATIONS TABLE
-- User's saved/favorite destinations
-- ============================================
CREATE TABLE IF NOT EXISTS saved_destinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  destination_code TEXT NOT NULL,
  destination_name TEXT NOT NULL,
  notes TEXT,
  planned_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_destination UNIQUE(user_id, destination_code)
);

-- RLS for saved_destinations
ALTER TABLE saved_destinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved destinations"
  ON saved_destinations FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 6. TRAVEL_ITINERARIES TABLE
-- AI-generated or user-created itineraries
-- ============================================
CREATE TABLE IF NOT EXISTS travel_itineraries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  destination_code TEXT,
  start_date DATE,
  end_date DATE,
  -- Content
  itinerary_data JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of day plans
  total_budget DECIMAL(12, 2),
  currency TEXT DEFAULT 'USD',
  -- Metadata
  is_public BOOLEAN DEFAULT FALSE,
  ai_generated BOOLEAN DEFAULT FALSE,
  share_code TEXT UNIQUE,
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'planned', 'active', 'completed')),
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for travel_itineraries
ALTER TABLE travel_itineraries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own itineraries"
  ON travel_itineraries FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public itineraries"
  ON travel_itineraries FOR SELECT
  USING (is_public = TRUE);

-- ============================================
-- 7. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_esim_purchases_user_id ON esim_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_esim_purchases_status ON esim_purchases(status);
CREATE INDEX IF NOT EXISTS idx_esim_purchases_expires ON esim_purchases(expires_at);

CREATE INDEX IF NOT EXISTS idx_travel_bookings_user_id ON travel_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_bookings_type ON travel_bookings(type);
CREATE INDEX IF NOT EXISTS idx_travel_bookings_status ON travel_bookings(status);

CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user_id ON ai_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_session ON ai_chat_history(session_id);

CREATE INDEX IF NOT EXISTS idx_travel_itineraries_user_id ON travel_itineraries(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_itineraries_share_code ON travel_itineraries(share_code);

-- ============================================
-- 8. TRIGGERS
-- ============================================

-- Auto-create free subscription on user signup
CREATE OR REPLACE FUNCTION handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (user_id, plan_id, status, ai_chats_limit, esim_data_limit_mb)
  VALUES (NEW.id, 'free', 'active', 5, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_subscription();

-- Auto-update updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_travel_bookings_updated_at
  BEFORE UPDATE ON travel_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_travel_itineraries_updated_at
  BEFORE UPDATE ON travel_itineraries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. FUNCTIONS
-- ============================================

-- Get user's current subscription with usage
CREATE OR REPLACE FUNCTION get_user_subscription(p_user_id UUID)
RETURNS TABLE(
  plan_id TEXT,
  status TEXT,
  esim_data_used_mb INTEGER,
  esim_data_limit_mb INTEGER,
  ai_chats_used INTEGER,
  ai_chats_limit INTEGER,
  current_period_end TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.plan_id,
    s.status,
    s.esim_data_used_mb,
    s.esim_data_limit_mb,
    s.ai_chats_used,
    s.ai_chats_limit,
    s.current_period_end
  FROM subscriptions s
  WHERE s.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment AI chat usage
CREATE OR REPLACE FUNCTION increment_ai_chat_usage(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_usage INTEGER;
  v_limit INTEGER;
BEGIN
  SELECT ai_chats_used, ai_chats_limit INTO v_current_usage, v_limit
  FROM subscriptions WHERE user_id = p_user_id;

  -- -1 means unlimited
  IF v_limit = -1 THEN
    UPDATE subscriptions SET ai_chats_used = ai_chats_used + 1
    WHERE user_id = p_user_id;
    RETURN TRUE;
  END IF;

  -- Check limit
  IF v_current_usage >= v_limit THEN
    RETURN FALSE;
  END IF;

  UPDATE subscriptions SET ai_chats_used = ai_chats_used + 1
  WHERE user_id = p_user_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reset monthly usage (run via cron)
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET
    esim_data_used_mb = 0,
    ai_chats_used = 0,
    updated_at = NOW()
  WHERE current_period_end <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- END OF NOMAD SCHEMA
-- ============================================
