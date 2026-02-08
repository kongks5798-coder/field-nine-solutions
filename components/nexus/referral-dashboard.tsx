'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 56: REFERRAL & REWARDS DASHBOARD COMPONENTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * - Referral code sharing
 * - Tier progress visualization
 * - Leaderboard
 * - Rewards management
 * - Badge showcase
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ReferralEngine,
  type ReferralUser,
  type ReferralReward,
  type ReferredUser,
  type Badge,
  type LeaderboardEntry,
  type Campaign,
  type ReferralTier,
} from '@/lib/referral/referral-engine';

// ═══════════════════════════════════════════════════════════════════════════════
// REFERRAL CODE CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface ReferralCodeCardProps {
  code: string;
  onShare?: () => void;
}

export function ReferralCodeCard({ code, onShare }: ReferralCodeCardProps) {
  const [copied, setCopied] = useState(false);
  const shareLink = ReferralEngine.generateShareLink(code);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Field Nine 추천',
          text: ReferralEngine.generateShareMessage(code),
          url: shareLink,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
    onShare?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-violet-900/50 to-purple-900/50 rounded-2xl border border-violet-500/30 p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">내 추천 코드</h3>
          <p className="text-sm text-neutral-400">친구를 초대하고 보상을 받으세요</p>
        </div>
        <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center">
          <span className="text-2xl">🎁</span>
        </div>
      </div>

      {/* Code Display */}
      <div className="bg-neutral-900/50 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-mono font-bold text-white tracking-wider">{code}</span>
          <button
            onClick={handleCopy}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              copied
                ? 'bg-emerald-500 text-white'
                : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
            }`}
          >
            {copied ? '✓ 복사됨' : '복사'}
          </button>
        </div>
      </div>

      {/* Bonus Info */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-neutral-800/50 rounded-xl p-3 text-center">
          <p className="text-xs text-neutral-400 mb-1">친구 보너스</p>
          <p className="text-lg font-bold text-emerald-400">
            {ReferralEngine.SIGNUP_BONUS} KAUS
          </p>
        </div>
        <div className="bg-neutral-800/50 rounded-xl p-3 text-center">
          <p className="text-xs text-neutral-400 mb-1">내 보너스</p>
          <p className="text-lg font-bold text-violet-400">
            {ReferralEngine.REFERRER_BONUS} KAUS
          </p>
        </div>
      </div>

      {/* Share Button */}
      <button
        onClick={handleShare}
        className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl
          font-bold text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
      >
        <span>📤</span>
        <span>공유하기</span>
      </button>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIER PROGRESS WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

interface TierProgressWidgetProps {
  user: ReferralUser;
}

export function TierProgressWidget({ user }: TierProgressWidgetProps) {
  const progress = ReferralEngine.getTierProgress(user);
  const currentTier = ReferralEngine.TIER_CONFIG[progress.current];
  const nextTier = progress.next ? ReferralEngine.TIER_CONFIG[progress.next] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{currentTier.icon}</span>
          <div>
            <p className="text-lg font-bold text-white">{currentTier.nameKo}</p>
            <p className="text-sm text-violet-400">{currentTier.commissionRate}% 수수료</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{user.totalReferrals}</p>
          <p className="text-xs text-neutral-400">총 추천</p>
        </div>
      </div>

      {/* Progress to Next Tier */}
      {nextTier && (
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">다음 티어까지</span>
            <span className="text-white">{progress.remaining}명 남음</span>
          </div>
          <div className="h-3 bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.progress}%` }}
              transition={{ duration: 1 }}
              className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{currentTier.icon}</span>
              <span className="text-xs text-neutral-400">{currentTier.nameKo}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">{nextTier.nameKo}</span>
              <span className="text-lg">{nextTier.icon}</span>
            </div>
          </div>
        </div>
      )}

      {/* Current Tier Benefits */}
      <div className="mt-5 pt-5 border-t border-neutral-800">
        <p className="text-sm font-medium text-neutral-400 mb-3">현재 혜택</p>
        <div className="space-y-2">
          {currentTier.bonuses.map((bonus, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              <span className="text-sm text-neutral-300">{bonus}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REFERRALS LIST
// ═══════════════════════════════════════════════════════════════════════════════

interface ReferralsListProps {
  referrals: ReferredUser[];
}

export function ReferralsList({ referrals }: ReferralsListProps) {
  if (referrals.length === 0) {
    return (
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center">
        <span className="text-4xl mb-4 block">👥</span>
        <p className="text-neutral-400">아직 추천한 친구가 없습니다</p>
        <p className="text-neutral-500 text-sm mt-1">추천 코드를 공유하여 보상을 받으세요</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden"
    >
      <div className="p-5 border-b border-neutral-800">
        <h3 className="font-bold text-white">내 추천 친구</h3>
        <p className="text-sm text-neutral-400">{referrals.length}명</p>
      </div>

      <div className="divide-y divide-neutral-800 max-h-96 overflow-y-auto">
        {referrals.map((ref, index) => (
          <motion.div
            key={ref.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center text-lg">
                  {ref.avatar}
                </div>
                {ref.isActive && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-neutral-900" />
                )}
              </div>
              <div>
                <p className="font-medium text-white">{ref.name}</p>
                <p className="text-xs text-neutral-400">
                  {Math.floor((Date.now() - ref.joinedAt.getTime()) / 86400000)}일 전 가입
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-emerald-400 font-bold">+{ref.earnedForReferrer.toLocaleString()}</p>
              <p className="text-xs text-neutral-400">KAUS</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REWARDS WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

interface RewardsWidgetProps {
  onClaimAll?: () => void;
}

export function RewardsWidget({ onClaimAll }: RewardsWidgetProps) {
  const [rewards, setRewards] = useState<ReferralReward[]>([]);
  const [claimableTotal, setClaimableTotal] = useState(0);

  useEffect(() => {
    const allRewards = ReferralEngine.getUserRewards('user');
    setRewards(allRewards);
    const claimable = ReferralEngine.getClaimableRewards('user');
    setClaimableTotal(claimable.reduce((sum, r) => sum + r.amount, 0));
  }, []);

  const getRewardTypeIcon = (type: ReferralReward['type']) => {
    const icons: Record<string, string> = {
      SIGNUP_BONUS: '🎉',
      TRADING_COMMISSION: '💰',
      STAKING_BONUS: '🏦',
      MILESTONE: '🏆',
      LEADERBOARD: '🥇',
    };
    return icons[type] || '🎁';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden"
    >
      <div className="p-5 border-b border-neutral-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white">보상 내역</h3>
            <p className="text-sm text-neutral-400">{rewards.length}개 보상</p>
          </div>
          {claimableTotal > 0 && (
            <button
              onClick={onClaimAll}
              className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium text-sm
                hover:bg-emerald-600 transition-colors"
            >
              {claimableTotal.toLocaleString()} KAUS 수령
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-neutral-800 max-h-80 overflow-y-auto">
        {rewards.map((reward, index) => (
          <motion.div
            key={reward.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getRewardTypeIcon(reward.type)}</span>
              <div>
                <p className="font-medium text-white">{reward.descriptionKo}</p>
                <p className="text-xs text-neutral-400">
                  {new Date(reward.earnedAt).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-bold ${
                reward.status === 'CLAIMABLE' ? 'text-emerald-400' : 'text-neutral-400'
              }`}>
                +{reward.amount.toLocaleString()}
              </p>
              <p className={`text-xs ${
                reward.status === 'CLAIMED' ? 'text-neutral-500' :
                reward.status === 'CLAIMABLE' ? 'text-emerald-400' : 'text-neutral-400'
              }`}>
                {reward.status === 'CLAIMED' ? '수령 완료' :
                 reward.status === 'CLAIMABLE' ? '수령 가능' : reward.currency}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════════════════════════════════════════

interface LeaderboardProps {
  period?: 'all' | 'monthly';
}

export function Leaderboard({ period = 'all' }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [activePeriod, setActivePeriod] = useState(period);

  useEffect(() => {
    setEntries(ReferralEngine.getLeaderboard(activePeriod, 10));
  }, [activePeriod]);

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-amber-500 text-black';
    if (rank === 2) return 'bg-neutral-300 text-black';
    if (rank === 3) return 'bg-amber-700 text-white';
    return 'bg-neutral-700 text-neutral-300';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden"
    >
      <div className="p-5 border-b border-neutral-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl
              flex items-center justify-center">
              <span className="text-xl">🏆</span>
            </div>
            <div>
              <h3 className="font-bold text-white">리더보드</h3>
              <p className="text-xs text-neutral-400">Top Referrers</p>
            </div>
          </div>
        </div>

        {/* Period Toggle */}
        <div className="flex gap-2">
          {[
            { id: 'all', label: '전체' },
            { id: 'monthly', label: '이달' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePeriod(p.id as 'all' | 'monthly')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activePeriod === p.id
                  ? 'bg-violet-500 text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-neutral-800">
        {entries.map((entry, index) => {
          const tierInfo = ReferralEngine.TIER_CONFIG[entry.tier];

          return (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 flex items-center gap-4 ${
                entry.isCurrentUser ? 'bg-violet-500/10' : ''
              }`}
            >
              {/* Rank */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center
                text-sm font-bold ${getRankStyle(entry.rank)}`}>
                {entry.rank}
              </div>

              {/* User Info */}
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center text-lg">
                  {entry.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">{entry.name}</p>
                    {entry.isCurrentUser && (
                      <span className="text-xs text-violet-400">(나)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm">{tierInfo.icon}</span>
                    <span className="text-xs text-neutral-400">{tierInfo.nameKo}</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="text-right">
                <p className="font-bold text-white">
                  {activePeriod === 'monthly' ? entry.monthlyReferrals : entry.totalReferrals}명
                </p>
                <p className="text-xs text-emerald-400">
                  +{(activePeriod === 'monthly' ? entry.monthlyEarnings : entry.totalEarnings).toLocaleString()}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BADGE SHOWCASE
// ═══════════════════════════════════════════════════════════════════════════════

interface BadgeShowcaseProps {
  badges?: Badge[];
}

export function BadgeShowcase({ badges }: BadgeShowcaseProps) {
  const [userBadges, setUserBadges] = useState<Badge[]>([]);

  useEffect(() => {
    if (badges) {
      setUserBadges(badges);
    } else {
      setUserBadges(ReferralEngine.getUserBadges('user'));
    }
  }, [badges]);

  const getRarityColor = (rarity: Badge['rarity']) => {
    const colors: Record<string, string> = {
      COMMON: 'border-neutral-500',
      RARE: 'border-blue-500',
      EPIC: 'border-purple-500',
      LEGENDARY: 'border-amber-500',
    };
    return colors[rarity];
  };

  const getRarityBg = (rarity: Badge['rarity']) => {
    const colors: Record<string, string> = {
      COMMON: 'bg-neutral-500/10',
      RARE: 'bg-blue-500/10',
      EPIC: 'bg-purple-500/10',
      LEGENDARY: 'bg-amber-500/10',
    };
    return colors[rarity];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl
          flex items-center justify-center">
          <span className="text-xl">🎖️</span>
        </div>
        <div>
          <h3 className="font-bold text-white">배지 컬렉션</h3>
          <p className="text-xs text-neutral-400">
            {userBadges.filter(b => b.earnedAt).length}/{userBadges.length} 획득
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {userBadges.map((badge, index) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`relative p-3 rounded-xl border-2 ${getRarityColor(badge.rarity)} ${getRarityBg(badge.rarity)}
              ${!badge.earnedAt ? 'opacity-40 grayscale' : ''} cursor-pointer
              hover:scale-105 transition-transform`}
            title={badge.nameKo}
          >
            <div className="text-center">
              <span className="text-3xl block mb-1">{badge.icon}</span>
              <p className="text-xs text-white font-medium truncate">{badge.nameKo}</p>
            </div>

            {/* Progress indicator for in-progress badges */}
            {badge.progress !== undefined && !badge.earnedAt && (
              <div className="absolute bottom-1 left-1 right-1">
                <div className="h-1 bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500"
                    style={{ width: `${(badge.progress / (badge.maxProgress || 100)) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CAMPAIGN BANNER
// ═══════════════════════════════════════════════════════════════════════════════

interface CampaignBannerProps {
  campaign: Campaign;
}

export function CampaignBanner({ campaign }: CampaignBannerProps) {
  const daysRemaining = Math.ceil((campaign.endDate.getTime() - Date.now()) / 86400000);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-amber-900/50 to-orange-900/50 rounded-2xl border border-amber-500/30 p-5"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center">
            <span className="text-3xl">🎯</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-white">{campaign.nameKo}</h3>
              <span className="px-2 py-0.5 bg-amber-500 text-black text-xs font-bold rounded-full">
                x{campaign.bonusMultiplier}
              </span>
            </div>
            <p className="text-sm text-neutral-300">{campaign.descriptionKo}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-amber-400 font-bold">{daysRemaining}일 남음</p>
          <p className="text-xs text-neutral-400">
            ~{campaign.endDate.toLocaleDateString('ko-KR')}
          </p>
        </div>
      </div>

      {campaign.requirements && (
        <div className="mt-4 pt-4 border-t border-amber-500/20">
          <p className="text-xs text-neutral-400 mb-2">참여 조건</p>
          <div className="flex flex-wrap gap-2">
            {campaign.requirements.map((req, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-neutral-800/50 rounded-lg text-xs text-neutral-300"
              >
                {req}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATS OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════

interface StatsOverviewProps {
  user: ReferralUser;
}

export function StatsOverview({ user }: StatsOverviewProps) {
  const statItems = [
    { label: '총 추천', value: user.totalReferrals, icon: '👥', color: 'violet' },
    { label: '활성 추천', value: user.activeReferrals, icon: '✅', color: 'emerald' },
    { label: '총 수익', value: `${(user.totalEarnings / 1000).toFixed(1)}K`, icon: '💰', color: 'amber' },
    { label: '대기 보상', value: user.pendingRewards.toLocaleString(), icon: '🎁', color: 'blue' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {statItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="bg-neutral-900 rounded-xl p-4 border border-neutral-800"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{item.icon}</span>
            <span className="text-xs text-neutral-400">{item.label}</span>
          </div>
          <p className="text-xl font-bold text-white">{item.value}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIER SHOWCASE
// ═══════════════════════════════════════════════════════════════════════════════

export function TierShowcase() {
  const tiers = Object.values(ReferralEngine.TIER_CONFIG);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5"
    >
      <h3 className="font-bold text-white mb-4">티어 시스템</h3>

      <div className="space-y-3">
        {tiers.map((tier, index) => (
          <motion.div
            key={tier.tier}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 p-3 bg-neutral-800 rounded-xl"
          >
            <span className="text-2xl">{tier.icon}</span>
            <div className="flex-1">
              <p className="font-medium text-white">{tier.nameKo}</p>
              <p className="text-xs text-neutral-400">{tier.minReferrals}+ 추천</p>
            </div>
            <div className="text-right">
              <p className="text-emerald-400 font-bold">{tier.commissionRate}%</p>
              <p className="text-xs text-neutral-400">수수료</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
