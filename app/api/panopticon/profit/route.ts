import { NextResponse } from 'next/server';
import { calculateProfitSimulation } from '@/lib/partnerships/live-data-service';

/**
 * V2G PROFIT SIMULATOR API
 * Phase 34: SMP Arbitrage Revenue Estimation
 *
 * Calculates potential profit from V2G (Vehicle-to-Grid) operations
 * based on SMP (System Marginal Price) differentials.
 *
 * Formula: DailyProfit = (MaxSMP - CurrentSMP) x BatteryCapacity x Efficiency
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const profitData = await calculateProfitSimulation();

    return NextResponse.json({
      success: true,
      data: profitData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Profit API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
