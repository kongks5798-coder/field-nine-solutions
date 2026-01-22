/**
 * AUTONOMOUS YIELD STRATEGY ENGINE
 *
 * Phase 19: Personal AI Banker
 * 유저의 자산을 실시간 시장 상황에 맞춰 최적 배분하는 알고리즘
 *
 * 전략 모드:
 * - CONSERVATIVE: 안정성 우선, 저위험 저수익
 * - GROWTH: 균형 잡힌 성장, 중위험 중수익
 * - MAX_ALPHA: 공격적 수익 추구, 고위험 고수익
 */

// ============================================
// TYPES
// ============================================

export type RiskProfile = 'CONSERVATIVE' | 'GROWTH' | 'MAX_ALPHA';

export type AssetAllocationTarget = 'ENERGY_SWAP' | 'COMPUTE_LENDING' | 'STAKING' | 'LIQUIDITY_POOL' | 'CARD_RESERVE';

export interface MarketCondition {
  energyPriceAUD: number;
  energyPriceTrend: 'RISING' | 'STABLE' | 'FALLING';
  computeDemand: number; // 0-100
  kausPrice: number;
  kausPriceTrend: 'RISING' | 'STABLE' | 'FALLING';
  volatilityIndex: number; // 0-100
  timestamp: Date;
}

export interface UserPortfolio {
  userId: string;
  totalKaus: number;
  stakedKaus: number;
  liquidKaus: number;
  energyNodeShares: number;
  computeCredits: number;
  cardBalance: number;
  riskProfile: RiskProfile;
}

export interface AllocationDecision {
  id: string;
  timestamp: Date;
  fromAsset: AssetAllocationTarget;
  toAsset: AssetAllocationTarget;
  amount: number;
  reason: string;
  expectedReturn: number;
  riskScore: number;
  confidence: number;
  executed: boolean;
  actualReturn?: number;
}

export interface YieldStrategy {
  riskProfile: RiskProfile;
  targetAllocation: Record<AssetAllocationTarget, number>; // Percentage
  rebalanceThreshold: number; // % deviation before rebalancing
  maxSingleTrade: number; // Max % of portfolio per trade
  minHoldingPeriod: number; // Hours
}

export interface StrategyPerformance {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  profitableTrades: number;
}

// ============================================
// STRATEGY CONFIGURATIONS
// ============================================

export const STRATEGY_CONFIG: Record<RiskProfile, YieldStrategy> = {
  CONSERVATIVE: {
    riskProfile: 'CONSERVATIVE',
    targetAllocation: {
      ENERGY_SWAP: 0.15,
      COMPUTE_LENDING: 0.10,
      STAKING: 0.50,
      LIQUIDITY_POOL: 0.05,
      CARD_RESERVE: 0.20,
    },
    rebalanceThreshold: 0.10, // 10% deviation
    maxSingleTrade: 0.05, // 5% max per trade
    minHoldingPeriod: 168, // 7 days
  },
  GROWTH: {
    riskProfile: 'GROWTH',
    targetAllocation: {
      ENERGY_SWAP: 0.25,
      COMPUTE_LENDING: 0.25,
      STAKING: 0.30,
      LIQUIDITY_POOL: 0.10,
      CARD_RESERVE: 0.10,
    },
    rebalanceThreshold: 0.07, // 7% deviation
    maxSingleTrade: 0.10, // 10% max per trade
    minHoldingPeriod: 72, // 3 days
  },
  MAX_ALPHA: {
    riskProfile: 'MAX_ALPHA',
    targetAllocation: {
      ENERGY_SWAP: 0.35,
      COMPUTE_LENDING: 0.35,
      STAKING: 0.15,
      LIQUIDITY_POOL: 0.10,
      CARD_RESERVE: 0.05,
    },
    rebalanceThreshold: 0.05, // 5% deviation
    maxSingleTrade: 0.20, // 20% max per trade
    minHoldingPeriod: 24, // 1 day
  },
};

// Expected yields by asset type (annualized %)
export const BASE_YIELDS: Record<AssetAllocationTarget, number> = {
  ENERGY_SWAP: 0.18, // 18% base, volatile
  COMPUTE_LENDING: 0.22, // 22% base, demand-driven
  STAKING: 0.12, // 12% stable
  LIQUIDITY_POOL: 0.25, // 25% high risk
  CARD_RESERVE: 0.03, // 3% minimal
};

