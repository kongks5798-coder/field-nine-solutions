/**
 * NEXUS-X CEO Financial Dashboard
 * Real-time institutional-grade trading analytics
 *
 * Tesla-style design: #F9F9F7 (ivory), #171717 (black), #2D5A27 (accent)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';

// Types
interface MarketPrice {
  marketId: string;
  region: string;
  price: number;
  localPrice: number;
  currency: string;
  volume: number;
  timestamp: string;
  change24h: number;
}

interface TradingPosition {
  id: string;
  market: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  openedAt: string;
}

interface ArbitrageOpportunity {
  id: string;
  sourceMarket: string;
  targetMarket: string;
  spread: number;
  spreadPercent: number;
  estimatedProfit: number;
  riskScore: number;
  validUntil: string;
}

interface FinancialMetrics {
  totalAUM: number;
  dailyPnL: number;
  weeklyPnL: number;
  monthlyPnL: number;
  ytdReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  activePositions: number;
  nxusdReserve: number;
  collateralRatio: number;
}

interface InstitutionalClient {
  id: string;
  name: string;
  tier: 'PLATINUM' | 'GOLD' | 'SILVER';
  aum: number;
  monthlyVolume: number;
  feeRate: number;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
}

// Tesla-style colors
const COLORS = {
  primary: '#171717',
  secondary: '#F9F9F7',
  accent: '#2D5A27',
  positive: '#22C55E',
  negative: '#EF4444',
  warning: '#F59E0B',
  muted: '#6B7280',
  chart: ['#2D5A27', '#4A8549', '#6BAF6B', '#8CD98C', '#AEF3AE'],
};

// Formatters
const formatCurrency = (value: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number, decimals = 2) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

const formatPercent = (value: number) => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

// Sub-components
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  subtitle?: string;
}> = ({ title, value, change, icon, subtitle }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-[#171717] rounded-xl p-6 border border-[#2D5A27]/20"
  >
    <div className="flex items-center justify-between mb-2">
      <span className="text-[#6B7280] text-sm font-medium">{title}</span>
      {icon && <span className="text-[#2D5A27]">{icon}</span>}
    </div>
    <div className="text-[#F9F9F7] text-3xl font-bold mb-1">{value}</div>
    {change !== undefined && (
      <div
        className={`text-sm font-medium ${
          change >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
        }`}
      >
        {formatPercent(change)}
      </div>
    )}
    {subtitle && <div className="text-[#6B7280] text-xs mt-1">{subtitle}</div>}
  </motion.div>
);

const MarketPriceRow: React.FC<{ market: MarketPrice }> = ({ market }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex items-center justify-between py-3 border-b border-[#2D5A27]/10 last:border-0"
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-[#2D5A27]/20 flex items-center justify-center">
        <span className="text-[#2D5A27] font-bold text-sm">
          {market.marketId.substring(0, 2)}
        </span>
      </div>
      <div>
        <div className="text-[#F9F9F7] font-medium">{market.marketId}</div>
        <div className="text-[#6B7280] text-sm">{market.region}</div>
      </div>
    </div>
    <div className="text-right">
      <div className="text-[#F9F9F7] font-medium">
        ${formatNumber(market.price)}/MWh
      </div>
      <div
        className={`text-sm ${
          market.change24h >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
        }`}
      >
        {formatPercent(market.change24h)}
      </div>
    </div>
  </motion.div>
);

const PositionRow: React.FC<{ position: TradingPosition }> = ({ position }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex items-center justify-between py-3 border-b border-[#2D5A27]/10 last:border-0"
  >
    <div className="flex items-center gap-3">
      <div
        className={`w-2 h-10 rounded-full ${
          position.side === 'LONG' ? 'bg-[#22C55E]' : 'bg-[#EF4444]'
        }`}
      />
      <div>
        <div className="text-[#F9F9F7] font-medium">{position.market}</div>
        <div className="text-[#6B7280] text-sm">
          {position.side} · {formatNumber(position.quantity)} MWh
        </div>
      </div>
    </div>
    <div className="text-right">
      <div
        className={`font-medium ${
          position.pnl >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
        }`}
      >
        {formatCurrency(position.pnl)}
      </div>
      <div
        className={`text-sm ${
          position.pnlPercent >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
        }`}
      >
        {formatPercent(position.pnlPercent)}
      </div>
    </div>
  </motion.div>
);

const ArbitrageRow: React.FC<{ opp: ArbitrageOpportunity }> = ({ opp }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-[#171717] rounded-lg p-4 border border-[#2D5A27]/30 hover:border-[#2D5A27] transition-colors"
  >
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <span className="text-[#F9F9F7] font-medium">{opp.sourceMarket}</span>
        <span className="text-[#2D5A27]">→</span>
        <span className="text-[#F9F9F7] font-medium">{opp.targetMarket}</span>
      </div>
      <div
        className={`px-2 py-1 rounded text-xs font-medium ${
          opp.riskScore < 0.3
            ? 'bg-[#22C55E]/20 text-[#22C55E]'
            : opp.riskScore < 0.6
            ? 'bg-[#F59E0B]/20 text-[#F59E0B]'
            : 'bg-[#EF4444]/20 text-[#EF4444]'
        }`}
      >
        Risk: {(opp.riskScore * 100).toFixed(0)}%
      </div>
    </div>
    <div className="grid grid-cols-3 gap-4 text-sm">
      <div>
        <div className="text-[#6B7280]">Spread</div>
        <div className="text-[#2D5A27] font-medium">
          {formatPercent(opp.spreadPercent)}
        </div>
      </div>
      <div>
        <div className="text-[#6B7280]">Est. Profit</div>
        <div className="text-[#22C55E] font-medium">
          {formatCurrency(opp.estimatedProfit)}
        </div>
      </div>
      <div>
        <div className="text-[#6B7280]">Expires</div>
        <div className="text-[#F9F9F7]">
          {new Date(opp.validUntil).toLocaleTimeString()}
        </div>
      </div>
    </div>
  </motion.div>
);

const ClientRow: React.FC<{ client: InstitutionalClient }> = ({ client }) => (
  <div className="flex items-center justify-between py-3 border-b border-[#2D5A27]/10 last:border-0">
    <div className="flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
          client.tier === 'PLATINUM'
            ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-[#171717]'
            : client.tier === 'GOLD'
            ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-[#171717]'
            : 'bg-gradient-to-br from-gray-400 to-gray-600 text-[#171717]'
        }`}
      >
        {client.name.charAt(0)}
      </div>
      <div>
        <div className="text-[#F9F9F7] font-medium">{client.name}</div>
        <div className="text-[#6B7280] text-sm flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              client.status === 'ACTIVE'
                ? 'bg-[#22C55E]'
                : client.status === 'PENDING'
                ? 'bg-[#F59E0B]'
                : 'bg-[#EF4444]'
            }`}
          />
          {client.tier} · {client.feeRate * 100}% fee
        </div>
      </div>
    </div>
    <div className="text-right">
      <div className="text-[#F9F9F7] font-medium">{formatCurrency(client.aum)}</div>
      <div className="text-[#6B7280] text-sm">
        Vol: {formatCurrency(client.monthlyVolume)}
      </div>
    </div>
  </div>
);

// Main Dashboard Component
export const CEOFinancialDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [positions, setPositions] = useState<TradingPosition[]>([]);
  const [arbitrageOpps, setArbitrageOpps] = useState<ArbitrageOpportunity[]>([]);
  const [clients, setClients] = useState<InstitutionalClient[]>([]);
  const [pnlHistory, setPnlHistory] = useState<{ date: string; pnl: number; cumulative: number }[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | 'YTD'>('1M');
  const [isConnected, setIsConnected] = useState(false);

  // WebSocket connection for real-time data
  useEffect(() => {
    const ws = new WebSocket('wss://api.nexus-x.io/ws/dashboard');

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({ action: 'subscribe', channels: ['metrics', 'prices', 'positions', 'arbitrage'] }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'metrics':
          setMetrics(data.payload);
          break;
        case 'prices':
          setMarketPrices(data.payload);
          break;
        case 'positions':
          setPositions(data.payload);
          break;
        case 'arbitrage':
          setArbitrageOpps(data.payload);
          break;
        case 'pnl_history':
          setPnlHistory(data.payload);
          break;
        case 'clients':
          setClients(data.payload);
          break;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    // Initial data load
    loadInitialData();

    return () => {
      ws.close();
    };
  }, []);

  const loadInitialData = async () => {
    try {
      const [metricsRes, pricesRes, positionsRes, clientsRes, pnlRes] = await Promise.all([
        fetch('https://api.nexus-x.io/v1/dashboard/metrics'),
        fetch('https://api.nexus-x.io/v1/markets/prices'),
        fetch('https://api.nexus-x.io/v1/trading/positions'),
        fetch('https://api.nexus-x.io/v1/institutional/clients'),
        fetch('https://api.nexus-x.io/v1/dashboard/pnl-history'),
      ]);

      const [metricsData, pricesData, positionsData, clientsData, pnlData] = await Promise.all([
        metricsRes.json(),
        pricesRes.json(),
        positionsRes.json(),
        clientsRes.json(),
        pnlRes.json(),
      ]);

      setMetrics(metricsData);
      setMarketPrices(pricesData);
      setPositions(positionsData);
      setClients(clientsData);
      setPnlHistory(pnlData);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  // Calculate derived metrics
  const totalPositionValue = useMemo(() => {
    return positions.reduce((sum, pos) => sum + pos.currentPrice * pos.quantity, 0);
  }, [positions]);

  const totalUnrealizedPnL = useMemo(() => {
    return positions.reduce((sum, pos) => sum + pos.pnl, 0);
  }, [positions]);

  if (!metrics) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-[#2D5A27] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F9F9F7] p-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">NEXUS-X</h1>
          <p className="text-[#6B7280] mt-1">CEO Financial Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-[#22C55E] animate-pulse' : 'bg-[#EF4444]'
              }`}
            />
            <span className="text-sm text-[#6B7280]">
              {isConnected ? 'Live' : 'Disconnected'}
            </span>
          </div>
          <div className="text-sm text-[#6B7280]">
            {new Date().toLocaleString()}
          </div>
        </div>
      </header>

      {/* Key Metrics */}
      <section className="grid grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Total AUM"
          value={formatCurrency(metrics.totalAUM)}
          change={metrics.ytdReturn}
          subtitle="Year-to-Date Return"
        />
        <MetricCard
          title="Daily P&L"
          value={formatCurrency(metrics.dailyPnL)}
          change={(metrics.dailyPnL / metrics.totalAUM) * 100}
          subtitle={`Monthly: ${formatCurrency(metrics.monthlyPnL)}`}
        />
        <MetricCard
          title="Sharpe Ratio"
          value={formatNumber(metrics.sharpeRatio, 2)}
          subtitle={`Win Rate: ${formatNumber(metrics.winRate * 100, 1)}%`}
        />
        <MetricCard
          title="NXUSD Reserve"
          value={formatCurrency(metrics.nxusdReserve)}
          change={metrics.collateralRatio * 100 - 100}
          subtitle={`Collateral: ${formatNumber(metrics.collateralRatio * 100, 1)}%`}
        />
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* P&L Chart */}
        <div className="col-span-2 bg-[#171717] rounded-xl p-6 border border-[#2D5A27]/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Performance</h2>
            <div className="flex gap-2">
              {(['1D', '1W', '1M', '3M', 'YTD'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    selectedTimeframe === tf
                      ? 'bg-[#2D5A27] text-[#F9F9F7]'
                      : 'text-[#6B7280] hover:text-[#F9F9F7]'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={pnlHistory}>
              <defs>
                <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2D5A27" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2D5A27" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D5A27" opacity={0.1} />
              <XAxis
                dataKey="date"
                stroke="#6B7280"
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <YAxis
                stroke="#6B7280"
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#171717',
                  border: '1px solid #2D5A27',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#F9F9F7' }}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#2D5A27"
                fillOpacity={1}
                fill="url(#pnlGradient)"
              />
              <Bar dataKey="pnl" fill="#2D5A27" opacity={0.8} radius={[4, 4, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Market Prices */}
        <div className="bg-[#171717] rounded-xl p-6 border border-[#2D5A27]/20">
          <h2 className="text-xl font-semibold mb-4">Global Markets</h2>
          <div className="space-y-1">
            {marketPrices.slice(0, 6).map((market) => (
              <MarketPriceRow key={`${market.marketId}-${market.region}`} market={market} />
            ))}
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-3 gap-6 mt-6">
        {/* Active Positions */}
        <div className="bg-[#171717] rounded-xl p-6 border border-[#2D5A27]/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Active Positions</h2>
            <span className="text-[#2D5A27] font-medium">
              {positions.length} Open
            </span>
          </div>
          <div className="mb-4 p-4 bg-[#0A0A0A] rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-[#6B7280]">Total Value</span>
              <span className="text-[#F9F9F7]">{formatCurrency(totalPositionValue)}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-[#6B7280]">Unrealized P&L</span>
              <span
                className={totalUnrealizedPnL >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}
              >
                {formatCurrency(totalUnrealizedPnL)}
              </span>
            </div>
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {positions.map((position) => (
              <PositionRow key={position.id} position={position} />
            ))}
          </div>
        </div>

        {/* Arbitrage Opportunities */}
        <div className="bg-[#171717] rounded-xl p-6 border border-[#2D5A27]/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Arbitrage</h2>
            <span className="bg-[#2D5A27]/20 text-[#2D5A27] px-2 py-1 rounded text-sm font-medium">
              {arbitrageOpps.length} Active
            </span>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            <AnimatePresence>
              {arbitrageOpps.map((opp) => (
                <ArbitrageRow key={opp.id} opp={opp} />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Institutional Clients */}
        <div className="bg-[#171717] rounded-xl p-6 border border-[#2D5A27]/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Institutional Clients</h2>
            <span className="text-[#6B7280] text-sm">
              {clients.filter((c) => c.status === 'ACTIVE').length} Active
            </span>
          </div>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {clients.map((client) => (
              <ClientRow key={client.id} client={client} />
            ))}
          </div>
        </div>
      </div>

      {/* Risk & Compliance Section */}
      <section className="mt-6 grid grid-cols-4 gap-4">
        <MetricCard
          title="Max Drawdown"
          value={`${formatNumber(metrics.maxDrawdown * 100, 1)}%`}
          subtitle="Peak-to-trough"
        />
        <MetricCard
          title="Total Trades"
          value={formatNumber(metrics.totalTrades, 0)}
          subtitle="All time"
        />
        <MetricCard
          title="Active Positions"
          value={metrics.activePositions.toString()}
          subtitle={`Value: ${formatCurrency(totalPositionValue)}`}
        />
        <MetricCard
          title="Weekly P&L"
          value={formatCurrency(metrics.weeklyPnL)}
          change={(metrics.weeklyPnL / metrics.totalAUM) * 100}
        />
      </section>

      {/* Footer */}
      <footer className="mt-8 pt-6 border-t border-[#2D5A27]/20 flex items-center justify-between text-sm text-[#6B7280]">
        <div>NEXUS-X v2.0 · Institutional Grade Energy Trading Platform</div>
        <div>Data refreshes every 5 seconds · All times in UTC</div>
      </footer>
    </div>
  );
};

export default CEOFinancialDashboard;
