/**
 * Google Sheets 초기 설정 스크립트
 * PANOPTICON 대시보드용 시트들을 자동 생성합니다.
 *
 * 실행: npx tsx scripts/setup-sheets.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// .env.local 로드
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { ensureSheetsExist, appendOrderStatus, appendClaimStatus, appendProductStatus } from '../lib/google/operations-data';

async function main() {
  console.log('🚀 Google Sheets 초기 설정 시작...\n');

  // 환경변수 확인
  const spreadsheetId = process.env.GOOGLE_SALES_SPREADSHEET_ID;
  console.log('📋 스프레드시트 ID:', spreadsheetId || '(없음)');

  if (!spreadsheetId) {
    console.error('❌ GOOGLE_SALES_SPREADSHEET_ID 환경변수가 설정되지 않았습니다.');
    process.exit(1);
  }

  // 1. 시트 생성
  console.log('\n📊 시트 생성 중...');
  try {
    const result = await ensureSheetsExist();

    if (!result.success) {
      console.error('❌ 시트 생성 실패.');
      process.exit(1);
    }

    console.log(`✅ 생성된 시트: ${result.created.length > 0 ? result.created.join(', ') : '없음'}`);
    console.log(`📋 기존 시트: ${result.existing.length > 0 ? result.existing.join(', ') : '없음'}\n`);
  } catch (error) {
    console.error('❌ 시트 생성 중 오류:', error);
    process.exit(1);
  }

  // 2. 오늘 날짜의 샘플 데이터 입력
  const today = new Date().toISOString().split('T')[0];
  console.log(`📝 샘플 데이터 입력 중 (${today})...`);

  try {
    // 주문현황 샘플
    await appendOrderStatus({
      date: today,
      paymentComplete: 5,
      preparing: 3,
      shipping: 8,
      delivered: 12,
      confirmed: 10,
      urgentShipping: 1,
    });
    console.log('  ✅ 주문현황 샘플 데이터 입력 완료');

    // 클레임현황 샘플
    await appendClaimStatus({
      date: today,
      refundRequest: 2,
      refundComplete: 1,
      exchangeRequest: 1,
      exchangeComplete: 0,
      urgentClaims: 1,
    });
    console.log('  ✅ 클레임현황 샘플 데이터 입력 완료');

    // 상품현황 샘플
    await appendProductStatus({
      date: today,
      onSale: 150,
      soldOut: 8,
      suspended: 2,
      total: 160,
    });
    console.log('  ✅ 상품현황 샘플 데이터 입력 완료');

  } catch (error) {
    console.error('❌ 샘플 데이터 입력 실패:', error);
  }

  console.log('\n🎉 설정 완료!');
  console.log('📌 스프레드시트에서 데이터를 확인하세요:');
  console.log(`   https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SALES_SPREADSHEET_ID}`);
  console.log('\n💡 PANOPTICON 대시보드에서 실제 데이터가 표시됩니다.');
}

main().catch(console.error);
