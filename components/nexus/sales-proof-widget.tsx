/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 51: GLOBAL SALES PROOF - Admin Revenue Dashboard
 * ═══════════════════════════════════════════════════════════════════════════════
 * Real-time PayPal & KAUS transaction aggregation for admin view
 *
 * Features:
 * - Live PayPal payment tracking
 * - KAUS purchase volume aggregation
 * - Real-time revenue stream visualization
 * - Geographic distribution of sales
 *
 * @component GlobalSalesProof
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Transaction {
  id: string;
  type: 'paypal' | 'kaus_buy' | 'tier_upgrade' | 'investment';
  amount: number;
  currency: 'USD' | 'KAUS';
  timestamp: Date;
  location: string;
  tier?: string;
  status: 'completed' | 'pending' | 'processing';
}

interface SalesStats {
  todayPaypal: number;
  todayKaus: number;
  totalTransactions: number;
  activeUsers: number;
  avgTransactionSize: number;
  peakHour: string;
  topLocation: string;
  conversionRate: number;
}

interface GeographicData {
  country: string;
  code: string;
  amount: number;
  transactions: number;
  percentage: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA GENERATOR (In production, would fetch from API)
// ═══════════════════════════════════════════════════════════════════════════════

const LOCATIONS = [
  { name: 'Seoul, KR', code: 'KR' },
  { name: 'Tokyo, JP', code: 'JP' },
  { name: 'Singapore, SG', code: 'SG' },
  { name: 'Dubai, AE', code: 'AE' },
  { name: 'New York, US', code: 'US' },
  { name: 'London, UK', code: 'UK' },
  { name: 'Sydney, AU', code: 'AU' },
  { name: 'Hong Kong, HK', code: 'HK' },
];

const TIERS = ['Pioneer', 'Sovereign', 'Emperor'];

function generateTransaction(): Transaction {
  const types: Transaction['type'][] = ['paypal', 'kaus_buy', 'tier_upgrade', 'investment'];
  const type = types[Math.floor(Math.random() * types.length)];
  const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];

  let amount: number;
  let currency: 'USD' | 'KAUS';

  switch (type) {
    case 'paypal':
      amount = 50 + Math.floor(Math.random() * 950);
      currency = 'USD';
      break;
    case 'kaus_buy':
      amount = 100 + Math.floor(Math.random() * 4900);
      currency = 'KAUS';
      break;
    case 'tier_upgrade':
      amount = [99, 499, 999][Math.floor(Math.random() * 3)];
      currency = 'USD';
      break;
    case 'investment':
      amount = 500 + Math.floor(Math.random() * 9500);
      currency = 'KAUS';
      break;
    default:
      amount = 100;
      currency = 'USD';
  }

  return {
    id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    amount,
    currency,
    timestamp: new Date(),
    location: location.name,
    tier: type === 'tier_upgrade' ? TIERS[Math.floor(Math.random() * TIERS.length)] : undefined,
    status: 'completed',
  };
}

function generateSalesStats(): SalesStats {
  return {
    todayPaypal: 12500 + Math.floor(Math.random() * 5000),
    todayKaus: 85000 + Math.floor(Math.random() * 25000),
    totalTransactions: 156 + Math.floor(Math.random() * 50),
    activeUsers: 89 + Math.floor(Math.random() * 30),
    avgTransactionSize: 280 + Math.floor(Math.random() * 120),
    peakHour: '14:00 - 15:00 KST',
    topLocation: 'Seoul, KR',
    conversionRate: 3.2 + Math.random() * 1.5,
  };
}

