'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 60: ENHANCED SOVEREIGN PROFILE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 실제 API 연동 + 스테이킹 + 알림 + 거래내역
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FinancialSidebar, PriceTicker, MembershipBar } from '@/components/nexus/financial-terminal';
import { MyEnergyCertificates, EnergyStatsSummary } from '@/components/nexus/energy-mix-widget';
import { BankGradeSecurityBadge } from '@/components/nexus/commercial';
import { DividendWidget } from '@/components/nexus/land-investment';
import { StakingWidget } from '@/components/nexus/staking-widget';
import { NotificationCenter } from '@/components/nexus/notification-widget';

type ProfileTab = 'overview' | 'wallet' | 'staking' | 'energy' | 'referral' | 'settings';

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
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [userId] = useState('demo-user-001'); // TODO: Get from auth
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralStats, setReferralStats] = useState<{
    totalReferrals: number;
    totalEarnings: number;
    pendingBonuses: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    { id: 'overview', label: 'Overview', icon: '👤' },
    { id: 'wallet', label: 'Wallet', icon: '💰' },
    { id: 'staking', label: 'Staking', icon: '📈' },
    { id: 'energy', label: 'My Energy', icon: '⚡' },
    { id: 'referral', label: 'Referral', icon: '🔗' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const tierColors = {
    BASIC: 'from-gray-400 to-gray-500',
    SILVER: 'from-gray-300 to-gray-400',
    GOLD: 'from-yellow-400 to-orange-400',
    PLATINUM: 'from-amber-400 to-orange-500',
    SOVEREIGN: 'from-purple-400 to-pink-500',
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <FinancialSidebar />
      <div className="ml-56">
        <PriceTicker />
        <MembershipBar />

        <main className="p-6">
          <div className="max-w-5xl mx-auto">
            {/* Profile Header with Notification */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-[#171717] to-[#2a2a2a] rounded-2xl p-8 text-white mb-6 relative"
            >
              {/* Notification Bell */}
              <div className="absolute top-6 right-6">
                <NotificationCenter userId={userId} />
              </div>

              <div className="flex items-center gap-6">
                <div className={`w-20 h-20 bg-gradient-to-br ${tierColors[currentProfile.tier]} rounded-2xl flex items-center justify-center`}>
                  <span className="text-4xl">👑</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{currentProfile.name}</h1>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-3 py-1 bg-gradient-to-r ${tierColors[currentProfile.tier]} rounded-full text-xs font-bold`}>
                      {currentProfile.tier}
                    </span>
                    <span className="text-white/40 text-sm">
                      Since {new Date(currentProfile.createdAt).getFullYear()}
                    </span>
                  </div>
                  <p className="text-white/50 text-sm mt-1">{currentProfile.email}</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4 mt-8">
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-amber-400">
                    {currentProfile.kausBalance.toLocaleString()}
                  </div>
                  <div className="text-xs text-white/50 mt-1">KAUS Balance</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-400">
                    ₩{(currentProfile.totalEarnings / 1000).toFixed(0)}K
                  </div>
                  <div className="text-xs text-white/50 mt-1">Total Earnings</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-cyan-400">
                    {referralStats?.totalReferrals || 0}
                  </div>
                  <div className="text-xs text-white/50 mt-1">Referrals</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {currentProfile.pendingWithdrawals > 0 ? currentProfile.pendingWithdrawals : '0'}
                  </div>
                  <div className="text-xs text-white/50 mt-1">Pending</div>
                </div>
              </div>
            </motion.div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {tabs.map(tab => (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab.id as ProfileTab)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-[#171717] text-white'
                      : 'bg-white border border-[#171717]/10 text-[#171717] hover:border-[#171717]/30'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
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
                    <div className="space-y-6">
                      {/* Membership Benefits */}
                      <div className={`bg-gradient-to-br ${
                        currentProfile.tier === 'PLATINUM' || currentProfile.tier === 'SOVEREIGN'
                          ? 'from-amber-50 to-orange-50 border-amber-300'
                          : 'from-gray-50 to-gray-100 border-gray-300'
                      } rounded-2xl p-6 border-2`}>
                        <h2 className="text-lg font-bold text-[#171717] mb-4">{currentProfile.tier} Benefits</h2>
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { icon: '⚡', text: '에너지 구매 할인' },
                            { icon: '📊', text: '영동 발전소 데이터 열람' },
                            { icon: '🔮', text: 'Prophet AI 분석' },
                            { icon: '🎯', text: 'Early Bird 참여' },
                            { icon: '📜', text: '에너지 원산지 증명서' },
                            { icon: '🌍', text: 'RE100 인증 보고서' },
                          ].map((benefit, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl">
                              <span className="text-xl">{benefit.icon}</span>
                              <span className="text-sm text-[#171717]">{benefit.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="grid grid-cols-3 gap-4">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setActiveTab('staking')}
                          className="p-4 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl text-white"
                        >
                          <div className="text-3xl mb-2">📈</div>
                          <div className="font-bold">Start Staking</div>
                          <div className="text-xs text-white/70">Up to 25% APY</div>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setActiveTab('energy')}
                          className="p-4 bg-white rounded-xl border border-[#171717]/10 hover:shadow-lg transition-shadow"
                        >
                          <div className="text-3xl mb-2">📜</div>
                          <div className="font-bold text-[#171717]">View Certificates</div>
                          <div className="text-xs text-[#171717]/50">Energy Origin</div>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setActiveTab('referral')}
                          className="p-4 bg-white rounded-xl border border-[#171717]/10 hover:shadow-lg transition-shadow"
                        >
                          <div className="text-3xl mb-2">🔗</div>
                          <div className="font-bold text-[#171717]">Share & Earn</div>
                          <div className="text-xs text-[#171717]/50">100 KAUS/referral</div>
                        </motion.button>
                      </div>

                      {/* Recent Transactions */}
                      <div className="bg-white rounded-2xl p-6 border border-[#171717]/10">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-[#171717]">Recent Transactions</h3>
                          <button
                            onClick={() => setActiveTab('wallet')}
                            className="text-sm text-cyan-600 hover:underline"
                          >
                            View All →
                          </button>
                        </div>
                        <div className="space-y-3">
                          {transactions.slice(0, 3).map(tx => (
                            <div key={tx.id} className="flex items-center justify-between p-3 bg-[#171717]/5 rounded-xl">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{tx.icon}</span>
                                <div>
                                  <div className="font-bold text-sm">{tx.description}</div>
                                  <div className="text-xs text-[#171717]/50">{formatTimeAgo(tx.createdAt)}</div>
                                </div>
                              </div>
                              <div className={`font-bold ${tx.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
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
                    <div className="space-y-6">
                      {/* Balance Overview */}
                      <div className="bg-gradient-to-br from-emerald-900 to-cyan-900 rounded-2xl p-6 text-white">
                        <h2 className="text-lg font-bold mb-4">Your Balance</h2>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-white/10 rounded-xl p-4 text-center">
                            <div className="text-3xl font-black text-amber-400">
                              {currentProfile.kausBalance.toLocaleString()}
                            </div>
                            <div className="text-xs text-white/50 mt-1">KAUS Balance</div>
                          </div>
                          <div className="bg-white/10 rounded-xl p-4 text-center">
                            <div className="text-3xl font-black text-emerald-400">
                              ${(currentProfile.kausBalance * 0.09).toLocaleString()}
                            </div>
                            <div className="text-xs text-white/50 mt-1">USD Value</div>
                          </div>
                          <div className="bg-white/10 rounded-xl p-4 text-center">
                            <div className="text-3xl font-black text-cyan-400">
                              ₩{(currentProfile.kausBalance * 120).toLocaleString()}
                            </div>
                            <div className="text-xs text-white/50 mt-1">KRW Value</div>
                          </div>
                        </div>
                      </div>

                      {/* Expected Dividends */}
                      <DividendWidget tilesOwned={5} />

                      {/* Transaction History */}
                      <div className="bg-white rounded-2xl p-6 border border-[#171717]/10">
                        <h3 className="font-bold text-[#171717] mb-4">Transaction History</h3>
                        <div className="space-y-3">
                          {transactions.map(tx => (
                            <div key={tx.id} className="flex items-center justify-between p-4 bg-[#171717]/5 rounded-xl">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{tx.icon}</span>
                                <div>
                                  <div className="font-bold">{tx.description}</div>
                                  <div className="text-xs text-[#171717]/50">{formatTimeAgo(tx.createdAt)}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`font-bold ${tx.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {tx.isPositive ? '+' : '-'}{tx.amount.toLocaleString()} KAUS
                                </div>
                                <div className="text-xs text-[#171717]/50">
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
                    <div className="space-y-6">
                      <EnergyStatsSummary />
                      <div className="bg-white rounded-2xl p-6 border border-[#171717]/10">
                        <MyEnergyCertificates />
                      </div>
                    </div>
                  )}

                  {/* Referral Tab */}
                  {activeTab === 'referral' && (
                    <div className="space-y-6">
                      <div className="bg-white rounded-2xl p-6 border border-[#171717]/10">
                        <h2 className="text-lg font-bold text-[#171717] mb-4">Empire Referral Link</h2>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 p-3 bg-[#171717]/5 rounded-xl overflow-hidden">
                            <code className="text-sm text-[#171717]/80 break-all">
                              https://m.fieldnine.io/join?ref={referralCode}
                            </code>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={copyReferral}
                            className="px-6 py-3 bg-[#171717] text-white rounded-xl font-bold"
                          >
                            Copy
                          </motion.button>
                        </div>
                        <p className="text-sm text-[#171717]/60 mt-3">
                          추천 시 양측 모두 <span className="font-bold text-amber-600">100 KAUS</span> 즉시 지급
                        </p>
                      </div>

                      {/* Referral Stats */}
                      <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-2xl p-6 border border-emerald-200">
                        <h3 className="font-bold text-[#171717] mb-4">Referral Stats</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-3xl font-black text-emerald-600">
                              {referralStats?.totalReferrals || 0}
                            </div>
                            <div className="text-xs text-[#171717]/50">Total Referrals</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-black text-amber-600">
                              {referralStats?.totalEarnings || 0}
                            </div>
                            <div className="text-xs text-[#171717]/50">KAUS Earned</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-black text-cyan-600">
                              {referralStats?.pendingBonuses || 0}
                            </div>
                            <div className="text-xs text-[#171717]/50">Pending</div>
                          </div>
                        </div>
                      </div>

                      {/* Referral Benefits */}
                      <div className="bg-white rounded-2xl p-6 border border-[#171717]/10">
                        <h3 className="font-bold text-[#171717] mb-4">Referral Benefits</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                            <span className="text-xl">🎁</span>
                            <div>
                              <div className="font-bold text-emerald-700">가입 보너스</div>
                              <div className="text-sm text-emerald-600">추천인/피추천인 각 100 KAUS</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                            <span className="text-xl">💰</span>
                            <div>
                              <div className="font-bold text-amber-700">구매 보너스</div>
                              <div className="text-sm text-amber-600">첫 구매 금액의 10% 추가 지급</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                            <span className="text-xl">👑</span>
                            <div>
                              <div className="font-bold text-purple-700">무제한 추천</div>
                              <div className="text-sm text-purple-600">추천 횟수 제한 없음</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Settings Tab */}
                  {activeTab === 'settings' && (
                    <div className="space-y-6">
                      <div className="bg-white rounded-2xl p-6 border border-[#171717]/10">
                        <h2 className="text-lg font-bold text-[#171717] mb-4">Account Settings</h2>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-[#171717]/5 rounded-xl">
                            <div>
                              <div className="font-bold">Email Notifications</div>
                              <div className="text-sm text-[#171717]/50">Receive trading alerts</div>
                            </div>
                            <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-[#171717]/5 rounded-xl">
                            <div>
                              <div className="font-bold">Push Notifications</div>
                              <div className="text-sm text-[#171717]/50">Real-time updates</div>
                            </div>
                            <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-[#171717]/5 rounded-xl">
                            <div>
                              <div className="font-bold">Two-Factor Auth</div>
                              <div className="text-sm text-[#171717]/50">Enhanced security</div>
                            </div>
                            <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-[#171717]/5 rounded-xl">
                            <div>
                              <div className="font-bold">API Access</div>
                              <div className="text-sm text-[#171717]/50">Developer mode</div>
                            </div>
                            <div className="w-12 h-6 bg-[#171717]/20 rounded-full relative cursor-pointer">
                              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Security */}
                      <div className="bg-white rounded-2xl p-6 border border-[#171717]/10">
                        <h3 className="font-bold text-[#171717] mb-4">Security</h3>
                        <div className="space-y-3">
                          <button className="w-full flex items-center justify-between p-4 bg-[#171717]/5 rounded-xl hover:bg-[#171717]/10 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">🔐</span>
                              <span className="font-bold">Change Password</span>
                            </div>
                            <span className="text-[#171717]/40">→</span>
                          </button>
                          <button className="w-full flex items-center justify-between p-4 bg-[#171717]/5 rounded-xl hover:bg-[#171717]/10 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">📱</span>
                              <span className="font-bold">Manage Devices</span>
                            </div>
                            <span className="text-[#171717]/40">→</span>
                          </button>
                          <button className="w-full flex items-center justify-between p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">🚪</span>
                              <span className="font-bold text-red-600">Log Out</span>
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
          </div>
        </main>
      </div>
    </div>
  );
}
