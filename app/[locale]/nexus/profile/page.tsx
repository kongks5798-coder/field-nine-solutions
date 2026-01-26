'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 65: MOBILE-OPTIMIZED SOVEREIGN PROFILE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 모바일 반응형 + 실제 API 연동 + 스테이킹 + 알림 + 거래내역
 */

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FinancialSidebar, PriceTicker, MembershipBar } from '@/components/nexus/financial-terminal';
import { MobileBottomNav, MobileHeader } from '@/components/nexus/mobile-nav';
import { MyEnergyCertificates, EnergyStatsSummary } from '@/components/nexus/energy-mix-widget';
import { BankGradeSecurityBadge } from '@/components/nexus/commercial';
import { DividendWidget } from '@/components/nexus/land-investment';
import { StakingWidget } from '@/components/nexus/staking-widget';
import { NotificationCenter } from '@/components/nexus/notification-widget';
import {
  NotificationCenterPanel,
  AchievementShowcase,
  LevelProgressCard,
  ActivityTimelineWidget,
  StreakCounter,
  NotificationPreferencesPanel,
} from '@/components/nexus/notification-command-center';

type ProfileTab = 'overview' | 'wallet' | 'staking' | 'energy' | 'achievements' | 'referral' | 'settings';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface UserProfile {
  id: string;
  email: string;
  name: string;
  tier: 'BASIC' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'SOVEREIGN';
  kausBalance: number;
  totalEarnings: number;
  totalReferrals: number;
  pendingWithdrawals: number;
  createdAt: string;
}

interface Transaction {
  id: string;
  type: string;
  description: string;
  icon: string;
  amount: number;
  isPositive: boolean;
  createdAt: string;
  fiatValue: { KRW: number; USD: number };
}

// ═══════════════════════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const res = await fetch(`/api/user/profile?userId=${userId}`);
    const data = await res.json();
    return data.success ? data.profile : null;
  } catch {
    return null;
  }
}

async function fetchTransactions(userId: string): Promise<Transaction[]> {
  try {
    const res = await fetch(`/api/kaus/transactions?userId=${userId}&limit=10`);
    const data = await res.json();
    return data.success ? data.transactions : [];
  } catch {
    return [];
  }
}

async function fetchReferralStats(userId: string) {
  try {
    const res = await fetch(`/api/kaus/referral?action=stats&userId=${userId}`);
    const data = await res.json();
    return data.success ? data.stats : null;
  } catch {
    return null;
  }
}

