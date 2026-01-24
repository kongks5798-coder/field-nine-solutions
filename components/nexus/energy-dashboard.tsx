/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NEXUS ENERGY DASHBOARD v2.0
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Field Nine OS - Real-time Energy & Asset Monitoring
 * Phase 36: AI Trading Mode Integration
 *
 * Features:
 * - AI Trading Mode: Active/Paused indicator
 * - Real-time SMP price monitoring
 * - Tesla Fleet integration with charge controls
 * - Expected daily profit calculation
 * - Trading decision display (CHARGE/DISCHARGE/HOLD)
 *
 * @version 2.0.0 - AI Trading Integration
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Car,
  TrendingUp,
  RefreshCw,
  Battery,
  MapPin,
  Play,
  Pause,
  AlertTriangle,
  BrainCircuit,
  Wallet,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import { LiveStatusBadge, InlineLiveIndicator } from '@/components/ui/live-status-indicator';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface SMPData {
  timestamp: string;
  region: string;
  price: number;
  priceUSD: number;
  source: string;
  isLive: boolean;
}

interface TeslaVehicle {
  vin: string;
  displayName: string;
  batteryLevel: number;
  batteryRange: number;
  idealBatteryRange: number;
  chargingState: string;
  chargeRate: number;
  timeToFullCharge: number;
  location: { lat: number; lng: number } | null;
  isCharging: boolean;
  vehicleState: string;
}

interface TeslaData {
  timestamp: string;
  vehicles: TeslaVehicle[];
  totalVehicles: number;
  totalBatteryCapacity: number;
  averageSoC: number;
  source: string;
  isLive: boolean;
}

interface LiveDataResponse {
  success: boolean;
  data: {
    smp: SMPData;
    tesla: TeslaData;
    exchange: { isLive: boolean; kausPrice: number; kausPriceKRW: number };
    tvl: { isLive: boolean; totalTVL: number };
  };
  status: {
    simulationPercentage: number;
    overallHealth: number;
  };
}

interface TradingDecision {
  action: 'CHARGE' | 'DISCHARGE' | 'HOLD';
  confidence: number;
  reason: string;
  targetSoC: number;
  estimatedProfit: number;
  estimatedDuration: number;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
}

interface TradingEngineStatus {
  mode: 'ACTIVE' | 'PAUSED' | 'SAFETY_LOCK' | 'OFFLINE';
  isActive: boolean;
  currentAction: 'CHARGE' | 'DISCHARGE' | 'HOLD';
}

interface TradingProfitEstimate {
  expectedProfit: number;
  expectedProfitUSD: number;
  breakdown: {
    arbitrageProfit: number;
    kausRewards: number;
    gridFees: number;
  };
  confidence: number;
}

interface TradingAPIResponse {
  success: boolean;
  data: {
    engine: TradingEngineStatus;
    currentDecision: TradingDecision;
    todayProfit: TradingProfitEstimate;
    teslaConfigured: boolean;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════════

const colors = {
  bg: {
    primary: '#F9F9F7',
    card: '#FFFFFF',
    hover: '#F5F5F4',
    dark: '#0a0a0a',
  },
  text: {
    primary: '#171717',
    secondary: 'rgba(23, 23, 23, 0.7)',
    muted: 'rgba(23, 23, 23, 0.4)',
  },
  accent: {
    green: '#22C55E',
    blue: '#3B82F6',
    amber: '#F59E0B',
    red: '#EF4444',
    purple: '#A855F7',
  },
  border: '#E5E5E5',
};

// ═══════════════════════════════════════════════════════════════════════════════
// AI TRADING STATUS BADGE
// ═══════════════════════════════════════════════════════════════════════════════

function AITradingBadge({
  mode,
  decision,
}: {
  mode: TradingEngineStatus['mode'];
  decision?: TradingDecision;
}) {
  const modeConfig = {
    ACTIVE: { color: colors.accent.green, label: 'AI Trading: ACTIVE', pulse: true },
    PAUSED: { color: colors.accent.amber, label: 'AI Trading: PAUSED', pulse: false },
    SAFETY_LOCK: { color: colors.accent.red, label: 'SAFETY LOCK', pulse: true },
    OFFLINE: { color: colors.text.muted, label: 'AI Trading: OFFLINE', pulse: false },
  };

  const config = modeConfig[mode];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 20px',
        borderRadius: 12,
        backgroundColor: `${config.color}15`,
        border: `1px solid ${config.color}40`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <motion.div
          animate={config.pulse ? { scale: [1, 1.2, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1.5 }}
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: config.color,
          }}
        />
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: config.color,
            letterSpacing: '0.05em',
          }}
        >
          {config.label}
        </span>
      </div>

      {decision && mode === 'ACTIVE' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginLeft: 8,
            paddingLeft: 12,
            borderLeft: `1px solid ${config.color}40`,
          }}
        >
          {decision.action === 'CHARGE' && <ArrowDown size={14} color={colors.accent.blue} />}
          {decision.action === 'DISCHARGE' && <ArrowUp size={14} color={colors.accent.green} />}
          {decision.action === 'HOLD' && <Minus size={14} color={colors.accent.amber} />}
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color:
                decision.action === 'CHARGE'
                  ? colors.accent.blue
                  : decision.action === 'DISCHARGE'
                  ? colors.accent.green
                  : colors.accent.amber,
            }}
          >
            {decision.action === 'CHARGE'
              ? '충전 권장'
              : decision.action === 'DISCHARGE'
              ? 'V2G 방전'
              : '대기'}
          </span>
        </div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPECTED PROFIT CARD
