'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 47: AI AUTO-TRADING DASHBOARD
 * ═══════════════════════════════════════════════════════════════════════════════
 * CEO AUTO-MODE: 원클릭 자율 수익 창출 대시보드
 * Tesla-grade UI with smooth animations
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TradingMode,
  MODE_PRESETS,
  TradingBotState,
  ProphetSignal,
  ProfitProjection,
  getBotState,
  activateAutoMode,
  getProfitProjection,
} from '@/lib/ai/trading-bot';

// ═══════════════════════════════════════════════════════════════════════════════
// AUTO MODE CONTROL WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

export function AutoModeControl() {
  const [botState, setBotState] = useState<TradingBotState | null>(null);
  const [selectedMode, setSelectedMode] = useState<TradingMode>('BALANCED');
  const [showConfirm, setShowConfirm] = useState(false);

  // Fetch bot state
  const fetchState = useCallback(() => {
    const state = getBotState();
    setBotState(state);
  }, []);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, [fetchState]);

  const handleActivate = () => {
    const newState = activateAutoMode(selectedMode);
    setBotState(newState);
    setShowConfirm(false);
  };

  const handleDeactivate = () => {
    const newState = activateAutoMode('OFF');
    setBotState(newState);
  };

  if (!botState) {
    return (
      <div className="bg-[#171717] rounded-2xl p-6 animate-pulse">
        <div className="h-8 bg-white/10 rounded w-1/3 mb-4" />
        <div className="h-20 bg-white/10 rounded-xl" />
      </div>
    );
  }

  const projection = getProfitProjection(selectedMode);

  return (
    <div className="bg-gradient-to-br from-[#171717] to-[#1a1a1a] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={botState.isRunning ? { rotate: 360 } : {}}
              transition={botState.isRunning ? { duration: 3, repeat: Infinity, ease: 'linear' } : {}}
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                botState.isRunning
                  ? 'bg-gradient-to-br from-emerald-500 to-cyan-500'
                  : 'bg-white/10'
              }`}
            >
              <span className="text-2xl">{botState.isRunning ? '🤖' : '⏸️'}</span>
            </motion.div>
            <div>
              <h3 className="font-bold text-white text-lg">Prophet AI Trading</h3>
              <p className="text-white/50 text-xs">Autonomous Profit Engine</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            botState.isRunning
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-white/10 text-white/50'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              botState.isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-white/30'
            }`} />
            <span className="text-sm font-bold">
              {botState.isRunning ? 'RUNNING' : 'STOPPED'}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Mode Selector */}
        <div>
          <label className="text-xs text-white/50 mb-2 block">Trading Mode</label>
          <div className="grid grid-cols-4 gap-2">
            {(['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE', 'PROPHET_AI'] as TradingMode[]).map(mode => (
              <motion.button
                key={mode}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedMode(mode)}
                className={`py-3 px-2 rounded-xl font-bold text-xs transition-all ${
                  selectedMode === mode
                    ? mode === 'PROPHET_AI'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                      : 'bg-emerald-500 text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {mode === 'PROPHET_AI' ? '🔮 PROPHET' : mode}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Mode Description */}
        <motion.div
          key={selectedMode}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-white/5 rounded-xl"
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-black text-white">
                {MODE_PRESETS[selectedMode].maxDailyTrades}
              </div>
              <div className="text-xs text-white/50">Max Trades/Day</div>
            </div>
            <div>
              <div className="text-2xl font-black text-amber-400">
                {MODE_PRESETS[selectedMode].profitTarget}%
              </div>
              <div className="text-xs text-white/50">Profit Target</div>
            </div>
            <div>
              <div className="text-2xl font-black text-cyan-400">
                {MODE_PRESETS[selectedMode].riskTolerance}%
              </div>
              <div className="text-xs text-white/50">Risk Level</div>
            </div>
          </div>
        </motion.div>

        {/* Profit Projection */}
        <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-xl border border-emerald-500/30">
          <div className="text-xs text-emerald-400 mb-2">Projected Returns</div>
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-lg font-black text-white">{projection.daily.kaus}</div>
              <div className="text-xs text-white/50">Daily KAUS</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-black text-white">{projection.weekly.kaus}</div>
              <div className="text-xs text-white/50">Weekly</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-black text-emerald-400">{projection.monthly.kaus}</div>
              <div className="text-xs text-white/50">Monthly</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-black text-amber-400">${projection.monthly.usd}</div>
              <div className="text-xs text-white/50">≈ USD</div>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-3">
          {botState.isRunning ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDeactivate}
              className="flex-1 py-4 bg-red-500/20 text-red-400 font-bold rounded-xl border border-red-500/30 hover:bg-red-500/30 transition-colors"
            >
              ⏹️ Stop Auto-Mode
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowConfirm(true)}
              className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25"
            >
              🚀 Activate AUTO-MODE
            </motion.button>
          )}
        </div>

        {/* Live Metrics (when running) */}
        {botState.isRunning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 bg-[#0a0a0a] rounded-xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-white/50 text-sm">Today's Profit</span>
              <span className={`font-bold ${botState.metrics.todayProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {botState.metrics.todayProfit >= 0 ? '+' : ''}{botState.metrics.todayProfit.toFixed(2)} KAUS
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/50 text-sm">Trades Today</span>
              <span className="text-white font-bold">{botState.metrics.todayTrades}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/50 text-sm">Win Rate</span>
              <span className="text-emerald-400 font-bold">{(botState.metrics.winRate * 100).toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/50 text-sm">Active Positions</span>
              <span className="text-white font-bold">{botState.positions.size}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50"
              onClick={() => setShowConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-[#1a1a1a] rounded-2xl p-6 max-w-md w-full">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🤖</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Activate Auto-Mode?</h3>
                  <p className="text-white/60 text-sm">
                    Prophet AI will automatically trade on your behalf using the <strong>{selectedMode}</strong> strategy.
                  </p>
                </div>

                <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/30 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="text-amber-400">⚠️</span>
                    <p className="text-amber-400/80 text-xs">
                      Trading involves risk. Past performance does not guarantee future results. Only trade with funds you can afford to lose.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleActivate}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-xl"
                  >
                    Confirm & Start
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROPHET SIGNALS PANEL
// ═══════════════════════════════════════════════════════════════════════════════

export function ProphetSignalsPanel() {
  const [signals, setSignals] = useState<ProphetSignal[]>([]);

  useEffect(() => {
    const fetchSignals = () => {
      const state = getBotState();
      setSignals(state.activeSignals);
    };

    fetchSignals();
    const interval = setInterval(fetchSignals, 10000);
    return () => clearInterval(interval);
  }, []);

  const actionColors = {
    BUY: 'text-emerald-400',
    SELL: 'text-red-400',
    HOLD: 'text-white/50',
  };

  const strengthColors = {
    STRONG: 'bg-emerald-500',
    MODERATE: 'bg-amber-500',
    WEAK: 'bg-white/30',
  };

  return (
    <div className="bg-[#171717] rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔮</span>
            <div>
              <h3 className="font-bold text-white">Prophet Signals</h3>
              <p className="text-white/50 text-xs">AI-Generated Trading Signals</p>
            </div>
          </div>
          <div className="text-xs text-white/40">
            Updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
        {signals.slice(0, 6).map((signal, i) => (
          <motion.div
            key={`${signal.sourceId}-${i}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`font-bold ${actionColors[signal.action]}`}>
                  {signal.action}
                </span>
                <span className="text-white font-bold">{signal.sourceType}</span>
                <div className={`w-2 h-2 rounded-full ${strengthColors[signal.strength]}`} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50">Confidence</span>
                <span className="text-white font-bold">{(signal.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div className="text-xs text-white/60 mb-2">
              {signal.reasoning[0]}
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-white/40">Target: </span>
                <span className="text-emerald-400">{signal.priceTarget.toFixed(4)}</span>
              </div>
              <div>
                <span className="text-white/40">Stop: </span>
                <span className="text-red-400">{signal.stopLoss.toFixed(4)}</span>
              </div>
              <div>
                <span className="text-white/40">Return: </span>
                <span className="text-amber-400">{signal.expectedReturn.toFixed(1)}%</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIVE TRADES FEED
// ═══════════════════════════════════════════════════════════════════════════════

export function LiveTradesFeed() {
  const [trades, setTrades] = useState<TradingBotState['recentTrades']>([]);

  useEffect(() => {
    const fetchTrades = () => {
      const state = getBotState();
      setTrades(state.recentTrades);
    };

    fetchTrades();
    const interval = setInterval(fetchTrades, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#171717] rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-xl">📊</span>
          <div>
            <h3 className="font-bold text-white">Live Trades</h3>
            <p className="text-white/50 text-xs">Real-time AI Executions</p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
        <AnimatePresence>
          {trades.map((trade, i) => (
            <motion.div
              key={trade.id}
              initial={{ opacity: 0, y: -20, backgroundColor: trade.type === 'BUY' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }}
              animate={{ opacity: 1, y: 0, backgroundColor: 'transparent' }}
              transition={{ duration: 0.3 }}
              className="p-3 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    trade.type === 'BUY'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {trade.type}
                  </span>
                  <span className="text-white font-bold text-sm">{trade.sourceId.split('-')[1]}</span>
                </div>
                <span className="text-white/60 text-xs">
                  {new Date(trade.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-white/50">{trade.amount.toLocaleString()} kWh @ {trade.price.toFixed(4)}</span>
                {(trade as typeof trade & { profit?: number }).profit !== undefined && (
                  <span className={`text-xs font-bold ${
                    (trade as typeof trade & { profit: number }).profit >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {(trade as typeof trade & { profit: number }).profit >= 0 ? '+' : ''}{(trade as typeof trade & { profit: number }).profit.toFixed(2)} K
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {trades.length === 0 && (
          <div className="p-8 text-center text-white/40">
            No trades yet. Activate Auto-Mode to start trading.
          </div>
        )}
      </div>
    </div>
  );
}
