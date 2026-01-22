/**
 * AUTOMATED YIELD RE-BALANCING ALGORITHM
 *
 * AI 기반 수익 최적화 엔진
 * - 1분 단위 의사결정: 전기 직접 판매 vs 연산력 생산
 * - 실시간 시장 분석
 * - 수익 극대화 전략
 */

import {
  energyHashrateMapper,
  COMPUTE_CONFIG,
  GPUType,
  EnergyFeed,
} from './energy-hashrate-mapping';
import { computeMarketplace, MARKETPLACE_CONFIG } from './compute-marketplace';

// Yield Decision Type
export type YieldDecision = 'SELL_ELECTRICITY' | 'PRODUCE_COMPUTE' | 'HYBRID';

// Market Condition
export type MarketCondition = 'BULL' | 'BEAR' | 'NEUTRAL' | 'VOLATILE';

// Optimizer Configuration
export const OPTIMIZER_CONFIG = {
  // Decision interval (milliseconds)
  DECISION_INTERVAL: 60_000, // 1 minute

  // Electricity price thresholds (USD per kWh)
  ELECTRICITY_PRICE: {
    LOW: 0.05,
    MEDIUM: 0.10,
    HIGH: 0.15,
    PEAK: 0.25,
  },

  // Compute premium threshold (multiplier over electricity value)
  COMPUTE_PREMIUM_THRESHOLD: 1.5,

  // Minimum profit margin for compute
  MIN_COMPUTE_MARGIN: 0.20, // 20%

  // Maximum allocation to compute
  MAX_COMPUTE_ALLOCATION: 0.80, // 80% max to compute

  // Risk adjustment factors
  RISK_FACTORS: {
    ELECTRICITY_VOLATILITY: 0.15,
    COMPUTE_DEMAND_UNCERTAINTY: 0.20,
    EQUIPMENT_FAILURE_RISK: 0.05,
  },

  // Time-of-use pricing hours (24h format)
  PEAK_HOURS: [10, 11, 12, 13, 14, 18, 19, 20, 21],
  OFF_PEAK_HOURS: [0, 1, 2, 3, 4, 5, 22, 23],

  // Seasonal adjustment (multiplier)
  SEASONAL_ADJUSTMENT: {
    SUMMER: 1.2,  // Higher electricity prices
    WINTER: 1.15,
    SPRING: 1.0,
    FALL: 1.0,
  },
};

// Yield Analysis Result
export interface YieldAnalysis {
  timestamp: number;
  powerPlantId: string;
  surplusPowerKW: number;
  decision: YieldDecision;
  confidence: number; // 0-1
  electricityYieldUSD: number;
  computeYieldKAUS: number;
  computeYieldUSD: number;
  premiumMultiplier: number;
  recommendedAllocation: {
    electricity: number; // 0-1
    compute: number;     // 0-1
  };
  factors: {
    electricityPrice: number;
    computeDemand: number;
    marketCondition: MarketCondition;
    timeOfDay: 'PEAK' | 'NORMAL' | 'OFF_PEAK';
    riskAdjustedScore: number;
  };
  projectedDailyYieldUSD: number;
  projectedMonthlyYieldUSD: number;
}

// Historical Decision
export interface HistoricalDecision {
  timestamp: number;
  powerPlantId: string;
  decision: YieldDecision;
  electricityAllocation: number;
  computeAllocation: number;
  actualYieldUSD: number;
  optimalYieldUSD: number;
  efficiency: number; // actual/optimal
}

// Optimization Strategy
export interface OptimizationStrategy {
  name: string;
  description: string;
  parameters: {
    computeThreshold: number;
    electricityThreshold: number;
    riskTolerance: number;
  };
  expectedReturn: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

class YieldOptimizer {
  private decisionHistory: HistoricalDecision[] = [];
  private analysisCache: Map<string, YieldAnalysis> = new Map();
  private kausToUsdRate = 0.15; // 1 K-AUS = $0.15 (dynamic)

  constructor() {
    this.initializeMockHistory();
  }

