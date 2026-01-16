/**
 * K-UNIVERSAL Wallet Transaction History Page
 * 거래 내역 조회 및 필터링
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  ArrowLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  Filter,
  Calendar,
  ChevronDown,
  Search,
  CreditCard,
  Smartphone,
  Building2,
  X,
  TrendingUp,
  TrendingDown,
  Receipt,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

// ============================================
// Types
// ============================================

interface Transaction {
  id: string;
  payment_key: string;
  order_id: string;
  amount: number;
  status: 'DONE' | 'PENDING' | 'CANCELED' | 'FAILED';
  method: string;
  created_at: string;
}

interface TransactionSummary {
  monthlyTopup: number;
  monthlySpent: number;
  transactionCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type FilterType = 'all' | 'topup' | 'payment' | 'refund';

// ============================================
// Helper Functions
// ============================================

const getMethodIcon = (method: string) => {
  if (['CARD'].includes(method)) return CreditCard;
  if (['EASY_PAY', 'TOSSPAY', 'KAKAOPAY', 'NAVERPAY'].includes(method)) return Smartphone;
  if (['TRANSFER', 'VIRTUAL_ACCOUNT'].includes(method)) return Building2;
  return Receipt;
};

const getMethodLabel = (method: string, locale: string): string => {
  const labels: Record<string, { ko: string; en: string }> = {
    CARD: { ko: '카드', en: 'Card' },
    EASY_PAY: { ko: '간편결제', en: 'Easy Pay' },
    TRANSFER: { ko: '계좌이체', en: 'Transfer' },
    VIRTUAL_ACCOUNT: { ko: '가상계좌', en: 'Virtual Account' },
    QR_PAYMENT: { ko: 'QR 결제', en: 'QR Payment' },
    PAYMENT: { ko: '결제', en: 'Payment' },
    REFUND: { ko: '환불', en: 'Refund' },
  };
  return labels[method]?.[locale === 'ko' ? 'ko' : 'en'] || method;
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'DONE': return 'text-green-400';
    case 'PENDING': return 'text-yellow-400';
    case 'CANCELED': return 'text-gray-400';
    case 'FAILED': return 'text-red-400';
    default: return 'text-white/60';
  }
};

const getStatusLabel = (status: string, locale: string): string => {
  const labels: Record<string, { ko: string; en: string }> = {
    DONE: { ko: '완료', en: 'Done' },
    PENDING: { ko: '대기중', en: 'Pending' },
    CANCELED: { ko: '취소됨', en: 'Canceled' },
    FAILED: { ko: '실패', en: 'Failed' },
  };
  return labels[status]?.[locale === 'ko' ? 'ko' : 'en'] || status;
};

const isIncome = (method: string): boolean => {
  return ['CARD', 'EASY_PAY', 'TRANSFER', 'VIRTUAL_ACCOUNT', 'TOSSPAY', 'KAKAOPAY', 'NAVERPAY', 'REFUND'].includes(method);
};

const formatDate = (dateString: string, locale: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateGroup = (dateString: string, locale: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return locale === 'ko' ? '오늘' : 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return locale === 'ko' ? '어제' : 'Yesterday';
  }
  return date.toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', {
    month: 'long',
    day: 'numeric',
  });
};

// ============================================
// Main Component
// ============================================

export default function TransactionsPage() {
  const locale = useLocale();
  const { wallet } = useAuthStore();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Demo user ID (replace with actual auth)
  const userId = 'demo-user-id';

  // Fetch transactions
  const fetchTransactions = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        userId,
        type: filter,
        page: page.toString(),
        limit: '20',
      });

      const response = await fetch(`/api/wallet/transactions?${params}`);
      const data = await response.json();

      if (data.success) {
        setTransactions(data.transactions);
        setSummary(data.summary);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter, userId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Group transactions by date
  const groupedTransactions = transactions.reduce((groups, tx) => {
    const dateKey = new Date(tx.created_at).toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(tx);
    return groups;
  }, {} as Record<string, Transaction[]>);

  // Filter labels
  const filterLabels: Record<FilterType, { ko: string; en: string }> = {
    all: { ko: '전체', en: 'All' },
    topup: { ko: '충전', en: 'Top-up' },
    payment: { ko: '결제', en: 'Payment' },
    refund: { ko: '환불', en: 'Refund' },
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href={`/${locale}/wallet`}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>
          </Link>
          <div className="flex-1">
            <h1 className="text-white font-bold text-lg">
              {locale === 'ko' ? '거래 내역' : 'Transaction History'}
            </h1>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => fetchTransactions()}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-white/50 ${isLoading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-32">
        {/* Summary Cards */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-6"
        >
          <div className="grid grid-cols-2 gap-3">
            {/* Monthly Top-up */}
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-2xl p-4 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-white/60 text-xs">
                  {locale === 'ko' ? '이번 달 충전' : 'Monthly Top-up'}
                </span>
              </div>
              <p className="text-xl font-bold text-white">
                +₩{(summary?.monthlyTopup || 0).toLocaleString()}
              </p>
            </div>

            {/* Monthly Spent */}
            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/10 rounded-2xl p-4 border border-orange-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-orange-400" />
                <span className="text-white/60 text-xs">
                  {locale === 'ko' ? '이번 달 사용' : 'Monthly Spent'}
                </span>
              </div>
              <p className="text-xl font-bold text-white">
                -₩{(summary?.monthlySpent || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </motion.section>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 mb-4">
          {/* Filter Chips */}
          <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide">
            {(Object.keys(filterLabels) as FilterType[]).map((key) => (
              <motion.button
                key={key}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === key
                    ? 'bg-[#3B82F6] text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {filterLabels[key][locale === 'ko' ? 'ko' : 'en']}
              </motion.button>
            ))}
          </div>

          {/* More Filters */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilterModal(true)}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Filter className="w-5 h-5 text-white/50" />
          </motion.button>
        </div>

        {/* Search (Optional) */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={locale === 'ko' ? '거래 검색...' : 'Search transactions...'}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#3B82F6] text-sm"
          />
        </div>

        {/* Transaction List */}
        <div className="space-y-6">
          {isLoading ? (
            // Loading Skeleton
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 w-24 bg-white/10 rounded mb-3" />
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                      <div className="w-10 h-10 bg-white/10 rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 w-32 bg-white/10 rounded mb-2" />
                        <div className="h-3 w-20 bg-white/10 rounded" />
                      </div>
                      <div className="h-5 w-24 bg-white/10 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            // Empty State
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                <Receipt className="w-10 h-10 text-white/20" />
              </div>
              <h3 className="text-white font-semibold mb-2">
                {locale === 'ko' ? '거래 내역이 없습니다' : 'No transactions yet'}
              </h3>
              <p className="text-white/40 text-sm mb-6">
                {locale === 'ko'
                  ? '첫 충전을 해보세요!'
                  : 'Make your first top-up!'}
              </p>
              <Link href={`/${locale}/wallet`}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] rounded-xl text-white font-medium"
                >
                  {locale === 'ko' ? '지갑으로 가기' : 'Go to Wallet'}
                </motion.button>
              </Link>
            </motion.div>
          ) : (
            // Transaction Groups
            <AnimatePresence>
              {Object.entries(groupedTransactions).map(([dateKey, txs], groupIdx) => (
                <motion.div
                  key={dateKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIdx * 0.1 }}
                >
                  {/* Date Header */}
                  <h3 className="text-white/40 text-sm font-medium mb-3 px-1">
                    {formatDateGroup(txs[0].created_at, locale)}
                  </h3>

                  {/* Transactions */}
                  <div className="space-y-2">
                    {txs.map((tx, idx) => {
                      const Icon = getMethodIcon(tx.method);
                      const income = isIncome(tx.method);

                      return (
                        <motion.div
                          key={tx.id || idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          {/* Icon */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            income ? 'bg-green-500/20' : 'bg-orange-500/20'
                          }`}>
                            {income ? (
                              <ArrowDownCircle className="w-5 h-5 text-green-400" />
                            ) : (
                              <ArrowUpCircle className="w-5 h-5 text-orange-400" />
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">
                              {getMethodLabel(tx.method, locale)}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-white/40 text-xs">
                                {formatDate(tx.created_at, locale)}
                              </span>
                              <span className={`text-xs ${getStatusColor(tx.status)}`}>
                                {getStatusLabel(tx.status, locale)}
                              </span>
                            </div>
                          </div>

                          {/* Amount */}
                          <p className={`font-bold ${income ? 'text-green-400' : 'text-white'}`}>
                            {income ? '+' : '-'}₩{tx.amount.toLocaleString()}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map((page) => (
              <motion.button
                key={page}
                whileTap={{ scale: 0.95 }}
                onClick={() => fetchTransactions(page)}
                className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                  pagination.page === page
                    ? 'bg-[#3B82F6] text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {page}
              </motion.button>
            ))}
          </div>
        )}
      </main>

      {/* Filter Modal */}
      <AnimatePresence>
        {showFilterModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilterModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="relative w-full max-w-lg bg-[#12121A] rounded-t-3xl border-t border-white/10 p-6 pb-safe"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold text-lg">
                  {locale === 'ko' ? '필터' : 'Filters'}
                </h3>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/50" />
                </button>
              </div>

              {/* Date Range */}
              <div className="mb-6">
                <label className="text-white/60 text-sm mb-2 block">
                  {locale === 'ko' ? '기간' : 'Date Range'}
                </label>
                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/60 text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {locale === 'ko' ? '시작일' : 'Start Date'}
                  </button>
                  <button className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/60 text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {locale === 'ko' ? '종료일' : 'End Date'}
                  </button>
                </div>
              </div>

              {/* Quick Date Options */}
              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  { label: locale === 'ko' ? '오늘' : 'Today', days: 0 },
                  { label: locale === 'ko' ? '이번 주' : 'This Week', days: 7 },
                  { label: locale === 'ko' ? '이번 달' : 'This Month', days: 30 },
                  { label: locale === 'ko' ? '3개월' : '3 Months', days: 90 },
                ].map((option) => (
                  <button
                    key={option.days}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/60 text-sm hover:bg-white/10 transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Apply Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFilterModal(false)}
                className="w-full py-4 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] rounded-xl text-white font-bold"
              >
                {locale === 'ko' ? '적용하기' : 'Apply Filters'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
