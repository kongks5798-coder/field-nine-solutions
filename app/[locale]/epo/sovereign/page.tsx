'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * SOVEREIGN WALLET
 *
 * 필드나인 유니버스의 모든 자산이 통합된 최종 대시보드
 * - Total Net Worth 위젯
 * - 에너지 노드 지분
 * - K-AUS 잔액
 * - 예상 배당금
 * - 카드 사용 가능 금액
 */

interface NetWorthBreakdown {
  category: string;
  label: string;
  valueUSD: number;
  percentage: number;
  change24h: number;
}

interface NetWorth {
  totalNetWorthUSD: number;
  totalNetWorthKRW: number;
  change24h: number;
  change24hPercentage: number;
  breakdown: NetWorthBreakdown[];
  liquidAssets: number;
  illiquidAssets: number;
  cardSpendingPower: number;
  monthlyPassiveIncome: number;
  projectedAnnualDividends: number;
}

interface EnergyNode {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  location: string;
  ownershipPercentage: number;
  currentValueUSD: number;
  monthlyDividendKaus: number;
  status: string;
}

interface MiniNode {
  nodeId: string;
  deviceName: string;
  deviceType: string;
  status: string;
  todayKausEarned: number;
  totalKausEarned: number;
}

interface DividendProjection {
  source: string;
  category: string;
  nextPaymentDate: number;
  amountKaus: number;
  amountUSD: number;
}

interface CardAccount {
  cardTier: string;
  cardNumber: string;
  fiatBalance: { USD: number; KRW: number; EUR: number };
  kausBalance: number;
  totalCashbackEarned: number;
}

// Mock data generator
const generateMockData = () => {
  const netWorth: NetWorth = {
    totalNetWorthUSD: 1_285_750,
    totalNetWorthKRW: 1_698_000_000,
    change24h: 15_420,
    change24hPercentage: 1.21,
    breakdown: [
      { category: 'KAUS_LIQUID', label: 'K-AUS (유동)', valueUSD: 375000, percentage: 29.2, change24h: 5200 },
      { category: 'ENERGY_NODE', label: '에너지 노드', valueUSD: 322000, percentage: 25.0, change24h: 1800 },
      { category: 'KAUS_STAKED', label: 'K-AUS (스테이킹)', valueUSD: 225000, percentage: 17.5, change24h: 3100 },
      { category: 'RWA_INVESTMENT', label: '실물자산', valueUSD: 197500, percentage: 15.4, change24h: 2500 },
      { category: 'CARD_BALANCE', label: '카드 잔액', valueUSD: 125000, percentage: 9.7, change24h: 0 },
      { category: 'COMPUTE_CREDIT', label: '연산 크레딧', valueUSD: 30380, percentage: 2.4, change24h: 1520 },
      { category: 'MINI_NODE', label: '미니노드 수익', valueUSD: 10870, percentage: 0.8, change24h: 1300 },
    ],
    liquidAssets: 500000,
    illiquidAssets: 744500,
    cardSpendingPower: 712500,
    monthlyPassiveIncome: 8750,
    projectedAnnualDividends: 105000,
  };

  const energyNodes: EnergyNode[] = [
    { nodeId: 'SOLAR-JEJU-001', nodeName: 'Jeju Solar Farm Alpha', nodeType: 'SOLAR', location: 'Jeju, KR', ownershipPercentage: 2.5, currentValueUSD: 156000, monthlyDividendKaus: 850, status: 'ACTIVE' },
    { nodeId: 'WIND-TEXAS-001', nodeName: 'Texas Wind Corridor', nodeType: 'WIND', location: 'Texas, US', ownershipPercentage: 1.2, currentValueUSD: 97500, monthlyDividendKaus: 420, status: 'ACTIVE' },
    { nodeId: 'HYDRO-NORWAY-001', nodeName: 'Nordic Hydro Station', nodeType: 'HYDRO', location: 'Bergen, NO', ownershipPercentage: 0.8, currentValueUSD: 68500, monthlyDividendKaus: 310, status: 'ACTIVE' },
  ];

  const miniNodes: MiniNode[] = [
    { nodeId: 'MINI-LAPTOP-001', deviceName: 'MacBook Pro Work', deviceType: 'LAPTOP', status: 'ACTIVE', todayKausEarned: 0.85, totalKausEarned: 127.5 },
    { nodeId: 'MINI-DESKTOP-001', deviceName: 'Home Gaming PC', deviceType: 'DESKTOP', status: 'SLEEPING', todayKausEarned: 2.15, totalKausEarned: 485.2 },
    { nodeId: 'MINI-PHONE-001', deviceName: 'iPhone 16 Pro', deviceType: 'SMARTPHONE', status: 'PAUSED', todayKausEarned: 0.12, totalKausEarned: 15.8 },
  ];

  const dividends: DividendProjection[] = [
    { source: 'K-AUS Staking Rewards', category: 'KAUS_STAKED', nextPaymentDate: Date.now() + 3 * 24 * 60 * 60 * 1000, amountKaus: 12500, amountUSD: 1875 },
    { source: 'Jeju Solar Farm Alpha', category: 'ENERGY_NODE', nextPaymentDate: Date.now() + 8 * 24 * 60 * 60 * 1000, amountKaus: 850, amountUSD: 127.5 },
    { source: 'Texas Wind Corridor', category: 'ENERGY_NODE', nextPaymentDate: Date.now() + 12 * 24 * 60 * 60 * 1000, amountKaus: 420, amountUSD: 63 },
    { source: 'Dubai Marina Tower', category: 'RWA_INVESTMENT', nextPaymentDate: Date.now() + 15 * 24 * 60 * 60 * 1000, amountKaus: 25833, amountUSD: 3875 },
  ];

  const cardAccount: CardAccount = {
    cardTier: 'SOVEREIGN',
    cardNumber: '**** **** **** 9999',
    fiatBalance: { USD: 125000, KRW: 165000000, EUR: 115000 },
    kausBalance: 2500000,
    totalCashbackEarned: 12500,
  };

  return { netWorth, energyNodes, miniNodes, dividends, cardAccount };
};

