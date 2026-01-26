'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getPortfolioData,
  calculateRiskMetrics,
  generateAlerts,
  getLeaderboard,
  getUserRank,
  type PortfolioAsset,
  type PortfolioSummary,
  type RiskMetrics,
  type Alert,
  type LeaderboardEntry,
} from '@/lib/ai/portfolio-analytics';

// ============================================================
// PORTFOLIO OVERVIEW WIDGET
// ============================================================
export function PortfolioOverview() {
  const [portfolio, setPortfolio] = useState<{
    assets: PortfolioAsset[];
    summary: PortfolioSummary;
  } | null>(null);

  useEffect(() => {
    const data = getPortfolioData();
    setPortfolio({ assets: data.assets, summary: data.summary });

    const interval = setInterval(() => {
      const updated = getPortfolioData();
      setPortfolio({ assets: updated.assets, summary: updated.summary });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!portfolio) {
    return (
      <div className="bg-[#171717] rounded-2xl p-6 animate-pulse">
        <div className="h-8 bg-neutral-800 rounded w-1/3 mb-4" />
        <div className="h-24 bg-neutral-800 rounded" />
      </div>
    );
  }

  const { summary } = portfolio;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#171717] rounded-2xl p-6 border border-neutral-800"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <span className="text-xl">💎</span>
          </div>
          <div>
            <h3 className="text-white font-medium">Portfolio Overview</h3>
            <p className="text-neutral-500 text-sm">Total Net Worth</p>
          </div>
        </div>
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            summary.totalPnLPercent >= 0
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-red-500/20 text-red-400'
          }`}
        >
          {summary.totalPnLPercent >= 0 ? '+' : ''}
          {summary.totalPnLPercent.toFixed(2)}%
        </motion.div>
      </div>

      {/* Total Value */}
      <div className="mb-6">
        <motion.div
          key={summary.totalValue}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          className="text-4xl font-bold text-white mb-1"
        >
          ₩{summary.totalValue.toLocaleString()}
        </motion.div>
        <div className="flex items-center gap-2 text-sm">
          <span className={summary.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            {summary.totalPnL >= 0 ? '+' : ''}₩{summary.totalPnL.toLocaleString()}
          </span>
          <span className="text-neutral-500">오늘</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-neutral-800/50 rounded-xl p-4">
          <div className="text-neutral-500 text-xs mb-1">투자 원금</div>
          <div className="text-white font-medium">₩{summary.totalCost.toLocaleString()}</div>
        </div>
        <div className="bg-neutral-800/50 rounded-xl p-4">
          <div className="text-neutral-500 text-xs mb-1">총 자산 수</div>
          <div className="text-white font-medium">{portfolio.assets.length}개</div>
        </div>
        <div className="bg-neutral-800/50 rounded-xl p-4">
          <div className="text-neutral-500 text-xs mb-1">최고 수익 자산</div>
          <div className="text-emerald-400 font-medium">
            {portfolio.assets.reduce((max, a) => a.pnlPercent > max.pnlPercent ? a : max, portfolio.assets[0])?.symbol || '-'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// ASSET ALLOCATION CHART
// ============================================================
export function AssetAllocationChart() {
  const [assets, setAssets] = useState<PortfolioAsset[]>([]);

  useEffect(() => {
    const data = getPortfolioData();
    setAssets(data.assets);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-[#171717] rounded-2xl p-6 border border-neutral-800"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <span className="text-xl">📊</span>
        </div>
        <div>
          <h3 className="text-white font-medium">Asset Allocation</h3>
          <p className="text-neutral-500 text-sm">포트폴리오 구성</p>
        </div>
      </div>

      {/* Donut Chart Visualization */}
      <div className="relative w-48 h-48 mx-auto mb-6">
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          {assets.reduce(
            (acc, asset, index) => {
              const circumference = 2 * Math.PI * 40;
              const strokeDasharray = (asset.allocation / 100) * circumference;
              const strokeDashoffset = -acc.offset;

              acc.elements.push(
                <motion.circle
                  key={asset.id}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={asset.color}
                  strokeWidth="12"
                  strokeDasharray={`${strokeDasharray} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  initial={{ strokeDasharray: `0 ${circumference}` }}
                  animate={{ strokeDasharray: `${strokeDasharray} ${circumference}` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                />
              );

              acc.offset += strokeDasharray;
              return acc;
            },
            { elements: [] as React.ReactNode[], offset: 0 }
          ).elements}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-2xl">💰</span>
          <span className="text-white text-sm font-medium mt-1">{assets.length} 자산</span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {assets.map((asset) => (
          <div key={asset.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: asset.color }}
              />
              <span className="text-neutral-400 text-sm">{asset.symbol}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white text-sm font-medium">
                {asset.allocation.toFixed(1)}%
              </span>
              <span
                className={`text-xs ${
                  asset.pnlPercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {asset.pnlPercent >= 0 ? '+' : ''}
                {asset.pnlPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================
// RISK METRICS PANEL
// ============================================================
export function RiskMetricsPanel() {
  const [metrics, setMetrics] = useState<RiskMetrics | null>(null);

  useEffect(() => {
    setMetrics(calculateRiskMetrics());
  }, []);

  if (!metrics) return null;

  const riskLevelColors = {
    LOW: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: '안전' },
    MODERATE: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: '보통' },
    HIGH: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: '높음' },
    EXTREME: { bg: 'bg-red-500/20', text: 'text-red-400', label: '위험' },
  };

  const riskStyle = riskLevelColors[metrics.riskLevel];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-[#171717] rounded-2xl p-6 border border-neutral-800"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <span className="text-xl">🛡️</span>
          </div>
          <div>
            <h3 className="text-white font-medium">Risk Analysis</h3>
            <p className="text-neutral-500 text-sm">포트폴리오 리스크</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${riskStyle.bg} ${riskStyle.text}`}>
          {riskStyle.label}
        </div>
      </div>

      {/* Risk Score Gauge */}
      <div className="relative h-4 bg-neutral-800 rounded-full overflow-hidden mb-6">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${metrics.riskScore}%` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className={`absolute inset-y-0 left-0 rounded-full ${
            metrics.riskScore < 30
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
              : metrics.riskScore < 50
                ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                : metrics.riskScore < 70
                  ? 'bg-gradient-to-r from-orange-500 to-orange-400'
                  : 'bg-gradient-to-r from-red-500 to-red-400'
          }`}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white text-xs font-bold">{metrics.riskScore}/100</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-neutral-800/50 rounded-xl p-3">
          <div className="text-neutral-500 text-xs mb-1">변동성</div>
          <div className="text-white font-medium">{(metrics.volatility * 100).toFixed(1)}%</div>
        </div>
        <div className="bg-neutral-800/50 rounded-xl p-3">
          <div className="text-neutral-500 text-xs mb-1">샤프 비율</div>
          <div className="text-white font-medium">{metrics.sharpeRatio.toFixed(2)}</div>
        </div>
        <div className="bg-neutral-800/50 rounded-xl p-3">
          <div className="text-neutral-500 text-xs mb-1">최대 낙폭</div>
          <div className="text-red-400 font-medium">-{(metrics.maxDrawdown * 100).toFixed(1)}%</div>
        </div>
        <div className="bg-neutral-800/50 rounded-xl p-3">
          <div className="text-neutral-500 text-xs mb-1">분산화 점수</div>
          <div className="text-emerald-400 font-medium">{metrics.diversificationScore}/100</div>
        </div>
      </div>

      {/* Recommendations */}
      {metrics.recommendations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-neutral-800">
          <div className="text-neutral-500 text-xs mb-2">AI 추천</div>
          <div className="space-y-2">
            {metrics.recommendations.slice(0, 2).map((rec, index) => (
              <div
                key={index}
                className="text-sm text-neutral-300 bg-neutral-800/30 rounded-lg px-3 py-2"
              >
                💡 {rec}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ============================================================
// ALERT CENTER
// ============================================================
export function AlertCenter() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setAlerts(generateAlerts());

    const interval = setInterval(() => {
      setAlerts(generateAlerts());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const priorityStyles: Record<string, { bg: string; border: string; icon: string }> = {
    URGENT: { bg: 'bg-red-500/20', border: 'border-red-500/30', icon: '🚨' },
    HIGH: { bg: 'bg-orange-500/20', border: 'border-orange-500/30', icon: '⚠️' },
    MEDIUM: { bg: 'bg-amber-500/20', border: 'border-amber-500/30', icon: '📢' },
    LOW: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', icon: '💬' },
  };

  const displayAlerts = showAll ? alerts : alerts.slice(0, 4);
  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-[#171717] rounded-2xl p-6 border border-neutral-800"
    >
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
            <h3 className="text-white font-medium">Alert Center</h3>
            <p className="text-neutral-500 text-sm">실시간 알림</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {displayAlerts.map((alert, index) => {
            const style = priorityStyles[alert.priority];
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={`${style.bg} border ${style.border} rounded-xl p-3 cursor-pointer hover:brightness-110 transition-all`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">{style.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-medium">{alert.title}</span>
                      {!alert.isRead && (
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <p className="text-neutral-400 text-xs mt-1 line-clamp-2">
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {alert.asset && (
                        <span className="text-xs bg-neutral-700 px-2 py-0.5 rounded text-neutral-300">
                          {alert.asset}
                        </span>
                      )}
                      <span className="text-neutral-500 text-xs">
                        {new Date(alert.timestamp).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {alerts.length > 4 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-4 py-2 text-center text-neutral-400 text-sm hover:text-white transition-colors"
        >
          {showAll ? '접기' : `${alerts.length - 4}개 더보기`}
        </button>
      )}
    </motion.div>
  );
}

// ============================================================
// PERFORMANCE LEADERBOARD
// ============================================================
export function PerformanceLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    setLeaderboard(getLeaderboard(period));
    setUserRank(getUserRank());
  }, [period]);

  const tierStyles: Record<string, { bg: string; text: string; gradient: string }> = {
    BRONZE: { bg: 'bg-amber-900/30', text: 'text-amber-600', gradient: 'from-amber-900 to-amber-700' },
    SILVER: { bg: 'bg-neutral-500/30', text: 'text-neutral-300', gradient: 'from-neutral-500 to-neutral-400' },
    GOLD: { bg: 'bg-yellow-500/30', text: 'text-yellow-400', gradient: 'from-yellow-500 to-yellow-400' },
    PLATINUM: { bg: 'bg-cyan-500/30', text: 'text-cyan-400', gradient: 'from-cyan-500 to-cyan-400' },
    DIAMOND: { bg: 'bg-violet-500/30', text: 'text-violet-400', gradient: 'from-violet-500 to-violet-400' },
    SOVEREIGN: { bg: 'bg-gradient-to-r from-amber-500/30 to-rose-500/30', text: 'text-amber-300', gradient: 'from-amber-400 via-rose-400 to-violet-400' },
  };

  const tierIcons: Record<string, string> = {
    BRONZE: '🥉',
    SILVER: '🥈',
    GOLD: '🥇',
    PLATINUM: '💎',
    DIAMOND: '👑',
    SOVEREIGN: '⚜️',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-[#171717] rounded-2xl p-6 border border-neutral-800"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
            <span className="text-xl">🏆</span>
          </div>
          <div>
            <h3 className="text-white font-medium">Performance Leaderboard</h3>
            <p className="text-neutral-500 text-sm">트레이더 순위</p>
          </div>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-2 mb-6">
        {(['week', 'month', 'all'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              period === p
                ? 'bg-amber-500 text-black font-medium'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
            }`}
          >
            {p === 'week' ? '주간' : p === 'month' ? '월간' : '전체'}
          </button>
        ))}
      </div>

      {/* Leaderboard List */}
      <div className="space-y-3">
        {leaderboard.slice(0, 5).map((entry, index) => {
          const style = tierStyles[entry.tier];
          return (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative overflow-hidden rounded-xl p-4 ${
                index === 0
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30'
                  : 'bg-neutral-800/50'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                    index === 0
                      ? 'bg-amber-500 text-black'
                      : index === 1
                        ? 'bg-neutral-300 text-black'
                        : index === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-neutral-700 text-neutral-300'
                  }`}
                >
                  {entry.rank}
                </div>

                {/* Avatar */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center text-xl">
                    {entry.avatar}
                  </div>
                  {entry.isVerified && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-[8px]">✓</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium truncate">{entry.username}</span>
                    <span className="text-sm">{tierIcons[entry.tier]}</span>
                    {entry.streak > 0 && (
                      <span className="text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded">
                        🔥 {entry.streak}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-neutral-500 text-xs">
                      승률 {(entry.winRate * 100).toFixed(0)}%
                    </span>
                    <span className="text-neutral-500 text-xs">
                      {entry.totalTrades}회 거래
                    </span>
                  </div>
                </div>

                {/* Return */}
                <div className="text-right">
                  <div
                    className={`font-bold ${
                      entry.totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {entry.totalReturn >= 0 ? '+' : ''}
                    {(entry.totalReturn * 100).toFixed(1)}%
                  </div>
                  <div className="text-neutral-500 text-xs">
                    ₩{(entry.portfolioValue / 1000000).toFixed(1)}M
                  </div>
                </div>
              </div>

              {/* Badges */}
              {entry.badges.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {entry.badges.slice(0, 3).map((badge, i) => (
                    <span
                      key={i}
                      className="text-xs bg-neutral-700/50 px-2 py-0.5 rounded text-neutral-400"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Your Rank */}
      {userRank && (
        <div className="mt-6 pt-4 border-t border-neutral-800">
          <div className="text-neutral-500 text-xs mb-2">내 순위</div>
          <div className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-violet-500 text-white flex items-center justify-center font-bold">
                {userRank.rank}
              </div>
              <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center text-xl">
                {userRank.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{userRank.username}</span>
                  <span className="text-sm">{tierIcons[userRank.tier]}</span>
                </div>
                <div className="text-neutral-500 text-xs">
                  승률 {(userRank.winRate * 100).toFixed(0)}% · {userRank.totalTrades}회 거래
                </div>
              </div>
              <div className="text-right">
                <div className="text-emerald-400 font-bold">
                  +{(userRank.totalReturn * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ============================================================
// ASSET LIST
// ============================================================
export function AssetList() {
  const [assets, setAssets] = useState<PortfolioAsset[]>([]);

  useEffect(() => {
    const data = getPortfolioData();
    setAssets(data.assets);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-[#171717] rounded-2xl p-6 border border-neutral-800"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <span className="text-xl">📋</span>
        </div>
        <div>
          <h3 className="text-white font-medium">My Assets</h3>
          <p className="text-neutral-500 text-sm">보유 자산 목록</p>
        </div>
      </div>

      <div className="space-y-3">
        {assets.map((asset, index) => (
          <motion.div
            key={asset.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-neutral-800/50 rounded-xl p-4 hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${asset.color}20` }}
              >
                {asset.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{asset.name}</span>
                  <span className="text-neutral-500 text-sm">{asset.symbol}</span>
                </div>
                <div className="text-neutral-500 text-sm">
                  {asset.amount.toLocaleString()} {asset.type === 'KAUS' || asset.type === 'STAKING' ? 'KAUS' : asset.type === 'ENERGY' ? 'kWh' : '주'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-medium">
                  ₩{asset.value.toLocaleString()}
                </div>
                <div
                  className={`text-sm ${
                    asset.pnlPercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {asset.pnlPercent >= 0 ? '+' : ''}
                  {asset.pnlPercent.toFixed(2)}%
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
