/**
 * Panopticon Sales Data API
 * Google Sheets에서 매출 데이터를 조회하는 API
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getSalesDashboard,
  getTodaySales,
  getWeekSales,
  getMonthSales,
  getProductSales,
  getMonthlySummary,
  testConnection,
  appendSalesData,
} from '@/lib/google/sales-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================
// GET: 매출 데이터 조회
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'dashboard';

    let data;

    switch (type) {
      case 'today':
        data = await getTodaySales();
        break;

      case 'week':
        data = await getWeekSales();
        break;

      case 'month':
        data = await getMonthSales();
        break;

      case 'products':
        const limit = parseInt(searchParams.get('limit') || '20');
        data = await getProductSales(undefined, limit);
        break;

      case 'monthly':
        const months = parseInt(searchParams.get('months') || '12');
        data = await getMonthlySummary(undefined, months);
        break;

      case 'test':
        data = await testConnection();
        break;

      case 'dashboard':
      default:
        data = await getSalesDashboard();
        break;
    }

    return NextResponse.json({
      success: true,
      type,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Sales API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '매출 데이터 조회 실패',
      },
      { status: 500 }
    );
  }
}

// ============================================
// POST: 매출 데이터 추가 (수동 입력)
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 필수 필드 검증
    if (!body.channel || body.grossSales === undefined) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다 (channel, grossSales)' },
        { status: 400 }
      );
    }

    const result = await appendSalesData({
      date: body.date,
      channel: body.channel,
      orderCount: body.orderCount || 0,
      grossSales: body.grossSales,
      commission: body.commission || 0,
      netSales: body.netSales || body.grossSales,
      refundAmount: body.refundAmount || 0,
      returns: body.returns || 0,
    });

    return NextResponse.json({
      ...result,
      message: '매출 데이터가 추가되었습니다',
    });
  } catch (error) {
    console.error('[Sales API] POST Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '매출 데이터 추가 실패',
      },
      { status: 500 }
    );
  }
}
