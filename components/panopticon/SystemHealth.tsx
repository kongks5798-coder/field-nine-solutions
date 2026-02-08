'use client';

import { useEffect, useState } from 'react';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'offline' | 'unknown';
  lastCheck: string | null;
  responseTime?: number | null;
  processes?: Array<{
    name: string;
    status: string;
    uptime: number;
    restarts: number;
    memory: number;
    cpu: number;
  }>;
  lastCommit?: {
    hash: string;
    message: string;
    date: string;
  } | null;
}

interface HealthReport {
  status: 'operational' | 'degraded' | 'outage';
  timestamp: string;
  services: Record<string, ServiceStatus>;
  uptime: number;
  version: string;
}

const statusConfig = {
  healthy: { color: 'bg-green-500', label: 'ONLINE', textColor: 'text-green-600' },
  degraded: { color: 'bg-yellow-500', label: 'DEGRADED', textColor: 'text-yellow-600' },
  offline: { color: 'bg-red-500', label: 'OFFLINE', textColor: 'text-red-600' },
  unknown: { color: 'bg-gray-400', label: 'UNKNOWN', textColor: 'text-gray-500' },
};

const overallStatusConfig = {
  operational: { color: 'border-green-500', bg: 'bg-green-50', label: 'ALL SYSTEMS OPERATIONAL' },
  degraded: { color: 'border-yellow-500', bg: 'bg-yellow-50', label: 'PARTIAL OUTAGE' },
  outage: { color: 'border-red-500', bg: 'bg-red-50', label: 'SYSTEM OUTAGE' },
};

export default function SystemHealth() {
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/system-health', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch health status');
      const data = await res.json();
      setHealth(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '--';
    const date = new Date(isoString);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (loading) {
    return (
      <div className="border border-[#171717] p-6 bg-white shadow-[4px_4px_0px_#171717]">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 w-full"></div>
            <div className="h-3 bg-gray-200 w-full"></div>
            <div className="h-3 bg-gray-200 w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-500 p-6 bg-red-50 shadow-[4px_4px_0px_#171717]">
        <h3 className="text-xs uppercase mb-2 opacity-50">System Health</h3>
        <p className="text-red-600 font-mono text-sm">ERROR: {error}</p>
      </div>
    );
  }

  if (!health) return null;

  const overallConfig = overallStatusConfig[health.status];

  return (
    <div className={`border-2 ${overallConfig.color} p-6 ${overallConfig.bg} shadow-[4px_4px_0px_#171717]`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xs uppercase opacity-50 mb-1">System Health</h3>
          <p className="text-lg font-black tracking-tight">{overallConfig.label}</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] opacity-40 font-mono">v{health.version}</span>
          <div className="text-[10px] opacity-40 font-mono">
            {formatTime(health.timestamp)}
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {Object.entries(health.services).map(([key, service]) => {
          const config = statusConfig[service.status];
          return (
            <div
              key={key}
              className="border border-[#171717] bg-white p-3 relative"
            >
              {/* Status Indicator */}
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${config.color} animate-pulse`}></div>
                <span className={`text-[10px] font-bold ${config.textColor}`}>
                  {config.label}
                </span>
              </div>

              {/* Service Name */}
              <div className="text-xs font-bold truncate">{service.name}</div>

              {/* Response Time */}
              {service.responseTime !== undefined && service.responseTime !== null && (
                <div className="text-[10px] opacity-50 mt-1">
                  {service.responseTime}ms
                </div>
              )}

              {/* Last Commit (for GitHub) */}
              {service.lastCommit && (
                <div className="text-[10px] opacity-50 mt-1 font-mono truncate">
                  {service.lastCommit.hash}
                </div>
              )}

              {/* PM2 Process Count */}
              {service.processes && service.processes.length > 0 && (
                <div className="text-[10px] opacity-50 mt-1">
                  {service.processes.filter(p => p.status === 'online').length}/{service.processes.length} running
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* PM2 Process Details */}
      {health.services.pm2?.processes && health.services.pm2.processes.length > 0 && (
        <div className="border-t border-[#171717] pt-4 mt-4">
          <h4 className="text-[10px] uppercase opacity-50 mb-2">PM2 Processes</h4>
          <div className="space-y-1">
            {health.services.pm2.processes.map((proc, idx) => (
              <div key={idx} className="flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    proc.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span>{proc.name}</span>
                </div>
                <div className="flex gap-4 opacity-50">
                  <span>CPU: {proc.cpu?.toFixed(1) || 0}%</span>
                  <span>MEM: {((proc.memory || 0) / 1024 / 1024).toFixed(1)}MB</span>
                  <span>UP: {formatUptime(Math.floor((Date.now() - (proc.uptime || 0)) / 1000))}</span>
                  <span>RST: {proc.restarts || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#171717]/20">
        <span className="text-[10px] opacity-40 font-mono">
          NEXUS AUTONOMOUS v3.0
        </span>
        <button
          onClick={fetchHealth}
          className="text-[10px] font-bold hover:opacity-70 transition-opacity"
        >
          REFRESH
        </button>
      </div>
    </div>
  );
}
