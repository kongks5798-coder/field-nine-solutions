/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 57: BLOCKCHAIN API ROUTES
 * ═══════════════════════════════════════════════════════════════════════════════
 * Unified blockchain data endpoint using Alchemy
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getBlockchainTVL,
  getWalletBalance,
  getTokenBalance,
  getTransactionStatus,
  getGasEstimate,
  isAlchemyConfigured,
  type Network,
} from '@/lib/blockchain/alchemy-client';

// ═══════════════════════════════════════════════════════════════════════════════
// GET: Query blockchain data
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  const network = (searchParams.get('network') as Network) || 'ethereum';

  try {
    switch (action) {
      case 'tvl': {
        const tvl = await getBlockchainTVL(network);
        return NextResponse.json({
          success: true,
          data: tvl,
          isLive: isAlchemyConfigured(),
        });
      }

      case 'balance': {
        const address = searchParams.get('address');
        if (!address) {
          return NextResponse.json(
            { success: false, error: 'Address required' },
            { status: 400 }
          );
        }
        const balance = await getWalletBalance(address, network);
        return NextResponse.json({
          success: true,
          data: { address, balance, network },
          isLive: isAlchemyConfigured(),
        });
      }

      case 'token': {
        const walletAddress = searchParams.get('wallet');
        const tokenAddress = searchParams.get('token');
        if (!walletAddress || !tokenAddress) {
          return NextResponse.json(
            { success: false, error: 'Wallet and token addresses required' },
            { status: 400 }
          );
        }
        const tokenBalance = await getTokenBalance(walletAddress, tokenAddress, network);
        return NextResponse.json({
          success: true,
          data: tokenBalance,
          isLive: isAlchemyConfigured(),
        });
      }

      case 'tx': {
        const txHash = searchParams.get('hash');
        if (!txHash) {
          return NextResponse.json(
            { success: false, error: 'Transaction hash required' },
            { status: 400 }
          );
        }
        const txStatus = await getTransactionStatus(txHash, network);
        return NextResponse.json({
          success: true,
          data: txStatus,
          isLive: isAlchemyConfigured(),
        });
      }

      case 'gas': {
        const gasEstimate = await getGasEstimate(network);
        return NextResponse.json({
          success: true,
          data: gasEstimate,
          isLive: isAlchemyConfigured(),
        });
      }

      case 'status': {
        return NextResponse.json({
          success: true,
          data: {
            configured: isAlchemyConfigured(),
            supportedNetworks: ['ethereum', 'arbitrum', 'polygon', 'optimism'],
            version: '1.0.0',
          },
        });
      }

      default: {
        // Default: return TVL summary
        const tvl = await getBlockchainTVL(network);
        return NextResponse.json({
          success: true,
          data: tvl,
          availableActions: ['tvl', 'balance', 'token', 'tx', 'gas', 'status'],
          isLive: isAlchemyConfigured(),
        });
      }
    }
  } catch (error) {
    console.error('[Blockchain API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        isLive: false,
      },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST: Batch queries
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { queries } = body;

    if (!Array.isArray(queries) || queries.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Queries array required' },
        { status: 400 }
      );
    }

    // Limit batch size
    if (queries.length > 10) {
      return NextResponse.json(
        { success: false, error: 'Maximum 10 queries per batch' },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      queries.map(async (query: { action: string; params: Record<string, string> }) => {
        const { action, params } = query;
        const network = (params?.network as Network) || 'ethereum';

        try {
          switch (action) {
            case 'tvl':
              return { action, data: await getBlockchainTVL(network), success: true };
            case 'balance':
              return {
                action,
                data: await getWalletBalance(params.address, network),
                success: true,
              };
            case 'gas':
              return { action, data: await getGasEstimate(network), success: true };
            default:
              return { action, error: 'Unknown action', success: false };
          }
        } catch (error) {
          return { action, error: String(error), success: false };
        }
      })
    );

    return NextResponse.json({
      success: true,
      results,
      isLive: isAlchemyConfigured(),
    });
  } catch (error) {
    console.error('[Blockchain API] Batch error:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
