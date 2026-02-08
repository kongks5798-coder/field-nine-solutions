/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 56: PRODUCTION HEALTH MONITOR WIDGET
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Real-time system health monitoring for admin dashboard
 * Auto-refresh every 30 seconds
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  message?: string;
  lastChecked: string;
}

interface HealthData {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  version: string;
  uptime: number;
  services: ServiceStatus[];
  metrics: {
    totalServices: number;
    healthyServices: number;
    avgLatencyMs: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS CONFIGS
// ═══════════════════════════════════════════════════════════════════════════════

const STATUS_CONFIG = {
  healthy: {
    color: '#22C55E',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    icon: '●',
    label: 'Healthy',
  },
  degraded: {
    color: '#F59E0B',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: '◐',
    label: 'Degraded',
  },
  down: {
    color: '#EF4444',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: '○',
    label: 'Down',
  },
  critical: {
    color: '#EF4444',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: '✕',
    label: 'Critical',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function ServiceRow({ service }: { service: ServiceStatus }) {
  const config = STATUS_CONFIG[service.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`
        flex items-center justify-between p-3 rounded-lg
        ${config.bg} border ${config.border}
      `}
    >
      <div className="flex items-center gap-3">
        <span
          className="text-lg"
          style={{ color: config.color }}
        >
          {config.icon}
        </span>
        <div>
          <div className="font-medium text-sm text-[#171717]">{service.name}</div>
          {service.message && (
            <div className="text-xs text-[#171717]/50">{service.message}</div>
          )}
        </div>
      </div>
      <div className="text-right">
        <div
          className="text-xs font-medium"
          style={{ color: config.color }}
        >
          {config.label}
        </div>
        <div className="text-[10px] text-[#171717]/40 tabular-nums">
          {service.latencyMs}ms
        </div>
      </div>
    </motion.div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  status = 'healthy'
}: {
  label: string;
  value: string | number;
  unit?: string;
  status?: 'healthy' | 'degraded' | 'critical';
}) {
  const config = STATUS_CONFIG[status];

  return (
    <div className={`p-3 rounded-lg ${config.bg} border ${config.border}`}>
      <div className="text-xs text-[#171717]/50 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold text-[#171717]">{value}</span>
        {unit && <span className="text-sm text-[#171717]/50">{unit}</span>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface HealthMonitorWidgetProps {
  refreshInterval?: number; // milliseconds
  compact?: boolean;
}

export function HealthMonitorWidget({
  refreshInterval = 30000,
  compact = false
}: HealthMonitorWidgetProps) {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/health/detailed');
      if (!response.ok) throw new Error('Health check failed');

      const data = await response.json();
      setHealth(data);
      setError(null);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchHealth, refreshInterval]);

  const overallStatus = health?.status || 'critical';
  const config = STATUS_CONFIG[overallStatus];

  // Compact version
  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.bg} border ${config.border}`}>
        <span style={{ color: config.color }}>{config.icon}</span>
        <span className="text-sm font-medium text-[#171717]">
          {isLoading ? 'Checking...' : `${health?.metrics?.healthyServices || 0}/${health?.metrics?.totalServices || 0} Services`}
        </span>
        <span className="text-xs" style={{ color: config.color }}>
          {config.label}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#17171710] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#17171708] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${health?.status === 'healthy' ? 'animate-pulse' : ''}`}
            style={{ backgroundColor: config.color }}
          />
          <div>
            <h3 className="font-bold text-[#171717]">System Health</h3>
            <p className="text-xs text-[#171717]/50">
              {lastRefresh
                ? `Updated ${Math.round((Date.now() - lastRefresh.getTime()) / 1000)}s ago`
                : 'Loading...'}
            </p>
          </div>
        </div>
        <button
          onClick={fetchHealth}
          disabled={isLoading}
          className="p-2 hover:bg-[#171717]/5 rounded-lg transition-colors disabled:opacity-50"
        >
          <svg
            className={`w-4 h-4 text-[#171717]/50 ${isLoading ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="px-5 py-3 bg-red-500/10 border-b border-red-500/20">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Metrics */}
      {health && (
        <div className="p-5">
          <div className="grid grid-cols-3 gap-3 mb-5">
            <MetricCard
              label="Services"
              value={`${health.metrics.healthyServices}/${health.metrics.totalServices}`}
              status={health.status}
            />
            <MetricCard
              label="Avg Latency"
              value={health.metrics.avgLatencyMs}
              unit="ms"
              status={health.metrics.avgLatencyMs > 500 ? 'degraded' : 'healthy'}
            />
            <MetricCard
              label="Status"
              value={config.label}
              status={health.status}
            />
          </div>

          {/* Services List */}
          <div className="space-y-2">
            <AnimatePresence>
              {health.services.map((service, index) => (
                <ServiceRow key={service.name} service={service} />
              ))}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-[#17171708] flex items-center justify-between text-xs text-[#171717]/40">
            <span>v{health.version}</span>
            <span>Next check in {Math.round(refreshInterval / 1000)}s</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !health && (
        <div className="p-5 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-[#171717]/5 rounded-lg animate-pulse" />
          ))}
        </div>
      )}
    </div>
  );
}

export default HealthMonitorWidget;
