'use client';

/**
 * 💎 LIVE WEALTH VISUALIZER
 * 실시간 자산 가치 애니메이션 시스템
 * Field Nine Nexus - Phase 52
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';

// ============================================================
// TYPES
// ============================================================

interface AssetBreakdown {
  kaus: number;
  energy: number;
  solar: number;
  staking: number;
  liquidity: number;
}

interface WealthData {
  totalValueUSD: number;
  totalValueKRW: number;
  breakdown: AssetBreakdown;
  change24h: number;
  changePercent: number;
  targetValue: number; // $10M target
  projectedDate: string;
}

interface WealthVisualizerProps {
  initialValue?: number;
  targetValue?: number;
  updateInterval?: number;
  compact?: boolean;
}

// ============================================================
// ANIMATED NUMBER COMPONENT
// ============================================================

function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  decimals = 2,
  duration = 0.5,
  className = '',
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const spring = useSpring(value, {
    stiffness: 100,
    damping: 30,
    mass: 1,
  });

  const display = useTransform(spring, (v) => {
    if (v >= 1000000) {
      return `${prefix}${(v / 1000000).toFixed(decimals)}M${suffix}`;
    } else if (v >= 1000) {
      return `${prefix}${(v / 1000).toFixed(decimals)}K${suffix}`;
    }
    return `${prefix}${v.toFixed(decimals)}${suffix}`;
  });

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return (
    <motion.span className={className}>
      {display}
    </motion.span>
  );
}

// ============================================================
// PROGRESS TO TARGET COMPONENT
// ============================================================

function ProgressToTarget({
  current,
  target,
  label,
}: {
  current: number;
  target: number;
  label: string;
}) {
  const progress = Math.min((current / target) * 100, 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-medium">
          {progress.toFixed(1)}%
        </span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>현재: ${(current / 1000000).toFixed(2)}M</span>
        <span>목표: ${(target / 1000000).toFixed(0)}M</span>
      </div>
    </div>
  );
}

// ============================================================
// ASSET PIE CHART
// ============================================================

function AssetPieChart({ breakdown }: { breakdown: AssetBreakdown }) {
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);

  const segments = useMemo(() => {
    const items = [
      { key: 'kaus', label: 'KAUS', color: '#22C55E', value: breakdown.kaus },
      { key: 'energy', label: 'Energy Credits', color: '#3B82F6', value: breakdown.energy },
      { key: 'solar', label: 'Solar Assets', color: '#F59E0B', value: breakdown.solar },
      { key: 'staking', label: 'Staking', color: '#8B5CF6', value: breakdown.staking },
      { key: 'liquidity', label: 'LP Tokens', color: '#EC4899', value: breakdown.liquidity },
    ];

    let cumulativePercent = 0;
    return items.map(item => {
      const percent = (item.value / total) * 100;
      const startAngle = cumulativePercent * 3.6;
      cumulativePercent += percent;
      const endAngle = cumulativePercent * 3.6;
      return { ...item, percent, startAngle, endAngle };
    });
  }, [breakdown, total]);

  return (
    <div className="flex items-center gap-6">
      {/* SVG Pie Chart */}
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          {segments.map((seg, index) => {
            const circumference = 2 * Math.PI * 40;
            const dashLength = (seg.percent / 100) * circumference;
            const dashOffset = segments
              .slice(0, index)
              .reduce((acc, s) => acc + (s.percent / 100) * circumference, 0);

            return (
              <motion.circle
                key={seg.key}
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={seg.color}
                strokeWidth="20"
                strokeDasharray={`${dashLength} ${circumference}`}
                strokeDashoffset={-dashOffset}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              />
            );
          })}
        </svg>
        {/* Center value */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              ${(total / 1000000).toFixed(2)}M
            </div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {segments.map((seg) => (
          <div key={seg.key} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-gray-400 w-24">{seg.label}</span>
            <span className="text-white font-medium">{seg.percent.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// REAL-TIME TICKER
// ============================================================

function RealTimeTicker({
  value,
  previousValue,
  label,
}: {
  value: number;
  previousValue: number;
  label: string;
}) {
  const change = value - previousValue;
  const changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800">
      <div>
        <div className="text-xs text-gray-400">{label}</div>
        <motion.div
          className="text-xl font-bold text-white"
          key={value}
          initial={{ scale: 1.1, color: isPositive ? '#22C55E' : '#EF4444' }}
          animate={{ scale: 1, color: '#FFFFFF' }}
          transition={{ duration: 0.3 }}
        >
          ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </motion.div>
      </div>
      <motion.div
        className={`flex items-center gap-1 text-sm ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <svg
          className={`w-4 h-4 ${isPositive ? '' : 'rotate-180'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
        <span>{changePercent.toFixed(2)}%</span>
      </motion.div>
    </div>
  );
}

// ============================================================
// WEALTH PARTICLE ANIMATION
// ============================================================

function WealthParticles({ isActive }: { isActive: boolean }) {
  const particles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      size: 2 + Math.random() * 4,
    })),
    []
  );

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute bg-emerald-500 rounded-full opacity-60"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
          }}
          initial={{ bottom: -10, opacity: 0 }}
          animate={{
            bottom: '110%',
            opacity: [0, 0.6, 0.6, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

// ============================================================
// MAIN WEALTH VISUALIZER COMPONENT
// ============================================================

export function WealthVisualizer({
  initialValue = 2500000,
  targetValue = 10000000,
  updateInterval = 3000,
  compact = false,
}: WealthVisualizerProps) {
  const [wealthData, setWealthData] = useState<WealthData>({
    totalValueUSD: initialValue,
    totalValueKRW: initialValue * 1300,
    breakdown: {
      kaus: initialValue * 0.35,
      energy: initialValue * 0.25,
      solar: initialValue * 0.20,
      staking: initialValue * 0.12,
      liquidity: initialValue * 0.08,
    },
    change24h: 15420.50,
    changePercent: 0.62,
    targetValue,
    projectedDate: '2027-06-15',
  });

  const [previousValue, setPreviousValue] = useState(initialValue);
  const [isGrowing, setIsGrowing] = useState(false);

  // Simulate real-time value updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPreviousValue(wealthData.totalValueUSD);

      // Simulate gradual growth with some volatility
      const growthRate = 0.00001 + Math.random() * 0.00005; // 0.001% - 0.006%
      const volatility = (Math.random() - 0.5) * 0.0001; // ±0.005%
      const newValue = wealthData.totalValueUSD * (1 + growthRate + volatility);

      const change = newValue - initialValue;
      const changePercent = (change / initialValue) * 100;

      setWealthData(prev => ({
        ...prev,
        totalValueUSD: newValue,
        totalValueKRW: newValue * 1300,
        breakdown: {
          kaus: newValue * 0.35,
          energy: newValue * 0.25,
          solar: newValue * 0.20,
          staking: newValue * 0.12,
          liquidity: newValue * 0.08,
        },
        change24h: change,
        changePercent: changePercent,
      }));

      setIsGrowing(true);
      setTimeout(() => setIsGrowing(false), 500);
    }, updateInterval);

    return () => clearInterval(interval);
  }, [wealthData.totalValueUSD, initialValue, updateInterval]);

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-xl p-4 border border-gray-800">
        <RealTimeTicker
          value={wealthData.totalValueUSD}
          previousValue={previousValue}
          label="총 자산가치"
        />
      </div>
    );
  }

  return (
    <motion.div
      className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 rounded-2xl p-6 border border-gray-800 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 pointer-events-none" />

      {/* Particle animation */}
      <WealthParticles isActive={isGrowing} />

      {/* Header */}
      <div className="relative flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="text-2xl">💎</span>
            Live Wealth Tracker
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            실시간 자산 가치 추적
          </p>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
          <motion.div
            className="w-2 h-2 bg-emerald-500 rounded-full"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-xs text-emerald-400 font-medium">LIVE</span>
        </div>
      </div>

      {/* Main value display */}
      <div className="relative mb-6">
        <motion.div
          className="text-5xl font-bold text-white tracking-tight"
          key={Math.round(wealthData.totalValueUSD)}
        >
          <AnimatedNumber
            value={wealthData.totalValueUSD}
            prefix="$"
            decimals={2}
          />
        </motion.div>
        <div className="text-gray-400 text-lg mt-1">
          ≈ ₩{(wealthData.totalValueKRW / 100000000).toFixed(2)}억
        </div>

        {/* 24h change */}
        <div className={`flex items-center gap-2 mt-3 ${wealthData.change24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
          <svg
            className={`w-5 h-5 ${wealthData.change24h >= 0 ? '' : 'rotate-180'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          <span className="text-lg font-semibold">
            ${Math.abs(wealthData.change24h).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-sm">
            ({wealthData.changePercent >= 0 ? '+' : ''}{wealthData.changePercent.toFixed(2)}% 24h)
          </span>
        </div>
      </div>

      {/* Progress to $10M */}
      <div className="mb-6">
        <ProgressToTarget
          current={wealthData.totalValueUSD}
          target={wealthData.targetValue}
          label="$10M 달성까지"
        />
        <p className="text-xs text-gray-500 mt-2">
          예상 달성일: {wealthData.projectedDate}
        </p>
      </div>

      {/* Asset breakdown */}
      <div className="pt-4 border-t border-gray-800">
        <h4 className="text-sm font-medium text-gray-400 mb-4">자산 구성</h4>
        <AssetPieChart breakdown={wealthData.breakdown} />
      </div>

      {/* Real-time tickers */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <RealTimeTicker
          value={wealthData.breakdown.kaus}
          previousValue={previousValue * 0.35}
          label="KAUS Holdings"
        />
        <RealTimeTicker
          value={wealthData.breakdown.energy}
          previousValue={previousValue * 0.25}
          label="Energy Credits"
        />
      </div>
    </motion.div>
  );
}

// ============================================================
// COMPACT WEALTH BADGE
// ============================================================

export function WealthBadge({ value }: { value: number }) {
  const tier = useMemo(() => {
    if (value >= 10000000) return { label: 'Diamond', color: 'from-cyan-400 to-blue-500', icon: '💎' };
    if (value >= 5000000) return { label: 'Platinum', color: 'from-gray-300 to-gray-400', icon: '🏆' };
    if (value >= 1000000) return { label: 'Gold', color: 'from-yellow-400 to-amber-500', icon: '🥇' };
    if (value >= 100000) return { label: 'Silver', color: 'from-gray-400 to-gray-500', icon: '🥈' };
    return { label: 'Bronze', color: 'from-orange-400 to-orange-600', icon: '🥉' };
  }, [value]);

  return (
    <motion.div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${tier.color} shadow-lg`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="text-lg">{tier.icon}</span>
      <span className="font-bold text-white">{tier.label}</span>
      <span className="text-white/80 text-sm">
        ${(value / 1000000).toFixed(2)}M
      </span>
    </motion.div>
  );
}

// ============================================================
// MINI WEALTH SPARK
// ============================================================

export function WealthSpark({ values }: { values: number[] }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  const isPositive = values[values.length - 1] >= values[0];

  return (
    <svg viewBox="0 0 100 100" className="w-24 h-8" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={isPositive ? '#22C55E' : '#EF4444'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default WealthVisualizer;
