'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 57: PRODUCTION STAKING WIDGET
 * ═══════════════════════════════════════════════════════════════════════════════
 * 실제 스테이킹 API 연동 위젯
 * Phase 56 API와 완전 연동
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface StakingPlan {
  id: string;
  name: string;
  nameKo: string;
  lockDays: number;
  apyPercent: number;
  minAmount: number;
  maxAmount: number;
  earlyWithdrawPenalty: number;
  cooldownHours: number;
  description: string;
  exampleEarnings: {
    principal: number;
    daily: number;
    monthly: number;
    yearly: number;
  };
}

interface UserStake {
  id: string;
  planId: string;
  planName: string;
  principal: number;
  apyPercent: number;
  accruedInterest: number;
  status: 'ACTIVE' | 'UNSTAKING' | 'COMPLETED';
  createdAt: string;
  lockedUntil: string | null;
  cooldownEndsAt: string | null;
  canUnstake: boolean;
  canClaim: boolean;
  isEarlyWithdraw: boolean;
  estimatedPenalty: number;
  projectedEarnings: {
    daily: number;
    monthly: number;
    yearly: number;
  };
}

interface StakingStats {
  totalStaked: number;
  totalEarnings: number;
  activeStakes: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

async function fetchStakingPlans(): Promise<StakingPlan[]> {
  try {
    const res = await fetch('/api/kaus/staking');
    const data = await res.json();
    return data.success ? data.plans : [];
  } catch {
    return [];
  }
}

async function fetchUserStakes(userId: string): Promise<{ stakes: UserStake[]; stats: StakingStats }> {
  try {
    const res = await fetch(`/api/kaus/staking?userId=${userId}`);
    const data = await res.json();
    if (data.success) {
      return {
        stakes: data.stakes || [],
        stats: data.stats || { totalStaked: 0, totalEarnings: 0, activeStakes: 0 },
      };
    }
    return { stakes: [], stats: { totalStaked: 0, totalEarnings: 0, activeStakes: 0 } };
  } catch {
    return { stakes: [], stats: { totalStaked: 0, totalEarnings: 0, activeStakes: 0 } };
  }
}

async function stakeKaus(userId: string, planId: string, amount: number) {
  const res = await fetch('/api/kaus/staking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'stake', userId, planId, amount }),
  });
  return res.json();
}

async function unstakeKaus(userId: string, stakeId: string) {
  const res = await fetch('/api/kaus/staking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'unstake', userId, stakeId }),
  });
  return res.json();
}

async function claimStake(userId: string, stakeId: string) {
  const res = await fetch('/api/kaus/staking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'claim', userId, stakeId }),
  });
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN STAKING WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

interface StakingWidgetProps {
  userId?: string;
  userBalance?: number;
  onBalanceChange?: () => void;
}

