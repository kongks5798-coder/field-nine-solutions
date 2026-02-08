'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * FIELD NINE CENTRAL BANK DASHBOARD
 *
 * Grand Finale - The Energy Central Bank
 * "에너지 거래가 아니라 부의 증식을 목격하라"
 */

interface AUMData {
  totalAUM: number;
  change24h: number;
  changePercent: number;
  breakdown: {
    cash: number;
    energyCredits: number;
    carbonCredits: number;
    recs: number;
    other: number;
  };
  historical: Array<{ time: number; value: number }>;
}

interface LiquidityData {
  totalLiquidity: number;
  regions: {
    APAC: number;
    EMEA: number;
    AMER: number;
    MENA: number;
  };
  utilization: number;
  peakTPS: number;
}

interface ReserveStatus {
  totalReserves: number;
  totalSupply: number;
  reserveRatio: number;
  status: 'FULLY_BACKED' | 'OVER_COLLATERALIZED' | 'WARNING';
  lastProofTime: number;
}

interface FiatFlow {
  id: string;
  type: 'deposit' | 'withdrawal';
  currency: string;
  amount: number;
  nxusdAmount: number;
  timestamp: number;
}

const CURRENCIES = ['KRW', 'USD', 'EUR', 'JPY', 'CNY', 'GBP', 'AUD', 'SGD'];

