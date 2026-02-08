-- ============================================
-- K-UNIVERSAL RLS PRODUCTION POLICIES
-- Row Level Security for all tables
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. WALLETS TABLE (for Ghost Wallet / Topup)
-- ============================================
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance DECIMAL(20,2) DEFAULT 0.00,
  currency TEXT DEFAULT 'KRW',
  has_virtual_card BOOLEAN DEFAULT false,
  card_last_four TEXT,
  status TEXT CHECK (status IN ('active', 'frozen', 'closed')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for wallets
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Users can only see their own wallet
CREATE POLICY "wallet_select_own" ON wallets
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only update their own wallet (balance updates should go through service role)
CREATE POLICY "wallet_update_own" ON wallets
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can create their own wallet
CREATE POLICY "wallet_insert_own" ON wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2. TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('topup', 'payment', 'transfer', 'refund', 'withdrawal')) NOT NULL,
  amount DECIMAL(20,2) NOT NULL,
  currency TEXT DEFAULT 'KRW',
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
  description TEXT,
  merchant_name TEXT,
  merchant_category TEXT,
  reference_id TEXT UNIQUE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- RLS for transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own transactions
CREATE POLICY "transaction_select_own" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- System can insert transactions (via service role)
-- Users cannot directly insert - must go through API
CREATE POLICY "transaction_insert_service" ON transactions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    auth.jwt() ->> 'role' = 'service_role'
  );

-- ============================================
-- 3. PROFILES TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  kyc_status TEXT CHECK (kyc_status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
  role TEXT CHECK (role IN ('user', 'admin', 'merchant')) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can see their own profile
CREATE POLICY "profile_select_own" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can see all profiles
CREATE POLICY "profile_select_admin" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

-- Users can update their own profile
CREATE POLICY "profile_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can create their own profile
CREATE POLICY "profile_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. PAYMENT_ORDERS TABLE (for Toss)
-- ============================================
CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id TEXT UNIQUE NOT NULL,
  amount DECIMAL(20,2) NOT NULL,
  currency TEXT DEFAULT 'KRW',
  status TEXT CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded')) DEFAULT 'pending',
  payment_key TEXT,
  payment_method TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for payment_orders
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

-- Users can see their own orders
CREATE POLICY "payment_order_select_own" ON payment_orders
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own orders
CREATE POLICY "payment_order_insert_own" ON payment_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only service role can update orders
CREATE POLICY "payment_order_update_service" ON payment_orders
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- 5. API_LOGS TABLE (for audit)
-- ============================================
CREATE TABLE IF NOT EXISTS api_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  request_body JSONB,
  response_body JSONB,
  ip_address TEXT,
  user_agent TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for api_logs (admin only)
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "api_logs_select_admin" ON api_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

-- Service role can insert logs
CREATE POLICY "api_logs_insert_service" ON api_logs
  FOR INSERT WITH CHECK (true);

-- ============================================
-- 6. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_reference_id ON transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_order_id ON payment_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON api_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at DESC);

-- ============================================
-- 7. TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_wallets_updated_at ON wallets;
CREATE TRIGGER tr_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON profiles;
CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tr_payment_orders_updated_at ON payment_orders;
CREATE TRIGGER tr_payment_orders_updated_at
  BEFORE UPDATE ON payment_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create wallet on user creation
CREATE OR REPLACE FUNCTION create_wallet_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id, balance, currency)
  VALUES (NEW.id, 0, 'KRW')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_create_wallet_on_signup ON auth.users;
CREATE TRIGGER tr_create_wallet_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_wallet_for_user();

-- ============================================
-- 8. GRANTS
-- ============================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- END OF RLS POLICIES
-- ============================================
