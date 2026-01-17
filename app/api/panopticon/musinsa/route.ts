import { NextResponse } from 'next/server';
import { getOperationsDashboard } from '@/lib/google/operations-data';
import { isAuthenticated } from '@/lib/google/client';

// Musinsa 데이터는 Google Sheets에서 관리
// 스프레드시트에 수동으로 데이터를 입력하면 대시보드에 반영됨

export async function GET() {
  try {
    // Google OAuth 인증 확인
    if (!isAuthenticated()) {
      return NextResponse.json({
        success: true,
        isMock: true,
        message: 'Google Sheets 연동 필요. 스프레드시트에서 데이터 관리.',
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

    // Google Sheets에서 운영 데이터 조회
    const operations = await getOperationsDashboard();

    return NextResponse.json({
      success: true,
      isMock: false,
      dataSource: 'google_sheets',
      data: {
        urgentShipping: operations.urgentShipping,
        urgentClaims: operations.urgentClaims,
        pendingOrders: operations.domesticOrders.paymentComplete + operations.domesticOrders.preparing,
        totalOrders: operations.domesticOrders.total,
        revenue: operations.goal?.currentSales || 0,
        products: operations.products,
        claims: operations.claims,
        goal: operations.goal,
        lastSync: operations.lastUpdated
      }
    });
  } catch (error) {
    console.error('Musinsa API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch Musinsa data'
    }, { status: 500 });
  }
}
