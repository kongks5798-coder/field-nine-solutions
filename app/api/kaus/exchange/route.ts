import { NextRequest, NextResponse } from 'next/server';
import {
  getKausConversionRate,
  exchangeKwhToKaus,
  getKausWalletBalance,
  calculateUptime,
  type KausConversionRate,
  type KausExchangeResult,
  type KausWalletBalance,
} from '@/lib/partnerships/live-data-service';

/**
 * KAUS ENERGY EXCHANGE API
 * Phase 33: Energy-to-Coin Conversion Endpoints
 *
 * Conversion Formula:
 * - Base: 1 kWh = 10 KAUS
 * - Price: 1 KAUS = $0.10 USD
 * - Dynamic multipliers apply based on grid demand and V2G bonus
 *
 * Uptime Formula:
 * Uptime% = (TotalTime - DownTime) / TotalTime × 100
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ExchangeRequest {
  action: 'rate' | 'exchange' | 'wallet' | 'uptime';
  kwhAmount?: number;
  totalTime?: number;
  downTime?: number;
}

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// GET: Fetch current rate, wallet balance, or perform calculations
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || 'rate';

  try {
    switch (action) {
      case 'rate': {
        const rate = await getKausConversionRate();
        return NextResponse.json<APIResponse<KausConversionRate>>({
          success: true,
          data: rate,
          timestamp: new Date().toISOString(),
        });
      }

      case 'wallet': {
        const wallet = await getKausWalletBalance();
        return NextResponse.json<APIResponse<KausWalletBalance>>({
          success: true,
          data: wallet,
          timestamp: new Date().toISOString(),
        });
      }

      case 'uptime': {
        const totalTime = parseInt(searchParams.get('totalTime') || '0');
        const downTime = parseInt(searchParams.get('downTime') || '0');

        if (totalTime <= 0) {
          return NextResponse.json<APIResponse<null>>({
            success: false,
            error: 'totalTime must be greater than 0',
            timestamp: new Date().toISOString(),
          }, { status: 400 });
        }

        const uptimePercent = calculateUptime(totalTime, downTime);

        return NextResponse.json<APIResponse<{ uptime: number; formula: string }>>({
          success: true,
          data: {
            uptime: parseFloat(uptimePercent.toFixed(4)),
            formula: `(${totalTime} - ${downTime}) / ${totalTime} × 100 = ${uptimePercent.toFixed(4)}%`,
          },
          timestamp: new Date().toISOString(),
        });
      }

      default:
        return NextResponse.json<APIResponse<null>>({
          success: false,
          error: `Unknown action: ${action}`,
          timestamp: new Date().toISOString(),
        }, { status: 400 });
    }
  } catch (error) {
    console.error('[Kaus API] GET error:', error);
    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// POST: Execute exchange
export async function POST(request: NextRequest) {
  try {
    const body: ExchangeRequest = await request.json();

    if (body.action === 'exchange') {
      const kwhAmount = body.kwhAmount;

      if (!kwhAmount || typeof kwhAmount !== 'number') {
        return NextResponse.json<APIResponse<null>>({
          success: false,
          error: 'kwhAmount is required and must be a number',
          timestamp: new Date().toISOString(),
        }, { status: 400 });
      }

      if (kwhAmount < 0.1) {
        return NextResponse.json<APIResponse<null>>({
          success: false,
          error: 'Minimum exchange is 0.1 kWh',
          timestamp: new Date().toISOString(),
        }, { status: 400 });
      }

      if (kwhAmount > 10000) {
        return NextResponse.json<APIResponse<null>>({
          success: false,
          error: 'Maximum exchange is 10,000 kWh per transaction',
          timestamp: new Date().toISOString(),
        }, { status: 400 });
      }

      const result = await exchangeKwhToKaus(kwhAmount);

      console.log(`[Kaus API] Exchange executed: ${kwhAmount} kWh → ${result.netKaus.toFixed(2)} KAUS`);

      return NextResponse.json<APIResponse<KausExchangeResult>>({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    }

    if (body.action === 'uptime') {
      const { totalTime, downTime } = body;

      if (!totalTime || totalTime <= 0) {
        return NextResponse.json<APIResponse<null>>({
          success: false,
          error: 'totalTime must be greater than 0',
          timestamp: new Date().toISOString(),
        }, { status: 400 });
      }

      const uptimePercent = calculateUptime(totalTime, downTime || 0);

      return NextResponse.json<APIResponse<{
        totalTime: number;
        downTime: number;
        uptimePercent: number;
        formula: string;
      }>>({
        success: true,
        data: {
          totalTime,
          downTime: downTime || 0,
          uptimePercent: parseFloat(uptimePercent.toFixed(4)),
          formula: `Uptime% = (${totalTime} - ${downTime || 0}) / ${totalTime} × 100`,
        },
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: 'Invalid action. Use "exchange" or "uptime"',
      timestamp: new Date().toISOString(),
    }, { status: 400 });

  } catch (error) {
    console.error('[Kaus API] POST error:', error);
    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
