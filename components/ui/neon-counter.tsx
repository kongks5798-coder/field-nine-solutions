'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 83: NEON COUNTER - IMPERIAL-GRADE PRECISION DISPLAY
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Tesla-inspired animated number display with:
 * - Smooth digit transitions
 * - Cyan neon glow effect
 * - 8 decimal precision support
 * - Real-time updates
 */

import { useEffect, useState, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NeonCounterProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'cyan' | 'green' | 'amber' | 'red' | 'white';
  animate?: boolean;
  showChange?: boolean;
  label?: string;
  className?: string;
}

const SIZE_STYLES = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
  xl: 'text-6xl',
};

const COLOR_STYLES = {
  cyan: {
    text: 'text-[#00E5FF]',
    glow: 'drop-shadow-[0_0_10px_rgba(0,229,255,0.5)]',
    bg: 'bg-[#00E5FF]/10',
  },
  green: {
    text: 'text-emerald-400',
    glow: 'drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]',
    bg: 'bg-emerald-500/10',
  },
  amber: {
    text: 'text-amber-400',
    glow: 'drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]',
    bg: 'bg-amber-500/10',
  },
  red: {
    text: 'text-red-400',
    glow: 'drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]',
    bg: 'bg-red-500/10',
  },
  white: {
    text: 'text-white',
    glow: 'drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]',
    bg: 'bg-white/10',
  },
};

// Animated single digit component
const AnimatedDigit = memo(function AnimatedDigit({
  digit,
  color,
}: {
  digit: string;
  color: keyof typeof COLOR_STYLES;
}) {
  const styles = COLOR_STYLES[color];

  return (
    <div className="relative overflow-hidden h-[1.2em] w-[0.6em]">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={digit}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`absolute inset-0 flex items-center justify-center font-mono font-black ${styles.text}`}
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </div>
  );
});

export function NeonCounter({
  value,
  decimals = 2,
  prefix = '',
  suffix = '',
  size = 'lg',
  color = 'cyan',
  animate = true,
  showChange = false,
  label,
  className = '',
}: NeonCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [change, setChange] = useState<'up' | 'down' | null>(null);
  const prevValueRef = useRef(value);
  const animationRef = useRef<number | null>(null);

  // Animated value transition
  useEffect(() => {
    if (!animate) {
      setDisplayValue(value);
      return;
    }

    const startValue = displayValue;
    const endValue = value;
    const duration = 500; // ms
    const startTime = performance.now();

    // Track change direction
    if (value !== prevValueRef.current) {
      setChange(value > prevValueRef.current ? 'up' : 'down');
      prevValueRef.current = value;

      // Clear change indicator after 2 seconds
      setTimeout(() => setChange(null), 2000);
    }

    const animateValue = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (easeOutExpo)
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = startValue + (endValue - startValue) * eased;

      setDisplayValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateValue);
      }
    };

    animationRef.current = requestAnimationFrame(animateValue);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, animate]);

  // Format the number
  const formattedValue = displayValue.toFixed(decimals);
  const [integerPart, decimalPart] = formattedValue.split('.');
  const digits = (integerPart + (decimalPart ? '.' + decimalPart : '')).split('');

  const styles = COLOR_STYLES[color];
  const sizeStyle = SIZE_STYLES[size];

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <div className="text-xs text-white/50 uppercase tracking-wider mb-1">
          {label}
        </div>
      )}

      {/* Counter */}
      <div className={`flex items-center ${sizeStyle} ${styles.glow}`}>
        {/* Prefix */}
        {prefix && (
          <span className={`${styles.text} font-mono mr-1`}>{prefix}</span>
        )}

        {/* Animated digits */}
        <div className="flex">
          {digits.map((digit, index) => (
            digit === '.' ? (
              <span key={index} className={`${styles.text} font-mono`}>.</span>
            ) : (
              <AnimatedDigit key={index} digit={digit} color={color} />
            )
          ))}
        </div>

        {/* Suffix */}
        {suffix && (
          <span className={`${styles.text} font-mono ml-1`}>{suffix}</span>
        )}

        {/* Change indicator */}
        {showChange && change && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`ml-2 text-sm ${
              change === 'up' ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {change === 'up' ? '▲' : '▼'}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// APY COUNTER - SPECIALIZED FOR YIELD DISPLAY
// ═══════════════════════════════════════════════════════════════════════════════

interface APYCounterProps {
  apy: number;
  tier?: string;
  showBreakdown?: boolean;
  breakdown?: {
    base: number;
    energyBonus: number;
    reserveBonus: number;
    volatility: number;
  };
  className?: string;
}

export function APYCounter({
  apy,
  tier,
  showBreakdown = false,
  breakdown,
  className = '',
}: APYCounterProps) {
  const percentage = apy * 100;

  return (
    <div className={`${className}`}>
      {/* Tier badge */}
      {tier && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-white/50">Current Tier:</span>
          <span className="text-xs px-2 py-0.5 bg-[#00E5FF]/20 text-[#00E5FF] rounded-full font-bold">
            {tier}
          </span>
        </div>
      )}

      {/* Main APY display */}
      <NeonCounter
        value={percentage}
        decimals={6}
        suffix="%"
        size="xl"
        color="cyan"
        label="REAL-TIME APY"
        showChange
      />

      {/* Breakdown */}
      {showBreakdown && breakdown && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 pt-4 border-t border-white/10 space-y-2"
        >
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Base APY</span>
            <span className="text-white font-mono">{(breakdown.base * 100).toFixed(2)}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Energy Bonus</span>
            <span className="text-emerald-400 font-mono">+{(breakdown.energyBonus * 100).toFixed(2)}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Reserve Bonus</span>
            <span className="text-cyan-400 font-mono">+{(breakdown.reserveBonus * 100).toFixed(2)}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Volatility Adj.</span>
            <span className={`font-mono ${breakdown.volatility >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {breakdown.volatility >= 0 ? '+' : ''}{(breakdown.volatility * 100).toFixed(2)}%
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SMP COUNTER - FOR ENERGY PRICE DISPLAY
// ═══════════════════════════════════════════════════════════════════════════════

interface SMPCounterProps {
  smp: number;
  trend: 'rising' | 'falling' | 'stable';
  className?: string;
}

export function SMPCounter({ smp, trend, className = '' }: SMPCounterProps) {
  const trendColor = trend === 'rising' ? 'green' : trend === 'falling' ? 'red' : 'white';
  const trendIcon = trend === 'rising' ? '↑' : trend === 'falling' ? '↓' : '→';

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs text-white/50 uppercase tracking-wider">SMP Price</span>
        <span className={`text-xs ${
          trend === 'rising' ? 'text-emerald-400' :
          trend === 'falling' ? 'text-red-400' : 'text-white/50'
        }`}>
          {trendIcon} {trend}
        </span>
      </div>
      <NeonCounter
        value={smp}
        decimals={0}
        prefix="₩"
        suffix="/kWh"
        size="lg"
        color={trendColor}
        showChange
      />
    </div>
  );
}

export default NeonCounter;
