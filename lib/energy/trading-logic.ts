/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FIELD NINE NEXUS - AI ENERGY TRADING ALGORITHM
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Phase 36: Autonomous V2G Trading Engine
 *
 * Core Intelligence:
 * 1. Real-time SMP price analysis with dynamic thresholds
 * 2. Tesla battery SoC-aware optimal scheduling
 * 3. Automatic charge/discharge decision making
 * 4. Profit maximization through arbitrage
 *
 * The Algorithm:
 * - CHARGE when: SMP < LowThreshold (저점) AND SoC < 80%
 * - DISCHARGE when: SMP > HighThreshold (고점) AND SoC > 30%
 * - HOLD when: SMP is mid-range OR battery constraints
 *
 * Zero Energy Waste Protocol: 1원도 낭비 없이 최적화
 */

import { getLiveSMP, getLiveTeslaData, getProphetForecast, type LiveSMPData, type LiveTeslaData, type ProphetForecast } from '@/lib/partnerships/live-data-service';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type TradingAction = 'CHARGE' | 'DISCHARGE' | 'HOLD';
export type TradingModeStatus = 'ACTIVE' | 'PAUSED' | 'SAFETY_LOCK' | 'OFFLINE';

export interface TradingThresholds {
  lowThreshold: number;       // SMP price below this = CHARGE (원/kWh)
  highThreshold: number;      // SMP price above this = DISCHARGE (원/kWh)
  minSoCForDischarge: number; // Minimum SoC to allow V2G discharge (%)
  maxSoCForCharge: number;    // Maximum SoC target for charging (%)
  safetyBuffer: number;       // Safety margin for calculations (%)
}

export interface TradingDecision {
  action: TradingAction;
  confidence: number;         // 0-100%
  reason: string;             // Human-readable explanation
  targetSoC: number;          // Target battery level after action
  estimatedProfit: number;    // Expected profit from this action (원)
  estimatedDuration: number;  // Expected duration in minutes
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
}

export interface TradingSchedule {
  scheduleId: string;
  createdAt: string;
  validUntil: string;
  entries: ScheduleEntry[];
  expectedDailyProfit: number;
  expectedMonthlyProfit: number;
}

export interface ScheduleEntry {
  hour: number;
  action: TradingAction;
  targetSoC: number;
  expectedPrice: number;
  confidence: number;
  reason: string;
}

export interface TradingEngineStatus {
  mode: TradingModeStatus;
  isActive: boolean;
  currentAction: TradingAction;
  currentDecision: TradingDecision | null;
  activeSchedule: TradingSchedule | null;
  todayStats: {
    totalProfit: number;
    chargeCount: number;
    dischargeCount: number;
    kwhCharged: number;
    kwhDischarged: number;
    efficiency: number;
  };
  lastUpdate: string;
}

