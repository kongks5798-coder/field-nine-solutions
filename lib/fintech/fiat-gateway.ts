/**
 * FIELD NINE UNIVERSAL FIAT GATEWAY v2.0
 *
 * Phase 20.5: Sovereign Fiat Bridge
 * 글로벌 현금 정산망 - K-AUS/NXUSD와 8개 주요 법정화폐 실시간 환전
 *
 * 연동 프로바이더:
 * - PayPal Payouts API (글로벌)
 * - Stripe Connect (글로벌)
 * - Wise TransferWise API (국제 송금)
 * - Toss Payments (한국)
 * - Alipay (중국/아시아)
 *
 * "에너지의 가치를 현금으로, 현금의 가치를 에너지로"
 */

// ============================================================
// TYPES & INTERFACES
// ============================================================

export type FiatCurrency = 'KRW' | 'USD' | 'EUR' | 'JPY' | 'CNY' | 'GBP' | 'AUD' | 'SGD';

export interface ExchangeRate {
  from: FiatCurrency | 'NXUSD';
  to: FiatCurrency | 'NXUSD';
  rate: number;
  spread: number;
  timestamp: number;
  source: string;
}

export interface PaymentProvider {
  id: string;
  name: string;
  type: 'bank' | 'pg' | 'crypto_bridge';
  supportedCurrencies: FiatCurrency[];
  fees: {
    deposit: number;  // percentage
    withdrawal: number;
    minimum: number;
  };
  limits: {
    minDeposit: number;
    maxDeposit: number;
    minWithdrawal: number;
    maxWithdrawal: number;
    dailyLimit: number;
  };
  settlementTime: string;
  status: 'active' | 'maintenance' | 'disabled';
}

export interface FiatTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'exchange';
  userId: string;
  provider: string;
  fromCurrency: FiatCurrency | 'NXUSD';
  toCurrency: FiatCurrency | 'NXUSD';
  fromAmount: number;
  toAmount: number;
  exchangeRate: number;
  fees: {
    providerFee: number;
    networkFee: number;
    spreadFee: number;
    totalFee: number;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  timestamps: {
    created: number;
    processing?: number;
    completed?: number;
  };
  reference: {
    providerRef?: string;
    bankRef?: string;
    blockchainTx?: string;
  };
}

export interface CashOutRequest {
  userId: string;
  nxusdAmount: number;
  targetCurrency: FiatCurrency;
  bankAccount: {
    bankCode: string;
    accountNumber: string;
    accountHolder: string;
    country: string;
  };
  priority: 'standard' | 'express' | 'instant';
}

export interface CashOutResult {
  success: boolean;
  transactionId: string;
  nxusdAmount: number;
  fiatAmount: number;
  currency: FiatCurrency;
  exchangeRate: number;
  totalFees: number;
  netAmount: number;
  estimatedArrival: string;
  reference: string;
}

// ============================================================
// PAYMENT PROVIDERS DATABASE
// ============================================================

