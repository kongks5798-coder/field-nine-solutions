/**
 * NEXUS-X Mega Capital Trading API
 * @version 1.0.0 - Phase 11 Market Dominance
 *
 * $1M+ Capital Scale Operations
 * 100+ TPS Global Energy Trading
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  megaCapitalEngine,
  MegaCapitalEngine,
  GLOBAL_MARKETS,
  CAPITAL_TIERS,
} from '@/lib/trading/mega-capital-engine';

// ============================================
// API Handler
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'status';

  try {
    switch (action) {
      case 'status':
        return NextResponse.json({
          success: true,
          data: {
            engine: 'MEGA_CAPITAL_ENGINE',
            version: '1.0.0',
            phase: 'PHASE_11_DOMINANCE',
            metrics: megaCapitalEngine.getGlobalMetrics(),
            markets: Object.keys(GLOBAL_MARKETS),
            capitalTier: 'INSTITUTIONAL',
            tpsCapacity: '150+',
            timestamp: new Date().toISOString(),
          },
        });

      case 'markets':
        return NextResponse.json({
          success: true,
          data: {
            markets: GLOBAL_MARKETS,
            activeMarkets: Object.keys(GLOBAL_MARKETS).length,
            globalCoverage: ['US-East', 'EU-Central', 'AU', 'JP'],
          },
          timestamp: new Date().toISOString(),
        });

      case 'signals':
        const signals = megaCapitalEngine.generateGlobalSignals();
        return NextResponse.json({
          success: true,
          data: {
            signals,
            generatedAt: new Date().toISOString(),
            marketsAnalyzed: signals.length,
            avgConfidence: signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length,
          },
          timestamp: new Date().toISOString(),
        });

      case 'positions':
        const market = searchParams.get('market') || undefined;
        return NextResponse.json({
          success: true,
          data: {
            positions: megaCapitalEngine.getPositions(market),
            filter: { market },
          },
          timestamp: new Date().toISOString(),
        });

      case 'executions':
        const limit = parseInt(searchParams.get('limit') || '50');
        return NextResponse.json({
          success: true,
          data: {
            executions: megaCapitalEngine.getExecutions(limit),
            limit,
          },
          timestamp: new Date().toISOString(),
        });

      case 'tiers':
        return NextResponse.json({
          success: true,
          data: {
            tiers: CAPITAL_TIERS,
            currentTier: 'INSTITUTIONAL',
            description: {
              SEED: '$1K - Learning & Testing',
              GROWTH: '$100K - Scaling Phase',
              INSTITUTIONAL: '$1M - Professional Operations',
              MEGA: '$10M+ - Market Dominance',
            },
          },
          timestamp: new Date().toISOString(),
        });

      case 'simulate':
        const days = parseInt(searchParams.get('days') || '30');
        const tier = (searchParams.get('tier') || 'INSTITUTIONAL') as keyof typeof CAPITAL_TIERS;

        const engine = new MegaCapitalEngine(tier);
        const simulation = engine.runMegaCapitalSimulation(days);

        return NextResponse.json({
          success: true,
          data: {
            simulation,
            parameters: {
              days,
              capitalTier: tier,
              markets: Object.keys(GLOBAL_MARKETS),
            },
          },
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Mega Capital API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Service unavailable' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, market, side, quantity, price } = body;

    switch (action) {
      case 'execute':
        if (!market || !side || !quantity || !price) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields: market, side, quantity, price' },
            { status: 400 }
          );
        }

        if (!GLOBAL_MARKETS[market]) {
          return NextResponse.json(
            { success: false, error: `Invalid market: ${market}. Valid markets: ${Object.keys(GLOBAL_MARKETS).join(', ')}` },
            { status: 400 }
          );
        }

        const execution = megaCapitalEngine.executeOrder(market, side, quantity, price);

        return NextResponse.json({
          success: execution.status === 'FILLED',
          data: execution,
          timestamp: new Date().toISOString(),
        });

      case 'batch_execute':
        const { orders } = body;
        if (!orders || !Array.isArray(orders)) {
          return NextResponse.json(
            { success: false, error: 'Missing orders array' },
            { status: 400 }
          );
        }

        const executions = orders.map((order: { market: string; side: 'BUY' | 'SELL'; quantity: number; price: number }) =>
          megaCapitalEngine.executeOrder(order.market, order.side, order.quantity, order.price)
        );

        const filled = executions.filter(e => e.status === 'FILLED').length;

        return NextResponse.json({
          success: true,
          data: {
            executions,
            summary: {
              total: executions.length,
              filled,
              rejected: executions.length - filled,
              avgLatency: executions.reduce((sum, e) => sum + e.latency, 0) / executions.length,
            },
          },
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Mega Capital API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
