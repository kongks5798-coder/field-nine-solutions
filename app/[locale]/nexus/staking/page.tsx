'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 54: STAKING & YIELD FARMING PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Stake tokens and earn rewards with flexible and locked options
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FinancialSidebar, PriceTicker, MembershipBar } from '@/components/nexus/financial-terminal';
import { MobileBottomNav, MobileHeader } from '@/components/nexus/mobile-nav';
import {
  StakingPoolList,
  StakingPoolCard,
  FarmList,
  FarmCard,
  UserStakesWidget,
  TierProgressWidget,
  StakingStatsWidget,
  StakingCalculator,
  StakingModal,
  UserPortfolioOverview,
} from '@/components/nexus/staking-dashboard';
import { StakingEngine, type StakingPool, type Farm, type UserStake } from '@/lib/staking/staking-engine';

type StakingView = 'overview' | 'pools' | 'farms' | 'calculator';

export default function StakingPage() {
  const [activeView, setActiveView] = useState<StakingView>('overview');
  const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null);
  const [showStakingModal, setShowStakingModal] = useState(false);

  const views = [
    { id: 'overview', label: '개요', icon: '📊' },
    { id: 'pools', label: '스테이킹', icon: '🏦' },
    { id: 'farms', label: '파밍', icon: '🌾' },
    { id: 'calculator', label: '계산기', icon: '🧮' },
  ];

  const handleStakePool = (pool: StakingPool) => {
    setSelectedPool(pool);
    setShowStakingModal(true);
  };

  const handleStakeConfirm = (amount: number) => {
    console.log('Staking:', amount, 'to pool:', selectedPool?.id);
    setShowStakingModal(false);
    setSelectedPool(null);
  };

  const handleDepositFarm = (farm: Farm) => {
    console.log('Depositing to farm:', farm.id);
  };

  const handleClaimRewards = (stake: UserStake) => {
    const result = StakingEngine.claimRewards(stake.id);
    console.log('Claimed rewards:', result);
  };

  const handleUnstake = (stake: UserStake) => {
    console.log('Unstaking from:', stake.poolId);
  };

  const stats = StakingEngine.getStakingStats();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Desktop: Financial Terminal Sidebar */}
      <div className="hidden md:block">
        <FinancialSidebar />
      </div>

      {/* Mobile: Header */}
      <div className="md:hidden">
        <MobileHeader title="Staking & Farming" />
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
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl
                    flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <span className="text-3xl">🏦</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Staking & Farming</h1>
                    <p className="text-neutral-400 text-sm">스테이킹하고 보상을 받으세요</p>
                  </div>
                </div>

                {/* TVL Badge */}
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-xl">
                  <span className="text-emerald-400 text-sm">총 예치 자산</span>
                  <span className="text-xl font-bold text-white">
                    ₩{(stats.totalValueLockedKRW / 100000000).toFixed(1)}억
                  </span>
                </div>
              </div>

              {/* Stats Summary */}
              <StakingStatsWidget />
            </motion.div>

            {/* View Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {views.map((view) => (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id as StakingView)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium
                    whitespace-nowrap transition-all ${
                    activeView === view.id
                      ? 'bg-emerald-500 text-white'
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
                      {/* User Portfolio */}
                      <UserPortfolioOverview />

                      {/* My Stakes */}
                      <UserStakesWidget
                        onClaim={handleClaimRewards}
                        onUnstake={handleUnstake}
                      />

                      {/* Hot Pools */}
                      <div>
                        <h2 className="text-lg font-bold text-white mb-4">🔥 인기 풀</h2>
                        <div className="grid grid-cols-2 gap-4">
                          {StakingEngine.getStakingPools().slice(0, 4).map((pool) => (
                            <StakingPoolCard
                              key={pool.id}
                              pool={pool}
                              onStake={handleStakePool}
                              compact
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="col-span-4 space-y-6">
                      <TierProgressWidget />
                      <StakingCalculator />
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-4">
                    <UserPortfolioOverview />
                    <TierProgressWidget />
                    <UserStakesWidget
                      onClaim={handleClaimRewards}
                      onUnstake={handleUnstake}
                    />
                  </div>
                </motion.div>
              )}

              {activeView === 'pools' && (
                <motion.div
                  key="pools"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <StakingPoolList onStake={handleStakePool} />
                </motion.div>
              )}

              {activeView === 'farms' && (
                <motion.div
                  key="farms"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Farm Info Banner */}
                  <div className="bg-gradient-to-r from-emerald-900/50 to-teal-900/50 rounded-2xl
                    border border-emerald-500/30 p-5">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">🌾</span>
                      <div>
                        <h2 className="text-lg font-bold text-white">Yield Farming</h2>
                        <p className="text-neutral-400 text-sm">
                          유동성을 제공하고 높은 수익을 얻으세요. 듀얼 리워드 풀에서 최대 120% APY!
                        </p>
                      </div>
                    </div>
                  </div>

                  <FarmList onDeposit={handleDepositFarm} />
                </motion.div>
              )}

              {activeView === 'calculator' && (
                <motion.div
                  key="calculator"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Desktop Layout */}
                  <div className="hidden md:grid md:grid-cols-12 gap-6">
                    <div className="col-span-6">
                      <StakingCalculator />
                    </div>
                    <div className="col-span-6">
                      <TierProgressWidget />

                      {/* Tier Benefits */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5 mt-6"
                      >
                        <h3 className="font-bold text-white mb-4">티어별 혜택</h3>
                        <div className="space-y-3">
                          {Object.values(StakingEngine.TIER_CONFIG).map((tier) => (
                            <div
                              key={tier.tier}
                              className="flex items-center gap-3 p-3 bg-neutral-800 rounded-xl"
                            >
                              <span className="text-2xl">{tier.icon}</span>
                              <div className="flex-1">
                                <p className="font-medium text-white">{tier.nameKo}</p>
                                <p className="text-xs text-neutral-400">
                                  {tier.minStake.toLocaleString()}+ KAUS
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-emerald-400 font-bold">x{tier.boostMultiplier}</p>
                                <p className="text-xs text-neutral-400">APY 부스트</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-4">
                    <StakingCalculator />
                    <TierProgressWidget />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Disclaimer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 p-4 bg-neutral-900/50 rounded-xl border border-neutral-800"
            >
              <p className="text-neutral-500 text-xs text-center">
                ⚠️ 스테이킹에는 락업 기간 동안 자금에 접근할 수 없는 위험이 있습니다.
                조기 출금 시 페널티가 적용될 수 있으며, APY는 변동될 수 있습니다.
              </p>
            </motion.div>
          </div>
        </main>
      </div>

      {/* Mobile: Bottom Navigation */}
      <MobileBottomNav />

      {/* Staking Modal */}
      <AnimatePresence>
        {showStakingModal && selectedPool && (
          <StakingModal
            pool={selectedPool}
            onStake={handleStakeConfirm}
            onClose={() => {
              setShowStakingModal(false);
              setSelectedPool(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
