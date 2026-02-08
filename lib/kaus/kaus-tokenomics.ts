/**
 * K-AUS TOKENOMICS ENGINE
 *
 * 글로벌 에너지 기축 통화 - K-AUS (Kaus Coin)
 * "전 세계 모든 에너지 노드가 카우스를 갈구하게 하라"
 *
 * Core Features:
 * - 1.2억 개 한정 발행
 * - 100년 반감기 로직
 * - 10% 실시간 소각 (Deflationary Engine)
 * - 모든 서비스 수수료 K-AUS 단일화
 */

// ============================================================
// CONSTANTS & CONFIGURATION
// ============================================================

export const KAUS_CONFIG = {
  // Total Supply
  MAX_SUPPLY: 120_000_000,           // 1.2억 K-AUS
  INITIAL_CIRCULATING: 12_000_000,   // 초기 유통량 (10%)

  // Halving Schedule (100년)
  HALVING_INTERVAL_YEARS: 4,         // 4년마다 반감기
  TOTAL_HALVINGS: 25,                // 100년 동안 25회

  // Burn Rate
  FEE_BURN_RATE: 0.10,               // 수수료의 10% 소각

  // Distribution
  DISTRIBUTION: {
    POE_MINING: 0.50,                // 50% - PoE 마이닝 보상
    LIQUIDITY: 0.20,                 // 20% - 유동성 공급
    TEAM_ADVISORS: 0.15,             // 15% - 팀 & 어드바이저 (4년 베스팅)
    ECOSYSTEM: 0.10,                 // 10% - 생태계 개발
    RESERVE: 0.05,                   // 5% - 중앙은행 준비금
  },

  // Fee Structure (in K-AUS)
  FEES: {
    VERIFICATION: 0.001,             // 에너지 검증 수수료
    SWAP: 0.0005,                    // 스왑 수수료 (0.05%)
    COMPLIANCE: 0.002,               // Compliance Proof 발급
    M2M_PAYMENT: 0.0001,             // M2M 자동결제
    SETTLEMENT: 0.0003,              // 정산 수수료
  },

  // Genesis Block
  GENESIS_TIMESTAMP: 1737561600000,  // 2025-01-22 UTC
  GENESIS_PRICE_USD: 0.10,           // 초기 가격 $0.10
};

// ============================================================
// TYPES & INTERFACES
// ============================================================

export interface KausSupplyState {
  totalSupply: number;
  circulatingSupply: number;
  burnedSupply: number;
  lockedSupply: number;
  stakingSupply: number;
  poeRewardsRemaining: number;
  currentHalvingEpoch: number;
  currentBlockReward: number;
}

export interface KausBurnEvent {
  id: string;
  timestamp: number;
  amount: number;
  source: 'fee_burn' | 'manual_burn' | 'protocol_burn';
  txHash: string;
  feeType?: string;
  originalFee?: number;
}

export interface KausTransaction {
  id: string;
  type: 'transfer' | 'stake' | 'unstake' | 'fee' | 'reward' | 'burn';
  from: string;
  to: string;
  amount: number;
  fee: number;
  burnAmount: number;
  timestamp: number;
  txHash: string;
}

export interface HalvingSchedule {
  epoch: number;
  startYear: number;
  endYear: number;
  blockReward: number;
  totalRewardsInEpoch: number;
  cumulativeSupply: number;
}

export interface FeeCollection {
  timestamp: number;
  feeType: keyof typeof KAUS_CONFIG.FEES;
  amount: number;
  burned: number;
  toTreasury: number;
  txId: string;
}

// ============================================================
// K-AUS TOKENOMICS ENGINE
// ============================================================

class KausTokenomicsEngine {
  private supplyState: KausSupplyState;
  private burnEvents: KausBurnEvent[] = [];
  private feeCollections: FeeCollection[] = [];
  private halvingSchedule: HalvingSchedule[] = [];

  constructor() {
    this.supplyState = this.initializeSupply();
    this.generateHalvingSchedule();
  }

