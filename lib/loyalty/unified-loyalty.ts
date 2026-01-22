/**
 * Field Nine Unified Loyalty System
 * @version 1.0.0 - Phase 11 Ecosystem Integration
 *
 * Cross-Platform Loyalty Program
 * NEXUS-X Trading + K-Universal Travel Benefits
 */

import crypto from 'crypto';

// ============================================
// Types
// ============================================

export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';

export interface LoyaltyMember {
  memberId: string;
  userId: string;
  tier: LoyaltyTier;
  points: number;
  lifetimePoints: number;
  joinedAt: string;
  tierExpiry: string;
  stats: {
    tradingVolume: number;
    tradingTrades: number;
    travelBookings: number;
    travelSpend: number;
    rwaInvestments: number;
  };
  benefits: TierBenefits;
  referralCode: string;
  referredBy?: string;
}

export interface TierBenefits {
  tradingFeeDiscount: number; // %
  accommodationDiscount: number; // %
  flightDiscount: number; // %
  exchangeRateBonus: number; // %
  rwaAllocationBonus: number; // %
  prioritySupport: boolean;
  exclusiveDeals: boolean;
  loungeAccess: boolean;
  conciergeService: boolean;
  nftBadge: string | null;
}

export interface PointTransaction {
  transactionId: string;
  memberId: string;
  type: 'EARN' | 'REDEEM' | 'EXPIRE' | 'BONUS' | 'REFERRAL';
  points: number;
  source: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  expiresAt?: string;
}

export interface LoyaltyReward {
  rewardId: string;
  name: string;
  description: string;
  category: 'TRADING' | 'TRAVEL' | 'RWA' | 'LIFESTYLE' | 'NFT';
  pointsCost: number;
  value: number;
  tierRequired: LoyaltyTier;
  availability: number;
  claimed: number;
  expiresAt?: string;
}

export interface ReferralProgram {
  referralCode: string;
  referrerId: string;
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  rewards: {
    perReferral: number;
    bonusAt10: number;
    bonusAt50: number;
  };
}

// ============================================
// Tier Configuration
// ============================================

export const TIER_CONFIG: Record<LoyaltyTier, {
  minPoints: number;
  benefits: TierBenefits;
  pointsMultiplier: number;
}> = {
  BRONZE: {
    minPoints: 0,
    benefits: {
      tradingFeeDiscount: 0,
      accommodationDiscount: 0,
      flightDiscount: 0,
      exchangeRateBonus: 0,
      rwaAllocationBonus: 0,
      prioritySupport: false,
      exclusiveDeals: false,
      loungeAccess: false,
      conciergeService: false,
      nftBadge: null,
    },
    pointsMultiplier: 1.0,
  },
  SILVER: {
    minPoints: 1000,
    benefits: {
      tradingFeeDiscount: 5,
      accommodationDiscount: 3,
      flightDiscount: 2,
      exchangeRateBonus: 0.1,
      rwaAllocationBonus: 0,
      prioritySupport: false,
      exclusiveDeals: false,
      loungeAccess: false,
      conciergeService: false,
      nftBadge: 'SILVER_MEMBER_2026',
    },
    pointsMultiplier: 1.1,
  },
  GOLD: {
    minPoints: 5000,
    benefits: {
      tradingFeeDiscount: 10,
      accommodationDiscount: 7,
      flightDiscount: 5,
      exchangeRateBonus: 0.2,
      rwaAllocationBonus: 5,
      prioritySupport: true,
      exclusiveDeals: true,
      loungeAccess: false,
      conciergeService: false,
      nftBadge: 'GOLD_MEMBER_2026',
    },
    pointsMultiplier: 1.25,
  },
  PLATINUM: {
    minPoints: 20000,
    benefits: {
      tradingFeeDiscount: 20,
      accommodationDiscount: 15,
      flightDiscount: 10,
      exchangeRateBonus: 0.3,
      rwaAllocationBonus: 10,
      prioritySupport: true,
      exclusiveDeals: true,
      loungeAccess: true,
      conciergeService: true,
      nftBadge: 'PLATINUM_MEMBER_2026',
    },
    pointsMultiplier: 1.5,
  },
  DIAMOND: {
    minPoints: 100000,
    benefits: {
      tradingFeeDiscount: 30,
      accommodationDiscount: 25,
      flightDiscount: 15,
      exchangeRateBonus: 0.5,
      rwaAllocationBonus: 20,
      prioritySupport: true,
      exclusiveDeals: true,
      loungeAccess: true,
      conciergeService: true,
      nftBadge: 'DIAMOND_MEMBER_2026',
    },
    pointsMultiplier: 2.0,
  },
};

