/**
 * K-AUS STAKING-TO-ASSET PRIORITY SYSTEM
 *
 * K-AUS 스테이킹 수량에 따라 신규 RWA 자산 투자 우선권 부여
 * "더 많이 스테이킹할수록, 더 좋은 자산에 먼저 접근"
 */

// ============================================================
// CONSTANTS & CONFIGURATION
// ============================================================

export const STAKING_CONFIG = {
  // Tier Thresholds (K-AUS)
  TIERS: {
    BRONZE: {
      minStake: 100,
      maxStake: 999,
      investmentLimit: 1000,        // $1,000 USD
      priorityScore: 1,
      allocationPercent: 5,          // 전체 자산의 5%까지
      earlyAccessDays: 0,            // 일반 공개 동시
      feeDiscount: 0,
      benefits: ['Basic Access', 'Community Rewards'],
    },
    SILVER: {
      minStake: 1000,
      maxStake: 9999,
      investmentLimit: 10000,       // $10,000 USD
      priorityScore: 3,
      allocationPercent: 10,
      earlyAccessDays: 1,            // 1일 조기 접근
      feeDiscount: 0.1,              // 10% 할인
      benefits: ['Priority Access', 'Fee Discount', 'Monthly Reports'],
    },
    GOLD: {
      minStake: 10000,
      maxStake: 99999,
      investmentLimit: 100000,      // $100,000 USD
      priorityScore: 5,
      allocationPercent: 20,
      earlyAccessDays: 3,            // 3일 조기 접근
      feeDiscount: 0.2,              // 20% 할인
      benefits: ['VIP Access', 'Fee Discount', 'Weekly Reports', 'Exclusive Assets'],
    },
    PLATINUM: {
      minStake: 100000,
      maxStake: 999999,
      investmentLimit: 1000000,     // $1,000,000 USD
      priorityScore: 10,
      allocationPercent: 30,
      earlyAccessDays: 7,            // 7일 조기 접근
      feeDiscount: 0.3,              // 30% 할인
      benefits: ['Elite Access', 'Maximum Discount', 'Daily Reports', 'Private Offerings', 'Direct Line'],
    },
    SOVEREIGN: {
      minStake: 1000000,
      maxStake: Infinity,
      investmentLimit: Infinity,    // 무제한
      priorityScore: 100,
      allocationPercent: 50,
      earlyAccessDays: 14,           // 14일 조기 접근
      feeDiscount: 0.5,              // 50% 할인
      benefits: ['Sovereign Access', 'First Pick', 'Zero Fees on Select Assets', 'Co-Investment Rights', 'Board Advisory'],
    },
  },

  // Staking Parameters
  LOCK_PERIODS: {
    FLEXIBLE: { days: 0, multiplier: 1.0 },
    SHORT: { days: 30, multiplier: 1.1 },
    MEDIUM: { days: 90, multiplier: 1.25 },
    LONG: { days: 180, multiplier: 1.5 },
    ULTRA: { days: 365, multiplier: 2.0 },
  },

  // Annual Staking Rewards
  BASE_APY: 0.08,                    // 8% 기본 APY
  MAX_APY: 0.24,                     // 최대 24% APY

  // Governance
  VOTING_POWER_PER_KAUS: 1,
  PROPOSAL_THRESHOLD: 10000,         // 10,000 K-AUS for proposal creation
};

// ============================================================
// TYPES & INTERFACES
// ============================================================

export type StakingTier = keyof typeof STAKING_CONFIG.TIERS;
export type LockPeriod = keyof typeof STAKING_CONFIG.LOCK_PERIODS;

export interface StakingPosition {
  id: string;
  userId: string;
  amount: number;
  tier: StakingTier;
  lockPeriod: LockPeriod;
  lockMultiplier: number;
  startTimestamp: number;
  unlockTimestamp: number;
  accumulatedRewards: number;
  lastClaimTimestamp: number;
  votingPower: number;
}

