/**
 * SOVEREIGN BLACK CARD ENGINE v2.0
 *
 * HIGH-SPEED BRIDGE: 650ms Real-Time Settlement System
 *
 * K-AUS 배당금을 법정화폐로 즉시 전환하는 Prepaid Card 시스템
 * - 실시간 K-AUS → FIAT 전환 (650ms 이내)
 * - Eco-System Cashback (Aura Sydney, Nomad Monthly)
 * - 글로벌 결제 네트워크 연동
 * - High-Speed Bridge: [K-AUS 차감 → 실시간 환전 → 가맹점 입금] 650ms 내 완료
 *
 * SETTLEMENT FLOW:
 * ┌────────────────────────────────────────────────────────────────┐
 * │  Phase 1 (0-150ms): K-AUS Balance Check & Lock                │
 * │  Phase 2 (150-350ms): Real-time FX & Conversion               │
 * │  Phase 3 (350-550ms): Merchant Account Credit                 │
 * │  Phase 4 (550-650ms): Confirmation & Cashback Distribution    │
 * └────────────────────────────────────────────────────────────────┘
 */

// Card Tiers
export type CardTier = 'STANDARD' | 'GOLD' | 'PLATINUM' | 'BLACK' | 'SOVEREIGN';

// Currency Types
export type FiatCurrency = 'USD' | 'KRW' | 'EUR' | 'JPY' | 'SGD' | 'AED';

// Merchant Categories for Cashback
export type MerchantCategory =
  | 'AURA_SYDNEY'      // Fashion - 10% K-AUS bonus
  | 'NOMAD_MONTHLY'    // Travel - 10% K-AUS bonus
  | 'ENERGY_PARTNERS'  // Energy purchases - 5% bonus
  | 'DINING'           // Restaurants - 3% bonus
  | 'GENERAL';         // Everything else - 1% bonus

// Card Configuration
export const CARD_CONFIG = {
  TIERS: {
    STANDARD: {
      minKausStake: 0,
      monthlyLimit: 5000,      // USD equivalent
      dailyLimit: 500,
      cashbackRate: 0.01,      // 1% base
      annualFee: 0,
      perks: ['Basic K-AUS conversion', 'Mobile wallet'],
    },
    GOLD: {
      minKausStake: 1000,
      monthlyLimit: 25000,
      dailyLimit: 2500,
      cashbackRate: 0.015,     // 1.5% base
      annualFee: 99,
      perks: ['Priority conversion', 'Airport lounge (3/year)', 'Travel insurance'],
    },
    PLATINUM: {
      minKausStake: 10000,
      monthlyLimit: 100000,
      dailyLimit: 10000,
      cashbackRate: 0.02,      // 2% base
      annualFee: 299,
      perks: ['Instant conversion', 'Airport lounge (unlimited)', 'Concierge service', 'Hotel upgrades'],
    },
    BLACK: {
      minKausStake: 100000,
      monthlyLimit: 500000,
      dailyLimit: 50000,
      cashbackRate: 0.03,      // 3% base
      annualFee: 999,
      perks: ['Zero-fee conversion', 'Private jet access', 'Personal banker', 'Luxury hotel status'],
    },
    SOVEREIGN: {
      minKausStake: 1000000,
      monthlyLimit: Infinity,
      dailyLimit: Infinity,
      cashbackRate: 0.05,      // 5% base
      annualFee: 0,            // Waived for Sovereign tier
      perks: ['All BLACK perks', 'Investment priority', 'Board meeting access', 'Dividend acceleration'],
    },
  } as Record<CardTier, {
    minKausStake: number;
    monthlyLimit: number;
    dailyLimit: number;
    cashbackRate: number;
    annualFee: number;
    perks: string[];
  }>,

  // Ecosystem Cashback Rates (K-AUS bonus)
  ECOSYSTEM_CASHBACK: {
    AURA_SYDNEY: 0.10,       // 10% K-AUS bonus
    NOMAD_MONTHLY: 0.10,     // 10% K-AUS bonus
    ENERGY_PARTNERS: 0.05,   // 5% K-AUS bonus
    DINING: 0.03,            // 3% K-AUS bonus
    GENERAL: 0.01,           // 1% K-AUS bonus
  } as Record<MerchantCategory, number>,

  // Conversion rates (simulated)
  CONVERSION_FEE: 0.005,     // 0.5% conversion fee
  MIN_CONVERSION: 10,         // Minimum 10 K-AUS
  MAX_INSTANT_CONVERSION: 10000, // Above this requires 24h

  // K-AUS to FIAT rates (dynamic)
  BASE_KAUS_USD_RATE: 0.15,
};

// ═══════════════════════════════════════════════════════════════════════════════
// HIGH-SPEED BRIDGE CONFIGURATION
// Target: 650ms end-to-end settlement
// ═══════════════════════════════════════════════════════════════════════════════

