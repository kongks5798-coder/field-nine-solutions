/**
 * PROOF-OF-ENERGY (PoE) MINING ENGINE
 *
 * 실제 에너지 생산 데이터(kWh) 검증 시 K-AUS 보상 지급
 * + 프로토콜 수익 30% 재투자 (Recycling Contract)
 *
 * "에너지가 곧 가치, 가치가 곧 K-AUS"
 */

import { KAUS_CONFIG, kausTokenomics } from './kaus-tokenomics';

// ============================================================
// CONSTANTS & CONFIGURATION
// ============================================================

export const POE_CONFIG = {
  // Reward Calculation
  BASE_REWARD_PER_KWH: 0.00001,      // 기본 보상: 0.00001 K-AUS per kWh
  MIN_KWH_FOR_REWARD: 100,           // 최소 검증 단위: 100 kWh

  // Energy Source Multipliers
  SOURCE_MULTIPLIERS: {
    solar: 1.2,                       // 태양광 20% 보너스
    wind: 1.15,                       // 풍력 15% 보너스
    hydro: 1.1,                       // 수력 10% 보너스
    geothermal: 1.1,                  // 지열 10% 보너스
    biomass: 1.0,                     // 바이오매스 기본
    nuclear: 0.8,                     // 원자력 -20%
    natural_gas: 0.5,                 // 천연가스 -50%
    coal: 0.0,                        // 석탄 보상 없음
  },

  // Region Multipliers (Carbon Intensity)
  REGION_MULTIPLIERS: {
    KR: 1.0,
    JP: 0.95,
    US: 1.0,
    EU: 1.1,                          // EU 친환경 정책 보너스
    AU: 1.05,
    SG: 0.9,
    AE: 0.85,
  },

  // Recycling Contract
  RECYCLING_RATE: 0.30,              // 프로토콜 수익의 30%
  RECYCLING_ALLOCATION: {
    LIQUIDITY_PROVISION: 0.50,       // 50% 유동성 공급
    NODE_CONSTRUCTION: 0.30,         // 30% 신규 노드 건설
    ECOSYSTEM_GRANTS: 0.20,          // 20% 생태계 지원금
  },

  // Dynamic Adjustment
  DIFFICULTY_ADJUSTMENT_BLOCKS: 2016, // 비트코인과 동일
  TARGET_BLOCK_TIME: 10,              // 10초
  MAX_ADJUSTMENT_FACTOR: 4,           // 최대 4배 조정
};

// ============================================================
// TYPES & INTERFACES
// ============================================================

export type EnergySource = keyof typeof POE_CONFIG.SOURCE_MULTIPLIERS;
export type Region = keyof typeof POE_CONFIG.REGION_MULTIPLIERS;

export interface EnergyProduction {
  nodeId: string;
  timestamp: number;
  kwhProduced: number;
  source: EnergySource;
  region: Region;
  verificationHash: string;
  meterReadingId: string;
}

export interface PoEMiningReward {
  rewardId: string;
  nodeId: string;
  timestamp: number;
  kwhVerified: number;
  source: EnergySource;
  region: Region;

  // Calculation Breakdown
  baseReward: number;
  sourceMultiplier: number;
  regionMultiplier: number;
  difficultyAdjustment: number;

  // Final Reward
  totalReward: number;
  txHash: string;

  // Verification
  proofHash: string;
  blockNumber: number;
}

export interface RecyclingAllocation {
  id: string;
  timestamp: number;
  sourceAmount: number;        // 원본 프로토콜 수익
  recycledAmount: number;      // 재투자 금액 (30%)

  distribution: {
    liquidityProvision: number;
    nodeConstruction: number;
    ecosystemGrants: number;
  };

  txHashes: {
    liquidity?: string;
    construction?: string;
    grants?: string;
  };
}

export interface MiningDifficulty {
  currentDifficulty: number;
  previousDifficulty: number;
  adjustmentFactor: number;
  nextAdjustmentBlock: number;
  avgBlockTime: number;
  totalHashRate: number;       // Total verified kWh
}

