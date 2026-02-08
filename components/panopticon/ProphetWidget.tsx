'use client';

import React, { memo, useEffect, useState, useCallback, useMemo, useRef } from 'react';

/**
 * THE GREAT PROPHET - AI Forecast Widget
 * Phase 35: Intelligent Revenue Optimization Display
 *
 * Features:
 * - 24-hour price predictions with confidence scores
 * - Decision recommendations (CHARGE/DISCHARGE/HOLD)
 * - Optimal timing windows
 * - Error boundary with graceful degradation
 */

interface SMPPrediction {
  hour: number;
  timestamp: string;
  predictedPrice: number;
  confidenceScore: number;
  priceChange: number;
  trend: 'rising' | 'falling' | 'stable';
}

interface ProphetForecast {
  currentPrice: number;
  currentHour: number;
  predictions: SMPPrediction[];
  optimalChargeWindow: {
    startHour: number;
    endHour: number;
    expectedPrice: number;
    savingsPercent: number;
  };
  optimalDischargeWindow: {
    startHour: number;
    endHour: number;
    expectedPrice: number;
    profitPercent: number;
  };
  decision: {
    action: 'CHARGE' | 'DISCHARGE' | 'HOLD';
    reason: string;
    expectedBenefit: number;
    comparisonText: string;
  };
  movingAverage24h: number;
  volatilityIndex: number;
  modelAccuracy: number;
  generatedAt: string;
}

interface ProphetWidgetProps {
  batteryCapacity?: number;
  refreshInterval?: number;
  onForecastUpdate?: (forecast: ProphetForecast) => void;
}

// Decision action colors
const ACTION_COLORS = {
  CHARGE: {
    bg: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.4)',
    text: '#60A5FA',
    icon: '⚡',
  },
  DISCHARGE: {
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.4)',
    text: '#FBBF24',
    icon: '🔋',
  },
  HOLD: {
    bg: 'rgba(107, 114, 128, 0.15)',
    border: 'rgba(107, 114, 128, 0.4)',
    text: '#9CA3AF',
    icon: '⏸️',
  },
};

// Rolling number animation hook
function useRollingNumber(targetValue: number, duration: number = 1000): number {
  const [displayValue, setDisplayValue] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startValueRef = useRef(0);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    startValueRef.current = displayValue;
    startTimeRef.current = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      const current = startValueRef.current + (targetValue - startValueRef.current) * eased;
      setDisplayValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration]);

  return displayValue;
}

