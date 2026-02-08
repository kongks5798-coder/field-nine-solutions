/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AI ENERGY TRADING API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Phase 36: NEXUS Trading Engine API
 *
 * Endpoints:
 * GET  /api/energy/trading              - Get current trading status & decision
 * GET  /api/energy/trading?type=profit  - Get daily profit estimate
 * GET  /api/energy/trading?type=schedule - Get trading schedule
 * POST /api/energy/trading              - Execute trading commands
 */

import { NextResponse } from 'next/server';
import {
  getTradingDecision,
  getDailyTradingSchedule,
  getDailyProfitEstimate,
  getTradingEngineStatus,
  pauseTradingEngine,
  resumeTradingEngine,
  emergencyStopTrading,
  updateTradingThresholds,
} from '@/lib/energy/trading-logic';
import {
  startTeslaCharging,
  stopTeslaCharging,
  setTeslaChargeLimit,
  wakeTeslaVehicle,
  isTeslaConfigured,
  listTeslaVehicles,
} from '@/lib/energy/tesla-commands';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ═══════════════════════════════════════════════════════════════════════════════
// GET - Retrieve trading information
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'status';

  try {
    switch (type) {
      case 'decision':
        const decision = await getTradingDecision();
        return NextResponse.json({
          success: true,
          data: decision,
          timestamp: new Date().toISOString(),
        });

      case 'schedule':
        const schedule = await getDailyTradingSchedule();
        return NextResponse.json({
          success: true,
          data: schedule,
          timestamp: new Date().toISOString(),
        });

      case 'profit':
        const profit = await getDailyProfitEstimate();
        return NextResponse.json({
          success: true,
          data: profit,
          timestamp: new Date().toISOString(),
        });

      case 'vehicles':
        const vehicles = await listTeslaVehicles();
        return NextResponse.json({
          success: true,
          data: vehicles,
          teslaConfigured: isTeslaConfigured(),
          timestamp: new Date().toISOString(),
        });

      case 'status':
      default:
        const [status, latestDecision, profitEstimate] = await Promise.all([
          Promise.resolve(getTradingEngineStatus()),
          getTradingDecision(),
          getDailyProfitEstimate(),
        ]);

        return NextResponse.json({
          success: true,
          data: {
            engine: status,
            currentDecision: latestDecision,
            todayProfit: profitEstimate,
            teslaConfigured: isTeslaConfigured(),
          },
          meta: {
            version: '36.0.0',
            mode: 'AI_TRADING_ACTIVE',
            phase: 'NEXUS_V2G',
          },
          timestamp: new Date().toISOString(),
        });
    }
  } catch (error) {
    console.error('[TRADING API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Trading API error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST - Execute trading commands
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, vehicleId, params } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      );
    }

    switch (action) {
      // ═══════════════════════════════════════════════════════════════════════
      // ENGINE CONTROL
      // ═══════════════════════════════════════════════════════════════════════

      case 'PAUSE':
        pauseTradingEngine();
        return NextResponse.json({
          success: true,
          message: 'Trading engine paused',
          timestamp: new Date().toISOString(),
        });

      case 'RESUME':
        resumeTradingEngine();
        return NextResponse.json({
          success: true,
          message: 'Trading engine resumed',
          timestamp: new Date().toISOString(),
        });

      case 'EMERGENCY_STOP':
        emergencyStopTrading();
        return NextResponse.json({
          success: true,
          message: 'EMERGENCY STOP executed',
          timestamp: new Date().toISOString(),
        });

      case 'UPDATE_THRESHOLDS':
        if (!params) {
          return NextResponse.json(
            { success: false, error: 'Thresholds params required' },
            { status: 400 }
          );
        }
        updateTradingThresholds(params);
        return NextResponse.json({
          success: true,
          message: 'Thresholds updated',
          newThresholds: params,
          timestamp: new Date().toISOString(),
        });

      // ═══════════════════════════════════════════════════════════════════════
      // TESLA VEHICLE COMMANDS
      // ═══════════════════════════════════════════════════════════════════════

      case 'START_CHARGING':
        if (!vehicleId) {
          return NextResponse.json(
            { success: false, error: 'Vehicle ID required' },
            { status: 400 }
          );
        }

        if (!isTeslaConfigured()) {
          return NextResponse.json(
            { success: false, error: 'Tesla API not configured' },
            { status: 503 }
          );
        }

        const startResult = await startTeslaCharging(vehicleId);
        return NextResponse.json({
          success: startResult.success,
          data: startResult,
          timestamp: new Date().toISOString(),
        });

      case 'STOP_CHARGING':
        if (!vehicleId) {
          return NextResponse.json(
            { success: false, error: 'Vehicle ID required' },
            { status: 400 }
          );
        }

        if (!isTeslaConfigured()) {
          return NextResponse.json(
            { success: false, error: 'Tesla API not configured' },
            { status: 503 }
          );
        }

        const stopResult = await stopTeslaCharging(vehicleId);
        return NextResponse.json({
          success: stopResult.success,
          data: stopResult,
          timestamp: new Date().toISOString(),
        });

      case 'SET_CHARGE_LIMIT':
        if (!vehicleId || params?.limit === undefined) {
          return NextResponse.json(
            { success: false, error: 'Vehicle ID and limit required' },
            { status: 400 }
          );
        }

        if (!isTeslaConfigured()) {
          return NextResponse.json(
            { success: false, error: 'Tesla API not configured' },
            { status: 503 }
          );
        }

        const limitResult = await setTeslaChargeLimit(vehicleId, params.limit);
        return NextResponse.json({
          success: limitResult.success,
          data: limitResult,
          timestamp: new Date().toISOString(),
        });

      case 'WAKE_VEHICLE':
        if (!vehicleId) {
          return NextResponse.json(
            { success: false, error: 'Vehicle ID required' },
            { status: 400 }
          );
        }

        if (!isTeslaConfigured()) {
          return NextResponse.json(
            { success: false, error: 'Tesla API not configured' },
            { status: 503 }
          );
        }

        const wakeResult = await wakeTeslaVehicle(vehicleId);
        return NextResponse.json({
          success: wakeResult.success,
          data: wakeResult,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[TRADING API] POST Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Command execution failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
