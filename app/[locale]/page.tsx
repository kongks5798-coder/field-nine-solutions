'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import Link from 'next/link';

// =============================================================================
// FIELD NINE ENERGY SOVEREIGN HUB v2.0
// Energy-Utility Loop: Energy as Currency
// =============================================================================

type InvestmentMode = 'retail' | 'institutional';
type CheckoutService = 'travel' | 'fashion' | null;

interface EnergyNode {
  id: string;
  name: string;
  nameKo: string;
  location: string;
  capacity: number;
  area: number;
  apy: number;
  status: 'ACTIVE' | 'FUNDRAISING' | 'PLANNED';
  generation: number;
  revenue: number;
  tokenSymbol: string;
  tokenPrice: number;
  totalTokens: number;
  soldTokens: number;
}

interface ShadowAlphaMetrics {
  capital: number;
  pnl: number;
  pnlPercent: number;
  annualizedReturn: number;
  sharpeRatio: number;
  winRate: number;
  trades: number;
  tps: number;
  markets: string[];
}

interface UserWallet {
  nxusdBalance: number;
  pendingDividends: number;
  totalEarned: number;
  autoCompoundEnabled: boolean;
  compoundedAmount: number;
}

interface ServiceAllocation {
  service: string;
  percentage: number;
  kwhAllocated: number;
  color: string;
}

// =============================================================================
// HOOKS
// =============================================================================

