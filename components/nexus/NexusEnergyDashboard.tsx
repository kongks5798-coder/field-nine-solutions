'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 55: NEXUS ENERGY DASHBOARD
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Tesla-Style Real-Time Energy Dashboard
 * Background: #F9F9F7 | Text: #171717
 */

import { memo, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TeslaLoadingAnimation, { TeslaSkeleton, TeslaPageTransition } from './TeslaLoadingAnimation';

// ============================================
// Types
// ============================================

interface EnergyData {
  generation: {
    outputMW: number;
    outputKW: number;
    utilizationPercent: number;
    weather: {
      condition: string;
      temperature: number;
      solarIrradiance: number;
    };
    economics: {
      smpPrice: number;
      revenueKRW: number;
      revenueUSD: number;
      kausGenerated: number;
    };
  };
  orderbook?: {
    spread: number;
    midPrice: number;
    liquidityScore: number;
    bids: Array<{ price: number; quantity: number }>;
    asks: Array<{ price: number; quantity: number }>;
  };
  marketCondition?: {
    supplyLevel: 'surplus' | 'balanced' | 'deficit';
    priceDirection: 'up' | 'stable' | 'down';
    volatility: number;
    recommendation: string;
  };
}

// ============================================
// Constants
// ============================================

const COLORS = {
  background: '#F9F9F7',
  card: '#FFFFFF',
  text: '#171717',
  muted: '#8E8E93',
  accent: '#1a1a1a',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  border: '#E5E5E7',
};

const REFRESH_INTERVAL = 10000; // 10 seconds

// ============================================
// Main Component
// ============================================

const NexusEnergyDashboard = memo(function NexusEnergyDashboard() {
  const [data, setData] = useState<EnergyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch energy data
  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/nexus/sync?orderbook=true');
      if (!response.ok) throw new Error('Failed to fetch data');

      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Unknown error');

      setData({
        generation: {
          outputMW: result.generation.current.outputMW,
          outputKW: result.generation.current.outputKW,
          utilizationPercent: result.generation.current.utilizationPercent,
          weather: result.generation.weather,
          economics: result.generation.economics,
        },
        orderbook: result.orderbook?.summary,
        marketCondition: result.marketCondition,
      });
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load and refresh interval
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: COLORS.background, color: COLORS.text }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              NEXUS Energy Dashboard
            </h1>
            <p className="mt-1 text-sm" style={{ color: COLORS.muted }}>
              영동 태양광 발전소 실시간 모니터링
            </p>
          </div>
          <StatusIndicator
            isLive={!isLoading && !error}
            lastUpdated={lastUpdated}
          />
        </div>
      </motion.div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 rounded-lg p-4"
          style={{ backgroundColor: '#FFF0F0', border: `1px solid ${COLORS.danger}` }}
        >
          <p className="text-sm" style={{ color: COLORS.danger }}>
            {error}
          </p>
        </motion.div>
      )}

      {/* Loading State */}
      <TeslaPageTransition isLoading={isLoading}>
        {data && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Power Output Card */}
            <MetricCard
              title="발전량"
              value={`${data.generation.outputMW.toFixed(2)} MW`}
              subtitle={`${data.generation.outputKW.toLocaleString()} kW`}
              progress={data.generation.utilizationPercent}
              progressLabel={`가동률 ${data.generation.utilizationPercent.toFixed(1)}%`}
              icon="⚡"
            />

            {/* KAUS Generation Card */}
            <MetricCard
              title="KAUS 생성"
              value={data.generation.economics.kausGenerated.toLocaleString()}
              subtitle="KAUS/hour"
              secondaryValue={`$${(data.generation.economics.kausGenerated * 0.10).toFixed(2)}`}
              icon="💎"
            />

            {/* Revenue Card */}
            <MetricCard
              title="예상 수익"
              value={`₩${data.generation.economics.revenueKRW.toLocaleString()}`}
              subtitle={`$${data.generation.economics.revenueUSD.toFixed(2)} USD`}
              trend={data.marketCondition?.priceDirection}
              icon="📈"
            />

            {/* Weather Card */}
            <MetricCard
              title="기상 상태"
              value={data.generation.weather.condition}
              subtitle={`${data.generation.weather.temperature.toFixed(1)}°C`}
              secondaryValue={`일사량: ${data.generation.weather.solarIrradiance} W/m²`}
              icon={getWeatherIcon(data.generation.weather.condition)}
            />

            {/* Market Price Card */}
            <MetricCard
              title="SMP 가격"
              value={`₩${data.generation.economics.smpPrice.toFixed(0)}`}
              subtitle="원/kWh"
              secondaryValue={data.orderbook ? `스프레드: ${data.orderbook.spread.toFixed(2)}%` : undefined}
              icon="💰"
            />

            {/* Market Condition Card */}
            {data.marketCondition && (
              <MarketConditionCard condition={data.marketCondition} />
            )}

            {/* Orderbook Preview */}
            {data.orderbook && (
              <div className="md:col-span-2 lg:col-span-3">
                <OrderbookPreview orderbook={data.orderbook} />
              </div>
            )}
          </div>
        )}
      </TeslaPageTransition>
    </div>
  );
});

// ============================================
// Sub-Components
// ============================================

