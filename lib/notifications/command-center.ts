/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 50: REAL-TIME NOTIFICATION COMMAND CENTER
 * ═══════════════════════════════════════════════════════════════════════════════
 * 실시간 알림 + 업적 시스템 + XP 레벨링 + 활동 타임라인
 * "제국의 모든 움직임을 실시간으로 감지하라"
 */

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type NotificationCategory =
  | 'TRADE'       // 거래 관련
  | 'SOCIAL'      // 소셜 (팔로우, 좋아요, 댓글)
  | 'SYSTEM'      // 시스템 공지
  | 'ACHIEVEMENT' // 업적 달성
  | 'ALERT'       // 가격/리스크 알림
  | 'REWARD'      // 보상 지급
  | 'SECURITY';   // 보안 관련

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Notification {
  id: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  icon: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationPreferences {
  categories: Record<NotificationCategory, boolean>;
  pushEnabled: boolean;
  emailEnabled: boolean;
  soundEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string;  // "22:00"
    end: string;    // "08:00"
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACHIEVEMENT SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export type AchievementCategory =
  | 'TRADING'
  | 'SOCIAL'
  | 'STAKING'
  | 'ENERGY'
  | 'EXPLORER'
  | 'LOYALTY';

export type AchievementRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';

export interface Achievement {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  xpReward: number;
  kausReward?: number;
  requirement: {
    type: string;
    target: number;
    current: number;
  };
  unlockedAt?: string;
  progress: number;  // 0-100
}

export interface UserLevel {
  level: number;
  title: string;
  titleKo: string;
  icon: string;
  minXP: number;
  maxXP: number;
  currentXP: number;
  benefits: string[];
}

export interface UserStats {
  totalXP: number;
  level: UserLevel;
  achievements: Achievement[];
  unlockedCount: number;
  totalCount: number;
  streakDays: number;
  lastActiveAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY TIMELINE
// ═══════════════════════════════════════════════════════════════════════════════

export interface ActivityItem {
  id: string;
  type: 'TRADE' | 'STAKE' | 'UNSTAKE' | 'TRANSFER' | 'ACHIEVEMENT' | 'LEVEL_UP' | 'REWARD' | 'LOGIN';
  title: string;
  description: string;
  icon: string;
  timestamp: string;
  value?: number;
  valueUnit?: string;
  pnl?: number;
  pnlPercent?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEVEL DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const LEVELS: Omit<UserLevel, 'currentXP'>[] = [
  { level: 1, title: 'Novice', titleKo: '견습생', icon: '🌱', minXP: 0, maxXP: 100, benefits: ['기본 거래 기능'] },
  { level: 2, title: 'Apprentice', titleKo: '수습생', icon: '🌿', minXP: 100, maxXP: 300, benefits: ['일일 보너스 +5%'] },
  { level: 3, title: 'Trader', titleKo: '트레이더', icon: '📈', minXP: 300, maxXP: 600, benefits: ['거래 수수료 -5%'] },
  { level: 4, title: 'Investor', titleKo: '투자자', icon: '💼', minXP: 600, maxXP: 1000, benefits: ['스테이킹 APY +0.5%'] },
  { level: 5, title: 'Expert', titleKo: '전문가', icon: '🎯', minXP: 1000, maxXP: 1500, benefits: ['프로 차트 접근'] },
  { level: 6, title: 'Master', titleKo: '마스터', icon: '⭐', minXP: 1500, maxXP: 2200, benefits: ['거래 수수료 -10%'] },
  { level: 7, title: 'Elite', titleKo: '엘리트', icon: '💎', minXP: 2200, maxXP: 3000, benefits: ['VIP 지원'] },
  { level: 8, title: 'Champion', titleKo: '챔피언', icon: '🏆', minXP: 3000, maxXP: 4000, benefits: ['독점 전략 접근'] },
  { level: 9, title: 'Legend', titleKo: '레전드', icon: '👑', minXP: 4000, maxXP: 5500, benefits: ['거래 수수료 -15%'] },
  { level: 10, title: 'Sovereign', titleKo: '소버린', icon: '⚜️', minXP: 5500, maxXP: Infinity, benefits: ['모든 혜택 + 거버넌스 투표권'] },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ACHIEVEMENT DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const ACHIEVEMENTS: Omit<Achievement, 'unlockedAt' | 'progress'>[] = [
  // Trading Achievements
  {
    id: 'first-trade',
    name: 'First Steps',
    nameKo: '첫 거래',
    description: '첫 번째 거래를 완료하세요',
    icon: '🎯',
    category: 'TRADING',
    rarity: 'COMMON',
    xpReward: 50,
    requirement: { type: 'trades', target: 1, current: 0 },
  },
  {
    id: 'trader-10',
    name: 'Getting Started',
    nameKo: '시작이 반',
    description: '10회 거래 완료',
    icon: '📊',
    category: 'TRADING',
    rarity: 'COMMON',
    xpReward: 100,
    requirement: { type: 'trades', target: 10, current: 0 },
  },
  {
    id: 'trader-100',
    name: 'Active Trader',
    nameKo: '활발한 트레이더',
    description: '100회 거래 완료',
    icon: '📈',
    category: 'TRADING',
    rarity: 'RARE',
    xpReward: 300,
    kausReward: 100,
    requirement: { type: 'trades', target: 100, current: 0 },
  },
  {
    id: 'trader-1000',
    name: 'Trading Machine',
    nameKo: '거래의 신',
    description: '1,000회 거래 완료',
    icon: '🤖',
    category: 'TRADING',
    rarity: 'LEGENDARY',
    xpReward: 1000,
    kausReward: 1000,
    requirement: { type: 'trades', target: 1000, current: 0 },
  },
  {
    id: 'profit-10k',
    name: 'First Milestone',
    nameKo: '첫 마일스톤',
    description: '누적 수익 10,000 KAUS 달성',
    icon: '💰',
    category: 'TRADING',
    rarity: 'RARE',
    xpReward: 250,
    requirement: { type: 'profit', target: 10000, current: 0 },
  },
  {
    id: 'profit-100k',
    name: 'Whale Status',
    nameKo: '고래 등극',
    description: '누적 수익 100,000 KAUS 달성',
    icon: '🐋',
    category: 'TRADING',
    rarity: 'LEGENDARY',
    xpReward: 1500,
    kausReward: 5000,
    requirement: { type: 'profit', target: 100000, current: 0 },
  },
  {
    id: 'win-streak-5',
    name: 'Hot Streak',
    nameKo: '연승 행진',
    description: '5연승 달성',
    icon: '🔥',
    category: 'TRADING',
    rarity: 'RARE',
    xpReward: 200,
    requirement: { type: 'winStreak', target: 5, current: 0 },
  },
  {
    id: 'win-streak-10',
    name: 'Unstoppable',
    nameKo: '막을 수 없어',
    description: '10연승 달성',
    icon: '⚡',
    category: 'TRADING',
    rarity: 'EPIC',
    xpReward: 500,
    kausReward: 500,
    requirement: { type: 'winStreak', target: 10, current: 0 },
  },

  // Social Achievements
  {
    id: 'first-follower',
    name: 'Popular',
    nameKo: '인기인',
    description: '첫 팔로워 획득',
    icon: '👥',
    category: 'SOCIAL',
    rarity: 'COMMON',
    xpReward: 30,
    requirement: { type: 'followers', target: 1, current: 0 },
  },
  {
    id: 'followers-100',
    name: 'Influencer',
    nameKo: '인플루언서',
    description: '팔로워 100명 달성',
    icon: '🌟',
    category: 'SOCIAL',
    rarity: 'RARE',
    xpReward: 300,
    kausReward: 200,
    requirement: { type: 'followers', target: 100, current: 0 },
  },
  {
    id: 'followers-1000',
    name: 'Celebrity',
    nameKo: '셀러브리티',
    description: '팔로워 1,000명 달성',
    icon: '🎭',
    category: 'SOCIAL',
    rarity: 'LEGENDARY',
    xpReward: 1000,
    kausReward: 2000,
    requirement: { type: 'followers', target: 1000, current: 0 },
  },
  {
    id: 'copy-master',
    name: 'Copy Master',
    nameKo: '카피 마스터',
    description: '50명이 당신을 카피',
    icon: '📋',
    category: 'SOCIAL',
    rarity: 'EPIC',
    xpReward: 600,
    kausReward: 1000,
    requirement: { type: 'copiers', target: 50, current: 0 },
  },

  // Staking Achievements
  {
    id: 'first-stake',
    name: 'Staker',
    nameKo: '스테이커',
    description: '첫 스테이킹 완료',
    icon: '🔒',
    category: 'STAKING',
    rarity: 'COMMON',
    xpReward: 50,
    requirement: { type: 'stakes', target: 1, current: 0 },
  },
  {
    id: 'stake-10k',
    name: 'Committed',
    nameKo: '헌신적인',
    description: '10,000 KAUS 스테이킹',
    icon: '💎',
    category: 'STAKING',
    rarity: 'RARE',
    xpReward: 200,
    requirement: { type: 'stakedAmount', target: 10000, current: 0 },
  },
  {
    id: 'stake-100k',
    name: 'Diamond Hands',
    nameKo: '다이아몬드 핸드',
    description: '100,000 KAUS 스테이킹',
    icon: '💠',
    category: 'STAKING',
    rarity: 'LEGENDARY',
    xpReward: 800,
    kausReward: 3000,
    requirement: { type: 'stakedAmount', target: 100000, current: 0 },
  },

  // Energy Achievements
  {
    id: 'energy-trader',
    name: 'Energy Trader',
    nameKo: '에너지 트레이더',
    description: '첫 에너지 거래 완료',
    icon: '⚡',
    category: 'ENERGY',
    rarity: 'COMMON',
    xpReward: 50,
    requirement: { type: 'energyTrades', target: 1, current: 0 },
  },
  {
    id: 'solar-pioneer',
    name: 'Solar Pioneer',
    nameKo: '태양광 개척자',
    description: '태양광 에너지 1,000 kWh 거래',
    icon: '☀️',
    category: 'ENERGY',
    rarity: 'RARE',
    xpReward: 250,
    requirement: { type: 'solarTraded', target: 1000, current: 0 },
  },
  {
    id: 'wind-master',
    name: 'Wind Master',
    nameKo: '풍력 마스터',
    description: '풍력 에너지 5,000 kWh 거래',
    icon: '💨',
    category: 'ENERGY',
    rarity: 'EPIC',
    xpReward: 400,
    kausReward: 500,
    requirement: { type: 'windTraded', target: 5000, current: 0 },
  },
  {
    id: 're100-certified',
    name: 'RE100 Certified',
    nameKo: 'RE100 인증',
    description: '100% 재생에너지 포트폴리오 달성',
    icon: '🌱',
    category: 'ENERGY',
    rarity: 'LEGENDARY',
    xpReward: 1000,
    kausReward: 2000,
    requirement: { type: 're100Percent', target: 100, current: 0 },
  },

  // Explorer Achievements
  {
    id: 'first-login',
    name: 'Welcome',
    nameKo: '환영합니다',
    description: '첫 로그인 완료',
    icon: '👋',
    category: 'EXPLORER',
    rarity: 'COMMON',
    xpReward: 10,
    requirement: { type: 'logins', target: 1, current: 0 },
  },
  {
    id: 'week-streak',
    name: 'Dedicated',
    nameKo: '헌신적인',
    description: '7일 연속 접속',
    icon: '📅',
    category: 'EXPLORER',
    rarity: 'RARE',
    xpReward: 150,
    kausReward: 50,
    requirement: { type: 'loginStreak', target: 7, current: 0 },
  },
  {
    id: 'month-streak',
    name: 'Loyal Member',
    nameKo: '충성 회원',
    description: '30일 연속 접속',
    icon: '🏅',
    category: 'EXPLORER',
    rarity: 'EPIC',
    xpReward: 500,
    kausReward: 300,
    requirement: { type: 'loginStreak', target: 30, current: 0 },
  },

  // Loyalty Achievements
  {
    id: 'early-adopter',
    name: 'Early Adopter',
    nameKo: '얼리 어답터',
    description: '런칭 첫 달에 가입',
    icon: '🚀',
    category: 'LOYALTY',
    rarity: 'EPIC',
    xpReward: 500,
    kausReward: 500,
    requirement: { type: 'joinedEarly', target: 1, current: 0 },
  },
  {
    id: 'sovereign-tier',
    name: 'Sovereign',
    nameKo: '소버린',
    description: 'SOVEREIGN 티어 달성',
    icon: '👑',
    category: 'LOYALTY',
    rarity: 'MYTHIC',
    xpReward: 2000,
    kausReward: 10000,
    requirement: { type: 'tier', target: 6, current: 0 },
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION STORE
// ═══════════════════════════════════════════════════════════════════════════════

let notifications: Notification[] = [];
let userXP = 1250; // Demo XP
let unlockedAchievements = new Set(['first-trade', 'first-login', 'trader-10', 'first-stake', 'energy-trader', 'first-follower']);

// Default preferences
let preferences: NotificationPreferences = {
  categories: {
    TRADE: true,
    SOCIAL: true,
    SYSTEM: true,
    ACHIEVEMENT: true,
    ALERT: true,
    REWARD: true,
    SECURITY: true,
  },
  pushEnabled: true,
  emailEnabled: false,
  soundEnabled: true,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const categoryIcons: Record<NotificationCategory, string> = {
  TRADE: '📈',
  SOCIAL: '👥',
  SYSTEM: '⚙️',
  ACHIEVEMENT: '🏆',
  ALERT: '🔔',
  REWARD: '🎁',
  SECURITY: '🔐',
};

export function generateNotifications(): Notification[] {
  const now = Date.now();
  const mockNotifications: Notification[] = [
    {
      id: `n-${now}-1`,
      category: 'TRADE',
      priority: 'MEDIUM',
      title: 'SOLAR 매수 체결',
      message: '1,500 kWh @ 0.85 KAUS 체결 완료',
      icon: '☀️',
      timestamp: new Date(now - 5 * 60 * 1000).toISOString(),
      isRead: false,
      actionUrl: '/ko/nexus/exchange',
    },
    {
      id: `n-${now}-2`,
      category: 'ACHIEVEMENT',
      priority: 'HIGH',
      title: '업적 달성: Active Trader',
      message: '100회 거래를 완료했습니다! +300 XP',
      icon: '🏆',
      timestamp: new Date(now - 15 * 60 * 1000).toISOString(),
      isRead: false,
      actionUrl: '/ko/nexus/profile',
    },
    {
      id: `n-${now}-3`,
      category: 'SOCIAL',
      priority: 'LOW',
      title: 'CryptoKing_KR님이 팔로우',
      message: '새로운 팔로워가 생겼습니다',
      icon: '👥',
      timestamp: new Date(now - 30 * 60 * 1000).toISOString(),
      isRead: false,
    },
    {
      id: `n-${now}-4`,
      category: 'ALERT',
      priority: 'HIGH',
      title: 'WIND 가격 급등 알림',
      message: '풍력 에너지 가격이 5% 상승했습니다',
      icon: '📊',
      timestamp: new Date(now - 45 * 60 * 1000).toISOString(),
      isRead: true,
      actionUrl: '/ko/nexus/energy',
    },
    {
      id: `n-${now}-5`,
      category: 'REWARD',
      priority: 'MEDIUM',
      title: '스테이킹 보상 지급',
      message: '125.5 KAUS 보상이 지급되었습니다',
      icon: '🎁',
      timestamp: new Date(now - 60 * 60 * 1000).toISOString(),
      isRead: true,
    },
    {
      id: `n-${now}-6`,
      category: 'SYSTEM',
      priority: 'LOW',
      title: '시스템 업데이트 완료',
      message: 'Phase 50 업데이트가 적용되었습니다',
      icon: '⚙️',
      timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      isRead: true,
    },
    {
      id: `n-${now}-7`,
      category: 'SECURITY',
      priority: 'URGENT',
      title: '새 기기에서 로그인',
      message: 'iPhone 15 Pro에서 로그인이 감지되었습니다',
      icon: '🔐',
      timestamp: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      isRead: true,
    },
  ];

  notifications = mockNotifications;
  return notifications;
}

export function getNotifications(filter?: {
  category?: NotificationCategory;
  unreadOnly?: boolean;
}): Notification[] {
  if (notifications.length === 0) {
    generateNotifications();
  }

  let result = notifications;

  if (filter?.category) {
    result = result.filter(n => n.category === filter.category);
  }
  if (filter?.unreadOnly) {
    result = result.filter(n => !n.isRead);
  }

  return result;
}

export function getUnreadCount(): number {
  return notifications.filter(n => !n.isRead).length;
}

export function markAsRead(notificationId: string): void {
  const notification = notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.isRead = true;
  }
}

export function markAllAsRead(): void {
  notifications.forEach(n => n.isRead = true);
}

export function getPreferences(): NotificationPreferences {
  return preferences;
}

export function updatePreferences(updates: Partial<NotificationPreferences>): NotificationPreferences {
  preferences = { ...preferences, ...updates };
  return preferences;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACHIEVEMENT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function getUserStats(): UserStats {
  // Calculate level
  const levelData = LEVELS.find(l => userXP >= l.minXP && userXP < l.maxXP) || LEVELS[LEVELS.length - 1];

  const level: UserLevel = {
    ...levelData,
    currentXP: userXP,
  };

  // Get achievements with progress
  const achievements: Achievement[] = ACHIEVEMENTS.map(a => {
    const isUnlocked = unlockedAchievements.has(a.id);
    const progress = isUnlocked ? 100 : Math.min(95, Math.floor(Math.random() * 80) + 10);

    return {
      ...a,
      unlockedAt: isUnlocked ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      progress,
      requirement: {
        ...a.requirement,
        current: isUnlocked ? a.requirement.target : Math.floor(a.requirement.target * progress / 100),
      },
    };
  });

  return {
    totalXP: userXP,
    level,
    achievements,
    unlockedCount: unlockedAchievements.size,
    totalCount: ACHIEVEMENTS.length,
    streakDays: 12,
    lastActiveAt: new Date().toISOString(),
  };
}

export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  const stats = getUserStats();
  return stats.achievements.filter(a => a.category === category);
}

export function addXP(amount: number): { newXP: number; levelUp: boolean; newLevel?: UserLevel } {
  const oldLevel = LEVELS.find(l => userXP >= l.minXP && userXP < l.maxXP);
  userXP += amount;
  const newLevel = LEVELS.find(l => userXP >= l.minXP && userXP < l.maxXP);

  const levelUp = oldLevel?.level !== newLevel?.level;

  return {
    newXP: userXP,
    levelUp,
    newLevel: levelUp ? { ...newLevel!, currentXP: userXP } : undefined,
  };
}

export function unlockAchievement(achievementId: string): Achievement | null {
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!achievement || unlockedAchievements.has(achievementId)) {
    return null;
  }

  unlockedAchievements.add(achievementId);

  // Add XP reward
  addXP(achievement.xpReward);

  return {
    ...achievement,
    unlockedAt: new Date().toISOString(),
    progress: 100,
    requirement: {
      ...achievement.requirement,
      current: achievement.requirement.target,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY TIMELINE
// ═══════════════════════════════════════════════════════════════════════════════

export function getActivityTimeline(limit: number = 20): ActivityItem[] {
  const now = Date.now();

  const activities: ActivityItem[] = [
    {
      id: `act-${now}-1`,
      type: 'TRADE',
      title: 'SOLAR 매수',
      description: '태양광 에너지 1,500 kWh 매수',
      icon: '☀️',
      timestamp: new Date(now - 5 * 60 * 1000).toISOString(),
      value: 1275,
      valueUnit: 'KAUS',
    },
    {
      id: `act-${now}-2`,
      type: 'TRADE',
      title: 'WIND 매도',
      description: '풍력 에너지 2,000 kWh 매도',
      icon: '💨',
      timestamp: new Date(now - 30 * 60 * 1000).toISOString(),
      value: 1840,
      valueUnit: 'KAUS',
      pnl: 156,
      pnlPercent: 9.3,
    },
    {
      id: `act-${now}-3`,
      type: 'ACHIEVEMENT',
      title: '업적 달성',
      description: 'Active Trader 업적을 달성했습니다',
      icon: '🏆',
      timestamp: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `act-${now}-4`,
      type: 'STAKE',
      title: 'KAUS 스테이킹',
      description: 'Gold Pool에 스테이킹',
      icon: '🔒',
      timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      value: 5000,
      valueUnit: 'KAUS',
    },
    {
      id: `act-${now}-5`,
      type: 'REWARD',
      title: '스테이킹 보상',
      description: '일일 스테이킹 보상 지급',
      icon: '🎁',
      timestamp: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
      value: 12.5,
      valueUnit: 'KAUS',
    },
    {
      id: `act-${now}-6`,
      type: 'LEVEL_UP',
      title: '레벨 업!',
      description: 'Level 5 Expert 달성',
      icon: '⬆️',
      timestamp: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `act-${now}-7`,
      type: 'TRADE',
      title: 'HYDRO 매수',
      description: '수력 에너지 3,000 kWh 매수',
      icon: '💧',
      timestamp: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
      value: 2550,
      valueUnit: 'KAUS',
    },
    {
      id: `act-${now}-8`,
      type: 'LOGIN',
      title: '로그인',
      description: '연속 12일 접속!',
      icon: '👋',
      timestamp: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  return activities.slice(0, limit);
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUSH NOTIFICATION
// ═══════════════════════════════════════════════════════════════════════════════

export function requestPushPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return Promise.resolve(false);
  }

  if (Notification.permission === 'granted') {
    return Promise.resolve(true);
  }

  return Notification.requestPermission().then(permission => permission === 'granted');
}

export function sendPushNotification(title: string, options?: NotificationOptions): void {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      ...options,
    });
  }
}
