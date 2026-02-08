/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TMA VIRAL ENGINE - COMMUNITY IGNITION SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * SNS 공유 및 레퍼럴을 통한 바이럴 성장 엔진
 *
 * VIRAL MECHANICS:
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │  1. REFERRAL BONUS: 신규 가입 시 추천인/피추천인 모두 K-AUS 보상           │
 * │  2. SHARE-TO-EARN: SNS 공유 시 수익 인증 보너스                            │
 * │  3. MILESTONE REWARDS: 팀 빌딩 마일스톤 달성 보상                          │
 * │  4. LEADERBOARD: 주간/월간 탑 리퍼러 추가 보상                             │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * REWARD TIERS:
 *   Level 1 (1-9 referrals): 50 K-AUS per referral
 *   Level 2 (10-49): 75 K-AUS + 5% of referral's first deposit
 *   Level 3 (50-199): 100 K-AUS + 7% of referral's first deposit
 *   Level 4 (200+): 150 K-AUS + 10% of referral's first deposit + VIP status
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export type ReferralTier = 'STARTER' | 'BUILDER' | 'LEADER' | 'AMBASSADOR';
export type SharePlatform = 'TWITTER' | 'TELEGRAM' | 'KAKAO' | 'FACEBOOK' | 'INSTAGRAM' | 'LINKEDIN' | 'WHATSAPP';

export interface ReferralCode {
  code: string;
  userId: string;
  createdAt: number;
  totalUses: number;
  totalEarned: number;
  isActive: boolean;
}

export interface Referral {
  referralId: string;
  referrerId: string;       // Who referred
  refereeId: string;        // Who was referred
  refereeEmail: string;
  referralCode: string;
  status: 'PENDING' | 'VERIFIED' | 'COMPLETED' | 'EXPIRED';
  signupBonus: number;      // K-AUS
  depositBonus: number;     // K-AUS (% of first deposit)
  firstDeposit: number;
  createdAt: number;
  completedAt?: number;
}

export interface ShareActivity {
  shareId: string;
  userId: string;
  platform: SharePlatform;
  contentType: 'EARNINGS_SCREENSHOT' | 'REFERRAL_LINK' | 'ACHIEVEMENT' | 'MILESTONE';
  kausReward: number;
  verified: boolean;
  shareUrl?: string;
  timestamp: number;
}

export interface UserViralStats {
  userId: string;
  referralCode: string;
  tier: ReferralTier;
  totalReferrals: number;
  activeReferrals: number;
  pendingReferrals: number;
  totalEarned: number;
  currentMonthEarned: number;
  teamTVL: number;
  shareCount: number;
  shareEarnings: number;
  leaderboardRank: number;
  nextTierProgress: number;    // 0-100
  milestones: MilestoneProgress[];
}

export interface MilestoneProgress {
  milestoneId: string;
  name: string;
  description: string;
  target: number;
  current: number;
  reward: number;
  completed: boolean;
  completedAt?: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  referralCount: number;
  totalEarned: number;
  tier: ReferralTier;
  weeklyReferrals: number;
}

