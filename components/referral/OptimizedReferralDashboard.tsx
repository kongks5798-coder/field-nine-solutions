/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 55: OPTIMIZED REFERRAL DASHBOARD
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 1ms 지연 없는 렌더링을 위한 최적화된 리퍼럴 대시보드
 * - CSS-only 애니메이션 (JS 블로킹 없음)
 * - Virtual scrolling for transaction list
 * - Memo/useMemo로 불필요한 리렌더 방지
 * - Skeleton UI for loading states
 *
 * Colors: #F9F9F7 (background), #171717 (text)
 */

'use client';

import { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ReferralTransaction {
  id: string;
  type: 'signup' | 'purchase' | 'staking';
  amount: number;
  refereeName?: string;
  timestamp: string;
  status: 'pending' | 'paid' | 'failed';
}

export interface ReferralStats {
  totalReferrals: number;
  totalRewards: number;
  pendingRewards: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
  tierMultiplier: number;
  referralCode: string;
  sovereignNumber: number;
}

interface DashboardProps {
  stats: ReferralStats;
  transactions: ReferralTransaction[];
  isLoading?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const TIER_CONFIG = {
  BRONZE: { color: '#CD7F32', badge: '🥉', multiplier: '1x' },
  SILVER: { color: '#C0C0C0', badge: '🥈', multiplier: '1.2x' },
  GOLD: { color: '#FFD700', badge: '🥇', multiplier: '1.5x' },
  PLATINUM: { color: '#E5E4E2', badge: '💎', multiplier: '2x' },
  DIAMOND: { color: '#B9F2FF', badge: '👑', multiplier: '3x' },
} as const;

const TRANSACTION_ICONS = {
  signup: '👤',
  purchase: '🛒',
  staking: '📈',
} as const;

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS (Pure, no side effects)
// ═══════════════════════════════════════════════════════════════════════════════

function formatKaus(amount: number): string {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
  return amount.toFixed(2);
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SKELETON COMPONENTS (CSS-only animation)
// ═══════════════════════════════════════════════════════════════════════════════

const Skeleton = memo(function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-[#171717]/5 rounded animate-pulse ${className}`}
      style={{
        animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }}
    />
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// STAT CARD (Memoized)
// ═══════════════════════════════════════════════════════════════════════════════

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: string;
  highlight?: boolean;
}

const StatCard = memo(function StatCard({
  label,
  value,
  subValue,
  icon,
  highlight = false
}: StatCardProps) {
  return (
    <div
      className={`
        p-4 rounded-xl transition-colors duration-150
        ${highlight
          ? 'bg-[#171717] text-[#F9F9F7]'
          : 'bg-[#F9F9F7] border border-[#17171710]'
        }
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xl">{icon}</span>
        <span className={`text-[10px] uppercase tracking-wider ${highlight ? 'text-[#F9F9F7]/50' : 'text-[#171717]/40'}`}>
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      {subValue && (
        <div className={`text-xs mt-1 ${highlight ? 'text-[#F9F9F7]/60' : 'text-[#171717]/50'}`}>
          {subValue}
        </div>
      )}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSACTION ROW (Memoized)
// ═══════════════════════════════════════════════════════════════════════════════

interface TransactionRowProps {
  transaction: ReferralTransaction;
}

const TransactionRow = memo(function TransactionRow({ transaction }: TransactionRowProps) {
  const icon = TRANSACTION_ICONS[transaction.type];
  const statusStyle = STATUS_STYLES[transaction.status];

  return (
    <div className="flex items-center justify-between py-3 border-b border-[#17171708] last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#171717]/5 flex items-center justify-center text-base">
          {icon}
        </div>
        <div>
          <div className="font-medium text-sm text-[#171717]">
            {transaction.type === 'signup' && 'New Signup'}
            {transaction.type === 'purchase' && 'KAUS Purchase'}
            {transaction.type === 'staking' && 'Staking Reward'}
          </div>
          <div className="text-xs text-[#171717]/50">
            {transaction.refereeName || 'Anonymous'} · {formatDate(transaction.timestamp)}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-bold text-sm tabular-nums text-[#171717]">
          +{formatKaus(transaction.amount)} KAUS
        </div>
        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${statusStyle}`}>
          {transaction.status}
        </span>
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// VIRTUAL TRANSACTION LIST (Windowing for performance)
// ═══════════════════════════════════════════════════════════════════════════════

interface VirtualListProps {
  transactions: ReferralTransaction[];
  maxHeight: number;
}

const VirtualTransactionList = memo(function VirtualTransactionList({
  transactions,
  maxHeight
}: VirtualListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });

  const ITEM_HEIGHT = 64; // Approximate row height
  const BUFFER = 5;

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop, clientHeight } = containerRef.current;
    const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER);
    const end = Math.min(
      transactions.length,
      Math.ceil((scrollTop + clientHeight) / ITEM_HEIGHT) + BUFFER
    );

    setVisibleRange({ start, end });
  }, [transactions.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const visibleItems = useMemo(
    () => transactions.slice(visibleRange.start, visibleRange.end),
    [transactions, visibleRange]
  );

  const totalHeight = transactions.length * ITEM_HEIGHT;
  const offsetY = visibleRange.start * ITEM_HEIGHT;

  if (transactions.length === 0) {
    return (
      <div className="py-12 text-center">
        <span className="text-4xl mb-3 block">📭</span>
        <p className="text-sm text-[#171717]/50">No transactions yet</p>
        <p className="text-xs text-[#171717]/40 mt-1">Share your code to earn KAUS</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="overflow-y-auto"
      style={{ maxHeight }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((tx) => (
            <TransactionRow key={tx.id} transaction={tx} />
          ))}
        </div>
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// REFERRAL CODE COPY (Optimized)
// ═══════════════════════════════════════════════════════════════════════════════

interface CodeCopyProps {
  code: string;
}

const CodeCopy = memo(function CodeCopy({ code }: CodeCopyProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  return (
    <button
      onClick={handleCopy}
      className="w-full flex items-center justify-between p-4 bg-[#171717] text-[#F9F9F7] rounded-xl hover:opacity-95 transition-opacity"
    >
      <div>
        <div className="text-[10px] uppercase tracking-wider text-[#F9F9F7]/50 mb-1">
          Your Referral Code
        </div>
        <div className="text-2xl font-bold font-mono tracking-wider">{code}</div>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 bg-[#F9F9F7]/10 rounded-lg">
        <span className="text-sm font-medium">
          {copied ? '✓ Copied!' : 'Copy'}
        </span>
      </div>
    </button>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// TIER PROGRESS BAR
// ═══════════════════════════════════════════════════════════════════════════════

interface TierProgressProps {
  currentTier: keyof typeof TIER_CONFIG;
  totalReferrals: number;
}

const TierProgress = memo(function TierProgress({ currentTier, totalReferrals }: TierProgressProps) {
  const tiers = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'] as const;
  const thresholds = [0, 5, 20, 50, 100];
  const currentIndex = tiers.indexOf(currentTier);
  const nextTier = tiers[currentIndex + 1];
  const nextThreshold = thresholds[currentIndex + 1];

  const progress = nextThreshold
    ? Math.min(100, ((totalReferrals - thresholds[currentIndex]) / (nextThreshold - thresholds[currentIndex])) * 100)
    : 100;

  return (
    <div className="p-4 bg-[#F9F9F7] rounded-xl border border-[#17171710]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{TIER_CONFIG[currentTier].badge}</span>
          <span className="font-bold text-[#171717]">{currentTier}</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: `${TIER_CONFIG[currentTier].color}20`, color: TIER_CONFIG[currentTier].color }}
          >
            {TIER_CONFIG[currentTier].multiplier} rewards
          </span>
        </div>
        {nextTier && (
          <span className="text-xs text-[#171717]/50">
            {nextThreshold - totalReferrals} to {nextTier}
          </span>
        )}
      </div>

      <div className="relative h-2 bg-[#171717]/5 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            background: TIER_CONFIG[currentTier].color,
          }}
        />
      </div>

      <div className="flex justify-between mt-2">
        {tiers.map((tier, i) => (
          <div
            key={tier}
            className={`text-[10px] ${i <= currentIndex ? 'opacity-100' : 'opacity-30'}`}
          >
            {TIER_CONFIG[tier].badge}
          </div>
        ))}
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// LOADING SKELETON
// ═══════════════════════════════════════════════════════════════════════════════

const DashboardSkeleton = memo(function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>

      {/* Code */}
      <Skeleton className="h-20 rounded-xl" />

      {/* Tier */}
      <Skeleton className="h-24 rounded-xl" />

      {/* Transactions */}
      <div className="space-y-2">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function OptimizedReferralDashboard({ stats, transactions, isLoading = false }: DashboardProps) {
  // Memoize computed values
  const tierConfig = useMemo(() => TIER_CONFIG[stats.tier], [stats.tier]);

  const sortedTransactions = useMemo(
    () => [...transactions].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ),
    [transactions]
  );

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#171717]">Referral Dashboard</h2>
          <p className="text-xs text-[#171717]/50">Sovereign #{stats.sovereignNumber}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#22C55E]/10 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
          <span className="text-[10px] font-medium text-[#22C55E]">LIVE</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon="👥"
          label="Total Referrals"
          value={stats.totalReferrals}
          subValue={`${tierConfig.multiplier} multiplier`}
        />
        <StatCard
          icon="💰"
          label="Total Earned"
          value={`${formatKaus(stats.totalRewards)}`}
          subValue="KAUS"
          highlight
        />
        <StatCard
          icon="⏳"
          label="Pending"
          value={`${formatKaus(stats.pendingRewards)}`}
          subValue="KAUS"
        />
        <StatCard
          icon={tierConfig.badge}
          label="Current Tier"
          value={stats.tier}
          subValue={tierConfig.multiplier}
        />
      </div>

      {/* Referral Code */}
      <CodeCopy code={stats.referralCode} />

      {/* Tier Progress */}
      <TierProgress currentTier={stats.tier} totalReferrals={stats.totalReferrals} />

      {/* Transactions */}
      <div className="bg-white rounded-xl border border-[#17171710] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#17171708]">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm text-[#171717]">Recent Activity</span>
            <span className="text-xs text-[#171717]/40">{transactions.length} total</span>
          </div>
        </div>
        <div className="px-4">
          <VirtualTransactionList
            transactions={sortedTransactions}
            maxHeight={300}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(OptimizedReferralDashboard);
