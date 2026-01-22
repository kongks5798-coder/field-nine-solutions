/**
 * FIELD NINE - VIRTUAL ENERGY SWAP ENGINE
 * Global Liquidity Pool
 *
 * Unifies 4 major energy markets (PJM, JEPX, AEMO, EPEX)
 * into a single, always-liquid pool for instant cross-border swaps.
 */

import { keccak256, encodePacked } from './crypto-utils';
import { GLOBAL_ENERGY_NODES, type EnergyNode } from './mirror-asset';

// ============================================================
// TYPES & INTERFACES
// ============================================================

export interface MarketSnapshot {
  market: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  lastUpdate: number;
}

export interface LiquidityProvider {
  providerId: string;
  address: string;
  totalStaked: number;        // kWh equivalent
  poolShare: number;          // %
  earnedFees: number;         // NXUSD
  apr: number;
  markets: string[];
  joinedAt: number;
}

export interface PoolState {
  totalLiquidity: number;     // Total kWh across all markets
  totalValueLocked: number;   // NXUSD value
  utilizationRate: number;    // %
  feeRate: number;            // 0.25%
  providers: number;
  dailyVolume: number;
  weeklyVolume: number;
}

export interface ArbitrageOpportunity {
  id: string;
  buyMarket: string;
  sellMarket: string;
  spread: number;             // %
  potentialProfit: number;    // NXUSD per MWh
  maxVolume: number;          // MWh
  validUntil: number;
}

export interface CrossMarketPath {
  path: string[];
  totalRate: number;
  fees: number;
  estimatedTime: string;
  steps: Array<{
    from: string;
    to: string;
    rate: number;
    fee: number;
  }>;
}

// ============================================================
// REAL-TIME MARKET DATA
// ============================================================

export const MARKET_CONFIGS = {
  PJM: {
    name: 'PJM Interconnection',
    region: 'USA East',
    currency: 'USD',
    tradingHours: '24/7',
    settlementCycle: 'T+1',
    basePrice: 42.30,
    volatility: 0.15,
  },
  JEPX: {
    name: 'Japan Electric Power Exchange',
    region: 'Japan',
    currency: 'JPY',
    tradingHours: '09:00-15:00 JST',
    settlementCycle: 'T+2',
    basePrice: 12500, // JPY/MWh
    volatility: 0.12,
  },
  AEMO: {
    name: 'Australian Energy Market Operator',
    region: 'Australia',
    currency: 'AUD',
    tradingHours: '24/7',
    settlementCycle: 'T+2',
    basePrice: 65.80,
    volatility: 0.20,
  },
  EPEX: {
    name: 'European Power Exchange',
    region: 'EU Central',
    currency: 'EUR',
    tradingHours: '24/7',
    settlementCycle: 'T+1',
    basePrice: 78.20,
    volatility: 0.18,
  },
};

// Exchange rates to USD for unified pricing
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  JPY: 0.0067,  // 1 JPY = 0.0067 USD
  AUD: 0.65,
  EUR: 1.08,
  KRW: 0.00074,
};

// ============================================================
// GLOBAL LIQUIDITY POOL ENGINE
// ============================================================

export class GlobalLiquidityPool {
  private static instance: GlobalLiquidityPool;

  private marketSnapshots: Map<string, MarketSnapshot> = new Map();
  private liquidityProviders: Map<string, LiquidityProvider> = new Map();
  private arbitrageOpportunities: ArbitrageOpportunity[] = [];

  // Pool state
  private poolState: PoolState = {
    totalLiquidity: 125000000,   // 125 GWh
    totalValueLocked: 8750000,   // $8.75M
    utilizationRate: 72.5,
    feeRate: 0.0025,             // 0.25%
    providers: 847,
    dailyVolume: 15420000,       // 15.42 GWh
    weeklyVolume: 98540000,      // 98.54 GWh
  };

