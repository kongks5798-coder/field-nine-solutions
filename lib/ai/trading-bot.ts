/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 47: PROPHET AI AUTO-TRADING BOT
 * ═══════════════════════════════════════════════════════════════════════════════
 * CEO AUTO-MODE: 저점 매수, 고점 매도 - 완전 자율 수익 창출 엔진
 * "제국은 스스로 돈을 번다"
 */

import { ENERGY_SOURCES, EnergySourceType } from '@/lib/energy/sources';
import { analyzeSource, STAKING_POOLS } from './autotrader';

// ═══════════════════════════════════════════════════════════════════════════════
// AUTO-MODE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export type TradingMode = 'OFF' | 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE' | 'PROPHET_AI';

export interface AutoModeConfig {
  mode: TradingMode;
  isActive: boolean;
  maxDailyTrades: number;
  maxPositionSize: number;        // Max KAUS per trade
  riskTolerance: number;          // 0-100
  profitTarget: number;           // % daily target
  stopLossPercent: number;        // % max loss before stop
  preferRE100: boolean;           // Prefer RE100 certified sources
  enableHedging: boolean;         // Enable hedging strategies
  autoCompound: boolean;          // Auto-reinvest profits
  aiConfidenceThreshold: number;  // Min AI confidence to execute
}

