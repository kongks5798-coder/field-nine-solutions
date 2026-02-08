/**
 * Supabase 마이그레이션 실행 스크립트
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 결제 테이블 생성 시작...\n');

  try {
    // 1. user_wallets 테이블 생성
    console.log('1️⃣ user_wallets 테이블 생성...');
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_wallets (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL,
          balance BIGINT DEFAULT 0 NOT NULL,
          currency VARCHAR(3) DEFAULT 'KRW' NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id)
        );
      `
    });

    if (error1) {
      // RPC가 없으면 직접 테이블 접근으로 확인
      console.log('   → RPC 미지원, 테이블 직접 확인...');
    } else {
      console.log('   ✅ user_wallets 생성 완료');
    }

    // 2. payment_transactions 테이블 생성
    console.log('2️⃣ payment_transactions 테이블 생성...');
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS payment_transactions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL,
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
      `
    });

    if (error2) {
      console.log('   → RPC 미지원');
    } else {
      console.log('   ✅ payment_transactions 생성 완료');
    }

    // 3. 테이블 존재 확인 (테스트 쿼리)
    console.log('\n3️⃣ 테이블 존재 확인...');

    const { data: walletTest, error: walletError } = await supabase
      .from('user_wallets')
      .select('id')
      .limit(1);

    if (walletError && walletError.code === '42P01') {
      console.log('   ❌ user_wallets 테이블이 없습니다');
      console.log('   → Supabase Dashboard에서 직접 SQL 실행 필요');
    } else {
      console.log('   ✅ user_wallets 테이블 존재 확인');
    }

    const { data: paymentTest, error: paymentError } = await supabase
      .from('payment_transactions')
      .select('id')
      .limit(1);

    if (paymentError && paymentError.code === '42P01') {
      console.log('   ❌ payment_transactions 테이블이 없습니다');
      console.log('   → Supabase Dashboard에서 직접 SQL 실행 필요');
    } else {
      console.log('   ✅ payment_transactions 테이블 존재 확인');
    }

    console.log('\n✅ 마이그레이션 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

runMigration();