  private constructor() {
    this.initializeMarketData();
    this.initializeLiquidityProviders();
    this.startPriceOracle();
  }

  static getInstance(): GlobalLiquidityPool {
    if (!GlobalLiquidityPool.instance) {
      GlobalLiquidityPool.instance = new GlobalLiquidityPool();
    }
    return GlobalLiquidityPool.instance;
  }

  private initializeMarketData(): void {
    const markets = ['PJM', 'JEPX', 'AEMO', 'EPEX'];

    for (const market of markets) {
      const config = MARKET_CONFIGS[market as keyof typeof MARKET_CONFIGS];

      // Convert to USD for unified comparison
      let priceUSD = config.basePrice;
      if (market === 'JEPX') {
        priceUSD = config.basePrice * EXCHANGE_RATES.JPY;
      } else if (market === 'AEMO') {
        priceUSD = config.basePrice * EXCHANGE_RATES.AUD;
      } else if (market === 'EPEX') {
        priceUSD = config.basePrice * EXCHANGE_RATES.EUR;
      }

      this.marketSnapshots.set(market, {
        market,
        price: priceUSD,
        priceChange24h: (Math.random() - 0.5) * 10,
        volume24h: 2000000 + Math.random() * 3000000,
        liquidity: 25000000 + Math.random() * 15000000,
        lastUpdate: Date.now(),
      });
    }
  }

  private initializeLiquidityProviders(): void {
    // Demo liquidity providers
    const demoProviders = [
      { name: 'KEPCO Green Fund', staked: 25000000, markets: ['JEPX'] },
      { name: 'PJM Clearing House', staked: 35000000, markets: ['PJM'] },
      { name: 'Origin Energy LP', staked: 15000000, markets: ['AEMO'] },
      { name: 'EnBW Trading', staked: 20000000, markets: ['EPEX'] },
      { name: 'Field Nine Treasury', staked: 30000000, markets: ['PJM', 'JEPX', 'AEMO', 'EPEX'] },
    ];

    for (const provider of demoProviders) {
      const providerId = `LP-${keccak256(encodePacked(['string'], [provider.name])).slice(2, 10)}`;
      this.liquidityProviders.set(providerId, {
        providerId,
        address: `0x${providerId}...`,
        totalStaked: provider.staked,
        poolShare: (provider.staked / this.poolState.totalLiquidity) * 100,
        earnedFees: provider.staked * 0.0012, // ~0.12% fees earned
        apr: 8.5 + Math.random() * 4,
        markets: provider.markets,
        joinedAt: Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000,
      });
    }
  }

  private startPriceOracle(): void {
    // Simulate real-time price updates
    if (typeof setInterval !== 'undefined') {
      setInterval(() => {
        this.updateMarketPrices();
        this.detectArbitrageOpportunities();
      }, 5000);
    }
  }

  private updateMarketPrices(): void {
    for (const [market, snapshot] of this.marketSnapshots) {
      const config = MARKET_CONFIGS[market as keyof typeof MARKET_CONFIGS];
      const volatility = config.volatility;

      // Random walk with mean reversion
      const change = (Math.random() - 0.5) * volatility * snapshot.price * 0.01;
      const newPrice = snapshot.price + change;

      snapshot.price = Math.max(newPrice, snapshot.price * 0.8);
      snapshot.priceChange24h += change / snapshot.price * 100;
      snapshot.lastUpdate = Date.now();

      this.marketSnapshots.set(market, snapshot);
    }
  }

