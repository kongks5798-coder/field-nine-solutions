/**
 * K-UNIVERSAL Operations War Room (i18n)
 * Real-time monitoring dashboard for live system health
 */

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface SystemMetrics {
  timestamp: string;
  activeUsers: number;
  kycCompletions: number;
  ocrSuccessRate: number;
  walletActivations: number;
  errorRate: number;
  avgResponseTime: number;
  uptime: number;
}

interface Alert {
  id: string;
  level: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
}

export default function OpsWarRoom() {
  const t = useTranslations('admin');
  const [metrics, setMetrics] = useState<SystemMetrics>({
    timestamp: new Date().toISOString(),
    activeUsers: 0,
    kycCompletions: 0,
    ocrSuccessRate: 99.2,
    walletActivations: 0,
    errorRate: 0.08,
    avgResponseTime: 145,
    uptime: 99.98,
  });

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLive, setIsLive] = useState(false);

  // Fetch real-time metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/admin/metrics');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
          setIsLive(true);

          // Check for critical alerts
          if (data.ocrSuccessRate < 95) {
            addAlert('critical', `${t('alerts.ocrLow')}: ${data.ocrSuccessRate.toFixed(1)}%`);
          }
          if (data.errorRate > 1) {
            addAlert('critical', `${t('alerts.errorHigh')}: ${data.errorRate.toFixed(2)}%`);
          }
          if (data.avgResponseTime > 3000) {
            addAlert('warning', `${t('alerts.slowResponse')}: ${data.avgResponseTime}ms`);
          }
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
        setIsLive(false);
      }
    };

    // Initial fetch
    fetchMetrics();

    // Poll every 10 seconds
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, [t]);

  const addAlert = (level: Alert['level'], message: string) => {
    const alert: Alert = {
      id: `alert-${Date.now()}`,
      level,
      message,
      timestamp: new Date().toISOString(),
    };
    setAlerts((prev) => [alert, ...prev].slice(0, 10));
  };

  const getStatusColor = (value: number, threshold: number, reverse = false) => {
    if (reverse) {
      return value < threshold ? 'text-red-500' : 'text-green-500';
    }
    return value > threshold ? 'text-green-500' : 'text-red-500';
  };

  const getAlertColor = (level: Alert['level']) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 border-red-500 text-red-900';
      case 'warning':
        return 'bg-yellow-100 border-yellow-500 text-yellow-900';
      case 'info':
        return 'bg-blue-100 border-blue-500 text-blue-900';
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">{t('title')}</h1>
            <p className="text-gray-400">{t('subtitle')}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}
              />
              <span className="text-sm">{isLive ? t('status.live') : t('status.offline')}</span>
            </div>
            <div className="text-sm text-gray-400">
              {new Date(metrics.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Critical Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Active Users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6"
          >
            <div className="text-gray-400 text-sm mb-2">{t('metrics.activeUsers')}</div>
            <div className="text-4xl font-bold text-green-500">{metrics.activeUsers}</div>
            <div className="text-xs text-gray-500 mt-2">{t('metrics.realtime')}</div>
          </motion.div>

          {/* OCR Success Rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6"
          >
            <div className="text-gray-400 text-sm mb-2">{t('metrics.ocrRate')}</div>
            <div className={`text-4xl font-bold ${getStatusColor(metrics.ocrSuccessRate, 95)}`}>
              {metrics.ocrSuccessRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-2">{t('metrics.target')}: &gt;95%</div>
          </motion.div>

          {/* Error Rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6"
          >
            <div className="text-gray-400 text-sm mb-2">{t('metrics.errorRate')}</div>
            <div className={`text-4xl font-bold ${getStatusColor(metrics.errorRate, 1, true)}`}>
              {metrics.errorRate.toFixed(2)}%
            </div>
            <div className="text-xs text-gray-500 mt-2">{t('metrics.target')}: &lt;1%</div>
          </motion.div>

          {/* Uptime */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6"
          >
            <div className="text-gray-400 text-sm mb-2">{t('metrics.uptime')}</div>
            <div className={`text-4xl font-bold ${getStatusColor(metrics.uptime, 99.9)}`}>
              {metrics.uptime.toFixed(2)}%
            </div>
            <div className="text-xs text-gray-500 mt-2">{t('metrics.last30days')}</div>
          </motion.div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* KYC Completions */}
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6">
            <div className="text-gray-400 text-sm mb-2">{t('metrics.kycCompletions')}</div>
            <div className="text-3xl font-bold">{metrics.kycCompletions}</div>
            <div className="text-xs text-gray-500 mt-2">{t('metrics.today')}</div>
          </div>

          {/* Wallet Activations */}
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6">
            <div className="text-gray-400 text-sm mb-2">{t('metrics.walletActivations')}</div>
            <div className="text-3xl font-bold">{metrics.walletActivations}</div>
            <div className="text-xs text-gray-500 mt-2">{t('metrics.today')}</div>
          </div>

          {/* Avg Response Time */}
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6">
            <div className="text-gray-400 text-sm mb-2">{t('metrics.avgResponse')}</div>
            <div
              className={`text-3xl font-bold ${getStatusColor(
                metrics.avgResponseTime,
                3000,
                true
              )}`}
            >
              {metrics.avgResponseTime}ms
            </div>
            <div className="text-xs text-gray-500 mt-2">P95</div>
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{t('alerts.title')}</h2>
            <div className="text-sm text-gray-400">{alerts.length} {t('alerts.count')}</div>
          </div>

          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">✅</div>
              <div>{t('alerts.allGood')}</div>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 rounded-xl border-l-4 ${getAlertColor(alert.level)}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{alert.message}</div>
                      <div className="text-xs opacity-70 mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setAlerts((prev) => prev.filter((a) => a.id !== alert.id))
                      }
                      className="text-sm px-3 py-1 rounded hover:bg-black/20"
                    >
                      {t('alerts.dismiss')}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-4">{t('actions.title')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl transition-colors">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm">{t('actions.analytics')}</div>
            </button>
            <button className="p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition-colors">
              <div className="text-2xl mb-2">🚨</div>
              <div className="text-sm">{t('actions.errors')}</div>
            </button>
            <button className="p-4 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-xl transition-colors">
              <div className="text-2xl mb-2">👥</div>
              <div className="text-sm">{t('actions.users')}</div>
            </button>
            <button className="p-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl transition-colors">
              <div className="text-2xl mb-2">💬</div>
              <div className="text-sm">{t('actions.feedback')}</div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 py-4">
          <div>{t('footer.version')}</div>
          <div className="mt-1">
            {t('footer.powered')} • {t('footer.since')} {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