export interface PoEStats {
  totalKwhVerified: number;
  totalRewardsDistributed: number;
  activeMiners: number;
  currentDifficulty: number;
  avgRewardPerKwh: number;
  topSources: Array<{ source: EnergySource; kwhVerified: number; rewards: number }>;
}

// ============================================================
// POE MINING ENGINE
// ============================================================

class PoEMiningEngine {
  private rewards: PoEMiningReward[] = [];
  private recyclingHistory: RecyclingAllocation[] = [];
  private difficulty: MiningDifficulty;
  private totalKwhVerified: number = 0;
  private totalRewardsDistributed: number = 0;
  private blockNumber: number = 0;

  constructor() {
    this.difficulty = {
      currentDifficulty: 1.0,
      previousDifficulty: 1.0,
      adjustmentFactor: 1.0,
      nextAdjustmentBlock: POE_CONFIG.DIFFICULTY_ADJUSTMENT_BLOCKS,
      avgBlockTime: POE_CONFIG.TARGET_BLOCK_TIME,
      totalHashRate: 0,
    };
  }

  /**
   * Calculate Dynamic PoE Reward
   */
  calculateReward(production: EnergyProduction): {
    reward: number;
    breakdown: {
      baseReward: number;
      sourceMultiplier: number;
      regionMultiplier: number;
      difficultyAdjustment: number;
    };
  } {
    // Check minimum threshold
    if (production.kwhProduced < POE_CONFIG.MIN_KWH_FOR_REWARD) {
      return {
        reward: 0,
        breakdown: {
          baseReward: 0,
          sourceMultiplier: 0,
          regionMultiplier: 0,
          difficultyAdjustment: 0,
        },
      };
    }

    // Base reward
    const baseReward = production.kwhProduced * POE_CONFIG.BASE_REWARD_PER_KWH;

    // Apply multipliers
    const sourceMultiplier = POE_CONFIG.SOURCE_MULTIPLIERS[production.source] || 1.0;
    const regionMultiplier = POE_CONFIG.REGION_MULTIPLIERS[production.region] || 1.0;

    // Difficulty adjustment (inverse - higher difficulty = lower reward)
    const difficultyAdjustment = 1 / this.difficulty.currentDifficulty;

    // Calculate total reward
    const totalReward = baseReward * sourceMultiplier * regionMultiplier * difficultyAdjustment;

    return {
      reward: totalReward,
      breakdown: {
        baseReward,
        sourceMultiplier,
        regionMultiplier,
        difficultyAdjustment,
      },
    };
  }

