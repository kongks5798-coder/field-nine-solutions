/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * EMPIRE ROI FORECAST API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Phase 26: Real-time ROI based on live economic data
 *
 * Endpoints:
 * - GET /api/empire-roi?period=daily (default)
 * - GET /api/empire-roi?type=stats (empire stats summary)
 */

import { NextResponse } from 'next/server';
import {
  calculateROIForecast,
  getEmpireStats,
} from '@/lib/partnerships/empire-roi-forecast';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'forecast';
  const period = searchParams.get('period') as 'daily' | 'weekly' | 'monthly' | 'yearly' || 'daily';

  try {
    if (type === 'stats') {
      const stats = await getEmpireStats();

      return NextResponse.json({
        success: true,
        data: stats,
        meta: {
          version: '1.0.0',
          verified: stats.verifiedByAPI,
          badge: stats.verifiedByAPI ? 'VERIFIED_BY_REALTIME_API' : 'AWAITING_API_KEYS',
        },
      });
    }

    // Default: forecast
    const forecast = await calculateROIForecast(period);

    return NextResponse.json({
      success: true,
      data: forecast,
      meta: {
        version: '1.0.0',
        dataQuality: forecast.dataQuality.liveDataPercentage,
        badge: forecast.dataQuality.liveDataPercentage >= 75
          ? 'VERIFIED_BY_REALTIME_API'
          : 'PARTIAL_DATA',
      },
    });
  } catch (error) {
    console.error('[EMPIRE ROI API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate ROI forecast',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
