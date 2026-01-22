'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Phase 9 Trading Engine Types
interface TradingStatus {
  status: 'RUNNING' | 'PAUSED' | 'SAFETY_LOCK' | 'OFFLINE';
  mode: string;
  startedAt: string;
  lastHeartbeat: string;
  initialCapital: number;
  currentEquity: number;
  availableMargin: number;
  totalPnL: number;
  dailyPnL: number;
  currentMDD: number;
  maxMDD: number;
  mddLimit: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  sharpeRatio: number;
  markets: MarketPosition[];
  recentTrades: Trade[];
  settlement: SettlementInfo;
}

interface MarketPosition {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'CLOSED';
  position: number;
  unrealizedPnL: number;
}

interface SettlementInfo {
  network: string;
  contractAddress: string;
  lastSettlement: string;
  pendingSettlements: number;
  totalSettled: number;
}

interface MarketData {
  market: string;
  price: number;
  change: number;
  volume: number;
  lastUpdate: string;
}

interface Trade {
  id: string;
  timestamp: string;
  market: string;
  side: string;
  quantity: number;
  price: number;
  pnl: number;
  status: string;
}

interface SSEEvent {
  type: string;
  timestamp: string;
  market?: string;
  bid?: number;
  ask?: number;
  last?: number;
  volume?: number;
  equity?: number;
  dailyPnL?: number;
  currentMDD?: number;
  signal?: string;
  confidence?: number;
  tradeId?: string;
  side?: string;
  quantity?: number;
  price?: number;
  pnl?: number;
  status?: string;
  uptime?: number;
}

