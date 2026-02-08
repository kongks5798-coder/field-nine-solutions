'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 57: ACHIEVEMENT & QUEST DASHBOARD COMPONENTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * - Quest cards
 * - Achievement showcase
 * - Level progress
 * - Season pass
 * - XP Leaderboard
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AchievementEngine,
  type Quest,
  type Achievement,
  type UserLevel,
  type Season,
  type LeaderboardEntry,
  type QuestType,
  type AchievementRarity,
} from '@/lib/achievements/achievement-engine';

// ═══════════════════════════════════════════════════════════════════════════════
// LEVEL PROGRESS WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

interface LevelProgressProps {
  userLevel: UserLevel;
}

export function LevelProgressWidget({ userLevel }: LevelProgressProps) {
  const progressPercent = (userLevel.currentXP / userLevel.requiredXP) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-2xl border border-violet-500/30 p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl
            flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-violet-500/30">
            {userLevel.level}
          </div>
          <div>
            <p className="text-white font-bold text-lg">{userLevel.titleKo}</p>
            <p className="text-violet-300 text-sm">Level {userLevel.level}</p>
          </div>
        </div>
        {userLevel.nextTitleKo && (
          <div className="text-right">
            <p className="text-neutral-400 text-xs">다음 칭호</p>
            <p className="text-violet-400 font-medium">{userLevel.nextTitleKo}</p>
          </div>
        )}
      </div>

      {/* XP Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-neutral-400">경험치</span>
          <span className="text-white font-medium">
            {userLevel.currentXP.toLocaleString()} / {userLevel.requiredXP.toLocaleString()} XP
          </span>
        </div>
        <div className="h-3 bg-neutral-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
          />
        </div>
      </div>

      {/* Total XP */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-neutral-400">총 경험치</span>
        <span className="text-violet-400 font-bold">{userLevel.totalXP.toLocaleString()} XP</span>
      </div>

      {/* Perks */}
      {userLevel.perks.length > 0 && (
        <div className="mt-4 pt-4 border-t border-neutral-700">
          <p className="text-neutral-400 text-xs mb-2">보유 혜택</p>
          <div className="flex flex-wrap gap-2">
            {userLevel.perks.slice(0, 3).map((perk, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-violet-500/20 text-violet-300 text-xs rounded-lg"
              >
                {perk}
              </span>
            ))}
            {userLevel.perks.length > 3 && (
              <span className="px-2 py-1 bg-neutral-700 text-neutral-400 text-xs rounded-lg">
                +{userLevel.perks.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUEST CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface QuestCardProps {
  quest: Quest;
  onClaim?: (questId: string) => void;
}

export function QuestCard({ quest, onClaim }: QuestCardProps) {
  const progressPercent = (quest.currentProgress / quest.targetProgress) * 100;
  const isClaimable = quest.isCompleted && !quest.isClaimed;

  const typeColors: Record<QuestType, string> = {
    DAILY: 'emerald',
    WEEKLY: 'blue',
    MONTHLY: 'violet',
    SEASONAL: 'amber',
    SPECIAL: 'rose',
  };

  const color = typeColors[quest.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-neutral-900 rounded-xl border p-4 transition-all ${
        quest.isClaimed
          ? 'border-neutral-800 opacity-60'
          : isClaimable
            ? `border-${color}-500/50 shadow-lg shadow-${color}-500/10`
            : 'border-neutral-800 hover:border-neutral-700'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl
          ${quest.isCompleted ? `bg-${color}-500/20` : 'bg-neutral-800'}`}>
          {quest.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-white truncate">{quest.nameKo}</h4>
            <span className={`px-1.5 py-0.5 text-xs rounded bg-${color}-500/20 text-${color}-400`}>
              {quest.type === 'DAILY' ? '일일' : quest.type === 'WEEKLY' ? '주간' : '월간'}
            </span>
          </div>
          <p className="text-neutral-400 text-sm mb-2">{quest.descriptionKo}</p>

          {/* Progress */}
          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-neutral-400">진행도</span>
              <span className={quest.isCompleted ? `text-${color}-400` : 'text-white'}>
                {quest.currentProgress.toLocaleString()} / {quest.targetProgress.toLocaleString()} {quest.unitKo}
              </span>
            </div>
            <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progressPercent, 100)}%` }}
                className={`h-full rounded-full ${
                  quest.isCompleted
                    ? `bg-${color}-500`
                    : 'bg-gradient-to-r from-neutral-600 to-neutral-500'
                }`}
              />
            </div>
          </div>

          {/* Rewards */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {quest.rewards.map((reward, index) => (
                <span key={index} className="text-xs text-amber-400">
                  +{reward.amount} {reward.type}
                </span>
              ))}
              <span className="text-xs text-violet-400">+{quest.xpReward} XP</span>
            </div>

            {isClaimable && (
              <button
                onClick={() => onClaim?.(quest.id)}
                className={`px-3 py-1.5 bg-${color}-500 text-white text-sm font-medium rounded-lg
                  hover:opacity-90 transition-all`}
              >
                받기
              </button>
            )}
            {quest.isClaimed && (
              <span className="text-neutral-500 text-sm">완료됨</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUEST LIST
// ═══════════════════════════════════════════════════════════════════════════════

interface QuestListProps {
  quests: Quest[];
  onClaim?: (questId: string) => void;
}

export function QuestList({ quests, onClaim }: QuestListProps) {
  return (
    <div className="space-y-3">
      {quests.map((quest) => (
        <QuestCard key={quest.id} quest={quest} onClaim={onClaim} />
      ))}
      {quests.length === 0 && (
        <div className="text-center py-8 text-neutral-500">
          현재 진행 중인 퀘스트가 없습니다
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUEST PROGRESS OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════

export function QuestProgressOverview() {
  const progress = AchievementEngine.getQuestProgress();

  const items = [
    { label: '일일', progress: progress.daily, color: 'emerald' },
    { label: '주간', progress: progress.weekly, color: 'blue' },
    { label: '월간', progress: progress.monthly, color: 'violet' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5"
    >
      <h3 className="font-bold text-white mb-4">퀘스트 진행 현황</h3>
      <div className="grid grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-2">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-neutral-800"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${item.progress * 1.76} 176`}
                  className={`text-${item.color}-500`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {Math.round(item.progress)}%
                </span>
              </div>
            </div>
            <p className={`text-${item.color}-400 text-sm font-medium`}>{item.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACHIEVEMENT CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface AchievementCardProps {
  achievement: Achievement;
  onClick?: () => void;
}

export function AchievementCard({ achievement, onClick }: AchievementCardProps) {
  const progressPercent = (achievement.currentProgress / achievement.targetProgress) * 100;
  const gradient = AchievementEngine.getRarityGradient(achievement.rarity);

  const rarityLabels: Record<AchievementRarity, string> = {
    COMMON: '일반',
    RARE: '희귀',
    EPIC: '에픽',
    LEGENDARY: '전설',
    MYTHIC: '신화',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`relative bg-neutral-900 rounded-xl border p-4 cursor-pointer transition-all ${
        achievement.isUnlocked
          ? 'border-neutral-700'
          : 'border-neutral-800 opacity-70 grayscale-[50%]'
      }`}
    >
      {/* Rarity Badge */}
      <div className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-medium
        bg-gradient-to-r ${gradient} text-white shadow-lg`}>
        {rarityLabels[achievement.rarity]}
      </div>

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl
          ${achievement.isUnlocked ? `bg-gradient-to-br ${gradient}` : 'bg-neutral-800'}`}>
          {achievement.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-white mb-0.5">{achievement.nameKo}</h4>
          <p className="text-neutral-400 text-sm mb-2">{achievement.descriptionKo}</p>

          {/* Progress */}
          {!achievement.isUnlocked && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-500">진행도</span>
                <span className="text-white">
                  {achievement.currentProgress.toLocaleString()} / {achievement.targetProgress.toLocaleString()}
                </span>
              </div>
              <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${gradient} rounded-full`}
                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Unlocked info */}
          {achievement.isUnlocked && achievement.unlockedAt && (
            <p className="text-emerald-400 text-xs">
              {new Date(achievement.unlockedAt).toLocaleDateString('ko-KR')} 달성
            </p>
          )}

          {/* Tier info */}
          {achievement.tier && achievement.maxTier && (
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: achievement.maxTier }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < achievement.tier! ? 'bg-amber-400' : 'bg-neutral-700'
                  }`}
                />
              ))}
              <span className="text-neutral-500 text-xs ml-1">Tier {achievement.tier}</span>
            </div>
          )}
        </div>
      </div>

      {/* XP Reward */}
      <div className="absolute bottom-3 right-3 text-violet-400 text-xs font-medium">
        +{achievement.xpReward} XP
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACHIEVEMENT GRID
// ═══════════════════════════════════════════════════════════════════════════════

interface AchievementGridProps {
  achievements: Achievement[];
}

export function AchievementGrid({ achievements }: AchievementGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {achievements.map((achievement) => (
        <AchievementCard key={achievement.id} achievement={achievement} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEASON PASS WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

interface SeasonPassProps {
  season: Season;
  userLevel: UserLevel;
}

export function SeasonPassWidget({ season, userLevel }: SeasonPassProps) {
  const timeRemaining = AchievementEngine.getSeasonTimeRemaining();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl border border-amber-500/30 p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-white text-lg">{season.nameKo}</h3>
          <p className="text-amber-400 text-sm">{season.descriptionKo}</p>
        </div>
        <div className="text-right">
          <p className="text-neutral-400 text-xs">시즌 종료까지</p>
          <p className="text-white font-bold">
            {timeRemaining.days}일 {timeRemaining.hours}시간
          </p>
        </div>
      </div>

      {/* Milestones */}
      <div className="relative">
        <div className="absolute top-4 left-0 right-0 h-1 bg-neutral-800 rounded-full" />
        <div className="flex justify-between relative">
          {season.milestones.slice(0, 5).map((milestone, index) => (
            <div key={milestone.level} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10
                  ${milestone.isUnlocked
                    ? milestone.isClaimed
                      ? 'bg-emerald-500 text-white'
                      : 'bg-amber-500 text-white animate-pulse'
                    : 'bg-neutral-700 text-neutral-400'
                  }`}
              >
                {milestone.level}
              </div>
              <div className="mt-2 text-center">
                {milestone.rewards[0] && (
                  <p className={`text-xs ${milestone.isUnlocked ? 'text-amber-400' : 'text-neutral-500'}`}>
                    {milestone.rewards[0].amount} {milestone.rewards[0].type}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Progress */}
      <div className="mt-4 pt-4 border-t border-neutral-700">
        <div className="flex justify-between items-center">
          <span className="text-neutral-400 text-sm">현재 레벨</span>
          <span className="text-amber-400 font-bold">Lv.{userLevel.level}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// XP LEADERBOARD
// ═══════════════════════════════════════════════════════════════════════════════

interface XPLeaderboardProps {
  entries: LeaderboardEntry[];
}

export function XPLeaderboard({ entries }: XPLeaderboardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden"
    >
      <div className="p-4 border-b border-neutral-800">
        <h3 className="font-bold text-white">XP 리더보드</h3>
      </div>

      <div className="divide-y divide-neutral-800">
        {entries.map((entry) => (
          <div
            key={entry.userId}
            className={`flex items-center gap-3 p-3 ${
              entry.isCurrentUser ? 'bg-violet-500/10' : ''
            }`}
          >
            {/* Rank */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
              ${entry.rank === 1 ? 'bg-amber-500/20 text-amber-400' :
                entry.rank === 2 ? 'bg-neutral-400/20 text-neutral-300' :
                entry.rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                'bg-neutral-800 text-neutral-400'}`}
            >
              {entry.rank}
            </div>

            {/* Avatar & Name */}
            <div className="flex-1 flex items-center gap-2">
              <span className="text-xl">{entry.avatar}</span>
              <div>
                <p className={`font-medium ${entry.isCurrentUser ? 'text-violet-400' : 'text-white'}`}>
                  {entry.name}
                </p>
                <p className="text-neutral-500 text-xs">Lv.{entry.level}</p>
              </div>
            </div>

            {/* XP */}
            <div className="text-right">
              <p className="text-white font-bold">{entry.totalXP.toLocaleString()}</p>
              <p className="text-neutral-500 text-xs">XP</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATS OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════

export function AchievementStatsOverview() {
  const stats = AchievementEngine.getUserStats();

  const statItems = [
    { label: '업적 달성', value: `${stats.unlockedAchievements}/${stats.totalAchievements}`, icon: '🏆', color: 'amber' },
    { label: '완료 퀘스트', value: stats.totalQuestsCompleted.toString(), icon: '✅', color: 'emerald' },
    { label: '총 XP', value: stats.totalXPEarned.toLocaleString(), icon: '⚡', color: 'violet' },
    { label: '연속 출석', value: `${stats.currentStreak}일`, icon: '🔥', color: 'orange' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {statItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`bg-neutral-900 rounded-xl border border-neutral-800 p-4 text-center`}
        >
          <span className="text-2xl">{item.icon}</span>
          <p className={`text-${item.color}-400 font-bold text-xl mt-1`}>{item.value}</p>
          <p className="text-neutral-500 text-xs mt-0.5">{item.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEAR COMPLETION ACHIEVEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

export function NearCompletionWidget() {
  const achievements = AchievementEngine.getNearCompletionAchievements(0.5);

  if (achievements.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5"
    >
      <h3 className="font-bold text-white mb-4">곧 달성 가능한 업적</h3>
      <div className="space-y-3">
        {achievements.slice(0, 3).map((achievement) => {
          const progress = (achievement.currentProgress / achievement.targetProgress) * 100;
          return (
            <div key={achievement.id} className="flex items-center gap-3">
              <span className="text-2xl">{achievement.icon}</span>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{achievement.nameKo}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-neutral-400 text-xs">{Math.round(progress)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STREAK CALENDAR
// ═══════════════════════════════════════════════════════════════════════════════

export function StreakCalendar() {
  const stats = AchievementEngine.getUserStats();
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - i));
    return {
      date,
      active: i >= 7 - stats.currentStreak,
      isToday: i === 6,
    };
  });

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white">출석 스트릭</h3>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <span className="text-orange-400 font-bold">{stats.currentStreak}일 연속</span>
        </div>
      </div>

      <div className="flex justify-between">
        {days.map((day, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            <span className="text-neutral-500 text-xs">
              {dayNames[day.date.getDay()]}
            </span>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                day.active
                  ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white'
                  : 'bg-neutral-800 text-neutral-500'
              } ${day.isToday ? 'ring-2 ring-orange-400 ring-offset-2 ring-offset-neutral-900' : ''}`}
            >
              {day.date.getDate()}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-neutral-700 flex justify-between items-center">
        <span className="text-neutral-400 text-sm">최장 스트릭</span>
        <span className="text-amber-400 font-bold">{stats.longestStreak}일</span>
      </div>
    </motion.div>
  );
}

