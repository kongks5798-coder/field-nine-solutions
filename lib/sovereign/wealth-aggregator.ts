/**
 * UNIFIED WEALTH AGGREGATOR
 *
 * 필드나인 유니버스의 모든 자산을 통합 관리
 * - 에너지 노드 지분
 * - K-AUS 잔액
 * - 예상 배당금
 * - 카드 사용 가능 금액
 * - Total Net Worth 계산
 */

import { blackCardEngine, CardAccount, FiatCurrency } from './black-card-engine';
import { miniNodeMining, MiniNode } from './mini-node-mining';

// Asset Categories
export type AssetCategory =
  | 'ENERGY_NODE'      // 에너지 발전소 지분
  | 'KAUS_LIQUID'      // K-AUS 유동 자산
  | 'KAUS_STAKED'      // K-AUS 스테이킹
  | 'COMPUTE_CREDIT'   // 연산력 크레딧
  | 'CARD_BALANCE'     // 카드 잔액
  | 'MINI_NODE'        // 미니노드 수익
  | 'RWA_INVESTMENT';  // 실물자산 투자

// Energy Node Types
export type EnergyNodeType = 'SOLAR' | 'WIND' | 'HYDRO' | 'NUCLEAR' | 'GEOTHERMAL';

// Wealth Configuration
export const WEALTH_CONFIG = {
  // K-AUS to USD rate
  KAUS_USD_RATE: 0.15,

  // Dividend rates by source
  DIVIDEND_RATES: {
    ENERGY_NODE: 0.08,      // 8% annual
    STAKING: 0.12,          // 12% annual
    COMPUTE: 0.15,          // 15% annual
    RWA: 0.06,              // 6% annual
  },

  // Risk levels
  RISK_LEVELS: {
    ENERGY_NODE: 'LOW',
    KAUS_LIQUID: 'MEDIUM',
    KAUS_STAKED: 'LOW',
    COMPUTE_CREDIT: 'MEDIUM',
    CARD_BALANCE: 'NONE',
    MINI_NODE: 'LOW',
    RWA_INVESTMENT: 'LOW',
  } as Record<AssetCategory, 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'>,
};

// Energy Node Asset
export interface EnergyNodeAsset {
  nodeId: string;
  nodeName: string;
  nodeType: EnergyNodeType;
  location: string;
  ownershipPercentage: number;  // 0-100
  totalCapacityMW: number;
  currentOutputMW: number;
  purchaseDate: number;
  purchasePriceUSD: number;
  currentValueUSD: number;
  monthlyDividendKaus: number;
  annualYieldPercentage: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'OFFLINE';
}

// K-AUS Holdings
export interface KausHoldings {
  liquidBalance: number;
  stakedBalance: number;
  lockedUntil?: number;
  stakingTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'SOVEREIGN';
  pendingRewards: number;
  totalValueUSD: number;
}

// Compute Credits
export interface ComputeCredits {
  availableCredits: number;
  allocatedCredits: number;
  pendingEarnings: number;
  totalValueKaus: number;
}

// RWA Investment
export interface RWAInvestment {
  investmentId: string;
  assetName: string;
  assetType: 'REAL_ESTATE' | 'INFRASTRUCTURE' | 'RENEWABLE' | 'COMMODITY';
  investmentAmountUSD: number;
  currentValueUSD: number;
  ownershipPercentage: number;
  annualYield: number;
  nextDividendDate: number;
  expectedDividendUSD: number;
}

// Dividend Projection
export interface DividendProjection {
  source: string;
  category: AssetCategory;
  nextPaymentDate: number;
  amountKaus: number;
  amountUSD: number;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
}

// Total Net Worth Summary
export interface NetWorthSummary {
  totalNetWorthUSD: number;
  totalNetWorthKRW: number;
  change24h: number;
  change24hPercentage: number;
  breakdown: {
    category: AssetCategory;
    label: string;
    valueUSD: number;
    percentage: number;
    change24h: number;
  }[];
  liquidAssets: number;
  illiquidAssets: number;
  cardSpendingPower: number;
  monthlyPassiveIncome: number;
  projectedAnnualDividends: number;
}

