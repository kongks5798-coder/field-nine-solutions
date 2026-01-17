import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

const CREDENTIALS_PATH = path.join(process.cwd(), 'client_secret_978313968800-gf2vfh4rdinkj4o1ffpbjo107sam7g0g.apps.googleusercontent.com.json');
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const REDIRECT_URI = 'http://localhost';

// 사용자가 제공한 코드
const CODE = '4/0ASc3gC24SxxRWH7yJHJvbbQj2TAgaF8ktCvHWhU0clXcYDKVTKOEc8RO2NXZkKiPUWL-MA';

async function main() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
  const { client_id, client_secret } = credentials.installed;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    REDIRECT_URI
  );

  console.log('🔄 토큰 교환 중...');

  try {
    const { tokens } = await oAuth2Client.getToken(CODE);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

    console.log('\n========================================');
    console.log('  ✅ 인증 완료!');
    console.log('========================================\n');
    console.log('📁 토큰 저장 위치:', TOKEN_PATH);
    console.log('   - Access Token:', tokens.access_token?.substring(0, 30) + '...');
    console.log('   - Refresh Token:', tokens.refresh_token ? '✅ 발급됨' : '❌ 없음');
    console.log('\n🎉 Google API 연동 준비 완료!\n');
  } catch (error: any) {
    console.error('❌ 토큰 교환 실패:', error.message);
  }
}

main();
