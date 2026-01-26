'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 55: LENDING & BORROWING PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Supply assets to earn interest or borrow against collateral
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FinancialSidebar, PriceTicker, MembershipBar } from '@/components/nexus/financial-terminal';
import { MobileBottomNav, MobileHeader } from '@/components/nexus/mobile-nav';
import {
  MarketsList,
  PositionOverview,
  UserSuppliesWidget,
  UserBorrowsWidget,
  LendingStatsWidget,
  LendingModal,
  HealthFactorGauge,
  RiskMeter,
} from '@/components/nexus/lending-dashboard';
import {
  LendingEngine,
  type LendingMarket,
  type UserSupply,
  type UserBorrow,
} from '@/lib/lending/lending-engine';

type LendingView = 'overview' | 'markets' | 'my-position';

export default function LendingPage() {
  const [activeView, setActiveView] = useState<LendingView>('overview');
  const [selectedMarket, setSelectedMarket] = useState<LendingMarket | null>(null);
  const [modalMode, setModalMode] = useState<'supply' | 'borrow'>('supply');
  const [showModal, setShowModal] = useState(false);

  const views = [
    { id: 'overview', label: '개요', icon: '📊' },
    { id: 'markets', label: '마켓', icon: '🏦' },
    { id: 'my-position', label: '내 포지션', icon: '💼' },
  ];

  const handleSupply = (market: LendingMarket) => {
    setSelectedMarket(market);
    setModalMode('supply');
    setShowModal(true);
  };

  const handleBorrow = (market: LendingMarket) => {
    setSelectedMarket(market);
    setModalMode('borrow');
    setShowModal(true);
  };

  const handleModalSubmit = (amount: number) => {
    console.log(`${modalMode}:`, amount, 'to', selectedMarket?.asset);
    setShowModal(false);
    setSelectedMarket(null);
  };

  const handleWithdraw = (supply: UserSupply) => {
    console.log('Withdraw:', supply.id);
  };

  const handleRepay = (borrow: UserBorrow) => {
    console.log('Repay:', borrow.id);
  };

  const handleToggleCollateral = (supply: UserSupply) => {
    console.log('Toggle collateral:', supply.id);
  };

  const stats = LendingEngine.getLendingStats();
  const position = LendingEngine.getUserPosition('0xuser');

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Desktop: Financial Terminal Sidebar */}
      <div className="hidden md:block">
        <FinancialSidebar />
      </div>

      {/* Mobile: Header */}
      <div className="md:hidden">
        <MobileHeader title="Lending & Borrowing" />
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
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl
                    flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <span className="text-3xl">🏦</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Lending & Borrowing</h1>
                    <p className="text-neutral-400 text-sm">자산을 예치하고 이자를 받거나 대출하세요</p>
                  </div>
                </div>

                {/* TVL Badge */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-xl">
                    <span className="text-emerald-400 text-sm">총 예치</span>
                    <span className="text-lg font-bold text-white">
                      ₩{(stats.totalSupplyValueKRW / 100000000).toFixed(1)}억
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-violet-500/20 rounded-xl">
                    <span className="text-violet-400 text-sm">총 대출</span>
                    <span className="text-lg font-bold text-white">
                      ₩{(stats.totalBorrowValueKRW / 100000000).toFixed(1)}억
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Summary */}
              <LendingStatsWidget />
            </motion.div>

            {/* View Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {views.map((view) => (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id as LendingView)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium
                    whitespace-nowrap transition-all ${
                    activeView === view.id
                      ? 'bg-blue-500 text-white'
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
                      {/* Position Overview */}
                      <PositionOverview />

                      {/* Top Markets */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg font-bold text-white">인기 마켓</h2>
                          <button
                            onClick={() => setActiveView('markets')}
                            className="text-sm text-violet-400 hover:text-violet-300"
                          >
                            전체 보기 →
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {LendingEngine.getMarkets().slice(0, 4).map((market) => (
                            <motion.div
                              key={market.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="bg-neutral-900 rounded-xl border border-neutral-800 p-4
                                hover:border-neutral-700 transition-all cursor-pointer"
                              onClick={() => handleSupply(market)}
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <span className="text-2xl">{market.icon}</span>
                                <div>
                                  <p className="font-medium text-white">{market.nameKo}</p>
                                  <p className="text-xs text-neutral-400">{market.asset}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <p className="text-xs text-neutral-400">예치 APY</p>
                                  <p className="text-emerald-400 font-bold">{market.supplyApy}%</p>
                                </div>
                                <div>
                                  <p className="text-xs text-neutral-400">대출 APY</p>
                                  <p className="text-violet-400 font-bold">{market.borrowApy}%</p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="col-span-4 space-y-6">
                      {/* Health Factor */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5"
                      >
                        <h3 className="font-bold text-white mb-4 text-center">건강 지수</h3>
                        <div className="flex justify-center">
                          <HealthFactorGauge healthFactor={position.healthFactor} size="lg" />
                        </div>
                        <p className="text-center text-sm text-neutral-400 mt-4">
                          {position.healthFactor >= 2
                            ? '포지션이 안전합니다'
                            : position.healthFactor >= 1.5
                              ? '포지션이 양호합니다'
                              : '포지션 관리가 필요합니다'}
                        </p>
                      </motion.div>

                      {/* Quick Actions */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5"
                      >
                        <h3 className="font-bold text-white mb-4">빠른 작업</h3>
                        <div className="space-y-3">
                          <button
                            onClick={() => {
                              setSelectedMarket(LendingEngine.getMarkets()[0]);
                              setModalMode('supply');
                              setShowModal(true);
                            }}
                            className="w-full py-3 bg-emerald-500/20 text-emerald-400 rounded-xl
                              font-medium hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-2"
                          >
                            <span>💰</span>
                            <span>예치하기</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedMarket(LendingEngine.getMarkets()[0]);
                              setModalMode('borrow');
                              setShowModal(true);
                            }}
                            className="w-full py-3 bg-violet-500/20 text-violet-400 rounded-xl
                              font-medium hover:bg-violet-500/30 transition-all flex items-center justify-center gap-2"
                          >
                            <span>📝</span>
                            <span>대출하기</span>
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-4">
                    <PositionOverview />
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5"
                    >
                      <div className="flex justify-center">
                        <HealthFactorGauge healthFactor={position.healthFactor} size="md" />
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {activeView === 'markets' && (
                <motion.div
                  key="markets"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <MarketsList
                    onSupply={handleSupply}
                    onBorrow={handleBorrow}
                  />
                </motion.div>
              )}

              {activeView === 'my-position' && (
                <motion.div
                  key="my-position"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Position Overview */}
                  <PositionOverview />

                  {/* Desktop Layout */}
                  <div className="hidden md:grid md:grid-cols-2 gap-6">
                    <UserSuppliesWidget
                      onWithdraw={handleWithdraw}
                      onToggleCollateral={handleToggleCollateral}
                    />
                    <UserBorrowsWidget onRepay={handleRepay} />
                  </div>

                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-4">
                    <UserSuppliesWidget
                      onWithdraw={handleWithdraw}
                      onToggleCollateral={handleToggleCollateral}
                    />
                    <UserBorrowsWidget onRepay={handleRepay} />
                  </div>

                  {/* Risk Analysis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <RiskMeter
                      utilizationRate={position.borrowLimitUsed}
                      label="대출 한도 사용률"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5"
                    >
                      <h3 className="font-bold text-white mb-4">리스크 경고</h3>
                      <div className="space-y-3">
                        {position.healthFactor < 1.5 && (
                          <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-xl">
                            <span className="text-amber-400">⚠️</span>
                            <div>
                              <p className="text-amber-400 font-medium text-sm">건강 지수 낮음</p>
                              <p className="text-neutral-400 text-xs mt-0.5">
                                담보를 추가하거나 대출을 상환하세요
                              </p>
                            </div>
                          </div>
                        )}
                        {position.borrowLimitUsed > 70 && (
                          <div className="flex items-start gap-2 p-3 bg-orange-500/10 rounded-xl">
                            <span className="text-orange-400">🔔</span>
                            <div>
                              <p className="text-orange-400 font-medium text-sm">대출 한도 주의</p>
                              <p className="text-neutral-400 text-xs mt-0.5">
                                대출 한도의 70% 이상 사용 중
                              </p>
                            </div>
                          </div>
                        )}
                        {position.healthFactor >= 1.5 && position.borrowLimitUsed <= 70 && (
                          <div className="flex items-start gap-2 p-3 bg-emerald-500/10 rounded-xl">
                            <span className="text-emerald-400">✓</span>
                            <div>
                              <p className="text-emerald-400 font-medium text-sm">포지션 안전</p>
                              <p className="text-neutral-400 text-xs mt-0.5">
                                현재 리스크가 관리되고 있습니다
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
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
                ⚠️ 담보 대출은 담보 가치 하락 시 청산 위험이 있습니다.
                건강 지수를 항상 확인하고 안전한 수준을 유지하세요.
              </p>
            </motion.div>
          </div>
        </main>
      </div>

      {/* Mobile: Bottom Navigation */}
      <MobileBottomNav />

      {/* Supply/Borrow Modal */}
      <AnimatePresence>
        {showModal && selectedMarket && (
          <LendingModal
            market={selectedMarket}
            mode={modalMode}
            onSubmit={handleModalSubmit}
            onClose={() => {
              setShowModal(false);
              setSelectedMarket(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
