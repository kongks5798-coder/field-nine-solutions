-- ============================================
-- K-UNIVERSAL SUPER APP SCHEMA V2
-- Complete migration for Super App features
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. UPDATE PROFILES TABLE
-- Add Super App specific fields
-- ============================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'ko' CHECK (preferred_language IN ('ko', 'en', 'ja', 'zh')),
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"email": true, "push": true, "sms": false}'::jsonb,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email TEXT;

-- ============================================
-- 2. WALLETS TABLE (KRW Fiat Wallet)
-- For Toss Payments integration
-- ============================================
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance DECIMAL(15, 2) DEFAULT 0.00 CHECK (balance >= 0),
  currency TEXT DEFAULT 'KRW' CHECK (currency IN ('KRW', 'USD', 'JPY', 'CNY')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'suspended')),
  daily_limit DECIMAL(15, 2) DEFAULT 5000000.00,
  monthly_limit DECIMAL(15, 2) DEFAULT 50000000.00,
  has_virtual_card BOOLEAN DEFAULT FALSE,
  virtual_card_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for wallets
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet"
  ON wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet"
  ON wallets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet"
  ON wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. TRANSACTIONS TABLE
-- Payment transactions (Toss, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('topup', 'payment', 'refund', 'transfer', 'withdrawal')),
  amount DECIMAL(15, 2) NOT NULL,
  currency TEXT DEFAULT 'KRW',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded', 'partial_refunded')),
  reference_id TEXT, -- Toss payment key or external reference
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- RLS for transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. PUSH_SUBSCRIPTIONS TABLE
-- Web Push notification subscriptions
-- ============================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_endpoint UNIQUE(user_id, endpoint)
);

-- RLS for push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own subscriptions"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 5. NOTIFICATIONS TABLE
-- In-app notification history
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('payment', 'promo', 'system', 'taxi', 'food', 'booking')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 6. BOOKINGS TABLE
-- For taxi, restaurants, hotels, etc.
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('taxi', 'restaurant', 'hotel', 'attraction', 'ktx', 'airport')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  provider_id TEXT, -- External service provider ID
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_amount DECIMAL(15, 2),
  currency TEXT DEFAULT 'KRW',
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 7. FAVORITES TABLE
-- User's favorite places/restaurants
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('restaurant', 'hotel', 'attraction', 'store')),
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_favorite UNIQUE(user_id, type, external_id)
);

-- RLS for favorites
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favorites"
  ON favorites FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 8. FEEDBACK TABLE
-- User feedback and reviews
-- ============================================
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'review', 'complaint', 'general')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for feedback
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can submit feedback"
  ON feedback FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 9. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_status ON wallets(status);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_reference_id ON transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_type ON bookings(type);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

-- ============================================
-- 10. TRIGGERS
-- ============================================

-- Auto-update updated_at for wallets
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for push_subscriptions
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for bookings
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create wallet on user signup
CREATE OR REPLACE FUNCTION handle_new_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id, balance, currency)
  VALUES (NEW.id, 0.00, 'KRW')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_wallet();

-- ============================================
-- 11. FUNCTIONS
-- ============================================

-- Function to get wallet balance
CREATE OR REPLACE FUNCTION get_wallet_balance(p_user_id UUID)
RETURNS TABLE(balance DECIMAL, currency TEXT, has_virtual_card BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT w.balance, w.currency, w.has_virtual_card
  FROM wallets w
  WHERE w.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process topup
CREATE OR REPLACE FUNCTION process_topup(
  p_user_id UUID,
  p_amount DECIMAL,
  p_reference_id TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_wallet_id UUID;
  v_transaction_id UUID;
BEGIN
  -- Get wallet
  SELECT id INTO v_wallet_id FROM wallets WHERE user_id = p_user_id;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for user';
  END IF;

  -- Create transaction
  INSERT INTO transactions (wallet_id, user_id, type, amount, status, reference_id, metadata, completed_at)
  VALUES (v_wallet_id, p_user_id, 'topup', p_amount, 'completed', p_reference_id, p_metadata, NOW())
  RETURNING id INTO v_transaction_id;

  -- Update balance
  UPDATE wallets SET balance = balance + p_amount, updated_at = NOW()
  WHERE id = v_wallet_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- END OF SUPER APP SCHEMA
-- ============================================