// Risk scores (0-100)
export const RISK_SCORES: Record<AssetAllocationTarget, number> = {
  ENERGY_SWAP: 65,
  COMPUTE_LENDING: 55,
  STAKING: 20,
  LIQUIDITY_POOL: 80,
  CARD_RESERVE: 5,
};

// ============================================
// MARKET ANALYSIS
// ============================================

function analyzeMarket(): MarketCondition {
  // Simulated real-time market data
  const baseEnergy = 85; // AUD per MWh
  const energyVariation = (Math.random() - 0.5) * 30;
  const energyPrice = baseEnergy + energyVariation;

  const trends: Array<'RISING' | 'STABLE' | 'FALLING'> = ['RISING', 'STABLE', 'FALLING'];
  const randomTrend = () => trends[Math.floor(Math.random() * 3)];

  return {
    energyPriceAUD: energyPrice,
    energyPriceTrend: energyVariation > 10 ? 'RISING' : energyVariation < -10 ? 'FALLING' : 'STABLE',
    computeDemand: 50 + Math.random() * 50,
    kausPrice: 2.47 + (Math.random() - 0.5) * 0.2,
    kausPriceTrend: randomTrend(),
    volatilityIndex: 20 + Math.random() * 40,
    timestamp: new Date(),
  };
}

function calculateMarketOpportunity(market: MarketCondition): {
  bestTarget: AssetAllocationTarget;
  opportunity: number;
  reasoning: string;
} {
  let bestTarget: AssetAllocationTarget = 'STAKING';
  let maxOpportunity = 0;
  let reasoning = '';

  // Energy Swap opportunity
  if (market.energyPriceTrend === 'RISING' && market.energyPriceAUD > 90) {
    const opp = 0.8 + (market.energyPriceAUD - 90) / 50;
    if (opp > maxOpportunity) {
      maxOpportunity = opp;
      bestTarget = 'ENERGY_SWAP';
      reasoning = `에너지 가격 상승 중 (${market.energyPriceAUD.toFixed(1)} AUD/MWh) - 스왑 수익 극대화 기회`;
    }
  }

  // Compute Lending opportunity
  if (market.computeDemand > 70) {
    const opp = 0.7 + (market.computeDemand - 70) / 100;
    if (opp > maxOpportunity) {
      maxOpportunity = opp;
      bestTarget = 'COMPUTE_LENDING';
      reasoning = `컴퓨팅 수요 급증 (${market.computeDemand.toFixed(0)}%) - 대출 이자율 상승`;
    }
  }

  // Liquidity Pool opportunity (high volatility)
  if (market.volatilityIndex > 50) {
    const opp = 0.6 + (market.volatilityIndex - 50) / 100;
    if (opp > maxOpportunity) {
      maxOpportunity = opp;
      bestTarget = 'LIQUIDITY_POOL';
      reasoning = `시장 변동성 증가 (VI: ${market.volatilityIndex.toFixed(0)}) - LP 수수료 수익 증가`;
    }
  }

  // Safe haven (low volatility, stable)
  if (market.volatilityIndex < 25 && market.kausPriceTrend === 'STABLE') {
    const opp = 0.5;
    if (opp > maxOpportunity) {
      maxOpportunity = opp;
      bestTarget = 'STAKING';
      reasoning = '안정적인 시장 환경 - 스테이킹으로 안정 수익 확보';
    }
  }

  return { bestTarget, opportunity: maxOpportunity, reasoning };
}

// ============================================
// YIELD STRATEGY ENGINE CLASS
// ============================================

class YieldStrategyEngine {
  private decisions: AllocationDecision[] = [];
  private portfolios: Map<string, UserPortfolio> = new Map();
  private performance: Map<string, StrategyPerformance> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Boss portfolio
    this.portfolios.set('USER-BOSS', {
      userId: 'USER-BOSS',
      totalKaus: 125000,
      stakedKaus: 75000,
      liquidKaus: 35000,
      energyNodeShares: 15,
      computeCredits: 5000,
      cardBalance: 15000,
      riskProfile: 'GROWTH',
    });