// ============================================
// Point Earning Rules
// ============================================

export const POINT_RULES = {
  TRADING: {
    perDollarVolume: 1, // 1 point per $1 traded
    bonusForProfitableTrade: 10,
    dailyTradeBonus: 50, // 5+ trades per day
  },
  TRAVEL: {
    perDollarSpent: 2, // 2 points per $1 on travel
    flightBookingBonus: 100,
    hotelBookingBonus: 50,
    reviewBonus: 25,
  },
  RWA: {
    perDollarInvested: 5, // 5 points per $1 invested
    firstInvestmentBonus: 500,
    dividendReinvestBonus: 100,
  },
  REFERRAL: {
    newMemberBonus: 500,
    refereeBonus: 250,
    tierUpBonus: 1000,
  },
};

// ============================================
// Unified Loyalty Manager
// ============================================

export class UnifiedLoyaltyManager {
  private members: Map<string, LoyaltyMember> = new Map();
  private transactions: PointTransaction[] = [];
  private rewards: Map<string, LoyaltyReward> = new Map();

  constructor() {
    this.initializeRewards();
  }

  // Initialize available rewards
  private initializeRewards(): void {
    const sampleRewards: LoyaltyReward[] = [
      {
        rewardId: 'RWD-TRADE-001',
        name: 'Free Trading Day',
        description: '24-hour zero-fee trading on NEXUS-X',
        category: 'TRADING',
        pointsCost: 1000,
        value: 50,
        tierRequired: 'SILVER',
        availability: 100,
        claimed: 23,
      },
      {
        rewardId: 'RWD-TRADE-002',
        name: 'Premium Signal Access',
        description: '7-day access to premium alpha signals',
        category: 'TRADING',
        pointsCost: 2500,
        value: 99,
        tierRequired: 'GOLD',
        availability: 50,
        claimed: 12,
      },
      {
        rewardId: 'RWD-TRAVEL-001',
        name: '$50 Hotel Credit',
        description: 'Credit for K-Universal hotel bookings',
        category: 'TRAVEL',
        pointsCost: 2000,
        value: 50,
        tierRequired: 'BRONZE',
        availability: 200,
        claimed: 87,
      },
      {
        rewardId: 'RWD-TRAVEL-002',
        name: 'Airport Lounge Pass',
        description: 'Single-use lounge access at ICN/GMP',
        category: 'TRAVEL',
        pointsCost: 3000,
        value: 45,
        tierRequired: 'GOLD',
        availability: 100,
        claimed: 34,
      },
      {
        rewardId: 'RWD-RWA-001',
        name: 'RWA Priority Allocation',
        description: 'Early access to next RWA token launch',
        category: 'RWA',
        pointsCost: 5000,
        value: 200,
        tierRequired: 'PLATINUM',
        availability: 25,
        claimed: 8,
      },
      {
        rewardId: 'RWD-NFT-001',
        name: 'Field Nine Genesis NFT',
        description: 'Exclusive membership NFT with perks',
        category: 'NFT',
        pointsCost: 10000,
        value: 500,
        tierRequired: 'PLATINUM',
        availability: 100,
        claimed: 42,
      },
    ];

    sampleRewards.forEach(reward => {
      this.rewards.set(reward.rewardId, reward);
    });
  }

