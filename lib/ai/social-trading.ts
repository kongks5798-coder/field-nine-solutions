/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 49: SOCIAL TRADING & COPY TRADE EMPIRE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 소셜 트레이딩 + 카피 트레이드 + 전략 마켓플레이스
 * "제국의 지혜를 공유하라"
 */

import { getLeaderboard, type LeaderboardEntry } from './portfolio-analytics';

// ═══════════════════════════════════════════════════════════════════════════════
// TRADER PROFILE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface TraderProfile {
  id: string;
  username: string;
  avatar: string;
  bio: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'SOVEREIGN';
  isVerified: boolean;
  isPro: boolean;
  joinedAt: string;

  // Performance Stats
  stats: {
    totalReturn: number;
    monthlyReturn: number;
    winRate: number;
    totalTrades: number;
    avgHoldTime: string;
    riskScore: number;
    sharpeRatio: number;
    maxDrawdown: number;
  };

  // Social Stats
  social: {
    followers: number;
    following: number;
    copiers: number;
    reputation: number;
    likes: number;
  };

  // Trading Style
  style: {
    primary: 'SCALPER' | 'DAY_TRADER' | 'SWING' | 'POSITION' | 'HODLER';
    assets: string[];
    riskLevel: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
    avgTradesPerDay: number;
  };

  badges: string[];
  featuredStrategy?: string;
}

export interface TradingStrategy {
  id: string;
  name: string;
  description: string;
  creator: TraderProfile;
  createdAt: string;

  // Performance
  performance: {
    totalReturn: number;
    monthlyReturn: number;
    winRate: number;
    trades: number;
    runtime: string;
  };

  // Configuration
  config: {
    minInvestment: number;
    maxInvestment: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    assets: string[];
    autoRebalance: boolean;
  };

  // Social
  copiers: number;
  rating: number;
  reviews: number;
  isFeatured: boolean;
  tags: string[];
}

export interface CopyTradeConfig {
  id: string;
  traderId: string;
  strategyId?: string;

  // Investment Settings
  investment: {
    amount: number;
    currency: 'KAUS' | 'KRW';
    maxAllocation: number;
    stopLoss: number;
    takeProfit: number;
  };

  // Copy Settings
  settings: {
    copyRatio: number;        // 1.0 = 100% of trader's position size
    maxPositions: number;
    copyOpenTrades: boolean;
    copyCloseTrades: boolean;
    excludeAssets: string[];
  };

  // Status
  status: 'ACTIVE' | 'PAUSED' | 'STOPPED';
  startedAt: string;
  totalPnL: number;
  totalPnLPercent: number;
  tradesExecuted: number;
}

export interface SocialFeedItem {
  id: string;
  type: 'TRADE' | 'ACHIEVEMENT' | 'MILESTONE' | 'STRATEGY' | 'COMMENT' | 'FOLLOW';
  trader: {
    id: string;
    username: string;
    avatar: string;
    tier: string;
    isVerified: boolean;
  };
  content: {
    title: string;
    description: string;
    asset?: string;
    action?: 'BUY' | 'SELL';
    amount?: number;
    price?: number;
    pnl?: number;
    pnlPercent?: number;
  };
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    copies: number;
  };
  timestamp: string;
  isLiked: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════

const TRADING_STYLES = ['SCALPER', 'DAY_TRADER', 'SWING', 'POSITION', 'HODLER'] as const;
const RISK_LEVELS = ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'] as const;
const ASSETS = ['KAUS', 'SOLAR', 'WIND', 'HYDRO', 'YD-RWA', 'CT-V2G'];

const MOCK_BIOS = [
  '에너지 트레이딩 10년차. 안정적 수익 추구.',
  'AI 기반 퀀트 전략 전문가. 변동성 매매.',
  '장기 가치 투자자. RE100 자산 집중.',
  '단타 전문. 빠른 손절, 빠른 익절.',
  'ESG 투자 전문. 지속가능한 수익 창출.',
  '태양광 전문 트레이더. SMP 차익 매매.',
  '풍력 에너지 전문가. 계절성 매매 전략.',
];

const STRATEGY_NAMES = [
  'Prophet AI Alpha',
  'Energy Momentum Pro',
  'Solar Arbitrage Bot',
  'Wind Power Scalper',
  'RE100 Value Strategy',
  'Carbon Credit Hunter',
  'V2G Yield Maximizer',
  'KAUS Accumulator',
];

const ACHIEVEMENT_TITLES = [
  '첫 100만 KAUS 달성',
  '월간 수익률 20% 돌파',
  '연속 30일 수익',
  '팔로워 1,000명 달성',
  '카피 트레이더 100명',
  '다이아몬드 티어 승급',
];

