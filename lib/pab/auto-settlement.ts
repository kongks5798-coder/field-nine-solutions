/**
 * AUTO-SETTLEMENT BLACK CARD SYSTEM
 *
 * Phase 19: Personal AI Banker
 * AI 뱅커가 유저의 카드 결제 패턴을 학습하여
 * 가장 유리한 자산을 현금화하여 결제 대금을 충당
 *
 * "결제는 당신의 가장 수익성 낮은 자산부터"
 */

// ============================================
// TYPES
// ============================================

export type SettlementSource =
  | 'PENDING_DIVIDEND'
  | 'STAKING_REWARD'
  | 'MINING_REWARD'
  | 'LIQUID_KAUS'
  | 'CARD_BALANCE'
  | 'COMPUTE_CREDIT';

export type MerchantCategory =
  | 'DINING'
  | 'TRAVEL'
  | 'FASHION'
  | 'ELECTRONICS'
  | 'GROCERIES'
  | 'UTILITIES'
  | 'ENTERTAINMENT'
  | 'GENERAL';

export interface PaymentPattern {
  category: MerchantCategory;
  averageAmount: number;
  frequency: number; // per month
  preferredDay: number; // 0-6 (Sun-Sat)
  preferredTime: number; // 0-23
  totalSpent: number;
  transactionCount: number;
}

export interface SettlementOption {
  source: SettlementSource;
  available: number;
  opportunityCost: number; // % yield lost by using this
  conversionFee: number;
  priority: number;
  recommendation: string;
}

export interface SettlementDecision {
  id: string;
  timestamp: Date;
  merchantName: string;
  merchantCategory: MerchantCategory;
  amountUSD: number;
  amountKaus: number;
  selectedSource: SettlementSource;
  alternativeSources: SettlementOption[];
  opportunityCostSaved: number;
  recommendation: string;
  autoExecuted: boolean;
}

export interface SpendingAnalytics {
  totalSpent30Days: number;
  categoryBreakdown: Record<MerchantCategory, number>;
  averageTransactionSize: number;
  peakSpendingDay: string;
  predictedNextMonth: number;
  cashbackEarned: number;
  opportunityCostSaved: number;
}

export interface AutoSettlementConfig {
  enabled: boolean;
  maxAutoSettleAmount: number;
  preferredSources: SettlementSource[];
  excludedSources: SettlementSource[];
  minCardBalanceReserve: number;
  notifyOnSettle: boolean;
}

// ============================================
// CONSTANTS
// ============================================

const KAUS_PRICE = 2.47;

// Opportunity cost (annualized yield) for each source
const SOURCE_OPPORTUNITY_COST: Record<SettlementSource, number> = {
  PENDING_DIVIDEND: 0, // Already earned, no cost
  CARD_BALANCE: 0.03, // 3% minimal yield
  STAKING_REWARD: 0.05, // Could restake for 5%
  MINING_REWARD: 0.08, // Could compound
  COMPUTE_CREDIT: 0.15, // Active yield
  LIQUID_KAUS: 0.12, // Could be staked
};

// Conversion fees
const SOURCE_CONVERSION_FEE: Record<SettlementSource, number> = {
  PENDING_DIVIDEND: 0,
  CARD_BALANCE: 0,
  STAKING_REWARD: 0.001,
  MINING_REWARD: 0.002,
  COMPUTE_CREDIT: 0.005,
  LIQUID_KAUS: 0.005,
};

// Priority (lower = better to use first)
const SOURCE_PRIORITY: Record<SettlementSource, number> = {
  PENDING_DIVIDEND: 1,
  CARD_BALANCE: 2,
  STAKING_REWARD: 3,
  MINING_REWARD: 4,
  COMPUTE_CREDIT: 5,
  LIQUID_KAUS: 6,
};

// ============================================
// AUTO-SETTLEMENT ENGINE CLASS
// ============================================

class AutoSettlementEngine {
  private settlements: SettlementDecision[] = [];
  private patterns: Map<string, PaymentPattern[]> = new Map();
  private configs: Map<string, AutoSettlementConfig> = new Map();
  private balances: Map<string, Record<SettlementSource, number>> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Boss config
    this.configs.set('USER-BOSS', {
      enabled: true,
      maxAutoSettleAmount: 10000,
      preferredSources: ['PENDING_DIVIDEND', 'STAKING_REWARD', 'CARD_BALANCE'],
      excludedSources: [],
      minCardBalanceReserve: 1000,
      notifyOnSettle: true,
    });