export interface TierBenefits {
  tier: StakingTier;
  investmentLimit: number;
  priorityScore: number;
  allocationPercent: number;
  earlyAccessDays: number;
  feeDiscount: number;
  effectiveAPY: number;
  benefits: string[];
}

export interface RWAAsset {
  id: string;
  name: string;
  type: 'solar' | 'wind' | 'hydro' | 'battery' | 'grid';
  location: string;
  totalValue: number;
  availableShares: number;
  minInvestment: number;
  expectedYield: number;
  status: 'upcoming' | 'open' | 'closed' | 'operating';
  launchDate: number;
  requiredTier: StakingTier;
  allocations: {
    sovereign: number;
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
    public: number;
  };
}

export interface InvestmentAllocation {
  id: string;
  userId: string;
  assetId: string;
  tier: StakingTier;
  allocatedAmount: number;
  maxAmount: number;
  investedAmount: number;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'expired';
}

export interface StakingStats {
  totalStaked: number;
  totalStakers: number;
  averageStake: number;
  tierDistribution: Record<StakingTier, number>;
  totalVotingPower: number;
  totalRewardsDistributed: number;
}

// ============================================================
// STAKING PRIORITY ENGINE
// ============================================================

class StakingPriorityEngine {
  private positions: Map<string, StakingPosition> = new Map();
  private assets: Map<string, RWAAsset> = new Map();
  private allocations: InvestmentAllocation[] = [];
  private totalStaked: number = 0;
  private totalRewardsDistributed: number = 0;

  constructor() {
    this.initializeSampleAssets();
  }

  private initializeSampleAssets(): void {
    const sampleAssets: RWAAsset[] = [
      {
        id: 'RWA-SOLAR-001',
        name: '영동 태양광 발전소 2호기',
        type: 'solar',
        location: 'Yeongdong-gun, Korea',
        totalValue: 5000000,
        availableShares: 5000,
        minInvestment: 100,
        expectedYield: 0.12,
        status: 'upcoming',
        launchDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
        requiredTier: 'BRONZE',
        allocations: { sovereign: 25, platinum: 20, gold: 20, silver: 15, bronze: 10, public: 10 },
      },
      {
        id: 'RWA-WIND-001',
        name: '제주 해상풍력 펀드',
        type: 'wind',
        location: 'Jeju Island, Korea',
        totalValue: 50000000,
        availableShares: 50000,
        minInvestment: 500,
        expectedYield: 0.15,
        status: 'upcoming',
        launchDate: Date.now() + 14 * 24 * 60 * 60 * 1000,
        requiredTier: 'SILVER',
        allocations: { sovereign: 30, platinum: 25, gold: 20, silver: 15, bronze: 5, public: 5 },
      },
      {
        id: 'RWA-BATTERY-001',
        name: '호주 Grid-Scale 배터리',
        type: 'battery',
        location: 'Victoria, Australia',
        totalValue: 100000000,
        availableShares: 100000,
        minInvestment: 1000,
        expectedYield: 0.18,
        status: 'upcoming',
        launchDate: Date.now() + 3 * 24 * 60 * 60 * 1000,
        requiredTier: 'GOLD',
        allocations: { sovereign: 35, platinum: 30, gold: 20, silver: 10, bronze: 3, public: 2 },
      },
    ];

    sampleAssets.forEach(asset => this.assets.set(asset.id, asset));
  }

  /**
   * Determine tier based on staked amount
   */
  getTierForAmount(amount: number): StakingTier {
    const tiers = STAKING_CONFIG.TIERS;

    if (amount >= tiers.SOVEREIGN.minStake) return 'SOVEREIGN';
    if (amount >= tiers.PLATINUM.minStake) return 'PLATINUM';
    if (amount >= tiers.GOLD.minStake) return 'GOLD';
    if (amount >= tiers.SILVER.minStake) return 'SILVER';
    if (amount >= tiers.BRONZE.minStake) return 'BRONZE';

    return 'BRONZE';
  }