// ═══════════════════════════════════════════════════════════════════════════════
// TRADER PROFILES
// ═══════════════════════════════════════════════════════════════════════════════

let cachedTraders: TraderProfile[] | null = null;

export function getTopTraders(limit: number = 10): TraderProfile[] {
  if (cachedTraders && cachedTraders.length >= limit) {
    return cachedTraders.slice(0, limit);
  }

  const leaderboard = getLeaderboard('month');

  cachedTraders = leaderboard.slice(0, 20).map((entry, index) => {
    const style = TRADING_STYLES[index % TRADING_STYLES.length];
    const risk = RISK_LEVELS[index % RISK_LEVELS.length];

    return {
      id: entry.userId,
      username: entry.username,
      avatar: entry.avatar,
      bio: MOCK_BIOS[index % MOCK_BIOS.length],
      tier: entry.tier,
      isVerified: entry.isVerified,
      isPro: index < 5,
      joinedAt: new Date(Date.now() - (365 - index * 30) * 24 * 60 * 60 * 1000).toISOString(),

      stats: {
        totalReturn: entry.totalReturn,
        monthlyReturn: entry.monthlyReturn,
        winRate: entry.winRate,
        totalTrades: entry.totalTrades,
        avgHoldTime: index < 3 ? '2h 30m' : index < 6 ? '1d 4h' : '5d 12h',
        riskScore: 20 + index * 5 + Math.random() * 10,
        sharpeRatio: 2.5 - index * 0.15 + Math.random() * 0.3,
        maxDrawdown: 5 + index * 1.5 + Math.random() * 3,
      },

      social: {
        followers: Math.floor(5000 - index * 400 + Math.random() * 500),
        following: Math.floor(50 + Math.random() * 100),
        copiers: Math.floor(500 - index * 40 + Math.random() * 50),
        reputation: Math.floor(95 - index * 2 + Math.random() * 3),
        likes: Math.floor(10000 - index * 800 + Math.random() * 1000),
      },

      style: {
        primary: style,
        assets: ASSETS.slice(0, 3 + Math.floor(Math.random() * 3)),
        riskLevel: risk,
        avgTradesPerDay: style === 'SCALPER' ? 15 + Math.random() * 10 :
                         style === 'DAY_TRADER' ? 5 + Math.random() * 5 :
                         style === 'SWING' ? 1 + Math.random() * 2 : 0.5,
      },

      badges: entry.badges,
      featuredStrategy: index < 5 ? STRATEGY_NAMES[index] : undefined,
    };
  });

  return cachedTraders.slice(0, limit);
}

