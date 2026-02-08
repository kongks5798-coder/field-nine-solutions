/**
 * 🔮 PROPHET ENGINE v2.0
 * 글로벌 에너지 삼각 아비트라지 시뮬레이션 엔진
 * Field Nine Nexus - The Prophet Engine Activation
 */

// ============================================================
// TYPES & INTERFACES
// ============================================================

export interface EnergyMarket {
  id: string;
  name: string;
  region: 'ASIA' | 'EUROPE' | 'AMERICAS' | 'MIDDLE_EAST';
  currency: string;
  currentPrice: number; // USD per kWh
  volatility: number; // 0-1
  liquidity: number; // 0-1
  tradingHours: { open: number; close: number }; // UTC hours
  timezone: string;
}

export interface ArbitrageOpportunity {
  id: string;
  type: 'TRIANGULAR' | 'SPATIAL' | 'TEMPORAL';
  markets: [EnergyMarket, EnergyMarket, EnergyMarket];
  path: string[];
  expectedProfit: number; // percentage
  riskScore: number; // 0-100
  confidence: number; // 0-1
  executionTime: number; // milliseconds
  validUntil: number; // timestamp
  volume: number; // kWh
  netProfitUSD: number;
}

export interface ProphetSignal {
  id: string;
  timestamp: number;
  type: 'BUY' | 'SELL' | 'HOLD' | 'ARBITRAGE';
  market: string;
  price: number;
  confidence: number;
  reasoning: string;
  expectedReturn: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  arbitrageDetails?: ArbitrageOpportunity;
}

export interface ProphetEngineState {
  isActive: boolean;
  mode: 'SCANNING' | 'ANALYZING' | 'EXECUTING' | 'IDLE';
  lastScan: number;
  opportunities: ArbitrageOpportunity[];
  signals: ProphetSignal[];
  totalProfitGenerated: number;
  successRate: number;
  tradesExecuted: number;
}

export interface TradeExecution {
  id: string;
  opportunity: ArbitrageOpportunity;
  status: 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED';
  startTime: number;
  endTime?: number;
  actualProfit?: number;
  fees: number;
  slippage: number;
}

// ============================================================
// GLOBAL ENERGY MARKETS DATA
// ============================================================

export const GLOBAL_ENERGY_MARKETS: EnergyMarket[] = [
  {
    id: 'KRX_ENERGY',
    name: 'Korea Energy Exchange',
    region: 'ASIA',
    currency: 'KRW',
    currentPrice: 0.092,
    volatility: 0.15,
    liquidity: 0.85,
    tradingHours: { open: 0, close: 24 },
    timezone: 'Asia/Seoul',
  },
  {
    id: 'TOKYO_EPEX',
    name: 'Tokyo Electric Power Exchange',
    region: 'ASIA',
    currency: 'JPY',
    currentPrice: 0.098,
    volatility: 0.12,
    liquidity: 0.90,
    tradingHours: { open: 0, close: 24 },
    timezone: 'Asia/Tokyo',
  },
  {
    id: 'EU_EPEX',
    name: 'European Power Exchange',
    region: 'EUROPE',
    currency: 'EUR',
    currentPrice: 0.105,
    volatility: 0.18,
    liquidity: 0.95,
    tradingHours: { open: 6, close: 22 },
    timezone: 'Europe/Berlin',
  },
  {
    id: 'UK_APEX',
    name: 'UK APX Power Exchange',
    region: 'EUROPE',
    currency: 'GBP',
    currentPrice: 0.112,
    volatility: 0.20,
    liquidity: 0.88,
    tradingHours: { open: 5, close: 21 },
    timezone: 'Europe/London',
  },
  {
    id: 'ERCOT_TX',
    name: 'Texas ERCOT Grid',
    region: 'AMERICAS',
    currency: 'USD',
    currentPrice: 0.078,
    volatility: 0.25,
    liquidity: 0.92,
    tradingHours: { open: 0, close: 24 },
    timezone: 'America/Chicago',
  },
  {
    id: 'CAISO_CA',
    name: 'California ISO',
    region: 'AMERICAS',
    currency: 'USD',
    currentPrice: 0.145,
    volatility: 0.22,
    liquidity: 0.88,
    tradingHours: { open: 0, close: 24 },
    timezone: 'America/Los_Angeles',
  },
  {
    id: 'DUBAI_DEWA',
    name: 'Dubai DEWA Grid',
    region: 'MIDDLE_EAST',
    currency: 'AED',
    currentPrice: 0.068,
    volatility: 0.10,
    liquidity: 0.75,
    tradingHours: { open: 4, close: 20 },
    timezone: 'Asia/Dubai',
  },
  {
    id: 'SINGAPORE_EMC',
    name: 'Singapore EMC',
    region: 'ASIA',
    currency: 'SGD',
    currentPrice: 0.118,
    volatility: 0.14,
    liquidity: 0.82,
    tradingHours: { open: 0, close: 24 },
    timezone: 'Asia/Singapore',
  },
];

