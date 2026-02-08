import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        today: 0,
        thisMonth: 0,
        lastMonth: 0,
        growth: 0,
        orders: {
          pending: 0,
          processing: 0,
          completed: 0,
          cancelled: 0
        },
        topProducts: [],
        recentOrders: []
      }
    });
  } catch (error) {
    console.error('Sales API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch sales data'
    }, { status: 500 });
  }
}
