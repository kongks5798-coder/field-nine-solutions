/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 57: ACHIEVEMENT & QUEST SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════
 * - Daily/Weekly/Monthly quests
 * - Achievement badges
 * - XP & Level system
 * - Seasonal challenges
 * - Rewards distribution
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type QuestType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SEASONAL' | 'SPECIAL';
export type QuestCategory = 'TRADING' | 'STAKING' | 'REFERRAL' | 'SOCIAL' | 'GOVERNANCE' | 'LEARNING';
export type AchievementRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';
export type RewardType = 'KAUS' | 'XP' | 'BADGE' | 'NFT' | 'MULTIPLIER' | 'TITLE';

export interface Quest {
  id: string;
  type: QuestType;
  category: QuestCategory;
  name: string;
  nameKo: string;
  description: string;
  descriptionKo: string;
  icon: string;
  // Progress
  currentProgress: number;
  targetProgress: number;
  unit: string;
  unitKo: string;
  // Rewards
  rewards: QuestReward[];
  xpReward: number;
  // Time
  startTime: Date;
  endTime: Date;
  isCompleted: boolean;
  isClaimed: boolean;
  // Requirements
  minLevel?: number;
  prerequisiteQuests?: string[];
}

export interface QuestReward {
  type: RewardType;
  amount: number;
  item?: string;
  itemKo?: string;
}

export interface Achievement {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  descriptionKo: string;
  icon: string;
  rarity: AchievementRarity;
  category: QuestCategory;
  // Progress
  currentProgress: number;
  targetProgress: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  // Rewards
  rewards: QuestReward[];
  xpReward: number;
  // Tiers
  tier?: number;
  maxTier?: number;
  nextTierTarget?: number;
}

export interface UserLevel {
  level: number;
  currentXP: number;
  requiredXP: number;
  totalXP: number;
  title: string;
  titleKo: string;
  nextTitle?: string;
  nextTitleKo?: string;
  perks: string[];
}

export interface Season {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  descriptionKo: string;
  theme: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  rewards: SeasonReward[];
  milestones: SeasonMilestone[];
}

export interface SeasonMilestone {
  level: number;
  xpRequired: number;
  rewards: QuestReward[];
  isUnlocked: boolean;
  isClaimed: boolean;
}

