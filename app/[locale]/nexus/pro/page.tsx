'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TopTradersWidget,
  StrategyMarketplace,
  SocialFeedWidget,
  ActiveCopyTrades,
} from '@/components/nexus/social-trading-dashboard';

// ============================================
// Types
// ============================================

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface AlphaSignal {
  id: string;
  timestamp: string;
  market: string;
  signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  confidence: number;
  prediction: {
    direction: string;
    volatility: number;
    expectedPnL: number;
  };
}

interface PerformanceData {
  date: string;
  equity: number;
  pnl: number;
  trades: number;
}

// ============================================
// High-Performance Canvas Chart Component
// ============================================

function PerformanceChart({ data }: { data: PerformanceData[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 20, bottom: 30, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Get min/max
    const equities = data.map(d => d.equity);
    const minEquity = Math.min(...equities) * 0.999;
    const maxEquity = Math.max(...equities) * 1.001;
    const range = maxEquity - minEquity;

    // Draw grid
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Y-axis labels
      const value = maxEquity - (range * i) / 4;
      ctx.fillStyle = '#666';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`$${value.toFixed(2)}`, padding.left - 5, y + 3);
    }

    // Draw line chart
    ctx.beginPath();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;

    data.forEach((d, i) => {
      const x = padding.left + (chartWidth * i) / (data.length - 1);
      const y = padding.top + chartHeight * (1 - (d.equity - minEquity) / range);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill area
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, 'rgba(34, 197, 94, 0.3)');
    gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');

    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw current value
    const lastEquity = data[data.length - 1].equity;
    const lastY = padding.top + chartHeight * (1 - (lastEquity - minEquity) / range);

    ctx.beginPath();
    ctx.arc(width - padding.right, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#22c55e';
    ctx.fill();

    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`$${lastEquity.toFixed(2)}`, width - padding.right + 8, lastY + 4);

  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

// ============================================
// Real-time Depth Chart
// ============================================

function DepthChart({ bids, asks }: { bids: number[]; asks: number[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const midX = width / 2;

    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Draw bids (green, left side)
    let cumBid = 0;
    const maxDepth = Math.max(...bids, ...asks) * 1.2;

    ctx.beginPath();
    ctx.moveTo(midX, height);

    bids.forEach((bid, i) => {
      cumBid += bid;
      const x = midX - (cumBid / maxDepth) * (midX - 10);
      const y = height - (height * (i + 1)) / bids.length;
      ctx.lineTo(x, y);
    });

    ctx.lineTo(10, 0);
    ctx.lineTo(midX, 0);
    ctx.closePath();

    const bidGradient = ctx.createLinearGradient(0, 0, midX, 0);
    bidGradient.addColorStop(0, 'rgba(34, 197, 94, 0.4)');
    bidGradient.addColorStop(1, 'rgba(34, 197, 94, 0.1)');
    ctx.fillStyle = bidGradient;
    ctx.fill();

    // Draw asks (red, right side)
    let cumAsk = 0;
    ctx.beginPath();
    ctx.moveTo(midX, height);

    asks.forEach((ask, i) => {
      cumAsk += ask;
      const x = midX + (cumAsk / maxDepth) * (midX - 10);
      const y = height - (height * (i + 1)) / asks.length;
      ctx.lineTo(x, y);
    });

    ctx.lineTo(width - 10, 0);
    ctx.lineTo(midX, 0);
    ctx.closePath();

    const askGradient = ctx.createLinearGradient(midX, 0, width, 0);
    askGradient.addColorStop(0, 'rgba(239, 68, 68, 0.1)');
    askGradient.addColorStop(1, 'rgba(239, 68, 68, 0.4)');
    ctx.fillStyle = askGradient;
    ctx.fill();

    // Mid line
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(midX, 0);
    ctx.lineTo(midX, height);
    ctx.stroke();

  }, [bids, asks]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

// ============================================
// Main Dashboard Component
// ============================================

export default function NexusProDashboard() {
  const [connected, setConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [equity, setEquity] = useState(1000);
  const [dailyPnL, setDailyPnL] = useState(0);
  const [signals, setSignals] = useState<AlphaSignal[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [selectedMarket, setSelectedMarket] = useState('JEPX');
  const [activeTab, setActiveTab] = useState<'terminal' | 'social'>('terminal');

  // Generate mock depth data
  const [depthData, setDepthData] = useState({
    bids: Array.from({ length: 20 }, () => Math.random() * 100 + 50),
    asks: Array.from({ length: 20 }, () => Math.random() * 100 + 50),
  });

  // Market data
  const [markets, setMarkets] = useState([
    { id: 'JEPX', price: 12.50, change: 0.5, volume: 15420 },
    { id: 'AEMO', price: 85.00, change: -0.3, volume: 8930 },
  ]);

  // Initialize performance data
  useEffect(() => {
    const data: PerformanceData[] = [];
    let eq = 1000;

    for (let i = 30; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dailyChange = (Math.random() - 0.45) * 0.5;
      eq = eq * (1 + dailyChange / 100);

      data.push({
        date: date.toISOString().split('T')[0],
        equity: parseFloat(eq.toFixed(2)),
        pnl: parseFloat((dailyChange * eq / 100).toFixed(2)),
        trades: Math.floor(Math.random() * 10) + 3,
      });
    }

    setPerformanceData(data);
    setEquity(eq);
    setDailyPnL(data[data.length - 1].pnl);
  }, []);

  // Real-time updates
  useEffect(() => {
    setConnected(true);

    const interval = setInterval(() => {
      setCurrentTime(new Date());

      // Update equity
      setEquity(prev => {
        const change = (Math.random() - 0.48) * 0.1;
        return parseFloat((prev + change).toFixed(2));
      });

      // Update daily PnL
      setDailyPnL(prev => {
        const change = (Math.random() - 0.48) * 0.05;
        return parseFloat((prev + change).toFixed(2));
      });

      // Update markets
      setMarkets(prev => prev.map(m => ({
        ...m,
        price: parseFloat((m.price + (Math.random() - 0.5) * 0.1).toFixed(2)),
        change: parseFloat((m.change + (Math.random() - 0.5) * 0.1).toFixed(2)),
        volume: m.volume + Math.floor(Math.random() * 100),
      })));

      // Update depth
      setDepthData({
        bids: Array.from({ length: 20 }, () => Math.random() * 100 + 50),
        asks: Array.from({ length: 20 }, () => Math.random() * 100 + 50),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch alpha signals
  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const res = await fetch('/api/trading/alpha?action=signals');
        const data = await res.json();
        if (data.success) {
          setSignals(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch signals');
      }
    };

    fetchSignals();
    const interval = setInterval(fetchSignals, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalPnL = equity - 1000;
  const roi = (totalPnL / 1000) * 100;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono overflow-hidden">
      {/* Ambient Gradient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-xl bg-black/30">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                <span className="text-black font-bold text-sm">N</span>
              </div>
              <div>
                <div className="text-sm font-semibold tracking-tight">NEXUS-X PRO</div>
                <div className="text-[10px] text-gray-500">INSTITUTIONAL TERMINAL</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-xs text-gray-400">PHASE 49 LIVE</span>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('terminal')}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'terminal'
                    ? 'bg-green-500 text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Terminal
              </button>
              <button
                onClick={() => setActiveTab('social')}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'social'
                    ? 'bg-amber-500 text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Social Trading
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Quick Stats */}
            <div className="flex items-center gap-4 px-4 py-2 rounded-lg bg-white/5">
              <div>
                <div className="text-[10px] text-gray-500 uppercase">Equity</div>
                <div className="text-sm font-semibold">${equity.toFixed(2)}</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <div className="text-[10px] text-gray-500 uppercase">Daily P&L</div>
                <div className={`text-sm font-semibold ${dailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {dailyPnL >= 0 ? '+' : ''}${dailyPnL.toFixed(2)}
                </div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <div className="text-[10px] text-gray-500 uppercase">Total ROI</div>
                <div className={`text-sm font-semibold ${roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Time */}
            <div className="text-right">
              <div className="text-xs text-gray-400">
                {currentTime.toLocaleTimeString('en-US', { hour12: false })}
              </div>
              <div className="text-[10px] text-gray-600">KST</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 p-4 h-[calc(100vh-64px)] overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'terminal' ? (
            <motion.div
              key="terminal"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-12 gap-4"
            >
        {/* Left Column - Chart */}
        <div className="col-span-8 flex flex-col gap-4">
          {/* Performance Chart */}
          <div className="flex-1 rounded-xl border border-white/5 bg-black/40 backdrop-blur-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-medium">Portfolio Performance</h2>
                <div className="flex items-center gap-2">
                  {['1D', '7D', '30D', 'ALL'].map(period => (
                    <button
                      key={period}
                      className="px-2 py-1 text-[10px] rounded bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-green-400">+{totalPnL.toFixed(2)}</span>
                <span className="text-gray-500">({roi.toFixed(2)}%)</span>
              </div>
            </div>
            <div className="p-4 h-[calc(100%-52px)]">
              <PerformanceChart data={performanceData} />
            </div>
          </div>

          {/* Bottom Row */}
          <div className="h-48 grid grid-cols-2 gap-4">
            {/* Market Depth */}
            <div className="rounded-xl border border-white/5 bg-black/40 backdrop-blur-sm overflow-hidden">
              <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-xs font-medium">Order Book Depth</h2>
                <select
                  value={selectedMarket}
                  onChange={(e) => setSelectedMarket(e.target.value)}
                  className="bg-transparent text-xs text-gray-400 border-none outline-none"
                >
                  <option value="JEPX">JEPX</option>
                  <option value="AEMO">AEMO</option>
                </select>
              </div>
              <div className="p-2 h-[calc(100%-40px)]">
                <DepthChart bids={depthData.bids} asks={depthData.asks} />
              </div>
            </div>

            {/* Alpha Signals */}
            <div className="rounded-xl border border-white/5 bg-black/40 backdrop-blur-sm overflow-hidden">
              <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-xs font-medium">Alpha Signals</h2>
                <span className="text-[10px] text-blue-400">AI-POWERED</span>
              </div>
              <div className="p-2 space-y-2 overflow-y-auto h-[calc(100%-40px)]">
                {signals.map((signal, i) => (
                  <motion.div
                    key={signal.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-2 rounded-lg bg-white/5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        signal.signal.includes('BUY') ? 'bg-green-400' :
                        signal.signal.includes('SELL') ? 'bg-red-400' : 'bg-gray-400'
                      }`} />
                      <span className="text-xs">{signal.market}</span>
                    </div>
                    <div className={`text-xs font-medium ${
                      signal.signal.includes('BUY') ? 'text-green-400' :
                      signal.signal.includes('SELL') ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {signal.signal}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {(signal.confidence * 100).toFixed(0)}%
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Controls */}
        <div className="col-span-4 flex flex-col gap-4">
          {/* Market Overview */}
          <div className="rounded-xl border border-white/5 bg-black/40 backdrop-blur-sm p-4">
            <h2 className="text-xs font-medium text-gray-400 mb-4">LIVE MARKETS</h2>
            <div className="space-y-3">
              {markets.map(market => (
                <div
                  key={market.id}
                  className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{market.id}</span>
                    <span className={`text-sm ${market.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {market.change >= 0 ? '+' : ''}{market.change.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">${market.price.toFixed(2)}</span>
                    <span className="text-[10px] text-gray-500">VOL: {market.volume.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Monitor */}
          <div className="rounded-xl border border-white/5 bg-black/40 backdrop-blur-sm p-4">
            <h2 className="text-xs font-medium text-gray-400 mb-4">RISK SHIELD</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-400">MDD</span>
                  <span>0.45% / 2.0%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full w-[22%] bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-400">Position Utilization</span>
                  <span>35%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full w-[35%] bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full" />
                </div>
              </div>
              <div className="pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Safety Lock</span>
                  <span className="px-2 py-0.5 text-[10px] rounded bg-green-500/20 text-green-400 border border-green-500/30">
                    ARMED
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="rounded-xl border border-white/5 bg-black/40 backdrop-blur-sm p-4">
            <h2 className="text-xs font-medium text-gray-400 mb-4">PERFORMANCE</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 rounded-lg bg-white/5">
                <div className="text-[10px] text-gray-500 uppercase">Win Rate</div>
                <div className="text-lg font-semibold text-green-400">72.3%</div>
              </div>
              <div className="p-2 rounded-lg bg-white/5">
                <div className="text-[10px] text-gray-500 uppercase">Sharpe</div>
                <div className="text-lg font-semibold text-blue-400">1.85</div>
              </div>
              <div className="p-2 rounded-lg bg-white/5">
                <div className="text-[10px] text-gray-500 uppercase">Total Trades</div>
                <div className="text-lg font-semibold">47</div>
              </div>
              <div className="p-2 rounded-lg bg-white/5">
                <div className="text-[10px] text-gray-500 uppercase">Accuracy</div>
                <div className="text-lg font-semibold text-purple-400">80.9%</div>
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="flex-1 rounded-xl border border-white/5 bg-black/40 backdrop-blur-sm p-4">
            <h2 className="text-xs font-medium text-gray-400 mb-4">CONTROLS</h2>
            <div className="space-y-2">
              <button className="w-full py-2 rounded-lg bg-green-500/20 text-green-400 text-sm border border-green-500/30 hover:bg-green-500/30 transition-colors">
                View Institutional API
              </button>
              <button className="w-full py-2 rounded-lg bg-blue-500/20 text-blue-400 text-sm border border-blue-500/30 hover:bg-blue-500/30 transition-colors">
                Proof of Reserve
              </button>
              <button className="w-full py-2 rounded-lg bg-red-500/20 text-red-400 text-sm border border-red-500/30 hover:bg-red-500/30 transition-colors">
                Emergency Stop
              </button>
            </div>
          </div>
        </div>
            </motion.div>
          ) : (
            <motion.div
              key="social"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-12 gap-6"
            >
              {/* Left Column - Main Content */}
              <div className="col-span-8 space-y-6">
                {/* Top Traders */}
                <TopTradersWidget />

                {/* Strategy Marketplace */}
                <StrategyMarketplace />
              </div>

              {/* Right Column - Feed & Active Copies */}
              <div className="col-span-4 space-y-6">
                {/* Active Copy Trades */}
                <ActiveCopyTrades />

                {/* Social Feed */}
                <SocialFeedWidget />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
