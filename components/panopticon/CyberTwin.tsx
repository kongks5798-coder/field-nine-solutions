'use client';

import React, { memo, useEffect, useState, useMemo } from 'react';

/**
 * THE CYBER-TWIN - Dynamic Digital Twin Visualization
 * Phase 35: Tesla Cybertruck-inspired SVG with Energy Flow Animations
 *
 * States:
 * - CHARGING: Muted Blue glow, particles flowing INTO vehicle
 * - V2G (Discharging): Amber Gold glow, energy flowing OUT
 * - IDLE: Warm Ivory breathing animation
 *
 * Design: Minimalist vector art with glassmorphism overlays
 */

export type EnergyState = 'charging' | 'v2g' | 'idle';

interface CyberTwinProps {
  state: EnergyState;
  batteryLevel: number;      // 0-100
  chargeRate?: number;       // kW
  energyFlow?: number;       // kWh being transferred
  vehicleName?: string;
  lastSync?: string;
}

// Color palette based on state
const STATE_COLORS = {
  charging: {
    primary: '#3B82F6',      // Muted Blue
    glow: 'rgba(59, 130, 246, 0.3)',
    particle: '#60A5FA',
    text: '#93C5FD',
  },
  v2g: {
    primary: '#F59E0B',      // Amber Gold
    glow: 'rgba(245, 158, 11, 0.3)',
    particle: '#FBBF24',
    text: '#FCD34D',
  },
  idle: {
    primary: '#F9F9F7',      // Warm Ivory
    glow: 'rgba(249, 249, 247, 0.15)',
    particle: '#E5E5E5',
    text: '#A3A3A3',
  },
};