  private initializeSupply(): KausSupplyState {
    const poeAllocation = KAUS_CONFIG.MAX_SUPPLY * KAUS_CONFIG.DISTRIBUTION.POE_MINING;

    return {
      totalSupply: KAUS_CONFIG.MAX_SUPPLY,
      circulatingSupply: KAUS_CONFIG.INITIAL_CIRCULATING,
      burnedSupply: 0,
      lockedSupply: KAUS_CONFIG.MAX_SUPPLY - KAUS_CONFIG.INITIAL_CIRCULATING,
      stakingSupply: 0,
      poeRewardsRemaining: poeAllocation,
      currentHalvingEpoch: 0,
      currentBlockReward: this.calculateBlockReward(0),
    };
  }

  /**
   * Generate 100-year halving schedule
   */
  private generateHalvingSchedule(): void {
    let cumulativeSupply = KAUS_CONFIG.INITIAL_CIRCULATING;
    let blockReward = 50; // Initial block reward (K-AUS)

    for (let epoch = 0; epoch < KAUS_CONFIG.TOTAL_HALVINGS; epoch++) {
      const startYear = epoch * KAUS_CONFIG.HALVING_INTERVAL_YEARS;
      const endYear = startYear + KAUS_CONFIG.HALVING_INTERVAL_YEARS;

      // Blocks per epoch (assuming 10 second blocks)
      const blocksPerYear = (365.25 * 24 * 60 * 60) / 10;
      const blocksPerEpoch = blocksPerYear * KAUS_CONFIG.HALVING_INTERVAL_YEARS;
      const totalRewardsInEpoch = blockReward * blocksPerEpoch;

      cumulativeSupply = Math.min(cumulativeSupply + totalRewardsInEpoch, KAUS_CONFIG.MAX_SUPPLY);

      this.halvingSchedule.push({
        epoch,
        startYear,
        endYear,
        blockReward,
        totalRewardsInEpoch,
        cumulativeSupply,
      });

      blockReward = blockReward / 2; // Halving
    }
  }

  /**
   * Calculate block reward for given epoch
   */
  private calculateBlockReward(epoch: number): number {
    const initialReward = 50; // 50 K-AUS
    return initialReward / Math.pow(2, epoch);
  }

  /**
   * Get current halving epoch based on timestamp
   */
  getCurrentEpoch(): number {
    const yearsSinceGenesis = (Date.now() - KAUS_CONFIG.GENESIS_TIMESTAMP) / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(yearsSinceGenesis / KAUS_CONFIG.HALVING_INTERVAL_YEARS);
  }

  /**
   * Process fee payment and execute burn
   */
  processFeeBurn(feeType: keyof typeof KAUS_CONFIG.FEES, transactionValue?: number): FeeCollection {
    let feeAmount: number;

    if (feeType === 'SWAP' && transactionValue) {
      feeAmount = transactionValue * KAUS_CONFIG.FEES[feeType];
    } else {
      feeAmount = KAUS_CONFIG.FEES[feeType];
    }

    const burnAmount = feeAmount * KAUS_CONFIG.FEE_BURN_RATE;
    const toTreasury = feeAmount - burnAmount;

    const collection: FeeCollection = {
      timestamp: Date.now(),
      feeType,
      amount: feeAmount,
      burned: burnAmount,
      toTreasury,
      txId: `FEE-${Date.now().toString(36).toUpperCase()}`,
    };

    // Execute burn
    this.executeBurn(burnAmount, 'fee_burn', feeType);

    this.feeCollections.push(collection);
    return collection;
  }

  /**
   * Execute K-AUS burn
   */
  executeBurn(amount: number, source: KausBurnEvent['source'], feeType?: string): KausBurnEvent {
    const burnEvent: KausBurnEvent = {
      id: `BURN-${Date.now().toString(36).toUpperCase()}`,
      timestamp: Date.now(),
      amount,
      source,
      txHash: `0x${Date.now().toString(16)}${Math.random().toString(16).substr(2, 8)}`,
      feeType,
    };

    this.supplyState.burnedSupply += amount;
    this.supplyState.circulatingSupply -= amount;

    this.burnEvents.push(burnEvent);
    return burnEvent;
  }

  /**
   * Get supply state
   */
  getSupplyState(): KausSupplyState {
    return { ...this.supplyState };
  }

  /**
   * Get halving schedule
   */
  getHalvingSchedule(): HalvingSchedule[] {
    return [...this.halvingSchedule];
  }

