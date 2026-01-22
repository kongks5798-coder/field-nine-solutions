'use client';

/**
 * VIRTUAL ENERGY SWAP DASHBOARD
 *
 * Real-time visualization of cross-border energy value transfer.
 * Seoul production → Australia Tesla charging in seconds.
 */

import React, { useState, useEffect, useRef } from 'react';

// ============================================================
// TYPES
// ============================================================

interface EnergyNode {
  nodeId: string;
  region: string;
  market: string;
  currentPrice: number;
  availableLiquidity: number;
  utilizationRate: number;
}

interface SwapEvent {
  id: string;
  timestamp: number;
  source: string;
  target: string;
  amount: number;
  nxusdValue: number;
  status: 'pending' | 'completed';
}

interface MarketPrice {
  market: string;
  price: number;
  change: number;
}

// ============================================================
// GLOBAL NODES DATA
// ============================================================

const NODES: Record<string, EnergyNode & { color: string; position: { x: number; y: number } }> = {
  'YEONGDONG-001': {
    nodeId: 'YEONGDONG-001',
    region: 'Korea',
    market: 'JEPX',
    currentPrice: 85.50,
    availableLiquidity: 25000,
    utilizationRate: 72,
    color: '#10B981',
    position: { x: 75, y: 35 },
  },
  'PJM-EAST-001': {
    nodeId: 'PJM-EAST-001',
    region: 'USA-East',
    market: 'PJM',
    currentPrice: 42.30,
    availableLiquidity: 45000,
    utilizationRate: 68,
    color: '#3B82F6',
    position: { x: 25, y: 40 },
  },
  'AEMO-VIC-001': {
    nodeId: 'AEMO-VIC-001',
    region: 'Australia',
    market: 'AEMO',
    currentPrice: 65.80,
    availableLiquidity: 20000,
    utilizationRate: 75,
    color: '#F59E0B',
    position: { x: 80, y: 75 },
  },
  'EPEX-DE-001': {
    nodeId: 'EPEX-DE-001',
    region: 'Germany',
    market: 'EPEX',
    currentPrice: 78.20,
    availableLiquidity: 35000,
    utilizationRate: 70,
    color: '#8B5CF6',
    position: { x: 48, y: 30 },
  },
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function VirtualSwapDashboard() {
  const [selectedSource, setSelectedSource] = useState('YEONGDONG-001');
  const [selectedTarget, setSelectedTarget] = useState('AEMO-VIC-001');
  const [swapAmount, setSwapAmount] = useState(1000);
  const [swapEvents, setSwapEvents] = useState<SwapEvent[]>([]);
  const [isSwapping, setIsSwapping] = useState(false);
  const [activeSwapAnimation, setActiveSwapAnimation] = useState<{
    source: string;
    target: string;
    progress: number;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate swap rate
  const sourceNode = NODES[selectedSource];
  const targetNode = NODES[selectedTarget];
  const swapRate = sourceNode && targetNode
    ? (sourceNode.currentPrice / targetNode.currentPrice) * 0.9975
    : 1;
  const outputAmount = swapAmount * swapRate;
  const nxusdValue = outputAmount * (targetNode?.currentPrice || 50) / 1000;

  // Simulate real-time swap events
  useEffect(() => {
    const nodeIds = Object.keys(NODES);

    const interval = setInterval(() => {
      const sourceIdx = Math.floor(Math.random() * nodeIds.length);
      let targetIdx = Math.floor(Math.random() * nodeIds.length);
      while (targetIdx === sourceIdx) {
        targetIdx = Math.floor(Math.random() * nodeIds.length);
      }

      const newEvent: SwapEvent = {
        id: `SW-${Date.now()}`,
        timestamp: Date.now(),
        source: nodeIds[sourceIdx],
        target: nodeIds[targetIdx],
        amount: 500 + Math.random() * 2000,
        nxusdValue: 25 + Math.random() * 100,
        status: 'completed',
      };

      setSwapEvents(prev => [newEvent, ...prev.slice(0, 9)]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Draw network visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    let animationFrame: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      const nodeEntries = Object.entries(NODES);
      ctx.lineWidth = 1;

      for (let i = 0; i < nodeEntries.length; i++) {
        for (let j = i + 1; j < nodeEntries.length; j++) {
          const [, node1] = nodeEntries[i];
          const [, node2] = nodeEntries[j];

          const x1 = (node1.position.x / 100) * canvas.width;
          const y1 = (node1.position.y / 100) * canvas.height;
          const x2 = (node2.position.x / 100) * canvas.width;
          const y2 = (node2.position.y / 100) * canvas.height;

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      // Draw active swap animation
      if (activeSwapAnimation) {
        const source = NODES[activeSwapAnimation.source];
        const target = NODES[activeSwapAnimation.target];

        const x1 = (source.position.x / 100) * canvas.width;
        const y1 = (source.position.y / 100) * canvas.height;
        const x2 = (target.position.x / 100) * canvas.width;
        const y2 = (target.position.y / 100) * canvas.height;

        // Animated line
        const progress = activeSwapAnimation.progress;
        const currentX = x1 + (x2 - x1) * progress;
        const currentY = y1 + (y2 - y1) * progress;

        // Glowing line
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#10B981';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Energy packet
        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.arc(currentX, currentY, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw nodes
      for (const [nodeId, node] of nodeEntries) {
        const x = (node.position.x / 100) * canvas.width;
        const y = (node.position.y / 100) * canvas.height;

        // Glow effect for selected nodes
        if (nodeId === selectedSource || nodeId === selectedTarget) {
          ctx.shadowColor = node.color;
          ctx.shadowBlur = 20;
        }

        // Node circle
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Node label
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(node.region, x, y + 28);
      }

      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [selectedSource, selectedTarget, activeSwapAnimation]);

  // Execute swap animation
  const executeSwap = async () => {
    setIsSwapping(true);

    // Start animation
    const duration = 2000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setActiveSwapAnimation({
        source: selectedSource,
        target: selectedTarget,
        progress,
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setActiveSwapAnimation(null);
        setIsSwapping(false);

        // Add to swap events
        setSwapEvents(prev => [{
          id: `SW-${Date.now()}`,
          timestamp: Date.now(),
          source: selectedSource,
          target: selectedTarget,
          amount: swapAmount,
          nxusdValue: nxusdValue,
          status: 'completed',
        }, ...prev.slice(0, 9)]);
      }
    };

    animate();
  };

  const marketPrices: MarketPrice[] = [
    { market: 'PJM', price: 42.30, change: 2.5 },
    { market: 'JEPX', price: 85.50, change: -1.2 },
    { market: 'AEMO', price: 65.80, change: 4.1 },
    { market: 'EPEX', price: 78.20, change: -0.8 },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                VIRTUAL ENERGY <span className="text-emerald-400">SWAP</span>
              </h1>
              <p className="text-gray-400 mt-1">
                Cross-border energy value transfer at the speed of light
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-emerald-400 font-mono text-sm">LIVE</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Total Volume (24h)</p>
                <p className="text-xl font-bold font-mono">15.42 GWh</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Prices Bar */}
      <div className="border-b border-white/10 bg-white/5">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center gap-8">
            {marketPrices.map(m => (
              <div key={m.market} className="flex items-center gap-3">
                <span className="text-gray-400 font-mono">{m.market}</span>
                <span className="font-mono">${m.price.toFixed(2)}</span>
                <span className={`text-sm ${m.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {m.change >= 0 ? '+' : ''}{m.change.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Network Map */}
          <div className="lg:col-span-2 bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h2 className="font-semibold">Global Energy Network</h2>
            </div>
            <div className="relative" style={{ height: '400px' }}>
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
              />

              {/* Node Labels (interactive) */}
              {Object.entries(NODES).map(([nodeId, node]) => (
                <button
                  key={nodeId}
                  onClick={() => {
                    if (selectedSource === nodeId) {
                      // Clicking source again - do nothing
                    } else if (selectedTarget === nodeId) {
                      // Swap source and target
                      setSelectedTarget(selectedSource);
                      setSelectedSource(nodeId);
                    } else {
                      setSelectedTarget(nodeId);
                    }
                  }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                  style={{
                    left: `${node.position.x}%`,
                    top: `${node.position.y}%`,
                  }}
                >
                  <div className={`opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-black/90 rounded-lg text-xs whitespace-nowrap z-10`}>
                    <p className="font-semibold">{nodeId}</p>
                    <p className="text-gray-400">${node.currentPrice.toFixed(2)}/MWh</p>
                    <p className="text-gray-400">{(node.availableLiquidity / 1000).toFixed(0)} MWh liquidity</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Swap Panel */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <h2 className="font-semibold mb-6">Execute Swap</h2>

            {/* Source */}
            <div className="mb-4">
              <label className="text-xs text-gray-400 block mb-2">From (Source Node)</label>
              <select
                value={selectedSource}
                onChange={e => setSelectedSource(e.target.value)}
                className="w-full bg-black/50 border border-white/20 rounded-lg p-3 font-mono"
              >
                {Object.entries(NODES).map(([id, node]) => (
                  <option key={id} value={id} disabled={id === selectedTarget}>
                    {node.region} ({id})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Price: ${sourceNode?.currentPrice.toFixed(2)}/MWh
              </p>
            </div>

            {/* Amount */}
            <div className="mb-4">
              <label className="text-xs text-gray-400 block mb-2">Amount (kWh)</label>
              <input
                type="number"
                value={swapAmount}
                onChange={e => setSwapAmount(Number(e.target.value))}
                className="w-full bg-black/50 border border-white/20 rounded-lg p-3 font-mono"
                min={100}
                max={100000}
              />
            </div>

            {/* Target */}
            <div className="mb-6">
              <label className="text-xs text-gray-400 block mb-2">To (Target Node)</label>
              <select
                value={selectedTarget}
                onChange={e => setSelectedTarget(e.target.value)}
                className="w-full bg-black/50 border border-white/20 rounded-lg p-3 font-mono"
              >
                {Object.entries(NODES).map(([id, node]) => (
                  <option key={id} value={id} disabled={id === selectedSource}>
                    {node.region} ({id})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Price: ${targetNode?.currentPrice.toFixed(2)}/MWh
              </p>
            </div>

            {/* Quote */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Swap Rate</span>
                <span className="font-mono">{swapRate.toFixed(4)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">You Receive</span>
                <span className="font-mono text-emerald-400">{outputAmount.toFixed(2)} kWh</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">NXUSD Value</span>
                <span className="font-mono">${nxusdValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fee</span>
                <span className="font-mono">0.25%</span>
              </div>
            </div>

            {/* Execute Button */}
            <button
              onClick={executeSwap}
              disabled={isSwapping}
              className={`w-full py-4 rounded-lg font-semibold transition-all ${
                isSwapping
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-black'
              }`}
            >
              {isSwapping ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Swapping...
                </span>
              ) : (
                'Execute Swap'
              )}
            </button>

            {/* Hard-Backing Notice */}
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-xs text-yellow-400">
                <strong>HARD-BACKING:</strong> This swap requires proof of physical grid injection.
                Energy must be actually produced and injected before NXUSD is issued.
              </p>
            </div>
          </div>
        </div>

        {/* Live Swap Feed */}
        <div className="mt-8 bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-semibold">Live Swap Feed</h2>
            <span className="text-xs text-gray-500 font-mono">
              {swapEvents.length} recent swaps
            </span>
          </div>
          <div className="divide-y divide-white/5">
            {swapEvents.map(event => {
              const source = NODES[event.source];
              const target = NODES[event.target];
              return (
                <div
                  key={event.id}
                  className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: source?.color }}
                      />
                      <span className="font-mono text-sm">{source?.region}</span>
                    </div>
                    <span className="text-gray-500">→</span>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: target?.color }}
                      />
                      <span className="font-mono text-sm">{target?.region}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono">{event.amount.toFixed(0)} kWh</p>
                    <p className="text-xs text-emerald-400">${event.nxusdValue.toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cross-Border Scenario */}
        <div className="mt-8 bg-gradient-to-r from-emerald-900/30 to-blue-900/30 rounded-2xl border border-emerald-500/30 p-6">
          <h2 className="text-xl font-bold mb-4">
            Real Scenario: Seoul → Sydney
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-emerald-500/20 flex items-center justify-center text-2xl">
                ☀️
              </div>
              <p className="font-semibold">1. Produce</p>
              <p className="text-sm text-gray-400">
                Yeongdong Node generates 1,000 kWh solar
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-blue-500/20 flex items-center justify-center text-2xl">
                ⚡
              </div>
              <p className="font-semibold">2. Inject</p>
              <p className="text-sm text-gray-400">
                Grid-Injection Proof created (KEPCO verified)
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-purple-500/20 flex items-center justify-center text-2xl">
                🔄
              </div>
              <p className="font-semibold">3. Swap</p>
              <p className="text-sm text-gray-400">
                Mirror position created, value transferred to Australia
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-yellow-500/20 flex items-center justify-center text-2xl">
                🚗
              </div>
              <p className="font-semibold">4. Charge</p>
              <p className="text-sm text-gray-400">
                Tesla Supercharger in Sydney receives NXUSD payment
              </p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-black/30 rounded-lg">
            <p className="text-sm text-center text-gray-300">
              <strong className="text-emerald-400">Result:</strong> 보스님이 서울에서 생산한 전기의 가치로
              호주에서 테슬라를 충전합니다. 물리적 전기 이동 없이, 빛의 속도로.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