export const PAYMENT_PROVIDERS: PaymentProvider[] = [
  // Korean Market
  {
    id: 'toss',
    name: 'Toss Payments',
    type: 'pg',
    supportedCurrencies: ['KRW'],
    fees: { deposit: 0, withdrawal: 0.1, minimum: 100 },
    limits: {
      minDeposit: 1000,
      maxDeposit: 100000000,
      minWithdrawal: 10000,
      maxWithdrawal: 50000000,
      dailyLimit: 100000000,
    },
    settlementTime: 'T+1',
    status: 'active',
  },
  {
    id: 'kakao_pay',
    name: 'Kakao Pay',
    type: 'pg',
    supportedCurrencies: ['KRW'],
    fees: { deposit: 0, withdrawal: 0.15, minimum: 150 },
    limits: {
      minDeposit: 1000,
      maxDeposit: 50000000,
      minWithdrawal: 10000,
      maxWithdrawal: 30000000,
      dailyLimit: 50000000,
    },
    settlementTime: 'T+1',
    status: 'active',
  },
  {
    id: 'kb_bank',
    name: 'KB Kookmin Bank',
    type: 'bank',
    supportedCurrencies: ['KRW', 'USD'],
    fees: { deposit: 0, withdrawal: 0.05, minimum: 500 },
    limits: {
      minDeposit: 10000,
      maxDeposit: 1000000000,
      minWithdrawal: 100000,
      maxWithdrawal: 500000000,
      dailyLimit: 1000000000,
    },
    settlementTime: 'Instant - T+1',
    status: 'active',
  },
  // Global Market
  {
    id: 'stripe',
    name: 'Stripe',
    type: 'pg',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'SGD'],
    fees: { deposit: 2.9, withdrawal: 0.25, minimum: 0 },
    limits: {
      minDeposit: 1,
      maxDeposit: 10000000,
      minWithdrawal: 100,
      maxWithdrawal: 5000000,
      dailyLimit: 10000000,
    },
    settlementTime: 'T+2',
    status: 'active',
  },
  {
    id: 'wise',
    name: 'Wise (TransferWise)',
    type: 'bank',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'SGD', 'CNY'],
    fees: { deposit: 0.5, withdrawal: 0.35, minimum: 0 },
    limits: {
      minDeposit: 10,
      maxDeposit: 5000000,
      minWithdrawal: 50,
      maxWithdrawal: 2000000,
      dailyLimit: 5000000,
    },
    settlementTime: 'T+1 to T+3',
    status: 'active',
  },
  {
    id: 'jpm_institutional',
    name: 'JP Morgan Institutional',
    type: 'bank',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY'],
    fees: { deposit: 0.01, withdrawal: 0.02, minimum: 10000 },
    limits: {
      minDeposit: 1000000,
      maxDeposit: 10000000000,
      minWithdrawal: 1000000,
      maxWithdrawal: 5000000000,
      dailyLimit: 10000000000,
    },
    settlementTime: 'Same Day',
    status: 'active',
  },
];

// ============================================================
// LIVE EXCHANGE RATES (Simulated Real-time Feed)
// ============================================================

const BASE_RATES: Record<FiatCurrency, number> = {
  KRW: 1320.50,   // 1 USD = 1320.50 KRW
  USD: 1.0,       // Base currency
  EUR: 0.92,      // 1 USD = 0.92 EUR
  JPY: 149.80,    // 1 USD = 149.80 JPY
  CNY: 7.24,      // 1 USD = 7.24 CNY
  GBP: 0.79,      // 1 USD = 0.79 GBP
  AUD: 1.53,      // 1 USD = 1.53 AUD
  SGD: 1.34,      // 1 USD = 1.34 SGD
};

// NXUSD is pegged 1:1 to USD with energy backing
const NXUSD_USD_RATE = 1.0;

// ============================================================
// FIAT GATEWAY CLASS
// ============================================================

class FiatGateway {
  private transactions: Map<string, FiatTransaction> = new Map();
  private rateCache: Map<string, ExchangeRate> = new Map();
  private lastRateUpdate: number = 0;

  constructor() {
    this.initializeRates();
  }

  private initializeRates(): void {
    const now = Date.now();

    // USD to all currencies
    Object.entries(BASE_RATES).forEach(([currency, rate]) => {
      const key = `USD-${currency}`;
      this.rateCache.set(key, {
        from: 'USD',
        to: currency as FiatCurrency,
        rate,
        spread: 0.001, // 0.1% spread
        timestamp: now,
        source: 'field_nine_oracle',
      });
    });

    // NXUSD rates
    Object.entries(BASE_RATES).forEach(([currency, rate]) => {
      const key = `NXUSD-${currency}`;
      this.rateCache.set(key, {
        from: 'NXUSD',
        to: currency as FiatCurrency,
        rate: rate * NXUSD_USD_RATE,
        spread: 0.0005, // 0.05% spread for NXUSD (energy-backed advantage)
        timestamp: now,
        source: 'field_nine_oracle',
      });
    });

    this.lastRateUpdate = now;
  }

