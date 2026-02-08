'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 54: STAKING & YIELD FARMING DASHBOARD COMPONENTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * - Staking pool cards and lists
 * - Farm components
 * - User portfolio widgets
 * - Tier progress visualization
 * - Reward calculators
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  StakingEngine,
  type StakingPool,
  type Farm,
  type UserStake,
  type UserFarmPosition,
  type StakingTier,
  type StakingStats,
  type CompoundingStrategy,
} from '@/lib/staking/staking-engine';

// ═══════════════════════════════════════════════════════════════════════════════
// STAKING POOL CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface StakingPoolCardProps {
  pool: StakingPool;
  onStake?: (pool: StakingPool) => void;
  compact?: boolean;
}

export function StakingPoolCard({ pool, onStake, compact = false }: StakingPoolCardProps) {
  const lockLabel = pool.lockPeriodDays === 0
    ? '유연'
    : pool.lockPeriodDays === 365
      ? '1년'
      : `${pool.lockPeriodDays}일`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden
        hover:border-violet-500/50 transition-all ${compact ? 'p-4' : 'p-5'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl
            flex items-center justify-center text-2xl shadow-lg shadow-violet-500/20">
            {pool.tokenIcon}
          </div>
          <div>
            <h3 className="font-bold text-white">{pool.nameKo}</h3>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-neutral-400">{pool.token}</span>
              <span className={`px-2 py-0.5 rounded-full ${
                pool.lockPeriodDays === 0
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}>
                {lockLabel}
              </span>
            </div>
          </div>
        </div>

        {/* APY Badge */}
        <div className="text-right">
          <div className="text-2xl font-bold text-emerald-400">{pool.apy}%</div>
          <div className="text-xs text-neutral-400">APY</div>
          {pool.apyBoost && (
            <div className="text-xs text-violet-400">+{pool.apyBoost}% 부스트</div>
          )}
        </div>
      </div>

      {!compact && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-neutral-800 rounded-xl p-3">
              <p className="text-xs text-neutral-400 mb-1">총 스테이킹</p>
              <p className="text-sm font-bold text-white">
                {(pool.totalStaked / 1000000).toFixed(2)}M {pool.token}
              </p>
            </div>
            <div className="bg-neutral-800 rounded-xl p-3">
              <p className="text-xs text-neutral-400 mb-1">참여자</p>
              <p className="text-sm font-bold text-white">{pool.participants.toLocaleString()}명</p>
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-2 mb-4">
            {pool.features.map((feature, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-neutral-800 rounded-lg text-xs text-neutral-300"
              >
                {feature}
              </span>
            ))}
          </div>

          {/* Penalty Warning */}
          {pool.earlyUnstakePenalty > 0 && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-xl mb-4">
              <span className="text-red-400">⚠️</span>
              <span className="text-xs text-red-400">
                조기 출금 시 {pool.earlyUnstakePenalty}% 페널티 적용
              </span>
            </div>
          )}
        </>
      )}

      {/* Stake Button */}
      <button
        onClick={() => onStake?.(pool)}
        className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl
          font-bold text-white hover:opacity-90 transition-opacity"
      >
        스테이킹하기
      </button>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAKING POOL LIST
// ═══════════════════════════════════════════════════════════════════════════════

interface StakingPoolListProps {
  onStake?: (pool: StakingPool) => void;
}

export function StakingPoolList({ onStake }: StakingPoolListProps) {
  const [pools, setPools] = useState<StakingPool[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'FLEXIBLE' | 'LOCKED'>('ALL');

  useEffect(() => {
    const allPools = StakingEngine.getStakingPools();
    const filtered = filter === 'ALL'
      ? allPools
      : filter === 'FLEXIBLE'
        ? allPools.filter(p => p.lockPeriodDays === 0)
        : allPools.filter(p => p.lockPeriodDays > 0);
    setPools(filtered);
  }, [filter]);

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'ALL', label: '전체' },
          { id: 'FLEXIBLE', label: '유연' },
          { id: 'LOCKED', label: '락업' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as 'ALL' | 'FLEXIBLE' | 'LOCKED')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f.id
                ? 'bg-violet-500 text-white'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Pool Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pools.map((pool) => (
          <StakingPoolCard key={pool.id} pool={pool} onStake={onStake} />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FARM CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface FarmCardProps {
  farm: Farm;
  onDeposit?: (farm: Farm) => void;
}

export function FarmCard({ farm, onDeposit }: FarmCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden
        hover:border-emerald-500/50 transition-all p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* LP Token Pair */}
          <div className="relative">
            <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center text-lg">
              {farm.lpToken.token0Icon}
            </div>
            <div className="absolute -right-2 -bottom-1 w-8 h-8 bg-neutral-700 rounded-full
              flex items-center justify-center text-sm border-2 border-neutral-900">
              {farm.lpToken.token1Icon}
            </div>
          </div>
          <div className="ml-2">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white">{farm.nameKo}</h3>
              {farm.isHot && (
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                  🔥 HOT
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400">
              {farm.lpToken.token0}-{farm.lpToken.token1}
            </p>
          </div>
        </div>

        {/* Multiplier */}
        <div className="px-3 py-1.5 bg-emerald-500/20 rounded-lg">
          <span className="text-emerald-400 font-bold">{farm.multiplier}</span>
        </div>
      </div>

      {/* APY/APR */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-neutral-800 rounded-xl p-3 text-center">
          <p className="text-xs text-neutral-400 mb-1">APY</p>
          <p className="text-xl font-bold text-emerald-400">{farm.apy}%</p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-3 text-center">
          <p className="text-xs text-neutral-400 mb-1">APR</p>
          <p className="text-xl font-bold text-white">{farm.apr}%</p>
        </div>
      </div>

      {/* TVL & Daily Rewards */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">TVL</span>
          <span className="text-white font-medium">₩{(farm.tvlKRW / 100000000).toFixed(2)}억</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">일일 보상</span>
          <span className="text-white font-medium">{farm.dailyRewards.toLocaleString()} KAUS</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">보상 토큰</span>
          <div className="flex gap-1">
            {farm.rewardTokens.map((token) => (
              <span key={token} className="text-xs px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-full">
                {token}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Harvest Lockup */}
      {farm.harvestLockup > 0 && (
        <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-xl mb-4">
          <span className="text-amber-400">⏱️</span>
          <span className="text-xs text-amber-400">
            수확 후 {farm.harvestLockup}시간 락업
          </span>
        </div>
      )}

      {/* Deposit Button */}
      <button
        onClick={() => onDeposit?.(farm)}
        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl
          font-bold text-white hover:opacity-90 transition-opacity"
      >
        유동성 추가
      </button>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FARM LIST
// ═══════════════════════════════════════════════════════════════════════════════

interface FarmListProps {
  onDeposit?: (farm: Farm) => void;
}

export function FarmList({ onDeposit }: FarmListProps) {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [sortBy, setSortBy] = useState<'apy' | 'tvl'>('apy');

  useEffect(() => {
    let allFarms = StakingEngine.getFarms();
    if (sortBy === 'tvl') {
      allFarms = allFarms.sort((a, b) => b.tvl - a.tvl);
    }
    setFarms(allFarms);
  }, [sortBy]);

  return (
    <div className="space-y-4">
      {/* Sort Options */}
      <div className="flex justify-end gap-2">
        <span className="text-sm text-neutral-400 py-2">정렬:</span>
        {[
          { id: 'apy', label: 'APY' },
          { id: 'tvl', label: 'TVL' },
        ].map((option) => (
          <button
            key={option.id}
            onClick={() => setSortBy(option.id as 'apy' | 'tvl')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              sortBy === option.id
                ? 'bg-emerald-500 text-white'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Farm Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {farms.map((farm) => (
          <FarmCard key={farm.id} farm={farm} onDeposit={onDeposit} />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER STAKES WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

interface UserStakesWidgetProps {
  stakes?: UserStake[];
  onClaim?: (stake: UserStake) => void;
  onUnstake?: (stake: UserStake) => void;
}

export function UserStakesWidget({ stakes, onClaim, onUnstake }: UserStakesWidgetProps) {
  const [userStakes, setUserStakes] = useState<UserStake[]>([]);

  useEffect(() => {
    if (stakes) {
      setUserStakes(stakes);
    } else {
      const profile = StakingEngine.getUserStakingProfile('0xuser');
      setUserStakes(profile.stakes);
    }
  }, [stakes]);

  if (userStakes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center"
      >
        <span className="text-4xl mb-4 block">🏦</span>
        <p className="text-neutral-400">아직 스테이킹한 자산이 없습니다</p>
        <p className="text-neutral-500 text-sm mt-1">풀을 선택하여 스테이킹을 시작하세요</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden"
    >
      <div className="p-5 border-b border-neutral-800">
        <h3 className="font-bold text-white">내 스테이킹</h3>
      </div>

      <div className="divide-y divide-neutral-800">
        {userStakes.map((stake) => {
          const timeLeft = stake.unlockAt
            ? StakingEngine.getTimeUntilUnlock(stake.unlockAt)
            : null;

          return (
            <div key={stake.id} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-white">{stake.poolName}</p>
                  <p className="text-sm text-neutral-400">
                    {stake.amount.toLocaleString()} KAUS
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-bold">{stake.currentApy}% APY</p>
                  {stake.boostMultiplier > 1 && (
                    <p className="text-xs text-violet-400">x{stake.boostMultiplier} 부스트</p>
                  )}
                </div>
              </div>

              {/* Rewards */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-neutral-800 rounded-xl p-3">
                  <p className="text-xs text-neutral-400 mb-1">획득 보상</p>
                  <p className="text-sm font-bold text-white">
                    {stake.earnedRewards.toLocaleString()} KAUS
                  </p>
                </div>
                <div className="bg-emerald-500/10 rounded-xl p-3">
                  <p className="text-xs text-emerald-400 mb-1">대기 중 보상</p>
                  <p className="text-sm font-bold text-emerald-400">
                    {stake.pendingRewards.toLocaleString()} KAUS
                  </p>
                </div>
              </div>

              {/* Lock Status */}
              {stake.isLocked && timeLeft && !timeLeft.isUnlocked && (
                <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-xl mb-3">
                  <span className="text-amber-400">🔒</span>
                  <span className="text-sm text-amber-400">
                    {timeLeft.days}일 {timeLeft.hours}시간 후 잠금 해제
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => onClaim?.(stake)}
                  disabled={stake.pendingRewards <= 0}
                  className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    stake.pendingRewards > 0
                      ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  보상 수령
                </button>
                <button
                  onClick={() => onUnstake?.(stake)}
                  className="flex-1 py-2.5 bg-neutral-800 text-neutral-300 rounded-xl
                    font-medium text-sm hover:bg-neutral-700 transition-all"
                >
                  {stake.isLocked ? '조기 출금' : '출금'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIER PROGRESS WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

interface TierProgressWidgetProps {
  totalStaked?: number;
}

export function TierProgressWidget({ totalStaked = 15000 }: TierProgressWidgetProps) {
  const progress = StakingEngine.getTierProgress(totalStaked);
  const currentTierInfo = StakingEngine.TIER_CONFIG[progress.currentTier];
  const nextTierInfo = progress.nextTier ? StakingEngine.TIER_CONFIG[progress.nextTier] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden"
    >
      <div className="p-5 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl
            flex items-center justify-center">
            <span className="text-xl">{currentTierInfo.icon}</span>
          </div>
          <div>
            <h3 className="font-bold text-white">스테이킹 티어</h3>
            <p className="text-xs text-neutral-400">Staking Tier</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Current Tier */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{currentTierInfo.icon}</span>
            <div>
              <p className="text-lg font-bold text-white">{currentTierInfo.nameKo}</p>
              <p className="text-sm text-violet-400">x{currentTierInfo.boostMultiplier} APY 부스트</p>
            </div>
          </div>
        </div>

        {/* Progress to Next Tier */}
        {nextTierInfo && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">다음 티어까지</span>
              <span className="text-white">{progress.remaining.toLocaleString()} KAUS</span>
            </div>
            <div className="h-3 bg-neutral-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress.progress}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{currentTierInfo.icon}</span>
                <span className="text-xs text-neutral-400">{currentTierInfo.nameKo}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">{nextTierInfo.nameKo}</span>
                <span className="text-lg">{nextTierInfo.icon}</span>
              </div>
            </div>
          </div>
        )}

        {/* Current Tier Benefits */}
        <div className="mt-5 pt-5 border-t border-neutral-800">
          <p className="text-sm font-medium text-neutral-400 mb-3">현재 혜택</p>
          <div className="space-y-2">
            {currentTierInfo.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                <span className="text-sm text-neutral-300">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAKING STATS WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

export function StakingStatsWidget() {
  const [stats, setStats] = useState<StakingStats | null>(null);

  useEffect(() => {
    setStats(StakingEngine.getStakingStats());
  }, []);

  if (!stats) return null;

  const statItems = [
    { label: 'TVL', value: `₩${(stats.totalValueLockedKRW / 100000000).toFixed(1)}억`, icon: '🏦', color: 'violet' },
    { label: '최고 APY', value: `${stats.highestApy}%`, icon: '🚀', color: 'emerald' },
    { label: '참여자', value: stats.totalParticipants.toLocaleString(), icon: '👥', color: 'blue' },
    { label: '분배 보상', value: `${(stats.totalRewardsDistributed / 1000000).toFixed(1)}M`, icon: '💎', color: 'amber' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-3"
    >
      {statItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="bg-neutral-900 rounded-xl p-4 border border-neutral-800"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{item.icon}</span>
            <span className="text-xs text-neutral-400">{item.label}</span>
          </div>
          <p className="text-xl font-bold text-white">{item.value}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAKING CALCULATOR
// ═══════════════════════════════════════════════════════════════════════════════

export function StakingCalculator() {
  const [amount, setAmount] = useState(10000);
  const [apy, setApy] = useState(25);
  const [days, setDays] = useState(90);
  const [compounding, setCompounding] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');

  const simpleRewards = StakingEngine.estimateRewards(amount, apy, days);
  const compoundedTotal = StakingEngine.calculateCompoundedReturns(amount, apy, days, compounding);
  const compoundedRewards = compoundedTotal - amount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden"
    >
      <div className="p-5 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl
            flex items-center justify-center">
            <span className="text-xl">🧮</span>
          </div>
          <div>
            <h3 className="font-bold text-white">수익 계산기</h3>
            <p className="text-xs text-neutral-400">Reward Calculator</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Amount Input */}
        <div>
          <label className="text-sm text-neutral-400 mb-2 block">스테이킹 금액 (KAUS)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full px-4 py-3 bg-neutral-800 rounded-xl border border-neutral-700
              text-white focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* APY Slider */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-neutral-400">APY</span>
            <span className="text-emerald-400 font-bold">{apy}%</span>
          </div>
          <input
            type="range"
            min="5"
            max="50"
            value={apy}
            onChange={(e) => setApy(Number(e.target.value))}
            className="w-full accent-violet-500"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="text-sm text-neutral-400 mb-2 block">기간 (일)</label>
          <div className="flex gap-2">
            {[30, 90, 180, 365].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  days === d
                    ? 'bg-violet-500 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
              >
                {d === 365 ? '1년' : `${d}일`}
              </button>
            ))}
          </div>
        </div>

        {/* Compounding Frequency */}
        <div>
          <label className="text-sm text-neutral-400 mb-2 block">복리 주기</label>
          <div className="flex gap-2">
            {[
              { id: 'DAILY' as const, label: '일일' },
              { id: 'WEEKLY' as const, label: '주간' },
              { id: 'MONTHLY' as const, label: '월간' },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setCompounding(option.id)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  compounding === option.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-neutral-800">
          <div className="bg-neutral-800 rounded-xl p-4">
            <p className="text-xs text-neutral-400 mb-1">단리 수익</p>
            <p className="text-lg font-bold text-white">
              {Math.round(simpleRewards).toLocaleString()} KAUS
            </p>
            <p className="text-xs text-neutral-500">
              ₩{Math.round(simpleRewards * 120).toLocaleString()}
            </p>
          </div>
          <div className="bg-emerald-500/10 rounded-xl p-4">
            <p className="text-xs text-emerald-400 mb-1">복리 수익</p>
            <p className="text-lg font-bold text-emerald-400">
              {Math.round(compoundedRewards).toLocaleString()} KAUS
            </p>
            <p className="text-xs text-emerald-500">
              ₩{Math.round(compoundedRewards * 120).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Extra Earnings from Compounding */}
        <div className="bg-violet-500/10 rounded-xl p-4 text-center">
          <p className="text-sm text-violet-400">
            복리 효과로 <span className="font-bold">{Math.round(compoundedRewards - simpleRewards).toLocaleString()} KAUS</span> 추가 수익!
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAKING MODAL
// ═══════════════════════════════════════════════════════════════════════════════

interface StakingModalProps {
  pool: StakingPool;
  onStake?: (amount: number) => void;
  onClose?: () => void;
}

export function StakingModal({ pool, onStake, onClose }: StakingModalProps) {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const numAmount = Number(amount) || 0;
  const estimatedRewards = StakingEngine.estimateRewards(numAmount, pool.apy, pool.lockPeriodDays || 30);
  const isValid = numAmount >= pool.minStake && (!pool.maxStake || numAmount <= pool.maxStake);

  const handleStake = async () => {
    if (!isValid) return;
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    onStake?.(numAmount);
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{pool.tokenIcon}</span>
              <div>
                <h2 className="text-xl font-bold text-white">{pool.nameKo}</h2>
                <p className="text-sm text-emerald-400">{pool.apy}% APY</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
            >
              <span className="text-neutral-400">✕</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Amount Input */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-neutral-400">스테이킹 금액</span>
              <span className="text-neutral-400">최소: {pool.minStake.toLocaleString()} KAUS</span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-4 pr-20 bg-neutral-800 rounded-xl border border-neutral-700
                  text-white text-xl font-bold focus:outline-none focus:border-violet-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400">KAUS</span>
            </div>
          </div>

          {/* Pool Info */}
          <div className="bg-neutral-800 rounded-xl p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">락업 기간</span>
              <span className="text-white">{pool.lockPeriodDays === 0 ? '없음' : `${pool.lockPeriodDays}일`}</span>
            </div>
            {pool.earlyUnstakePenalty > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">조기 출금 페널티</span>
                <span className="text-red-400">{pool.earlyUnstakePenalty}%</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">예상 수익 ({pool.lockPeriodDays || 30}일)</span>
              <span className="text-emerald-400">{Math.round(estimatedRewards).toLocaleString()} KAUS</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleStake}
            disabled={!isValid || isSubmitting}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
              isValid && !isSubmitting
                ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:opacity-90'
                : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="inline-block"
              >
                ⏳
              </motion.span>
            ) : (
              '스테이킹 확인'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER PORTFOLIO OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════

export function UserPortfolioOverview() {
  const profile = StakingEngine.getUserStakingProfile('0xuser');
  const tierInfo = StakingEngine.TIER_CONFIG[profile.stakingTier];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-violet-900/50 to-purple-900/50 rounded-2xl border border-violet-500/30 p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{tierInfo.icon}</span>
          <div>
            <p className="text-sm text-neutral-400">스테이킹 포트폴리오</p>
            <p className="text-lg font-bold text-white">{tierInfo.nameKo} 티어</p>
          </div>
        </div>
        <div className="px-3 py-1.5 bg-violet-500/20 rounded-lg">
          <span className="text-violet-400 font-bold">x{profile.boostMultiplier}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-neutral-400 mb-1">총 스테이킹</p>
          <p className="text-xl font-bold text-white">{profile.totalStaked.toLocaleString()} KAUS</p>
          <p className="text-xs text-neutral-500">₩{profile.totalStakedKRW.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-400 mb-1">대기 중 보상</p>
          <p className="text-xl font-bold text-emerald-400">{profile.pendingRewards.toLocaleString()} KAUS</p>
          <p className="text-xs text-emerald-500">수령 가능</p>
        </div>
      </div>
    </motion.div>
  );
}
