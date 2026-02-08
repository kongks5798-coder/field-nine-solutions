/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 49: GLOBAL INFRASTRUCTURE ASSETIZATION
 * ═══════════════════════════════════════════════════════════════════════════════
 * Sovereign Infrastructure Share + Global Profit Index
 * "제국은 국경 없는 에너지 자산으로 증명한다"
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// Types & Interfaces
// ============================================

interface GlobalNode {
  id: string;
  name: string;
  country: string;
  type: 'SOLAR' | 'WIND' | 'NUCLEAR' | 'V2G' | 'HYDRO';
  capacity: number; // MW
  currentOutput: number; // MW
  value: number; // USD
  apy: number; // %
  efficiency: number; // %
}

interface InvestmentTier {
  name: string;
  minKaus: number;
  apy: number;
  benefits: string[];
  color: string;
}

// ============================================
// Mock Data - Global Network
// ============================================

const GLOBAL_NETWORK: GlobalNode[] = [
  // Korea
  { id: 'KR-YD', name: 'Yeongdong Solar', country: 'Korea', type: 'SOLAR', capacity: 50, currentOutput: 42, value: 50000000, apy: 12.5, efficiency: 84 },
  { id: 'KR-JJ', name: 'Jeju Wind Farm', country: 'Korea', type: 'WIND', capacity: 30, currentOutput: 24, value: 35000000, apy: 11.8, efficiency: 80 },
  { id: 'KR-CT', name: 'Cybertruck V2G Fleet', country: 'Korea', type: 'V2G', capacity: 5, currentOutput: 3.2, value: 8000000, apy: 15.2, efficiency: 92 },
  // USA
  { id: 'US-TX', name: 'Texas Solar Ranch', country: 'USA', type: 'SOLAR', capacity: 100, currentOutput: 78, value: 120000000, apy: 11.2, efficiency: 78 },
  { id: 'US-CA', name: 'California Wind', country: 'USA', type: 'WIND', capacity: 45, currentOutput: 38, value: 55000000, apy: 10.8, efficiency: 84 },
  // Australia
  { id: 'AU-QLD', name: 'Queensland Solar', country: 'Australia', type: 'SOLAR', capacity: 80, currentOutput: 72, value: 95000000, apy: 13.1, efficiency: 90 },
  // Europe
  { id: 'DE-NW', name: 'North Sea Wind', country: 'Germany', type: 'WIND', capacity: 60, currentOutput: 48, value: 75000000, apy: 10.5, efficiency: 80 },
  { id: 'FR-NUC', name: 'Provence Nuclear', country: 'France', type: 'NUCLEAR', capacity: 200, currentOutput: 190, value: 280000000, apy: 9.8, efficiency: 95 },
  // Asia
  { id: 'JP-SOL', name: 'Hokkaido Solar', country: 'Japan', type: 'SOLAR', capacity: 40, currentOutput: 32, value: 48000000, apy: 11.5, efficiency: 80 },
  { id: 'SG-V2G', name: 'Singapore V2G Hub', country: 'Singapore', type: 'V2G', capacity: 8, currentOutput: 6.5, value: 12000000, apy: 14.8, efficiency: 88 },
];

const INVESTMENT_TIERS: InvestmentTier[] = [
  {
    name: 'Pioneer',
    minKaus: 100,
    apy: 12,
    benefits: ['Global Network Access', 'Weekly Dividends', 'Basic Analytics'],
    color: 'from-zinc-400 to-zinc-600',
  },
  {
    name: 'Sovereign',
    minKaus: 1000,
    apy: 13.5,
    benefits: ['Priority Node Access', 'Daily Dividends', 'AI Trading Insights', 'Governance Voting'],
    color: 'from-amber-400 to-amber-600',
  },
  {
    name: 'Emperor',
    minKaus: 10000,
    apy: 15,
    benefits: ['Exclusive Node Allocation', 'Real-Time Dividends', 'Prophet AI Access', 'Board Seat', 'Physical Asset Tours'],
    color: 'from-purple-400 to-purple-600',
  },
];

// ============================================
// Utility Functions
// ============================================

