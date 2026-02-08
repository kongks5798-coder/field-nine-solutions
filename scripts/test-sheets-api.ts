import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { getSheets, isAuthenticated } from '../lib/google/client';

async function test() {
  console.log('🔍 Google Sheets API 테스트\n');
  console.log('1. 인증 상태:', isAuthenticated() ? '✅ 인증됨' : '❌ 인증 안됨');
  console.log('2. 스프레드시트 ID:', process.env.GOOGLE_SALES_SPREADSHEET_ID);

  if (!isAuthenticated()) {
    console.log('\n❌ 먼저 Google 인증을 진행하세요: npx tsx scripts/google-auth.ts');
    return;
  }

  try {
    console.log('\n3. Sheets API 연결 중...');
    const sheets = await getSheets();

    console.log('4. 스프레드시트 정보 조회 중...');
    const response = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SALES_SPREADSHEET_ID,
    });

    console.log('\n✅ 스프레드시트 접근 성공!');
    console.log('   제목:', response.data.properties?.title);
    console.log('   시트 목록:', response.data.sheets?.map(s => s.properties?.title).join(', '));
  } catch (error: any) {
    console.error('\n❌ API 오류:', error.message);
    if (error.code === 404) {
      console.log('   → 스프레드시트를 찾을 수 없습니다. ID를 확인하세요.');
    } else if (error.code === 403) {
      console.log('   → 접근 권한이 없습니다. 스프레드시트 공유 설정을 확인하세요.');
    }
  }
}

test();