  /**
   * Calculate effective APY based on tier and lock period
   */
  calculateAPY(tier: StakingTier, lockPeriod: LockPeriod): number {
    const tierConfig = STAKING_CONFIG.TIERS[tier];
    const lockConfig = STAKING_CONFIG.LOCK_PERIODS[lockPeriod];

    const baseAPY = STAKING_CONFIG.BASE_APY;
    const tierBonus = (tierConfig.priorityScore / 100) * 0.05; // Up to 5% bonus
    const lockBonus = (lockConfig.multiplier - 1) * 0.1;       // Up to 10% bonus

    return Math.min(baseAPY + tierBonus + lockBonus, STAKING_CONFIG.MAX_APY);
  }

  /**
   * Create staking position
   */
  stake(userId: string, amount: number, lockPeriod: LockPeriod): StakingPosition {
    const tier = this.getTierForAmount(amount);
    const lockConfig = STAKING_CONFIG.LOCK_PERIODS[lockPeriod];
    const now = Date.now();

    const position: StakingPosition = {
      id: `STAKE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      userId,
      amount,
      tier,
      lockPeriod,
      lockMultiplier: lockConfig.multiplier,
      startTimestamp: now,
      unlockTimestamp: now + lockConfig.days * 24 * 60 * 60 * 1000,
      accumulatedRewards: 0,
      lastClaimTimestamp: now,
      votingPower: amount * STAKING_CONFIG.VOTING_POWER_PER_KAUS * lockConfig.multiplier,
    };

    this.positions.set(position.id, position);
    this.totalStaked += amount;

    return position;
  }

  /**
   * Get tier benefits for a user
   */
  getTierBenefits(tier: StakingTier, lockPeriod: LockPeriod = 'FLEXIBLE'): TierBenefits {
    const config = STAKING_CONFIG.TIERS[tier];

    return {
      tier,
      investmentLimit: config.investmentLimit,
      priorityScore: config.priorityScore,
      allocationPercent: config.allocationPercent,
      earlyAccessDays: config.earlyAccessDays,
      feeDiscount: config.feeDiscount,
      effectiveAPY: this.calculateAPY(tier, lockPeriod),
      benefits: config.benefits,
    };
  }

  /**
   * Check investment eligibility for an asset
   */
  checkEligibility(userId: string, assetId: string): {
    eligible: boolean;
    reason?: string;
    maxInvestment: number;
    earlyAccessDate: number;
    feeDiscount: number;
    priorityScore: number;
  } {
    // Get user's staking positions
    const userPositions = Array.from(this.positions.values()).filter(p => p.userId === userId);
    const totalStaked = userPositions.reduce((sum, p) => sum + p.amount, 0);
    const userTier = this.getTierForAmount(totalStaked);

    const asset = this.assets.get(assetId);
    if (!asset) {
      return { eligible: false, reason: 'Asset not found', maxInvestment: 0, earlyAccessDate: 0, feeDiscount: 0, priorityScore: 0 };
    }

    const tierConfig = STAKING_CONFIG.TIERS[userTier];
    const requiredTierConfig = STAKING_CONFIG.TIERS[asset.requiredTier];

    if (tierConfig.priorityScore < requiredTierConfig.priorityScore) {
      return {
        eligible: false,
        reason: `Requires ${asset.requiredTier} tier or higher`,
        maxInvestment: 0,
        earlyAccessDate: asset.launchDate,
        feeDiscount: 0,
        priorityScore: tierConfig.priorityScore,
      };
    }

    const earlyAccessMs = tierConfig.earlyAccessDays * 24 * 60 * 60 * 1000;
    const earlyAccessDate = asset.launchDate - earlyAccessMs;

    const allocationPercent = asset.allocations[userTier.toLowerCase() as keyof typeof asset.allocations] || 0;
    const maxInvestment = Math.min(
      tierConfig.investmentLimit,
      (asset.totalValue * allocationPercent / 100)
    );

    return {
      eligible: true,
      maxInvestment,
      earlyAccessDate,
      feeDiscount: tierConfig.feeDiscount,
      priorityScore: tierConfig.priorityScore,
    };
  }

  /**
   * Allocate investment to user
   */
  allocateInvestment(userId: string, assetId: string, amount: number): InvestmentAllocation | null {
    const eligibility = this.checkEligibility(userId, assetId);

    if (!eligibility.eligible) {
      return null;
    }

    if (amount > eligibility.maxInvestment) {
      amount = eligibility.maxInvestment;
    }

    const userPositions = Array.from(this.positions.values()).filter(p => p.userId === userId);
    const totalStaked = userPositions.reduce((sum, p) => sum + p.amount, 0);
    const userTier = this.getTierForAmount(totalStaked);

    const allocation: InvestmentAllocation = {
      id: `ALLOC-${Date.now().toString(36).toUpperCase()}`,
      userId,
      assetId,
      tier: userTier,
      allocatedAmount: amount,
      maxAmount: eligibility.maxInvestment,
      investedAmount: 0,
      timestamp: Date.now(),
      status: 'pending',
    };

    this.allocations.push(allocation);
    return allocation;
  }

  /**
   * Get available RWA assets
   */
  getAvailableAssets(): RWAAsset[] {
    return Array.from(this.assets.values());
  }

  /**
   * Get user's staking positions
   */
  getUserPositions(userId: string): StakingPosition[] {
    return Array.from(this.positions.values()).filter(p => p.userId === userId);
  }

  /**
   * Get user's total staking and tier
   */
  getUserStakingInfo(userId: string): {
    totalStaked: number;
    tier: StakingTier;
    benefits: TierBenefits;
    positions: StakingPosition[];
    totalVotingPower: number;
    pendingRewards: number;
  } {
    const positions = this.getUserPositions(userId);
    const totalStaked = positions.reduce((sum, p) => sum + p.amount, 0);
    const tier = this.getTierForAmount(totalStaked);
    const totalVotingPower = positions.reduce((sum, p) => sum + p.votingPower, 0);
    const pendingRewards = positions.reduce((sum, p) => sum + p.accumulatedRewards, 0);

    return {
      totalStaked,
      tier,
      benefits: this.getTierBenefits(tier),
      positions,
      totalVotingPower,
      pendingRewards,
    };
  }

  /**
   * Get global staking statistics
   */
  getStats(): StakingStats {
    const positions = Array.from(this.positions.values());
    const tierDistribution: Record<StakingTier, number> = {
      BRONZE: 0,
      SILVER: 0,
      GOLD: 0,
      PLATINUM: 0,
      SOVEREIGN: 0,
    };

    positions.forEach(p => {
      tierDistribution[p.tier]++;
    });

    const uniqueUsers = new Set(positions.map(p => p.userId));

    return {
      totalStaked: this.totalStaked,
      totalStakers: uniqueUsers.size,
      averageStake: this.totalStaked / (uniqueUsers.size || 1),
      tierDistribution,
      totalVotingPower: positions.reduce((sum, p) => sum + p.votingPower, 0),
      totalRewardsDistributed: this.totalRewardsDistributed,
    };
  }

  /**
   * Get all tier configurations
   */
  getAllTiers(): Record<StakingTier, typeof STAKING_CONFIG.TIERS['BRONZE']> {
    return STAKING_CONFIG.TIERS;
  }
}

// Export singleton instance
export const stakingPriority = new StakingPriorityEngine();

// ============================================================
// QUICK ACCESS FUNCTIONS
// ============================================================

export function stakeKaus(userId: string, amount: number, lockPeriod: LockPeriod): StakingPosition {
  return stakingPriority.stake(userId, amount, lockPeriod);
}

export function getUserTierBenefits(userId: string) {
  return stakingPriority.getUserStakingInfo(userId);
}

export function checkAssetEligibility(userId: string, assetId: string) {
  return stakingPriority.checkEligibility(userId, assetId);
}

export function getAvailableRWAAssets(): RWAAsset[] {
  return stakingPriority.getAvailableAssets();
}

export function getStakingStats(): StakingStats {
  return stakingPriority.getStats();
}