  /**
   * Get burn statistics
   */
  getBurnStats(): {
    totalBurned: number;
    burnRate24h: number;
    burnEvents24h: number;
    projectedAnnualBurn: number;
    deflationRate: number;
  } {
    const now = Date.now();
    const events24h = this.burnEvents.filter(e => now - e.timestamp < 24 * 60 * 60 * 1000);
    const burned24h = events24h.reduce((sum, e) => sum + e.amount, 0);

    return {
      totalBurned: this.supplyState.burnedSupply,
      burnRate24h: burned24h,
      burnEvents24h: events24h.length,
      projectedAnnualBurn: burned24h * 365,
      deflationRate: (this.supplyState.burnedSupply / KAUS_CONFIG.MAX_SUPPLY) * 100,
    };
  }

  /**
   * Get recent burn events
   */
  getRecentBurns(limit: number = 50): KausBurnEvent[] {
    return this.burnEvents.slice(-limit).reverse();
  }

  /**
   * Get fee collection stats
   */
  getFeeStats(): {
    totalCollected: number;
    totalBurned: number;
    totalToTreasury: number;
    byType: Record<string, { collected: number; burned: number }>;
  } {
    const byType: Record<string, { collected: number; burned: number }> = {};

    this.feeCollections.forEach(fc => {
      if (!byType[fc.feeType]) {
        byType[fc.feeType] = { collected: 0, burned: 0 };
      }
      byType[fc.feeType].collected += fc.amount;
      byType[fc.feeType].burned += fc.burned;
    });

    return {
      totalCollected: this.feeCollections.reduce((sum, fc) => sum + fc.amount, 0),
      totalBurned: this.feeCollections.reduce((sum, fc) => sum + fc.burned, 0),
      totalToTreasury: this.feeCollections.reduce((sum, fc) => sum + fc.toTreasury, 0),
      byType,
    };
  }

  /**
   * Calculate effective supply (total - burned - locked)
   */
  getEffectiveSupply(): number {
    return this.supplyState.totalSupply - this.supplyState.burnedSupply - this.supplyState.lockedSupply;
  }

  /**
   * Simulate future supply with burns
   */
  simulateSupply(years: number, annualBurnRate: number): Array<{
    year: number;
    circulatingSupply: number;
    burnedSupply: number;
    halvingEpoch: number;
    scarcityIndex: number;
  }> {
    const simulation: Array<{
      year: number;
      circulatingSupply: number;
      burnedSupply: number;
      halvingEpoch: number;
      scarcityIndex: number;
    }> = [];

    let circulating = this.supplyState.circulatingSupply;
    let burned = this.supplyState.burnedSupply;

    for (let year = 0; year <= years; year++) {
      const epoch = Math.floor(year / KAUS_CONFIG.HALVING_INTERVAL_YEARS);
      const yearlyBurn = circulating * annualBurnRate;

      burned += yearlyBurn;
      circulating -= yearlyBurn;

      // Add mining rewards
      if (epoch < this.halvingSchedule.length) {
        const epochData = this.halvingSchedule[epoch];
        circulating += epochData.totalRewardsInEpoch / KAUS_CONFIG.HALVING_INTERVAL_YEARS;
      }

      circulating = Math.min(circulating, KAUS_CONFIG.MAX_SUPPLY - burned);

      const scarcityIndex = (KAUS_CONFIG.MAX_SUPPLY - circulating - burned) / KAUS_CONFIG.MAX_SUPPLY * 100;

      simulation.push({
        year,
        circulatingSupply: Math.round(circulating),
        burnedSupply: Math.round(burned),
        halvingEpoch: epoch,
        scarcityIndex,
      });
    }

    return simulation;
  }
}

// Export singleton instance
export const kausTokenomics = new KausTokenomicsEngine();

// ============================================================
// QUICK ACCESS FUNCTIONS
// ============================================================

export function getKausSupply(): KausSupplyState {
  return kausTokenomics.getSupplyState();
}

export function processKausFee(feeType: keyof typeof KAUS_CONFIG.FEES, value?: number): FeeCollection {
  return kausTokenomics.processFeeBurn(feeType, value);
}

export function getKausBurnStats() {
  return kausTokenomics.getBurnStats();
}

export function getHalvingSchedule(): HalvingSchedule[] {
  return kausTokenomics.getHalvingSchedule();
}
