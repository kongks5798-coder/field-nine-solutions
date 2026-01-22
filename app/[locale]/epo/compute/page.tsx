'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * INTELLIGENCE SOVEREIGN HUB
 *
 * 글로벌 연산력 현황 대시보드
 * - Global Compute Power Grid
 * - K-AUS 가치 상관관계 실시간 그래프
 * - 수익 최적화 엔진 현황
 */

interface ComputeStats {
  totalNodes: number;
  activeNodes: number;
  totalGPUs: number;
  totalTFLOPS: number;
  availableTFLOPS: number;
  allocatedTFLOPS: number;
  totalPowerConsumptionMW: number;
  averageUtilization: number;
  kausFromCompute: number;
  totalBurnedKaus: number;
}

interface GPUNode {
  nodeId: string;
  region: string;
  gpuType: string;
  gpuCount: number;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  currentUtilization: number;
  availableTFLOPS: number;
  allocatedTFLOPS: number;
}

interface MarketData {
  demandLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'SURGE';
  activeBids: number;
  totalVolumeKaus: number;
  topGPU: string;
  avgPrice: number;
}

interface YieldDecision {
  powerPlantId: string;
  decision: 'SELL_ELECTRICITY' | 'PRODUCE_COMPUTE' | 'HYBRID';
  confidence: number;
  computeAllocation: number;
  electricityAllocation: number;
  projectedDailyYieldUSD: number;
}

// Mock data generators
const generateMockStats = (): ComputeStats => ({
  totalNodes: 10,
  activeNodes: 9,
  totalGPUs: 7040,
  totalTFLOPS: 10_847_232,
  availableTFLOPS: 2_169_446,
  allocatedTFLOPS: 8_677_786,
  totalPowerConsumptionMW: 4.2,
  averageUtilization: 0.80,
  kausFromCompute: 125_847.5,
  totalBurnedKaus: 12_584.75,
});

const generateMockNodes = (): GPUNode[] => [
  { nodeId: 'KR-SEL-H100-001', region: 'KR', gpuType: 'H100', gpuCount: 256, status: 'ONLINE', currentUtilization: 0.78, availableTFLOPS: 111_164, allocatedTFLOPS: 395_280 },
  { nodeId: 'KR-SEL-A100-001', region: 'KR', gpuType: 'A100', gpuCount: 512, status: 'ONLINE', currentUtilization: 0.85, availableTFLOPS: 23_962, allocatedTFLOPS: 135_782 },
  { nodeId: 'US-TEX-H100-001', region: 'US', gpuType: 'H100', gpuCount: 1024, status: 'ONLINE', currentUtilization: 0.92, availableTFLOPS: 162_114, allocatedTFLOPS: 1_862_234 },
  { nodeId: 'US-TEX-MI300X-001', region: 'US', gpuType: 'MI300X', gpuCount: 384, status: 'ONLINE', currentUtilization: 0.67, availableTFLOPS: 165_610, allocatedTFLOPS: 336_278 },
  { nodeId: 'EU-DEU-A100-001', region: 'EU', gpuType: 'A100', gpuCount: 768, status: 'ONLINE', currentUtilization: 0.81, availableTFLOPS: 45_562, allocatedTFLOPS: 194_254 },
  { nodeId: 'EU-DEU-L40S-001', region: 'EU', gpuType: 'L40S', gpuCount: 1536, status: 'ONLINE', currentUtilization: 0.73, availableTFLOPS: 150_246, allocatedTFLOPS: 405_886 },
  { nodeId: 'UAE-DXB-H100-001', region: 'UAE', gpuType: 'H100', gpuCount: 512, status: 'ONLINE', currentUtilization: 0.88, availableTFLOPS: 121_622, allocatedTFLOPS: 890_426 },
  { nodeId: 'SG-SIN-RTX4090-001', region: 'SG', gpuType: 'RTX4090', gpuCount: 2048, status: 'ONLINE', currentUtilization: 0.71, availableTFLOPS: 195_878, allocatedTFLOPS: 479_762 },
  { nodeId: 'JP-TYO-A100-001', region: 'JP', gpuType: 'A100', gpuCount: 640, status: 'ONLINE', currentUtilization: 0.79, availableTFLOPS: 41_933, allocatedTFLOPS: 157_747 },
  { nodeId: 'AU-SYD-H100-001', region: 'AU', gpuType: 'H100', gpuCount: 384, status: 'MAINTENANCE', currentUtilization: 0, availableTFLOPS: 0, allocatedTFLOPS: 0 },
];