function formatCurrency(amount: number): string {
  if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
  if (amount >= 1e3) return `$${(amount / 1e3).toFixed(1)}K`;
  return `$${amount.toFixed(0)}`;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

// ============================================
// Global Profit Index - Main Billboard
// ============================================

export function GlobalProfitIndex() {
  const [profitData, setProfitData] = useState({
    profit24h: 0,
    tradesExecuted: 0,
    nodesActive: 0,
    totalCapacity: 0,
    avgEfficiency: 0,
  });
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const updateProfitData = () => {
      const nodes = GLOBAL_NETWORK;
      const totalCapacity = nodes.reduce((sum, n) => sum + n.capacity, 0);
      const currentOutput = nodes.reduce((sum, n) => sum + n.currentOutput, 0);
      const avgEfficiency = (currentOutput / totalCapacity) * 100;

      // Calculate 24h profit based on energy production
      const hourlyRate = currentOutput * 130; // $130/MWh average
      const profit24h = hourlyRate * 24 * (0.95 + Math.random() * 0.1);

      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 500);

      setProfitData({
        profit24h: Math.round(profit24h),
        tradesExecuted: 800 + Math.floor(Math.random() * 200),
        nodesActive: nodes.length,
        totalCapacity: Math.round(totalCapacity),
        avgEfficiency: Math.round(avgEfficiency * 10) / 10,
      });
    };

    updateProfitData();
    const interval = setInterval(updateProfitData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-[#0a0f1a] via-[#111827] to-[#0a0f1a] rounded-2xl p-6 border border-emerald-500/20 relative overflow-hidden"
    >
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(16, 185, 129, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(16, 185, 129, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            animation: 'pulse 4s ease-in-out infinite',
          }}
        />
      </div>

      {/* Header */}
      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <span className="text-2xl">🧠</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Global Profit Index</h2>
            <p className="text-xs text-white/50">Prophet AI Performance Report</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold text-emerald-400">LIVE</span>
        </div>
      </div>

      {/* Main Profit Display */}
      <div className="relative text-center py-8">
        <div className="text-sm text-white/50 uppercase tracking-widest mb-2">
          24-Hour Network Profit
        </div>
        <motion.div
          key={profitData.profit24h}
          initial={{ scale: 1.05, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-6xl md:text-7xl font-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent ${
            isAnimating ? 'animate-pulse' : ''
          }`}
        >
          {formatCurrency(profitData.profit24h)}
        </motion.div>
        <div className="flex items-center justify-center gap-2 mt-2 text-emerald-400">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-bold">+{(Math.random() * 5 + 8).toFixed(1)}% vs yesterday</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-amber-400">{profitData.tradesExecuted}</div>
          <div className="text-xs text-white/50 mt-1">Trades Executed</div>
        </div>
        <div className="bg-white/5 backdrop-blur rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-cyan-400">{profitData.nodesActive}</div>
          <div className="text-xs text-white/50 mt-1">Nodes Active</div>
        </div>
        <div className="bg-white/5 backdrop-blur rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-purple-400">{profitData.totalCapacity} MW</div>
          <div className="text-xs text-white/50 mt-1">Total Capacity</div>
        </div>
        <div className="bg-white/5 backdrop-blur rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-emerald-400">{profitData.avgEfficiency}%</div>
          <div className="text-xs text-white/50 mt-1">Avg Efficiency</div>
        </div>
      </div>

      {/* Prophet AI Attribution */}
      <div className="relative mt-6 pt-4 border-t border-white/10 flex items-center justify-center gap-2">
        <span className="text-xs text-white/40">Powered by</span>
        <span className="text-xs font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          Prophet AI v2.0
        </span>
      </div>
    </motion.div>
  );
}

// ============================================
// Sovereign Infrastructure Share Widget
// ============================================

export function SovereignInfrastructureShare() {
  const [selectedTier, setSelectedTier] = useState<InvestmentTier>(INVESTMENT_TIERS[1]);
  const [investAmount, setInvestAmount] = useState(1000);
  const [showConfirm, setShowConfirm] = useState(false);

  // Calculate network statistics
  const networkStats = useMemo(() => {
    const totalValue = GLOBAL_NETWORK.reduce((sum, n) => sum + n.value, 0);
    const totalCapacity = GLOBAL_NETWORK.reduce((sum, n) => sum + n.capacity, 0);
    const avgApy = GLOBAL_NETWORK.reduce((sum, n) => sum + n.apy, 0) / GLOBAL_NETWORK.length;
    const totalOutput = GLOBAL_NETWORK.reduce((sum, n) => sum + n.currentOutput, 0);

    return {
      totalValue,
      totalCapacity,
      avgApy: Math.round(avgApy * 10) / 10,
      totalOutput: Math.round(totalOutput),
      nodeCount: GLOBAL_NETWORK.length,
    };
  }, []);

  // Calculate projected returns
  const projectedReturns = useMemo(() => {
    const kausPrice = 1.25; // USD per KAUS
    const investmentUsd = investAmount * kausPrice;
    const dailyReturn = (investmentUsd * selectedTier.apy / 100) / 365;
    const monthlyReturn = dailyReturn * 30;
    const yearlyReturn = investmentUsd * selectedTier.apy / 100;

    return {
      daily: dailyReturn,
      monthly: monthlyReturn,
      yearly: yearlyReturn,
      investmentUsd,
    };
  }, [investAmount, selectedTier]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] rounded-2xl overflow-hidden border border-white/5"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="text-2xl">🏛️</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Sovereign Infrastructure Share</h2>
              <p className="text-xs text-white/50">Global Energy Network Investment</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-emerald-400">
              {formatCurrency(networkStats.totalValue)}+
            </div>
            <div className="text-xs text-white/50">Total Network Value</div>
          </div>
        </div>
      </div>

      {/* Network Overview */}
      <div className="p-6 border-b border-white/5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-xs text-white/50 uppercase mb-1">Network Nodes</div>
            <div className="text-2xl font-bold text-white">{networkStats.nodeCount}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-xs text-white/50 uppercase mb-1">Total Capacity</div>
            <div className="text-2xl font-bold text-cyan-400">{networkStats.totalCapacity} MW</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-xs text-white/50 uppercase mb-1">Current Output</div>
            <div className="text-2xl font-bold text-emerald-400">{networkStats.totalOutput} MW</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-xs text-white/50 uppercase mb-1">Avg APY</div>
            <div className="text-2xl font-bold text-amber-400">{networkStats.avgApy}%</div>
          </div>
        </div>
      </div>

      {/* Investment Tiers */}
      <div className="p-6 border-b border-white/5">
        <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-4">
          Select Investment Tier
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {INVESTMENT_TIERS.map((tier) => (
            <motion.button
              key={tier.name}
              onClick={() => {
                setSelectedTier(tier);
                setInvestAmount(tier.minKaus);
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                selectedTier.name === tier.name
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              {tier.name === 'Emperor' && (
                <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-[10px] font-bold text-white">
                  BEST VALUE
                </div>
              )}
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tier.color} flex items-center justify-center mb-3`}>
                <span className="text-lg">
                  {tier.name === 'Pioneer' ? '🌱' : tier.name === 'Sovereign' ? '👑' : '🏆'}
                </span>
              </div>
              <div className="font-bold text-white mb-1">{tier.name}</div>
              <div className="text-2xl font-black text-emerald-400 mb-2">{tier.apy}% APY</div>
              <div className="text-xs text-white/50">Min: {formatNumber(tier.minKaus)} KAUS</div>
              <ul className="mt-3 space-y-1">
                {tier.benefits.slice(0, 3).map((benefit, i) => (
                  <li key={i} className="text-xs text-white/60 flex items-center gap-1">
                    <span className="text-emerald-400">✓</span> {benefit}
                  </li>
                ))}
              </ul>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Investment Calculator */}
      <div className="p-6 border-b border-white/5">
        <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-4">
          Investment Calculator
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input */}
          <div>
            <label className="block text-xs text-white/50 uppercase mb-2">
              Investment Amount (KAUS)
            </label>
            <div className="relative">
              <input
                type="number"
                value={investAmount}
                onChange={(e) => setInvestAmount(Math.max(selectedTier.minKaus, Number(e.target.value)))}
                min={selectedTier.minKaus}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-2xl font-bold text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50">KAUS</span>
            </div>
            <div className="mt-2 text-xs text-white/40">
              ≈ ${projectedReturns.investmentUsd.toFixed(2)} USD
            </div>
            {/* Quick select */}
            <div className="flex gap-2 mt-3">
              {[1000, 5000, 10000, 50000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setInvestAmount(amount)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    investAmount === amount
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/5 text-white/50 hover:bg-white/10'
                  }`}
                >
                  {formatNumber(amount)}
                </button>
              ))}
            </div>
          </div>

          {/* Projected Returns */}
          <div className="bg-gradient-to-br from-emerald-900/30 to-cyan-900/30 rounded-xl p-4">
            <div className="text-xs text-white/50 uppercase mb-3">Projected Returns</div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/60">Daily</span>
                <span className="text-lg font-bold text-emerald-400">
                  +${projectedReturns.daily.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60">Monthly</span>
                <span className="text-lg font-bold text-cyan-400">
                  +${projectedReturns.monthly.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="text-white/60">Yearly</span>
                <span className="text-2xl font-black text-amber-400">
                  +${projectedReturns.yearly.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="p-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowConfirm(true)}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-bold text-white text-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all"
        >
          Invest {formatNumber(investAmount)} KAUS → {selectedTier.apy}% APY
        </motion.button>
        <p className="text-center text-xs text-white/40 mt-3">
          Dividends paid {selectedTier.name === 'Emperor' ? 'in real-time' : selectedTier.name === 'Sovereign' ? 'daily' : 'weekly'} to your KAUS wallet
        </p>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1a1f2e] rounded-2xl p-6 max-w-md w-full border border-white/10"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🏛️</span>
                </div>
                <h3 className="text-xl font-bold text-white">Confirm Investment</h3>
                <p className="text-white/50 text-sm mt-1">You&apos;re about to become a Sovereign stakeholder</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-white/60">Amount</span>
                  <span className="font-bold text-white">{formatNumber(investAmount)} KAUS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Tier</span>
                  <span className="font-bold text-amber-400">{selectedTier.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">APY</span>
                  <span className="font-bold text-emerald-400">{selectedTier.apy}%</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/10">
                  <span className="text-white/60">Est. Yearly Return</span>
                  <span className="font-bold text-cyan-400">+${projectedReturns.yearly.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 bg-white/10 rounded-xl font-bold text-white/70 hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowConfirm(false);
                    // TODO: Integrate with actual KAUS payment
                    alert('Investment feature coming soon! Connect your KAUS wallet.');
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-bold text-white hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// Node Performance Card (for Globe click)
// ============================================

export function NodePerformanceCard({
  node,
  onClose,
}: {
  node: GlobalNode;
  onClose: () => void;
}) {
  const typeIcons: Record<string, string> = {
    SOLAR: '☀️',
    WIND: '💨',
    NUCLEAR: '⚛️',
    V2G: '🚗',
    HYDRO: '💧',
  };

  const typeColors: Record<string, string> = {
    SOLAR: 'from-amber-500 to-orange-500',
    WIND: 'from-cyan-500 to-blue-500',
    NUCLEAR: 'from-purple-500 to-indigo-500',
    V2G: 'from-red-500 to-pink-500',
    HYDRO: 'from-blue-500 to-cyan-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-[#1a1f2e] rounded-xl p-4 border border-white/10 min-w-[280px]"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 bg-gradient-to-br ${typeColors[node.type]} rounded-lg flex items-center justify-center`}>
            <span className="text-lg">{typeIcons[node.type]}</span>
          </div>
          <div>
            <div className="font-bold text-white">{node.name}</div>
            <div className="text-xs text-white/50">{node.country}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:bg-white/20 hover:text-white transition-all"
        >
          ×
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-xs text-white/50">Capacity</div>
          <div className="text-lg font-bold text-cyan-400">{node.capacity} MW</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-xs text-white/50">Current Output</div>
          <div className="text-lg font-bold text-emerald-400">{node.currentOutput} MW</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-xs text-white/50">Efficiency</div>
          <div className="text-lg font-bold text-amber-400">{node.efficiency}%</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-xs text-white/50">APY</div>
          <div className="text-lg font-bold text-purple-400">{node.apy}%</div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-lg p-3 flex justify-between items-center">
        <span className="text-sm text-white/70">Asset Value</span>
        <span className="text-xl font-black text-emerald-400">{formatCurrency(node.value)}</span>
      </div>

      <button className="w-full mt-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg font-bold text-white text-sm hover:shadow-lg hover:shadow-emerald-500/20 transition-all">
        Invest in This Node
      </button>
    </motion.div>
  );
}

// ============================================
// Export Network Data for Globe Integration
// ============================================

export { GLOBAL_NETWORK, type GlobalNode };
