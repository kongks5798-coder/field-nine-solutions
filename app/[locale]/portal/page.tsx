'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function FieldNinePortal() {
  const [hoveredService, setHoveredService] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState({
    score: 9892,
    uptime: 99.97,
    latency: 12,
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      // Simulate slight fluctuations
      setSystemStatus(prev => ({
        score: Math.min(10000, prev.score + Math.floor(Math.random() * 3)),
        uptime: 99.97,
        latency: 10 + Math.floor(Math.random() * 5),
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const services = [
    {
      id: 'nexus',
      name: 'NEXUS-X',
      subtitle: 'Energy Trading Terminal',
      description: 'Institutional-Grade Autonomous Energy Arbitrage Platform',
      features: ['AI Alpha Engine', 'Multi-Sig Vault', 'JEPX & AEMO', 'Polygon Settlement'],
      metrics: {
        label: 'Today\'s P&L',
        value: '+$12.47',
        change: '+1.25%',
      },
      status: 'PHASE 10 LIVE',
      statusColor: 'green',
      href: '/nexus',
      proHref: '/nexus/pro',
      gradient: 'from-green-500 to-emerald-600',
      bgGlow: 'bg-green-500/10',
    },
    {
      id: 'kuniversal',
      name: 'K-UNIVERSAL',
      subtitle: 'Digital Nomad Platform',
      description: 'All-in-One Korean Travel & Lifestyle Experience',
      features: ['AI Concierge', 'Smart Booking', 'VIBE Analysis', 'Live Exchange'],
      metrics: {
        label: 'Active Users',
        value: '1.2K',
        change: '+15%',
      },
      status: 'LIVE',
      statusColor: 'blue',
      href: '/dashboard',
      gradient: 'from-blue-500 to-cyan-600',
      bgGlow: 'bg-blue-500/10',
    },
    {
      id: 'vibe',
      name: 'VIBE-ID',
      subtitle: 'Aesthetic Intelligence',
      description: 'AI-Powered Personal Style & Aesthetic Analysis',
      features: ['GPT-4 Vision', '9 Archetypes', 'Style DNA', 'Magazine Export'],
      metrics: {
        label: 'Analyses',
        value: '847',
        change: '+42%',
      },
      status: 'BETA',
      statusColor: 'purple',
      href: '/dashboard/vibe',
      gradient: 'from-purple-500 to-pink-600',
      bgGlow: 'bg-purple-500/10',
    },
  ];

  const quickLinks = [
    { label: 'NEXUS PRO Terminal', href: '/nexus/pro', icon: '⚡' },
    { label: 'Institutional API', href: '/api/institutional?action=overview', icon: '🔗' },
    { label: 'Proof of Reserve', href: '/api/institutional?action=por', icon: '🔐' },
    { label: 'Mobile Trading', href: '/nexus/mobile', icon: '📱' },
  ];

  return (
    <div className="min-h-screen bg-[#030303] text-white overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }} />
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-green-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[80px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-8 py-5 border-b border-white/5">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <motion.div
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-white to-gray-300 flex items-center justify-center"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <span className="text-black font-black text-xl">F9</span>
            </motion.div>
            <div>
              <div className="text-xl font-bold tracking-tight">FIELD NINE</div>
              <div className="text-[10px] text-gray-500 tracking-widest">UNIFIED OPERATING SYSTEM</div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 px-4 py-2 rounded-lg bg-white/5 border border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-400">System Score</span>
                <span className="text-sm font-bold text-green-400">{systemStatus.score.toLocaleString()}</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="text-xs text-gray-400">
                {systemStatus.uptime}% uptime
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="text-xs text-gray-400">
                {systemStatus.latency}ms
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono">{currentTime.toLocaleTimeString('en-US', { hour12: false })}</div>
              <div className="text-[10px] text-gray-500">KST</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
              <span className="text-xs text-gray-400">Version 2.0.0</span>
              <span className="w-1 h-1 bg-gray-600 rounded-full" />
              <span className="text-xs text-green-400">PHASE 10: INSTITUTIONAL GRADE</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-black tracking-tighter mb-4">
              <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Field Nine
              </span>
              <span className="text-gray-600 ml-3">OS</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              One platform. One identity. <span className="text-white">Institutional-grade.</span>
            </p>
          </motion.div>

          {/* Service Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {services.map((service, idx) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link href={service.href}>
                  <motion.div
                    className={`relative h-full rounded-2xl border transition-all duration-300 overflow-hidden ${
                      hoveredService === service.id
                        ? 'border-white/20 shadow-2xl'
                        : 'border-white/5 bg-white/[0.02]'
                    }`}
                    onMouseEnter={() => setHoveredService(service.id)}
                    onMouseLeave={() => setHoveredService(null)}
                    whileHover={{ y: -4 }}
                  >
                    {/* Background Glow */}
                    <AnimatePresence>
                      {hoveredService === service.id && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={`absolute inset-0 ${service.bgGlow}`}
                        />
                      )}
                    </AnimatePresence>

                    <div className="relative p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.gradient} flex items-center justify-center`}>
                          <span className="text-white font-bold text-lg">
                            {service.name.charAt(0)}
                          </span>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-medium border ${
                          service.statusColor === 'green' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                          service.statusColor === 'blue' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                          'bg-purple-500/20 text-purple-400 border-purple-500/30'
                        }`}>
                          {service.status}
                        </div>
                      </div>

                      {/* Title */}
                      <div className="mb-4">
                        <h2 className="text-2xl font-bold mb-1">{service.name}</h2>
                        <p className="text-sm text-gray-500">{service.subtitle}</p>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                        {service.description}
                      </p>

                      {/* Features */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {service.features.map((feature) => (
                          <span
                            key={feature}
                            className="px-2 py-1 bg-white/5 text-[10px] text-gray-400 rounded-md"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      {/* Metrics */}
                      <div className="pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[10px] text-gray-500 uppercase">{service.metrics.label}</div>
                            <div className="text-lg font-bold">{service.metrics.value}</div>
                          </div>
                          <div className={`text-sm font-medium ${
                            service.statusColor === 'green' ? 'text-green-400' :
                            service.statusColor === 'blue' ? 'text-blue-400' :
                            'text-purple-400'
                          }`}>
                            {service.metrics.change}
                          </div>
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-400 group-hover:text-white transition-colors">
                        <span>Enter {service.name.split('-')[0]}</span>
                        <motion.span
                          animate={{ x: hoveredService === service.id ? 4 : 0 }}
                        >
                          →
                        </motion.span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Quick Access */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl border border-white/5 bg-white/[0.02] p-6"
          >
            <h3 className="text-sm font-medium text-gray-400 mb-4">QUICK ACCESS</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickLinks.map((link, idx) => (
                <Link key={link.href} href={link.href}>
                  <motion.div
                    className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + idx * 0.1 }}
                  >
                    <div className="text-2xl mb-2">{link.icon}</div>
                    <div className="text-sm font-medium">{link.label}</div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* System Status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 grid grid-cols-4 gap-4"
          >
            {[
              { label: 'Alpha Engine', status: 'OPERATIONAL', color: 'green' },
              { label: 'Multi-Sig Vault', status: 'SECURED', color: 'green' },
              { label: 'Compliance', status: 'ISO 27001', color: 'blue' },
              { label: 'Proof of Reserve', status: 'VERIFIED', color: 'purple' },
            ].map((item, idx) => (
              <div
                key={item.label}
                className="p-4 rounded-xl border border-white/5 bg-white/[0.02]"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${
                    item.color === 'green' ? 'bg-green-400' :
                    item.color === 'blue' ? 'bg-blue-400' : 'bg-purple-400'
                  }`} />
                  <span className="text-xs text-gray-500">{item.label}</span>
                </div>
                <div className={`text-sm font-medium ${
                  item.color === 'green' ? 'text-green-400' :
                  item.color === 'blue' ? 'text-blue-400' : 'text-purple-400'
                }`}>
                  {item.status}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-xs text-gray-600">
            Field Nine Solutions © 2026 - Powering the Future of Energy & Travel
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <Link href="/legal/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <a href="https://docs.fieldnine.io" className="hover:text-white transition-colors">API Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
