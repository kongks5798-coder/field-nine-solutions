/**
 * 🔧 PROPHET WEB WORKER
 * Heavy computation offloading for UI thread optimization
 * Field Nine Nexus - Phase 52
 */

// ============================================================
// WORKER MESSAGE TYPES
// ============================================================

export type WorkerCommand =
  | 'CALCULATE_ARBITRAGE'
  | 'ANALYZE_MARKET'
  | 'PROCESS_TRADES'
  | 'COMPUTE_ROI'
  | 'SIMULATE_PORTFOLIO';

export interface WorkerMessage {
  id: string;
  command: WorkerCommand;
  payload: unknown;
}

export interface WorkerResponse {
  id: string;
  command: WorkerCommand;
  success: boolean;
  result?: unknown;
  error?: string;
  executionTime: number;
}

// ============================================================
// ARBITRAGE CALCULATION
// ============================================================

interface MarketData {
  id: string;
  price: number;
  volatility: number;
  liquidity: number;
}

interface ArbitrageResult {
  path: string[];
  profit: number;
  risk: number;
  confidence: number;
  volume: number;
}

function calculateTriangularArbitrage(markets: MarketData[]): ArbitrageResult[] {
  const results: ArbitrageResult[] = [];

  // Generate all possible triangular combinations
  for (let i = 0; i < markets.length; i++) {
    for (let j = i + 1; j < markets.length; j++) {
      for (let k = j + 1; k < markets.length; k++) {
        const [a, b, c] = [markets[i], markets[j], markets[k]];

        // Calculate cross rates
        const rateAB = b.price / a.price;
        const rateBC = c.price / b.price;
        const rateCA = a.price / c.price;

        const impliedRate = rateAB * rateBC * rateCA;
        const grossProfit = (impliedRate - 1) * 100;

        // Transaction costs
        const costs = 0.009; // 0.3% per leg * 3
        const netProfit = grossProfit - costs * 100;

        if (netProfit > 0.5) {
          const avgVolatility = (a.volatility + b.volatility + c.volatility) / 3;
          const avgLiquidity = (a.liquidity + b.liquidity + c.liquidity) / 3;

          results.push({
            path: [a.id, b.id, c.id, a.id],
            profit: netProfit,
            risk: avgVolatility * 100,
            confidence: avgLiquidity * (1 - avgVolatility) + 0.3,
            volume: Math.min(a.liquidity, b.liquidity, c.liquidity) * 100000,
          });
        }
      }
    }
  }

  return results.sort((a, b) => b.profit - a.profit);
}

// ============================================================
// MARKET ANALYSIS
// ============================================================

interface AnalysisResult {
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  strength: number;
  support: number;
  resistance: number;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  indicators: {
    rsi: number;
    macd: number;
    momentum: number;
  };
}

function analyzeMarket(priceHistory: number[]): AnalysisResult {
  if (priceHistory.length < 14) {
    return {
      trend: 'NEUTRAL',
      strength: 0,
      support: priceHistory[0] || 0,
      resistance: priceHistory[priceHistory.length - 1] || 0,
      recommendation: 'HOLD',
      indicators: { rsi: 50, macd: 0, momentum: 0 },
    };
  }

  // Calculate RSI
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < priceHistory.length; i++) {
    const change = priceHistory[i] - priceHistory[i - 1];
    if (change > 0) {
      gains.push(change);
      losses.push(0);
    } else {
      gains.push(0);
      losses.push(Math.abs(change));
    }
  }

  const avgGain = gains.slice(-14).reduce((a, b) => a + b, 0) / 14;
  const avgLoss = losses.slice(-14).reduce((a, b) => a + b, 0) / 14;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  // Calculate MACD (simplified)
  const ema12 = priceHistory.slice(-12).reduce((a, b) => a + b, 0) / 12;
  const ema26 = priceHistory.slice(-26).reduce((a, b) => a + b, 0) / Math.min(26, priceHistory.length);
  const macd = ema12 - ema26;

  // Calculate momentum
  const currentPrice = priceHistory[priceHistory.length - 1];
  const oldPrice = priceHistory[Math.max(0, priceHistory.length - 10)];
  const momentum = ((currentPrice - oldPrice) / oldPrice) * 100;

  // Determine trend
  let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  if (rsi > 60 && macd > 0) trend = 'BULLISH';
  if (rsi < 40 && macd < 0) trend = 'BEARISH';

  // Calculate support/resistance
  const sortedPrices = [...priceHistory].sort((a, b) => a - b);
  const support = sortedPrices[Math.floor(sortedPrices.length * 0.1)];
  const resistance = sortedPrices[Math.floor(sortedPrices.length * 0.9)];

  // Recommendation
  let recommendation: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  if (rsi < 30 && macd > 0) recommendation = 'BUY';
  if (rsi > 70 && macd < 0) recommendation = 'SELL';

  return {
    trend,
    strength: Math.abs(momentum),
    support,
    resistance,
    recommendation,
    indicators: { rsi, macd, momentum },
  };
}