export interface SeasonReward {
  tier: 'FREE' | 'PREMIUM';
  level: number;
  rewards: QuestReward[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string;
  level: number;
  totalXP: number;
  achievementsUnlocked: number;
  questsCompleted: number;
  isCurrentUser?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const LEVEL_TITLES: { level: number; title: string; titleKo: string }[] = [
  { level: 1, title: 'Newcomer', titleKo: '뉴비' },
  { level: 5, title: 'Apprentice', titleKo: '견습생' },
  { level: 10, title: 'Trader', titleKo: '트레이더' },
  { level: 15, title: 'Expert', titleKo: '전문가' },
  { level: 20, title: 'Master', titleKo: '마스터' },
  { level: 30, title: 'Grandmaster', titleKo: '그랜드마스터' },
  { level: 40, title: 'Legend', titleKo: '레전드' },
  { level: 50, title: 'Mythic', titleKo: '신화' },
  { level: 75, title: 'Transcendent', titleKo: '초월자' },
  { level: 100, title: 'Sovereign', titleKo: '지배자' },
];

const XP_PER_LEVEL = 1000; // Base XP per level
const XP_MULTIPLIER = 1.15; // Each level requires 15% more XP

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_DAILY_QUESTS: Quest[] = [
  {
    id: 'daily-trade-1',
    type: 'DAILY',
    category: 'TRADING',
    name: 'Daily Trader',
    nameKo: '일일 거래',
    description: 'Complete 3 trades today',
    descriptionKo: '오늘 3회 거래 완료하기',
    icon: '📈',
    currentProgress: 2,
    targetProgress: 3,
    unit: 'trades',
    unitKo: '거래',
    rewards: [{ type: 'KAUS', amount: 100 }],
    xpReward: 50,
    startTime: new Date(new Date().setHours(0, 0, 0, 0)),
    endTime: new Date(new Date().setHours(23, 59, 59, 999)),
    isCompleted: false,
    isClaimed: false,
  },
  {
    id: 'daily-stake-1',
    type: 'DAILY',
    category: 'STAKING',
    name: 'Stake Streak',
    nameKo: '스테이킹 스트릭',
    description: 'Maintain your staking position',
    descriptionKo: '스테이킹 포지션 유지하기',
    icon: '🔒',
    currentProgress: 1,
    targetProgress: 1,
    unit: 'day',
    unitKo: '일',
    rewards: [{ type: 'KAUS', amount: 50 }],
    xpReward: 30,
    startTime: new Date(new Date().setHours(0, 0, 0, 0)),
    endTime: new Date(new Date().setHours(23, 59, 59, 999)),
    isCompleted: true,
    isClaimed: false,
  },
  {
    id: 'daily-login-1',
    type: 'DAILY',
    category: 'SOCIAL',
    name: 'Daily Check-in',
    nameKo: '일일 출석',
    description: 'Log in to the platform',
    descriptionKo: '플랫폼에 로그인하기',
    icon: '✅',
    currentProgress: 1,
    targetProgress: 1,
    unit: 'login',
    unitKo: '로그인',
    rewards: [{ type: 'KAUS', amount: 25 }],
    xpReward: 20,
    startTime: new Date(new Date().setHours(0, 0, 0, 0)),
    endTime: new Date(new Date().setHours(23, 59, 59, 999)),
    isCompleted: true,
    isClaimed: true,
  },
];

const MOCK_WEEKLY_QUESTS: Quest[] = [
  {
    id: 'weekly-volume-1',
    type: 'WEEKLY',
    category: 'TRADING',
    name: 'Weekly Volume',
    nameKo: '주간 거래량',
    description: 'Trade 1,000,000 KRW worth of assets',
    descriptionKo: '100만원 이상 거래하기',
    icon: '💹',
    currentProgress: 750000,
    targetProgress: 1000000,
    unit: 'KRW',
    unitKo: '원',
    rewards: [{ type: 'KAUS', amount: 500 }],
    xpReward: 200,
    startTime: new Date(Date.now() - 86400000 * 3),
    endTime: new Date(Date.now() + 86400000 * 4),
    isCompleted: false,
    isClaimed: false,
  },
  {
    id: 'weekly-referral-1',
    type: 'WEEKLY',
    category: 'REFERRAL',
    name: 'Invite Friends',
    nameKo: '친구 초대',
    description: 'Invite 2 friends this week',
    descriptionKo: '이번 주 친구 2명 초대하기',
    icon: '👥',
    currentProgress: 1,
    targetProgress: 2,
    unit: 'friends',
    unitKo: '명',
    rewards: [{ type: 'KAUS', amount: 1000 }],
    xpReward: 300,
    startTime: new Date(Date.now() - 86400000 * 3),
    endTime: new Date(Date.now() + 86400000 * 4),
    isCompleted: false,
    isClaimed: false,
  },
  {
    id: 'weekly-governance-1',
    type: 'WEEKLY',
    category: 'GOVERNANCE',
    name: 'Civic Duty',
    nameKo: '시민의 의무',
    description: 'Vote on 3 governance proposals',
    descriptionKo: '거버넌스 제안 3건에 투표하기',
    icon: '🗳️',
    currentProgress: 3,
    targetProgress: 3,
    unit: 'votes',
    unitKo: '투표',
    rewards: [{ type: 'KAUS', amount: 300 }, { type: 'XP', amount: 150 }],
    xpReward: 150,
    startTime: new Date(Date.now() - 86400000 * 3),
    endTime: new Date(Date.now() + 86400000 * 4),
    isCompleted: true,
    isClaimed: false,
  },
];

const MOCK_MONTHLY_QUESTS: Quest[] = [
  {
    id: 'monthly-champion-1',
    type: 'MONTHLY',
    category: 'TRADING',
    name: 'Trading Champion',
    nameKo: '거래 챔피언',
    description: 'Complete 100 trades this month',
    descriptionKo: '이번 달 100회 거래 완료하기',
    icon: '🏆',
    currentProgress: 67,
    targetProgress: 100,
    unit: 'trades',
    unitKo: '거래',
    rewards: [{ type: 'KAUS', amount: 5000 }, { type: 'BADGE', amount: 1, item: 'Trading Champion', itemKo: '거래 챔피언' }],
    xpReward: 1000,
    startTime: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endTime: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    isCompleted: false,
    isClaimed: false,
  },
  {
    id: 'monthly-staker-1',
    type: 'MONTHLY',
    category: 'STAKING',
    name: 'Diamond Hands',
    nameKo: '다이아몬드 핸즈',
    description: 'Maintain staking for 30 days',
    descriptionKo: '30일 동안 스테이킹 유지하기',
    icon: '💎',
    currentProgress: 22,
    targetProgress: 30,
    unit: 'days',
    unitKo: '일',
    rewards: [{ type: 'KAUS', amount: 3000 }, { type: 'MULTIPLIER', amount: 1.1, item: 'Staking Boost', itemKo: '스테이킹 부스트' }],
    xpReward: 800,
    startTime: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endTime: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    isCompleted: false,
    isClaimed: false,
  },
];

const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach-first-trade',
    name: 'First Steps',
    nameKo: '첫 발걸음',
    description: 'Complete your first trade',
    descriptionKo: '첫 거래 완료',
    icon: '🎯',
    rarity: 'COMMON',
    category: 'TRADING',
    currentProgress: 1,
    targetProgress: 1,
    isUnlocked: true,
    unlockedAt: new Date(Date.now() - 86400000 * 30),
    rewards: [{ type: 'KAUS', amount: 100 }],
    xpReward: 100,
  },
  {
    id: 'ach-volume-bronze',
    name: 'Volume Trader',
    nameKo: '볼륨 트레이더',
    description: 'Trade 10,000,000 KRW total',
    descriptionKo: '총 1천만원 거래',
    icon: '📊',
    rarity: 'RARE',
    category: 'TRADING',
    currentProgress: 8500000,
    targetProgress: 10000000,
    isUnlocked: false,
    rewards: [{ type: 'KAUS', amount: 1000 }],
    xpReward: 500,
    tier: 1,
    maxTier: 5,
    nextTierTarget: 50000000,
  },
  {
    id: 'ach-staking-master',
    name: 'Staking Master',
    nameKo: '스테이킹 마스터',
    description: 'Stake 100,000 KAUS',
    descriptionKo: '10만 KAUS 스테이킹',
    icon: '🏦',
    rarity: 'EPIC',
    category: 'STAKING',
    currentProgress: 75000,
    targetProgress: 100000,
    isUnlocked: false,
    rewards: [{ type: 'KAUS', amount: 5000 }, { type: 'TITLE', amount: 1, item: 'Staking Master', itemKo: '스테이킹 마스터' }],
    xpReward: 1000,
    tier: 2,
    maxTier: 5,
    nextTierTarget: 500000,
  },
  {
    id: 'ach-referral-king',
    name: 'Referral King',
    nameKo: '추천왕',
    description: 'Refer 50 active users',
    descriptionKo: '활성 사용자 50명 추천',
    icon: '👑',
    rarity: 'LEGENDARY',
    category: 'REFERRAL',
    currentProgress: 28,
    targetProgress: 50,
    isUnlocked: false,
    rewards: [{ type: 'KAUS', amount: 25000 }, { type: 'NFT', amount: 1, item: 'Referral King NFT', itemKo: '추천왕 NFT' }],
    xpReward: 5000,
    tier: 3,
    maxTier: 5,
    nextTierTarget: 100,
  },
  {
    id: 'ach-governance-veteran',
    name: 'Governance Veteran',
    nameKo: '거버넌스 베테랑',
    description: 'Participate in 100 governance votes',
    descriptionKo: '거버넌스 투표 100회 참여',
    icon: '🏛️',
    rarity: 'EPIC',
    category: 'GOVERNANCE',
    currentProgress: 45,
    targetProgress: 100,
    isUnlocked: false,
    rewards: [{ type: 'KAUS', amount: 3000 }],
    xpReward: 800,
  },
  {
    id: 'ach-energy-pioneer',
    name: 'Energy Pioneer',
    nameKo: '에너지 개척자',
    description: 'Trade 1 MWh of energy',
    descriptionKo: '1 MWh 에너지 거래',
    icon: '⚡',
    rarity: 'MYTHIC',
    category: 'TRADING',
    currentProgress: 0.45,
    targetProgress: 1,
    isUnlocked: false,
    rewards: [{ type: 'KAUS', amount: 50000 }, { type: 'NFT', amount: 1, item: 'Energy Pioneer NFT', itemKo: '에너지 개척자 NFT' }],
    xpReward: 10000,
  },
];

