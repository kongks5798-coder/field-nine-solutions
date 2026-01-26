'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PortfolioOverview,
  AssetAllocationChart,
  RiskMetricsPanel,
  AlertCenter,
  PerformanceLeaderboard,
  AssetList,
} from '@/components/nexus/portfolio-dashboard';
import { ProphetWidget } from '@/components/nexus/prophet-command-center';

// Mobile Navigation Component
function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: '/ko/nexus', label: 'Dashboard', icon: '🏠' },
    { href: '/ko/nexus/assets', label: 'Assets', icon: '💰' },
    { href: '/ko/nexus/energy', label: 'Energy', icon: '⚡' },
    { href: '/ko/nexus/exchange', label: 'Exchange', icon: '🔄' },
    { href: '/ko/nexus/portfolio', label: 'Portfolio', icon: '📊', active: true },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 w-12 h-12 bg-[#171717] rounded-xl border border-neutral-800 flex items-center justify-center"
      >
        <span className="text-xl">{isOpen ? '✕' : '☰'}</span>
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/80 z-40"
          />
        )}
      </AnimatePresence>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="lg:hidden fixed top-0 right-0 h-full w-72 bg-[#171717] z-40 p-6 pt-20 border-l border-neutral-800"
          >
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    item.active
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Desktop Sidebar Component
function DesktopSidebar() {
  const navItems = [
    { href: '/ko/nexus', label: 'Dashboard', icon: '🏠' },
    { href: '/ko/nexus/assets', label: 'Assets', icon: '💰' },
    { href: '/ko/nexus/energy', label: 'Energy', icon: '⚡' },
    { href: '/ko/nexus/exchange', label: 'Exchange', icon: '🔄' },
    { href: '/ko/nexus/portfolio', label: 'Portfolio', icon: '📊', active: true },
  ];

  return (
    <div className="hidden lg:flex fixed left-0 top-0 h-full w-20 bg-[#171717] border-r border-neutral-800 flex-col items-center py-6 z-30">
      {/* Logo */}
      <Link href="/ko/nexus" className="mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <span className="text-2xl">⬡</span>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all group relative ${
              item.active
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-neutral-500 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            {/* Tooltip */}
            <div className="absolute left-16 px-3 py-1.5 bg-neutral-800 rounded-lg text-white text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {item.label}
            </div>
          </Link>
        ))}
      </nav>

      {/* Settings */}
      <button className="w-12 h-12 rounded-xl text-neutral-500 hover:bg-neutral-800 hover:text-white transition-all flex items-center justify-center">
        <span className="text-xl">⚙️</span>
      </button>
    </div>
  );
}

// Main Portfolio Page
export default function PortfolioPage() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Mobile Navigation */}
      <MobileNavigation />

      {/* Main Content */}
      <main className="lg:ml-20 p-4 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-[#171717]">
                Portfolio Intelligence
              </h1>
              <p className="text-neutral-600 mt-1">
                AI 기반 포트폴리오 분석 및 리스크 관리
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Live Indicator */}
              <div className="flex items-center gap-2 bg-[#171717] px-4 py-2 rounded-xl">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-2 h-2 bg-emerald-500 rounded-full"
                />
                <span className="text-white text-sm font-medium">LIVE</span>
              </div>
              {/* Time Display */}
              <div className="bg-[#171717] px-4 py-2 rounded-xl">
                <span className="text-white text-sm font-mono">
                  {currentTime.toLocaleTimeString('ko-KR')}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Main Widgets */}
          <div className="lg:col-span-8 space-y-6">
            {/* Portfolio Overview */}
            <PortfolioOverview />

            {/* Two Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Asset Allocation */}
              <AssetAllocationChart />

              {/* Prophet AI Widget */}
              <ProphetWidget />

              {/* Risk Metrics */}
              <RiskMetricsPanel />
            </div>

            {/* Asset List */}
            <AssetList />
          </div>

          {/* Right Column - Side Widgets */}
          <div className="lg:col-span-4 space-y-6">
            {/* Alert Center */}
            <AlertCenter />

            {/* Performance Leaderboard */}
            <PerformanceLeaderboard />
          </div>
        </div>

        {/* Footer Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-[#171717] rounded-2xl p-6 border border-neutral-800"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">847</div>
              <div className="text-neutral-500 text-sm mt-1">총 거래 횟수</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400">+23.7%</div>
              <div className="text-neutral-500 text-sm mt-1">올해 수익률</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">72%</div>
              <div className="text-neutral-500 text-sm mt-1">승률</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-400">#127</div>
              <div className="text-neutral-500 text-sm mt-1">글로벌 순위</div>
            </div>
          </div>
        </motion.div>

        {/* Version Badge */}
        <div className="mt-6 text-center">
          <span className="text-neutral-400 text-sm">
            NEXUS Portfolio Intelligence v1.0 · Phase 48
          </span>
        </div>
      </main>
    </div>
  );
}