    // Boss balances
    this.balances.set('USER-BOSS', {
      PENDING_DIVIDEND: 2500,
      STAKING_REWARD: 850,
      MINING_REWARD: 320,
      LIQUID_KAUS: 35000,
      CARD_BALANCE: 15000,
      COMPUTE_CREDIT: 5000,
    });

    // Payment patterns
    this.patterns.set('USER-BOSS', [
      {
        category: 'FASHION',
        averageAmount: 450,
        frequency: 3,
        preferredDay: 6, // Saturday
        preferredTime: 14,
        totalSpent: 8500,
        transactionCount: 19,
      },
      {
        category: 'DINING',
        averageAmount: 85,
        frequency: 12,
        preferredDay: 5, // Friday
        preferredTime: 19,
        totalSpent: 4200,
        transactionCount: 49,
      },
      {
        category: 'TRAVEL',
        averageAmount: 1200,
        frequency: 1.5,
        preferredDay: 1, // Monday
        preferredTime: 10,
        totalSpent: 7200,
        transactionCount: 6,
      },
      {
        category: 'ELECTRONICS',
        averageAmount: 650,
        frequency: 0.5,
        preferredDay: 2,
        preferredTime: 11,
        totalSpent: 3250,
        transactionCount: 5,
      },
      {
        category: 'GROCERIES',
        averageAmount: 120,
        frequency: 8,
        preferredDay: 0, // Sunday
        preferredTime: 10,
        totalSpent: 2880,
        transactionCount: 24,
      },
    ]);

    // Historical settlements
    const merchants = [
      { name: 'Aura Sydney', category: 'FASHION' as MerchantCategory },
      { name: 'Nomad Monthly', category: 'TRAVEL' as MerchantCategory },
      { name: 'Bistro 42', category: 'DINING' as MerchantCategory },
      { name: 'Apple Store', category: 'ELECTRONICS' as MerchantCategory },
      { name: 'Woolworths', category: 'GROCERIES' as MerchantCategory },
    ];

