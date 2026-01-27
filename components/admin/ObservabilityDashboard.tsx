/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 60: OBSERVABILITY DASHBOARD
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Unified admin dashboard for system observability
 * Displays: Health, Cache, Rate Limiter, Circuit Breakers, Logs, Alerts
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  message?: string;
}

interface CircuitBreakerInfo {
  name: string;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  successes: number;
  lastFailure?: string;
  isHealthy: boolean;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
  hitRatePercent: string;
}

interface ObservabilityData {
  timestamp: string;
  responseTime: number;
  health: {
    status: string;
    uptime: number;
    version: string;
    checks: HealthCheck[];
    summary: {
      total: number;
      healthy: number;
      degraded: number;
      unhealthy: number;
    };
  };
  cache: CacheStats;
  security: {
    blockedIPs: number;
    blockedIPsList: Array<{ ip: string; until: number }>;
  };
  circuitBreakers: CircuitBreakerInfo[];
  summary: {
    healthyServices: number;
    degradedServices: number;
    unhealthyServices: number;
    openCircuits: number;
    halfOpenCircuits: number;
    closedCircuits: number;
    cacheHitRate: number;
    blockedIPs: number;
  };
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  service: string;
  message: string;
  context?: Record<string, unknown>;
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  source: string;
  timestamp: string;
  acknowledged: boolean;
}

