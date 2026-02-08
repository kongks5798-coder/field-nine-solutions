/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 56: REFERRAL & REWARDS SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════
 * - Multi-tier referral program
 * - Commission structure
 * - Leaderboard system
 * - Achievement badges
 * - Reward distribution
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type ReferralTier = 'STARTER' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'AMBASSADOR';
export type RewardType = 'SIGNUP_BONUS' | 'TRADING_COMMISSION' | 'STAKING_BONUS' | 'MILESTONE' | 'LEADERBOARD';
export type BadgeCategory = 'REFERRAL' | 'TRADING' | 'STAKING' | 'COMMUNITY' | 'SPECIAL';

export interface ReferralCode {
  code: string;
  userId: string;
  createdAt: Date;
  totalUses: number;
  isActive: boolean;
  customAlias?: string;
}

export interface ReferralUser {
  id: string;
  name: string;
  avatar: string;
  joinedAt: Date;
  referralCode: string;
  referredBy?: string;
  tier: ReferralTier;
  // Stats
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  pendingRewards: number;
  lifetimeVolume: number;
  // Referral tree
  directReferrals: ReferredUser[];
  indirectReferrals: number;
}

export interface ReferredUser {
  id: string;
  name: string;
  avatar: string;
  joinedAt: Date;
  tradingVolume: number;
  stakingAmount: number;
  earnedForReferrer: number;
  isActive: boolean;
  tier: number; // 1 = direct, 2 = indirect
}

export interface ReferralReward {
  id: string;
  type: RewardType;
  amount: number;
  currency: string;
  fromUser?: string;
  description: string;
  descriptionKo: string;
  earnedAt: Date;
  claimedAt?: Date;
  status: 'PENDING' | 'CLAIMABLE' | 'CLAIMED' | 'EXPIRED';
}

export interface TierInfo {
  tier: ReferralTier;
  name: string;
  nameKo: string;
  icon: string;
  color: string;
  minReferrals: number;
  commissionRate: number; // percentage
  tier2CommissionRate: number; // for indirect referrals
  bonuses: string[];
}

export interface Badge {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  descriptionKo: string;
  icon: string;
  category: BadgeCategory;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  requirement: string;
  earnedAt?: Date;
  progress?: number;
  maxProgress?: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string;
  tier: ReferralTier;
  totalReferrals: number;
  totalEarnings: number;
  monthlyReferrals: number;
  monthlyEarnings: number;
  isCurrentUser?: boolean;
}

export interface ReferralStats {
  totalUsers: number;
  totalReferrals: number;
  totalRewardsDistributed: number;
  averageReferralsPerUser: number;
  topTier: ReferralTier;
  activePrograms: number;
}