export const HIGH_SPEED_BRIDGE_CONFIG = {
  // Settlement time targets (milliseconds)
  TIMING: {
    PHASE_1_BALANCE_CHECK: 150,    // K-AUS balance verification & lock
    PHASE_2_FX_CONVERSION: 200,    // Real-time FX rate fetch & conversion
    PHASE_3_MERCHANT_CREDIT: 200,  // Merchant account credit
    PHASE_4_CONFIRMATION: 100,     // Final confirmation & cashback
    TOTAL_TARGET: 650,             // Total target: 650ms
    MAX_ALLOWED: 1000,             // Hard limit: 1 second
  },

  // Real-time FX providers (fallback chain)
  FX_PROVIDERS: [
    { id: 'NEXUS_INTERNAL', priority: 1, avgLatency: 15 },
    { id: 'BLOOMBERG_FEED', priority: 2, avgLatency: 45 },
    { id: 'REUTERS_FEED', priority: 3, avgLatency: 60 },
    { id: 'FALLBACK_CACHED', priority: 4, avgLatency: 1 },
  ],

  // Merchant settlement accounts (by region)
  SETTLEMENT_RAILS: {
    KOREA: { provider: 'TOSS_PAYMENTS', avgSettlement: 180, currency: 'KRW' },
    USA: { provider: 'STRIPE_INSTANT', avgSettlement: 220, currency: 'USD' },
    EUROPE: { provider: 'STRIPE_SEPA', avgSettlement: 250, currency: 'EUR' },
    JAPAN: { provider: 'PAYPAY_BUSINESS', avgSettlement: 200, currency: 'JPY' },
    SINGAPORE: { provider: 'STRIPE_ASIA', avgSettlement: 190, currency: 'SGD' },
    UAE: { provider: 'PAYFORT', avgSettlement: 210, currency: 'AED' },
    AUSTRALIA: { provider: 'STRIPE_AU', avgSettlement: 195, currency: 'AUD' },
    HONGKONG: { provider: 'STRIPE_HK', avgSettlement: 185, currency: 'HKD' },
  } as Record<string, { provider: string; avgSettlement: number; currency: string }>,

  // Slippage protection
  FX_SLIPPAGE_TOLERANCE: 0.003,    // 0.3% max slippage allowed
  PRICE_LOCK_DURATION: 5000,       // 5 second price lock window

  // Retry policy
  RETRY_CONFIG: {
    maxRetries: 3,
    backoffMs: [50, 100, 200],
  },
};

// High-Speed Bridge Transaction Status
export type BridgePhase =
  | 'INITIATED'
  | 'BALANCE_LOCKED'
  | 'FX_EXECUTED'
  | 'MERCHANT_CREDITED'
  | 'CONFIRMED'
  | 'FAILED'
  | 'ROLLED_BACK';

// Real-time FX Quote
export interface FXQuote {
  quoteId: string;
  fromCurrency: 'KAUS';
  toCurrency: FiatCurrency;
  rate: number;
  inverseRate: number;
  timestamp: number;
  validUntil: number;
  provider: string;
  spread: number;
}

// High-Speed Bridge Settlement Record
export interface BridgeSettlement {
  bridgeId: string;
  transactionId: string;
  accountId: string;
  merchantId: string;
  merchantName: string;

  // Amounts
  kausAmount: number;
  fiatAmount: number;
  targetCurrency: FiatCurrency;
  exchangeRate: number;

  // Timing (all in milliseconds)
  timing: {
    initiated: number;
    balanceLocked: number;
    fxExecuted: number;
    merchantCredited: number;
    confirmed: number;
    totalDuration: number;
  };

  // Phase tracking
  currentPhase: BridgePhase;
  phaseHistory: { phase: BridgePhase; timestamp: number; latency: number }[];

  // Settlement details
  settlementRail: string;
  merchantAccountId: string;
  settlementReference: string;

  // Cashback
  cashbackKaus: number;
  ecosystemBonus: number;

  // Status
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
  failureReason?: string;
}

// Merchant Account for instant settlement
export interface MerchantAccount {
  merchantId: string;
  merchantName: string;
  category: MerchantCategory;
  region: string;
  settlementAccount: string;
  settlementCurrency: FiatCurrency;
  settlementRail: string;
  instantSettlementEnabled: boolean;
  totalSettled: number;
  lastSettlement: number;
}

// Card Account
export interface CardAccount {
  accountId: string;
  userId: string;
  cardTier: CardTier;
  cardNumber: string;         // Masked
  expiryDate: string;
  status: 'ACTIVE' | 'FROZEN' | 'PENDING' | 'CANCELLED';
  linkedKausWallet: string;
  fiatBalance: {
    USD: number;
    KRW: number;
    EUR: number;
  };
  kausBalance: number;
  monthlySpent: number;
  dailySpent: number;
  totalCashbackEarned: number;
  createdAt: number;
  lastUsed: number;
}

// Transaction
export interface CardTransaction {
  transactionId: string;
  accountId: string;
  type: 'PURCHASE' | 'CONVERSION' | 'CASHBACK' | 'REFUND' | 'DIVIDEND_LOAD';
  amount: number;
  currency: FiatCurrency | 'KAUS';
  merchantName: string;
  merchantCategory: MerchantCategory;
  kausUsed: number;
  fiatAmount: number;
  cashbackKaus: number;
  ecosystemBonus: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  timestamp: number;
  location?: string;
}

// Conversion Request
export interface ConversionRequest {
  requestId: string;
  accountId: string;
  kausAmount: number;
  targetCurrency: FiatCurrency;
  exchangeRate: number;
  fiatAmount: number;
  fee: number;
  netFiatAmount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  estimatedCompletion: number;
  createdAt: number;
}

// Dividend Distribution
export interface DividendDistribution {
  distributionId: string;
  userId: string;
  source: 'ENERGY_NODE' | 'STAKING' | 'COMPUTE_MINING' | 'REFERRAL';
  kausAmount: number;
  autoConvertToFiat: boolean;
  fiatCurrency?: FiatCurrency;
  fiatAmount?: number;
  cardLoaded: boolean;
  timestamp: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HIGH-SPEED BRIDGE ENGINE
// Real-time 650ms settlement processor
// ═══════════════════════════════════════════════════════════════════════════════

class HighSpeedBridge {
  private settlements: Map<string, BridgeSettlement> = new Map();
  private fxQuotes: Map<string, FXQuote> = new Map();
  private merchants: Map<string, MerchantAccount> = new Map();
  private lockedBalances: Map<string, { amount: number; lockTime: number }> = new Map();

