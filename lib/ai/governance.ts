/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 52: AI AUTONOMOUS GOVERNANCE
 * ═══════════════════════════════════════════════════════════════════════════════
 * APY 기반 자산 자동 재배치 + 최적 투자 전략 제안
 * "제국은 스스로 자산을 최적화한다"
 */

import { STAKING_POOLS, StakingPool, getYieldProjection } from './autotrader';

// ═══════════════════════════════════════════════════════════════════════════════
// USER PROFILE & INVESTMENT STYLE
// ═══════════════════════════════════════════════════════════════════════════════

export type InvestmentStyle = 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
export type ThemeMode = 'emerald' | 'cyan';

export interface UserProfile {
  id: string;
  tier: 'Pioneer' | 'Sovereign' | 'Emperor';
  investmentStyle: InvestmentStyle;
  riskTolerance: number; // 0-100
  preferredApy: number;
  totalAssets: number; // KAUS
  stakedAssets: number;
  liquidAssets: number;
  createdAt: string;
}

export interface AssetAllocation {
  poolId: string;
  poolName: string;
  currentAmount: number;
  currentApy: number;
  recommendedAmount: number;
  expectedApy: number;
  reallocationAction: 'INCREASE' | 'DECREASE' | 'HOLD';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
}

export interface GovernanceRecommendation {
  id: string;
  timestamp: string;
  userProfile: UserProfile;
  currentPortfolioApy: number;
  optimizedPortfolioApy: number;
  apyImprovement: number;
  allocations: AssetAllocation[];
  strategyName: string;
  strategyDescription: string;
  estimatedAnnualGain: number; // USD
  confidenceScore: number;
  autoExecute: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INVESTMENT STYLE ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

export function analyzeInvestmentStyle(profile: UserProfile): InvestmentStyle {
  // 위험 허용도와 선호 APY 기반 스타일 결정
  if (profile.riskTolerance < 30 || profile.preferredApy < 8) {
    return 'CONSERVATIVE';
  } else if (profile.riskTolerance > 70 || profile.preferredApy > 12) {
    return 'AGGRESSIVE';
  }
  return 'BALANCED';
}

export function getThemeForStyle(style: InvestmentStyle): ThemeMode {
  // AGGRESSIVE = 시안 (공격적, 차가운 에너지)
  // CONSERVATIVE/BALANCED = 에메랄드 (안정적, 성장)
  return style === 'AGGRESSIVE' ? 'cyan' : 'emerald';
}

// ═══════════════════════════════════════════════════════════════════════════════
// APY-BASED ASSET REALLOCATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

function calculateOptimalAllocation(
  totalAssets: number,
  style: InvestmentStyle,
  pools: StakingPool[]
): Map<string, number> {
  const allocation = new Map<string, number>();

  // 스타일별 풀 가중치 계산
  const weights = pools.map(pool => {
    let weight = 1;

    switch (style) {
      case 'CONSERVATIVE':
        // 낮은 APY, 짧은 락업 선호
        weight = (10 / pool.apy) * (30 / pool.lockPeriod);
        break;
      case 'AGGRESSIVE':
        // 높은 APY 선호
        weight = pool.apy / 10;
        break;
      case 'BALANCED':
        // APY와 안정성 균형
        weight = (pool.apy / 12) * (20 / pool.lockPeriod);
        break;
    }

    return { poolId: pool.id, weight: Math.max(weight, 0.1) };
  });

  // 총 가중치 계산
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);

  // 자산 분배
  weights.forEach(({ poolId, weight }) => {
    const allocAmount = (weight / totalWeight) * totalAssets;
    allocation.set(poolId, Math.round(allocAmount));
  });

  return allocation;
}

function getCurrentAllocations(profile: UserProfile): Map<string, number> {
  // 시뮬레이션된 현재 할당 (실제로는 DB에서 조회)
  const allocations = new Map<string, number>();
  const stakedPerPool = profile.stakedAssets / STAKING_POOLS.length;

  STAKING_POOLS.forEach(pool => {
    const variance = (Math.random() - 0.5) * stakedPerPool * 0.4;
    allocations.set(pool.id, Math.max(0, stakedPerPool + variance));
  });

  return allocations;
}

