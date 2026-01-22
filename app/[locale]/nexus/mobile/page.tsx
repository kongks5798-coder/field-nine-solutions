'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Trade {
  id: string;
  timestamp: string;
  market: string;
  type: string;
  pnl: number;
  status: 'FILLED' | 'PENDING' | 'CANCELLED';
}

interface EngineStatus {
  status: 'RUNNING' | 'PAUSED' | 'SAFETY_LOCK';
  pnl: number;
  equity: number;
  mdd: number;
  trades: number;
}

export default function MobileTradingLog() {
  const [status, setStatus] = useState<EngineStatus>({
    status: 'RUNNING',
    pnl: 12.47,
    equity: 1012.47,
    mdd: 0.3,
    trades: 7,
  });

  const [trades, setTrades] = useState<Trade[]>([
    { id: 'FN9-005', timestamp: '12:30', market: 'JEPX', type: 'ARB', pnl: 2.47, status: 'FILLED' },
    { id: 'FN9-004', timestamp: '11:12', market: 'AEMO', type: 'ARB', pnl: -1.25, status: 'FILLED' },
    { id: 'FN9-003', timestamp: '10:45', market: 'JEPX', type: 'ARB', pnl: 3.50, status: 'FILLED' },
    { id: 'FN9-002', timestamp: '09:23', market: 'AEMO', type: 'ARB', pnl: 3.25, status: 'FILLED' },
    { id: 'FN9-001', timestamp: '08:15', market: 'JEPX', type: 'ARB', pnl: 4.50, status: 'FILLED' },
  ]);

  const [showEmergency, setShowEmergency] = useState(false);

  // Simulate real-time updates
  useEffect(() => {
    const timer = setInterval(() => {
      // Random chance to add new trade
      if (Math.random() > 0.9) {
        const newPnL = (Math.random() - 0.3) * 5;
        const newTrade: Trade = {
          id: `FN9-${String(trades.length + 1).padStart(3, '0')}`,
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          market: Math.random() > 0.5 ? 'JEPX' : 'AEMO',
          type: 'ARB',
          pnl: parseFloat(newPnL.toFixed(2)),
          status: 'FILLED',
        };

        setTrades(prev => [newTrade, ...prev.slice(0, 19)]);
        setStatus(prev => ({
          ...prev,
          pnl: prev.pnl + newPnL,
          equity: prev.equity + newPnL,
          trades: prev.trades + 1,
        }));
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [trades.length]);

  const getStatusIcon = (s: string) => {
    switch (s) {
      case 'RUNNING': return '🟢';
      case 'PAUSED': return '🟡';
      case 'SAFETY_LOCK': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold">
              <span className="text-green-400">FN</span>
              <span className="text-gray-500">NEXUS</span>
            </div>
            <div className="text-xs text-gray-500">Phase 9 Active</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className={`text-xl font-bold ${status.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {status.pnl >= 0 ? '+' : ''}${status.pnl.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">Today's PnL</div>
            </div>
            <div className="text-2xl">{getStatusIcon(status.status)}</div>
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 p-4">
        <div className="bg-gray-900 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-white">${status.equity.toFixed(0)}</div>
          <div className="text-xs text-gray-500">Equity</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-yellow-400">{status.mdd.toFixed(1)}%</div>
          <div className="text-xs text-gray-500">MDD</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-400">{status.trades}</div>
          <div className="text-xs text-gray-500">Trades</div>
        </div>
      </div>

      {/* MDD Bar */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Risk Level</span>
          <span>{status.mdd.toFixed(1)}% / 2.0%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${status.mdd < 1 ? 'bg-green-500' : status.mdd < 1.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${(status.mdd / 2) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Trade Feed */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-400">LIVE TRADE FEED</h2>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-green-500">LIVE</span>
          </div>
        </div>

        <div className="space-y-2">
          <AnimatePresence>
            {trades.map((trade, idx) => (
              <motion.div
                key={trade.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-gray-900/50 border border-gray-800 rounded-lg p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      trade.pnl >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {trade.pnl >= 0 ? '+' : '-'}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{trade.market}</div>
                      <div className="text-xs text-gray-500">{trade.id} · {trade.timestamp}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">{trade.type}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur border-t border-gray-800 p-4">
        <div className="flex gap-3">
          <button
            onClick={() => setShowEmergency(true)}
            className="flex-1 py-3 bg-red-500/20 text-red-400 rounded-lg font-medium border border-red-500/30 active:bg-red-500/30"
          >
            EMERGENCY STOP
          </button>
          <button className="flex-1 py-3 bg-gray-800 text-white rounded-lg font-medium active:bg-gray-700">
            VIEW DETAILS
          </button>
        </div>
      </div>

      {/* Emergency Modal */}
      <AnimatePresence>
        {showEmergency && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowEmergency(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-900 border border-red-500/50 rounded-xl p-6 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">🚨</div>
                <h3 className="text-xl font-bold text-red-400 mb-2">Emergency Stop</h3>
                <p className="text-sm text-gray-400">
                  This will immediately halt all trading activity and activate Safety Lock.
                </p>
              </div>
              <div className="space-y-3">
                <button
                  className="w-full py-3 bg-red-500 text-white rounded-lg font-bold active:bg-red-600"
                  onClick={() => {
                    setStatus(prev => ({ ...prev, status: 'SAFETY_LOCK' }));
                    setShowEmergency(false);
                  }}
                >
                  CONFIRM STOP
                </button>
                <button
                  className="w-full py-3 bg-gray-800 text-gray-400 rounded-lg font-medium"
                  onClick={() => setShowEmergency(false)}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Safe area padding for bottom bar */}
      <div className="h-24" />
    </div>
  );
}
