'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 66: ENERGY SOVEREIGNTY 100%
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 에너지 인프라 + KAUS 코인 미래형 플랫폼
 * - Neural Flow Animation (#00E5FF)
 * - Global Energy Node Network
 * - Tesla Powerwall Real-time Data
 * - KAUS Exchange Integration
 */

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════════
// NEURAL FLOW ANIMATION COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function NeuralFlowBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated Neural Lines */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-[1px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent opacity-30"
          style={{
            top: `${15 + i * 12}%`,
            left: '-100%',
            width: '200%',
          }}
          animate={{
            x: ['0%', '50%'],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: 'linear',
            delay: i * 0.5,
          }}
        />
      ))}

      {/* Energy Pulse Circles */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`pulse-${i}`}
          className="absolute rounded-full border border-[#00E5FF]/20"
          style={{
            width: 100 + i * 150,
            height: 100 + i * 150,
            left: '50%',
            top: '50%',
            marginLeft: -(50 + i * 75),
            marginTop: -(50 + i * 75),
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.8,
          }}
        />
      ))}

      {/* Floating Energy Particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 bg-[#00E5FF] rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL NODE MAP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface EnergyNode {
  id: string;
  name: string;
  location: string;
  type: 'solar' | 'wind' | 'battery' | 'grid';
  output: number;
  status: 'online' | 'syncing';
  coordinates: { x: number; y: number };
}

const GLOBAL_NODES: EnergyNode[] = [
  { id: 'seoul-hq', name: 'Seoul HQ', location: 'South Korea', type: 'battery', output: 75.6, status: 'online', coordinates: { x: 78, y: 35 } },
  { id: 'yeongdong', name: 'Yeongdong Solar', location: 'Gangwon-do', type: 'solar', output: 50, status: 'online', coordinates: { x: 80, y: 33 } },
  { id: 'jeju', name: 'Jeju Wind', location: 'Jeju Island', type: 'wind', output: 30, status: 'online', coordinates: { x: 76, y: 40 } },
  { id: 'tokyo', name: 'Tokyo Grid', location: 'Japan', type: 'grid', output: 120, status: 'syncing', coordinates: { x: 85, y: 36 } },
  { id: 'singapore', name: 'Singapore Solar', location: 'Singapore', type: 'solar', output: 45, status: 'online', coordinates: { x: 72, y: 55 } },
  { id: 'dubai', name: 'Dubai Solar', location: 'UAE', type: 'solar', output: 80, status: 'online', coordinates: { x: 52, y: 42 } },
];

function GlobalNodeMap() {
  const [activeNode, setActiveNode] = useState<string | null>(null);

  return (
    <div className="relative w-full aspect-[2/1] bg-[#171717]/50 rounded-3xl overflow-hidden border border-[#00E5FF]/20">
      {/* World Map Grid */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(10)].map((_, i) => (
          <div key={`h-${i}`} className="absolute w-full h-[1px] bg-[#00E5FF]/30" style={{ top: `${i * 10}%` }} />
        ))}
        {[...Array(20)].map((_, i) => (
          <div key={`v-${i}`} className="absolute h-full w-[1px] bg-[#00E5FF]/30" style={{ left: `${i * 5}%` }} />
        ))}
      </div>

      {/* Connection Lines */}
      <svg className="absolute inset-0 w-full h-full">
        {GLOBAL_NODES.map((node, i) => {
          const nextNode = GLOBAL_NODES[(i + 1) % GLOBAL_NODES.length];
          return (
            <motion.line
              key={`line-${node.id}`}
              x1={`${node.coordinates.x}%`}
              y1={`${node.coordinates.y}%`}
              x2={`${nextNode.coordinates.x}%`}
              y2={`${nextNode.coordinates.y}%`}
              stroke="#00E5FF"
              strokeWidth="1"
              strokeOpacity="0.3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, delay: i * 0.3 }}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {GLOBAL_NODES.map((node, i) => (
        <motion.div
          key={node.id}
          className="absolute cursor-pointer"
          style={{ left: `${node.coordinates.x}%`, top: `${node.coordinates.y}%` }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 + i * 0.2 }}
          onMouseEnter={() => setActiveNode(node.id)}
          onMouseLeave={() => setActiveNode(null)}
        >
          {/* Pulse Ring */}
          <motion.div
            className={`absolute -inset-4 rounded-full ${
              node.status === 'online' ? 'bg-[#00E5FF]' : 'bg-amber-500'
            }`}
            animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Node Dot */}
          <div className={`w-3 h-3 rounded-full ${
            node.status === 'online' ? 'bg-[#00E5FF]' : 'bg-amber-500'
          } shadow-[0_0_20px_rgba(0,229,255,0.5)]`} />

          {/* Tooltip */}
          {activeNode === node.id && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-[#171717] border border-[#00E5FF]/30 rounded-lg p-3 min-w-[150px] z-10"
            >
              <div className="text-[#00E5FF] font-bold text-sm">{node.name}</div>
              <div className="text-white/50 text-xs">{node.location}</div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-white/60 text-xs">{node.type.toUpperCase()}</span>
                <span className="text-[#00E5FF] font-mono text-sm">{node.output} MW</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      ))}

      {/* Stats Overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between">
        <div className="bg-[#171717]/80 backdrop-blur px-4 py-2 rounded-xl border border-[#00E5FF]/20">
          <div className="text-[#00E5FF] text-xs">TOTAL OUTPUT</div>
          <div className="text-white font-black text-xl">
            {GLOBAL_NODES.reduce((sum, n) => sum + n.output, 0).toFixed(1)} MW
          </div>
        </div>
        <div className="bg-[#171717]/80 backdrop-blur px-4 py-2 rounded-xl border border-[#00E5FF]/20">
          <div className="text-[#00E5FF] text-xs">NODES ONLINE</div>
          <div className="text-white font-black text-xl">
            {GLOBAL_NODES.filter(n => n.status === 'online').length}/{GLOBAL_NODES.length}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIVE STATS COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function LiveEnergyStats() {
  const [stats, setStats] = useState({
    totalEnergy: 400.6,
    kausPrice: 1.32,
    dailyRevenue: 27560000,
    networkNodes: 6,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        totalEnergy: prev.totalEnergy + (Math.random() - 0.5) * 2,
        kausPrice: prev.kausPrice + (Math.random() - 0.5) * 0.01,
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { label: 'Network Output', value: `${stats.totalEnergy.toFixed(1)} MW`, icon: '⚡' },
        { label: 'KAUS Price', value: `$${stats.kausPrice.toFixed(2)}`, icon: '🪙' },
        { label: 'Daily Revenue', value: `₩${(stats.dailyRevenue / 10000).toFixed(0)}만`, icon: '💰' },
        { label: 'Active Nodes', value: stats.networkNodes.toString(), icon: '🌐' },
      ].map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + i * 0.1 }}
          className="bg-white/5 backdrop-blur border border-[#00E5FF]/20 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{stat.icon}</span>
            <span className="text-white/50 text-xs">{stat.label}</span>
          </div>
          <div className="text-white font-black text-2xl">{stat.value}</div>
        </motion.div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function EnergySovereigntyPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0a0a0a]">
      {/* Hero Section */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        <NeuralFlowBackground />

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          {/* Live Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#00E5FF]/10 border border-[#00E5FF]/30 rounded-full mb-8"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 bg-[#00E5FF] rounded-full"
            />
            <span className="text-[#00E5FF] text-sm font-bold">LIVE NETWORK</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-8xl font-black text-white mb-6 leading-tight"
          >
            ENERGY
            <br />
            <span className="text-[#00E5FF]">SOVEREIGNTY</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-white/60 mb-12 max-w-2xl mx-auto"
          >
            글로벌 에너지 노드 네트워크.
            <br />
            KAUS 코인으로 에너지 지분을 소유하세요.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/nexus/energy"
              className="px-8 py-4 bg-[#00E5FF] text-[#171717] font-bold text-lg rounded-2xl hover:bg-[#00E5FF]/90 transition-all shadow-[0_0_30px_rgba(0,229,255,0.3)]"
            >
              Enter Dashboard
            </Link>
            <Link
              href="/nexus/exchange"
              className="px-8 py-4 bg-white/10 text-white font-bold text-lg rounded-2xl border border-white/20 hover:bg-white/20 transition-all"
            >
              Trade KAUS
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-[#00E5FF] rounded-full"
            />
          </div>
        </motion.div>
      </motion.section>

      {/* Global Node Map Section */}
      <section className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Global Node <span className="text-[#00E5FF]">Network</span>
            </h2>
            <p className="text-white/50 text-lg">
              실시간 에너지 생산 및 분배 현황
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <GlobalNodeMap />
          </motion.div>
        </div>
      </section>

      {/* Live Stats Section */}
      <section className="relative py-24 px-6 bg-[#171717]/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Live <span className="text-[#00E5FF]">Metrics</span>
            </h2>
            <p className="text-white/50 text-lg">
              실시간 네트워크 통계
            </p>
          </motion.div>

          <LiveEnergyStats />
        </div>
      </section>

      {/* Core Triad Section */}
      <section className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Core <span className="text-[#00E5FF]">Triad</span>
            </h2>
            <p className="text-white/50 text-lg">
              에너지 제국의 세 축
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '⚡',
                title: 'Energy Dashboard',
                description: 'Tesla Powerwall V2G 실시간 모니터링과 글로벌 에너지 노드 관리',
                href: '/nexus/energy',
                color: '#00E5FF',
              },
              {
                icon: '🔌',
                title: 'Sovereign API',
                description: '개발자를 위한 에너지 데이터 API. 실시간 가격, 생산량, 거래 데이터',
                href: '/nexus/api-docs',
                color: '#00E5FF',
              },
              {
                icon: '💰',
                title: 'KAUS Exchange',
                description: 'KAUS 코인으로 에너지 지분 매수/매도. 1-Click 즉시 거래',
                href: '/nexus/exchange',
                color: '#00E5FF',
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
              >
                <Link
                  href={item.href}
                  className="block h-full bg-white/5 backdrop-blur border border-[#00E5FF]/20 rounded-3xl p-8 hover:border-[#00E5FF]/50 hover:bg-white/10 transition-all group"
                >
                  <div className="text-5xl mb-6">{item.icon}</div>
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-[#00E5FF] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-white/50 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-[#00E5FF] font-bold">
                    <span>Enter</span>
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-white/40 text-sm">
            © 2026 Field Nine Solutions. Energy Sovereignty Platform.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/nexus/api-docs" className="text-white/40 hover:text-[#00E5FF] text-sm transition-colors">
              API Docs
            </Link>
            <Link href="/legal/terms" className="text-white/40 hover:text-[#00E5FF] text-sm transition-colors">
              Terms
            </Link>
            <Link href="/legal/privacy" className="text-white/40 hover:text-[#00E5FF] text-sm transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