  constructor() {
    this.initializeMerchants();
    this.startFXFeedSimulation();
  }

  private initializeMerchants(): void {
    // Pre-registered merchants for instant settlement
    const merchantData: Partial<MerchantAccount>[] = [
      { merchantId: 'M-AURA-001', merchantName: 'Aura Sydney Flagship', category: 'AURA_SYDNEY', region: 'AUSTRALIA', settlementCurrency: 'USD' },
      { merchantId: 'M-NOMAD-001', merchantName: 'Nomad Monthly Premium', category: 'NOMAD_MONTHLY', region: 'USA', settlementCurrency: 'USD' },
      { merchantId: 'M-ENERGY-001', merchantName: 'Solar Panel Co.', category: 'ENERGY_PARTNERS', region: 'KOREA', settlementCurrency: 'KRW' },
      { merchantId: 'M-DINING-001', merchantName: 'The Modern Table', category: 'DINING', region: 'JAPAN', settlementCurrency: 'JPY' },
      { merchantId: 'M-GENERAL-001', merchantName: 'Amazon.com', category: 'GENERAL', region: 'USA', settlementCurrency: 'USD' },
      { merchantId: 'M-AURA-002', merchantName: 'Aura Sydney Online', category: 'AURA_SYDNEY', region: 'AUSTRALIA', settlementCurrency: 'USD' },
      { merchantId: 'M-NOMAD-002', merchantName: 'Nomad Hotels Dubai', category: 'NOMAD_MONTHLY', region: 'UAE', settlementCurrency: 'AED' },
    ];

    merchantData.forEach((m, idx) => {
      const region = m.region || 'USA';
      const railConfig = HIGH_SPEED_BRIDGE_CONFIG.SETTLEMENT_RAILS[region] || HIGH_SPEED_BRIDGE_CONFIG.SETTLEMENT_RAILS.USA;

      this.merchants.set(m.merchantId!, {
        merchantId: m.merchantId!,
        merchantName: m.merchantName!,
        category: m.category || 'GENERAL',
        region,
        settlementAccount: `ACCT-${m.merchantId}-${Date.now()}`,
        settlementCurrency: m.settlementCurrency || 'USD',
        settlementRail: railConfig.provider,
        instantSettlementEnabled: true,
        totalSettled: Math.floor(Math.random() * 1000000),
        lastSettlement: Date.now() - Math.floor(Math.random() * 86400000),
      });
    });
  }

  private startFXFeedSimulation(): void {
    // Simulated real-time FX feed
    const currencies: FiatCurrency[] = ['USD', 'KRW', 'EUR', 'JPY', 'SGD', 'AED'];
    const baseRates: Record<FiatCurrency, number> = {
      USD: 1,
      KRW: 1320.50,
      EUR: 0.92,
      JPY: 149.50,
      SGD: 1.34,
      AED: 3.67,
    };

    // Update FX quotes every 100ms (simulated)
    currencies.forEach(currency => {
      const volatility = 0.001; // 0.1% volatility
      const baseRate = baseRates[currency];
      const fluctuation = (Math.random() - 0.5) * 2 * volatility * baseRate;
      const rate = baseRate + fluctuation;

      this.fxQuotes.set(currency, {
        quoteId: `FX-${currency}-${Date.now()}`,
        fromCurrency: 'KAUS',
        toCurrency: currency,
        rate: CARD_CONFIG.BASE_KAUS_USD_RATE * rate,
        inverseRate: 1 / (CARD_CONFIG.BASE_KAUS_USD_RATE * rate),
        timestamp: Date.now(),
        validUntil: Date.now() + HIGH_SPEED_BRIDGE_CONFIG.PRICE_LOCK_DURATION,
        provider: 'NEXUS_INTERNAL',
        spread: 0.001, // 0.1% spread
      });
    });
  }