  /**
   * Get real-time exchange rate with market fluctuation
   */
  getExchangeRate(from: FiatCurrency | 'NXUSD', to: FiatCurrency | 'NXUSD'): ExchangeRate {
    // Apply small random fluctuation to simulate live market
    const fluctuation = 1 + (Math.random() - 0.5) * 0.002; // ±0.1%

    if (from === 'NXUSD' && to !== 'NXUSD') {
      const baseRate = BASE_RATES[to] || 1;
      return {
        from,
        to,
        rate: baseRate * fluctuation,
        spread: 0.0005,
        timestamp: Date.now(),
        source: 'field_nine_oracle',
      };
    }

    if (from !== 'NXUSD' && to === 'NXUSD') {
      const baseRate = BASE_RATES[from] || 1;
      return {
        from,
        to,
        rate: (1 / baseRate) * fluctuation,
        spread: 0.0005,
        timestamp: Date.now(),
        source: 'field_nine_oracle',
      };
    }

    if (from !== 'NXUSD' && to !== 'NXUSD') {
      const fromRate = BASE_RATES[from] || 1;
      const toRate = BASE_RATES[to] || 1;
      return {
        from,
        to,
        rate: (toRate / fromRate) * fluctuation,
        spread: 0.001,
        timestamp: Date.now(),
        source: 'field_nine_oracle',
      };
    }

    return {
      from,
      to,
      rate: 1,
      spread: 0,
      timestamp: Date.now(),
      source: 'field_nine_oracle',
    };
  }

  /**
   * Get all current exchange rates
   */
  getAllRates(): ExchangeRate[] {
    const rates: ExchangeRate[] = [];
    const currencies: (FiatCurrency | 'NXUSD')[] = ['NXUSD', 'KRW', 'USD', 'EUR', 'JPY', 'CNY', 'GBP', 'AUD', 'SGD'];

    currencies.forEach(from => {
      currencies.forEach(to => {
        if (from !== to) {
          rates.push(this.getExchangeRate(from, to));
        }
      });
    });

    return rates;
  }

  /**
   * Get available payment providers for a currency
   */
  getProvidersForCurrency(currency: FiatCurrency): PaymentProvider[] {
    return PAYMENT_PROVIDERS.filter(
      p => p.supportedCurrencies.includes(currency) && p.status === 'active'
    );
  }

  /**
   * Get optimal provider based on amount and priority
   */
  getOptimalProvider(
    currency: FiatCurrency,
    amount: number,
    type: 'deposit' | 'withdrawal'
  ): PaymentProvider | null {
    const providers = this.getProvidersForCurrency(currency);

    const eligible = providers.filter(p => {
      if (type === 'deposit') {
        return amount >= p.limits.minDeposit && amount <= p.limits.maxDeposit;
      }
      return amount >= p.limits.minWithdrawal && amount <= p.limits.maxWithdrawal;
    });

    if (eligible.length === 0) return null;

    // Sort by lowest fees
    return eligible.sort((a, b) => {
      const feeA = type === 'deposit' ? a.fees.deposit : a.fees.withdrawal;
      const feeB = type === 'deposit' ? b.fees.deposit : b.fees.withdrawal;
      return feeA - feeB;
    })[0];
  }

  /**
   * Calculate exchange with all fees
   */
  calculateExchange(
    fromAmount: number,
    from: FiatCurrency | 'NXUSD',
    to: FiatCurrency | 'NXUSD',
    provider?: PaymentProvider
  ): {
    toAmount: number;
    rate: ExchangeRate;
    fees: {
      providerFee: number;
      spreadFee: number;
      totalFee: number;
    };
    netAmount: number;
  } {
    const rate = this.getExchangeRate(from, to);

    // Calculate spread fee
    const spreadFee = fromAmount * rate.spread;

    // Calculate provider fee
    let providerFee = 0;
    if (provider && to !== 'NXUSD') {
      providerFee = Math.max(fromAmount * (provider.fees.withdrawal / 100), provider.fees.minimum);
    }

    const totalFee = spreadFee + providerFee;
    const netFromAmount = fromAmount - totalFee;
    const toAmount = netFromAmount * rate.rate;

    return {
      toAmount,
      rate,
      fees: {
        providerFee,
        spreadFee,
        totalFee,
      },
      netAmount: toAmount,
    };
  }

