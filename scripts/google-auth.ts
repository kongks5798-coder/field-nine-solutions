/**
 * Google OAuth 2.0 - 최초 1회 인증 스크립트
 *
 * 실행: npx tsx scripts/google-auth.ts
 */

import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// 파일 경로 설정
const CREDENTIALS_PATH = path.join(process.cwd(), 'client_secret_978313968800-gf2vfh4rdinkj4o1ffpbjo107sam7g0g.apps.googleusercontent.com.json');
const TOKEN_PATH = path.join(process.cwd(), 'token.json');

// 기존 설정된 Redirect URI 사용
const REDIRECT_URI = 'http://localhost';

// Google API 권한 범위
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/youtube.readonly',
];

interface Credentials {
  installed: {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
  };
}

async function main() {
  console.log('\n========================================');
  console.log('  Google OAuth 2.0 인증 설정');
  console.log('  Field Nine - PANOPTICON');
  console.log('========================================\n');

  // 1. Credentials 파일 읽기
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error('❌ OAuth credentials 파일을 찾을 수 없습니다.');
    process.exit(1);
  }

  const credentials: Credentials = JSON.parse(
    fs.readFileSync(CREDENTIALS_PATH, 'utf-8')
  );

  console.log('✅ Credentials 파일 로드 완료\n');

  // 2. OAuth2 클라이언트 생성
  const { client_id, client_secret } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    REDIRECT_URI
  );

  // 3. 인증 URL 생성 (scope를 +로 연결)
  const scopeString = SCOPES.join(' ');
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${client_id}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scopeString)}&` +
    `access_type=offline&` +
    `prompt=consent`;

  console.log('📋 아래 URL을 복사해서 브라우저에 붙여넣으세요:\n');
  console.log('----------------------------------------');
  console.log(authUrl);
  console.log('----------------------------------------\n');

  // URL을 클립보드에 복사 (Windows)
  try {
    const { execSync } = await import('child_process');
    execSync(`echo ${authUrl} | clip`, { shell: 'cmd.exe' });
    console.log('✅ URL이 클립보드에 복사되었습니다!\n');
  } catch {
    console.log('💡 위 URL을 직접 복사해서 브라우저에 붙여넣으세요.\n');
  }

  console.log('========================================');
  console.log('  로그인 후 리다이렉트된 URL 전체를 복사하세요');
  console.log('========================================\n');
  console.log('예시: http://localhost/?code=4/0AXXXX...&scope=...\n');

  const redirectedUrl = await askQuestion('리다이렉트된 URL 전체를 붙여넣으세요: ');

  // URL에서 code 추출
  let code = '';
  try {
    const url = new URL(redirectedUrl.trim());
    code = url.searchParams.get('code') || '';
  } catch {
    // URL 파싱 실패시 code= 뒤의 값 직접 추출
    const match = redirectedUrl.match(/code=([^&]+)/);
    if (match) {
      code = decodeURIComponent(match[1]);
    }
  }

  if (!code) {
    console.error('\n❌ 인증 코드를 찾을 수 없습니다.');
    console.error('   URL에 "code=" 파라미터가 있는지 확인하세요.');
    process.exit(1);
  }

  console.log('\n🔄 토큰 교환 중...');

  try {
    const { tokens } = await oAuth2Client.getToken(code);

    // 토큰 저장
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

    console.log('\n========================================');
    console.log('  ✅ 인증 완료!');
    console.log('========================================\n');
    console.log(`📁 토큰 저장 위치: ${TOKEN_PATH}`);
    console.log(`   - Access Token: ${tokens.access_token?.substring(0, 30)}...`);
    console.log(`   - Refresh Token: ${tokens.refresh_token ? '✅ 발급됨' : '❌ 없음'}`);
    console.log('\n🎉 이제 Google API를 사용할 준비가 되었습니다!\n');

  } catch (error: any) {
    console.error('\n❌ 토큰 교환 실패:', error.message || error);
    process.exit(1);
  }
}

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

main().catch(console.error);
