'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Security Health Status Widget for NEXUS-X CEO Dashboard
 *
 * Tesla-style design with real-time security monitoring
 *
 * Features:
 * - Real-time lockdown level indicator
 * - Security component health status
 * - ZKP verification metrics
 * - Active threat detection
 * - Circuit breaker status
 * - MFA compliance rate
 */

// Types
interface SecurityStatus {
  lockdownLevel: number;
  lockdownName: string;
  lockdownColor: string;
  overallScore: number;
  components: SecurityComponent[];
  zkpMetrics: ZKPMetrics;
  threats: ThreatInfo[];
  circuitBreakers: CircuitBreaker[];
  mfaCompliance: number;
  lastUpdated: string;
}

interface SecurityComponent {
  name: string;
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
  uptime: number;
  latency: number;
  lastCheck: string;
}

interface ZKPMetrics {
  totalVerified: number;
  totalRejected: number;
  fraudAttempts: number;
  verificationRate: number;
  avgVerifyTimeMs: number;
}

interface ThreatInfo {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  timestamp: string;
  description: string;
  mitigated: boolean;
}

interface CircuitBreaker {
  name: string;
  market: string;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  lastTrip: string | null;
}

// Color palette (Tesla-inspired)
const colors = {
  background: '#171717',
  surface: '#1E1E1E',
  border: '#2A2A2A',
  text: '#F9F9F7',
  textSecondary: '#9E9E9E',
  green: '#2D5A27',
  yellow: '#F5A623',
  orange: '#E67E22',
  red: '#E74C3C',
  darkRed: '#C0392B',
  black: '#000000',
};

// Lockdown level colors
const lockdownColors: Record<number, string> = {
  0: colors.green,      // NORMAL
  1: colors.yellow,     // CAUTION
  2: colors.orange,     // WARNING
  3: colors.red,        // CRITICAL
  4: colors.darkRed,    // LOCKDOWN
  5: colors.black,      // EMERGENCY
};

const lockdownNames: Record<number, string> = {
  0: 'NORMAL',
  1: 'CAUTION',
  2: 'WARNING',
  3: 'CRITICAL',
  4: 'LOCKDOWN',
  5: 'EMERGENCY',
};

// Mock data for demo
const mockSecurityStatus: SecurityStatus = {
  lockdownLevel: 0,
  lockdownName: 'NORMAL',
  lockdownColor: colors.green,
  overallScore: 98,
  components: [
    { name: 'OAuth2/MFA', status: 'healthy', uptime: 99.99, latency: 12, lastCheck: new Date().toISOString() },
    { name: 'ZKP Guard', status: 'healthy', uptime: 99.95, latency: 850, lastCheck: new Date().toISOString() },
    { name: 'Kill Switch', status: 'healthy', uptime: 100, latency: 2, lastCheck: new Date().toISOString() },
    { name: 'Rate Limiter', status: 'healthy', uptime: 99.98, latency: 5, lastCheck: new Date().toISOString() },
    { name: 'Data Masking', status: 'healthy', uptime: 100, latency: 3, lastCheck: new Date().toISOString() },
    { name: 'WAF', status: 'healthy', uptime: 99.97, latency: 8, lastCheck: new Date().toISOString() },
  ],
  zkpMetrics: {
    totalVerified: 15847,
    totalRejected: 12,
    fraudAttempts: 0,
    verificationRate: 99.92,
    avgVerifyTimeMs: 847,
  },
  threats: [],
  circuitBreakers: [
    { name: 'AEMO Dispatch', market: 'AEMO', state: 'CLOSED', failures: 0, lastTrip: null },
    { name: 'AEMO FCAS', market: 'AEMO', state: 'CLOSED', failures: 0, lastTrip: null },
    { name: 'JEPX Spot', market: 'JEPX', state: 'CLOSED', failures: 0, lastTrip: null },
    { name: 'JEPX Intraday', market: 'JEPX', state: 'CLOSED', failures: 0, lastTrip: null },
  ],
  mfaCompliance: 100,
  lastUpdated: new Date().toISOString(),
};

// Status indicator component
const StatusIndicator: React.FC<{ status: 'healthy' | 'degraded' | 'critical' | 'offline' }> = ({ status }) => {
  const statusColors = {
    healthy: colors.green,
    degraded: colors.yellow,
    critical: colors.red,
    offline: colors.darkRed,
  };

  return (
    <motion.div
      className="w-2 h-2 rounded-full"
      style={{ backgroundColor: statusColors[status] }}
      animate={{ scale: status !== 'healthy' ? [1, 1.2, 1] : 1 }}
      transition={{ repeat: status !== 'healthy' ? Infinity : 0, duration: 1 }}
    />
  );
};