export interface VIPCardDispatch {
  dispatchId: string;
  userId: string;
  cardTier: 'GOLD' | 'PLATINUM' | 'BLACK' | 'SOVEREIGN';
  shippingAddress: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED';
  trackingNumber?: string;
  estimatedDelivery?: string;
  createdAt: number;
  shippedAt?: number;
  deliveredAt?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const REFERRAL_TIER_CONFIG = {
  STARTER: {
    minReferrals: 0,
    maxReferrals: 9,
    signupBonus: 50,
    depositBonusRate: 0,
    shareBonus: 5,
    perks: ['Basic referral tracking', '50 K-AUS per signup'],
  },
  BUILDER: {
    minReferrals: 10,
    maxReferrals: 49,
    signupBonus: 75,
    depositBonusRate: 0.05,
    shareBonus: 10,
    perks: ['75 K-AUS per signup', '5% of referral first deposit', 'Priority support'],
  },
  LEADER: {
    minReferrals: 50,
    maxReferrals: 199,
    signupBonus: 100,
    depositBonusRate: 0.07,
    shareBonus: 20,
    perks: ['100 K-AUS per signup', '7% of referral first deposit', 'VIP access', 'Monthly bonus pool'],
  },
  AMBASSADOR: {
    minReferrals: 200,
    maxReferrals: Infinity,
    signupBonus: 150,
    depositBonusRate: 0.10,
    shareBonus: 50,
    perks: ['150 K-AUS per signup', '10% of referral first deposit', 'Sovereign Card', 'Board seat voting', 'Annual retreat invitation'],
  },
};

export const MILESTONE_DEFINITIONS: Omit<MilestoneProgress, 'current' | 'completed' | 'completedAt'>[] = [
  { milestoneId: 'M1', name: 'First Referral', description: 'Get your first friend to join', target: 1, reward: 100 },
  { milestoneId: 'M2', name: 'Builder Start', description: 'Reach 10 referrals', target: 10, reward: 500 },
  { milestoneId: 'M3', name: 'Team Leader', description: 'Reach 50 referrals', target: 50, reward: 2500 },
  { milestoneId: 'M4', name: 'Community Champion', description: 'Reach 100 referrals', target: 100, reward: 7500 },
  { milestoneId: 'M5', name: 'Ambassador Elite', description: 'Reach 200 referrals', target: 200, reward: 20000 },
  { milestoneId: 'M6', name: 'Legendary Recruiter', description: 'Reach 500 referrals', target: 500, reward: 75000 },
  { milestoneId: 'M7', name: 'Empire Builder', description: 'Reach 1000 referrals', target: 1000, reward: 200000 },
];

export const SHARE_REWARDS: Record<SharePlatform, number> = {
  TWITTER: 10,
  TELEGRAM: 15,
  KAKAO: 12,
  FACEBOOK: 8,
  INSTAGRAM: 10,
  LINKEDIN: 12,
  WHATSAPP: 8,
};

// ═══════════════════════════════════════════════════════════════════════════════
// TMA VIRAL ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

class TMAViralEngine {
  private referralCodes: Map<string, ReferralCode> = new Map();
  private referrals: Map<string, Referral> = new Map();
  private shareActivities: ShareActivity[] = [];
  private userStats: Map<string, UserViralStats> = new Map();
  private cardDispatches: Map<string, VIPCardDispatch> = new Map();

  // Global stats
  private totalReferrals: number = 24567;
  private totalViralEarnings: number = 4250000;
  private weeklyNewUsers: number = 1892;

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Boss referral code
    const bossCode: ReferralCode = {
      code: 'SOVEREIGN2026',
      userId: 'USER-BOSS',
      createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000,
      totalUses: 347,
      totalEarned: 125000,
      isActive: true,
    };
    this.referralCodes.set('SOVEREIGN2026', bossCode);

    // Boss stats
    const bossStats: UserViralStats = {
      userId: 'USER-BOSS',
      referralCode: 'SOVEREIGN2026',
      tier: 'AMBASSADOR',
      totalReferrals: 347,
      activeReferrals: 312,
      pendingReferrals: 15,
      totalEarned: 125000,
      currentMonthEarned: 18500,
      teamTVL: 8500000,
      shareCount: 89,
      shareEarnings: 4450,
      leaderboardRank: 1,
      nextTierProgress: 100,
      milestones: this.generateMilestones(347),
    };
    this.userStats.set('USER-BOSS', bossStats);

    // Generate leaderboard mock data
    this.generateMockLeaderboard();

    // Generate VIP card dispatches
    this.generateMockCardDispatches();
  }

  private generateMilestones(referralCount: number): MilestoneProgress[] {
    return MILESTONE_DEFINITIONS.map(m => ({
      ...m,
      current: Math.min(referralCount, m.target),
      completed: referralCount >= m.target,
      completedAt: referralCount >= m.target ? Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000 : undefined,
    }));
  }

