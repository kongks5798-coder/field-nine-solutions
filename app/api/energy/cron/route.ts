/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FIELD NINE NEXUS: AUTONOMOUS TRADING CRON
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Phase 36: 24/7 Autonomous Energy Trading
 *
 * Vercel Cron: Every hour
 * - Analyzes current SMP price
 * - Makes trading decision (CHARGE/DISCHARGE/HOLD)
 * - Executes Tesla commands automatically
 *
 * Security: Vercel Cron Authorization header required
 */

import { NextResponse } from 'next/server';
import {
  getTradingDecision,
  getDailyProfitEstimate,
  getTradingEngineStatus,
} from '@/lib/energy/trading-logic';
import {
  startTeslaCharging,
  stopTeslaCharging,
  setTeslaChargeLimit,
  wakeTeslaVehicle,
  isTeslaConfigured,
  listTeslaVehicles,
} from '@/lib/energy/tesla-commands';
import { getLiveSMP, getLiveTeslaData } from '@/lib/partnerships/live-data-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 second timeout for cron

// ═══════════════════════════════════════════════════════════════════════════════
// CRON EXECUTION LOG
// ═══════════════════════════════════════════════════════════════════════════════

interface CronExecutionLog {
  timestamp: string;
  decision: string;
  action: string;
  smpPrice: number;
  batteryLevel: number;
  teslaCommand?: string;
  teslaResult?: unknown;
  profitEstimate: number;
  success: boolean;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET - Cron Job Entry Point (Vercel Cron)
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: Request) {
  const startTime = Date.now();
  const log: CronExecutionLog = {
    timestamp: new Date().toISOString(),
    decision: 'PENDING',
    action: 'NONE',
    smpPrice: 0,
    batteryLevel: 0,
    profitEstimate: 0,
    success: false,
  };

  try {
    // ═══════════════════════════════════════════════════════════════════════
    // STEP 1: Verify Cron Authorization
    // ═══════════════════════════════════════════════════════════════════════

    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // In production, verify the cron secret
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        console.log('[CRON] Unauthorized cron attempt');
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    console.log('[CRON] ════════════════════════════════════════════════════════');
    console.log('[CRON] FIELD NINE AUTONOMOUS TRADING - Hourly Execution');
    console.log('[CRON] Time:', log.timestamp);
    console.log('[CRON] ════════════════════════════════════════════════════════');

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 2: Check Engine Status
    // ═══════════════════════════════════════════════════════════════════════

    const engineStatus = getTradingEngineStatus();

    if (engineStatus.mode !== 'ACTIVE') {
      console.log('[CRON] Engine not active. Mode:', engineStatus.mode);
      log.action = 'SKIPPED';
      log.success = true;
      log.error = `Engine mode: ${engineStatus.mode}`;

      return NextResponse.json({
        success: true,
        data: {
          action: 'SKIPPED',
          reason: `Engine not active (${engineStatus.mode})`,
          log,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 3: Get Live Data and Trading Decision
    // ═══════════════════════════════════════════════════════════════════════

    // Fetch live data
    const [smpData, teslaData, decision, profitEstimate] = await Promise.all([
      getLiveSMP(),
      getLiveTeslaData(),
      getTradingDecision(),
      getDailyProfitEstimate(),
    ]);

    // Calculate average battery level from Tesla data
    const avgBatteryLevel = teslaData.vehicles.length > 0
      ? teslaData.vehicles.reduce((sum, v) => sum + v.batteryLevel, 0) / teslaData.vehicles.length
      : 0;

    log.decision = decision.action;
    log.smpPrice = smpData.price;
    log.batteryLevel = avgBatteryLevel;
    log.profitEstimate = profitEstimate.expectedProfit;

    console.log('[CRON] Decision:', decision.action);
    console.log('[CRON] SMP Price:', smpData.price, '원/kWh');
    console.log('[CRON] Battery Level:', avgBatteryLevel.toFixed(1), '%');
    console.log('[CRON] Confidence:', decision.confidence.toFixed(1), '%');
    console.log('[CRON] Reason:', decision.reason);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 4: Execute Tesla Commands (if configured)
    // ═══════════════════════════════════════════════════════════════════════

    if (!isTeslaConfigured()) {
      console.log('[CRON] Tesla API not configured - simulation mode');
      log.action = 'SIMULATED';
      log.success = true;

      return NextResponse.json({
        success: true,
        data: {
          decision: decision.action,
          action: 'SIMULATED',
          reason: 'Tesla API not configured',
          smpPrice: smpData.price,
          batteryLevel: avgBatteryLevel,
          confidence: decision.confidence,
          profitEstimate: profitEstimate.expectedProfit,
          log,
        },
        meta: {
          executionTime: Date.now() - startTime,
          mode: 'SIMULATION',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Get available vehicles
    const vehicles = await listTeslaVehicles();

    if (!vehicles || vehicles.length === 0) {
      console.log('[CRON] No Tesla vehicles found');
      log.action = 'NO_VEHICLE';
      log.success = true;

      return NextResponse.json({
        success: true,
        data: {
          decision: decision.action,
          action: 'NO_VEHICLE',
          reason: 'No Tesla vehicles available',
          log,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Use first vehicle (Cybertruck)
    const vehicleId = vehicles[0].id;
    console.log('[CRON] Vehicle ID:', vehicleId);

    // Execute based on decision
    let teslaResult;

    switch (decision.action) {
      case 'CHARGE':
        console.log('[CRON] Executing: START CHARGING');
        log.teslaCommand = 'START_CHARGING';

        // Wake vehicle first
        await wakeTeslaVehicle(vehicleId);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for wake

        // Set optimal charge limit
        const chargeLimit = Math.min(90, Math.round(avgBatteryLevel) + 30);
        await setTeslaChargeLimit(vehicleId, chargeLimit);

        // Start charging
        teslaResult = await startTeslaCharging(vehicleId);
        log.teslaResult = teslaResult;
        log.action = 'CHARGE_STARTED';
        break;

      case 'DISCHARGE':
        console.log('[CRON] Executing: STOP CHARGING (V2G Mode)');
        log.teslaCommand = 'STOP_CHARGING';

        // Wake vehicle first
        await wakeTeslaVehicle(vehicleId);
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Stop charging to enable V2G discharge
        teslaResult = await stopTeslaCharging(vehicleId);
        log.teslaResult = teslaResult;
        log.action = 'DISCHARGE_MODE';
        break;

      case 'HOLD':
      default:
        console.log('[CRON] Holding - No action required');
        log.teslaCommand = 'NONE';
        log.action = 'HOLD';
        teslaResult = { success: true, message: 'No action taken' };
        break;
    }

    log.success = teslaResult?.success ?? true;

    console.log('[CRON] ════════════════════════════════════════════════════════');
    console.log('[CRON] Execution Complete');
    console.log('[CRON] Action:', log.action);
    console.log('[CRON] Success:', log.success);
    console.log('[CRON] Duration:', Date.now() - startTime, 'ms');
    console.log('[CRON] ════════════════════════════════════════════════════════');

    return NextResponse.json({
      success: true,
      data: {
        decision: decision.action,
        action: log.action,
        smpPrice: smpData.price,
        batteryLevel: avgBatteryLevel,
        confidence: decision.confidence,
        reason: decision.reason,
        targetSoC: decision.targetSoC,
        teslaCommand: log.teslaCommand,
        teslaResult,
        profitEstimate: {
          daily: profitEstimate.expectedProfit,
          breakdown: profitEstimate.breakdown,
        },
        log,
      },
      meta: {
        executionTime: Date.now() - startTime,
        mode: 'LIVE',
        version: '36.0.0',
        phase: 'NEXUS_AUTONOMOUS',
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[CRON] Error:', error);
    log.success = false;
    log.error = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: 'Cron execution failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        log,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
