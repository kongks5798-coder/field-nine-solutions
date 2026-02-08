'use client';

/**
 * EPO Royalty Tracker Dashboard
 *
 * Real-time visualization of energy verification royalties.
 * Like Spotify's streaming dashboard, but for energy.
 */

import React, { useState, useEffect, useRef } from 'react';

// ============================================================
// TYPES
// ============================================================

interface RoyaltyStream {
  id: string;
  time: string;
  amount: number;
  nodeId: string;
  consumer: string;
  watermarkId: string;
}

interface GlobalStats {
  totalVerifications: number;
  totalRoyalties: number;
  activeNodes: number;
  apiConsumers: number;
  last24hVerifications: number;
  last24hRoyalties: number;
  projectedAnnual: number;
}

interface MarketProjection {
  year: string;
  nodes: number;
  verifications: number;
  revenue: number;
  marketShare: number;
}

// ============================================================
// ROYALTY TRACKER COMPONENT
// ============================================================

export function RoyaltyTracker() {
  const [stats, setStats] = useState<GlobalStats>({
    totalVerifications: 15847523,
    totalRoyalties: 12847.50,
    activeNodes: 15,
    apiConsumers: 51,
    last24hVerifications: 85420,
    last24hRoyalties: 85.42,
    projectedAnnual: 31250000,
  });

  const [royaltyStream, setRoyaltyStream] = useState<RoyaltyStream[]>([]);
  const [liveCounter, setLiveCounter] = useState(0);
  const streamRef = useRef<HTMLDivElement>(null);

  // Simulate real-time royalty stream
  useEffect(() => {
    const consumers = [
      'Tesla Supercharger',
      'ChargePoint',
      'KEPCO Grid',
      'Ionity EU',
      'Electrify America',
      'Shell Recharge',
    ];

    const nodes = ['YEONGDONG-001', 'JEJU-001', 'BUSAN-001', 'SYDNEY-001'];

    const interval = setInterval(() => {
      const newStream: RoyaltyStream = {
        id: `RTX-${Date.now()}`,
        time: new Date().toISOString(),
        amount: Math.random() * 0.002,
        nodeId: nodes[Math.floor(Math.random() * nodes.length)],
        consumer: consumers[Math.floor(Math.random() * consumers.length)],
        watermarkId: `EPO-${nodes[0]}-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      };

      setRoyaltyStream(prev => [newStream, ...prev.slice(0, 19)]);
      setLiveCounter(prev => prev + 1);

      // Update stats
      setStats(prev => ({
        ...prev,
        totalVerifications: prev.totalVerifications + 1,
        totalRoyalties: prev.totalRoyalties + newStream.amount,
        last24hVerifications: prev.last24hVerifications + 1,
        last24hRoyalties: prev.last24hRoyalties + newStream.amount,
      }));
    }, 200 + Math.random() * 300);

    return () => clearInterval(interval);
  }, []);

  const projections: MarketProjection[] = [
    { year: 'Year 1', nodes: 50, verifications: 600000000, revenue: 360000, marketShare: 0.1 },
    { year: 'Year 3', nodes: 500, verifications: 6000000000, revenue: 3600000, marketShare: 2.5 },
    { year: 'Year 5', nodes: 5000, verifications: 60000000000, revenue: 36000000, marketShare: 15 },
  ];

  return (
    <div className="bg-[#F9F9F7] text-[#171717] min-h-screen">
      {/* Header */}
      <div className="bg-[#171717] text-[#F9F9F7] py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                EPO ROYALTY TRACKER
              </h1>
              <p className="text-gray-400 mt-1">
                Real-time Energy Verification Revenue
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-emerald-400 font-mono text-sm">LIVE</span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Verifications Today</p>
                <p className="text-2xl font-bold font-mono">
                  {stats.last24hVerifications.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Verifications"
            value={stats.totalVerifications.toLocaleString()}
            subtext="All-time"
            trend="+12.5%"
          />
          <StatCard
            label="Royalties Earned"
            value={`$${stats.totalRoyalties.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            subtext="NXUSD"
            trend="+8.2%"
          />
          <StatCard
            label="Active Nodes"
            value={stats.activeNodes.toString()}
            subtext="EPO Certified"
            trend="+3"
          />
          <StatCard
            label="API Consumers"
            value={stats.apiConsumers.toString()}
            subtext="Global Partners"
            trend="+7"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Live Stream */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold">Live Royalty Stream</h2>
              <span className="text-xs font-mono text-gray-500">
                {liveCounter} events this session
              </span>
            </div>
            <div
              ref={streamRef}
              className="h-96 overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white z-10 pointer-events-none" />
              <div className="space-y-1 p-4">
                {royaltyStream.map((stream, i) => (
                  <div
                    key={stream.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 text-sm animate-fade-in"
                    style={{
                      opacity: 1 - i * 0.05,
                      transform: `translateY(${i * 2}px)`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                      <span className="font-mono text-xs text-gray-400">
                        {new Date(stream.time).toLocaleTimeString()}
                      </span>
                      <span className="font-medium">{stream.consumer}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-500 font-mono">
                        {stream.nodeId}
                      </span>
                      <span className="font-mono font-semibold text-emerald-600">
                        +${stream.amount.toFixed(4)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">24h Revenue</h2>
            <div className="h-48 flex items-end justify-between gap-1">
              {Array.from({ length: 24 }).map((_, i) => {
                const height = 30 + Math.random() * 70;
                const isActive = i === new Date().getHours();
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-t ${isActive ? 'bg-emerald-500' : 'bg-gray-200'}`}
                    style={{ height: `${height}%` }}
                    title={`${i}:00 - $${(height * 0.5).toFixed(2)}`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>00:00</span>
              <span>12:00</span>
              <span>Now</span>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Projected Annual</span>
                <span className="text-2xl font-bold text-emerald-600">
                  ${(stats.projectedAnnual / 1000000).toFixed(1)}M
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Market Projection */}
        <div className="mt-8 bg-[#171717] rounded-2xl p-6 text-white">
          <h2 className="text-xl font-bold mb-6">Global Market Domination Scenario</h2>
          <p className="text-gray-400 text-sm mb-6">
            Revenue projection based on 1kWh = $0.001 verification royalty
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {projections.map(proj => (
              <div
                key={proj.year}
                className="bg-white/5 rounded-xl p-5 border border-white/10"
              >
                <h3 className="text-lg font-semibold text-emerald-400">
                  {proj.year}
                </h3>
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Certified Nodes</span>
                    <span className="font-mono">{proj.nodes.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Verifications</span>
                    <span className="font-mono">{(proj.verifications / 1e9).toFixed(1)}B</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Annual Revenue</span>
                    <span className="font-mono text-emerald-400">
                      ${(proj.revenue / 1e6).toFixed(1)}M
                    </span>
                  </div>
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Market Share</span>
                      <span className="font-bold text-lg">{proj.marketShare}%</span>
                    </div>
                    <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(proj.marketShare * 5, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
            <div className="flex items-center gap-3">
              <div className="text-3xl">⚡</div>
              <div>
                <p className="font-semibold text-emerald-400">
                  Year 5 Target: 15% Global Renewable Energy Verification
                </p>
                <p className="text-sm text-gray-400">
                  EPO becomes the SWIFT of energy - no renewable kWh trades without Field Nine verification
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* API Consumer Leaderboard */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold">Top API Consumers</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {[
              { rank: 1, name: 'KEPCO Green Grid', tier: 'sovereign', verifications: 8500000, paid: 2550 },
              { rank: 2, name: 'Tesla Supercharger Network', tier: 'enterprise', verifications: 4521000, paid: 2260 },
              { rank: 3, name: 'ChargePoint Global', tier: 'premium', verifications: 1250000, paid: 1000 },
              { rank: 4, name: 'Ionity EU', tier: 'enterprise', verifications: 890000, paid: 445 },
              { rank: 5, name: 'Electrify America', tier: 'enterprise', verifications: 650000, paid: 325 },
            ].map(consumer => (
              <div
                key={consumer.rank}
                className="flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                    ${consumer.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                      consumer.rank === 2 ? 'bg-gray-100 text-gray-600' :
                      consumer.rank === 3 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-50 text-gray-500'}`}
                  >
                    #{consumer.rank}
                  </span>
                  <div>
                    <p className="font-medium">{consumer.name}</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {consumer.tier} tier
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono">
                    {(consumer.verifications / 1000000).toFixed(2)}M verifications
                  </p>
                  <p className="text-sm text-emerald-600">
                    ${consumer.paid.toLocaleString()} paid
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

// ============================================================
// HELPER COMPONENTS
// ============================================================

function StatCard({
  label,
  value,
  subtext,
  trend,
}: {
  label: string;
  value: string;
  subtext: string;
  trend: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-2xl font-bold mt-1 font-mono">{value}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-400">{subtext}</span>
        <span className="text-xs text-emerald-600 font-medium">{trend}</span>
      </div>
    </div>
  );
}

export default RoyaltyTracker;
