-- ============================================
-- K-UNIVERSAL DATABASE SCHEMA V1
-- Passport e-KYC & Ghost Wallet System
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- Core user profile with KYC status
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  kyc_status TEXT CHECK (kyc_status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
  kyc_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2. PASSPORT_DATA TABLE
-- Encrypted passport information from OCR
-- ============================================
CREATE TABLE IF NOT EXISTS passport_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  passport_number TEXT NOT NULL,
  mrz_code TEXT NOT NULL, -- Machine Readable Zone
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  nationality TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  document_image_url TEXT, -- IPFS hash or encrypted storage URL
  verification_score DECIMAL(3,2), -- AI confidence score (0.00-1.00)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_passport_per_profile UNIQUE(profile_id)
);

-- Row Level Security
ALTER TABLE passport_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own passport data"
  ON passport_data FOR SELECT
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own passport data"
  ON passport_data FOR INSERT
  WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ============================================
-- 3. GHOST_WALLETS TABLE
-- Non-custodial crypto wallet storage
-- ============================================
CREATE TABLE IF NOT EXISTS ghost_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  encrypted_private_key TEXT NOT NULL, -- AES-256 encrypted with user's biometric key
  public_address TEXT NOT NULL UNIQUE,
  wallet_type TEXT DEFAULT 'ethereum' CHECK (wallet_type IN ('ethereum', 'polygon', 'binance', 'solana')),
  biometric_hash TEXT, -- Hash for device-local biometric authentication
  backup_method TEXT CHECK (backup_method IN ('seed_phrase', 'social_recovery', 'none')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE ghost_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet"
  ON ghost_wallets FOR SELECT
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own wallet"
  ON ghost_wallets FOR INSERT
  WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own wallet"
  ON ghost_wallets FOR UPDATE
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ============================================
-- 4. WALLET_TRANSACTIONS TABLE
-- Transaction history for Ghost Wallets
-- ============================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES ghost_wallets(id) ON DELETE CASCADE NOT NULL,
  tx_hash TEXT NOT NULL UNIQUE,
  chain_id INTEGER NOT NULL, -- 1=Ethereum, 137=Polygon, 56=BSC
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount TEXT NOT NULL, -- Store as string to avoid precision loss
  token_symbol TEXT DEFAULT 'ETH',
  token_address TEXT, -- NULL for native tokens
  status TEXT CHECK (status IN ('pending', 'confirmed', 'failed')) DEFAULT 'pending',
  block_number BIGINT,
  gas_used TEXT,
  gas_price TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

-- Row Level Security
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON wallet_transactions FOR SELECT
  USING (wallet_id IN (
    SELECT id FROM ghost_wallets 
    WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  ));

CREATE POLICY "Users can insert own transactions"
  ON wallet_transactions FOR INSERT
  WITH CHECK (wallet_id IN (
    SELECT id FROM ghost_wallets 
    WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  ));

-- ============================================
-- 5. KYC_AUDIT_LOGS TABLE
-- Compliance audit trail (7-year retention)
-- ============================================
CREATE TABLE IF NOT EXISTS kyc_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL, -- 'kyc_submitted', 'kyc_approved', 'kyc_rejected', 'document_uploaded'
  actor_id UUID REFERENCES auth.users(id), -- Admin who performed action (NULL for user actions)
  metadata JSONB, -- Additional context (IP address, device info, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (Admin only)
ALTER TABLE kyc_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs"
  ON kyc_audit_logs FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "System can insert audit logs"
  ON kyc_audit_logs FOR INSERT
  WITH CHECK (true); -- Allow system to insert logs

-- ============================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_kyc_status ON profiles(kyc_status);
CREATE INDEX idx_passport_profile_id ON passport_data(profile_id);
CREATE INDEX idx_passport_expiry_date ON passport_data(expiry_date);
CREATE INDEX idx_wallets_profile_id ON ghost_wallets(profile_id);
CREATE INDEX idx_wallets_public_address ON ghost_wallets(public_address);
CREATE INDEX idx_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX idx_transactions_status ON wallet_transactions(status);
CREATE INDEX idx_transactions_created_at ON wallet_transactions(created_at DESC);
CREATE INDEX idx_audit_logs_profile_id ON kyc_audit_logs(profile_id);
CREATE INDEX idx_audit_logs_created_at ON kyc_audit_logs(created_at DESC);

-- ============================================
-- 7. FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_passport_data_updated_at
  BEFORE UPDATE ON passport_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ghost_wallets_updated_at
  BEFORE UPDATE ON ghost_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, kyc_status)
  VALUES (NEW.id, 'pending');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 8. STORAGE BUCKETS (for Supabase Storage)
-- ============================================
-- Run these commands in Supabase Dashboard > Storage

-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('passport-images', 'passport-images', false);

-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('kyc-documents', 'kyc-documents', false);

-- ============================================
-- 9. SAMPLE DATA (Development Only)
-- ============================================
-- Uncomment for local development testing

-- INSERT INTO profiles (user_id, kyc_status) VALUES
-- ('00000000-0000-0000-0000-000000000001'::uuid, 'verified');

-- ============================================
-- END OF SCHEMA
-- ============================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