export function StakingWidget({ userId, userBalance = 0, onBalanceChange }: StakingWidgetProps) {
  const [plans, setPlans] = useState<StakingPlan[]>([]);
  const [stakes, setStakes] = useState<UserStake[]>([]);
  const [stats, setStats] = useState<StakingStats>({ totalStaked: 0, totalEarnings: 0, activeStakes: 0 });
  const [selectedPlan, setSelectedPlan] = useState<StakingPlan | null>(null);
  const [stakeAmount, setStakeAmount] = useState<number>(1000);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'stake' | 'mystakes'>('stake');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    const plansData = await fetchStakingPlans();
    setPlans(plansData);

    if (userId) {
      const { stakes: userStakes, stats: userStats } = await fetchUserStakes(userId);
      setStakes(userStakes);
      setStats(userStats);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [loadData]);

  // Handle stake
  const handleStake = async () => {
    if (!selectedPlan || !userId) {
      setMessage({ type: 'error', text: '로그인이 필요합니다' });
      return;
    }

    if (stakeAmount < selectedPlan.minAmount) {
      setMessage({ type: 'error', text: `최소 ${selectedPlan.minAmount.toLocaleString()} KAUS 이상 스테이킹 가능합니다` });
      return;
    }

    if (stakeAmount > userBalance) {
      setMessage({ type: 'error', text: '잔액이 부족합니다' });
      return;
    }

    setIsLoading(true);
    try {
      const result = await stakeKaus(userId, selectedPlan.id, stakeAmount);
      if (result.success) {
        setMessage({ type: 'success', text: `${stakeAmount.toLocaleString()} KAUS 스테이킹 완료! APY ${selectedPlan.apyPercent}%` });
        setSelectedPlan(null);
        setStakeAmount(1000);
        loadData();
        onBalanceChange?.();
      } else {
        setMessage({ type: 'error', text: result.error || '스테이킹 실패' });
      }
    } catch {
      setMessage({ type: 'error', text: '네트워크 오류' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle unstake
  const handleUnstake = async (stakeId: string) => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const result = await unstakeKaus(userId, stakeId);
      if (result.success) {
        if (result.cooldownEndsAt) {
          setMessage({ type: 'success', text: `언스테이킹 요청 완료. 쿨다운 후 클레임 가능합니다.` });
        } else {
          setMessage({ type: 'success', text: '즉시 출금 완료!' });
          onBalanceChange?.();
        }
        loadData();
      } else {
        setMessage({ type: 'error', text: result.error || '언스테이킹 실패' });
      }
    } catch {
      setMessage({ type: 'error', text: '네트워크 오류' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle claim
  const handleClaim = async (stakeId: string) => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const result = await claimStake(userId, stakeId);
      if (result.success) {
        setMessage({ type: 'success', text: `${result.returnedAmount?.toFixed(2)} KAUS 클레임 완료!` });
        loadData();
        onBalanceChange?.();
      } else {
        setMessage({ type: 'error', text: result.error || '클레임 실패' });
      }
    } catch {
      setMessage({ type: 'error', text: '네트워크 오류' });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate projected earnings
  const getProjectedEarnings = (amount: number, apyPercent: number) => {
    const dailyRate = apyPercent / 100 / 365;
    return {
      daily: amount * dailyRate,
      monthly: amount * dailyRate * 30,
      yearly: amount * apyPercent / 100,
    };
  };

  // Format time remaining
  const formatTimeRemaining = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    if (diff <= 0) return '완료';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}일 ${hours % 24}시간`;
    return `${hours}시간`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-[#171717]/10 overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-[#171717] to-[#2a2a2a] text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold">KAUS Staking</h3>
            <p className="text-sm text-white/60">최대 25% APY 수익</p>
          </div>
          <div className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-sm font-bold">
            LIVE
          </div>
        </div>

        {/* Stats */}
        {userId && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-amber-400">{stats.totalStaked.toLocaleString()}</div>
              <div className="text-xs text-white/50">총 스테이킹</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-emerald-400">{stats.totalEarnings.toFixed(2)}</div>
              <div className="text-xs text-white/50">누적 수익</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-xl font-bold">{stats.activeStakes}</div>
              <div className="text-xs text-white/50">활성 스테이크</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#171717]/10">
        <button
          onClick={() => setActiveTab('stake')}
          className={`flex-1 py-3 text-sm font-bold transition-colors ${
            activeTab === 'stake'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-[#171717]/50 hover:text-[#171717]'
          }`}
        >
          스테이킹
        </button>
        <button
          onClick={() => setActiveTab('mystakes')}
          className={`flex-1 py-3 text-sm font-bold transition-colors ${
            activeTab === 'mystakes'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-[#171717]/50 hover:text-[#171717]'
          }`}
        >
          내 스테이크 {stakes.length > 0 && `(${stakes.length})`}
        </button>
      </div>

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`px-4 py-3 text-sm font-medium ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {message.text}
            <button
              onClick={() => setMessage(null)}
              className="float-right font-bold opacity-50 hover:opacity-100"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'stake' ? (
          <>
            {/* Plan Selection */}
            <div className="space-y-3 mb-6">
              {plans.map((plan) => {
                const isSelected = selectedPlan?.id === plan.id;
                const projected = getProjectedEarnings(stakeAmount, plan.apyPercent);

                return (
                  <motion.div
                    key={plan.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedPlan(isSelected ? null : plan)}
                    className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-transparent bg-[#171717]/5 hover:bg-[#171717]/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#171717]">{plan.nameKo}</span>
                          {plan.lockDays === 0 && (
                            <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded text-xs font-bold">
                              자유출금
                            </span>
                          )}
                          {plan.id === '365days' && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-bold">
                              BEST
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#171717]/50 mt-1">
                          {plan.lockDays > 0 ? `${plan.lockDays}일 락업` : '락업 없음'} • 최소 {plan.minAmount.toLocaleString()} KAUS
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-black ${isSelected ? 'text-emerald-600' : 'text-[#171717]'}`}>
                          {plan.apyPercent}%
                        </div>
                        <div className="text-xs text-[#171717]/50">APY</div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-4 pt-4 border-t border-emerald-200"
                        >
                          <div className="text-xs text-[#171717]/60 mb-2">
                            {stakeAmount.toLocaleString()} KAUS 예상 수익
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-white rounded-lg p-2 text-center">
                              <div className="font-bold text-emerald-600">{projected.daily.toFixed(2)}</div>
                              <div className="text-[10px] text-[#171717]/50">일간</div>
                            </div>
                            <div className="bg-white rounded-lg p-2 text-center">
                              <div className="font-bold text-emerald-600">{projected.monthly.toFixed(1)}</div>
                              <div className="text-[10px] text-[#171717]/50">월간</div>
                            </div>
                            <div className="bg-white rounded-lg p-2 text-center">
                              <div className="font-bold text-emerald-600">{projected.yearly.toFixed(0)}</div>
                              <div className="text-[10px] text-[#171717]/50">연간</div>
                            </div>
                          </div>

                          {plan.earlyWithdrawPenalty > 0 && (
                            <div className="mt-2 text-xs text-orange-600">
                              ⚠️ 조기출금 시 {plan.earlyWithdrawPenalty}% 페널티
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Stake Form */}
            {selectedPlan && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-[#171717]/5 rounded-xl"
              >
                <label className="text-xs text-[#171717]/60 mb-2 block">스테이킹 수량 (KAUS)</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(Number(e.target.value))}
                    min={selectedPlan.minAmount}
                    max={Math.min(selectedPlan.maxAmount, userBalance)}
                    className="flex-1 p-3 bg-white border border-[#171717]/10 rounded-xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex gap-2 mb-4">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setStakeAmount(Math.floor(userBalance * pct / 100))}
                      className="flex-1 py-2 text-xs font-bold bg-white border border-[#171717]/10 rounded-lg hover:bg-[#171717]/5"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm text-[#171717]/60 mb-4">
                  <span>보유 잔액</span>
                  <span className="font-bold text-[#171717]">{userBalance.toLocaleString()} KAUS</span>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStake}
                  disabled={isLoading || stakeAmount < selectedPlan.minAmount || stakeAmount > userBalance}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        ⏳
                      </motion.span>
                      처리 중...
                    </span>
                  ) : (
                    `${stakeAmount.toLocaleString()} KAUS 스테이킹`
                  )}
                </motion.button>
              </motion.div>
            )}
          </>
        ) : (
          <>
            {/* My Stakes */}
            {stakes.length === 0 ? (
              <div className="text-center py-12 text-[#171717]/40">
                <div className="text-4xl mb-2">📊</div>
                <div>스테이킹 내역이 없습니다</div>
                <button
                  onClick={() => setActiveTab('stake')}
                  className="mt-4 text-sm text-emerald-600 font-bold hover:underline"
                >
                  스테이킹 시작하기 →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {stakes.map((stake) => (
                  <div
                    key={stake.id}
                    className={`p-4 rounded-xl border ${
                      stake.status === 'ACTIVE'
                        ? 'bg-emerald-50 border-emerald-200'
                        : stake.status === 'UNSTAKING'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{stake.planName}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            stake.status === 'ACTIVE'
                              ? 'bg-emerald-500 text-white'
                              : stake.status === 'UNSTAKING'
                              ? 'bg-amber-500 text-white'
                              : 'bg-gray-500 text-white'
                          }`}>
                            {stake.status === 'ACTIVE' ? '활성' : stake.status === 'UNSTAKING' ? '출금중' : '완료'}
                          </span>
                        </div>
                        <div className="text-xs text-[#171717]/50 mt-1">
                          {new Date(stake.createdAt).toLocaleDateString('ko-KR')} 시작
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{stake.principal.toLocaleString()} KAUS</div>
                        <div className="text-xs text-emerald-600">+{stake.accruedInterest.toFixed(4)} 이자</div>
                      </div>
                    </div>

                    {/* Progress / Status */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                      <div className="bg-white rounded-lg p-2">
                        <div className="font-bold text-emerald-600">{stake.apyPercent}%</div>
                        <div className="text-[#171717]/50">APY</div>
                      </div>
                      <div className="bg-white rounded-lg p-2">
                        <div className="font-bold">{stake.projectedEarnings.daily.toFixed(2)}</div>
                        <div className="text-[#171717]/50">일 수익</div>
                      </div>
                      <div className="bg-white rounded-lg p-2">
                        <div className="font-bold">
                          {stake.lockedUntil
                            ? formatTimeRemaining(stake.lockedUntil)
                            : stake.cooldownEndsAt
                            ? formatTimeRemaining(stake.cooldownEndsAt)
                            : '-'}
                        </div>
                        <div className="text-[#171717]/50">
                          {stake.cooldownEndsAt ? '쿨다운' : '락업'}
                        </div>
                      </div>
                    </div>

                    {/* Early withdraw warning */}
                    {stake.isEarlyWithdraw && stake.status === 'ACTIVE' && (
                      <div className="text-xs text-orange-600 mb-3">
                        ⚠️ 조기출금 시 {stake.estimatedPenalty.toFixed(2)} KAUS 페널티
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {stake.canUnstake && (
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleUnstake(stake.id)}
                          disabled={isLoading}
                          className="flex-1 py-2 text-sm font-bold bg-amber-500 text-white rounded-lg disabled:opacity-50"
                        >
                          언스테이킹
                        </motion.button>
                      )}
                      {stake.canClaim && (
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleClaim(stake.id)}
                          disabled={isLoading}
                          className="flex-1 py-2 text-sm font-bold bg-emerald-500 text-white rounded-lg disabled:opacity-50"
                        >
                          클레임 ({(stake.principal + stake.accruedInterest).toFixed(2)} KAUS)
                        </motion.button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-[#171717]/5 flex items-center justify-center gap-2 text-xs text-[#171717]/40">
        <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span>Physical Asset Backed • 영동 100,000평 실물 담보</span>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPACT STAKING CARD (for sidebar/summary)
// ═══════════════════════════════════════════════════════════════════════════════

interface StakingCardProps {
  userId?: string;
}

export function StakingCard({ userId }: StakingCardProps) {
  const [stats, setStats] = useState<StakingStats>({ totalStaked: 0, totalEarnings: 0, activeStakes: 0 });
  const [topApy, setTopApy] = useState(25);

  useEffect(() => {
    async function load() {
      const plans = await fetchStakingPlans();
      if (plans.length > 0) {
        setTopApy(Math.max(...plans.map(p => p.apyPercent)));
      }

      if (userId) {
        const { stats: userStats } = await fetchUserStakes(userId);
        setStats(userStats);
      }
    }
    load();
  }, [userId]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl p-4 text-white"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-lg">📈</span>
          </div>
          <div>
            <div className="font-bold text-sm">KAUS Staking</div>
            <div className="text-xs text-white/70">Up to {topApy}% APY</div>
          </div>
        </div>
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-3 h-3 bg-white rounded-full"
        />
      </div>

      {userId && stats.totalStaked > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <div className="font-bold">{stats.totalStaked.toLocaleString()}</div>
            <div className="text-[10px] text-white/60">Staked</div>
          </div>
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <div className="font-bold text-amber-300">+{stats.totalEarnings.toFixed(2)}</div>
            <div className="text-[10px] text-white/60">Earned</div>
          </div>
        </div>
      )}

      <a
        href="/nexus/exchange#staking"
        className="block text-center py-2 bg-white/20 rounded-lg text-sm font-bold hover:bg-white/30 transition-colors"
      >
        {stats.totalStaked > 0 ? '스테이킹 관리 →' : '스테이킹 시작 →'}
      </a>
    </motion.div>
  );
}
