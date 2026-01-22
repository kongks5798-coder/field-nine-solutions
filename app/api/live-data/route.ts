/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LIVE DATA API ENDPOINT
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Phase 25: Real-time Data Integration
 *
 * 실시간 데이터 API - 시뮬레이션 0%, 실제 데이터 100%
 */

import { NextResponse } from 'next/server';
import {
  getLiveSMP,
  getLiveTeslaData,
  getLiveExchangeData,
  getLiveTVL,
  getLiveDataStatus,
} from '@/lib/partnerships/live-data-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all';

  try {
    switch (type) {
      case 'smp':
        return NextResponse.json({
          success: true,
          data: await getLiveSMP(),
        });

      case 'tesla':
        return NextResponse.json({
          success: true,
          data: await getLiveTeslaData(),
        });

      case 'exchange':
        return NextResponse.json({
          success: true,
          data: await getLiveExchangeData(),
        });

      case 'tvl':
        return NextResponse.json({
          success: true,
          data: await getLiveTVL(),
        });

      case 'status':
        return NextResponse.json({
          success: true,
          data: await getLiveDataStatus(),
        });

      case 'all':
      default:
        const [smp, tesla, exchange, tvl, status] = await Promise.all([
          getLiveSMP(),
          getLiveTeslaData(),
          getLiveExchangeData(),
          getLiveTVL(),
          getLiveDataStatus(),
        ]);

        return NextResponse.json({
          success: true,
          timestamp: new Date().toISOString(),
          data: {
            smp,
            tesla,
            exchange,
            tvl,
          },
          status,
          meta: {
            version: '25.0.0',
            mode: 'PRODUCTION',
            simulationPercentage: status.simulationPercentage,
            dataIntegrity: status.simulationPercentage === 0 ? 'VERIFIED' : 'PARTIAL',
          },
        });
    }
  } catch (error) {
    console.error('[LIVE DATA API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch live data',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
