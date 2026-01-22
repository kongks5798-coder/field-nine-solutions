/**
 * COMPUTE-AS-A-SERVICE (CaaS) API
 *
 * Unified API for Field Nine Compute Network
 * - Energy-to-Hashrate mapping
 * - Compute Marketplace
 * - Yield Optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  energyHashrateMapper,
  getGlobalComputeStats,
  getAllGPUNodes,
  getAvailableComputeNodes,
  getRegionalComputeStats,
  mapSurplusToHashrate,
  getComputeCredits,
  COMPUTE_CONFIG,
  GPUType,
  WorkloadType,
} from '@/lib/compute/energy-hashrate-mapping';
import {
  computeMarketplace,
  getMarketStats,
  getPriceQuote,
  getActiveBids,
  getRunningOrders,
  getGPUPricing,
  getClientLeaderboard,
  MARKETPLACE_CONFIG,
  BidPriority,
} from '@/lib/compute/compute-marketplace';
import {
  yieldOptimizer,
  analyzeYield,
  getYieldStrategies,
  getYieldHistory,
  getYieldMetrics,
  simulateYieldStrategy,
  OPTIMIZER_CONFIG,
} from '@/lib/compute/yield-optimizer';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const module = searchParams.get('module');
  const action = searchParams.get('action');

  // HASHRATE MODULE - Energy to Compute mapping
  if (module === 'hashrate') {
    switch (action) {
      case 'stats': {
        const stats = getGlobalComputeStats();
        return NextResponse.json({
          stats,
          config: COMPUTE_CONFIG,
          status: 'COMPUTE_NETWORK_ONLINE',
        });
      }

      case 'nodes': {
        const region = searchParams.get('region');
        let nodes = getAllGPUNodes();

        if (region) {
          nodes = nodes.filter(n => n.region === region);
        }

        return NextResponse.json({
          nodes,
          count: nodes.length,
        });
      }

      case 'available': {
        const minTFLOPS = parseInt(searchParams.get('minTFLOPS') || '1000');
        const gpuType = searchParams.get('gpuType') as GPUType | undefined;

        const nodes = getAvailableComputeNodes(minTFLOPS, gpuType);
        return NextResponse.json({
          availableNodes: nodes,
          count: nodes.length,
          totalAvailableTFLOPS: nodes.reduce((sum, n) => sum + n.availableTFLOPS, 0),
        });
      }

      case 'regional': {
        const stats = getRegionalComputeStats();
        return NextResponse.json({
          regions: stats,
          totalRegions: stats.length,
        });
      }

      case 'mapping': {
        const powerPlantId = searchParams.get('powerPlantId');
        if (!powerPlantId) {
          return NextResponse.json({ error: 'powerPlantId required' }, { status: 400 });
        }

        const mapping = mapSurplusToHashrate(powerPlantId);
        return NextResponse.json({
          powerPlantId,
          mapping,
        });
      }

      case 'energy-feeds': {
        const feeds = energyHashrateMapper.getEnergyFeeds();
        return NextResponse.json({
          feeds,
          count: feeds.length,
        });
      }
    }
  }

  // MARKETPLACE MODULE - Compute trading
  if (module === 'marketplace') {
    switch (action) {
      case 'stats': {
        const stats = getMarketStats();
        return NextResponse.json({
          stats,
          config: MARKETPLACE_CONFIG,
          status: 'MARKETPLACE_ACTIVE',
        });
      }

      case 'quote': {
        const gpuType = searchParams.get('gpuType') as GPUType || 'H100';
        const tflops = parseFloat(searchParams.get('tflops') || '1000');
        const duration = parseInt(searchParams.get('duration') || '24');
        const priority = searchParams.get('priority') as BidPriority || 'STANDARD';

        const quote = getPriceQuote(gpuType, tflops, duration, priority);
        return NextResponse.json({
          quote,
          message: `${tflops} TFLOPS for ${duration}h = ${quote.effectivePrice.toFixed(4)} K-AUS`,
        });
      }

      case 'pricing': {
        const pricing = getGPUPricing();
        return NextResponse.json({
          pricing,
          timestamp: Date.now(),
        });
      }

      case 'bids': {
        const bids = getActiveBids();
        return NextResponse.json({
          activeBids: bids,
          count: bids.length,
        });
      }

      case 'orders': {
        const orders = getRunningOrders();
        return NextResponse.json({
          runningOrders: orders,
          count: orders.length,
        });
      }

      case 'leaderboard': {
        const limit = parseInt(searchParams.get('limit') || '10');
        const leaderboard = getClientLeaderboard(limit);
        return NextResponse.json({
          leaderboard,
          timestamp: Date.now(),
        });
      }
    }
  }

  // YIELD MODULE - Optimization engine
  if (module === 'yield') {
    switch (action) {
      case 'analyze': {
        const powerPlantId = searchParams.get('powerPlantId');
        if (!powerPlantId) {
          return NextResponse.json({ error: 'powerPlantId required' }, { status: 400 });
        }

        const analysis = analyzeYield(powerPlantId);
        return NextResponse.json({
          analysis,
          message: `Recommended: ${analysis.decision} (${(analysis.confidence * 100).toFixed(1)}% confidence)`,
        });
      }

      case 'strategies': {
        const strategies = getYieldStrategies();
        return NextResponse.json({
          strategies,
          count: strategies.length,
        });
      }

      case 'history': {
        const powerPlantId = searchParams.get('powerPlantId') || undefined;
        const limit = parseInt(searchParams.get('limit') || '100');
        const history = getYieldHistory(powerPlantId, limit);
        return NextResponse.json({
          history,
          count: history.length,
        });
      }

      case 'metrics': {
        const powerPlantId = searchParams.get('powerPlantId') || undefined;
        const metrics = getYieldMetrics(powerPlantId);
        return NextResponse.json({
          metrics,
          config: OPTIMIZER_CONFIG,
        });
      }

      case 'all-analyses': {
        const analyses = yieldOptimizer.getAllAnalyses();
        return NextResponse.json({
          analyses,
          count: analyses.length,
        });
      }
    }
  }

  // Default: API Overview
  return NextResponse.json({
    api: 'Field Nine Compute-as-a-Service (CaaS) API',
    version: '1.0',
    description: 'Energy-to-Intelligence Conversion Platform',
    tagline: '에너지를 넘어 지능을 판다',
    modules: {
      hashrate: {
        description: 'Energy-to-Hashrate Mapping & Virtual GPU Nodes',
        endpoints: [
          'GET ?module=hashrate&action=stats',
          'GET ?module=hashrate&action=nodes&region={region}',
          'GET ?module=hashrate&action=available&minTFLOPS={n}&gpuType={type}',
          'GET ?module=hashrate&action=regional',
          'GET ?module=hashrate&action=mapping&powerPlantId={id}',
          'GET ?module=hashrate&action=energy-feeds',
        ],
      },
      marketplace: {
        description: 'K-AUS Compute Marketplace & Bidding',
        endpoints: [
          'GET ?module=marketplace&action=stats',
          'GET ?module=marketplace&action=quote&gpuType={type}&tflops={n}&duration={h}',
          'GET ?module=marketplace&action=pricing',
          'GET ?module=marketplace&action=bids',
          'GET ?module=marketplace&action=orders',
          'GET ?module=marketplace&action=leaderboard',
        ],
      },
      yield: {
        description: 'Automated Yield Optimization Engine',
        endpoints: [
          'GET ?module=yield&action=analyze&powerPlantId={id}',
          'GET ?module=yield&action=strategies',
          'GET ?module=yield&action=history&powerPlantId={id}',
          'GET ?module=yield&action=metrics',
        ],
      },
    },
    networkStats: {
      totalGPUs: '7,040+',
      totalTFLOPS: '10M+',
      regions: '7',
      burnRate: '0.5% per transaction',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { module, action } = body;

    // HASHRATE MODULE
    if (module === 'hashrate') {
      switch (action) {
        case 'generate-credits': {
          const { kwhConsumed, gpuType, workloadType } = body;

          if (!kwhConsumed || !gpuType) {
            return NextResponse.json({ error: 'kwhConsumed and gpuType required' }, { status: 400 });
          }

          const credit = getComputeCredits(
            kwhConsumed,
            gpuType as GPUType,
            workloadType as WorkloadType || 'TRAINING'
          );

          return NextResponse.json({
            success: true,
            credit,
            message: `Generated ${credit.creditsGenerated.toFixed(2)} credits = ${credit.kausEquivalent.toFixed(6)} K-AUS`,
          });
        }

        case 'update-feed': {
          const { powerPlantId, totalGenerationKW, gridDemandKW, energySource, carbonIntensity } = body;

          if (!powerPlantId || !totalGenerationKW) {
            return NextResponse.json({ error: 'powerPlantId and totalGenerationKW required' }, { status: 400 });
          }

          energyHashrateMapper.updateEnergyFeed({
            powerPlantId,
            totalGenerationKW,
            gridDemandKW: gridDemandKW || totalGenerationKW * 0.7,
            surplusPowerKW: totalGenerationKW - (gridDemandKW || totalGenerationKW * 0.7),
            energySource: energySource || 'SOLAR',
            carbonIntensity: carbonIntensity || 0,
            timestamp: Date.now(),
          });

          return NextResponse.json({
            success: true,
            message: `Energy feed updated for ${powerPlantId}`,
          });
        }
      }
    }

    // MARKETPLACE MODULE
    if (module === 'marketplace') {
      switch (action) {
        case 'submit-bid': {
          const {
            clientId,
            clientName,
            gpuType,
            requestedGPUs,
            workloadType,
            priority,
            maxKausPerHour,
            minDurationHours,
            maxDurationHours,
            totalKausBudget,
          } = body;

          if (!clientId || !gpuType || !requestedGPUs) {
            return NextResponse.json({ error: 'clientId, gpuType, and requestedGPUs required' }, { status: 400 });
          }

          const bid = computeMarketplace.submitBid({
            clientId,
            clientName: clientName || clientId,
            gpuType: gpuType as GPUType,
            requestedGPUs,
            workloadType: workloadType as WorkloadType || 'TRAINING',
            priority: priority as BidPriority || 'STANDARD',
            maxKausPerHour: maxKausPerHour || 100,
            minDurationHours: minDurationHours || 1,
            maxDurationHours: maxDurationHours || 24,
            totalKausBudget: totalKausBudget || maxKausPerHour * maxDurationHours * 1.5,
          });

          return NextResponse.json({
            success: true,
            bid,
            message: `Bid ${bid.bidId} submitted (${bid.status})`,
          });
        }

        case 'cancel-bid': {
          const { bidId } = body;

          if (!bidId) {
            return NextResponse.json({ error: 'bidId required' }, { status: 400 });
          }

          const success = computeMarketplace.cancelBid(bidId);
          return NextResponse.json({
            success,
            message: success ? 'Bid cancelled' : 'Cannot cancel bid',
          });
        }
      }
    }

    // YIELD MODULE
    if (module === 'yield') {
      switch (action) {
        case 'simulate': {
          const { surplusPowerKW, electricityPrice, computeDemand, durationHours, strategy } = body;

          if (!surplusPowerKW || !durationHours) {
            return NextResponse.json({ error: 'surplusPowerKW and durationHours required' }, { status: 400 });
          }

          const simulation = simulateYieldStrategy({
            surplusPowerKW,
            electricityPrice: electricityPrice || 0.10,
            computeDemand: computeDemand || 0.5,
            durationHours,
            strategy: strategy || 'BALANCED',
          });

          return NextResponse.json({
            success: true,
            simulation,
            message: `Simulated ${durationHours}h yield: $${simulation.summary.totalYieldUSD.toFixed(2)}`,
          });
        }

        case 'batch-analyze': {
          const { powerPlantIds } = body;

          if (!powerPlantIds || !Array.isArray(powerPlantIds)) {
            return NextResponse.json({ error: 'powerPlantIds array required' }, { status: 400 });
          }

          const analyses = powerPlantIds.map((id: string) => {
            try {
              return analyzeYield(id);
            } catch {
              return { powerPlantId: id, error: 'Analysis failed' };
            }
          });

          return NextResponse.json({
            success: true,
            analyses,
            count: analyses.length,
          });
        }

        case 'update-kaus-rate': {
          const { rate } = body;

          if (!rate || rate <= 0) {
            return NextResponse.json({ error: 'Valid rate required' }, { status: 400 });
          }

          yieldOptimizer.updateKausRate(rate);
          return NextResponse.json({
            success: true,
            message: `K-AUS rate updated to $${rate}`,
          });
        }
      }
    }

    return NextResponse.json(
      { error: 'Unknown module/action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Compute API Error]', error);
    return NextResponse.json(
      { error: 'Operation failed', details: String(error) },
      { status: 500 }
    );
  }
}
