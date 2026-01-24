/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AI TRADING WIDGET - Compact Version for Main Page
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Phase 36: NEXUS AI Trading Widget
 * Tesla Minimalism Theme: #F9F9F7 background, #171717 text
 *
 * Displays:
 * - AI Trading Mode status
 * - Current SMP price
 * - Trading decision (CHARGE/DISCHARGE/HOLD)
 * - Expected daily profit
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  BrainCircuit,
  ArrowUp,
  ArrowDown,
  Minus,
  Battery,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface TradingStatus {
  success: boolean;
  data: {
    engine: {
      mode: 'ACTIVE' | 'PAUSED' | 'SAFETY_LOCK' | 'OFFLINE';
      isActive: boolean;
      currentAction: 'CHARGE' | 'DISCHARGE' | 'HOLD';
    };
    currentDecision: {
      action: 'CHARGE' | 'DISCHARGE' | 'HOLD';
      confidence: number;
      reason: string;
      targetSoC: number;
      estimatedProfit: number;
      estimatedDuration: number;
      urgency: 'HIGH' | 'MEDIUM' | 'LOW';
      timestamp: string;
    };
    todayProfit: {
      expectedProfit: number;
      expectedProfitUSD: number;
      breakdown: {
        arbitrageProfit: number;
        kausRewards: number;
        gridFees: number;
      };
      confidence: number;
    };
    teslaConfigured: boolean;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS (Tesla Minimalism)
// ═══════════════════════════════════════════════════════════════════════════════

const colors = {
  bg: {
    primary: '#F9F9F7',
    card: '#FFFFFF',
    dark: '#171717',
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
    cyan: '#06B6D4',
  },
  border: '#E5E5E5',
};

// ═══════════════════════════════════════════════════════════════════════════════
// AI TRADING WIDGET COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function AITradingWidget() {
  const [data, setData] = useState<TradingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/energy/trading?type=status');
      if (response.ok) {
        const result = await response.json();
        setData(result);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('[AITradingWidget] Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, [fetchData]);

  const engine = data?.data?.engine;
  const decision = data?.data?.currentDecision;
  const profit = data?.data?.todayProfit;

  const modeConfig = {
    ACTIVE: { color: colors.accent.green, label: 'ACTIVE', pulse: true },
    PAUSED: { color: colors.accent.amber, label: 'PAUSED', pulse: false },
    SAFETY_LOCK: { color: colors.accent.red, label: 'LOCKED', pulse: true },
    OFFLINE: { color: colors.text.muted, label: 'OFFLINE', pulse: false },
  };

  const actionConfig = {
    CHARGE: { color: colors.accent.blue, icon: ArrowDown, label: '충전', bgColor: `${colors.accent.blue}15` },
    DISCHARGE: { color: colors.accent.green, icon: ArrowUp, label: 'V2G', bgColor: `${colors.accent.green}15` },
    HOLD: { color: colors.accent.amber, icon: Minus, label: '대기', bgColor: `${colors.accent.amber}15` },
  };

  const mode = engine?.mode || 'ACTIVE';
  const action = decision?.action || 'HOLD';
  const modeStyle = modeConfig[mode];
  const actionStyle = actionConfig[action];
  const ActionIcon = actionStyle.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${colors.bg.dark} 0%, #1a1a1a 100%)`,
        border: `1px solid rgba(255, 255, 255, 0.1)`,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${colors.accent.cyan} 0%, ${colors.accent.blue} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BrainCircuit size={20} color="#fff" />
          </div>
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#fff',
                letterSpacing: '-0.01em',
              }}
            >
              AI TRADING MODE
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'rgba(255, 255, 255, 0.5)',
                letterSpacing: '0.1em',
              }}
            >
              FIELD NINE NEXUS
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            borderRadius: 20,
            backgroundColor: `${modeStyle.color}20`,
            border: `1px solid ${modeStyle.color}40`,
          }}
        >
          <motion.div
            animate={modeStyle.pulse ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: modeStyle.color,
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: modeStyle.color,
              letterSpacing: '0.05em',
            }}
          >
            {modeStyle.label}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: 24 }}>
        {/* Trading Decision */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                backgroundColor: actionStyle.bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ActionIcon size={28} color={actionStyle.color} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: actionStyle.color,
                }}
              >
                {actionStyle.label}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginTop: 2,
                }}
              >
                {decision?.reason || '분석 중...'}
              </div>
            </div>
          </div>

          {/* Confidence */}
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: '#fff',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {Math.round(decision?.confidence || 0)}%
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'rgba(255, 255, 255, 0.4)',
              }}
            >
              신뢰도
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
          }}
        >
          {/* SMP Price */}
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Zap size={14} color={colors.accent.amber} />
              <span style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.5)' }}>SMP</span>
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#fff',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              --
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.4)' }}>원/kWh</div>
          </div>

          {/* Target SoC */}
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Battery size={14} color={colors.accent.blue} />
              <span style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.5)' }}>목표</span>
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#fff',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {decision?.targetSoC || 80}%
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.4)' }}>충전률</div>
          </div>

          {/* Expected Profit */}
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <TrendingUp size={14} color={colors.accent.green} />
              <span style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.5)' }}>예상</span>
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: colors.accent.green,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              ₩{(profit?.expectedProfit || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.4)' }}>일일 수익</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '12px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: 'rgba(255, 255, 255, 0.4)',
          }}
        >
          {lastUpdate ? `업데이트: ${lastUpdate.toLocaleTimeString('ko-KR')}` : '로딩 중...'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 10,
              color: colors.accent.cyan,
              fontWeight: 600,
            }}
          >
            24/7 AUTONOMOUS
          </span>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
          >
            <RefreshCw size={10} color={colors.accent.cyan} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default AITradingWidget;
