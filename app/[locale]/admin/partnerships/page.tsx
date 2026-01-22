'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PARTNERSHIP COMMAND CENTER
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Phase 24: Partnership Integration Dashboard
 *
 * KEPCO, Tesla, Exchange 파트너십 실시간 모니터링
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface KEPCOData {
  smpPrice: number;
  priceChange: number;
  gridStatus: 'normal' | 'caution' | 'warning' | 'critical';
  supply: number;
  demand: number;
  reserveRate: number;
  todayTrades: number;
  todayVolume: number;
  recPrice: number;
}

interface TeslaData {
  totalVehicles: number;
  totalPowerwalls: number;
  activeV2G: number;
  totalCapacity: number;
  availableCapacity: number;
  todayEarnings: number;
  todayKaus: number;
  peakShaving: number;
}

interface ExchangeData {
  kausPrice: number;
  priceChange: number;
  volume24h: number;
  marketCap: number;
  totalLiquidity: number;
  topExchange: string;
  topExchangeVolume: number;
  arbitrageOpportunities: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

function generateKEPCOData(): KEPCOData {
  const basePrice = 120;
  const variance = (Math.random() - 0.5) * 20;
  const supply = 85000 + Math.random() * 5000;
  const demand = 78000 + Math.random() * 7000;
  const reserveRate = ((supply - demand) / supply) * 100;

  let gridStatus: KEPCOData['gridStatus'] = 'normal';
  if (reserveRate < 3) gridStatus = 'critical';
  else if (reserveRate < 5) gridStatus = 'warning';
  else if (reserveRate < 7) gridStatus = 'caution';

  return {
    smpPrice: basePrice + variance,
    priceChange: (Math.random() - 0.5) * 10,
    gridStatus,
    supply,
    demand,
    reserveRate,
    todayTrades: 1247 + Math.floor(Math.random() * 100),
    todayVolume: 45.7 + Math.random() * 10,
    recPrice: 50000 + Math.random() * 10000,
  };
}

function generateTeslaData(): TeslaData {
  return {
    totalVehicles: 2500,
    totalPowerwalls: 850,
    activeV2G: 156 + Math.floor(Math.random() * 50),
    totalCapacity: 287.5,
    availableCapacity: 145.3 + Math.random() * 20,
    todayEarnings: 15800 + Math.floor(Math.random() * 2000),
    todayKaus: 125000 + Math.floor(Math.random() * 10000),
    peakShaving: 28.5 + Math.random() * 5,
  };
}

function generateExchangeData(): ExchangeData {
  const basePrice = 0.15;
  const variance = (Math.random() - 0.5) * 0.01;

  return {
    kausPrice: basePrice + variance,
    priceChange: (Math.random() - 0.3) * 5,
    volume24h: 163000000 + Math.floor(Math.random() * 10000000),
    marketCap: 18750000,
    totalLiquidity: 64000000,
    topExchange: 'Upbit',
    topExchangeVolume: 67000000,
    arbitrageOpportunities: Math.floor(Math.random() * 5),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function StatCard({
  title,
  value,
  unit,
  change,
  icon,
  color = 'blue',
}: {
  title: string;
  value: string | number;
  unit?: string;
  change?: number;
  icon: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}) {
  const colorMap = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
    red: 'from-red-500/20 to-red-600/10 border-red-500/30',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  };

  return (
    <motion.div
      className={`bg-gradient-to-br ${colorMap[color]} border rounded-xl p-4`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && <span className="text-gray-400 text-sm">{unit}</span>}
      </div>
      {change !== undefined && (
        <div className={`text-sm mt-1 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </div>
      )}
    </motion.div>
  );
}

function KEPCOSection({ data }: { data: KEPCOData }) {
  const statusColors = {
    normal: 'bg-green-500',
    caution: 'bg-yellow-500',
    warning: 'bg-orange-500',
    critical: 'bg-red-500',
  };

  return (
    <div className="bg-gray-900/50 rounded-2xl border border-yellow-500/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
            <span className="text-2xl">⚡</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">KEPCO 한전</h2>
            <p className="text-gray-400 text-sm">전력거래소 실시간 연동</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full ${statusColors[data.gridStatus]} text-white text-sm font-medium`}>
          {data.gridStatus.toUpperCase()}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="SMP 가격"
          value={data.smpPrice.toFixed(1)}
          unit="원/kWh"
          change={data.priceChange}
          icon="💰"
          color="yellow"
        />
        <StatCard
          title="REC 가격"
          value={Math.floor(data.recPrice).toLocaleString()}
          unit="원"
          icon="🌱"
          color="green"
        />
        <StatCard
          title="금일 거래"
          value={data.todayTrades}
          unit="건"
          icon="📊"
          color="blue"
        />
        <StatCard
          title="거래량"
          value={data.todayVolume.toFixed(1)}
          unit="GWh"
          icon="⚡"
          color="purple"
        />
      </div>

      <div className="bg-gray-800/50 rounded-xl p-4">
        <h3 className="text-gray-300 text-sm mb-3">전력 수급 현황</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">공급량</span>
              <span className="text-white">{data.supply.toFixed(0)} MW</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">수요량</span>
              <span className="text-white">{data.demand.toFixed(0)} MW</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-green-500"
                initial={{ width: 0 }}
                animate={{ width: `${(data.demand / data.supply) * 100}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-gray-700">
            <span className="text-gray-400">예비율</span>
            <span className={`font-bold ${data.reserveRate >= 7 ? 'text-green-400' : data.reserveRate >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
              {data.reserveRate.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TeslaSection({ data }: { data: TeslaData }) {
  return (
    <div className="bg-gray-900/50 rounded-2xl border border-red-500/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
            <span className="text-2xl">🚗</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Tesla V2G</h2>
            <p className="text-gray-400 text-sm">Vehicle-to-Grid & Powerwall</p>
          </div>
        </div>
        <div className="px-3 py-1 rounded-full bg-green-500 text-white text-sm font-medium">
          CONNECTED
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="총 차량"
          value={data.totalVehicles.toLocaleString()}
          unit="대"
          icon="🚗"
          color="red"
        />
        <StatCard
          title="Powerwall"
          value={data.totalPowerwalls.toLocaleString()}
          unit="대"
          icon="🔋"
          color="blue"
        />
        <StatCard
          title="활성 V2G"
          value={data.activeV2G}
          unit="세션"
          icon="⚡"
          color="green"
        />
        <StatCard
          title="Peak Shaving"
          value={data.peakShaving.toFixed(1)}
          unit="MWh"
          icon="📉"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4">
          <h3 className="text-gray-300 text-sm mb-3">배터리 용량</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">총 용량</span>
              <span className="text-white font-bold">{data.totalCapacity} MWh</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">가용 용량</span>
              <span className="text-green-400 font-bold">{data.availableCapacity.toFixed(1)} MWh</span>
            </div>
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden mt-2">
              <motion.div
                className="h-full bg-gradient-to-r from-red-500 to-green-500"
                initial={{ width: 0 }}
                animate={{ width: `${(data.availableCapacity / data.totalCapacity) * 100}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-4">
          <h3 className="text-gray-300 text-sm mb-3">금일 수익</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">USD 수익</span>
              <span className="text-white font-bold">${data.todayEarnings.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">K-AUS 보상</span>
              <span className="text-yellow-400 font-bold">{data.todayKaus.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExchangeSection({ data }: { data: ExchangeData }) {
  return (
    <div className="bg-gray-900/50 rounded-2xl border border-blue-500/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <span className="text-2xl">📈</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Exchange & DEX</h2>
            <p className="text-gray-400 text-sm">거래소 상장 & 유동성 풀</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-white">${data.kausPrice.toFixed(4)}</span>
          <span className={`text-sm ${data.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {data.priceChange >= 0 ? '+' : ''}{data.priceChange.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="24h 거래량"
          value={`$${(data.volume24h / 1000000).toFixed(1)}M`}
          icon="📊"
          color="blue"
        />
        <StatCard
          title="시가총액"
          value={`$${(data.marketCap / 1000000).toFixed(1)}M`}
          icon="💎"
          color="purple"
        />
        <StatCard
          title="유동성 풀"
          value={`$${(data.totalLiquidity / 1000000).toFixed(1)}M`}
          icon="🌊"
          color="green"
        />
        <StatCard
          title="차익거래"
          value={data.arbitrageOpportunities}
          unit="기회"
          icon="⚡"
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4">
          <h3 className="text-gray-300 text-sm mb-3">상장 거래소</h3>
          <div className="space-y-2">
            {['Binance', 'Coinbase', 'Upbit', 'Bithumb'].map((exchange, idx) => (
              <div key={exchange} className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">{exchange}</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-white text-sm">LISTED</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-4">
          <h3 className="text-gray-300 text-sm mb-3">DEX 유동성</h3>
          <div className="space-y-2">
            {[
              { name: 'Uniswap V3', pair: 'KAUS/USDC', apr: '18.5%' },
              { name: 'PancakeSwap', pair: 'KAUS/BNB', apr: '22.3%' },
            ].map((pool) => (
              <div key={pool.name} className="flex items-center justify-between">
                <div>
                  <span className="text-white text-sm">{pool.name}</span>
                  <span className="text-gray-500 text-xs ml-2">{pool.pair}</span>
                </div>
                <span className="text-green-400 text-sm font-bold">{pool.apr}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function PartnershipDashboard() {
  const [kepcoData, setKepcoData] = useState<KEPCOData>(generateKEPCOData());
  const [teslaData, setTeslaData] = useState<TeslaData>(generateTeslaData());
  const [exchangeData, setExchangeData] = useState<ExchangeData>(generateExchangeData());
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Update data every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setKepcoData(generateKEPCOData());
      setTeslaData(generateTeslaData());
      setExchangeData(generateExchangeData());
      setLastUpdate(new Date());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const totalDailyVolume = kepcoData.todayVolume * 120 + teslaData.todayEarnings + exchangeData.volume24h * 0.001;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/master" className="text-gray-400 hover:text-white transition-colors">
                ← Master
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-red-500 to-blue-500 bg-clip-text text-transparent">
                  Partnership Command Center
                </h1>
                <p className="text-gray-400 text-sm">KEPCO · Tesla · Exchange 실시간 모니터링</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-gray-400 text-xs">마지막 업데이트</div>
                <div className="text-white font-mono">{lastUpdate.toLocaleTimeString()}</div>
              </div>
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      {/* Summary Bar */}
      <div className="bg-gradient-to-r from-yellow-500/10 via-red-500/10 to-blue-500/10 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-gray-400 text-sm">활성 파트너</div>
              <div className="text-2xl font-bold text-white">3</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-sm">일일 총 거래량</div>
              <div className="text-2xl font-bold text-green-400">${(totalDailyVolume / 1000).toFixed(1)}K</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-sm">K-AUS 가격</div>
              <div className="text-2xl font-bold text-yellow-400">${exchangeData.kausPrice.toFixed(4)}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-sm">네트워크 상태</div>
              <div className="text-2xl font-bold text-green-400">OPTIMAL</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <KEPCOSection data={kepcoData} />
        <TeslaSection data={teslaData} />
        <ExchangeSection data={exchangeData} />

        {/* Cross-Platform Bridge Status */}
        <div className="bg-gray-900/50 rounded-2xl border border-purple-500/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <span className="text-2xl">🌉</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Cross-Platform Settlement Bridge</h2>
                <p className="text-gray-400 text-sm">파트너간 실시간 정산 브리지</p>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full bg-purple-500 text-white text-sm font-medium">
              ACTIVE
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">⚡ → 🚗</div>
              <div className="text-white font-bold">KEPCO → Tesla</div>
              <div className="text-gray-400 text-sm">그리드 충전 최적화</div>
              <div className="text-green-400 text-lg font-bold mt-2">487ms</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">🚗 → 📈</div>
              <div className="text-white font-bold">Tesla → Exchange</div>
              <div className="text-gray-400 text-sm">V2G 수익 토큰화</div>
              <div className="text-green-400 text-lg font-bold mt-2">312ms</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">📈 → ⚡</div>
              <div className="text-white font-bold">Exchange → KEPCO</div>
              <div className="text-gray-400 text-sm">REC 토큰 거래</div>
              <div className="text-green-400 text-lg font-bold mt-2">256ms</div>
            </div>
          </div>

          <div className="mt-6 bg-purple-500/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-purple-400 text-sm">총 크로스 플랫폼 정산</div>
                <div className="text-white text-2xl font-bold">$2,847,500</div>
              </div>
              <div className="text-right">
                <div className="text-purple-400 text-sm">평균 정산 시간</div>
                <div className="text-white text-2xl font-bold">352ms</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