  private initializeMockHistory(): void {
    // Generate 7 days of historical decisions
    const now = Date.now();
    const powerPlants = ['SOLAR-JEJU-001', 'WIND-TEXAS-001', 'SOLAR-DUBAI-001'];

    for (let day = 6; day >= 0; day--) {
      for (let hour = 0; hour < 24; hour++) {
        powerPlants.forEach(plantId => {
          const timestamp = now - day * 24 * 60 * 60 * 1000 - hour * 60 * 60 * 1000;
          const isPeak = OPTIMIZER_CONFIG.PEAK_HOURS.includes(hour);
          const isOffPeak = OPTIMIZER_CONFIG.OFF_PEAK_HOURS.includes(hour);

          // Decision based on time of day
          let decision: YieldDecision;
          let electricityAllocation: number;
          let computeAllocation: number;

          if (isPeak) {
            // Peak hours: prefer selling electricity
            decision = Math.random() > 0.3 ? 'SELL_ELECTRICITY' : 'HYBRID';
            electricityAllocation = 0.6 + Math.random() * 0.3;
            computeAllocation = 1 - electricityAllocation;
          } else if (isOffPeak) {
            // Off-peak: prefer compute
            decision = Math.random() > 0.2 ? 'PRODUCE_COMPUTE' : 'HYBRID';
            computeAllocation = 0.7 + Math.random() * 0.25;
            electricityAllocation = 1 - computeAllocation;
          } else {
            // Normal hours: hybrid
            decision = 'HYBRID';
            electricityAllocation = 0.4 + Math.random() * 0.2;
            computeAllocation = 1 - electricityAllocation;
          }

          const surplusKW = 5000 + Math.random() * 15000;
          const actualYield = surplusKW * (isPeak ? 0.20 : 0.10) * electricityAllocation +
            surplusKW * computeAllocation * 0.15 * this.kausToUsdRate;
          const optimalYield = actualYield * (0.9 + Math.random() * 0.2);

          this.decisionHistory.push({
            timestamp,
            powerPlantId: plantId,
            decision,
            electricityAllocation,
            computeAllocation,
            actualYieldUSD: actualYield,
            optimalYieldUSD: optimalYield,
            efficiency: actualYield / optimalYield,
          });
        });
      }
    }
  }

  /**
   * Get current electricity price
   */
  private getCurrentElectricityPrice(region: string): number {
    const hour = new Date().getHours();
    const isPeak = OPTIMIZER_CONFIG.PEAK_HOURS.includes(hour);
    const isOffPeak = OPTIMIZER_CONFIG.OFF_PEAK_HOURS.includes(hour);

    // Regional base prices
    const regionPrices: Record<string, number> = {
      KR: 0.10,
      US: 0.08,
      EU: 0.15,
      UAE: 0.05,
      JP: 0.18,
      SG: 0.12,
      AU: 0.14,
    };

    let basePrice = regionPrices[region] || 0.10;

    // Time-of-use adjustment
    if (isPeak) {
      basePrice *= 1.5;
    } else if (isOffPeak) {
      basePrice *= 0.6;
    }

    // Add some randomness for realism
    basePrice *= 0.9 + Math.random() * 0.2;

    return basePrice;
  }

  /**
   * Get compute demand score
   */
  private getComputeDemandScore(): number {
    const marketStats = computeMarketplace.getMarketStats();

    // Base score from demand level
    const demandScores: Record<string, number> = {
      LOW: 0.3,
      NORMAL: 0.6,
      HIGH: 0.85,
      SURGE: 1.0,
    };

    let score = demandScores[marketStats.currentDemandLevel] || 0.5;

    // Adjust based on active bids
    const bidBonus = Math.min(0.2, marketStats.activeBids / 100);
    score += bidBonus;

    return Math.min(1, score);
  }

  /**
   * Determine market condition
   */
  private getMarketCondition(): MarketCondition {
    const computeDemand = this.getComputeDemandScore();
    const recentHistory = this.decisionHistory.slice(-24); // Last 24 hours

    if (recentHistory.length === 0) return 'NEUTRAL';

    const avgEfficiency = recentHistory.reduce((sum, d) => sum + d.efficiency, 0) / recentHistory.length;
    const yieldVariance = this.calculateVariance(recentHistory.map(d => d.actualYieldUSD));

    if (computeDemand > 0.8 && avgEfficiency > 0.9) {
      return 'BULL';
    } else if (computeDemand < 0.4 && avgEfficiency < 0.7) {
      return 'BEAR';
    } else if (yieldVariance > 1000) {
      return 'VOLATILE';
    }

    return 'NEUTRAL';
  }

