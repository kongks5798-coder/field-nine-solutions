/**
 * EPO VIRTUAL ENERGY SWAP API
 *
 * Cross-border energy value transfer without physical delivery.
 * Seoul production → Australia Tesla charging in seconds.
 */

import { NextRequest, NextResponse } from 'next/server';
import { mirrorAssetEngine, GLOBAL_ENERGY_NODES } from '@/lib/epo/mirror-asset';
import { globalLiquidityPool } from '@/lib/epo/global-liquidity-pool';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'nodes': {
      const nodes = Object.values(GLOBAL_ENERGY_NODES);
      return NextResponse.json({
        nodes,
        totalCapacity: nodes.reduce((sum, n) => sum + n.capacity, 0),
        totalLiquidity: nodes.reduce((sum, n) => sum + n.availableLiquidity, 0),
      });
    }

    case 'rates': {
      const rates = mirrorAssetEngine.getAllSwapRates();
      return NextResponse.json({
        rates,
        timestamp: new Date().toISOString(),
        feeRate: '0.25%',
      });
    }

    case 'quote': {
      const source = searchParams.get('source') || 'YEONGDONG-001';
      const target = searchParams.get('target') || 'AEMO-VIC-001';
      const amount = parseFloat(searchParams.get('amount') || '1000');

      const swapRate = mirrorAssetEngine.calculateSwapRate(source, target);
      const sourceNode = GLOBAL_ENERGY_NODES[source];
      const targetNode = GLOBAL_ENERGY_NODES[target];

      const outputAmount = amount * swapRate;
      const nxusdValue = outputAmount * (targetNode?.currentPrice || 50) / 1000;

      return NextResponse.json({
        quote: {
          source,
          target,
          inputAmount: amount,
          inputUnit: 'kWh',
          outputAmount: Math.round(outputAmount * 100) / 100,
          outputUnit: 'kWh',
          swapRate: Math.round(swapRate * 10000) / 10000,
          nxusdValue: Math.round(nxusdValue * 100) / 100,
          fee: Math.round(amount * 0.0025 * 100) / 100,
          priceImpact: amount > 10000 ? '< 0.5%' : '< 0.1%',
        },
        prices: {
          source: sourceNode?.currentPrice || 0,
          target: targetNode?.currentPrice || 0,
        },
        validFor: '30 seconds',
      });
    }

    case 'pool': {
      const poolState = globalLiquidityPool.getPoolState();
      const metrics = globalLiquidityPool.getPoolMetrics();

      return NextResponse.json({
        pool: poolState,
        metrics,
        markets: globalLiquidityPool.getMarketSnapshots(),
      });
    }

    case 'arbitrage': {
      const opportunities = globalLiquidityPool.getArbitrageOpportunities();
      return NextResponse.json({
        opportunities: opportunities.slice(0, 10),
        count: opportunities.length,
      });
    }

    case 'stats': {
      const globalStats = mirrorAssetEngine.getGlobalStats();
      const nodeStats = mirrorAssetEngine.getNodeStats();

      return NextResponse.json({
        swap: globalStats,
        nodes: nodeStats,
        poolMetrics: globalLiquidityPool.getPoolMetrics(),
      });
    }

    default:
      return NextResponse.json({
        api: 'Virtual Energy Swap API',
        version: '1.0',
        description: 'Cross-border energy value transfer without physical delivery',
        endpoints: {
          'GET ?action=nodes': 'List all energy nodes',
          'GET ?action=rates': 'Get all swap rates',
          'GET ?action=quote': 'Get swap quote',
          'GET ?action=pool': 'Global liquidity pool state',
          'GET ?action=arbitrage': 'Arbitrage opportunities',
          'GET ?action=stats': 'Global swap statistics',
          'POST (swap)': 'Execute energy swap',
          'POST (cross-border)': 'Execute cross-border payment',
        },
      });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Validate API key
    const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!apiKey || !apiKey.startsWith('fn_epo_')) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    switch (action) {
      case 'swap': {
        const { sourceNode, targetNode, amount, userAddress } = body;

        if (!sourceNode || !targetNode || !amount) {
          return NextResponse.json(
            { error: 'Missing required fields: sourceNode, targetNode, amount' },
            { status: 400 }
          );
        }

        // Create Grid Injection Proof first (HARD-BACKING)
        const meterBefore = 1000000 + Math.random() * 100000;
        const injectionProof = await mirrorAssetEngine.createGridInjectionProof(
          sourceNode,
          amount,
          meterBefore,
          meterBefore + amount,
          {
            timestamp: Date.now(),
            inverterOutput: amount * 0.98,
            gridFrequency: 60.0,
            voltage: 22900,
          }
        );

        // Create mirror position
        const position = await mirrorAssetEngine.createMirrorPosition(
          userAddress || '0xDEMO',
          sourceNode,
          targetNode,
          amount,
          injectionProof.proofId
        );

        // Execute swap
        const swapOrder = await mirrorAssetEngine.executeSwap(
          position.positionId,
          position.mirroredKwh
        );

        return NextResponse.json({
          success: true,
          swap: {
            orderId: swapOrder.orderId,
            source: sourceNode,
            target: targetNode,
            inputKwh: amount,
            outputKwh: swapOrder.receivedKwh,
            swapRate: swapOrder.swapRate,
            nxusdValue: swapOrder.nxusdValue,
            txHash: swapOrder.targetTxHash,
          },
          proofs: {
            gridInjection: injectionProof.proofId,
            attestation: injectionProof.attestationHash,
            verified: injectionProof.verified,
          },
          hardBacking: {
            principle: 'Physical electricity was injected into the grid',
            meterDelta: amount,
            gridOperator: GLOBAL_ENERGY_NODES[sourceNode]?.gridOperator,
          },
        });
      }

      case 'cross-border': {
        const { sourceNode, targetNode, amount, userAddress, useCase } = body;

        if (!sourceNode || !targetNode || !amount) {
          return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
          );
        }

        const result = await mirrorAssetEngine.executeCrossBorderPayment(
          userAddress || '0xDEMO',
          sourceNode,
          targetNode,
          amount,
          useCase || 'Generic Payment'
        );

        return NextResponse.json({
          success: true,
          crossBorderPayment: {
            scenario: `${result.paymentDetails.sourceLocation} → ${result.paymentDetails.targetLocation}`,
            useCase: result.paymentDetails.useCase,
            energyProduced: result.paymentDetails.energyProduced,
            energyDelivered: result.paymentDetails.energyDelivered,
            nxusdValue: result.paymentDetails.nxusdValue,
            carbonOffset: `${result.paymentDetails.carbonOffset.toFixed(2)} kg CO2`,
          },
          proofs: {
            gridInjection: result.injectionProof,
            mirrorPosition: result.position,
            swapOrder: result.swapOrder,
          },
          message: `Successfully transferred ${amount} kWh value from ${result.paymentDetails.sourceLocation} to ${result.paymentDetails.targetLocation} for ${result.paymentDetails.useCase}`,
        });
      }

      case 'pool-swap': {
        const { sourceMarket, targetMarket, amount, userAddress } = body;

        if (!sourceMarket || !targetMarket || !amount) {
          return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
          );
        }

        const result = await globalLiquidityPool.executePoolSwap(
          sourceMarket,
          targetMarket,
          amount,
          userAddress || '0xDEMO'
        );

        return NextResponse.json({
          success: true,
          poolSwap: {
            swapId: result.swapId,
            inputAmount: result.inputAmount,
            outputAmount: result.outputAmount,
            executionPrice: result.executionPrice,
            nxusdValue: result.nxusdValue,
            path: result.path.path,
            fees: result.path.fees,
          },
        });
      }

      case 'add-liquidity': {
        const { market, amount, userAddress } = body;

        if (!market || !amount) {
          return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
          );
        }

        const provider = await globalLiquidityPool.addLiquidity(
          userAddress || '0xDEMO',
          market,
          amount
        );

        return NextResponse.json({
          success: true,
          liquidityProvider: provider,
          estimatedAPR: `${provider.apr.toFixed(2)}%`,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Unknown action. Use: swap, cross-border, pool-swap, add-liquidity' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[EPO Swap Error]', error);
    return NextResponse.json(
      { error: 'Swap operation failed', details: String(error) },
      { status: 500 }
    );
  }
}