export function getTraderProfile(traderId: string): TraderProfile | null {
  const traders = getTopTraders(20);
  return traders.find(t => t.id === traderId) || null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRADING STRATEGIES
// ═══════════════════════════════════════════════════════════════════════════════

let cachedStrategies: TradingStrategy[] | null = null;

export function getStrategies(filter?: {
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  minReturn?: number;
  featured?: boolean;
}): TradingStrategy[] {
  if (!cachedStrategies) {
    const traders = getTopTraders(10);

    cachedStrategies = STRATEGY_NAMES.map((name, index) => {
      const creator = traders[index % traders.length];
      const riskLevel = index < 3 ? 'LOW' : index < 6 ? 'MEDIUM' : 'HIGH';

      return {
        id: `strategy-${index + 1}`,
        name,
        description: `${creator.username}의 검증된 ${riskLevel === 'LOW' ? '안정적' : riskLevel === 'MEDIUM' ? '균형잡힌' : '공격적'} 전략. ${creator.bio}`,
        creator,
        createdAt: new Date(Date.now() - (180 - index * 15) * 24 * 60 * 60 * 1000).toISOString(),

        performance: {
          totalReturn: 50 - index * 4 + Math.random() * 15,
          monthlyReturn: 8 - index * 0.5 + Math.random() * 3,
          winRate: 75 - index * 2 + Math.random() * 5,
          trades: Math.floor(500 - index * 30 + Math.random() * 100),
          runtime: `${6 - Math.floor(index / 2)}개월`,
        },

        config: {
          minInvestment: 1000 + index * 500,
          maxInvestment: 100000 - index * 5000,
          riskLevel,
          assets: ASSETS.slice(0, 2 + Math.floor(Math.random() * 3)),
          autoRebalance: index % 2 === 0,
        },

        copiers: Math.floor(200 - index * 15 + Math.random() * 30),
        rating: 4.8 - index * 0.1 + Math.random() * 0.2,
        reviews: Math.floor(100 - index * 8 + Math.random() * 20),
        isFeatured: index < 3,
        tags: [
          riskLevel === 'LOW' ? '안정적' : riskLevel === 'MEDIUM' ? '균형' : '고수익',
          creator.style.primary === 'SCALPER' ? '단타' : '장기',
          'AI 지원',
        ],
      };
    });
  }

  let result = cachedStrategies;

  if (filter?.riskLevel) {
    result = result.filter(s => s.config.riskLevel === filter.riskLevel);
  }
  if (filter?.minReturn !== undefined) {
    result = result.filter(s => s.performance.totalReturn >= filter.minReturn!);
  }
  if (filter?.featured) {
    result = result.filter(s => s.isFeatured);
  }

  return result;
}

export function getStrategy(strategyId: string): TradingStrategy | null {
  const strategies = getStrategies();
  return strategies.find(s => s.id === strategyId) || null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COPY TRADE
// ═══════════════════════════════════════════════════════════════════════════════

const activeCopyTrades: Map<string, CopyTradeConfig> = new Map();

export function startCopyTrade(config: Omit<CopyTradeConfig, 'id' | 'status' | 'startedAt' | 'totalPnL' | 'totalPnLPercent' | 'tradesExecuted'>): CopyTradeConfig {
  const copyTrade: CopyTradeConfig = {
    ...config,
    id: `copy-${Date.now()}`,
    status: 'ACTIVE',
    startedAt: new Date().toISOString(),
    totalPnL: 0,
    totalPnLPercent: 0,
    tradesExecuted: 0,
  };

  activeCopyTrades.set(copyTrade.id, copyTrade);

  console.log(`[COPY TRADE] Started copying trader ${config.traderId} with ${config.investment.amount} ${config.investment.currency}`);

  return copyTrade;
}

export function stopCopyTrade(copyTradeId: string): CopyTradeConfig | null {
  const copyTrade = activeCopyTrades.get(copyTradeId);
  if (!copyTrade) return null;

  copyTrade.status = 'STOPPED';
  console.log(`[COPY TRADE] Stopped copy trade ${copyTradeId}`);

  return copyTrade;
}

export function pauseCopyTrade(copyTradeId: string): CopyTradeConfig | null {
  const copyTrade = activeCopyTrades.get(copyTradeId);
  if (!copyTrade) return null;

  copyTrade.status = copyTrade.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED';
  console.log(`[COPY TRADE] ${copyTrade.status === 'PAUSED' ? 'Paused' : 'Resumed'} copy trade ${copyTradeId}`);

  return copyTrade;
}

export function getCopyTrades(): CopyTradeConfig[] {
  return Array.from(activeCopyTrades.values());
}

export function getCopyTradeStats(traderId: string): {
  totalCopiers: number;
  totalVolume: number;
  avgPnL: number;
} {
  const copies = Array.from(activeCopyTrades.values())
    .filter(c => c.traderId === traderId);

  return {
    totalCopiers: copies.length || Math.floor(50 + Math.random() * 200),
    totalVolume: copies.reduce((sum, c) => sum + c.investment.amount, 0) || Math.floor(500000 + Math.random() * 2000000),
    avgPnL: copies.length > 0
      ? copies.reduce((sum, c) => sum + c.totalPnLPercent, 0) / copies.length
      : 12 + Math.random() * 8,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOCIAL FEED
// ═══════════════════════════════════════════════════════════════════════════════

export function getSocialFeed(filter?: {
  type?: SocialFeedItem['type'];
  traderId?: string;
  limit?: number;
}): SocialFeedItem[] {
  const traders = getTopTraders(10);
  const now = Date.now();
  const limit = filter?.limit || 20;

  const feedItems: SocialFeedItem[] = [];

  // Generate trade activities
  for (let i = 0; i < limit; i++) {
    const trader = traders[i % traders.length];
    const types: SocialFeedItem['type'][] = ['TRADE', 'TRADE', 'TRADE', 'ACHIEVEMENT', 'MILESTONE', 'STRATEGY'];
    const type = types[Math.floor(Math.random() * types.length)];

    if (filter?.type && type !== filter.type) continue;
    if (filter?.traderId && trader.id !== filter.traderId) continue;

    const asset = ASSETS[Math.floor(Math.random() * ASSETS.length)];
    const action = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const pnl = (Math.random() - 0.3) * 20;

    let content: SocialFeedItem['content'];

    switch (type) {
      case 'TRADE':
        content = {
          title: `${asset} ${action === 'BUY' ? '매수' : '매도'}`,
          description: `${(1000 + Math.random() * 9000).toFixed(0)} KAUS 규모의 ${action === 'BUY' ? '매수' : '매도'} 체결`,
          asset,
          action,
          amount: Math.floor(1000 + Math.random() * 9000),
          price: Math.floor(100 + Math.random() * 50),
          pnl: action === 'SELL' ? pnl * 100 : undefined,
          pnlPercent: action === 'SELL' ? pnl : undefined,
        };
        break;
      case 'ACHIEVEMENT':
        content = {
          title: ACHIEVEMENT_TITLES[Math.floor(Math.random() * ACHIEVEMENT_TITLES.length)],
          description: `${trader.username}님이 새로운 업적을 달성했습니다!`,
        };
        break;
      case 'MILESTONE':
        content = {
          title: `누적 수익 ${Math.floor(10 + Math.random() * 90)}% 달성`,
          description: '꾸준한 트레이딩으로 목표 수익률에 도달했습니다.',
        };
        break;
      case 'STRATEGY':
        content = {
          title: `새 전략 공개: ${STRATEGY_NAMES[Math.floor(Math.random() * STRATEGY_NAMES.length)]}`,
          description: '검증된 트레이딩 전략을 공유합니다. 카피 트레이딩 가능!',
        };
        break;
      default:
        content = {
          title: '활동',
          description: '트레이더 활동',
        };
    }

    feedItems.push({
      id: `feed-${i}-${now}`,
      type,
      trader: {
        id: trader.id,
        username: trader.username,
        avatar: trader.avatar,
        tier: trader.tier,
        isVerified: trader.isVerified,
      },
      content,
      engagement: {
        likes: Math.floor(Math.random() * 500),
        comments: Math.floor(Math.random() * 50),
        shares: Math.floor(Math.random() * 30),
        copies: type === 'TRADE' ? Math.floor(Math.random() * 20) : 0,
      },
      timestamp: new Date(now - i * 1000 * 60 * (5 + Math.random() * 30)).toISOString(),
      isLiked: Math.random() > 0.7,
    });
  }

  return feedItems.slice(0, limit);
}

// ═══════════════════════════════════════════════════════════════════════════════
// FOLLOW SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

const followingSet = new Set<string>();

export function followTrader(traderId: string): boolean {
  if (followingSet.has(traderId)) {
    followingSet.delete(traderId);
    console.log(`[SOCIAL] Unfollowed trader ${traderId}`);
    return false;
  }

  followingSet.add(traderId);
  console.log(`[SOCIAL] Following trader ${traderId}`);
  return true;
}

export function isFollowing(traderId: string): boolean {
  return followingSet.has(traderId);
}

export function getFollowingList(): string[] {
  return Array.from(followingSet);
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPUTATION SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export interface ReputationBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  earnedAt?: string;
}

export const REPUTATION_BADGES: ReputationBadge[] = [
  { id: 'first-trade', name: '첫 거래', icon: '🎯', description: '첫 번째 거래 완료', rarity: 'COMMON' },
  { id: 'streak-7', name: '7일 연속 수익', icon: '🔥', description: '7일 연속 수익 달성', rarity: 'COMMON' },
  { id: 'streak-30', name: '30일 연속 수익', icon: '💎', description: '30일 연속 수익 달성', rarity: 'RARE' },
  { id: 'million-kaus', name: '백만장자', icon: '💰', description: '100만 KAUS 달성', rarity: 'RARE' },
  { id: 'top-10', name: 'Top 10', icon: '🏆', description: '리더보드 Top 10 진입', rarity: 'EPIC' },
  { id: 'copy-master', name: '카피 마스터', icon: '👥', description: '100명의 카피 트레이더', rarity: 'EPIC' },
  { id: 'prophet', name: 'Prophet', icon: '🔮', description: '95% 이상 승률 달성', rarity: 'LEGENDARY' },
  { id: 'sovereign', name: 'Sovereign', icon: '👑', description: 'SOVEREIGN 티어 달성', rarity: 'LEGENDARY' },
];

export function getTraderBadges(traderId: string): ReputationBadge[] {
  const trader = getTraderProfile(traderId);
  if (!trader) return [];

  // Assign badges based on trader stats
  const badges: ReputationBadge[] = [];

  badges.push({ ...REPUTATION_BADGES[0], earnedAt: trader.joinedAt });

  if (trader.stats.winRate > 70) {
    badges.push({ ...REPUTATION_BADGES[1], earnedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() });
  }
  if (trader.stats.winRate > 80) {
    badges.push({ ...REPUTATION_BADGES[2], earnedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() });
  }
  if (trader.social.copiers > 50) {
    badges.push({ ...REPUTATION_BADGES[5], earnedAt: new Date().toISOString() });
  }
  if (trader.tier === 'DIAMOND' || trader.tier === 'SOVEREIGN') {
    badges.push({ ...REPUTATION_BADGES[4], earnedAt: new Date().toISOString() });
  }
  if (trader.tier === 'SOVEREIGN') {
    badges.push({ ...REPUTATION_BADGES[7], earnedAt: new Date().toISOString() });
  }

  return badges;
}
