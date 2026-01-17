import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { getSheets } from '../lib/google/client';

const REQUIRED_SHEETS = ['주문현황', '클레임현황', '상품현황', '목표설정'];
const HEADERS: Record<string, string[]> = {
  '주문현황': ['날짜', '결제완료', '상품준비', '배송중', '배송완료', '구매확정', '긴급출고'],
  '클레임현황': ['날짜', '환불요청', '환불완료', '교환요청', '교환완료', '긴급처리'],
  '상품현황': ['날짜', '판매중', '품절', '판매중지', '전체'],
  '목표설정': ['월', '매출목표', '주문목표', '현재매출', '현재주문', '메모'],
};

async function main() {
  const spreadsheetId = process.env.GOOGLE_SALES_SPREADSHEET_ID!;
  console.log('🚀 PANOPTICON 시트 생성 시작\n');

  const sheets = await getSheets();

  // 기존 시트 확인
  const response = await sheets.spreadsheets.get({ spreadsheetId });
  const existingSheets = response.data.sheets?.map(s => s.properties?.title) || [];
  console.log('기존 시트:', existingSheets.join(', '));

  for (const sheetName of REQUIRED_SHEETS) {
    if (existingSheets.includes(sheetName)) {
      console.log(`✅ "${sheetName}" 이미 존재`);
      continue;
    }

    console.log(`📝 "${sheetName}" 생성 중...`);
    try {
      // 시트 생성
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: { properties: { title: sheetName } }
          }]
        }
      });

      // 헤더 추가
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [HEADERS[sheetName]] }
      });

      console.log(`   ✅ "${sheetName}" 생성 완료`);
    } catch (error: any) {
      console.error(`   ❌ 오류: ${error.message}`);
    }
  }

  // 샘플 데이터 입력
  const today = new Date().toISOString().split('T')[0];
  console.log(`\n📊 샘플 데이터 입력 (${today})...`);

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: '주문현황!A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[today, 5, 3, 8, 12, 10, 1]] }
    });
    console.log('   ✅ 주문현황 데이터 입력');

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: '클레임현황!A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[today, 2, 1, 1, 0, 1]] }
    });
    console.log('   ✅ 클레임현황 데이터 입력');

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: '상품현황!A:E',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[today, 150, 8, 2, 160]] }
    });
    console.log('   ✅ 상품현황 데이터 입력');

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: '목표설정!A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [['2026-01', 50000000, 500, 15000000, 150, '1월 목표']] }
    });
    console.log('   ✅ 목표설정 데이터 입력');
  } catch (error: any) {
    console.error('   ❌ 데이터 입력 오류:', error.message);
  }

  console.log('\n🎉 완료! 스프레드시트를 확인하세요.');
  console.log(`   https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
}

main().catch(console.error);
