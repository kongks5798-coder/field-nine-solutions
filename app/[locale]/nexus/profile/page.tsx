'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 46: SOVEREIGN PROFILE + MY ENERGY TAB
 * ═══════════════════════════════════════════════════════════════════════════════
 * 원산지 증명서 열람 기능 추가
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FinancialSidebar, PriceTicker, MembershipBar } from '@/components/nexus/financial-terminal';
import { MyEnergyCertificates, EnergyStatsSummary } from '@/components/nexus/energy-mix-widget';
import { WithdrawalWidget, TransactionHistoryWidget, BankGradeSecurityBadge } from '@/components/nexus/commercial';
import { DividendWidget } from '@/components/nexus/land-investment';

type ProfileTab = 'overview' | 'wallet' | 'energy' | 'referral' | 'settings';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [referralCode] = useState('F9-SOVR-2026-PLAT');
  const [stats] = useState({
    kausBalance: 5000,
    totalEarnings: 125000,
    referrals: 12,
    apiCalls: 45230,
  });

  const copyReferral = async () => {
    await navigator.clipboard.writeText(`https://m.fieldnine.io/join?ref=${referralCode}`);
    alert('추천 링크가 복사되었습니다!');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '👤' },
    { id: 'wallet', label: 'Wallet', icon: '💰' },
    { id: 'energy', label: 'My Energy', icon: '⚡' },
    { id: 'referral', label: 'Referral', icon: '🔗' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <FinancialSidebar />
      <div className="ml-56">
        <PriceTicker />
        <MembershipBar />

        <main className="p-6">
          <div className="max-w-5xl mx-auto">
            {/* Profile Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-[#171717] to-[#2a2a2a] rounded-2xl p-8 text-white mb-6"
            >
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center">
                  <span className="text-4xl">👑</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Sovereign User</h1>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-xs font-bold">
                      PLATINUM
                    </span>
                    <span className="text-white/40 text-sm">Since 2026</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4 mt-8">
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-amber-400">{stats.kausBalance.toLocaleString()}</div>
                  <div className="text-xs text-white/50 mt-1">KAUS Balance</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-400">₩{(stats.totalEarnings / 1000).toFixed(0)}K</div>
                  <div className="text-xs text-white/50 mt-1">Total Earnings</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-cyan-400">{stats.referrals}</div>
                  <div className="text-xs text-white/50 mt-1">Referrals</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{(stats.apiCalls / 1000).toFixed(1)}K</div>
                  <div className="text-xs text-white/50 mt-1">API Calls</div>
                </div>
              </div>
            </motion.div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6">
              {tabs.map(tab => (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab.id as ProfileTab)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ${
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

            {/* Tab Content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Membership Benefits */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-300">
                    <h2 className="text-lg font-bold text-[#171717] mb-4">Platinum Benefits</h2>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { icon: '⚡', text: '에너지 구매 20% 할인' },
                        { icon: '📊', text: '영동 발전소 데이터 독점 열람' },
                        { icon: '🔮', text: 'Prophet AI 프리미엄 분석' },
                        { icon: '🎯', text: 'Early Bird 우선 참여' },
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
                      onClick={() => setActiveTab('energy')}
                      className="p-4 bg-white rounded-xl border border-[#171717]/10 hover:shadow-lg transition-shadow"
                    >
                      <div className="text-3xl mb-2">📜</div>
                      <div className="font-bold text-[#171717]">View Certificates</div>
                      <div className="text-xs text-[#171717]/50">2 certificates</div>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setActiveTab('referral')}
                      className="p-4 bg-white rounded-xl border border-[#171717]/10 hover:shadow-lg transition-shadow"
                    >
                      <div className="text-3xl mb-2">🔗</div>
                      <div className="font-bold text-[#171717]">Share Link</div>
                      <div className="text-xs text-[#171717]/50">Earn 100 KAUS</div>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      className="p-4 bg-white rounded-xl border border-[#171717]/10 hover:shadow-lg transition-shadow"
                    >
                      <div className="text-3xl mb-2">📊</div>
                      <div className="font-bold text-[#171717]">ESG Report</div>
                      <div className="text-xs text-[#171717]/50">Download PDF</div>
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Wallet Tab - Withdrawal */}
              {activeTab === 'wallet' && (
                <div className="space-y-6">
                  {/* Balance Overview */}
                  <div className="bg-gradient-to-br from-emerald-900 to-cyan-900 rounded-2xl p-6 text-white">
                    <h2 className="text-lg font-bold mb-4">Your Balance</h2>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white/10 rounded-xl p-4 text-center">
                        <div className="text-3xl font-black text-amber-400">{stats.kausBalance.toLocaleString()}</div>
                        <div className="text-xs text-white/50 mt-1">KAUS Balance</div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-4 text-center">
                        <div className="text-3xl font-black text-emerald-400">
                          ${(stats.kausBalance * 0.09).toLocaleString()}
                        </div>
                        <div className="text-xs text-white/50 mt-1">USD Value</div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-4 text-center">
                        <div className="text-3xl font-black text-cyan-400">
                          ₩{(stats.kausBalance * 120).toLocaleString()}
                        </div>
                        <div className="text-xs text-white/50 mt-1">KRW Value</div>
                      </div>
                    </div>
                  </div>

                  {/* Expected Dividends Widget */}
                  <DividendWidget tilesOwned={5} />

                  {/* Withdrawal Widget */}
                  <WithdrawalWidget />

                  {/* Transaction History */}
                  <TransactionHistoryWidget />

                  {/* Security Badge */}
                  <BankGradeSecurityBadge variant="compact" />
                </div>
              )}

              {/* My Energy Tab */}
              {activeTab === 'energy' && (
                <div className="space-y-6">
                  {/* Energy Stats Summary */}
                  <EnergyStatsSummary />

                  {/* Certificates */}
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
                      <div className="flex-1 p-3 bg-[#171717]/5 rounded-xl">
                        <code className="text-sm text-[#171717]/80">https://m.fieldnine.io/join?ref={referralCode}</code>
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
                        <div className="text-3xl font-black text-emerald-600">{stats.referrals}</div>
                        <div className="text-xs text-[#171717]/50">Total Referrals</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-black text-amber-600">{stats.referrals * 100}</div>
                        <div className="text-xs text-[#171717]/50">KAUS Earned</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-black text-cyan-600">5</div>
                        <div className="text-xs text-[#171717]/50">This Month</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="bg-white rounded-2xl p-6 border border-[#171717]/10">
                  <h2 className="text-lg font-bold text-[#171717] mb-4">Account Settings</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#171717]/5 rounded-xl">
                      <div>
                        <div className="font-bold">Email Notifications</div>
                        <div className="text-sm text-[#171717]/50">Receive trading alerts</div>
                      </div>
                      <div className="w-12 h-6 bg-emerald-500 rounded-full relative">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#171717]/5 rounded-xl">
                      <div>
                        <div className="font-bold">Two-Factor Auth</div>
                        <div className="text-sm text-[#171717]/50">Enhanced security</div>
                      </div>
                      <div className="w-12 h-6 bg-emerald-500 rounded-full relative">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#171717]/5 rounded-xl">
                      <div>
                        <div className="font-bold">API Access</div>
                        <div className="text-sm text-[#171717]/50">Developer mode</div>
                      </div>
                      <div className="w-12 h-6 bg-[#171717]/20 rounded-full relative">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
