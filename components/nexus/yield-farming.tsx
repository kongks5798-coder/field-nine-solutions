'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 47: SOVEREIGN YIELD FARMING UI
 * ═══════════════════════════════════════════════════════════════════════════════
 * KAUS 스테이킹 + 에너지 자산 배당
 * "제국은 스스로 돈을 벌기 시작한다"
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  STAKING_POOLS,
  StakingPool,
  getYieldProjection,
  getAutoTraderState,
  AutoTraderState,
} from '@/lib/ai/autotrader';

// ═══════════════════════════════════════════════════════════════════════════════
// AUTO-TRADER STATUS WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

export function AutoTraderWidget() {
  const [state, setState] = useState<AutoTraderState | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const update = () => setState(getAutoTraderState());
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!state) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-[#171717] to-[#2a2a2a] rounded-2xl p-6 text-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{
              boxShadow: state.isActive
                ? ['0 0 0 0 rgba(34, 197, 94, 0)', '0 0 0 10px rgba(34, 197, 94, 0.3)', '0 0 0 0 rgba(34, 197, 94, 0)']
                : 'none'
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center"
          >
            <span className="text-2xl">🤖</span>
          </motion.div>
          <div>
            <h3 className="font-bold">AI Auto-Trader</h3>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                state.isActive ? 'bg-emerald-400' : 'bg-red-400'
              }`} />
              <span className={`text-xs font-bold ${
                state.isActive ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {state.isActive ? 'AUTO-TRADING: ACTIVE' : 'PAUSED'}
              </span>
            </div>
          </div>
        </div>

        {/* Today's Profit */}
        <div className="text-right">
          <div className="text-xs text-white/50">Today&apos;s Profit</div>
          <motion.div
            key={state.todayProfitUSD}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="text-2xl font-black text-emerald-400"
          >
            ${state.todayProfitUSD.toFixed(2)}
          </motion.div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className="text-lg font-bold">{state.todayTrades}</div>
          <div className="text-[10px] text-white/50">Today&apos;s Trades</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-amber-400">{state.todayProfit.toFixed(0)}</div>
          <div className="text-[10px] text-white/50">KAUS Profit</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-cyan-400">{(state.winRate * 100).toFixed(0)}%</div>
          <div className="text-[10px] text-white/50">Win Rate</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className="text-lg font-bold">{state.currentPositions.size}</div>
          <div className="text-[10px] text-white/50">Positions</div>
        </div>
      </div>

      {/* Recent Trades Toggle */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full py-2 text-sm text-white/60 hover:text-white flex items-center justify-center gap-2"
      >
        <span>Recent AI Trades</span>
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▼
        </motion.span>
      </motion.button>

      {/* Recent Trades List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pt-2">
              {state.recentOrders.slice(0, 5).map(order => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-xl text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      order.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {order.type}
                    </span>
                    <span className="text-white/70">{order.amount.toLocaleString()} kWh</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white/70">{order.total.toFixed(2)} KAUS</div>
                    {order.profit !== undefined && (
                      <div className={`text-xs ${order.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {order.profit >= 0 ? '+' : ''}{order.profit.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Physical Asset Backed Badge */}
      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center gap-2">
        <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="text-xs text-emerald-400 font-bold">Physical Asset Backed</span>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAKING & YIELD SECTION
// ═══════════════════════════════════════════════════════════════════════════════

export function StakingYieldSection() {
  const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null);
  const [stakeAmount, setStakeAmount] = useState(1000);
  const [isStaking, setIsStaking] = useState(false);

  const handleStake = async () => {
    if (!selectedPool) return;
    setIsStaking(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    alert(`${stakeAmount} KAUS를 ${selectedPool.name}에 스테이킹했습니다! APY: ${selectedPool.apy}%`);
    setIsStaking(false);
    setSelectedPool(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 border border-[#171717]/10"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-[#171717]">Staking & Yield</h3>
          <p className="text-xs text-[#171717]/50">KAUS를 예치하고 에너지 자산 배당 수익을 받으세요</p>
        </div>
        <div className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-xs font-bold">
          UP TO 15% APY
        </div>
      </div>

      {/* Staking Pools */}
      <div className="space-y-3">
        {STAKING_POOLS.map(pool => {
          const projection = getYieldProjection(stakeAmount, pool);
          const isSelected = selectedPool?.id === pool.id;

          return (
            <motion.div
              key={pool.id}
              whileHover={{ scale: 1.01 }}
              onClick={() => setSelectedPool(isSelected ? null : pool)}
              className={`p-4 rounded-xl cursor-pointer transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white'
                  : 'bg-[#171717]/5 hover:bg-[#171717]/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-white/20' : 'bg-white'
                  }`}>
                    <span className="text-xl">{pool.assetIcon}</span>
                  </div>
                  <div>
                    <div className="font-bold">{pool.name}</div>
                    <div className={`text-xs ${isSelected ? 'text-white/70' : 'text-[#171717]/50'}`}>
                      {pool.rewardSource}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-black ${isSelected ? 'text-white' : 'text-emerald-600'}`}>
                    {pool.apy}%
                  </div>
                  <div className={`text-xs ${isSelected ? 'text-white/70' : 'text-[#171717]/50'}`}>
                    APY
                  </div>
                </div>
              </div>

              {/* Pool Details */}
              <div className={`grid grid-cols-3 gap-3 mt-4 pt-3 border-t ${
                isSelected ? 'border-white/20' : 'border-[#171717]/10'
              }`}>
                <div>
                  <div className={`text-xs ${isSelected ? 'text-white/50' : 'text-[#171717]/40'}`}>TVL</div>
                  <div className="font-bold">{(pool.tvl / 1000000).toFixed(1)}M KAUS</div>
                </div>
                <div>
                  <div className={`text-xs ${isSelected ? 'text-white/50' : 'text-[#171717]/40'}`}>Min Stake</div>
                  <div className="font-bold">{pool.minStake} KAUS</div>
                </div>
                <div>
                  <div className={`text-xs ${isSelected ? 'text-white/50' : 'text-[#171717]/40'}`}>Lock</div>
                  <div className="font-bold">{pool.lockPeriod} Days</div>
                </div>
              </div>

              {/* Yield Preview */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 pt-4 border-t border-white/20"
                  >
                    <div className="text-xs text-white/70 mb-2">
                      Estimated Yield for {stakeAmount.toLocaleString()} KAUS
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="bg-white/10 rounded-lg p-2 text-center">
                        <div className="text-sm font-bold">{projection.daily.toFixed(2)}</div>
                        <div className="text-[10px] text-white/50">Daily</div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-2 text-center">
                        <div className="text-sm font-bold">{projection.weekly.toFixed(2)}</div>
                        <div className="text-[10px] text-white/50">Weekly</div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-2 text-center">
                        <div className="text-sm font-bold">{projection.monthly.toFixed(1)}</div>
                        <div className="text-[10px] text-white/50">Monthly</div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-2 text-center">
                        <div className="text-sm font-bold">{projection.yearly.toFixed(0)}</div>
                        <div className="text-[10px] text-white/50">Yearly</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Stake Input */}
      {selectedPool && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-[#171717]/5 rounded-xl"
        >
          <label className="text-xs text-[#171717]/60 mb-2 block">Stake Amount (KAUS)</label>
          <input
            type="number"
            value={stakeAmount}
            onChange={e => setStakeAmount(Number(e.target.value))}
            min={selectedPool.minStake}
            className="w-full p-3 bg-white border border-[#171717]/10 rounded-xl text-lg font-bold mb-3"
          />
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleStake}
            disabled={isStaking || stakeAmount < selectedPool.minStake}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-xl disabled:opacity-50"
          >
            {isStaking ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  ⏳
                </motion.span>
                Staking...
              </span>
            ) : (
              <span>Stake {stakeAmount.toLocaleString()} KAUS</span>
            )}
          </motion.button>
        </motion.div>
      )}

      {/* Trust Badge */}
      <div className="mt-4 flex items-center justify-center gap-2 text-[#171717]/40 text-xs">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span>Physical Asset Backed • 영동 100,000평 담보</span>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHYSICAL ASSET TRUST BADGE
// ═══════════════════════════════════════════════════════════════════════════════

export function PhysicalAssetBadge({ variant = 'default' }: { variant?: 'default' | 'compact' | 'inline' }) {
  if (variant === 'inline') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span>Physical Asset Backed</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1.5 text-emerald-600 text-xs">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="font-bold">Physical Asset Backed</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-xl border border-emerald-200"
    >
      <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      </div>
      <div>
        <div className="font-bold text-emerald-700">Physical Asset Backed</div>
        <div className="text-xs text-emerald-600">영동 100,000평 실물 부동산 담보</div>
      </div>
    </motion.div>
  );
}