  // Generate referral code
  private generateReferralCode(userId: string): string {
    return `F9-${userId.substring(0, 4).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  }

  // Determine tier from points
  private determineTier(lifetimePoints: number): LoyaltyTier {
    if (lifetimePoints >= TIER_CONFIG.DIAMOND.minPoints) return 'DIAMOND';
    if (lifetimePoints >= TIER_CONFIG.PLATINUM.minPoints) return 'PLATINUM';
    if (lifetimePoints >= TIER_CONFIG.GOLD.minPoints) return 'GOLD';
    if (lifetimePoints >= TIER_CONFIG.SILVER.minPoints) return 'SILVER';
    return 'BRONZE';
  }

  // Register new member
  registerMember(userId: string, referralCode?: string): LoyaltyMember {
    const memberId = `MBR-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const tier: LoyaltyTier = 'BRONZE';

    const member: LoyaltyMember = {
      memberId,
      userId,
      tier,
      points: 0,
      lifetimePoints: 0,
      joinedAt: new Date().toISOString(),
      tierExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      stats: {
        tradingVolume: 0,
        tradingTrades: 0,
        travelBookings: 0,
        travelSpend: 0,
        rwaInvestments: 0,
      },
      benefits: TIER_CONFIG[tier].benefits,
      referralCode: this.generateReferralCode(userId),
      referredBy: referralCode,
    };

    this.members.set(userId, member);

    // Process referral bonus
    if (referralCode) {
      const referrer = Array.from(this.members.values())
        .find(m => m.referralCode === referralCode);
      if (referrer) {
        this.earnPoints(referrer.userId, POINT_RULES.REFERRAL.newMemberBonus, 'REFERRAL', 'New member referral bonus');
        this.earnPoints(userId, POINT_RULES.REFERRAL.refereeBonus, 'REFERRAL', 'Welcome bonus from referral');
      }
    }

    return member;
  }

  // Earn points
  earnPoints(
    userId: string,
    points: number,
    source: string,
    description: string,
    metadata?: Record<string, unknown>
  ): PointTransaction | null {
    const member = this.members.get(userId);
    if (!member) return null;

    // Apply tier multiplier
    const multiplier = TIER_CONFIG[member.tier].pointsMultiplier;
    const adjustedPoints = Math.floor(points * multiplier);

    const transaction: PointTransaction = {
      transactionId: `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      memberId: member.memberId,
      type: 'EARN',
      points: adjustedPoints,
      source,
      description,
      metadata,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    };

    member.points += adjustedPoints;
    member.lifetimePoints += adjustedPoints;

    // Check for tier upgrade
    const newTier = this.determineTier(member.lifetimePoints);
    if (newTier !== member.tier) {
      member.tier = newTier;
      member.benefits = TIER_CONFIG[newTier].benefits;
      member.tierExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

      // Tier up bonus for referrer
      if (member.referredBy) {
        const referrer = Array.from(this.members.values())
          .find(m => m.referralCode === member.referredBy);
        if (referrer) {
          this.earnPoints(referrer.userId, POINT_RULES.REFERRAL.tierUpBonus, 'REFERRAL', `Referral tier up to ${newTier}`);
        }
      }
    }

    this.members.set(userId, member);
    this.transactions.push(transaction);

    return transaction;
  }

  // Redeem points for reward
  redeemReward(userId: string, rewardId: string): {
    success: boolean;
    transaction?: PointTransaction;
    error?: string;
  } {
    const member = this.members.get(userId);
    if (!member) {
      return { success: false, error: 'Member not found' };
    }

    const reward = this.rewards.get(rewardId);
    if (!reward) {
      return { success: false, error: 'Reward not found' };
    }

    // Check tier requirement
    const tiers: LoyaltyTier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];
    if (tiers.indexOf(member.tier) < tiers.indexOf(reward.tierRequired)) {
      return { success: false, error: `Requires ${reward.tierRequired} tier or higher` };
    }

    if (member.points < reward.pointsCost) {
      return { success: false, error: 'Insufficient points' };
    }

    if (reward.claimed >= reward.availability) {
      return { success: false, error: 'Reward no longer available' };
    }

    const transaction: PointTransaction = {
      transactionId: `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      memberId: member.memberId,
      type: 'REDEEM',
      points: -reward.pointsCost,
      source: 'REWARD_REDEMPTION',
      description: `Redeemed: ${reward.name}`,
      metadata: { rewardId, rewardName: reward.name },
      createdAt: new Date().toISOString(),
    };

    member.points -= reward.pointsCost;
    reward.claimed++;

    this.members.set(userId, member);
    this.rewards.set(rewardId, reward);
    this.transactions.push(transaction);

    return { success: true, transaction };
  }

  // Record trading activity
  recordTradingActivity(userId: string, volume: number, profitable: boolean): void {
    const member = this.members.get(userId);
    if (!member) return;

    member.stats.tradingVolume += volume;
    member.stats.tradingTrades++;
    this.members.set(userId, member);

    let points = volume * POINT_RULES.TRADING.perDollarVolume;
    if (profitable) {
      points += POINT_RULES.TRADING.bonusForProfitableTrade;
    }

    this.earnPoints(userId, points, 'TRADING', `Trading activity: $${volume} volume`);
  }