export function generateGovernanceRecommendation(
  profile: UserProfile
): GovernanceRecommendation {
  const style = analyzeInvestmentStyle(profile);
  const currentAllocations = getCurrentAllocations(profile);
  const optimalAllocations = calculateOptimalAllocation(
    profile.totalAssets,
    style,
    STAKING_POOLS
  );

  // 현재 포트폴리오 APY 계산
  let currentWeightedApy = 0;
  let totalCurrent = 0;

  STAKING_POOLS.forEach(pool => {
    const amount = currentAllocations.get(pool.id) || 0;
    currentWeightedApy += amount * pool.apy;
    totalCurrent += amount;
  });
  currentWeightedApy = totalCurrent > 0 ? currentWeightedApy / totalCurrent : 0;

  // 최적화 포트폴리오 APY 계산
  let optimizedWeightedApy = 0;
  let totalOptimized = 0;

  STAKING_POOLS.forEach(pool => {
    const amount = optimalAllocations.get(pool.id) || 0;
    optimizedWeightedApy += amount * pool.apy;
    totalOptimized += amount;
  });
  optimizedWeightedApy = totalOptimized > 0 ? optimizedWeightedApy / totalOptimized : 0;

  // 자산 재배치 추천 생성
  const allocations: AssetAllocation[] = STAKING_POOLS.map(pool => {
    const current = currentAllocations.get(pool.id) || 0;
    const recommended = optimalAllocations.get(pool.id) || 0;
    const difference = recommended - current;

    let action: AssetAllocation['reallocationAction'] = 'HOLD';
    let priority: AssetAllocation['priority'] = 'LOW';
    let reason = '';

    const diffPercent = current > 0 ? Math.abs(difference / current) : 1;

    if (difference > 100) {
      action = 'INCREASE';
      priority = diffPercent > 0.3 ? 'HIGH' : 'MEDIUM';
      reason = `${pool.apy}% APY with ${pool.lockPeriod}-day lock optimal for ${style.toLowerCase()} strategy`;
    } else if (difference < -100) {
      action = 'DECREASE';
      priority = diffPercent > 0.3 ? 'HIGH' : 'MEDIUM';
      reason = `Reallocate to higher-yield pools for better returns`;
    } else {
      reason = 'Current allocation within optimal range';
    }

    return {
      poolId: pool.id,
      poolName: pool.name,
      currentAmount: Math.round(current),
      currentApy: pool.apy,
      recommendedAmount: Math.round(recommended),
      expectedApy: pool.apy,
      reallocationAction: action,
      priority,
      reason,
    };
  });

  // 전략명 및 설명 생성
  const strategyNames: Record<InvestmentStyle, string> = {
    CONSERVATIVE: 'Steady Shield',
    BALANCED: 'Dynamic Growth',
    AGGRESSIVE: 'Alpha Hunter',
  };

  const strategyDescriptions: Record<InvestmentStyle, string> = {
    CONSERVATIVE: '안정적인 수익을 위해 낮은 변동성 풀에 집중합니다. 자본 보존이 최우선입니다.',
    BALANCED: 'APY와 리스크의 균형을 추구합니다. 다양한 풀에 분산 투자합니다.',
    AGGRESSIVE: '최대 수익을 위해 높은 APY 풀에 집중합니다. 높은 리스크를 감수합니다.',
  };

  // 예상 연간 수익 (USD) - KAUS to USD (약 $0.09)
  const KAUS_TO_USD = 0.09;
  const currentAnnualYield = profile.totalAssets * (currentWeightedApy / 100);
  const optimizedAnnualYield = profile.totalAssets * (optimizedWeightedApy / 100);
  const annualGainKaus = optimizedAnnualYield - currentAnnualYield;

  return {
    id: `GOV-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    userProfile: profile,
    currentPortfolioApy: Number(currentWeightedApy.toFixed(2)),
    optimizedPortfolioApy: Number(optimizedWeightedApy.toFixed(2)),
    apyImprovement: Number((optimizedWeightedApy - currentWeightedApy).toFixed(2)),
    allocations,
    strategyName: strategyNames[style],
    strategyDescription: strategyDescriptions[style],
    estimatedAnnualGain: Math.round(annualGainKaus * KAUS_TO_USD),
    confidenceScore: 0.85 + Math.random() * 0.1,
    autoExecute: profile.tier === 'Emperor',
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMPIRE GROWTH PROJECTION
// ═══════════════════════════════════════════════════════════════════════════════

export interface GrowthProjection {
  month: number;
  date: string;
  projectedValue: number;
  projectedValueUsd: number;
  cumulativeYield: number;
  cumulativeYieldUsd: number;
  milestones: string[];
}

export function calculateEmpireGrowth(
  initialAmount: number,
  apy: number,
  months: number = 12
): GrowthProjection[] {
  const KAUS_TO_USD = 0.09;
  const monthlyRate = apy / 100 / 12;
  const projections: GrowthProjection[] = [];

  let currentValue = initialAmount;
  let totalYield = 0;

  for (let i = 1; i <= months; i++) {
    const monthlyYield = currentValue * monthlyRate;
    totalYield += monthlyYield;
    currentValue += monthlyYield;

    const milestones: string[] = [];

    // 마일스톤 체크
    if (i === 3) milestones.push('First Quarter Complete');
    if (i === 6) milestones.push('Mid-Year Review');
    if (i === 12) milestones.push('Annual Goal Achieved');
    if (currentValue >= initialAmount * 1.1) milestones.push('10% Growth Milestone');
    if (currentValue >= initialAmount * 1.25 && i <= 12) milestones.push('25% Growth - Elite Status');

    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + i);

    projections.push({
      month: i,
      date: futureDate.toISOString().slice(0, 7), // YYYY-MM
      projectedValue: Math.round(currentValue),
      projectedValueUsd: Math.round(currentValue * KAUS_TO_USD),
      cumulativeYield: Math.round(totalYield),
      cumulativeYieldUsd: Math.round(totalYield * KAUS_TO_USD),
      milestones,
    });
  }

  return projections;
}

// ═══════════════════════════════════════════════════════════════════════════════
// JARVIS ACTION COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

export type JarvisActionType = 'BUY_KAUS' | 'WITHDRAW' | 'STAKE' | 'UNSTAKE' | 'REBALANCE';

export interface JarvisAction {
  type: JarvisActionType;
  label: string;
  icon: string;
  description: string;
  requiresAmount: boolean;
  requiresConfirmation: boolean;
  apiEndpoint: string;
}

export const JARVIS_ACTIONS: Record<JarvisActionType, JarvisAction> = {
  BUY_KAUS: {
    type: 'BUY_KAUS',
    label: '코인 매수',
    icon: '💰',
    description: 'KAUS 토큰을 구매합니다',
    requiresAmount: true,
    requiresConfirmation: true,
    apiEndpoint: '/api/kaus/buy',
  },
  WITHDRAW: {
    type: 'WITHDRAW',
    label: '출금',
    icon: '💸',
    description: '보유 자산을 출금합니다',
    requiresAmount: true,
    requiresConfirmation: true,
    apiEndpoint: '/api/kaus/withdraw',
  },
  STAKE: {
    type: 'STAKE',
    label: '스테이킹',
    icon: '📈',
    description: 'KAUS를 스테이킹하여 수익을 얻습니다',
    requiresAmount: true,
    requiresConfirmation: true,
    apiEndpoint: '/api/kaus/stake',
  },
  UNSTAKE: {
    type: 'UNSTAKE',
    label: '언스테이킹',
    icon: '📤',
    description: '스테이킹된 KAUS를 해제합니다',
    requiresAmount: true,
    requiresConfirmation: true,
    apiEndpoint: '/api/kaus/unstake',
  },
  REBALANCE: {
    type: 'REBALANCE',
    label: '포트폴리오 재조정',
    icon: '⚖️',
    description: 'AI 추천에 따라 자산을 자동 재배치합니다',
    requiresAmount: false,
    requiresConfirmation: true,
    apiEndpoint: '/api/kaus/rebalance',
  },
};

export interface ActionExecutionResult {
  success: boolean;
  transactionId?: string;
  message: string;
  newBalance?: number;
  executedAt: string;
}

export async function executeJarvisAction(
  action: JarvisActionType,
  amount?: number,
  userId?: string
): Promise<ActionExecutionResult> {
  const actionConfig = JARVIS_ACTIONS[action];

  // 시뮬레이션된 실행 (실제로는 API 호출)
  await new Promise(resolve => setTimeout(resolve, 1000));

  const success = Math.random() > 0.1; // 90% 성공률

  if (!success) {
    return {
      success: false,
      message: 'Transaction failed. Please try again.',
      executedAt: new Date().toISOString(),
    };
  }

  const transactionId = `TX-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  return {
    success: true,
    transactionId,
    message: `${actionConfig.label} executed successfully`,
    newBalance: amount ? Math.round(Math.random() * 10000) : undefined,
    executedAt: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK USER PROFILE (for demo)
// ═══════════════════════════════════════════════════════════════════════════════

export function getMockUserProfile(): UserProfile {
  const tiers = ['Pioneer', 'Sovereign', 'Emperor'] as const;
  const styles = ['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'] as const;

  return {
    id: 'USER-' + Math.random().toString(36).substring(2, 8),
    tier: tiers[Math.floor(Math.random() * 3)],
    investmentStyle: styles[Math.floor(Math.random() * 3)],
    riskTolerance: 40 + Math.floor(Math.random() * 40),
    preferredApy: 8 + Math.random() * 7,
    totalAssets: 5000 + Math.floor(Math.random() * 45000),
    stakedAssets: 3000 + Math.floor(Math.random() * 20000),
    liquidAssets: 1000 + Math.floor(Math.random() * 10000),
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
  };
}