export interface TradingSessionLog {
  sessionId: string;
  startTime: string;
  endTime: string | null;
  action: TradingAction;
  startSoC: number;
  endSoC: number | null;
  kwhTransferred: number;
  profit: number;
  smpAtStart: number;
  smpAtEnd: number | null;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const TRADING_CONFIG = {
  // Default thresholds (can be customized per user)
  DEFAULT_THRESHOLDS: {
    lowThreshold: 100,          // Charge when SMP < 100원/kWh
    highThreshold: 140,         // Discharge when SMP > 140원/kWh
    minSoCForDischarge: 30,     // Don't discharge below 30%
    maxSoCForCharge: 90,        // Don't charge above 90%
    safetyBuffer: 5,            // 5% safety margin
  } as TradingThresholds,

  // Cybertruck specific configuration
  CYBERTRUCK: {
    batteryCapacity: 123,       // kWh (Cybertruck Foundation Series)
    maxChargeRate: 250,         // kW (Supercharger V3)
    homeChargeRate: 11.5,       // kW (Wall Connector)
    maxDischargeRate: 11.5,     // kW (V2G)
    efficiency: 0.95,           // 95% round-trip efficiency
  },

  // Trading session limits
  LIMITS: {
    maxDailySessions: 4,        // Max charge/discharge cycles per day
    minSessionDuration: 30,     // Minimum 30 minutes per session
    cooldownBetweenSessions: 60, // 60 minutes cooldown
    emergencyStopSoC: 20,       // Emergency stop if SoC drops below 20%
  },

  // Profit calculation parameters
  PROFIT: {
    v2gPremium: 1.3,           // 30% premium for V2G selling
    gridFee: 0.05,              // 5% grid transaction fee
    kausRewardPerKwh: 10,       // 10 K-AUS per kWh traded
  },

  // Update intervals
  INTERVALS: {
    priceCheck: 60000,          // Check SMP every 60 seconds
    decisionUpdate: 300000,     // Update decision every 5 minutes
    scheduleRefresh: 3600000,   // Refresh schedule every hour
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// AI TRADING ENGINE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class AITradingEngine {
  private status: TradingEngineStatus;
  private thresholds: TradingThresholds;
  private sessionLogs: TradingSessionLog[] = [];
  private currentSession: TradingSessionLog | null = null;

  constructor(customThresholds?: Partial<TradingThresholds>) {
    this.thresholds = {
      ...TRADING_CONFIG.DEFAULT_THRESHOLDS,
      ...customThresholds,
    };

    this.status = {
      mode: 'ACTIVE',
      isActive: true,
      currentAction: 'HOLD',
      currentDecision: null,
      activeSchedule: null,
      todayStats: {
        totalProfit: 0,
        chargeCount: 0,
        dischargeCount: 0,
        kwhCharged: 0,
        kwhDischarged: 0,
        efficiency: 0.95,
      },
      lastUpdate: new Date().toISOString(),
    };

    console.log('[AI TRADING] ═══════════════════════════════════════════════════');
    console.log('[AI TRADING] 🤖 Field Nine AI Trading Engine ACTIVATED');
    console.log('[AI TRADING] ═══════════════════════════════════════════════════');
    console.log(`[AI TRADING] Low Threshold: ₩${this.thresholds.lowThreshold}/kWh`);
    console.log(`[AI TRADING] High Threshold: ₩${this.thresholds.highThreshold}/kWh`);
    console.log(`[AI TRADING] Min SoC for Discharge: ${this.thresholds.minSoCForDischarge}%`);
    console.log(`[AI TRADING] Max SoC for Charge: ${this.thresholds.maxSoCForCharge}%`);
    console.log('[AI TRADING] ═══════════════════════════════════════════════════');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CORE DECISION ENGINE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Main decision function - analyzes current state and returns optimal action
   */
  async makeDecision(): Promise<TradingDecision> {
    const [smpData, teslaData, forecast] = await Promise.all([
      getLiveSMP(),
      getLiveTeslaData(),
      getProphetForecast(TRADING_CONFIG.CYBERTRUCK.batteryCapacity),
    ]);

    // Get current state
    const currentPrice = smpData.price;
    const currentSoC = this.getAverageSoC(teslaData);
    const batteryCapacity = this.getTotalBatteryCapacity(teslaData);

    // Analyze price position
    const priceAnalysis = this.analyzePricePosition(currentPrice, forecast);

    // Make decision based on price and battery state
    const decision = this.calculateOptimalAction(
      currentPrice,
      currentSoC,
      batteryCapacity,
      priceAnalysis,
      forecast
    );

    // Update status
    this.status.currentDecision = decision;
    this.status.currentAction = decision.action;
    this.status.lastUpdate = new Date().toISOString();

    console.log(`[AI TRADING] Decision: ${decision.action} | Confidence: ${decision.confidence}% | Reason: ${decision.reason}`);

    return decision;
  }

  /**
   * Calculate optimal action based on all factors
   */
  private calculateOptimalAction(
    currentPrice: number,
    currentSoC: number,
    batteryCapacity: number,
    priceAnalysis: { position: string; percentile: number; trend: string },
    forecast: ProphetForecast
  ): TradingDecision {
    const timestamp = new Date().toISOString();

    // Check safety constraints first
    if (currentSoC <= TRADING_CONFIG.LIMITS.emergencyStopSoC) {
      return {
        action: 'CHARGE',
        confidence: 100,
        reason: `긴급 충전 필요 - 배터리 잔량 ${currentSoC}%로 위험 수준`,
        targetSoC: 50,
        estimatedProfit: 0,
        estimatedDuration: 60,
        urgency: 'HIGH',
        timestamp,
      };
    }

    // DISCHARGE condition: High price + sufficient SoC
    if (
      currentPrice >= this.thresholds.highThreshold &&
      currentSoC > this.thresholds.minSoCForDischarge
    ) {
      const dischargeable = currentSoC - this.thresholds.minSoCForDischarge;
      const kwhToDischarge = (dischargeable / 100) * batteryCapacity;
      const estimatedProfit = this.calculateDischargeProfit(kwhToDischarge, currentPrice);

      return {
        action: 'DISCHARGE',
        confidence: Math.min(95, 70 + priceAnalysis.percentile * 0.25),
        reason: `전력 단가 고점 (₩${currentPrice}/kWh > ₩${this.thresholds.highThreshold}) - V2G 판매 권장`,
        targetSoC: this.thresholds.minSoCForDischarge,
        estimatedProfit,
        estimatedDuration: Math.round(kwhToDischarge / TRADING_CONFIG.CYBERTRUCK.maxDischargeRate * 60),
        urgency: priceAnalysis.percentile > 85 ? 'HIGH' : 'MEDIUM',
        timestamp,
      };
    }

    // CHARGE condition: Low price + battery not full
    if (
      currentPrice <= this.thresholds.lowThreshold &&
      currentSoC < this.thresholds.maxSoCForCharge
    ) {
      const chargeable = this.thresholds.maxSoCForCharge - currentSoC;
      const kwhToCharge = (chargeable / 100) * batteryCapacity;
      const estimatedSavings = this.calculateChargeSavings(kwhToCharge, currentPrice, forecast);

      return {
        action: 'CHARGE',
        confidence: Math.min(95, 70 + (100 - priceAnalysis.percentile) * 0.25),
        reason: `전력 단가 저점 (₩${currentPrice}/kWh < ₩${this.thresholds.lowThreshold}) - 충전 권장`,
        targetSoC: this.thresholds.maxSoCForCharge,
        estimatedProfit: estimatedSavings,
        estimatedDuration: Math.round(kwhToCharge / TRADING_CONFIG.CYBERTRUCK.homeChargeRate * 60),
        urgency: priceAnalysis.percentile < 15 ? 'HIGH' : 'MEDIUM',
        timestamp,
      };
    }

    // HOLD condition: Mid-range price or battery constraints
    return {
      action: 'HOLD',
      confidence: 80,
      reason: `대기 중 - 전력 단가 ₩${currentPrice}/kWh (중간대), 최적 타이밍 대기`,
      targetSoC: currentSoC,
      estimatedProfit: 0,
      estimatedDuration: 0,
      urgency: 'LOW',
      timestamp,
    };
  }

  /**
   * Analyze current price position relative to forecast
   */
  private analyzePricePosition(
    currentPrice: number,
    forecast: ProphetForecast
  ): { position: string; percentile: number; trend: string } {
    const prices = forecast.predictions.map(p => p.predictedPrice);
    const sortedPrices = [...prices].sort((a, b) => a - b);

    // Calculate percentile
    const index = sortedPrices.findIndex(p => p >= currentPrice);
    const percentile = index >= 0 ? (index / sortedPrices.length) * 100 : 100;

    // Determine position
    let position: string;
    if (percentile <= 25) position = 'LOW';
    else if (percentile <= 75) position = 'MID';
    else position = 'HIGH';

    // Determine trend from forecast
    const trend = forecast.decision.action === 'CHARGE' ? 'FALLING' :
                  forecast.decision.action === 'DISCHARGE' ? 'RISING' : 'STABLE';

    return { position, percentile, trend };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFIT CALCULATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Calculate expected profit from V2G discharge
   */
  private calculateDischargeProfit(kwhAmount: number, smpPrice: number): number {
    const grossRevenue = kwhAmount * smpPrice * TRADING_CONFIG.PROFIT.v2gPremium;
    const gridFee = grossRevenue * TRADING_CONFIG.PROFIT.gridFee;
    const efficiencyLoss = kwhAmount * (1 - TRADING_CONFIG.CYBERTRUCK.efficiency) * smpPrice;

    return Math.round(grossRevenue - gridFee - efficiencyLoss);
  }

  /**
   * Calculate expected savings from charging at low price
   */
  private calculateChargeSavings(kwhAmount: number, currentPrice: number, forecast: ProphetForecast): number {
    // Calculate savings compared to peak hour charging
    const peakPrice = forecast.optimalDischargeWindow.expectedPrice;
    const priceDelta = peakPrice - currentPrice;
    const savings = kwhAmount * priceDelta * TRADING_CONFIG.CYBERTRUCK.efficiency;

    return Math.round(savings);
  }

  /**
   * Calculate today's expected energy profit
   */
  async calculateDailyProfitEstimate(): Promise<{
    expectedProfit: number;
    expectedProfitUSD: number;
    breakdown: {
      arbitrageProfit: number;
      kausRewards: number;
      gridFees: number;
    };
    confidence: number;
  }> {
    const [teslaData, forecast] = await Promise.all([
      getLiveTeslaData(),
      getProphetForecast(TRADING_CONFIG.CYBERTRUCK.batteryCapacity),
    ]);

    const batteryCapacity = this.getTotalBatteryCapacity(teslaData) || TRADING_CONFIG.CYBERTRUCK.batteryCapacity;

    // Calculate arbitrage potential
    const priceSpread = forecast.optimalDischargeWindow.expectedPrice -
                        forecast.optimalChargeWindow.expectedPrice;
    const tradableEnergy = batteryCapacity * 0.6; // Assume 60% usable range
    const arbitrageProfit = priceSpread * tradableEnergy * TRADING_CONFIG.CYBERTRUCK.efficiency;

    // Calculate K-AUS rewards
    const kausRewards = tradableEnergy * 2 * TRADING_CONFIG.PROFIT.kausRewardPerKwh * 0.15; // K-AUS at ₩0.15

    // Grid fees
    const gridFees = arbitrageProfit * TRADING_CONFIG.PROFIT.gridFee;

    const expectedProfit = Math.round(arbitrageProfit + kausRewards - gridFees);

    return {
      expectedProfit,
      expectedProfitUSD: Math.round(expectedProfit / 1350 * 100) / 100,
      breakdown: {
        arbitrageProfit: Math.round(arbitrageProfit),
        kausRewards: Math.round(kausRewards),
        gridFees: Math.round(gridFees),
      },
      confidence: forecast.modelAccuracy,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCHEDULE GENERATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generate 24-hour optimal trading schedule
   */
  async generateDailySchedule(): Promise<TradingSchedule> {
    const forecast = await getProphetForecast(TRADING_CONFIG.CYBERTRUCK.batteryCapacity);

    const entries: ScheduleEntry[] = forecast.predictions.map(prediction => {
      let action: TradingAction;
      let targetSoC: number;
      let reason: string;

      if (prediction.predictedPrice <= this.thresholds.lowThreshold) {
        action = 'CHARGE';
        targetSoC = this.thresholds.maxSoCForCharge;
        reason = `저점 예상 (₩${Math.round(prediction.predictedPrice)}/kWh)`;
      } else if (prediction.predictedPrice >= this.thresholds.highThreshold) {
        action = 'DISCHARGE';
        targetSoC = this.thresholds.minSoCForDischarge;
        reason = `고점 예상 (₩${Math.round(prediction.predictedPrice)}/kWh)`;
      } else {
        action = 'HOLD';
        targetSoC = 50;
        reason = `중간대 (₩${Math.round(prediction.predictedPrice)}/kWh)`;
      }

      return {
        hour: prediction.hour,
        action,
        targetSoC,
        expectedPrice: Math.round(prediction.predictedPrice),
        confidence: prediction.confidenceScore,
        reason,
      };
    });

    const dailyProfit = await this.calculateDailyProfitEstimate();

    const schedule: TradingSchedule = {
      scheduleId: `SCH-${Date.now()}`,
      createdAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      entries,
      expectedDailyProfit: dailyProfit.expectedProfit,
      expectedMonthlyProfit: dailyProfit.expectedProfit * 30,
    };

    this.status.activeSchedule = schedule;
    return schedule;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get average SoC from Tesla fleet
   */
  private getAverageSoC(teslaData: LiveTeslaData): number {
    if (!teslaData.vehicles || teslaData.vehicles.length === 0) {
      return 50; // Default assumption
    }
    return teslaData.averageSoC;
  }

  /**
   * Get total battery capacity from Tesla fleet
   */
  private getTotalBatteryCapacity(teslaData: LiveTeslaData): number {
    if (!teslaData.vehicles || teslaData.vehicles.length === 0) {
      return TRADING_CONFIG.CYBERTRUCK.batteryCapacity;
    }
    return teslaData.totalBatteryCapacity;
  }

  /**
   * Update trading thresholds dynamically
   */
  updateThresholds(newThresholds: Partial<TradingThresholds>): void {
    this.thresholds = {
      ...this.thresholds,
      ...newThresholds,
    };
    console.log('[AI TRADING] Thresholds updated:', this.thresholds);
  }

  /**
   * Get current engine status
   */
  getStatus(): TradingEngineStatus {
    return { ...this.status };
  }

  /**
   * Get current thresholds
   */
  getThresholds(): TradingThresholds {
    return { ...this.thresholds };
  }

  /**
   * Pause trading engine
   */
  pause(): void {
    this.status.mode = 'PAUSED';
    this.status.isActive = false;
    console.log('[AI TRADING] ⏸️ Trading engine PAUSED');
  }

  /**
   * Resume trading engine
   */
  resume(): void {
    this.status.mode = 'ACTIVE';
    this.status.isActive = true;
    console.log('[AI TRADING] ▶️ Trading engine RESUMED');
  }

  /**
   * Emergency stop
   */
  emergencyStop(): void {
    this.status.mode = 'SAFETY_LOCK';
    this.status.isActive = false;
    this.status.currentAction = 'HOLD';
    console.log('[AI TRADING] 🚨 EMERGENCY STOP ACTIVATED');
  }

  /**
   * Get session logs
   */
  getSessionLogs(): TradingSessionLog[] {
    return [...this.sessionLogs];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════════

export const aiTradingEngine = new AITradingEngine();

// ═══════════════════════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export async function getTradingDecision(): Promise<TradingDecision> {
  return aiTradingEngine.makeDecision();
}

export async function getDailyTradingSchedule(): Promise<TradingSchedule> {
  return aiTradingEngine.generateDailySchedule();
}

export async function getDailyProfitEstimate(): Promise<{
  expectedProfit: number;
  expectedProfitUSD: number;
  breakdown: {
    arbitrageProfit: number;
    kausRewards: number;
    gridFees: number;
  };
  confidence: number;
}> {
  return aiTradingEngine.calculateDailyProfitEstimate();
}

export function getTradingEngineStatus(): TradingEngineStatus {
  return aiTradingEngine.getStatus();
}

export function updateTradingThresholds(thresholds: Partial<TradingThresholds>): void {
  aiTradingEngine.updateThresholds(thresholds);
}

export function pauseTradingEngine(): void {
  aiTradingEngine.pause();
}

export function resumeTradingEngine(): void {
  aiTradingEngine.resume();
}

export function emergencyStopTrading(): void {
  aiTradingEngine.emergencyStop();
}
