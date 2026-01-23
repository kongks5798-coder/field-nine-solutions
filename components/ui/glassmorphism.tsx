'use client';

/**
 * GLASSMORPHISM UI COMPONENTS
 * Phase 33: Tesla Minimalism Design System
 *
 * Color Palette:
 * - Background: #F9F9F7 (Warm Ivory)
 * - Text: #171717 (Deep Black)
 * - Accent: #3B82F6 (Field Nine Blue)
 * - Glass: rgba(255, 255, 255, 0.7) with backdrop blur
 */

import React from 'react';

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
// GLASS CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface GlassCardProps {
  children: React.ReactNode;
  title?: string;
  icon?: string;
  style?: React.CSSProperties;
  className?: string;
}

export function GlassCard({ children, title, icon, style }: GlassCardProps) {
  return (
    <div
      style={{
        ...GLASS_STYLE,
        borderRadius: '16px',
        padding: '20px',
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
// GLASS STAT CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface GlassStatProps {
  label: string;
  value: string | number;
  icon?: string;
  trend?: number;
  suffix?: string;
  color?: string;
}

export function GlassStat({ label, value, icon, trend, suffix, color }: GlassStatProps) {
  const trendColor = trend && trend > 0 ? COLORS.success : trend && trend < 0 ? COLORS.danger : COLORS.textMuted;

  return (
    <div
      style={{
        ...GLASS_STYLE,
        borderRadius: '12px',
        padding: '16px',
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
        {value}
        {suffix && (
          <span style={{ fontSize: '12px', fontWeight: 400, marginLeft: '4px' }}>
            {suffix}
          </span>
        )}
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
          <span>{Math.abs(trend)}% vs yesterday</span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPTIME INDICATOR
// ═══════════════════════════════════════════════════════════════════════════════

interface UptimeIndicatorProps {
  totalTime: number;      // in seconds
  downTime: number;       // in seconds
  label?: string;
}

/**
 * Uptime% = (TotalTime - DownTime) / TotalTime × 100
 */
export function UptimeIndicator({ totalTime, downTime, label = 'System Uptime' }: UptimeIndicatorProps) {
  // Calculate uptime percentage: (TotalTime - DownTime) / TotalTime × 100
  const uptimePercent = totalTime > 0 ? ((totalTime - downTime) / totalTime) * 100 : 0;
  const formattedUptime = uptimePercent.toFixed(2);

  // Color based on uptime level
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
    <div
      style={{
        ...GLASS_STYLE,
        borderRadius: '12px',
        padding: '16px',
        borderLeft: `4px solid ${statusColor}`,
      }}
    >
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

      {/* Uptime Percentage */}
      <div
        style={{
          fontSize: '32px',
          fontWeight: 700,
          color: COLORS.text,
          fontFamily: 'monospace',
          marginBottom: '8px',
        }}
      >
        {formattedUptime}
        <span style={{ fontSize: '16px', fontWeight: 400 }}>%</span>
      </div>

      {/* Progress Bar */}
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
            transition: 'width 0.5s ease',
          }}
        />
      </div>

      {/* Details */}
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
    </div>
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
  exchangeRate?: number;  // Kaus per kWh (default: 10)
}

export function KausWallet({ kwhStored, kausBalance, usdValue, exchangeRate = 10 }: KausWalletProps) {
  return (
    <div
      style={{
        ...GLASS_STYLE,
        borderRadius: '16px',
        padding: '20px',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
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
        <span
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: COLORS.text,
          }}
        >
          Kaus Energy Wallet
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '10px', color: COLORS.textMuted, marginBottom: '4px' }}>
            ENERGY STORED
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: COLORS.text }}>
            {kwhStored.toLocaleString()} <span style={{ fontSize: '12px' }}>kWh</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '10px', color: COLORS.textMuted, marginBottom: '4px' }}>
            KAUS BALANCE
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#3B82F6' }}>
            {kausBalance.toLocaleString()} <span style={{ fontSize: '12px' }}>KAUS</span>
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
          ≈ ${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
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
  COLORS,
  GLASS_STYLE,
};
