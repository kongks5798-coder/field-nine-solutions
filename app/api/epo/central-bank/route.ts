/**
 * EPO CENTRAL BANK API
 *
 * Unified API for:
 * - Multi-Currency FIAT Gateway
 * - Sovereign Liquidity Aggregator
 * - Zero-Knowledge Proof of Reserve
 */

import { NextRequest, NextResponse } from 'next/server';
import { fiatGateway, getExchangeRate, getAllProviders, type FiatCurrency } from '@/lib/fintech/fiat-gateway';
import { liquidityAggregator, getLiquidityPools, type InstitutionalOrder } from '@/lib/fintech/liquidity-aggregator';
import { zkpPoR, getSolvencyReport, getRealTimeReserveStatus } from '@/lib/fintech/zkp-proof-of-reserve';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const module = searchParams.get('module');
  const action = searchParams.get('action');

  // FIAT MODULE
  if (module === 'fiat') {
    switch (action) {
      case 'rates': {
        const from = searchParams.get('from') as FiatCurrency | 'NXUSD' || 'NXUSD';
        const to = searchParams.get('to') as FiatCurrency || 'USD';
        const rate = getExchangeRate(from, to);

        return NextResponse.json({
          rate,
          timestamp: Date.now(),
        });
      }

      case 'all-rates': {
        const rates = fiatGateway.getAllRates();

        return NextResponse.json({
          rates,
          count: rates.length,
          timestamp: Date.now(),
        });
      }

      case 'providers': {
        const currency = searchParams.get('currency') as FiatCurrency;
        const providers = currency
          ? fiatGateway.getProvidersForCurrency(currency)
          : getAllProviders();

        return NextResponse.json({
          providers,
          count: providers.length,
        });
      }

      case 'stats': {
        const stats = fiatGateway.getStats();

        return NextResponse.json({
          stats,
          status: 'FIAT_GATEWAY_ACTIVE',
        });
      }
    }
  }

  // LIQUIDITY MODULE
  if (module === 'liquidity') {
    switch (action) {
      case 'pools': {
        const region = searchParams.get('region');
        const pools = region
          ? liquidityAggregator.getPoolsByRegion(region as 'APAC' | 'EMEA' | 'AMER' | 'MENA')
          : getLiquidityPools();

        return NextResponse.json({
          pools,
          count: pools.length,
          totalLiquidity: pools.reduce((sum, p) => sum + p.availableLiquidity, 0),
        });
      }

      case 'total': {
        const total = liquidityAggregator.getTotalLiquidity();
        const breakdown = liquidityAggregator.getLiquidityByRegion();

        return NextResponse.json({
          totalLiquidity: total,
          breakdown,
          formattedTotal: `$${(total / 1e9).toFixed(2)}B`,
        });
      }

      case 'stats': {
        const stats = liquidityAggregator.getStats();

        return NextResponse.json({
          stats,
          status: 'LIQUIDITY_AGGREGATOR_ONLINE',
        });
      }
    }
  }

  // ZKP-PoR MODULE
  if (module === 'por') {
    switch (action) {
      case 'status': {
        const status = getRealTimeReserveStatus();

        return NextResponse.json({
          status,
          message: status.status === 'FULLY_BACKED'
            ? '✅ All NXUSD is 100% backed by reserves'
            : '⚠️ Reserve ratio below target',
        });
      }

      case 'solvency': {
        const report = getSolvencyReport();

        return NextResponse.json({
          report,
          summary: {
            reserveRatio: `${(report.solvency.reserveRatio * 100).toFixed(2)}%`,
            status: report.solvency.status,
            excessReserves: `$${(report.solvency.excessReserves / 1e6).toFixed(2)}M`,
          },
        });
      }

      case 'verify': {
        const proofId = searchParams.get('proofId');

        if (!proofId) {
          return NextResponse.json({ error: 'Proof ID required' }, { status: 400 });
        }

        const verification = zkpPoR.verifyProof(proofId);

        return NextResponse.json({
          verification,
          message: verification.valid
            ? '✅ ZK Proof verified successfully'
            : '❌ Proof verification failed',
        });
      }

      case 'reserves': {
        const reserves = zkpPoR.getAllReserves();

        return NextResponse.json({
          reserves,
          total: zkpPoR.getTotalReserveValue(),
          count: reserves.length,
        });
      }

      case 'supply': {
        const supply = zkpPoR.getSupplyInfo();

        return NextResponse.json({
          supply,
          utilization: {
            circulatingPercent: (supply.totalCirculating / supply.totalMinted * 100).toFixed(2),
            defiPercent: (supply.activeInDeFi / supply.totalCirculating * 100).toFixed(2),
          },
        });
      }
    }
  }

  // Default: API overview
  return NextResponse.json({
    api: 'Field Nine Central Bank API',
    version: '1.0',
    description: 'The Energy Central Bank - FIAT Clearing & Liquidity Management',
    modules: {
      fiat: {
        description: 'Multi-Currency FIAT Gateway',
        endpoints: [
          'GET ?module=fiat&action=rates&from=NXUSD&to=KRW',
          'GET ?module=fiat&action=all-rates',
          'GET ?module=fiat&action=providers&currency=USD',
          'GET ?module=fiat&action=stats',
          'POST (cash-out) - Execute 1-Click Cash Out',
          'POST (deposit) - Deposit FIAT to NXUSD',
        ],
        supportedCurrencies: ['KRW', 'USD', 'EUR', 'JPY', 'CNY', 'GBP', 'AUD', 'SGD'],
      },
      liquidity: {
        description: 'Sovereign Liquidity Aggregator',
        endpoints: [
          'GET ?module=liquidity&action=pools',
          'GET ?module=liquidity&action=total',
          'GET ?module=liquidity&action=stats',
          'POST (route) - Calculate optimal order routing',
          'POST (execute) - Execute institutional order',
          'POST (simulate) - Run high-volume simulation',
        ],
        regions: ['APAC', 'EMEA', 'AMER', 'MENA'],
      },
      por: {
        description: 'Zero-Knowledge Proof of Reserve',
        endpoints: [
          'GET ?module=por&action=status',
          'GET ?module=por&action=solvency',
          'GET ?module=por&action=verify&proofId=...',
          'GET ?module=por&action=reserves',
          'GET ?module=por&action=supply',
        ],
        guarantee: '100% NXUSD backed by cash + energy assets',
      },
    },
    centralBankStatus: {
      status: 'OPERATIONAL',
      totalAUM: '$1.05B+',
      reserveRatio: '124.5%',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { module, action } = body;

    // Validate API key
    const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!apiKey || !apiKey.startsWith('fn_cb_')) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    // FIAT MODULE
    if (module === 'fiat') {
      switch (action) {
        case 'cash-out': {
          const { userId, nxusdAmount, targetCurrency, bankAccount, priority } = body;

          if (!userId || !nxusdAmount || !targetCurrency || !bankAccount) {
            return NextResponse.json(
              { error: 'Missing required fields' },
              { status: 400 }
            );
          }

          const result = await fiatGateway.executeOneClickCashOut({
            userId,
            nxusdAmount,
            targetCurrency,
            bankAccount,
            priority: priority || 'standard',
          });

          return NextResponse.json({
            success: result.success,
            result,
            message: `Cash out ${result.success ? 'successful' : 'failed'}: $${result.fiatAmount.toFixed(2)} ${result.currency}`,
          });
        }

        case 'deposit': {
          const { userId, amount, currency, providerId } = body;

          if (!userId || !amount || !currency || !providerId) {
            return NextResponse.json(
              { error: 'Missing required fields' },
              { status: 400 }
            );
          }

          const transaction = await fiatGateway.depositFiatToNxusd(
            userId,
            amount,
            currency,
            providerId
          );

          return NextResponse.json({
            success: true,
            transaction,
            message: `Deposited ${amount} ${currency} → ${transaction.toAmount.toFixed(2)} NXUSD`,
          });
        }

        case 'calculate': {
          const { fromAmount, from, to } = body;

          if (!fromAmount || !from || !to) {
            return NextResponse.json(
              { error: 'Missing required fields' },
              { status: 400 }
            );
          }

          const calculation = fiatGateway.calculateExchange(fromAmount, from, to);

          return NextResponse.json({
            calculation,
            summary: {
              input: `${fromAmount} ${from}`,
              output: `${calculation.toAmount.toFixed(4)} ${to}`,
              fees: `${calculation.fees.totalFee.toFixed(4)} ${from}`,
            },
          });
        }
      }
    }

    // LIQUIDITY MODULE
    if (module === 'liquidity') {
      switch (action) {
        case 'route': {
          const orderParams = body.order as InstitutionalOrder;

          if (!orderParams || !orderParams.baseAmount) {
            return NextResponse.json(
              { error: 'Invalid order parameters' },
              { status: 400 }
            );
          }

          const routing = liquidityAggregator.calculateOptimalRouting({
            ...orderParams,
            orderId: orderParams.orderId || `ORD-${Date.now().toString(36).toUpperCase()}`,
          });

          return NextResponse.json({
            routing,
            summary: {
              totalSlices: routing.slices.length,
              estimatedSlippage: `${routing.estimatedSlippage.toFixed(4)}%`,
              strategy: routing.executionStrategy,
            },
          });
        }

        case 'execute': {
          const orderParams = body.order as InstitutionalOrder;

          if (!orderParams || !orderParams.baseAmount) {
            return NextResponse.json(
              { error: 'Invalid order parameters' },
              { status: 400 }
            );
          }

          const report = await liquidityAggregator.executeOrder({
            ...orderParams,
            orderId: orderParams.orderId || `ORD-${Date.now().toString(36).toUpperCase()}`,
          });

          return NextResponse.json({
            success: report.status === 'filled',
            report,
            summary: {
              fillRate: `${((report.filledAmount / (report.filledAmount + report.remainingAmount)) * 100).toFixed(2)}%`,
              avgPrice: report.avgExecutionPrice.toFixed(6),
              slippage: `${report.actualSlippage.toFixed(4)}%`,
            },
          });
        }

        case 'simulate': {
          const { orderCount, avgOrderSize, maxOrderSize, durationMs } = body;

          const result = await liquidityAggregator.runHighVolumeSimulation({
            orderCount: orderCount || 100,
            avgOrderSize: avgOrderSize || 10000000,
            maxOrderSize: maxOrderSize || 100000000,
            durationMs: durationMs || 60000,
          });

          return NextResponse.json({
            success: true,
            simulation: result,
            summary: {
              volume: `$${(result.totalVolume / 1e6).toFixed(2)}M`,
              avgSlippage: `${result.avgSlippage.toFixed(4)}%`,
              successRate: `${result.avgFillRate.toFixed(2)}%`,
            },
          });
        }
      }
    }

    // ZKP-PoR MODULE
    if (module === 'por') {
      switch (action) {
        case 'generate-proof': {
          const proof = zkpPoR.generateZKProof();

          return NextResponse.json({
            success: true,
            proof,
            message: `ZK Proof generated: ${proof.proofId}`,
          });
        }

        case 'simulate-deposit': {
          const { assetType, amount, usdValue } = body;

          zkpPoR.simulateDeposit(assetType, amount, usdValue);
          const status = getRealTimeReserveStatus();

          return NextResponse.json({
            success: true,
            newStatus: status,
            message: `Deposited $${usdValue.toLocaleString()} worth of ${assetType}`,
          });
        }
      }
    }

    return NextResponse.json(
      { error: 'Unknown module/action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Central Bank API Error]', error);
    return NextResponse.json(
      { error: 'Operation failed', details: String(error) },
      { status: 500 }
    );
  }
}
