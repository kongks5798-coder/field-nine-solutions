'use client';

import React, { memo, useEffect, useState, useRef } from 'react';

/**
 * SYNC INDICATOR - Real-time Data Freshness Display
 * Phase 35: Enterprise-grade Monitoring Component
 *
 * Features:
 * - Precision timing display (12.4s ago)
 * - Live/Stale/Offline status
 * - Animated status dot
 * - Compact footer placement
 */

type SyncStatus = 'live' | 'stale' | 'offline';

interface SyncIndicatorProps {
  lastSync: Date | string | null;
  staleThreshold?: number;      // Seconds before showing "stale" (default: 60)
  offlineThreshold?: number;    // Seconds before showing "offline" (default: 300)
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<SyncStatus, { color: string; label: string }> = {
  live: {
    color: '#22C55E',
    label: 'LIVE',
  },
  stale: {
    color: '#F59E0B',
    label: 'STALE',
  },
  offline: {
    color: '#EF4444',
    label: 'OFFLINE',
  },
};

function SyncIndicatorComponent({
  lastSync,
  staleThreshold = 60,
  offlineThreshold = 300,
  showLabel = true,
  size = 'sm',
}: SyncIndicatorProps) {
  const [displayText, setDisplayText] = useState<string>('--');
  const [status, setStatus] = useState<SyncStatus>('offline');
  const animationRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!lastSync) {
      setDisplayText('--');
      setStatus('offline');
      return;
    }

    const syncTime = lastSync instanceof Date ? lastSync.getTime() : new Date(lastSync).getTime();

    if (isNaN(syncTime)) {
      setDisplayText('--');
      setStatus('offline');
      return;
    }

    const updateDisplay = () => {
      const now = Date.now();
      const diffSeconds = (now - syncTime) / 1000;

      // Determine status
      let newStatus: SyncStatus = 'live';
      if (diffSeconds >= offlineThreshold) {
        newStatus = 'offline';
      } else if (diffSeconds >= staleThreshold) {
        newStatus = 'stale';
      }
      setStatus(newStatus);

      // Format display text with precision
      let text: string;
      if (diffSeconds < 60) {
        text = `${diffSeconds.toFixed(1)}s ago`;
      } else if (diffSeconds < 3600) {
        const mins = Math.floor(diffSeconds / 60);
        const secs = Math.floor(diffSeconds % 60);
        text = `${mins}m ${secs}s ago`;
      } else if (diffSeconds < 86400) {
        const hours = Math.floor(diffSeconds / 3600);
        const mins = Math.floor((diffSeconds % 3600) / 60);
        text = `${hours}h ${mins}m ago`;
      } else {
        const days = Math.floor(diffSeconds / 86400);
        text = `${days}d ago`;
      }

      setDisplayText(text);
      lastUpdateRef.current = now;

      // Continue animation
      animationRef.current = requestAnimationFrame(updateDisplay);
    };

    // Start animation loop (updates every frame for smooth timing)
    animationRef.current = requestAnimationFrame(updateDisplay);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [lastSync, staleThreshold, offlineThreshold]);

  const config = STATUS_CONFIG[status];
  const dotSize = size === 'sm' ? 6 : 8;
  const fontSize = size === 'sm' ? 10 : 12;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size === 'sm' ? '6px' : '8px',
      }}
    >
      {/* Status dot */}
      <div
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          backgroundColor: config.color,
          boxShadow: status === 'live' ? `0 0 ${dotSize}px ${config.color}` : 'none',
          animation: status === 'live' ? 'syncPulse 2s ease-in-out infinite' : 'none',
        }}
      />

      {/* Text */}
      <span
        style={{
          fontSize,
          color: status === 'live' ? '#525252' : config.color,
          fontFamily: 'monospace',
          letterSpacing: '0.3px',
        }}
      >
        {showLabel && (
          <span style={{ marginRight: '4px', color: '#404040' }}>
            Last synced:
          </span>
        )}
        {displayText}
      </span>

      <style>{`
        @keyframes syncPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}

export const SyncIndicator = memo(SyncIndicatorComponent);

// Compact version for tight spaces
export const CompactSyncIndicator = memo(function CompactSyncIndicator({
  lastSync,
  staleThreshold = 60,
  offlineThreshold = 300,
}: Omit<SyncIndicatorProps, 'showLabel' | 'size'>) {
  const [diffSeconds, setDiffSeconds] = useState<number>(0);
  const [status, setStatus] = useState<SyncStatus>('offline');

  useEffect(() => {
    if (!lastSync) {
      setStatus('offline');
      return;
    }

    const syncTime = lastSync instanceof Date ? lastSync.getTime() : new Date(lastSync).getTime();

    if (isNaN(syncTime)) {
      setStatus('offline');
      return;
    }

    const update = () => {
      const diff = (Date.now() - syncTime) / 1000;
      setDiffSeconds(diff);

      if (diff >= offlineThreshold) setStatus('offline');
      else if (diff >= staleThreshold) setStatus('stale');
      else setStatus('live');
    };

    update();
    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, [lastSync, staleThreshold, offlineThreshold]);

  const config = STATUS_CONFIG[status];

  // Format compact
  let text: string;
  if (diffSeconds < 60) {
    text = `${diffSeconds.toFixed(1)}s`;
  } else if (diffSeconds < 3600) {
    text = `${Math.floor(diffSeconds / 60)}m`;
  } else {
    text = `${Math.floor(diffSeconds / 3600)}h`;
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '9px',
        color: config.color,
        fontFamily: 'monospace',
      }}
      title={`Last synced: ${text} ago`}
    >
      <span
        style={{
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          backgroundColor: config.color,
        }}
      />
      {text}
    </span>
  );
});

export default SyncIndicator;
