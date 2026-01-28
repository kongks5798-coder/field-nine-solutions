/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 68: SOVEREIGN DASHBOARD - Apple-Style Premium UI
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Warm Ivory (#F9F9F7) + Deep Black (#171717)
 * KAUS Coin Price + Energy Supply/Demand
 * Ultra-minimalist Apple aesthetic
 *
 * @route /nexus/sovereign
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// KAUS Coin Price Data
interface KausPrice {
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
  sparkline: number[];
}

// Energy Supply/Demand
interface EnergyBalance {
  totalSupply: number;
  totalDemand: number;
  netBalance: number;
  peakDemand: number;
  renewableRatio: number;
  gridStability: 'stable' | 'warning' | 'critical';
}

// Minimal Sparkline Chart
function SparklineChart({ data, color = '#171717' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 100 100" className="w-full h-16" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// Circular Progress Ring
function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  label,
  value
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  value: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E5E5"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#171717"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-2xl font-bold text-[#171717]">{value}</span>
        <span className="text-xs text-[#171717]/50">{label}</span>
      </div>
    </div>
  );
}

export default function SovereignDashboard() {
  const [kausPrice, setKausPrice] = useState<KausPrice | null>(null);
  const [energyBalance, setEnergyBalance] = useState<EnergyBalance | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // Generate realistic KAUS price data
  const generateKausData = useCallback((): KausPrice => {
    const basePrice = 1247.50;
    const variance = (Math.random() - 0.5) * 50;
    const price = basePrice + variance;

    const sparkline = Array.from({ length: 24 }, (_, i) => {
      const trend = Math.sin(i / 4) * 20;
      const noise = (Math.random() - 0.5) * 30;
      return basePrice + trend + noise;
    });

    return {
      price,
      change24h: ((price - sparkline[0]) / sparkline[0]) * 100,
      high24h: Math.max(...sparkline),
      low24h: Math.min(...sparkline),
      volume24h: 2847650000 + Math.random() * 500000000,
      marketCap: 156000000000 + Math.random() * 10000000000,
      sparkline,
    };
  }, []);

  // Generate energy balance data
  const generateEnergyData = useCallback((): EnergyBalance => {
    const hour = new Date().getHours();
    const isDaytime = hour >= 6 && hour <= 20;

    const totalSupply = isDaytime ? 156.8 + Math.random() * 20 : 98.5 + Math.random() * 15;
    const totalDemand = 142.3 + Math.random() * 25;

    return {
      totalSupply,
      totalDemand,
      netBalance: totalSupply - totalDemand,
      peakDemand: 185.6,
      renewableRatio: isDaytime ? 72 + Math.random() * 10 : 45 + Math.random() * 15,
      gridStability: totalSupply > totalDemand * 1.1 ? 'stable' : totalSupply > totalDemand ? 'warning' : 'critical',
    };
  }, []);

  useEffect(() => {
    // Initial data load
    setKausPrice(generateKausData());
    setEnergyBalance(generateEnergyData());
    setIsLoading(false);

    // Real-time updates
    const priceInterval = setInterval(() => {
      setKausPrice(generateKausData());
    }, 5000);

    const energyInterval = setInterval(() => {
      setEnergyBalance(generateEnergyData());
    }, 10000);

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(priceInterval);
      clearInterval(energyInterval);
      clearInterval(timeInterval);
    };
  }, [generateKausData, generateEnergyData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number, decimals = 2) => {
    return value.toLocaleString('ko-KR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      {/* Minimal Header */}
      <header className="sticky top-0 z-50 bg-[#F9F9F7]/80 backdrop-blur-xl border-b border-[#171717]/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/nexus" className="text-[#171717]/50 hover:text-[#171717] transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="text-center">
            <h1 className="text-sm font-semibold text-[#171717] tracking-tight">Sovereign</h1>
            <p className="text-xs text-[#171717]/40">
              {currentTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="w-6" /> {/* Spacer for alignment */}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* KAUS Coin Hero */}
        <AnimatePresence mode="wait">
          {!isLoading && kausPrice && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#171717]/5 rounded-full mb-6">
                <div className="w-2 h-2 bg-[#171717] rounded-full animate-pulse" />
                <span className="text-xs font-medium text-[#171717]/70">LIVE</span>
              </div>

              <h2 className="text-6xl md:text-8xl font-bold text-[#171717] tracking-tight mb-2">
                {formatCurrency(kausPrice.price)}
              </h2>

              <div className={`inline-flex items-center gap-1 text-lg font-medium ${
                kausPrice.change24h >= 0 ? 'text-[#171717]' : 'text-[#171717]/60'
              }`}>
                <span>{kausPrice.change24h >= 0 ? '↑' : '↓'}</span>
                <span>{Math.abs(kausPrice.change24h).toFixed(2)}%</span>
                <span className="text-[#171717]/40 ml-1">24h</span>
              </div>

              {/* Sparkline */}
              <div className="mt-8 px-4">
                <SparklineChart
                  data={kausPrice.sparkline}
                  color={kausPrice.change24h >= 0 ? '#171717' : '#171717'}
                />
              </div>

              {/* Price Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
                <div>
                  <p className="text-xs text-[#171717]/40 uppercase tracking-wider">24h High</p>
                  <p className="text-lg font-semibold text-[#171717]">{formatCurrency(kausPrice.high24h)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#171717]/40 uppercase tracking-wider">24h Low</p>
                  <p className="text-lg font-semibold text-[#171717]">{formatCurrency(kausPrice.low24h)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#171717]/40 uppercase tracking-wider">Volume</p>
                  <p className="text-lg font-semibold text-[#171717]">₩{(kausPrice.volume24h / 1000000000).toFixed(1)}B</p>
                </div>
                <div>
                  <p className="text-xs text-[#171717]/40 uppercase tracking-wider">Market Cap</p>
                  <p className="text-lg font-semibold text-[#171717]">₩{(kausPrice.marketCap / 1000000000000).toFixed(1)}T</p>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Divider */}
        <div className="border-t border-[#171717]/10" />

        {/* Energy Balance Section */}
        <AnimatePresence mode="wait">
          {!isLoading && energyBalance && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3 className="text-xs text-[#171717]/40 uppercase tracking-wider mb-6">Energy Network</h3>

              {/* Supply vs Demand */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                {/* Supply */}
                <div className="text-center md:text-left">
                  <p className="text-xs text-[#171717]/40 uppercase tracking-wider mb-2">Supply</p>
                  <p className="text-4xl font-bold text-[#171717]">
                    {formatNumber(energyBalance.totalSupply, 1)}
                    <span className="text-lg font-normal text-[#171717]/40 ml-1">MW</span>
                  </p>
                </div>

                {/* Balance Ring */}
                <div className="flex justify-center relative">
                  <ProgressRing
                    progress={(energyBalance.totalSupply / energyBalance.peakDemand) * 100}
                    label="of peak"
                    value={`${Math.round((energyBalance.totalSupply / energyBalance.peakDemand) * 100)}%`}
                  />
                </div>

                {/* Demand */}
                <div className="text-center md:text-right">
                  <p className="text-xs text-[#171717]/40 uppercase tracking-wider mb-2">Demand</p>
                  <p className="text-4xl font-bold text-[#171717]">
                    {formatNumber(energyBalance.totalDemand, 1)}
                    <span className="text-lg font-normal text-[#171717]/40 ml-1">MW</span>
                  </p>
                </div>
              </div>

              {/* Net Balance Indicator */}
              <motion.div
                className="mt-8 p-6 bg-white rounded-2xl shadow-sm"
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#171717]/40 uppercase tracking-wider">Net Balance</p>
                    <p className={`text-3xl font-bold ${
                      energyBalance.netBalance >= 0 ? 'text-[#171717]' : 'text-[#171717]/60'
                    }`}>
                      {energyBalance.netBalance >= 0 ? '+' : ''}{formatNumber(energyBalance.netBalance, 1)} MW
                    </p>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                    energyBalance.gridStability === 'stable'
                      ? 'bg-[#171717]/5 text-[#171717]'
                      : energyBalance.gridStability === 'warning'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {energyBalance.gridStability === 'stable' ? 'Grid Stable' :
                     energyBalance.gridStability === 'warning' ? 'Caution' : 'Critical'}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="h-2 bg-[#171717]/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#171717]"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((energyBalance.totalSupply / energyBalance.totalDemand) * 100, 100)}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-[#171717]/40">
                    <span>0 MW</span>
                    <span>{formatNumber(energyBalance.peakDemand, 0)} MW Peak</span>
                  </div>
                </div>
              </motion.div>

              {/* Additional Stats */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <motion.div
                  className="p-5 bg-white rounded-2xl shadow-sm"
                  whileHover={{ y: -2 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <p className="text-xs text-[#171717]/40 uppercase tracking-wider mb-1">Renewable Ratio</p>
                  <p className="text-2xl font-bold text-[#171717]">
                    {formatNumber(energyBalance.renewableRatio, 0)}%
                  </p>
                  <div className="mt-3 h-1 bg-[#171717]/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#171717]"
                      initial={{ width: 0 }}
                      animate={{ width: `${energyBalance.renewableRatio}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                </motion.div>

                <motion.div
                  className="p-5 bg-white rounded-2xl shadow-sm"
                  whileHover={{ y: -2 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <p className="text-xs text-[#171717]/40 uppercase tracking-wider mb-1">Peak Demand</p>
                  <p className="text-2xl font-bold text-[#171717]">
                    {formatNumber(energyBalance.peakDemand, 1)} MW
                  </p>
                  <p className="text-xs text-[#171717]/40 mt-2">
                    Current: {((energyBalance.totalDemand / energyBalance.peakDemand) * 100).toFixed(0)}% of peak
                  </p>
                </motion.div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Quick Actions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="pb-8"
        >
          <h3 className="text-xs text-[#171717]/40 uppercase tracking-wider mb-4">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-4">
            <Link href="/nexus/exchange">
              <motion.div
                className="p-4 bg-[#171717] text-[#F9F9F7] rounded-2xl text-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-2xl mb-2">↔</div>
                <p className="text-sm font-medium">Exchange</p>
              </motion.div>
            </Link>
            <Link href="/nexus/energy">
              <motion.div
                className="p-4 bg-white text-[#171717] rounded-2xl text-center shadow-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-2xl mb-2">⚡</div>
                <p className="text-sm font-medium">Energy</p>
              </motion.div>
            </Link>
            <Link href="/nexus/api-docs">
              <motion.div
                className="p-4 bg-white text-[#171717] rounded-2xl text-center shadow-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-2xl mb-2">{`</>`}</div>
                <p className="text-sm font-medium">API</p>
              </motion.div>
            </Link>
          </div>
        </motion.section>

      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-[#171717]/5 py-6">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs text-[#171717]/30">
            Field Nine Energy Platform · Sovereign Dashboard
          </p>
        </div>
      </footer>
    </div>
  );
}
