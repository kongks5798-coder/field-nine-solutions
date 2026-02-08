'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 53: PROPHET COMMAND CENTER
 * ═══════════════════════════════════════════════════════════════════════════════
 * 실시간 삼각 아비트라지 트레이딩 대시보드
 * Prophet Engine 통합 컨트롤 센터
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ProphetEngine,
  getProphetEngine,
  formatProfitUSD,
  formatVolume,
  getRiskColor,
  getConfidenceLabel,
  type ArbitrageOpportunity,
  type ProphetSignal,
  type ProphetEngineState,
  type EnergyMarket,
} from '@/lib/ai/prophet-engine';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Alert {
  id: string;
  type: 'OPPORTUNITY' | 'EXECUTION' | 'WARNING' | 'SUCCESS';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENGINE STATUS INDICATOR
// ═══════════════════════════════════════════════════════════════════════════════

function EngineStatusIndicator({ state }: { state: ProphetEngineState }) {
  const statusConfig = {
    IDLE: { color: 'bg-gray-500', label: '대기 중', pulse: false },
    SCANNING: { color: 'bg-blue-500', label: '스캔 중', pulse: true },
    ANALYZING: { color: 'bg-amber-500', label: '분석 중', pulse: true },
    EXECUTING: { color: 'bg-emerald-500', label: '실행 중', pulse: true },
  };

  const config = statusConfig[state.mode];

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className={`w-3 h-3 rounded-full ${config.color}`} />
        {config.pulse && (
          <div className={`absolute inset-0 w-3 h-3 rounded-full ${config.color} animate-ping opacity-75`} />
        )}
      </div>
      <div>
        <div className="text-sm font-medium text-white">{config.label}</div>
        <div className="text-xs text-gray-400">
          마지막 스캔: {new Date(state.lastScan).toLocaleTimeString('ko-KR')}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARKET GRID
// ═══════════════════════════════════════════════════════════════════════════════

function MarketGrid({ markets }: { markets: EnergyMarket[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {markets.map((market) => (
        <motion.div
          key={market.id}
          className="bg-gray-800/50 rounded-xl p-3 border border-gray-700"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">{market.region}</span>
            <span className={`w-2 h-2 rounded-full ${market.liquidity > 0.8 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          </div>
          <div className="text-sm font-bold text-white truncate">{market.name}</div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-lg font-bold text-emerald-400">
              ${market.currentPrice.toFixed(4)}
            </span>
            <span className="text-xs text-gray-500">/kWh</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span>변동성: {(market.volatility * 100).toFixed(1)}%</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPPORTUNITY CARD
// ═══════════════════════════════════════════════════════════════════════════════

function OpportunityCard({
  opportunity,
  onExecute,
  isExecuting,
}: {
  opportunity: ArbitrageOpportunity;
  onExecute: (id: string) => void;
  isExecuting: boolean;
}) {
  const timeRemaining = Math.max(0, opportunity.validUntil - Date.now());
  const isExpired = timeRemaining <= 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border ${
        isExpired ? 'border-gray-700 opacity-50' : 'border-emerald-500/30'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔺</span>
          <span className="text-sm font-bold text-white">삼각 아비트라지</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 rounded text-xs font-medium"
            style={{ backgroundColor: getRiskColor(opportunity.riskScore) + '20', color: getRiskColor(opportunity.riskScore) }}
          >
            리스크 {opportunity.riskScore}
          </span>
          {!isExpired && (
            <span className="text-xs text-gray-400">
              {Math.ceil(timeRemaining / 1000)}초 남음
            </span>
          )}
        </div>
      </div>

      {/* Path */}
      <div className="flex items-center gap-1 mb-3 text-sm overflow-x-auto pb-1">
        {opportunity.path.map((marketId, idx) => (
          <React.Fragment key={idx}>
            <span className="px-2 py-1 bg-gray-700 rounded text-white whitespace-nowrap">
              {marketId.replace('_', ' ')}
            </span>
            {idx < opportunity.path.length - 1 && (
              <span className="text-emerald-400">→</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <div className="text-xl font-black text-emerald-400">
            +{opportunity.expectedProfit.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500">예상 수익률</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-black text-cyan-400">
            {formatProfitUSD(opportunity.netProfitUSD)}
          </div>
          <div className="text-xs text-gray-500">순이익</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-black text-amber-400">
            {(opportunity.confidence * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500">신뢰도</div>
        </div>
      </div>

      {/* Volume */}
      <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
        <span>거래량</span>
        <span className="text-white font-medium">{formatVolume(opportunity.volume)}</span>
      </div>

      {/* Execute Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onExecute(opportunity.id)}
        disabled={isExpired || isExecuting}
        className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
          isExpired
            ? 'bg-gray-700 cursor-not-allowed'
            : isExecuting
            ? 'bg-amber-600 cursor-wait'
            : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600'
        }`}
      >
        {isExpired ? '만료됨' : isExecuting ? '실행 중...' : '⚡ 즉시 실행'}
      </motion.button>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERFORMANCE PANEL
// ═══════════════════════════════════════════════════════════════════════════════

function PerformancePanel({ state }: { state: ProphetEngineState }) {
  const roi = useMemo(() => {
    const initial = 100000; // $100K base
    return {
      totalReturn: state.totalProfitGenerated,
      percentageReturn: (state.totalProfitGenerated / initial) * 100,
      annualizedReturn: ((state.totalProfitGenerated / initial) * 100) * 12, // Monthly to annual
    };
  }, [state.totalProfitGenerated]);

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl p-6 border border-gray-800">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span>📊</span> Performance Analytics
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-emerald-400">
            {formatProfitUSD(roi.totalReturn)}
          </div>
          <div className="text-xs text-gray-500 mt-1">총 수익</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-cyan-400">
            {roi.percentageReturn.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">수익률</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-amber-400">
            {(state.successRate * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">승률</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-purple-400">
            {state.tradesExecuted}
          </div>
          <div className="text-xs text-gray-500 mt-1">거래 횟수</div>
        </div>
      </div>

      {/* Sharpe Ratio Visualization */}
      <div className="bg-gray-800/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">샤프 비율 (Sharpe Ratio)</span>
          <span className="text-lg font-bold text-white">1.85</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: '62%' }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0</span>
          <span>1</span>
          <span>2</span>
          <span>3+</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIGNAL FEED
// ═══════════════════════════════════════════════════════════════════════════════

function SignalFeed({ signals }: { signals: ProphetSignal[] }) {
  if (signals.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">📡</div>
        <div>시그널 대기 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto">
      {signals.slice(0, 10).map((signal) => (
        <motion.div
          key={signal.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700"
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
            signal.type === 'BUY' ? 'bg-emerald-500/20' :
            signal.type === 'SELL' ? 'bg-red-500/20' :
            signal.type === 'ARBITRAGE' ? 'bg-cyan-500/20' :
            'bg-gray-500/20'
          }`}>
            {signal.type === 'BUY' ? '📈' :
             signal.type === 'SELL' ? '📉' :
             signal.type === 'ARBITRAGE' ? '🔺' : '⏸️'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-bold ${
                signal.type === 'BUY' ? 'text-emerald-400' :
                signal.type === 'SELL' ? 'text-red-400' :
                signal.type === 'ARBITRAGE' ? 'text-cyan-400' :
                'text-gray-400'
              }`}>
                {signal.type}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(signal.timestamp).toLocaleTimeString('ko-KR')}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
              {signal.reasoning}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className="text-emerald-400">+{signal.expectedReturn.toFixed(2)}%</span>
              <span className={`${
                signal.riskLevel === 'LOW' ? 'text-emerald-400' :
                signal.riskLevel === 'MEDIUM' ? 'text-amber-400' :
                'text-red-400'
              }`}>
                {signal.riskLevel} 리스크
              </span>
              <span className="text-gray-500">
                신뢰도: {(signal.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALERT CENTER
// ═══════════════════════════════════════════════════════════════════════════════

function AlertCenter({ alerts, onDismiss }: { alerts: Alert[]; onDismiss: (id: string) => void }) {
  const unreadCount = alerts.filter(a => !a.read).length;

  const alertConfig = {
    OPPORTUNITY: { icon: '💡', color: 'border-cyan-500/50 bg-cyan-500/10' },
    EXECUTION: { icon: '⚡', color: 'border-emerald-500/50 bg-emerald-500/10' },
    WARNING: { icon: '⚠️', color: 'border-amber-500/50 bg-amber-500/10' },
    SUCCESS: { icon: '✅', color: 'border-green-500/50 bg-green-500/10' },
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>🔔</span> Alerts
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
              {unreadCount}
            </span>
          )}
        </h3>
      </div>

      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        <AnimatePresence>
          {alerts.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-sm">
              알림이 없습니다
            </div>
          ) : (
            alerts.slice(0, 5).map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-3 rounded-lg border ${alertConfig[alert.type].color}`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">{alertConfig[alert.type].icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{alert.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{alert.message}</div>
                  </div>
                  <button
                    onClick={() => onDismiss(alert.id)}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMMAND CENTER
// ═══════════════════════════════════════════════════════════════════════════════

export function ProphetCommandCenter() {
  const [engine] = useState(() => getProphetEngine());
  const [engineState, setEngineState] = useState<ProphetEngineState>(engine.getState());
  const [markets, setMarkets] = useState<EnergyMarket[]>([]);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Update engine state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const state = engine.getState();
      setEngineState(state);

      // Get market overview
      const overview = engine.getMarketOverview();
      setMarkets(overview.markets);

      // Generate alert for new opportunities
      if (state.opportunities.length > 0 && state.opportunities[0].expectedProfit > 1) {
        const opp = state.opportunities[0];
        const alertId = `alert_${opp.id}`;

        setAlerts(prev => {
          if (prev.some(a => a.id === alertId)) return prev;
          const newAlert: Alert = {
            id: alertId,
            type: 'OPPORTUNITY' as const,
            title: '고수익 기회 발견!',
            message: `${opp.expectedProfit.toFixed(2)}% 수익 예상 - ${opp.path.join(' → ')}`,
            timestamp: Date.now(),
            read: false,
          };
          return [newAlert, ...prev].slice(0, 20);
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [engine]);

  // Toggle engine
  const toggleEngine = useCallback(() => {
    if (engineState.isActive) {
      engine.deactivate();
    } else {
      engine.activate();
    }
    setEngineState(engine.getState());
  }, [engine, engineState.isActive]);

  // Execute trade
  const handleExecute = useCallback(async (opportunityId: string) => {
    setExecutingId(opportunityId);
    try {
      const result = await engine.executeArbitrage(opportunityId);

      const execAlert: Alert = {
        id: `exec_${result.id}`,
        type: result.status === 'COMPLETED' ? 'SUCCESS' as const : 'WARNING' as const,
        title: result.status === 'COMPLETED' ? '거래 성공!' : '거래 실패',
        message: result.status === 'COMPLETED'
          ? `${formatProfitUSD(result.actualProfit || 0)} 수익 실현`
          : '슬리피지로 인해 거래가 취소되었습니다',
        timestamp: Date.now(),
        read: false,
      };
      setAlerts(prev => [execAlert, ...prev].slice(0, 20));
    } catch (error) {
      const errorAlert: Alert = {
        id: `error_${Date.now()}`,
        type: 'WARNING' as const,
        title: '실행 오류',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        timestamp: Date.now(),
        read: false,
      };
      setAlerts(prev => [errorAlert, ...prev]);
    } finally {
      setExecutingId(null);
      setEngineState(engine.getState());
    }
  }, [engine]);

  // Dismiss alert
  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0a0a0a] to-[#171717] rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">🔮</span>
            </div>
            <div>
              <h1 className="text-2xl font-black">Prophet Command Center</h1>
              <p className="text-white/60 text-sm">실시간 삼각 아비트라지 트레이딩</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <EngineStatusIndicator state={engineState} />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleEngine}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                engineState.isActive
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white'
              }`}
            >
              {engineState.isActive ? '⏹️ 엔진 정지' : '▶️ 엔진 시작'}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Market Overview */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl p-6 border border-gray-800">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>🌐</span> Global Energy Markets
        </h3>
        <MarketGrid markets={markets} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Opportunities */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-[#171717] flex items-center gap-2">
            <span>💎</span> Active Opportunities
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
              {engineState.opportunities.length}
            </span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {engineState.opportunities.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-2 text-center py-12 bg-gray-100 rounded-2xl"
                >
                  <div className="text-4xl mb-2">🔍</div>
                  <div className="text-gray-500">
                    {engineState.isActive
                      ? '기회를 스캔하는 중...'
                      : '엔진을 시작하여 기회를 탐색하세요'}
                  </div>
                </motion.div>
              ) : (
                engineState.opportunities.slice(0, 4).map((opp) => (
                  <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    onExecute={handleExecute}
                    isExecuting={executingId === opp.id}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Alerts */}
          <AlertCenter alerts={alerts} onDismiss={dismissAlert} />

          {/* Signal Feed */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl p-4 border border-gray-800">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>📡</span> Signal Feed
            </h3>
            <SignalFeed signals={engineState.signals} />
          </div>
        </div>
      </div>

      {/* Performance Analytics */}
      <PerformancePanel state={engineState} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPACT WIDGET VERSION
// ═══════════════════════════════════════════════════════════════════════════════

export function ProphetWidget() {
  const [engine] = useState(() => getProphetEngine());
  const [state, setState] = useState(engine.getState());

  useEffect(() => {
    const interval = setInterval(() => {
      setState(engine.getState());
    }, 2000);
    return () => clearInterval(interval);
  }, [engine]);

  const bestOpp = state.opportunities[0];

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-xl p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔮</span>
          <span className="font-bold text-white">Prophet AI</span>
        </div>
        <div className={`w-2 h-2 rounded-full ${state.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`} />
      </div>

      {bestOpp ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">최고 기회</span>
            <span className="text-lg font-bold text-emerald-400">
              +{bestOpp.expectedProfit.toFixed(2)}%
            </span>
          </div>
          <div className="text-xs text-gray-500 truncate">
            {bestOpp.path.join(' → ')}
          </div>
        </div>
      ) : (
        <div className="text-center py-2 text-gray-500 text-sm">
          {state.isActive ? '스캔 중...' : '대기 중'}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800 text-xs">
        <span className="text-gray-500">승률</span>
        <span className="text-emerald-400 font-medium">{(state.successRate * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
}

export default ProphetCommandCenter;