// Memoized prediction mini-chart
const PredictionChart = memo(function PredictionChart({
  predictions,
  currentHour,
}: {
  predictions: SMPPrediction[];
  currentHour: number;
}) {
  if (!predictions.length) return null;

  const prices = predictions.map(p => p.predictedPrice);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const range = maxPrice - minPrice || 1;

  // Generate path
  const width = 280;
  const height = 60;
  const points = predictions.slice(0, 12).map((p, i) => {
    const x = (i / 11) * width;
    const y = height - ((p.predictedPrice - minPrice) / range) * height;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  // Find current hour index
  const currentIndex = predictions.findIndex(p => p.hour === currentHour);

  return (
    <svg
      viewBox={`0 0 ${width} ${height + 20}`}
      style={{ width: '100%', height: 'auto' }}
    >
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map(pct => (
        <line
          key={pct}
          x1="0"
          y1={height * pct}
          x2={width}
          y2={height * pct}
          stroke="#333"
          strokeWidth="0.5"
          strokeDasharray="4 4"
        />
      ))}

      {/* Fill area */}
      <path
        d={`${pathD} L ${width},${height} L 0,${height} Z`}
        fill="url(#chartGradient)"
      />

      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke="#3B82F6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Current position dot */}
      {currentIndex >= 0 && currentIndex < 12 && (
        <circle
          cx={(currentIndex / 11) * width}
          cy={height - ((predictions[currentIndex].predictedPrice - minPrice) / range) * height}
          r="4"
          fill="#3B82F6"
          stroke="#FFF"
          strokeWidth="2"
        >
          <animate
            attributeName="r"
            values="4;6;4"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Hour labels */}
      {[0, 3, 6, 9, 11].map(i => (
        <text
          key={i}
          x={(i / 11) * width}
          y={height + 14}
          fill="#666"
          fontSize="9"
          textAnchor="middle"
          fontFamily="monospace"
        >
          {predictions[i]?.hour.toString().padStart(2, '0')}:00
        </text>
      ))}
    </svg>
  );
});

// Error state component
const ErrorState = memo(function ErrorState({
  error,
  retryIn,
  onRetry,
}: {
  error: string;
  retryIn: number;
  onRetry: () => void;
}) {
  return (
    <div
      style={{
        padding: '24px',
        textAlign: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: '12px',
        border: '1px solid rgba(239, 68, 68, 0.2)',
      }}
    >
      <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#F87171' }}>
        데이터 복구 중
      </p>
      <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#666' }}>
        {error}
      </p>
      <p style={{ margin: 0, fontSize: '10px', color: '#525252' }}>
        Retry in {retryIn}s
        <button
          onClick={onRetry}
          style={{
            marginLeft: '8px',
            padding: '2px 8px',
            fontSize: '10px',
            backgroundColor: '#333',
            border: '1px solid #555',
            borderRadius: '4px',
            color: '#999',
            cursor: 'pointer',
          }}
        >
          Retry Now
        </button>
      </p>
    </div>
  );
});

// Main Prophet Widget Component
function ProphetWidgetComponent({
  batteryCapacity = 100,
  refreshInterval = 60000,
  onForecastUpdate,
}: ProphetWidgetProps) {
  const [forecast, setForecast] = useState<ProphetForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryIn, setRetryIn] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [syncAgo, setSyncAgo] = useState<string>('--');

  // Animated values
  const displayBenefit = useRollingNumber(forecast?.decision.expectedBenefit || 0, 1500);
  const displayAccuracy = useRollingNumber(forecast?.modelAccuracy || 0, 1000);

  // Fetch forecast data
  const fetchForecast = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/ai/forecast?capacity=${batteryCapacity}&history=false`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch forecast');
      }

      setForecast(data.data.forecast);
      setLastUpdate(new Date());
      onForecastUpdate?.(data.data.forecast);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setRetryIn(3);
    } finally {
      setLoading(false);
    }
  }, [batteryCapacity, onForecastUpdate]);

  // Initial fetch and refresh interval
  useEffect(() => {
    fetchForecast();
    const interval = setInterval(fetchForecast, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchForecast, refreshInterval]);

  // Retry countdown
  useEffect(() => {
    if (retryIn <= 0) return;

    const timer = setTimeout(() => {
      if (retryIn === 1) {
        fetchForecast();
      } else {
        setRetryIn(retryIn - 1);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [retryIn, fetchForecast]);

  // Sync time display
  useEffect(() => {
    if (!lastUpdate) return;

    const updateSync = () => {
      const diff = (Date.now() - lastUpdate.getTime()) / 1000;
      if (diff < 60) {
        setSyncAgo(`${diff.toFixed(1)}s ago`);
      } else {
        setSyncAgo(`${Math.floor(diff / 60)}m ago`);
      }
    };

    updateSync();
    const interval = setInterval(updateSync, 100);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  // Memoized action colors
  const actionStyle = useMemo(() => {
    const action = forecast?.decision.action || 'HOLD';
    return ACTION_COLORS[action];
  }, [forecast?.decision.action]);

  if (loading && !forecast) {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(26, 26, 46, 0.95) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid #333',
              borderTopColor: '#3B82F6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
            AI 예측 모델 초기화 중...
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error && !forecast) {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(26, 26, 46, 0.95) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <ErrorState error={error} retryIn={retryIn} onRetry={fetchForecast} />
      </div>
    );
  }

  if (!forecast) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(26, 26, 46, 0.95) 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: '20px',
        padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}
          >
            🔮
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#FFF' }}>
              The Great Prophet
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#666' }}>
              AI Revenue Optimizer
            </p>
          </div>
        </div>

        {/* Model accuracy */}
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#22C55E', fontFamily: 'monospace' }}>
            {displayAccuracy.toFixed(1)}%
          </p>
          <p style={{ margin: 0, fontSize: '10px', color: '#525252' }}>Model Accuracy</p>
        </div>
      </div>

      {/* Decision Card */}
      <div
        style={{
          padding: '20px',
          borderRadius: '16px',
          backgroundColor: actionStyle.bg,
          border: `1px solid ${actionStyle.border}`,
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{ fontSize: '24px' }}>{actionStyle.icon}</span>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 700,
                color: actionStyle.text,
                letterSpacing: '2px',
              }}
            >
              {forecast.decision.action}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#999' }}>
              {forecast.decision.reason}
            </p>
          </div>
        </div>

        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '12px', color: '#888' }}>기대 수익</span>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#22C55E', fontFamily: 'monospace' }}>
            ₩{Math.round(displayBenefit).toLocaleString()}
          </span>
        </div>

        <p style={{ margin: '12px 0 0', fontSize: '11px', color: '#7DD3FC', fontStyle: 'italic' }}>
          💡 {forecast.decision.comparisonText}
        </p>
      </div>

      {/* 12-hour prediction chart */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>
          12-Hour Price Forecast
        </p>
        <div
          style={{
            padding: '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
          }}
        >
          <PredictionChart predictions={forecast.predictions} currentHour={forecast.currentHour} />
        </div>
      </div>

      {/* Optimal windows */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div
          style={{
            padding: '16px',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(59, 130, 246, 0.2)',
          }}
        >
          <p style={{ margin: '0 0 8px', fontSize: '10px', color: '#60A5FA', textTransform: 'uppercase' }}>
            ⚡ Best Charge Window
          </p>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#FFF' }}>
            {forecast.optimalChargeWindow.startHour.toString().padStart(2, '0')}:00 -{' '}
            {forecast.optimalChargeWindow.endHour.toString().padStart(2, '0')}:00
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#22C55E' }}>
            -{forecast.optimalChargeWindow.savingsPercent}% savings
          </p>
        </div>

        <div
          style={{
            padding: '16px',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(245, 158, 11, 0.2)',
          }}
        >
          <p style={{ margin: '0 0 8px', fontSize: '10px', color: '#FBBF24', textTransform: 'uppercase' }}>
            🔋 Best V2G Window
          </p>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#FFF' }}>
            {forecast.optimalDischargeWindow.startHour.toString().padStart(2, '0')}:00 -{' '}
            {forecast.optimalDischargeWindow.endHour.toString().padStart(2, '0')}:00
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#22C55E' }}>
            +{forecast.optimalDischargeWindow.profitPercent}% profit
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          padding: '12px',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '10px',
          marginBottom: '12px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#FFF', fontFamily: 'monospace' }}>
            ₩{forecast.currentPrice}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '9px', color: '#666' }}>Current SMP</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#FFF', fontFamily: 'monospace' }}>
            ₩{forecast.movingAverage24h}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '9px', color: '#666' }}>24h Average</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#FFF', fontFamily: 'monospace' }}>
            {forecast.volatilityIndex.toFixed(1)}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '9px', color: '#666' }}>Volatility</p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '10px', color: '#404040', fontFamily: 'monospace' }}>
          Prophet v1.0
        </span>
        <span style={{ fontSize: '10px', color: '#525252' }}>
          Last synced: {syncAgo}
        </span>
      </div>
    </div>
  );
}

export const ProphetWidget = memo(ProphetWidgetComponent);
export default ProphetWidget;