  /**
   * Calculate variance
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }

  /**
   * Analyze yield and make recommendation
   */
  analyzeYield(powerPlantId: string, energyFeed?: EnergyFeed): YieldAnalysis {
    const feed = energyFeed || energyHashrateMapper.getEnergyFeeds().find(f => f.powerPlantId === powerPlantId);

    if (!feed) {
      throw new Error(`Energy feed not found for ${powerPlantId}`);
    }

    const surplusKW = feed.surplusPowerKW;
    const hour = new Date().getHours();
    const isPeak = OPTIMIZER_CONFIG.PEAK_HOURS.includes(hour);
    const isOffPeak = OPTIMIZER_CONFIG.OFF_PEAK_HOURS.includes(hour);

    // Get current prices and demand
    const electricityPrice = this.getCurrentElectricityPrice(powerPlantId.split('-')[0]);
    const computeDemand = this.getComputeDemandScore();
    const marketCondition = this.getMarketCondition();

    // Calculate yields
    const hourlyElectricityKWh = surplusKW; // kWh per hour
    const electricityYieldUSD = hourlyElectricityKWh * electricityPrice;

    // Compute yield calculation
    const hashrateMapping = energyHashrateMapper.mapEnergyToHashrate(powerPlantId);
    const computeCreditsPerHour = hashrateMapping.estimatedCreditsPerHour;
    const computeYieldKAUS = computeCreditsPerHour * 0.001; // Credits to K-AUS
    const computeYieldUSD = computeYieldKAUS * this.kausToUsdRate;

    // Premium multiplier
    const premiumMultiplier = computeYieldUSD > 0 ? computeYieldUSD / electricityYieldUSD : 0;

    // Make decision
    let decision: YieldDecision;
    let electricityAllocation: number;
    let computeAllocation: number;
    let confidence: number;

    if (premiumMultiplier >= OPTIMIZER_CONFIG.COMPUTE_PREMIUM_THRESHOLD && computeDemand > 0.5) {
      // Strong compute advantage
      decision = 'PRODUCE_COMPUTE';
      computeAllocation = Math.min(OPTIMIZER_CONFIG.MAX_COMPUTE_ALLOCATION, 0.7 + computeDemand * 0.2);
      electricityAllocation = 1 - computeAllocation;
      confidence = 0.8 + computeDemand * 0.15;
    } else if (isPeak && electricityPrice > OPTIMIZER_CONFIG.ELECTRICITY_PRICE.HIGH) {
      // Peak electricity prices
      decision = 'SELL_ELECTRICITY';
      electricityAllocation = 0.7 + (electricityPrice / OPTIMIZER_CONFIG.ELECTRICITY_PRICE.PEAK) * 0.2;
      electricityAllocation = Math.min(0.95, electricityAllocation);
      computeAllocation = 1 - electricityAllocation;
      confidence = 0.75 + (electricityPrice / OPTIMIZER_CONFIG.ELECTRICITY_PRICE.PEAK) * 0.15;
    } else if (isOffPeak && computeDemand > 0.4) {
      // Off-peak with decent compute demand
      decision = 'PRODUCE_COMPUTE';
      computeAllocation = 0.6 + computeDemand * 0.3;
      electricityAllocation = 1 - computeAllocation;
      confidence = 0.7 + computeDemand * 0.2;
    } else {
      // Hybrid approach
      decision = 'HYBRID';
      const baseAllocation = 0.5;
      const demandAdjustment = (computeDemand - 0.5) * 0.3;
      const priceAdjustment = (electricityPrice - OPTIMIZER_CONFIG.ELECTRICITY_PRICE.MEDIUM) /
        OPTIMIZER_CONFIG.ELECTRICITY_PRICE.MEDIUM * 0.2;

      electricityAllocation = Math.max(0.2, Math.min(0.8, baseAllocation + priceAdjustment - demandAdjustment));
      computeAllocation = 1 - electricityAllocation;
      confidence = 0.6 + Math.abs(demandAdjustment) * 0.5;
    }

    // Risk adjustment
    const riskFactor = 1 -
      OPTIMIZER_CONFIG.RISK_FACTORS.ELECTRICITY_VOLATILITY * (marketCondition === 'VOLATILE' ? 1 : 0.3) -
      OPTIMIZER_CONFIG.RISK_FACTORS.COMPUTE_DEMAND_UNCERTAINTY * (1 - computeDemand) -
      OPTIMIZER_CONFIG.RISK_FACTORS.EQUIPMENT_FAILURE_RISK;

    const riskAdjustedScore = confidence * riskFactor;

    // Calculate projections
    const hourlyYieldUSD = electricityYieldUSD * electricityAllocation + computeYieldUSD * computeAllocation;
    const projectedDailyYieldUSD = hourlyYieldUSD * 24;
    const projectedMonthlyYieldUSD = projectedDailyYieldUSD * 30;

    const analysis: YieldAnalysis = {
      timestamp: Date.now(),
      powerPlantId,
      surplusPowerKW: surplusKW,
      decision,
      confidence,
      electricityYieldUSD,
      computeYieldKAUS,
      computeYieldUSD,
      premiumMultiplier,
      recommendedAllocation: {
        electricity: electricityAllocation,
        compute: computeAllocation,
      },
      factors: {
        electricityPrice,
        computeDemand,
        marketCondition,
        timeOfDay: isPeak ? 'PEAK' : isOffPeak ? 'OFF_PEAK' : 'NORMAL',
        riskAdjustedScore,
      },
      projectedDailyYieldUSD,
      projectedMonthlyYieldUSD,
    };

    this.analysisCache.set(powerPlantId, analysis);
    return analysis;
  }

