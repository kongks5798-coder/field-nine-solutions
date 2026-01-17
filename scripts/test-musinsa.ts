/**
 * 무신사 파트너센터 스크래퍼 테스트
 *
 * 첫 실행: 브라우저가 열리고 OTP 입력 필요
 * 이후: 세션이 유효하면 자동 로그인
 *
 * 실행: npx tsx scripts/test-musinsa.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { MusinsaScraper, type MusinsaDashboardData } from '../lib/musinsa/scraper';

// .env.local 로드
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

function printDashboard(data: MusinsaDashboardData) {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║          📊 무신사 파트너센터 대시보드                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log(`🏷️  브랜드: ${data.brandName}`);
  console.log(`📅 수집 시간: ${new Date(data.scrapedAt).toLocaleString('ko-KR')}`);
  console.log(`🔐 세션 상태: ${data.sessionValid ? '✅ 유효' : '❌ 만료'}`);

  console.log('\n┌──────────────────────────────────────────────────────────────┐');
  console.log('│ ⚡ 긴급 처리 필요                                            │');
  console.log('├──────────────────────────────────────────────────────────────┤');
  console.log(`│   빠른 출고 필요: ${String(data.urgentShipping).padStart(6)}건                                │`);
  console.log(`│   클레임 대응:    ${String(data.urgentClaims).padStart(6)}건                                │`);
  if (data.penaltyAmount > 0) {
    console.log(`│   예상 페널티:    ${String(data.penaltyAmount.toLocaleString()).padStart(10)}원                        │`);
  }
  console.log('└──────────────────────────────────────────────────────────────┘');

  console.log('\n┌──────────────────────────────────────────────────────────────┐');
  console.log('│ 📦 국내 주문 현황 (최근 한 달)                                │');
  console.log('├──────────────────────────────────────────────────────────────┤');
  console.log(`│   결제완료:   ${String(data.domesticOrders.paymentComplete).padStart(6)}건    상품준비중: ${String(data.domesticOrders.preparing).padStart(6)}건       │`);
  console.log(`│   배송중:     ${String(data.domesticOrders.shipping).padStart(6)}건    배송완료:   ${String(data.domesticOrders.delivered).padStart(6)}건       │`);
  console.log(`│   구매확정:   ${String(data.domesticOrders.confirmed).padStart(6)}건                              │`);
  console.log('└──────────────────────────────────────────────────────────────┘');

  console.log('\n┌──────────────────────────────────────────────────────────────┐');
  console.log('│ 🌍 글로벌 주문 현황                                           │');
  console.log('├──────────────────────────────────────────────────────────────┤');
  console.log(`│   출고요청:   ${String(data.globalOrders.shipmentRequest).padStart(6)}건    출고처리중: ${String(data.globalOrders.processing).padStart(6)}건       │`);
  console.log(`│   출고완료:   ${String(data.globalOrders.shipped).padStart(6)}건    배송시작:   ${String(data.globalOrders.inTransit).padStart(6)}건       │`);
  console.log(`│   배송완료:   ${String(data.globalOrders.delivered).padStart(6)}건                              │`);
  console.log('└──────────────────────────────────────────────────────────────┘');

  console.log('\n┌──────────────────────────────────────────────────────────────┐');
  console.log('│ 🛍️  상품 현황                                                 │');
  console.log('├──────────────────────────────────────────────────────────────┤');
  console.log(`│   판매중:     ${String(data.products.onSale).padStart(6)}건    등록중:     ${String(data.products.registering).padStart(6)}건       │`);
  console.log(`│   품절:       ${String(data.products.soldOut).padStart(6)}건    판매중단:   ${String(data.products.suspended).padStart(6)}건       │`);
  console.log(`│   전체:       ${String(data.products.total).padStart(6)}건                              │`);
  console.log('└──────────────────────────────────────────────────────────────┘');

  console.log('\n┌──────────────────────────────────────────────────────────────┐');
  console.log('│ 🔄 환불/교환 현황                                             │');
  console.log('├──────────────────────────────────────────────────────────────┤');
  console.log(`│   환불 요청:  ${String(data.claims.refundRequest).padStart(6)}건    환불 처리중: ${String(data.claims.refundProcessing).padStart(5)}건       │`);
  console.log(`│   교환 요청:  ${String(data.claims.exchangeRequest).padStart(6)}건    교환 처리중: ${String(data.claims.exchangeProcessing).padStart(5)}건       │`);
  console.log('└──────────────────────────────────────────────────────────────┘');
}

async function main() {
  console.log('\n========================================');
  console.log('  무신사 파트너센터 스크래퍼 테스트');
  console.log('  Field Nine - PANOPTICON');
  console.log('========================================\n');

  const id = process.env.MUSINSA_ID;
  const pw = process.env.MUSINSA_PW;

  if (!id || !pw) {
    console.log('❌ MUSINSA_ID 또는 MUSINSA_PW가 설정되지 않았습니다.');
    return;
  }

  console.log(`🔑 로그인 ID: ${id}`);

  const scraper = new MusinsaScraper();

  try {
    // 브라우저 초기화 (headless: false = 브라우저 표시)
    await scraper.initialize(false);

    // 로그인 (세션 유효하면 자동, 아니면 OTP 입력 대기)
    console.log('\n📱 첫 로그인 시 OTP 입력이 필요합니다.');
    console.log('   브라우저에서 OTP를 입력해주세요!\n');

    const loginSuccess = await scraper.login(id, pw, true);

    if (!loginSuccess) {
      console.log('\n❌ 로그인 실패');
      await scraper.takeScreenshot('musinsa-login-failed.png');
      return;
    }

    // 대시보드 데이터 수집
    const data = await scraper.scrapeDashboard();

    if (data) {
      printDashboard(data);
      await scraper.takeScreenshot('musinsa-dashboard.png');

      console.log('\n========================================');
      console.log('  ✅ 테스트 완료!');
      console.log('  💾 세션이 저장되었습니다.');
      console.log('  다음 실행 시 OTP 없이 자동 로그인됩니다.');
      console.log('========================================\n');
    } else {
      console.log('\n❌ 데이터 수집 실패');
      await scraper.takeScreenshot('musinsa-error.png');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    // 결과 확인 후 종료
    console.log('\n⏳ 5초 후 브라우저 종료...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await scraper.close();
  }
}

main().catch(console.error);
