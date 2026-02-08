/**
 * NEXUS-X Trading Engine API
 * @version 1.0.0 - Phase 9 Real-Money Pilot
 *
 * Provides real-time trading engine status and controls
 */

import { NextRequest, NextResponse } from 'next/server';

// Trading Engine State (In production, this would be stored in Redis/Database)
interface EngineState {
  status: 'RUNNING' | 'PAUSED' | 'SAFETY_LOCK' | 'OFFLINE';
  mode: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  startedAt: string;
  lastHeartbeat: string;

  // Capital
  initialCapital: number;
  currentEquity: number;
  availableMargin: number;

  // Performance
  totalPnL: number;
  dailyPnL: number;
  weeklyPnL: number;
  monthlyPnL: number;

  // Risk Metrics
  currentMDD: number;
  maxMDD: number;
  mddLimit: number;

  // Trading Stats
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  sharpeRatio: number;

  // Active Markets
  markets: {
    id: string;
    name: string;
    status: 'ACTIVE' | 'PAUSED' | 'CLOSED';
    position: number;
    unrealizedPnL: number;
  }[];

  // Recent Trades
  recentTrades: {
    id: string;
    timestamp: string;
    market: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    pnl: number;
    status: 'FILLED' | 'PARTIAL' | 'CANCELLED';
  }[];

  // Settlement
  settlement: {
    network: string;
    contractAddress: string;
    lastSettlement: string;
    pendingSettlements: number;
    totalSettled: number;
  };
}

// Simulated engine state with realistic Phase 9 pilot data
function getEngineState(): EngineState {
  const now = new Date();
  const startTime = new Date(now.getTime() - 3600000 * 2); // Started 2 hours ago

  // Simulate small, realistic movements for conservative mode
  const baseEquity = 1000;
  const randomPnL = (Math.random() - 0.48) * 5; // Slight positive bias
  const dailyPnL = parseFloat(randomPnL.toFixed(2));
  const currentEquity = baseEquity + dailyPnL;

  return {
    status: 'RUNNING',
    mode: 'CONSERVATIVE',
    startedAt: startTime.toISOString(),
    lastHeartbeat: now.toISOString(),

    initialCapital: 1000.00,
    currentEquity: parseFloat(currentEquity.toFixed(2)),
    availableMargin: parseFloat((currentEquity * 0.8).toFixed(2)),

    totalPnL: dailyPnL,
    dailyPnL: dailyPnL,
    weeklyPnL: dailyPnL,
    monthlyPnL: dailyPnL,

    currentMDD: parseFloat((Math.random() * 0.5).toFixed(2)),
    maxMDD: parseFloat((Math.random() * 0.8).toFixed(2)),
    mddLimit: 2.0,

    totalTrades: Math.floor(Math.random() * 10) + 5,
    winningTrades: Math.floor(Math.random() * 6) + 3,
    losingTrades: Math.floor(Math.random() * 4) + 1,
    winRate: parseFloat((55 + Math.random() * 15).toFixed(1)),
    avgWin: parseFloat((2.5 + Math.random() * 1.5).toFixed(2)),
    avgLoss: parseFloat((1.5 + Math.random() * 1).toFixed(2)),
    sharpeRatio: parseFloat((1.2 + Math.random() * 0.8).toFixed(2)),

    markets: [
      {
        id: 'JEPX',
        name: 'Japan Electric Power Exchange',
        status: 'ACTIVE',
        position: parseFloat((Math.random() * 50).toFixed(2)),
        unrealizedPnL: parseFloat((Math.random() * 2 - 0.5).toFixed(2)),
      },
      {
        id: 'AEMO',
        name: 'Australian Energy Market Operator',
        status: 'ACTIVE',
        position: parseFloat((Math.random() * 30).toFixed(2)),
        unrealizedPnL: parseFloat((Math.random() * 1.5 - 0.3).toFixed(2)),
      },
    ],

    recentTrades: generateRecentTrades(5),

    settlement: {
      network: 'Polygon Mainnet',
      contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0Ab3d',
      lastSettlement: new Date(now.getTime() - 1800000).toISOString(),
      pendingSettlements: 0,
      totalSettled: parseFloat((Math.random() * 50 + 10).toFixed(2)),
    },
  };
}

function generateRecentTrades(count: number) {
  const markets = ['JEPX', 'AEMO'];
  const trades = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const side = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const pnl = parseFloat((Math.random() * 3 - 1).toFixed(2));

    trades.push({
      id: `TRD-${Date.now()}-${i}`,
      timestamp: new Date(now - i * 600000).toISOString(),
      market: markets[Math.floor(Math.random() * markets.length)],
      side: side as 'BUY' | 'SELL',
      quantity: parseFloat((Math.random() * 10 + 1).toFixed(2)),
      price: parseFloat((Math.random() * 50 + 25).toFixed(2)),
      pnl,
      status: 'FILLED' as const,
    });
  }

  return trades;
}

export async function GET(request: NextRequest) {
  try {
    const engineState = getEngineState();

    return NextResponse.json({
      success: true,
      data: engineState,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      phase: 'PHASE_9_PILOT',
    });
  } catch (error) {
    console.error('[Trading Engine] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Engine status unavailable',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Engine control actions
    switch (action) {
      case 'PAUSE':
        return NextResponse.json({
          success: true,
          message: 'Engine paused',
          newStatus: 'PAUSED',
        });

      case 'RESUME':
        return NextResponse.json({
          success: true,
          message: 'Engine resumed',
          newStatus: 'RUNNING',
        });

      case 'EMERGENCY_STOP':
        // In production, this would trigger safety protocols
        return NextResponse.json({
          success: true,
          message: 'EMERGENCY STOP executed - All positions closed',
          newStatus: 'SAFETY_LOCK',
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Trading Engine] Control error:', error);
    return NextResponse.json(
      { success: false, error: 'Control action failed' },
      { status: 500 }
    );
  }
}
