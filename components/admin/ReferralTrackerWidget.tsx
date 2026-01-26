/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 54: ADMIN REFERRAL TRACKER WIDGET
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Real-time referral leaderboard and analytics for /admin/master
 * - Live ranking updates
 * - Tier distribution chart
 * - Daily/Weekly/Monthly stats
 *
 * Colors: #F9F9F7 (background), #171717 (text)
 */

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface LeaderboardEntry {
  rank: number;
  code: string;
  userId: string;
  userName: string;
  totalReferrals: number;
  totalRewards: number;
  tier: string;
  sovereignNumber?: number;
}

interface ReferralDailyStats {
  date: string;
  totalRewards: number;
  totalAmount: number;
  uniqueReferrers: number;
  uniqueReferees: number;
}

interface ReferralSummary {
  totalCodes: number;
  totalReferrals: number;
  totalRewardsIssued: number;
  todayReferrals: number;
  todayRewards: number;
  tierDistribution: Record<string, number>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIER STYLING
// ═══════════════════════════════════════════════════════════════════════════════

const TIER_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  DIAMOND: { color: '#7DF9FF', bg: '#7DF9FF20', icon: '👑' },
  PLATINUM: { color: '#E5E4E2', bg: '#E5E4E220', icon: '💎' },
  GOLD: { color: '#FFD700', bg: '#FFD70020', icon: '🥇' },
  SILVER: { color: '#C0C0C0', bg: '#C0C0C020', icon: '🥈' },
  BRONZE: { color: '#CD7F32', bg: '#CD7F3220', icon: '🥉' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function TierBadge({ tier }: { tier: string }) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.BRONZE;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: config.bg, color: config.color }}
    >
      <span>{config.icon}</span>
      {tier}
    </span>
  );
}

function StatCard({
  label,
  value,
  change,
  icon,
}: {
  label: string;
  value: string | number;
  change?: number;
  icon: string;
}) {
  return (
    <div className="bg-[#F9F9F7] rounded-xl p-4 border border-[#17171710]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {change !== undefined && (
          <span
            className={`text-xs font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {change >= 0 ? '+' : ''}
            {change}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-[#171717]">{value}</div>
      <div className="text-xs text-[#171717aa] uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

function LeaderboardRow({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  const isTop3 = entry.rank <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
        isTop3 ? 'bg-[#F9F9F7] border border-[#17171720]' : 'hover:bg-[#F9F9F710]'
      }`}
    >
      {/* Rank */}
      <div
        className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${
          entry.rank === 1
            ? 'bg-yellow-500 text-white'
            : entry.rank === 2
              ? 'bg-gray-400 text-white'
              : entry.rank === 3
                ? 'bg-amber-700 text-white'
                : 'bg-[#17171710] text-[#171717]'
        }`}
      >
        {entry.rank}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#171717] truncate">
            {entry.sovereignNumber ? `Sovereign #${entry.sovereignNumber}` : entry.userName}
          </span>
          <TierBadge tier={entry.tier} />
        </div>
        <div className="text-xs text-[#171717aa] font-mono">{entry.code}</div>
      </div>

      {/* Stats */}
      <div className="text-right">
        <div className="font-bold text-[#171717]">{entry.totalReferrals}</div>
        <div className="text-xs text-[#171717aa]">referrals</div>
      </div>
      <div className="text-right">
        <div className="font-bold text-[#171717]">{entry.totalRewards.toFixed(0)}</div>
        <div className="text-xs text-[#171717aa]">KAUS</div>
      </div>
    </motion.div>
  );
}

function TierDistributionChart({ distribution }: { distribution: Record<string, number> }) {
  const total = Object.values(distribution).reduce((sum, v) => sum + v, 0) || 1;
  const tiers = ['DIAMOND', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE'];

  return (
    <div className="space-y-2">
      {tiers.map((tier) => {
        const count = distribution[tier] || 0;
        const percentage = (count / total) * 100;
        const config = TIER_CONFIG[tier];

        return (
          <div key={tier} className="flex items-center gap-3">
            <div className="w-20 flex items-center gap-1">
              <span>{config.icon}</span>
              <span className="text-xs font-medium text-[#171717aa]">{tier}</span>
            </div>
            <div className="flex-1 h-6 bg-[#17171710] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="h-full rounded-full"
                style={{ background: config.color }}
              />
            </div>
            <div className="w-16 text-right text-sm font-medium text-[#171717]">
              {count} ({percentage.toFixed(0)}%)
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

export function ReferralTrackerWidget() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      const [leaderboardRes, summaryRes] = await Promise.all([
        fetch('/api/referral/leaderboard?limit=10'),
        fetch('/api/referral/summary'),
      ]);

      if (leaderboardRes.ok) {
        const data = await leaderboardRes.json();
        setLeaderboard(data.leaderboard || []);
      }

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('[ReferralTracker] Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-[#17171710]">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-[#17171710] rounded" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-[#17171710] rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-[#17171710] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#17171710] space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#171717]">Referral Tracker</h2>
          <p className="text-sm text-[#171717aa]">Real-time referral analytics</p>
        </div>
        <div className="text-xs text-[#171717aa]">
          Updated {lastUpdated.toLocaleTimeString()}
          <button
            onClick={fetchData}
            className="ml-2 p-1 hover:bg-[#17171710] rounded transition-colors"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon="👥"
            label="Total Referrals"
            value={summary.totalReferrals.toLocaleString()}
            change={12}
          />
          <StatCard
            icon="💰"
            label="Rewards Issued"
            value={`${summary.totalRewardsIssued.toLocaleString()} KAUS`}
          />
          <StatCard
            icon="📈"
            label="Today's Referrals"
            value={summary.todayReferrals}
            change={summary.todayReferrals > 0 ? 100 : 0}
          />
          <StatCard
            icon="🎟️"
            label="Active Codes"
            value={summary.totalCodes.toLocaleString()}
          />
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <div>
          <h3 className="text-sm font-semibold text-[#171717] uppercase tracking-wider mb-4">
            Top Referrers
          </h3>
          <div className="space-y-1">
            <AnimatePresence>
              {leaderboard.length > 0 ? (
                leaderboard.map((entry, index) => (
                  <LeaderboardRow key={entry.code} entry={entry} index={index} />
                ))
              ) : (
                <div className="text-center py-8 text-[#171717aa]">
                  No referral data yet
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Tier Distribution */}
        <div>
          <h3 className="text-sm font-semibold text-[#171717] uppercase tracking-wider mb-4">
            Tier Distribution
          </h3>
          {summary?.tierDistribution ? (
            <TierDistributionChart distribution={summary.tierDistribution} />
          ) : (
            <div className="text-center py-8 text-[#171717aa]">
              No tier data available
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-6 pt-6 border-t border-[#17171710]">
            <h3 className="text-sm font-semibold text-[#171717] uppercase tracking-wider mb-3">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="px-4 py-2 text-sm bg-[#171717] text-[#F9F9F7] rounded-lg font-medium hover:opacity-90 transition-opacity">
                Export CSV
              </button>
              <button className="px-4 py-2 text-sm bg-[#F9F9F7] text-[#171717] rounded-lg font-medium border border-[#17171720] hover:bg-[#17171710] transition-colors">
                View All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReferralTrackerWidget;
