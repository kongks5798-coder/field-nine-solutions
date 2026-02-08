'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 57: BLOCKCHAIN TRANSACTION DASHBOARD
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Real-time blockchain monitoring dashboard with:
 * - Transaction history
 * - Gas tracker
 * - TVL display
 * - Network status
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useChainId } from 'wagmi';
import {
  getBlockchainTVL,
  getGasEstimate,
  getTransactionStatus,
  type TVLBreakdown,
  type GasEstimate,
  type TransactionStatus,
  type Network,
} from '@/lib/blockchain/alchemy-client';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface BlockchainDashboardProps {
  className?: string;
  compact?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// NETWORK MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

const chainIdToNetwork: Record<number, Network> = {
  1: 'ethereum',
  42161: 'arbitrum',
  137: 'polygon',
  10: 'optimism',
};

// ═══════════════════════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════════════════════

function StatCard({
  label,
  value,
  unit,
  trend,
  icon,
}: {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: string;
}) {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-[#17171710] p-4 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className={`text-xs font-medium ${trendColors[trend]}`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-[#171717]">{value}</span>
        {unit && <span className="text-sm text-[#171717]/50">{unit}</span>}
      </div>
      <p className="text-xs text-[#171717]/50 mt-1">{label}</p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GAS TRACKER
// ═══════════════════════════════════════════════════════════════════════════════

function GasTracker({ network }: { network: Network }) {
  const [gas, setGas] = useState<GasEstimate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGas = async () => {
      try {
        const data = await getGasEstimate(network);
        setGas(data);
      } catch (error) {
        console.error('Gas fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGas();
    const interval = setInterval(fetchGas, 15000); // Update every 15s
    return () => clearInterval(interval);
  }, [network]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#17171710] p-4 animate-pulse">
        <div className="h-6 bg-[#171717]/10 rounded w-24 mb-2" />
        <div className="h-8 bg-[#171717]/10 rounded w-16" />
      </div>
    );
  }

  const gasLevel = gas
    ? parseFloat(gas.gasPrice.replace(' Gwei', '')) < 20
      ? 'low'
      : parseFloat(gas.gasPrice.replace(' Gwei', '')) < 50
      ? 'medium'
      : 'high'
    : 'medium';

  const gasColors = {
    low: 'from-green-500 to-emerald-500',
    medium: 'from-amber-500 to-orange-500',
    high: 'from-red-500 to-pink-500',
  };

  return (
    <div className="bg-white rounded-xl border border-[#17171710] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">⛽</span>
          <span className="font-medium text-[#171717]">가스 트래커</span>
        </div>
        <span
          className={`
            px-2 py-0.5 rounded-full text-xs font-bold text-white
            bg-gradient-to-r ${gasColors[gasLevel]}
          `}
        >
          {gasLevel === 'low' ? '낮음' : gasLevel === 'medium' ? '보통' : '높음'}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[#171717]/50">Gas Price</span>
          <span className="font-mono text-[#171717]">{gas?.gasPrice}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#171717]/50">Max Fee</span>
          <span className="font-mono text-[#171717]">{gas?.maxFeePerGas}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#171717]/50">예상 비용 (기본 TX)</span>
          <span className="font-mono text-amber-600">${gas?.estimatedCostUSD}</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TVL DISPLAY
// ═══════════════════════════════════════════════════════════════════════════════

function TVLDisplay({ network }: { network: Network }) {
  const [tvl, setTvl] = useState<TVLBreakdown | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTVL = async () => {
      try {
        const data = await getBlockchainTVL(network);
        setTvl(data);
      } catch (error) {
        console.error('TVL fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTVL();
    const interval = setInterval(fetchTVL, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [network]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20 p-5 animate-pulse">
        <div className="h-6 bg-amber-500/20 rounded w-32 mb-3" />
        <div className="h-10 bg-amber-500/20 rounded w-48" />
      </div>
    );
  }

  const formatUSD = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔒</span>
          <span className="font-bold text-[#171717]">Total Value Locked</span>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            tvl?.isLive ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
          }`}
        >
          {tvl?.isLive ? 'LIVE' : 'CACHE'}
        </span>
      </div>

      <div className="text-3xl font-bold text-[#171717] mb-4">
        {formatUSD(tvl?.totalTVL || 0)}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[#171717]/50">스테이킹 볼트</span>
          <span className="text-[#171717]">{formatUSD(tvl?.breakdown.stakingVault || 0)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#171717]/50">유동성 풀</span>
          <span className="text-[#171717]">{formatUSD(tvl?.breakdown.liquidityPool || 0)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#171717]/50">재무 지갑</span>
          <span className="text-[#171717]">{formatUSD(tvl?.breakdown.treasuryWallet || 0)}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-amber-500/20 flex items-center justify-between text-xs text-[#171717]/40">
        <span>ETH: ${tvl?.tokenPrices.eth?.toLocaleString()}</span>
        <span>KAUS: ${tvl?.tokenPrices.kaus}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSACTION TRACKER
// ═══════════════════════════════════════════════════════════════════════════════

function TransactionTracker({
  network,
  txHash,
}: {
  network: Network;
  txHash: string;
}) {
  const [status, setStatus] = useState<TransactionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await getTransactionStatus(txHash, network);
        setStatus(data);
      } catch (error) {
        console.error('TX status fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [txHash, network]);

  if (loading) {
    return (
      <div className="p-4 bg-[#171717]/5 rounded-xl animate-pulse">
        <div className="h-4 bg-[#171717]/10 rounded w-48" />
      </div>
    );
  }

  if (!status) {
    return (
      <div className="p-4 bg-red-500/10 rounded-xl text-red-500 text-sm">
        트랜잭션을 찾을 수 없습니다
      </div>
    );
  }

  const statusConfig = {
    pending: { icon: '⏳', color: 'amber', label: '대기 중' },
    confirmed: { icon: '✅', color: 'green', label: '완료' },
    failed: { icon: '❌', color: 'red', label: '실패' },
  };

  const config = statusConfig[status.status];

  return (
    <div className={`p-4 bg-${config.color}-500/10 rounded-xl border border-${config.color}-500/20`}>
      <div className="flex items-center gap-2 mb-2">
        <span>{config.icon}</span>
        <span className={`font-medium text-${config.color}-600`}>{config.label}</span>
        {status.confirmations > 0 && (
          <span className="text-xs text-[#171717]/50">
            ({status.confirmations} confirmations)
          </span>
        )}
      </div>
      <div className="font-mono text-xs text-[#171717]/50 truncate">{txHash}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECENT TRANSACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function RecentTransactions() {
  // In a real app, this would fetch from Supabase or on-chain
  const mockTransactions = [
    { hash: '0x1234...5678', type: 'KAUS 정산', amount: '500 KAUS', status: 'confirmed' as const, time: '2분 전' },
    { hash: '0x2345...6789', type: '스테이킹', amount: '1,000 KAUS', status: 'pending' as const, time: '5분 전' },
    { hash: '0x3456...7890', type: '브릿지', amount: '250 KAUS', status: 'confirmed' as const, time: '1시간 전' },
  ];

  const statusIcons = {
    pending: '⏳',
    confirmed: '✅',
    failed: '❌',
  };

  return (
    <div className="bg-white rounded-xl border border-[#17171710] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#17171708] flex items-center justify-between">
        <span className="font-bold text-[#171717]">최근 트랜잭션</span>
        <button className="text-xs text-amber-600 hover:underline">전체 보기</button>
      </div>

      <div className="divide-y divide-[#17171708]">
        {mockTransactions.map((tx, i) => (
          <motion.div
            key={tx.hash}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="px-4 py-3 hover:bg-[#171717]/2 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span>{statusIcons[tx.status]}</span>
                <span className="font-medium text-[#171717]">{tx.type}</span>
              </div>
              <span className="text-sm text-[#171717]/70">{tx.amount}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-[#171717]/40">
              <span className="font-mono">{tx.hash}</span>
              <span>{tx.time}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function BlockchainDashboard({ className = '', compact = false }: BlockchainDashboardProps) {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const network = chainIdToNetwork[chainId] || 'ethereum';

  // Not connected state
  if (!isConnected) {
    return (
      <div className={`bg-white rounded-2xl border border-[#17171710] p-8 text-center ${className}`}>
        <div className="text-4xl mb-4">🔗</div>
        <h3 className="font-bold text-lg text-[#171717] mb-2">지갑을 연결하세요</h3>
        <p className="text-sm text-[#171717]/50 mb-4">
          블록체인 대시보드를 보려면 먼저 지갑을 연결해야 합니다
        </p>
      </div>
    );
  }

  // Compact view
  if (compact) {
    return (
      <div className={`grid grid-cols-2 gap-4 ${className}`}>
        <StatCard
          icon="⛽"
          label="Gas Price"
          value="25"
          unit="Gwei"
          trend="down"
        />
        <StatCard
          icon="🔒"
          label="Total TVL"
          value="$1.2M"
          trend="up"
        />
      </div>
    );
  }

  // Full dashboard
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#171717]">블록체인 대시보드</h2>
          <p className="text-sm text-[#171717]/50">
            실시간 온체인 데이터 모니터링
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-[#171717]/50">
            {network.charAt(0).toUpperCase() + network.slice(1)}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="💰" label="내 KAUS 잔액" value="2,500" unit="KAUS" />
        <StatCard icon="📈" label="스테이킹 보상" value="125" unit="KAUS" trend="up" />
        <StatCard icon="🔄" label="총 트랜잭션" value="47" trend="neutral" />
        <StatCard icon="⏱️" label="평균 확인 시간" value="12" unit="초" trend="down" />
      </div>

      {/* Main Content */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <TVLDisplay network={network} />
          <GasTracker network={network} />
        </div>

        {/* Right Column */}
        <div>
          <RecentTransactions />
        </div>
      </div>
    </div>
  );
}

export default BlockchainDashboard;
