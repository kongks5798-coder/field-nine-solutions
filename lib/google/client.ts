/**
 * Google API Client Module
 *
 * token.json 파일을 로드하여 인증된 Google API 클라이언트를 제공합니다.
 * 토큰이 만료되면 자동으로 리프레시합니다.
 *
 * 사용법:
 *   import { getGoogleClient, getCalendar, getDrive, getGmail, getYouTube } from '@/lib/google/client';
 *
 *   const calendar = await getCalendar();
 *   const events = await calendar.events.list({ calendarId: 'primary' });
 */

import { google, Auth, calendar_v3, drive_v3, gmail_v1, youtube_v3, sheets_v4 } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

// 파일 경로 설정
const CREDENTIALS_PATH = path.join(process.cwd(), 'client_secret_978313968800-gf2vfh4rdinkj4o1ffpbjo107sam7g0g.apps.googleusercontent.com.json');
const TOKEN_PATH = path.join(process.cwd(), 'token.json');

interface Credentials {
  installed: {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
  };
}

interface TokenData {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

// 싱글톤 인스턴스
let oAuth2Client: Auth.OAuth2Client | null = null;

/**
 * OAuth2 클라이언트 인스턴스 가져오기 (싱글톤)
 */
export async function getGoogleClient(): Promise<Auth.OAuth2Client> {
  if (oAuth2Client) {
    return oAuth2Client;
  }

  // 1. Credentials 파일 확인
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error(
      `OAuth credentials 파일을 찾을 수 없습니다: ${CREDENTIALS_PATH}\n` +
      'Google Cloud Console에서 OAuth 2.0 클라이언트 ID를 생성하세요.'
    );
  }

  // 2. Token 파일 확인
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error(
      `Token 파일을 찾을 수 없습니다: ${TOKEN_PATH}\n` +
      '먼저 인증을 진행하세요: npx tsx scripts/google-auth.ts'
    );
  }

  // 3. Credentials 로드
  const credentials: Credentials = JSON.parse(
    fs.readFileSync(CREDENTIALS_PATH, 'utf-8')
  );

  // 4. OAuth2 클라이언트 생성
  const { client_id, client_secret, redirect_uris } = credentials.installed;
  oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // 5. Token 로드 및 설정
  const tokens: TokenData = JSON.parse(
    fs.readFileSync(TOKEN_PATH, 'utf-8')
  );
  oAuth2Client.setCredentials(tokens);

  // 6. 토큰 자동 리프레시 설정
  oAuth2Client.on('tokens', (newTokens) => {
    // 새 토큰이 발급되면 파일에 저장
    const updatedTokens = { ...tokens, ...newTokens };
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(updatedTokens, null, 2));
    console.log('[Google Client] 토큰이 자동으로 갱신되었습니다.');
  });

  return oAuth2Client;
}

/**
 * Google Calendar API 클라이언트
 */
export async function getCalendar(): Promise<calendar_v3.Calendar> {
  const auth = await getGoogleClient();
  return google.calendar({ version: 'v3', auth });
}

/**
 * Google Drive API 클라이언트
 */
export async function getDrive(): Promise<drive_v3.Drive> {
  const auth = await getGoogleClient();
  return google.drive({ version: 'v3', auth });
}

/**
 * Gmail API 클라이언트
 */
export async function getGmail(): Promise<gmail_v1.Gmail> {
  const auth = await getGoogleClient();
  return google.gmail({ version: 'v1', auth });
}

/**
 * YouTube API 클라이언트
 */
export async function getYouTube(): Promise<youtube_v3.Youtube> {
  const auth = await getGoogleClient();
  return google.youtube({ version: 'v3', auth });
}

/**
 * Google Sheets API 클라이언트
 */
export async function getSheets(): Promise<sheets_v4.Sheets> {
  const auth = await getGoogleClient();
  return google.sheets({ version: 'v4', auth });
}

/**
 * 인증 상태 확인
 */
export function isAuthenticated(): boolean {
  return fs.existsSync(TOKEN_PATH) && fs.existsSync(CREDENTIALS_PATH);
}

/**
 * 토큰 정보 가져오기
 */
export function getTokenInfo(): TokenData | null {
  if (!fs.existsSync(TOKEN_PATH)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
}

/**
 * 토큰 만료 여부 확인
 */
export function isTokenExpired(): boolean {
  const token = getTokenInfo();
  if (!token || !token.expiry_date) {
    return true;
  }
  // 5분 여유를 두고 만료 판단
  return Date.now() >= token.expiry_date - 5 * 60 * 1000;
}

// ============================================
// 유틸리티 함수들
// ============================================

/**
 * Calendar: 오늘의 일정 가져오기
 */
export async function getTodayEvents(calendarId = 'primary') {
  const calendar = await getCalendar();

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const response = await calendar.events.list({
    calendarId,
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  return response.data.items || [];
}

/**
 * Calendar: 이번 주 일정 가져오기
 */
export async function getWeekEvents(calendarId = 'primary') {
  const calendar = await getCalendar();

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const response = await calendar.events.list({
    calendarId,
    timeMin: startOfWeek.toISOString(),
    timeMax: endOfWeek.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  return response.data.items || [];
}

/**
 * Drive: 최근 파일 목록 가져오기
 */
export async function getRecentFiles(pageSize = 10) {
  const drive = await getDrive();

  const response = await drive.files.list({
    pageSize,
    fields: 'files(id, name, mimeType, modifiedTime, webViewLink)',
    orderBy: 'modifiedTime desc',
  });

  return response.data.files || [];
}

/**
 * Gmail: 읽지 않은 메일 수 가져오기
 */
export async function getUnreadCount() {
  const gmail = await getGmail();

  const response = await gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread',
    maxResults: 1,
  });

  return response.data.resultSizeEstimate || 0;
}

/**
 * Gmail: 최근 메일 목록 가져오기
 */
export async function getRecentEmails(maxResults = 10) {
  const gmail = await getGmail();

  const response = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
  });

  if (!response.data.messages) {
    return [];
  }

  // 각 메일의 상세 정보 가져오기
  const emails = await Promise.all(
    response.data.messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'Date'],
      });
      return detail.data;
    })
  );

  return emails;
}

/**
 * YouTube: 내 채널 정보 가져오기
 */
export async function getMyChannel() {
  const youtube = await getYouTube();

  const response = await youtube.channels.list({
    part: ['snippet', 'statistics'],
    mine: true,
  });

  return response.data.items?.[0] || null;
}