export default function NexusDashboard() {
  const [engineStatus, setEngineStatus] = useState<TradingStatus | null>(null);
  const [connected, setConnected] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [liveTrades, setLiveTrades] = useState<Trade[]>([]);
  const [liveMarkets, setLiveMarkets] = useState<MarketData[]>([
    { market: 'JEPX', price: 12.50, change: 0, volume: 0, lastUpdate: new Date().toISOString() },
    { market: 'AEMO', price: 85.00, change: 0, volume: 0, lastUpdate: new Date().toISOString() },
  ]);
  const [signals, setSignals] = useState<SSEEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch engine status from API
  const fetchEngineStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/trading/engine');
      const data = await response.json();

      if (data.success) {
        setEngineStatus(data.data);
        setLiveTrades(data.data.recentTrades || []);
        setConnected(true);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch engine status');
      }
    } catch (err) {
      setError('Connection failed');
      setConnected(false);
    }
  }, []);

  // Connect to SSE stream
  useEffect(() => {
    const eventSource = new EventSource('/api/trading/sse');

    eventSource.onopen = () => {
      setSseConnected(true);
      console.log('[NEXUS] SSE Connected');
    };

    eventSource.onmessage = (event) => {
      try {
        const data: SSEEvent = JSON.parse(event.data);

        switch (data.type) {
          case 'CONNECTED':
            console.log('[NEXUS] Stream initialized');
            break;

          case 'TICK':
            // Update market prices
            if (data.market && data.last !== undefined) {
              setLiveMarkets(prev => prev.map(m => {
                if (m.market === data.market) {
                  const oldPrice = m.price;
                  const newPrice = data.last!;
                  const change = ((newPrice - oldPrice) / oldPrice) * 100;
                  return {
                    ...m,
                    price: newPrice,
                    change: parseFloat(change.toFixed(2)),
                    volume: data.volume || m.volume,
                    lastUpdate: data.timestamp,
                  };
                }
                return m;
              }));
            }
            break;

          case 'PNL_UPDATE':
            // Update equity and PnL
            if (data.equity !== undefined) {
              setEngineStatus(prev => prev ? {
                ...prev,
                currentEquity: data.equity!,
                dailyPnL: data.dailyPnL || prev.dailyPnL,
                totalPnL: data.dailyPnL || prev.totalPnL,
                currentMDD: data.currentMDD || prev.currentMDD,
              } : prev);
            }
            break;

          case 'SIGNAL':
            // Add trading signal
            setSignals(prev => [data, ...prev.slice(0, 9)]);
            break;

          case 'TRADE':
            // Add new trade
            if (data.tradeId) {
              const newTrade: Trade = {
                id: data.tradeId,
                timestamp: data.timestamp,
                market: data.market || 'UNKNOWN',
                side: data.side || 'BUY',
                quantity: data.quantity || 0,
                price: data.price || 0,
                pnl: data.pnl || 0,
                status: data.status || 'FILLED',
              };
              setLiveTrades(prev => [newTrade, ...prev.slice(0, 19)]);
            }
            break;

          case 'HEARTBEAT':
            // Update connection status
            setEngineStatus(prev => prev ? {
              ...prev,
              lastHeartbeat: data.timestamp,
              status: (data.status as TradingStatus['status']) || prev.status,
            } : prev);
            break;
        }
      } catch (err) {
        console.error('[NEXUS] SSE Parse error:', err);
      }
    };

    eventSource.onerror = () => {
      setSseConnected(false);
      console.error('[NEXUS] SSE Disconnected');
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchEngineStatus();
    const interval = setInterval(fetchEngineStatus, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [fetchEngineStatus]);

  // Clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Emergency stop handler
  const handleEmergencyStop = async () => {
    if (!confirm('EMERGENCY STOP: 모든 포지션을 청산하고 엔진을 중지합니다. 계속하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch('/api/trading/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'EMERGENCY_STOP' }),
      });

      const data = await response.json();
      if (data.success) {
        setEngineStatus(prev => prev ? { ...prev, status: 'SAFETY_LOCK' } : prev);
        alert('EMERGENCY STOP 실행됨. 모든 포지션이 청산되었습니다.');
      }
    } catch (err) {
      alert('Emergency stop failed. Check console.');
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING': return 'text-green-400';
      case 'PAUSED': return 'text-yellow-400';
      case 'SAFETY_LOCK': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getMDDColor = (mdd: number, max: number) => {
    const ratio = mdd / max;
    if (ratio < 0.5) return 'bg-green-500';
    if (ratio < 0.75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const status = engineStatus || {
    status: 'OFFLINE' as const,
    mode: 'CONSERVATIVE',
    startedAt: '',
    lastHeartbeat: '',
    initialCapital: 1000,
    currentEquity: 1000,
    availableMargin: 800,
    totalPnL: 0,
    dailyPnL: 0,
    currentMDD: 0,
    maxMDD: 0,
    mddLimit: 2.0,
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    sharpeRatio: 0,
    markets: [],
    recentTrades: [],
    settlement: {
      network: 'Polygon Mainnet',
      contractAddress: '',
      lastSettlement: '',
      pendingSettlements: 0,
      totalSettled: 0,
    },
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-mono">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold tracking-tight">
              <span className="text-green-400">FIELD NINE</span>
              <span className="text-gray-500 ml-2">NEXUS</span>
            </div>
            <div className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
              PHASE 9 LIVE
            </div>
            {/* Connection indicators */}
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
                API
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${sseConnected ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${sseConnected ? 'bg-blue-400 animate-pulse' : 'bg-red-400'}`} />
                SSE
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-sm text-gray-400">
              {currentTime.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} KST
            </div>
            <div className={`flex items-center gap-2 ${getStatusColor(status.status)}`}>
              <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
              <span className="text-sm font-medium">{status.status}</span>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="mx-6 mt-4 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      <main className="p-6">
        {/* Top Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {/* Current PnL */}
          <motion.div
            className="bg-gray-900/50 border border-gray-800 rounded-lg p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total PnL</div>
            <div className={`text-3xl font-bold ${status.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {status.totalPnL >= 0 ? '+' : ''}${status.totalPnL.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              ROI: {((status.totalPnL / status.initialCapital) * 100).toFixed(3)}%
            </div>
          </motion.div>

          {/* Equity */}
          <motion.div
            className="bg-gray-900/50 border border-gray-800 rounded-lg p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Current Equity</div>
            <div className="text-3xl font-bold text-white">
              ${status.currentEquity.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Initial: ${status.initialCapital.toFixed(2)}
            </div>
          </motion.div>

          {/* Win Rate */}
          <motion.div
            className="bg-gray-900/50 border border-gray-800 rounded-lg p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Win Rate</div>
            <div className="text-3xl font-bold text-blue-400">
              {status.winRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {status.totalTrades} trades | Sharpe: {status.sharpeRatio.toFixed(2)}
            </div>
          </motion.div>

          {/* MDD Monitor */}
          <motion.div
            className="bg-gray-900/50 border border-gray-800 rounded-lg p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">MDD Monitor</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{status.currentMDD.toFixed(2)}%</span>
              <span className="text-sm text-gray-500">/ {status.mddLimit}%</span>
            </div>
            <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${getMDDColor(status.currentMDD, status.mddLimit)} transition-all`}
                style={{ width: `${(status.currentMDD / status.mddLimit) * 100}%` }}
              />
            </div>
          </motion.div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Live Market Data */}
          <div className="col-span-2 bg-gray-900/50 border border-gray-800 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-300">LIVE MARKET DATA</h2>
              <div className="flex items-center gap-1 text-xs text-blue-400">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                STREAMING
              </div>
            </div>
            <div className="p-4">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase">
                    <th className="text-left pb-3">Market</th>
                    <th className="text-right pb-3">Price</th>
                    <th className="text-right pb-3">Change</th>
                    <th className="text-right pb-3">Volume</th>
                    <th className="text-right pb-3">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {liveMarkets.map((market, idx) => (
                      <motion.tr
                        key={market.market}
                        className="border-t border-gray-800/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        layout
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${market.change >= 0 ? 'bg-green-400' : 'bg-red-400'}`} />
                            <span className="font-medium">{market.market}</span>
                          </div>
                        </td>
                        <td className="text-right font-mono">${market.price.toFixed(2)}</td>
                        <td className={`text-right font-mono ${market.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {market.change >= 0 ? '+' : ''}{market.change.toFixed(2)}%
                        </td>
                        <td className="text-right font-mono text-gray-400">{market.volume.toLocaleString()}</td>
                        <td className="text-right text-xs text-gray-500">
                          {new Date(market.lastUpdate).toLocaleTimeString()}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Trading Signals */}
            {signals.length > 0 && (
              <div className="px-4 pb-4">
                <div className="text-xs text-gray-500 uppercase mb-2">Recent Signals</div>
                <div className="flex flex-wrap gap-2">
                  {signals.slice(0, 5).map((sig, i) => (
                    <div
                      key={i}
                      className={`px-2 py-1 rounded text-xs border ${
                        sig.signal === 'LONG_ENTRY' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        sig.signal === 'SHORT_ENTRY' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        'bg-gray-800 text-gray-400 border-gray-700'
                      }`}
                    >
                      {sig.market}: {sig.signal} ({((sig.confidence || 0) * 100).toFixed(0)}%)
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Risk Shield Status */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-800">
              <h2 className="text-sm font-medium text-gray-300">RISK SHIELD</h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Status</span>
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/30">
                  ARMED
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Safety Lock</span>
                <span className="text-sm text-green-400">@ {status.mddLimit}% MDD</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Daily Loss Limit</span>
                <span className="text-sm text-white">${(status.initialCapital * status.mddLimit / 100).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Available Margin</span>
                <span className="text-sm text-white">${status.availableMargin?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Mode</span>
                <span className="text-sm text-blue-400">{status.mode}</span>
              </div>
              <div className="pt-4 border-t border-gray-800">
                <button
                  onClick={handleEmergencyStop}
                  className="w-full py-2 bg-red-500/20 text-red-400 text-sm rounded border border-red-500/30 hover:bg-red-500/30 transition-colors"
                >
                  EMERGENCY STOP
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Trades */}
        <div className="mt-6 bg-gray-900/50 border border-gray-800 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-300">LIVE TRADE FEED</h2>
            <span className="text-xs text-gray-500">{liveTrades.length} trades</span>
          </div>
          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-900">
                <tr className="text-xs text-gray-500 uppercase bg-gray-800/30">
                  <th className="text-left px-4 py-2">ID</th>
                  <th className="text-left px-4 py-2">Time</th>
                  <th className="text-left px-4 py-2">Market</th>
                  <th className="text-left px-4 py-2">Side</th>
                  <th className="text-right px-4 py-2">Qty</th>
                  <th className="text-right px-4 py-2">Price</th>
                  <th className="text-right px-4 py-2">PnL</th>
                  <th className="text-center px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {liveTrades.map((trade, idx) => (
                    <motion.tr
                      key={trade.id}
                      className="border-t border-gray-800/30 hover:bg-gray-800/20"
                      initial={{ opacity: 0, x: -20, backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
                      animate={{ opacity: 1, x: 0, backgroundColor: 'transparent' }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      layout
                    >
                      <td className="px-4 py-3 font-mono text-sm text-blue-400">{trade.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {new Date(trade.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3 text-sm">{trade.market}</td>
                      <td className={`px-4 py-3 text-sm font-medium ${trade.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.side}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm">{trade.quantity}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm">${trade.price.toFixed(2)}</td>
                      <td className={`px-4 py-3 text-right font-mono text-sm font-medium ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                          {trade.status}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {/* Settlement Status */}
        <div className="mt-6 grid grid-cols-2 gap-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-4">POLYGON SETTLEMENT</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Network</span>
                <span className="text-sm text-purple-400">{status.settlement?.network || 'Polygon Mainnet'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">NXUSD Vault</span>
                <span className="text-sm text-green-400">${status.initialCapital.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Total Settled</span>
                <span className="text-sm text-white">${status.settlement?.totalSettled?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Pending</span>
                <span className="text-sm text-white">{status.settlement?.pendingSettlements || 0}</span>
              </div>
              {status.settlement?.contractAddress && (
                <div className="pt-2 border-t border-gray-800">
                  <div className="text-xs text-gray-500">Contract</div>
                  <div className="text-xs text-purple-400 font-mono truncate">
                    {status.settlement.contractAddress}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-4">ENGINE STATUS</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">API Connection</span>
                <span className={`text-sm ${connected ? 'text-green-400' : 'text-red-400'}`}>
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">SSE Stream</span>
                <span className={`text-sm ${sseConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {sseConnected ? 'Streaming' : 'Disconnected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Last Heartbeat</span>
                <span className="text-sm text-gray-400">
                  {status.lastHeartbeat ? new Date(status.lastHeartbeat).toLocaleTimeString() : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Started At</span>
                <span className="text-sm text-gray-400">
                  {status.startedAt ? new Date(status.startedAt).toLocaleTimeString() : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-3 mt-6">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>Field Nine Energy v1.0.9 (CONVERGENCE) | Phase 9 Real-Money Pilot | LIVE BACKEND</div>
          <div className="flex items-center gap-4">
            <span className={connected ? 'text-green-400' : 'text-red-400'}>
              API: {connected ? 'Connected' : 'Offline'}
            </span>
            <span className={sseConnected ? 'text-blue-400' : 'text-red-400'}>
              SSE: {sseConnected ? 'Streaming' : 'Offline'}
            </span>
            <span className="text-purple-400">Polygon: Synced</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
