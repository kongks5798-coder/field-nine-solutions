'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 56: REFERRAL & REWARDS PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Invite friends, earn rewards, climb the leaderboard
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FinancialSidebar, PriceTicker, MembershipBar } from '@/components/nexus/financial-terminal';
import { MobileBottomNav, MobileHeader } from '@/components/nexus/mobile-nav';
import {
  ReferralCodeCard,
  TierProgressWidget,
  ReferralsList,
  RewardsWidget,
  Leaderboard,
  BadgeShowcase,
  CampaignBanner,
  StatsOverview,
  TierShowcase,
} from '@/components/nexus/referral-dashboard';
import { ReferralEngine } from '@/lib/referral/referral-engine';

type ReferralView = 'overview' | 'referrals' | 'rewards' | 'leaderboard';

export default function ReferralPage() {
  const [activeView, setActiveView] = useState<ReferralView>('overview');

  const views = [
    { id: 'overview', label: '개요', icon: '🎯' },
    { id: 'referrals', label: '추천 현황', icon: '👥' },
    { id: 'rewards', label: '보상', icon: '🎁' },
    { id: 'leaderboard', label: '리더보드', icon: '🏆' },
  ];

  const userStats = ReferralEngine.getUserStats('0xuser');
  const userProfile = ReferralEngine.getUserReferralProfile('0xuser');
  const activeCampaign = ReferralEngine.getActiveCampaigns()[0];
  const userRewards = ReferralEngine.getUserRewards('0xuser');
  const userBadges = ReferralEngine.getUserBadges('0xuser');

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Desktop: Financial Terminal Sidebar */}
      <div className="hidden md:block">
        <FinancialSidebar />
      </div>

      {/* Mobile: Header */}
      <div className="md:hidden">
        <MobileHeader title="Referral & Rewards" />
      </div>

      <div className="md:ml-56">
        {/* Desktop Only */}
        <div className="hidden md:block">
          <PriceTicker />
          <MembershipBar />
        </div>

        <main className="p-4 md:p-6 pb-24 md:pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-orange-500 rounded-2xl
                    flex items-center justify-center shadow-lg shadow-pink-500/20">
                    <span className="text-3xl">🎯</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Referral & Rewards</h1>
                    <p className="text-neutral-400 text-sm">친구를 초대하고 보상을 받으세요</p>
                  </div>
                </div>

                {/* Stats Badges */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 px-4 py-2 bg-pink-500/20 rounded-xl">
                    <span className="text-pink-400 text-sm">총 추천</span>
                    <span className="text-lg font-bold text-white">
                      {userStats.totalReferrals}명
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 rounded-xl">
                    <span className="text-amber-400 text-sm">총 보상</span>
                    <span className="text-lg font-bold text-white">
                      {userStats.totalEarnedKAUS.toLocaleString()} KAUS
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Campaign Banner */}
              {activeCampaign && <CampaignBanner campaign={activeCampaign} />}
            </motion.div>

            {/* View Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {views.map((view) => (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id as ReferralView)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium
                    whitespace-nowrap transition-all ${
                    activeView === view.id
                      ? 'bg-pink-500 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  <span>{view.icon}</span>
                  <span>{view.label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              {activeView === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Desktop Layout */}
                  <div className="hidden md:grid md:grid-cols-12 gap-6">
                    {/* Left Column */}
                    <div className="col-span-8 space-y-6">
                      {/* Stats Overview */}
                      <StatsOverview user={userProfile} />

                      {/* Referral Code Card */}
                      <ReferralCodeCard code={userProfile.referralCode} />

                      {/* Recent Referrals Preview */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg font-bold text-white">최근 추천</h2>
                          <button
                            onClick={() => setActiveView('referrals')}
                            className="text-sm text-pink-400 hover:text-pink-300"
                          >
                            전체 보기 →
                          </button>
                        </div>
                        <ReferralsList referrals={userProfile.directReferrals.slice(0, 3)} />
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="col-span-4 space-y-6">
                      {/* Tier Progress */}
                      <TierProgressWidget user={userProfile} />

                      {/* Quick Stats */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5"
                      >
                        <h3 className="font-bold text-white mb-4">이번 달 성과</h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-neutral-400 text-sm">신규 추천</span>
                            <span className="text-white font-bold">
                              {userStats.monthlyReferrals}명
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-neutral-400 text-sm">이번 달 보상</span>
                            <span className="text-emerald-400 font-bold">
                              {userStats.monthlyEarnedKAUS.toLocaleString()} KAUS
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-neutral-400 text-sm">리더보드 순위</span>
                            <span className="text-amber-400 font-bold">
                              #{userStats.leaderboardRank}
                            </span>
                          </div>
                        </div>
                      </motion.div>

                      {/* Badge Preview */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-white">최근 획득 뱃지</h3>
                          <span className="text-xs text-neutral-400">
                            {userStats.badges.length}개 보유
                          </span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {userStats.badges.slice(0, 4).map((badge) => (
                            <div
                              key={badge.id}
                              className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center
                                text-2xl"
                              title={badge.nameKo}
                            >
                              {badge.icon}
                            </div>
                          ))}
                          {userStats.badges.length > 4 && (
                            <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center
                              text-neutral-400 text-xs font-medium">
                              +{userStats.badges.length - 4}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-4">
                    <StatsOverview user={userProfile} />
                    <ReferralCodeCard code={userProfile.referralCode} />
                    <TierProgressWidget user={userProfile} />
                  </div>
                </motion.div>
              )}

              {activeView === 'referrals' && (
                <motion.div
                  key="referrals"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Desktop Layout */}
                  <div className="hidden md:grid md:grid-cols-12 gap-6">
                    {/* Left Column */}
                    <div className="col-span-8 space-y-6">
                      <ReferralsList referrals={userProfile.directReferrals} />
                    </div>

                    {/* Right Column */}
                    <div className="col-span-4 space-y-6">
                      <TierProgressWidget user={userProfile} />

                      {/* Referral Tree Stats */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5"
                      >
                        <h3 className="font-bold text-white mb-4">추천 트리</h3>
                        <div className="space-y-4">
                          <div className="p-3 bg-pink-500/10 rounded-xl">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-pink-400 text-sm">1차 추천</span>
                              <span className="text-white font-bold">
                                {userStats.directReferrals}명
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500">직접 추천한 친구</p>
                          </div>
                          <div className="p-3 bg-violet-500/10 rounded-xl">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-violet-400 text-sm">2차 추천</span>
                              <span className="text-white font-bold">
                                {userStats.indirectReferrals}명
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500">친구의 친구</p>
                          </div>
                        </div>
                      </motion.div>

                      {/* Tips */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-pink-500/10 to-orange-500/10
                          rounded-2xl border border-pink-500/20 p-5"
                      >
                        <h3 className="font-bold text-white mb-3">💡 추천 팁</h3>
                        <ul className="space-y-2 text-sm text-neutral-300">
                          <li className="flex items-start gap-2">
                            <span className="text-pink-400">•</span>
                            <span>SNS에 추천 링크를 공유하세요</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-pink-400">•</span>
                            <span>활성 유저를 추천하면 보상이 더 커집니다</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-pink-400">•</span>
                            <span>티어가 높을수록 커미션 비율이 올라갑니다</span>
                          </li>
                        </ul>
                      </motion.div>
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-4">
                    <ReferralsList referrals={userProfile.directReferrals} />
                    <TierProgressWidget user={userProfile} />
                  </div>
                </motion.div>
              )}

              {activeView === 'rewards' && (
                <motion.div
                  key="rewards"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Desktop Layout */}
                  <div className="hidden md:grid md:grid-cols-12 gap-6">
                    {/* Left Column */}
                    <div className="col-span-8 space-y-6">
                      <RewardsWidget />
                      <BadgeShowcase badges={userBadges} />
                    </div>

                    {/* Right Column */}
                    <div className="col-span-4 space-y-6">
                      {/* Pending Rewards Summary */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5"
                      >
                        <h3 className="font-bold text-white mb-4">보상 요약</h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-neutral-400 text-sm">미청구 보상</span>
                            <span className="text-emerald-400 font-bold">
                              {userStats.pendingRewardsKAUS.toLocaleString()} KAUS
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-neutral-400 text-sm">KRW 환산</span>
                            <span className="text-white font-bold">
                              ₩{(userStats.pendingRewardsKAUS * 120).toLocaleString()}
                            </span>
                          </div>
                          <button className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500
                            rounded-xl font-bold text-white hover:opacity-90 transition-all">
                            전체 청구하기
                          </button>
                        </div>
                      </motion.div>

                      {/* Tier Benefits */}
                      <TierShowcase />
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-4">
                    <RewardsWidget />
                    <BadgeShowcase badges={userBadges} />
                  </div>
                </motion.div>
              )}

              {activeView === 'leaderboard' && (
                <motion.div
                  key="leaderboard"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Desktop Layout */}
                  <div className="hidden md:grid md:grid-cols-12 gap-6">
                    {/* Left Column */}
                    <div className="col-span-8">
                      <Leaderboard />
                    </div>

                    {/* Right Column */}
                    <div className="col-span-4 space-y-6">
                      {/* My Ranking */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-amber-500/20 to-orange-500/20
                          rounded-2xl border border-amber-500/30 p-5"
                      >
                        <h3 className="font-bold text-white mb-4">내 순위</h3>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500
                            rounded-2xl flex items-center justify-center text-2xl font-bold text-white
                            shadow-lg shadow-amber-500/30">
                            #{userStats.leaderboardRank}
                          </div>
                          <div>
                            <p className="text-white font-bold text-lg">
                              {userStats.totalReferrals}명 추천
                            </p>
                            <p className="text-amber-400 text-sm">
                              {userStats.totalEarnedKAUS.toLocaleString()} KAUS 획득
                            </p>
                          </div>
                        </div>
                        <div className="p-3 bg-neutral-800/50 rounded-xl">
                          <p className="text-sm text-neutral-300">
                            상위 <span className="text-amber-400 font-bold">
                              {Math.round((userStats.leaderboardRank / 100) * 100)}%
                            </span>
                            에 속해 있습니다
                          </p>
                        </div>
                      </motion.div>

                      {/* Leaderboard Rewards */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5"
                      >
                        <h3 className="font-bold text-white mb-4">순위별 보상</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-amber-500/10 rounded-xl">
                            <span className="text-2xl">🥇</span>
                            <div className="flex-1">
                              <p className="text-white font-medium">1위</p>
                              <p className="text-amber-400 text-sm">50,000 KAUS</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-xl">
                            <span className="text-2xl">🥈</span>
                            <div className="flex-1">
                              <p className="text-white font-medium">2위</p>
                              <p className="text-neutral-300 text-sm">30,000 KAUS</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-orange-500/10 rounded-xl">
                            <span className="text-2xl">🥉</span>
                            <div className="flex-1">
                              <p className="text-white font-medium">3위</p>
                              <p className="text-orange-400 text-sm">20,000 KAUS</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-xl">
                            <span className="text-xl">🏅</span>
                            <div className="flex-1">
                              <p className="text-white font-medium">4~10위</p>
                              <p className="text-neutral-300 text-sm">10,000 KAUS</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-4">
                    {/* My Ranking Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-amber-500/20 to-orange-500/20
                        rounded-2xl border border-amber-500/30 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500
                          rounded-xl flex items-center justify-center text-xl font-bold text-white">
                          #{userStats.leaderboardRank}
                        </div>
                        <div>
                          <p className="text-white font-bold">
                            {userStats.totalReferrals}명 추천
                          </p>
                          <p className="text-amber-400 text-sm">
                            {userStats.totalEarnedKAUS.toLocaleString()} KAUS
                          </p>
                        </div>
                      </div>
                    </motion.div>
                    <Leaderboard />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* How It Works Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 bg-neutral-900/50 rounded-2xl border border-neutral-800 p-6"
            >
              <h3 className="text-lg font-bold text-white mb-4 text-center">🚀 추천 프로그램 작동 방식</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center
                    mx-auto mb-3">
                    <span className="text-2xl">1️⃣</span>
                  </div>
                  <h4 className="font-medium text-white mb-1">링크 공유</h4>
                  <p className="text-xs text-neutral-400">고유 추천 코드를 친구에게 공유</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-violet-500/20 rounded-full flex items-center justify-center
                    mx-auto mb-3">
                    <span className="text-2xl">2️⃣</span>
                  </div>
                  <h4 className="font-medium text-white mb-1">가입 & 활동</h4>
                  <p className="text-xs text-neutral-400">친구가 가입하고 거래 시작</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center
                    mx-auto mb-3">
                    <span className="text-2xl">3️⃣</span>
                  </div>
                  <h4 className="font-medium text-white mb-1">보상 획득</h4>
                  <p className="text-xs text-neutral-400">거래 수수료의 일부를 보상으로</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center
                    mx-auto mb-3">
                    <span className="text-2xl">4️⃣</span>
                  </div>
                  <h4 className="font-medium text-white mb-1">티어 상승</h4>
                  <p className="text-xs text-neutral-400">더 많은 추천 = 더 높은 보상률</p>
                </div>
              </div>
            </motion.div>

            {/* Disclaimer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-4 p-4 bg-neutral-900/50 rounded-xl border border-neutral-800"
            >
              <p className="text-neutral-500 text-xs text-center">
                ⚠️ 추천 보상은 추천받은 사용자의 실제 거래 활동에 따라 지급됩니다.
                부정한 방법으로 얻은 보상은 회수될 수 있습니다.
              </p>
            </motion.div>
          </div>
        </main>
      </div>

      {/* Mobile: Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
