import { NextResponse } from 'next/server';

// TODO: 실제 Musinsa API 연동시 이 파일 교체
// 현재: Mock 데이터 반환 (개발/테스트용)
// 연동시: lib/musinsa/client.ts 생성 후 import

const IS_MOCK = true; // 실제 연동시 false로 변경

export async function GET() {
  try {
    // Mock 모드: 빈 데이터 반환
    if (IS_MOCK) {
      return NextResponse.json({
        success: true,
        isMock: true,
        data: {
          urgentShipping: 0,
          urgentClaims: 0,
          pendingOrders: 0,
          totalOrders: 0,
          revenue: 0,
          lastSync: new Date().toISOString()
        }
      });
    }

    // TODO: 실제 연동 코드
    return NextResponse.json({
      success: true,
      data: {
        urgentShipping: 0,
        urgentClaims: 0,
        pendingOrders: 0,
        totalOrders: 0,
        revenue: 0,
        lastSync: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Musinsa API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch Musinsa data'
    }, { status: 500 });
  }
}