  /**
   * Get optimization strategies
   */
  getOptimizationStrategies(): OptimizationStrategy[] {
    return [
      {
        name: 'Aggressive Compute',
        description: '연산력 생산 최대화 - 높은 K-AUS 수익, 높은 리스크',
        parameters: {
          computeThreshold: 0.3,
          electricityThreshold: 0.25,
          riskTolerance: 0.8,
        },
        expectedReturn: 0.35, // 35% higher returns
        riskLevel: 'HIGH',
      },
      {
        name: 'Balanced Yield',
        description: '균형 잡힌 수익 배분 - 안정적 수익, 중간 리스크',
        parameters: {
          computeThreshold: 0.5,
          electricityThreshold: 0.12,
          riskTolerance: 0.5,
        },
        expectedReturn: 0.20,
        riskLevel: 'MEDIUM',
      },
      {
        name: 'Conservative Electric',
        description: '전기 판매 우선 - 안정적 수익, 낮은 리스크',
        parameters: {
          computeThreshold: 0.7,
          electricityThreshold: 0.08,
          riskTolerance: 0.3,
        },
        expectedReturn: 0.10,
        riskLevel: 'LOW',
      },
      {
        name: 'Peak Arbitrage',
        description: '피크 시간 전기, 비피크 연산 - 시간 기반 최적화',
        parameters: {
          computeThreshold: 0.4,
          electricityThreshold: 0.15,
          riskTolerance: 0.6,
        },
        expectedReturn: 0.28,
        riskLevel: 'MEDIUM',
      },
      {
        name: 'K-AUS Maximizer',
        description: 'K-AUS 토큰 축적 최대화 - 장기 투자 전략',
        parameters: {
          computeThreshold: 0.2,
          electricityThreshold: 0.30,
          riskTolerance: 0.9,
        },
        expectedReturn: 0.45, // In K-AUS terms
        riskLevel: 'HIGH',
      },
    ];
  }