const MOCK_SEASON: Season = {
  id: 'season-1',
  name: 'Season 1: Genesis',
  nameKo: '시즌 1: 제네시스',
  description: 'The beginning of your journey',
  descriptionKo: '당신의 여정의 시작',
  theme: 'genesis',
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-03-31'),
  isActive: true,
  milestones: [
    { level: 1, xpRequired: 0, rewards: [{ type: 'KAUS', amount: 100 }], isUnlocked: true, isClaimed: true },
    { level: 5, xpRequired: 5000, rewards: [{ type: 'KAUS', amount: 500 }], isUnlocked: true, isClaimed: true },
    { level: 10, xpRequired: 15000, rewards: [{ type: 'KAUS', amount: 1000 }, { type: 'BADGE', amount: 1 }], isUnlocked: true, isClaimed: false },
    { level: 15, xpRequired: 30000, rewards: [{ type: 'KAUS', amount: 2000 }], isUnlocked: false, isClaimed: false },
    { level: 20, xpRequired: 50000, rewards: [{ type: 'KAUS', amount: 5000 }, { type: 'NFT', amount: 1 }], isUnlocked: false, isClaimed: false },
    { level: 30, xpRequired: 100000, rewards: [{ type: 'KAUS', amount: 10000 }, { type: 'TITLE', amount: 1 }], isUnlocked: false, isClaimed: false },
  ],
  rewards: [],
};

