/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 54: STAKING & YIELD FARMING ENGINE
 * ═══════════════════════════════════════════════════════════════════════════════
 * - Flexible and locked staking pools
 * - Yield farming with LP tokens
 * - Auto-compounding strategies
 * - Reward distribution system
 * - Staking tiers and boosts
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type StakingPoolType = 'FLEXIBLE' | 'LOCKED_30' | 'LOCKED_90' | 'LOCKED_180' | 'LOCKED_365';
export type FarmType = 'LP_STAKING' | 'SINGLE_ASSET' | 'DUAL_REWARDS';
export type RewardToken = 'KAUS' | 'ENERGY' | 'CARBON';

export interface StakingPool {
  id: string;
  name: string;
  nameKo: string;
  type: StakingPoolType;
  token: string;
  tokenIcon: string;
  apy: number;
  apyBoost?: number;
  totalStaked: number;
  totalStakedKRW: number;
  participants: number;
  minStake: number;
  maxStake?: number;
  lockPeriodDays: number;
  earlyUnstakePenalty: number; // percentage
  rewardToken: RewardToken;
  isActive: boolean;
  features: string[];
}

export interface UserStake {
  id: string;
  poolId: string;
  poolName: string;
  amount: number;
  stakedAt: Date;
  unlockAt?: Date;
  earnedRewards: number;
  pendingRewards: number;
  lastClaimAt?: Date;
  isLocked: boolean;
  currentApy: number;
  boostMultiplier: number;
}

export interface Farm {
  id: string;
  name: string;
  nameKo: string;
  type: FarmType;
  lpToken: {
    token0: string;
    token0Icon: string;
    token1: string;
    token1Icon: string;
  };
  apy: number;
  apr: number;
  dailyRewards: number;
  tvl: number;
  tvlKRW: number;
  multiplier: string;
  depositFee: number;
  harvestLockup: number; // hours
  rewardTokens: RewardToken[];
  isActive: boolean;
  isHot: boolean;
  endTime?: Date;
}

export interface UserFarmPosition {
  id: string;
  farmId: string;
  farmName: string;
  lpAmount: number;
  lpValueKRW: number;
  earnedRewards: { token: RewardToken; amount: number }[];
  pendingRewards: { token: RewardToken; amount: number }[];
  depositedAt: Date;
  lastHarvestAt?: Date;
}

export interface StakingStats {
  totalValueLocked: number;
  totalValueLockedKRW: number;
  totalParticipants: number;
  totalRewardsDistributed: number;
  averageApy: number;
  highestApy: number;
}

export interface UserStakingProfile {
  address: string;
  totalStaked: number;
  totalStakedKRW: number;
  totalEarned: number;
  pendingRewards: number;
  stakingTier: StakingTier;
  boostMultiplier: number;
  stakes: UserStake[];
  farmPositions: UserFarmPosition[];
}

export type StakingTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';

export interface TierInfo {
  tier: StakingTier;
  name: string;
  nameKo: string;
  icon: string;
  minStake: number;
  boostMultiplier: number;
  benefits: string[];
  color: string;
}

