-- =============================================
-- K-Universal Database Schema
-- Supabase SQL Migration
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. PROFILES TABLE
-- 사용자 프로필 정보
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT,
  name TEXT,
  phone TEXT,
  avatar_url TEXT,
  kyc_status TEXT DEFAULT 'not_submitted' CHECK (kyc_status IN ('not_submitted', 'pending', 'verified', 'rejected')),
  kyc_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 2. WALLETS TABLE
-- 사용자 지갑 정보
-- =============================================
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance DECIMAL(15, 2) DEFAULT 0 CHECK (balance >= 0),
  currency TEXT DEFAULT 'KRW',
  has_virtual_card BOOLEAN DEFAULT FALSE,
  card_last_four TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for wallets
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 3. TRANSACTIONS TABLE
-- 거래 내역
-- =============================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('topup', 'payment', 'transfer_in', 'transfer_out', 'refund')),
  amount DECIMAL(15, 2) NOT NULL,
  currency TEXT DEFAULT 'KRW',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  description TEXT,
  merchant_name TEXT,
  merchant_category TEXT,
  reference_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_wallet_id ON public.transactions(wallet_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);

-- =============================================
-- 4. KYC_DATA TABLE
-- KYC 인증 데이터
-- =============================================
CREATE TABLE IF NOT EXISTS public.kyc_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  passport_number TEXT,
  full_name TEXT,
  nationality TEXT,
  date_of_birth DATE,
  expiry_date DATE,
  gender TEXT,
  document_type TEXT DEFAULT 'passport',
  document_image_url TEXT,
  raw_mrz TEXT,
  verification_score DECIMAL(3, 2),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for kyc_data
ALTER TABLE public.kyc_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own KYC data" ON public.kyc_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own KYC data" ON public.kyc_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own KYC data" ON public.kyc_data
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 5. FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER kyc_data_updated_at
  BEFORE UPDATE ON public.kyc_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- 6. AUTO-CREATE PROFILE & WALLET ON SIGNUP
-- 회원가입 시 자동으로 프로필과 지갑 생성
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  );

  -- Create wallet
  INSERT INTO public.wallets (user_id, balance, currency)
  VALUES (NEW.id, 0, 'KRW');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 7. WALLET BALANCE UPDATE FUNCTION
-- 지갑 잔액 업데이트 함수 (트랜잭션 기반)
-- =============================================
CREATE OR REPLACE FUNCTION public.update_wallet_balance(
  p_user_id UUID,
  p_amount DECIMAL,
  p_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_merchant_name TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_wallet_id UUID;
  v_current_balance DECIMAL;
  v_new_balance DECIMAL;
  v_transaction_id UUID;
BEGIN
  -- Get wallet
  SELECT id, balance INTO v_wallet_id, v_current_balance
  FROM public.wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  -- Calculate new balance
  IF p_type IN ('topup', 'transfer_in', 'refund') THEN
    v_new_balance := v_current_balance + p_amount;
  ELSE
    v_new_balance := v_current_balance - p_amount;
  END IF;

  -- Check for insufficient balance
  IF v_new_balance < 0 THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Update wallet balance
  UPDATE public.wallets
  SET balance = v_new_balance
  WHERE id = v_wallet_id;

  -- Create transaction record
  INSERT INTO public.transactions (
    wallet_id, user_id, type, amount, status, description, merchant_name
  )
  VALUES (
    v_wallet_id, p_user_id, p_type, p_amount, 'completed', p_description, p_merchant_name
  )
  RETURNING id INTO v_transaction_id;

  RETURN json_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 완료!
-- Supabase Dashboard > SQL Editor에서 실행하세요
-- =============================================