  private generateMockLeaderboard(): void {
    // Top 10 referrers
    const names = ['CryptoKing', 'EnergyMaster', 'SolarQueen', 'BlockchainBoss', 'TokenTitan',
      'DeFiDragon', 'YieldYoda', 'StakeShark', 'MiningMogul', 'WealthWizard'];

    for (let i = 0; i < 10; i++) {
      const stats: UserViralStats = {
        userId: `USER-TOP-${i + 1}`,
        referralCode: `TOP${i + 1}CODE`,
        tier: i < 3 ? 'AMBASSADOR' : i < 6 ? 'LEADER' : 'BUILDER',
        totalReferrals: 347 - i * 30 - Math.floor(Math.random() * 20),
        activeReferrals: 0,
        pendingReferrals: 0,
        totalEarned: 125000 - i * 10000,
        currentMonthEarned: 18500 - i * 1500,
        teamTVL: 8500000 - i * 700000,
        shareCount: 89 - i * 7,
        shareEarnings: 4450 - i * 350,
        leaderboardRank: i + 1,
        nextTierProgress: 100,
        milestones: [],
      };
      this.userStats.set(stats.userId, stats);
    }
  }

  private generateMockCardDispatches(): void {
    const dispatches: VIPCardDispatch[] = [
      {
        dispatchId: 'DISP-001',
        userId: 'USER-VIP-001',
        cardTier: 'SOVEREIGN',
        shippingAddress: {
          name: 'Kim Sovereign',
          address1: '123 Gangnam-daero',
          city: 'Seoul',
          state: 'Seoul',
          postalCode: '06141',
          country: 'South Korea',
        },
        status: 'DELIVERED',
        trackingNumber: 'KR123456789',
        createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
        shippedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
        deliveredAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
      },
      {
        dispatchId: 'DISP-002',
        userId: 'USER-VIP-002',
        cardTier: 'BLACK',
        shippingAddress: {
          name: 'Lee Platinum',
          address1: '456 Teheran-ro',
          city: 'Seoul',
          state: 'Seoul',
          postalCode: '06168',
          country: 'South Korea',
        },
        status: 'SHIPPED',
        trackingNumber: 'KR987654321',
        estimatedDelivery: '2026-01-27',
        createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        shippedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      },
    ];

    dispatches.forEach(d => this.cardDispatches.set(d.dispatchId, d));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generate referral code for user
   */
  generateReferralCode(userId: string, customCode?: string): ReferralCode {
    const code = customCode || `NEXUS${Date.now().toString(36).toUpperCase()}`;

    const referralCode: ReferralCode = {
      code,
      userId,
      createdAt: Date.now(),
      totalUses: 0,
      totalEarned: 0,
      isActive: true,
    };

    this.referralCodes.set(code, referralCode);
    return referralCode;
  }

  /**
   * Process new referral signup
   */
  processReferral(params: {
    referralCode: string;
    newUserId: string;
    newUserEmail: string;
  }): Referral {
    const code = this.referralCodes.get(params.referralCode);
    if (!code || !code.isActive) {
      throw new Error('Invalid or inactive referral code');
    }

    const referrerStats = this.userStats.get(code.userId);
    const tierConfig = referrerStats
      ? REFERRAL_TIER_CONFIG[referrerStats.tier]
      : REFERRAL_TIER_CONFIG.STARTER;

    const referral: Referral = {
      referralId: `REF-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      referrerId: code.userId,
      refereeId: params.newUserId,
      refereeEmail: params.newUserEmail,
      referralCode: params.referralCode,
      status: 'PENDING',
      signupBonus: tierConfig.signupBonus,
      depositBonus: 0,
      firstDeposit: 0,
      createdAt: Date.now(),
    };

    this.referrals.set(referral.referralId, referral);

    // Update code stats
    code.totalUses++;

    return referral;
  }

  /**
   * Complete referral when referee makes first deposit
   */
  completeReferral(referralId: string, firstDeposit: number): Referral {
    const referral = this.referrals.get(referralId);
    if (!referral) throw new Error('Referral not found');

    const referrerStats = this.userStats.get(referral.referrerId);
    const tierConfig = referrerStats
      ? REFERRAL_TIER_CONFIG[referrerStats.tier]
      : REFERRAL_TIER_CONFIG.STARTER;

    referral.firstDeposit = firstDeposit;
    referral.depositBonus = firstDeposit * tierConfig.depositBonusRate;
    referral.status = 'COMPLETED';
    referral.completedAt = Date.now();

    // Update referrer stats
    if (referrerStats) {
      referrerStats.totalReferrals++;
      referrerStats.activeReferrals++;
      referrerStats.totalEarned += referral.signupBonus + referral.depositBonus;
      referrerStats.currentMonthEarned += referral.signupBonus + referral.depositBonus;

      // Check tier upgrade
      this.checkTierUpgrade(referrerStats);

      // Update milestones
      this.updateMilestones(referrerStats);
    }

    // Update code earnings
    const code = this.referralCodes.get(referral.referralCode);
    if (code) {
      code.totalEarned += referral.signupBonus + referral.depositBonus;
    }

    return referral;
  }

  /**
   * Record share activity
   */
  recordShare(params: {
    userId: string;
    platform: SharePlatform;
    contentType: ShareActivity['contentType'];
    shareUrl?: string;
  }): ShareActivity {
    const userStats = this.userStats.get(params.userId);
    const tierConfig = userStats
      ? REFERRAL_TIER_CONFIG[userStats.tier]
      : REFERRAL_TIER_CONFIG.STARTER;

    const baseReward = SHARE_REWARDS[params.platform];
    const tierMultiplier = tierConfig.shareBonus / REFERRAL_TIER_CONFIG.STARTER.shareBonus;

    const share: ShareActivity = {
      shareId: `SHARE-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      userId: params.userId,
      platform: params.platform,
      contentType: params.contentType,
      kausReward: Math.floor(baseReward * tierMultiplier),
      verified: true, // In production, verify via API
      shareUrl: params.shareUrl,
      timestamp: Date.now(),
    };

    this.shareActivities.push(share);

    // Update user stats
    if (userStats) {
      userStats.shareCount++;
      userStats.shareEarnings += share.kausReward;
    }

    return share;
  }

  /**
   * Get user viral stats
   */
  getUserStats(userId: string): UserViralStats | undefined {
    return this.userStats.get(userId);
  }

  /**
   * Get leaderboard
   */
  getLeaderboard(limit: number = 10, period: 'weekly' | 'monthly' | 'all' = 'all'): LeaderboardEntry[] {
    const stats = Array.from(this.userStats.values())
      .sort((a, b) => b.totalReferrals - a.totalReferrals)
      .slice(0, limit);

    return stats.map((s, idx) => ({
      rank: idx + 1,
      userId: s.userId,
      displayName: s.userId === 'USER-BOSS' ? 'SOVEREIGN' : `User ${s.userId.slice(-4)}`,
      referralCount: s.totalReferrals,
      totalEarned: s.totalEarned,
      tier: s.tier,
      weeklyReferrals: Math.floor(s.totalReferrals * 0.1), // Mock weekly
    }));
  }

  /**
   * Generate shareable content
   */
  generateShareContent(userId: string, type: 'EARNINGS' | 'REFERRAL' | 'ACHIEVEMENT'): {
    text: string;
    imageUrl?: string;
    referralLink: string;
  } {
    const stats = this.userStats.get(userId);
    const code = Array.from(this.referralCodes.values()).find(c => c.userId === userId);

    const referralLink = `https://nexus-x.io/join?ref=${code?.code || 'NEXUS'}`;

    let text = '';
    switch (type) {
      case 'EARNINGS':
        text = `I just earned ${stats?.currentMonthEarned.toLocaleString() || '0'} K-AUS this month on NEXUS-X! Join the energy revolution and start earning passive income from renewable energy trading. Use my link: ${referralLink}`;
        break;
      case 'REFERRAL':
        text = `Join me on NEXUS-X and get 50 K-AUS bonus! Trade energy, earn dividends, and be part of the $1B+ energy trading ecosystem. ${referralLink}`;
        break;
      case 'ACHIEVEMENT':
        text = `Just reached ${stats?.tier || 'STARTER'} tier on NEXUS-X with ${stats?.totalReferrals || 0} referrals! Building my energy empire one friend at a time. Join the movement: ${referralLink}`;
        break;
    }

    return { text, referralLink };
  }

  /**
   * Request VIP card dispatch
   */
  requestCardDispatch(params: {
    userId: string;
    cardTier: VIPCardDispatch['cardTier'];
    shippingAddress: VIPCardDispatch['shippingAddress'];
  }): VIPCardDispatch {
    const dispatch: VIPCardDispatch = {
      dispatchId: `DISP-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      userId: params.userId,
      cardTier: params.cardTier,
      shippingAddress: params.shippingAddress,
      status: 'PENDING',
      createdAt: Date.now(),
    };

    this.cardDispatches.set(dispatch.dispatchId, dispatch);
    return dispatch;
  }

  /**
   * Get card dispatch status
   */
  getCardDispatch(dispatchId: string): VIPCardDispatch | undefined {
    return this.cardDispatches.get(dispatchId);
  }

  /**
   * Get all card dispatches for admin
   */
  getAllCardDispatches(): VIPCardDispatch[] {
    return Array.from(this.cardDispatches.values())
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get global viral metrics
   */
  getGlobalMetrics(): {
    totalReferrals: number;
    totalViralEarnings: number;
    weeklyNewUsers: number;
    topReferrerEarnings: number;
    averageReferralsPerUser: number;
  } {
    return {
      totalReferrals: this.totalReferrals,
      totalViralEarnings: this.totalViralEarnings,
      weeklyNewUsers: this.weeklyNewUsers,
      topReferrerEarnings: 125000,
      averageReferralsPerUser: 5.2,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  private checkTierUpgrade(stats: UserViralStats): void {
    const tiers: ReferralTier[] = ['STARTER', 'BUILDER', 'LEADER', 'AMBASSADOR'];

    for (const tier of tiers.reverse()) {
      const config = REFERRAL_TIER_CONFIG[tier];
      if (stats.totalReferrals >= config.minReferrals) {
        if (stats.tier !== tier) {
          stats.tier = tier;
          // Could trigger notification here
        }
        break;
      }
    }

    // Calculate progress to next tier
    const currentConfig = REFERRAL_TIER_CONFIG[stats.tier];
    const nextTierIdx = tiers.indexOf(stats.tier) + 1;

    if (nextTierIdx < tiers.length) {
      const nextConfig = REFERRAL_TIER_CONFIG[tiers[nextTierIdx]];
      stats.nextTierProgress = Math.min(100,
        ((stats.totalReferrals - currentConfig.minReferrals) /
          (nextConfig.minReferrals - currentConfig.minReferrals)) * 100
      );
    } else {
      stats.nextTierProgress = 100;
    }
  }

  private updateMilestones(stats: UserViralStats): void {
    stats.milestones = MILESTONE_DEFINITIONS.map(m => {
      const existing = stats.milestones.find(em => em.milestoneId === m.milestoneId);
      const completed = stats.totalReferrals >= m.target;
      const wasCompleted = existing?.completed || false;

      return {
        ...m,
        current: Math.min(stats.totalReferrals, m.target),
        completed,
        completedAt: completed && !wasCompleted ? Date.now() : existing?.completedAt,
      };
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON & EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const viralEngine = new TMAViralEngine();

// Convenience exports
export const generateReferralCode = (userId: string, customCode?: string) =>
  viralEngine.generateReferralCode(userId, customCode);
export const processReferral = (params: Parameters<typeof viralEngine.processReferral>[0]) =>
  viralEngine.processReferral(params);
export const completeReferral = (referralId: string, firstDeposit: number) =>
  viralEngine.completeReferral(referralId, firstDeposit);
export const recordShare = (params: Parameters<typeof viralEngine.recordShare>[0]) =>
  viralEngine.recordShare(params);
export const getUserViralStats = (userId: string) => viralEngine.getUserStats(userId);
export const getViralLeaderboard = (limit?: number) => viralEngine.getLeaderboard(limit);
export const generateShareContent = (userId: string, type: 'EARNINGS' | 'REFERRAL' | 'ACHIEVEMENT') =>
  viralEngine.generateShareContent(userId, type);
export const requestCardDispatch = (params: Parameters<typeof viralEngine.requestCardDispatch>[0]) =>
  viralEngine.requestCardDispatch(params);
export const getGlobalViralMetrics = () => viralEngine.getGlobalMetrics();

export { TMAViralEngine };
