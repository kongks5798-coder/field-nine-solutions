'use client';

/**
 * GLASSMORPHISM UI COMPONENTS
 * Phase 34: Aesthetic Polish - 3D Hover + Rolling Numbers
 *
 * Color Palette:
 * - Background: #F9F9F7 (Warm Ivory)
 * - Text: #171717 (Deep Black)
 * - Accent: #3B82F6 (Field Nine Blue)
 * - Glass: rgba(255, 255, 255, 0.7) with backdrop blur
 *
 * Features:
 * - 3D Transform on hover (perspective + rotateX/Y)
 * - Smooth number rolling animation
 * - Profit simulator display
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// STYLE CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export const COLORS = {
  background: '#F9F9F7',      // Warm Ivory
  text: '#171717',             // Deep Black
  textMuted: '#525252',        // Muted text
  accent: '#3B82F6',           // Field Nine Blue
  success: '#22C55E',          // Green
  warning: '#F59E0B',          // Amber
  danger: '#EF4444',           // Red
  purple: '#8B5CF6',           // Purple
  glassBg: 'rgba(255, 255, 255, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.3)',
};

export const GLASS_STYLE: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
};

// ═══════════════════════════════════════════════════════════════════════════════
// ROLLING NUMBER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface RollingNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  style?: React.CSSProperties;
}

export function RollingNumber({
  value,
  duration = 1000,
  decimals = 0,
  prefix = '',
  suffix = '',
  style,
}: RollingNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out-cubic)
      const eased = 1 - Math.pow(1 - progress, 3);

      const current = startValue + (endValue - startValue) * eased;
      setDisplayValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  const formatted = displayValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span style={style}>
      {prefix}{formatted}{suffix}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3D GLASS CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface GlassCardProps {
  children: React.ReactNode;
  title?: string;
  icon?: string;
  style?: React.CSSProperties;
  className?: string;
  hover3D?: boolean;
}

export function GlassCard({ children, title, icon, style, hover3D = true }: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg)');
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!hover3D || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate rotation (max 5 degrees)
    const rotateY = ((x - centerX) / centerX) * 5;
    const rotateX = ((centerY - y) / centerY) * 5;

    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`);
  }, [hover3D]);

  const handleMouseLeave = useCallback(() => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)');
    setIsHovered(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      style={{
        ...GLASS_STYLE,
        borderRadius: '16px',
        padding: '20px',
        transform: hover3D ? transform : undefined,
        transition: 'transform 0.15s ease-out, box-shadow 0.3s ease',
        boxShadow: isHovered
          ? '0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255,255,255,0.5)'
          : '0 8px 32px rgba(0, 0, 0, 0.08)',
        willChange: 'transform',
        ...style,
      }}
    >
      {(title || icon) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          {icon && <span style={{ fontSize: '18px' }}>{icon}</span>}
          {title && (
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: COLORS.text,
                margin: 0,
                letterSpacing: '0.5px',
              }}
            >
              {title}
            </h3>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLASS STAT CARD WITH ROLLING NUMBER
// ═══════════════════════════════════════════════════════════════════════════════

interface GlassStatProps {
  label: string;
  value: number;
  icon?: string;
  trend?: number;
  suffix?: string;
  prefix?: string;
  color?: string;
  decimals?: number;
}

export function GlassStat({
  label,
  value,
  icon,
  trend,
  suffix = '',
  prefix = '',
  color,
  decimals = 0,
}: GlassStatProps) {
  const trendColor = trend && trend > 0 ? COLORS.success : trend && trend < 0 ? COLORS.danger : COLORS.textMuted;
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('perspective(800px) rotateX(0deg) rotateY(0deg)');

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateY = ((x - centerX) / centerX) * 3;
    const rotateX = ((centerY - y) / centerY) * 3;
    setTransform(`perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.01)`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTransform('perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)');
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        ...GLASS_STYLE,
        borderRadius: '12px',
        padding: '16px',
        transform,
        transition: 'transform 0.15s ease-out',
        willChange: 'transform',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '8px',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            color: COLORS.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {label}
        </span>
        {icon && <span style={{ fontSize: '16px' }}>{icon}</span>}
      </div>
      <div
        style={{
          fontSize: '24px',
          fontWeight: 700,
          color: color || COLORS.text,
          fontFamily: 'monospace',
        }}
      >
        <RollingNumber
          value={value}
          decimals={decimals}
          prefix={prefix}
          suffix={suffix}
          duration={800}
        />
      </div>
      {trend !== undefined && (
        <div
          style={{
            fontSize: '11px',
            color: trendColor,
            marginTop: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>{trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}</span>
          <span>{Math.abs(trend).toFixed(1)}% vs yesterday</span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFIT SIMULATOR WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

interface ProfitSimulatorProps {
  maxSMP: number;           // Maximum SMP price (peak)
  currentSMP: number;       // Current SMP price
  batteryCapacity: number;  // Tesla battery capacity in kWh
  efficiency?: number;      // Efficiency factor (default: 0.95)
}

/**
 * DailyProfit = (MaxSMP - CurrentSMP) × TeslaBatteryCapacity × 0.95
 */