// Memoized Cybertruck SVG component
const CybertruckSVG = memo(function CybertruckSVG({
  state,
  batteryLevel,
}: {
  state: EnergyState;
  batteryLevel: number;
}) {
  const colors = STATE_COLORS[state];

  return (
    <svg
      viewBox="0 0 400 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: '400px', height: 'auto' }}
    >
      <defs>
        {/* Glow filter */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Gradient for body */}
        <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2A2A2A" />
          <stop offset="50%" stopColor="#1A1A1A" />
          <stop offset="100%" stopColor="#0A0A0A" />
        </linearGradient>

        {/* Battery fill gradient */}
        <linearGradient id="batteryFill" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colors.primary} stopOpacity="0.8" />
          <stop offset="100%" stopColor={colors.primary} stopOpacity="0.4" />
        </linearGradient>

        {/* Energy flow gradient */}
        <linearGradient id="energyFlow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colors.particle} stopOpacity="0" />
          <stop offset="50%" stopColor={colors.particle} stopOpacity="1" />
          <stop offset="100%" stopColor={colors.particle} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Background glow */}
      <ellipse
        cx="200"
        cy="120"
        rx="180"
        ry="60"
        fill={colors.glow}
        style={{
          animation: state !== 'idle' ? 'pulse 2s ease-in-out infinite' : 'breathe 4s ease-in-out infinite',
        }}
      />

      {/* Ground reflection */}
      <rect x="40" y="155" width="320" height="2" rx="1" fill="#333" opacity="0.5" />

      {/* Cybertruck Body - Angular minimalist design */}
      <g filter="url(#glow)">
        {/* Main body */}
        <path
          d="M60 130 L100 70 L280 70 L340 100 L340 130 L320 150 L80 150 L60 130 Z"
          fill="url(#bodyGradient)"
          stroke="#404040"
          strokeWidth="1.5"
        />

        {/* Windshield */}
        <path
          d="M105 72 L145 72 L175 95 L105 95 Z"
          fill="#1E293B"
          opacity="0.8"
        />

        {/* Side window */}
        <path
          d="M150 72 L275 72 L300 95 L180 95 Z"
          fill="#1E293B"
          opacity="0.6"
        />

        {/* Roof line accent */}
        <line x1="100" y1="70" x2="280" y2="70" stroke={colors.primary} strokeWidth="1" opacity="0.6" />

        {/* Front wheel */}
        <circle cx="110" cy="145" r="18" fill="#0A0A0A" stroke="#333" strokeWidth="2" />
        <circle cx="110" cy="145" r="10" fill="#1A1A1A" />
        <circle cx="110" cy="145" r="4" fill="#333" />

        {/* Rear wheel */}
        <circle cx="290" cy="145" r="18" fill="#0A0A0A" stroke="#333" strokeWidth="2" />
        <circle cx="290" cy="145" r="10" fill="#1A1A1A" />
        <circle cx="290" cy="145" r="4" fill="#333" />

        {/* Headlight */}
        <rect x="62" y="120" width="8" height="6" rx="1" fill={colors.primary} opacity="0.8">
          {state !== 'idle' && (
            <animate
              attributeName="opacity"
              values="0.8;1;0.8"
              dur="1.5s"
              repeatCount="indefinite"
            />
          )}
        </rect>

        {/* Taillight */}
        <rect x="332" y="105" width="6" height="20" rx="1" fill="#EF4444" opacity="0.7" />

        {/* Charge port indicator */}
        <circle cx="75" cy="95" r="5" fill={state === 'charging' ? colors.primary : '#333'}>
          {state === 'charging' && (
            <animate
              attributeName="opacity"
              values="0.5;1;0.5"
              dur="1s"
              repeatCount="indefinite"
            />
          )}
        </circle>
      </g>

      {/* Battery indicator bar */}
      <g transform="translate(120, 160)">
        <rect x="0" y="0" width="160" height="10" rx="5" fill="#1A1A1A" stroke="#333" strokeWidth="1" />
        <rect
          x="2"
          y="2"
          width={Math.max(4, (156 * batteryLevel) / 100)}
          height="6"
          rx="3"
          fill="url(#batteryFill)"
        />
        <text x="165" y="8" fill={colors.text} fontSize="10" fontFamily="monospace">
          {batteryLevel}%
        </text>
      </g>

      {/* Energy flow particles */}
      {state === 'charging' && (
        <g>
          {[0, 1, 2, 3, 4].map((i) => (
            <circle
              key={i}
              r="3"
              fill={colors.particle}
              opacity="0.8"
            >
              <animateMotion
                dur={`${1.5 + i * 0.2}s`}
                repeatCount="indefinite"
                path="M 30 100 Q 50 90 75 95"
              />
              <animate
                attributeName="opacity"
                values="0;0.8;0.8;0"
                dur={`${1.5 + i * 0.2}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>
      )}

      {state === 'v2g' && (
        <g>
          {[0, 1, 2, 3, 4].map((i) => (
            <circle
              key={i}
              r="3"
              fill={colors.particle}
              opacity="0.8"
            >
              <animateMotion
                dur={`${1.5 + i * 0.2}s`}
                repeatCount="indefinite"
                path="M 75 95 Q 50 90 30 100"
              />
              <animate
                attributeName="opacity"
                values="0;0.8;0.8;0"
                dur={`${1.5 + i * 0.2}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        @keyframes breathe {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.2; }
        }
      `}</style>
    </svg>
  );
});

// Main CyberTwin Component
function CyberTwinComponent({
  state,
  batteryLevel,
  chargeRate = 0,
  energyFlow = 0,
  vehicleName = 'Cybertruck',
  lastSync,
}: CyberTwinProps) {
  const colors = STATE_COLORS[state];
  const [syncAgo, setSyncAgo] = useState<string>('--');

  // Calculate time since last sync
  useEffect(() => {
    if (!lastSync) {
      setSyncAgo('--');
      return;
    }

    const updateSyncTime = () => {
      const diff = (Date.now() - new Date(lastSync).getTime()) / 1000;
      if (diff < 60) {
        setSyncAgo(`${diff.toFixed(1)}s ago`);
      } else if (diff < 3600) {
        setSyncAgo(`${Math.floor(diff / 60)}m ago`);
      } else {
        setSyncAgo(`${Math.floor(diff / 3600)}h ago`);
      }
    };

    updateSyncTime();
    const interval = setInterval(updateSyncTime, 100);
    return () => clearInterval(interval);
  }, [lastSync]);

  // Memoized state label
  const stateLabel = useMemo(() => {
    switch (state) {
      case 'charging':
        return 'CHARGING';
      case 'v2g':
        return 'V2G ACTIVE';
      case 'idle':
        return 'STANDBY';
    }
  }, [state]);

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
      {/* Background energy glow */}
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          left: '-25%',
          width: '150%',
          height: '200%',
          background: `radial-gradient(circle at 50% 50%, ${colors.glow} 0%, transparent 50%)`,
          pointerEvents: 'none',
          animation: state !== 'idle' ? 'bgPulse 3s ease-in-out infinite' : 'bgBreathe 6s ease-in-out infinite',
        }}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: colors.primary,
              boxShadow: `0 0 12px ${colors.primary}`,
              animation: 'statusPulse 2s ease-in-out infinite',
            }}
          />
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#FFF' }}>
              {vehicleName}
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: colors.text, letterSpacing: '2px' }}>
              {stateLabel}
            </p>
          </div>
        </div>

        {/* Flow indicator */}
        {state !== 'idle' && (
          <div
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '8px',
              border: `1px solid ${colors.primary}40`,
            }}
          >
            <span style={{ fontSize: '12px', color: colors.text, fontFamily: 'monospace' }}>
              {state === 'charging' ? '+' : '-'}{chargeRate.toFixed(1)} kW
            </span>
          </div>
        )}
      </div>

      {/* Cybertruck Visualization */}
      <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        <CybertruckSVG state={state} batteryLevel={batteryLevel} />
      </div>

      {/* Energy flow info */}
      {energyFlow > 0 && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px 16px',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <span style={{ fontSize: '12px', color: '#666' }}>Energy Transferred</span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: colors.primary, fontFamily: 'monospace' }}>
            {energyFlow.toFixed(2)} kWh
          </span>
        </div>
      )}

      {/* Sync indicator */}
      <div
        style={{
          marginTop: '12px',
          display: 'flex',
          justifyContent: 'flex-end',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <span style={{ fontSize: '10px', color: '#525252', fontFamily: 'monospace' }}>
          Last synced: {syncAgo}
        </span>
      </div>

      <style>{`
        @keyframes bgPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        @keyframes bgBreathe {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.3; }
        }
        @keyframes statusPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

export const CyberTwin = memo(CyberTwinComponent);
export default CyberTwin;
