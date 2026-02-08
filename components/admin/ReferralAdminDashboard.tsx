/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 56: REFERRAL ADMIN DASHBOARD
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Tesla-style admin dashboard for referral program management
 * - Real-time stats
 * - Fraud detection
 * - Campaign management
 * - User management
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// Types
// ============================================

interface GlobalStats {
  totalReferrals: number;
  activeReferrals: number;
  totalRewardsDistributed: number;
  pendingRewards: number;
  fraudulentCount: number;
  conversionRate: number;
  averageReferralsPerUser: number;
  topTier: string;
}

interface FraudReport {
  fraudulentReferrals: Array<{
    id: string;
    referrer_id: string;
    referee_id: string;
    status: string;
    created_at: string;
    referrer?: { full_name: string; email: string };
    referee?: { full_name: string; email: string; created_at: string };
  }>;
  suspiciousReferrers: Array<{ userId: string; referralsIn24h: number }>;
  totalFraudulent: number;
  totalHighVelocity: number;
}

interface Campaign {
  id: string;
  name: string;
  name_ko: string;
  description: string;
  description_ko: string;
  bonus_multiplier: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

interface TopReferrer {
  userId: string;
  fullName: string;
  avatarUrl?: string;
  totalReferrals: number;
  totalEarnings: number;
  tier: string;
}

// ============================================
// Component
// ============================================

export default function ReferralAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'fraud' | 'campaigns' | 'users'>('overview');
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [fraudReport, setFraudReport] = useState<FraudReport | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Campaign form state
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    nameKo: '',
    description: '',
    descriptionKo: '',
    bonusMultiplier: 1.5,
    startDate: '',
    endDate: '',
  });

  // ============================================
  // Data Fetching
  // ============================================

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/referral?action=stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  const fetchFraudReport = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/referral?action=fraud-report');
      const data = await res.json();
      if (data.success) {
        setFraudReport(data.report);
      }
    } catch (err) {
      console.error('Failed to fetch fraud report:', err);
    }
  }, []);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/referral?action=campaigns');
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    }
  }, []);

  const fetchTopReferrers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/referral?action=top-referrers&limit=20');
      const data = await res.json();
      if (data.success) {
        setTopReferrers(data.referrers);
      }
    } catch (err) {
      console.error('Failed to fetch top referrers:', err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([
          fetchStats(),
          fetchFraudReport(),
          fetchCampaigns(),
          fetchTopReferrers(),
        ]);
      } catch {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchFraudReport, fetchCampaigns, fetchTopReferrers]);

  // ============================================
  // Actions
  // ============================================

  const markFraudulent = async (relationId: string) => {
    try {
      const res = await fetch('/api/admin/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-fraudulent', relationId, reason: 'Admin review' }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchFraudReport();
        await fetchStats();
      }
    } catch (err) {
      console.error('Failed to mark fraudulent:', err);
    }
  };

  const toggleCampaign = async (campaignId: string, isActive: boolean) => {
    try {
      const res = await fetch('/api/admin/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-campaign', campaignId, isActive }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchCampaigns();
      }
    } catch (err) {
      console.error('Failed to toggle campaign:', err);
    }
  };

  const createCampaign = async () => {
    try {
      const res = await fetch('/api/admin/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-campaign',
          ...newCampaign,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCampaignForm(false);
        setNewCampaign({
          name: '',
          nameKo: '',
          description: '',
          descriptionKo: '',
          bonusMultiplier: 1.5,
          startDate: '',
          endDate: '',
        });
        await fetchCampaigns();
      }
    } catch (err) {
      console.error('Failed to create campaign:', err);
    }
  };

  // ============================================
  // Render
  // ============================================

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-[#171717] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-[#171717]">
      {/* Header */}
      <header className="border-b border-[#171717]/10 px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light tracking-tight">Referral Admin</h1>
            <p className="text-sm text-[#171717]/60 mt-1">PHASE 56 Production Dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-[#171717]/60">Live</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="border-b border-[#171717]/10 px-8">
        <div className="max-w-7xl mx-auto flex gap-8">
          {(['overview', 'fraud', 'campaigns', 'users'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 text-sm font-medium transition-all duration-300 border-b-2 ${
                activeTab === tab
                  ? 'border-[#171717] text-[#171717]'
                  : 'border-transparent text-[#171717]/40 hover:text-[#171717]/60'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-6">
                <StatCard
                  label="Total Referrals"
                  value={stats.totalReferrals.toLocaleString()}
                  sublabel={`${stats.activeReferrals} active`}
                />
                <StatCard
                  label="Rewards Distributed"
                  value={`${stats.totalRewardsDistributed.toLocaleString()} KAUS`}
                  sublabel={`${stats.pendingRewards} pending`}
                />
                <StatCard
                  label="Conversion Rate"
                  value={`${stats.conversionRate.toFixed(1)}%`}
                  sublabel={`${stats.averageReferralsPerUser.toFixed(1)} avg/user`}
                />
                <StatCard
                  label="Fraud Detected"
                  value={stats.fraudulentCount.toString()}
                  sublabel="flagged referrals"
                  alert={stats.fraudulentCount > 0}
                />
              </div>

              {/* Top Referrers */}
              <div className="bg-white rounded-lg border border-[#171717]/10 p-6">
                <h2 className="text-lg font-medium mb-4">Top Referrers</h2>
                <div className="space-y-3">
                  {topReferrers.slice(0, 10).map((referrer, idx) => (
                    <div
                      key={referrer.userId}
                      className="flex items-center justify-between py-3 border-b border-[#171717]/5 last:border-0"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-[#171717]/40 w-6">{idx + 1}</span>
                        <div>
                          <p className="font-medium">{referrer.fullName || 'Anonymous'}</p>
                          <p className="text-xs text-[#171717]/40">{referrer.tier}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{referrer.totalReferrals} referrals</p>
                        <p className="text-xs text-[#171717]/40">{referrer.totalEarnings} KAUS earned</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Fraud Tab */}
          {activeTab === 'fraud' && fraudReport && (
            <motion.div
              key="fraud"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Fraud Stats */}
              <div className="grid grid-cols-2 gap-6">
                <StatCard
                  label="Fraudulent Referrals"
                  value={fraudReport.totalFraudulent.toString()}
                  sublabel="flagged as fraudulent"
                  alert={fraudReport.totalFraudulent > 0}
                />
                <StatCard
                  label="High Velocity Users"
                  value={fraudReport.totalHighVelocity.toString()}
                  sublabel=">10 referrals in 24h"
                  alert={fraudReport.totalHighVelocity > 0}
                />
              </div>

              {/* Suspicious Activity */}
              {fraudReport.suspiciousReferrers.length > 0 && (
                <div className="bg-red-50 rounded-lg border border-red-200 p-6">
                  <h2 className="text-lg font-medium text-red-800 mb-4">⚠️ High Velocity Alert</h2>
                  <div className="space-y-3">
                    {fraudReport.suspiciousReferrers.map((user) => (
                      <div
                        key={user.userId}
                        className="flex items-center justify-between py-2 border-b border-red-200 last:border-0"
                      >
                        <span className="text-sm text-red-700">User: {user.userId.slice(0, 8)}...</span>
                        <span className="text-sm font-medium text-red-800">
                          {user.referralsIn24h} referrals in 24h
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fraudulent Referrals List */}
              <div className="bg-white rounded-lg border border-[#171717]/10 p-6">
                <h2 className="text-lg font-medium mb-4">Flagged Referrals</h2>
                {fraudReport.fraudulentReferrals.length === 0 ? (
                  <p className="text-sm text-[#171717]/40">No fraudulent referrals detected</p>
                ) : (
                  <div className="space-y-3">
                    {fraudReport.fraudulentReferrals.map((ref) => (
                      <div
                        key={ref.id}
                        className="flex items-center justify-between py-3 border-b border-[#171717]/5 last:border-0"
                      >
                        <div>
                          <p className="text-sm">
                            <span className="text-[#171717]/40">Referrer:</span>{' '}
                            {ref.referrer?.full_name || ref.referrer_id.slice(0, 8)}
                          </p>
                          <p className="text-sm">
                            <span className="text-[#171717]/40">Referee:</span>{' '}
                            {ref.referee?.full_name || ref.referee_id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-[#171717]/40">
                            {new Date(ref.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                          {ref.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <motion.div
              key="campaigns"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Create Campaign Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowCampaignForm(true)}
                  className="px-4 py-2 bg-[#171717] text-white text-sm rounded-lg hover:bg-[#171717]/80 transition-colors"
                >
                  + New Campaign
                </button>
              </div>

              {/* Campaign Form Modal */}
              {showCampaignForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-lg p-6 w-full max-w-md"
                  >
                    <h3 className="text-lg font-medium mb-4">Create Campaign</h3>
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Campaign Name"
                        value={newCampaign.name}
                        onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="캠페인 이름 (한국어)"
                        value={newCampaign.nameKo}
                        onChange={(e) => setNewCampaign({ ...newCampaign, nameKo: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                      <textarea
                        placeholder="Description"
                        value={newCampaign.description}
                        onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg"
                        rows={2}
                      />
                      <div className="flex gap-4">
                        <input
                          type="date"
                          value={newCampaign.startDate}
                          onChange={(e) => setNewCampaign({ ...newCampaign, startDate: e.target.value })}
                          className="flex-1 px-4 py-2 border rounded-lg"
                        />
                        <input
                          type="date"
                          value={newCampaign.endDate}
                          onChange={(e) => setNewCampaign({ ...newCampaign, endDate: e.target.value })}
                          className="flex-1 px-4 py-2 border rounded-lg"
                        />
                      </div>
                      <input
                        type="number"
                        placeholder="Bonus Multiplier (e.g., 1.5)"
                        value={newCampaign.bonusMultiplier}
                        onChange={(e) => setNewCampaign({ ...newCampaign, bonusMultiplier: parseFloat(e.target.value) })}
                        className="w-full px-4 py-2 border rounded-lg"
                        step="0.1"
                        min="1"
                      />
                      <div className="flex gap-3 justify-end">
                        <button
                          onClick={() => setShowCampaignForm(false)}
                          className="px-4 py-2 text-sm border rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={createCampaign}
                          className="px-4 py-2 bg-[#171717] text-white text-sm rounded-lg"
                        >
                          Create
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Campaigns List */}
              <div className="bg-white rounded-lg border border-[#171717]/10 p-6">
                <h2 className="text-lg font-medium mb-4">Active Campaigns</h2>
                {campaigns.length === 0 ? (
                  <p className="text-sm text-[#171717]/40">No campaigns created yet</p>
                ) : (
                  <div className="space-y-4">
                    {campaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        className="flex items-center justify-between p-4 border border-[#171717]/10 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-sm text-[#171717]/60">{campaign.name_ko}</p>
                          <p className="text-xs text-[#171717]/40 mt-1">
                            {new Date(campaign.start_date).toLocaleDateString()} -{' '}
                            {new Date(campaign.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium">
                            {campaign.bonus_multiplier}x bonus
                          </span>
                          <button
                            onClick={() => toggleCampaign(campaign.id, !campaign.is_active)}
                            className={`px-3 py-1 text-xs rounded-full ${
                              campaign.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {campaign.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="bg-white rounded-lg border border-[#171717]/10 p-6">
                <h2 className="text-lg font-medium mb-4">Top Referrers - Full List</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#171717]/10">
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#171717]/60">Rank</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#171717]/60">User</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#171717]/60">Tier</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-[#171717]/60">Referrals</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-[#171717]/60">Earnings</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-[#171717]/60">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topReferrers.map((referrer, idx) => (
                        <tr key={referrer.userId} className="border-b border-[#171717]/5 hover:bg-[#171717]/5">
                          <td className="py-3 px-4 text-sm">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <p className="text-sm font-medium">{referrer.fullName || 'Anonymous'}</p>
                            <p className="text-xs text-[#171717]/40">{referrer.userId.slice(0, 8)}...</p>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 text-xs bg-[#171717]/10 rounded">{referrer.tier}</span>
                          </td>
                          <td className="py-3 px-4 text-right text-sm">{referrer.totalReferrals}</td>
                          <td className="py-3 px-4 text-right text-sm">{referrer.totalEarnings} KAUS</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => markFraudulent(referrer.userId)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Flag
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

function StatCard({
  label,
  value,
  sublabel,
  alert = false,
}: {
  label: string;
  value: string;
  sublabel: string;
  alert?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-white rounded-lg border p-6 ${
        alert ? 'border-red-200 bg-red-50' : 'border-[#171717]/10'
      }`}
    >
      <p className="text-sm text-[#171717]/60 mb-1">{label}</p>
      <p className={`text-3xl font-light ${alert ? 'text-red-600' : 'text-[#171717]'}`}>{value}</p>
      <p className="text-xs text-[#171717]/40 mt-2">{sublabel}</p>
    </motion.div>
  );
}