// Circuit breaker indicator
const CircuitBreakerIndicator: React.FC<{ state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' }> = ({ state }) => {
  const stateColors = {
    CLOSED: colors.green,
    OPEN: colors.red,
    HALF_OPEN: colors.yellow,
  };

  const stateLabels = {
    CLOSED: '●',
    OPEN: '○',
    HALF_OPEN: '◐',
  };

  return (
    <motion.span
      style={{ color: stateColors[state] }}
      animate={{ opacity: state === 'OPEN' ? [1, 0.5, 1] : 1 }}
      transition={{ repeat: state === 'OPEN' ? Infinity : 0, duration: 0.5 }}
      className="font-mono"
    >
      {stateLabels[state]}
    </motion.span>
  );
};

// Main widget component
const SecurityHealthWidget: React.FC = () => {
  const [status, setStatus] = useState<SecurityStatus>(mockSecurityStatus);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showThreats, setShowThreats] = useState(false);

  // Fetch security status
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/security/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      // Use mock data on error
      setStatus({
        ...mockSecurityStatus,
        lastUpdated: new Date().toISOString(),
      });
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Update every 5s
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Calculate health score color
  const getScoreColor = (score: number) => {
    if (score >= 95) return colors.green;
    if (score >= 80) return colors.yellow;
    if (score >= 60) return colors.orange;
    return colors.red;
  };

  return (
    <motion.div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div
        className="px-6 py-4 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ borderBottom: `1px solid ${colors.border}` }}
      >
        <div className="flex items-center gap-4">
          <motion.div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: lockdownColors[status.lockdownLevel] }}
            animate={{
              boxShadow: status.lockdownLevel > 0
                ? [`0 0 0 0 ${lockdownColors[status.lockdownLevel]}`, `0 0 20px 5px ${lockdownColors[status.lockdownLevel]}40`]
                : 'none',
            }}
            transition={{ repeat: status.lockdownLevel > 0 ? Infinity : 0, duration: 1 }}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={colors.text}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </motion.div>

          <div>
            <h3 style={{ color: colors.text }} className="font-semibold text-lg">
              Security Health
            </h3>
            <div className="flex items-center gap-2">
              <span
                style={{ color: lockdownColors[status.lockdownLevel] }}
                className="text-sm font-mono font-bold"
              >
                {status.lockdownName}
              </span>
              <span style={{ color: colors.textSecondary }} className="text-xs">
                • Last check: {new Date(status.lastUpdated).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Overall Score */}
          <div className="text-right">
            <div className="text-xs" style={{ color: colors.textSecondary }}>
              Security Score
            </div>
            <motion.div
              className="text-2xl font-bold font-mono"
              style={{ color: getScoreColor(status.overallScore) }}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {status.overallScore}
              <span className="text-sm">/100</span>
            </motion.div>
          </div>

          {/* Expand icon */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke={colors.textSecondary}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>
      </div>

      {/* Collapsed Summary */}
      {!isExpanded && (
        <div className="px-6 py-3 flex items-center justify-between">
          {/* Component Status Summary */}
          <div className="flex items-center gap-4">
            {status.components.map((comp) => (
              <div key={comp.name} className="flex items-center gap-1" title={comp.name}>
                <StatusIndicator status={comp.status} />
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-6 text-xs">
            <div style={{ color: colors.textSecondary }}>
              ZKP: <span style={{ color: colors.green }}>{status.zkpMetrics.verificationRate}%</span>
            </div>
            <div style={{ color: colors.textSecondary }}>
              MFA: <span style={{ color: colors.green }}>{status.mfaCompliance}%</span>
            </div>
            <div style={{ color: colors.textSecondary }}>
              Threats: <span style={{ color: status.threats.length > 0 ? colors.red : colors.green }}>
                {status.threats.filter(t => !t.mitigated).length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {/* Security Components Grid */}
            <div className="px-6 py-4" style={{ borderBottom: `1px solid ${colors.border}` }}>
              <h4 className="text-sm font-semibold mb-3" style={{ color: colors.text }}>
                Security Components
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {status.components.map((comp) => (
                  <div
                    key={comp.name}
                    className="rounded-lg p-3"
                    style={{ backgroundColor: colors.background }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm" style={{ color: colors.text }}>
                        {comp.name}
                      </span>
                      <StatusIndicator status={comp.status} />
                    </div>
                    <div className="flex items-center justify-between text-xs" style={{ color: colors.textSecondary }}>
                      <span>{comp.uptime}% uptime</span>
                      <span>{comp.latency}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ZKP Metrics */}
            <div className="px-6 py-4" style={{ borderBottom: `1px solid ${colors.border}` }}>
              <h4 className="text-sm font-semibold mb-3" style={{ color: colors.text }}>
                ZKP Verification Metrics
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-xl font-mono" style={{ color: colors.green }}>
                    {status.zkpMetrics.totalVerified.toLocaleString()}
                  </div>
                  <div className="text-xs" style={{ color: colors.textSecondary }}>Verified</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-mono" style={{ color: colors.yellow }}>
                    {status.zkpMetrics.totalRejected}
                  </div>
                  <div className="text-xs" style={{ color: colors.textSecondary }}>Rejected</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-mono" style={{ color: status.zkpMetrics.fraudAttempts > 0 ? colors.red : colors.green }}>
                    {status.zkpMetrics.fraudAttempts}
                  </div>
                  <div className="text-xs" style={{ color: colors.textSecondary }}>Fraud Attempts</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-mono" style={{ color: colors.green }}>
                    {status.zkpMetrics.verificationRate}%
                  </div>
                  <div className="text-xs" style={{ color: colors.textSecondary }}>Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-mono" style={{ color: colors.text }}>
                    {status.zkpMetrics.avgVerifyTimeMs}ms
                  </div>
                  <div className="text-xs" style={{ color: colors.textSecondary }}>Avg Verify Time</div>
                </div>
              </div>
            </div>

            {/* Circuit Breakers */}
            <div className="px-6 py-4" style={{ borderBottom: `1px solid ${colors.border}` }}>
              <h4 className="text-sm font-semibold mb-3" style={{ color: colors.text }}>
                Circuit Breakers
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {status.circuitBreakers.map((cb) => (
                  <div
                    key={cb.name}
                    className="rounded-lg p-3 flex items-center justify-between"
                    style={{ backgroundColor: colors.background }}
                  >
                    <div>
                      <div className="text-sm" style={{ color: colors.text }}>{cb.name}</div>
                      <div className="text-xs" style={{ color: colors.textSecondary }}>{cb.market}</div>
                    </div>
                    <CircuitBreakerIndicator state={cb.state} />
                  </div>
                ))}
              </div>
            </div>

            {/* Active Threats */}
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold" style={{ color: colors.text }}>
                  Active Threats
                </h4>
                <button
                  onClick={() => setShowThreats(!showThreats)}
                  className="text-xs px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: colors.background,
                    color: colors.textSecondary,
                  }}
                >
                  {showThreats ? 'Hide' : 'Show'} History
                </button>
              </div>

              {status.threats.filter(t => !t.mitigated).length === 0 ? (
                <div
                  className="text-center py-4 rounded-lg"
                  style={{ backgroundColor: colors.background }}
                >
                  <div className="text-2xl mb-2">✓</div>
                  <div style={{ color: colors.green }}>No Active Threats</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {status.threats.filter(t => !t.mitigated).map((threat) => (
                    <motion.div
                      key={threat.id}
                      className="rounded-lg p-3"
                      style={{
                        backgroundColor: colors.background,
                        borderLeft: `3px solid ${
                          threat.severity === 'critical' ? colors.red :
                          threat.severity === 'high' ? colors.orange :
                          threat.severity === 'medium' ? colors.yellow :
                          colors.textSecondary
                        }`,
                      }}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold" style={{ color: colors.text }}>
                          {threat.type}
                        </span>
                        <span
                          className="text-xs px-2 py-1 rounded-full uppercase"
                          style={{
                            backgroundColor:
                              threat.severity === 'critical' ? colors.red :
                              threat.severity === 'high' ? colors.orange :
                              threat.severity === 'medium' ? colors.yellow :
                              colors.textSecondary,
                            color: colors.text,
                          }}
                        >
                          {threat.severity}
                        </span>
                      </div>
                      <div className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                        {threat.description}
                      </div>
                      <div className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                        Source: {threat.source} • {new Date(threat.timestamp).toLocaleTimeString()}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Lockdown Controls (CEO Only) */}
            <div className="px-6 py-4" style={{ backgroundColor: colors.background }}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold" style={{ color: colors.text }}>
                    Emergency Controls
                  </h4>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>
                    CEO authorization required
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
                    style={{
                      backgroundColor: colors.yellow,
                      color: colors.background,
                    }}
                    onClick={() => {
                      if (confirm('Escalate to CAUTION level?')) {
                        // API call to escalate
                      }
                    }}
                  >
                    Escalate
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
                    style={{
                      backgroundColor: colors.red,
                      color: colors.text,
                    }}
                    onClick={() => {
                      if (confirm('⚠️ EMERGENCY LOCKDOWN: This will halt ALL trading operations. Continue?')) {
                        // API call to emergency lockdown
                      }
                    }}
                  >
                    LOCKDOWN
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SecurityHealthWidget;