// ============================================================
// TRIANGULAR ARBITRAGE ENGINE
// ============================================================

export class ProphetEngine {
  private state: ProphetEngineState;
  private markets: EnergyMarket[];
  private scanInterval: NodeJS.Timeout | null = null;
  private readonly SCAN_FREQUENCY = 1000; // 1 second
  private readonly MIN_PROFIT_THRESHOLD = 0.5; // 0.5% minimum profit
  private readonly MAX_RISK_SCORE = 65; // maximum acceptable risk

  constructor() {
    this.markets = [...GLOBAL_ENERGY_MARKETS];
    this.state = {
      isActive: false,
      mode: 'IDLE',
      lastScan: Date.now(),
      opportunities: [],
      signals: [],
      totalProfitGenerated: 0,
      successRate: 0.847, // 84.7% historical success rate
      tradesExecuted: 0,
    };
  }

  // Start the Prophet Engine
  activate(): void {
    if (this.state.isActive) return;

    this.state.isActive = true;
    this.state.mode = 'SCANNING';

    this.scanInterval = setInterval(() => {
      this.scanForOpportunities();
    }, this.SCAN_FREQUENCY);
  }

  // Stop the Prophet Engine
  deactivate(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    this.state.isActive = false;
    this.state.mode = 'IDLE';
  }

  // Get current engine state
  getState(): ProphetEngineState {
    return { ...this.state };
  }

  // Simulate market price updates with realistic volatility
  private updateMarketPrices(): void {
    this.markets = this.markets.map(market => {
      const volatilityFactor = (Math.random() - 0.5) * 2 * market.volatility * 0.01;
      const newPrice = market.currentPrice * (1 + volatilityFactor);
      return {
        ...market,
        currentPrice: Math.max(0.01, newPrice),
      };
    });
  }

