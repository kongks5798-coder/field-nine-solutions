import { NextResponse } from 'next/server';

// TODO: 실제 Google API 연동시 이 파일 교체
// 현재: Mock 데이터 반환 (개발/테스트용)
// 연동시: lib/google/client.ts 사용

const IS_MOCK = true; // 실제 연동시 false로 변경

export async function GET() {
  try {
    const now = new Date();

    // Mock 모드: 빈 데이터 반환
    if (IS_MOCK) {
      return NextResponse.json({
        success: true,
        isMock: true,
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
            lastUpdated: now.toISOString(),
            pendingUpdates: 0
          }
        }
      });
    }

    // TODO: 실제 연동 코드
    return NextResponse.json({
      success: true,
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
          lastUpdated: now.toISOString(),
          pendingUpdates: 0
        }
      }
    });
  } catch (error) {
    console.error('Google API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch Google data'
    }, { status: 500 });
  }
}
