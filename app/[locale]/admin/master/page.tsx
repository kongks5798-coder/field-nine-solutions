'use client';

import React, { useState, useEffect } from 'react';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MASTER COMMAND CENTER - BOSS ONLY
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 제국 통합 지휘소: 5대 섹터 지표 실시간 모니터링
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
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function MasterCommandCenter() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
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
    </div>
  );
}
