/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * T2E BRIDGE API - CAMEL'S DREAM INTEGRATION
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Phase 37: THE FINAL CONVERGENCE
 *
 * Token-to-Energy Bridge connecting NEXUS energy trading with
 * the "Camel's Dream" (낙타의 꿈) game server.
 *
 * Energy Flow: Solar -> Tesla -> Kaus Coin -> Mining Power (게임 내 채굴 파워)
 *
 * Endpoints:
 * GET  /api/energy/bridge                - Get bridge status
 * GET  /api/energy/bridge?type=convert   - Get conversion rate
 * POST /api/energy/bridge                - Execute bridge transfer
 *
 * @version 37.0.0
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // Game Server (placeholder until Camel's Dream is ready)
  GAME_SERVER_URL: process.env.CAMELS_DREAM_API_URL || 'https://api.camelsdream.io',
  GAME_API_KEY: process.env.CAMELS_DREAM_API_KEY || '',

  // Conversion Rates
  KAUS_TO_MINING_POWER: 100, // 1 KAUS = 100 Mining Power
  MIN_TRANSFER: 10,          // Minimum 10 KAUS per transfer
  MAX_TRANSFER: 10000,       // Maximum 10,000 KAUS per transfer

  // Fee Structure
  BRIDGE_FEE_PERCENT: 1.0,   // 1% bridge fee
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface BridgeStatus {
  isOnline: boolean;
  gameServerConnected: boolean;
  conversionRate: number;
  dailyVolume: number;
  pendingTransfers: number;
  lastSync: string;
}

interface ConversionQuote {
  inputAmount: number;
  inputCurrency: 'KAUS' | 'MINING_POWER';
  outputAmount: number;
  outputCurrency: 'MINING_POWER' | 'KAUS';
  fee: number;
  feePercent: number;
  rate: number;
  validUntil: string;
}