// Unified Portfolio
export interface UnifiedPortfolio {
  userId: string;
  lastUpdated: number;
  netWorth: NetWorthSummary;
  energyNodes: EnergyNodeAsset[];
  kausHoldings: KausHoldings;
  computeCredits: ComputeCredits;
  cardAccount: CardAccount | null;
  miniNodes: MiniNode[];
  rwaInvestments: RWAInvestment[];
  upcomingDividends: DividendProjection[];
}

class WealthAggregator {
  private portfolios: Map<string, UnifiedPortfolio> = new Map();

  constructor() {
    this.initializeMockPortfolio();
  }

  private initializeMockPortfolio(): void {
    // Mock energy nodes
    const energyNodes: EnergyNodeAsset[] = [
      {
        nodeId: 'SOLAR-JEJU-001',
        nodeName: 'Jeju Solar Farm Alpha',
        nodeType: 'SOLAR',
        location: 'Jeju Island, South Korea',
        ownershipPercentage: 2.5,
        totalCapacityMW: 50,
        currentOutputMW: 42,
        purchaseDate: Date.now() - 365 * 24 * 60 * 60 * 1000,
        purchasePriceUSD: 125000,
        currentValueUSD: 156000,
        monthlyDividendKaus: 850,
        annualYieldPercentage: 9.2,
        status: 'ACTIVE',
      },
      {
        nodeId: 'WIND-TEXAS-001',
        nodeName: 'Texas Wind Corridor',
        nodeType: 'WIND',
        location: 'West Texas, USA',
        ownershipPercentage: 1.2,
        totalCapacityMW: 200,
        currentOutputMW: 165,
        purchaseDate: Date.now() - 180 * 24 * 60 * 60 * 1000,
        purchasePriceUSD: 85000,
        currentValueUSD: 97500,
        monthlyDividendKaus: 420,
        annualYieldPercentage: 7.8,
        status: 'ACTIVE',
      },
      {
        nodeId: 'HYDRO-NORWAY-001',
        nodeName: 'Nordic Hydro Station',
        nodeType: 'HYDRO',
        location: 'Bergen, Norway',
        ownershipPercentage: 0.8,
        totalCapacityMW: 150,
        currentOutputMW: 142,
        purchaseDate: Date.now() - 90 * 24 * 60 * 60 * 1000,
        purchasePriceUSD: 62000,
        currentValueUSD: 68500,
        monthlyDividendKaus: 310,
        annualYieldPercentage: 8.5,
        status: 'ACTIVE',
      },
    ];

    // Mock K-AUS holdings
    const kausHoldings: KausHoldings = {
      liquidBalance: 2500000,
      stakedBalance: 1500000,
      lockedUntil: Date.now() + 180 * 24 * 60 * 60 * 1000,
      stakingTier: 'SOVEREIGN',
      pendingRewards: 12500,
      totalValueUSD: (2500000 + 1500000 + 12500) * WEALTH_CONFIG.KAUS_USD_RATE,
    };

    // Mock compute credits
    const computeCredits: ComputeCredits = {
      availableCredits: 150000,
      allocatedCredits: 50000,
      pendingEarnings: 2500,
      totalValueKaus: 202.5,
    };

    // Mock RWA investments
    const rwaInvestments: RWAInvestment[] = [
      {
        investmentId: 'RWA-001',
        assetName: 'Dubai Marina Tower Unit 4502',
        assetType: 'REAL_ESTATE',
        investmentAmountUSD: 250000,
        currentValueUSD: 285000,
        ownershipPercentage: 5,
        annualYield: 6.2,
        nextDividendDate: Date.now() + 15 * 24 * 60 * 60 * 1000,
        expectedDividendUSD: 3875,
      },
      {
        investmentId: 'RWA-002',
        assetName: 'Singapore Solar Infrastructure Fund',
        assetType: 'INFRASTRUCTURE',
        investmentAmountUSD: 100000,
        currentValueUSD: 112500,
        ownershipPercentage: 0.5,
        annualYield: 7.8,
        nextDividendDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
        expectedDividendUSD: 1950,
      },
    ];

    // Get card account
    const cardAccount = blackCardEngine.getAccount('CARD-001') || null;

    // Get mini nodes
    const miniNodes = miniNodeMining.getUserNodes('USER-BOSS');

    // Calculate upcoming dividends
    const upcomingDividends: DividendProjection[] = [
      ...energyNodes.map(node => ({
        source: node.nodeName,
        category: 'ENERGY_NODE' as AssetCategory,
        nextPaymentDate: Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000,
        amountKaus: node.monthlyDividendKaus,
        amountUSD: node.monthlyDividendKaus * WEALTH_CONFIG.KAUS_USD_RATE,
        frequency: 'MONTHLY' as const,
      })),
      {
        source: 'K-AUS Staking Rewards',
        category: 'KAUS_STAKED',
        nextPaymentDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
        amountKaus: kausHoldings.pendingRewards,
        amountUSD: kausHoldings.pendingRewards * WEALTH_CONFIG.KAUS_USD_RATE,
        frequency: 'WEEKLY',
      },
      ...rwaInvestments.map(rwa => ({
        source: rwa.assetName,
        category: 'RWA_INVESTMENT' as AssetCategory,
        nextPaymentDate: rwa.nextDividendDate,
        amountKaus: rwa.expectedDividendUSD / WEALTH_CONFIG.KAUS_USD_RATE,
        amountUSD: rwa.expectedDividendUSD,
        frequency: 'QUARTERLY' as const,
      })),
    ];

    // Calculate net worth
    const netWorth = this.calculateNetWorth({
      energyNodes,
      kausHoldings,
      computeCredits,
      cardAccount,
      miniNodes,
      rwaInvestments,
    });

    const portfolio: UnifiedPortfolio = {
      userId: 'USER-BOSS',
      lastUpdated: Date.now(),
      netWorth,
      energyNodes,
      kausHoldings,
      computeCredits,
      cardAccount,
      miniNodes,
      rwaInvestments,
      upcomingDividends: upcomingDividends.sort((a, b) => a.nextPaymentDate - b.nextPaymentDate),
    };

    this.portfolios.set('USER-BOSS', portfolio);
  }

