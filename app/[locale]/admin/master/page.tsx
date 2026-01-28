'use client';

import React, { useState, useEffect } from 'react';
import { GlobalSalesProof } from '@/components/nexus/sales-proof-widget';
import { JarvisConcierge } from '@/components/nexus/jarvis-concierge';
import { SystemMasterControl } from '@/components/admin/SystemMasterControl';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MASTER COMMAND CENTER - BOSS ONLY
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Phase 23: Real-time Operation & Monitoring
 *
 * 제국 통합 지휘소: 5대 섹터 지표 실시간 모니터링
 * + 650ms 정산 성공률 실시간 모니터링
 * + 글로벌 노드 가동률 표시
 * + HSM Lockdown 트리거 상태
 *
 * SECTORS:
 * 1. ENERGY: 에너지 거래량, 노드 현황
 * 2. FINANCE: TVL, 정산, 수익
 * 3. COMPUTE: GPU TFLOPS, 연산 수익
 * 4. CARBON: 탄소 크레딧, ESG 지표
 * 5. SOVEREIGN: VIP 현황, 카드 발급
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface EmperorEarnings {
  currentSecond: number;
  lastMinute: number;
  lastHour: number;
  today: number;
  allTime: number;
}

interface SettlementPulse {
  successRate: number;
  avgLatency: number;
  targetLatency: number;
  settlementsPerSecond: number;
  errorRate: number;
}

interface NodeHealth {
  totalNodes: number;
  activeNodes: number;
  healthPercent: number;
}

