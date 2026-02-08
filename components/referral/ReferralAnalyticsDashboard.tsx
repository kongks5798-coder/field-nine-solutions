/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 56: REFERRAL ANALYTICS DASHBOARD
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Real-time analytics dashboard for users to track their referral performance
 * Tesla-style UI with #F9F9F7 background, #171717 text
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// Types
// ============================================

interface ReferralStats {
  totalReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  conversionRate: number;
  monthlyReferrals: number;
  monthlyEarnings: number;
}

interface ReferralReward {
  id: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  descriptionKo: string;
  status: 'pending' | 'claimable' | 'claimed' | 'expired';
  earnedAt: string;
  claimedAt?: string;
  expiresAt?: string;
}

interface Analytics {
  dailyReferrals: Array<{ date: string; count: number }>;
  dailyEarnings: Array<{ date: string; amount: number }>;
  referralsByTier: Record<string, number>;
  topSources: Array<{ source: string; count: number }>;
  conversionFunnel: {
    viewed: number;
    clicked: number;
    registered: number;
    activated: number;
  };
}

interface TierInfo {
  name: string;
  nameKo: string;
  minReferrals: number;
  commission: number;
  tier2Commission: number;
  color: string;
  badge: string;
}

interface UserProfile {
  userId: string;
  fullName: string;
  tier: string;
  totalReferrals: number;
  totalEarnings: number;
  sovereignNumber: number;
  referralCode: string;
  tierInfo: TierInfo;
}

// ============================================
// Component
// ============================================