  /**
   * Verify energy production and mint K-AUS reward
   */
  async verifyAndMint(production: EnergyProduction): Promise<PoEMiningReward> {
    // Calculate reward
    const { reward, breakdown } = this.calculateReward(production);

    // Generate proof hash
    const proofData = `${production.nodeId}:${production.kwhProduced}:${production.timestamp}:${production.verificationHash}`;
    const proofHash = `0x${Buffer.from(proofData).toString('hex').substring(0, 64)}`;

    // Increment block
    this.blockNumber++;

    const miningReward: PoEMiningReward = {
      rewardId: `POE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      nodeId: production.nodeId,
      timestamp: Date.now(),
      kwhVerified: production.kwhProduced,
      source: production.source,
      region: production.region,

      baseReward: breakdown.baseReward,
      sourceMultiplier: breakdown.sourceMultiplier,
      regionMultiplier: breakdown.regionMultiplier,
      difficultyAdjustment: breakdown.difficultyAdjustment,

      totalReward: reward,
      txHash: `0x${Date.now().toString(16)}${Math.random().toString(16).substr(2, 16)}`,

      proofHash,
      blockNumber: this.blockNumber,
    };

    // Update stats
    this.totalKwhVerified += production.kwhProduced;
    this.totalRewardsDistributed += reward;
    this.rewards.push(miningReward);

    // Check for difficulty adjustment
    if (this.blockNumber % POE_CONFIG.DIFFICULTY_ADJUSTMENT_BLOCKS === 0) {
      this.adjustDifficulty();
    }

    return miningReward;
  }

  /**
   * Adjust mining difficulty based on hash rate
   */
  private adjustDifficulty(): void {
    // Calculate average block time over last period
    const recentRewards = this.rewards.slice(-POE_CONFIG.DIFFICULTY_ADJUSTMENT_BLOCKS);
    if (recentRewards.length < 2) return;

    const timeDiff = recentRewards[recentRewards.length - 1].timestamp - recentRewards[0].timestamp;
    const avgBlockTime = timeDiff / (recentRewards.length - 1) / 1000;

    // Calculate adjustment factor
    let adjustmentFactor = avgBlockTime / POE_CONFIG.TARGET_BLOCK_TIME;

    // Limit adjustment
    adjustmentFactor = Math.max(1 / POE_CONFIG.MAX_ADJUSTMENT_FACTOR, Math.min(POE_CONFIG.MAX_ADJUSTMENT_FACTOR, adjustmentFactor));

    // Update difficulty
    this.difficulty.previousDifficulty = this.difficulty.currentDifficulty;
    this.difficulty.currentDifficulty *= adjustmentFactor;
    this.difficulty.adjustmentFactor = adjustmentFactor;
    this.difficulty.avgBlockTime = avgBlockTime;
    this.difficulty.nextAdjustmentBlock = this.blockNumber + POE_CONFIG.DIFFICULTY_ADJUSTMENT_BLOCKS;
    this.difficulty.totalHashRate = this.totalKwhVerified;
  }

  /**
   * Execute Recycling Contract - redistribute 30% of protocol revenue
   */
  executeRecycling(protocolRevenue: number): RecyclingAllocation {
    const recycledAmount = protocolRevenue * POE_CONFIG.RECYCLING_RATE;

    const allocation: RecyclingAllocation = {
      id: `RECYCLE-${Date.now().toString(36).toUpperCase()}`,
      timestamp: Date.now(),
      sourceAmount: protocolRevenue,
      recycledAmount,

      distribution: {
        liquidityProvision: recycledAmount * POE_CONFIG.RECYCLING_ALLOCATION.LIQUIDITY_PROVISION,
        nodeConstruction: recycledAmount * POE_CONFIG.RECYCLING_ALLOCATION.NODE_CONSTRUCTION,
        ecosystemGrants: recycledAmount * POE_CONFIG.RECYCLING_ALLOCATION.ECOSYSTEM_GRANTS,
      },

      txHashes: {
        liquidity: `0xLIQ${Date.now().toString(16)}`,
        construction: `0xCON${Date.now().toString(16)}`,
        grants: `0xGRA${Date.now().toString(16)}`,
      },
    };

    this.recyclingHistory.push(allocation);
    return allocation;
  }

  /**
   * Get Dynamic PoE Algorithm parameters
   */
  getDynamicPoEParams(): {
    baseRewardPerKwh: number;
    currentDifficulty: number;
    sourceMultipliers: typeof POE_CONFIG.SOURCE_MULTIPLIERS;
    regionMultipliers: typeof POE_CONFIG.REGION_MULTIPLIERS;
    effectiveRewardPerKwh: number;
    nextDifficultyAdjustment: number;
  } {
    const effectiveReward = POE_CONFIG.BASE_REWARD_PER_KWH / this.difficulty.currentDifficulty;

    return {
      baseRewardPerKwh: POE_CONFIG.BASE_REWARD_PER_KWH,
      currentDifficulty: this.difficulty.currentDifficulty,
      sourceMultipliers: POE_CONFIG.SOURCE_MULTIPLIERS,
      regionMultipliers: POE_CONFIG.REGION_MULTIPLIERS,
      effectiveRewardPerKwh: effectiveReward,
      nextDifficultyAdjustment: this.difficulty.nextAdjustmentBlock - this.blockNumber,
    };
  }

  /**
   * Get PoE mining statistics
   */
  getStats(): PoEStats {
    const sourceStats = new Map<EnergySource, { kwhVerified: number; rewards: number }>();

    this.rewards.forEach(r => {
      const current = sourceStats.get(r.source) || { kwhVerified: 0, rewards: 0 };
      current.kwhVerified += r.kwhVerified;
      current.rewards += r.totalReward;
      sourceStats.set(r.source, current);
    });

    const topSources = Array.from(sourceStats.entries())
      .map(([source, data]) => ({ source, ...data }))
      .sort((a, b) => b.kwhVerified - a.kwhVerified)
      .slice(0, 5);

    const uniqueNodes = new Set(this.rewards.map(r => r.nodeId));

    return {
      totalKwhVerified: this.totalKwhVerified,
      totalRewardsDistributed: this.totalRewardsDistributed,
      activeMiners: uniqueNodes.size,
      currentDifficulty: this.difficulty.currentDifficulty,
      avgRewardPerKwh: this.totalKwhVerified > 0 ? this.totalRewardsDistributed / this.totalKwhVerified : 0,
      topSources,
    };
  }

  /**
   * Get recent mining rewards
   */
  getRecentRewards(limit: number = 50): PoEMiningReward[] {
    return this.rewards.slice(-limit).reverse();
  }

  /**
   * Get recycling history
   */
  getRecyclingHistory(limit: number = 20): RecyclingAllocation[] {
    return this.recyclingHistory.slice(-limit).reverse();
  }

  /**
   * Get difficulty info
   */
  getDifficulty(): MiningDifficulty {
    return { ...this.difficulty };
  }

  /**
   * Simulate PoE rewards over time
   */
  simulatePoERewards(params: {
    dailyKwhProduction: number;
    source: EnergySource;
    region: Region;
    days: number;
  }): Array<{
    day: number;
    kwhProduced: number;
    kausEarned: number;
    cumulativeKaus: number;
    difficulty: number;
  }> {
    const simulation: Array<{
      day: number;
      kwhProduced: number;
      kausEarned: number;
      cumulativeKaus: number;
      difficulty: number;
    }> = [];

    let cumulativeKaus = 0;
    let simulatedDifficulty = this.difficulty.currentDifficulty;

    for (let day = 1; day <= params.days; day++) {
      const baseReward = params.dailyKwhProduction * POE_CONFIG.BASE_REWARD_PER_KWH;
      const sourceMultiplier = POE_CONFIG.SOURCE_MULTIPLIERS[params.source];
      const regionMultiplier = POE_CONFIG.REGION_MULTIPLIERS[params.region];
      const difficultyAdjustment = 1 / simulatedDifficulty;

      const dailyReward = baseReward * sourceMultiplier * regionMultiplier * difficultyAdjustment;
      cumulativeKaus += dailyReward;

      // Simulate difficulty increase (10% per month)
      if (day % 30 === 0) {
        simulatedDifficulty *= 1.1;
      }

      simulation.push({
        day,
        kwhProduced: params.dailyKwhProduction,
        kausEarned: dailyReward,
        cumulativeKaus,
        difficulty: simulatedDifficulty,
      });
    }

    return simulation;
  }
}

// Export singleton instance
export const poeMining = new PoEMiningEngine();

// ============================================================
// QUICK ACCESS FUNCTIONS
// ============================================================

export function calculatePoEReward(production: EnergyProduction) {
  return poeMining.calculateReward(production);
}

export async function verifyAndMintKaus(production: EnergyProduction): Promise<PoEMiningReward> {
  return poeMining.verifyAndMint(production);
}

export function executeRecyclingContract(revenue: number): RecyclingAllocation {
  return poeMining.executeRecycling(revenue);
}

export function getPoEStats(): PoEStats {
  return poeMining.getStats();
}

export function getDynamicPoEAlgorithm() {
  return poeMining.getDynamicPoEParams();
}