  /**
   * Execute 1-Click Cash Out
   */
  async executeOneClickCashOut(request: CashOutRequest): Promise<CashOutResult> {
    const provider = this.getOptimalProvider(request.targetCurrency, request.nxusdAmount, 'withdrawal');

    if (!provider) {
      throw new Error(`No provider available for ${request.targetCurrency} withdrawal of ${request.nxusdAmount}`);
    }

    const exchange = this.calculateExchange(
      request.nxusdAmount,
      'NXUSD',
      request.targetCurrency,
      provider
    );

    // Create transaction record
    const txId = `FIAT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const transaction: FiatTransaction = {
      id: txId,
      type: 'withdrawal',
      userId: request.userId,
      provider: provider.id,
      fromCurrency: 'NXUSD',
      toCurrency: request.targetCurrency,
      fromAmount: request.nxusdAmount,
      toAmount: exchange.toAmount,
      exchangeRate: exchange.rate.rate,
      fees: {
        providerFee: exchange.fees.providerFee,
        networkFee: 0,
        spreadFee: exchange.fees.spreadFee,
        totalFee: exchange.fees.totalFee,
      },
      status: 'processing',
      timestamps: {
        created: Date.now(),
        processing: Date.now(),
      },
      reference: {
        providerRef: `${provider.id.toUpperCase()}-${Date.now()}`,
      },
    };

    this.transactions.set(txId, transaction);

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update status
    transaction.status = 'completed';
    transaction.timestamps.completed = Date.now();

    // Calculate estimated arrival
    let estimatedArrival = '';
    switch (request.priority) {
      case 'instant':
        estimatedArrival = 'Within 30 minutes';
        break;
      case 'express':
        estimatedArrival = 'Within 4 hours';
        break;
      default:
        estimatedArrival = provider.settlementTime;
    }

    return {
      success: true,
      transactionId: txId,
      nxusdAmount: request.nxusdAmount,
      fiatAmount: exchange.toAmount,
      currency: request.targetCurrency,
      exchangeRate: exchange.rate.rate,
      totalFees: exchange.fees.totalFee,
      netAmount: exchange.netAmount,
      estimatedArrival,
      reference: transaction.reference.providerRef || txId,
    };
  }

  /**
   * Deposit FIAT to NXUSD
   */
  async depositFiatToNxusd(
    userId: string,
    amount: number,
    currency: FiatCurrency,
    providerId: string
  ): Promise<FiatTransaction> {
    const provider = PAYMENT_PROVIDERS.find(p => p.id === providerId);
    if (!provider) throw new Error('Provider not found');

    const exchange = this.calculateExchange(amount, currency, 'NXUSD');

    const txId = `DEP-${Date.now().toString(36).toUpperCase()}`;
    const transaction: FiatTransaction = {
      id: txId,
      type: 'deposit',
      userId,
      provider: providerId,
      fromCurrency: currency,
      toCurrency: 'NXUSD',
      fromAmount: amount,
      toAmount: exchange.toAmount,
      exchangeRate: exchange.rate.rate,
      fees: {
        providerFee: amount * (provider.fees.deposit / 100),
        networkFee: 0,
        spreadFee: exchange.fees.spreadFee,
        totalFee: exchange.fees.totalFee + amount * (provider.fees.deposit / 100),
      },
      status: 'completed',
      timestamps: {
        created: Date.now(),
        completed: Date.now(),
      },
      reference: {},
    };

    this.transactions.set(txId, transaction);
    return transaction;
  }

  /**
   * Get transaction by ID
   */
  getTransaction(txId: string): FiatTransaction | undefined {
    return this.transactions.get(txId);
  }

  /**
   * Get user transactions
   */
  getUserTransactions(userId: string): FiatTransaction[] {
    return Array.from(this.transactions.values()).filter(tx => tx.userId === userId);
  }

  /**
   * Get gateway statistics
   */
  getStats(): {
    totalTransactions: number;
    totalVolumeUsd: number;
    totalFeesCollected: number;
    activeProviders: number;
    supportedCurrencies: number;
  } {
    const transactions = Array.from(this.transactions.values());

    return {
      totalTransactions: transactions.length,
      totalVolumeUsd: transactions.reduce((sum, tx) => {
        if (tx.fromCurrency === 'NXUSD' || tx.fromCurrency === 'USD') {
          return sum + tx.fromAmount;
        }
        const rate = this.getExchangeRate(tx.fromCurrency, 'USD');
        return sum + tx.fromAmount * rate.rate;
      }, 0),
      totalFeesCollected: transactions.reduce((sum, tx) => sum + tx.fees.totalFee, 0),
      activeProviders: PAYMENT_PROVIDERS.filter(p => p.status === 'active').length,
      supportedCurrencies: 8,
    };
  }
}

// Export singleton instance
export const fiatGateway = new FiatGateway();

// ============================================================
// QUICK ACCESS FUNCTIONS
// ============================================================

export function getExchangeRate(from: FiatCurrency | 'NXUSD', to: FiatCurrency | 'NXUSD'): ExchangeRate {
  return fiatGateway.getExchangeRate(from, to);
}

export function getAllProviders(): PaymentProvider[] {
  return PAYMENT_PROVIDERS;
}

export async function oneClickCashOut(request: CashOutRequest): Promise<CashOutResult> {
  return fiatGateway.executeOneClickCashOut(request);
}

// ============================================================
// PHASE 20.5: UNIVERSAL PAYOUT GATEWAY EXTENSION
// PayPal, Stripe, Wise API Integration
// ============================================================

export type PayoutProvider = 'PAYPAL' | 'STRIPE' | 'WISE' | 'TOSS' | 'ALIPAY';
export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type PayoutMethod = 'BANK_TRANSFER' | 'PAYPAL_BALANCE' | 'CARD' | 'CRYPTO_WALLET';

export interface AutoPayoutRule {
  id: string;
  userId: string;
  enabled: boolean;
  triggerType: 'THRESHOLD' | 'SCHEDULE' | 'DIVIDEND';
  threshold?: number;
  schedule?: string;
  targetCurrency: FiatCurrency;
  provider: PayoutProvider;
  method: PayoutMethod;
  recipientId: string;
  maxAmount?: number;
  createdAt: Date;
}

export interface PayoutRequest {
  id: string;
  userId: string;
  kausAmount: number;
  targetCurrency: FiatCurrency;
  targetAmount: number;
  exchangeRate: number;
  provider: PayoutProvider;
  method: PayoutMethod;
  recipientDetails: {
    type: 'INDIVIDUAL' | 'BUSINESS';
    name: string;
    email?: string;
    bankAccount?: {
      accountNumber: string;
      routingNumber?: string;
      iban?: string;
      swiftBic?: string;
      bankName: string;
    };
    paypalEmail?: string;
  };
  fees: {
    platformFee: number;
    providerFee: number;
    exchangeFee: number;
    totalFee: number;
  };
  status: PayoutStatus;
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  providerReference?: string;
  failureReason?: string;
}

// Provider API Configuration
export const PROVIDER_API_CONFIG: Record<PayoutProvider, {
  baseUrl: string;
  authType: 'OAUTH2' | 'API_KEY' | 'HMAC';
  supportedCurrencies: FiatCurrency[];
  minPayout: number;
  maxPayout: number;
  processingTime: string;
  feePercent: number;
  fixedFee: number;
}> = {
  PAYPAL: {
    baseUrl: 'https://api-m.paypal.com/v1/payments/payouts',
    authType: 'OAUTH2',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'AUD', 'SGD'],
    minPayout: 1,
    maxPayout: 50000,
    processingTime: '1-3 business days',
    feePercent: 2.9,
    fixedFee: 0.30,
  },
  STRIPE: {
    baseUrl: 'https://api.stripe.com/v1/payouts',
    authType: 'API_KEY',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'SGD'],
    minPayout: 1,
    maxPayout: 100000,
    processingTime: '2-5 business days',
    feePercent: 2.5,
    fixedFee: 0.25,
  },
  WISE: {
    baseUrl: 'https://api.transferwise.com/v1/transfers',
    authType: 'API_KEY',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'KRW', 'AUD', 'SGD', 'CNY'],
    minPayout: 1,
    maxPayout: 1000000,
    processingTime: '1-2 business days',
    feePercent: 0.41,
    fixedFee: 0,
  },
  TOSS: {
    baseUrl: 'https://api.tosspayments.com/v1/payouts',
    authType: 'API_KEY',
    supportedCurrencies: ['KRW'],
    minPayout: 1000,
    maxPayout: 50000000,
    processingTime: 'Instant - 1 business day',
    feePercent: 1.5,
    fixedFee: 0,
  },
  ALIPAY: {
    baseUrl: 'https://openapi.alipay.com/gateway.do',
    authType: 'HMAC',
    supportedCurrencies: ['USD', 'CNY', 'SGD'],
    minPayout: 10,
    maxPayout: 50000,
    processingTime: '1-3 business days',
    feePercent: 2.0,
    fixedFee: 0,
  },
};

const KAUS_BASE_PRICE = 2.47;

// ============================================================
// UNIVERSAL PAYOUT ENGINE
// ============================================================

class UniversalPayoutEngine {
  private payouts: Map<string, PayoutRequest> = new Map();
  private autoRules: Map<string, AutoPayoutRule[]> = new Map();

  constructor() {
    this.initializeMockPayouts();
  }

  private initializeMockPayouts(): void {
    // Sample auto-payout rules for BOSS
    this.autoRules.set('USER-BOSS', [
      {
        id: 'AUTO-001',
        userId: 'USER-BOSS',
        enabled: true,
        triggerType: 'THRESHOLD',
        threshold: 10000,
        targetCurrency: 'USD',
        provider: 'WISE',
        method: 'BANK_TRANSFER',
        recipientId: 'RCP-001',
        maxAmount: 50000,
        createdAt: new Date(),
      },
      {
        id: 'AUTO-002',
        userId: 'USER-BOSS',
        enabled: true,
        triggerType: 'DIVIDEND',
        targetCurrency: 'KRW',
        provider: 'TOSS',
        method: 'BANK_TRANSFER',
        recipientId: 'RCP-002',
        createdAt: new Date(),
      },
    ]);

    // Sample historical payouts
    const providers: PayoutProvider[] = ['PAYPAL', 'STRIPE', 'WISE', 'TOSS'];
    const currencies: FiatCurrency[] = ['USD', 'EUR', 'KRW', 'AUD'];

    for (let i = 0; i < 25; i++) {
      const provider = providers[i % 4];
      const currency = currencies[i % 4];
      const kausAmount = 500 + Math.random() * 10000;
      const rate = BASE_RATES[currency] || 1;
      const targetAmount = kausAmount * KAUS_BASE_PRICE * rate;
      const config = PROVIDER_API_CONFIG[provider];

      this.payouts.set(`PAYOUT-${String(i + 1).padStart(5, '0')}`, {
        id: `PAYOUT-${String(i + 1).padStart(5, '0')}`,
        userId: 'USER-BOSS',
        kausAmount,
        targetCurrency: currency,
        targetAmount,
        exchangeRate: KAUS_BASE_PRICE * rate,
        provider,
        method: 'BANK_TRANSFER',
        recipientDetails: {
          type: 'INDIVIDUAL',
          name: 'Field Nine Boss',
          email: 'boss@fieldnine.io',
        },
        fees: {
          platformFee: targetAmount * 0.005,
          providerFee: targetAmount * (config.feePercent / 100) + config.fixedFee,
          exchangeFee: targetAmount * 0.002,
          totalFee: targetAmount * 0.005 + targetAmount * (config.feePercent / 100) + config.fixedFee + targetAmount * 0.002,
        },
        status: i < 20 ? 'COMPLETED' : 'PROCESSING',
        createdAt: new Date(Date.now() - (25 - i) * 86400000),
        processedAt: i < 20 ? new Date(Date.now() - (25 - i) * 86400000 + 3600000) : undefined,
        completedAt: i < 20 ? new Date(Date.now() - (25 - i) * 86400000 + 86400000) : undefined,
        providerReference: `REF-${Date.now()}-${i}`,
      });
    }
  }

  // ============================================
  // PayPal Payouts API Integration
  // ============================================
  async createPayPalPayout(request: PayoutRequest): Promise<{ batchId: string; status: string }> {
    // In production, this would call PayPal API:
    // POST https://api-m.paypal.com/v1/payments/payouts
    // {
    //   "sender_batch_header": {
    //     "sender_batch_id": request.id,
    //     "email_subject": "Field Nine K-AUS Payout"
    //   },
    //   "items": [{
    //     "recipient_type": "EMAIL",
    //     "amount": { "value": request.targetAmount, "currency": request.targetCurrency },
    //     "receiver": request.recipientDetails.paypalEmail,
    //     "note": "K-AUS to Fiat conversion"
    //   }]
    // }

    console.log(`[PayPal] Creating payout batch: ${request.targetAmount} ${request.targetCurrency}`);

    return {
      batchId: `PP-BATCH-${Date.now()}`,
      status: 'PENDING',
    };
  }

  // ============================================
  // Stripe Connect Payout Integration
  // ============================================
  async createStripePayout(request: PayoutRequest): Promise<{ payoutId: string; status: string }> {
    // In production, this would call Stripe API:
    // const payout = await stripe.payouts.create({
    //   amount: Math.round(request.targetAmount * 100), // Stripe uses cents
    //   currency: request.targetCurrency.toLowerCase(),
    //   method: 'standard',
    //   destination: request.recipientDetails.bankAccount?.accountNumber,
    // });

    console.log(`[Stripe] Creating payout: ${request.targetAmount} ${request.targetCurrency}`);

    return {
      payoutId: `po_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      status: 'pending',
    };
  }

  // ============================================
  // Wise (TransferWise) API Integration
  // ============================================
  async createWiseTransfer(request: PayoutRequest): Promise<{ transferId: string; status: string }> {
    // In production, this would involve multiple Wise API calls:
    // 1. Create Quote: POST /v3/profiles/{profileId}/quotes
    // 2. Create Recipient: POST /v1/accounts
    // 3. Create Transfer: POST /v1/transfers
    // 4. Fund Transfer: POST /v3/profiles/{profileId}/transfers/{transferId}/payments

    console.log(`[Wise] Creating transfer: ${request.targetAmount} ${request.targetCurrency}`);

    return {
      transferId: `TR-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
      status: 'processing',
    };
  }

  // ============================================
  // Universal Payout Execution
  // ============================================
  async executePayout(
    userId: string,
    kausAmount: number,
    currency: FiatCurrency,
    provider: PayoutProvider,
    recipientDetails: PayoutRequest['recipientDetails']
  ): Promise<PayoutRequest> {
    const config = PROVIDER_API_CONFIG[provider];

    // Validate
    if (!config.supportedCurrencies.includes(currency)) {
      throw new Error(`${provider} does not support ${currency}`);
    }

    const rate = BASE_RATES[currency] || 1;
    const targetAmount = kausAmount * KAUS_BASE_PRICE * rate;

    if (targetAmount < config.minPayout) {
      throw new Error(`Minimum payout is ${config.minPayout} ${currency}`);
    }
    if (targetAmount > config.maxPayout) {
      throw new Error(`Maximum payout is ${config.maxPayout} ${currency}`);
    }

    // Calculate fees
    const fees = {
      platformFee: targetAmount * 0.005,
      providerFee: targetAmount * (config.feePercent / 100) + config.fixedFee,
      exchangeFee: targetAmount * 0.002,
      totalFee: 0,
    };
    fees.totalFee = fees.platformFee + fees.providerFee + fees.exchangeFee;

    // Create payout record
    const payout: PayoutRequest = {
      id: `PAYOUT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      userId,
      kausAmount,
      targetCurrency: currency,
      targetAmount,
      exchangeRate: KAUS_BASE_PRICE * rate,
      provider,
      method: recipientDetails.paypalEmail ? 'PAYPAL_BALANCE' : 'BANK_TRANSFER',
      recipientDetails,
      fees,
      status: 'PENDING',
      createdAt: new Date(),
    };

    // Execute based on provider
    try {
      let result: { status: string; ref?: string };

      switch (provider) {
        case 'PAYPAL':
          const ppResult = await this.createPayPalPayout(payout);
          result = { status: ppResult.status, ref: ppResult.batchId };
          break;
        case 'STRIPE':
          const strResult = await this.createStripePayout(payout);
          result = { status: strResult.status, ref: strResult.payoutId };
          break;
        case 'WISE':
          const wiseResult = await this.createWiseTransfer(payout);
          result = { status: wiseResult.status, ref: wiseResult.transferId };
          break;
        default:
          result = { status: 'PROCESSING', ref: `${provider}-${Date.now()}` };
      }

      payout.providerReference = result.ref;
      payout.status = 'PROCESSING';
      payout.processedAt = new Date();
    } catch (error) {
      payout.status = 'FAILED';
      payout.failureReason = String(error);
    }

    this.payouts.set(payout.id, payout);
    return payout;
  }

  // ============================================
  // Auto-Payout Logic
  // ============================================
  async checkAndExecuteAutoPayout(
    userId: string,
    availableKaus: number,
    triggerType: 'THRESHOLD' | 'DIVIDEND'
  ): Promise<PayoutRequest[]> {
    const rules = this.autoRules.get(userId) || [];
    const executed: PayoutRequest[] = [];

    for (const rule of rules) {
      if (!rule.enabled || rule.triggerType !== triggerType) continue;

      if (triggerType === 'THRESHOLD' && rule.threshold) {
        if (availableKaus >= rule.threshold) {
          const amount = rule.maxAmount ? Math.min(availableKaus, rule.maxAmount) : availableKaus;
          const payout = await this.executePayout(
            userId,
            amount,
            rule.targetCurrency,
            rule.provider,
            { type: 'INDIVIDUAL', name: 'Auto-Payout' }
          );
          executed.push(payout);
        }
      } else if (triggerType === 'DIVIDEND') {
        const payout = await this.executePayout(
          userId,
          availableKaus,
          rule.targetCurrency,
          rule.provider,
          { type: 'INDIVIDUAL', name: 'Dividend Auto-Payout' }
        );
        executed.push(payout);
      }
    }

    return executed;
  }

  getPayoutHistory(userId: string, limit: number = 20): PayoutRequest[] {
    return Array.from(this.payouts.values())
      .filter((p) => p.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  getAutoPayoutRules(userId: string): AutoPayoutRule[] {
    return this.autoRules.get(userId) || [];
  }

  createAutoPayoutRule(rule: Omit<AutoPayoutRule, 'id' | 'createdAt'>): AutoPayoutRule {
    const newRule: AutoPayoutRule = {
      ...rule,
      id: `AUTO-${Date.now()}`,
      createdAt: new Date(),
    };

    const rules = this.autoRules.get(rule.userId) || [];
    rules.push(newRule);
    this.autoRules.set(rule.userId, rules);

    return newRule;
  }

  getPayoutStats(userId: string): {
    totalPayouts: number;
    totalKausPaidOut: number;
    totalFeesPaid: number;
    successRate: number;
    preferredProvider: PayoutProvider;
  } {
    const userPayouts = Array.from(this.payouts.values()).filter((p) => p.userId === userId);
    const completed = userPayouts.filter((p) => p.status === 'COMPLETED');
    const failed = userPayouts.filter((p) => p.status === 'FAILED');

    const providerCounts: Record<PayoutProvider, number> = {
      PAYPAL: 0, STRIPE: 0, WISE: 0, TOSS: 0, ALIPAY: 0,
    };
    userPayouts.forEach((p) => providerCounts[p.provider]++);

    const preferredProvider = (Object.entries(providerCounts) as [PayoutProvider, number][])
      .sort((a, b) => b[1] - a[1])[0][0];

    return {
      totalPayouts: userPayouts.length,
      totalKausPaidOut: userPayouts.reduce((sum, p) => sum + p.kausAmount, 0),
      totalFeesPaid: userPayouts.reduce((sum, p) => sum + p.fees.totalFee, 0),
      successRate: userPayouts.length > 0 ? completed.length / (completed.length + failed.length) : 1,
      preferredProvider,
    };
  }
}

// Export Universal Payout Engine
export const universalPayoutEngine = new UniversalPayoutEngine();

// Convenience exports for Universal Payout
export const executePayout = (
  userId: string,
  kaus: number,
  currency: FiatCurrency,
  provider: PayoutProvider,
  recipient: PayoutRequest['recipientDetails']
) => universalPayoutEngine.executePayout(userId, kaus, currency, provider, recipient);

export const checkAutoPayout = (userId: string, kaus: number, trigger: 'THRESHOLD' | 'DIVIDEND') =>
  universalPayoutEngine.checkAndExecuteAutoPayout(userId, kaus, trigger);

export const getPayoutHistory = (userId: string, limit?: number) =>
  universalPayoutEngine.getPayoutHistory(userId, limit);

export const getPayoutStats = (userId: string) =>
  universalPayoutEngine.getPayoutStats(userId);

export const createAutoPayout = (rule: Omit<AutoPayoutRule, 'id' | 'createdAt'>) =>
  universalPayoutEngine.createAutoPayoutRule(rule);

export const getAutoPayoutRules = (userId: string) =>
  universalPayoutEngine.getAutoPayoutRules(userId);
