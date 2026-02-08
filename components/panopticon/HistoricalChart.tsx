'use client';

import React, { memo, useEffect, useState, useCallback, useMemo, useRef } from 'react';

/**
 * HISTORICAL INSIGHT - 7-Day Profit Chart
 * Phase 35: Minimalist Line Chart Visualization
 *
 * Features:
 * - 7-day profit trend
 * - Deep Black (#171717) aesthetic
 * - Interactive hover states
 * - Trend indicators
 * - Error boundary with retry
 */

interface HistoricalProfit {
  date: string;
  profit: number;
  smpHigh: number;
  smpLow: number;
  cycleCount: number;
  efficiency: number;
}

interface WeeklyProfitData {
  days: HistoricalProfit[];
  totalProfit: number;
  averageDailyProfit: number;
  bestDay: HistoricalProfit;
  worstDay: HistoricalProfit;
  trend: 'improving' | 'declining' | 'stable';
  trendPercent: number;
}

interface HistoricalChartProps {
  batteryCapacity?: number;
  refreshInterval?: number;
  onDataUpdate?: (data: WeeklyProfitData) => void;
}

// Format date to short form (Mon, Tue, etc.)
function formatDayShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

// Format currency
function formatKRW(value: number): string {
  if (value >= 1000000) {
    return `₩${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `₩${(value / 1000).toFixed(0)}K`;
  }
  return `₩${value}`;
}

// Rolling number hook
function useRollingNumber(target: number, duration: number = 1000): number {
  const [display, setDisplay] = useState(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);

    const start = display;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplay(start + (target - start) * eased);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [target, duration]);

  return display;
}

// Memoized SVG chart
const ProfitLineChart = memo(function ProfitLineChart({
  days,
  hoveredIndex,
  onHover,
}: {
  days: HistoricalProfit[];
  hoveredIndex: number | null;
  onHover: (index: number | null) => void;
}) {
  const profits = days.map(d => d.profit);
  const maxProfit = Math.max(...profits);
  const minProfit = Math.min(...profits);
  const range = maxProfit - minProfit || 1;

  const width = 320;
  const height = 100;
  const padding = { left: 30, right: 10, top: 10, bottom: 30 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Generate points
  const points = days.map((d, i) => {
    const x = padding.left + (i / (days.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((d.profit - minProfit) / range) * chartHeight;
    return { x, y, data: d };
  });

  // Path for the line
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');

  // Gradient fill path
  const fillPath = `${pathD} L ${points[points.length - 1].x},${padding.top + chartHeight} L ${points[0].x},${padding.top + chartHeight} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
      <defs>
        <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22C55E" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#22C55E" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#16A34A" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>
      </defs>

      {/* Y-axis labels */}
      {[0, 0.5, 1].map(pct => {
        const value = minProfit + range * (1 - pct);
        const y = padding.top + chartHeight * pct;
        return (
          <g key={pct}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#262626"
              strokeWidth="1"
              strokeDasharray={pct === 0 || pct === 1 ? '0' : '4 4'}
            />
            <text
              x={padding.left - 4}
              y={y + 3}
              fill="#525252"
              fontSize="8"
              textAnchor="end"
              fontFamily="monospace"
            >
              {formatKRW(value)}
            </text>
          </g>
        );
      })}

      {/* Gradient fill */}
      <path d={fillPath} fill="url(#profitGradient)" />

      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke="url(#lineGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points and labels */}
      {points.map((p, i) => (
        <g
          key={i}
          onMouseEnter={() => onHover(i)}
          onMouseLeave={() => onHover(null)}
          style={{ cursor: 'pointer' }}
        >
          {/* Hover area */}
          <rect
            x={p.x - chartWidth / days.length / 2}
            y={padding.top}
            width={chartWidth / days.length}
            height={chartHeight}
            fill="transparent"
          />

          {/* Point */}
          <circle
            cx={p.x}
            cy={p.y}
            r={hoveredIndex === i ? 6 : 4}
            fill="#22C55E"
            stroke="#0A0A0A"
            strokeWidth="2"
            style={{ transition: 'r 0.2s ease' }}
          />

          {/* X-axis label */}
          <text
            x={p.x}
            y={height - 8}
            fill={hoveredIndex === i ? '#22C55E' : '#525252'}
            fontSize="9"
            textAnchor="middle"
            fontFamily="monospace"
            style={{ transition: 'fill 0.2s ease' }}
          >
            {formatDayShort(p.data.date)}
          </text>

          {/* Hover tooltip */}
          {hoveredIndex === i && (
            <g>
              <rect
                x={p.x - 35}
                y={p.y - 35}
                width="70"
                height="25"
                rx="4"
                fill="#1A1A1A"
                stroke="#333"
                strokeWidth="1"
              />
              <text
                x={p.x}
                y={p.y - 18}
                fill="#22C55E"
                fontSize="10"
                textAnchor="middle"
                fontWeight="600"
                fontFamily="monospace"
              >
                {formatKRW(p.data.profit)}
              </text>
            </g>
          )}
        </g>
      ))}
    </svg>
  );
});