export function ProfitSimulator({
  maxSMP,
  currentSMP,
  batteryCapacity,
  efficiency = 0.95,
}: ProfitSimulatorProps) {
  // Calculate daily profit using formula
  const dailyProfit = (maxSMP - currentSMP) * batteryCapacity * efficiency;
  const monthlyProfit = dailyProfit * 30;
  const yearlyProfit = dailyProfit * 365;

  // Profit per kWh
  const profitPerKwh = maxSMP - currentSMP;
  const isProfitable = dailyProfit > 0;

  return (
    <GlassCard
      title="Profit Simulator"
      icon="💰"
      style={{
        background: isProfitable
          ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(59, 130, 246, 0.1))'
          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(249, 115, 22, 0.1))',
      }}
    >
      {/* Formula Display */}
      <div
        style={{
          padding: '12px',
          backgroundColor: 'rgba(0,0,0,0.03)',
          borderRadius: '8px',
          marginBottom: '16px',
          fontFamily: 'monospace',
          fontSize: '11px',
          color: COLORS.textMuted,
        }}
      >
        <div>DailyProfit = (MaxSMP - CurrentSMP) × Capacity × η</div>
        <div style={{ marginTop: '4px', color: COLORS.text }}>
          = ({maxSMP} - {currentSMP}) × {batteryCapacity} × {efficiency}
        </div>
      </div>

      {/* Input Values */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
        <div style={{ textAlign: 'center', padding: '8px', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
          <div style={{ fontSize: '10px', color: COLORS.textMuted }}>MAX SMP</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: COLORS.danger }}>
            ₩<RollingNumber value={maxSMP} decimals={1} />
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '8px', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
          <div style={{ fontSize: '10px', color: COLORS.textMuted }}>CURRENT SMP</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: COLORS.accent }}>
            ₩<RollingNumber value={currentSMP} decimals={1} />
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '8px', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
          <div style={{ fontSize: '10px', color: COLORS.textMuted }}>CAPACITY</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: COLORS.purple }}>
            <RollingNumber value={batteryCapacity} /> kWh
          </div>
        </div>
      </div>

      {/* Profit Results */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <div
          style={{
            textAlign: 'center',
            padding: '12px',
            backgroundColor: isProfitable ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderRadius: '12px',
            border: `1px solid ${isProfitable ? COLORS.success : COLORS.danger}20`,
          }}
        >
          <div style={{ fontSize: '10px', color: COLORS.textMuted, marginBottom: '4px' }}>DAILY</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: isProfitable ? COLORS.success : COLORS.danger }}>
            <RollingNumber value={dailyProfit} prefix="₩" decimals={0} />
          </div>
        </div>
        <div
          style={{
            textAlign: 'center',
            padding: '12px',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '12px',
          }}
        >
          <div style={{ fontSize: '10px', color: COLORS.textMuted, marginBottom: '4px' }}>MONTHLY</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: COLORS.accent }}>
            <RollingNumber value={monthlyProfit} prefix="₩" decimals={0} />
          </div>
        </div>
        <div
          style={{
            textAlign: 'center',
            padding: '12px',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderRadius: '12px',
          }}
        >
          <div style={{ fontSize: '10px', color: COLORS.textMuted, marginBottom: '4px' }}>YEARLY</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: COLORS.purple }}>
            <RollingNumber value={yearlyProfit} prefix="₩" decimals={0} />
          </div>
        </div>
      </div>

      {/* Efficiency Note */}
      <div
        style={{
          marginTop: '12px',
          fontSize: '10px',
          color: COLORS.textMuted,
          textAlign: 'center',
        }}
      >
        Efficiency Factor: {(efficiency * 100).toFixed(0)}% | Profit/kWh: ₩{profitPerKwh.toFixed(1)}
      </div>
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPTIME INDICATOR
// ═══════════════════════════════════════════════════════════════════════════════