  private calculateNetWorth(assets: {
    energyNodes: EnergyNodeAsset[];
    kausHoldings: KausHoldings;
    computeCredits: ComputeCredits;
    cardAccount: CardAccount | null;
    miniNodes: MiniNode[];
    rwaInvestments: RWAInvestment[];
  }): NetWorthSummary {
    // Calculate values by category
    const energyNodeValue = assets.energyNodes.reduce((sum, n) => sum + n.currentValueUSD, 0);
    const kausLiquidValue = assets.kausHoldings.liquidBalance * WEALTH_CONFIG.KAUS_USD_RATE;
    const kausStakedValue = assets.kausHoldings.stakedBalance * WEALTH_CONFIG.KAUS_USD_RATE;
    const computeValue = assets.computeCredits.totalValueKaus * WEALTH_CONFIG.KAUS_USD_RATE;
    const cardValue = assets.cardAccount ?
      assets.cardAccount.fiatBalance.USD +
      (assets.cardAccount.fiatBalance.KRW / 1320.5) +
      (assets.cardAccount.fiatBalance.EUR * 1.08) : 0;
    const miniNodeValue = assets.miniNodes.reduce((sum, n) => sum + n.totalKausEarned, 0) * WEALTH_CONFIG.KAUS_USD_RATE;
    const rwaValue = assets.rwaInvestments.reduce((sum, r) => sum + r.currentValueUSD, 0);

    const totalUSD = energyNodeValue + kausLiquidValue + kausStakedValue +
      computeValue + cardValue + miniNodeValue + rwaValue;

    // Calculate changes (simulated)
    const change24h = totalUSD * (Math.random() * 0.04 - 0.01);

    // Monthly passive income
    const monthlyDividends = assets.energyNodes.reduce((sum, n) => sum + n.monthlyDividendKaus, 0);
    const monthlyStaking = assets.kausHoldings.stakedBalance * WEALTH_CONFIG.DIVIDEND_RATES.STAKING / 12;
    const monthlyCompute = assets.computeCredits.pendingEarnings;
    const monthlyMining = assets.miniNodes.reduce((sum, n) => sum + n.todayKausEarned * 30, 0);
    const monthlyPassiveKaus = monthlyDividends + monthlyStaking + monthlyCompute + monthlyMining;

    // Annual projected dividends
    const annualDividends =
      (energyNodeValue * WEALTH_CONFIG.DIVIDEND_RATES.ENERGY_NODE) +
      (kausStakedValue * WEALTH_CONFIG.DIVIDEND_RATES.STAKING) +
      (computeValue * WEALTH_CONFIG.DIVIDEND_RATES.COMPUTE) +
      (rwaValue * WEALTH_CONFIG.DIVIDEND_RATES.RWA);

    return {
      totalNetWorthUSD: totalUSD,
      totalNetWorthKRW: totalUSD * 1320.5,
      change24h,
      change24hPercentage: (change24h / totalUSD) * 100,
      breakdown: [
        {
          category: 'ENERGY_NODE' as AssetCategory,
          label: '에너지 노드 지분',
          valueUSD: energyNodeValue,
          percentage: (energyNodeValue / totalUSD) * 100,
          change24h: energyNodeValue * 0.002,
        },
        {
          category: 'KAUS_LIQUID' as AssetCategory,
          label: 'K-AUS (유동)',
          valueUSD: kausLiquidValue,
          percentage: (kausLiquidValue / totalUSD) * 100,
          change24h: kausLiquidValue * (Math.random() * 0.05 - 0.01),
        },
        {
          category: 'KAUS_STAKED' as AssetCategory,
          label: 'K-AUS (스테이킹)',
          valueUSD: kausStakedValue,
          percentage: (kausStakedValue / totalUSD) * 100,
          change24h: kausStakedValue * 0.003,
        },
        {
          category: 'RWA_INVESTMENT' as AssetCategory,
          label: '실물자산 투자',
          valueUSD: rwaValue,
          percentage: (rwaValue / totalUSD) * 100,
          change24h: rwaValue * 0.001,
        },
        {
          category: 'CARD_BALANCE' as AssetCategory,
          label: '카드 잔액',
          valueUSD: cardValue,
          percentage: (cardValue / totalUSD) * 100,
          change24h: 0,
        },
        {
          category: 'COMPUTE_CREDIT' as AssetCategory,
          label: '연산 크레딧',
          valueUSD: computeValue,
          percentage: (computeValue / totalUSD) * 100,
          change24h: computeValue * 0.005,
        },
        {
          category: 'MINI_NODE' as AssetCategory,
          label: '미니노드 수익',
          valueUSD: miniNodeValue,
          percentage: (miniNodeValue / totalUSD) * 100,
          change24h: miniNodeValue * 0.01,
        },
      ].sort((a, b) => b.valueUSD - a.valueUSD),
      liquidAssets: kausLiquidValue + cardValue,
      illiquidAssets: energyNodeValue + kausStakedValue + rwaValue,
      cardSpendingPower: cardValue + (assets.kausHoldings.liquidBalance * WEALTH_CONFIG.KAUS_USD_RATE * 0.9), // 90% convertible
      monthlyPassiveIncome: monthlyPassiveKaus * WEALTH_CONFIG.KAUS_USD_RATE,
      projectedAnnualDividends: annualDividends,
    };
  }

