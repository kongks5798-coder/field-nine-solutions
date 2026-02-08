-- =============================================
-- KAUS Exchange 시스템 테이블
-- PHASE 72: Production-Grade User Authentication
-- 실행: Supabase Dashboard > SQL Editor
-- =============================================

-- 1. user_wallets 테이블에 KAUS/kWh 컬럼 추가
ALTER TABLE user_wallets
ADD COLUMN IF NOT EXISTS kaus_balance NUMERIC(20,6) DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS kwh_balance NUMERIC(20,6) DEFAULT 0 NOT NULL;

-- 2. KAUS 거래 기록 테이블
CREATE TABLE IF NOT EXISTS kaus_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id VARCHAR(50) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('EXCHANGE', 'TRANSFER', 'REWARD', 'WITHDRAWAL', 'DEPOSIT')),
  from_type VARCHAR(10) NOT NULL CHECK (from_type IN ('KWH', 'KAUS', 'USD', 'KRW')),
  from_amount NUMERIC(20,6) NOT NULL,
  to_type VARCHAR(10) NOT NULL CHECK (to_type IN ('KWH', 'KAUS', 'USD', 'KRW')),
  to_amount NUMERIC(20,6) NOT NULL,
  fee NUMERIC(20,6) DEFAULT 0,
  multiplier NUMERIC(6,4) DEFAULT 1.00,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_kaus_transactions_user_id ON kaus_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_kaus_transactions_type ON kaus_transactions(type);
CREATE INDEX IF NOT EXISTS idx_kaus_transactions_status ON kaus_transactions(status);
CREATE INDEX IF NOT EXISTS idx_kaus_transactions_created_at ON kaus_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kaus_transactions_transaction_id ON kaus_transactions(transaction_id);

-- 4. RLS (Row Level Security) 정책
ALTER TABLE kaus_transactions ENABLE ROW LEVEL SECURITY;

-- 유저는 자신의 거래만 조회 가능
CREATE POLICY "Users can view own kaus transactions" ON kaus_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- 유저는 자신의 거래만 삽입 가능
CREATE POLICY "Users can insert own kaus transactions" ON kaus_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_wallets 업데이트 정책 (기존에 없으면 추가)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_wallets' AND policyname = 'Users can update own wallet'
  ) THEN
    CREATE POLICY "Users can update own wallet" ON user_wallets
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- user_wallets 삽입 정책 (신규 사용자 지갑 생성용)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_wallets' AND policyname = 'Users can insert own wallet'
  ) THEN
    CREATE POLICY "Users can insert own wallet" ON user_wallets
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 5. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_kaus_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_kaus_transactions_updated_at ON kaus_transactions;
CREATE TRIGGER trigger_kaus_transactions_updated_at
  BEFORE UPDATE ON kaus_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_kaus_transactions_updated_at();

-- =============================================
-- 실행 완료 확인
-- =============================================
SELECT 'KAUS Exchange schema created successfully!' as status;
