/**
 * SOVEREIGN LIFE API
 *
 * 필드나인 생태계 통합 API
 * - Black Card Engine
 * - Mini Node Mining
 * - Wealth Aggregator
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  blackCardEngine,
  getCardAccount,
  calculateCashback,
  getAllCardTiers,
  CARD_CONFIG,
  FiatCurrency,
  MerchantCategory,
  CardTier,
} from '@/lib/sovereign/black-card-engine';
import {
  miniNodeMining,
  getUserMiniNodes,
  estimateMiningEarnings,
  getMiningReport,
  getGlobalMiningStats,
  MINING_CONFIG,
  DeviceType,
  PerformanceTier,
} from '@/lib/sovereign/mini-node-mining';
import {
  wealthAggregator,
  getUnifiedPortfolio,
  getNetWorth,
  getUpcomingDividends,
  getSpendingPower,
  getPassiveIncome,
  WEALTH_CONFIG,
} from '@/lib/sovereign/wealth-aggregator';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const module = searchParams.get('module');
  const action = searchParams.get('action');
  const userId = searchParams.get('userId') || 'USER-BOSS';

  // CARD MODULE
  if (module === 'card') {
    switch (action) {
      case 'account': {
        const accountId = searchParams.get('accountId') || 'CARD-001';
        const account = getCardAccount(accountId);
        return NextResponse.json({
          account,
          config: CARD_CONFIG.TIERS[account?.cardTier || 'STANDARD'],
        });
      }

      case 'tiers': {
        const tiers = getAllCardTiers();
        return NextResponse.json({
          tiers,
          ecosystemCashback: CARD_CONFIG.ECOSYSTEM_CASHBACK,
        });
      }

      case 'transactions': {
        const accountId = searchParams.get('accountId') || 'CARD-001';
        const limit = parseInt(searchParams.get('limit') || '50');
        const transactions = blackCardEngine.getTransactions(accountId, limit);
        return NextResponse.json({
          transactions,
          count: transactions.length,
        });
      }

      case 'cashback-preview': {
        const amount = parseFloat(searchParams.get('amount') || '100');
        const category = searchParams.get('category') as MerchantCategory || 'GENERAL';
        const tier = searchParams.get('tier') as CardTier || 'SOVEREIGN';

        const cashback = calculateCashback(amount, category, tier);
        return NextResponse.json({
          cashback,
          message: `${cashback.totalCashbackKaus.toFixed(4)} K-AUS cashback for $${amount} at ${category}`,
        });
      }

      case 'ecosystem-stats': {
        const accountId = searchParams.get('accountId') || 'CARD-001';
        const stats = blackCardEngine.getEcosystemStats(accountId);
        return NextResponse.json({
          stats,
          partners: ['Aura Sydney', 'Nomad Monthly', 'Energy Partners'],
        });
      }

      case 'dividends': {
        const dividends = blackCardEngine.getDividendHistory(userId, 20);
        return NextResponse.json({
          dividends,
          count: dividends.length,
        });
      }

      case 'conversions': {
        const accountId = searchParams.get('accountId') || 'CARD-001';
        const conversions = blackCardEngine.getConversionHistory(accountId);
        return NextResponse.json({
          conversions,
          currentRate: blackCardEngine.getCurrentRate(),
        });
      }
    }
  }

  // MINING MODULE
  if (module === 'mining') {
    switch (action) {
      case 'nodes': {
        const nodes = getUserMiniNodes(userId);
        return NextResponse.json({
          nodes,
          count: nodes.length,
        });
      }

      case 'global-stats': {
        const stats = getGlobalMiningStats();
        return NextResponse.json({
          stats,
          config: MINING_CONFIG,
        });
      }

      case 'estimate': {
        const deviceType = searchParams.get('deviceType') as DeviceType || 'LAPTOP';
        const performanceTier = searchParams.get('tier') as PerformanceTier || 'BALANCED';
        const hoursPerDay = parseFloat(searchParams.get('hours') || '8');
        const sleepPercentage = parseFloat(searchParams.get('sleep') || '0.5');
        const networkTier = searchParams.get('networkTier') || 'NONE';

        const estimate = estimateMiningEarnings({
          deviceType,
          performanceTier,
          hoursPerDay,
          sleepModePercentage: sleepPercentage,
          networkTier: networkTier as 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM',
        });

        return NextResponse.json({
          estimate,
          deviceType,
          performanceTier,
          hoursPerDay,
        });
      }

      case 'report': {
        const period = searchParams.get('period') || 'MONTHLY';
        const report = getMiningReport(userId, period as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME');
        return NextResponse.json({
          report,
        });
      }

      case 'sessions': {
        const nodeId = searchParams.get('nodeId');
        if (!nodeId) {
          return NextResponse.json({ error: 'nodeId required' }, { status: 400 });
        }
        const sessions = miniNodeMining.getNodeSessions(nodeId, 20);
        return NextResponse.json({
          sessions,
          count: sessions.length,
        });
      }
    }
  }

  // WEALTH MODULE
  if (module === 'wealth') {
    switch (action) {
      case 'portfolio': {
        const portfolio = getUnifiedPortfolio(userId);
        return NextResponse.json({
          portfolio,
          config: WEALTH_CONFIG,
        });
      }

      case 'net-worth': {
        const netWorth = getNetWorth(userId);
        return NextResponse.json({
          netWorth,
        });
      }

      case 'dividends': {
        const days = parseInt(searchParams.get('days') || '30');
        const dividends = getUpcomingDividends(userId, days);
        return NextResponse.json({
          dividends,
          count: dividends.length,
          totalExpectedKaus: dividends.reduce((sum, d) => sum + d.amountKaus, 0),
          totalExpectedUSD: dividends.reduce((sum, d) => sum + d.amountUSD, 0),
        });
      }

      case 'spending-power': {
        const spendingPower = getSpendingPower(userId);
        return NextResponse.json({
          spendingPower,
        });
      }

      case 'passive-income': {
        const passiveIncome = getPassiveIncome(userId);
        return NextResponse.json({
          passiveIncome,
        });
      }
    }
  }

  // Default: API Overview
  return NextResponse.json({
    api: 'Sovereign Life API',
    version: '1.0',
    description: 'Field Nine Lifestyle Integration',
    tagline: '시스템을 넘어 라이프스타일이 되다',
    modules: {
      card: {
        description: 'Sovereign Black Card - K-AUS to FIAT Payment',
        endpoints: [
          'GET ?module=card&action=account',
          'GET ?module=card&action=tiers',
          'GET ?module=card&action=transactions',
          'GET ?module=card&action=cashback-preview&amount={n}&category={cat}',
          'GET ?module=card&action=ecosystem-stats',
          'GET ?module=card&action=dividends',
        ],
        partners: ['Aura Sydney (Fashion 10%)', 'Nomad Monthly (Travel 10%)'],
      },
      mining: {
        description: 'Mini Node Mining - Consumer Compute Contribution',
        endpoints: [
          'GET ?module=mining&action=nodes',
          'GET ?module=mining&action=global-stats',
          'GET ?module=mining&action=estimate&deviceType={type}&hours={n}',
          'GET ?module=mining&action=report&period={period}',
        ],
        concept: '당신의 기기가 잠든 사이 에너지를 지능으로 바꿉니다',
      },
      wealth: {
        description: 'Unified Wealth Overview',
        endpoints: [
          'GET ?module=wealth&action=portfolio',
          'GET ?module=wealth&action=net-worth',
          'GET ?module=wealth&action=dividends',
          'GET ?module=wealth&action=spending-power',
          'GET ?module=wealth&action=passive-income',
        ],
      },
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { module, action } = body;
    const userId = body.userId || 'USER-BOSS';

    // CARD MODULE
    if (module === 'card') {
      switch (action) {
        case 'convert': {
          const { accountId, kausAmount, targetCurrency } = body;

          if (!kausAmount || !targetCurrency) {
            return NextResponse.json({ error: 'kausAmount and targetCurrency required' }, { status: 400 });
          }

          const conversion = blackCardEngine.convertKausToFiat(
            accountId || 'CARD-001',
            kausAmount,
            targetCurrency as FiatCurrency
          );

          return NextResponse.json({
            success: true,
            conversion,
            message: `Converted ${kausAmount} K-AUS to ${conversion.netFiatAmount.toFixed(2)} ${targetCurrency}`,
          });
        }

        case 'purchase': {
          const { accountId, amount, currency, merchantName, merchantCategory, useKaus, location } = body;

          if (!amount || !merchantName) {
            return NextResponse.json({ error: 'amount and merchantName required' }, { status: 400 });
          }

          const transaction = blackCardEngine.processPurchase({
            accountId: accountId || 'CARD-001',
            amount,
            currency: currency || 'USD',
            merchantName,
            merchantCategory: merchantCategory || 'GENERAL',
            useKaus: useKaus ?? true,
            location,
          });

          return NextResponse.json({
            success: true,
            transaction,
            message: `Purchase of $${amount} at ${merchantName} - Cashback: ${(transaction.cashbackKaus + transaction.ecosystemBonus).toFixed(4)} K-AUS`,
          });
        }

        case 'load-dividend': {
          const { source, kausAmount, autoConvert, targetCurrency } = body;

          if (!kausAmount) {
            return NextResponse.json({ error: 'kausAmount required' }, { status: 400 });
          }

          const dividend = blackCardEngine.loadDividend({
            userId,
            source: source || 'ENERGY_NODE',
            kausAmount,
            autoConvert: autoConvert ?? false,
            targetCurrency,
          });

          return NextResponse.json({
            success: true,
            dividend,
            message: `Loaded ${kausAmount} K-AUS dividend to card`,
          });
        }
      }
    }

    // MINING MODULE
    if (module === 'mining') {
      switch (action) {
        case 'register': {
          const { deviceType, deviceName, deviceModel, osVersion } = body;

          if (!deviceType || !deviceName) {
            return NextResponse.json({ error: 'deviceType and deviceName required' }, { status: 400 });
          }

          const node = miniNodeMining.registerNode({
            userId,
            deviceType,
            deviceName,
            deviceModel: deviceModel || 'Unknown',
            osVersion: osVersion || 'Unknown',
          });

          return NextResponse.json({
            success: true,
            node,
            message: `Registered ${deviceType} node: ${deviceName}`,
          });
        }

        case 'start': {
          const { nodeId } = body;

          if (!nodeId) {
            return NextResponse.json({ error: 'nodeId required' }, { status: 400 });
          }

          const session = miniNodeMining.startMining(nodeId);
          return NextResponse.json({
            success: true,
            session,
            message: `Mining started on ${nodeId}`,
          });
        }

        case 'stop': {
          const { nodeId } = body;

          if (!nodeId) {
            return NextResponse.json({ error: 'nodeId required' }, { status: 400 });
          }

          const session = miniNodeMining.stopMining(nodeId);
          return NextResponse.json({
            success: true,
            session,
            message: session ? `Mining stopped - Earned ${session.kausEarned.toFixed(4)} K-AUS` : 'No active session',
          });
        }

        case 'toggle-sleep': {
          const { nodeId, enabled } = body;

          if (!nodeId || enabled === undefined) {
            return NextResponse.json({ error: 'nodeId and enabled required' }, { status: 400 });
          }

          miniNodeMining.toggleSleepMode(nodeId, enabled);
          return NextResponse.json({
            success: true,
            message: `Sleep mode ${enabled ? 'enabled' : 'disabled'} for ${nodeId}`,
          });
        }

        case 'update-tier': {
          const { nodeId, tier } = body;

          if (!nodeId || !tier) {
            return NextResponse.json({ error: 'nodeId and tier required' }, { status: 400 });
          }

          miniNodeMining.updatePerformanceTier(nodeId, tier);
          return NextResponse.json({
            success: true,
            message: `Performance tier updated to ${tier}`,
          });
        }
      }
    }

    // WEALTH MODULE
    if (module === 'wealth') {
      switch (action) {
        case 'refresh': {
          wealthAggregator.refreshPortfolio(userId);
          const portfolio = wealthAggregator.getPortfolio(userId);
          return NextResponse.json({
            success: true,
            portfolio,
            message: 'Portfolio refreshed',
          });
        }
      }
    }

    return NextResponse.json(
      { error: 'Unknown module/action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Sovereign API Error]', error);
    return NextResponse.json(
      { error: 'Operation failed', details: String(error) },
      { status: 500 }
    );
  }
}
