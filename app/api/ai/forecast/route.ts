import { NextRequest, NextResponse } from 'next/server';
import {
  getProphetForecast,
  getWeeklyProfitHistory,
  type ProphetForecast,
  type WeeklyProfitData,
} from '@/lib/partnerships/live-data-service';

/**
 * THE GREAT PROPHET - AI FORECAST API
 * Phase 35: Intelligent Revenue Optimization Engine
 *
 * Provides 24-hour SMP predictions with:
 * - Hybrid prediction model (MA + Pattern Matching)
 * - Confidence scoring
 * - Decision recommendations
 * - Historical profit data
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ForecastAPIResponse {
  success: boolean;
  data?: {
    forecast: ProphetForecast;
    weeklyHistory?: WeeklyProfitData;
  };
  error?: string;
  timestamp: string;
}

// GET: Fetch AI forecast and optional historical data
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const batteryCapacity = parseInt(searchParams.get('capacity') || '100');
  const includeHistory = searchParams.get('history') === 'true';

  try {
    console.log(`[Prophet API] Generating forecast for ${batteryCapacity}kWh battery`);

    // Generate forecast
    const forecast = await getProphetForecast(batteryCapacity);

    // Optionally include weekly history
    let weeklyHistory: WeeklyProfitData | undefined;
    if (includeHistory) {
      weeklyHistory = await getWeeklyProfitHistory(batteryCapacity);
    }

    const response: ForecastAPIResponse = {
      success: true,
      data: {
        forecast,
        weeklyHistory,
      },
      timestamp: new Date().toISOString(),
    };

    // Log decision for monitoring
    console.log(
      `[Prophet API] Decision: ${forecast.decision.action} | ` +
      `Expected Benefit: ₩${forecast.decision.expectedBenefit.toLocaleString()} | ` +
      `Accuracy: ${forecast.modelAccuracy.toFixed(1)}%`
    );

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('[Prophet API] Error:', error);

    return NextResponse.json<ForecastAPIResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Forecast generation failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// POST: Get forecast with custom parameters
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      batteryCapacity = 100,
      includeHistory = true,
    } = body;

    if (batteryCapacity < 1 || batteryCapacity > 10000) {
      return NextResponse.json<ForecastAPIResponse>(
        {
          success: false,
          error: 'Battery capacity must be between 1 and 10000 kWh',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const forecast = await getProphetForecast(batteryCapacity);
    const weeklyHistory = includeHistory
      ? await getWeeklyProfitHistory(batteryCapacity)
      : undefined;

    return NextResponse.json<ForecastAPIResponse>({
      success: true,
      data: {
        forecast,
        weeklyHistory,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Prophet API] POST Error:', error);

    return NextResponse.json<ForecastAPIResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Request processing failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