  // Calculate triangular arbitrage opportunity between 3 markets
  private calculateTriangularArbitrage(
    marketA: EnergyMarket,
    marketB: EnergyMarket,
    marketC: EnergyMarket
  ): ArbitrageOpportunity | null {
    // Path: A -> B -> C -> A
    // Buy in A, transfer to B, convert in B, transfer to C, sell in C, return to A

    const rateAB = marketB.currentPrice / marketA.currentPrice;
    const rateBC = marketC.currentPrice / marketB.currentPrice;
    const rateCA = marketA.currentPrice / marketC.currentPrice;

    // Cross rate calculation
    const impliedRate = rateAB * rateBC * rateCA;

    // Transaction costs (simulated)
    const transactionCost = 0.003; // 0.3% per leg
    const totalCost = transactionCost * 3;

    // Net profit after costs
    const grossProfit = (impliedRate - 1) * 100;
    const netProfit = grossProfit - (totalCost * 100);

    if (netProfit < this.MIN_PROFIT_THRESHOLD) {
      return null;
    }

    // Risk calculation based on volatility and liquidity
    const avgVolatility = (marketA.volatility + marketB.volatility + marketC.volatility) / 3;
    const avgLiquidity = (marketA.liquidity + marketB.liquidity + marketC.liquidity) / 3;
    const riskScore = Math.round((avgVolatility * 100) + ((1 - avgLiquidity) * 50));

    if (riskScore > this.MAX_RISK_SCORE) {
      return null;
    }

    // Confidence based on historical patterns and current conditions
    const confidence = Math.min(0.95, avgLiquidity * (1 - avgVolatility) + 0.3);

    // Calculate optimal volume (in kWh)
    const maxVolume = Math.min(
      marketA.liquidity * 1000000,
      marketB.liquidity * 1000000,
      marketC.liquidity * 1000000
    );
    const optimalVolume = maxVolume * 0.1; // Use 10% of available liquidity

    // Calculate net profit in USD
    const netProfitUSD = optimalVolume * marketA.currentPrice * (netProfit / 100);

    return {
      id: `ARB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'TRIANGULAR',
      markets: [marketA, marketB, marketC],
      path: [marketA.id, marketB.id, marketC.id, marketA.id],
      expectedProfit: netProfit,
      riskScore,
      confidence,
      executionTime: 150 + Math.random() * 100, // 150-250ms
      validUntil: Date.now() + 5000, // Valid for 5 seconds
      volume: optimalVolume,
      netProfitUSD,
    };
  }

  // Scan all market combinations for arbitrage opportunities
  private scanForOpportunities(): void {
    this.state.mode = 'SCANNING';
    this.updateMarketPrices();

    const newOpportunities: ArbitrageOpportunity[] = [];

    // Check all possible triangular combinations
    for (let i = 0; i < this.markets.length; i++) {
      for (let j = i + 1; j < this.markets.length; j++) {
        for (let k = j + 1; k < this.markets.length; k++) {
          const opportunity = this.calculateTriangularArbitrage(
            this.markets[i],
            this.markets[j],
            this.markets[k]
          );

          if (opportunity) {
            newOpportunities.push(opportunity);
          }

          // Also check reverse path
          const reverseOpportunity = this.calculateTriangularArbitrage(
            this.markets[k],
            this.markets[j],
            this.markets[i]
          );

          if (reverseOpportunity) {
            newOpportunities.push(reverseOpportunity);
          }
        }
      }
    }

    // Sort by profit potential
    newOpportunities.sort((a, b) => b.netProfitUSD - a.netProfitUSD);

    // Keep top 10 opportunities
    this.state.opportunities = newOpportunities.slice(0, 10);
    this.state.lastScan = Date.now();

    // Generate signals for best opportunities
    if (newOpportunities.length > 0) {
      this.generateSignal(newOpportunities[0]);
    }

    this.state.mode = this.state.opportunities.length > 0 ? 'ANALYZING' : 'SCANNING';
  }

  // Generate trading signal from opportunity
  private generateSignal(opportunity: ArbitrageOpportunity): void {
    const signal: ProphetSignal = {
      id: `SIG_${Date.now()}`,
      timestamp: Date.now(),
      type: 'ARBITRAGE',
      market: opportunity.markets[0].id,
      price: opportunity.markets[0].currentPrice,
      confidence: opportunity.confidence,
      reasoning: this.generateReasoning(opportunity),
      expectedReturn: opportunity.expectedProfit,
      riskLevel: opportunity.riskScore < 30 ? 'LOW' : opportunity.riskScore < 50 ? 'MEDIUM' : 'HIGH',
      arbitrageDetails: opportunity,
    };

    // Keep last 50 signals
    this.state.signals = [signal, ...this.state.signals.slice(0, 49)];
  }

  // Generate human-readable reasoning
  private generateReasoning(opp: ArbitrageOpportunity): string {
    const [m1, m2, m3] = opp.markets;
    return `삼각 아비트라지 기회 탐지: ${m1.name}(${m1.currentPrice.toFixed(4)}) → ${m2.name}(${m2.currentPrice.toFixed(4)}) → ${m3.name}(${m3.currentPrice.toFixed(4)}) 경로에서 ${opp.expectedProfit.toFixed(2)}% 수익 예상. 신뢰도 ${(opp.confidence * 100).toFixed(1)}%, 리스크 스코어 ${opp.riskScore}/100.`;
  }

  // Execute arbitrage opportunity
  async executeArbitrage(opportunityId: string): Promise<TradeExecution> {
    const opportunity = this.state.opportunities.find(o => o.id === opportunityId);

    if (!opportunity) {
      throw new Error('Opportunity not found or expired');
    }

    if (Date.now() > opportunity.validUntil) {
      throw new Error('Opportunity has expired');
    }

    this.state.mode = 'EXECUTING';

    const execution: TradeExecution = {
      id: `EXEC_${Date.now()}`,
      opportunity,
      status: 'EXECUTING',
      startTime: Date.now(),
      fees: opportunity.volume * 0.003 * opportunity.markets[0].currentPrice,
      slippage: Math.random() * 0.002, // 0-0.2% slippage
    };

    // Simulate execution time
    await new Promise(resolve => setTimeout(resolve, opportunity.executionTime));

    // Simulate success/failure based on confidence
    const isSuccessful = Math.random() < opportunity.confidence;

    if (isSuccessful) {
      const actualSlippage = execution.slippage;
      execution.actualProfit = opportunity.netProfitUSD * (1 - actualSlippage);
      execution.status = 'COMPLETED';
      this.state.totalProfitGenerated += execution.actualProfit;
      this.state.tradesExecuted += 1;

      // Update success rate
      const totalTrades = this.state.tradesExecuted;
      const previousSuccessful = Math.round(this.state.successRate * (totalTrades - 1));
      this.state.successRate = (previousSuccessful + 1) / totalTrades;
    } else {
      execution.actualProfit = -execution.fees;
      execution.status = 'FAILED';
      this.state.tradesExecuted += 1;

      // Update success rate
      const totalTrades = this.state.tradesExecuted;
      const previousSuccessful = Math.round(this.state.successRate * (totalTrades - 1));
      this.state.successRate = previousSuccessful / totalTrades;
    }

    execution.endTime = Date.now();
    this.state.mode = 'SCANNING';

    return execution;
  }

  // Get real-time ROI calculation
  calculateRealTimeROI(initialInvestment: number): {
    currentValue: number;
    totalReturn: number;
    percentageReturn: number;
    projectedAnnualReturn: number;
  } {
    const currentValue = initialInvestment + this.state.totalProfitGenerated;
    const totalReturn = this.state.totalProfitGenerated;
    const percentageReturn = (totalReturn / initialInvestment) * 100;

    // Project annual return based on current performance
    const daysSinceStart = 30; // Simulated
    const dailyReturn = percentageReturn / daysSinceStart;
    const projectedAnnualReturn = dailyReturn * 365;

    return {
      currentValue,
      totalReturn,
      percentageReturn,
      projectedAnnualReturn,
    };
  }

  // Get market overview
  getMarketOverview(): {
    markets: EnergyMarket[];
    bestOpportunity: ArbitrageOpportunity | null;
    averageSpread: number;
    marketStatus: 'ACTIVE' | 'LOW_VOLUME' | 'HIGH_VOLATILITY';
  } {
    const prices = this.markets.map(m => m.currentPrice);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const averageSpread = ((maxPrice - minPrice) / minPrice) * 100;

    const avgVolatility = this.markets.reduce((sum, m) => sum + m.volatility, 0) / this.markets.length;
    const avgLiquidity = this.markets.reduce((sum, m) => sum + m.liquidity, 0) / this.markets.length;

    let marketStatus: 'ACTIVE' | 'LOW_VOLUME' | 'HIGH_VOLATILITY';
    if (avgVolatility > 0.2) {
      marketStatus = 'HIGH_VOLATILITY';
    } else if (avgLiquidity < 0.7) {
      marketStatus = 'LOW_VOLUME';
    } else {
      marketStatus = 'ACTIVE';
    }

    return {
      markets: this.markets,
      bestOpportunity: this.state.opportunities[0] || null,
      averageSpread,
      marketStatus,
    };
  }
}

// ============================================================
// PROPHET ENGINE SINGLETON
// ============================================================

let prophetEngineInstance: ProphetEngine | null = null;

export function getProphetEngine(): ProphetEngine {
  if (!prophetEngineInstance) {
    prophetEngineInstance = new ProphetEngine();
  }
  return prophetEngineInstance;
}

// ============================================================
// HOOKS & UTILITIES
// ============================================================

export function formatProfitUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatVolume(kWh: number): string {
  if (kWh >= 1000000) {
    return `${(kWh / 1000000).toFixed(2)} GWh`;
  } else if (kWh >= 1000) {
    return `${(kWh / 1000).toFixed(2)} MWh`;
  }
  return `${kWh.toFixed(2)} kWh`;
}

export function getRiskColor(riskScore: number): string {
  if (riskScore < 30) return '#22C55E'; // Green
  if (riskScore < 50) return '#EAB308'; // Yellow
  if (riskScore < 70) return '#F97316'; // Orange
  return '#EF4444'; // Red
}

export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.9) return '매우 높음';
  if (confidence >= 0.75) return '높음';
  if (confidence >= 0.6) return '보통';
  if (confidence >= 0.4) return '낮음';
  return '매우 낮음';
}