export interface Campaign {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  descriptionKo: string;
  bonusMultiplier: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  requirements?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export const TIER_CONFIG: Record<ReferralTier, TierInfo> = {
  STARTER: {
    tier: 'STARTER',
    name: 'Starter',
    nameKo: '스타터',
    icon: '🌱',
    color: 'neutral',
    minReferrals: 0,
    commissionRate: 10,
    tier2CommissionRate: 0,
    bonuses: ['기본 추천 보상'],
  },
  BRONZE: {
    tier: 'BRONZE',
    name: 'Bronze',
    nameKo: '브론즈',
    icon: '🥉',
    color: 'amber',
    minReferrals: 3,
    commissionRate: 12,
    tier2CommissionRate: 2,
    bonuses: ['12% 거래 수수료', '2단계 추천 보상'],
  },
  SILVER: {
    tier: 'SILVER',
    name: 'Silver',
    nameKo: '실버',
    icon: '🥈',
    color: 'slate',
    minReferrals: 10,
    commissionRate: 15,
    tier2CommissionRate: 3,
    bonuses: ['15% 거래 수수료', '전용 프로모션 코드'],
  },
  GOLD: {
    tier: 'GOLD',
    name: 'Gold',
    nameKo: '골드',
    icon: '🥇',
    color: 'yellow',
    minReferrals: 25,
    commissionRate: 18,
    tier2CommissionRate: 5,
    bonuses: ['18% 거래 수수료', '월간 보너스 에어드랍'],
  },
  PLATINUM: {
    tier: 'PLATINUM',
    name: 'Platinum',
    nameKo: '플래티넘',
    icon: '💎',
    color: 'cyan',
    minReferrals: 50,
    commissionRate: 22,
    tier2CommissionRate: 7,
    bonuses: ['22% 거래 수수료', 'VIP 전용 이벤트 초대'],
  },
  DIAMOND: {
    tier: 'DIAMOND',
    name: 'Diamond',
    nameKo: '다이아몬드',
    icon: '💠',
    color: 'blue',
    minReferrals: 100,
    commissionRate: 25,
    tier2CommissionRate: 10,
    bonuses: ['25% 거래 수수료', '개인 매니저 배정'],
  },
  AMBASSADOR: {
    tier: 'AMBASSADOR',
    name: 'Ambassador',
    nameKo: '앰배서더',
    icon: '👑',
    color: 'violet',
    minReferrals: 250,
    commissionRate: 30,
    tier2CommissionRate: 12,
    bonuses: ['30% 거래 수수료', '브랜드 파트너십', '특별 NFT 배지'],
  },
};

const SIGNUP_BONUS = 500; // KAUS
const REFERRER_BONUS = 1000; // KAUS

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_USER: ReferralUser = {
  id: 'user-001',
  name: 'Field Nine User',
  avatar: '👤',
  joinedAt: new Date(Date.now() - 86400000 * 90),
  referralCode: 'KAUS2025',
  tier: 'GOLD',
  totalReferrals: 28,
  activeReferrals: 24,
  totalEarnings: 125000,
  pendingRewards: 8500,
  lifetimeVolume: 5000000,
  directReferrals: [
    {
      id: 'ref-1',
      name: 'Alice Kim',
      avatar: '👩',
      joinedAt: new Date(Date.now() - 86400000 * 45),
      tradingVolume: 250000,
      stakingAmount: 15000,
      earnedForReferrer: 4500,
      isActive: true,
      tier: 1,
    },
    {
      id: 'ref-2',
      name: 'Bob Lee',
      avatar: '👨',
      joinedAt: new Date(Date.now() - 86400000 * 30),
      tradingVolume: 180000,
      stakingAmount: 8000,
      earnedForReferrer: 3240,
      isActive: true,
      tier: 1,
    },
    {
      id: 'ref-3',
      name: 'Charlie Park',
      avatar: '🧑',
      joinedAt: new Date(Date.now() - 86400000 * 20),
      tradingVolume: 320000,
      stakingAmount: 25000,
      earnedForReferrer: 5760,
      isActive: true,
      tier: 1,
    },
    {
      id: 'ref-4',
      name: 'Diana Cho',
      avatar: '👩‍💼',
      joinedAt: new Date(Date.now() - 86400000 * 15),
      tradingVolume: 95000,
      stakingAmount: 5000,
      earnedForReferrer: 1710,
      isActive: true,
      tier: 1,
    },
    {
      id: 'ref-5',
      name: 'Edward Jung',
      avatar: '👨‍💻',
      joinedAt: new Date(Date.now() - 86400000 * 7),
      tradingVolume: 45000,
      stakingAmount: 2000,
      earnedForReferrer: 810,
      isActive: false,
      tier: 1,
    },
  ],
  indirectReferrals: 12,
};

const MOCK_REWARDS: ReferralReward[] = [
  {
    id: 'reward-1',
    type: 'TRADING_COMMISSION',
    amount: 2500,
    currency: 'KAUS',
    fromUser: 'Alice Kim',
    description: 'Trading commission from Alice Kim',
    descriptionKo: 'Alice Kim의 거래 수수료',
    earnedAt: new Date(Date.now() - 3600000 * 2),
    status: 'CLAIMABLE',
  },
  {
    id: 'reward-2',
    type: 'SIGNUP_BONUS',
    amount: 1000,
    currency: 'KAUS',
    fromUser: 'Edward Jung',
    description: 'New referral signup bonus',
    descriptionKo: '신규 추천인 가입 보너스',
    earnedAt: new Date(Date.now() - 86400000 * 7),
    claimedAt: new Date(Date.now() - 86400000 * 6),
    status: 'CLAIMED',
  },
  {
    id: 'reward-3',
    type: 'MILESTONE',
    amount: 5000,
    currency: 'KAUS',
    description: '25 referrals milestone achieved',
    descriptionKo: '25명 추천 마일스톤 달성',
    earnedAt: new Date(Date.now() - 86400000 * 14),
    claimedAt: new Date(Date.now() - 86400000 * 13),
    status: 'CLAIMED',
  },
  {
    id: 'reward-4',
    type: 'STAKING_BONUS',
    amount: 1200,
    currency: 'KAUS',
    fromUser: 'Charlie Park',
    description: 'Staking bonus from Charlie Park',
    descriptionKo: 'Charlie Park의 스테이킹 보너스',
    earnedAt: new Date(Date.now() - 86400000),
    status: 'CLAIMABLE',
  },
];

const MOCK_BADGES: Badge[] = [
  {
    id: 'badge-first-referral',
    name: 'First Referral',
    nameKo: '첫 추천',
    description: 'Referred your first user',
    descriptionKo: '첫 번째 사용자를 추천했습니다',
    icon: '🎯',
    category: 'REFERRAL',
    rarity: 'COMMON',
    requirement: 'Refer 1 user',
    earnedAt: new Date(Date.now() - 86400000 * 85),
  },
  {
    id: 'badge-network-builder',
    name: 'Network Builder',
    nameKo: '네트워크 빌더',
    description: 'Built a network of 10+ referrals',
    descriptionKo: '10명 이상의 추천 네트워크를 구축했습니다',
    icon: '🌐',
    category: 'REFERRAL',
    rarity: 'RARE',
    requirement: 'Refer 10 users',
    earnedAt: new Date(Date.now() - 86400000 * 60),
  },
  {
    id: 'badge-gold-referrer',
    name: 'Gold Referrer',
    nameKo: '골드 추천인',
    description: 'Reached Gold tier in referral program',
    descriptionKo: '추천 프로그램에서 골드 티어 달성',
    icon: '🥇',
    category: 'REFERRAL',
    rarity: 'EPIC',
    requirement: 'Reach Gold tier',
    earnedAt: new Date(Date.now() - 86400000 * 30),
  },
  {
    id: 'badge-whale-maker',
    name: 'Whale Maker',
    nameKo: '고래 메이커',
    description: 'Referred users with 1M+ volume',
    descriptionKo: '100만 이상 거래량의 사용자를 추천',
    icon: '🐋',
    category: 'REFERRAL',
    rarity: 'LEGENDARY',
    requirement: 'Referrals with 1M+ trading volume',
    progress: 75,
    maxProgress: 100,
  },
  {
    id: 'badge-community-star',
    name: 'Community Star',
    nameKo: '커뮤니티 스타',
    description: 'Active community contributor',
    descriptionKo: '활발한 커뮤니티 기여자',
    icon: '⭐',
    category: 'COMMUNITY',
    rarity: 'RARE',
    requirement: 'Contribute to community',
    earnedAt: new Date(Date.now() - 86400000 * 20),
  },
];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, userId: 'u1', name: 'CryptoKing', avatar: '👑', tier: 'AMBASSADOR', totalReferrals: 487, totalEarnings: 1250000, monthlyReferrals: 45, monthlyEarnings: 125000 },
  { rank: 2, userId: 'u2', name: 'BlockchainQueen', avatar: '👸', tier: 'DIAMOND', totalReferrals: 312, totalEarnings: 890000, monthlyReferrals: 38, monthlyEarnings: 98000 },
  { rank: 3, userId: 'u3', name: 'DeFiMaster', avatar: '🧙', tier: 'DIAMOND', totalReferrals: 256, totalEarnings: 720000, monthlyReferrals: 32, monthlyEarnings: 85000 },
  { rank: 4, userId: 'u4', name: 'TokenTrader', avatar: '📈', tier: 'PLATINUM', totalReferrals: 189, totalEarnings: 520000, monthlyReferrals: 28, monthlyEarnings: 62000 },
  { rank: 5, userId: 'u5', name: 'CryptoNinja', avatar: '🥷', tier: 'PLATINUM', totalReferrals: 156, totalEarnings: 430000, monthlyReferrals: 24, monthlyEarnings: 48000 },
  { rank: 6, userId: 'u6', name: 'BlockWizard', avatar: '🧙‍♂️', tier: 'GOLD', totalReferrals: 98, totalEarnings: 280000, monthlyReferrals: 18, monthlyEarnings: 35000 },
  { rank: 7, userId: 'u7', name: 'ChainChampion', avatar: '🏆', tier: 'GOLD', totalReferrals: 72, totalEarnings: 195000, monthlyReferrals: 12, monthlyEarnings: 22000 },
  { rank: 8, userId: 'user-001', name: 'Field Nine User', avatar: '👤', tier: 'GOLD', totalReferrals: 28, totalEarnings: 125000, monthlyReferrals: 8, monthlyEarnings: 18000, isCurrentUser: true },
  { rank: 9, userId: 'u9', name: 'KAUSHolder', avatar: '💰', tier: 'SILVER', totalReferrals: 24, totalEarnings: 68000, monthlyReferrals: 6, monthlyEarnings: 12000 },
  { rank: 10, userId: 'u10', name: 'EnergyTrader', avatar: '⚡', tier: 'SILVER', totalReferrals: 18, totalEarnings: 52000, monthlyReferrals: 5, monthlyEarnings: 8500 },
];

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'campaign-1',
    name: 'New Year Boost',
    nameKo: '새해 부스트 캠페인',
    description: 'Double rewards for all referrals in January',
    descriptionKo: '1월 모든 추천에 대해 2배 보상',
    bonusMultiplier: 2.0,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-01-31'),
    isActive: true,
    requirements: ['신규 가입자만 해당', '최소 거래량 10만원'],
  },
  {
    id: 'campaign-2',
    name: 'Staking Referral Bonus',
    nameKo: '스테이킹 추천 보너스',
    description: 'Extra 5% for referrals who stake',
    descriptionKo: '스테이킹하는 추천인에게 추가 5% 보너스',
    bonusMultiplier: 1.5,
    startDate: new Date('2026-01-15'),
    endDate: new Date('2026-02-15'),
    isActive: true,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// REFERRAL CODE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function generateReferralCode(userId: string): ReferralCode {
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const code = `KAUS${randomPart}`;

  return {
    code,
    userId,
    createdAt: new Date(),
    totalUses: 0,
    isActive: true,
  };
}