    // Generate historical decisions
    const targets: AssetAllocationTarget[] = ['ENERGY_SWAP', 'COMPUTE_LENDING', 'STAKING', 'LIQUIDITY_POOL'];
    const reasons = [
      '호주 에너지 가격 급등 감지 - 스왑 기회 포착',
      'AI 연산 수요 증가 - 컴퓨트 렌딩 확대',
      '시장 변동성 감소 - 안정 자산으로 리밸런싱',
      'K-AUS 가격 상승 기대 - 스테이킹 비중 확대',
      '피크 시간대 에너지 프리미엄 - 즉시 매도 실행',
    ];

    for (let i = 0; i < 50; i++) {
      const isProfit = Math.random() > 0.25;
      const expectedReturn = 0.5 + Math.random() * 3;
      const actualReturn = isProfit
        ? expectedReturn * (0.8 + Math.random() * 0.5)
        : -expectedReturn * Math.random() * 0.5;

      this.decisions.push({
        id: `DEC-${String(i + 1).padStart(4, '0')}`,
        timestamp: new Date(Date.now() - (50 - i) * 3600000),
        fromAsset: targets[Math.floor(Math.random() * targets.length)],
        toAsset: targets[Math.floor(Math.random() * targets.length)],
        amount: 100 + Math.random() * 2000,
        reason: reasons[Math.floor(Math.random() * reasons.length)],
        expectedReturn,
        riskScore: 20 + Math.random() * 60,
        confidence: 0.6 + Math.random() * 0.35,
        executed: true,
        actualReturn,
      });
    }

