'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getPreferences,
  updatePreferences,
  getUserStats,
  getActivityTimeline,
  getAchievementsByCategory,
  type Notification,
  type NotificationCategory,
  type NotificationPreferences,
  type UserStats,
  type Achievement,
  type ActivityItem,
  type AchievementCategory,
  LEVELS,
} from '@/lib/notifications/command-center';

// ============================================================
// NOTIFICATION CENTER PANEL
// ============================================================
export function NotificationCenterPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<NotificationCategory | 'ALL'>('ALL');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const loadNotifications = () => {
    const filterConfig = filter === 'ALL' ? undefined : { category: filter };
    setNotifications(getNotifications(filterConfig));
    setUnreadCount(getUnreadCount());
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    loadNotifications();
  };

  const priorityColors = {
    LOW: 'border-neutral-600',
    MEDIUM: 'border-blue-500/50',
    HIGH: 'border-amber-500/50',
    URGENT: 'border-red-500/50',
  };

  const categoryFilters: Array<{ value: NotificationCategory | 'ALL'; label: string; icon: string }> = [
    { value: 'ALL', label: '전체', icon: '📋' },
    { value: 'TRADE', label: '거래', icon: '📈' },
    { value: 'SOCIAL', label: '소셜', icon: '👥' },
    { value: 'ACHIEVEMENT', label: '업적', icon: '🏆' },
    { value: 'ALERT', label: '알림', icon: '🔔' },
    { value: 'REWARD', label: '보상', icon: '🎁' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#171717] rounded-2xl p-6 border border-neutral-800"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center relative">
            <span className="text-xl">🔔</span>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
              >
                <span className="text-white text-xs font-bold">{unreadCount}</span>
              </motion.div>
            )}
          </div>
          <div>
            <h3 className="text-white font-medium">Notification Center</h3>
            <p className="text-neutral-500 text-sm">실시간 알림</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-amber-400 text-sm hover:text-amber-300 transition-colors"
          >
            모두 읽음
          </button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        {categoryFilters.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilter(cat.value)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all flex items-center gap-1.5 ${
              filter === cat.value
                ? 'bg-rose-500 text-white font-medium'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        <AnimatePresence>
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => handleMarkAsRead(notification.id)}
              className={`p-4 rounded-xl border-l-4 cursor-pointer transition-all ${
                priorityColors[notification.priority]
              } ${
                notification.isRead ? 'bg-neutral-800/30' : 'bg-neutral-800/70'
              } hover:bg-neutral-800`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{notification.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${notification.isRead ? 'text-neutral-400' : 'text-white'}`}>
                      {notification.title}
                    </span>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-neutral-500 text-sm mt-1">{notification.message}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-neutral-600 text-xs">
                      {new Date(notification.timestamp).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {notification.actionUrl && (
                      <span className="text-amber-400 text-xs">→ 자세히</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ============================================================
// ACHIEVEMENT SHOWCASE
// ============================================================
export function AchievementShowcase() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'ALL'>('ALL');

  useEffect(() => {
    setStats(getUserStats());
  }, []);

  if (!stats) return null;

  const rarityColors = {
    COMMON: 'from-neutral-500 to-neutral-400',
    RARE: 'from-blue-500 to-cyan-400',
    EPIC: 'from-violet-500 to-purple-400',
    LEGENDARY: 'from-amber-500 to-orange-400',
    MYTHIC: 'from-rose-500 via-pink-500 to-violet-500',
  };

  const rarityBg = {
    COMMON: 'bg-neutral-500/20',
    RARE: 'bg-blue-500/20',
    EPIC: 'bg-violet-500/20',
    LEGENDARY: 'bg-amber-500/20',
    MYTHIC: 'bg-gradient-to-r from-rose-500/20 to-violet-500/20',
  };

  const categories: Array<{ value: AchievementCategory | 'ALL'; label: string; icon: string }> = [
    { value: 'ALL', label: '전체', icon: '🏆' },
    { value: 'TRADING', label: '거래', icon: '📈' },
    { value: 'SOCIAL', label: '소셜', icon: '👥' },
    { value: 'STAKING', label: '스테이킹', icon: '🔒' },
    { value: 'ENERGY', label: '에너지', icon: '⚡' },
    { value: 'EXPLORER', label: '탐험', icon: '🗺️' },
  ];

  const filteredAchievements = selectedCategory === 'ALL'
    ? stats.achievements
    : stats.achievements.filter(a => a.category === selectedCategory);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-[#171717] rounded-2xl p-6 border border-neutral-800"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <span className="text-xl">🏆</span>
          </div>
          <div>
            <h3 className="text-white font-medium">Achievements</h3>
            <p className="text-neutral-500 text-sm">
              {stats.unlockedCount}/{stats.totalCount} 달성
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-amber-400 font-bold">{stats.totalXP.toLocaleString()} XP</div>
          <div className="text-neutral-500 text-xs">총 경험치</div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${
              selectedCategory === cat.value
                ? 'bg-amber-500 text-black font-medium'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
        {filteredAchievements.map((achievement, index) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
            className={`relative rounded-xl p-4 border transition-all ${
              achievement.unlockedAt
                ? `${rarityBg[achievement.rarity]} border-${achievement.rarity === 'MYTHIC' ? 'rose' : achievement.rarity === 'LEGENDARY' ? 'amber' : 'neutral'}-500/30`
                : 'bg-neutral-800/30 border-neutral-700 opacity-60'
            }`}
          >
            {/* Icon */}
            <div className="text-3xl mb-2">{achievement.icon}</div>

            {/* Name */}
            <div className="text-white text-sm font-medium mb-1">{achievement.nameKo}</div>

            {/* Progress or Unlocked */}
            {achievement.unlockedAt ? (
              <div className="text-emerald-400 text-xs">✓ 달성</div>
            ) : (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-neutral-500 mb-1">
                  <span>{achievement.requirement.current}/{achievement.requirement.target}</span>
                  <span>{achievement.progress}%</span>
                </div>
                <div className="h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${achievement.progress}%` }}
                    className={`h-full bg-gradient-to-r ${rarityColors[achievement.rarity]}`}
                  />
                </div>
              </div>
            )}

            {/* Rarity Badge */}
            <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gradient-to-r ${rarityColors[achievement.rarity]} text-white`}>
              {achievement.rarity}
            </div>

            {/* XP Reward */}
            <div className="absolute bottom-2 right-2 text-xs text-amber-400">
              +{achievement.xpReward} XP
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================
// LEVEL PROGRESS CARD
// ============================================================
export function LevelProgressCard() {
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    setStats(getUserStats());
  }, []);

  if (!stats) return null;

  const { level } = stats;
  const progress = ((level.currentXP - level.minXP) / (level.maxXP - level.minXP)) * 100;
  const nextLevel = LEVELS.find(l => l.level === level.level + 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-[#171717] rounded-2xl p-6 border border-neutral-800"
    >
      {/* Current Level */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <span className="text-4xl">{level.icon}</span>
        </div>
        <div>
          <div className="text-neutral-500 text-sm">현재 레벨</div>
          <div className="text-2xl font-bold text-white">
            Lv.{level.level} {level.titleKo}
          </div>
          <div className="text-amber-400 text-sm">{level.currentXP.toLocaleString()} XP</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-neutral-500">다음 레벨까지</span>
          <span className="text-white font-medium">
            {(level.maxXP - level.currentXP).toLocaleString()} XP
          </span>
        </div>
        <div className="h-3 bg-neutral-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
          />
        </div>
        <div className="flex justify-between text-xs text-neutral-600 mt-1">
          <span>{level.minXP.toLocaleString()}</span>
          <span>{level.maxXP === Infinity ? '∞' : level.maxXP.toLocaleString()}</span>
        </div>
      </div>

      {/* Current Benefits */}
      <div className="mb-4">
        <div className="text-neutral-500 text-sm mb-2">현재 혜택</div>
        <div className="flex flex-wrap gap-2">
          {level.benefits.map((benefit, i) => (
            <span key={i} className="px-2 py-1 bg-violet-500/20 text-violet-400 rounded-lg text-xs">
              ✓ {benefit}
            </span>
          ))}
        </div>
      </div>

      {/* Next Level Preview */}
      {nextLevel && (
        <div className="pt-4 border-t border-neutral-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl opacity-50">{nextLevel.icon}</span>
            <div>
              <div className="text-neutral-500 text-xs">다음 레벨</div>
              <div className="text-white text-sm">Lv.{nextLevel.level} {nextLevel.titleKo}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-neutral-400 text-sm">해금 혜택</div>
              <div className="text-amber-400 text-xs">{nextLevel.benefits[0]}</div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ============================================================
// ACTIVITY TIMELINE
// ============================================================
export function ActivityTimelineWidget() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    setActivities(getActivityTimeline(10));
  }, []);

  const typeIcons: Record<string, string> = {
    TRADE: '📊',
    STAKE: '🔒',
    UNSTAKE: '🔓',
    TRANSFER: '💸',
    ACHIEVEMENT: '🏆',
    LEVEL_UP: '⬆️',
    REWARD: '🎁',
    LOGIN: '👋',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-[#171717] rounded-2xl p-6 border border-neutral-800"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <span className="text-xl">📜</span>
        </div>
        <div>
          <h3 className="text-white font-medium">Activity Timeline</h3>
          <p className="text-neutral-500 text-sm">활동 내역</p>
        </div>
      </div>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-5 top-0 bottom-0 w-px bg-neutral-800" />

        <div className="space-y-4">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative flex items-start gap-4 pl-2"
            >
              {/* Timeline Dot */}
              <div className="relative z-10 w-8 h-8 rounded-full bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center flex-shrink-0">
                <span className="text-sm">{activity.icon}</span>
              </div>

              {/* Content */}
              <div className="flex-1 bg-neutral-800/50 rounded-xl p-3 hover:bg-neutral-800 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-sm font-medium">{activity.title}</span>
                  <span className="text-neutral-600 text-xs">
                    {new Date(activity.timestamp).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-neutral-500 text-xs">{activity.description}</p>

                {activity.value && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-white text-sm font-medium">
                      {activity.value.toLocaleString()} {activity.valueUnit}
                    </span>
                    {activity.pnlPercent !== undefined && (
                      <span className={`text-xs font-medium ${
                        activity.pnlPercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {activity.pnlPercent >= 0 ? '+' : ''}{activity.pnlPercent.toFixed(1)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// NOTIFICATION PREFERENCES
// ============================================================
export function NotificationPreferencesPanel() {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    setPrefs(getPreferences());
  }, []);

  const handleToggleCategory = (category: NotificationCategory) => {
    if (!prefs) return;
    const updated = updatePreferences({
      categories: {
        ...prefs.categories,
        [category]: !prefs.categories[category],
      },
    });
    setPrefs(updated);
  };

  const handleToggle = (key: 'pushEnabled' | 'emailEnabled' | 'soundEnabled') => {
    if (!prefs) return;
    const updated = updatePreferences({ [key]: !prefs[key] });
    setPrefs(updated);
  };

  if (!prefs) return null;

  const categoryLabels: Record<NotificationCategory, { label: string; icon: string }> = {
    TRADE: { label: '거래 알림', icon: '📈' },
    SOCIAL: { label: '소셜 알림', icon: '👥' },
    SYSTEM: { label: '시스템 알림', icon: '⚙️' },
    ACHIEVEMENT: { label: '업적 알림', icon: '🏆' },
    ALERT: { label: '가격 알림', icon: '🔔' },
    REWARD: { label: '보상 알림', icon: '🎁' },
    SECURITY: { label: '보안 알림', icon: '🔐' },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-[#171717] rounded-2xl p-6 border border-neutral-800"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-600 to-neutral-700 flex items-center justify-center">
          <span className="text-xl">⚙️</span>
        </div>
        <div>
          <h3 className="text-white font-medium">Preferences</h3>
          <p className="text-neutral-500 text-sm">알림 설정</p>
        </div>
      </div>

      {/* General Settings */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-lg">📲</span>
            <span className="text-white text-sm">푸시 알림</span>
          </div>
          <button
            onClick={() => handleToggle('pushEnabled')}
            className={`w-12 h-6 rounded-full transition-colors ${
              prefs.pushEnabled ? 'bg-emerald-500' : 'bg-neutral-700'
            }`}
          >
            <motion.div
              animate={{ x: prefs.pushEnabled ? 24 : 2 }}
              className="w-5 h-5 bg-white rounded-full shadow"
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-lg">🔊</span>
            <span className="text-white text-sm">소리</span>
          </div>
          <button
            onClick={() => handleToggle('soundEnabled')}
            className={`w-12 h-6 rounded-full transition-colors ${
              prefs.soundEnabled ? 'bg-emerald-500' : 'bg-neutral-700'
            }`}
          >
            <motion.div
              animate={{ x: prefs.soundEnabled ? 24 : 2 }}
              className="w-5 h-5 bg-white rounded-full shadow"
            />
          </button>
        </div>
      </div>

      {/* Category Settings */}
      <div className="pt-4 border-t border-neutral-800">
        <div className="text-neutral-500 text-sm mb-3">카테고리별 설정</div>
        <div className="space-y-2">
          {(Object.keys(prefs.categories) as NotificationCategory[]).map((category) => (
            <div
              key={category}
              className="flex items-center justify-between p-2 hover:bg-neutral-800/30 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <span>{categoryLabels[category].icon}</span>
                <span className="text-neutral-300 text-sm">{categoryLabels[category].label}</span>
              </div>
              <button
                onClick={() => handleToggleCategory(category)}
                className={`w-10 h-5 rounded-full transition-colors ${
                  prefs.categories[category] ? 'bg-emerald-500' : 'bg-neutral-700'
                }`}
              >
                <motion.div
                  animate={{ x: prefs.categories[category] ? 20 : 2 }}
                  className="w-4 h-4 bg-white rounded-full shadow"
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// STREAK COUNTER
// ============================================================
export function StreakCounter() {
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    setStats(getUserStats());
  }, []);

  if (!stats) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl p-6 border border-orange-500/30"
    >
      <div className="text-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-5xl mb-3"
        >
          🔥
        </motion.div>
        <div className="text-4xl font-bold text-white mb-1">
          {stats.streakDays}일
        </div>
        <div className="text-orange-400 text-sm">연속 접속</div>

        <div className="mt-4 pt-4 border-t border-orange-500/20">
          <div className="text-neutral-400 text-xs mb-2">다음 보상까지</div>
          <div className="flex justify-center gap-1">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  i < stats.streakDays % 7
                    ? 'bg-orange-500 text-white'
                    : 'bg-neutral-800 text-neutral-600'
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