function useEnergyNode(): EnergyNode {
  const [node, setNode] = useState<EnergyNode>({
    id: 'YEONGDONG-001',
    name: 'Yeongdong Energy Node #1',
    nameKo: '영동 에너지 노드 #1',
    location: 'Yeongdong-gun, Chungcheongbuk-do',
    capacity: 50000,
    area: 100000,
    apy: 14.8,
    status: 'FUNDRAISING',
    generation: 0,
    revenue: 0,
    tokenSymbol: 'FNYD1',
    tokenPrice: 100,
    totalTokens: 500000,
    soldTokens: 127500,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setNode(prev => {
        const newGeneration = 45000 + Math.random() * 5000;
        return {
          ...prev,
          generation: Math.round(newGeneration),
          revenue: Math.round(newGeneration * 0.15),
          soldTokens: Math.min(prev.totalTokens, prev.soldTokens + Math.floor(Math.random() * 50)),
          apy: 14.5 + Math.random() * 0.6,
        };
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return node;
}

function useShadowAlpha(): ShadowAlphaMetrics {
  const [metrics, setMetrics] = useState<ShadowAlphaMetrics>({
    capital: 1000000,
    pnl: 37500,
    pnlPercent: 3.75,
    annualizedReturn: 156.8,
    sharpeRatio: 2.35,
    winRate: 74.2,
    trades: 89420,
    tps: 152,
    markets: ['PJM', 'EPEX', 'AEMO', 'JEPX'],
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => {
        const newPnl = prev.pnl + (Math.random() * 80 - 20);
        return {
          ...prev,
          pnl: Math.max(prev.pnl * 0.98, newPnl),
          pnlPercent: (newPnl / prev.capital) * 100,
          annualizedReturn: Math.max(150, (newPnl / prev.capital / 30) * 365 * 100),
          sharpeRatio: 2.1 + Math.random() * 0.4,
          winRate: 72 + Math.random() * 4,
          trades: prev.trades + Math.floor(Math.random() * 20),
          tps: 145 + Math.floor(Math.random() * 25),
        };
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return metrics;
}

function useUserWallet(): [UserWallet, React.Dispatch<React.SetStateAction<UserWallet>>] {
  const [wallet, setWallet] = useState<UserWallet>({
    nxusdBalance: 1250.00,
    pendingDividends: 42.50,
    totalEarned: 385.00,
    autoCompoundEnabled: false,
    compoundedAmount: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setWallet(prev => {
        const newDividend = Math.random() * 0.5;
        if (prev.autoCompoundEnabled) {
          return {
            ...prev,
            pendingDividends: 0,
            compoundedAmount: prev.compoundedAmount + prev.pendingDividends + newDividend,
            totalEarned: prev.totalEarned + newDividend,
          };
        }
        return {
          ...prev,
          pendingDividends: prev.pendingDividends + newDividend,
          totalEarned: prev.totalEarned + newDividend,
        };
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return [wallet, setWallet];
}

function useServiceAllocations(generation: number): ServiceAllocation[] {
  return [
    { service: 'NEXUS-X Trading', percentage: 45, kwhAllocated: Math.round(generation * 0.45), color: '#10B981' },
    { service: 'K-Universal Travel', percentage: 25, kwhAllocated: Math.round(generation * 0.25), color: '#3B82F6' },
    { service: 'Aura Sydney Fashion', percentage: 15, kwhAllocated: Math.round(generation * 0.15), color: '#8B5CF6' },
    { service: 'Grid Reserve', percentage: 15, kwhAllocated: Math.round(generation * 0.15), color: '#6B7280' },
  ];
}

function useTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return time;
}

// =============================================================================
// COMPONENTS
// =============================================================================

// Header with Wallet
function SovereignHeader({
  mode,
  setMode,
  wallet,
  onOpenCheckout
}: {
  mode: InvestmentMode;
  setMode: (m: InvestmentMode) => void;
  wallet: UserWallet;
  onOpenCheckout: () => void;
}) {
  const time = useTime();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#F9F9F7]/90 backdrop-blur-xl border-b border-[#171717]/5">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <motion.div
              className="w-10 h-10 bg-[#171717] rounded-lg flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-[#F9F9F7] font-black text-sm">F9</span>
            </motion.div>
            <div>
              <div className="text-lg font-bold text-[#171717] tracking-tight">FIELD NINE</div>
              <div className="text-[10px] text-[#171717]/40 tracking-[0.2em]">ENERGY SOVEREIGN</div>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-[#171717]/5 rounded-full">
            <button
              onClick={() => setMode('retail')}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                mode === 'retail' ? 'bg-[#171717] text-[#F9F9F7]' : 'text-[#171717]/60 hover:text-[#171717]'
              }`}
            >
              Invest
            </button>
            <button
              onClick={() => setMode('institutional')}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                mode === 'institutional' ? 'bg-[#171717] text-[#F9F9F7]' : 'text-[#171717]/60 hover:text-[#171717]'
              }`}
            >
              Pro Terminal
            </button>
          </div>

          {/* Wallet & Time */}
          <div className="flex items-center gap-4">
            {/* NXUSD Wallet */}
            <motion.button
              onClick={onOpenCheckout}
              className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full hover:bg-emerald-500/20 transition-colors"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">$</span>
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-emerald-600">${wallet.nxusdBalance.toFixed(2)}</div>
                <div className="text-[10px] text-emerald-600/60">NXUSD Balance</div>
              </div>
              {wallet.pendingDividends > 0 && (
                <div className="px-2 py-0.5 bg-emerald-500 rounded-full">
                  <span className="text-[10px] text-white font-medium">+${wallet.pendingDividends.toFixed(2)}</span>
                </div>
              )}
            </motion.button>

            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs text-[#171717]/60">LIVE</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono text-[#171717]">{time.toLocaleTimeString('en-US', { hour12: false })}</div>
              <div className="text-[10px] text-[#171717]/40">KST</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Shadow Alpha Scoreboard (unchanged)
function ShadowAlphaScoreboard() {
  const alpha = useShadowAlpha();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#171717] text-[#F9F9F7] rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
          <span className="text-xs tracking-widest text-cyan-400">SHADOW ALPHA</span>
        </div>
        <span className="text-[10px] text-white/40">$1M SIMULATION • LIVE</span>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div>
          <div className="text-[10px] text-white/40 mb-1">Simulated P&L</div>
          <div className="text-2xl font-bold text-cyan-400">+${alpha.pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <div className="text-xs text-cyan-400/60">+{alpha.pnlPercent.toFixed(2)}%</div>
        </div>
        <div>
          <div className="text-[10px] text-white/40 mb-1">Annualized</div>
          <div className="text-2xl font-bold text-emerald-400">{alpha.annualizedReturn.toFixed(0)}%</div>
          <div className="text-xs text-emerald-400/60">Target: 150%+</div>
        </div>
        <div>
          <div className="text-[10px] text-white/40 mb-1">Sharpe Ratio</div>
          <div className="text-2xl font-bold text-white">{alpha.sharpeRatio.toFixed(2)}</div>
          <div className="text-xs text-white/40">Institutional Grade</div>
        </div>
        <div>
          <div className="text-[10px] text-white/40 mb-1">TPS</div>
          <div className="text-2xl font-bold text-white">{alpha.tps}</div>
          <div className="flex gap-1 mt-1">
            {alpha.markets.map(m => (
              <span key={m} className="text-[8px] px-1.5 py-0.5 bg-white/10 rounded text-white/60">{m}</span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Auto-Compounding Card
function AutoCompoundingCard({
  wallet,
  setWallet
}: {
  wallet: UserWallet;
  setWallet: React.Dispatch<React.SetStateAction<UserWallet>>;
}) {
  const baseAPY = 14.8;
  const compoundAPY = 22.4; // With auto-compounding
  const projectedYearlyEarnings = wallet.autoCompoundEnabled
    ? (wallet.nxusdBalance + wallet.compoundedAmount) * (compoundAPY / 100)
    : wallet.nxusdBalance * (baseAPY / 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
            <span className="text-xl">🔄</span>
          </div>
          <div>
            <h3 className="font-bold text-[#171717]">Auto-Compounding</h3>
            <p className="text-xs text-[#171717]/60">Reinvest dividends to PJM/JEPX trading</p>
          </div>
        </div>
        <motion.button
          onClick={() => setWallet(prev => ({ ...prev, autoCompoundEnabled: !prev.autoCompoundEnabled }))}
          className={`relative w-14 h-7 rounded-full transition-colors ${
            wallet.autoCompoundEnabled ? 'bg-emerald-500' : 'bg-[#171717]/20'
          }`}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
            animate={{ left: wallet.autoCompoundEnabled ? '32px' : '4px' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </motion.button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white/50 rounded-xl p-3">
          <div className="text-[10px] text-[#171717]/60 mb-1">Base APY</div>
          <div className="text-lg font-bold text-[#171717]">{baseAPY}%</div>
        </div>
        <div className="bg-white/50 rounded-xl p-3">
          <div className="text-[10px] text-[#171717]/60 mb-1">With Compound</div>
          <div className="text-lg font-bold text-emerald-600">{compoundAPY}%</div>
          <div className="text-[10px] text-emerald-600">+{(compoundAPY - baseAPY).toFixed(1)}%</div>
        </div>
        <div className="bg-white/50 rounded-xl p-3">
          <div className="text-[10px] text-[#171717]/60 mb-1">Projected Yearly</div>
          <div className="text-lg font-bold text-amber-600">${projectedYearlyEarnings.toFixed(0)}</div>
        </div>
      </div>

      {wallet.autoCompoundEnabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white/50 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#171717]/60">Compounded Amount</span>
            <span className="text-sm font-bold text-emerald-600">
              ${wallet.compoundedAmount.toFixed(2)}
            </span>
          </div>
          <div className="text-[10px] text-[#171717]/40">
            Auto-reinvesting to PJM & JEPX markets for maximum yield
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// Energy Flow Visualization
function EnergyFlowVisualization({ node }: { node: EnergyNode }) {
  const allocations = useServiceAllocations(node.generation);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-[#171717]/10 p-6"
    >
      <h3 className="text-lg font-bold text-[#171717] mb-6">Energy Distribution Flow</h3>

      <div className="relative">
        {/* Central Node */}
        <div className="flex items-center justify-center mb-8">
          <motion.div
            className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex flex-col items-center justify-center relative"
            animate={{ boxShadow: ['0 0 0 0 rgba(16, 185, 129, 0.4)', '0 0 0 20px rgba(16, 185, 129, 0)', '0 0 0 0 rgba(16, 185, 129, 0.4)'] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <span className="text-2xl">⚡</span>
            <span className="text-xs font-bold text-white">{node.generation.toLocaleString()}</span>
            <span className="text-[8px] text-white/80">kWh/hr</span>
          </motion.div>
        </div>

        {/* Flow Lines & Service Cards */}
        <div className="grid grid-cols-4 gap-4">
          {allocations.map((alloc, idx) => (
            <motion.div
              key={alloc.service}
              className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedService === alloc.service
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-[#171717]/10 hover:border-[#171717]/30'
              }`}
              onClick={() => setSelectedService(selectedService === alloc.service ? null : alloc.service)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              {/* Flow animation line */}
              <motion.div
                className="absolute -top-8 left-1/2 w-0.5 h-8"
                style={{ backgroundColor: alloc.color }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: idx * 0.2 }}
              />

              {/* Animated dot */}
              <motion.div
                className="absolute -top-6 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
                style={{ backgroundColor: alloc.color }}
                animate={{ y: [0, 24, 0], opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: idx * 0.2 }}
              />

              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: alloc.color }} />
                <span className="text-xs font-medium text-[#171717]">{alloc.service}</span>
              </div>
              <div className="text-xl font-bold text-[#171717]">{alloc.percentage}%</div>
              <div className="text-xs text-[#171717]/60">{alloc.kwhAllocated.toLocaleString()} kWh</div>

              {selectedService === alloc.service && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 pt-3 border-t border-[#171717]/10"
                >
                  <div className="text-[10px] text-[#171717]/60">
                    {alloc.service === 'NEXUS-X Trading' && 'Powers AI trading algorithms across 4 global markets'}
                    {alloc.service === 'K-Universal Travel' && 'Carbon-neutral hotel & flight bookings'}
                    {alloc.service === 'Aura Sydney Fashion' && 'Sustainable fashion marketplace operations'}
                    {alloc.service === 'Grid Reserve' && 'Emergency backup & grid stability'}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Energy Node Visualization (Updated)
function EnergyNodeVisualization({
  node,
  onInvest,
  wallet,
  setWallet,
}: {
  node: EnergyNode;
  onInvest: () => void;
  wallet: UserWallet;
  setWallet: React.Dispatch<React.SetStateAction<UserWallet>>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [showFlowDetail, setShowFlowDetail] = useState(false);

  useEffect(() => {
    setHistory(prev => [...prev.slice(-50), node.generation]);
  }, [node.generation]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (history.length < 2) return;

    const min = Math.min(...history) * 0.95;
    const max = Math.max(...history) * 1.05;
    const range = max - min || 1;

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

    ctx.beginPath();
    ctx.moveTo(0, height);
    history.forEach((val, i) => {
      const x = (i / (history.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      ctx.lineTo(x, y);
    });
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    history.forEach((val, i) => {
      const x = (i / (history.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [history]);

  const progress = (node.soldTokens / node.totalTokens) * 100;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-[#171717]/10 overflow-hidden"
      >
        {/* Header */}
        <div className="p-8 border-b border-[#171717]/5">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <motion.div
                  className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center cursor-pointer"
                  onClick={() => setShowFlowDetail(!showFlowDetail)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-2xl">⚡</span>
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold text-[#171717]">{node.nameKo}</h2>
                  <p className="text-sm text-[#171717]/40">{node.name}</p>
                </div>
              </div>
              <p className="text-sm text-[#171717]/60">{node.location}</p>
              <button
                onClick={() => setShowFlowDetail(!showFlowDetail)}
                className="mt-2 text-xs text-emerald-600 hover:text-emerald-700"
              >
                {showFlowDetail ? 'Hide' : 'View'} Energy Distribution →
              </button>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-emerald-600">{node.status}</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-[#F9F9F7] rounded-xl">
              <div className="text-[10px] text-[#171717]/40 uppercase tracking-wider mb-1">Capacity</div>
              <div className="text-xl font-bold text-[#171717]">{(node.capacity / 1000).toFixed(0)} MW</div>
            </div>
            <div className="p-4 bg-[#F9F9F7] rounded-xl">
              <div className="text-[10px] text-[#171717]/40 uppercase tracking-wider mb-1">Land Area</div>
              <div className="text-xl font-bold text-[#171717]">{node.area.toLocaleString()}</div>
              <div className="text-[10px] text-[#171717]/40">Pyeong</div>
            </div>
            <div className="p-4 bg-[#F9F9F7] rounded-xl">
              <div className="text-[10px] text-[#171717]/40 uppercase tracking-wider mb-1">Expected APY</div>
              <div className="text-xl font-bold text-emerald-600">{node.apy.toFixed(1)}%</div>
            </div>
            <div className="p-4 bg-[#F9F9F7] rounded-xl">
              <div className="text-[10px] text-[#171717]/40 uppercase tracking-wider mb-1">Token Price</div>
              <div className="text-xl font-bold text-[#171717]">${node.tokenPrice}</div>
              <div className="text-[10px] text-[#171717]/40">{node.tokenSymbol}</div>
            </div>
          </div>
        </div>

        {/* Generation Chart */}
        <div className="p-8 border-b border-[#171717]/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#171717]">Real-Time Generation</h3>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-[#171717]">{node.generation.toLocaleString()}</div>
                <div className="text-[10px] text-[#171717]/40">kWh / hour</div>
              </div>
              <div className="w-px h-10 bg-[#171717]/10" />
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-600">${node.revenue.toLocaleString()}</div>
                <div className="text-[10px] text-emerald-600/60">Revenue / hour</div>
              </div>
            </div>
          </div>
          <div className="h-32 bg-[#F9F9F7] rounded-xl overflow-hidden">
            <canvas ref={canvasRef} width={600} height={128} className="w-full h-full" />
          </div>
        </div>

        {/* Investment Progress */}
        <div className="p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#171717]">Fundraising Progress</h3>
            <div className="text-sm text-[#171717]/60">
              <span className="font-bold text-[#171717]">{progress.toFixed(1)}%</span> funded
            </div>
          </div>

          <div className="h-4 bg-[#F9F9F7] rounded-full overflow-hidden mb-4">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1 }}
            />
          </div>

          <div className="flex items-center justify-between text-sm text-[#171717]/60 mb-6">
            <span>{node.soldTokens.toLocaleString()} / {node.totalTokens.toLocaleString()} tokens sold</span>
            <span>Target: ${(node.totalTokens * node.tokenPrice / 1000000).toFixed(0)}M</span>
          </div>

          <motion.button
            onClick={onInvest}
            className="w-full py-4 bg-[#171717] text-[#F9F9F7] rounded-xl font-medium text-lg hover:bg-[#171717]/90 transition-colors"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            Invest Now — From $100
          </motion.button>
          <p className="text-center text-xs text-[#171717]/40 mt-3">
            Fractional ownership • Monthly NXUSD dividends • Blockchain verified
          </p>
        </div>
      </motion.div>

      {/* Energy Flow Visualization */}
      <AnimatePresence>
        {showFlowDetail && <EnergyFlowVisualization node={node} />}
      </AnimatePresence>

      {/* Auto-Compounding Card */}
      <AutoCompoundingCard wallet={wallet} setWallet={setWallet} />
    </div>
  );
}

// Unified Checkout Modal
function UnifiedCheckoutModal({
  isOpen,
  onClose,
  wallet,
  setWallet,
  service,
  setService,
}: {
  isOpen: boolean;
  onClose: () => void;
  wallet: UserWallet;
  setWallet: React.Dispatch<React.SetStateAction<UserWallet>>;
  service: CheckoutService;
  setService: (s: CheckoutService) => void;
}) {
  const [step, setStep] = useState<'select' | 'checkout' | 'success'>('select');
  const [selectedItem, setSelectedItem] = useState<{ name: string; price: number; image: string } | null>(null);

  const ecoRewardDiscount = 0.05; // 5% Eco-Reward

  const travelItems = [
    { name: 'Seoul Luxury Hotel (3 nights)', price: 450, image: '🏨' },
    { name: 'Jeju Island Flight (Round-trip)', price: 180, image: '✈️' },
    { name: 'KTX First Class (Seoul-Busan)', price: 85, image: '🚄' },
  ];

  const fashionItems = [
    { name: 'Designer Handbag Collection', price: 320, image: '👜' },
    { name: 'Sustainable Denim Jacket', price: 145, image: '🧥' },
    { name: 'Luxury Watch Edition', price: 890, image: '⌚' },
  ];

  const items = service === 'travel' ? travelItems : fashionItems;

  const handlePurchase = useCallback(() => {
    if (!selectedItem) return;
    const discountedPrice = selectedItem.price * (1 - ecoRewardDiscount);
    if (wallet.nxusdBalance >= discountedPrice) {
      setStep('success');
      setWallet(prev => ({
        ...prev,
        nxusdBalance: prev.nxusdBalance - discountedPrice,
      }));
    }
  }, [selectedItem, wallet.nxusdBalance, setWallet]);

  const resetAndClose = useCallback(() => {
    setStep('select');
    setSelectedItem(null);
    setService(null);
    onClose();
  }, [onClose, setService]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={resetAndClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl max-w-lg w-full overflow-hidden max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Service Selection */}
          {!service && step === 'select' && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-[#171717] mb-2">Unified Checkout</h2>
              <p className="text-sm text-[#171717]/60 mb-6">
                Pay with your Energy Dividends (NXUSD) and get <span className="text-emerald-600 font-bold">5% Eco-Reward</span>
              </p>

              {/* Wallet Balance */}
              <div className="bg-emerald-500/10 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">$</span>
                    </div>
                    <div>
                      <div className="text-sm text-[#171717]/60">NXUSD Balance</div>
                      <div className="text-xl font-bold text-emerald-600">${wallet.nxusdBalance.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-emerald-600">From Energy Dividends</div>
                    <div className="text-sm font-medium text-emerald-600">Total Earned: ${wallet.totalEarned.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <h3 className="text-sm font-medium text-[#171717] mb-4">Select Service</h3>
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  onClick={() => setService('travel')}
                  className="p-6 rounded-xl border-2 border-[#171717]/10 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                  whileHover={{ scale: 1.02 }}
                >
                  <span className="text-3xl mb-3 block">✈️</span>
                  <div className="font-bold text-[#171717]">K-Universal</div>
                  <div className="text-xs text-[#171717]/60">Travel & Experiences</div>
                </motion.button>
                <motion.button
                  onClick={() => setService('fashion')}
                  className="p-6 rounded-xl border-2 border-[#171717]/10 hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
                  whileHover={{ scale: 1.02 }}
                >
                  <span className="text-3xl mb-3 block">👗</span>
                  <div className="font-bold text-[#171717]">Aura Sydney</div>
                  <div className="text-xs text-[#171717]/60">Fashion & Style</div>
                </motion.button>
              </div>
            </div>
          )}

          {/* Item Selection */}
          {service && step === 'select' && (
            <div className="p-8">
              <button
                onClick={() => setService(null)}
                className="text-sm text-[#171717]/60 mb-4 hover:text-[#171717]"
              >
                ← Back to services
              </button>
              <h2 className="text-2xl font-bold text-[#171717] mb-6">
                {service === 'travel' ? '✈️ K-Universal' : '👗 Aura Sydney'}
              </h2>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => { setSelectedItem(item); setStep('checkout'); }}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      selectedItem?.name === item.name
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-[#171717]/10 hover:border-[#171717]/30'
                    }`}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.image}</span>
                        <span className="font-medium text-[#171717]">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-[#171717]">${item.price}</div>
                        <div className="text-xs text-emerald-600">
                          ${(item.price * (1 - ecoRewardDiscount)).toFixed(2)} with Eco-Reward
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Checkout */}
          {step === 'checkout' && selectedItem && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-[#171717] mb-6">Checkout</h2>

              <div className="bg-[#F9F9F7] rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{selectedItem.image}</span>
                  <div>
                    <div className="font-medium text-[#171717]">{selectedItem.name}</div>
                    <div className="text-sm text-[#171717]/60">
                      {service === 'travel' ? 'K-Universal' : 'Aura Sydney'}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-[#171717]/10">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#171717]/60">Subtotal</span>
                    <span className="text-[#171717]">${selectedItem.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600 font-medium">Eco-Reward (5%)</span>
                    <span className="text-emerald-600">-${(selectedItem.price * ecoRewardDiscount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-[#171717]/10">
                    <span className="text-[#171717]">Total</span>
                    <span className="text-emerald-600">${(selectedItem.price * (1 - ecoRewardDiscount)).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-emerald-500/10 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">$</span>
                    </div>
                    <div>
                      <div className="text-xs text-[#171717]/60">Pay with</div>
                      <div className="font-bold text-emerald-600">NXUSD Energy Dividend</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#171717]">${wallet.nxusdBalance.toFixed(2)}</div>
                    <div className="text-[10px] text-[#171717]/60">Available</div>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePurchase}
                disabled={wallet.nxusdBalance < selectedItem.price * (1 - ecoRewardDiscount)}
                className="w-full py-4 bg-emerald-500 text-white rounded-xl font-medium text-lg hover:bg-emerald-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {wallet.nxusdBalance >= selectedItem.price * (1 - ecoRewardDiscount)
                  ? 'Pay with NXUSD'
                  : 'Insufficient Balance'}
              </button>
              <button
                onClick={() => { setStep('select'); setSelectedItem(null); }}
                className="w-full py-3 text-[#171717]/60 text-sm mt-2"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Success */}
          {step === 'success' && selectedItem && (
            <div className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 bg-emerald-500 rounded-full mx-auto mb-6 flex items-center justify-center"
              >
                <span className="text-4xl">✓</span>
              </motion.div>
              <h2 className="text-2xl font-bold text-[#171717] mb-2">Payment Successful!</h2>
              <p className="text-sm text-[#171717]/60 mb-6">
                You saved ${(selectedItem.price * ecoRewardDiscount).toFixed(2)} with Eco-Reward
              </p>

              <div className="bg-[#F9F9F7] rounded-xl p-4 mb-6 text-left">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{selectedItem.image}</span>
                  <div>
                    <div className="font-medium text-[#171717]">{selectedItem.name}</div>
                    <div className="text-sm text-emerald-600">Paid ${(selectedItem.price * (1 - ecoRewardDiscount)).toFixed(2)} NXUSD</div>
                  </div>
                </div>
                <div className="text-xs text-[#171717]/40 pt-3 border-t border-[#171717]/10">
                  Energy Dividend → {service === 'travel' ? 'Travel' : 'Fashion'} • Carbon Neutral Transaction
                </div>
              </div>

              <button
                onClick={resetAndClose}
                className="w-full py-4 bg-[#171717] text-[#F9F9F7] rounded-xl font-medium"
              >
                Done
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Investment Modal (same as before)
function InvestmentModal({ node, isOpen, onClose }: { node: EnergyNode; isOpen: boolean; onClose: () => void }) {
  const [amount, setAmount] = useState(1);
  const [step, setStep] = useState<'amount' | 'confirm' | 'success'>('amount');

  const totalCost = amount * node.tokenPrice;
  const monthlyDividend = (totalCost * (node.apy / 100)) / 12;

  const handleInvest = useCallback(() => {
    setStep('confirm');
    setTimeout(() => setStep('success'), 1500);
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl max-w-md w-full overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {step === 'amount' && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-[#171717] mb-2">Invest in {node.tokenSymbol}</h2>
              <p className="text-sm text-[#171717]/60 mb-8">{node.nameKo}</p>

              <div className="mb-6">
                <label className="text-sm font-medium text-[#171717] mb-2 block">Number of Tokens</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setAmount(Math.max(1, amount - 1))}
                    className="w-12 h-12 rounded-xl bg-[#F9F9F7] text-[#171717] font-bold text-xl hover:bg-[#171717]/5"
                  >-</button>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))}
                    className="flex-1 h-12 text-center text-2xl font-bold text-[#171717] bg-[#F9F9F7] rounded-xl border-0 focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={() => setAmount(Math.min(500, amount + 1))}
                    className="w-12 h-12 rounded-xl bg-[#F9F9F7] text-[#171717] font-bold text-xl hover:bg-[#171717]/5"
                  >+</button>
                </div>
              </div>

              <div className="flex gap-2 mb-8">
                {[1, 5, 10, 50, 100].map(n => (
                  <button
                    key={n}
                    onClick={() => setAmount(n)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      amount === n ? 'bg-[#171717] text-[#F9F9F7]' : 'bg-[#F9F9F7] text-[#171717] hover:bg-[#171717]/5'
                    }`}
                  >{n}</button>
                ))}
              </div>

              <div className="bg-[#F9F9F7] rounded-2xl p-6 mb-6">
                <div className="flex justify-between mb-3">
                  <span className="text-sm text-[#171717]/60">Total Investment</span>
                  <span className="text-lg font-bold text-[#171717]">${totalCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-3">
                  <span className="text-sm text-[#171717]/60">Expected APY</span>
                  <span className="text-lg font-bold text-emerald-600">{node.apy.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-[#171717]/10">
                  <span className="text-sm text-[#171717]/60">Est. Monthly Dividend</span>
                  <span className="text-lg font-bold text-emerald-600">${monthlyDividend.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleInvest}
                className="w-full py-4 bg-emerald-500 text-white rounded-xl font-medium text-lg hover:bg-emerald-600 transition-colors"
              >Confirm Investment</button>
              <button onClick={onClose} className="w-full py-3 text-[#171717]/60 text-sm mt-2">Cancel</button>
            </div>
          )}

          {step === 'confirm' && (
            <div className="p-8 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-6"
              />
              <h2 className="text-xl font-bold text-[#171717] mb-2">Processing Investment</h2>
              <p className="text-sm text-[#171717]/60">Verifying on blockchain...</p>
            </div>
          )}

          {step === 'success' && (
            <div className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 bg-emerald-500 rounded-full mx-auto mb-6 flex items-center justify-center"
              >
                <span className="text-3xl">✓</span>
              </motion.div>
              <h2 className="text-xl font-bold text-[#171717] mb-2">Investment Complete!</h2>
              <p className="text-sm text-[#171717]/60 mb-6">You now own {amount} {node.tokenSymbol} tokens</p>
              <div className="bg-[#F9F9F7] rounded-xl p-4 mb-6">
                <div className="text-sm text-[#171717]/60">First Dividend Expected</div>
                <div className="text-lg font-bold text-emerald-600">~${monthlyDividend.toFixed(2)} / month</div>
              </div>
              <button
                onClick={() => { onClose(); setStep('amount'); }}
                className="w-full py-4 bg-[#171717] text-[#F9F9F7] rounded-xl font-medium"
              >Done</button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Pro Terminal View (updated)
function ProTerminalView() {
  const alpha = useShadowAlpha();
  const locale = useLocale();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="bg-[#171717] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-sm text-white/60">NEXUS-X PRO TERMINAL</span>
          </div>
          <Link
            href={`/${locale}/nexus/pro`}
            className="px-4 py-2 bg-white/10 rounded-lg text-sm text-white hover:bg-white/20 transition-colors"
          >Open Full Terminal →</Link>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {[
            { label: 'Capital', value: '$1M', sub: 'Deployed' },
            { label: 'P&L', value: `+$${(alpha.pnl / 1000).toFixed(1)}K`, sub: `+${alpha.pnlPercent.toFixed(2)}%`, color: 'text-emerald-400' },
            { label: 'Win Rate', value: `${alpha.winRate.toFixed(1)}%`, sub: `${alpha.trades.toLocaleString()} trades` },
            { label: 'Sharpe', value: alpha.sharpeRatio.toFixed(2), sub: 'Institutional' },
            { label: 'TPS', value: alpha.tps.toString(), sub: '4 Markets' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">{stat.label}</div>
              <div className={`text-xl font-bold ${stat.color || 'text-white'}`}>{stat.value}</div>
              <div className="text-[10px] text-white/40">{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {alpha.markets.map(market => (
          <div key={market} className="bg-white rounded-xl border border-[#171717]/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[#171717]">{market}</span>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <div className="text-lg font-bold text-[#171717]">+{(Math.random() * 2 + 0.5).toFixed(2)}%</div>
            <div className="text-xs text-[#171717]/40">Today</div>
          </div>
        ))}
      </div>

      <div className="bg-[#F9F9F7] rounded-2xl p-6">
        <h3 className="text-sm font-medium text-[#171717] mb-4">Institutional API Access</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { endpoint: '/api/trading/mega-capital', desc: 'Trading Engine' },
            { endpoint: '/api/rwa/oracle', desc: 'Energy Oracle' },
            { endpoint: '/api/rwa/investment', desc: 'RWA Investment' },
          ].map((api, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-[#171717]/5">
              <code className="text-xs text-emerald-600 block mb-1">{api.endpoint}</code>
              <span className="text-xs text-[#171717]/40">{api.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Footer
function SovereignFooter() {
  return (
    <footer className="bg-[#171717] text-[#F9F9F7] py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-[#F9F9F7] rounded-lg flex items-center justify-center">
                <span className="text-[#171717] font-black text-xs">F9</span>
              </div>
              <span className="font-bold">FIELD NINE</span>
            </div>
            <p className="text-sm text-white/40">The Energy Sovereign Hub.<br />Where energy becomes capital.</p>
          </div>
          <div>
            <h4 className="font-medium mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-white/40">
              <li><Link href="/ko/nexus" className="hover:text-white">NEXUS-X Trading</Link></li>
              <li><Link href="/ko/nexus/pro" className="hover:text-white">Pro Terminal</Link></li>
              <li><a href="https://docs.fieldnine.io" className="hover:text-white">API Docs</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4">Ecosystem</h4>
            <ul className="space-y-2 text-sm text-white/40">
              <li><Link href="/ko/dashboard" className="hover:text-white">K-Universal Travel</Link></li>
              <li><Link href="/ko/dashboard/vibe" className="hover:text-white">Aura Sydney</Link></li>
              <li><a href="#" className="hover:text-white">Energy RWA</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-white/40">
              <li><Link href="/ko/legal/terms" className="hover:text-white">Terms</Link></li>
              <li><Link href="/ko/legal/privacy" className="hover:text-white">Privacy</Link></li>
              <li><a href="#" className="hover:text-white">Risk Disclosure</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
          <span>© 2026 Field Nine Solutions. All rights reserved.</span>
          <span>Energy is Currency. Powering the future.</span>
        </div>
      </div>
    </footer>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function EnergySovereignHub() {
  const [mode, setMode] = useState<InvestmentMode>('retail');
  const [investModalOpen, setInvestModalOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutService, setCheckoutService] = useState<CheckoutService>(null);
  const node = useEnergyNode();
  const [wallet, setWallet] = useUserWallet();

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <SovereignHeader
        mode={mode}
        setMode={setMode}
        wallet={wallet}
        onOpenCheckout={() => setCheckoutOpen(true)}
      />

      <main className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-7xl font-black text-[#171717] tracking-tight mb-4">
              Energy is Currency.
            </h1>
            <p className="text-xl text-[#171717]/60 max-w-2xl mx-auto">
              Invest in real energy infrastructure. Earn dividends.<br />
              Spend across the entire Field Nine ecosystem.
            </p>
          </motion.div>

          {/* Shadow Alpha Scoreboard */}
          <div className="mb-12">
            <ShadowAlphaScoreboard />
          </div>

          {/* Mode Content */}
          <AnimatePresence mode="wait">
            {mode === 'retail' ? (
              <motion.div
                key="retail"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <EnergyNodeVisualization
                  node={node}
                  onInvest={() => setInvestModalOpen(true)}
                  wallet={wallet}
                  setWallet={setWallet}
                />
              </motion.div>
            ) : (
              <motion.div
                key="institutional"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <ProTerminalView />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cross-Service Payment CTA */}
          {mode === 'retail' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-12"
            >
              <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 rounded-2xl p-8 border border-[#171717]/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-[#171717] mb-2">Spend Your Energy Dividends</h3>
                    <p className="text-sm text-[#171717]/60 max-w-md">
                      Use NXUSD across K-Universal Travel and Aura Sydney Fashion.
                      Get <span className="text-emerald-600 font-bold">5% Eco-Reward</span> on every purchase.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <motion.button
                      onClick={() => { setCheckoutService('travel'); setCheckoutOpen(true); }}
                      className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
                      whileHover={{ scale: 1.02 }}
                    >
                      ✈️ Book Travel
                    </motion.button>
                    <motion.button
                      onClick={() => { setCheckoutService('fashion'); setCheckoutOpen(true); }}
                      className="px-6 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-colors"
                      whileHover={{ scale: 1.02 }}
                    >
                      👗 Shop Fashion
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <SovereignFooter />

      {/* Modals */}
      <InvestmentModal node={node} isOpen={investModalOpen} onClose={() => setInvestModalOpen(false)} />
      <UnifiedCheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        wallet={wallet}
        setWallet={setWallet}
        service={checkoutService}
        setService={setCheckoutService}
      />
    </div>
  );
}
