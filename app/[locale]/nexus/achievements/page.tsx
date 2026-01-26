'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 57: ACHIEVEMENT & QUEST PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Complete quests, unlock achievements, level up
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FinancialSidebar, PriceTicker, MembershipBar } from '@/components/nexus/financial-terminal';
import { MobileBottomNav, MobileHeader } from '@/components/nexus/mobile-nav';
import {
  LevelProgressWidget,
  QuestList,
  QuestProgressOverview,
  AchievementGrid,
  SeasonPassWidget,
  XPLeaderboard,
  AchievementStatsOverview,
  NearCompletionWidget,
  StreakCalendar,
} from '@/components/nexus/achievement-dashboard';
import { AchievementEngine } from '@/lib/achievements/achievement-engine';

type AchievementView = 'overview' | 'quests' | 'achievements' | 'leaderboard';

export default function AchievementsPage() {
  const [activeView, setActiveView] = useState<AchievementView>('overview');
  const [questFilter, setQuestFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');

  const views = [
    { id: 'overview', label: '개요', icon: '📊' },
    { id: 'quests', label: '퀘스트', icon: '📜' },
    { id: 'achievements', label: '업적', icon: '🏆' },
    { id: 'leaderboard', label: '리더보드', icon: '🥇' },
  ];

  const userLevel = AchievementEngine.getUserLevel();
  const season = AchievementEngine.getCurrentSeason();
  const dailyQuests = AchievementEngine.getDailyQuests();
  const weeklyQuests = AchievementEngine.getWeeklyQuests();
  const monthlyQuests = AchievementEngine.getMonthlyQuests();
  const allQuests = AchievementEngine.getAllQuests();
  const achievements = AchievementEngine.getAllAchievements();
  const leaderboard = AchievementEngine.getXPLeaderboard(10);
  const claimableQuests = AchievementEngine.getClaimableQuests();

  const getFilteredQuests = () => {
    switch (questFilter) {
      case 'daily': return dailyQuests;
      case 'weekly': return weeklyQuests;
      case 'monthly': return monthlyQuests;
      default: return allQuests;
    }
  };

  const handleClaimQuest = (questId: string) => {
    const result = AchievementEngine.claimQuestReward(questId);
    if (result.success) {
      console.log('Claimed rewards:', result.rewards, 'XP:', result.xp);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Desktop: Financial Terminal Sidebar */}
      <div className="hidden md:block">
        <FinancialSidebar />
      </div>

      {/* Mobile: Header */}
      <div className="md:hidden">
        <MobileHeader title="Achievements & Quests" />
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
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl
                    flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <span className="text-3xl">🏆</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Achievements & Quests</h1>
                    <p className="text-neutral-400 text-sm">퀘스트를 완료하고 업적을 달성하세요</p>
                  </div>
                </div>

                {/* Claimable Rewards Badge */}
                {claimableQuests.length > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-xl animate-pulse">
                    <span className="text-emerald-400 text-sm">받을 수 있는 보상</span>
                    <span className="text-lg font-bold text-white">{claimableQuests.length}개</span>
                  </div>
                )}
              </div>

              {/* Stats Overview */}
              <AchievementStatsOverview />
            </motion.div>

            {/* View Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {views.map((view) => (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id as AchievementView)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium
                    whitespace-nowrap transition-all ${
                    activeView === view.id
                      ? 'bg-amber-500 text-white'
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
                      {/* Level Progress */}
                      <LevelProgressWidget userLevel={userLevel} />

                      {/* Season Pass */}
                      <SeasonPassWidget season={season} userLevel={userLevel} />

                      {/* Today's Quests */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg font-bold text-white">오늘의 퀘스트</h2>
                          <button
                            onClick={() => setActiveView('quests')}
                            className="text-sm text-amber-400 hover:text-amber-300"
                          >
                            전체 보기 →
                          </button>
                        </div>
                        <QuestList quests={dailyQuests} onClaim={handleClaimQuest} />
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="col-span-4 space-y-6">
                      {/* Quest Progress */}
                      <QuestProgressOverview />

                      {/* Streak Calendar */}
                      <StreakCalendar />

                      {/* Near Completion */}
                      <NearCompletionWidget />
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-4">
                    <LevelProgressWidget userLevel={userLevel} />
                    <QuestProgressOverview />
                    <StreakCalendar />

                    {/* Today's Quests Preview */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold text-white">오늘의 퀘스트</h2>
                        <button
                          onClick={() => setActiveView('quests')}
                          className="text-sm text-amber-400"
                        >
                          전체 보기 →
                        </button>
                      </div>
                      <QuestList quests={dailyQuests.slice(0, 2)} onClaim={handleClaimQuest} />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeView === 'quests' && (
                <motion.div
                  key="quests"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Quest Filter */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {[
                      { id: 'all', label: '전체' },
                      { id: 'daily', label: '일일' },
                      { id: 'weekly', label: '주간' },
                      { id: 'monthly', label: '월간' },
                    ].map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setQuestFilter(filter.id as typeof questFilter)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          questFilter === filter.id
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:grid md:grid-cols-12 gap-6">
                    {/* Left Column */}
                    <div className="col-span-8">
                      <QuestList quests={getFilteredQuests()} onClaim={handleClaimQuest} />
                    </div>

                    {/* Right Column */}
                    <div className="col-span-4 space-y-6">
                      <QuestProgressOverview />

                      {/* Quest Tips */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-amber-500/10 to-orange-500/10
                          rounded-2xl border border-amber-500/20 p-5"
                      >
                        <h3 className="font-bold text-white mb-3">💡 퀘스트 팁</h3>
                        <ul className="space-y-2 text-sm text-neutral-300">
                          <li className="flex items-start gap-2">
                            <span className="text-amber-400">•</span>
                            <span>일일 퀘스트는 매일 자정에 초기화됩니다</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-amber-400">•</span>
                            <span>연속 출석 시 추가 보상을 받을 수 있습니다</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-amber-400">•</span>
                            <span>월간 퀘스트는 더 큰 보상을 제공합니다</span>
                          </li>
                        </ul>
                      </motion.div>
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="md:hidden">
                    <QuestList quests={getFilteredQuests()} onClaim={handleClaimQuest} />
                  </div>
                </motion.div>
              )}

              {activeView === 'achievements' && (
                <motion.div
                  key="achievements"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Achievement Stats Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: '일반', count: AchievementEngine.getAchievementsByRarity('COMMON').filter(a => a.isUnlocked).length, total: AchievementEngine.getAchievementsByRarity('COMMON').length, color: 'neutral' },
                      { label: '희귀', count: AchievementEngine.getAchievementsByRarity('RARE').filter(a => a.isUnlocked).length, total: AchievementEngine.getAchievementsByRarity('RARE').length, color: 'blue' },
                      { label: '에픽', count: AchievementEngine.getAchievementsByRarity('EPIC').filter(a => a.isUnlocked).length, total: AchievementEngine.getAchievementsByRarity('EPIC').length, color: 'violet' },
                      { label: '전설+', count: [...AchievementEngine.getAchievementsByRarity('LEGENDARY'), ...AchievementEngine.getAchievementsByRarity('MYTHIC')].filter(a => a.isUnlocked).length, total: [...AchievementEngine.getAchievementsByRarity('LEGENDARY'), ...AchievementEngine.getAchievementsByRarity('MYTHIC')].length, color: 'amber' },
                    ].map((item) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-neutral-900 rounded-xl border border-neutral-800 p-4 text-center"
                      >
                        <p className={`text-${item.color}-400 font-bold text-xl`}>
                          {item.count}/{item.total}
                        </p>
                        <p className="text-neutral-500 text-sm">{item.label}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:grid md:grid-cols-12 gap-6">
                    {/* Left Column */}
                    <div className="col-span-8">
                      <AchievementGrid achievements={achievements} />
                    </div>

                    {/* Right Column */}
                    <div className="col-span-4 space-y-6">
                      <NearCompletionWidget />

                      {/* Rarest Achievement */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-rose-500/10 to-pink-500/10
                          rounded-2xl border border-rose-500/20 p-5"
                      >
                        <h3 className="font-bold text-white mb-3">가장 희귀한 업적</h3>
                        {AchievementEngine.getUserStats().rarestAchievement ? (
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">
                              {AchievementEngine.getUserStats().rarestAchievement?.icon}
                            </span>
                            <div>
                              <p className="text-white font-medium">
                                {AchievementEngine.getUserStats().rarestAchievement?.nameKo}
                              </p>
                              <p className="text-rose-400 text-sm">
                                {AchievementEngine.getUserStats().rarestAchievement?.rarity}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-neutral-400 text-sm">아직 달성한 업적이 없습니다</p>
                        )}
                      </motion.div>
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="md:hidden">
                    <AchievementGrid achievements={achievements} />
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
                      <XPLeaderboard entries={leaderboard} />
                    </div>

                    {/* Right Column */}
                    <div className="col-span-4 space-y-6">
                      {/* My Rank */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-violet-500/20 to-purple-500/20
                          rounded-2xl border border-violet-500/30 p-5"
                      >
                        <h3 className="font-bold text-white mb-4">내 순위</h3>
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-500
                            rounded-2xl flex items-center justify-center text-2xl font-bold text-white">
                            #{AchievementEngine.getUserRank('user-001')?.rank || 0}
                          </div>
                          <div>
                            <p className="text-white font-bold text-lg">
                              Lv.{userLevel.level} {userLevel.titleKo}
                            </p>
                            <p className="text-violet-400 text-sm">
                              {userLevel.totalXP.toLocaleString()} XP
                            </p>
                          </div>
                        </div>
                      </motion.div>

                      {/* Leaderboard Rewards */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5"
                      >
                        <h3 className="font-bold text-white mb-4">시즌 순위 보상</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-amber-500/10 rounded-xl">
                            <span className="text-2xl">🥇</span>
                            <div className="flex-1">
                              <p className="text-white font-medium">1위</p>
                              <p className="text-amber-400 text-sm">100,000 KAUS + 전설 NFT</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-xl">
                            <span className="text-2xl">🥈</span>
                            <div className="flex-1">
                              <p className="text-white font-medium">2위</p>
                              <p className="text-neutral-300 text-sm">50,000 KAUS + 에픽 NFT</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-orange-500/10 rounded-xl">
                            <span className="text-2xl">🥉</span>
                            <div className="flex-1">
                              <p className="text-white font-medium">3위</p>
                              <p className="text-orange-400 text-sm">25,000 KAUS + 희귀 NFT</p>
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
                    {/* My Rank Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-violet-500/20 to-purple-500/20
                        rounded-2xl border border-violet-500/30 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-500
                          rounded-xl flex items-center justify-center text-xl font-bold text-white">
                          #{AchievementEngine.getUserRank('user-001')?.rank || 0}
                        </div>
                        <div>
                          <p className="text-white font-bold">
                            Lv.{userLevel.level} {userLevel.titleKo}
                          </p>
                          <p className="text-violet-400 text-sm">
                            {userLevel.totalXP.toLocaleString()} XP
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    <XPLeaderboard entries={leaderboard} />
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
              <h3 className="text-lg font-bold text-white mb-4 text-center">🎮 레벨업 시스템</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center
                    mx-auto mb-3">
                    <span className="text-2xl">1️⃣</span>
                  </div>
                  <h4 className="font-medium text-white mb-1">퀘스트 완료</h4>
                  <p className="text-xs text-neutral-400">일일/주간/월간 퀘스트 수행</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-violet-500/20 rounded-full flex items-center justify-center
                    mx-auto mb-3">
                    <span className="text-2xl">2️⃣</span>
                  </div>
                  <h4 className="font-medium text-white mb-1">XP 획득</h4>
                  <p className="text-xs text-neutral-400">퀘스트와 업적으로 경험치 축적</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center
                    mx-auto mb-3">
                    <span className="text-2xl">3️⃣</span>
                  </div>
                  <h4 className="font-medium text-white mb-1">레벨업</h4>
                  <p className="text-xs text-neutral-400">레벨이 오르면 새로운 혜택 해금</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-rose-500/20 rounded-full flex items-center justify-center
                    mx-auto mb-3">
                    <span className="text-2xl">4️⃣</span>
                  </div>
                  <h4 className="font-medium text-white mb-1">보상 수령</h4>
                  <p className="text-xs text-neutral-400">KAUS, NFT, 특별 칭호 획득</p>
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
                ⚠️ 퀘스트와 업적 보상은 플랫폼 활동을 기반으로 지급됩니다.
                부정 행위 시 보상이 회수될 수 있습니다.
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