export const MODE_PRESETS: Record<TradingMode, Partial<AutoModeConfig>> = {
  OFF: {
    isActive: false,
    maxDailyTrades: 0,
    maxPositionSize: 0,
    riskTolerance: 0,
    profitTarget: 0,
    stopLossPercent: 0,
    aiConfidenceThreshold: 1,
  },
  CONSERVATIVE: {
    isActive: true,
    maxDailyTrades: 10,
    maxPositionSize: 500,
    riskTolerance: 20,
    profitTarget: 2,
    stopLossPercent: 3,
    preferRE100: true,
    enableHedging: true,
    autoCompound: true,
    aiConfidenceThreshold: 0.8,
  },
  BALANCED: {
    isActive: true,
    maxDailyTrades: 30,
    maxPositionSize: 2000,
    riskTolerance: 50,
    profitTarget: 5,
    stopLossPercent: 7,
    preferRE100: true,
    enableHedging: true,
    autoCompound: true,
    aiConfidenceThreshold: 0.65,
  },
  AGGRESSIVE: {
    isActive: true,
    maxDailyTrades: 50,
    maxPositionSize: 5000,
    riskTolerance: 80,
    profitTarget: 10,
    stopLossPercent: 15,
    preferRE100: false,
    enableHedging: false,
    autoCompound: true,
    aiConfidenceThreshold: 0.5,
  },
  PROPHET_AI: {
    isActive: true,
    maxDailyTrades: 100,
    maxPositionSize: 10000,
    riskTolerance: 70,
    profitTarget: 15,
    stopLossPercent: 10,
    preferRE100: true,
    enableHedging: true,
    autoCompound: true,
    aiConfidenceThreshold: 0.6,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROPHET AI ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export interface ProphetSignal {
  sourceId: string;
  sourceType: EnergySourceType;
  action: 'BUY' | 'SELL' | 'HOLD';
  strength: 'STRONG' | 'MODERATE' | 'WEAK';
  confidence: number;
  reasoning: string[];
  priceTarget: number;
  stopLoss: number;
  expectedReturn: number;
  timeframe: 'IMMEDIATE' | 'SHORT' | 'MEDIUM';
  timestamp: string;
}

export interface ProphetPrediction {
  peakHour: number;
  peakPrice: number;
  troughHour: number;
  troughPrice: number;
  optimalBuyWindow: { start: number; end: number };
  optimalSellWindow: { start: number; end: number };
  expectedDailyProfit: number;
  confidence: number;
}

function getProphetPrediction(): ProphetPrediction {
  const hour = new Date().getHours();

  // Peak hours analysis
  const peakHour = hour < 12 ? 11 : 19;
  const troughHour = hour < 6 ? 4 : (hour < 14 ? 4 : 14);

  // Price predictions based on historical patterns
  const basePrice = 120; // KRW/kWh
  const peakPrice = basePrice * 1.35;
  const troughPrice = basePrice * 0.75;

  return {
    peakHour,
    peakPrice,
    troughHour,
    troughPrice,
    optimalBuyWindow: { start: 2, end: 6 },
    optimalSellWindow: { start: 18, end: 21 },
    expectedDailyProfit: (peakPrice - troughPrice) * 1000 * 0.85, // 85% efficiency
    confidence: 0.78 + Math.random() * 0.15,
  };
}

export function generateProphetSignals(): ProphetSignal[] {
  const signals: ProphetSignal[] = [];
  const prediction = getProphetPrediction();
  const hour = new Date().getHours();

  for (const [sourceId, source] of Object.entries(ENERGY_SOURCES)) {
    const analytics = analyzeSource(sourceId);

    // Determine action based on time and analytics
    let action: ProphetSignal['action'] = 'HOLD';
    let strength: ProphetSignal['strength'] = 'WEAK';
    const reasoning: string[] = [];

    // Check if in optimal buy window
    const inBuyWindow = hour >= prediction.optimalBuyWindow.start && hour <= prediction.optimalBuyWindow.end;
    const inSellWindow = hour >= prediction.optimalSellWindow.start && hour <= prediction.optimalSellWindow.end;

    if (inBuyWindow && analytics.currentPrice < analytics.movingAverage24h * 0.97) {
      action = 'BUY';
      strength = analytics.currentPrice < analytics.movingAverage24h * 0.95 ? 'STRONG' : 'MODERATE';
      reasoning.push(`Off-peak hour (${hour}:00) - optimal buy window`);
      reasoning.push(`Price ${((1 - analytics.currentPrice / analytics.movingAverage24h) * 100).toFixed(1)}% below 24h MA`);
    } else if (inSellWindow && analytics.currentPrice > analytics.movingAverage24h * 1.03) {
      action = 'SELL';
      strength = analytics.currentPrice > analytics.movingAverage24h * 1.05 ? 'STRONG' : 'MODERATE';
      reasoning.push(`Peak hour (${hour}:00) - optimal sell window`);
      reasoning.push(`Price ${((analytics.currentPrice / analytics.movingAverage24h - 1) * 100).toFixed(1)}% above 24h MA`);
    } else {
      reasoning.push('Market conditions not optimal');
      reasoning.push(`Waiting for price deviation from MA`);
    }

    // Source-specific reasoning
    if (source.type === 'SOLAR' && hour >= 10 && hour <= 14) {
      reasoning.push('Peak solar production hours');
    } else if (source.type === 'WIND' && analytics.volatility > 0.05) {
      reasoning.push(`High wind volatility (${(analytics.volatility * 100).toFixed(1)}%)`);
    }

    const priceTarget = action === 'BUY'
      ? analytics.currentPrice * 1.05
      : analytics.currentPrice * 0.95;

    const stopLoss = action === 'BUY'
      ? analytics.currentPrice * 0.92
      : analytics.currentPrice * 1.08;

    const expectedReturn = action === 'BUY'
      ? ((priceTarget - analytics.currentPrice) / analytics.currentPrice) * 100
      : action === 'SELL'
      ? ((analytics.currentPrice - stopLoss) / analytics.currentPrice) * 100
      : 0;

    signals.push({
      sourceId,
      sourceType: source.type,
      action,
      strength,
      confidence: analytics.confidence,
      reasoning,
      priceTarget,
      stopLoss,
      expectedReturn,
      timeframe: strength === 'STRONG' ? 'IMMEDIATE' : 'SHORT',
      timestamp: new Date().toISOString(),
    });
  }

  // Sort by confidence and strength
  return signals.sort((a, b) => {
    const strengthOrder = { STRONG: 3, MODERATE: 2, WEAK: 1 };
    const strengthDiff = strengthOrder[b.strength] - strengthOrder[a.strength];
    return strengthDiff !== 0 ? strengthDiff : b.confidence - a.confidence;
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRADING BOT STATE
// ═══════════════════════════════════════════════════════════════════════════════

export interface TradingBotState {
  config: AutoModeConfig;
  isRunning: boolean;
  startedAt: string | null;

  // Performance Metrics
  metrics: {
    todayTrades: number;
    todayProfit: number;
    todayProfitUSD: number;
    weeklyProfit: number;
    monthlyProfit: number;
    totalProfit: number;
    winRate: number;
    avgTradeSize: number;
    maxDrawdown: number;
    sharpeRatio: number;
  };

  // Active Positions
  positions: Map<string, {
    sourceId: string;
    amount: number;
    avgPrice: number;
    currentPrice: number;
    unrealizedPnL: number;
    entryTime: string;
  }>;

  // Trade History
  recentTrades: Array<{
    id: string;
    type: 'BUY' | 'SELL';
    sourceId: string;
    amount: number;
    price: number;
    total: number;
    profit?: number;
    aiReason: string;
    timestamp: string;
  }>;

  // Prophet Signals
  activeSignals: ProphetSignal[];
  prediction: ProphetPrediction;

  lastUpdate: string;
}

// Singleton state
let botState: TradingBotState = {
  config: {
    mode: 'BALANCED',
    isActive: false,
    maxDailyTrades: 30,
    maxPositionSize: 2000,
    riskTolerance: 50,
    profitTarget: 5,
    stopLossPercent: 7,
    preferRE100: true,
    enableHedging: true,
    autoCompound: true,
    aiConfidenceThreshold: 0.65,
  },
  isRunning: false,
  startedAt: null,
  metrics: {
    todayTrades: 0,
    todayProfit: 0,
    todayProfitUSD: 0,
    weeklyProfit: 0,
    monthlyProfit: 0,
    totalProfit: 0,
    winRate: 0.68,
    avgTradeSize: 1500,
    maxDrawdown: 2.3,
    sharpeRatio: 1.8,
  },
  positions: new Map(),
  recentTrades: [],
  activeSignals: [],
  prediction: getProphetPrediction(),
  lastUpdate: new Date().toISOString(),
};

// ═══════════════════════════════════════════════════════════════════════════════
// BOT CONTROL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function activateAutoMode(mode: TradingMode): TradingBotState {
  const preset = MODE_PRESETS[mode];

  botState.config = {
    ...botState.config,
    mode,
    ...preset,
  };

  if (mode !== 'OFF') {
    botState.isRunning = true;
    botState.startedAt = new Date().toISOString();
    console.log(`[PROPHET AI] 🤖 AUTO-MODE ACTIVATED: ${mode}`);
    console.log(`[PROPHET AI] Max Daily Trades: ${botState.config.maxDailyTrades}`);
    console.log(`[PROPHET AI] Risk Tolerance: ${botState.config.riskTolerance}%`);
    console.log(`[PROPHET AI] Profit Target: ${botState.config.profitTarget}%`);
  } else {
    botState.isRunning = false;
    botState.startedAt = null;
    console.log(`[PROPHET AI] ⏹️ AUTO-MODE DEACTIVATED`);
  }

  return getBotState();
}

export function deactivateAutoMode(): TradingBotState {
  return activateAutoMode('OFF');
}

export function getBotState(): TradingBotState {
  // Update signals and prediction
  botState.activeSignals = generateProphetSignals();
  botState.prediction = getProphetPrediction();

  // Simulate trading activity if running
  if (botState.isRunning) {
    simulateBotTrading();
  }

  botState.lastUpdate = new Date().toISOString();

  return {
    ...botState,
    positions: new Map(botState.positions),
  };
}

function simulateBotTrading() {
  const now = Date.now();
  const lastUpdate = new Date(botState.lastUpdate).getTime();

  // Only update every 15 seconds
  if (now - lastUpdate < 15000) return;

  // Check daily trade limit
  if (botState.metrics.todayTrades >= botState.config.maxDailyTrades) return;

  // Get strong signals
  const strongSignals = botState.activeSignals.filter(
    s => s.confidence >= botState.config.aiConfidenceThreshold &&
         s.strength !== 'WEAK' &&
         s.action !== 'HOLD'
  );

  for (const signal of strongSignals.slice(0, 2)) {
    // Random execution based on confidence
    if (Math.random() > signal.confidence) continue;

    const amount = Math.floor(500 + Math.random() * (botState.config.maxPositionSize - 500));
    const price = signal.action === 'BUY'
      ? analyzeSource(signal.sourceId).currentPrice
      : analyzeSource(signal.sourceId).currentPrice;

    const trade = {
      id: `PROPHET-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: signal.action as 'BUY' | 'SELL',
      sourceId: signal.sourceId,
      amount,
      price,
      total: amount * price,
      aiReason: signal.reasoning[0],
      timestamp: new Date().toISOString(),
    };

    // Calculate profit for sells
    if (signal.action === 'SELL') {
      const position = botState.positions.get(signal.sourceId);
      if (position) {
        const profit = (price - position.avgPrice) * Math.min(amount, position.amount);
        (trade as typeof trade & { profit: number }).profit = profit;
        botState.metrics.todayProfit += profit;
        botState.metrics.todayProfitUSD = botState.metrics.todayProfit * (120 / 1320);
        botState.metrics.totalProfit += profit;

        // Update position
        if (amount >= position.amount) {
          botState.positions.delete(signal.sourceId);
        } else {
          position.amount -= amount;
        }
      }
    } else {
      // Update position for buys
      const existing = botState.positions.get(signal.sourceId);
      if (existing) {
        const totalAmount = existing.amount + amount;
        existing.avgPrice = (existing.avgPrice * existing.amount + price * amount) / totalAmount;
        existing.amount = totalAmount;
        existing.currentPrice = price;
      } else {
        botState.positions.set(signal.sourceId, {
          sourceId: signal.sourceId,
          amount,
          avgPrice: price,
          currentPrice: price,
          unrealizedPnL: 0,
          entryTime: new Date().toISOString(),
        });
      }
    }

    // Add to trade history
    botState.recentTrades.unshift(trade);
    if (botState.recentTrades.length > 20) {
      botState.recentTrades = botState.recentTrades.slice(0, 20);
    }

    botState.metrics.todayTrades++;

    // Update win rate
    const wins = botState.recentTrades.filter(t => (t as typeof t & { profit?: number }).profit && (t as typeof t & { profit?: number }).profit! > 0).length;
    const sells = botState.recentTrades.filter(t => t.type === 'SELL').length;
    botState.metrics.winRate = sells > 0 ? wins / sells : 0.68;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFIT CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface ProfitProjection {
  daily: { kaus: number; usd: number; krw: number };
  weekly: { kaus: number; usd: number; krw: number };
  monthly: { kaus: number; usd: number; krw: number };
  yearly: { kaus: number; usd: number; krw: number };
  confidence: number;
}

export function getProfitProjection(mode: TradingMode): ProfitProjection {
  const preset = MODE_PRESETS[mode];
  if (!preset.isActive) {
    return {
      daily: { kaus: 0, usd: 0, krw: 0 },
      weekly: { kaus: 0, usd: 0, krw: 0 },
      monthly: { kaus: 0, usd: 0, krw: 0 },
      yearly: { kaus: 0, usd: 0, krw: 0 },
      confidence: 0,
    };
  }

  // Base daily profit based on mode
  const baseDailyKaus = preset.maxPositionSize! * preset.maxDailyTrades! * (preset.profitTarget! / 100) * 0.3;

  const daily = {
    kaus: Math.round(baseDailyKaus),
    usd: Math.round(baseDailyKaus * 120 / 1320 * 100) / 100,
    krw: Math.round(baseDailyKaus * 120),
  };

  return {
    daily,
    weekly: {
      kaus: daily.kaus * 7,
      usd: Math.round(daily.usd * 7 * 100) / 100,
      krw: daily.krw * 7,
    },
    monthly: {
      kaus: daily.kaus * 30,
      usd: Math.round(daily.usd * 30 * 100) / 100,
      krw: daily.krw * 30,
    },
    yearly: {
      kaus: daily.kaus * 365,
      usd: Math.round(daily.usd * 365 * 100) / 100,
      krw: daily.krw * 365,
    },
    confidence: 0.7 + (preset.riskTolerance! / 100) * 0.15,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { STAKING_POOLS };