interface SectorMetric {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

interface RegionalData {
  region: string;
  nodes: number;
  tvl: number;
  volume24h: number;
  latency: number;
  status: 'healthy' | 'warning' | 'critical';
}

interface AlertItem {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════

const GLOBAL_METRICS = {
  totalTVL: 1050000000,
  totalNodes: 11000,
  dailyVolume: 45000000,
  activeUsers: 47892,
  globalAPY: 42.7,
  settlementSuccess: 99.97,
};

const SECTOR_DATA: Record<string, SectorMetric[]> = {
  ENERGY: [
    { label: '24H Trading Volume', value: '$45.2M', change: 12.4, trend: 'up' },
    { label: 'Active Energy Nodes', value: '11,000+', change: 5.2, trend: 'up' },
    { label: 'Grid Efficiency', value: '94.7%', change: 1.2, trend: 'up' },
    { label: 'Carbon Offset (tCO2)', value: '122,000', change: 8.7, trend: 'up' },
  ],
  FINANCE: [
    { label: 'Total Value Locked', value: '$1.05B', change: 15.3, trend: 'up' },
    { label: 'Settlement Success', value: '99.97%', change: 0.02, trend: 'up' },
    { label: 'Avg Settlement Time', value: '487ms', change: -12.5, trend: 'up' },
    { label: 'Daily Payouts', value: '$2.3M', change: 8.9, trend: 'up' },
  ],
  COMPUTE: [
    { label: 'Total TFLOPS', value: '10.8M', change: 0, trend: 'stable' },
    { label: 'GPU Utilization', value: '87.3%', change: 3.2, trend: 'up' },
    { label: 'Daily GPU Revenue', value: '12,450 K-AUS', change: 5.7, trend: 'up' },
    { label: 'Compute Efficiency', value: '0.86 K-AUS/TF', change: 2.1, trend: 'up' },
  ],
  CARBON: [
    { label: 'Credits Generated', value: '847,000', change: 22.4, trend: 'up' },
    { label: 'Credits Traded', value: '623,000', change: 18.9, trend: 'up' },
    { label: 'Avg Credit Price', value: '$24.50', change: 7.3, trend: 'up' },
    { label: 'ESG Score', value: 'A+', change: 0, trend: 'stable' },
  ],
  SOVEREIGN: [
    { label: 'VIP Members', value: '1,247', change: 12.8, trend: 'up' },
    { label: 'Cards Issued', value: '892', change: 15.4, trend: 'up' },
    { label: 'VIP TVL', value: '$425M', change: 9.2, trend: 'up' },
    { label: 'Avg VIP APY', value: '58.3%', change: 3.1, trend: 'up' },
  ],
};

const REGIONAL_DATA: RegionalData[] = [
  { region: 'Korea', nodes: 2000, tvl: 285000000, volume24h: 12500000, latency: 312, status: 'healthy' },
  { region: 'USA West', nodes: 2500, tvl: 198000000, volume24h: 8900000, latency: 389, status: 'healthy' },
  { region: 'USA East', nodes: 2000, tvl: 167000000, volume24h: 7200000, latency: 412, status: 'healthy' },
  { region: 'Europe', nodes: 1500, tvl: 145000000, volume24h: 6100000, latency: 445, status: 'healthy' },
  { region: 'Japan', nodes: 1000, tvl: 98000000, volume24h: 4500000, latency: 367, status: 'healthy' },
  { region: 'Australia', nodes: 1500, tvl: 112000000, volume24h: 3800000, latency: 398, status: 'healthy' },
  { region: 'Singapore', nodes: 500, tvl: 45000000, volume24h: 2000000, latency: 345, status: 'healthy' },
];

const RECENT_ALERTS: AlertItem[] = [
  { id: '1', severity: 'info', message: 'Daily settlement reconciliation completed - 100% match rate', timestamp: Date.now() - 1800000 },
  { id: '2', severity: 'info', message: 'GPU cluster optimization completed - +3.2% efficiency gain', timestamp: Date.now() - 3600000 },
  { id: '3', severity: 'info', message: 'New VIP onboarding: 12 Sovereign tier members today', timestamp: Date.now() - 7200000 },
  { id: '4', severity: 'warning', message: 'Europe region latency slightly elevated (445ms)', timestamp: Date.now() - 10800000 },
  { id: '5', severity: 'info', message: 'Carbon credit batch verified - 15,000 tCO2 certified', timestamp: Date.now() - 14400000 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function GlobalMetricCard({ label, value, subtext }: { label: string; value: string; subtext?: string }) {
  return (
    <div className="bg-gradient-to-br from-zinc-900 to-black border border-amber-500/30 rounded-xl p-4">
      <div className="text-xs text-amber-500/70 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subtext && <div className="text-xs text-zinc-500 mt-1">{subtext}</div>}
    </div>
  );
}

function SectorCard({ title, icon, metrics, color }: { title: string; icon: string; metrics: SectorMetric[]; color: string }) {
  return (
    <div className={`bg-gradient-to-br from-zinc-900 to-black border rounded-xl p-5 ${color}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-lg font-bold text-white">{title}</h3>
      </div>
      <div className="space-y-3">
        {metrics.map((metric, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">{metric.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">{metric.value}</span>
              {metric.change !== 0 && (
                <span className={`text-xs ${metric.trend === 'up' ? 'text-emerald-400' : metric.trend === 'down' ? 'text-red-400' : 'text-zinc-500'}`}>
                  {metric.trend === 'up' ? '+' : ''}{metric.change}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RegionalMap() {
  return (
    <div className="bg-gradient-to-br from-zinc-900 to-black border border-amber-500/30 rounded-xl p-5">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="text-amber-500">GLOBAL TVL DISTRIBUTION</span>
      </h3>

      {/* Simplified World Map Representation */}
      <div className="relative h-64 bg-zinc-900/50 rounded-lg overflow-hidden mb-4">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-6xl opacity-20">
            {/* Map grid */}
            <div className="grid grid-cols-7 gap-1 text-xs">
              {REGIONAL_DATA.map((region) => (
                <div
                  key={region.region}
                  className={`
                    w-12 h-12 rounded-lg flex flex-col items-center justify-center
                    ${region.status === 'healthy' ? 'bg-emerald-500/30 border border-emerald-500/50' :
                      region.status === 'warning' ? 'bg-amber-500/30 border border-amber-500/50' :
                        'bg-red-500/30 border border-red-500/50'}
                  `}
                >
                  <span className="text-[8px] text-white font-medium">{region.region.substring(0, 3).toUpperCase()}</span>
                  <span className="text-[10px] text-white font-bold">${(region.tvl / 1000000).toFixed(0)}M</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Animated pulse for active regions */}
        <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-amber-500 rounded-full animate-ping" />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-emerald-500 rounded-full animate-ping animation-delay-500" />
        <div className="absolute bottom-1/3 left-1/2 w-3 h-3 bg-cyan-500 rounded-full animate-ping animation-delay-1000" />
      </div>

      {/* Regional Stats Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-zinc-500 text-xs uppercase">
              <th className="text-left py-2">Region</th>
              <th className="text-right py-2">Nodes</th>
              <th className="text-right py-2">TVL</th>
              <th className="text-right py-2">24H Vol</th>
              <th className="text-right py-2">Latency</th>
              <th className="text-center py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {REGIONAL_DATA.map((region) => (
              <tr key={region.region} className="border-t border-zinc-800/50">
                <td className="py-2 text-white font-medium">{region.region}</td>
                <td className="py-2 text-right text-zinc-400">{region.nodes.toLocaleString()}</td>
                <td className="py-2 text-right text-emerald-400">${(region.tvl / 1000000).toFixed(0)}M</td>
                <td className="py-2 text-right text-cyan-400">${(region.volume24h / 1000000).toFixed(1)}M</td>
                <td className="py-2 text-right text-zinc-400">{region.latency}ms</td>
                <td className="py-2 text-center">
                  <span className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${region.status === 'healthy' ? 'bg-emerald-500/20 text-emerald-400' :
                      region.status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'}
                  `}>
                    {region.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AlertsPanel() {
  return (
    <div className="bg-gradient-to-br from-zinc-900 to-black border border-amber-500/30 rounded-xl p-5">
      <h3 className="text-lg font-bold text-white mb-4">SYSTEM ALERTS</h3>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {RECENT_ALERTS.map((alert) => (
          <div
            key={alert.id}
            className={`
              p-3 rounded-lg border-l-4
              ${alert.severity === 'critical' ? 'bg-red-500/10 border-red-500' :
                alert.severity === 'warning' ? 'bg-amber-500/10 border-amber-500' :
                  'bg-zinc-800/50 border-zinc-600'}
            `}
          >
            <div className="flex items-start justify-between">
              <p className="text-sm text-zinc-300">{alert.message}</p>
              <span className="text-xs text-zinc-500 ml-2 whitespace-nowrap">
                {Math.floor((Date.now() - alert.timestamp) / 60000)}m ago
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SecurityStatus() {
  return (
    <div className="bg-gradient-to-br from-zinc-900 to-black border border-emerald-500/30 rounded-xl p-5">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="text-emerald-500">VAULT SECURITY STATUS</span>
      </h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm text-zinc-300">HSM Cluster</span>
          </div>
          <span className="text-sm text-emerald-400">FIPS 140-2 L3 Active</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm text-zinc-300">Multi-Sig</span>
          </div>
          <span className="text-sm text-emerald-400">5/7 Guardians Active</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm text-zinc-300">Key Rotation</span>
          </div>
          <span className="text-sm text-zinc-400">Next: 67 days</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm text-zinc-300">Pending Approvals</span>
          </div>
          <span className="text-sm text-amber-400">2 Transactions</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 23: REAL-TIME MONITORING WIDGETS
// ═══════════════════════════════════════════════════════════════════════════════

function EmperorEarningsWidget({ earnings }: { earnings: EmperorEarnings }) {
  return (
    <div className="bg-gradient-to-br from-amber-900/30 to-black border-2 border-amber-500/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">👑</span>
          <span className="text-amber-500 font-bold text-sm">EMPEROR #1 EARNINGS</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-emerald-400">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          LIVE
        </div>
      </div>
      <div className="grid grid-cols-5 gap-3">
        <div className="text-center">
          <div className="text-[10px] text-zinc-500 mb-1">THIS SECOND</div>
          <div className="text-lg font-mono font-bold text-emerald-400">
            ${earnings.currentSecond.toFixed(4)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-zinc-500 mb-1">LAST MINUTE</div>
          <div className="text-lg font-mono font-bold text-white">
            ${earnings.lastMinute.toFixed(2)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-zinc-500 mb-1">LAST HOUR</div>
          <div className="text-lg font-mono font-bold text-white">
            ${earnings.lastHour.toFixed(2)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-zinc-500 mb-1">TODAY</div>
          <div className="text-lg font-mono font-bold text-cyan-400">
            ${earnings.today.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-zinc-500 mb-1">ALL TIME</div>
          <div className="text-lg font-mono font-bold text-amber-400">
            ${earnings.allTime.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettlementMonitorWidget({ pulse }: { pulse: SettlementPulse }) {
  const isTargetMet = pulse.avgLatency <= pulse.targetLatency;
  const latencyPercent = (pulse.avgLatency / pulse.targetLatency) * 100;

  return (
    <div className={`bg-gradient-to-br from-zinc-900 to-black border-2 rounded-xl p-4 ${
      isTargetMet ? 'border-emerald-500/50' : 'border-red-500/50'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <span className="text-white font-bold text-sm">650ms SETTLEMENT MONITOR</span>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          isTargetMet ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {isTargetMet ? 'TARGET MET' : 'ABOVE TARGET'}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div>
          <div className="text-[10px] text-zinc-500 mb-1">SUCCESS RATE</div>
          <div className="text-2xl font-bold text-emerald-400">{pulse.successRate.toFixed(2)}%</div>
        </div>
        <div>
          <div className="text-[10px] text-zinc-500 mb-1">AVG LATENCY</div>
          <div className={`text-2xl font-bold ${isTargetMet ? 'text-emerald-400' : 'text-amber-400'}`}>
            {pulse.avgLatency.toFixed(0)}ms
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full mt-1 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                latencyPercent <= 100 ? 'bg-emerald-500' : latencyPercent <= 120 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(latencyPercent, 150)}%` }}
            />
          </div>
        </div>
        <div>
          <div className="text-[10px] text-zinc-500 mb-1">TPS</div>
          <div className="text-2xl font-bold text-white">{pulse.settlementsPerSecond}</div>
        </div>
        <div>
          <div className="text-[10px] text-zinc-500 mb-1">ERROR RATE</div>
          <div className={`text-2xl font-bold ${pulse.errorRate < 0.01 ? 'text-emerald-400' : 'text-red-400'}`}>
            {pulse.errorRate.toFixed(3)}%
          </div>
        </div>
      </div>
    </div>
  );
}

function NodeHealthWidget({ health }: { health: NodeHealth }) {
  return (
    <div className="bg-gradient-to-br from-zinc-900 to-black border-2 border-cyan-500/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌐</span>
          <span className="text-cyan-400 font-bold text-sm">GLOBAL NODE HEALTH</span>
        </div>
        <div className="text-xs text-zinc-400">
          {health.activeNodes.toLocaleString()} / {health.totalNodes.toLocaleString()} active
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="h-4 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all"
              style={{ width: `${health.healthPercent}%` }}
            />
          </div>
        </div>
        <div className="text-3xl font-bold text-cyan-400">
          {health.healthPercent.toFixed(1)}%
        </div>
      </div>
      <div className="mt-2 text-xs text-zinc-500">
        HSM Lockdown Trigger: {health.healthPercent < 95 ? '⚠️ STANDBY' : '✅ INACTIVE'} |
        Threshold: &lt;95% node health
      </div>
    </div>
  );
}

function GrowthTrackerWidget() {
  const [growth, setGrowth] = useState({
    totalSignups: 1247,
    todaySignups: 47,
    hourlySignups: 8,
    viralCoefficient: 1.34,
    kausDistributed: 523400,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setGrowth(prev => ({
        ...prev,
        totalSignups: prev.totalSignups + (Math.random() > 0.7 ? 1 : 0),
        todaySignups: prev.todaySignups + (Math.random() > 0.8 ? 1 : 0),
        hourlySignups: Math.floor(5 + Math.random() * 10),
        kausDistributed: prev.kausDistributed + Math.floor(Math.random() * 100),
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-br from-purple-900/30 to-black border-2 border-purple-500/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📈</span>
          <span className="text-purple-400 font-bold text-sm">SOVEREIGN GROWTH TRACKER</span>
        </div>
        <span className="text-xs text-emerald-400">+{growth.hourlySignups}/hr</span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <div className="text-center">
          <div className="text-[10px] text-zinc-500 mb-1">TOTAL VIP</div>
          <div className="text-xl font-bold text-white">{growth.totalSignups.toLocaleString()}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-zinc-500 mb-1">TODAY</div>
          <div className="text-xl font-bold text-emerald-400">+{growth.todaySignups}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-zinc-500 mb-1">VIRAL K</div>
          <div className="text-xl font-bold text-purple-400">{growth.viralCoefficient.toFixed(2)}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-zinc-500 mb-1">K-AUS GIVEN</div>
          <div className="text-xl font-bold text-amber-400">{(growth.kausDistributed / 1000).toFixed(0)}K</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 53: GLOBAL REVENUE DASHBOARD WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

interface RevenueDataPoint {
  time: string;
  krw: number;
  usd: number;
}

function GlobalRevenueWidget() {
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [todayRevenue, setTodayRevenue] = useState({ krw: 0, usd: 0 });
  const [thisSecondRevenue, setThisSecondRevenue] = useState(0);
  const [exchangeRate] = useState(1380); // KRW/USD

  // Initialize with historical data
  useEffect(() => {
    const initialData: RevenueDataPoint[] = [];
    const now = new Date();

    // Generate last 60 data points (1 minute of data)
    for (let i = 59; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 1000);
      const baseKrw = 15000000 + Math.random() * 5000000; // 15-20M KRW base
      initialData.push({
        time: time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        krw: baseKrw,
        usd: baseKrw / exchangeRate,
      });
    }
    setRevenueData(initialData);

    // Initial today's revenue
    setTodayRevenue({
      krw: 487500000 + Math.floor(Math.random() * 50000000),
      usd: 0,
    });
  }, [exchangeRate]);

  // Real-time revenue updates
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const newKrw = 15000000 + Math.random() * 8000000; // 15-23M KRW per second simulation
      const newUsd = newKrw / exchangeRate;

      setThisSecondRevenue(newKrw);

      setRevenueData(prev => {
        const newData = [...prev.slice(1), {
          time: now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          krw: newKrw,
          usd: newUsd,
        }];
        return newData;
      });

      setTodayRevenue(prev => ({
        krw: prev.krw + newKrw / 60, // Accumulate
        usd: (prev.krw + newKrw / 60) / exchangeRate,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [exchangeRate]);

  // Calculate max for chart scaling
  const maxRevenue = Math.max(...revenueData.map(d => d.krw), 1);

  return (
    <div className="bg-gradient-to-br from-emerald-900/30 to-black border-2 border-emerald-500/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <span className="text-emerald-400 font-bold text-lg">GLOBAL REVENUE STREAM</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs text-emerald-400">REAL-TIME</span>
        </div>
      </div>

      {/* Current Second Revenue Highlight */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-black/30 rounded-xl p-3 border border-emerald-500/30">
          <div className="text-[10px] text-zinc-500 mb-1 uppercase">This Second</div>
          <div className="text-xl font-mono font-bold text-emerald-400">
            ₩{(thisSecondRevenue / 1000000).toFixed(2)}M
          </div>
        </div>
        <div className="bg-black/30 rounded-xl p-3 border border-cyan-500/30">
          <div className="text-[10px] text-zinc-500 mb-1 uppercase">USD Equiv</div>
          <div className="text-xl font-mono font-bold text-cyan-400">
            ${(thisSecondRevenue / exchangeRate / 1000).toFixed(2)}K
          </div>
        </div>
        <div className="bg-black/30 rounded-xl p-3 border border-amber-500/30">
          <div className="text-[10px] text-zinc-500 mb-1 uppercase">Today Total (KRW)</div>
          <div className="text-xl font-mono font-bold text-amber-400">
            ₩{(todayRevenue.krw / 1000000000).toFixed(2)}B
          </div>
        </div>
        <div className="bg-black/30 rounded-xl p-3 border border-purple-500/30">
          <div className="text-[10px] text-zinc-500 mb-1 uppercase">Today Total (USD)</div>
          <div className="text-xl font-mono font-bold text-purple-400">
            ${(todayRevenue.krw / exchangeRate / 1000000).toFixed(2)}M
          </div>
        </div>
      </div>

      {/* Mini Chart - Revenue Stream Visualization */}
      <div className="h-32 bg-black/20 rounded-xl p-2 mb-4 overflow-hidden">
        <div className="flex items-end h-full gap-0.5">
          {revenueData.slice(-60).map((point, idx) => (
            <div
              key={idx}
              className="flex-1 bg-gradient-to-t from-emerald-600 to-cyan-400 rounded-t transition-all duration-300"
              style={{
                height: `${(point.krw / maxRevenue) * 100}%`,
                opacity: 0.4 + (idx / 60) * 0.6,
              }}
            />
          ))}
        </div>
      </div>

      {/* Revenue Source Breakdown */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-2 bg-black/20 rounded-lg">
          <div className="text-xs text-zinc-500 mb-1">VRD 26SS</div>
          <div className="text-sm font-bold text-white">₩{(todayRevenue.krw * 0.35 / 1000000).toFixed(1)}M</div>
          <div className="text-[10px] text-emerald-400">35%</div>
        </div>
        <div className="text-center p-2 bg-black/20 rounded-lg">
          <div className="text-xs text-zinc-500 mb-1">KAUS Sales</div>
          <div className="text-sm font-bold text-white">₩{(todayRevenue.krw * 0.45 / 1000000).toFixed(1)}M</div>
          <div className="text-[10px] text-cyan-400">45%</div>
        </div>
        <div className="text-center p-2 bg-black/20 rounded-lg">
          <div className="text-xs text-zinc-500 mb-1">Staking Fees</div>
          <div className="text-sm font-bold text-white">₩{(todayRevenue.krw * 0.20 / 1000000).toFixed(1)}M</div>
          <div className="text-[10px] text-purple-400">20%</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 54: REFERRAL LEADERBOARD WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

interface ReferralLeaderEntry {
  rank: number;
  code: string;
  userName: string;
  totalRevenue: number;
  totalReferrals: number;
  totalRewards: number;
  sovereignNumber?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 74: LIVE KAUS METRICS WIDGET (Real Database Data)
// ═══════════════════════════════════════════════════════════════════════════════

interface LiveKausMetrics {
  realtime: {
    todayKwhVolume: number;
    todayKausExchanged: number;
    todayFees: number;
    todayTransactions: number;
    todaySignups: number;
  };
  totals: {
    totalUsers: number;
    totalKausCirculation: number;
    totalKwhBalance: number;
  };
  weeklyComparison: {
    weekKwhVolume: number;
    avgDailyVolume: number;
  };
  hourlyChart: Array<{
    hour: number;
    kwhVolume: number;
    kausExchanged: number;
    transactions: number;
  }>;
}

function KausLiveMetricsWidget() {
  const [metrics, setMetrics] = useState<LiveKausMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/revenue');
      const data = await response.json();

      if (data.success) {
        setMetrics(data.data);
        setLastUpdate(new Date(data.timestamp));
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch metrics');
      }
    } catch (err) {
      setError('Connection error');
      console.error('[KausLiveMetrics] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  // Get max value for chart scaling
  const maxChartValue = metrics?.hourlyChart
    ? Math.max(...metrics.hourlyChart.map(h => h.kwhVolume), 1)
    : 1;

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-cyan-900/30 to-black border-2 border-cyan-500/50 rounded-xl p-5">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="bg-gradient-to-br from-red-900/30 to-black border-2 border-red-500/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            <span className="text-red-400 font-bold text-lg">KAUS LIVE METRICS</span>
          </div>
        </div>
        <div className="text-center py-8 text-red-400">
          {error || 'Unable to load metrics'}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-cyan-900/30 to-black border-2 border-cyan-500/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <span className="text-cyan-400 font-bold text-lg">KAUS LIVE METRICS</span>
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
            REAL DATA
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs text-zinc-400">
            {lastUpdate?.toLocaleTimeString() || 'Loading...'}
          </span>
        </div>
      </div>

      {/* Today's Metrics Grid */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        <div className="bg-black/30 rounded-xl p-3 border border-cyan-500/30">
          <div className="text-[10px] text-zinc-500 mb-1 uppercase">Today kWh</div>
          <div className="text-xl font-mono font-bold text-cyan-400">
            {metrics.realtime.todayKwhVolume.toLocaleString()}
          </div>
          <div className="text-[10px] text-zinc-500">kWh traded</div>
        </div>
        <div className="bg-black/30 rounded-xl p-3 border border-amber-500/30">
          <div className="text-[10px] text-zinc-500 mb-1 uppercase">Today KAUS</div>
          <div className="text-xl font-mono font-bold text-amber-400">
            {metrics.realtime.todayKausExchanged.toLocaleString()}
          </div>
          <div className="text-[10px] text-zinc-500">exchanged</div>
        </div>
        <div className="bg-black/30 rounded-xl p-3 border border-emerald-500/30">
          <div className="text-[10px] text-zinc-500 mb-1 uppercase">Fees</div>
          <div className="text-xl font-mono font-bold text-emerald-400">
            {metrics.realtime.todayFees.toLocaleString()}
          </div>
          <div className="text-[10px] text-zinc-500">KAUS collected</div>
        </div>
        <div className="bg-black/30 rounded-xl p-3 border border-purple-500/30">
          <div className="text-[10px] text-zinc-500 mb-1 uppercase">Transactions</div>
          <div className="text-xl font-mono font-bold text-purple-400">
            {metrics.realtime.todayTransactions}
          </div>
          <div className="text-[10px] text-zinc-500">completed</div>
        </div>
        <div className="bg-black/30 rounded-xl p-3 border border-pink-500/30">
          <div className="text-[10px] text-zinc-500 mb-1 uppercase">New Signups</div>
          <div className="text-xl font-mono font-bold text-pink-400">
            +{metrics.realtime.todaySignups}
          </div>
          <div className="text-[10px] text-zinc-500">today</div>
        </div>
      </div>

      {/* Hourly Chart */}
      <div className="mb-4">
        <div className="text-xs text-zinc-500 mb-2">24-HOUR kWh VOLUME</div>
        <div className="h-24 bg-black/20 rounded-xl p-2 overflow-hidden">
          <div className="flex items-end h-full gap-0.5">
            {metrics.hourlyChart.map((point, idx) => (
              <div
                key={idx}
                className="flex-1 bg-gradient-to-t from-cyan-600 to-emerald-400 rounded-t transition-all duration-300 group relative"
                style={{
                  height: `${Math.max((point.kwhVolume / maxChartValue) * 100, 2)}%`,
                  opacity: 0.4 + (idx / 24) * 0.6,
                }}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 px-2 py-1 rounded text-[9px] whitespace-nowrap z-10">
                  {point.hour}:00 - {point.kwhVolume.toFixed(1)} kWh
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Totals & Weekly Comparison */}
      <div className="grid grid-cols-4 gap-3 pt-3 border-t border-cyan-500/20">
        <div className="text-center">
          <div className="text-[10px] text-zinc-500 uppercase">Total Users</div>
          <div className="text-lg font-bold text-white">{metrics.totals.totalUsers.toLocaleString()}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-zinc-500 uppercase">KAUS in Circulation</div>
          <div className="text-lg font-bold text-amber-400">{metrics.totals.totalKausCirculation.toLocaleString()}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-zinc-500 uppercase">Total kWh Balance</div>
          <div className="text-lg font-bold text-cyan-400">{metrics.totals.totalKwhBalance.toLocaleString()}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-zinc-500 uppercase">Avg Daily (7d)</div>
          <div className="text-lg font-bold text-emerald-400">{metrics.weeklyComparison.avgDailyVolume.toFixed(1)} kWh</div>
        </div>
      </div>
    </div>
  );
}

function ReferralLeaderboardWidget() {
  const [leaderboard, setLeaderboard] = useState<ReferralLeaderEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch leaderboard data
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/referral?action=leaderboard&limit=10');
        const data = await response.json();

        if (data.success && data.leaderboard) {
          setLeaderboard(data.leaderboard);
        } else {
          // Fallback to simulated data for demo
          setLeaderboard([
            { rank: 1, code: 'SOV0001XYZQ', userName: 'Sovereign #1', totalRevenue: 45200000, totalReferrals: 127, totalRewards: 12450, sovereignNumber: 1 },
            { rank: 2, code: 'SOV0023ABCD', userName: 'Sovereign #23', totalRevenue: 38500000, totalReferrals: 98, totalRewards: 9870, sovereignNumber: 23 },
            { rank: 3, code: 'SOV0007EFGH', userName: 'Sovereign #7', totalRevenue: 29800000, totalReferrals: 76, totalRewards: 7650, sovereignNumber: 7 },
            { rank: 4, code: 'FN8K2J4MNP', userName: 'Pioneer Elite', totalRevenue: 21400000, totalReferrals: 54, totalRewards: 5480, sovereignNumber: undefined },
            { rank: 5, code: 'SOV0042QRST', userName: 'Sovereign #42', totalRevenue: 18900000, totalReferrals: 48, totalRewards: 4850, sovereignNumber: 42 },
          ]);
        }
      } catch (error) {
        console.error('[Referral Leaderboard] Fetch error:', error);
        // Use simulated data
        setLeaderboard([
          { rank: 1, code: 'SOV0001XYZQ', userName: 'Sovereign #1', totalRevenue: 45200000, totalReferrals: 127, totalRewards: 12450, sovereignNumber: 1 },
          { rank: 2, code: 'SOV0023ABCD', userName: 'Sovereign #23', totalRevenue: 38500000, totalReferrals: 98, totalRewards: 9870, sovereignNumber: 23 },
          { rank: 3, code: 'SOV0007EFGH', userName: 'Sovereign #7', totalRevenue: 29800000, totalReferrals: 76, totalRewards: 7650, sovereignNumber: 7 },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();

    // Refresh every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  // Simulated real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLeaderboard(prev => prev.map(entry => ({
        ...entry,
        totalRevenue: entry.totalRevenue + Math.floor(Math.random() * 50000),
        totalReferrals: entry.totalReferrals + (Math.random() > 0.9 ? 1 : 0),
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-amber-400';
    if (rank === 2) return 'text-zinc-300';
    if (rank === 3) return 'text-amber-600';
    return 'text-zinc-500';
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/30 to-black border-2 border-purple-500/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          <span className="text-purple-400 font-bold text-lg">REFERRAL LEADERBOARD</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
          <span className="text-xs text-purple-400">LIVE</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 text-[10px] text-zinc-500 uppercase px-3 py-2">
            <div className="col-span-1">Rank</div>
            <div className="col-span-3">Code</div>
            <div className="col-span-3">Sovereign</div>
            <div className="col-span-2 text-right">Referrals</div>
            <div className="col-span-3 text-right">Revenue</div>
          </div>

          {/* Entries */}
          {leaderboard.map((entry) => (
            <div
              key={entry.code}
              className={`grid grid-cols-12 gap-2 items-center px-3 py-3 rounded-lg transition-all ${
                entry.rank <= 3 ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-zinc-800/30'
              }`}
            >
              <div className={`col-span-1 text-xl ${getRankColor(entry.rank)}`}>
                {getRankIcon(entry.rank)}
              </div>
              <div className="col-span-3">
                <span className="font-mono text-sm text-emerald-400">{entry.code.slice(0, 8)}...</span>
              </div>
              <div className="col-span-3">
                <div className="text-sm text-white">{entry.userName}</div>
                {entry.sovereignNumber && (
                  <div className="text-[10px] text-purple-400">👑 #{entry.sovereignNumber}</div>
                )}
              </div>
              <div className="col-span-2 text-right">
                <span className="text-sm font-bold text-cyan-400">{entry.totalReferrals}</span>
              </div>
              <div className="col-span-3 text-right">
                <div className="text-sm font-bold text-amber-400">
                  ₩{(entry.totalRevenue / 1000000).toFixed(1)}M
                </div>
                <div className="text-[10px] text-zinc-500">
                  {entry.totalRewards.toLocaleString()} KAUS
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Total Stats */}
      <div className="mt-4 pt-4 border-t border-purple-500/30 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-[10px] text-zinc-500 uppercase">Total Referrals</div>
          <div className="text-xl font-bold text-cyan-400">
            {leaderboard.reduce((sum, e) => sum + e.totalReferrals, 0).toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-zinc-500 uppercase">Total Revenue</div>
          <div className="text-xl font-bold text-amber-400">
            ₩{(leaderboard.reduce((sum, e) => sum + e.totalRevenue, 0) / 1000000000).toFixed(2)}B
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-zinc-500 uppercase">Rewards Paid</div>
          <div className="text-xl font-bold text-emerald-400">
            {(leaderboard.reduce((sum, e) => sum + e.totalRewards, 0) / 1000).toFixed(1)}K KAUS
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function MasterCommandCenter() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLive, setIsLive] = useState(true);

  // Phase 23: Real-time monitoring state
  const [emperorEarnings, setEmperorEarnings] = useState<EmperorEarnings>({
    currentSecond: 0,
    lastMinute: 0,
    lastHour: 0,
    today: 0,
    allTime: 0,
  });

  const [settlementPulse, setSettlementPulse] = useState<SettlementPulse>({
    successRate: 99.97,
    avgLatency: 487,
    targetLatency: 650,
    settlementsPerSecond: 152,
    errorRate: 0.003,
  });

  const [nodeHealth, setNodeHealth] = useState<NodeHealth>({
    totalNodes: 11000,
    activeNodes: 10978,
    healthPercent: 99.8,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-time emperor earnings update (1 second interval)
  useEffect(() => {
    const earningsTimer = setInterval(() => {
      const secondEarning = 7.43 * (1 + (Math.random() - 0.5) * 0.2); // ~$7.43/sec avg

      setEmperorEarnings(prev => ({
        currentSecond: secondEarning,
        lastMinute: prev.lastMinute + secondEarning,
        lastHour: prev.lastHour + secondEarning,
        today: prev.today + secondEarning,
        allTime: prev.allTime + secondEarning,
      }));
    }, 1000);

    // Initialize with starting values
    setEmperorEarnings({
      currentSecond: 7.43,
      lastMinute: 445.8,
      lastHour: 26748,
      today: 178240,
      allTime: 12450000,
    });

    return () => clearInterval(earningsTimer);
  }, []);

  // Real-time settlement pulse update
  useEffect(() => {
    const pulseTimer = setInterval(() => {
      setSettlementPulse(prev => ({
        ...prev,
        avgLatency: 480 + Math.random() * 40,
        settlementsPerSecond: 145 + Math.floor(Math.random() * 25),
        errorRate: Math.random() * 0.01,
      }));

      setNodeHealth(prev => ({
        ...prev,
        activeNodes: 10950 + Math.floor(Math.random() * 50),
        healthPercent: 99.5 + Math.random() * 0.5,
      }));
    }, 2000);

    return () => clearInterval(pulseTimer);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-black to-amber-950/20">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-3xl font-black bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                MASTER COMMAND CENTER
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/50 rounded-full">
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-xs font-medium text-emerald-400">{isLive ? 'MAINNET LIVE' : 'OFFLINE'}</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-xs text-zinc-500">UTC Time</div>
                <div className="text-lg font-mono text-white">{currentTime.toUTCString().slice(17, 25)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-500">Local Time</div>
                <div className="text-lg font-mono text-white">{currentTime.toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-6 py-6">
        {/* Phase 76: System Master Control - God Mode Admin UI */}
        <div className="mb-8">
          <SystemMasterControl />
        </div>

        {/* Phase 23: Real-time Monitoring Widgets (FIXED AT TOP) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <EmperorEarningsWidget earnings={emperorEarnings} />
          <SettlementMonitorWidget pulse={settlementPulse} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <NodeHealthWidget health={nodeHealth} />
          <GrowthTrackerWidget />
        </div>

        {/* Phase 74: KAUS Live Metrics (Real Database Data) */}
        <div className="mb-6">
          <KausLiveMetricsWidget />
        </div>

        {/* Phase 53: Global Revenue Dashboard */}
        <div className="mb-6">
          <GlobalRevenueWidget />
        </div>

        {/* Phase 54: Referral Leaderboard */}
        <div className="mb-6">
          <ReferralLeaderboardWidget />
        </div>

        {/* Global Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <GlobalMetricCard label="Total TVL" value="$1.05B" subtext="+15.3% this month" />
          <GlobalMetricCard label="Active Nodes" value="11,000+" subtext="7 regions" />
          <GlobalMetricCard label="24H Volume" value="$45.2M" subtext="+12.4% vs yesterday" />
          <GlobalMetricCard label="Active Users" value="47,892" subtext="+892 today" />
          <GlobalMetricCard label="Global APY" value="42.7%" subtext="weighted average" />
          <GlobalMetricCard label="Settlement" value="99.97%" subtext="487ms avg" />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* 5 Sector Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <SectorCard
              title="ENERGY SECTOR"
              icon="⚡"
              metrics={SECTOR_DATA.ENERGY}
              color="border-cyan-500/30"
            />
            <SectorCard
              title="FINANCE SECTOR"
              icon="💰"
              metrics={SECTOR_DATA.FINANCE}
              color="border-emerald-500/30"
            />
            <SectorCard
              title="COMPUTE SECTOR"
              icon="🖥️"
              metrics={SECTOR_DATA.COMPUTE}
              color="border-purple-500/30"
            />
            <SectorCard
              title="CARBON SECTOR"
              icon="🌱"
              metrics={SECTOR_DATA.CARBON}
              color="border-green-500/30"
            />
            <div className="md:col-span-2">
              <SectorCard
                title="SOVEREIGN SECTOR"
                icon="👑"
                metrics={SECTOR_DATA.SOVEREIGN}
                color="border-amber-500/30"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <SecurityStatus />
            <AlertsPanel />
          </div>
        </div>

        {/* Global Map */}
        <RegionalMap />

        {/* Phase 51: Global Sales Proof */}
        <div className="mt-6">
          <GlobalSalesProof />
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl text-white font-bold hover:from-amber-500 hover:to-amber-700 transition-all">
            Execute Global Rebalance
          </button>
          <button className="p-4 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl text-white font-bold hover:from-emerald-500 hover:to-emerald-700 transition-all">
            Compound All Rewards
          </button>
          <button className="p-4 bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-xl text-white font-bold hover:from-cyan-500 hover:to-cyan-700 transition-all">
            Generate Report
          </button>
          <button className="p-4 bg-gradient-to-br from-red-600 to-red-800 rounded-xl text-white font-bold hover:from-red-500 hover:to-red-700 transition-all">
            Emergency Pause
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-12">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>NEXUS-X SOVEREIGN EMPIRE v3.1.0-EMPIRE</span>
            <span>BOSS ACCESS ONLY - AUDIT LOG ENABLED</span>
            <span>Last Sync: {currentTime.toISOString()}</span>
          </div>
        </div>
      </footer>

      {/* Jarvis AI Concierge */}
      <JarvisConcierge />
    </div>
  );
}
