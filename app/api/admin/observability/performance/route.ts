/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 61: PERFORMANCE METRICS API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * API performance metrics endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPerformanceReport, getEndpointStats } from '@/lib/performance';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = parseInt(searchParams.get('period') || '60'); // minutes
    const endpoint = searchParams.get('endpoint');

    if (endpoint) {
      // Get stats for specific endpoint
      const since = new Date(Date.now() - period * 60 * 1000);
      const stats = getEndpointStats(endpoint, since);

      return NextResponse.json({
        endpoint,
        period: `${period} minutes`,
        stats: stats[0] || null,
        timestamp: new Date().toISOString(),
      });
    }

    // Get full performance report
    const report = getPerformanceReport(period);

    return NextResponse.json({
      ...report,
      timestamp: report.timestamp.toISOString(),
    });
  } catch (error) {
    console.error('Performance API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}
