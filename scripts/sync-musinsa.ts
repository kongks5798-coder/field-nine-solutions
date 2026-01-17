/**
 * 무신사 데이터 동기화 스크립트
 *
 * 세션이 유효하면 데이터를 스크래핑하여 캐시에 저장
 * 크론잡 또는 수동으로 실행
 *
 * 실행: npx tsx scripts/sync-musinsa.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { MusinsaScraper, type MusinsaDashboardData } from '../lib/musinsa/scraper';

// .env.local 로드
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const CACHE_FILE = path.join(process.cwd(), '.musinsa-cache.json');

function saveCache(data: MusinsaDashboardData) {
  const cacheData = {
    data,
    cachedAt: new Date().toISOString(),
  };
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2));
  console.log('✅ 캐시 저장 완료:', CACHE_FILE);
}

async function main() {
  console.log('\n========================================');
  console.log('  무신사 데이터 동기화');
  console.log('  Field Nine - PANOPTICON');
  console.log('========================================\n');

  const id = process.env.MUSINSA_ID;
  const pw = process.env.MUSINSA_PW;

  if (!id || !pw) {
    console.log('❌ MUSINSA_ID 또는 MUSINSA_PW가 설정되지 않았습니다.');
    process.exit(1);
  }

  const scraper = new MusinsaScraper();

  try {
    // Headless 모드로 브라우저 초기화
    await scraper.initialize(true);

    // 로그인 시도 (OTP 대기 없음)
    const loginSuccess = await scraper.login(id, pw, false);

    if (!loginSuccess) {
      console.log('❌ 세션 만료 - OTP 로그인 필요');
      console.log('   npx tsx scripts/test-musinsa.ts 실행하세요');
      process.exit(1);
    }

    console.log('✅ 세션 유효 - 데이터 수집 중...');

    // 대시보드 데이터 수집
    const data = await scraper.scrapeDashboard();

    if (data) {
      // 매출 데이터도 수집
      console.log('💰 매출 데이터 수집 중...');
      const salesData = await scraper.scrapeSales();
      if (salesData) {
        data.sales = salesData;
        console.log('✅ 매출 데이터 수집 완료');
      }

      saveCache(data);
      console.log('\n📊 수집된 데이터:');
      console.log(`   - 긴급 출고: ${data.urgentShipping}건`);
      console.log(`   - 클레임 대응: ${data.urgentClaims}건`);
      console.log(`   - 국내 주문: ${data.domesticOrders.total}건`);
      console.log(`   - 상품: ${data.products.total}개`);
      if (data.sales) {
        console.log(`   - 오늘 매출: ${data.sales.today.grossSales.toLocaleString()}원 (추정)`);
        console.log(`   - 이번 달: ${data.sales.month.grossSales.toLocaleString()}원 (추정)`);
      }
    } else {
      console.log('❌ 데이터 수집 실패');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  } finally {
    await scraper.close();
  }

  console.log('\n========================================');
  console.log('  ✅ 동기화 완료!');
  console.log('========================================\n');
}

main();