  /**
   * Get unified portfolio
   */
  getPortfolio(userId: string): UnifiedPortfolio | undefined {
    return this.portfolios.get(userId);
  }

  /**
   * Get net worth summary
   */
  getNetWorthSummary(userId: string): NetWorthSummary | undefined {
    const portfolio = this.portfolios.get(userId);
    return portfolio?.netWorth;
  }

  /**
   * Get upcoming dividends
   */
  getUpcomingDividends(userId: string, days: number = 30): DividendProjection[] {
    const portfolio = this.portfolios.get(userId);
    if (!portfolio) return [];

    const cutoff = Date.now() + days * 24 * 60 * 60 * 1000;
    return portfolio.upcomingDividends.filter(d => d.nextPaymentDate <= cutoff);
  }

  /**
   * Get spending power breakdown
   */
  getSpendingPower(userId: string): {
    totalSpendingPower: number;
    cardBalance: number;
    convertibleKaus: number;
    dailyLimit: number;
    monthlyLimit: number;
    used: { daily: number; monthly: number };
  } | null {
    const portfolio = this.portfolios.get(userId);
    if (!portfolio || !portfolio.cardAccount) return null;

    const card = portfolio.cardAccount;
    const convertibleKaus = portfolio.kausHoldings.liquidBalance * WEALTH_CONFIG.KAUS_USD_RATE * 0.9;

    return {
      totalSpendingPower: portfolio.netWorth.cardSpendingPower,
      cardBalance: card.fiatBalance.USD + card.fiatBalance.KRW / 1320.5 + card.fiatBalance.EUR * 1.08,
      convertibleKaus,
      dailyLimit: Infinity, // SOVEREIGN tier
      monthlyLimit: Infinity,
      used: {
        daily: card.dailySpent,
        monthly: card.monthlySpent,
      },
    };
  }