interface BridgeTransfer {
  id: string;
  direction: 'TO_GAME' | 'FROM_GAME';
  inputAmount: number;
  outputAmount: number;
  fee: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  timestamp: string;
  gameTransactionId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

async function checkGameServerStatus(): Promise<boolean> {
  // In production, this would ping the game server
  // For now, return simulated status
  if (!CONFIG.GAME_API_KEY) {
    return false;
  }

  try {
    const response = await fetch(`${CONFIG.GAME_SERVER_URL}/health`, {
      headers: { 'X-API-Key': CONFIG.GAME_API_KEY },
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function getBridgeStats(): Promise<{ dailyVolume: number; pendingTransfers: number }> {
  // Fetch from database or return defaults
  const { data } = await supabase
    .from('system_config')
    .select('value')
    .eq('key', 'bridge_stats')
    .single();

  return {
    dailyVolume: data?.value?.dailyVolume || 0,
    pendingTransfers: data?.value?.pendingTransfers || 0,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET - Retrieve bridge information
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'status';
  const amount = parseFloat(searchParams.get('amount') || '0');
  const direction = searchParams.get('direction') as 'TO_GAME' | 'FROM_GAME' || 'TO_GAME';

  try {
    switch (type) {
      case 'convert': {
        if (amount <= 0) {
          return NextResponse.json({
            success: false,
            error: 'Amount must be greater than 0',
          }, { status: 400 });
        }

        const fee = amount * (CONFIG.BRIDGE_FEE_PERCENT / 100);
        const netAmount = amount - fee;
        const outputAmount = direction === 'TO_GAME'
          ? netAmount * CONFIG.KAUS_TO_MINING_POWER
          : netAmount / CONFIG.KAUS_TO_MINING_POWER;

        const quote: ConversionQuote = {
          inputAmount: amount,
          inputCurrency: direction === 'TO_GAME' ? 'KAUS' : 'MINING_POWER',
          outputAmount,
          outputCurrency: direction === 'TO_GAME' ? 'MINING_POWER' : 'KAUS',
          fee,
          feePercent: CONFIG.BRIDGE_FEE_PERCENT,
          rate: direction === 'TO_GAME' ? CONFIG.KAUS_TO_MINING_POWER : 1 / CONFIG.KAUS_TO_MINING_POWER,
          validUntil: new Date(Date.now() + 60000).toISOString(),
        };

        return NextResponse.json({
          success: true,
          data: quote,
          timestamp: new Date().toISOString(),
        });
      }

      case 'history': {
        // Return transfer history
        const { data: transfers } = await supabase
          .from('system_config')
          .select('value')
          .like('key', 'bridge_tx_%')
          .order('updated_at', { ascending: false })
          .limit(20);

        const history = transfers?.map(t => t.value) || [];

        return NextResponse.json({
          success: true,
          data: history,
          timestamp: new Date().toISOString(),
        });
      }

      case 'status':
      default: {
        const [gameServerConnected, stats] = await Promise.all([
          checkGameServerStatus(),
          getBridgeStats(),
        ]);

        const status: BridgeStatus = {
          isOnline: true,
          gameServerConnected,
          conversionRate: CONFIG.KAUS_TO_MINING_POWER,
          dailyVolume: stats.dailyVolume,
          pendingTransfers: stats.pendingTransfers,
          lastSync: new Date().toISOString(),
        };

        return NextResponse.json({
          success: true,
          data: status,
          config: {
            minTransfer: CONFIG.MIN_TRANSFER,
            maxTransfer: CONFIG.MAX_TRANSFER,
            feePercent: CONFIG.BRIDGE_FEE_PERCENT,
            gameServerUrl: CONFIG.GAME_SERVER_URL,
          },
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error('[BRIDGE API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Bridge API error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST - Execute bridge transfer
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { direction, amount, gameUserId } = body;

    // Validate input
    if (!direction || !['TO_GAME', 'FROM_GAME'].includes(direction)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid direction. Must be TO_GAME or FROM_GAME',
      }, { status: 400 });
    }

    if (!amount || amount < CONFIG.MIN_TRANSFER) {
      return NextResponse.json({
        success: false,
        error: `Minimum transfer is ${CONFIG.MIN_TRANSFER} KAUS`,
      }, { status: 400 });
    }

    if (amount > CONFIG.MAX_TRANSFER) {
      return NextResponse.json({
        success: false,
        error: `Maximum transfer is ${CONFIG.MAX_TRANSFER} KAUS`,
      }, { status: 400 });
    }

    // Check game server connection
    const gameConnected = await checkGameServerStatus();
    if (!gameConnected && direction === 'TO_GAME') {
      return NextResponse.json({
        success: false,
        error: 'Game server not connected. Please try again later.',
        hint: 'CAMELS_DREAM_API_KEY not configured or game server offline',
      }, { status: 503 });
    }

    // Calculate conversion
    const fee = amount * (CONFIG.BRIDGE_FEE_PERCENT / 100);
    const netAmount = amount - fee;
    const outputAmount = direction === 'TO_GAME'
      ? netAmount * CONFIG.KAUS_TO_MINING_POWER
      : netAmount / CONFIG.KAUS_TO_MINING_POWER;

    // Create transfer record
    const transferId = `bridge_tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const transfer: BridgeTransfer = {
      id: transferId,
      direction,
      inputAmount: amount,
      outputAmount,
      fee,
      status: gameConnected ? 'PROCESSING' : 'PENDING',
      timestamp: new Date().toISOString(),
    };

    // Store transfer
    await supabase.from('system_config').upsert({
      key: transferId,
      value: transfer,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });

    // In production with game server connected, execute the transfer
    if (gameConnected && direction === 'TO_GAME') {
      try {
        // This would call the game server API
        // const gameResponse = await fetch(`${CONFIG.GAME_SERVER_URL}/api/bridge/deposit`, {
        //   method: 'POST',
        //   headers: { 'X-API-Key': CONFIG.GAME_API_KEY },
        //   body: JSON.stringify({ userId: gameUserId, amount: outputAmount }),
        // });

        // Simulate success
        transfer.status = 'COMPLETED';
        transfer.gameTransactionId = `game_${Date.now()}`;

        await supabase.from('system_config').upsert({
          key: transferId,
          value: transfer,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });
      } catch (err) {
        transfer.status = 'FAILED';
        await supabase.from('system_config').upsert({
          key: transferId,
          value: transfer,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });

        return NextResponse.json({
          success: false,
          error: 'Transfer to game server failed',
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      data: transfer,
      message: direction === 'TO_GAME'
        ? `Queued ${amount} KAUS -> ${outputAmount.toLocaleString()} Mining Power`
        : `Queued ${amount} Mining Power -> ${outputAmount.toFixed(2)} KAUS`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[BRIDGE API] POST Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Bridge transfer failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