    for (let i = 0; i < 30; i++) {
      const merchant = merchants[Math.floor(Math.random() * merchants.length)];
      const amount = 50 + Math.random() * 500;
      const sources: SettlementSource[] = [
        'PENDING_DIVIDEND',
        'STAKING_REWARD',
        'CARD_BALANCE',
        'LIQUID_KAUS',
      ];
      const source = sources[Math.floor(Math.random() * sources.length)];

      this.settlements.push({
        id: `SETTLE-${String(i + 1).padStart(4, '0')}`,
        timestamp: new Date(Date.now() - i * 24 * 3600000),
        merchantName: merchant.name,
        merchantCategory: merchant.category,
        amountUSD: amount,
        amountKaus: amount / KAUS_PRICE,
        selectedSource: source,
        alternativeSources: this.generateAlternatives(amount),
        opportunityCostSaved: Math.random() * 5,
        recommendation: `${source}에서 자동 정산 (기회비용 ${(Math.random() * 5).toFixed(1)}% 절감)`,
        autoExecuted: Math.random() > 0.2,
      });
    }
  }

  private generateAlternatives(amount: number): SettlementOption[] {
    const kausNeeded = amount / KAUS_PRICE;
    return (Object.keys(SOURCE_OPPORTUNITY_COST) as SettlementSource[]).map((source) => ({
      source,
      available: 1000 + Math.random() * 10000,
      opportunityCost: SOURCE_OPPORTUNITY_COST[source],
      conversionFee: SOURCE_CONVERSION_FEE[source],
      priority: SOURCE_PRIORITY[source],
      recommendation: `${source} 사용 시 연 ${(SOURCE_OPPORTUNITY_COST[source] * 100).toFixed(1)}% 기회비용`,
    }));
  }

  // Get user config
  getConfig(userId: string): AutoSettlementConfig | undefined {
    return this.configs.get(userId);
  }

  // Update config
  updateConfig(userId: string, config: Partial<AutoSettlementConfig>): void {
    const current = this.configs.get(userId);
    if (current) {
      this.configs.set(userId, { ...current, ...config });
    }
  }

  // Get user balances
  getBalances(userId: string): Record<SettlementSource, number> | undefined {
    return this.balances.get(userId);
  }

  // Calculate optimal settlement
  calculateOptimalSettlement(
    userId: string,
    amountUSD: number,
    merchantCategory: MerchantCategory
  ): {
    recommended: SettlementOption;
    alternatives: SettlementOption[];
    savings: number;
    explanation: string;
  } {
    const config = this.configs.get(userId);
    const balances = this.balances.get(userId);

    if (!config || !balances) {
      throw new Error('User not found');
    }

    const kausNeeded = amountUSD / KAUS_PRICE;

    // Generate all options sorted by priority
    const options: SettlementOption[] = (Object.keys(balances) as SettlementSource[])
      .filter((source) => !config.excludedSources.includes(source))
      .filter((source) => {
        if (source === 'CARD_BALANCE') {
          return balances[source] - config.minCardBalanceReserve >= kausNeeded;
        }
        return balances[source] >= kausNeeded;
      })
      .map((source) => ({
        source,
        available: balances[source],
        opportunityCost: SOURCE_OPPORTUNITY_COST[source],
        conversionFee: SOURCE_CONVERSION_FEE[source],
        priority: SOURCE_PRIORITY[source],
        recommendation: this.generateRecommendation(source, kausNeeded, merchantCategory),
      }))
      .sort((a, b) => a.priority - b.priority);

    if (options.length === 0) {
      // Need to combine sources
      return {
        recommended: {
          source: 'LIQUID_KAUS',
          available: balances.LIQUID_KAUS,
          opportunityCost: SOURCE_OPPORTUNITY_COST.LIQUID_KAUS,
          conversionFee: SOURCE_CONVERSION_FEE.LIQUID_KAUS,
          priority: 6,
          recommendation: '잔액 부족 - Liquid K-AUS에서 전환 필요',
        },
        alternatives: [],
        savings: 0,
        explanation: '충분한 잔액이 있는 소스가 없어 Liquid K-AUS를 사용합니다.',
      };
    }

    const recommended = options[0];
    const worstOption = options[options.length - 1];
    const savings =
      (worstOption.opportunityCost - recommended.opportunityCost) * kausNeeded * 12; // Annual savings

    return {
      recommended,
      alternatives: options.slice(1),
      savings,
      explanation: this.generateExplanation(recommended, savings, merchantCategory),
    };
  }

  private generateRecommendation(
    source: SettlementSource,
    kausNeeded: number,
    category: MerchantCategory
  ): string {
    const messages: Record<SettlementSource, string> = {
      PENDING_DIVIDEND: '대기 중인 배당금 사용 - 기회비용 0%',
      CARD_BALANCE: '카드 잔액 사용 - 빠른 결제',
      STAKING_REWARD: '스테이킹 보상 사용 - 낮은 기회비용',
      MINING_REWARD: '마이닝 보상 사용 - 복리 효과 일부 포기',
      COMPUTE_CREDIT: '컴퓨트 크레딧 전환 - 활성 수익 포기',
      LIQUID_KAUS: 'Liquid K-AUS 사용 - 스테이킹 기회 포기',
    };
    return messages[source];
  }

  private generateExplanation(
    option: SettlementOption,
    savings: number,
    category: MerchantCategory
  ): string {
    if (option.source === 'PENDING_DIVIDEND') {
      return `배당금으로 결제하면 기회비용 없이 처리됩니다. 연간 ${savings.toFixed(2)} K-AUS 절약됩니다.`;
    }
    if (option.source === 'STAKING_REWARD') {
      return `스테이킹 보상으로 결제합니다. Liquid K-AUS 대비 연간 ${savings.toFixed(2)} K-AUS 절약됩니다.`;
    }
    return `${option.source}에서 결제를 처리합니다.`;
  }

  // Execute settlement
  executeSettlement(
    userId: string,
    merchantName: string,
    merchantCategory: MerchantCategory,
    amountUSD: number
  ): SettlementDecision {
    const optimal = this.calculateOptimalSettlement(userId, amountUSD, merchantCategory);
    const balances = this.balances.get(userId);

    if (balances) {
      const kausNeeded = amountUSD / KAUS_PRICE;
      balances[optimal.recommended.source] -= kausNeeded;
    }

    const decision: SettlementDecision = {
      id: `SETTLE-${Date.now()}`,
      timestamp: new Date(),
      merchantName,
      merchantCategory,
      amountUSD,
      amountKaus: amountUSD / KAUS_PRICE,
      selectedSource: optimal.recommended.source,
      alternativeSources: optimal.alternatives,
      opportunityCostSaved: optimal.savings,
      recommendation: optimal.explanation,
      autoExecuted: true,
    };

    this.settlements.unshift(decision);
    return decision;
  }

  // Get settlement history
  getSettlements(userId: string, limit: number = 20): SettlementDecision[] {
    return this.settlements.slice(0, limit);
  }

  // Get payment patterns
  getPatterns(userId: string): PaymentPattern[] {
    return this.patterns.get(userId) || [];
  }

  // Get spending analytics
  getSpendingAnalytics(userId: string): SpendingAnalytics {
    const settlements = this.settlements.slice(0, 30);
    const patterns = this.patterns.get(userId) || [];

    const categoryBreakdown: Record<MerchantCategory, number> = {
      DINING: 0,
      TRAVEL: 0,
      FASHION: 0,
      ELECTRONICS: 0,
      GROCERIES: 0,
      UTILITIES: 0,
      ENTERTAINMENT: 0,
      GENERAL: 0,
    };

    let totalSpent = 0;
    settlements.forEach((s) => {
      categoryBreakdown[s.merchantCategory] += s.amountUSD;
      totalSpent += s.amountUSD;
    });

    const dayTotals: Record<string, number> = {};
    settlements.forEach((s) => {
      const day = s.timestamp.toLocaleDateString('ko-KR', { weekday: 'long' });
      dayTotals[day] = (dayTotals[day] || 0) + s.amountUSD;
    });

    const peakDay = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || '금요일';

    return {
      totalSpent30Days: totalSpent,
      categoryBreakdown,
      averageTransactionSize: totalSpent / settlements.length || 0,
      peakSpendingDay: peakDay,
      predictedNextMonth: totalSpent * 1.05, // 5% increase prediction
      cashbackEarned: totalSpent * 0.025, // Average 2.5% cashback
      opportunityCostSaved: settlements.reduce((sum, s) => sum + s.opportunityCostSaved, 0),
    };
  }

  // Predict next payment
  predictNextPayment(userId: string): {
    category: MerchantCategory;
    estimatedAmount: number;
    expectedDate: Date;
    confidence: number;
  } | null {
    const patterns = this.patterns.get(userId);
    if (!patterns || patterns.length === 0) return null;

    // Find most frequent pattern
    const sorted = [...patterns].sort((a, b) => b.frequency - a.frequency);
    const mostFrequent = sorted[0];

    const now = new Date();
    const daysUntilPreferred = (mostFrequent.preferredDay - now.getDay() + 7) % 7 || 7;
    const expectedDate = new Date(now.getTime() + daysUntilPreferred * 24 * 3600000);
    expectedDate.setHours(mostFrequent.preferredTime, 0, 0, 0);

    return {
      category: mostFrequent.category,
      estimatedAmount: mostFrequent.averageAmount,
      expectedDate,
      confidence: Math.min(0.95, mostFrequent.transactionCount / 50 + 0.5),
    };
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const autoSettlementEngine = new AutoSettlementEngine();

// Convenience exports
export const getAutoSettlementConfig = (userId: string) => autoSettlementEngine.getConfig(userId);
export const updateAutoSettlementConfig = (userId: string, config: Partial<AutoSettlementConfig>) =>
  autoSettlementEngine.updateConfig(userId, config);
export const calculateOptimalSettlement = (
  userId: string,
  amount: number,
  category: MerchantCategory
) => autoSettlementEngine.calculateOptimalSettlement(userId, amount, category);
export const executeSettlement = (
  userId: string,
  merchant: string,
  category: MerchantCategory,
  amount: number
) => autoSettlementEngine.executeSettlement(userId, merchant, category, amount);
export const getSettlementHistory = (userId: string, limit?: number) =>
  autoSettlementEngine.getSettlements(userId, limit);
export const getPaymentPatterns = (userId: string) => autoSettlementEngine.getPatterns(userId);
export const getSpendingAnalytics = (userId: string) =>
  autoSettlementEngine.getSpendingAnalytics(userId);
export const predictNextPayment = (userId: string) => autoSettlementEngine.predictNextPayment(userId);
export const getSettlementBalances = (userId: string) => autoSettlementEngine.getBalances(userId);