  /**
   * Get historical decisions
   */
  getDecisionHistory(powerPlantId?: string, limit: number = 100): HistoricalDecision[] {
    let history = this.decisionHistory;

    if (powerPlantId) {
      history = history.filter(d => d.powerPlantId === powerPlantId);
    }

    return history.slice(-limit);
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(powerPlantId?: string): {
    averageEfficiency: number;
    totalYieldUSD: number;
    computeAllocationRate: number;
    electricityAllocationRate: number;
    decisionsCount: number;
    bestDecision: HistoricalDecision | null;
    worstDecision: HistoricalDecision | null;
  } {
    let history = this.decisionHistory;

    if (powerPlantId) {
      history = history.filter(d => d.powerPlantId === powerPlantId);
    }

    if (history.length === 0) {
      return {
        averageEfficiency: 0,
        totalYieldUSD: 0,
        computeAllocationRate: 0,
        electricityAllocationRate: 0,
        decisionsCount: 0,
        bestDecision: null,
        worstDecision: null,
      };
    }

    const avgEfficiency = history.reduce((sum, d) => sum + d.efficiency, 0) / history.length;
    const totalYield = history.reduce((sum, d) => sum + d.actualYieldUSD, 0);
    const avgCompute = history.reduce((sum, d) => sum + d.computeAllocation, 0) / history.length;
    const avgElectricity = history.reduce((sum, d) => sum + d.electricityAllocation, 0) / history.length;

    const sorted = [...history].sort((a, b) => b.efficiency - a.efficiency);

    return {
      averageEfficiency: avgEfficiency,
      totalYieldUSD: totalYield,
      computeAllocationRate: avgCompute,
      electricityAllocationRate: avgElectricity,
      decisionsCount: history.length,
      bestDecision: sorted[0] || null,
      worstDecision: sorted[sorted.length - 1] || null,
    };
  }

  /**
   * Run simulation
   */
  simulateYield(params: {
    surplusPowerKW: number;
    electricityPrice: number;
    computeDemand: number;
    durationHours: number;
    strategy: 'AGGRESSIVE' | 'BALANCED' | 'CONSERVATIVE';
  }): {
    timeline: { hour: number; electricityYield: number; computeYield: number; totalYield: number }[];
    summary: {
      totalElectricityYieldUSD: number;
      totalComputeYieldKAUS: number;
      totalComputeYieldUSD: number;
      totalYieldUSD: number;
      averageHourlyYield: number;
    };
  } {
    const { surplusPowerKW, electricityPrice, computeDemand, durationHours, strategy } = params;

    const strategyParams = {
      AGGRESSIVE: { compute: 0.8, electric: 0.2 },
      BALANCED: { compute: 0.5, electric: 0.5 },
      CONSERVATIVE: { compute: 0.3, electric: 0.7 },
    };

    const allocation = strategyParams[strategy];
    const timeline: { hour: number; electricityYield: number; computeYield: number; totalYield: number }[] = [];

    let totalElectricity = 0;
    let totalComputeKAUS = 0;

    for (let hour = 0; hour < durationHours; hour++) {
      const isPeak = OPTIMIZER_CONFIG.PEAK_HOURS.includes(hour % 24);
      const isOffPeak = OPTIMIZER_CONFIG.OFF_PEAK_HOURS.includes(hour % 24);

      // Adjust allocation based on time
      let hourlyElectricAlloc = allocation.electric;
      let hourlyComputeAlloc = allocation.compute;

      if (isPeak && strategy !== 'AGGRESSIVE') {
        hourlyElectricAlloc += 0.2;
        hourlyComputeAlloc -= 0.2;
      } else if (isOffPeak && strategy !== 'CONSERVATIVE') {
        hourlyComputeAlloc += 0.15;
        hourlyElectricAlloc -= 0.15;
      }

      // Calculate yields
      const priceMultiplier = isPeak ? 1.5 : isOffPeak ? 0.6 : 1.0;
      const electricityYield = surplusPowerKW * electricityPrice * priceMultiplier * hourlyElectricAlloc;

      const computeCredits = surplusPowerKW * 10 * hourlyComputeAlloc; // 10 credits per kWh
      const computeYieldKAUS = computeCredits * 0.001;
      const computeYield = computeYieldKAUS * this.kausToUsdRate;

      timeline.push({
        hour,
        electricityYield,
        computeYield,
        totalYield: electricityYield + computeYield,
      });

      totalElectricity += electricityYield;
      totalComputeKAUS += computeYieldKAUS;
    }

    return {
      timeline,
      summary: {
        totalElectricityYieldUSD: totalElectricity,
        totalComputeYieldKAUS: totalComputeKAUS,
        totalComputeYieldUSD: totalComputeKAUS * this.kausToUsdRate,
        totalYieldUSD: totalElectricity + totalComputeKAUS * this.kausToUsdRate,
        averageHourlyYield: (totalElectricity + totalComputeKAUS * this.kausToUsdRate) / durationHours,
      },
    };
  }

  /**
   * Update K-AUS to USD rate
   */
  updateKausRate(rate: number): void {
    this.kausToUsdRate = rate;
  }

  /**
   * Get all analyses
   */
  getAllAnalyses(): YieldAnalysis[] {
    return Array.from(this.analysisCache.values());
  }
}

// Singleton instance
export const yieldOptimizer = new YieldOptimizer();

// Convenience exports
export const analyzeYield = (powerPlantId: string, energyFeed?: EnergyFeed) =>
  yieldOptimizer.analyzeYield(powerPlantId, energyFeed);

export const getYieldStrategies = () => yieldOptimizer.getOptimizationStrategies();

export const getYieldHistory = (powerPlantId?: string, limit?: number) =>
  yieldOptimizer.getDecisionHistory(powerPlantId, limit);

export const getYieldMetrics = (powerPlantId?: string) =>
  yieldOptimizer.getPerformanceMetrics(powerPlantId);

export const simulateYieldStrategy = (params: Parameters<typeof yieldOptimizer.simulateYield>[0]) =>
  yieldOptimizer.simulateYield(params);
