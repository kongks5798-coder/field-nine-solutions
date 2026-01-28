'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 47: YIELD FARMER DASHBOARD
 * ═══════════════════════════════════════════════════════════════════════════════
 * 에너지 예치 + 이자 수익 = KAUS Staking
 * Tesla-grade UI with brush effects
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { STAKING_POOLS, StakingPool, getYieldProjection } from '@/lib/ai/autotrader';

// ═══════════════════════════════════════════════════════════════════════════════
// YIELD FARMER DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

export function YieldFarmerDashboard() {
  const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null);
  const [stakeAmount, setStakeAmount] = useState(1000);
  const [isStaking, setIsStaking] = useState(false);
  const [userStakes, setUserStakes] = useState<Array<{
    pool: StakingPool;
    amount: number;
    earnedRewards: number;
    stakedAt: Date;
  }>>([]);
  const [totalTVL, setTotalTVL] = useState(0);

  useEffect(() => {
    // Calculate total TVL
    const tvl = STAKING_POOLS.reduce((sum, pool) => sum + pool.tvl, 0);
    setTotalTVL(tvl);

    // Simulate user stakes
    setUserStakes([
      {
        pool: STAKING_POOLS[0],
        amount: 5000,
        earnedRewards: 125.5,
        stakedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      },
      {
        pool: STAKING_POOLS[1],
        amount: 3000,
        earnedRewards: 42.3,
        stakedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    ]);
  }, []);

  const handleStake = async () => {
    if (!selectedPool || stakeAmount < selectedPool.minStake) return;

    setIsStaking(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Add to user stakes
      setUserStakes(prev => [...prev, {
        pool: selectedPool,
        amount: stakeAmount,
        earnedRewards: 0,
        stakedAt: new Date(),
      }]);

      toast.success(`Successfully staked ${stakeAmount.toLocaleString()} KAUS in ${selectedPool.name}!`);
      setSelectedPool(null);
    } catch {
      toast.error('Staking failed. Please try again.');
    } finally {
      setIsStaking(false);
    }
  };

  const totalStaked = userStakes.reduce((sum, s) => sum + s.amount, 0);
  const totalEarned = userStakes.reduce((sum, s) => sum + s.earnedRewards, 0);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl p-4 text-white"
        >
          <div className="text-xs text-white/70 mb-1">Total Value Locked</div>
          <div className="text-2xl font-black">{(totalTVL / 1000000).toFixed(1)}M</div>
          <div className="text-xs text-white/70">KAUS</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#171717] rounded-2xl p-4 text-white"
        >
          <div className="text-xs text-white/50 mb-1">Your Staked</div>
          <div className="text-2xl font-black">{totalStaked.toLocaleString()}</div>
          <div className="text-xs text-white/50">KAUS</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#171717] rounded-2xl p-4 text-white"
        >
          <div className="text-xs text-white/50 mb-1">Total Earned</div>
          <div className="text-2xl font-black text-emerald-400">+{totalEarned.toFixed(2)}</div>
          <div className="text-xs text-white/50">KAUS</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#171717] rounded-2xl p-4 text-white"
        >
          <div className="text-xs text-white/50 mb-1">Avg APY</div>
          <div className="text-2xl font-black text-amber-400">
            {(STAKING_POOLS.reduce((sum, p) => sum + p.apy, 0) / STAKING_POOLS.length).toFixed(1)}%
          </div>
          <div className="text-xs text-white/50">Annual</div>
        </motion.div>
      </div>

      {/* Staking Pools */}
      <div className="bg-white rounded-2xl border border-[#171717]/10 overflow-hidden">
        <div className="p-4 border-b border-[#171717]/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌾</span>
              <div>
                <h3 className="font-bold text-[#171717]">Energy Yield Farms</h3>
                <p className="text-xs text-[#171717]/50">Stake KAUS, Earn Energy Yields</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold">LIVE</span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-[#171717]/5">
          {STAKING_POOLS.map((pool, i) => {
            const projection = getYieldProjection(1000, pool);

            return (
              <motion.div
                key={pool.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 hover:bg-[#171717]/5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#171717] to-[#2a2a2a] rounded-xl flex items-center justify-center">
                      <span className="text-2xl">{pool.assetIcon}</span>
                    </div>
                    <div>
                      <div className="font-bold text-[#171717]">{pool.name}</div>
                      <div className="text-xs text-[#171717]/50">{pool.rewardSource}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-lg font-black text-emerald-600">{pool.apy}%</div>
                      <div className="text-xs text-[#171717]/50">APY</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-[#171717]">{(pool.tvl / 1000000).toFixed(2)}M</div>
                      <div className="text-xs text-[#171717]/50">TVL</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-[#171717]">{pool.lockPeriod}d</div>
                      <div className="text-xs text-[#171717]/50">Lock</div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedPool(pool)}
                      className="px-4 py-2 bg-[#171717] text-white font-bold text-sm rounded-xl hover:bg-[#171717]/90 transition-colors"
                    >
                      Stake
                    </motion.button>
                  </div>
                </div>

                {/* Yield Preview Bar */}
                <div className="mt-3 p-2 bg-[#171717]/5 rounded-lg">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#171717]/50">1,000 KAUS yield preview:</span>
                    <div className="flex gap-4">
                      <span>Daily: <strong className="text-emerald-600">+{projection.daily.toFixed(2)}</strong></span>
                      <span>Weekly: <strong className="text-emerald-600">+{projection.weekly.toFixed(2)}</strong></span>
                      <span>Monthly: <strong className="text-emerald-600">+{projection.monthly.toFixed(2)}</strong></span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Your Active Stakes */}
      {userStakes.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#171717]/10 overflow-hidden">
          <div className="p-4 border-b border-[#171717]/10">
            <div className="flex items-center gap-3">
              <span className="text-xl">💰</span>
              <h3 className="font-bold text-[#171717]">Your Active Stakes</h3>
            </div>
          </div>

          <div className="divide-y divide-[#171717]/5">
            {userStakes.map((stake, i) => {
              const daysStaked = Math.floor((Date.now() - stake.stakedAt.getTime()) / (1000 * 60 * 60 * 24));
              const unlockDate = new Date(stake.stakedAt.getTime() + stake.pool.lockPeriod * 24 * 60 * 60 * 1000);
              const isUnlocked = new Date() >= unlockDate;
              const progress = Math.min(100, (daysStaked / stake.pool.lockPeriod) * 100);

              return (
                <motion.div
                  key={`${stake.pool.id}-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{stake.pool.assetIcon}</span>
                      <div>
                        <div className="font-bold text-[#171717]">{stake.pool.name}</div>
                        <div className="text-xs text-[#171717]/50">
                          Staked {stake.amount.toLocaleString()} KAUS • {daysStaked} days ago
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-emerald-600">+{stake.earnedRewards.toFixed(2)}</div>
                      <div className="text-xs text-[#171717]/50">Earned</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative h-2 bg-[#171717]/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        isUnlocked
                          ? 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-[#171717]/50">
                    <span>{daysStaked} days</span>
                    <span>{stake.pool.lockPeriod} days</span>
                  </div>

                  {isUnlocked && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full mt-3 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-xl"
                    >
                      Claim {(stake.amount + stake.earnedRewards).toFixed(2)} KAUS
                    </motion.button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Staking Modal */}
      <AnimatePresence>
        {selectedPool && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50"
              onClick={() => setSelectedPool(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-[#F9F9F7] rounded-2xl p-6 max-w-md w-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#171717] to-[#2a2a2a] rounded-xl flex items-center justify-center">
                    <span className="text-3xl">{selectedPool.assetIcon}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#171717]">{selectedPool.name}</h3>
                    <p className="text-sm text-[#171717]/50">{selectedPool.rewardSource}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 bg-white rounded-xl">
                    <div className="text-2xl font-black text-emerald-600">{selectedPool.apy}%</div>
                    <div className="text-xs text-[#171717]/50">APY</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-xl">
                    <div className="text-2xl font-black text-[#171717]">{selectedPool.lockPeriod}</div>
                    <div className="text-xs text-[#171717]/50">Days Lock</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-xl">
                    <div className="text-2xl font-black text-[#171717]">{selectedPool.minStake}</div>
                    <div className="text-xs text-[#171717]/50">Min Stake</div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-xs text-[#171717]/50 mb-2 block">Stake Amount (KAUS)</label>
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(Number(e.target.value))}
                    className="w-full p-4 bg-white border border-[#171717]/10 rounded-xl text-[#171717] font-bold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    min={selectedPool.minStake}
                  />
                  <div className="flex gap-2 mt-2">
                    {[500, 1000, 5000, 10000].map(val => (
                      <button
                        key={val}
                        onClick={() => setStakeAmount(val)}
                        className="flex-1 py-2 text-xs font-bold bg-[#171717]/5 rounded-lg hover:bg-[#171717]/10 transition-colors"
                      >
                        {val.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Yield Preview */}
                <div className="p-4 bg-emerald-50 rounded-xl mb-6">
                  <div className="text-xs text-emerald-700 mb-2">Projected Earnings</div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="font-bold text-emerald-700">
                        +{getYieldProjection(stakeAmount, selectedPool).daily.toFixed(2)}
                      </div>
                      <div className="text-xs text-emerald-600/70">Daily</div>
                    </div>
                    <div>
                      <div className="font-bold text-emerald-700">
                        +{getYieldProjection(stakeAmount, selectedPool).monthly.toFixed(2)}
                      </div>
                      <div className="text-xs text-emerald-600/70">Monthly</div>
                    </div>
                    <div>
                      <div className="font-bold text-emerald-700">
                        +{getYieldProjection(stakeAmount, selectedPool).yearly.toFixed(2)}
                      </div>
                      <div className="text-xs text-emerald-600/70">Yearly</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedPool(null)}
                    className="flex-1 py-3 bg-[#171717]/10 text-[#171717] font-bold rounded-xl hover:bg-[#171717]/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStake}
                    disabled={isStaking || stakeAmount < selectedPool.minStake}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-xl disabled:opacity-50"
                  >
                    {isStaking ? 'Staking...' : `Stake ${stakeAmount.toLocaleString()} KAUS`}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