    // Performance metrics
    this.performance.set('USER-BOSS', {
      totalReturn: 0.247,
      annualizedReturn: 0.312,
      sharpeRatio: 1.85,
      maxDrawdown: -0.082,
      winRate: 0.76,
      totalTrades: 50,
      profitableTrades: 38,
    });
  }

  // Get current market analysis
  getMarketAnalysis(): MarketCondition & { opportunity: ReturnType<typeof calculateMarketOpportunity> } {
    const market = analyzeMarket();
    const opportunity = calculateMarketOpportunity(market);
    return { ...market, opportunity };
  }

  // Get strategy for risk profile
  getStrategy(riskProfile: RiskProfile): YieldStrategy {
    return STRATEGY_CONFIG[riskProfile];
  }

  // Get user portfolio
  getPortfolio(userId: string): UserPortfolio | undefined {
    return this.portfolios.get(userId);
  }

  // Update risk profile
  setRiskProfile(userId: string, profile: RiskProfile): void {
    const portfolio = this.portfolios.get(userId);
    if (portfolio) {
      portfolio.riskProfile = profile;
    }
  }

  // Generate rebalancing recommendation
  generateRebalanceRecommendation(userId: string): AllocationDecision | null {
    const portfolio = this.portfolios.get(userId);
    if (!portfolio) return null;

    const strategy = STRATEGY_CONFIG[portfolio.riskProfile];
    const market = this.getMarketAnalysis();

    // Check if rebalancing needed
    const currentAllocation = this.calculateCurrentAllocation(portfolio);
    const deviations = this.calculateDeviations(currentAllocation, strategy.targetAllocation);

    const maxDeviation = Math.max(...Object.values(deviations).map(Math.abs));
    if (maxDeviation < strategy.rebalanceThreshold) {
      return null; // No rebalancing needed
    }

    // Find most over-allocated and under-allocated
    let fromAsset: AssetAllocationTarget = 'STAKING';
    let toAsset: AssetAllocationTarget = 'STAKING';
    let maxOver = 0;
    let maxUnder = 0;

    for (const [asset, dev] of Object.entries(deviations)) {
      if (dev > maxOver) {
        maxOver = dev;
        fromAsset = asset as AssetAllocationTarget;
      }
      if (dev < maxUnder) {
        maxUnder = dev;
        toAsset = asset as AssetAllocationTarget;
      }
    }

    // Consider market opportunity
    if (market.opportunity.opportunity > 0.7) {
      toAsset = market.opportunity.bestTarget;
    }

    const amount = Math.min(
      portfolio.totalKaus * strategy.maxSingleTrade,
      portfolio.totalKaus * Math.abs(maxOver)
    );

    const decision: AllocationDecision = {
      id: `DEC-${Date.now()}`,
      timestamp: new Date(),
      fromAsset,
      toAsset,
      amount,
      reason: market.opportunity.reasoning || `리밸런싱: ${fromAsset}에서 ${toAsset}로 재배분`,
      expectedReturn: (BASE_YIELDS[toAsset] - BASE_YIELDS[fromAsset]) * 100,
      riskScore: RISK_SCORES[toAsset],
      confidence: 0.7 + Math.random() * 0.25,
      executed: false,
    };

    return decision;
  }

  private calculateCurrentAllocation(portfolio: UserPortfolio): Record<AssetAllocationTarget, number> {
    const total = portfolio.totalKaus;
    return {
      ENERGY_SWAP: (portfolio.energyNodeShares * 1000) / total,
      COMPUTE_LENDING: portfolio.computeCredits / total,
      STAKING: portfolio.stakedKaus / total,
      LIQUIDITY_POOL: 0.05, // Simulated
      CARD_RESERVE: portfolio.cardBalance / total,
    };
  }

  private calculateDeviations(
    current: Record<AssetAllocationTarget, number>,
    target: Record<AssetAllocationTarget, number>
  ): Record<AssetAllocationTarget, number> {
    const deviations: Record<AssetAllocationTarget, number> = {} as Record<AssetAllocationTarget, number>;
    for (const asset of Object.keys(target) as AssetAllocationTarget[]) {
      deviations[asset] = (current[asset] || 0) - target[asset];
    }
    return deviations;
  }

  // Execute decision
  executeDecision(decisionId: string): AllocationDecision | null {
    const decision = this.decisions.find((d) => d.id === decisionId);
    if (decision && !decision.executed) {
      decision.executed = true;
      decision.actualReturn = decision.expectedReturn * (0.7 + Math.random() * 0.6);
      return decision;
    }
    return null;
  }

  // Get recent decisions
  getRecentDecisions(userId: string, limit: number = 20): AllocationDecision[] {
    return this.decisions
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Get performance metrics
  getPerformance(userId: string): StrategyPerformance | undefined {
    return this.performance.get(userId);
  }

  // Simulate compound growth
  simulateCompoundGrowth(
    initialAmount: number,
    riskProfile: RiskProfile,
    years: number
  ): { year: number; amount: number; breakdown: Record<string, number> }[] {
    const strategy = STRATEGY_CONFIG[riskProfile];
    const results: { year: number; amount: number; breakdown: Record<string, number> }[] = [];

    let currentAmount = initialAmount;

    for (let year = 0; year <= years; year++) {
      const breakdown: Record<string, number> = {};
      let yearlyYield = 0;

      for (const [asset, allocation] of Object.entries(strategy.targetAllocation)) {
        const assetAmount = currentAmount * allocation;
        const baseYield = BASE_YIELDS[asset as AssetAllocationTarget];
        // Add some variance
        const actualYield = baseYield * (0.8 + Math.random() * 0.4);
        const assetReturn = assetAmount * actualYield;
        breakdown[asset] = assetReturn;
        yearlyYield += assetReturn;
      }

      results.push({
        year,
        amount: currentAmount,
        breakdown,
      });

      currentAmount += yearlyYield;
    }

    return results;
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const yieldStrategyEngine = new YieldStrategyEngine();

// Convenience exports
export const getMarketAnalysis = () => yieldStrategyEngine.getMarketAnalysis();
export const getStrategy = (profile: RiskProfile) => yieldStrategyEngine.getStrategy(profile);
export const getPortfolio = (userId: string) => yieldStrategyEngine.getPortfolio(userId);
export const setRiskProfile = (userId: string, profile: RiskProfile) =>
  yieldStrategyEngine.setRiskProfile(userId, profile);
export const generateRebalanceRecommendation = (userId: string) =>
  yieldStrategyEngine.generateRebalanceRecommendation(userId);
export const getRecentDecisions = (userId: string, limit?: number) =>
  yieldStrategyEngine.getRecentDecisions(userId, limit);
export const getPerformance = (userId: string) => yieldStrategyEngine.getPerformance(userId);
export const simulateCompoundGrowth = (amount: number, profile: RiskProfile, years: number) =>
  yieldStrategyEngine.simulateCompoundGrowth(amount, profile, years);