async function generateReferralCode(userId: string): Promise<string | null> {
  try {
    const res = await fetch('/api/kaus/referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generate', userId }),
    });
    const data = await res.json();
    return data.success ? data.referralCode : null;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE CONTENT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function ProfileContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as ProfileTab | null;

  const [activeTab, setActiveTab] = useState<ProfileTab>(tabParam || 'overview');
  const [userId] = useState('demo-user-001');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralStats, setReferralStats] = useState<{
    totalReferrals: number;
    totalEarnings: number;
    pendingBonuses: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Update tab when URL changes
  useEffect(() => {
    if (tabParam && ['overview', 'wallet', 'staking', 'energy', 'achievements', 'referral', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Mock profile for demo
  const mockProfile: UserProfile = {
    id: userId,
    email: 'sovereign@fieldnine.io',
    name: 'Sovereign User',
    tier: 'PLATINUM',
    kausBalance: 5000,
    totalEarnings: 125000,
    totalReferrals: 12,
    pendingWithdrawals: 0,
    createdAt: '2026-01-01',
  };

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [profileData, txData, refStats] = await Promise.all([
      fetchUserProfile(userId),
      fetchTransactions(userId),
      fetchReferralStats(userId),
    ]);

    setProfile(profileData || mockProfile);
    setTransactions(txData.length > 0 ? txData : getMockTransactions());
    setReferralStats(refStats || { totalReferrals: 12, totalEarnings: 1200, pendingBonuses: 0 });

    // Generate referral code
    const code = await generateReferralCode(userId);
    setReferralCode(code || `F9-SOVR-${Date.now().toString(36).toUpperCase()}`);

    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Mock transactions
  function getMockTransactions(): Transaction[] {
    return [
      {
        id: 'tx-001',
        type: 'PURCHASE',
        description: 'KAUS 구매',
        icon: '💳',
        amount: 1000,
        isPositive: true,
        createdAt: new Date().toISOString(),
        fiatValue: { KRW: 120000, USD: 90 },
      },
      {
        id: 'tx-002',
        type: 'STAKING_REWARD',
        description: '스테이킹 보상',
        icon: '📈',
        amount: 12.5,
        isPositive: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        fiatValue: { KRW: 1500, USD: 1.125 },
      },
      {
        id: 'tx-003',
        type: 'REFERRAL_BONUS',
        description: '추천인 보너스',
        icon: '🎁',
        amount: 100,
        isPositive: true,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        fiatValue: { KRW: 12000, USD: 9 },
      },
    ];
  }

  const copyReferral = async () => {
    const link = `https://m.fieldnine.io/join?ref=${referralCode}`;
    await navigator.clipboard.writeText(link);
    alert('추천 링크가 복사되었습니다!');
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);
    if (hours < 1) return '방금 전';
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  const currentProfile = profile || mockProfile;

  const tabs = [
    { id: 'overview', label: 'Overview', shortLabel: '개요', icon: '👤' },
    { id: 'wallet', label: 'Wallet', shortLabel: '지갑', icon: '💰' },
    { id: 'staking', label: 'Staking', shortLabel: '스테이킹', icon: '📈' },
    { id: 'energy', label: 'My Energy', shortLabel: '에너지', icon: '⚡' },
    { id: 'achievements', label: 'Achievements', shortLabel: '업적', icon: '🏆' },
    { id: 'referral', label: 'Referral', shortLabel: '추천', icon: '🔗' },
    { id: 'settings', label: 'Settings', shortLabel: '설정', icon: '⚙️' },
  ];

  const tierColors = {
    BASIC: 'from-gray-400 to-gray-500',
    SILVER: 'from-gray-300 to-gray-400',
    GOLD: 'from-yellow-400 to-orange-400',
    PLATINUM: 'from-amber-400 to-orange-500',
    SOVEREIGN: 'from-purple-400 to-pink-500',
  };

  return (
    <>
      {/* Profile Header with Notification */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#171717] to-[#2a2a2a] rounded-2xl p-4 md:p-8 text-white mb-4 md:mb-6 relative"
      >
        {/* Notification Bell - Desktop */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 hidden md:block">
          <NotificationCenter userId={userId} />
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className={`w-14 h-14 md:w-20 md:h-20 bg-gradient-to-br ${tierColors[currentProfile.tier]} rounded-xl md:rounded-2xl flex items-center justify-center`}>
            <span className="text-2xl md:text-4xl">👑</span>
          </div>
          <div className="flex-1">
            <h1 className="text-lg md:text-2xl font-bold">{currentProfile.name}</h1>
            <div className="flex items-center gap-2 mt-1 md:mt-2">
              <span className={`px-2 md:px-3 py-0.5 md:py-1 bg-gradient-to-r ${tierColors[currentProfile.tier]} rounded-full text-[10px] md:text-xs font-bold`}>
                {currentProfile.tier}
              </span>
              <span className="text-white/40 text-xs md:text-sm hidden md:inline">
                Since {new Date(currentProfile.createdAt).getFullYear()}
              </span>
            </div>
            <p className="text-white/50 text-xs md:text-sm mt-1 truncate">{currentProfile.email}</p>
          </div>
          {/* Mobile Notification */}
          <div className="md:hidden">
            <NotificationCenter userId={userId} />
          </div>
        </div>

        {/* Stats Grid - Responsive */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mt-4 md:mt-8">
          <div className="bg-white/5 rounded-xl p-3 md:p-4 text-center">
            <div className="text-lg md:text-2xl font-bold text-amber-400">
              {currentProfile.kausBalance.toLocaleString()}
            </div>
            <div className="text-[10px] md:text-xs text-white/50 mt-0.5 md:mt-1">KAUS</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 md:p-4 text-center">
            <div className="text-lg md:text-2xl font-bold text-emerald-400">
              ₩{(currentProfile.totalEarnings / 1000).toFixed(0)}K
            </div>
            <div className="text-[10px] md:text-xs text-white/50 mt-0.5 md:mt-1">Earnings</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 md:p-4 text-center">
            <div className="text-lg md:text-2xl font-bold text-cyan-400">
              {referralStats?.totalReferrals || 0}
            </div>
            <div className="text-[10px] md:text-xs text-white/50 mt-0.5 md:mt-1">Referrals</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 md:p-4 text-center">
            <div className="text-lg md:text-2xl font-bold text-purple-400">
              {currentProfile.pendingWithdrawals > 0 ? currentProfile.pendingWithdrawals : '0'}
            </div>
            <div className="text-[10px] md:text-xs text-white/50 mt-0.5 md:mt-1">Pending</div>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation - Scrollable on Mobile */}
      <div className="flex gap-2 mb-4 md:mb-6 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        {tabs.map(tab => (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab.id as ProfileTab)}
            className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-xl font-bold transition-all whitespace-nowrap text-sm md:text-base ${
              activeTab === tab.id
                ? 'bg-[#171717] text-white'
                : 'bg-white border border-[#171717]/10 text-[#171717] hover:border-[#171717]/30'
            }`}
          >
            <span className="text-base md:text-lg">{tab.icon}</span>
            <span className="md:hidden">{tab.shortLabel}</span>
            <span className="hidden md:inline">{tab.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="text-4xl inline-block"
          >
            ⏳
          </motion.div>
        </div>
      )}

      {/* Tab Content */}
      {!isLoading && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-4 md:space-y-6">
                {/* Membership Benefits */}
                <div className={`bg-gradient-to-br ${
                  currentProfile.tier === 'PLATINUM' || currentProfile.tier === 'SOVEREIGN'
                    ? 'from-amber-50 to-orange-50 border-amber-300'
                    : 'from-gray-50 to-gray-100 border-gray-300'
                } rounded-2xl p-4 md:p-6 border-2`}>
                  <h2 className="text-base md:text-lg font-bold text-[#171717] mb-3 md:mb-4">{currentProfile.tier} Benefits</h2>
                  <div className="grid grid-cols-2 gap-2 md:gap-4">
                    {[
                      { icon: '⚡', text: '에너지 구매 할인' },
                      { icon: '📊', text: '영동 발전소 데이터' },
                      { icon: '🔮', text: 'Prophet AI 분석' },
                      { icon: '🎯', text: 'Early Bird 참여' },
                      { icon: '📜', text: '원산지 증명서' },
                      { icon: '🌍', text: 'RE100 인증' },
                    ].map((benefit, i) => (
                      <div key={i} className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-white rounded-xl">
                        <span className="text-lg md:text-xl">{benefit.icon}</span>
                        <span className="text-xs md:text-sm text-[#171717]">{benefit.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions - Responsive Grid */}
                <div className="grid grid-cols-3 gap-2 md:gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab('staking')}
                    className="p-3 md:p-4 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl text-white"
                  >
                    <div className="text-2xl md:text-3xl mb-1 md:mb-2">📈</div>
                    <div className="font-bold text-xs md:text-base">Staking</div>
                    <div className="text-[10px] md:text-xs text-white/70 hidden md:block">Up to 25% APY</div>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab('energy')}
                    className="p-3 md:p-4 bg-white rounded-xl border border-[#171717]/10"
                  >
                    <div className="text-2xl md:text-3xl mb-1 md:mb-2">📜</div>
                    <div className="font-bold text-xs md:text-base text-[#171717]">Certificates</div>
                    <div className="text-[10px] md:text-xs text-[#171717]/50 hidden md:block">Energy Origin</div>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab('referral')}
                    className="p-3 md:p-4 bg-white rounded-xl border border-[#171717]/10"
                  >
                    <div className="text-2xl md:text-3xl mb-1 md:mb-2">🔗</div>
                    <div className="font-bold text-xs md:text-base text-[#171717]">Referral</div>
                    <div className="text-[10px] md:text-xs text-[#171717]/50 hidden md:block">100 KAUS</div>
                  </motion.button>
                </div>

                {/* Recent Transactions */}
                <div className="bg-white rounded-2xl p-4 md:p-6 border border-[#171717]/10">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <h3 className="font-bold text-[#171717] text-sm md:text-base">Recent Transactions</h3>
                    <button
                      onClick={() => setActiveTab('wallet')}
                      className="text-xs md:text-sm text-cyan-600 hover:underline"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    {transactions.slice(0, 3).map(tx => (
                      <div key={tx.id} className="flex items-center justify-between p-2 md:p-3 bg-[#171717]/5 rounded-xl">
                        <div className="flex items-center gap-2 md:gap-3">
                          <span className="text-xl md:text-2xl">{tx.icon}</span>
                          <div>
                            <div className="font-bold text-xs md:text-sm">{tx.description}</div>
                            <div className="text-[10px] md:text-xs text-[#171717]/50">{formatTimeAgo(tx.createdAt)}</div>
                          </div>
                        </div>
                        <div className={`font-bold text-xs md:text-sm ${tx.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                          {tx.isPositive ? '+' : '-'}{tx.amount.toLocaleString()} KAUS
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Wallet Tab */}
            {activeTab === 'wallet' && (
              <div className="space-y-4 md:space-y-6">
                {/* Balance Overview */}
                <div className="bg-gradient-to-br from-emerald-900 to-cyan-900 rounded-2xl p-4 md:p-6 text-white">
                  <h2 className="text-base md:text-lg font-bold mb-3 md:mb-4">Your Balance</h2>
                  <div className="grid grid-cols-3 gap-2 md:gap-4">
                    <div className="bg-white/10 rounded-xl p-3 md:p-4 text-center">
                      <div className="text-xl md:text-3xl font-black text-amber-400">
                        {currentProfile.kausBalance.toLocaleString()}
                      </div>
                      <div className="text-[10px] md:text-xs text-white/50 mt-0.5 md:mt-1">KAUS</div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 md:p-4 text-center">
                      <div className="text-xl md:text-3xl font-black text-emerald-400">
                        ${(currentProfile.kausBalance * 0.09).toLocaleString()}
                      </div>
                      <div className="text-[10px] md:text-xs text-white/50 mt-0.5 md:mt-1">USD</div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 md:p-4 text-center">
                      <div className="text-xl md:text-3xl font-black text-cyan-400">
                        ₩{(currentProfile.kausBalance * 120).toLocaleString()}
                      </div>
                      <div className="text-[10px] md:text-xs text-white/50 mt-0.5 md:mt-1">KRW</div>
                    </div>
                  </div>
                </div>

                {/* Expected Dividends */}
                <DividendWidget tilesOwned={5} />

                {/* Transaction History */}
                <div className="bg-white rounded-2xl p-4 md:p-6 border border-[#171717]/10">
                  <h3 className="font-bold text-[#171717] mb-3 md:mb-4 text-sm md:text-base">Transaction History</h3>
                  <div className="space-y-2 md:space-y-3">
                    {transactions.map(tx => (
                      <div key={tx.id} className="flex items-center justify-between p-3 md:p-4 bg-[#171717]/5 rounded-xl">
                        <div className="flex items-center gap-2 md:gap-3">
                          <span className="text-xl md:text-2xl">{tx.icon}</span>
                          <div>
                            <div className="font-bold text-xs md:text-base">{tx.description}</div>
                            <div className="text-[10px] md:text-xs text-[#171717]/50">{formatTimeAgo(tx.createdAt)}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold text-xs md:text-base ${tx.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                            {tx.isPositive ? '+' : '-'}{tx.amount.toLocaleString()} KAUS
                          </div>
                          <div className="text-[10px] md:text-xs text-[#171717]/50">
                            ₩{tx.fiatValue.KRW.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Security Badge */}
                <BankGradeSecurityBadge variant="compact" />
              </div>
            )}

            {/* Staking Tab */}
            {activeTab === 'staking' && (
              <StakingWidget
                userId={userId}
                userBalance={currentProfile.kausBalance}
                onBalanceChange={loadData}
              />
            )}

            {/* My Energy Tab */}
            {activeTab === 'energy' && (
              <div className="space-y-4 md:space-y-6">
                <EnergyStatsSummary />
                <div className="bg-white rounded-2xl p-4 md:p-6 border border-[#171717]/10">
                  <MyEnergyCertificates />
                </div>
              </div>
            )}

            {/* Achievements Tab */}
            {activeTab === 'achievements' && (
              <div className="space-y-4 md:space-y-6">
                {/* Level & Streak Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <LevelProgressCard />
                  <StreakCounter />
                </div>

                {/* Achievement Showcase */}
                <AchievementShowcase />

                {/* Activity Timeline */}
                <ActivityTimelineWidget />

                {/* Notification Preferences */}
                <NotificationPreferencesPanel />
              </div>
            )}

            {/* Referral Tab */}
            {activeTab === 'referral' && (
              <div className="space-y-4 md:space-y-6">
                <div className="bg-white rounded-2xl p-4 md:p-6 border border-[#171717]/10">
                  <h2 className="text-base md:text-lg font-bold text-[#171717] mb-3 md:mb-4">Empire Referral Link</h2>
                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3">
                    <div className="flex-1 p-3 bg-[#171717]/5 rounded-xl overflow-hidden">
                      <code className="text-xs md:text-sm text-[#171717]/80 break-all">
                        https://m.fieldnine.io/join?ref={referralCode}
                      </code>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={copyReferral}
                      className="px-6 py-3 bg-[#171717] text-white rounded-xl font-bold text-sm md:text-base"
                    >
                      Copy Link
                    </motion.button>
                  </div>
                  <p className="text-xs md:text-sm text-[#171717]/60 mt-3">
                    추천 시 양측 모두 <span className="font-bold text-amber-600">100 KAUS</span> 즉시 지급
                  </p>
                </div>

                {/* Referral Stats */}
                <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-2xl p-4 md:p-6 border border-emerald-200">
                  <h3 className="font-bold text-[#171717] mb-3 md:mb-4 text-sm md:text-base">Referral Stats</h3>
                  <div className="grid grid-cols-3 gap-2 md:gap-4">
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-black text-emerald-600">
                        {referralStats?.totalReferrals || 0}
                      </div>
                      <div className="text-[10px] md:text-xs text-[#171717]/50">Referrals</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-black text-amber-600">
                        {referralStats?.totalEarnings || 0}
                      </div>
                      <div className="text-[10px] md:text-xs text-[#171717]/50">Earned</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-black text-cyan-600">
                        {referralStats?.pendingBonuses || 0}
                      </div>
                      <div className="text-[10px] md:text-xs text-[#171717]/50">Pending</div>
                    </div>
                  </div>
                </div>

                {/* Referral Benefits */}
                <div className="bg-white rounded-2xl p-4 md:p-6 border border-[#171717]/10">
                  <h3 className="font-bold text-[#171717] mb-3 md:mb-4 text-sm md:text-base">Referral Benefits</h3>
                  <div className="space-y-2 md:space-y-3">
                    <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-emerald-50 rounded-xl">
                      <span className="text-lg md:text-xl">🎁</span>
                      <div>
                        <div className="font-bold text-emerald-700 text-xs md:text-base">가입 보너스</div>
                        <div className="text-[10px] md:text-sm text-emerald-600">추천인/피추천인 각 100 KAUS</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-amber-50 rounded-xl">
                      <span className="text-lg md:text-xl">💰</span>
                      <div>
                        <div className="font-bold text-amber-700 text-xs md:text-base">구매 보너스</div>
                        <div className="text-[10px] md:text-sm text-amber-600">첫 구매 금액의 10% 추가</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-purple-50 rounded-xl">
                      <span className="text-lg md:text-xl">👑</span>
                      <div>
                        <div className="font-bold text-purple-700 text-xs md:text-base">무제한 추천</div>
                        <div className="text-[10px] md:text-sm text-purple-600">추천 횟수 제한 없음</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-4 md:space-y-6">
                <div className="bg-white rounded-2xl p-4 md:p-6 border border-[#171717]/10">
                  <h2 className="text-base md:text-lg font-bold text-[#171717] mb-3 md:mb-4">Account Settings</h2>
                  <div className="space-y-2 md:space-y-4">
                    {[
                      { title: 'Email Notifications', desc: 'Receive trading alerts', enabled: true },
                      { title: 'Push Notifications', desc: 'Real-time updates', enabled: true },
                      { title: 'Two-Factor Auth', desc: 'Enhanced security', enabled: true },
                      { title: 'API Access', desc: 'Developer mode', enabled: false },
                    ].map((setting, i) => (
                      <div key={i} className="flex items-center justify-between p-3 md:p-4 bg-[#171717]/5 rounded-xl">
                        <div>
                          <div className="font-bold text-xs md:text-base">{setting.title}</div>
                          <div className="text-[10px] md:text-sm text-[#171717]/50">{setting.desc}</div>
                        </div>
                        <div className={`w-10 md:w-12 h-5 md:h-6 ${setting.enabled ? 'bg-emerald-500' : 'bg-[#171717]/20'} rounded-full relative cursor-pointer`}>
                          <div className={`absolute ${setting.enabled ? 'right-1' : 'left-1'} top-1 w-3 md:w-4 h-3 md:h-4 bg-white rounded-full`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Security */}
                <div className="bg-white rounded-2xl p-4 md:p-6 border border-[#171717]/10">
                  <h3 className="font-bold text-[#171717] mb-3 md:mb-4 text-sm md:text-base">Security</h3>
                  <div className="space-y-2 md:space-y-3">
                    <button className="w-full flex items-center justify-between p-3 md:p-4 bg-[#171717]/5 rounded-xl hover:bg-[#171717]/10 transition-colors">
                      <div className="flex items-center gap-2 md:gap-3">
                        <span className="text-lg md:text-xl">🔐</span>
                        <span className="font-bold text-xs md:text-base">Change Password</span>
                      </div>
                      <span className="text-[#171717]/40">→</span>
                    </button>
                    <button className="w-full flex items-center justify-between p-3 md:p-4 bg-[#171717]/5 rounded-xl hover:bg-[#171717]/10 transition-colors">
                      <div className="flex items-center gap-2 md:gap-3">
                        <span className="text-lg md:text-xl">📱</span>
                        <span className="font-bold text-xs md:text-base">Manage Devices</span>
                      </div>
                      <span className="text-[#171717]/40">→</span>
                    </button>
                    <button className="w-full flex items-center justify-between p-3 md:p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                      <div className="flex items-center gap-2 md:gap-3">
                        <span className="text-lg md:text-xl">🚪</span>
                        <span className="font-bold text-red-600 text-xs md:text-base">Log Out</span>
                      </div>
                      <span className="text-red-400">→</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      {/* Desktop: Financial Terminal Sidebar */}
      <div className="hidden md:block">
        <FinancialSidebar />
      </div>

      {/* Mobile: Header */}
      <div className="md:hidden">
        <MobileHeader title="My Profile" />
      </div>

      <div className="md:ml-56">
        {/* Desktop Only */}
        <div className="hidden md:block">
          <PriceTicker />
          <MembershipBar />
        </div>

        <main className="p-4 md:p-6 pb-24 md:pb-6">
          <div className="max-w-5xl mx-auto">
            <Suspense fallback={
              <div className="text-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="text-4xl inline-block"
                >
                  ⏳
                </motion.div>
              </div>
            }>
              <ProfileContent />
            </Suspense>
          </div>
        </main>
      </div>

      {/* Mobile: Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
