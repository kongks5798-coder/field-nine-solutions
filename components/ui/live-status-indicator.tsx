/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LIVE STATUS INDICATOR
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Field Nine OS - Tesla/Apple Design Language
 *
 * 실시간 데이터 연결 상태를 시각적으로 표현하는 미니멀 인디케이터
 * 사용자에게 '신뢰감'을 주는 미세한 펄스 애니메이션 포함
 *
 * Design System:
 * - Background: #F9F9F7 (Warm Ivory)
 * - Primary: #171717 (Deep Black)
 * - Live Green: #22C55E
 * - Warning Amber: #F59E0B
 * - Error Red: #EF4444
 *
 * @version 1.0.0 - Production Grade
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type ConnectionStatus = 'live' | 'connecting' | 'fallback' | 'error';

interface DataSource {
  name: string;
  status: ConnectionStatus;
  lastUpdate?: string;
  value?: string | number;
}

interface LiveStatusIndicatorProps {
  sources?: DataSource[];
  compact?: boolean;
  showDetails?: boolean;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS COLORS & LABELS
// ═══════════════════════════════════════════════════════════════════════════════

const statusConfig: Record<ConnectionStatus, { color: string; bg: string; label: string; labelKo: string }> = {
  live: {
    color: '#22C55E',
    bg: 'rgba(34, 197, 94, 0.1)',
    label: 'LIVE',
    labelKo: '실시간',
  },
  connecting: {
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.1)',
    label: 'CONNECTING',
    labelKo: '연결 중',
  },
  fallback: {
    color: '#6B7280',
    bg: 'rgba(107, 114, 128, 0.1)',
    label: 'FALLBACK',
    labelKo: '대체 데이터',
  },
  error: {
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.1)',
    label: 'ERROR',
    labelKo: '오류',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PULSE DOT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function PulseDot({ status, size = 8 }: { status: ConnectionStatus; size?: number }) {
  const config = statusConfig[status];
  const isLive = status === 'live';

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {/* Pulse ring (only for live status) */}
      {isLive && (
        <motion.div
          style={{
            position: 'absolute',
            inset: -2,
            borderRadius: '50%',
            border: `1px solid ${config.color}`,
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.8, 0, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Core dot */}
      <motion.div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: config.color,
        }}
        animate={isLive ? { scale: [1, 1.1, 1] } : {}}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPACT STATUS BADGE
// ═══════════════════════════════════════════════════════════════════════════════

export function LiveStatusBadge({
  status,
  label,
  showLabel = true,
}: {
  status: ConnectionStatus;
  label?: string;
  showLabel?: boolean;
}) {
  const config = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 20,
        backgroundColor: config.bg,
        border: `1px solid ${config.color}20`,
      }}
    >
      <PulseDot status={status} size={6} />
      {showLabel && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.05em',
            color: config.color,
            textTransform: 'uppercase',
          }}
        >
          {label || config.label}
        </span>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA SOURCE ROW
// ═══════════════════════════════════════════════════════════════════════════════

function DataSourceRow({ source }: { source: DataSource }) {
  const config = statusConfig[source.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E5E5',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <PulseDot status={source.status} />
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#171717',
              letterSpacing: '-0.01em',
            }}
          >
            {source.name}
          </div>
          {source.lastUpdate && (
            <div
              style={{
                fontSize: 11,
                color: 'rgba(23, 23, 23, 0.5)',
                marginTop: 2,
              }}
            >
              {new Date(source.lastUpdate).toLocaleTimeString('ko-KR')}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {source.value !== undefined && (
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#171717',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {source.value}
          </span>
        )}
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.05em',
            color: config.color,
            textTransform: 'uppercase',
          }}
        >
          {config.labelKo}
        </span>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function LiveStatusIndicator({
  sources = [],
  compact = false,
  showDetails = true,
  className,
}: LiveStatusIndicatorProps) {
  const [liveData, setLiveData] = useState<{
    smp?: { price: number; isLive: boolean; timestamp: string };
    tesla?: { isLive: boolean; vehicles: number };
    exchange?: { isLive: boolean };
    tvl?: { isLive: boolean };
  } | null>(null);

  // Fetch live data status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/live-data?type=status');
        if (response.ok) {
          const data = await response.json();
          setLiveData(data.data);
        }
      } catch (error) {
        console.error('[LiveStatus] Fetch error:', error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, []);

  // Build sources from live data
  const dataSources: DataSource[] = sources.length > 0 ? sources : [
    {
      name: 'KPX 전력 단가',
      status: liveData?.smp?.isLive ? 'live' : 'fallback',
      lastUpdate: liveData?.smp?.timestamp,
      value: liveData?.smp?.price ? `₩${liveData.smp.price}/kWh` : undefined,
    },
    {
      name: 'Tesla Fleet',
      status: liveData?.tesla?.isLive ? 'live' : 'fallback',
      value: liveData?.tesla?.vehicles ? `${liveData.tesla.vehicles} 대` : undefined,
    },
    {
      name: 'Exchange Rate',
      status: liveData?.exchange?.isLive ? 'live' : 'connecting',
    },
  ];

  const liveCount = dataSources.filter(s => s.status === 'live').length;
  const totalCount = dataSources.length;
  const overallStatus: ConnectionStatus =
    liveCount === totalCount ? 'live' :
    liveCount > 0 ? 'connecting' : 'fallback';

  // Compact mode - just show badge
  if (compact) {
    return (
      <LiveStatusBadge
        status={overallStatus}
        label={`${liveCount}/${totalCount} LIVE`}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        padding: 20,
        borderRadius: 12,
        backgroundColor: '#F9F9F7',
        border: '1px solid #E5E5E5',
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
          <PulseDot status={overallStatus} size={10} />
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#171717',
              letterSpacing: '-0.01em',
              margin: 0,
            }}
          >
            시스템 연결 상태
          </h3>
        </div>
        <LiveStatusBadge status={overallStatus} label={`${liveCount}/${totalCount}`} />
      </div>

      {/* Data Sources */}
      {showDetails && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <AnimatePresence>
            {dataSources.map((source, index) => (
              <DataSourceRow key={source.name} source={source} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: '1px solid #E5E5E5',
          fontSize: 11,
          color: 'rgba(23, 23, 23, 0.4)',
          textAlign: 'center',
        }}
      >
        Field Nine OS v38.0 • PLATINUM MODE
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INLINE LIVE INDICATOR (for use in headers/cards)
// ═══════════════════════════════════════════════════════════════════════════════

export function InlineLiveIndicator({
  isLive,
  label,
}: {
  isLive: boolean;
  label?: string;
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <PulseDot status={isLive ? 'live' : 'fallback'} size={6} />
      {label && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: isLive ? '#22C55E' : '#6B7280',
            letterSpacing: '0.02em',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

export default LiveStatusIndicator;
