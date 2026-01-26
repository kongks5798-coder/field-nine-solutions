/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 55: YEONGDONG RWA ORACLE API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 영동 태양광 발전소 실시간 데이터 API
 * GET /api/rwa/yeongdong
 *
 * Response includes:
 * - Current solar output (MW)
 * - Daily/monthly generation estimates
 * - Weather conditions
 * - KAUS conversion rates
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchYeongdongForecast, formatKRW, formatUSD } from '@/lib/energy/yeongdong-live';

// Cache configuration
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
};

// KAUS conversion rate
const KAUS_PER_KWH = 10;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeConversion = searchParams.get('include_conversion') !== 'false';
    const kausBalance = parseFloat(searchParams.get('kaus_balance') || '0');

    // Fetch live data from Yeongdong
    const forecast = await fetchYeongdongForecast();

    // Build response
    const response: Record<string, unknown> = {
      success: true,
      timestamp: new Date().toISOString(),
      isLive: forecast.isLive,

      // Solar Farm Data
      farm: {
        name: 'Yeongdong Solar Farm',
        location: {
          region: '강원도 영동',
          coordinates: {
            lat: 37.4292,
            lng: 128.6561,
          },
        },
        specs: {
          capacityMW: 50,
          capacityKW: 50000,
          panelCount: 125000,
          areaM2: 330578,
          areaPyung: 100000,
          efficiency: 0.21,
          performanceRatio: 0.85,
        },
      },

      // Real-time Output
      current: {
        outputMW: forecast.currentOutput,
        outputKW: forecast.currentOutput * 1000,
        utilizationPercent: (forecast.currentOutput / 50) * 100,
      },

      // Weather Conditions
      weather: {
        condition: forecast.weatherCondition,
        temperature: forecast.temperature,
        cloudCover: forecast.cloudCover,
        solarIrradiance: forecast.solarIrradiance,
        peakHours: forecast.peakHours,
      },

      // Generation Estimates
      generation: {
        dailyMWh: forecast.dailyGeneration,
        dailyKWh: forecast.dailyGeneration * 1000,
        monthlyMWh: forecast.dailyGeneration * 30,
        monthlyKWh: forecast.dailyGeneration * 30 * 1000,
        yearlyMWh: forecast.dailyGeneration * 365,
        yearlyKWh: forecast.dailyGeneration * 365 * 1000,
      },

      // Revenue (KRW/USD)
      revenue: {
        smpPrice: forecast.smpPrice,
        todayKRW: forecast.todayEarningsKRW,
        todayUSD: forecast.todayEarningsUSD,
        monthlyKRW: forecast.monthlyProjectionKRW,
        monthlyUSD: forecast.monthlyProjectionUSD,
        todayFormatted: formatKRW(forecast.todayEarningsKRW),
        monthlyFormatted: formatKRW(forecast.monthlyProjectionKRW),
      },

      lastUpdated: forecast.lastUpdated,
    };

    // KAUS Conversion (if requested)
    if (includeConversion) {
      const dailyKWh = forecast.dailyGeneration * 1000;
      const monthlyKWh = dailyKWh * 30;

      response.kausConversion = {
        rate: KAUS_PER_KWH,
        rateDescription: '1 kWh = 10 KAUS ($0.10/KAUS)',
        dailyKausGenerated: dailyKWh * KAUS_PER_KWH,
        monthlyKausGenerated: monthlyKWh * KAUS_PER_KWH,
        dailyKausValue: dailyKWh * KAUS_PER_KWH * 0.10,
        monthlyKausValue: monthlyKWh * KAUS_PER_KWH * 0.10,
      };

      // User KAUS balance conversion (if provided)
      if (kausBalance > 0) {
        const userKWh = kausBalance / KAUS_PER_KWH;
        const percentOfDaily = (userKWh / dailyKWh) * 100;
        const percentOfMonthly = (userKWh / monthlyKWh) * 100;
        const householdsDays = userKWh / 10.5; // Korean avg: 10.5 kWh/day
        const co2SavedKg = userKWh * 0.5;
        const treesEquivalent = co2SavedKg / (21 / 365);
        const solarPanelsOwned = userKWh / 1.7;

        response.userConversion = {
          kausBalance,
          energyEquivalent: {
            kWh: userKWh,
            mWh: userKWh / 1000,
          },
          yeongdongShare: {
            percentOfDailyOutput: Math.round(percentOfDaily * 1000) / 1000,
            percentOfMonthlyOutput: Math.round(percentOfMonthly * 10000) / 10000,
          },
          impact: {
            householdsDays: Math.round(householdsDays * 10) / 10,
            co2SavedKg: Math.round(co2SavedKg * 10) / 10,
            treesEquivalent: Math.round(treesEquivalent),
            solarPanelsOwned: Math.round(solarPanelsOwned * 10) / 10,
          },
          valueUSD: kausBalance * 0.10,
        };
      }
    }

    return NextResponse.json(response, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error('[RWA API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch Yeongdong data',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