const MOCK_USER_LEVEL: UserLevel = {
  level: 12,
  currentXP: 2450,
  requiredXP: 3200,
  totalXP: 18450,
  title: 'Trader',
  titleKo: '트레이더',
  nextTitle: 'Expert',
  nextTitleKo: '전문가',
  perks: ['5% 거래 수수료 할인', '일일 퀘스트 추가 보상', '전용 채팅방 액세스'],
};

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, userId: 'u1', name: 'CryptoMaster', avatar: '🏆', level: 45, totalXP: 285000, achievementsUnlocked: 42, questsCompleted: 1250 },
  { rank: 2, userId: 'u2', name: 'EnergyKing', avatar: '⚡', level: 42, totalXP: 248000, achievementsUnlocked: 38, questsCompleted: 1180 },
  { rank: 3, userId: 'u3', name: 'DeFiQueen', avatar: '👸', level: 39, totalXP: 215000, achievementsUnlocked: 35, questsCompleted: 1050 },
  { rank: 4, userId: 'u4', name: 'StakingPro', avatar: '💎', level: 35, totalXP: 178000, achievementsUnlocked: 31, questsCompleted: 920 },
  { rank: 5, userId: 'u5', name: 'TradeNinja', avatar: '🥷', level: 32, totalXP: 152000, achievementsUnlocked: 28, questsCompleted: 850 },
  { rank: 6, userId: 'u6', name: 'BlockWizard', avatar: '🧙', level: 28, totalXP: 125000, achievementsUnlocked: 24, questsCompleted: 720 },
  { rank: 7, userId: 'u7', name: 'ChainChamp', avatar: '🏅', level: 25, totalXP: 98000, achievementsUnlocked: 21, questsCompleted: 580 },
  { rank: 15, userId: 'user-001', name: 'You', avatar: '👤', level: 12, totalXP: 18450, achievementsUnlocked: 8, questsCompleted: 156, isCurrentUser: true },
];

// ═══════════════════════════════════════════════════════════════════════════════
// XP & LEVEL CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function calculateXPForLevel(level: number): number {
  return Math.floor(XP_PER_LEVEL * Math.pow(XP_MULTIPLIER, level - 1));
}

export function calculateTotalXPForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += calculateXPForLevel(i);
  }
  return total;
}

export function calculateLevelFromXP(totalXP: number): { level: number; currentXP: number; requiredXP: number } {
  let level = 1;
  let remainingXP = totalXP;

  while (remainingXP >= calculateXPForLevel(level)) {
    remainingXP -= calculateXPForLevel(level);
    level++;
  }

  return {
    level,
    currentXP: remainingXP,
    requiredXP: calculateXPForLevel(level),
  };
}

export function getTitleForLevel(level: number): { title: string; titleKo: string } {
  let result = LEVEL_TITLES[0];
  for (const titleInfo of LEVEL_TITLES) {
    if (level >= titleInfo.level) {
      result = titleInfo;
    } else {
      break;
    }
  }
  return result;
}