export default function SovereignWalletPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState(generateMockData());
  const [animatedNetWorth, setAnimatedNetWorth] = useState(0);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'assets' | 'income' | 'card'>('overview');

  // Animate net worth counter
  useEffect(() => {
    const target = data.netWorth.totalNetWorthUSD;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setAnimatedNetWorth(target);
        clearInterval(timer);
      } else {
        setAnimatedNetWorth(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [data.netWorth.totalNetWorthUSD]);

  // Draw allocation pie chart
  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;

    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Colors for categories
    const colors: Record<string, string> = {
      KAUS_LIQUID: '#f59e0b',
      ENERGY_NODE: '#22c55e',
      KAUS_STAKED: '#3b82f6',
      RWA_INVESTMENT: '#8b5cf6',
      CARD_BALANCE: '#ec4899',
      COMPUTE_CREDIT: '#06b6d4',
      MINI_NODE: '#ef4444',
    };

    // Draw pie slices
    let startAngle = -Math.PI / 2;
    data.netWorth.breakdown.forEach(item => {
      const sliceAngle = (item.percentage / 100) * 2 * Math.PI;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[item.category] || '#666';
      ctx.fill();

      // Add slight border
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();

      startAngle += sliceAngle;
    });

    // Draw inner circle (donut hole)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI);
    ctx.fillStyle = '#0a0a0a';
    ctx.fill();

    // Center text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Total', centerX, centerY - 10);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`$${(data.netWorth.totalNetWorthUSD / 1000000).toFixed(2)}M`, centerX, centerY + 15);
  }, [data.netWorth]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  const categoryColors: Record<string, string> = {
    KAUS_LIQUID: '#f59e0b',
    ENERGY_NODE: '#22c55e',
    KAUS_STAKED: '#3b82f6',
    RWA_INVESTMENT: '#8b5cf6',
    CARD_BALANCE: '#ec4899',
    COMPUTE_CREDIT: '#06b6d4',
    MINI_NODE: '#ef4444',
  };

  const nodeTypeIcons: Record<string, string> = {
    SOLAR: '☀️',
    WIND: '💨',
    HYDRO: '💧',
    NUCLEAR: '⚛️',
    GEOTHERMAL: '🌋',
  };

  const deviceTypeIcons: Record<string, string> = {
    LAPTOP: '💻',
    DESKTOP: '🖥️',
    SMARTPHONE: '📱',
    TABLET: '📲',
    SERVER: '🖲️',
  };

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-500',
    SLEEPING: 'bg-blue-500',
    PAUSED: 'bg-yellow-500',
    OFFLINE: 'bg-gray-500',
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-600 rounded-xl flex items-center justify-center text-3xl shadow-lg shadow-amber-500/30">
            👑
          </div>
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 bg-clip-text text-transparent">
              SOVEREIGN WALLET
            </h1>
            <p className="text-gray-400">Your Unified Wealth Overview</p>
          </div>
        </div>
      </div>

      {/* Total Net Worth Hero */}
      <div className="bg-gradient-to-r from-amber-900/30 via-yellow-900/20 to-orange-900/30 border border-amber-500/30 rounded-2xl p-8 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Net Worth Display */}
          <div>
            <div className="text-sm text-gray-400 mb-2">TOTAL NET WORTH</div>
            <div className="text-5xl font-black text-white mb-2">
              ${animatedNetWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-2xl text-gray-400 mb-4">
              ₩{data.netWorth.totalNetWorthKRW.toLocaleString()}
            </div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              data.netWorth.change24h >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {data.netWorth.change24h >= 0 ? '↗' : '↘'}
              ${Math.abs(data.netWorth.change24h).toLocaleString()} ({data.netWorth.change24hPercentage.toFixed(2)}%)
              <span className="text-gray-500">24h</span>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-black/30 rounded-lg p-4">
                <div className="text-sm text-gray-500">Liquid Assets</div>
                <div className="text-xl font-bold text-green-400">
                  ${data.netWorth.liquidAssets.toLocaleString()}
                </div>
              </div>
              <div className="bg-black/30 rounded-lg p-4">
                <div className="text-sm text-gray-500">Illiquid Assets</div>
                <div className="text-xl font-bold text-blue-400">
                  ${data.netWorth.illiquidAssets.toLocaleString()}
                </div>
              </div>
              <div className="bg-black/30 rounded-lg p-4">
                <div className="text-sm text-gray-500">Spending Power</div>
                <div className="text-xl font-bold text-purple-400">
                  ${data.netWorth.cardSpendingPower.toLocaleString()}
                </div>
              </div>
              <div className="bg-black/30 rounded-lg p-4">
                <div className="text-sm text-gray-500">Monthly Income</div>
                <div className="text-xl font-bold text-amber-400">
                  ${data.netWorth.monthlyPassiveIncome.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Allocation Chart */}
          <div className="flex flex-col items-center">
            <canvas ref={canvasRef} width={280} height={280} />
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {data.netWorth.breakdown.slice(0, 5).map(item => (
                <div key={item.category} className="flex items-center gap-1 text-xs">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: categoryColors[item.category] }}
                  />
                  <span className="text-gray-400">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-800 pb-4">
        {[
          { id: 'overview', label: '📊 Overview' },
          { id: 'assets', label: '💎 Assets' },
          { id: 'income', label: '💰 Income' },
          { id: 'card', label: '💳 Card' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedTab === tab.id
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Asset Breakdown */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">💎 Asset Breakdown</h2>
            <div className="space-y-3">
              {data.netWorth.breakdown.map(item => (
                <div key={item.category} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: categoryColors[item.category] }}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">{item.label}</span>
                      <span className="text-sm font-bold">
                        ${item.valueUSD.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: categoryColors[item.category],
                        }}
                      />
                    </div>
                  </div>
                  <span className={`text-xs ${item.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {item.change24h >= 0 ? '+' : ''}{item.change24h.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Dividends */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">📅 Upcoming Dividends</h2>
            <div className="space-y-3">
              {data.dividends.map((div, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-sm">{div.source}</div>
                    <div className="text-xs text-gray-500">
                      {Math.ceil((div.nextPaymentDate - Date.now()) / (24 * 60 * 60 * 1000))} days
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-amber-400 font-bold">
                      {div.amountKaus.toLocaleString()} K-AUS
                    </div>
                    <div className="text-xs text-gray-500">
                      ${div.amountUSD.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-3 border-t border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total (30 days)</span>
                  <span className="text-xl font-black text-green-400">
                    ${data.dividends.reduce((sum, d) => sum + d.amountUSD, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mini Nodes */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">🖥️ Mini Nodes</h2>
            <div className="space-y-3">
              {data.miniNodes.map(node => (
                <div
                  key={node.nodeId}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{deviceTypeIcons[node.deviceType]}</span>
                    <div>
                      <div className="font-medium text-sm">{node.deviceName}</div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${statusColors[node.status]}`} />
                        <span className="text-xs text-gray-500">{node.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold">
                      +{node.todayKausEarned.toFixed(2)} K-AUS
                    </div>
                    <div className="text-xs text-gray-500">today</div>
                  </div>
                </div>
              ))}

              <div className="pt-3 border-t border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Earned</span>
                  <span className="text-lg font-bold text-cyan-400">
                    {data.miniNodes.reduce((sum, n) => sum + n.totalKausEarned, 0).toFixed(1)} K-AUS
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Energy Nodes */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">⚡ Energy Node Stakes</h2>
            <div className="space-y-3">
              {data.energyNodes.map(node => (
                <div
                  key={node.nodeId}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{nodeTypeIcons[node.nodeType]}</span>
                    <div>
                      <div className="font-medium text-sm">{node.nodeName}</div>
                      <div className="text-xs text-gray-500">
                        {node.ownershipPercentage}% ownership • {node.location}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold">
                      ${node.currentValueUSD.toLocaleString()}
                    </div>
                    <div className="text-xs text-amber-400">
                      {node.monthlyDividendKaus} K-AUS/mo
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-3 border-t border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Value</span>
                  <span className="text-lg font-bold text-green-400">
                    ${data.energyNodes.reduce((sum, n) => sum + n.currentValueUSD, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'card' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card Display */}
          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-2xl p-8 relative overflow-hidden">
            {/* Card Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div className="text-xl font-black text-amber-400">FIELD NINE</div>
                <div className="px-3 py-1 bg-amber-500 rounded text-black text-xs font-bold">
                  {data.cardAccount.cardTier}
                </div>
              </div>

              <div className="mb-8">
                <div className="text-2xl font-mono tracking-wider text-white">
                  {data.cardAccount.cardNumber}
                </div>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <div className="text-xs text-gray-500">AVAILABLE BALANCE</div>
                  <div className="text-3xl font-black text-white">
                    ${data.cardAccount.fiatBalance.USD.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">K-AUS BALANCE</div>
                  <div className="text-xl font-bold text-amber-400">
                    {data.cardAccount.kausBalance.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card Stats */}
          <div className="space-y-4">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">💰 Multi-Currency Balance</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">USD</span>
                  <span className="text-xl font-bold">${data.cardAccount.fiatBalance.USD.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">KRW</span>
                  <span className="text-xl font-bold">₩{data.cardAccount.fiatBalance.KRW.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">EUR</span>
                  <span className="text-xl font-bold">€{data.cardAccount.fiatBalance.EUR.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl p-6">
              <h3 className="text-lg font-bold text-purple-400 mb-4">🎁 Ecosystem Cashback</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span className="text-xl">👗</span> Aura Sydney
                  </span>
                  <span className="text-green-400 font-bold">10% K-AUS</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span className="text-xl">✈️</span> Nomad Monthly
                  </span>
                  <span className="text-green-400 font-bold">10% K-AUS</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span className="text-xl">⚡</span> Energy Partners
                  </span>
                  <span className="text-green-400 font-bold">5% K-AUS</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-purple-500/30">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Cashback Earned</span>
                  <span className="text-xl font-black text-amber-400">
                    {data.cardAccount.totalCashbackEarned.toLocaleString()} K-AUS
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'assets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* K-AUS Holdings */}
          <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border border-amber-500/30 rounded-xl p-6">
            <h3 className="text-lg font-bold text-amber-400 mb-4">👑 K-AUS Holdings</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Liquid</span>
                <span className="text-xl font-bold">2,500,000 K-AUS</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Staked</span>
                <span className="text-xl font-bold text-blue-400">1,500,000 K-AUS</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Pending Rewards</span>
                <span className="text-xl font-bold text-green-400">+12,500 K-AUS</span>
              </div>
              <div className="pt-4 border-t border-amber-500/30">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Value</span>
                  <span className="text-2xl font-black text-white">$601,875</span>
                </div>
              </div>
            </div>
          </div>

          {/* Energy Nodes Detail */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-green-400 mb-4">⚡ Energy Nodes</h3>
            <div className="space-y-4">
              {data.energyNodes.map(node => (
                <div key={node.nodeId} className="p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span>{nodeTypeIcons[node.nodeType]}</span>
                    <span className="font-bold text-sm">{node.nodeName}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Value</span>
                      <div className="text-green-400">${node.currentValueUSD.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Yield/mo</span>
                      <div className="text-amber-400">{node.monthlyDividendKaus} K-AUS</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RWA Investments */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-purple-400 mb-4">🏢 RWA Investments</h3>
            <div className="space-y-4">
              <div className="p-3 bg-gray-800/50 rounded-lg">
                <div className="font-bold text-sm mb-2">Dubai Marina Tower</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Value</span>
                    <div className="text-green-400">$285,000</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Yield</span>
                    <div className="text-amber-400">6.2%</div>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-gray-800/50 rounded-lg">
                <div className="font-bold text-sm mb-2">Singapore Solar Fund</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Value</span>
                    <div className="text-green-400">$112,500</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Yield</span>
                    <div className="text-amber-400">7.8%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'income' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Passive Income Summary */}
          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-xl p-6">
            <h3 className="text-lg font-bold text-green-400 mb-4">💰 Passive Income Summary</h3>
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-sm text-gray-400">Monthly Passive Income</div>
                <div className="text-4xl font-black text-white">
                  ${data.netWorth.monthlyPassiveIncome.toLocaleString()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Projected Annual Dividends</div>
                <div className="text-3xl font-bold text-green-400">
                  ${data.netWorth.projectedAnnualDividends.toLocaleString()}
                </div>
              </div>

              <div className="pt-4 border-t border-green-500/30 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Energy Node Dividends</span>
                  <span className="text-white">$2,370/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Staking Rewards</span>
                  <span className="text-white">$2,250/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Compute Earnings</span>
                  <span className="text-white">$1,875/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">RWA Dividends</span>
                  <span className="text-white">$1,940/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Mini Node Mining</span>
                  <span className="text-white">$315/mo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dividend Calendar */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">📅 Dividend Calendar</h3>
            <div className="space-y-3">
              {data.dividends.map((div, idx) => {
                const daysUntil = Math.ceil((div.nextPaymentDate - Date.now()) / (24 * 60 * 60 * 1000));
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border ${
                      daysUntil <= 7 ? 'bg-green-900/20 border-green-500/30' : 'bg-gray-800/50 border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold">{div.source}</div>
                        <div className="text-sm text-gray-400">
                          {new Date(div.nextPaymentDate).toLocaleDateString()}
                          {daysUntil <= 7 && (
                            <span className="ml-2 text-green-400">({daysUntil} days)</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-amber-400 font-bold">
                          {div.amountKaus.toLocaleString()} K-AUS
                        </div>
                        <div className="text-sm text-gray-500">
                          ${div.amountUSD.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-800 text-center text-gray-500 text-sm">
        <p>Sovereign Wallet v1.0.0 | Field Nine Solutions</p>
        <p className="text-amber-400/60 mt-2">
          &quot;시스템을 넘어 라이프스타일이 되다 - 모든 자산이 하나의 거대한 부의 강으로 흐른다&quot;
        </p>
      </div>
    </div>
  );
}
