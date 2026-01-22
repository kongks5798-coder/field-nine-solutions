/**
 * EPO SHADOW ALPHA SIMULATION API
 *
 * Global scale testing and revenue projection for
 * 10,000+ energy node network.
 */

import { NextRequest, NextResponse } from 'next/server';
import { shadowAlphaSimulation } from '@/lib/epo/shadow-alpha-simulation';
import { quarantineProtection } from '@/lib/epo/quarantine-protection';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'status': {
      const isRunning = shadowAlphaSimulation.isRunningSimulation();
      const metrics = shadowAlphaSimulation.getMetrics();
      const config = shadowAlphaSimulation.getConfig();

      return NextResponse.json({
        status: isRunning ? 'running' : 'stopped',
        metrics,
        config: {
          nodeCount: config.nodeCount,
          speedMultiplier: config.simulationSpeedMultiplier,
        },
        timestamp: new Date().toISOString(),
      });
    }

    case 'metrics': {
      const metrics = shadowAlphaSimulation.getMetrics();

      return NextResponse.json({
        metrics,
        summary: {
          nodesOnline: `${metrics.activeNodes.toLocaleString()} / ${metrics.totalNodes.toLocaleString()}`,
          capacity: `${metrics.totalCapacity.toLocaleString()} MW`,
          currentOutput: `${metrics.currentOutput.toLocaleString()} MW`,
          utilization: `${metrics.utilizationRate}%`,
          tps: metrics.transactionsPerSecond,
          uptime: `${metrics.uptimePercentage}%`,
          compliance: `${metrics.complianceRate}%`,
        },
        timestamp: new Date().toISOString(),
      });
    }

    case 'nodes': {
      const limit = parseInt(searchParams.get('limit') || '100');
      const country = searchParams.get('country');
      const market = searchParams.get('market');

      let nodes = shadowAlphaSimulation.getNodes();

      if (country) {
        nodes = nodes.filter(n => n.country === country);
      }
      if (market) {
        nodes = nodes.filter(n => n.market === market);
      }

      return NextResponse.json({
        nodes: nodes.slice(0, limit),
        total: nodes.length,
        showing: Math.min(limit, nodes.length),
      });
    }

    case 'transactions': {
      const limit = parseInt(searchParams.get('limit') || '100');
      const type = searchParams.get('type') as 'verify' | 'swap' | 'attest' | null;

      let transactions = type
        ? shadowAlphaSimulation.getTransactionsByType(type)
        : shadowAlphaSimulation.getRecentTransactions(limit);

      return NextResponse.json({
        transactions: transactions.slice(-limit),
        total: transactions.length,
        breakdown: {
          verify: shadowAlphaSimulation.getTransactionsByType('verify').length,
          swap: shadowAlphaSimulation.getTransactionsByType('swap').length,
          attest: shadowAlphaSimulation.getTransactionsByType('attest').length,
        },
      });
    }

    case 'distribution': {
      const distribution = shadowAlphaSimulation.getCountryDistribution();

      return NextResponse.json({
        distribution,
        countries: Object.keys(distribution).length,
        totalNodes: Object.values(distribution).reduce((s, d) => s + d.nodes, 0),
        totalCapacity: Math.round(Object.values(distribution).reduce((s, d) => s + d.capacity, 0) / 1000) + ' MW',
      });
    }

    case 'projections': {
      const projections = shadowAlphaSimulation.generateRevenueProjections();

      return NextResponse.json({
        projections,
        summary: {
          year5Nodes: projections[4]?.nodes.toLocaleString(),
          year5Revenue: `$${projections[4]?.grossRevenue.toLocaleString()}`,
          year5MarketShare: `${projections[4]?.marketShare}%`,
          totalGrowth: projections.length > 1
            ? `${Math.round((projections[4].nodes / projections[0].nodes - 1) * 100)}%`
            : '0%',
        },
        timestamp: new Date().toISOString(),
      });
    }

    case 'security': {
      const stats = quarantineProtection.getStats();
      const activeEvents = quarantineProtection.getActiveEvents().slice(0, 20);

      return NextResponse.json({
        securityStats: stats,
        activeQuarantineEvents: activeEvents,
        protectionStatus: 'active',
        timestamp: new Date().toISOString(),
      });
    }

    default:
      return NextResponse.json({
        api: 'Shadow Alpha Simulation API',
        version: '1.0',
        description: '10K node global network simulation',
        endpoints: {
          'GET ?action=status': 'Simulation status',
          'GET ?action=metrics': 'Real-time metrics',
          'GET ?action=nodes': 'List simulated nodes (params: limit, country, market)',
          'GET ?action=transactions': 'Recent transactions (params: limit, type)',
          'GET ?action=distribution': 'Geographic distribution',
          'GET ?action=projections': 'Revenue projections',
          'GET ?action=security': 'Security stats and events',
          'POST (init)': 'Initialize simulation',
          'POST (start)': 'Start simulation',
          'POST (stop)': 'Stop simulation',
          'POST (stress-test)': 'Run stress test',
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
      case 'init': {
        const nodeCount = body.nodeCount || 10000;

        await shadowAlphaSimulation.initializeSimulation(nodeCount);

        return NextResponse.json({
          success: true,
          message: `Initialized simulation with ${nodeCount} nodes`,
          metrics: shadowAlphaSimulation.getMetrics(),
        });
      }

      case 'start': {
        shadowAlphaSimulation.startSimulation();

        return NextResponse.json({
          success: true,
          message: 'Simulation started',
          status: 'running',
        });
      }

      case 'stop': {
        shadowAlphaSimulation.stopSimulation();

        return NextResponse.json({
          success: true,
          message: 'Simulation stopped',
          status: 'stopped',
          finalMetrics: shadowAlphaSimulation.getMetrics(),
        });
      }

      case 'stress-test': {
        const scenario = body.scenario || 'peak_load';
        const result = await shadowAlphaSimulation.runStressTest(scenario);

        return NextResponse.json({
          success: true,
          stressTest: result,
          passed: result.passed,
          message: result.passed
            ? 'System passed stress test'
            : 'System showed degradation under stress',
        });
      }

      case 'validate-transaction': {
        // Use quarantine protection to validate a transaction
        const validation = await quarantineProtection.validateTransaction({
          entityId: body.entityId || 'test-entity',
          transactionId: body.transactionId || `TX-${Date.now()}`,
          transactionType: body.transactionType || 'verify',
          watermarkId: body.watermarkId,
          volume: body.volume,
          swapRate: body.swapRate,
          marketRate: body.marketRate,
          nodeId: body.nodeId,
          nodeCapacity: body.nodeCapacity,
          timeWindowHours: body.timeWindowHours,
          apiKey,
          tier: body.tier || 'standard',
        });

        return NextResponse.json({
          success: validation.allowed,
          validation,
          timestamp: new Date().toISOString(),
        });
      }

      default:
        return NextResponse.json(
          { error: 'Unknown action. Use: init, start, stop, stress-test, validate-transaction' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Simulation Error]', error);
    return NextResponse.json(
      { error: 'Simulation operation failed', details: String(error) },
      { status: 500 }
    );
  }
}
