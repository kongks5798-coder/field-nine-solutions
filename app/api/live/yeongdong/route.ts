/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 45: YEONGDONG LIVE DATA API
 * ═══════════════════════════════════════════════════════════════════════════════
 * Weather API + Solar Prediction - <100ms latency with 60s cache
 */

import { NextResponse } from 'next/server';
import { fetchYeongdongForecast } from '@/lib/energy/yeongdong-live';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // 60 second cache

export async function GET() {
  try {
    const data = await fetchYeongdongForecast();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('[Yeongdong API] Error:', error);

    // Return fallback data based on time
    const hour = new Date().getHours();
    const sunFactor = hour >= 6 && hour <= 18 ? Math.sin((hour - 6) / 12 * Math.PI) : 0;
    const smpPrice = 100 + Math.floor(Math.random() * 60);

    return NextResponse.json({
      currentOutput: Math.round(50 * sunFactor * 0.85),
      dailyGeneration: 212,
      weatherCondition: 'partly_cloudy',
      temperature: 15,
      solarIrradiance: 500,
      cloudCover: 30,
      todayEarningsKRW: 27560000,
      todayEarningsUSD: 20878,
      monthlyProjectionKRW: 826800000,
      monthlyProjectionUSD: 626363,
      smpPrice,
      peakHours: ['10:00-12:00', '13:00-15:00'],
      lastUpdated: new Date().toISOString(),
      isLive: false,
    });
  }
}