const MetricCard = memo(function MetricCard({
  title,
  value,
  subtitle,
  secondaryValue,
  progress,
  progressLabel,
  trend,
  icon,
}: {
  title: string;
  value: string;
  subtitle?: string;
  secondaryValue?: string;
  progress?: number;
  progressLabel?: string;
  trend?: 'up' | 'stable' | 'down';
  icon?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl p-5"
      style={{
        backgroundColor: COLORS.card,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: COLORS.muted }}>
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold" style={{ color: COLORS.text }}>
              {value}
            </span>
            {trend && <TrendIndicator direction={trend} />}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm" style={{ color: COLORS.muted }}>
              {subtitle}
            </p>
          )}
          {secondaryValue && (
            <p className="mt-2 text-xs" style={{ color: COLORS.accent }}>
              {secondaryValue}
            </p>
          )}
        </div>
        {icon && (
          <span className="text-2xl opacity-50">{icon}</span>
        )}
      </div>

      {progress !== undefined && (
        <div className="mt-4">
          <div className="flex justify-between text-xs" style={{ color: COLORS.muted }}>
            <span>{progressLabel}</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div
            className="mt-1 h-1.5 overflow-hidden rounded-full"
            style={{ backgroundColor: COLORS.border }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                backgroundColor: progress > 70 ? COLORS.success :
                                progress > 30 ? COLORS.warning : COLORS.danger,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
});

const MarketConditionCard = memo(function MarketConditionCard({
  condition,
}: {
  condition: NonNullable<EnergyData['marketCondition']>;
}) {
  const statusColor = {
    surplus: COLORS.success,
    balanced: COLORS.warning,
    deficit: COLORS.danger,
  }[condition.supplyLevel];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl p-5"
      style={{
        backgroundColor: COLORS.card,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <p className="text-xs font-medium uppercase tracking-wider" style={{ color: COLORS.muted }}>
        시장 상태
      </p>

      <div className="mt-3 flex items-center gap-3">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: statusColor }}
        />
        <span className="text-lg font-medium" style={{ color: COLORS.text }}>
          {condition.supplyLevel === 'surplus' ? '공급 과잉' :
           condition.supplyLevel === 'deficit' ? '공급 부족' : '균형'}
        </span>
      </div>

      <p className="mt-3 text-sm" style={{ color: COLORS.muted }}>
        {condition.recommendation}
      </p>

      <div className="mt-4 flex items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="text-xs" style={{ color: COLORS.muted }}>변동성:</span>
          <span className="text-sm font-medium">{condition.volatility}%</span>
        </div>
        <TrendIndicator direction={condition.priceDirection} showLabel />
      </div>
    </motion.div>
  );
});

const OrderbookPreview = memo(function OrderbookPreview({
  orderbook,
}: {
  orderbook: NonNullable<EnergyData['orderbook']>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="rounded-xl p-5"
      style={{
        backgroundColor: COLORS.card,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: COLORS.muted }}>
          오더북
        </p>
        <div className="flex items-center gap-4 text-xs" style={{ color: COLORS.muted }}>
          <span>중간가: ${orderbook.midPrice.toFixed(4)}</span>
          <span>유동성: {orderbook.liquidityScore}/100</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        {/* Bids */}
        <div>
          <p className="mb-2 text-xs font-medium" style={{ color: COLORS.success }}>
            매수 (BID)
          </p>
          <div className="space-y-1">
            {orderbook.bids.slice(0, 5).map((bid, i) => (
              <div
                key={i}
                className="flex justify-between rounded px-2 py-1 text-xs"
                style={{ backgroundColor: `${COLORS.success}10` }}
              >
                <span>${bid.price.toFixed(4)}</span>
                <span>{bid.quantity.toLocaleString()} kWh</span>
              </div>
            ))}
          </div>
        </div>

        {/* Asks */}
        <div>
          <p className="mb-2 text-xs font-medium" style={{ color: COLORS.danger }}>
            매도 (ASK)
          </p>
          <div className="space-y-1">
            {orderbook.asks.slice(0, 5).map((ask, i) => (
              <div
                key={i}
                className="flex justify-between rounded px-2 py-1 text-xs"
                style={{ backgroundColor: `${COLORS.danger}10` }}
              >
                <span>${ask.price.toFixed(4)}</span>
                <span>{ask.quantity.toLocaleString()} kWh</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

const StatusIndicator = memo(function StatusIndicator({
  isLive,
  lastUpdated,
}: {
  isLive: boolean;
  lastUpdated: Date | null;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <motion.div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: isLive ? COLORS.success : COLORS.danger }}
          animate={isLive ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span className="text-xs" style={{ color: COLORS.muted }}>
          {isLive ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>
      {lastUpdated && (
        <span className="text-xs" style={{ color: COLORS.muted }}>
          {lastUpdated.toLocaleTimeString('ko-KR')}
        </span>
      )}
    </div>
  );
});

const TrendIndicator = memo(function TrendIndicator({
  direction,
  showLabel = false,
}: {
  direction: 'up' | 'stable' | 'down';
  showLabel?: boolean;
}) {
  const config = {
    up: { icon: '↑', color: COLORS.success, label: '상승' },
    stable: { icon: '→', color: COLORS.warning, label: '보합' },
    down: { icon: '↓', color: COLORS.danger, label: '하락' },
  }[direction];

  return (
    <span className="flex items-center gap-1 text-sm" style={{ color: config.color }}>
      {config.icon}
      {showLabel && <span className="text-xs">{config.label}</span>}
    </span>
  );
});

// ============================================
// Helpers
// ============================================

function getWeatherIcon(condition: string): string {
  const icons: Record<string, string> = {
    '맑음': '☀️',
    '구름조금': '🌤️',
    '구름많음': '⛅',
    '흐림': '☁️',
    '비': '🌧️',
    '눈': '🌨️',
  };
  return icons[condition] || '🌡️';
}

export default NexusEnergyDashboard;
