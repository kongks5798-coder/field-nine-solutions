/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 48: ELITE PORTFOLIO INTELLIGENCE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 실시간 P&L 추적 + AI 리스크 분석 + 성과 리더보드
 * "제국의 부는 실시간으로 증명된다"
 */

import { ENERGY_SOURCES, EnergySourceType } from '@/lib/energy/sources';
import { STAKING_POOLS } from './autotrader';

// ═══════════════════════════════════════════════════════════════════════════════
// PORTFOLIO TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface PortfolioAsset {
  id: string;
  type: 'ENERGY' | 'STAKING' | 'KAUS' | 'RWA';
  name: string;
  symbol: string;
  icon: string;
  amount: number;
  avgCost: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPercent: number;
  allocation: number;       // % of portfolio
  color: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalValueUSD: number;
  totalCost: number;
  totalPnL: number;
  totalPnLPercent: number;
  dayChange: number;
  dayChangePercent: number;
  weekChange: number;
  weekChangePercent: number;
  monthChange: number;
  monthChangePercent: number;
  allTimeHigh: number;
  allTimeLow: number;
  lastUpdated: string;
}

export interface PortfolioHistory {
  timestamp: number;
  value: number;
  pnl: number;
}

export interface RiskMetrics {
  riskScore: number;           // 0-100
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  volatility: number;          // % annualized
  sharpeRatio: number;
  maxDrawdown: number;         // %
  beta: number;
  correlations: Record<string, number>;
  diversificationScore: number; // 0-100
  recommendations: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK PORTFOLIO DATA
// ═══════════════════════════════════════════════════════════════════════════════

const KAUS_TO_USD = 120 / 1320;
const KAUS_TO_KRW = 120;

function generatePortfolioAssets(): PortfolioAsset[] {
  const assets: PortfolioAsset[] = [];

  // KAUS Holdings
  const kausAmount = 125000 + Math.random() * 25000;
  const kausPrice = 1 + (Math.random() - 0.5) * 0.1;
  assets.push({
    id: 'kaus-main',
    type: 'KAUS',
    name: 'KAUS Coin',
    symbol: 'KAUS',
    icon: '👑',
    amount: Math.round(kausAmount),
    avgCost: 0.95,
    currentPrice: kausPrice,
    value: kausAmount * kausPrice,
    pnl: kausAmount * (kausPrice - 0.95),
    pnlPercent: ((kausPrice - 0.95) / 0.95) * 100,
    allocation: 0,
    color: '#f59e0b',
  });

  // Energy Holdings
  const energyTypes: Array<{ sourceId: string; amount: number }> = [
    { sourceId: 'F9-SOLAR-001', amount: 50000 + Math.random() * 20000 },
    { sourceId: 'F9-WIND-001', amount: 80000 + Math.random() * 30000 },
    { sourceId: 'F9-HYDRO-001', amount: 30000 + Math.random() * 15000 },
  ];

  for (const { sourceId, amount } of energyTypes) {
    const source = ENERGY_SOURCES[sourceId];
    if (!source) continue;

    const currentPrice = source.pricing.kausPrice * (1 + (Math.random() - 0.5) * 0.1);
    const avgCost = source.pricing.kausPrice * 0.92;

    assets.push({
      id: sourceId,
      type: 'ENERGY',
      name: source.nameKo,
      symbol: source.type,
      icon: source.metadata.icon,
      amount: Math.round(amount),
      avgCost,
      currentPrice,
      value: amount * currentPrice,
      pnl: amount * (currentPrice - avgCost),
      pnlPercent: ((currentPrice - avgCost) / avgCost) * 100,
      allocation: 0,
      color: source.metadata.color,
    });
  }

  // Staking Holdings
  for (const pool of STAKING_POOLS.slice(0, 2)) {
    const amount = 5000 + Math.random() * 10000;
    const earned = amount * (pool.apy / 100 / 365) * (7 + Math.random() * 23); // 7-30 days

    assets.push({
      id: `staking-${pool.id}`,
      type: 'STAKING',
      name: pool.name,
      symbol: 'KAUS',
      icon: pool.assetIcon,
      amount: Math.round(amount),
      avgCost: 1,
      currentPrice: 1,
      value: amount + earned,
      pnl: earned,
      pnlPercent: (earned / amount) * 100,
      allocation: 0,
      color: '#10b981',
    });
  }

  // RWA Holdings
  assets.push({
    id: 'yeongdong-share',
    type: 'RWA',
    name: '영동 태양광 지분',
    symbol: 'YD-RWA',
    icon: '🏛️',
    amount: 10,
    avgCost: 10000,
    currentPrice: 11500,
    value: 10 * 11500,
    pnl: 10 * (11500 - 10000),
    pnlPercent: 15,
    allocation: 0,
    color: '#8b5cf6',
  });

  // Calculate allocations
  const totalValue = assets.reduce((sum, a) => sum + a.value, 0);
  for (const asset of assets) {
    asset.allocation = (asset.value / totalValue) * 100;
  }

  return assets;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PORTFOLIO ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════

let cachedPortfolio: {
  assets: PortfolioAsset[];
  summary: PortfolioSummary;
  history: PortfolioHistory[];
  timestamp: number;
} | null = null;

export function getPortfolioData(): {
  assets: PortfolioAsset[];
  summary: PortfolioSummary;
  history: PortfolioHistory[];
} {
  const now = Date.now();

  // Cache for 10 seconds
  if (cachedPortfolio && now - cachedPortfolio.timestamp < 10000) {
    return {
      assets: cachedPortfolio.assets,
      summary: cachedPortfolio.summary,
      history: cachedPortfolio.history,
    };
  }

  const assets = generatePortfolioAssets();

  const totalValue = assets.reduce((sum, a) => sum + a.value, 0);
  const totalCost = assets.reduce((sum, a) => sum + a.amount * a.avgCost, 0);
  const totalPnL = totalValue - totalCost;

  // Generate history
  const history: PortfolioHistory[] = [];
  for (let i = 30; i >= 0; i--) {
    const timestamp = now - i * 24 * 60 * 60 * 1000;
    const dayProgress = (30 - i) / 30;
    const growth = 1 + dayProgress * 0.08; // 8% monthly growth
    const noise = 1 + (Math.random() - 0.5) * 0.04;
    const value = totalCost * growth * noise;
    history.push({
      timestamp,
      value,
      pnl: value - totalCost,
    });
  }

  // Override last value with current
  history[history.length - 1] = { timestamp: now, value: totalValue, pnl: totalPnL };

  const dayAgo = history[history.length - 2]?.value || totalValue;
  const weekAgo = history[history.length - 8]?.value || totalValue;
  const monthAgo = history[0]?.value || totalValue;

  const summary: PortfolioSummary = {
    totalValue,
    totalValueUSD: totalValue * KAUS_TO_USD,
    totalCost,
    totalPnL,
    totalPnLPercent: (totalPnL / totalCost) * 100,
    dayChange: totalValue - dayAgo,
    dayChangePercent: ((totalValue - dayAgo) / dayAgo) * 100,
    weekChange: totalValue - weekAgo,
    weekChangePercent: ((totalValue - weekAgo) / weekAgo) * 100,
    monthChange: totalValue - monthAgo,
    monthChangePercent: ((totalValue - monthAgo) / monthAgo) * 100,
    allTimeHigh: Math.max(...history.map(h => h.value)),
    allTimeLow: Math.min(...history.map(h => h.value)),
    lastUpdated: new Date().toISOString(),
  };

  cachedPortfolio = { assets, summary, history, timestamp: now };

  return { assets, summary, history };
}

// ═══════════════════════════════════════════════════════════════════════════════
// RISK ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════

export function calculateRiskMetrics(): RiskMetrics {
  const { assets, history } = getPortfolioData();

  // Calculate volatility from history
  const returns: number[] = [];
  for (let i = 1; i < history.length; i++) {
    returns.push((history[i].value - history[i - 1].value) / history[i - 1].value);
  }

  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const dailyVolatility = Math.sqrt(variance);
  const annualizedVolatility = dailyVolatility * Math.sqrt(365) * 100;

  // Sharpe Ratio (assuming 5% risk-free rate)
  const annualizedReturn = avgReturn * 365 * 100;
  const riskFreeRate = 5;
  const sharpeRatio = (annualizedReturn - riskFreeRate) / annualizedVolatility;

  // Max Drawdown
  let maxDrawdown = 0;
  let peak = history[0].value;
  for (const point of history) {
    if (point.value > peak) peak = point.value;
    const drawdown = (peak - point.value) / peak;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  // Diversification Score
  const allocations = assets.map(a => a.allocation / 100);
  const hhi = allocations.reduce((sum, a) => sum + a * a, 0); // Herfindahl-Hirschman Index
  const diversificationScore = Math.round((1 - hhi) * 100);

  // Risk Score
  const volatilityScore = Math.min(40, annualizedVolatility);
  const drawdownScore = maxDrawdown * 100 * 0.5;
  const concentrationScore = hhi * 30;
  const riskScore = Math.round(volatilityScore + drawdownScore + concentrationScore);

  let riskLevel: RiskMetrics['riskLevel'] = 'LOW';
  if (riskScore > 70) riskLevel = 'EXTREME';
  else if (riskScore > 50) riskLevel = 'HIGH';
  else if (riskScore > 30) riskLevel = 'MODERATE';

  // Recommendations
  const recommendations: string[] = [];
  if (diversificationScore < 50) {
    recommendations.push('포트폴리오 분산도가 낮습니다. 다양한 에너지원에 분산 투자를 고려하세요.');
  }
  if (annualizedVolatility > 30) {
    recommendations.push('변동성이 높습니다. 안정적인 수력/원자력 비중 확대를 고려하세요.');
  }
  if (maxDrawdown > 0.1) {
    recommendations.push('최대 손실률이 10%를 초과합니다. Stop-loss 설정을 권장합니다.');
  }
  const stakingAllocation = assets.filter(a => a.type === 'STAKING').reduce((sum, a) => sum + a.allocation, 0);
  if (stakingAllocation < 20) {
    recommendations.push('스테이킹 비중이 낮습니다. 안정적인 이자 수익을 위해 스테이킹 확대를 고려하세요.');
  }

  if (recommendations.length === 0) {
    recommendations.push('포트폴리오가 잘 분산되어 있습니다. 현재 전략을 유지하세요.');
  }

  return {
    riskScore,
    riskLevel,
    volatility: Math.round(annualizedVolatility * 10) / 10,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 1000) / 10,
    beta: 0.85 + Math.random() * 0.3,
    correlations: {
      'BTC': 0.35 + Math.random() * 0.2,
      'ETH': 0.42 + Math.random() * 0.2,
      'KOSPI': 0.28 + Math.random() * 0.15,
    },
    diversificationScore,
    recommendations,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALERT SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export type AlertType = 'PRICE' | 'PNL' | 'RISK' | 'OPPORTUNITY' | 'SYSTEM';
export type AlertPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Alert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  asset?: string;
  value?: number;
  threshold?: number;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

export interface AlertRule {
  id: string;
  type: AlertType;
  asset: string;
  condition: 'ABOVE' | 'BELOW' | 'CHANGE_PERCENT';
  threshold: number;
  isActive: boolean;
  createdAt: string;
}

let activeAlerts: Alert[] = [];

export function generateAlerts(): Alert[] {
  const { assets, summary } = getPortfolioData();
  const risk = calculateRiskMetrics();
  const now = new Date();

  const newAlerts: Alert[] = [];

  // Price Movement Alerts
  for (const asset of assets) {
    if (Math.abs(asset.pnlPercent) > 5) {
      newAlerts.push({
        id: `price-${asset.id}-${Date.now()}`,
        type: 'PRICE',
        priority: Math.abs(asset.pnlPercent) > 10 ? 'HIGH' : 'MEDIUM',
        title: `${asset.symbol} ${asset.pnlPercent > 0 ? '급등' : '급락'}`,
        message: `${asset.name}이 ${Math.abs(asset.pnlPercent).toFixed(1)}% ${asset.pnlPercent > 0 ? '상승' : '하락'}했습니다.`,
        asset: asset.id,
        value: asset.currentPrice,
        timestamp: now.toISOString(),
        isRead: false,
        actionUrl: '/ko/nexus/exchange',
      });
    }
  }

  // P&L Alerts
  if (summary.dayChangePercent > 3) {
    newAlerts.push({
      id: `pnl-day-${Date.now()}`,
      type: 'PNL',
      priority: 'MEDIUM',
      title: '일일 수익 목표 달성',
      message: `오늘 포트폴리오가 ${summary.dayChangePercent.toFixed(1)}% 상승했습니다. 이익 실현을 고려하세요.`,
      value: summary.dayChange,
      timestamp: now.toISOString(),
      isRead: false,
    });
  }

  // Risk Alerts
  if (risk.riskLevel === 'HIGH' || risk.riskLevel === 'EXTREME') {
    newAlerts.push({
      id: `risk-${Date.now()}`,
      type: 'RISK',
      priority: 'HIGH',
      title: '리스크 경고',
      message: `포트폴리오 리스크가 ${risk.riskLevel} 수준입니다. ${risk.recommendations[0]}`,
      value: risk.riskScore,
      timestamp: now.toISOString(),
      isRead: false,
      actionUrl: '/ko/nexus/assets',
    });
  }

  // Opportunity Alerts
  const lowPriceAssets = assets.filter(a => a.pnlPercent < -3 && a.type === 'ENERGY');
  if (lowPriceAssets.length > 0) {
    const asset = lowPriceAssets[0];
    newAlerts.push({
      id: `opportunity-${Date.now()}`,
      type: 'OPPORTUNITY',
      priority: 'LOW',
      title: '매수 기회 포착',
      message: `${asset.name}이 평균 대비 ${Math.abs(asset.pnlPercent).toFixed(1)}% 하락했습니다. 추가 매수를 고려하세요.`,
      asset: asset.id,
      timestamp: now.toISOString(),
      isRead: false,
      actionUrl: '/ko/nexus/exchange',
    });
  }

  // Combine with existing and limit
  activeAlerts = [...newAlerts, ...activeAlerts].slice(0, 20);

  return activeAlerts;
}

export function getAlerts(): Alert[] {
  if (activeAlerts.length === 0) {
    return generateAlerts();
  }
  return activeAlerts;
}

export function markAlertAsRead(alertId: string): void {
  const alert = activeAlerts.find(a => a.id === alertId);
  if (alert) {
    alert.isRead = true;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════════════════════════════════════════

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'SOVEREIGN';
  totalReturn: number;        // %
  monthlyReturn: number;      // %
  winRate: number;            // %
  totalTrades: number;
  portfolioValue: number;     // KAUS
  streak: number;             // Winning days
  badges: string[];
  isVerified: boolean;
}

const MOCK_USERS = [
  { name: 'CryptoKing_KR', avatar: '👑', tier: 'SOVEREIGN' as const },
  { name: 'EnergyMaster', avatar: '⚡', tier: 'DIAMOND' as const },
  { name: 'SolarPioneer', avatar: '☀️', tier: 'DIAMOND' as const },
  { name: 'WindTrader', avatar: '💨', tier: 'PLATINUM' as const },
  { name: 'HydroWhale', avatar: '💧', tier: 'PLATINUM' as const },
  { name: 'GreenInvestor', avatar: '🌱', tier: 'GOLD' as const },
  { name: 'TeslaFan2026', avatar: '🚗', tier: 'GOLD' as const },
  { name: 'YieldHunter', avatar: '🎯', tier: 'GOLD' as const },
  { name: 'KausHolder', avatar: '💎', tier: 'SILVER' as const },
  { name: 'NewbieTrader', avatar: '🌟', tier: 'BRONZE' as const },
];

export function getLeaderboard(period: 'day' | 'week' | 'month' | 'all' = 'month'): LeaderboardEntry[] {
  const multiplier = period === 'day' ? 0.3 : period === 'week' ? 1 : period === 'month' ? 4 : 12;

  return MOCK_USERS.map((user, i) => {
    const baseReturn = 50 - i * 4 + Math.random() * 10;

    return {
      rank: i + 1,
      userId: `user-${i + 1}`,
      username: user.name,
      avatar: user.avatar,
      tier: user.tier,
      totalReturn: baseReturn * multiplier,
      monthlyReturn: baseReturn,
      winRate: 65 + Math.random() * 25 - i * 2,
      totalTrades: Math.floor(50 + Math.random() * 200 - i * 10),
      portfolioValue: Math.floor(500000 - i * 40000 + Math.random() * 50000),
      streak: Math.floor(Math.random() * 15) + 1,
      badges: i < 3 ? ['🏆', '🔥', '💯'] : i < 5 ? ['🔥', '💯'] : ['💯'],
      isVerified: i < 5,
    };
  }).sort((a, b) => b.totalReturn - a.totalReturn);
}

export function getUserRank(): LeaderboardEntry {
  return {
    rank: 42,
    userId: 'current-user',
    username: 'You',
    avatar: '🧑‍💼',
    tier: 'GOLD',
    totalReturn: 28.5,
    monthlyReturn: 8.2,
    winRate: 72,
    totalTrades: 156,
    portfolioValue: 152000,
    streak: 5,
    badges: ['🔥'],
    isVerified: true,
  };
}