  private detectArbitrageOpportunities(): void {
    const markets = Array.from(this.marketSnapshots.keys());
    this.arbitrageOpportunities = [];

    for (const buyMarket of markets) {
      for (const sellMarket of markets) {
        if (buyMarket === sellMarket) continue;

        const buySnapshot = this.marketSnapshots.get(buyMarket)!;
        const sellSnapshot = this.marketSnapshots.get(sellMarket)!;

        const spread = ((sellSnapshot.price - buySnapshot.price) / buySnapshot.price) * 100;

        // Arbitrage opportunity if spread > 0.5% (accounting for fees)
        if (spread > 0.5) {
          this.arbitrageOpportunities.push({
            id: `ARB-${buyMarket}-${sellMarket}-${Date.now()}`,
            buyMarket,
            sellMarket,
            spread,
            potentialProfit: (sellSnapshot.price - buySnapshot.price) * (1 - this.poolState.feeRate * 2),
            maxVolume: Math.min(buySnapshot.liquidity, sellSnapshot.liquidity) * 0.1 / 1000, // 10% of liquidity, in MWh
            validUntil: Date.now() + 60000, // 1 minute
          });
        }
      }
    }

    // Sort by profit potential
    this.arbitrageOpportunities.sort((a, b) => b.potentialProfit - a.potentialProfit);
  }

  // ============================================================
  // CORE POOL OPERATIONS
  // ============================================================

  /**
   * Get optimal swap path between any two markets
   */
  findOptimalSwapPath(
    sourceMarket: string,
    targetMarket: string,
    amountKwh: number
  ): CrossMarketPath {
    const sourceSnapshot = this.marketSnapshots.get(sourceMarket);
    const targetSnapshot = this.marketSnapshots.get(targetMarket);

    if (!sourceSnapshot || !targetSnapshot) {
      throw new Error('Invalid market');
    }

    // Direct path
    const directRate = targetSnapshot.price / sourceSnapshot.price;
    const directFee = amountKwh * this.poolState.feeRate;

    // Check if routing through another market is better
    const markets = Array.from(this.marketSnapshots.keys());
    let bestPath: CrossMarketPath = {
      path: [sourceMarket, targetMarket],
      totalRate: directRate * (1 - this.poolState.feeRate),
      fees: directFee,
      estimatedTime: '~15 seconds',
      steps: [{
        from: sourceMarket,
        to: targetMarket,
        rate: directRate,
        fee: directFee,
      }],
    };

    // Try routing through intermediate markets
    for (const intermediate of markets) {
      if (intermediate === sourceMarket || intermediate === targetMarket) continue;

      const intermediateSnapshot = this.marketSnapshots.get(intermediate)!;

      const rate1 = intermediateSnapshot.price / sourceSnapshot.price;
      const rate2 = targetSnapshot.price / intermediateSnapshot.price;
      const totalRate = rate1 * rate2 * (1 - this.poolState.feeRate) * (1 - this.poolState.feeRate);

      if (totalRate > bestPath.totalRate) {
        bestPath = {
          path: [sourceMarket, intermediate, targetMarket],
          totalRate,
          fees: amountKwh * this.poolState.feeRate * 2,
          estimatedTime: '~30 seconds',
          steps: [
            { from: sourceMarket, to: intermediate, rate: rate1, fee: amountKwh * this.poolState.feeRate },
            { from: intermediate, to: targetMarket, rate: rate2, fee: amountKwh * rate1 * this.poolState.feeRate },
          ],
        };
      }
    }

    return bestPath;
  }