export default function ReferralAnalyticsDashboard() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [rewards, setRewards] = useState<ReferralReward[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'rewards' | 'analytics'>('overview');
  const [claiming, setClaiming] = useState<string | null>(null);

  // ============================================
  // Data Fetching
  // ============================================

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, rewardsRes, analyticsRes, profileRes] = await Promise.all([
        fetch('/api/referral?action=stats'),
        fetch('/api/referral?action=rewards'),
        fetch('/api/referral?action=analytics'),
        fetch('/api/referral?action=profile'),
      ]);

      const [statsData, rewardsData, analyticsData, profileData] = await Promise.all([
        statsRes.json(),
        rewardsRes.json(),
        analyticsRes.json(),
        profileRes.json(),
      ]);

      if (statsData.success) setStats(statsData.stats);
      if (rewardsData.success) setRewards(rewardsData.rewards);
      if (analyticsData.success) setAnalytics(analyticsData.analytics);
      if (profileData.success) setProfile(profileData.profile);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchData]);

  // ============================================
  // Actions
  // ============================================

  const claimReward = async (rewardId: string) => {
    setClaiming(rewardId);
    try {
      const res = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'claim', rewardId }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to claim reward:', error);
    } finally {
      setClaiming(null);
    }
  };

  const claimAllRewards = async () => {
    setClaiming('all');
    try {
      const res = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'claim-all' }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to claim all rewards:', error);
    } finally {
      setClaiming(null);
    }
  };

  // ============================================
  // Render
  // ============================================

  if (loading) {
    return (
      <div className="min-h-[400px] bg-[#F9F9F7] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-[#171717] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const claimableRewards = rewards.filter((r) => r.status === 'claimable');
  const claimableTotal = claimableRewards.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="bg-[#F9F9F7] rounded-2xl p-6 text-[#171717]">
      {/* Profile Header */}
      {profile && (
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#171717]/10">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
              style={{ backgroundColor: profile.tierInfo.color + '20' }}
            >
              {profile.tierInfo.badge}
            </div>
            <div>
              <h2 className="text-xl font-light">{profile.fullName || 'Ambassador'}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="px-2 py-0.5 text-xs rounded-full"
                  style={{
                    backgroundColor: profile.tierInfo.color + '20',
                    color: profile.tierInfo.color,
                  }}
                >
                  {profile.tierInfo.nameKo}
                </span>
                <span className="text-sm text-[#171717]/40">
                  #{profile.sovereignNumber.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-[#171717]/60">Referral Code</p>
            <p className="text-xl font-mono">{profile.referralCode}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-6 mb-6 border-b border-[#171717]/10">
        {(['overview', 'rewards', 'analytics'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium transition-all duration-300 border-b-2 ${
              activeTab === tab
                ? 'border-[#171717] text-[#171717]'
                : 'border-transparent text-[#171717]/40 hover:text-[#171717]/60'
            }`}
          >
            {tab === 'overview' ? '개요' : tab === 'rewards' ? '보상' : '분석'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="총 추천"
                value={stats.totalReferrals.toString()}
                icon="👥"
              />
              <StatCard
                label="총 수익"
                value={`${stats.totalEarnings.toLocaleString()} KAUS`}
                icon="💰"
              />
              <StatCard
                label="대기 중"
                value={`${stats.pendingEarnings.toLocaleString()} KAUS`}
                icon="⏳"
              />
              <StatCard
                label="전환율"
                value={`${stats.conversionRate.toFixed(1)}%`}
                icon="📈"
              />
            </div>

            {/* Monthly Stats */}
            <div className="bg-white rounded-xl p-4 border border-[#171717]/10">
              <h3 className="text-sm font-medium text-[#171717]/60 mb-3">이번 달 성과</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-light">{stats.monthlyReferrals}</p>
                  <p className="text-xs text-[#171717]/40">신규 추천</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-light">{stats.monthlyEarnings.toLocaleString()}</p>
                  <p className="text-xs text-[#171717]/40">KAUS 수익</p>
                </div>
              </div>
            </div>

            {/* Tier Progress */}
            {profile && (
              <TierProgress
                currentTier={profile.tier}
                totalReferrals={stats.totalReferrals}
                tierInfo={profile.tierInfo}
              />
            )}
          </motion.div>
        )}

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <motion.div
            key="rewards"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Claimable Banner */}
            {claimableRewards.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-800 font-medium">
                      🎉 {claimableRewards.length}개의 보상 수령 가능!
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      총 {claimableTotal.toLocaleString()} KAUS
                    </p>
                  </div>
                  <button
                    onClick={claimAllRewards}
                    disabled={claiming === 'all'}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {claiming === 'all' ? '처리 중...' : '모두 수령'}
                  </button>
                </div>
              </div>
            )}

            {/* Rewards List */}
            <div className="space-y-3">
              {rewards.length === 0 ? (
                <p className="text-center text-[#171717]/40 py-8">아직 보상이 없습니다</p>
              ) : (
                rewards.map((reward) => (
                  <div
                    key={reward.id}
                    className={`bg-white rounded-xl p-4 border transition-all ${
                      reward.status === 'claimable'
                        ? 'border-green-200 bg-green-50/50'
                        : 'border-[#171717]/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{reward.descriptionKo}</p>
                        <p className="text-xs text-[#171717]/40 mt-1">
                          {new Date(reward.earnedAt).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">
                          {reward.amount.toLocaleString()} {reward.currency}
                        </span>
                        {reward.status === 'claimable' && (
                          <button
                            onClick={() => claimReward(reward.id)}
                            disabled={claiming === reward.id}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            {claiming === reward.id ? '...' : '수령'}
                          </button>
                        )}
                        {reward.status === 'claimed' && (
                          <span className="px-2 py-1 bg-[#171717]/10 text-[#171717]/60 text-xs rounded">
                            수령완료
                          </span>
                        )}
                        {reward.status === 'pending' && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                            대기중
                          </span>
                        )}
                        {reward.status === 'expired' && (
                          <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded">
                            만료됨
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Conversion Funnel */}
            <div className="bg-white rounded-xl p-4 border border-[#171717]/10">
              <h3 className="text-sm font-medium text-[#171717]/60 mb-4">전환 퍼널</h3>
              <div className="space-y-3">
                <FunnelStep
                  label="링크 조회"
                  value={analytics.conversionFunnel.viewed}
                  max={analytics.conversionFunnel.viewed}
                />
                <FunnelStep
                  label="클릭"
                  value={analytics.conversionFunnel.clicked}
                  max={analytics.conversionFunnel.viewed}
                />
                <FunnelStep
                  label="가입"
                  value={analytics.conversionFunnel.registered}
                  max={analytics.conversionFunnel.viewed}
                />
                <FunnelStep
                  label="활성화"
                  value={analytics.conversionFunnel.activated}
                  max={analytics.conversionFunnel.viewed}
                />
              </div>
            </div>

            {/* Daily Chart (Simple) */}
            <div className="bg-white rounded-xl p-4 border border-[#171717]/10">
              <h3 className="text-sm font-medium text-[#171717]/60 mb-4">일별 추천</h3>
              <div className="flex items-end gap-1 h-24">
                {analytics.dailyReferrals.slice(-14).map((day, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-[#171717]/20 rounded-t hover:bg-[#171717]/40 transition-colors"
                    style={{
                      height: `${Math.max(10, (day.count / Math.max(...analytics.dailyReferrals.map(d => d.count || 1))) * 100)}%`,
                    }}
                    title={`${day.date}: ${day.count}건`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-[#171717]/40">
                <span>14일 전</span>
                <span>오늘</span>
              </div>
            </div>

            {/* Top Sources */}
            {analytics.topSources.length > 0 && (
              <div className="bg-white rounded-xl p-4 border border-[#171717]/10">
                <h3 className="text-sm font-medium text-[#171717]/60 mb-4">유입 소스</h3>
                <div className="space-y-2">
                  {analytics.topSources.slice(0, 5).map((source, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm">{source.source}</span>
                      <span className="text-sm font-medium">{source.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-[#171717]/10">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-[#171717]/60">{label}</span>
      </div>
      <p className="text-xl font-light">{value}</p>
    </div>
  );
}

function TierProgress({
  currentTier,
  totalReferrals,
  tierInfo,
}: {
  currentTier: string;
  totalReferrals: number;
  tierInfo: TierInfo;
}) {
  const tiers = ['STARTER', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'AMBASSADOR'];
  const tierThresholds = [0, 5, 20, 50, 100, 250, 500];
  const currentTierIndex = tiers.indexOf(currentTier);
  const nextTierIndex = Math.min(currentTierIndex + 1, tiers.length - 1);
  const nextThreshold = tierThresholds[nextTierIndex];
  const currentThreshold = tierThresholds[currentTierIndex];
  const progress =
    currentTierIndex === tiers.length - 1
      ? 100
      : ((totalReferrals - currentThreshold) / (nextThreshold - currentThreshold)) * 100;

  return (
    <div className="bg-white rounded-xl p-4 border border-[#171717]/10">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[#171717]/60">등급 현황</h3>
        <span className="text-sm" style={{ color: tierInfo.color }}>
          {tierInfo.badge} {tierInfo.nameKo}
        </span>
      </div>
      <div className="h-2 bg-[#171717]/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, progress)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: tierInfo.color }}
        />
      </div>
      {currentTierIndex < tiers.length - 1 && (
        <p className="text-xs text-[#171717]/40 mt-2">
          다음 등급까지 {nextThreshold - totalReferrals}명 추천 필요
        </p>
      )}
    </div>
  );
}

function FunnelStep({ label, value, max }: { label: string; value: number; max: number }) {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-medium">{value.toLocaleString()}</span>
      </div>
      <div className="h-2 bg-[#171717]/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full bg-[#171717] rounded-full"
        />
      </div>
    </div>
  );
}
