/**
 * 영업부 매출 시트 읽기
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { google } from 'googleapis';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function main() {
  const tokens = JSON.parse(fs.readFileSync('token.json', 'utf-8'));
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials(tokens);

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

  // 25.12월_마감정산_영업부 시트 읽기
  const SHEET_ID = '1tnzbQt_L-DwTx_PFA_oKOaQv8vzwWXDCei8UDtBCjW8';

  try {
    // 시트 정보 가져오기
    const info = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
    console.log('=== 시트 목록 ===');
    for (const sheet of info.data.sheets || []) {
      console.log('- ' + sheet.properties?.title);
    }

    // 첫번째 시트 데이터 읽기
    const firstSheet = info.data.sheets?.[0]?.properties?.title || 'Sheet1';
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: firstSheet + '!A1:Z30'
    });

    console.log('\n=== ' + firstSheet + ' 데이터 (상위 30행) ===\n');
    for (const row of res.data.values || []) {
      console.log(row.slice(0, 10).join(' | '));
    }
  } catch (error) {
    console.error('에러:', error);
  }
}

main();
