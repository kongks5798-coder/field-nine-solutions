/**
 * Google Workspace Client
 * Calendar, Drive, Gmail 연동
 */

import { google, calendar_v3, drive_v3 } from 'googleapis';

// ============================================
// Types
// ============================================
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  attendees?: string[];
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: Date;
  webViewLink?: string;
  size?: number;
}

export interface GoogleClientConfig {
  serviceAccountJson: string;
  calendarId?: string;
  driveFolderId?: string;
}

// ============================================
// Google Auth Helper
// ============================================
function getGoogleAuth() {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON 환경 변수가 설정되지 않았습니다.');
  }

  try {
    const credentials = JSON.parse(serviceAccountJson);

    return new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/gmail.readonly',
      ],
    });
  } catch (error) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON 파싱 실패. JSON 형식을 확인하세요.');
  }
}

// ============================================
// Calendar Functions
// ============================================

/**
 * 오늘의 일정 가져오기
 */
export async function getTodayEvents(): Promise<CalendarEvent[]> {
  try {
    const auth = getGoogleAuth();
    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const response = await calendar.events.list({
      calendarId,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 20,
    });

    const events = response.data.items || [];

    return events.map((event: calendar_v3.Schema$Event) => ({
      id: event.id || '',
      title: event.summary || '(제목 없음)',
      description: event.description || undefined,
      start: new Date(event.start?.dateTime || event.start?.date || ''),
      end: new Date(event.end?.dateTime || event.end?.date || ''),
      location: event.location || undefined,
      attendees: event.attendees?.map((a) => a.email || '').filter(Boolean),
    }));
  } catch (error) {
    console.error('[Google Calendar] 일정 조회 실패:', error);
    return [];
  }
}

/**
 * 이번 주 일정 가져오기
 */
export async function getWeekEvents(): Promise<CalendarEvent[]> {
  try {
    const auth = getGoogleAuth();
    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

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
      maxResults: 50,
    });

    const events = response.data.items || [];

    return events.map((event: calendar_v3.Schema$Event) => ({
      id: event.id || '',
      title: event.summary || '(제목 없음)',
      description: event.description || undefined,
      start: new Date(event.start?.dateTime || event.start?.date || ''),
      end: new Date(event.end?.dateTime || event.end?.date || ''),
      location: event.location || undefined,
      attendees: event.attendees?.map((a) => a.email || '').filter(Boolean),
    }));
  } catch (error) {
    console.error('[Google Calendar] 주간 일정 조회 실패:', error);
    return [];
  }
}

/**
 * 다가오는 일정 (D-Day 계산용)
 */
export async function getUpcomingEvents(days: number = 30): Promise<CalendarEvent[]> {
  try {
    const auth = getGoogleAuth();
    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(now.getDate() + days);

    const response = await calendar.events.list({
      calendarId,
      timeMin: now.toISOString(),
      timeMax: futureDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100,
    });

    const events = response.data.items || [];

    return events.map((event: calendar_v3.Schema$Event) => ({
      id: event.id || '',
      title: event.summary || '(제목 없음)',
      description: event.description || undefined,
      start: new Date(event.start?.dateTime || event.start?.date || ''),
      end: new Date(event.end?.dateTime || event.end?.date || ''),
      location: event.location || undefined,
      attendees: event.attendees?.map((a) => a.email || '').filter(Boolean),
    }));
  } catch (error) {
    console.error('[Google Calendar] 다가오는 일정 조회 실패:', error);
    return [];
  }
}

// ============================================
// Drive Functions
// ============================================

/**
 * 최근 수정된 파일 목록
 */
export async function getRecentFiles(limit: number = 10): Promise<DriveFile[]> {
  try {
    const auth = getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    let query = 'trashed = false';
    if (folderId) {
      query += ` and '${folderId}' in parents`;
    }

    const response = await drive.files.list({
      q: query,
      pageSize: limit,
      orderBy: 'modifiedTime desc',
      fields: 'files(id, name, mimeType, modifiedTime, webViewLink, size)',
    });

    const files = response.data.files || [];

    return files.map((file: drive_v3.Schema$File) => ({
      id: file.id || '',
      name: file.name || '(이름 없음)',
      mimeType: file.mimeType || 'unknown',
      modifiedTime: new Date(file.modifiedTime || ''),
      webViewLink: file.webViewLink || undefined,
      size: file.size ? parseInt(file.size, 10) : undefined,
    }));
  } catch (error) {
    console.error('[Google Drive] 파일 목록 조회 실패:', error);
    return [];
  }
}

/**
 * 특정 폴더 내 파일 검색
 */
export async function searchFiles(
  query: string,
  folderId?: string
): Promise<DriveFile[]> {
  try {
    const auth = getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });

    let searchQuery = `name contains '${query}' and trashed = false`;
    if (folderId) {
      searchQuery += ` and '${folderId}' in parents`;
    }

    const response = await drive.files.list({
      q: searchQuery,
      pageSize: 20,
      orderBy: 'modifiedTime desc',
      fields: 'files(id, name, mimeType, modifiedTime, webViewLink, size)',
    });

    const files = response.data.files || [];

    return files.map((file: drive_v3.Schema$File) => ({
      id: file.id || '',
      name: file.name || '(이름 없음)',
      mimeType: file.mimeType || 'unknown',
      modifiedTime: new Date(file.modifiedTime || ''),
      webViewLink: file.webViewLink || undefined,
      size: file.size ? parseInt(file.size, 10) : undefined,
    }));
  } catch (error) {
    console.error('[Google Drive] 파일 검색 실패:', error);
    return [];
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * 연결 상태 확인
 */
export async function checkGoogleConnection(): Promise<{
  connected: boolean;
  services: {
    calendar: boolean;
    drive: boolean;
  };
  error?: string;
}> {
  const result = {
    connected: false,
    services: {
      calendar: false,
      drive: false,
    },
    error: undefined as string | undefined,
  };

  try {
    const auth = getGoogleAuth();

    // Calendar 연결 확인
    try {
      const calendar = google.calendar({ version: 'v3', auth });
      await calendar.calendarList.list({ maxResults: 1 });
      result.services.calendar = true;
    } catch {
      result.services.calendar = false;
    }

    // Drive 연결 확인
    try {
      const drive = google.drive({ version: 'v3', auth });
      await drive.about.get({ fields: 'user' });
      result.services.drive = true;
    } catch {
      result.services.drive = false;
    }

    result.connected = result.services.calendar || result.services.drive;
  } catch (error) {
    result.error = error instanceof Error ? error.message : '알 수 없는 오류';
  }

  return result;
}