const generateMockMarket = (): MarketData => ({
  demandLevel: 'HIGH',
  activeBids: 23,
  totalVolumeKaus: 847_500,
  topGPU: 'H100',
  avgPrice: 0.0015,
});

const generateMockYieldDecisions = (): YieldDecision[] => [
  { powerPlantId: 'SOLAR-JEJU-001', decision: 'PRODUCE_COMPUTE', confidence: 0.87, computeAllocation: 0.75, electricityAllocation: 0.25, projectedDailyYieldUSD: 12500 },
  { powerPlantId: 'WIND-TEXAS-001', decision: 'HYBRID', confidence: 0.72, computeAllocation: 0.55, electricityAllocation: 0.45, projectedDailyYieldUSD: 45800 },
  { powerPlantId: 'SOLAR-DUBAI-001', decision: 'PRODUCE_COMPUTE', confidence: 0.91, computeAllocation: 0.85, electricityAllocation: 0.15, projectedDailyYieldUSD: 67200 },
  { powerPlantId: 'NUCLEAR-FUKUI-001', decision: 'SELL_ELECTRICITY', confidence: 0.68, computeAllocation: 0.30, electricityAllocation: 0.70, projectedDailyYieldUSD: 89400 },
];

export default function IntelligenceSovereignHub() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stats, setStats] = useState<ComputeStats>(generateMockStats());
  const [nodes, setNodes] = useState<GPUNode[]>(generateMockNodes());
  const [market, setMarket] = useState<MarketData>(generateMockMarket());
  const [yieldDecisions, setYieldDecisions] = useState<YieldDecision[]>(generateMockYieldDecisions());
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [animatedTFLOPS, setAnimatedTFLOPS] = useState(0);
  const [correlationData, setCorrelationData] = useState<{ tflops: number; kausPrice: number }[]>([]);

  // Generate correlation data
  useEffect(() => {
    const data: { tflops: number; kausPrice: number }[] = [];
    let baseTFLOPS = 5_000_000;
    let basePrice = 0.10;

    for (let i = 0; i < 30; i++) {
      const tflopsGrowth = 1 + Math.random() * 0.1;
      baseTFLOPS *= tflopsGrowth;

      // Price correlates with TFLOPS (energy consumption = demand)
      const correlation = 0.87;
      const noise = (Math.random() - 0.5) * 0.02;
      basePrice = basePrice * (1 + (tflopsGrowth - 1) * correlation + noise);

      data.push({
        tflops: baseTFLOPS,
        kausPrice: basePrice,
      });
    }

    setCorrelationData(data);
  }, []);

  // Animate TFLOPS counter
  useEffect(() => {
    const target = stats.allocatedTFLOPS;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setAnimatedTFLOPS(target);
        clearInterval(timer);
      } else {
        setAnimatedTFLOPS(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [stats.allocatedTFLOPS]);

  // Draw correlation chart
  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || correlationData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 60;

    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 5; i++) {
      const y = padding + (height - padding * 2) * (i / 5);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Data ranges
    const maxTFLOPS = Math.max(...correlationData.map(d => d.tflops));
    const minTFLOPS = Math.min(...correlationData.map(d => d.tflops));
    const maxPrice = Math.max(...correlationData.map(d => d.kausPrice));
    const minPrice = Math.min(...correlationData.map(d => d.kausPrice));

    // Draw TFLOPS line (cyan)
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    ctx.beginPath();

    correlationData.forEach((d, i) => {
      const x = padding + (width - padding * 2) * (i / (correlationData.length - 1));
      const y = height - padding - (height - padding * 2) * ((d.tflops - minTFLOPS) / (maxTFLOPS - minTFLOPS));

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw K-AUS price line (gold)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();

    correlationData.forEach((d, i) => {
      const x = padding + (width - padding * 2) * (i / (correlationData.length - 1));
      const y = height - padding - (height - padding * 2) * ((d.kausPrice - minPrice) / (maxPrice - minPrice));

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.fillText('AI Compute (TFLOPS) vs K-AUS Price', padding, 25);

    // Legend
    ctx.fillStyle = '#00d4ff';
    ctx.fillRect(width - 150, 15, 15, 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('TFLOPS', width - 130, 24);

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(width - 150, 35, 15, 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('K-AUS ($)', width - 130, 44);

    // Correlation value
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('Correlation: 0.87', padding, height - 15);

    // Y-axis labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px monospace';
    ctx.fillText(`${(maxTFLOPS / 1_000_000).toFixed(1)}M`, 5, padding + 10);
    ctx.fillText(`${(minTFLOPS / 1_000_000).toFixed(1)}M`, 5, height - padding);

    ctx.fillText(`$${maxPrice.toFixed(2)}`, width - 45, padding + 10);
    ctx.fillText(`$${minPrice.toFixed(2)}`, width - 45, height - padding);
  }, [correlationData]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        allocatedTFLOPS: prev.allocatedTFLOPS + Math.random() * 10000 - 5000,
        averageUtilization: Math.min(0.95, Math.max(0.5, prev.averageUtilization + (Math.random() - 0.5) * 0.02)),
        kausFromCompute: prev.kausFromCompute + Math.random() * 10,
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const regionColors: Record<string, string> = {
    KR: '#3b82f6',
    US: '#ef4444',
    EU: '#22c55e',
    UAE: '#f59e0b',
    SG: '#8b5cf6',
    JP: '#ec4899',
    AU: '#06b6d4',
  };

  const gpuTypeColors: Record<string, string> = {
    H100: '#f59e0b',
    A100: '#22c55e',
    MI300X: '#ef4444',
    RTX4090: '#8b5cf6',
    L40S: '#06b6d4',
  };

  const decisionColors: Record<string, string> = {
    SELL_ELECTRICITY: '#22c55e',
    PRODUCE_COMPUTE: '#3b82f6',
    HYBRID: '#f59e0b',
  };

  const demandColors: Record<string, string> = {
    LOW: '#6b7280',
    NORMAL: '#22c55e',
    HIGH: '#f59e0b',
    SURGE: '#ef4444',
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-3xl shadow-lg shadow-cyan-500/30">
            🧠
          </div>
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              INTELLIGENCE SOVEREIGN HUB
            </h1>
            <p className="text-gray-400">Global Compute Power Grid | Energy-to-Intelligence</p>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Live Data | Last Updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Top Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-xl p-4">
          <div className="text-sm text-gray-400">Active TFLOPS</div>
          <div className="text-2xl font-black text-cyan-400">
            {(animatedTFLOPS / 1_000_000).toFixed(2)}M
          </div>
          <div className="text-xs text-green-400">+2.3% today</div>
        </div>

        <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-xl p-4">
          <div className="text-sm text-gray-400">GPU Nodes</div>
          <div className="text-2xl font-black text-green-400">
            {stats.activeNodes}/{stats.totalNodes}
          </div>
          <div className="text-xs text-gray-400">{stats.totalGPUs.toLocaleString()} GPUs</div>
        </div>

        <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border border-amber-500/30 rounded-xl p-4">
          <div className="text-sm text-gray-400">Utilization</div>
          <div className="text-2xl font-black text-amber-400">
            {(stats.averageUtilization * 100).toFixed(1)}%
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full mt-1">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${stats.averageUtilization * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl p-4">
          <div className="text-sm text-gray-400">K-AUS Earned</div>
          <div className="text-2xl font-black text-purple-400">
            {stats.kausFromCompute.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-red-400">
            🔥 {stats.totalBurnedKaus.toLocaleString(undefined, { maximumFractionDigits: 0 })} burned
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 border border-red-500/30 rounded-xl p-4">
          <div className="text-sm text-gray-400">Power Draw</div>
          <div className="text-2xl font-black text-red-400">
            {stats.totalPowerConsumptionMW.toFixed(1)} MW
          </div>
          <div className="text-xs text-green-400">100% Renewable</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: GPU Node Map */}
        <div className="lg:col-span-2 space-y-6">
          {/* Global Compute Grid */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
              🌐 Global Compute Power Grid
              <span className="ml-auto text-sm font-normal text-gray-400">
                {selectedRegion ? `Region: ${selectedRegion}` : 'All Regions'}
              </span>
            </h2>

            {/* Region Filter */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <button
                onClick={() => setSelectedRegion(null)}
                className={`px-3 py-1 rounded-lg text-sm transition-all ${
                  !selectedRegion ? 'bg-cyan-500 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                All
              </button>
              {Object.keys(regionColors).map(region => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-3 py-1 rounded-lg text-sm transition-all flex items-center gap-1 ${
                    selectedRegion === region ? 'text-black' : 'text-gray-400 hover:bg-gray-700'
                  }`}
                  style={{
                    backgroundColor: selectedRegion === region ? regionColors[region] : '#1f2937',
                  }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: regionColors[region] }} />
                  {region}
                </button>
              ))}
            </div>

            {/* Node Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {nodes
                .filter(node => !selectedRegion || node.region === selectedRegion)
                .map(node => (
                  <div
                    key={node.nodeId}
                    className={`p-4 rounded-lg border transition-all ${
                      node.status === 'ONLINE'
                        ? 'bg-gray-800/50 border-gray-700 hover:border-cyan-500/50'
                        : 'bg-gray-900/50 border-gray-800 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: regionColors[node.region] }}
                        />
                        <span className="font-mono text-sm">{node.nodeId}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          node.status === 'ONLINE'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {node.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold"
                        style={{
                          backgroundColor: gpuTypeColors[node.gpuType] + '30',
                          color: gpuTypeColors[node.gpuType],
                        }}
                      >
                        {node.gpuType}
                      </span>
                      <span className="text-sm text-gray-400">x{node.gpuCount}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Utilization</span>
                        <span className={node.currentUtilization > 0.8 ? 'text-amber-400' : 'text-green-400'}>
                          {(node.currentUtilization * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-700 rounded-full">
                        <div
                          className={`h-full rounded-full transition-all ${
                            node.currentUtilization > 0.9
                              ? 'bg-red-500'
                              : node.currentUtilization > 0.7
                              ? 'bg-amber-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${node.currentUtilization * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{(node.allocatedTFLOPS / 1000).toFixed(0)}K TFLOPS</span>
                        <span className="text-cyan-400">{(node.availableTFLOPS / 1000).toFixed(0)}K avail</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Correlation Chart */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-amber-400 mb-4">
              📈 K-AUS Value Correlation
            </h2>
            <canvas
              ref={canvasRef}
              width={700}
              height={300}
              className="w-full rounded-lg"
            />
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-sm text-gray-400">Correlation Coefficient</div>
                <div className="text-xl font-bold text-green-400">0.87</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-sm text-gray-400">TFLOPS → Price Impact</div>
                <div className="text-xl font-bold text-cyan-400">+$0.012/M</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-sm text-gray-400">30-Day Trend</div>
                <div className="text-xl font-bold text-amber-400">↗ +47.2%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Market & Yield */}
        <div className="space-y-6">
          {/* Marketplace Stats */}
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl p-6">
            <h2 className="text-lg font-bold text-purple-400 mb-4">🏪 Compute Marketplace</h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Demand Level</span>
                <span
                  className="px-3 py-1 rounded-full text-sm font-bold"
                  style={{
                    backgroundColor: demandColors[market.demandLevel] + '30',
                    color: demandColors[market.demandLevel],
                  }}
                >
                  {market.demandLevel}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Active Bids</span>
                <span className="text-xl font-bold text-white">{market.activeBids}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Volume</span>
                <span className="text-xl font-bold text-amber-400">
                  {(market.totalVolumeKaus / 1000).toFixed(1)}K K-AUS
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Top GPU Demand</span>
                <span
                  className="px-2 py-1 rounded text-sm font-bold"
                  style={{
                    backgroundColor: gpuTypeColors[market.topGPU] + '30',
                    color: gpuTypeColors[market.topGPU],
                  }}
                >
                  {market.topGPU}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Avg Price/TFLOPS-hr</span>
                <span className="text-xl font-bold text-cyan-400">
                  {market.avgPrice.toFixed(4)} K-AUS
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-purple-500/30">
                <div className="text-sm text-red-400 flex items-center gap-2">
                  <span className="animate-pulse">🔥</span>
                  0.5% Settlement Fee → Instant K-AUS Burn
                </div>
              </div>
            </div>
          </div>

          {/* Yield Optimizer Decisions */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-green-400 mb-4">
              ⚡ AI Yield Optimizer
              <span className="ml-2 text-xs font-normal text-gray-500">(1분 간격 결정)</span>
            </h2>

            <div className="space-y-3">
              {yieldDecisions.map(decision => (
                <div
                  key={decision.powerPlantId}
                  className="p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm">{decision.powerPlantId}</span>
                    <span
                      className="px-2 py-0.5 rounded text-xs font-bold"
                      style={{
                        backgroundColor: decisionColors[decision.decision] + '30',
                        color: decisionColors[decision.decision],
                      }}
                    >
                      {decision.decision.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1">
                      <div className="h-2 bg-gray-700 rounded-full flex overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${decision.computeAllocation * 100}%` }}
                        />
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${decision.electricityAllocation * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-blue-400">
                          Compute {(decision.computeAllocation * 100).toFixed(0)}%
                        </span>
                        <span className="text-green-400">
                          Electric {(decision.electricityAllocation * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">
                      Confidence: {(decision.confidence * 100).toFixed(0)}%
                    </span>
                    <span className="text-amber-400 font-bold">
                      ${decision.projectedDailyYieldUSD.toLocaleString()}/day
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Projected Daily</span>
                <span className="text-xl font-black text-green-400">
                  ${yieldDecisions.reduce((sum, d) => sum + d.projectedDailyYieldUSD, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-gray-400 mb-4">🚀 Quick Actions</h2>

            <div className="space-y-2">
              <button className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg font-bold transition-all">
                Submit Compute Bid
              </button>
              <button className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg font-bold transition-all">
                View SDK Docs
              </button>
              <button className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold transition-all text-gray-300">
                Download API Spec
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: GPU Type Distribution */}
      <div className="mt-6 bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-400 mb-4">🎮 GPU Fleet Distribution</h2>

        <div className="grid grid-cols-5 gap-4">
          {Object.entries(gpuTypeColors).map(([gpuType, color]) => {
            const gpuNodes = nodes.filter(n => n.gpuType === gpuType);
            const totalGPUs = gpuNodes.reduce((sum, n) => sum + n.gpuCount, 0);
            const avgUtil = gpuNodes.length > 0
              ? gpuNodes.reduce((sum, n) => sum + n.currentUtilization, 0) / gpuNodes.length
              : 0;

            return (
              <div
                key={gpuType}
                className="p-4 rounded-lg"
                style={{ backgroundColor: color + '15', borderColor: color + '50', borderWidth: 1 }}
              >
                <div className="font-bold text-lg" style={{ color }}>{gpuType}</div>
                <div className="text-2xl font-black text-white">{totalGPUs.toLocaleString()}</div>
                <div className="text-sm text-gray-400">{gpuNodes.length} nodes</div>
                <div className="mt-2 h-1.5 bg-gray-700 rounded-full">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${avgUtil * 100}%`, backgroundColor: color }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">{(avgUtil * 100).toFixed(0)}% util</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-800 text-center text-gray-500 text-sm">
        <p>Intelligence Sovereign Hub v1.0.0 | Field Nine Solutions</p>
        <p className="text-cyan-400/60 mt-2">
          &quot;에너지를 넘어 지능을 판다. 전 세계 AI 산업의 심장부를 필드나인이 선점한다.&quot;
        </p>
      </div>
    </div>
  );
}
