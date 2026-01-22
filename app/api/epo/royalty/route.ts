/**
 * EPO ROYALTY API
 *
 * Track and manage royalty earnings from energy verifications.
 * Like Spotify for energy - every stream generates revenue.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  globalEnergyRoyaltyEngine,
  ROYALTY_TIERS,
  ROYALTY_DISTRIBUTION,
} from '@/lib/epo/royalty-engine';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const nodeId = searchParams.get('nodeId') || 'YEONGDONG-001';

  switch (action) {
    case 'balance': {
      const account = globalEnergyRoyaltyEngine.getNodeAccount(nodeId);
      if (!account) {
        return NextResponse.json({ error: 'Node not found' }, { status: 404 });
      }

      return NextResponse.json({
        nodeId: account.nodeId,
        pendingRoyalties: account.pendingRoyalties,
        totalEarned: account.totalEarned,
        totalVerifications: account.totalVerifications,
        lastSettlement: new Date(account.lastSettlement).toISOString(),
        currency: 'NXUSD',
        distribution: ROYALTY_DISTRIBUTION,
      });
    }

    case 'transactions': {
      const account = globalEnergyRoyaltyEngine.getNodeAccount(nodeId);
      if (!account) {
        return NextResponse.json({ error: 'Node not found' }, { status: 404 });
      }

      const limit = parseInt(searchParams.get('limit') || '50', 10);
      const transactions = account.transactions.slice(-limit);

      return NextResponse.json({
        nodeId,
        transactions: transactions.map(tx => ({
          transactionId: tx.transactionId,
          timestamp: new Date(tx.timestamp).toISOString(),
          type: tx.type,
          amount: tx.amount,
          currency: 'NXUSD',
          status: tx.status,
          watermarkId: tx.watermarkId,
        })),
        total: account.transactions.length,
      });
    }

    case 'stats': {
      const stats = globalEnergyRoyaltyEngine.getGlobalStats();
      return NextResponse.json({
        global: stats,
        tiers: ROYALTY_TIERS,
        distribution: ROYALTY_DISTRIBUTION,
      });
    }

    case 'leaderboard': {
      const leaderboard = globalEnergyRoyaltyEngine.getConsumerLeaderboard();
      return NextResponse.json({
        leaderboard,
        description: 'Top API consumers by verification volume',
      });
    }

    case 'projection': {
      const projection = globalEnergyRoyaltyEngine.calculateMarketProjection();
      return NextResponse.json({
        projections: projection,
        assumptions: {
          avgVerificationsPerNode: '1M/month',
          avgRoyaltyRate: '$0.0006/verification',
          renewableEnergyGrowth: '15%/year',
        },
        revenueModel: {
          perKwh: {
            attestation: 0,          // Free to attest
            verification: 0.001,      // $0.001 per verification
            certification: 0.01,      // $0.01 for certified proof
          },
          subscription: {
            standard: { monthly: 0, limit: 10000 },
            premium: { monthly: 99, limit: 100000 },
            enterprise: { monthly: 999, limit: 1000000 },
            sovereign: { monthly: 4999, limit: -1 },
          },
        },
      });
    }

    case 'stream': {
      // Real-time royalty stream (simulated)
      const recent = globalEnergyRoyaltyEngine.getRecentTransactions(10);
      return NextResponse.json({
        stream: recent.map(tx => ({
          id: tx.transactionId,
          time: new Date(tx.timestamp).toISOString(),
          amount: tx.amount,
          nodeId: tx.nodeId,
        })),
        nextUpdate: '1s',
      });
    }

    default:
      const globalStats = globalEnergyRoyaltyEngine.getGlobalStats();
      return NextResponse.json({
        api: 'EPO Royalty API',
        version: '1.0',
        summary: {
          totalVerifications: globalStats.totalVerifications.toLocaleString(),
          totalRoyalties: `$${globalStats.totalRoyaltiesDistributed.toLocaleString()}`,
          activeNodes: globalStats.totalNodesRegistered,
          apiConsumers: globalStats.totalApiConsumers,
          last24h: {
            verifications: globalStats.last24hVerifications.toLocaleString(),
            royalties: `$${globalStats.last24hRoyalties.toFixed(2)}`,
          },
          projectedAnnual: `$${(globalStats.projectedAnnualRevenue / 1000000).toFixed(1)}M`,
        },
        endpoints: {
          'GET /api/epo/royalty?action=balance&nodeId=X': 'Node royalty balance',
          'GET /api/epo/royalty?action=transactions&nodeId=X': 'Transaction history',
          'GET /api/epo/royalty?action=stats': 'Global statistics',
          'GET /api/epo/royalty?action=leaderboard': 'Top API consumers',
          'GET /api/epo/royalty?action=projection': 'Market projections',
          'GET /api/epo/royalty?action=stream': 'Real-time royalty stream',
          'POST /api/epo/royalty': 'Settle royalties',
        },
      });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, nodeId } = body;

    // Validate API key
    const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!apiKey || !apiKey.startsWith('fn_epo_')) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    switch (action) {
      case 'settle': {
        if (!nodeId) {
          return NextResponse.json(
            { error: 'nodeId required for settlement' },
            { status: 400 }
          );
        }

        const result = globalEnergyRoyaltyEngine.settleRoyalties(nodeId);
        return NextResponse.json({
          success: result.settled,
          nodeId,
          settledAmount: result.amount,
          currency: 'NXUSD',
          polygonTxHash: result.transactionHash,
          settlementTime: new Date().toISOString(),
        });
      }

      case 'register': {
        const { name, tier } = body;
        if (!name || !tier) {
          return NextResponse.json(
            { error: 'name and tier required for registration' },
            { status: 400 }
          );
        }

        const validTiers = ['standard', 'premium', 'enterprise', 'sovereign'] as const;
        type ValidTier = typeof validTiers[number];

        if (!validTiers.includes(tier as ValidTier)) {
          return NextResponse.json(
            { error: 'Invalid tier. Must be: standard, premium, enterprise, or sovereign' },
            { status: 400 }
          );
        }

        const validatedTier = tier as ValidTier;
        const consumer = globalEnergyRoyaltyEngine.registerConsumer(name, validatedTier);
        return NextResponse.json({
          success: true,
          consumer: {
            apiKey: consumer.apiKey,
            name: consumer.name,
            tier: consumer.tier,
            status: consumer.status,
          },
          tierDetails: ROYALTY_TIERS[validatedTier],
        });
      }

      default:
        return NextResponse.json(
          { error: 'Unknown action. Use: settle, register' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[EPO Royalty Error]', error);
    return NextResponse.json(
      { error: 'Royalty operation failed', details: String(error) },
      { status: 500 }
    );
  }
}
