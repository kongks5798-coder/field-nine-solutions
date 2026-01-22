'use client';

/**
 * EPO (Energy Proof-of-Origin) Protocol Portal
 *
 * The global standard for energy provenance verification.
 * Field Nine becomes the SWIFT of energy trading.
 */

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ============================================================
// TYPES
// ============================================================

interface WatermarkEvent {
  id: string;
  timestamp: number;
  nodeId: string;
  kWh: number;
  hash: string;
}

interface NodeStatus {
  nodeId: string;
  name: string;
  status: 'active' | 'syncing' | 'offline';
  currentOutput: number;
  dailyGeneration: number;
  royaltiesEarned: number;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function EPOPortal() {
  const [activeTab, setActiveTab] = useState<'overview' | 'nodes' | 'api' | 'royalties'>('overview');
  const [liveWatermarks, setLiveWatermarks] = useState<WatermarkEvent[]>([]);
  const [globalStats, setGlobalStats] = useState({
    totalKwhAttested: 285000000,
    totalVerifications: 15847523,
    totalRoyalties: 12847.50,
    activeNodes: 15,
    apiConsumers: 51,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simulate live watermark creation
  useEffect(() => {
    const nodes = ['YEONGDONG-001', 'JEJU-001', 'BUSAN-001'];

    const interval = setInterval(() => {
      const newEvent: WatermarkEvent = {
        id: `EPO-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        nodeId: nodes[Math.floor(Math.random() * nodes.length)],
        kWh: 40 + Math.random() * 20,
        hash: `0x${Array.from({ length: 8 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join('')}...`,
      };

      setLiveWatermarks(prev => [newEvent, ...prev.slice(0, 9)]);

      setGlobalStats(prev => ({
        ...prev,
        totalKwhAttested: prev.totalKwhAttested + newEvent.kWh,
        totalVerifications: prev.totalVerifications + Math.floor(Math.random() * 3),
        totalRoyalties: prev.totalRoyalties + Math.random() * 0.01,
      }));
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Animated background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
    }> = [];

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
      });
    }

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.1)';
      ctx.lineWidth = 1;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.fillStyle = 'rgba(16, 185, 129, 0.5)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(animate);
    }

    animate();
  }, []);

  const sovereignNode: NodeStatus = {
    nodeId: 'YEONGDONG-001',
    name: 'Yeongdong Energy Node #1',
    status: 'active',
    currentOutput: 42500 + Math.random() * 5000,
    dailyGeneration: 285000,
    royaltiesEarned: 12847.50,
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-emerald-400 font-mono text-sm">PROTOCOL ACTIVE</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4">
            ENERGY
            <br />
            <span className="text-emerald-400">PROOF-OF-ORIGIN</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mb-8">
            The global standard for energy provenance verification.
            Every kWh, authenticated. Every verification, rewarded.
          </p>

          <div className="flex flex-wrap gap-4">
            <button className="px-8 py-4 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition-colors">
              Get API Key
            </button>
            <button className="px-8 py-4 border border-emerald-500/50 text-emerald-400 font-semibold rounded-lg hover:bg-emerald-500/10 transition-colors">
              View Documentation
            </button>
          </div>

          {/* Live Stats Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatPill
              label="kWh Attested"
              value={`${(globalStats.totalKwhAttested / 1000000).toFixed(1)}M`}
            />
            <StatPill
              label="Verifications"
              value={globalStats.totalVerifications.toLocaleString()}
            />
            <StatPill
              label="Royalties (NXUSD)"
              value={`$${globalStats.totalRoyalties.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            />
            <StatPill
              label="Active Nodes"
              value={globalStats.activeNodes.toString()}
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            {(['overview', 'nodes', 'api', 'royalties'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Sovereign Node */}
            <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/10 rounded-2xl border border-emerald-500/30 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded font-mono">
                      #1 SOVEREIGN
                    </span>
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-bold mt-2">{sovereignNode.name}</h2>
                  <p className="text-gray-400 font-mono">{sovereignNode.nodeId}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Current Output</p>
                  <p className="text-3xl font-bold font-mono text-emerald-400">
                    {(sovereignNode.currentOutput / 1000).toFixed(1)} MW
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-emerald-500/20">
                <div>
                  <p className="text-xs text-gray-400">Daily Generation</p>
                  <p className="text-lg font-mono">
                    {(sovereignNode.dailyGeneration / 1000).toFixed(0)} MWh
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Royalties Earned</p>
                  <p className="text-lg font-mono text-emerald-400">
                    ${sovereignNode.royaltiesEarned.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Certification</p>
                  <p className="text-lg font-mono">EPO-CERT-001</p>
                </div>
              </div>
            </div>

            {/* Live Watermarks */}
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="font-semibold">Live Watermark Stream</h2>
                <span className="text-xs font-mono text-gray-500">
                  Real-time attestations
                </span>
              </div>
              <div className="h-80 overflow-hidden">
                <div className="space-y-1 p-4">
                  {liveWatermarks.map((event, i) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5 text-sm"
                      style={{ opacity: 1 - i * 0.08 }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                        <span className="font-mono text-xs text-gray-500">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-gray-300">{event.nodeId}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-emerald-400">
                          {event.kWh.toFixed(1)} kWh
                        </span>
                        <span className="font-mono text-xs text-gray-500">
                          {event.hash}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-8">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
              <h2 className="text-2xl font-bold mb-4">Quick Start</h2>
              <p className="text-gray-400 mb-6">
                Integrate EPO verification into your platform in minutes.
              </p>

              <div className="bg-black rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-gray-300">
{`// Install the SDK
npm install @fieldnine/energy-sdk

// Initialize
import { FieldNineEPO } from '@fieldnine/energy-sdk';

const epo = new FieldNineEPO({
  apiKey: 'fn_epo_your_api_key_here'
});

// Verify energy watermark
const result = await epo.verify(
  'EPO-YEONGDONG-001-1706000000-A1B2C3D4'
);

if (result.valid) {
  console.log(\`Verified: \${result.kwhAttested} kWh\`);
  console.log(\`Source: \${result.sourceType}\`);
  console.log(\`Carbon offset: \${result.metadata.carbonOffset} kg CO2\`);
}`}
                </pre>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <APIEndpoint
                method="POST"
                path="/api/epo/verify"
                description="Verify a watermark and charge royalty"
              />
              <APIEndpoint
                method="POST"
                path="/api/epo/attest"
                description="Create new energy attestation"
              />
              <APIEndpoint
                method="GET"
                path="/api/epo/royalty"
                description="Check royalty balance and history"
              />
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-emerald-400 mb-2">
                Pricing: $0.001 per Verification
              </h3>
              <p className="text-gray-400">
                Like Spotify for energy. Every verification generates micro-royalties
                distributed to node operators (70%), Field Nine Protocol (20%),
                EPO Validators (7%), and Community Pool (3%).
              </p>
            </div>
          </div>
        )}

        {activeTab === 'royalties' && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-emerald-500/20 rounded-xl p-4 border border-emerald-500/30">
                <p className="text-sm text-gray-400">Node Operator Share</p>
                <p className="text-3xl font-bold text-emerald-400">70%</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-sm text-gray-400">Protocol Treasury</p>
                <p className="text-3xl font-bold">20%</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-sm text-gray-400">EPO Validators</p>
                <p className="text-3xl font-bold">7%</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-sm text-gray-400">Community Pool</p>
                <p className="text-3xl font-bold">3%</p>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-bold mb-6">Market Domination Scenario</h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="pb-3 text-gray-400 font-normal">Timeframe</th>
                      <th className="pb-3 text-gray-400 font-normal">Nodes</th>
                      <th className="pb-3 text-gray-400 font-normal">Verifications/Year</th>
                      <th className="pb-3 text-gray-400 font-normal">Annual Revenue</th>
                      <th className="pb-3 text-gray-400 font-normal">Market Share</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    <tr className="border-b border-white/5">
                      <td className="py-3">Year 1</td>
                      <td>50</td>
                      <td>600M</td>
                      <td className="text-emerald-400">$360K</td>
                      <td>0.1%</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3">Year 3</td>
                      <td>500</td>
                      <td>6B</td>
                      <td className="text-emerald-400">$3.6M</td>
                      <td>2.5%</td>
                    </tr>
                    <tr>
                      <td className="py-3">Year 5</td>
                      <td>5,000</td>
                      <td>60B</td>
                      <td className="text-emerald-400 font-bold">$36M</td>
                      <td className="font-bold">15%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-6 p-4 bg-black/30 rounded-lg">
                <p className="text-sm text-gray-400">
                  <span className="text-emerald-400 font-semibold">Target:</span>{' '}
                  Become the SWIFT of energy trading. No renewable kWh trades globally
                  without EPO verification. 15% market share = $36M annual recurring revenue.
                </p>
              </div>
            </div>

            <Link
              href="/ko/epo/tracker"
              className="block bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-6 hover:from-emerald-400 hover:to-emerald-500 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-black">
                    Open Live Royalty Tracker
                  </h3>
                  <p className="text-emerald-900">
                    Watch royalties accumulate in real-time
                  </p>
                </div>
                <span className="text-3xl">→</span>
              </div>
            </Link>
          </div>
        )}

        {activeTab === 'nodes' && (
          <div className="space-y-6">
            {[
              { id: 'YEONGDONG-001', name: 'Yeongdong Energy Node #1', region: 'Korea', capacity: '50 MW', type: 'Solar', status: 'SOVEREIGN', cert: true },
              { id: 'JEJU-001', name: 'Jeju Wind Farm #1', region: 'Korea', capacity: '30 MW', type: 'Wind', status: 'CERTIFIED', cert: true },
              { id: 'BUSAN-001', name: 'Busan Solar Park', region: 'Korea', capacity: '20 MW', type: 'Solar', status: 'CERTIFIED', cert: true },
              { id: 'SYDNEY-001', name: 'Sydney Solar Array', region: 'Australia', capacity: '45 MW', type: 'Solar', status: 'PENDING', cert: false },
              { id: 'TEXAS-001', name: 'West Texas Wind Hub', region: 'USA', capacity: '100 MW', type: 'Wind', status: 'PENDING', cert: false },
            ].map(node => (
              <div
                key={node.id}
                className={`rounded-xl border p-4 flex items-center justify-between ${
                  node.status === 'SOVEREIGN'
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : node.cert
                    ? 'bg-white/5 border-white/10'
                    : 'bg-white/5 border-white/5 opacity-60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    node.cert ? 'bg-emerald-500' : 'bg-yellow-500'
                  } ${node.cert ? 'animate-pulse' : ''}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{node.name}</span>
                      {node.status === 'SOVEREIGN' && (
                        <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">
                          #1 GLOBAL
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 font-mono">{node.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-sm text-gray-400">{node.region}</p>
                    <p className="font-mono">{node.capacity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">{node.type}</p>
                    <p className={`font-mono ${
                      node.status === 'SOVEREIGN' ? 'text-yellow-400' :
                      node.cert ? 'text-emerald-400' : 'text-gray-500'
                    }`}>
                      {node.status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// HELPER COMPONENTS
// ============================================================

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl px-4 py-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-xl font-bold font-mono">{value}</p>
    </div>
  );
}

function APIEndpoint({
  method,
  path,
  description,
}: {
  method: string;
  path: string;
  description: string;
}) {
  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs px-2 py-1 rounded font-mono font-bold ${
          method === 'POST' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
        }`}>
          {method}
        </span>
        <span className="font-mono text-sm text-gray-400">{path}</span>
      </div>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}