// Component
export default function ObservabilityDashboard() {
  const [data, setData] = useState<ObservabilityData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'alerts' | 'circuits'>('overview');
  const [logFilter, setLogFilter] = useState({ level: 'all', service: 'all', search: '' });
  const [loading, setLoading] = useState(true);

  // Fetch observability data
  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/observability');
      if (response.ok) {
        const result = await response.json();
        setData(result);
        setIsLive(true);
      }
    } catch (error) {
      console.error('Failed to fetch observability data:', error);
      setIsLive(false);
    }
  }, []);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (logFilter.level !== 'all') params.set('level', logFilter.level);
      if (logFilter.service !== 'all') params.set('service', logFilter.service);
      if (logFilter.search) params.set('search', logFilter.search);
      params.set('limit', '50');

      const response = await fetch(`/api/admin/observability/logs?${params}`);
      if (response.ok) {
        const result = await response.json();
        setLogs(result.logs);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  }, [logFilter]);

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/observability/alerts');
      if (response.ok) {
        const result = await response.json();
        setAlerts(result.alerts);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  }, []);

  // Initial load and polling
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchData(), fetchLogs(), fetchAlerts()]);
      setLoading(false);
    };

    loadAll();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData, fetchLogs, fetchAlerts]);

  // Refetch logs when filter changes
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'CLOSED':
        return 'text-green-500';
      case 'degraded':
      case 'HALF_OPEN':
        return 'text-yellow-500';
      case 'unhealthy':
      case 'OPEN':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'CLOSED':
        return 'bg-green-500/10 border-green-500/30';
      case 'degraded':
      case 'HALF_OPEN':
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 'unhealthy':
      case 'OPEN':
        return 'bg-red-500/10 border-red-500/30';
      default:
        return 'bg-gray-500/10 border-gray-500/30';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'debug':
        return 'text-gray-400';
      case 'info':
        return 'text-blue-400';
      case 'warn':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      case 'fatal':
        return 'text-red-600';
      default:
        return 'text-gray-400';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-red-500/10 border-red-500/50 text-red-400';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/50 text-blue-400';
      default:
        return 'bg-gray-500/10 border-gray-500/50';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-white text-xl">Loading observability data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Observability Dashboard</h1>
            <p className="text-gray-400 mt-1">PHASE 60 - System Monitoring & Insights</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}
              />
              <span className="text-sm">{isLive ? 'Live' : 'Offline'}</span>
            </div>
            {data && (
              <div className="text-sm text-gray-400">
                Response: {data.responseTime}ms
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex gap-2 border-b border-gray-800">
          {(['overview', 'circuits', 'logs', 'alerts'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'alerts' && alerts.filter((a) => !a.acknowledged).length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-500 rounded-full">
                  {alerts.filter((a) => !a.acknowledged).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && data && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl border ${getStatusBg(data.health.status)}`}>
                  <div className="text-sm text-gray-400">System Status</div>
                  <div className={`text-2xl font-bold ${getStatusColor(data.health.status)}`}>
                    {data.health.status.toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {data.summary.healthyServices}/{data.health.summary.total} healthy
                  </div>
                </div>

                <div className="p-4 rounded-xl border bg-[#1A1A1A] border-gray-800">
                  <div className="text-sm text-gray-400">Cache Hit Rate</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {data.cache.hitRatePercent}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {data.cache.hits} hits / {data.cache.misses} misses
                  </div>
                </div>

                <div className="p-4 rounded-xl border bg-[#1A1A1A] border-gray-800">
                  <div className="text-sm text-gray-400">Circuit Breakers</div>
                  <div className="text-2xl font-bold">
                    <span className="text-green-400">{data.summary.closedCircuits}</span>
                    <span className="text-gray-500 text-lg"> / </span>
                    <span className="text-yellow-400">{data.summary.halfOpenCircuits}</span>
                    <span className="text-gray-500 text-lg"> / </span>
                    <span className="text-red-400">{data.summary.openCircuits}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Closed / Half-Open / Open</div>
                </div>

                <div className="p-4 rounded-xl border bg-[#1A1A1A] border-gray-800">
                  <div className="text-sm text-gray-400">Blocked IPs</div>
                  <div className={`text-2xl font-bold ${data.security.blockedIPs > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {data.security.blockedIPs}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">DDoS Protection Active</div>
                </div>
              </div>

              {/* Health Checks */}
              <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">Health Checks</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.health.checks.map((check) => (
                    <div
                      key={check.name}
                      className={`p-3 rounded-lg border ${getStatusBg(check.status)}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{check.name}</span>
                        <span className={`text-sm ${getStatusColor(check.status)}`}>
                          {check.status}
                        </span>
                      </div>
                      {check.message && (
                        <div className="text-xs text-gray-400 mt-1">{check.message}</div>
                      )}
                      {check.latency && (
                        <div className="text-xs text-gray-500 mt-1">{check.latency}ms</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* System Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-6">
                  <h2 className="text-xl font-bold mb-4">System Info</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Version</span>
                      <span>{data.health.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Uptime</span>
                      <span>{formatUptime(data.health.uptime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Check</span>
                      <span>{new Date(data.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-6">
                  <h2 className="text-xl font-bold mb-4">Cache Operations</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Hits</span>
                      <span className="text-green-400">{data.cache.hits}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Misses</span>
                      <span className="text-yellow-400">{data.cache.misses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Sets</span>
                      <span>{data.cache.sets}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Deletes</span>
                      <span>{data.cache.deletes}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Circuit Breakers Tab */}
          {activeTab === 'circuits' && data && (
            <motion.div
              key="circuits"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">Circuit Breaker States</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.circuitBreakers.map((cb) => (
                    <div
                      key={cb.name}
                      className={`p-4 rounded-xl border ${getStatusBg(cb.state)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-lg">{cb.name}</span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                            cb.state
                          )} ${getStatusBg(cb.state)}`}
                        >
                          {cb.state}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Successes</span>
                          <span className="text-green-400">{cb.successes}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Failures</span>
                          <span className="text-red-400">{cb.failures}</span>
                        </div>
                        {cb.lastFailure && (
                          <div className="text-xs text-gray-500 mt-2">
                            Last failure: {new Date(cb.lastFailure).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Filters */}
              <div className="flex flex-wrap gap-3 bg-[#1A1A1A] border border-gray-800 rounded-xl p-4">
                <select
                  value={logFilter.level}
                  onChange={(e) => setLogFilter({ ...logFilter, level: e.target.value })}
                  className="bg-[#0A0A0A] border border-gray-700 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Levels</option>
                  <option value="debug">Debug</option>
                  <option value="info">Info</option>
                  <option value="warn">Warning</option>
                  <option value="error">Error</option>
                  <option value="fatal">Fatal</option>
                </select>

                <select
                  value={logFilter.service}
                  onChange={(e) => setLogFilter({ ...logFilter, service: e.target.value })}
                  className="bg-[#0A0A0A] border border-gray-700 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Services</option>
                  <option value="api">API</option>
                  <option value="auth">Auth</option>
                  <option value="payment">Payment</option>
                  <option value="cache">Cache</option>
                  <option value="database">Database</option>
                  <option value="blockchain">Blockchain</option>
                </select>

                <input
                  type="text"
                  placeholder="Search logs..."
                  value={logFilter.search}
                  onChange={(e) => setLogFilter({ ...logFilter, search: e.target.value })}
                  className="bg-[#0A0A0A] border border-gray-700 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]"
                />

                <button
                  onClick={fetchLogs}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm transition-colors"
                >
                  Refresh
                </button>
              </div>

              {/* Log Entries */}
              <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 p-3 border-b border-gray-800 hover:bg-gray-800/30 font-mono text-sm"
                    >
                      <span className="text-gray-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${getLogLevelColor(
                          log.level
                        )}`}
                      >
                        {log.level}
                      </span>
                      <span className="text-blue-400 whitespace-nowrap">[{log.service}]</span>
                      <span className="text-gray-300 flex-1">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <motion.div
              key="alerts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {alerts.length === 0 ? (
                <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-12 text-center">
                  <div className="text-4xl mb-3">✅</div>
                  <div className="text-xl font-bold">All Systems Operational</div>
                  <div className="text-gray-400 mt-2">No active alerts at this time</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-xl border ${getAlertColor(alert.type)} ${
                        alert.acknowledged ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{alert.title}</span>
                            {alert.acknowledged && (
                              <span className="text-xs px-2 py-0.5 bg-gray-700 rounded">
                                Acknowledged
                              </span>
                            )}
                          </div>
                          <div className="text-sm mt-1">{alert.message}</div>
                          <div className="text-xs text-gray-500 mt-2">
                            {alert.source} • {new Date(alert.timestamp).toLocaleString()}
                          </div>
                        </div>
                        {!alert.acknowledged && (
                          <button
                            onClick={() => {
                              // Mark as acknowledged (would call API in production)
                              setAlerts(
                                alerts.map((a) =>
                                  a.id === alert.id ? { ...a, acknowledged: true } : a
                                )
                              );
                            }}
                            className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 rounded transition-colors"
                          >
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