// ============================================================
// ROI COMPUTATION
// ============================================================

interface ROIParams {
  initialInvestment: number;
  trades: { profit: number; timestamp: number }[];
  currentValue: number;
}

interface ROIResult {
  totalReturn: number;
  percentageReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
}

function computeROI(params: ROIParams): ROIResult {
  const { initialInvestment, trades, currentValue } = params;

  const totalReturn = currentValue - initialInvestment;
  const percentageReturn = (totalReturn / initialInvestment) * 100;

  // Calculate time period in years
  const firstTrade = trades[0]?.timestamp || Date.now();
  const lastTrade = trades[trades.length - 1]?.timestamp || Date.now();
  const yearsElapsed = Math.max(0.01, (lastTrade - firstTrade) / (365 * 24 * 60 * 60 * 1000));

  const annualizedReturn = (Math.pow(currentValue / initialInvestment, 1 / yearsElapsed) - 1) * 100;

  // Calculate win rate
  const wins = trades.filter(t => t.profit > 0).length;
  const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;

  // Calculate returns for Sharpe ratio
  const returns = trades.map(t => t.profit / initialInvestment);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / Math.max(1, returns.length);
  const stdDev = Math.sqrt(
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / Math.max(1, returns.length)
  );
  const sharpeRatio = stdDev > 0 ? (avgReturn - 0.02) / stdDev : 0; // Risk-free rate 2%

  // Calculate max drawdown
  let peak = initialInvestment;
  let maxDrawdown = 0;
  let runningValue = initialInvestment;

  for (const trade of trades) {
    runningValue += trade.profit;
    if (runningValue > peak) peak = runningValue;
    const drawdown = ((peak - runningValue) / peak) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  return {
    totalReturn,
    percentageReturn,
    annualizedReturn,
    sharpeRatio,
    maxDrawdown,
    winRate,
  };
}

// ============================================================
// PORTFOLIO SIMULATION
// ============================================================

interface SimulationParams {
  initialValue: number;
  duration: number; // days
  strategy: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
}

interface SimulationResult {
  finalValue: number;
  dailyValues: number[];
  maxValue: number;
  minValue: number;
  avgDailyReturn: number;
}

function simulatePortfolio(params: SimulationParams): SimulationResult {
  const { initialValue, duration, strategy } = params;

  const volatility = {
    CONSERVATIVE: 0.005,
    BALANCED: 0.015,
    AGGRESSIVE: 0.035,
  }[strategy];

  const expectedReturn = {
    CONSERVATIVE: 0.0002,
    BALANCED: 0.0005,
    AGGRESSIVE: 0.001,
  }[strategy];

  const dailyValues: number[] = [initialValue];
  let currentValue = initialValue;

  for (let i = 1; i <= duration; i++) {
    const randomReturn = (Math.random() - 0.5) * 2 * volatility;
    const dailyReturn = expectedReturn + randomReturn;
    currentValue = currentValue * (1 + dailyReturn);
    dailyValues.push(currentValue);
  }

  const returns = dailyValues.slice(1).map((v, i) => (v - dailyValues[i]) / dailyValues[i]);
  const avgDailyReturn = returns.reduce((a, b) => a + b, 0) / returns.length;

  return {
    finalValue: currentValue,
    dailyValues,
    maxValue: Math.max(...dailyValues),
    minValue: Math.min(...dailyValues),
    avgDailyReturn: avgDailyReturn * 100,
  };
}

// ============================================================
// WORKER MESSAGE HANDLER
// ============================================================

function handleMessage(message: WorkerMessage): WorkerResponse {
  const startTime = performance.now();

  try {
    let result: unknown;

    switch (message.command) {
      case 'CALCULATE_ARBITRAGE':
        result = calculateTriangularArbitrage(message.payload as MarketData[]);
        break;

      case 'ANALYZE_MARKET':
        result = analyzeMarket(message.payload as number[]);
        break;

      case 'COMPUTE_ROI':
        result = computeROI(message.payload as ROIParams);
        break;

      case 'SIMULATE_PORTFOLIO':
        result = simulatePortfolio(message.payload as SimulationParams);
        break;

      default:
        throw new Error(`Unknown command: ${message.command}`);
    }

    return {
      id: message.id,
      command: message.command,
      success: true,
      result,
      executionTime: performance.now() - startTime,
    };
  } catch (error) {
    return {
      id: message.id,
      command: message.command,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime: performance.now() - startTime,
    };
  }
}

// Worker context check
if (typeof self !== 'undefined' && typeof window === 'undefined') {
  self.onmessage = (event: MessageEvent<WorkerMessage>) => {
    const response = handleMessage(event.data);
    self.postMessage(response);
  };
}

export { handleMessage };