  /**
   * Execute pool swap
   */
  async executePoolSwap(
    sourceMarket: string,
    targetMarket: string,
    amountKwh: number,
    userAddress: string
  ): Promise<{
    swapId: string;
    path: CrossMarketPath;
    inputAmount: number;
    outputAmount: number;
    nxusdValue: number;
    executionPrice: number;
    timestamp: number;
  }> {
    const path = this.findOptimalSwapPath(sourceMarket, targetMarket, amountKwh);

    const outputAmount = amountKwh * path.totalRate;
    const targetSnapshot = this.marketSnapshots.get(targetMarket)!;
    const nxusdValue = outputAmount * targetSnapshot.price / 1000;

    const swapId = `SWAP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Update pool stats
    this.poolState.dailyVolume += amountKwh;
    this.poolState.weeklyVolume += amountKwh;

    // Distribute fees to LPs
    const totalFees = amountKwh * this.poolState.feeRate * targetSnapshot.price / 1000;
    for (const provider of this.liquidityProviders.values()) {
      provider.earnedFees += totalFees * (provider.poolShare / 100);
    }

    return {
      swapId,
      path,
      inputAmount: amountKwh,
      outputAmount,
      nxusdValue,
      executionPrice: path.totalRate,
      timestamp: Date.now(),
    };
  }

  /**
   * Add liquidity to pool
   */
  async addLiquidity(
    userAddress: string,
    market: string,
    amountKwh: number
  ): Promise<LiquidityProvider> {
    const providerId = `LP-${keccak256(encodePacked(['string', 'uint256'], [userAddress, BigInt(Date.now())])).slice(2, 10)}`;

    const snapshot = this.marketSnapshots.get(market);
    if (!snapshot) {
      throw new Error('Invalid market');
    }

    // Calculate pool share
    const poolShare = (amountKwh / this.poolState.totalLiquidity) * 100;

    const provider: LiquidityProvider = {
      providerId,
      address: userAddress,
      totalStaked: amountKwh,
      poolShare,
      earnedFees: 0,
      apr: 8.5 + Math.random() * 4,
      markets: [market],
      joinedAt: Date.now(),
    };

    // Update pool state
    this.poolState.totalLiquidity += amountKwh;
    this.poolState.totalValueLocked += amountKwh * snapshot.price / 1000;
    this.poolState.providers++;

    // Update market snapshot
    snapshot.liquidity += amountKwh;

    this.liquidityProviders.set(providerId, provider);
    this.marketSnapshots.set(market, snapshot);

    return provider;
  }

  // ============================================================
  // QUERY METHODS
  // ============================================================

  getPoolState(): PoolState {
    return { ...this.poolState };
  }

  getMarketSnapshots(): MarketSnapshot[] {
    return Array.from(this.marketSnapshots.values());
  }

  getMarketSnapshot(market: string): MarketSnapshot | undefined {
    return this.marketSnapshots.get(market);
  }

  getArbitrageOpportunities(): ArbitrageOpportunity[] {
    return this.arbitrageOpportunities.filter(o => o.validUntil > Date.now());
  }

  getLiquidityProviders(): LiquidityProvider[] {
    return Array.from(this.liquidityProviders.values());
  }

  getSwapQuote(
    sourceMarket: string,
    targetMarket: string,
    amountKwh: number
  ): {
    inputAmount: number;
    outputAmount: number;
    rate: number;
    fee: number;
    priceImpact: number;
    path: string[];
  } {
    const path = this.findOptimalSwapPath(sourceMarket, targetMarket, amountKwh);
    const outputAmount = amountKwh * path.totalRate;
    const targetSnapshot = this.marketSnapshots.get(targetMarket)!;

    // Calculate price impact based on amount vs liquidity
    const priceImpact = (amountKwh / targetSnapshot.liquidity) * 100 * 2;

    return {
      inputAmount: amountKwh,
      outputAmount,
      rate: path.totalRate,
      fee: path.fees,
      priceImpact: Math.min(priceImpact, 10),
      path: path.path,
    };
  }

  getPoolMetrics(): {
    tvl: number;
    volume24h: number;
    volume7d: number;
    fees24h: number;
    apr: number;
    utilization: number;
  } {
    return {
      tvl: this.poolState.totalValueLocked,
      volume24h: this.poolState.dailyVolume,
      volume7d: this.poolState.weeklyVolume,
      fees24h: this.poolState.dailyVolume * this.poolState.feeRate * 70 / 1000, // Average price
      apr: 10.5,
      utilization: this.poolState.utilizationRate,
    };
  }
}

// Singleton export
export const globalLiquidityPool = GlobalLiquidityPool.getInstance();
