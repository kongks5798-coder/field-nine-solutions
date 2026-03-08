-- TossPayments 자동결제(빌링키) 저장 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS toss_billing_key TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS toss_customer_key TEXT;