interface UptimeIndicatorProps {
  totalTime: number;
  downTime: number;
  label?: string;
}

export function UptimeIndicator({ totalTime, downTime, label = 'System Uptime' }: UptimeIndicatorProps) {
  const uptimePercent = totalTime > 0 ? ((totalTime - downTime) / totalTime) * 100 : 0;

  let statusColor = COLORS.success;
  let statusText = 'Excellent';
  if (uptimePercent < 99.9) {
    statusColor = COLORS.warning;
    statusText = 'Good';
  }
  if (uptimePercent < 99) {
    statusColor = COLORS.danger;
    statusText = 'Degraded';
  }

  return (
    <GlassCard style={{ borderLeft: `4px solid ${statusColor}` }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            color: COLORS.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: '10px',
            color: statusColor,
            fontWeight: 600,
            padding: '2px 8px',
            backgroundColor: `${statusColor}20`,
            borderRadius: '4px',
          }}
        >
          {statusText}
        </span>
      </div>

      <div
        style={{
          fontSize: '32px',
          fontWeight: 700,
          color: COLORS.text,
          fontFamily: 'monospace',
          marginBottom: '8px',
        }}
      >
        <RollingNumber value={uptimePercent} decimals={2} suffix="%" />
      </div>

      <div
        style={{
          height: '4px',
          backgroundColor: '#E5E5E5',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.min(uptimePercent, 100)}%`,
            backgroundColor: statusColor,
            borderRadius: '2px',
            transition: 'width 0.8s ease',
          }}
        />
      </div>

      <div
        style={{
          marginTop: '8px',
          fontSize: '10px',
          color: COLORS.textMuted,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>Total: {formatDuration(totalTime)}</span>
        <span>Downtime: {formatDuration(downTime)}</span>
      </div>
    </GlassCard>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// KAUS WALLET DISPLAY
// ═══════════════════════════════════════════════════════════════════════════════

interface KausWalletProps {
  kwhStored: number;
  kausBalance: number;
  usdValue: number;
  exchangeRate?: number;
}

export function KausWallet({ kwhStored, kausBalance, usdValue, exchangeRate = 10 }: KausWalletProps) {
  return (
    <GlassCard
      style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15))',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFF',
            fontSize: '14px',
            fontWeight: 700,
          }}
        >
          K
        </div>
        <span style={{ fontSize: '14px', fontWeight: 600, color: COLORS.text }}>
          Kaus Energy Wallet
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '10px', color: COLORS.textMuted, marginBottom: '4px' }}>
            ENERGY STORED
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: COLORS.text }}>
            <RollingNumber value={kwhStored} suffix=" kWh" />
          </div>
        </div>
        <div>
          <div style={{ fontSize: '10px', color: COLORS.textMuted, marginBottom: '4px' }}>
            KAUS BALANCE
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#3B82F6' }}>
            <RollingNumber value={kausBalance} suffix=" KAUS" />
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '11px', color: COLORS.textMuted }}>
          Rate: 1 kWh = {exchangeRate} KAUS
        </span>
        <span style={{ fontSize: '14px', fontWeight: 600, color: COLORS.success }}>
          ≈ $<RollingNumber value={usdValue} decimals={2} />
        </span>
      </div>
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  GlassCard,
  GlassStat,
  UptimeIndicator,
  KausWallet,
  RollingNumber,
  ProfitSimulator,
  COLORS,
  GLASS_STYLE,
};