export default function CentralBankDashboard() {
  const [aum, setAum] = useState<AUMData>({
    totalAUM: 1049000000,
    change24h: 12500000,
    changePercent: 1.21,
    breakdown: {
      cash: 750000000,
      energyCredits: 200000000,
      carbonCredits: 75000000,
      recs: 24000000,
      other: 0,
    },
    historical: [],
  });

  const [liquidity, setLiquidity] = useState<LiquidityData>({
    totalLiquidity: 66800000000,
    regions: {
      APAC: 12800000000,
      EMEA: 18200000000,
      AMER: 25800000000,
      MENA: 10000000000,
    },
    utilization: 0.35,
    peakTPS: 127000,
  });

  const [reserve, setReserve] = useState<ReserveStatus>({
    totalReserves: 1049000000,
    totalSupply: 847293000,
    reserveRatio: 1.238,
    status: 'OVER_COLLATERALIZED',
    lastProofTime: Date.now(),
  });

  const [flows, setFlows] = useState<FiatFlow[]>([]);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({
    KRW: 1320.50,
    USD: 1.0,
    EUR: 0.92,
    JPY: 149.80,
    CNY: 7.24,
    GBP: 0.79,
    AUD: 1.53,
    SGD: 1.34,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Generate historical AUM data
  useEffect(() => {
    const historical: Array<{ time: number; value: number }> = [];
    const now = Date.now();
    let value = 800000000;

    for (let i = 30; i >= 0; i--) {
      value = value * (1 + (Math.random() - 0.3) * 0.02);
      historical.push({
        time: now - i * 24 * 60 * 60 * 1000,
        value,
      });
    }
    historical[historical.length - 1].value = aum.totalAUM;

    setAum(prev => ({ ...prev, historical }));
  }, []);

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update AUM with small fluctuation
      setAum(prev => {
        const change = prev.totalAUM * (Math.random() - 0.4) * 0.001;
        return {
          ...prev,
          totalAUM: prev.totalAUM + change,
          change24h: prev.change24h + change * 0.1,
          changePercent: ((prev.change24h + change * 0.1) / (prev.totalAUM - prev.change24h)) * 100,
        };
      });

      // Update liquidity
      setLiquidity(prev => ({
        ...prev,
        totalLiquidity: prev.totalLiquidity * (1 + (Math.random() - 0.5) * 0.001),
        utilization: Math.min(0.9, Math.max(0.2, prev.utilization + (Math.random() - 0.5) * 0.02)),
      }));

      // Update reserve
      setReserve(prev => ({
        ...prev,
        reserveRatio: prev.reserveRatio + (Math.random() - 0.5) * 0.001,
        lastProofTime: Date.now(),
      }));

      // Update exchange rates
      setExchangeRates(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(currency => {
          if (currency !== 'USD') {
            updated[currency] = updated[currency] * (1 + (Math.random() - 0.5) * 0.002);
          }
        });
        return updated;
      });

      // Add random flow
      if (Math.random() > 0.7) {
        const newFlow: FiatFlow = {
          id: `FLOW-${Date.now()}`,
          type: Math.random() > 0.4 ? 'deposit' : 'withdrawal',
          currency: CURRENCIES[Math.floor(Math.random() * CURRENCIES.length)],
          amount: Math.floor(Math.random() * 5000000) + 10000,
          nxusdAmount: Math.floor(Math.random() * 5000000) + 10000,
          timestamp: Date.now(),
        };
        setFlows(prev => [newFlow, ...prev.slice(0, 19)]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Canvas animation for liquidity flow
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
    }> = [];

    const colors = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b'];

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width / 2, canvas.height / 2);

      // Add new particles
      if (particles.length < 100 && Math.random() > 0.7) {
        particles.push({
          x: Math.random() * canvas.width / 2,
          y: canvas.height / 2,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 3 - 1,
          size: Math.random() * 3 + 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
        });
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.01;

        if (p.alpha <= 0 || p.y < 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const formatCurrency = (value: number, decimals = 0) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(decimals)}K`;
    return `$${value.toFixed(decimals)}`;
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(Math.round(value));
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <canvas ref={canvasRef} className="w-full h-full opacity-30" />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-900/80 via-amber-900/80 to-yellow-900/80 border-b border-yellow-600/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                  <span className="text-4xl">🏛️</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-200 to-amber-400 bg-clip-text text-transparent">
                    FIELD NINE CENTRAL BANK
                  </h1>
                  <p className="text-yellow-300/80">The Energy Central Bank • Global FIAT Clearing</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className={`px-4 py-2 rounded-full ${
                  reserve.status === 'OVER_COLLATERALIZED'
                    ? 'bg-green-500/20 border border-green-500 text-green-400'
                    : 'bg-yellow-500/20 border border-yellow-500 text-yellow-400'
                }`}>
                  <span className="text-sm font-mono">
                    {reserve.status === 'OVER_COLLATERALIZED' ? '✓' : '!'} {(reserve.reserveRatio * 100).toFixed(1)}% BACKED
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Last ZK Proof</div>
                  <div className="font-mono text-sm">
                    {new Date(reserve.lastProofTime).toISOString().split('T')[1].split('.')[0]}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* AUM Hero Section */}
          <div className="bg-gradient-to-br from-yellow-900/40 to-amber-900/40 rounded-3xl p-8 mb-8 border border-yellow-600/30 backdrop-blur-lg">
            <div className="text-center mb-8">
              <div className="text-sm text-yellow-400/80 mb-2">GLOBAL ASSETS UNDER MANAGEMENT</div>
              <div className="text-7xl font-bold bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
                {formatCurrency(aum.totalAUM)}
              </div>
              <div className={`text-xl mt-2 ${aum.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {aum.change24h >= 0 ? '↑' : '↓'} {formatCurrency(Math.abs(aum.change24h))} ({aum.changePercent.toFixed(2)}%)
                <span className="text-gray-400 text-sm ml-2">24h</span>
              </div>
            </div>

            {/* AUM Breakdown */}
            <div className="grid grid-cols-5 gap-4">
              {[
                { label: 'Cash Reserves', value: aum.breakdown.cash, color: 'from-green-500 to-emerald-600', icon: '💵' },
                { label: 'Energy Credits', value: aum.breakdown.energyCredits, color: 'from-blue-500 to-cyan-600', icon: '⚡' },
                { label: 'Carbon Credits', value: aum.breakdown.carbonCredits, color: 'from-purple-500 to-violet-600', icon: '🌱' },
                { label: 'RECs', value: aum.breakdown.recs, color: 'from-yellow-500 to-orange-600', icon: '☀️' },
                { label: 'Other Assets', value: aum.breakdown.other, color: 'from-gray-500 to-slate-600', icon: '📦' },
              ].map((item, idx) => (
                <div key={idx} className="bg-black/40 rounded-xl p-4 text-center">
                  <span className="text-2xl">{item.icon}</span>
                  <div className="text-xs text-gray-400 mt-1">{item.label}</div>
                  <div className={`text-lg font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                    {formatCurrency(item.value)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {((item.value / aum.totalAUM) * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Real-time FIAT Liquidity */}
            <div className="col-span-2 bg-gray-900/80 rounded-2xl p-6 backdrop-blur-lg border border-gray-800">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">💧</span>
                Real-time FIAT Liquidity
              </h2>

              <div className="text-4xl font-bold text-blue-400 mb-4">
                {formatCurrency(liquidity.totalLiquidity)}
              </div>

              <div className="grid grid-cols-4 gap-4 mb-6">
                {Object.entries(liquidity.regions).map(([region, value]) => (
                  <div key={region} className="bg-black/40 rounded-xl p-4">
                    <div className="text-sm text-gray-400">{region}</div>
                    <div className="text-xl font-bold">{formatCurrency(value)}</div>
                    <div className="h-2 bg-gray-800 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          region === 'APAC' ? 'bg-cyan-500' :
                          region === 'EMEA' ? 'bg-blue-500' :
                          region === 'AMER' ? 'bg-purple-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${(value / liquidity.totalLiquidity) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between bg-black/30 rounded-xl p-4">
                <div>
                  <div className="text-sm text-gray-400">Pool Utilization</div>
                  <div className="text-2xl font-bold">{(liquidity.utilization * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Peak TPS</div>
                  <div className="text-2xl font-bold">{formatNumber(liquidity.peakTPS)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Avg Slippage</div>
                  <div className="text-2xl font-bold text-green-400">0.0015%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Max Order</div>
                  <div className="text-2xl font-bold">$10B</div>
                </div>
              </div>
            </div>

            {/* Exchange Rates */}
            <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur-lg border border-gray-800">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">💱</span>
                NXUSD Exchange Rates
              </h2>

              <div className="space-y-3">
                {Object.entries(exchangeRates).map(([currency, rate]) => (
                  <div key={currency} className="flex items-center justify-between bg-black/40 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {currency === 'KRW' ? '🇰🇷' :
                         currency === 'USD' ? '🇺🇸' :
                         currency === 'EUR' ? '🇪🇺' :
                         currency === 'JPY' ? '🇯🇵' :
                         currency === 'CNY' ? '🇨🇳' :
                         currency === 'GBP' ? '🇬🇧' :
                         currency === 'AUD' ? '🇦🇺' : '🇸🇬'}
                      </span>
                      <span className="font-mono">{currency}</span>
                    </div>
                    <div className="font-mono text-right">
                      <div>{rate.toFixed(currency === 'USD' ? 4 : 2)}</div>
                      <div className={`text-xs ${Math.random() > 0.5 ? 'text-green-400' : 'text-red-400'}`}>
                        {Math.random() > 0.5 ? '+' : '-'}{(Math.random() * 0.5).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live FIAT Flows */}
          <div className="mt-6 bg-gray-900/80 rounded-2xl p-6 backdrop-blur-lg border border-gray-800">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">📊</span>
              Live FIAT Flows
              <span className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </h2>

            <div className="overflow-hidden">
              <div className="space-y-2">
                {flows.slice(0, 8).map((flow, idx) => (
                  <div
                    key={flow.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      flow.type === 'deposit'
                        ? 'bg-green-900/30 border-l-4 border-green-500'
                        : 'bg-red-900/30 border-l-4 border-red-500'
                    }`}
                    style={{
                      opacity: 1 - idx * 0.1,
                      transform: `translateX(${idx === 0 ? '0' : '0'})`,
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xl">
                        {flow.type === 'deposit' ? '📥' : '📤'}
                      </span>
                      <div>
                        <div className="font-mono">
                          {flow.type === 'deposit' ? 'DEPOSIT' : 'WITHDRAWAL'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(flow.timestamp).toISOString().split('T')[1].split('.')[0]}
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-mono">
                        {formatCurrency(flow.amount, 0)} {flow.currency}
                      </div>
                      <div className="text-xs text-gray-400">
                        → {formatCurrency(flow.nxusdAmount, 0)} NXUSD
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs ${
                      flow.type === 'deposit' ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300'
                    }`}>
                      COMPLETED
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reserve Status */}
          <div className="mt-6 bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-2xl p-6 border border-green-600/30 backdrop-blur-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="text-2xl">🔒</span>
                  Zero-Knowledge Proof of Reserve
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  외부 감사 없이도 누구나 검증 가능한 실시간 잔고 증명
                </p>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-bold ${
                  reserve.reserveRatio >= 1 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {(reserve.reserveRatio * 100).toFixed(2)}%
                </div>
                <div className="text-sm text-gray-400">Reserve Ratio</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="bg-black/40 rounded-xl p-4">
                <div className="text-sm text-gray-400">Total Reserves</div>
                <div className="text-2xl font-bold text-green-400">
                  {formatCurrency(reserve.totalReserves)}
                </div>
              </div>
              <div className="bg-black/40 rounded-xl p-4">
                <div className="text-sm text-gray-400">NXUSD Supply</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(reserve.totalSupply)}
                </div>
              </div>
              <div className="bg-black/40 rounded-xl p-4">
                <div className="text-sm text-gray-400">Excess Reserves</div>
                <div className="text-2xl font-bold text-green-400">
                  {formatCurrency(reserve.totalReserves - reserve.totalSupply)}
                </div>
              </div>
              <div className="bg-black/40 rounded-xl p-4">
                <div className="text-sm text-gray-400">Status</div>
                <div className={`text-2xl font-bold ${
                  reserve.status === 'OVER_COLLATERALIZED' ? 'text-green-400' :
                  reserve.status === 'FULLY_BACKED' ? 'text-blue-400' : 'text-yellow-400'
                }`}>
                  {reserve.status.replace('_', ' ')}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <button className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold transition-colors">
                🔍 Verify ZK Proof
              </button>
              <button className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold transition-colors">
                📄 Download Audit Report
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-black/80 border-t border-gray-800 py-6 mt-8">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-gray-400 text-sm">
              Field Nine Central Bank • The Energy Central Bank
            </p>
            <p className="text-gray-500 text-xs mt-1">
              "에너지의 가치를 발행하고 정산하는 유일한 은행"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
