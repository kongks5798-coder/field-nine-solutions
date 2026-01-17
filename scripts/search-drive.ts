/**
 * Google Drive 파일 검색 스크립트
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { google } from 'googleapis';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function main() {
  // 토큰 로드
  const tokenPath = path.join(process.cwd(), 'token.json');
  const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/api/auth/callback/google'
  );
  oauth2Client.setCredentials(tokens);

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  // 영업부 관련 폴더/파일 검색
  console.log('=== 영업부 / 매출 관련 파일 검색 ===\n');
  const salesRes = await drive.files.list({
    q: "name contains '영업' or name contains '매출' or name contains 'sales' or name contains '정산' or name contains '실적'",
    fields: 'files(id, name, mimeType, modifiedTime)',
    pageSize: 30,
    orderBy: 'modifiedTime desc'
  });

  for (const file of salesRes.data.files || []) {
    const type = file.mimeType?.includes('spreadsheet') ? '📊' : file.mimeType?.includes('folder') ? '📁' : '📄';
    console.log(type + ' ' + file.name);
    console.log('   ID: ' + file.id);
    console.log('   수정: ' + file.modifiedTime);
    console.log('');
  }

  // 폴더 목록
  console.log('\n=== 공유 드라이브 / 폴더 목록 ===\n');
  const foldersRes = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.folder'",
    fields: 'files(id, name)',
    pageSize: 30,
    orderBy: 'name'
  });

  for (const folder of foldersRes.data.files || []) {
    console.log('📁 ' + folder.name);
    console.log('   ID: ' + folder.id);
  }

  // 최근 수정된 스프레드시트
  console.log('\n\n=== 최근 수정된 스프레드시트 (20개) ===\n');
  const sheetsRes = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.spreadsheet'",
    fields: 'files(id, name, modifiedTime)',
    pageSize: 20,
    orderBy: 'modifiedTime desc'
  });

  for (const file of sheetsRes.data.files || []) {
    console.log('📊 ' + file.name);
    console.log('   ID: ' + file.id);
    console.log('');
  }
}

main().catch(console.error);