// ═══════════════════════════════════════════════════════════════════════════════

function ExpectedProfitCard({
  profit,
  isLoading,
}: {
  profit: TradingProfitEstimate | null;
  isLoading: boolean;
}) {
  if (isLoading || !profit) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: 24,
          borderRadius: 16,
          backgroundColor: colors.bg.card,
          border: `1px solid ${colors.border}`,
        }}
      >
        <div style={{ opacity: 0.5 }}>로딩 중...</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      style={{
        padding: 24,
        borderRadius: 16,
        background: `linear-gradient(135deg, ${colors.accent.purple}15 0%, ${colors.accent.blue}15 100%)`,
        border: `1px solid ${colors.accent.purple}30`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: `${colors.accent.purple}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BrainCircuit size={18} color={colors.accent.purple} />
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: colors.text.secondary,
              letterSpacing: '-0.01em',
            }}
          >
            오늘의 예상 에너지 수익
          </span>
        </div>
        <span
          style={{
            fontSize: 11,
            color: colors.accent.purple,
            fontWeight: 500,
          }}
        >
          신뢰도 {Math.round(profit.confidence)}%
        </span>
      </div>

      {/* Main Value */}
      <div style={{ marginBottom: 16 }}>
        <motion.span
          key={profit.expectedProfit}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: colors.text.primary,
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          ₩{profit.expectedProfit.toLocaleString()}
        </motion.span>
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: colors.text.muted,
            marginLeft: 8,
          }}
        >
          (${profit.expectedProfitUSD})
        </span>
      </div>

      {/* Breakdown */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          padding: '12px 0',
          borderTop: `1px solid ${colors.border}`,
        }}
      >
        <div>
          <div style={{ fontSize: 10, color: colors.text.muted, marginBottom: 4 }}>
            차익 거래
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: colors.accent.green }}>
            ₩{profit.breakdown.arbitrageProfit.toLocaleString()}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: colors.text.muted, marginBottom: 4 }}>
            K-AUS 보상
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: colors.accent.blue }}>
            ₩{profit.breakdown.kausRewards.toLocaleString()}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: colors.text.muted, marginBottom: 4 }}>
            수수료
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: colors.accent.red }}>
            -₩{profit.breakdown.gridFees.toLocaleString()}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRADING DECISION CARD
// ═══════════════════════════════════════════════════════════════════════════════

function TradingDecisionCard({
  decision,
  onStartCharge,
  onStopCharge,
  teslaConfigured,
}: {
  decision: TradingDecision | null;
  onStartCharge: () => void;
  onStopCharge: () => void;
  teslaConfigured: boolean;
}) {
  if (!decision) return null;

  const actionConfig = {
    CHARGE: {
      color: colors.accent.blue,
      icon: ArrowDown,
      label: '충전 권장',
      bgGradient: `linear-gradient(135deg, ${colors.accent.blue}15 0%, ${colors.accent.green}10 100%)`,
    },
    DISCHARGE: {
      color: colors.accent.green,
      icon: ArrowUp,
      label: 'V2G 방전 권장',
      bgGradient: `linear-gradient(135deg, ${colors.accent.green}15 0%, ${colors.accent.amber}10 100%)`,
    },
    HOLD: {
      color: colors.accent.amber,
      icon: Minus,
      label: '대기 권장',
      bgGradient: `linear-gradient(135deg, ${colors.accent.amber}10 0%, ${colors.text.muted}05 100%)`,
    },
  };

  const config = actionConfig[decision.action];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: 24,
        borderRadius: 16,
        background: config.bgGradient,
        border: `1px solid ${config.color}30`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: `${config.color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={24} color={config.color} />
          </div>
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: config.color,
              }}
            >
              {config.label}
            </div>
            <div
              style={{
                fontSize: 12,
                color: colors.text.muted,
                marginTop: 2,
              }}
            >
              신뢰도 {Math.round(decision.confidence)}%
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '4px 10px',
            borderRadius: 8,
            backgroundColor:
              decision.urgency === 'HIGH'
                ? `${colors.accent.red}20`
                : decision.urgency === 'MEDIUM'
                ? `${colors.accent.amber}20`
                : `${colors.text.muted}10`,
            fontSize: 11,
            fontWeight: 600,
            color:
              decision.urgency === 'HIGH'
                ? colors.accent.red
                : decision.urgency === 'MEDIUM'
                ? colors.accent.amber
                : colors.text.muted,
          }}
        >
          {decision.urgency === 'HIGH'
            ? '긴급'
            : decision.urgency === 'MEDIUM'
            ? '보통'
            : '여유'}
        </div>
      </div>

      {/* Reason */}
      <div
        style={{
          fontSize: 13,
          color: colors.text.secondary,
          lineHeight: 1.5,
          marginBottom: 16,
        }}
      >
        {decision.reason}
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
          padding: '12px 0',
          borderTop: `1px solid ${colors.border}`,
          borderBottom: `1px solid ${colors.border}`,
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 10, color: colors.text.muted, marginBottom: 4 }}>
            목표 충전률
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: colors.text.primary }}>
            {decision.targetSoC}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: colors.text.muted, marginBottom: 4 }}>
            예상 수익
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: decision.estimatedProfit > 0 ? colors.accent.green : colors.text.primary,
            }}
          >
            {decision.estimatedProfit > 0 ? '+' : ''}₩{decision.estimatedProfit.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {teslaConfigured && (
        <div style={{ display: 'flex', gap: 12 }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStartCharge}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 10,
              border: 'none',
              backgroundColor: colors.accent.blue,
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Play size={14} />
            충전 시작
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStopCharge}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 10,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.bg.card,
              color: colors.text.primary,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Pause size={14} />
            충전 중지
          </motion.button>
        </div>
      )}

      {!teslaConfigured && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            backgroundColor: `${colors.accent.amber}10`,
            border: `1px solid ${colors.accent.amber}30`,
            fontSize: 12,
            color: colors.accent.amber,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertTriangle size={14} />
          Tesla API 연결 필요 - TESLA_ACCESS_TOKEN 설정
        </div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// METRIC CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function MetricCard({
  icon: Icon,
  title,
  value,
  unit,
  subtitle,
  isLive,
  trend,
  accentColor = colors.accent.green,
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  isLive: boolean;
  trend?: { value: number; direction: 'up' | 'down' };
  accentColor?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      style={{
        padding: 24,
        borderRadius: 16,
        backgroundColor: colors.bg.card,
        border: `1px solid ${colors.border}`,
        transition: 'box-shadow 0.2s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: `${accentColor}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={18} color={accentColor} />
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: colors.text.secondary,
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </span>
        </div>
        <InlineLiveIndicator isLive={isLive} />
      </div>

      {/* Value */}
      <div style={{ marginBottom: 8 }}>
        <motion.span
          key={String(value)}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: colors.text.primary,
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </motion.span>
        {unit && (
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: colors.text.muted,
              marginLeft: 6,
            }}
          >
            {unit}
          </span>
        )}
      </div>

      {/* Subtitle / Trend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {subtitle && (
          <span
            style={{
              fontSize: 12,
              color: colors.text.muted,
            }}
          >
            {subtitle}
          </span>
        )}
        {trend && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: trend.direction === 'up' ? colors.accent.green : colors.accent.red,
            }}
          >
            {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESLA VEHICLE CARD
// ═══════════════════════════════════════════════════════════════════════════════

function TeslaVehicleCard({ vehicle }: { vehicle: TeslaVehicle }) {
  const batteryColor =
    vehicle.batteryLevel > 60
      ? colors.accent.green
      : vehicle.batteryLevel > 20
      ? colors.accent.amber
      : colors.accent.red;

  const stateColor =
    vehicle.vehicleState === 'online'
      ? colors.accent.green
      : vehicle.vehicleState === 'asleep'
      ? colors.accent.amber
      : colors.text.muted;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        padding: 16,
        borderRadius: 12,
        backgroundColor: colors.bg.card,
        border: `1px solid ${colors.border}`,
      }}
    >
      {/* Header Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: `${colors.accent.blue}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Car size={20} color={colors.accent.blue} />
          </div>
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: colors.text.primary,
              }}
            >
              {vehicle.displayName || 'Tesla Vehicle'}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 2,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: stateColor,
                }}
              />
              <span style={{ fontSize: 11, color: colors.text.muted }}>
                {vehicle.vehicleState === 'online'
                  ? '온라인'
                  : vehicle.vehicleState === 'asleep'
                  ? '슬립 모드'
                  : '오프라인'}
              </span>
            </div>
          </div>
        </div>

        {/* Battery SoC */}
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              justifyContent: 'flex-end',
            }}
          >
            <Battery size={16} color={batteryColor} />
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: batteryColor,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {vehicle.batteryLevel}%
            </span>
          </div>
          <span style={{ fontSize: 11, color: colors.text.muted }}>SoC</span>
        </div>
      </div>

      {/* Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          padding: '12px 0',
          borderTop: `1px solid ${colors.border}`,
          borderBottom: vehicle.isCharging ? `1px solid ${colors.border}` : 'none',
        }}
      >
        {/* Range */}
        <div>
          <div style={{ fontSize: 11, color: colors.text.muted, marginBottom: 4 }}>주행 가능</div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: colors.text.primary,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {Math.round(vehicle.batteryRange)} km
          </div>
        </div>

        {/* Ideal Range */}
        <div>
          <div style={{ fontSize: 11, color: colors.text.muted, marginBottom: 4 }}>이상적 거리</div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: colors.text.primary,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {Math.round(vehicle.idealBatteryRange)} km
          </div>
        </div>

        {/* Charging State */}
        <div>
          <div style={{ fontSize: 11, color: colors.text.muted, marginBottom: 4 }}>충전 상태</div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: vehicle.isCharging ? colors.accent.green : colors.text.secondary,
            }}
          >
            {vehicle.chargingState === 'Charging'
              ? '충전 중'
              : vehicle.chargingState === 'Complete'
              ? '충전 완료'
              : vehicle.chargingState === 'Disconnected'
              ? '미연결'
              : vehicle.chargingState === 'Stopped'
              ? '충전 중지'
              : vehicle.chargingState}
          </div>
        </div>
      </div>

      {/* Charging Info (if charging) */}
      {vehicle.isCharging && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={14} color={colors.accent.green} />
            <span style={{ fontSize: 13, color: colors.text.secondary }}>
              {vehicle.chargeRate} kW로 충전 중
            </span>
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: colors.accent.green,
            }}
          >
            완충까지 {vehicle.timeToFullCharge}분
          </span>
        </div>
      )}

      {/* Location */}
      {vehicle.location && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginTop: 8,
          }}
        >
          <MapPin size={10} color={colors.text.muted} />
          <span style={{ fontSize: 10, color: colors.text.muted }}>GPS 연결됨</span>
        </div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function EnergyDashboard() {
  const [data, setData] = useState<LiveDataResponse | null>(null);
  const [tradingData, setTradingData] = useState<TradingAPIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [liveResponse, tradingResponse] = await Promise.all([
        fetch('/api/live-data?type=all'),
        fetch('/api/energy/trading?type=status'),
      ]);

      if (liveResponse.ok) {
        const liveResult = await liveResponse.json();
        setData(liveResult);
      }

      if (tradingResponse.ok) {
        const tradingResult = await tradingResponse.json();
        setTradingData(tradingResult);
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error('[EnergyDashboard] Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleStartCharge = async () => {
    const vehicles = tradingData?.data?.teslaConfigured
      ? await fetch('/api/energy/trading?type=vehicles')
          .then((r) => r.json())
          .then((d) => d.data)
      : [];

    if (vehicles?.length > 0) {
      await fetch('/api/energy/trading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'START_CHARGING', vehicleId: vehicles[0].id }),
      });
      fetchData();
    }
  };

  const handleStopCharge = async () => {
    const vehicles = tradingData?.data?.teslaConfigured
      ? await fetch('/api/energy/trading?type=vehicles')
          .then((r) => r.json())
          .then((d) => d.data)
      : [];

    if (vehicles?.length > 0) {
      await fetch('/api/energy/trading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'STOP_CHARGING', vehicleId: vehicles[0].id }),
      });
      fetchData();
    }
  };

  const smp = data?.data?.smp;
  const tesla = data?.data?.tesla;
  const livePercentage = data?.status ? 100 - data.status.simulationPercentage : 0;
  const engineStatus = tradingData?.data?.engine;
  const decision = tradingData?.data?.currentDecision;
  const profitEstimate = tradingData?.data?.todayProfit;
  const teslaConfigured = tradingData?.data?.teslaConfigured || false;

  return (
    <div
      style={{
        padding: 24,
        backgroundColor: colors.bg.primary,
        minHeight: '100vh',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 32,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: colors.text.primary,
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            에너지 대시보드
          </h1>
          <p
            style={{
              fontSize: 13,
              color: colors.text.muted,
              marginTop: 4,
            }}
          >
            Field Nine NEXUS • AI 에너지 트레이딩 시스템
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AITradingBadge mode={engineStatus?.mode || 'ACTIVE'} decision={decision || undefined} />
          <LiveStatusBadge
            status={livePercentage === 100 ? 'live' : livePercentage > 0 ? 'connecting' : 'fallback'}
            label={`${livePercentage}% LIVE`}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchData}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.bg.card,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={16} color={colors.text.secondary} />
          </motion.button>
        </div>
      </div>

      {/* AI Trading Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <ExpectedProfitCard profit={profitEstimate || null} isLoading={isLoading} />
        <TradingDecisionCard
          decision={decision || null}
          onStartCharge={handleStartCharge}
          onStopCharge={handleStopCharge}
          teslaConfigured={teslaConfigured}
        />
      </div>

      {/* Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <MetricCard
          icon={Zap}
          title="전력 단가 (SMP)"
          value={smp?.price || 0}
          unit="원/kWh"
          subtitle={smp?.region === 'MAINLAND' ? '육지 지역' : '제주 지역'}
          isLive={smp?.isLive || false}
          accentColor={colors.accent.amber}
        />

        <MetricCard
          icon={Car}
          title="Tesla Fleet"
          value={tesla?.totalVehicles || 0}
          unit="대"
          subtitle={tesla?.isLive ? '실시간 연결됨' : '연결 대기 중'}
          isLive={tesla?.isLive || false}
          accentColor={colors.accent.blue}
        />

        <MetricCard
          icon={TrendingUp}
          title="예상 월 수익"
          value={
            profitEstimate
              ? `₩${Math.round(profitEstimate.expectedProfit * 30).toLocaleString()}`
              : '₩0'
          }
          unit="월"
          subtitle="AI 분석 기반 예측"
          isLive={!!profitEstimate}
          trend={{ value: 12.5, direction: 'up' }}
          accentColor={colors.accent.green}
        />

        <MetricCard
          icon={Battery}
          title="평균 충전률 (SoC)"
          value={tesla?.averageSoC ? Math.round(tesla.averageSoC) : 0}
          unit="%"
          subtitle={tesla?.totalBatteryCapacity ? `총 ${tesla.totalBatteryCapacity} kWh 용량` : '차량 연결 대기'}
          isLive={tesla?.isLive || false}
          accentColor={
            (tesla?.averageSoC || 0) > 60
              ? colors.accent.green
              : (tesla?.averageSoC || 0) > 20
              ? colors.accent.amber
              : colors.accent.red
          }
        />
      </div>

      {/* Tesla Vehicles Section */}
      {tesla && tesla.vehicles.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: colors.text.primary,
              marginBottom: 16,
            }}
          >
            연결된 차량
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 12,
            }}
          >
            {tesla.vehicles.map((vehicle) => (
              <TeslaVehicleCard key={vehicle.vin} vehicle={vehicle} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State for Tesla */}
      {(!tesla || tesla.vehicles.length === 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            padding: 40,
            borderRadius: 16,
            backgroundColor: colors.bg.card,
            border: `1px dashed ${colors.border}`,
            textAlign: 'center',
          }}
        >
          <Car size={40} color={colors.text.muted} style={{ marginBottom: 16 }} />
          <h3
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: colors.text.primary,
              marginBottom: 8,
            }}
          >
            Tesla 차량 연결 대기 중
          </h3>
          <p
            style={{
              fontSize: 13,
              color: colors.text.muted,
              maxWidth: 300,
              margin: '0 auto',
            }}
          >
            TESLA_ACCESS_TOKEN 환경변수를 설정하면 차량 데이터가 실시간으로 표시됩니다.
          </p>
        </motion.div>
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: 32,
          paddingTop: 16,
          borderTop: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11,
          color: colors.text.muted,
        }}
      >
        <span>마지막 업데이트: {lastRefresh?.toLocaleTimeString('ko-KR') || '-'}</span>
        <span>Field Nine NEXUS v36.0 • AI TRADING MODE</span>
      </div>
    </div>
  );
}

export default EnergyDashboard;
