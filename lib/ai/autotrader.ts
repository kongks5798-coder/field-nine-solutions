/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 47: AI AUTONOMOUS YIELD ENGINE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 저점 매수, 고점 매도 - 자율 수익 창출 기계
 * "제국은 스스로 돈을 벌기 시작한다"
 */

import { ENERGY_SOURCES, EnergySourceType } from '@/lib/energy/sources';

// ═══════════════════════════════════════════════════════════════════════════════
// TRADING CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface AutoTraderConfig {
  enabled: boolean;
  mode: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
  maxPositionSize: number;      // Max KAUS per trade
  buyThreshold: number;         // % below average to trigger buy
  sellThreshold: number;        // % above average to trigger sell
  stopLoss: number;             // % loss to exit position
  takeProfit: number;           // % gain to take profit
  preferredSources: EnergySourceType[];
  autoReinvest: boolean;
}

export const DEFAULT_CONFIG: AutoTraderConfig = {
  enabled: true,
  mode: 'BALANCED',
  maxPositionSize: 1000,
  buyThreshold: 0.03,           // Buy when 3% below average
  sellThreshold: 0.05,          // Sell when 5% above average
  stopLoss: 0.10,               // 10% stop loss
  takeProfit: 0.15,             // 15% take profit
  preferredSources: ['SOLAR', 'WIND', 'HYDRO'],  // RE100 preferred
  autoReinvest: true,
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRICE HISTORY & ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════

interface PricePoint {
  timestamp: number;
  price: number;
  volume: number;
}

interface SourceAnalytics {
  sourceId: string;
  currentPrice: number;
  movingAverage24h: number;
  movingAverage7d: number;
  volatility: number;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  confidence: number;
}

// Simulated price history cache
const priceHistoryCache: Map<string, PricePoint[]> = new Map();

function generatePriceHistory(sourceId: string): PricePoint[] {
  const source = ENERGY_SOURCES[sourceId];
  if (!source) return [];

  const cached = priceHistoryCache.get(sourceId);
  if (cached && cached.length > 0) {
    const lastPoint = cached[cached.length - 1];
    if (Date.now() - lastPoint.timestamp < 60000) {
      return cached;
    }
  }

  const basePrice = source.pricing.kausPrice;
  const history: PricePoint[] = [];
  const now = Date.now();

  // Generate 24 hours of price data
  for (let i = 288; i >= 0; i--) {
    const timestamp = now - i * 5 * 60 * 1000; // 5 min intervals
    const hour = new Date(timestamp).getHours();

    // Time-based variation
    let timeFactor = 1;
    if (source.type === 'SOLAR') {
      timeFactor = hour >= 6 && hour <= 18
        ? 1 + Math.sin((hour - 6) / 12 * Math.PI) * 0.1
        : 0.9;
    } else if (source.type === 'WIND') {
      timeFactor = 1 + Math.sin(hour / 12 * Math.PI) * 0.08;
    }

    // Random walk
    const noise = (Math.random() - 0.5) * 0.04;
    const price = basePrice * timeFactor * (1 + noise);
    const volume = Math.floor(10000 + Math.random() * 50000);

    history.push({ timestamp, price, volume });
  }

  priceHistoryCache.set(sourceId, history);
  return history;
}

function calculateMovingAverage(prices: number[], period: number): number {
  if (prices.length < period) return prices.reduce((a, b) => a + b, 0) / prices.length;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / prices.length;
  return Math.sqrt(variance) / avg;
}

export function analyzeSource(sourceId: string): SourceAnalytics {
  const source = ENERGY_SOURCES[sourceId];
  const history = generatePriceHistory(sourceId);
  const prices = history.map(p => p.price);

  const currentPrice = prices[prices.length - 1] || source.pricing.kausPrice;
  const ma24h = calculateMovingAverage(prices, 288); // 24h
  const ma7d = calculateMovingAverage(prices, 288 * 7); // 7d (simulated)
  const volatility = calculateVolatility(prices);

  // Determine trend
  let trend: SourceAnalytics['trend'] = 'NEUTRAL';
  if (currentPrice > ma24h * 1.02) trend = 'BULLISH';
  else if (currentPrice < ma24h * 0.98) trend = 'BEARISH';

  // Generate signal
  let signal: SourceAnalytics['signal'] = 'HOLD';
  let confidence = 0.5;

  const deviation = (currentPrice - ma24h) / ma24h;

  if (deviation < -0.05) {
    signal = 'STRONG_BUY';
    confidence = 0.85;
  } else if (deviation < -0.02) {
    signal = 'BUY';
    confidence = 0.7;
  } else if (deviation > 0.05) {
    signal = 'STRONG_SELL';
    confidence = 0.85;
  } else if (deviation > 0.02) {
    signal = 'SELL';
    confidence = 0.7;
  }

  // Adjust for volatility
  if (volatility > 0.1) confidence *= 0.8;

  return {
    sourceId,
    currentPrice,
    movingAverage24h: ma24h,
    movingAverage7d: ma7d,
    volatility,
    trend,
    signal,
    confidence,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTO TRADER ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export interface TradeOrder {
  id: string;
  type: 'BUY' | 'SELL';
  sourceId: string;
  amount: number;          // kWh
  price: number;           // KAUS per kWh
  total: number;           // Total KAUS
  timestamp: string;
  status: 'PENDING' | 'EXECUTED' | 'FAILED';
  profit?: number;
  aiReason: string;
}

export interface AutoTraderState {
  isActive: boolean;
  todayTrades: number;
  todayProfit: number;
  todayProfitUSD: number;
  totalProfit: number;
  winRate: number;
  currentPositions: Map<string, { amount: number; avgPrice: number }>;
  recentOrders: TradeOrder[];
  lastUpdate: string;
}

// Singleton state
let traderState: AutoTraderState = {
  isActive: true,
  todayTrades: 0,
  todayProfit: 0,
  todayProfitUSD: 0,
  totalProfit: 0,
  winRate: 0,
  currentPositions: new Map(),
  recentOrders: [],
  lastUpdate: new Date().toISOString(),
};

// KAUS to USD conversion (120 KRW per KAUS, ~1320 KRW per USD)
const KAUS_TO_USD = 120 / 1320;

export function getAutoTraderState(): AutoTraderState {
  // Simulate trading activity
  simulateTrading();
  return { ...traderState };
}

function simulateTrading() {
  const now = Date.now();
  const lastUpdate = new Date(traderState.lastUpdate).getTime();

  // Only update every 10 seconds
  if (now - lastUpdate < 10000) return;

  const config = DEFAULT_CONFIG;
  if (!config.enabled) return;

  // Analyze all preferred sources
  for (const sourceType of config.preferredSources) {
    const sourceId = Object.keys(ENERGY_SOURCES).find(
      id => ENERGY_SOURCES[id].type === sourceType
    );
    if (!sourceId) continue;

    const analytics = analyzeSource(sourceId);

    // Execute trades based on signals
    if (analytics.signal === 'STRONG_BUY' || analytics.signal === 'BUY') {
      executeTrade('BUY', sourceId, analytics, config);
    } else if (analytics.signal === 'STRONG_SELL' || analytics.signal === 'SELL') {
      executeTrade('SELL', sourceId, analytics, config);
    }
  }

  // Update state
  traderState.lastUpdate = new Date().toISOString();
}

function executeTrade(
  type: 'BUY' | 'SELL',
  sourceId: string,
  analytics: SourceAnalytics,
  config: AutoTraderConfig
) {
  const source = ENERGY_SOURCES[sourceId];

  // Random amount based on config
  const amount = Math.floor(1000 + Math.random() * 4000);
  const total = amount * analytics.currentPrice;

  // Limit daily trades
  if (traderState.todayTrades >= 50) return;

  // Create order
  const order: TradeOrder = {
    id: `AI-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type,
    sourceId,
    amount,
    price: analytics.currentPrice,
    total,
    timestamp: new Date().toISOString(),
    status: 'EXECUTED',
    aiReason: type === 'BUY'
      ? `${source.type} price ${((analytics.movingAverage24h - analytics.currentPrice) / analytics.movingAverage24h * 100).toFixed(1)}% below MA24h`
      : `${source.type} price ${((analytics.currentPrice - analytics.movingAverage24h) / analytics.movingAverage24h * 100).toFixed(1)}% above MA24h`,
  };

  // Calculate profit for sells
  if (type === 'SELL') {
    const position = traderState.currentPositions.get(sourceId);
    if (position) {
      const profit = (analytics.currentPrice - position.avgPrice) * Math.min(amount, position.amount);
      order.profit = profit;
      traderState.todayProfit += profit;
      traderState.todayProfitUSD = traderState.todayProfit * KAUS_TO_USD;
      traderState.totalProfit += profit;

      // Update position
      if (amount >= position.amount) {
        traderState.currentPositions.delete(sourceId);
      } else {
        position.amount -= amount;
      }
    }
  } else {
    // Update position for buys
    const existing = traderState.currentPositions.get(sourceId);
    if (existing) {
      const totalAmount = existing.amount + amount;
      const newAvg = (existing.avgPrice * existing.amount + analytics.currentPrice * amount) / totalAmount;
      traderState.currentPositions.set(sourceId, { amount: totalAmount, avgPrice: newAvg });
    } else {
      traderState.currentPositions.set(sourceId, { amount, avgPrice: analytics.currentPrice });
    }
  }

  // Add to recent orders
  traderState.recentOrders.unshift(order);
  if (traderState.recentOrders.length > 10) {
    traderState.recentOrders = traderState.recentOrders.slice(0, 10);
  }

  traderState.todayTrades++;

  // Calculate win rate
  const wins = traderState.recentOrders.filter(o => (o.profit || 0) > 0).length;
  const sells = traderState.recentOrders.filter(o => o.type === 'SELL').length;
  traderState.winRate = sells > 0 ? wins / sells : 0.65;
}

// ═══════════════════════════════════════════════════════════════════════════════
// YIELD FARMING / STAKING
// ═══════════════════════════════════════════════════════════════════════════════

export interface StakingPool {
  id: string;
  name: string;
  asset: string;
  assetIcon: string;
  apy: number;
  tvl: number;              // Total Value Locked (KAUS)
  minStake: number;
  lockPeriod: number;       // Days
  rewardSource: string;
  isActive: boolean;
}

export const STAKING_POOLS: StakingPool[] = [
  {
    id: 'yeongdong-solar',
    name: 'Yeongdong Solar Yield',
    asset: 'KAUS',
    assetIcon: '☀️',
    apy: 12.5,
    tvl: 2500000,
    minStake: 100,
    lockPeriod: 30,
    rewardSource: '영동 태양광 발전 수익',
    isActive: true,
  },
  {
    id: 'jeju-wind',
    name: 'Jeju Wind Power',
    asset: 'KAUS',
    assetIcon: '💨',
    apy: 9.8,
    tvl: 1800000,
    minStake: 100,
    lockPeriod: 14,
    rewardSource: '제주 풍력 발전 수익',
    isActive: true,
  },
  {
    id: 'hydro-stable',
    name: 'Hydro Stable Yield',
    asset: 'KAUS',
    assetIcon: '💧',
    apy: 7.2,
    tvl: 3200000,
    minStake: 50,
    lockPeriod: 7,
    rewardSource: '충주 수력 발전 수익',
    isActive: true,
  },
  {
    id: 'sovereign-flex',
    name: 'Sovereign Flex',
    asset: 'KAUS',
    assetIcon: '👑',
    apy: 15.0,
    tvl: 800000,
    minStake: 500,
    lockPeriod: 90,
    rewardSource: '전체 에너지 자산 수익',
    isActive: true,
  },
];

export interface UserStake {
  poolId: string;
  amount: number;
  stakedAt: string;
  unlockAt: string;
  earnedRewards: number;
  estimatedApy: number;
}

export function calculateStakingRewards(
  amount: number,
  apy: number,
  daysStaked: number
): number {
  const dailyRate = apy / 100 / 365;
  return amount * dailyRate * daysStaked;
}

export function getYieldProjection(
  amount: number,
  pool: StakingPool
): { daily: number; weekly: number; monthly: number; yearly: number } {
  const dailyRate = pool.apy / 100 / 365;
  const daily = amount * dailyRate;

  return {
    daily,
    weekly: daily * 7,
    monthly: daily * 30,
    yearly: amount * (pool.apy / 100),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ASSET VALUE TRACKING
// ═══════════════════════════════════════════════════════════════════════════════

export interface AssetValuation {
  assetId: string;
  name: string;
  currentValue: number;      // USD
  previousValue: number;     // USD
  change24h: number;         // %
  change7d: number;          // %
  change30d: number;         // %
  historicalValues: Array<{ timestamp: number; value: number }>;
  lastUpdate: string;
}

export function getYeongdongAssetValuation(): AssetValuation {
  // Base land value: 100,000 pyung * $1,000 per pyung = $100M base
  const baseValue = 100000000;

  // Solar installation adds value
  const solarValue = 50000000; // 50MW installation

  // Generate historical values with growth trend
  const history: Array<{ timestamp: number; value: number }> = [];
  const now = Date.now();

  for (let i = 30; i >= 0; i--) {
    const timestamp = now - i * 24 * 60 * 60 * 1000;
    const dayProgress = (30 - i) / 30;
    const growth = 1 + dayProgress * 0.05; // 5% monthly growth trend
    const noise = 1 + (Math.random() - 0.5) * 0.02;
    const value = (baseValue + solarValue) * growth * noise;
    history.push({ timestamp, value });
  }

  const currentValue = history[history.length - 1].value;
  const value24hAgo = history[history.length - 2]?.value || currentValue;
  const value7dAgo = history[history.length - 8]?.value || currentValue;
  const value30dAgo = history[0]?.value || currentValue;

  return {
    assetId: 'yeongdong-land-100k',
    name: '영동 태양광 부지',
    currentValue,
    previousValue: value24hAgo,
    change24h: ((currentValue - value24hAgo) / value24hAgo) * 100,
    change7d: ((currentValue - value7dAgo) / value7dAgo) * 100,
    change30d: ((currentValue - value30dAgo) / value30dAgo) * 100,
    historicalValues: history,
    lastUpdate: new Date().toISOString(),
  };
}