  /**
   * Get passive income breakdown
   */
  getPassiveIncomeBreakdown(userId: string): {
    totalMonthlyUSD: number;
    totalAnnualUSD: number;
    breakdown: {
      source: string;
      monthlyKaus: number;
      monthlyUSD: number;
      annualUSD: number;
      yieldPercentage: number;
    }[];
  } | null {
    const portfolio = this.portfolios.get(userId);
    if (!portfolio) return null;

    const breakdown = [
      ...portfolio.energyNodes.map(node => ({
        source: node.nodeName,
        monthlyKaus: node.monthlyDividendKaus,
        monthlyUSD: node.monthlyDividendKaus * WEALTH_CONFIG.KAUS_USD_RATE,
        annualUSD: node.monthlyDividendKaus * 12 * WEALTH_CONFIG.KAUS_USD_RATE,
        yieldPercentage: node.annualYieldPercentage,
      })),
      {
        source: 'K-AUS Staking',
        monthlyKaus: portfolio.kausHoldings.stakedBalance * WEALTH_CONFIG.DIVIDEND_RATES.STAKING / 12,
        monthlyUSD: portfolio.kausHoldings.stakedBalance * WEALTH_CONFIG.DIVIDEND_RATES.STAKING / 12 * WEALTH_CONFIG.KAUS_USD_RATE,
        annualUSD: portfolio.kausHoldings.stakedBalance * WEALTH_CONFIG.DIVIDEND_RATES.STAKING * WEALTH_CONFIG.KAUS_USD_RATE,
        yieldPercentage: WEALTH_CONFIG.DIVIDEND_RATES.STAKING * 100,
      },
      {
        source: 'Mini Node Mining',
        monthlyKaus: portfolio.miniNodes.reduce((sum, n) => sum + n.todayKausEarned * 30, 0),
        monthlyUSD: portfolio.miniNodes.reduce((sum, n) => sum + n.todayKausEarned * 30, 0) * WEALTH_CONFIG.KAUS_USD_RATE,
        annualUSD: portfolio.miniNodes.reduce((sum, n) => sum + n.todayKausEarned * 365, 0) * WEALTH_CONFIG.KAUS_USD_RATE,
        yieldPercentage: 0, // Variable
      },
      ...portfolio.rwaInvestments.map(rwa => ({
        source: rwa.assetName,
        monthlyKaus: rwa.expectedDividendUSD / 3 / WEALTH_CONFIG.KAUS_USD_RATE,
        monthlyUSD: rwa.expectedDividendUSD / 3,
        annualUSD: rwa.annualYield * rwa.currentValueUSD / 100,
        yieldPercentage: rwa.annualYield,
      })),
    ];

    const totalMonthly = breakdown.reduce((sum, b) => sum + b.monthlyUSD, 0);
    const totalAnnual = breakdown.reduce((sum, b) => sum + b.annualUSD, 0);

    return {
      totalMonthlyUSD: totalMonthly,
      totalAnnualUSD: totalAnnual,
      breakdown: breakdown.sort((a, b) => b.annualUSD - a.annualUSD),
    };
  }

  /**
   * Refresh portfolio data
   */
  refreshPortfolio(userId: string): void {
    const existing = this.portfolios.get(userId);
    if (existing) {
      existing.lastUpdated = Date.now();
      // In production, would fetch fresh data from all sources
    }
  }
}

// Singleton instance
export const wealthAggregator = new WealthAggregator();

// Convenience exports
export const getUnifiedPortfolio = (userId: string) => wealthAggregator.getPortfolio(userId);
export const getNetWorth = (userId: string) => wealthAggregator.getNetWorthSummary(userId);
export const getUpcomingDividends = (userId: string, days?: number) =>
  wealthAggregator.getUpcomingDividends(userId, days);
export const getSpendingPower = (userId: string) => wealthAggregator.getSpendingPower(userId);
export const getPassiveIncome = (userId: string) => wealthAggregator.getPassiveIncomeBreakdown(userId);