// Trend indicator component
const TrendIndicator = memo(function TrendIndicator({
  trend,
  percent,
}: {
  trend: 'improving' | 'declining' | 'stable';
  percent: number;
}) {
  const config = useMemo(() => {
    switch (trend) {
      case 'improving':
        return { color: '#22C55E', icon: '↗', label: 'Improving' };
      case 'declining':
        return { color: '#EF4444', icon: '↘', label: 'Declining' };
      default:
        return { color: '#9CA3AF', icon: '→', label: 'Stable' };
    }
  }, [trend]);

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 10px',
        backgroundColor: `${config.color}15`,
        borderRadius: '6px',
        border: `1px solid ${config.color}30`,
      }}
    >
      <span style={{ fontSize: '12px' }}>{config.icon}</span>
      <span style={{ fontSize: '11px', color: config.color, fontWeight: 500 }}>
        {config.label} {Math.abs(percent).toFixed(1)}%
      </span>
    </div>
  );
});

// Main Historical Chart Component
function HistoricalChartComponent({
  batteryCapacity = 100,
  refreshInterval = 300000, // 5 minutes
  onDataUpdate,
}: HistoricalChartProps) {
  const [data, setData] = useState<WeeklyProfitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryIn, setRetryIn] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [syncAgo, setSyncAgo] = useState<string>('--');

  // Animated values
  const displayTotal = useRollingNumber(data?.totalProfit || 0, 1500);
  const displayAvg = useRollingNumber(data?.averageDailyProfit || 0, 1200);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/ai/forecast?capacity=${batteryCapacity}&history=true`);
      const json = await res.json();

      if (!res.ok || !json.success || !json.data?.weeklyHistory) {
        throw new Error(json.error || 'Failed to fetch historical data');
      }

      setData(json.data.weeklyHistory);
      setLastUpdate(new Date());
      onDataUpdate?.(json.data.weeklyHistory);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setRetryIn(3);
    } finally {
      setLoading(false);
    }
  }, [batteryCapacity, onDataUpdate]);

  // Initial fetch and interval
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  // Retry countdown
  useEffect(() => {
    if (retryIn <= 0) return;

    const timer = setTimeout(() => {
      if (retryIn === 1) fetchData();
      else setRetryIn(retryIn - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [retryIn, fetchData]);

  // Sync time
  useEffect(() => {
    if (!lastUpdate) return;

    const update = () => {
      const diff = (Date.now() - lastUpdate.getTime()) / 1000;
      setSyncAgo(diff < 60 ? `${diff.toFixed(1)}s ago` : `${Math.floor(diff / 60)}m ago`);
    };

    update();
    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  if (loading && !data) {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #171717 0%, #1A1A1A 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              border: '2px solid #333',
              borderTopColor: '#22C55E',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px',
            }}
          />
          <p style={{ margin: 0, fontSize: '12px', color: '#525252' }}>Loading historical data...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #171717 0%, #1A1A1A 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '10px',
          }}
        >
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#F87171' }}>데이터 복구 중</p>
          <p style={{ margin: 0, fontSize: '10px', color: '#666' }}>Retry in {retryIn}s</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #171717 0%, #1A1A1A 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: '20px',
        padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background accent */}
      <div
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-50px',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.08) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
            }}
          >
            📈
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#FFF' }}>
              Historical Insight
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#525252' }}>
              7-Day Profit Trend
            </p>
          </div>
        </div>

        <TrendIndicator trend={data.trend} percent={data.trendPercent} />
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            padding: '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
          }}
        >
          <p style={{ margin: '0 0 6px', fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>
            Total (7 Days)
          </p>
          <p style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#22C55E', fontFamily: 'monospace' }}>
            ₩{Math.round(displayTotal).toLocaleString()}
          </p>
        </div>

        <div
          style={{
            padding: '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
          }}
        >
          <p style={{ margin: '0 0 6px', fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>
            Daily Average
          </p>
          <p style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#FFF', fontFamily: 'monospace' }}>
            ₩{Math.round(displayAvg).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div
        style={{
          padding: '16px',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '12px',
          marginBottom: '16px',
        }}
      >
        <ProfitLineChart days={data.days} hoveredIndex={hoveredIndex} onHover={setHoveredIndex} />
      </div>

      {/* Best/Worst days */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
        <div
          style={{
            padding: '12px',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(34, 197, 94, 0.2)',
          }}
        >
          <p style={{ margin: '0 0 4px', fontSize: '9px', color: '#4ADE80', textTransform: 'uppercase' }}>Best Day</p>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#FFF' }}>
            {formatDayShort(data.bestDay.date)} • ₩{data.bestDay.profit.toLocaleString()}
          </p>
        </div>

        <div
          style={{
            padding: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.15)',
          }}
        >
          <p style={{ margin: '0 0 4px', fontSize: '9px', color: '#F87171', textTransform: 'uppercase' }}>Worst Day</p>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#FFF' }}>
            {formatDayShort(data.worstDay.date)} • ₩{data.worstDay.profit.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: '10px', color: '#404040', fontFamily: 'monospace' }}>
          Last synced: {syncAgo}
        </span>
      </div>
    </div>
  );
}

export const HistoricalChart = memo(HistoricalChartComponent);
export default HistoricalChart;
