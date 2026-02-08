'use client';

/**
 * GLOBAL ROYALTY MAP DASHBOARD
 *
 * Tesla-style real-time visualization of:
 * - Global transaction flow
 * - Royalty accumulation
 * - Market share by region
 * - Live energy trading activity
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Node location data
const GLOBAL_NODES = [
  { id: 'YEONGDONG-001', name: 'Yeongdong', country: 'KR', region: 'Asia', lat: 37.5, lng: 127, color: '#22c55e' },
  { id: 'PJM-EAST-001', name: 'PJM East', country: 'US', region: 'Americas', lat: 39.5, lng: -76, color: '#3b82f6' },
  { id: 'AEMO-VIC-001', name: 'Victoria', country: 'AU', region: 'Oceania', lat: -37.8, lng: 145, color: '#f59e0b' },
  { id: 'EPEX-DE-001', name: 'Germany', country: 'DE', region: 'Europe', lat: 51.5, lng: 10.5, color: '#ec4899' },
  { id: 'JP-TOKYO-001', name: 'Tokyo', country: 'JP', region: 'Asia', lat: 35.7, lng: 139.7, color: '#8b5cf6' },
  { id: 'UK-LONDON-001', name: 'London', country: 'UK', region: 'Europe', lat: 51.5, lng: -0.1, color: '#14b8a6' },
  { id: 'CN-BEIJING-001', name: 'Beijing', country: 'CN', region: 'Asia', lat: 39.9, lng: 116.4, color: '#ef4444' },
  { id: 'BR-SAO-001', name: 'São Paulo', country: 'BR', region: 'Americas', lat: -23.5, lng: -46.6, color: '#84cc16' },
];

interface Transaction {
  id: string;
  from: typeof GLOBAL_NODES[0];
  to: typeof GLOBAL_NODES[0];
  amount: number;
  royalty: number;
  timestamp: number;
  type: 'swap' | 'verify' | 'attest';
}

interface GlobalStats {
  totalTransactions: number;
  totalRoyalties: number;
  totalKwh: number;
  activeNodes: number;
  tps: number;
  marketShare: number;
  regionBreakdown: Record<string, { transactions: number; royalties: number; kwh: number }>;
}

export default function GlobalRoyaltyMapPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stats, setStats] = useState<GlobalStats>({
    totalTransactions: 1847293,
    totalRoyalties: 184729.30,
    totalKwh: 18472930000,
    activeNodes: 8,
    tps: 127.5,
    marketShare: 2.3,
    regionBreakdown: {
      Asia: { transactions: 738917, royalties: 73891.70, kwh: 7389170000 },
      Americas: { transactions: 461823, royalties: 46182.30, kwh: 4618230000 },
      Europe: { transactions: 369458, royalties: 36945.80, kwh: 3694580000 },
      Oceania: { transactions: 277095, royalties: 27709.50, kwh: 2770950000 },
    },
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);

  // Convert lat/lng to canvas coordinates
  const latLngToCanvas = useCallback((lat: number, lng: number, width: number, height: number) => {
    const x = ((lng + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return { x, y };
  }, []);

  // Draw the world map
  const drawMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    // Vertical lines (longitude)
    for (let lng = -180; lng <= 180; lng += 30) {
      const { x } = latLngToCanvas(0, lng, width, height);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines (latitude)
    for (let lat = -60; lat <= 90; lat += 30) {
      const { y } = latLngToCanvas(lat, 0, width, height);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw nodes
    GLOBAL_NODES.forEach((node) => {
      const { x, y } = latLngToCanvas(node.lat, node.lng, width, height);

      // Outer glow
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 30);
      gradient.addColorStop(0, node.color + '40');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      ctx.fill();

      // Pulsing ring
      const pulseSize = 15 + Math.sin(Date.now() / 500) * 5;
      ctx.strokeStyle = node.color + '80';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
      ctx.stroke();

      // Center dot
      ctx.fillStyle = node.color;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();

      // Node label
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '12px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(node.name, x, y + 25);
    });

    // Draw recent transaction lines
    recentTransactions.slice(-10).forEach((tx, index) => {
      const fromPos = latLngToCanvas(tx.from.lat, tx.from.lng, width, height);
      const toPos = latLngToCanvas(tx.to.lat, tx.to.lng, width, height);

      // Calculate control point for curved line
      const midX = (fromPos.x + toPos.x) / 2;
      const midY = (fromPos.y + toPos.y) / 2 - 50;

      // Animated gradient
      const progress = ((Date.now() - tx.timestamp) / 3000) % 1;
      const alpha = Math.max(0, 1 - progress);

      const gradient = ctx.createLinearGradient(fromPos.x, fromPos.y, toPos.x, toPos.y);
      gradient.addColorStop(0, tx.from.color + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
      gradient.addColorStop(0.5, '#ffffff' + Math.floor(alpha * 128).toString(16).padStart(2, '0'));
      gradient.addColorStop(1, tx.to.color + Math.floor(alpha * 255).toString(16).padStart(2, '0'));

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(fromPos.x, fromPos.y);
      ctx.quadraticCurveTo(midX, midY, toPos.x, toPos.y);
      ctx.stroke();

      // Animated particle
      const particleT = progress;
      const particleX = Math.pow(1 - particleT, 2) * fromPos.x + 2 * (1 - particleT) * particleT * midX + Math.pow(particleT, 2) * toPos.x;
      const particleY = Math.pow(1 - particleT, 2) * fromPos.y + 2 * (1 - particleT) * particleT * midY + Math.pow(particleT, 2) * toPos.y;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(particleX, particleY, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [latLngToCanvas, recentTransactions]);

  // Generate random transactions
  useEffect(() => {
    if (!isAnimating) return;

    const interval = setInterval(() => {
      const fromNode = GLOBAL_NODES[Math.floor(Math.random() * GLOBAL_NODES.length)];
      let toNode = GLOBAL_NODES[Math.floor(Math.random() * GLOBAL_NODES.length)];
      while (toNode.id === fromNode.id) {
        toNode = GLOBAL_NODES[Math.floor(Math.random() * GLOBAL_NODES.length)];
      }

      const amount = 100 + Math.random() * 900;
      const royalty = amount * 0.001;

      const newTx: Transaction = {
        id: `TX-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        from: fromNode,
        to: toNode,
        amount,
        royalty,
        timestamp: Date.now(),
        type: ['swap', 'verify', 'attest'][Math.floor(Math.random() * 3)] as Transaction['type'],
      };

      setRecentTransactions(prev => [...prev.slice(-20), newTx]);

      setStats(prev => ({
        ...prev,
        totalTransactions: prev.totalTransactions + 1,
        totalRoyalties: prev.totalRoyalties + royalty,
        totalKwh: prev.totalKwh + amount * 1000,
        tps: 120 + Math.random() * 20,
      }));
    }, 500);

    return () => clearInterval(interval);
  }, [isAnimating]);

  // Animation loop
  useEffect(() => {
    let animationId: number;

    const animate = () => {
      drawMap();
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, [drawMap]);

  // Resize canvas
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const container = canvas.parentElement;
      if (!container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <span className="text-xl font-bold">F9</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Global Energy Royalty Map</h1>
              <p className="text-sm text-slate-400">Real-time transaction visualization</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isAnimating ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm text-slate-400">{isAnimating ? 'LIVE' : 'PAUSED'}</span>
            </div>
            <button
              onClick={() => setIsAnimating(!isAnimating)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
            >
              {isAnimating ? 'Pause' : 'Resume'}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-screen-2xl mx-auto p-6">
        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <motion.div
            className="bg-slate-900/50 rounded-xl p-4 border border-slate-800"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-xs text-slate-400 mb-1">Total Transactions</div>
            <div className="text-2xl font-bold text-white">{formatNumber(stats.totalTransactions)}</div>
          </motion.div>

          <motion.div
            className="bg-slate-900/50 rounded-xl p-4 border border-slate-800"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-xs text-slate-400 mb-1">Total Royalties</div>
            <div className="text-2xl font-bold text-green-400">${formatNumber(stats.totalRoyalties)}</div>
          </motion.div>

          <motion.div
            className="bg-slate-900/50 rounded-xl p-4 border border-slate-800"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-xs text-slate-400 mb-1">Energy Processed</div>
            <div className="text-2xl font-bold text-blue-400">{formatNumber(stats.totalKwh)} kWh</div>
          </motion.div>

          <motion.div
            className="bg-slate-900/50 rounded-xl p-4 border border-slate-800"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-xs text-slate-400 mb-1">Active Nodes</div>
            <div className="text-2xl font-bold text-purple-400">{stats.activeNodes}</div>
          </motion.div>

          <motion.div
            className="bg-slate-900/50 rounded-xl p-4 border border-slate-800"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-xs text-slate-400 mb-1">TPS</div>
            <div className="text-2xl font-bold text-amber-400">{stats.tps.toFixed(1)}</div>
          </motion.div>

          <motion.div
            className="bg-slate-900/50 rounded-xl p-4 border border-slate-800"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-xs text-slate-400 mb-1">Market Share</div>
            <div className="text-2xl font-bold text-cyan-400">{stats.marketShare.toFixed(1)}%</div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map */}
          <div className="lg:col-span-3 bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="relative w-full h-[500px]">
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Region breakdown */}
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Region Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(stats.regionBreakdown).map(([region, data]) => (
                  <button
                    key={region}
                    onClick={() => setSelectedRegion(selectedRegion === region ? null : region)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      selectedRegion === region
                        ? 'bg-slate-700 border-slate-600'
                        : 'bg-slate-800/50 hover:bg-slate-800 border-transparent'
                    } border`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">{region}</span>
                      <span className="text-sm text-green-400">${formatNumber(data.royalties)}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-1.5 rounded-full"
                        style={{ width: `${(data.royalties / stats.totalRoyalties) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {formatNumber(data.transactions)} txns • {formatNumber(data.kwh)} kWh
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent transactions */}
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Live Transactions</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {recentTransactions.slice(-8).reverse().map((tx) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: tx.from.color }}
                        />
                        <span className="text-xs text-slate-400">
                          {tx.from.name} → {tx.to.name}
                        </span>
                      </div>
                      <div className="text-xs">
                        <span className="text-white">{tx.amount.toFixed(0)} kWh</span>
                        <span className="text-green-400 ml-2">+${tx.royalty.toFixed(3)}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom metrics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Royalty velocity chart placeholder */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Royalty Velocity (24h)</h3>
            <div className="h-32 flex items-end gap-1">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-purple-500 to-blue-500 rounded-t"
                  style={{ height: `${30 + Math.random() * 70}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span>24h ago</span>
              <span>Now</span>
            </div>
          </div>

          {/* Market dominance */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Market Dominance Goal</h3>
            <div className="relative h-32 flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  className="fill-none stroke-slate-700"
                  strokeWidth="12"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  className="fill-none stroke-url(#gradient)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${stats.marketShare * 3.51} 351.86`}
                  style={{ stroke: 'url(#gradient)' }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-bold">{stats.marketShare.toFixed(1)}%</span>
                <span className="text-xs text-slate-400">of 15% goal</span>
              </div>
            </div>
            <div className="text-center text-sm text-slate-400 mt-2">
              Target: 15% global market share by Year 5
            </div>
          </div>

          {/* Network status */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Network Status</h3>
            <div className="space-y-4">
              {GLOBAL_NODES.slice(0, 4).map((node) => (
                <div key={node.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm text-slate-300">{node.name}</span>
                  </div>
                  <span className="text-xs text-slate-400">{node.country}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-700">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">System Status</span>
                  <span className="text-green-400 font-semibold">OPERATIONAL</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>Field Nine Energy Protocol • The Global Standard for Energy Verification</p>
          <p className="mt-1">Real-time data from {stats.activeNodes} active nodes across {Object.keys(stats.regionBreakdown).length} regions</p>
        </div>
      </div>
    </div>
  );
}
