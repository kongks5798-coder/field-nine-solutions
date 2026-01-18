/**
 * Supabase DB Setup Script
 * 테이블 확인 및 초기 데이터 삽입
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env
config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable(tableName) {
  const { error } = await supabase.from(tableName).select('id').limit(1);
  if (error?.code === '42P01') return false; // table doesn't exist
  if (error?.code === 'PGRST116') return true; // table exists but no rows
  return !error;
}

async function setupDatabase() {
  console.log('🚀 Checking Supabase tables...\n');

  // 1. Check early_access table
  console.log('📋 Checking early_access table...');
  if (await checkTable('early_access')) {
    console.log('   ✅ early_access table exists');
  } else {
    console.log('   ❌ early_access table NOT FOUND - needs manual creation');
  }

  // 2. Check reviews table
  console.log('📋 Checking reviews table...');
  const reviewsExists = await checkTable('reviews');

  if (reviewsExists) {
    console.log('   ✅ reviews table exists');

    // Check if data exists
    const { count } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true });

    if (count === 0) {
      console.log('   Inserting initial review data...');

      const koReviews = [
        { name: '김지현', country: 'KR', rating: 5, comment: '일본 여행 갔을 때 eSIM으로 데이터 걱정 없이 다녔어요. 공항에서 바로 활성화되고 속도도 빨라서 만족!', service: 'esim', locale: 'ko', is_featured: true, is_verified: true },
        { name: '박민수', country: 'KR', rating: 5, comment: '환율 알림 기능 덕분에 가장 좋은 타이밍에 환전했어요. 10만원 정도 아꼈습니다.', service: 'exchange', locale: 'ko', is_featured: true, is_verified: true },
        { name: '이수진', country: 'KR', rating: 4, comment: 'AI 번역이 생각보다 정확해서 놀랐어요. 현지인이랑 대화할 때 많이 도움됐습니다.', service: 'ai', locale: 'ko', is_featured: true, is_verified: true },
        { name: '최영호', country: 'KR', rating: 5, comment: '태국 여행 2주 동안 무제한 데이터 쓰고 50% 절약했어요. 다음에도 무조건 쓸 예정!', service: 'esim', locale: 'ko', is_featured: true, is_verified: true },
        { name: '정하나', country: 'KR', rating: 5, comment: '베트남에서 그랩 대신 현지 택시 앱 쓸 때 실시간 번역으로 기사님이랑 소통했어요. 완전 편함!', service: 'ai', locale: 'ko', is_featured: true, is_verified: true },
        { name: '강동현', country: 'KR', rating: 4, comment: '유럽 5개국 여행하면서 하나의 eSIM으로 해결. 국가 이동할 때마다 자동 연결되니 너무 좋아요.', service: 'esim', locale: 'ko', is_featured: false, is_verified: true },
      ];

      const enReviews = [
        { name: 'Mike Johnson', country: 'US', rating: 5, comment: 'Best eSIM experience in Korea! Activated instantly at Incheon and had 5G speeds everywhere.', service: 'esim', locale: 'en', is_featured: true, is_verified: true },
        { name: 'Sarah Chen', country: 'CA', rating: 5, comment: 'The exchange rate alerts saved me so much money. Got KRW at the perfect rate!', service: 'exchange', locale: 'en', is_featured: true, is_verified: true },
        { name: 'James Williams', country: 'GB', rating: 4, comment: 'AI translation helped me order food at local restaurants. Game changer for solo travelers.', service: 'ai', locale: 'en', is_featured: true, is_verified: true },
        { name: 'Emma Martinez', country: 'AU', rating: 5, comment: 'Used it for my 3-week Korea trip. Unlimited data + AI assistant = perfect combo!', service: 'esim', locale: 'en', is_featured: true, is_verified: true },
        { name: 'David Lee', country: 'SG', rating: 5, comment: 'Finally an app that understands what tourists actually need. The AI recommendations were spot-on.', service: 'ai', locale: 'en', is_featured: true, is_verified: true },
        { name: 'Lisa Park', country: 'US', rating: 4, comment: 'Coming back to Korea after 10 years. This app made everything so much easier than before.', service: 'general', locale: 'en', is_featured: false, is_verified: true },
      ];

      const { error: insertError } = await supabase
        .from('reviews')
        .insert([...koReviews, ...enReviews]);

      if (insertError) {
        console.log('   ⚠️ Insert error:', insertError.message);
      } else {
        console.log('   ✅ Inserted 12 reviews');
      }
    } else {
      console.log(`   ✅ ${count} reviews already exist`);
    }
  } else {
    console.log('   ❌ reviews table NOT FOUND - needs manual creation');
  }

  // 3. Check ab_tests table
  console.log('📋 Checking ab_tests table...');
  if (await checkTable('ab_tests')) {
    console.log('   ✅ ab_tests table exists');
  } else {
    console.log('   ❌ ab_tests table NOT FOUND - needs manual creation');
  }

  console.log('\n' + '='.repeat(60));
  console.log('📝 If any table is missing, run this SQL in Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard/project/cmgonohqgdjifizpaucx/sql/new');
  console.log('   File: supabase/migrations/001_landing_tables.sql');
  console.log('='.repeat(60) + '\n');
}

setupDatabase().catch(console.error);