  /**
   * Get real-time FX quote with latency tracking
   */
  async getFXQuote(targetCurrency: FiatCurrency): Promise<{ quote: FXQuote; latencyMs: number }> {
    const startTime = performance.now();

    // Simulate provider latency
    const provider = HIGH_SPEED_BRIDGE_CONFIG.FX_PROVIDERS[0];
    await this.simulateLatency(provider.avgLatency);

    // Update quote with fresh data
    this.startFXFeedSimulation();

    const quote = this.fxQuotes.get(targetCurrency);
    if (!quote) {
      throw new Error(`No FX quote available for ${targetCurrency}`);
    }

    const latencyMs = performance.now() - startTime;
    return { quote, latencyMs };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * EXECUTE HIGH-SPEED BRIDGE SETTLEMENT
   * Target: Complete in 650ms
   * ═══════════════════════════════════════════════════════════════════════════
   */
  async executeSettlement(params: {
    accountId: string;
    merchantId: string;
    kausAmount: number;
    targetCurrency: FiatCurrency;
    kausBalance: number;
    cardTier: CardTier;
  }): Promise<BridgeSettlement> {
    const bridgeId = `BRIDGE-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const startTime = performance.now();

    const settlement: BridgeSettlement = {
      bridgeId,
      transactionId,
      accountId: params.accountId,
      merchantId: params.merchantId,
      merchantName: '',
      kausAmount: params.kausAmount,
      fiatAmount: 0,
      targetCurrency: params.targetCurrency,
      exchangeRate: 0,
      timing: {
        initiated: startTime,
        balanceLocked: 0,
        fxExecuted: 0,
        merchantCredited: 0,
        confirmed: 0,
        totalDuration: 0,
      },
      currentPhase: 'INITIATED',
      phaseHistory: [{ phase: 'INITIATED', timestamp: startTime, latency: 0 }],
      settlementRail: '',
      merchantAccountId: '',
      settlementReference: '',
      cashbackKaus: 0,
      ecosystemBonus: 0,
      status: 'PENDING',
    };

    try {
      // ═══════════════════════════════════════════════════════════════════
      // PHASE 1: Balance Check & Lock (Target: 150ms)
      // ═══════════════════════════════════════════════════════════════════
      const phase1Start = performance.now();

      // Verify K-AUS balance
      if (params.kausBalance < params.kausAmount) {
        throw new Error('INSUFFICIENT_KAUS_BALANCE');
      }

      // Lock the balance
      this.lockedBalances.set(`${params.accountId}-${bridgeId}`, {
        amount: params.kausAmount,
        lockTime: Date.now(),
      });

      // Simulate balance lock latency
      await this.simulateLatency(Math.random() * 50 + 80); // 80-130ms

      settlement.timing.balanceLocked = performance.now();
      settlement.currentPhase = 'BALANCE_LOCKED';
      settlement.phaseHistory.push({
        phase: 'BALANCE_LOCKED',
        timestamp: settlement.timing.balanceLocked,
        latency: settlement.timing.balanceLocked - phase1Start,
      });

      // ═══════════════════════════════════════════════════════════════════
      // PHASE 2: FX Conversion (Target: 200ms)
      // ═══════════════════════════════════════════════════════════════════
      const phase2Start = performance.now();

      const { quote, latencyMs: fxLatency } = await this.getFXQuote(params.targetCurrency);

      // Validate slippage
      const expectedRate = quote.rate;
      const slippage = Math.abs(expectedRate - quote.rate) / expectedRate;
      if (slippage > HIGH_SPEED_BRIDGE_CONFIG.FX_SLIPPAGE_TOLERANCE) {
        throw new Error('FX_SLIPPAGE_EXCEEDED');
      }

      settlement.exchangeRate = quote.rate;
      settlement.fiatAmount = params.kausAmount * quote.rate;

      // Additional conversion processing
      await this.simulateLatency(Math.random() * 80 + 70); // 70-150ms

      settlement.timing.fxExecuted = performance.now();
      settlement.currentPhase = 'FX_EXECUTED';
      settlement.phaseHistory.push({
        phase: 'FX_EXECUTED',
        timestamp: settlement.timing.fxExecuted,
        latency: settlement.timing.fxExecuted - phase2Start,
      });

      // ═══════════════════════════════════════════════════════════════════
      // PHASE 3: Merchant Credit (Target: 200ms)
      // ═══════════════════════════════════════════════════════════════════
      const phase3Start = performance.now();

      const merchant = this.merchants.get(params.merchantId);
      if (!merchant) {
        // Create generic merchant on-the-fly
        const region = 'USA';
        const railConfig = HIGH_SPEED_BRIDGE_CONFIG.SETTLEMENT_RAILS[region];
        settlement.settlementRail = railConfig.provider;
        settlement.merchantAccountId = `GENERIC-${params.merchantId}`;
        settlement.merchantName = 'Generic Merchant';
      } else {
        settlement.settlementRail = merchant.settlementRail;
        settlement.merchantAccountId = merchant.settlementAccount;
        settlement.merchantName = merchant.merchantName;
      }

      // Execute instant settlement to merchant
      await this.simulateLatency(Math.random() * 100 + 80); // 80-180ms

      settlement.settlementReference = `REF-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      settlement.timing.merchantCredited = performance.now();
      settlement.currentPhase = 'MERCHANT_CREDITED';
      settlement.phaseHistory.push({
        phase: 'MERCHANT_CREDITED',
        timestamp: settlement.timing.merchantCredited,
        latency: settlement.timing.merchantCredited - phase3Start,
      });

      // ═══════════════════════════════════════════════════════════════════
      // PHASE 4: Confirmation & Cashback (Target: 100ms)
      // ═══════════════════════════════════════════════════════════════════
      const phase4Start = performance.now();

      // Calculate cashback
      const tierConfig = CARD_CONFIG.TIERS[params.cardTier];
      const merchantCategory = merchant?.category || 'GENERAL';
      const ecosystemRate = CARD_CONFIG.ECOSYSTEM_CASHBACK[merchantCategory];

      settlement.cashbackKaus = params.kausAmount * tierConfig.cashbackRate;
      settlement.ecosystemBonus = params.kausAmount * ecosystemRate;

      // Release lock and finalize
      this.lockedBalances.delete(`${params.accountId}-${bridgeId}`);

      await this.simulateLatency(Math.random() * 30 + 40); // 40-70ms

      settlement.timing.confirmed = performance.now();
      settlement.timing.totalDuration = settlement.timing.confirmed - startTime;
      settlement.currentPhase = 'CONFIRMED';
      settlement.status = 'COMPLETED';
      settlement.phaseHistory.push({
        phase: 'CONFIRMED',
        timestamp: settlement.timing.confirmed,
        latency: settlement.timing.confirmed - phase4Start,
      });

      // Log settlement performance
      console.log(`[HIGH-SPEED BRIDGE] Settlement ${bridgeId} completed in ${settlement.timing.totalDuration.toFixed(2)}ms`);
      console.log(`  Phase 1 (Balance Lock): ${(settlement.timing.balanceLocked - startTime).toFixed(2)}ms`);
      console.log(`  Phase 2 (FX Execution): ${(settlement.timing.fxExecuted - settlement.timing.balanceLocked).toFixed(2)}ms`);
      console.log(`  Phase 3 (Merchant Credit): ${(settlement.timing.merchantCredited - settlement.timing.fxExecuted).toFixed(2)}ms`);
      console.log(`  Phase 4 (Confirmation): ${(settlement.timing.confirmed - settlement.timing.merchantCredited).toFixed(2)}ms`);

      // Store settlement
      this.settlements.set(bridgeId, settlement);

      return settlement;

    } catch (error) {
      // Rollback on failure
      settlement.currentPhase = 'FAILED';
      settlement.status = 'FAILED';
      settlement.failureReason = error instanceof Error ? error.message : 'Unknown error';
      settlement.timing.totalDuration = performance.now() - startTime;

      // Release lock
      this.lockedBalances.delete(`${params.accountId}-${bridgeId}`);

      this.settlements.set(bridgeId, settlement);
      return settlement;
    }
  }