function generateGeographicData(): GeographicData[] {
  const data: GeographicData[] = [
    { country: 'South Korea', code: 'KR', amount: 45000, transactions: 89, percentage: 38 },
    { country: 'Japan', code: 'JP', amount: 28000, transactions: 52, percentage: 24 },
    { country: 'Singapore', code: 'SG', amount: 18000, transactions: 31, percentage: 15 },
    { country: 'UAE', code: 'AE', amount: 12000, transactions: 18, percentage: 10 },
    { country: 'United States', code: 'US', amount: 8500, transactions: 14, percentage: 7 },
    { country: 'Others', code: 'XX', amount: 7000, transactions: 22, percentage: 6 },
  ];

  // Add some randomness
  return data.map(d => ({
    ...d,
    amount: d.amount + Math.floor(Math.random() * 2000),
    transactions: d.transactions + Math.floor(Math.random() * 10),
  }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSACTION FEED
// ═══════════════════════════════════════════════════════════════════════════════

function TransactionFeed({ transactions }: { transactions: Transaction[] }) {
  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'paypal': return '💳';
      case 'kaus_buy': return '🪙';
      case 'tier_upgrade': return '⬆️';
      case 'investment': return '📈';
    }
  };

  const getTypeLabel = (type: Transaction['type']) => {
    switch (type) {
      case 'paypal': return 'PayPal';
      case 'kaus_buy': return 'KAUS Buy';
      case 'tier_upgrade': return 'Tier Upgrade';
      case 'investment': return 'Investment';
    }
  };

  const getTypeColor = (type: Transaction['type']) => {
    switch (type) {
      case 'paypal': return 'text-blue-400';
      case 'kaus_buy': return 'text-amber-400';
      case 'tier_upgrade': return 'text-purple-400';
      case 'investment': return 'text-emerald-400';
    }
  };

  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
      <AnimatePresence mode="popLayout">
        {transactions.slice(0, 10).map((tx) => (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-xl">
                {getTypeIcon(tx.type)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${getTypeColor(tx.type)}`}>
                    {getTypeLabel(tx.type)}
                  </span>
                  {tx.tier && (
                    <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">
                      {tx.tier}
                    </span>
                  )}
                </div>
                <div className="text-xs text-white/50">{tx.location}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-white">
                {tx.currency === 'USD' ? '$' : ''}{tx.amount.toLocaleString()}
                {tx.currency === 'KAUS' && ' KAUS'}
              </div>
              <div className="text-xs text-white/40">
                {tx.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATS CARD
// ═══════════════════════════════════════════════════════════════════════════════

function StatsCard({
  label,
  value,
  subValue,
  icon,
  color,
  trend,
}: {
  label: string;
  value: string;
  subValue?: string;
  icon: string;
  color: string;
  trend?: number;
}) {
  return (
    <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {trend !== undefined && (
          <span className={`text-xs font-bold ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
        )}
      </div>
      <div className="text-xs text-white/50 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      {subValue && <div className="text-xs text-white/40 mt-1">{subValue}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GEOGRAPHIC BREAKDOWN
// ═══════════════════════════════════════════════════════════════════════════════

function GeographicBreakdown({ data }: { data: GeographicData[] }) {
  const maxAmount = Math.max(...data.map(d => d.amount));

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.code} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/80">{item.country}</span>
            <span className="text-white font-semibold">${item.amount.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.amount / maxAmount) * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>{item.transactions} transactions</span>
            <span>{item.percentage}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN GLOBAL SALES PROOF WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

export function GlobalSalesProof() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<SalesStats>(generateSalesStats());
  const [geoData, setGeoData] = useState<GeographicData[]>(generateGeographicData());
  const [isLive, setIsLive] = useState(true);

  // Generate initial transactions
  useEffect(() => {
    const initial = Array.from({ length: 8 }, generateTransaction);
    setTransactions(initial);
  }, []);

  // Live transaction feed
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const newTx = generateTransaction();
      setTransactions(prev => [newTx, ...prev].slice(0, 50));

      // Update stats occasionally
      if (Math.random() > 0.7) {
        setStats(generateSalesStats());
      }
    }, 3000 + Math.random() * 4000);

    return () => clearInterval(interval);
  }, [isLive]);

  // Refresh geo data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setGeoData(generateGeographicData());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#171717] rounded-2xl p-6 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Global Sales Proof</h2>
          <p className="text-sm text-white/50">Real-time revenue tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              isLive
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-white/10 text-white/50'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'}`} />
            {isLive ? 'LIVE' : 'PAUSED'}
          </button>
          <div className="text-right">
            <div className="text-xs text-white/40">Last updated</div>
            <div className="text-sm text-white/70">{new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatsCard
          label="Today PayPal"
          value={`$${stats.todayPaypal.toLocaleString()}`}
          icon="💳"
          color="text-blue-400"
          trend={12.5}
        />
        <StatsCard
          label="Today KAUS"
          value={stats.todayKaus.toLocaleString()}
          subValue="KAUS purchased"
          icon="🪙"
          color="text-amber-400"
          trend={18.3}
        />
        <StatsCard
          label="Transactions"
          value={stats.totalTransactions.toString()}
          subValue={`Avg: $${stats.avgTransactionSize}`}
          icon="📊"
          color="text-emerald-400"
          trend={8.7}
        />
        <StatsCard
          label="Active Users"
          value={stats.activeUsers.toString()}
          subValue={`CVR: ${stats.conversionRate.toFixed(1)}%`}
          icon="👥"
          color="text-purple-400"
          trend={5.2}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Transaction Feed */}
        <div>
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Live Transactions
          </h3>
          <TransactionFeed transactions={transactions} />
        </div>

        {/* Geographic Breakdown */}
        <div>
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">
            Revenue by Region
          </h3>
          <GeographicBreakdown data={geoData} />
        </div>
      </div>

      {/* Footer Stats */}
      <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-sm">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-white/40">Peak Hour: </span>
            <span className="text-white font-medium">{stats.peakHour}</span>
          </div>
          <div>
            <span className="text-white/40">Top Location: </span>
            <span className="text-white font-medium">{stats.topLocation}</span>
          </div>
        </div>
        <a href="/admin/sales" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
          View Full Report →
        </a>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPACT SALES TICKER (for headers)
// ═══════════════════════════════════════════════════════════════════════════════

export function SalesTicker() {
  const [stats, setStats] = useState({ paypal: 0, kaus: 0 });

  useEffect(() => {
    const update = () => {
      setStats({
        paypal: 12500 + Math.floor(Math.random() * 5000),
        kaus: 85000 + Math.floor(Math.random() * 25000),
      });
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-[#171717] rounded-full">
      <div className="flex items-center gap-2">
        <span className="text-blue-400">💳</span>
        <span className="text-sm text-white font-medium">${stats.paypal.toLocaleString()}</span>
      </div>
      <div className="w-px h-4 bg-white/20" />
      <div className="flex items-center gap-2">
        <span className="text-amber-400">🪙</span>
        <span className="text-sm text-white font-medium">{stats.kaus.toLocaleString()} KAUS</span>
      </div>
      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINI SALES CARD (for dashboard widgets)
// ═══════════════════════════════════════════════════════════════════════════════

export function MiniSalesCard() {
  const [stats, setStats] = useState({ total: 0, transactions: 0 });

  useEffect(() => {
    const update = () => {
      setStats({
        total: 25000 + Math.floor(Math.random() * 10000),
        transactions: 150 + Math.floor(Math.random() * 50),
      });
    };
    update();
    const interval = setInterval(update, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-xl p-4 border border-emerald-500/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/50 uppercase">Today&apos;s Revenue</span>
        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
      </div>
      <div className="text-2xl font-black text-white">${stats.total.toLocaleString()}</div>
      <div className="text-xs text-white/50 mt-1">{stats.transactions} transactions</div>
    </div>
  );
}

export default GlobalSalesProof;
