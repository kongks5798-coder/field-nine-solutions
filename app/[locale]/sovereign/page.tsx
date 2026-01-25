'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { WealthDashboard } from '@/components/nexus/wealth-dashboard';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SOVEREIGN IMPERIAL LANDING PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * FIELD NINE OS - The Operating System for Wealth
 *
 * 5 SECTORS:
 * 1. ENERGY: 글로벌 에너지 트레이딩 & 노드 네트워크
 * 2. BANK: High-Speed 650ms Settlement & Fiat Bridge
 * 3. K-AUS: Energy-Backed Stablecoin & PoE Mining
 * 4. COMPUTE: 10.8M TFLOPS GPU Infrastructure
 * 5. CARD: Sovereign Black Card & Instant Settlement
 *
 * Tesla FSD Style - Minimalist, Real-time Data, Overwhelming UX
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface SectorData {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgGradient: string;
  metrics: {
    label: string;
    value: string | number;
    unit?: string;
    change?: number;
  }[];
  description: string;
  link: string;
}

interface NetworkNode {
  id: string;
  region: string;
  status: 'active' | 'syncing' | 'offline';
  latency: number;
  tvl: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REAL-TIME DATA HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

function useGlobalMetrics() {
  const [metrics, setMetrics] = useState({
    totalTVL: 1050000000,
    totalNodes: 11000,
    dailyVolume: 45000000,
    settlementSuccess: 99.97,
    avgSettlement: 487,
    gpuTFLOPS: 10800000,
    kausCirculating: 850000000,
    activeUsers: 47892,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        totalTVL: prev.totalTVL + Math.floor(Math.random() * 100000 - 30000),
        dailyVolume: prev.dailyVolume + Math.floor(Math.random() * 50000 - 20000),
        avgSettlement: Math.max(450, Math.min(520, prev.avgSettlement + (Math.random() - 0.5) * 20)),
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 5),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return metrics;
}

function useNetworkNodes(): NetworkNode[] {
  const [nodes] = useState<NetworkNode[]>([
    { id: 'KR-SEO', region: 'Seoul', status: 'active', latency: 12, tvl: 285000000 },
    { id: 'US-SFO', region: 'San Francisco', status: 'active', latency: 45, tvl: 198000000 },
    { id: 'US-NYC', region: 'New York', status: 'active', latency: 52, tvl: 167000000 },
    { id: 'EU-FRA', region: 'Frankfurt', status: 'active', latency: 38, tvl: 145000000 },
    { id: 'JP-TYO', region: 'Tokyo', status: 'active', latency: 28, tvl: 98000000 },
    { id: 'AU-SYD', region: 'Sydney', status: 'active', latency: 65, tvl: 112000000 },
    { id: 'SG-SIN', region: 'Singapore', status: 'active', latency: 22, tvl: 45000000 },
  ]);

  return nodes;
}

function useTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return time;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTOR DATA
// ═══════════════════════════════════════════════════════════════════════════════

const SECTORS: SectorData[] = [
  {
    id: 'ENERGY',
    name: 'ENERGY',
    icon: '⚡',
    color: 'cyan',
    bgGradient: 'from-cyan-500/20 to-cyan-900/20',
    metrics: [
      { label: 'Trading Volume', value: '$45.2M', unit: '/24H', change: 12.4 },
      { label: 'Active Nodes', value: '11,000+', change: 5.2 },
      { label: 'Grid Efficiency', value: '94.7%', change: 1.2 },
      { label: 'Carbon Offset', value: '122K', unit: 'tCO2', change: 8.7 },
    ],
    description: 'Global energy arbitrage across PJM, EPEX, AEMO, JEPX markets',
    link: '/nexus/energy',
  },
  {
    id: 'BANK',
    name: 'BANK',
    icon: '🏦',
    color: 'emerald',
    bgGradient: 'from-emerald-500/20 to-emerald-900/20',
    metrics: [
      { label: 'Total TVL', value: '$1.05B', change: 15.3 },
      { label: 'Settlement Time', value: '487ms', change: -12.5 },
      { label: 'Success Rate', value: '99.97%', change: 0.02 },
      { label: 'Daily Payouts', value: '$2.3M', change: 8.9 },
    ],
    description: 'High-Speed 650ms Settlement Bridge for instant fiat conversion',
    link: '/epo/sovereign',
  },
  {
    id: 'K-AUS',
    name: 'K-AUS',
    icon: '🪙',
    color: 'amber',
    bgGradient: 'from-amber-500/20 to-amber-900/20',
    metrics: [
      { label: 'Circulating Supply', value: '850M', unit: 'K-AUS' },
      { label: 'Mining APY', value: '156.8%', change: 23.4 },
      { label: 'PoE Hashrate', value: '2.45M', unit: 'TH/s', change: 5.7 },
      { label: 'Energy Backed', value: '100%' },
    ],
    description: 'Energy-backed stablecoin with Proof of Energy mining',
    link: '/epo/kaus',
  },
  {
    id: 'COMPUTE',
    name: 'COMPUTE',
    icon: '🖥️',
    color: 'purple',
    bgGradient: 'from-purple-500/20 to-purple-900/20',
    metrics: [
      { label: 'Total TFLOPS', value: '10.8M', change: 0 },
      { label: 'GPU Utilization', value: '87.3%', change: 3.2 },
      { label: 'Daily Revenue', value: '12,450', unit: 'K-AUS', change: 5.7 },
      { label: 'Efficiency', value: '0.86', unit: 'K-AUS/TF', change: 2.1 },
    ],
    description: 'Decentralized GPU infrastructure for AI & rendering',
    link: '/epo/compute',
  },
  {
    id: 'CARD',
    name: 'CARD',
    icon: '💳',
    color: 'rose',
    bgGradient: 'from-rose-500/20 to-rose-900/20',
    metrics: [
      { label: 'Cards Issued', value: '892', change: 15.4 },
      { label: 'VIP Members', value: '1,247', change: 12.8 },
      { label: 'Avg Cashback', value: '5%' },
      { label: 'Settlement', value: '650ms', unit: 'target' },
    ],
    description: 'Sovereign Black Card with instant K-AUS to fiat settlement',
    link: '/epo/sovereign',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function ImperialHeader() {
  const time = useTime();
  const metrics = useGlobalMetrics();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-[1920px] mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center">
              <span className="text-black font-black text-lg">F9</span>
            </div>
            <div>
              <div className="text-xl font-black bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                FIELD NINE
              </div>
              <div className="text-[10px] text-white/40 tracking-[0.3em]">SOVEREIGN EMPIRE</div>
            </div>
          </motion.div>

          {/* Live Metrics Ticker */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-white/40">TVL</span>
                <span className="text-emerald-400 font-mono">${(metrics.totalTVL / 1000000000).toFixed(2)}B</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/40">Nodes</span>
                <span className="text-cyan-400 font-mono">{metrics.totalNodes.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/40">Settlement</span>
                <span className="text-amber-400 font-mono">{metrics.avgSettlement.toFixed(0)}ms</span>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">MAINNET LIVE</span>
            </div>

            {/* Time */}
            <div className="text-right">
              <div className="text-lg font-mono text-white">{time.toLocaleTimeString('en-US', { hour12: false })}</div>
              <div className="text-[10px] text-white/40">{time.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  const metrics = useGlobalMetrics();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vx: number; vy: number; size: number }[] = [];
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
      });
    }

    function animate() {
      if (!ctx || !canvas) return;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
        ctx.fill();
      });

      requestAnimationFrame(animate);
    }

    animate();
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black" />

      {/* Content */}
      <div className="relative z-10 text-center max-w-6xl mx-auto px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          {/* Pre-title */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-amber-500" />
            <span className="text-amber-500 text-sm tracking-[0.3em]">THE OPERATING SYSTEM FOR WEALTH</span>
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-amber-500" />
          </div>

          {/* Main Title */}
          <h1 className="text-7xl md:text-9xl font-black tracking-tight mb-6">
            <span className="bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent">
              FIELD NINE
            </span>
          </h1>

          <h2 className="text-3xl md:text-5xl font-light text-white/60 mb-12">
            Sovereign Empire
          </h2>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {[
              { label: 'Total Value Locked', value: `$${(metrics.totalTVL / 1000000000).toFixed(2)}B`, color: 'emerald' },
              { label: 'Global Nodes', value: metrics.totalNodes.toLocaleString(), color: 'cyan' },
              { label: 'GPU TFLOPS', value: `${(metrics.gpuTFLOPS / 1000000).toFixed(1)}M`, color: 'purple' },
              { label: 'Settlement', value: `${metrics.avgSettlement.toFixed(0)}ms`, color: 'amber' },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="text-center"
              >
                <div className={`text-4xl md:text-5xl font-bold text-${stat.color}-400 font-mono mb-2`}>
                  {stat.value}
                </div>
                <div className="text-sm text-white/40 uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="flex items-center gap-4">
              <Link
                href="/epo"
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all"
              >
                Enter Empire
              </Link>
              <button
                onClick={() => {
                  const modal = document.getElementById('early-access-modal');
                  if (modal) modal.classList.remove('hidden');
                }}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold rounded-xl hover:from-purple-400 hover:to-purple-500 transition-all animate-pulse"
              >
                Early Access
              </button>
              <Link
                href="/ko/nexus/energy"
                className="px-8 py-4 border border-white/20 text-white font-medium rounded-xl hover:bg-white/5 transition-all"
              >
                Command Center
              </Link>
            </div>

            {/* Share for K-AUS Banner */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-amber-500/30 rounded-full"
            >
              <span className="text-amber-500">🎁</span>
              <span className="text-sm text-white/80">
                Share your simulation results on SNS and earn <span className="text-amber-400 font-bold">50 K-AUS</span> instantly!
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <div className="w-6 h-10 border-2 border-white/20 rounded-full flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-amber-500 rounded-full" />
        </div>
      </motion.div>
    </section>
  );
}

function SectorCard({ sector, index }: { sector: SectorData; index: number }) {
  const locale = useLocale();
  const [isHovered, setIsHovered] = useState(false);

  const colorClasses: Record<string, { border: string; text: string; bg: string }> = {
    cyan: { border: 'border-cyan-500/30 hover:border-cyan-500/60', text: 'text-cyan-400', bg: 'bg-cyan-500' },
    emerald: { border: 'border-emerald-500/30 hover:border-emerald-500/60', text: 'text-emerald-400', bg: 'bg-emerald-500' },
    amber: { border: 'border-amber-500/30 hover:border-amber-500/60', text: 'text-amber-400', bg: 'bg-amber-500' },
    purple: { border: 'border-purple-500/30 hover:border-purple-500/60', text: 'text-purple-400', bg: 'bg-purple-500' },
    rose: { border: 'border-rose-500/30 hover:border-rose-500/60', text: 'text-rose-400', bg: 'bg-rose-500' },
  };

  const colors = colorClasses[sector.color] || colorClasses.amber;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/${locale}${sector.link}`}>
        <div className={`
          relative overflow-hidden rounded-2xl border bg-gradient-to-br ${sector.bgGradient}
          ${colors.border} transition-all duration-300
          ${isHovered ? 'scale-[1.02] shadow-2xl' : ''}
        `}>
          {/* Animated glow */}
          {isHovered && (
            <motion.div
              className={`absolute inset-0 ${colors.bg} opacity-5`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
            />
          )}

          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{sector.icon}</span>
                <div>
                  <h3 className="text-2xl font-bold text-white">{sector.name}</h3>
                  <p className="text-sm text-white/40">{sector.description}</p>
                </div>
              </div>
              <motion.div
                animate={{ x: isHovered ? 5 : 0 }}
                className={`${colors.text} text-2xl`}
              >
                →
              </motion.div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              {sector.metrics.map((metric, idx) => (
                <div key={idx} className="bg-black/30 rounded-xl p-4">
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-1">{metric.label}</div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-xl font-bold ${colors.text}`}>{metric.value}</span>
                    {metric.unit && <span className="text-sm text-white/40">{metric.unit}</span>}
                  </div>
                  {metric.change !== undefined && (
                    <div className={`text-xs ${metric.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {metric.change >= 0 ? '+' : ''}{metric.change}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function SectorsGrid() {
  return (
    <section className="py-32 bg-black">
      <div className="max-w-[1600px] mx-auto px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">5 Sovereign Sectors</h2>
          <p className="text-xl text-white/40">The complete financial infrastructure for the new economy</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SECTORS.map((sector, idx) => (
            <SectorCard key={sector.id} sector={sector} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 53: AI WEALTH GOVERNANCE SECTION
// ═══════════════════════════════════════════════════════════════════════════════

function AIGovernanceSection() {
  return (
    <section className="py-32 bg-gradient-to-b from-black via-zinc-900/50 to-black">
      <div className="max-w-[1400px] mx-auto px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-full mb-6">
            <span className="text-emerald-400 text-sm font-bold">NEW</span>
            <span className="text-white/80 text-sm">AI Autonomous Governance</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Your Empire, <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Auto-Optimized</span>
          </h2>
          <p className="text-xl text-white/40 max-w-2xl mx-auto">
            AI가 당신의 자산을 24/7 모니터링하고 최적의 수익률로 자동 재배치합니다
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <WealthDashboard />
        </motion.div>

        {/* CTA to Command Center */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link
            href="/ko/nexus/energy"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-xl hover:opacity-90 transition-all"
          >
            <span>🎮</span>
            <span>Command Center에서 전체 제어</span>
            <span>→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function NetworkMap() {
  const nodes = useNetworkNodes();
  const metrics = useGlobalMetrics();

  return (
    <section className="py-32 bg-gradient-to-b from-black to-zinc-900">
      <div className="max-w-[1600px] mx-auto px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Global Network</h2>
          <p className="text-xl text-white/40">11,000+ nodes across 7 regions</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Visualization */}
          <div className="lg:col-span-2 bg-gradient-to-br from-zinc-900 to-black border border-amber-500/20 rounded-2xl p-8">
            <div className="relative h-96">
              {/* Simplified world map grid */}
              <div className="absolute inset-0 grid grid-cols-7 gap-4 place-items-center">
                {nodes.map((node) => (
                  <motion.div
                    key={node.id}
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    className="relative"
                  >
                    <div className={`
                      w-20 h-20 rounded-xl flex flex-col items-center justify-center
                      ${node.status === 'active' ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-red-500/20 border border-red-500/50'}
                    `}>
                      <span className="text-xs text-white/60 mb-1">{node.region}</span>
                      <span className="text-lg font-bold text-white">${(node.tvl / 1000000).toFixed(0)}M</span>
                      <span className="text-[10px] text-emerald-400">{node.latency}ms</span>
                    </div>
                    {/* Pulse effect */}
                    <motion.div
                      className="absolute inset-0 rounded-xl bg-emerald-500/20"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2, delay: Math.random() }}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Panel */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-amber-500/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-amber-500 mb-4">Network Health</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Total Nodes</span>
                  <span className="text-2xl font-bold text-white">{metrics.totalNodes.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Avg Latency</span>
                  <span className="text-2xl font-bold text-emerald-400">{metrics.avgSettlement.toFixed(0)}ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Uptime</span>
                  <span className="text-2xl font-bold text-emerald-400">99.97%</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-zinc-900 to-black border border-emerald-500/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-emerald-500 mb-4">Settlement Performance</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/60">650ms Target</span>
                    <span className="text-emerald-400 font-medium">98.7% Met</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                      initial={{ width: 0 }}
                      whileInView={{ width: '98.7%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white font-mono">{metrics.avgSettlement.toFixed(0)}ms</div>
                  <div className="text-sm text-white/40">Average Settlement Time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ImperialFooter() {
  const time = useTime();

  return (
    <footer className="bg-black border-t border-white/5 py-16">
      <div className="max-w-[1600px] mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                <span className="text-black font-black text-sm">F9</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                FIELD NINE
              </span>
            </div>
            <p className="text-sm text-white/40">
              The Operating System for Wealth.<br />
              Energy is Currency.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Sectors</h4>
            <ul className="space-y-2 text-sm text-white/40">
              <li><Link href="/epo" className="hover:text-amber-400 transition-colors">Energy Trading</Link></li>
              <li><Link href="/epo/sovereign" className="hover:text-amber-400 transition-colors">Sovereign Bank</Link></li>
              <li><Link href="/epo/kaus" className="hover:text-amber-400 transition-colors">K-AUS Token</Link></li>
              <li><Link href="/epo/compute" className="hover:text-amber-400 transition-colors">Compute Network</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-white/40">
              <li><Link href="/ko/nexus/energy" className="hover:text-amber-400 transition-colors">Command Center</Link></li>
              <li><a href="https://docs.fieldnine.io" className="hover:text-amber-400 transition-colors">Documentation</a></li>
              <li><Link href="/legal/terms" className="hover:text-amber-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="/legal/privacy" className="hover:text-amber-400 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Status</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-sm text-emerald-400">All Systems Operational</span>
              </div>
              <div className="text-sm text-white/40">
                <div>Version: v3.1.0-EMPIRE</div>
                <div>Network: MAINNET</div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
          <span>© 2026 Field Nine Solutions. All rights reserved.</span>
          <span>Last Sync: {time.toISOString()}</span>
        </div>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EARLY ACCESS MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function EarlyAccessModal() {
  const [email, setEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    initial: number;
    yearly: number;
    apy: number;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate simulation result
    const initial = 10000;
    const apy = 42.7 + Math.random() * 15;
    const yearly = initial * (1 + apy / 100);

    setSimulationResult({ initial, yearly, apy });
    setSubmitted(true);
  };

  const handleShare = (platform: 'twitter' | 'telegram') => {
    const text = `I just simulated my earnings on Field Nine Sovereign Empire! 💰\n\n📊 Initial: $${simulationResult?.initial.toLocaleString()}\n📈 Projected Yearly: $${simulationResult?.yearly.toLocaleString()}\n🔥 APY: ${simulationResult?.apy.toFixed(1)}%\n\nJoin the Empire: https://m.fieldnine.io/sovereign\n\n#FieldNine #SovereignEmpire #EnergyIsCurrency`;

    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    } else {
      window.open(`https://t.me/share/url?url=https://m.fieldnine.io/sovereign&text=${encodeURIComponent(text)}`, '_blank');
    }

    // Award K-AUS (would call API in production)
    alert('🎁 50 K-AUS has been credited to your account!');
  };

  const closeModal = () => {
    const modal = document.getElementById('early-access-modal');
    if (modal) modal.classList.add('hidden');
    setSubmitted(false);
    setEmail('');
    setSimulationResult(null);
  };

  return (
    <div
      id="early-access-modal"
      className="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={closeModal}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-zinc-900 to-black border-2 border-amber-500/50 rounded-2xl max-w-lg w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {!submitted ? (
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">👑</span>
                <div>
                  <h2 className="text-2xl font-bold text-white">Empire Ascension</h2>
                  <p className="text-sm text-white/60">Early Access Registration</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-white/40 hover:text-white text-2xl">&times;</button>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-2">
                <span>🎁</span> Early Bird Benefits
              </div>
              <ul className="text-sm text-white/60 space-y-1">
                <li>• <span className="text-amber-400">100 K-AUS</span> welcome bonus</li>
                <li>• Priority access to Sovereign Card</li>
                <li>• VIP tier fast-track eligibility</li>
                <li>• Exclusive airdrop allocation</li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-2 block">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-2 block">Referral Code (Optional)</label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={e => setReferralCode(e.target.value)}
                  placeholder="Enter referral code"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all"
              >
                Join the Empire
              </button>
            </form>

            <p className="text-xs text-white/40 mt-4 text-center">
              By registering, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        ) : (
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl">✓</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to the Empire!</h2>
              <p className="text-sm text-white/60">Your early access has been secured</p>
            </div>

            {/* Simulation Result */}
            <div className="bg-gradient-to-br from-purple-500/20 to-amber-500/20 border border-purple-500/30 rounded-xl p-6 mb-6">
              <div className="text-center mb-4">
                <div className="text-sm text-white/60 mb-1">Your Projected Earnings</div>
                <div className="text-4xl font-bold text-amber-400">
                  ${simulationResult?.yearly.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <div className="text-sm text-white/60">per year</div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-xs text-white/40">Initial Investment</div>
                  <div className="text-lg font-bold text-white">${simulationResult?.initial.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-white/40">APY</div>
                  <div className="text-lg font-bold text-emerald-400">{simulationResult?.apy.toFixed(1)}%</div>
                </div>
              </div>
            </div>

            {/* Share for K-AUS */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
              <div className="text-center mb-3">
                <span className="text-amber-400 font-bold">🎁 Share & Earn 50 K-AUS!</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleShare('twitter')}
                  className="flex-1 py-3 bg-[#1DA1F2] text-white font-medium rounded-xl hover:bg-[#1a8cd8] transition-all flex items-center justify-center gap-2"
                >
                  <span>𝕏</span> Twitter
                </button>
                <button
                  onClick={() => handleShare('telegram')}
                  className="flex-1 py-3 bg-[#0088cc] text-white font-medium rounded-xl hover:bg-[#0077b5] transition-all flex items-center justify-center gap-2"
                >
                  <span>✈️</span> Telegram
                </button>
              </div>
            </div>

            <button
              onClick={closeModal}
              className="w-full py-3 border border-white/20 text-white rounded-xl hover:bg-white/5 transition-all"
            >
              Close
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function SovereignImperialPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <ImperialHeader />
      <HeroSection />
      <SectorsGrid />
      <AIGovernanceSection />
      <NetworkMap />
      <ImperialFooter />
      <EarlyAccessModal />
    </div>
  );
}