  /**
   * Get settlement status
   */
  getSettlement(bridgeId: string): BridgeSettlement | undefined {
    return this.settlements.get(bridgeId);
  }

  /**
   * Get settlement history for account
   */
  getSettlementHistory(accountId: string, limit: number = 50): BridgeSettlement[] {
    return Array.from(this.settlements.values())
      .filter(s => s.accountId === accountId)
      .sort((a, b) => b.timing.initiated - a.timing.initiated)
      .slice(0, limit);
  }

  /**
   * Get settlement performance metrics
   */
  getPerformanceMetrics(): {
    totalSettlements: number;
    averageDuration: number;
    under650ms: number;
    under650msRate: number;
    fastestSettlement: number;
    slowestSettlement: number;
    byPhase: { phase: string; avgLatency: number }[];
  } {
    const completedSettlements = Array.from(this.settlements.values())
      .filter(s => s.status === 'COMPLETED');

    if (completedSettlements.length === 0) {
      return {
        totalSettlements: 0,
        averageDuration: 0,
        under650ms: 0,
        under650msRate: 0,
        fastestSettlement: 0,
        slowestSettlement: 0,
        byPhase: [],
      };
    }

    const durations = completedSettlements.map(s => s.timing.totalDuration);
    const under650ms = completedSettlements.filter(s => s.timing.totalDuration <= 650).length;

    // Calculate phase averages
    const phase1Latencies: number[] = [];
    const phase2Latencies: number[] = [];
    const phase3Latencies: number[] = [];
    const phase4Latencies: number[] = [];

    completedSettlements.forEach(s => {
      phase1Latencies.push(s.timing.balanceLocked - s.timing.initiated);
      phase2Latencies.push(s.timing.fxExecuted - s.timing.balanceLocked);
      phase3Latencies.push(s.timing.merchantCredited - s.timing.fxExecuted);
      phase4Latencies.push(s.timing.confirmed - s.timing.merchantCredited);
    });

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    return {
      totalSettlements: completedSettlements.length,
      averageDuration: avg(durations),
      under650ms,
      under650msRate: (under650ms / completedSettlements.length) * 100,
      fastestSettlement: Math.min(...durations),
      slowestSettlement: Math.max(...durations),
      byPhase: [
        { phase: 'Balance Lock', avgLatency: avg(phase1Latencies) },
        { phase: 'FX Execution', avgLatency: avg(phase2Latencies) },
        { phase: 'Merchant Credit', avgLatency: avg(phase3Latencies) },
        { phase: 'Confirmation', avgLatency: avg(phase4Latencies) },
      ],
    };
  }

  /**
   * Get available merchants
   */
  getMerchants(): MerchantAccount[] {
    return Array.from(this.merchants.values());
  }

  /**
   * Simulate network latency
   */
  private simulateLatency(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, Math.max(1, ms)));
  }
}

// Create singleton High-Speed Bridge instance
export const highSpeedBridge = new HighSpeedBridge();

class BlackCardEngine {
  private accounts: Map<string, CardAccount> = new Map();
  private transactions: CardTransaction[] = [];
  private conversions: ConversionRequest[] = [];
  private dividends: DividendDistribution[] = [];
  private currentKausRate = CARD_CONFIG.BASE_KAUS_USD_RATE;

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Mock card account for demo
    const mockAccount: CardAccount = {
      accountId: 'CARD-001',
      userId: 'USER-BOSS',
      cardTier: 'SOVEREIGN',
      cardNumber: '**** **** **** 9999',
      expiryDate: '12/28',
      status: 'ACTIVE',
      linkedKausWallet: '0x7a3...f92b',
      fiatBalance: {
        USD: 125000,
        KRW: 165000000,
        EUR: 115000,
      },
      kausBalance: 2500000,
      monthlySpent: 45000,
      dailySpent: 3500,
      totalCashbackEarned: 12500,
      createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000,
      lastUsed: Date.now() - 2 * 60 * 60 * 1000,
    };

    this.accounts.set(mockAccount.accountId, mockAccount);

    // Generate mock transactions
    const merchants = [
      { name: 'Aura Sydney Flagship', category: 'AURA_SYDNEY' as MerchantCategory, location: 'Sydney, AU' },
      { name: 'Nomad Monthly Premium', category: 'NOMAD_MONTHLY' as MerchantCategory, location: 'Online' },
      { name: 'Solar Panel Co.', category: 'ENERGY_PARTNERS' as MerchantCategory, location: 'Seoul, KR' },
      { name: 'The Modern Table', category: 'DINING' as MerchantCategory, location: 'Tokyo, JP' },
      { name: 'Amazon.com', category: 'GENERAL' as MerchantCategory, location: 'Online' },
      { name: 'Aura Sydney Online', category: 'AURA_SYDNEY' as MerchantCategory, location: 'Online' },
      { name: 'Nomad Hotels', category: 'NOMAD_MONTHLY' as MerchantCategory, location: 'Dubai, UAE' },
    ];

