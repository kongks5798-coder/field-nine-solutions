/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ENERGY-TOKEN SWAP API - THE TRADING FLOOR
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Phase 37: THE FINAL CONVERGENCE
 *
 * Endpoints:
 * GET  /api/energy/swap?type=quote     - Get swap quote
 * GET  /api/energy/swap?type=assets    - Get available energy assets
 * GET  /api/energy/swap?type=wallet    - Get Kaus wallet balance
 * POST /api/energy/swap                - Execute swap
 *
 * @version 37.0.0
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import {
  getKausWalletBalance,
  getEnergyAssets,
  getSwapQuote,
  executeEnergySwap,
  getKausTransactions,
} from '@/lib/energy/kaus-wallet';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ═══════════════════════════════════════════════════════════════════════════════
// GET - Retrieve swap information
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'wallet';
  const inputType = searchParams.get('inputType') as 'ENERGY' | 'KAUS' || 'ENERGY';
  const amount = parseFloat(searchParams.get('amount') || '0');

  try {
    switch (type) {
      case 'quote': {
        if (amount <= 0) {
          return NextResponse.json({
            success: false,
            error: 'Amount must be greater than 0',
          }, { status: 400 });
        }

        const quote = await getSwapQuote(inputType, amount);
        return NextResponse.json({
          success: true,
          data: quote,
          timestamp: new Date().toISOString(),
        });
      }

      case 'assets': {
        const assets = await getEnergyAssets();
        return NextResponse.json({
          success: true,
          data: assets,
          timestamp: new Date().toISOString(),
        });
      }

      case 'transactions': {
        const transactions = await getKausTransactions();
        return NextResponse.json({
          success: true,
          data: transactions,
          timestamp: new Date().toISOString(),
        });
      }

      case 'wallet':
      default: {
        const wallet = await getKausWalletBalance();
        const assets = await getEnergyAssets();

        return NextResponse.json({
          success: true,
          data: {
            wallet,
            assets,
            exchangeRate: {
              kwhToKaus: 10,
              kausPriceUSD: 0.10,
              kausPriceKRW: 135,
            },
          },
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error('[SWAP API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Swap API error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST - Execute swap
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { inputType, amount, action } = body;

    // Validate input
    if (action === 'SWAP') {
      if (!inputType || !['ENERGY', 'KAUS'].includes(inputType)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid input type. Must be ENERGY or KAUS',
        }, { status: 400 });
      }

      if (!amount || amount <= 0) {
        return NextResponse.json({
          success: false,
          error: 'Amount must be greater than 0',
        }, { status: 400 });
      }

      // Check available balance
      if (inputType === 'ENERGY') {
        const assets = await getEnergyAssets();
        const totalEnergy = assets.reduce((sum, a) => sum + a.kwhAvailable, 0);
        if (amount > totalEnergy) {
          return NextResponse.json({
            success: false,
            error: `Insufficient energy. Available: ${totalEnergy.toFixed(2)} kWh`,
          }, { status: 400 });
        }
      } else {
        const wallet = await getKausWalletBalance();
        if (amount > wallet.kausBalance) {
          return NextResponse.json({
            success: false,
            error: `Insufficient Kaus balance. Available: ${wallet.kausBalanceFormatted}`,
          }, { status: 400 });
        }
      }

      // Execute swap
      const result = await executeEnergySwap(inputType, amount);

      if (result.success) {
        return NextResponse.json({
          success: true,
          data: result,
          message: inputType === 'ENERGY'
            ? `Successfully converted ${amount} kWh to ${result.outputAmount.toFixed(2)} KAUS`
            : `Successfully converted ${amount} KAUS to ${result.outputAmount.toFixed(2)} kWh`,
          timestamp: new Date().toISOString(),
        });
      } else {
        return NextResponse.json({
          success: false,
          error: result.error || 'Swap failed',
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action',
    }, { status: 400 });

  } catch (error) {
    console.error('[SWAP API] POST Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Swap execution failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
