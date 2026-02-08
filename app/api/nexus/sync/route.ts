/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 55: NEXUS REAL-DATA SYNC API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * GET  /api/nexus/sync - Get live energy data
 * POST /api/nexus/sync - Sync data to database / Get orderbook
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  nexusRealDataSync,
  dynamicOrderbook,
  getLiveEnergyData,
  getEnergyOrderbook,
  syncEnergyData,
} from '@/lib/nexus/real-data-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Cache headers for live data
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=30',
};

/**
 * GET - Fetch live energy data and orderbook
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const includeOrderbook = searchParams.get('orderbook') !== 'false';
    const includeHistory = searchParams.get('history') === 'true';
    const historyDays = parseInt(searchParams.get('days') || '7');

    // Fetch live generation data
    const liveData = await getLiveEnergyData();

    // Build response
    const response: Record<string, unknown> = {
      success: true,
      timestamp: new Date().toISOString(),
      processingTime: 0, // Will be updated at end

      // Live Generation Data
      generation: {
        source: 'yeongdong_solar',
        specs: {
          capacityMW: 50,
          areaPyung: 100000,
          location: '강원도 영동',
        },
        current: {
          outputMW: liveData.outputMW,
          outputKW: liveData.outputKW,
          utilizationPercent: liveData.utilizationPercent,
        },
        weather: {
          condition: liveData.weatherCondition,
          temperature: liveData.temperature,
          solarIrradiance: liveData.solarIrradiance,
        },
        economics: {
          smpPrice: liveData.smpPrice,
          revenueKRW: liveData.revenueKRW,
          revenueUSD: liveData.revenueUSD,
          kausGenerated: liveData.kausGenerated,
        },
        recordedAt: liveData.timestamp,
      },
    };

    // Include orderbook if requested
    if (includeOrderbook) {
      const orderbook = await getEnergyOrderbook();
      response.orderbook = {
        bids: orderbook.bids.slice(0, 5), // Top 5 bids
        asks: orderbook.asks.slice(0, 5), // Top 5 asks
        summary: {
          spread: orderbook.spread,
          midPrice: orderbook.midPrice,
          availableEnergy: orderbook.availableEnergy,
          liquidityScore: orderbook.liquidityScore,
        },
        lastUpdated: orderbook.lastUpdated,
      };

      // Market condition analysis
      const condition = dynamicOrderbook.analyzeMarketCondition(liveData);
      response.marketCondition = {
        supplyLevel: condition.supplyLevel,
        priceDirection: condition.priceDirection,
        volatility: condition.volatility,
        recommendation: condition.recommendation,
      };
    }

    // Include historical data if requested
    if (includeHistory) {
      const history = await nexusRealDataSync.getHistoricalData(historyDays);
      response.history = {
        days: historyDays,
        records: history.length,
        data: history.slice(0, 100), // Limit to 100 records
        summary: {
          avgOutputMW: history.length > 0
            ? Math.round(history.reduce((sum, h) => sum + h.outputMW, 0) / history.length * 100) / 100
            : 0,
          totalKausGenerated: history.reduce((sum, h) => sum + h.kausGenerated, 0),
          totalRevenueKRW: history.reduce((sum, h) => sum + h.revenueKRW, 0),
        },
      };
    }

    // Add processing time
    response.processingTime = Date.now() - startTime;

    return NextResponse.json(response, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error('[NEXUS Sync API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch energy data',
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Sync data or execute commands
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'sync': {
        // Sync current data to database
        const synced = await syncEnergyData();
        const liveData = await getLiveEnergyData();

        return NextResponse.json({
          success: synced,
          message: synced ? 'Data synced successfully' : 'Sync failed',
          data: liveData,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
        });
      }

      case 'orderbook': {
        // Get full orderbook
        const orderbook = await getEnergyOrderbook();

        return NextResponse.json({
          success: true,
          orderbook,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
        });
      }

      case 'market-analysis': {
        // Detailed market analysis
        const liveData = await getLiveEnergyData();
        const orderbook = await getEnergyOrderbook();
        const condition = dynamicOrderbook.analyzeMarketCondition(liveData);

        return NextResponse.json({
          success: true,
          analysis: {
            generation: liveData,
            orderbook: {
              spread: orderbook.spread,
              midPrice: orderbook.midPrice,
              liquidityScore: orderbook.liquidityScore,
              depthBids: orderbook.bids.length,
              depthAsks: orderbook.asks.length,
            },
            condition,
            signals: {
              tradingSignal: condition.supplyLevel === 'surplus' ? 'BUY' :
                            condition.supplyLevel === 'deficit' ? 'HOLD' : 'NEUTRAL',
              confidence: 100 - condition.volatility,
              timeframe: '1H',
            },
          },
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}`,
            validActions: ['sync', 'orderbook', 'market-analysis'],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[NEXUS Sync API] POST Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process request',
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
