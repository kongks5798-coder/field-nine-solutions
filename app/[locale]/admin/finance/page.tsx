'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 58: ADMIN FINANCE DASHBOARD
 * ═══════════════════════════════════════════════════════════════════════════════
 * 출금 승인, 스테이킹 모니터링, 거래 감사
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface WithdrawalRequest {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  fiatAmount: number;
  bankName: string;
  accountNumber: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  createdAt: string;
  userBalance: number;
}

interface StakingOverview {
  totalStaked: number;
  totalInterestPaid: number;
  activeStakes: number;
  unstakingCount: number;
  dailyInterestDue: number;
  planBreakdown: {
    planId: string;
    planName: string;
    count: number;
    totalPrincipal: number;
    avgApy: number;
  }[];
}

interface FinanceStats {
  totalKausSupply: number;
  totalKausCirculating: number;
  totalWithdrawals24h: number;
  totalDeposits24h: number;
  pendingWithdrawals: number;
  pendingWithdrawalAmount: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

async function fetchPendingWithdrawals(): Promise<WithdrawalRequest[]> {
  try {
    const res = await fetch('/api/admin/withdrawals?status=PENDING');
    const data = await res.json();
    return data.success ? data.withdrawals : [];
  } catch {
    return [];
  }
}

async function fetchStakingOverview(): Promise<StakingOverview | null> {
  try {
    const res = await fetch('/api/kaus/staking/cron');
    const data = await res.json();
    if (data.success) {
      return {
        totalStaked: data.stats?.totalPrincipal || 0,
        totalInterestPaid: 0,
        activeStakes: data.stats?.activeStakes || 0,
        unstakingCount: data.stats?.unstakingStakes || 0,
        dailyInterestDue: data.stats?.totalAccruedInterest || 0,
        planBreakdown: [],
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchFinanceStats(): Promise<FinanceStats> {
  try {
    const res = await fetch('/api/admin/finance/stats');
    const data = await res.json();
    return data.success ? data.stats : getDefaultStats();
  } catch {
    return getDefaultStats();
  }
}

function getDefaultStats(): FinanceStats {
  return {
    totalKausSupply: 10000000000,
    totalKausCirculating: 0,
    totalWithdrawals24h: 0,
    totalDeposits24h: 0,
    pendingWithdrawals: 0,
    pendingWithdrawalAmount: 0,
  };
}

async function approveWithdrawal(withdrawalId: string, adminId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/kaus/withdraw/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', withdrawalId, adminId }),
    });
    return res.json();
  } catch {
    return { success: false, error: 'Network error' };
  }
}

async function rejectWithdrawal(withdrawalId: string, adminId: string, reason: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/kaus/withdraw/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', withdrawalId, adminId, reason }),
    });
    return res.json();
  } catch {
    return { success: false, error: 'Network error' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function AdminFinancePage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [stakingOverview, setStakingOverview] = useState<StakingOverview | null>(null);
  const [stats, setStats] = useState<FinanceStats>(getDefaultStats());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'withdrawals' | 'staking'>('overview');

  const ADMIN_ID = 'admin-001'; // TODO: Get from auth

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [withdrawalsData, stakingData, statsData] = await Promise.all([
      fetchPendingWithdrawals(),
      fetchStakingOverview(),
      fetchFinanceStats(),
    ]);
    setWithdrawals(withdrawalsData);
    setStakingOverview(stakingData);
    setStats(statsData);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Handle approve
  const handleApprove = async (withdrawal: WithdrawalRequest) => {
    setActionLoading(true);
    const result = await approveWithdrawal(withdrawal.id, ADMIN_ID);
    if (result.success) {
      setMessage({ type: 'success', text: `출금 승인 완료: ${withdrawal.amount.toLocaleString()} KAUS` });
      loadData();
    } else {
      setMessage({ type: 'error', text: result.error || '승인 실패' });
    }
    setActionLoading(false);
    setSelectedWithdrawal(null);
  };

  // Handle reject
  const handleReject = async () => {
    if (!selectedWithdrawal || !rejectReason) return;
    setActionLoading(true);
    const result = await rejectWithdrawal(selectedWithdrawal.id, ADMIN_ID, rejectReason);
    if (result.success) {
      setMessage({ type: 'success', text: '출금 거절 완료' });
      loadData();
    } else {
      setMessage({ type: 'error', text: result.error || '거절 실패' });
    }
    setActionLoading(false);
    setSelectedWithdrawal(null);
    setRejectReason('');
  };

  // Format currency
  const formatKRW = (amount: number) => `₩${amount.toLocaleString()}`;
  const formatKAUS = (amount: number) => `${amount.toLocaleString()} KAUS`;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Finance Command Center</h1>
            <p className="text-gray-400">출금 승인 • 스테이킹 모니터링 • 재무 감사</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isLoading ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
              <span className="text-sm">{isLoading ? '로딩...' : 'LIVE'}</span>
            </div>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              새로고침
            </button>
          </div>
        </div>
      </div>

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`max-w-7xl mx-auto mb-6 p-4 rounded-xl ${
              message.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-red-500/20 border border-red-500/50'
            }`}
          >
            {message.text}
            <button onClick={() => setMessage(null)} className="float-right font-bold">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['overview', 'withdrawals', 'staking'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl font-bold transition-colors ${
                activeTab === tab
                  ? 'bg-white text-black'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {tab === 'overview' ? '대시보드' : tab === 'withdrawals' ? `출금 대기 (${withdrawals.length})` : '스테이킹'}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6"
              >
                <div className="text-gray-400 text-sm mb-2">총 KAUS 공급량</div>
                <div className="text-3xl font-bold text-amber-400">{(stats.totalKausSupply / 1e9).toFixed(1)}B</div>
                <div className="text-xs text-gray-500 mt-2">100억 KAUS</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6"
              >
                <div className="text-gray-400 text-sm mb-2">유통량</div>
                <div className="text-3xl font-bold">{formatKAUS(stats.totalKausCirculating)}</div>
                <div className="text-xs text-gray-500 mt-2">{((stats.totalKausCirculating / stats.totalKausSupply) * 100).toFixed(4)}%</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6"
              >
                <div className="text-gray-400 text-sm mb-2">24h 입금</div>
                <div className="text-3xl font-bold text-emerald-400">{formatKAUS(stats.totalDeposits24h)}</div>
                <div className="text-xs text-gray-500 mt-2">KAUS 구매</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6"
              >
                <div className="text-gray-400 text-sm mb-2">24h 출금</div>
                <div className="text-3xl font-bold text-red-400">{formatKAUS(stats.totalWithdrawals24h)}</div>
                <div className="text-xs text-gray-500 mt-2">출금 완료</div>
              </motion.div>
            </div>

            {/* Pending Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pending Withdrawals */}
              <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">대기 중인 출금</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    withdrawals.length > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {withdrawals.length}건
                  </span>
                </div>
                {withdrawals.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">✅</div>
                    <div>처리 대기 중인 출금이 없습니다</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {withdrawals.slice(0, 3).map((w) => (
                      <div key={w.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                        <div>
                          <div className="font-bold">{formatKAUS(w.amount)}</div>
                          <div className="text-xs text-gray-400">{w.userEmail}</div>
                        </div>
                        <button
                          onClick={() => setActiveTab('withdrawals')}
                          className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded text-sm font-bold"
                        >
                          처리
                        </button>
                      </div>
                    ))}
                    {withdrawals.length > 3 && (
                      <button
                        onClick={() => setActiveTab('withdrawals')}
                        className="w-full py-2 text-sm text-gray-400 hover:text-white"
                      >
                        +{withdrawals.length - 3}건 더보기
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Staking Summary */}
              <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">스테이킹 현황</h3>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-bold">
                    {stakingOverview?.activeStakes || 0}개 활성
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">총 스테이킹</span>
                    <span className="font-bold">{formatKAUS(stakingOverview?.totalStaked || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">일일 이자 지급 예정</span>
                    <span className="font-bold text-emerald-400">{formatKAUS(stakingOverview?.dailyInterestDue || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">언스테이킹 중</span>
                    <span className="font-bold text-amber-400">{stakingOverview?.unstakingCount || 0}건</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawals Tab */}
        {activeTab === 'withdrawals' && (
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-6">출금 요청 관리</h3>

            {withdrawals.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">✅</div>
                <div className="text-xl">처리 대기 중인 출금이 없습니다</div>
              </div>
            ) : (
              <div className="space-y-4">
                {withdrawals.map((withdrawal) => (
                  <motion.div
                    key={withdrawal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-white/5 rounded-xl border border-white/10"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold">{formatKAUS(withdrawal.amount)}</span>
                          <span className="text-gray-400">({formatKRW(withdrawal.fiatAmount)})</span>
                        </div>
                        <div className="text-sm text-gray-400">
                          <span className="font-bold">{withdrawal.userEmail}</span>
                          <span className="mx-2">•</span>
                          <span>잔액: {formatKAUS(withdrawal.userBalance)}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {withdrawal.bankName} {withdrawal.accountNumber}
                        </div>
                        <div className="text-xs text-gray-600">
                          요청일: {new Date(withdrawal.createdAt).toLocaleString('ko-KR')}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(withdrawal)}
                          disabled={actionLoading}
                          className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 disabled:opacity-50"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => setSelectedWithdrawal(withdrawal)}
                          disabled={actionLoading}
                          className="px-6 py-3 bg-red-500/20 text-red-400 font-bold rounded-xl hover:bg-red-500/30 disabled:opacity-50"
                        >
                          거절
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Staking Tab */}
        {activeTab === 'staking' && (
          <div className="space-y-6">
            {/* Staking Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6">
                <div className="text-gray-400 text-sm mb-2">총 스테이킹</div>
                <div className="text-3xl font-bold text-amber-400">{formatKAUS(stakingOverview?.totalStaked || 0)}</div>
              </div>
              <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6">
                <div className="text-gray-400 text-sm mb-2">활성 스테이크</div>
                <div className="text-3xl font-bold">{stakingOverview?.activeStakes || 0}</div>
              </div>
              <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6">
                <div className="text-gray-400 text-sm mb-2">누적 이자 지급</div>
                <div className="text-3xl font-bold text-emerald-400">{formatKAUS(stakingOverview?.totalInterestPaid || 0)}</div>
              </div>
              <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6">
                <div className="text-gray-400 text-sm mb-2">언스테이킹 대기</div>
                <div className="text-3xl font-bold text-red-400">{stakingOverview?.unstakingCount || 0}</div>
              </div>
            </div>

            {/* Run Cron Button */}
            <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">이자 계산 크론</h3>
              <p className="text-gray-400 mb-4">수동으로 이자 계산 크론을 실행합니다. 일반적으로 매일 자동 실행됩니다.</p>
              <button
                onClick={async () => {
                  setActionLoading(true);
                  try {
                    const res = await fetch('/api/kaus/staking/cron', {
                      method: 'POST',
                      headers: { 'x-cron-secret': 'manual-trigger' },
                    });
                    const data = await res.json();
                    if (data.success) {
                      setMessage({
                        type: 'success',
                        text: `크론 완료: ${data.results?.interestUpdated || 0}개 업데이트, ${data.results?.cooldownProcessed || 0}개 쿨다운 처리`,
                      });
                    } else {
                      setMessage({ type: 'error', text: data.error || '크론 실행 실패' });
                    }
                  } catch {
                    setMessage({ type: 'error', text: '네트워크 오류' });
                  }
                  setActionLoading(false);
                }}
                disabled={actionLoading}
                className="px-6 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 disabled:opacity-50"
              >
                {actionLoading ? '실행 중...' : '이자 계산 실행'}
              </button>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        <AnimatePresence>
          {selectedWithdrawal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
              onClick={() => setSelectedWithdrawal(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold mb-4">출금 거절</h3>
                <p className="text-gray-400 mb-4">
                  {selectedWithdrawal.userEmail}님의 {formatKAUS(selectedWithdrawal.amount)} 출금 요청을 거절합니다.
                </p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="거절 사유를 입력하세요..."
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white mb-4 min-h-[100px]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedWithdrawal(null)}
                    className="flex-1 py-3 bg-white/10 rounded-xl font-bold hover:bg-white/20"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={!rejectReason || actionLoading}
                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 disabled:opacity-50"
                  >
                    거절 확인
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 py-8">
          <div>KAUS Finance Admin v1.0.0</div>
          <div className="mt-1">Phase 58 • {new Date().toLocaleDateString('ko-KR')}</div>
        </div>
      </div>
    </div>
  );
}