export function validateReferralCode(code: string): boolean {
  // In real implementation, check against database
  return code.startsWith('KAUS') && code.length >= 8;
}

export function applyReferralCode(code: string, newUserId: string): { success: boolean; bonus: number } {
  if (!validateReferralCode(code)) {
    return { success: false, bonus: 0 };
  }

  // Both referrer and referee get bonuses
  return { success: true, bonus: SIGNUP_BONUS };
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function getUserReferralProfile(userId: string): ReferralUser {
  return MOCK_USER;
}

export function calculateTier(totalReferrals: number): ReferralTier {
  if (totalReferrals >= 250) return 'AMBASSADOR';
  if (totalReferrals >= 100) return 'DIAMOND';
  if (totalReferrals >= 50) return 'PLATINUM';
  if (totalReferrals >= 25) return 'GOLD';
  if (totalReferrals >= 10) return 'SILVER';
  if (totalReferrals >= 3) return 'BRONZE';
  return 'STARTER';
}

export function getTierProgress(user: ReferralUser): { current: ReferralTier; next: ReferralTier | null; progress: number; remaining: number } {
  const tiers: ReferralTier[] = ['STARTER', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'AMBASSADOR'];
  const currentIndex = tiers.indexOf(user.tier);

  if (currentIndex === tiers.length - 1) {
    return { current: user.tier, next: null, progress: 100, remaining: 0 };
  }

  const nextTier = tiers[currentIndex + 1];
  const currentMin = TIER_CONFIG[user.tier].minReferrals;
  const nextMin = TIER_CONFIG[nextTier].minReferrals;
  const progress = Math.min(100, ((user.totalReferrals - currentMin) / (nextMin - currentMin)) * 100);
  const remaining = Math.max(0, nextMin - user.totalReferrals);

  return { current: user.tier, next: nextTier, progress, remaining };
}

// ═══════════════════════════════════════════════════════════════════════════════
// REWARDS FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function getUserRewards(userId: string): ReferralReward[] {
  return MOCK_REWARDS;
}

