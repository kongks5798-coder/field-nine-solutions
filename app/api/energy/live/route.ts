/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 79: LIVE ENERGY DATA API (EDGE CACHED)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 실시간 에너지 생산 데이터 API
 * - 영동 태양광 발전소 실시간 데이터
 * - 테슬라 V2G 실시간 데이터
 * - SMP 시세
 * - 200ms 이내 응답을 위한 Edge 캐싱
 *
 * @route GET /api/energy/live
 */

import { NextResponse } from 'next/server';

// Edge Runtime for lowest latency
export const runtime = 'edge';
export const revalidate = 30; // Revalidate every 30 seconds

// ═══════════════════════════════════════════════════════════════════════════════
// CACHE HEADERS
// ═══════════════════════════════════════════════════════════════════════════════

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
  'CDN-Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
  'Vercel-CDN-Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
};

// ═══════════════════════════════════════════════════════════════════════════════
// SIMULATION DATA (Production would connect to real APIs)
// ═══════════════════════════════════════════════════════════════════════════════

function generateRealtimeData() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  // Solar output based on time of day (Korean timezone)
  const isDaylight = hour >= 6 && hour <= 19;
  const peakHours = hour >= 10 && hour <= 15;

  // Yeongdong 50MW Solar Farm
  let solarOutputMW = 0;
  if (isDaylight) {
    const baseSolar = peakHours ? 42 : (hour >= 8 && hour <= 17 ? 30 : 15);
    const cloudFactor = 0.85 + Math.random() * 0.15; // 85-100% efficiency
    const minuteVariation = Math.sin(minute * 0.1) * 2;
    solarOutputMW = (baseSolar + minuteVariation) * cloudFactor;
  }

  // Daily accumulation estimate (kWh)
  const hoursPassed = hour + minute / 60;
  const estimatedDailyKWh = isDaylight
    ? solarOutputMW * 1000 * Math.min(hoursPassed - 6, 13) * 0.7 // 70% capacity factor
    : 280000; // ~280 MWh on a good day

  // Tesla V2G Fleet (10 Cybertrucks)
  const v2gActive = hour >= 17 || hour <= 7; // Active during peak/off-peak
  const v2gOutputKW = v2gActive
    ? 80 + Math.random() * 40 // 80-120 kW
    : 10 + Math.random() * 20; // Minimal during day

  // SMP (System Marginal Price) fluctuation
  const baseSMP = hour >= 18 && hour <= 22 ? 140 : // Peak evening
                  hour >= 10 && hour <= 14 ? 95 :  // Solar peak (lower)
                  110; // Normal
  const smpPrice = baseSMP + (Math.random() - 0.5) * 15;

  // Circulating supply simulation (would come from DB)
  const circulatingSupply = 10_000_000 + Math.floor(Math.random() * 500_000);

  return {
    // Solar Data
    yeongdong: {
      currentOutputMW: Number(solarOutputMW.toFixed(2)),
      currentOutputKW: Number((solarOutputMW * 1000).toFixed(0)),
      dailyGenerationKWh: Number(estimatedDailyKWh.toFixed(0)),
      capacityFactor: Number((solarOutputMW / 50 * 100).toFixed(1)),
      status: solarOutputMW > 0 ? 'GENERATING' : 'STANDBY',
      weatherCondition: isDaylight ? (peakHours ? 'CLEAR' : 'PARTLY_CLOUDY') : 'NIGHT',
    },

    // V2G Data
    teslaV2G: {
      currentOutputKW: Number(v2gOutputKW.toFixed(1)),
      dailyGenerationKWh: Number((v2gOutputKW * hoursPassed * 0.3).toFixed(0)),
      activeVehicles: v2gActive ? 8 + Math.floor(Math.random() * 3) : 3,
      totalFleetSize: 10,
      status: v2gActive ? 'DISCHARGING' : 'IDLE',
      gridDemand: v2gActive ? 'PEAK' : 'NORMAL',
    },

    // Market Data
    market: {
      smpPrice: Number(smpPrice.toFixed(2)),
      smpCurrency: 'KRW/kWh',
      kausPriceKRW: 120,
      kausPriceUSD: 0.10,
      trend: smpPrice > baseSMP ? 'UP' : 'DOWN',
    },

    // Aggregate
    combined: {
      totalOutputKW: Number((solarOutputMW * 1000 + v2gOutputKW).toFixed(0)),
      dailyGenerationKWh: Number((estimatedDailyKWh + v2gOutputKW * hoursPassed * 0.3).toFixed(0)),
      dailyRevenueKRW: Number(((estimatedDailyKWh + v2gOutputKW * hoursPassed * 0.3) * smpPrice).toFixed(0)),
      co2OffsetKg: Number(((estimatedDailyKWh + v2gOutputKW * hoursPassed * 0.3) * 0.459).toFixed(0)),
    },

    // For dividend calculation
    yeongdongKWh: Number(estimatedDailyKWh.toFixed(0)),
    teslaKWh: Number((v2gOutputKW * hoursPassed * 0.3).toFixed(0)),
    smpPrice: Number(smpPrice.toFixed(2)),
    circulatingSupply,

    // Meta
    isLive: true,
    timestamp: now.toISOString(),
    dataSource: 'REALTIME_SIMULATION',
    nextUpdate: new Date(now.getTime() + 30000).toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET: Fetch Live Energy Data
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET() {
  const startTime = Date.now();

  try {
    const data = generateRealtimeData();

    const response = NextResponse.json({
      success: true,
      ...data,
      latency: `${Date.now() - startTime}ms`,
    });

    // Set cache headers for Edge
    Object.entries(CACHE_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;

  } catch (error) {
    console.error('[Energy Live API] Error:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch live data',
      isLive: false,
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }
}
