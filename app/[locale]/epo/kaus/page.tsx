'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * K-AUS SOVEREIGN DASHBOARD
 *
 * 글로벌 에너지 기축 통화 대시보드
 * "전 세계 모든 에너지 노드가 카우스를 갈구하게 하라"
 */

interface KausPrice {
  usd: number;
  krw: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
}

interface SupplyData {
  totalSupply: number;
  circulatingSupply: number;
  burnedSupply: number;
  stakingSupply: number;
  poeRewardsRemaining: number;
}

interface BurnEvent {
  id: string;
  timestamp: number;
  amount: number;
  source: string;
}

interface SeedCapitalValue {
  initialInvestment: number;
  currentValue: number;
  kausHoldings: number;
  unrealizedGain: number;
  roi: number;
}

const MAX_SUPPLY = 120_000_000;

export default function KausDashboard() {
  const [price, setPrice] = useState<KausPrice>({
    usd: 0.127,
    krw: 167.64,
    change24h: 5.23,
    marketCap: 1524000,
    volume24h: 342000,
  });

  const [supply, setSupply] = useState<SupplyData>({
    totalSupply: MAX_SUPPLY,
    circulatingSupply: 12000000,
    burnedSupply: 47823.45,
    stakingSupply: 3500000,
    poeRewardsRemaining: 59952176.55,
  });

  const [burnEvents, setBurnEvents] = useState<BurnEvent[]>([]);
  const [totalBurned, setTotalBurned] = useState(47823.45);
  const [burnRate, setBurnRate] = useState(0);
  const [energyIndex, setEnergyIndex] = useState({ kaus: 127.5, global: 100 });

  const [seedCapital, setSeedCapital] = useState<SeedCapitalValue>({
    initialInvestment: 100000,
    currentValue: 0,
    kausHoldings: 1000000,
    unrealizedGain: 0,
    roi: 0,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const burnCanvasRef = useRef<HTMLCanvasElement>(null);

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Price fluctuation
      setPrice(prev => {
        const change = (Math.random() - 0.4) * 0.005;
        const newUsd = prev.usd * (1 + change);
        return {
          ...prev,
          usd: newUsd,
          krw: newUsd * 1320.50,
          change24h: prev.change24h + (Math.random() - 0.4) * 0.5,
          marketCap: newUsd * supply.circulatingSupply,
        };
      });

      // Burn events
      if (Math.random() > 0.7) {
        const burnAmount = Math.random() * 10 + 0.1;
        const newBurn: BurnEvent = {
          id: `BURN-${Date.now()}`,
          timestamp: Date.now(),
          amount: burnAmount,
          source: ['VERIFICATION', 'SWAP', 'COMPLIANCE', 'M2M_PAYMENT'][Math.floor(Math.random() * 4)],
        };
        setBurnEvents(prev => [newBurn, ...prev.slice(0, 19)]);
        setTotalBurned(prev => prev + burnAmount);
        setSupply(prev => ({
          ...prev,
          burnedSupply: prev.burnedSupply + burnAmount,
          circulatingSupply: prev.circulatingSupply - burnAmount,
        }));
      }

      // Energy index
      setEnergyIndex(prev => ({
        kaus: prev.kaus + (Math.random() - 0.4) * 0.5,
        global: prev.global + (Math.random() - 0.5) * 0.2,
      }));

      // Calculate burn rate (24h projected)
      setBurnRate(prev => prev + (Math.random() - 0.3) * 0.1);
    }, 2000);

    return () => clearInterval(interval);
  }, [supply.circulatingSupply]);

  // Update seed capital value
  useEffect(() => {
    const currentValue = seedCapital.kausHoldings * price.usd;
    const unrealizedGain = currentValue - seedCapital.initialInvestment;
    const roi = ((currentValue - seedCapital.initialInvestment) / seedCapital.initialInvestment) * 100;

    setSeedCapital(prev => ({
      ...prev,
      currentValue,
      unrealizedGain,
      roi,
    }));
  }, [price.usd, seedCapital.kausHoldings, seedCapital.initialInvestment]);

  // K-AUS vs Energy Index Chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Generate data points
    const kausData: number[] = [];
    const globalData: number[] = [];
    let kausVal = 100;
    let globalVal = 100;

    for (let i = 0; i < 60; i++) {
      kausVal = kausVal * (1 + (Math.random() - 0.35) * 0.03);
      globalVal = globalVal * (1 + (Math.random() - 0.5) * 0.015);
      kausData.push(kausVal);
      globalData.push(globalVal);
    }

    // Draw grid
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const maxVal = Math.max(...kausData, ...globalData) * 1.1;
    const minVal = Math.min(...kausData, ...globalData) * 0.9;
    const scaleY = (val: number) => height - ((val - minVal) / (maxVal - minVal)) * height;

    // Draw Global Energy Index
    ctx.beginPath();
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    globalData.forEach((val, i) => {
      const x = (i / (globalData.length - 1)) * width;
      const y = scaleY(val);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw K-AUS Index
    ctx.beginPath();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    kausData.forEach((val, i) => {
      const x = (i / (kausData.length - 1)) * width;
      const y = scaleY(val);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Glow effect
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Labels
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`K-AUS: ${energyIndex.kaus.toFixed(1)}`, 10, 20);
    ctx.fillStyle = '#666666';
    ctx.fillText(`Global: ${energyIndex.global.toFixed(1)}`, 10, 40);
  }, [energyIndex]);

  // Burn animation
  useEffect(() => {
    const canvas = burnCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const particles: Array<{ x: number; y: number; vx: number; vy: number; life: number; size: number }> = [];
    let animationId: number;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      // Add particles for recent burns
      if (burnEvents.length > 0 && Math.random() > 0.8) {
        const centerX = canvas.offsetWidth / 2;
        const centerY = canvas.offsetHeight / 2;
        for (let i = 0; i < 3; i++) {
          particles.push({
            x: centerX + (Math.random() - 0.5) * 40,
            y: centerY,
            vx: (Math.random() - 0.5) * 4,
            vy: -Math.random() * 3 - 2,
            life: 1,
            size: Math.random() * 4 + 2,
          });
        }
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, `rgba(251, 146, 60, ${p.life})`);
        gradient.addColorStop(0.5, `rgba(234, 88, 12, ${p.life * 0.5})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationId);
  }, [burnEvents]);

  const formatNumber = (num: number, decimals = 2) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
    return num.toFixed(decimals);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-900 via-orange-900 to-amber-900 border-b border-amber-600">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <span className="text-4xl">🪙</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-200 to-orange-400 bg-clip-text text-transparent">
                  K-AUS
                </h1>
                <p className="text-amber-300">The Global Energy Reserve Currency</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-4xl font-bold">${price.usd.toFixed(4)}</div>
                <div className={`text-sm ${price.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {price.change24h >= 0 ? '↑' : '↓'} {Math.abs(price.change24h).toFixed(2)}% (24h)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Real-time Burn Counter - HERO */}
        <div className="bg-gradient-to-br from-orange-900/50 to-red-900/50 rounded-3xl p-8 mb-8 border border-orange-600/50 relative overflow-hidden">
          <canvas ref={burnCanvasRef} className="absolute inset-0 w-full h-full opacity-50" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-orange-400 flex items-center gap-2">
                  🔥 Real-time Burn Counter
                </h2>
                <p className="text-gray-400">10% of all fees burned permanently</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Deflation Rate</div>
                <div className="text-xl font-mono">
                  {((supply.burnedSupply / MAX_SUPPLY) * 100).toFixed(4)}%
                </div>
              </div>
            </div>

            <div className="text-center py-8">
              <div className="text-6xl font-bold text-orange-400 font-mono">
                {totalBurned.toFixed(4)}
              </div>
              <div className="text-xl text-gray-400 mt-2">K-AUS Burned Forever</div>

              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="bg-black/40 rounded-xl p-4">
                  <div className="text-2xl font-bold">{formatNumber(supply.burnedSupply)}</div>
                  <div className="text-sm text-gray-400">Total Burned</div>
                </div>
                <div className="bg-black/40 rounded-xl p-4">
                  <div className="text-2xl font-bold text-green-400">~{formatNumber(burnRate * 365)}</div>
                  <div className="text-sm text-gray-400">Projected Annual Burn</div>
                </div>
                <div className="bg-black/40 rounded-xl p-4">
                  <div className="text-2xl font-bold">{burnEvents.length}</div>
                  <div className="text-sm text-gray-400">Burns Today</div>
                </div>
              </div>
            </div>

            {/* Live burn feed */}
            <div className="mt-6 max-h-32 overflow-y-auto space-y-1">
              {burnEvents.slice(0, 5).map((burn, idx) => (
                <div
                  key={burn.id}
                  className="flex items-center justify-between px-3 py-2 bg-black/30 rounded-lg text-sm"
                  style={{ opacity: 1 - idx * 0.15 }}
                >
                  <span className="text-orange-400">🔥 BURN</span>
                  <span className="font-mono">{burn.amount.toFixed(6)} K-AUS</span>
                  <span className="text-gray-500">{burn.source}</span>
                  <span className="text-gray-600 text-xs">
                    {new Date(burn.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* K-AUS vs Global Energy Index */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              📈 K-AUS vs Global Energy Index
            </h3>
            <canvas ref={canvasRef} className="w-full h-48 rounded-xl" />
            <div className="flex justify-between mt-4 text-sm">
              <div>
                <span className="inline-block w-3 h-3 rounded-full bg-amber-500 mr-2" />
                K-AUS Index: <span className="font-bold text-amber-400">{energyIndex.kaus.toFixed(1)}</span>
              </div>
              <div>
                <span className="inline-block w-3 h-3 rounded-full bg-gray-500 mr-2" />
                Global Energy: <span className="font-bold">{energyIndex.global.toFixed(1)}</span>
              </div>
              <div className="text-green-400">
                Outperformance: +{((energyIndex.kaus / energyIndex.global - 1) * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Seed Capital Value */}
          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-2xl p-6 border border-green-700">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              💰 Seed Capital Value Tracker
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/40 rounded-xl p-4">
                <div className="text-sm text-gray-400">Initial Investment</div>
                <div className="text-2xl font-bold">${formatNumber(seedCapital.initialInvestment)}</div>
              </div>
              <div className="bg-black/40 rounded-xl p-4">
                <div className="text-sm text-gray-400">K-AUS Holdings</div>
                <div className="text-2xl font-bold">{formatNumber(seedCapital.kausHoldings)}</div>
              </div>
              <div className="bg-green-900/50 rounded-xl p-4 border border-green-700">
                <div className="text-sm text-green-400">Current Value</div>
                <div className="text-3xl font-bold text-green-400">${formatNumber(seedCapital.currentValue)}</div>
              </div>
              <div className="bg-black/40 rounded-xl p-4">
                <div className="text-sm text-gray-400">ROI</div>
                <div className={`text-3xl font-bold ${seedCapital.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {seedCapital.roi >= 0 ? '+' : ''}{seedCapital.roi.toFixed(1)}%
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-black/30 rounded-xl">
              <div className="text-center">
                <span className="text-gray-400">Unrealized Gain: </span>
                <span className={`text-xl font-bold ${seedCapital.unrealizedGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {seedCapital.unrealizedGain >= 0 ? '+' : ''}${formatNumber(seedCapital.unrealizedGain)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Supply Distribution */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold">{formatNumber(supply.totalSupply)}</div>
            <div className="text-sm text-gray-400">Max Supply</div>
          </div>
          <div className="bg-blue-900/30 rounded-xl p-4 text-center border border-blue-700">
            <div className="text-3xl font-bold text-blue-400">{formatNumber(supply.circulatingSupply)}</div>
            <div className="text-sm text-gray-400">Circulating</div>
          </div>
          <div className="bg-purple-900/30 rounded-xl p-4 text-center border border-purple-700">
            <div className="text-3xl font-bold text-purple-400">{formatNumber(supply.stakingSupply)}</div>
            <div className="text-sm text-gray-400">Staking</div>
          </div>
          <div className="bg-orange-900/30 rounded-xl p-4 text-center border border-orange-700">
            <div className="text-3xl font-bold text-orange-400">{formatNumber(supply.burnedSupply)}</div>
            <div className="text-sm text-gray-400">Burned</div>
          </div>
          <div className="bg-green-900/30 rounded-xl p-4 text-center border border-green-700">
            <div className="text-3xl font-bold text-green-400">{formatNumber(supply.poeRewardsRemaining)}</div>
            <div className="text-sm text-gray-400">PoE Rewards Left</div>
          </div>
        </div>

        {/* Tokenomics Summary */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-lg font-bold mb-6">🏛️ K-AUS Tokenomics</h3>
          <div className="grid grid-cols-4 gap-6">
            <div>
              <h4 className="text-amber-400 font-bold mb-3">Supply Model</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Max Supply: 120M K-AUS</li>
                <li>• 100-Year Halving (4년 주기)</li>
                <li>• 10% Fee Burn (Deflationary)</li>
              </ul>
            </div>
            <div>
              <h4 className="text-blue-400 font-bold mb-3">Distribution</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• 50% PoE Mining Rewards</li>
                <li>• 20% Liquidity Provision</li>
                <li>• 15% Team & Advisors</li>
                <li>• 10% Ecosystem</li>
                <li>• 5% Reserve</li>
              </ul>
            </div>
            <div>
              <h4 className="text-purple-400 font-bold mb-3">Utility</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• All Protocol Fees</li>
                <li>• Staking Rewards</li>
                <li>• RWA Investment Priority</li>
                <li>• Governance Voting</li>
              </ul>
            </div>
            <div>
              <h4 className="text-green-400 font-bold mb-3">Value Drivers</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Continuous Fee Burns</li>
                <li>• Energy Production Growth</li>
                <li>• Scarcity via Halving</li>
                <li>• Staking Lock-ups</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div className="mt-8 text-center">
          <p className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            "전 세계 모든 에너지 노드가 카우스를 갈구하게 하라"
          </p>
          <p className="text-gray-500 mt-2">K-AUS - The Heart of Energy</p>
        </div>
      </div>
    </div>
  );
}