  // Record travel booking
  recordTravelBooking(userId: string, amount: number, type: 'FLIGHT' | 'HOTEL'): void {
    const member = this.members.get(userId);
    if (!member) return;

    member.stats.travelBookings++;
    member.stats.travelSpend += amount;
    this.members.set(userId, member);

    let points = amount * POINT_RULES.TRAVEL.perDollarSpent;
    points += type === 'FLIGHT'
      ? POINT_RULES.TRAVEL.flightBookingBonus
      : POINT_RULES.TRAVEL.hotelBookingBonus;

    this.earnPoints(userId, points, 'TRAVEL', `${type} booking: $${amount}`);
  }

  // Record RWA investment
  recordRWAInvestment(userId: string, amount: number, isFirst: boolean): void {
    const member = this.members.get(userId);
    if (!member) return;

    member.stats.rwaInvestments += amount;
    this.members.set(userId, member);

    let points = amount * POINT_RULES.RWA.perDollarInvested;
    if (isFirst) {
      points += POINT_RULES.RWA.firstInvestmentBonus;
    }

    this.earnPoints(userId, points, 'RWA', `RWA investment: $${amount}`);
  }

  // Get member
  getMember(userId: string): LoyaltyMember | undefined {
    return this.members.get(userId);
  }

  // Get member transactions
  getMemberTransactions(userId: string, limit: number = 50): PointTransaction[] {
    const member = this.members.get(userId);
    if (!member) return [];

    return this.transactions
      .filter(t => t.memberId === member.memberId)
      .slice(-limit);
  }

  // Get available rewards
  getAvailableRewards(tier: LoyaltyTier): LoyaltyReward[] {
    const tiers: LoyaltyTier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];
    const tierIndex = tiers.indexOf(tier);

    return Array.from(this.rewards.values())
      .filter(r => tiers.indexOf(r.tierRequired) <= tierIndex && r.claimed < r.availability);
  }

  // Calculate discounted price
  calculateDiscountedPrice(
    userId: string,
    originalPrice: number,
    type: 'TRADING_FEE' | 'ACCOMMODATION' | 'FLIGHT'
  ): { discountedPrice: number; discount: number; discountPercent: number } {
    const member = this.members.get(userId);
    if (!member) {
      return { discountedPrice: originalPrice, discount: 0, discountPercent: 0 };
    }

    let discountPercent = 0;
    switch (type) {
      case 'TRADING_FEE':
        discountPercent = member.benefits.tradingFeeDiscount;
        break;
      case 'ACCOMMODATION':
        discountPercent = member.benefits.accommodationDiscount;
        break;
      case 'FLIGHT':
        discountPercent = member.benefits.flightDiscount;
        break;
    }

    const discount = originalPrice * (discountPercent / 100);
    const discountedPrice = originalPrice - discount;

    return {
      discountedPrice: Math.round(discountedPrice * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      discountPercent,
    };
  }

  // Get program statistics
  getProgramStats(): {
    totalMembers: number;
    membersByTier: Record<LoyaltyTier, number>;
    totalPointsIssued: number;
    totalPointsRedeemed: number;
    totalRewardsClaimed: number;
  } {
    const membersByTier: Record<LoyaltyTier, number> = {
      BRONZE: 0,
      SILVER: 0,
      GOLD: 0,
      PLATINUM: 0,
      DIAMOND: 0,
    };

    this.members.forEach(member => {
      membersByTier[member.tier]++;
    });

    const totalPointsIssued = this.transactions
      .filter(t => t.type === 'EARN' || t.type === 'BONUS' || t.type === 'REFERRAL')
      .reduce((sum, t) => sum + t.points, 0);

    const totalPointsRedeemed = Math.abs(
      this.transactions
        .filter(t => t.type === 'REDEEM')
        .reduce((sum, t) => sum + t.points, 0)
    );

    const totalRewardsClaimed = Array.from(this.rewards.values())
      .reduce((sum, r) => sum + r.claimed, 0);

    return {
      totalMembers: this.members.size,
      membersByTier,
      totalPointsIssued,
      totalPointsRedeemed,
      totalRewardsClaimed,
    };
  }
}

// Export singleton
export const loyaltyManager = new UnifiedLoyaltyManager();