export function getClaimableRewards(userId: string): ReferralReward[] {
  return MOCK_REWARDS.filter(r => r.status === 'CLAIMABLE');
}

export function claimReward(rewardId: string): boolean {
  const reward = MOCK_REWARDS.find(r => r.id === rewardId);
  if (!reward || reward.status !== 'CLAIMABLE') return false;
  return true;
}

export function claimAllRewards(userId: string): { success: boolean; totalClaimed: number } {
  const claimable = getClaimableRewards(userId);
  const total = claimable.reduce((sum, r) => sum + r.amount, 0);
  return { success: true, totalClaimed: total };
}

export function calculateCommission(volume: number, tier: ReferralTier, referralTier: number = 1): number {
  const tierInfo = TIER_CONFIG[tier];
  const rate = referralTier === 1 ? tierInfo.commissionRate : tierInfo.tier2CommissionRate;
  return (volume * rate) / 100;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BADGES FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function getUserBadges(userId: string): Badge[] {
  return MOCK_BADGES;
}

export function getEarnedBadges(userId: string): Badge[] {
  return MOCK_BADGES.filter(b => b.earnedAt);
}

export function getInProgressBadges(userId: string): Badge[] {
  return MOCK_BADGES.filter(b => !b.earnedAt && b.progress !== undefined);
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEADERBOARD FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function getLeaderboard(period: 'all' | 'monthly' = 'all', limit: number = 10): LeaderboardEntry[] {
  let sorted = [...MOCK_LEADERBOARD];

  if (period === 'monthly') {
    sorted = sorted.sort((a, b) => b.monthlyReferrals - a.monthlyReferrals);
    sorted = sorted.map((entry, index) => ({ ...entry, rank: index + 1 }));
  }

  return sorted.slice(0, limit);
}

export function getUserRank(userId: string): LeaderboardEntry | null {
  return MOCK_LEADERBOARD.find(e => e.userId === userId) || null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CAMPAIGN FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function getActiveCampaigns(): Campaign[] {
  const now = new Date();
  return MOCK_CAMPAIGNS.filter(c => c.isActive && c.startDate <= now && c.endDate >= now);
}

export function getCampaignById(id: string): Campaign | null {
  return MOCK_CAMPAIGNS.find(c => c.id === id) || null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATS FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function getReferralStats(): ReferralStats {
  return {
    totalUsers: 12500,
    totalReferrals: 45800,
    totalRewardsDistributed: 25000000,
    averageReferralsPerUser: 3.66,
    topTier: 'AMBASSADOR',
    activePrograms: 2,
  };
}

export interface UserStats {
  totalReferrals: number;
  directReferrals: number;
  indirectReferrals: number;
  totalEarnedKAUS: number;
  pendingRewardsKAUS: number;
  monthlyReferrals: number;
  monthlyEarnedKAUS: number;
  leaderboardRank: number;
  tier: ReferralTier;
  badges: Badge[];
  referralCode: string;
}

export function getUserStats(userId: string): UserStats {
  const user = getUserReferralProfile(userId);
  const userRank = getUserRank(userId);
  const badges = getUserBadges(userId);

  return {
    totalReferrals: user.totalReferrals,
    directReferrals: user.directReferrals.length,
    indirectReferrals: user.indirectReferrals,
    totalEarnedKAUS: user.totalEarnings,
    pendingRewardsKAUS: user.pendingRewards,
    monthlyReferrals: 8, // Mock monthly data
    monthlyEarnedKAUS: 18000, // Mock monthly data
    leaderboardRank: userRank?.rank || 99,
    tier: user.tier,
    badges,
    referralCode: user.referralCode,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function generateShareLink(code: string): string {
  return `https://m.fieldnine.io/join?ref=${code}`;
}

export function generateShareMessage(code: string, lang: 'ko' | 'en' = 'ko'): string {
  const link = generateShareLink(code);

  if (lang === 'ko') {
    return `Field Nine에서 에너지 거래의 미래를 경험하세요! 지금 가입하면 ${SIGNUP_BONUS} KAUS를 드립니다. ${link}`;
  }

  return `Experience the future of energy trading at Field Nine! Sign up now and get ${SIGNUP_BONUS} KAUS. ${link}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const ReferralEngine = {
  // Code
  generateReferralCode,
  validateReferralCode,
  applyReferralCode,
  // User
  getUserReferralProfile,
  calculateTier,
  getTierProgress,
  getUserStats,
  // Rewards
  getUserRewards,
  getClaimableRewards,
  claimReward,
  claimAllRewards,
  calculateCommission,
  // Badges
  getUserBadges,
  getEarnedBadges,
  getInProgressBadges,
  // Leaderboard
  getLeaderboard,
  getUserRank,
  // Campaigns
  getActiveCampaigns,
  getCampaignById,
  // Stats
  getReferralStats,
  // Share
  generateShareLink,
  generateShareMessage,
  // Config
  TIER_CONFIG,
  SIGNUP_BONUS,
  REFERRER_BONUS,
};

export default ReferralEngine;