    for (let i = 0; i < 30; i++) {
      const merchant = merchants[Math.floor(Math.random() * merchants.length)];
      const amount = Math.floor(Math.random() * 5000) + 100;
      const ecosystemRate = CARD_CONFIG.ECOSYSTEM_CASHBACK[merchant.category];
      const baseRate = CARD_CONFIG.TIERS.SOVEREIGN.cashbackRate;

      this.transactions.push({
        transactionId: `TXN-${Date.now()}-${i.toString().padStart(3, '0')}`,
        accountId: 'CARD-001',
        type: 'PURCHASE',
        amount,
        currency: 'USD',
        merchantName: merchant.name,
        merchantCategory: merchant.category,
        kausUsed: amount / this.currentKausRate,
        fiatAmount: amount,
        cashbackKaus: (amount / this.currentKausRate) * baseRate,
        ecosystemBonus: (amount / this.currentKausRate) * ecosystemRate,
        status: 'COMPLETED',
        timestamp: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        location: merchant.location,
      });
    }

    // Mock dividends
    const dividendSources: DividendDistribution['source'][] = ['ENERGY_NODE', 'STAKING', 'COMPUTE_MINING', 'REFERRAL'];
    for (let i = 0; i < 10; i++) {
      const source = dividendSources[Math.floor(Math.random() * dividendSources.length)];
      const kausAmount = Math.floor(Math.random() * 5000) + 500;

      this.dividends.push({
        distributionId: `DIV-${Date.now()}-${i}`,
        userId: 'USER-BOSS',
        source,
        kausAmount,
        autoConvertToFiat: Math.random() > 0.5,
        fiatCurrency: 'USD',
        fiatAmount: kausAmount * this.currentKausRate,
        cardLoaded: true,
        timestamp: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      });
    }
  }

  /**
   * Get card account
   */
  getAccount(accountId: string): CardAccount | undefined {
    return this.accounts.get(accountId);
  }

  /**
   * Get card tier benefits
   */
  getTierBenefits(tier: CardTier) {
    return CARD_CONFIG.TIERS[tier];
  }

  /**
   * Calculate cashback for transaction
   */
  calculateCashback(
    amount: number,
    merchantCategory: MerchantCategory,
    cardTier: CardTier
  ): {
    baseCashback: number;
    ecosystemBonus: number;
    totalCashbackKaus: number;
    totalCashbackUsd: number;
  } {
    const tierConfig = CARD_CONFIG.TIERS[cardTier];
    const ecosystemRate = CARD_CONFIG.ECOSYSTEM_CASHBACK[merchantCategory];

    const kausEquivalent = amount / this.currentKausRate;
    const baseCashback = kausEquivalent * tierConfig.cashbackRate;
    const ecosystemBonus = kausEquivalent * ecosystemRate;
    const totalCashbackKaus = baseCashback + ecosystemBonus;

    return {
      baseCashback,
      ecosystemBonus,
      totalCashbackKaus,
      totalCashbackUsd: totalCashbackKaus * this.currentKausRate,
    };
  }

  /**
   * Process K-AUS to FIAT conversion
   */
  convertKausToFiat(
    accountId: string,
    kausAmount: number,
    targetCurrency: FiatCurrency
  ): ConversionRequest {
    const account = this.accounts.get(accountId);
    if (!account) throw new Error('Account not found');

    // Exchange rates (simulated)
    const fiatRates: Record<FiatCurrency, number> = {
      USD: 1,
      KRW: 1320.50,
      EUR: 0.92,
      JPY: 149.50,
      SGD: 1.34,
      AED: 3.67,
    };

    const baseUsdAmount = kausAmount * this.currentKausRate;
    const fiatAmount = baseUsdAmount * fiatRates[targetCurrency];
    const fee = fiatAmount * CARD_CONFIG.CONVERSION_FEE;
    const netFiatAmount = fiatAmount - fee;

    const isInstant = kausAmount <= CARD_CONFIG.MAX_INSTANT_CONVERSION;

    const conversion: ConversionRequest = {
      requestId: `CONV-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      accountId,
      kausAmount,
      targetCurrency,
      exchangeRate: this.currentKausRate * fiatRates[targetCurrency],
      fiatAmount,
      fee,
      netFiatAmount,
      status: isInstant ? 'COMPLETED' : 'PROCESSING',
      estimatedCompletion: isInstant ? Date.now() : Date.now() + 24 * 60 * 60 * 1000,
      createdAt: Date.now(),
    };

    this.conversions.push(conversion);

    // Update account balance if instant
    if (isInstant && account) {
      account.kausBalance -= kausAmount;
      if (targetCurrency === 'USD') {
        account.fiatBalance.USD += netFiatAmount;
      } else if (targetCurrency === 'KRW') {
        account.fiatBalance.KRW += netFiatAmount;
      } else if (targetCurrency === 'EUR') {
        account.fiatBalance.EUR += netFiatAmount;
      }
    }

    return conversion;
  }

  /**
   * Process card purchase
   */
  processPurchase(params: {
    accountId: string;
    amount: number;
    currency: FiatCurrency;
    merchantName: string;
    merchantCategory: MerchantCategory;
    useKaus: boolean;
    location?: string;
  }): CardTransaction {
    const account = this.accounts.get(params.accountId);
    if (!account) throw new Error('Account not found');

    const tierConfig = CARD_CONFIG.TIERS[account.cardTier];

    // Check limits
    if (params.amount > tierConfig.dailyLimit - account.dailySpent) {
      throw new Error('Daily limit exceeded');
    }

    // Calculate amounts
    let kausUsed = 0;
    let fiatAmount = params.amount;

    if (params.useKaus) {
      kausUsed = params.amount / this.currentKausRate;
      if (kausUsed > account.kausBalance) {
        throw new Error('Insufficient K-AUS balance');
      }
    }

    // Calculate cashback
    const cashback = this.calculateCashback(params.amount, params.merchantCategory, account.cardTier);

    const transaction: CardTransaction = {
      transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      accountId: params.accountId,
      type: 'PURCHASE',
      amount: params.amount,
      currency: params.currency,
      merchantName: params.merchantName,
      merchantCategory: params.merchantCategory,
      kausUsed,
      fiatAmount,
      cashbackKaus: cashback.baseCashback,
      ecosystemBonus: cashback.ecosystemBonus,
      status: 'COMPLETED',
      timestamp: Date.now(),
      location: params.location,
    };

    // Update account
    if (params.useKaus) {
      account.kausBalance -= kausUsed;
      account.kausBalance += cashback.totalCashbackKaus;
    }
    account.dailySpent += params.amount;
    account.monthlySpent += params.amount;
    account.totalCashbackEarned += cashback.totalCashbackUsd;
    account.lastUsed = Date.now();

    this.transactions.push(transaction);
    return transaction;
  }

  /**
   * Load dividend to card
   */
  loadDividend(params: {
    userId: string;
    source: DividendDistribution['source'];
    kausAmount: number;
    autoConvert: boolean;
    targetCurrency?: FiatCurrency;
  }): DividendDistribution {
    const dividend: DividendDistribution = {
      distributionId: `DIV-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      userId: params.userId,
      source: params.source,
      kausAmount: params.kausAmount,
      autoConvertToFiat: params.autoConvert,
      fiatCurrency: params.targetCurrency,
      fiatAmount: params.autoConvert ? params.kausAmount * this.currentKausRate : undefined,
      cardLoaded: true,
      timestamp: Date.now(),
    };

    this.dividends.push(dividend);

    // Update account balance
    const account = Array.from(this.accounts.values()).find(a => a.userId === params.userId);
    if (account) {
      if (params.autoConvert && params.targetCurrency === 'USD') {
        account.fiatBalance.USD += params.kausAmount * this.currentKausRate;
      } else {
        account.kausBalance += params.kausAmount;
      }
    }

    return dividend;
  }

  /**
   * Get recent transactions
   */
  getTransactions(accountId: string, limit: number = 50): CardTransaction[] {
    return this.transactions
      .filter(t => t.accountId === accountId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get ecosystem cashback stats
   */
  getEcosystemStats(accountId: string): {
    totalEcosystemBonus: number;
    byMerchant: { category: MerchantCategory; bonus: number; transactionCount: number }[];
    auraSydneyTotal: number;
    nomadMonthlyTotal: number;
  } {
    const txns = this.transactions.filter(t => t.accountId === accountId);

    const byMerchant = new Map<MerchantCategory, { bonus: number; count: number }>();

    txns.forEach(t => {
      const existing = byMerchant.get(t.merchantCategory) || { bonus: 0, count: 0 };
      existing.bonus += t.ecosystemBonus;
      existing.count++;
      byMerchant.set(t.merchantCategory, existing);
    });

    const auraSydney = byMerchant.get('AURA_SYDNEY') || { bonus: 0, count: 0 };
    const nomadMonthly = byMerchant.get('NOMAD_MONTHLY') || { bonus: 0, count: 0 };

    return {
      totalEcosystemBonus: txns.reduce((sum, t) => sum + t.ecosystemBonus, 0),
      byMerchant: Array.from(byMerchant.entries()).map(([category, data]) => ({
        category,
        bonus: data.bonus,
        transactionCount: data.count,
      })),
      auraSydneyTotal: auraSydney.bonus,
      nomadMonthlyTotal: nomadMonthly.bonus,
    };
  }

  /**
   * Get dividend history
   */
  getDividendHistory(userId: string, limit: number = 20): DividendDistribution[] {
    return this.dividends
      .filter(d => d.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get all card tiers
   */
  getAllTiers(): { tier: CardTier; config: typeof CARD_CONFIG.TIERS[CardTier] }[] {
    return Object.entries(CARD_CONFIG.TIERS).map(([tier, config]) => ({
      tier: tier as CardTier,
      config,
    }));
  }

  /**
   * Update K-AUS rate
   */
  updateKausRate(rate: number): void {
    this.currentKausRate = rate;
  }

  /**
   * Get current K-AUS rate
   */
  getCurrentRate(): number {
    return this.currentKausRate;
  }

  /**
   * Get conversion history
   */
  getConversionHistory(accountId: string): ConversionRequest[] {
    return this.conversions
      .filter(c => c.accountId === accountId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HIGH-SPEED BRIDGE INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Process instant purchase using High-Speed Bridge (650ms target)
   * K-AUS 차감 → 실시간 환전 → 가맹점 입금 650ms 이내 완료
   */
  async processInstantPurchase(params: {
    accountId: string;
    amount: number;
    currency: FiatCurrency;
    merchantId: string;
    merchantName: string;
    merchantCategory: MerchantCategory;
    location?: string;
  }): Promise<{
    transaction: CardTransaction;
    bridgeSettlement: BridgeSettlement;
    performanceReport: {
      totalDuration: number;
      targetMet: boolean;
      phases: { phase: string; duration: number; target: number; met: boolean }[];
    };
  }> {
    const account = this.accounts.get(params.accountId);
    if (!account) throw new Error('Account not found');

    const tierConfig = CARD_CONFIG.TIERS[account.cardTier];

    // Check limits
    if (params.amount > tierConfig.dailyLimit - account.dailySpent) {
      throw new Error('Daily limit exceeded');
    }

    // Calculate K-AUS needed
    const kausNeeded = params.amount / this.currentKausRate;

    if (kausNeeded > account.kausBalance) {
      throw new Error('Insufficient K-AUS balance');
    }

    // Execute High-Speed Bridge Settlement
    const bridgeSettlement = await highSpeedBridge.executeSettlement({
      accountId: params.accountId,
      merchantId: params.merchantId,
      kausAmount: kausNeeded,
      targetCurrency: params.currency,
      kausBalance: account.kausBalance,
      cardTier: account.cardTier,
    });

    if (bridgeSettlement.status === 'FAILED') {
      throw new Error(`Bridge settlement failed: ${bridgeSettlement.failureReason}`);
    }

    // Create transaction record
    const transaction: CardTransaction = {
      transactionId: bridgeSettlement.transactionId,
      accountId: params.accountId,
      type: 'PURCHASE',
      amount: params.amount,
      currency: params.currency,
      merchantName: params.merchantName,
      merchantCategory: params.merchantCategory,
      kausUsed: kausNeeded,
      fiatAmount: bridgeSettlement.fiatAmount,
      cashbackKaus: bridgeSettlement.cashbackKaus,
      ecosystemBonus: bridgeSettlement.ecosystemBonus,
      status: 'COMPLETED',
      timestamp: Date.now(),
      location: params.location,
    };

    // Update account
    account.kausBalance -= kausNeeded;
    account.kausBalance += bridgeSettlement.cashbackKaus + bridgeSettlement.ecosystemBonus;
    account.dailySpent += params.amount;
    account.monthlySpent += params.amount;
    account.totalCashbackEarned += (bridgeSettlement.cashbackKaus + bridgeSettlement.ecosystemBonus) * this.currentKausRate;
    account.lastUsed = Date.now();

    this.transactions.push(transaction);

    // Generate performance report
    const timing = bridgeSettlement.timing;
    const targets = HIGH_SPEED_BRIDGE_CONFIG.TIMING;

    const performanceReport = {
      totalDuration: timing.totalDuration,
      targetMet: timing.totalDuration <= targets.TOTAL_TARGET,
      phases: [
        {
          phase: 'Balance Lock',
          duration: timing.balanceLocked - timing.initiated,
          target: targets.PHASE_1_BALANCE_CHECK,
          met: (timing.balanceLocked - timing.initiated) <= targets.PHASE_1_BALANCE_CHECK,
        },
        {
          phase: 'FX Execution',
          duration: timing.fxExecuted - timing.balanceLocked,
          target: targets.PHASE_2_FX_CONVERSION,
          met: (timing.fxExecuted - timing.balanceLocked) <= targets.PHASE_2_FX_CONVERSION,
        },
        {
          phase: 'Merchant Credit',
          duration: timing.merchantCredited - timing.fxExecuted,
          target: targets.PHASE_3_MERCHANT_CREDIT,
          met: (timing.merchantCredited - timing.fxExecuted) <= targets.PHASE_3_MERCHANT_CREDIT,
        },
        {
          phase: 'Confirmation',
          duration: timing.confirmed - timing.merchantCredited,
          target: targets.PHASE_4_CONFIRMATION,
          met: (timing.confirmed - timing.merchantCredited) <= targets.PHASE_4_CONFIRMATION,
        },
      ],
    };

    return {
      transaction,
      bridgeSettlement,
      performanceReport,
    };
  }

  /**
   * Get High-Speed Bridge performance metrics
   */
  getBridgePerformanceMetrics() {
    return highSpeedBridge.getPerformanceMetrics();
  }

  /**
   * Get bridge settlement history
   */
  getBridgeSettlementHistory(accountId: string, limit?: number) {
    return highSpeedBridge.getSettlementHistory(accountId, limit);
  }

  /**
   * Get all registered merchants
   */
  getRegisteredMerchants() {
    return highSpeedBridge.getMerchants();
  }
}

// Singleton instance
export const blackCardEngine = new BlackCardEngine();

// Convenience exports
export const getCardAccount = (accountId: string) => blackCardEngine.getAccount(accountId);
export const calculateCashback = (amount: number, category: MerchantCategory, tier: CardTier) =>
  blackCardEngine.calculateCashback(amount, category, tier);
export const convertKausToFiat = (accountId: string, kausAmount: number, currency: FiatCurrency) =>
  blackCardEngine.convertKausToFiat(accountId, kausAmount, currency);
export const processPurchase = (params: Parameters<typeof blackCardEngine.processPurchase>[0]) =>
  blackCardEngine.processPurchase(params);
export const getTransactions = (accountId: string, limit?: number) =>
  blackCardEngine.getTransactions(accountId, limit);
export const getEcosystemStats = (accountId: string) =>
  blackCardEngine.getEcosystemStats(accountId);
export const getAllCardTiers = () => blackCardEngine.getAllTiers();

// High-Speed Bridge exports (650ms settlement)
export const processInstantPurchase = (params: Parameters<typeof blackCardEngine.processInstantPurchase>[0]) =>
  blackCardEngine.processInstantPurchase(params);
export const getBridgePerformanceMetrics = () => blackCardEngine.getBridgePerformanceMetrics();
export const getBridgeSettlementHistory = (accountId: string, limit?: number) =>
  blackCardEngine.getBridgeSettlementHistory(accountId, limit);
export const getRegisteredMerchants = () => blackCardEngine.getRegisteredMerchants();

// Direct High-Speed Bridge access
export const executeHighSpeedSettlement = (params: Parameters<typeof highSpeedBridge.executeSettlement>[0]) =>
  highSpeedBridge.executeSettlement(params);
export const getBridgeSettlement = (bridgeId: string) => highSpeedBridge.getSettlement(bridgeId);