export interface CompoundingStrategy {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  descriptionKo: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  estimatedApy: number;
  isActive: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const KAUS_PRICE_KRW = 120;

export const TIER_CONFIG: Record<StakingTier, TierInfo> = {
  BRONZE: {
    tier: 'BRONZE',
    name: 'Bronze',
    nameKo: '브론즈',
    icon: '🥉',
    minStake: 0,
    boostMultiplier: 1.0,
    benefits: ['기본 스테이킹 보상', '주간 리워드 리포트'],
    color: 'amber',
  },
  SILVER: {
    tier: 'SILVER',
    name: 'Silver',
    nameKo: '실버',
    icon: '🥈',
    minStake: 5000,
    boostMultiplier: 1.1,
    benefits: ['10% APY 부스트', '우선 풀 액세스', '월간 에어드랍'],
    color: 'neutral',
  },
  GOLD: {
    tier: 'GOLD',
    name: 'Gold',
    nameKo: '골드',
    icon: '🥇',
    minStake: 25000,
    boostMultiplier: 1.25,
    benefits: ['25% APY 부스트', 'VIP 풀 액세스', '거버넌스 투표권 2배'],
    color: 'yellow',
  },
  PLATINUM: {
    tier: 'PLATINUM',
    name: 'Platinum',
    nameKo: '플래티넘',
    icon: '💎',
    minStake: 100000,
    boostMultiplier: 1.5,
    benefits: ['50% APY 부스트', '전용 풀 액세스', '수수료 50% 할인'],
    color: 'cyan',
  },
  DIAMOND: {
    tier: 'DIAMOND',
    name: 'Diamond',
    nameKo: '다이아몬드',
    icon: '👑',
    minStake: 500000,
    boostMultiplier: 2.0,
    benefits: ['100% APY 부스트', '모든 프리미엄 기능', '개인 매니저 배정'],
    color: 'violet',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_POOLS: StakingPool[] = [
  {
    id: 'pool-flexible',
    name: 'Flexible KAUS',
    nameKo: '유연한 KAUS 스테이킹',
    type: 'FLEXIBLE',
    token: 'KAUS',
    tokenIcon: '👑',
    apy: 12,
    totalStaked: 5000000,
    totalStakedKRW: 600000000,
    participants: 2847,
    minStake: 100,
    lockPeriodDays: 0,
    earlyUnstakePenalty: 0,
    rewardToken: 'KAUS',
    isActive: true,
    features: ['언제든지 출금', '일일 보상 지급', '복리 가능'],
  },
  {
    id: 'pool-30d',
    name: '30-Day Lock',
    nameKo: '30일 락업 스테이킹',
    type: 'LOCKED_30',
    token: 'KAUS',
    tokenIcon: '👑',
    apy: 18,
    apyBoost: 3,
    totalStaked: 3200000,
    totalStakedKRW: 384000000,
    participants: 1523,
    minStake: 500,
    lockPeriodDays: 30,
    earlyUnstakePenalty: 10,
    rewardToken: 'KAUS',
    isActive: true,
    features: ['30일 락업', '높은 APY', '조기 출금 10% 페널티'],
  },
  {
    id: 'pool-90d',
    name: '90-Day Lock',
    nameKo: '90일 락업 스테이킹',
    type: 'LOCKED_90',
    token: 'KAUS',
    tokenIcon: '👑',
    apy: 25,
    apyBoost: 5,
    totalStaked: 2100000,
    totalStakedKRW: 252000000,
    participants: 892,
    minStake: 1000,
    lockPeriodDays: 90,
    earlyUnstakePenalty: 15,
    rewardToken: 'KAUS',
    isActive: true,
    features: ['90일 락업', '프리미엄 APY', '보너스 에어드랍'],
  },
  {
    id: 'pool-180d',
    name: '180-Day Lock',
    nameKo: '180일 락업 스테이킹',
    type: 'LOCKED_180',
    token: 'KAUS',
    tokenIcon: '👑',
    apy: 35,
    apyBoost: 8,
    totalStaked: 1500000,
    totalStakedKRW: 180000000,
    participants: 456,
    minStake: 2500,
    lockPeriodDays: 180,
    earlyUnstakePenalty: 20,
    rewardToken: 'KAUS',
    isActive: true,
    features: ['180일 락업', '최고 APY', 'NFT 에어드랍 자격'],
  },
  {
    id: 'pool-365d',
    name: '365-Day Lock',
    nameKo: '1년 락업 스테이킹',
    type: 'LOCKED_365',
    token: 'KAUS',
    tokenIcon: '👑',
    apy: 50,
    apyBoost: 15,
    totalStaked: 800000,
    totalStakedKRW: 96000000,
    participants: 234,
    minStake: 5000,
    lockPeriodDays: 365,
    earlyUnstakePenalty: 25,
    rewardToken: 'KAUS',
    isActive: true,
    features: ['1년 락업', '최대 APY', 'Diamond 티어 자동 부여'],
  },
  {
    id: 'pool-energy',
    name: 'Energy Staking',
    nameKo: '에너지 토큰 스테이킹',
    type: 'FLEXIBLE',
    token: 'ENERGY',
    tokenIcon: '⚡',
    apy: 15,
    totalStaked: 2000000,
    totalStakedKRW: 170000000,
    participants: 1234,
    minStake: 100,
    lockPeriodDays: 0,
    earlyUnstakePenalty: 0,
    rewardToken: 'ENERGY',
    isActive: true,
    features: ['에너지 토큰 보상', '탄소 크레딧 보너스', '친환경 투자'],
  },
];

const MOCK_FARMS: Farm[] = [
  {
    id: 'farm-kaus-usdc',
    name: 'KAUS-USDC LP',
    nameKo: 'KAUS-USDC 유동성 풀',
    type: 'LP_STAKING',
    lpToken: {
      token0: 'KAUS',
      token0Icon: '👑',
      token1: 'USDC',
      token1Icon: '💵',
    },
    apy: 85,
    apr: 65,
    dailyRewards: 5000,
    tvl: 8500000,
    tvlKRW: 1020000000,
    multiplier: '40x',
    depositFee: 0,
    harvestLockup: 4,
    rewardTokens: ['KAUS'],
    isActive: true,
    isHot: true,
  },
  {
    id: 'farm-kaus-eth',
    name: 'KAUS-ETH LP',
    nameKo: 'KAUS-ETH 유동성 풀',
    type: 'LP_STAKING',
    lpToken: {
      token0: 'KAUS',
      token0Icon: '👑',
      token1: 'ETH',
      token1Icon: '⟠',
    },
    apy: 72,
    apr: 55,
    dailyRewards: 4000,
    tvl: 6200000,
    tvlKRW: 744000000,
    multiplier: '30x',
    depositFee: 0,
    harvestLockup: 4,
    rewardTokens: ['KAUS'],
    isActive: true,
    isHot: true,
  },
  {
    id: 'farm-energy-kaus',
    name: 'ENERGY-KAUS LP',
    nameKo: 'ENERGY-KAUS 유동성 풀',
    type: 'DUAL_REWARDS',
    lpToken: {
      token0: 'ENERGY',
      token0Icon: '⚡',
      token1: 'KAUS',
      token1Icon: '👑',
    },
    apy: 120,
    apr: 90,
    dailyRewards: 8000,
    tvl: 4500000,
    tvlKRW: 540000000,
    multiplier: '50x',
    depositFee: 0,
    harvestLockup: 8,
    rewardTokens: ['KAUS', 'ENERGY'],
    isActive: true,
    isHot: true,
  },
  {
    id: 'farm-carbon-usdc',
    name: 'CARBON-USDC LP',
    nameKo: 'CARBON-USDC 유동성 풀',
    type: 'LP_STAKING',
    lpToken: {
      token0: 'CARBON',
      token0Icon: '🌿',
      token1: 'USDC',
      token1Icon: '💵',
    },
    apy: 45,
    apr: 35,
    dailyRewards: 2500,
    tvl: 2800000,
    tvlKRW: 336000000,
    multiplier: '15x',
    depositFee: 0,
    harvestLockup: 4,
    rewardTokens: ['CARBON'],
    isActive: true,
    isHot: false,
  },
];

const MOCK_USER_STAKES: UserStake[] = [
  {
    id: 'stake-1',
    poolId: 'pool-flexible',
    poolName: '유연한 KAUS 스테이킹',
    amount: 5000,
    stakedAt: new Date(Date.now() - 86400000 * 30),
    earnedRewards: 50,
    pendingRewards: 15,
    lastClaimAt: new Date(Date.now() - 86400000 * 7),
    isLocked: false,
    currentApy: 12,
    boostMultiplier: 1.25,
  },
  {
    id: 'stake-2',
    poolId: 'pool-90d',
    poolName: '90일 락업 스테이킹',
    amount: 10000,
    stakedAt: new Date(Date.now() - 86400000 * 45),
    unlockAt: new Date(Date.now() + 86400000 * 45),
    earnedRewards: 280,
    pendingRewards: 85,
    lastClaimAt: new Date(Date.now() - 86400000 * 14),
    isLocked: true,
    currentApy: 25,
    boostMultiplier: 1.25,
  },
];

const MOCK_FARM_POSITIONS: UserFarmPosition[] = [
  {
    id: 'farm-pos-1',
    farmId: 'farm-kaus-usdc',
    farmName: 'KAUS-USDC 유동성 풀',
    lpAmount: 1500,
    lpValueKRW: 180000,
    earnedRewards: [{ token: 'KAUS', amount: 125 }],
    pendingRewards: [{ token: 'KAUS', amount: 45 }],
    depositedAt: new Date(Date.now() - 86400000 * 21),
    lastHarvestAt: new Date(Date.now() - 86400000 * 5),
  },
];

const MOCK_STRATEGIES: CompoundingStrategy[] = [
  {
    id: 'strategy-daily',
    name: 'Daily Compound',
    nameKo: '일일 복리',
    description: 'Automatically compound rewards every 24 hours',
    descriptionKo: '24시간마다 자동으로 보상을 재투자합니다',
    frequency: 'DAILY',
    estimatedApy: 14.8,
    isActive: true,
  },
  {
    id: 'strategy-weekly',
    name: 'Weekly Compound',
    nameKo: '주간 복리',
    description: 'Compound rewards every week for gas efficiency',
    descriptionKo: '가스비 효율을 위해 매주 보상을 재투자합니다',
    frequency: 'WEEKLY',
    estimatedApy: 13.5,
    isActive: true,
  },
  {
    id: 'strategy-monthly',
    name: 'Monthly Compound',
    nameKo: '월간 복리',
    description: 'Monthly compounding for long-term holders',
    descriptionKo: '장기 보유자를 위한 월간 복리 전략입니다',
    frequency: 'MONTHLY',
    estimatedApy: 12.7,
    isActive: true,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// STAKING POOL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function getStakingPools(type?: StakingPoolType): StakingPool[] {
  let pools = [...MOCK_POOLS];
  if (type) {
    pools = pools.filter(p => p.type === type);
  }
  return pools.sort((a, b) => b.apy - a.apy);
}

export function getStakingPool(id: string): StakingPool | null {
  return MOCK_POOLS.find(p => p.id === id) || null;
}

export function stake(poolId: string, amount: number): UserStake | null {
  const pool = getStakingPool(poolId);
  if (!pool || amount < pool.minStake) return null;

  const now = new Date();
  const stake: UserStake = {
    id: `stake-${Date.now()}`,
    poolId,
    poolName: pool.nameKo,
    amount,
    stakedAt: now,
    unlockAt: pool.lockPeriodDays > 0
      ? new Date(now.getTime() + pool.lockPeriodDays * 86400000)
      : undefined,
    earnedRewards: 0,
    pendingRewards: 0,
    isLocked: pool.lockPeriodDays > 0,
    currentApy: pool.apy,
    boostMultiplier: 1.0,
  };

  return stake;
}

export function unstake(stakeId: string, earlyUnstake: boolean = false): { success: boolean; penalty?: number } {
  const stake = MOCK_USER_STAKES.find(s => s.id === stakeId);
  if (!stake) return { success: false };

  if (stake.isLocked && stake.unlockAt && new Date() < stake.unlockAt) {
    if (!earlyUnstake) return { success: false };

    const pool = getStakingPool(stake.poolId);
    const penalty = pool ? (stake.amount * pool.earlyUnstakePenalty) / 100 : 0;
    return { success: true, penalty };
  }

  return { success: true };
}

export function claimRewards(stakeId: string): { success: boolean; amount: number } {
  const stake = MOCK_USER_STAKES.find(s => s.id === stakeId);
  if (!stake || stake.pendingRewards <= 0) return { success: false, amount: 0 };

  return { success: true, amount: stake.pendingRewards };
}

// ═══════════════════════════════════════════════════════════════════════════════
// YIELD FARMING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function getFarms(type?: FarmType): Farm[] {
  let farms = [...MOCK_FARMS];
  if (type) {
    farms = farms.filter(f => f.type === type);
  }
  return farms.sort((a, b) => b.apy - a.apy);
}

export function getFarm(id: string): Farm | null {
  return MOCK_FARMS.find(f => f.id === id) || null;
}

export function depositToFarm(farmId: string, lpAmount: number): UserFarmPosition | null {
  const farm = getFarm(farmId);
  if (!farm) return null;

  const position: UserFarmPosition = {
    id: `farm-pos-${Date.now()}`,
    farmId,
    farmName: farm.nameKo,
    lpAmount,
    lpValueKRW: lpAmount * KAUS_PRICE_KRW,
    earnedRewards: [],
    pendingRewards: farm.rewardTokens.map(token => ({ token, amount: 0 })),
    depositedAt: new Date(),
  };

  return position;
}

export function withdrawFromFarm(positionId: string): boolean {
  const position = MOCK_FARM_POSITIONS.find(p => p.id === positionId);
  return !!position;
}

export function harvestFarmRewards(positionId: string): { success: boolean; rewards: { token: RewardToken; amount: number }[] } {
  const position = MOCK_FARM_POSITIONS.find(p => p.id === positionId);
  if (!position) return { success: false, rewards: [] };

  return { success: true, rewards: position.pendingRewards };
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function getUserStakingProfile(address: string): UserStakingProfile {
  const stakes = MOCK_USER_STAKES;
  const farmPositions = MOCK_FARM_POSITIONS;

  const totalStaked = stakes.reduce((sum, s) => sum + s.amount, 0);
  const totalEarned = stakes.reduce((sum, s) => sum + s.earnedRewards, 0);
  const pendingRewards = stakes.reduce((sum, s) => sum + s.pendingRewards, 0) +
    farmPositions.reduce((sum, p) => sum + p.pendingRewards.reduce((s, r) => s + r.amount, 0), 0);

  const tier = calculateTier(totalStaked);
  const boostMultiplier = TIER_CONFIG[tier].boostMultiplier;

  return {
    address,
    totalStaked,
    totalStakedKRW: totalStaked * KAUS_PRICE_KRW,
    totalEarned,
    pendingRewards,
    stakingTier: tier,
    boostMultiplier,
    stakes,
    farmPositions,
  };
}

export function calculateTier(totalStaked: number): StakingTier {
  if (totalStaked >= TIER_CONFIG.DIAMOND.minStake) return 'DIAMOND';
  if (totalStaked >= TIER_CONFIG.PLATINUM.minStake) return 'PLATINUM';
  if (totalStaked >= TIER_CONFIG.GOLD.minStake) return 'GOLD';
  if (totalStaked >= TIER_CONFIG.SILVER.minStake) return 'SILVER';
  return 'BRONZE';
}

export function getTierProgress(totalStaked: number): { currentTier: StakingTier; nextTier: StakingTier | null; progress: number; remaining: number } {
  const currentTier = calculateTier(totalStaked);
  const tiers: StakingTier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];
  const currentIndex = tiers.indexOf(currentTier);

  if (currentIndex === tiers.length - 1) {
    return { currentTier, nextTier: null, progress: 100, remaining: 0 };
  }

  const nextTier = tiers[currentIndex + 1];
  const currentMin = TIER_CONFIG[currentTier].minStake;
  const nextMin = TIER_CONFIG[nextTier].minStake;
  const progress = Math.min(100, ((totalStaked - currentMin) / (nextMin - currentMin)) * 100);
  const remaining = Math.max(0, nextMin - totalStaked);

  return { currentTier, nextTier, progress, remaining };
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATS & ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════

export function getStakingStats(): StakingStats {
  const pools = MOCK_POOLS;
  const farms = MOCK_FARMS;

  const poolTvl = pools.reduce((sum, p) => sum + p.totalStaked, 0);
  const farmTvl = farms.reduce((sum, f) => sum + f.tvl, 0);
  const totalParticipants = pools.reduce((sum, p) => sum + p.participants, 0);
  const apys = pools.map(p => p.apy);

  return {
    totalValueLocked: poolTvl + farmTvl,
    totalValueLockedKRW: (poolTvl + farmTvl) * KAUS_PRICE_KRW,
    totalParticipants,
    totalRewardsDistributed: 2500000,
    averageApy: apys.reduce((sum, apy) => sum + apy, 0) / apys.length,
    highestApy: Math.max(...apys, ...farms.map(f => f.apy)),
  };
}

export function getCompoundingStrategies(): CompoundingStrategy[] {
  return MOCK_STRATEGIES;
}

export function calculateCompoundedReturns(principal: number, apy: number, days: number, compoundFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'): number {
  const frequencyMap = { DAILY: 365, WEEKLY: 52, MONTHLY: 12 };
  const n = frequencyMap[compoundFrequency];
  const r = apy / 100;
  const t = days / 365;

  return principal * Math.pow(1 + r / n, n * t);
}

export function estimateRewards(amount: number, apy: number, days: number): number {
  return (amount * (apy / 100) * days) / 365;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIME UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

export function getTimeUntilUnlock(unlockAt: Date): { days: number; hours: number; minutes: number; isUnlocked: boolean } {
  const now = new Date();
  const diff = unlockAt.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, isUnlocked: true };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    isUnlocked: false,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const StakingEngine = {
  // Pools
  getStakingPools,
  getStakingPool,
  stake,
  unstake,
  claimRewards,
  // Farms
  getFarms,
  getFarm,
  depositToFarm,
  withdrawFromFarm,
  harvestFarmRewards,
  // User
  getUserStakingProfile,
  calculateTier,
  getTierProgress,
  // Stats
  getStakingStats,
  getCompoundingStrategies,
  calculateCompoundedReturns,
  estimateRewards,
  // Utils
  getTimeUntilUnlock,
  // Config
  TIER_CONFIG,
};

export default StakingEngine;