export function getNextTitle(level: number): { title: string; titleKo: string; level: number } | null {
  const current = getTitleForLevel(level);
  const currentIndex = LEVEL_TITLES.findIndex(t => t.title === current.title);
  if (currentIndex < LEVEL_TITLES.length - 1) {
    return LEVEL_TITLES[currentIndex + 1];
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUEST FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function getDailyQuests(): Quest[] {
  return MOCK_DAILY_QUESTS;
}

export function getWeeklyQuests(): Quest[] {
  return MOCK_WEEKLY_QUESTS;
}

export function getMonthlyQuests(): Quest[] {
  return MOCK_MONTHLY_QUESTS;
}

export function getAllQuests(): Quest[] {
  return [...MOCK_DAILY_QUESTS, ...MOCK_WEEKLY_QUESTS, ...MOCK_MONTHLY_QUESTS];
}

export function getQuestsByType(type: QuestType): Quest[] {
  return getAllQuests().filter(q => q.type === type);
}

export function getQuestsByCategory(category: QuestCategory): Quest[] {
  return getAllQuests().filter(q => q.category === category);
}

export function getCompletedQuests(): Quest[] {
  return getAllQuests().filter(q => q.isCompleted);
}

export function getClaimableQuests(): Quest[] {
  return getAllQuests().filter(q => q.isCompleted && !q.isClaimed);
}

export function claimQuestReward(questId: string): { success: boolean; rewards: QuestReward[]; xp: number } {
  const quest = getAllQuests().find(q => q.id === questId);
  if (!quest || !quest.isCompleted || quest.isClaimed) {
    return { success: false, rewards: [], xp: 0 };
  }
  return { success: true, rewards: quest.rewards, xp: quest.xpReward };
}

export function getQuestProgress(): { daily: number; weekly: number; monthly: number } {
  const daily = MOCK_DAILY_QUESTS.filter(q => q.isCompleted).length / MOCK_DAILY_QUESTS.length * 100;
  const weekly = MOCK_WEEKLY_QUESTS.filter(q => q.isCompleted).length / MOCK_WEEKLY_QUESTS.length * 100;
  const monthly = MOCK_MONTHLY_QUESTS.filter(q => q.isCompleted).length / MOCK_MONTHLY_QUESTS.length * 100;
  return { daily, weekly, monthly };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACHIEVEMENT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function getAllAchievements(): Achievement[] {
  return MOCK_ACHIEVEMENTS;
}

export function getUnlockedAchievements(): Achievement[] {
  return MOCK_ACHIEVEMENTS.filter(a => a.isUnlocked);
}

export function getLockedAchievements(): Achievement[] {
  return MOCK_ACHIEVEMENTS.filter(a => !a.isUnlocked);
}

export function getAchievementsByCategory(category: QuestCategory): Achievement[] {
  return MOCK_ACHIEVEMENTS.filter(a => a.category === category);
}

export function getAchievementsByRarity(rarity: AchievementRarity): Achievement[] {
  return MOCK_ACHIEVEMENTS.filter(a => a.rarity === rarity);
}

export function getNearCompletionAchievements(threshold: number = 0.8): Achievement[] {
  return MOCK_ACHIEVEMENTS.filter(a =>
    !a.isUnlocked && (a.currentProgress / a.targetProgress) >= threshold
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEASON FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function getCurrentSeason(): Season {
  return MOCK_SEASON;
}

export function getSeasonProgress(): { level: number; xp: number; nextMilestone: SeasonMilestone | null } {
  const season = MOCK_SEASON;
  const userLevel = MOCK_USER_LEVEL;

  const nextMilestone = season.milestones.find(m => !m.isUnlocked) || null;

  return {
    level: userLevel.level,
    xp: userLevel.totalXP,
    nextMilestone,
  };
}

export function getSeasonTimeRemaining(): { days: number; hours: number; minutes: number } {
  const now = new Date();
  const end = MOCK_SEASON.endDate;
  const diff = end.getTime() - now.getTime();

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes };
}

export function claimSeasonMilestone(level: number): boolean {
  const milestone = MOCK_SEASON.milestones.find(m => m.level === level);
  if (!milestone || !milestone.isUnlocked || milestone.isClaimed) {
    return false;
  }
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER LEVEL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function getUserLevel(): UserLevel {
  return MOCK_USER_LEVEL;
}

export function getLevelPerks(level: number): string[] {
  const perks: string[] = [];
  if (level >= 5) perks.push('5% 거래 수수료 할인');
  if (level >= 10) perks.push('일일 퀘스트 추가 보상');
  if (level >= 15) perks.push('전용 채팅방 액세스');
  if (level >= 20) perks.push('조기 프로젝트 액세스');
  if (level >= 25) perks.push('10% 스테이킹 보너스');
  if (level >= 30) perks.push('VIP 고객 지원');
  if (level >= 40) perks.push('거버넌스 투표 가중치 +10%');
  if (level >= 50) perks.push('전용 에어드랍 자격');
  return perks;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEADERBOARD FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function getXPLeaderboard(limit: number = 10): LeaderboardEntry[] {
  return MOCK_LEADERBOARD.slice(0, limit);
}

export function getUserRank(userId: string): LeaderboardEntry | null {
  return MOCK_LEADERBOARD.find(e => e.userId === userId) || null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATS FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface UserAchievementStats {
  totalAchievements: number;
  unlockedAchievements: number;
  completionRate: number;
  totalQuestsCompleted: number;
  totalXPEarned: number;
  currentStreak: number;
  longestStreak: number;
  favoriteCategory: QuestCategory;
  rarestAchievement?: Achievement;
}

export function getUserStats(): UserAchievementStats {
  const achievements = MOCK_ACHIEVEMENTS;
  const unlockedAchievements = achievements.filter(a => a.isUnlocked);
  const rarestUnlocked = unlockedAchievements.sort((a, b) => {
    const rarityOrder: AchievementRarity[] = ['MYTHIC', 'LEGENDARY', 'EPIC', 'RARE', 'COMMON'];
    return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
  })[0];

  return {
    totalAchievements: achievements.length,
    unlockedAchievements: unlockedAchievements.length,
    completionRate: (unlockedAchievements.length / achievements.length) * 100,
    totalQuestsCompleted: 156,
    totalXPEarned: MOCK_USER_LEVEL.totalXP,
    currentStreak: 7,
    longestStreak: 23,
    favoriteCategory: 'TRADING',
    rarestAchievement: rarestUnlocked,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// RARITY HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export function getRarityColor(rarity: AchievementRarity): string {
  switch (rarity) {
    case 'COMMON': return 'neutral';
    case 'RARE': return 'blue';
    case 'EPIC': return 'violet';
    case 'LEGENDARY': return 'amber';
    case 'MYTHIC': return 'rose';
    default: return 'neutral';
  }
}

export function getRarityGradient(rarity: AchievementRarity): string {
  switch (rarity) {
    case 'COMMON': return 'from-neutral-400 to-neutral-600';
    case 'RARE': return 'from-blue-400 to-blue-600';
    case 'EPIC': return 'from-violet-400 to-purple-600';
    case 'LEGENDARY': return 'from-amber-400 to-orange-600';
    case 'MYTHIC': return 'from-rose-400 to-pink-600';
    default: return 'from-neutral-400 to-neutral-600';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const AchievementEngine = {
  // XP & Level
  calculateXPForLevel,
  calculateTotalXPForLevel,
  calculateLevelFromXP,
  getTitleForLevel,
  getNextTitle,
  getUserLevel,
  getLevelPerks,
  // Quests
  getDailyQuests,
  getWeeklyQuests,
  getMonthlyQuests,
  getAllQuests,
  getQuestsByType,
  getQuestsByCategory,
  getCompletedQuests,
  getClaimableQuests,
  claimQuestReward,
  getQuestProgress,
  // Achievements
  getAllAchievements,
  getUnlockedAchievements,
  getLockedAchievements,
  getAchievementsByCategory,
  getAchievementsByRarity,
  getNearCompletionAchievements,
  // Season
  getCurrentSeason,
  getSeasonProgress,
  getSeasonTimeRemaining,
  claimSeasonMilestone,
  // Leaderboard
  getXPLeaderboard,
  getUserRank,
  // Stats
  getUserStats,
  // Helpers
  getRarityColor,
  getRarityGradient,
  // Constants
  LEVEL_TITLES,
};

export default AchievementEngine;
