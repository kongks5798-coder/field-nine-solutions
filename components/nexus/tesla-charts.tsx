'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 47: TESLA-GRADE ANIMATED CHARTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * Real-time brush effects & buttery smooth transitions
 * Premium aesthetic for the Field Nine Empire
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ChartDataPoint {
  timestamp: number;
  value: number;
  label?: string;
}

export interface TeslaChartProps {
  data: ChartDataPoint[];
  height?: number;
  gradient?: [string, string];
  showBrush?: boolean;
  showTooltip?: boolean;
  animated?: boolean;
  strokeWidth?: number;
  dotSize?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED LINE CHART
// ═══════════════════════════════════════════════════════════════════════════════

export function TeslaLineChart({
  data,
  height = 200,
  gradient = ['#10B981', '#06B6D4'],
  showBrush = true,
  showTooltip = true,
  animated = true,
  strokeWidth = 2,
  dotSize = 4,
}: TeslaChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [brushRange, setBrushRange] = useState<[number, number]>([0, 1]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawProgress, setDrawProgress] = useState(0);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height,
        });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [height]);

  // Animate drawing
  useEffect(() => {
    if (!animated) {
      setDrawProgress(1);
      return;
    }

    setIsDrawing(true);
    setDrawProgress(0);

    const startTime = Date.now();
    const duration = 1500;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      setDrawProgress(easeOutCubic(progress));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsDrawing(false);
      }
    };

    requestAnimationFrame(animate);
  }, [data, animated]);

  // Calculate paths
  const paths = useMemo(() => {
    if (!data.length || dimensions.width === 0) return { line: '', area: '', dots: [] };

    const padding = { top: 20, right: 10, bottom: 30, left: 10 };
    const chartWidth = dimensions.width - padding.left - padding.right;
    const chartHeight = dimensions.height - padding.top - padding.bottom;

    // Apply brush range
    const startIdx = Math.floor(data.length * brushRange[0]);
    const endIdx = Math.ceil(data.length * brushRange[1]);
    const visibleData = data.slice(startIdx, endIdx);

    const values = visibleData.map(d => d.value);
    const minVal = Math.min(...values) * 0.95;
    const maxVal = Math.max(...values) * 1.05;
    const range = maxVal - minVal || 1;

    const points = visibleData.map((d, i) => {
      const x = padding.left + (i / (visibleData.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((d.value - minVal) / range) * chartHeight;
      return { x, y, value: d.value, label: d.label };
    });

    // Smooth curve using bezier
    let line = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const cpx = (p0.x + p1.x) / 2;
      line += ` C ${cpx} ${p0.y}, ${cpx} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    // Area path
    const area = line +
      ` L ${points[points.length - 1].x} ${dimensions.height - padding.bottom}` +
      ` L ${points[0].x} ${dimensions.height - padding.bottom} Z`;

    return { line, area, dots: points };
  }, [data, dimensions, brushRange]);

  const gradientId = useMemo(() => `tesla-gradient-${Math.random().toString(36).substr(2, 9)}`, []);
  const areaGradientId = useMemo(() => `tesla-area-${Math.random().toString(36).substr(2, 9)}`, []);

  return (
    <div ref={containerRef} className="relative w-full" style={{ height }}>
      <svg
        width={dimensions.width}
        height={dimensions.height}
        className="overflow-visible"
      >
        <defs>
          {/* Line gradient */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradient[0]} />
            <stop offset="100%" stopColor={gradient[1]} />
          </linearGradient>

          {/* Area gradient */}
          <linearGradient id={areaGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={gradient[0]} stopOpacity="0.3" />
            <stop offset="100%" stopColor={gradient[0]} stopOpacity="0" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Area fill with animation */}
        <motion.path
          d={paths.area}
          fill={`url(#${areaGradientId})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: drawProgress }}
          transition={{ duration: 0.5 }}
        />

        {/* Main line with drawing animation */}
        <motion.path
          d={paths.line}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
          strokeDasharray={dimensions.width * 2}
          strokeDashoffset={dimensions.width * 2 * (1 - drawProgress)}
          style={{ transition: isDrawing ? 'none' : 'stroke-dashoffset 0.3s ease' }}
        />

        {/* Dots */}
        {paths.dots.map((dot, i) => {
          const opacity = i / paths.dots.length <= drawProgress ? 1 : 0;
          const isHovered = hoveredIndex === i;

          return (
            <g key={i}>
              {/* Hover area */}
              <circle
                cx={dot.x}
                cy={dot.y}
                r={20}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'pointer' }}
              />

              {/* Outer glow on hover */}
              <motion.circle
                cx={dot.x}
                cy={dot.y}
                r={isHovered ? dotSize * 3 : 0}
                fill={gradient[0]}
                opacity={0.2}
                animate={{ r: isHovered ? dotSize * 3 : 0 }}
                transition={{ duration: 0.2 }}
              />

              {/* Dot */}
              <motion.circle
                cx={dot.x}
                cy={dot.y}
                r={isHovered ? dotSize * 1.5 : dotSize}
                fill={gradient[0]}
                opacity={opacity}
                animate={{
                  r: isHovered ? dotSize * 1.5 : dotSize,
                  opacity,
                }}
                transition={{ duration: 0.2 }}
              />
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && hoveredIndex !== null && paths.dots[hoveredIndex] && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute pointer-events-none z-10"
            style={{
              left: paths.dots[hoveredIndex].x,
              top: paths.dots[hoveredIndex].y - 50,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="px-3 py-2 bg-[#171717] text-white text-sm rounded-lg shadow-xl border border-white/10">
              <div className="font-bold">{paths.dots[hoveredIndex].value.toFixed(2)}</div>
              {paths.dots[hoveredIndex].label && (
                <div className="text-xs text-white/50">{paths.dots[hoveredIndex].label}</div>
              )}
            </div>
            <div
              className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-[#171717] mx-auto"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Brush control */}
      {showBrush && (
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-white/5 rounded-lg overflow-hidden">
          <motion.div
            className="absolute top-0 h-full bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 rounded cursor-ew-resize"
            style={{
              left: `${brushRange[0] * 100}%`,
              width: `${(brushRange[1] - brushRange[0]) * 100}%`,
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0}
            onDrag={(_, info) => {
              const container = containerRef.current;
              if (!container) return;
              const rect = container.getBoundingClientRect();
              const delta = info.delta.x / rect.width;
              setBrushRange(([start, end]) => {
                const newStart = Math.max(0, Math.min(1 - (end - start), start + delta));
                const newEnd = newStart + (end - start);
                return [newStart, newEnd];
              });
            }}
          >
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-white/50 rounded" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-white/50 rounded" />
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED BAR CHART
// ═══════════════════════════════════════════════════════════════════════════════

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  showValues?: boolean;
  animated?: boolean;
}

export function TeslaBarChart({
  data,
  height = 200,
  showValues = true,
  animated = true,
}: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="flex items-end justify-around gap-2" style={{ height }}>
      {data.map((item, i) => {
        const barHeight = (item.value / maxValue) * (height - 40);

        return (
          <div key={item.label} className="flex flex-col items-center gap-2 flex-1">
            {showValues && (
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: animated ? i * 0.1 : 0 }}
                className="text-xs font-bold text-white"
              >
                {item.value.toLocaleString()}
              </motion.span>
            )}
            <motion.div
              className="w-full rounded-t-lg relative overflow-hidden"
              style={{
                background: item.color || 'linear-gradient(to top, #10B981, #06B6D4)',
              }}
              initial={{ height: 0 }}
              animate={{ height: barHeight }}
              transition={{
                delay: animated ? i * 0.1 : 0,
                duration: animated ? 0.8 : 0,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{
                  delay: animated ? 0.5 + i * 0.1 : 0,
                  duration: 1.5,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
            <span className="text-xs text-white/50 truncate max-w-full">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED DONUT CHART
// ═══════════════════════════════════════════════════════════════════════════════

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  animated?: boolean;
  showCenter?: boolean;
  centerLabel?: string;
  centerValue?: string;
}

export function TeslaDonutChart({
  data,
  size = 200,
  thickness = 30,
  animated = true,
  showCenter = true,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedAngle = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {data.map((item, i) => {
          const angle = (item.value / total) * 360;
          const strokeDasharray = `${(item.value / total) * circumference} ${circumference}`;
          const strokeDashoffset = -accumulatedAngle / 360 * circumference;
          accumulatedAngle += angle;

          return (
            <motion.circle
              key={item.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={thickness}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray }}
              transition={{
                delay: animated ? i * 0.2 : 0,
                duration: animated ? 1 : 0,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          );
        })}
      </svg>

      {showCenter && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: animated ? 0.5 : 0 }}
        >
          <span className="text-2xl font-black text-white">{centerValue || total.toLocaleString()}</span>
          <span className="text-xs text-white/50">{centerLabel || 'Total'}</span>
        </motion.div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REAL-TIME PULSE CHART
// ═══════════════════════════════════════════════════════════════════════════════

interface PulseChartProps {
  value: number;
  maxValue?: number;
  label?: string;
  color?: string;
  size?: number;
}

export function TeslaPulseChart({
  value,
  maxValue = 100,
  label,
  color = '#10B981',
  size = 120,
}: PulseChartProps) {
  const percentage = Math.min(100, (value / maxValue) * 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background ring */}
      <svg width={size} height={size} className="absolute inset-0">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - 8) / 2}
          fill="none"
          stroke="white"
          strokeOpacity={0.1}
          strokeWidth={4}
        />
      </svg>

      {/* Progress ring */}
      <svg width={size} height={size} className="absolute inset-0 transform -rotate-90">
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={(size - 8) / 2}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={`${(percentage / 100) * Math.PI * (size - 8)} ${Math.PI * (size - 8)}`}
          initial={{ strokeDasharray: `0 ${Math.PI * (size - 8)}` }}
          animate={{ strokeDasharray: `${(percentage / 100) * Math.PI * (size - 8)} ${Math.PI * (size - 8)}` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>

      {/* Pulse effect */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ boxShadow: `0 0 20px ${color}40` }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl font-black text-white"
          key={value}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {value.toFixed(0)}
        </motion.span>
        {label && <span className="text-xs text-white/50">{label}</span>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPARKLINE CHART
// ═══════════════════════════════════════════════════════════════════════════════

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showChange?: boolean;
}

export function TeslaSparkline({
  data,
  width = 100,
  height = 30,
  color,
  showChange = true,
}: SparklineProps) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const change = data.length >= 2 ? ((data[data.length - 1] - data[0]) / data[0]) * 100 : 0;
  const lineColor = color || (change >= 0 ? '#10B981' : '#EF4444');

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 4);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="flex items-center gap-2">
      <svg width={width} height={height} className="overflow-visible">
        <motion.polyline
          points={points}
          fill="none"
          stroke={lineColor}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1 }}
        />
        {/* End dot */}
        <motion.circle
          cx={(data.length - 1) / (data.length - 1) * width}
          cy={height - ((data[data.length - 1] - min) / range) * (height - 4)}
          r={2}
          fill={lineColor}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8 }}
        />
      </svg>
      {showChange && (
        <span className={`text-xs font-bold ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {change >= 0 ? '+' : ''}{change.toFixed(1)}%
        </span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIVE DATA INDICATOR
// ═══════════════════════════════════════════════════════════════════════════════

export function LiveDataIndicator({ label = 'LIVE' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2">
      <motion.div
        className="w-2 h-2 bg-emerald-500 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.7, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <span className="text-xs font-bold text-emerald-400">{label}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTO-MODE BUTTON
// ═══════════════════════════════════════════════════════════════════════════════

interface AutoModeButtonProps {
  isActive: boolean;
  onToggle: () => void;
  mode?: string;
}

export function AutoModeButton({ isActive, onToggle, mode = 'PROPHET AI' }: AutoModeButtonProps) {
  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative px-6 py-4 rounded-2xl font-bold text-lg overflow-hidden ${
        isActive
          ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white'
          : 'bg-[#171717] text-white/70 border border-white/10'
      }`}
    >
      {/* Pulse effect when active */}
      {isActive && (
        <motion.div
          className="absolute inset-0 bg-white"
          animate={{ opacity: [0, 0.2, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      <div className="relative flex items-center gap-3">
        <motion.span
          animate={isActive ? { rotate: 360 } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          {isActive ? '🤖' : '⏸️'}
        </motion.span>
        <div className="text-left">
          <div className="text-sm opacity-70">AUTO-MODE</div>
          <div className="text-xs">{isActive ? `${mode} ACTIVE` : 'INACTIVE'}</div>
        </div>
        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${
          isActive ? 'bg-white/30' : 'bg-white/10'
        }`}>
          <motion.div
            className="w-4 h-4 rounded-full bg-white"
            animate={{ x: isActive ? 24 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </div>
      </div>
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFIT TICKER
// ═══════════════════════════════════════════════════════════════════════════════

interface ProfitTickerProps {
  currentProfit: number;
  targetProfit: number;
  currency?: string;
}

export function ProfitTicker({ currentProfit, targetProfit, currency = 'KAUS' }: ProfitTickerProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    const duration = 1000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easedProgress = easeOutCubic(progress);
      setDisplayValue(startValue + (currentProfit - startValue) * easedProgress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [currentProfit]);

  const progressPercent = Math.min(100, (currentProfit / targetProfit) * 100);

  return (
    <div className="bg-gradient-to-br from-[#171717] to-[#2a2a2a] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-white/50 text-sm">Today&apos;s Profit</span>
        <span className="text-xs text-amber-400">Target: {targetProfit.toLocaleString()} {currency}</span>
      </div>

      <div className="flex items-baseline gap-2 mb-4">
        <motion.span
          className="text-4xl font-black text-emerald-400"
          key={displayValue}
        >
          +{displayValue.toFixed(2)}
        </motion.span>
        <span className="text-white/50">{currency}</span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
        {/* Shimmer */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <div className="flex justify-between mt-2 text-xs text-white/50">
        <span>{progressPercent.toFixed(0)}% of target</span>
        <span>{(targetProfit - currentProfit).toFixed(2)} to go</span>
      </div>
    </div>
  );
}
