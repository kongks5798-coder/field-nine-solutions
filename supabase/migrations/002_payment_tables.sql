-- =============================================
-- K-Universal 결제 시스템 테이블
-- 실행: Supabase Dashboard > SQL Editor
-- =============================================

-- 1. 유저 지갑 테이블
CREATE TABLE IF NOT EXISTS user_wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance BIGINT DEFAULT 0 NOT NULL,
  currency VARCHAR(3) DEFAULT 'KRW' NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. 결제 트랜잭션 테이블
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_key VARCHAR(255) NOT NULL UNIQUE,
  order_id VARCHAR(255) NOT NULL UNIQUE,
  amount BIGINT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'DONE',
  method VARCHAR(50) NOT NULL,
  card_company VARCHAR(100),
  card_number VARCHAR(20),
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at DESC);

-- 4. RLS (Row Level Security) 정책
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- 유저는 자신의 지갑만 조회 가능
CREATE POLICY "Users can view own wallet" ON user_wallets
  FOR SELECT USING (auth.uid() = user_id);

-- 유저는 자신의 결제 기록만 조회 가능
CREATE POLICY "Users can view own payments" ON payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- 서비스 역할은 모든 작업 가능 (API에서 service_role 키 사용)
CREATE POLICY "Service role full access wallets" ON user_wallets
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access payments" ON payment_transactions
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- 5. 지갑 잔액 업데이트 트리거
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- 결제 성공 시 지갑 잔액 증가
  IF NEW.status = 'DONE' THEN
    INSERT INTO user_wallets (user_id, balance, currency)
    VALUES (NEW.user_id, NEW.amount, 'KRW')
    ON CONFLICT (user_id)
    DO UPDATE SET
      balance = user_wallets.balance + NEW.amount,
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 연결
DROP TRIGGER IF EXISTS trigger_update_wallet_balance ON payment_transactions;
CREATE TRIGGER trigger_update_wallet_balance
  AFTER INSERT ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_balance();

-- 6. updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_wallets_updated_at ON user_wallets;
CREATE TRIGGER trigger_user_wallets_updated_at
  BEFORE UPDATE ON user_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================
-- 실행 완료 확인
-- =============================================
SELECT 'Payment tables created successfully!' as status;
