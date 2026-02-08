import { NextResponse } from 'next/server';
import { getOperationsDashboard } from '@/lib/google/operations-data';
import { isAuthenticated } from '@/lib/google/client';

export async function GET() {
  try {
    const now = new Date();

    // Google OAuth 인증 확인
    if (!isAuthenticated()) {
      return NextResponse.json({
        success: true,
        isMock: true,
        message: 'Google OAuth 인증이 필요합니다. npx tsx scripts/google-auth.ts 실행',
        data: {
          calendar: { todayEvents: [], upcomingEvents: [] },
          gmail: { unreadCount: 0, importantEmails: [] },
          sheets: { lastUpdated: now.toISOString(), pendingUpdates: 0 }
        }
      });
    }

    // 실제 Google Sheets 데이터 조회
    const operationsData = await getOperationsDashboard();

    return NextResponse.json({
      success: true,
      isMock: false,
      data: {
        calendar: {
          todayEvents: [],
          upcomingEvents: []
        },
        gmail: {
          unreadCount: 0,
          importantEmails: []
        },
        sheets: {
          lastUpdated: operationsData.lastUpdated,
          pendingUpdates: 0,
          operations: operationsData
        }
      }
    });
  } catch (error) {
    console.error('Google API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch Google data'
    }, { status: 500 });
  }
}
