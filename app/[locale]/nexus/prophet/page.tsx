'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 51: AI PROPHET TRADING INTELLIGENCE PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 * AI-powered trading signals, market sentiment, price predictions
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FinancialSidebar, PriceTicker, MembershipBar } from '@/components/nexus/financial-terminal';
import { MobileBottomNav, MobileHeader } from '@/components/nexus/mobile-nav';
import ProphetSignalsDashboard, {
  SignalCard,
  MarketSentimentGauge,
  PricePredictionWidget,
  RiskAssessmentMatrix,
  ProphetInsightsFeed,
  SignalStatsWidget,
  ActiveSignalsList,
} from '@/components/nexus/prophet-signals-dashboard';
import {
  generateTradingSignals,
  getMarketSentiment,
  getPricePrediction,
  getRiskAssessment,
  getProphetInsights,
  getSignalStats,
  type TradingSignal,
  type MarketSentiment,
  type PricePrediction,
  type RiskAssessment,
  type ProphetInsight,
  type SignalStats,
  ProphetSignals,
} from '@/lib/ai/prophet-signals';

type ViewMode = 'dashboard' | 'signals' | 'analysis' | 'insights';

export default function ProphetPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [sentiment, setSentiment] = useState<MarketSentiment | null>(null);
  const [prediction, setPrediction] = useState<PricePrediction | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [insights, setInsights] = useState<ProphetInsight[]>([]);
  const [stats, setStats] = useState<SignalStats | null>(null);
  const [selectedAsset, setSelectedAsset] = useState('KAUS');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      setSentiment(getMarketSentiment());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Reload predictions when asset changes
    setPrediction(getPricePrediction(selectedAsset));
    setRiskAssessment(getRiskAssessment(selectedAsset));
  }, [selectedAsset]);

  const loadData = async () => {
    setIsLoading(true);
    setSignals(generateTradingSignals(10));
    setSentiment(getMarketSentiment());
    setPrediction(getPricePrediction(selectedAsset));
    setRiskAssessment(getRiskAssessment(selectedAsset));
    setInsights(getProphetInsights(10));
    setStats(getSignalStats());
    setIsLoading(false);
  };

  const viewModes = [
    { id: 'dashboard', label: 'Dashboard', shortLabel: '대시보드', icon: '📊' },
    { id: 'signals', label: 'Signals', shortLabel: '시그널', icon: '📡' },
    { id: 'analysis', label: 'Analysis', shortLabel: '분석', icon: '🔮' },
    { id: 'insights', label: 'Insights', shortLabel: '인사이트', icon: '🧠' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Desktop: Financial Terminal Sidebar */}
      <div className="hidden md:block">
        <FinancialSidebar />
      </div>

      {/* Mobile: Header */}
      <div className="md:hidden">
        <MobileHeader title="Prophet AI" />
      </div>

      <div className="md:ml-56">
        {/* Desktop Only */}
        <div className="hidden md:block">
          <PriceTicker />
          <MembershipBar />
        </div>

        <main className="p-4 md:p-6 pb-24 md:pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                    <span className="text-3xl md:text-4xl">🔮</span>
                    Prophet AI
                  </h1>
                  <p className="text-neutral-400 mt-1">
                    AI 기반 거래 신호 및 시장 인텔리전스
                  </p>
                </div>

                {/* Asset Selector */}
                <div className="flex gap-2">
                  {ProphetSignals.ASSETS.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset.id)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                        selectedAsset === asset.id
                          ? 'bg-violet-500 text-white'
                          : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                      }`}
                    >
                      <span>{asset.icon}</span>
                      <span className="hidden md:inline">{asset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* View Mode Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
              {viewModes.map((mode) => (
                <motion.button
                  key={mode.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode(mode.id as ViewMode)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                    viewMode === mode.id
                      ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  <span className="text-lg">{mode.icon}</span>
                  <span className="md:hidden">{mode.shortLabel}</span>
                  <span className="hidden md:inline">{mode.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="text-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="text-5xl inline-block"
                >
                  🔮
                </motion.div>
                <p className="text-neutral-400 mt-4">Prophet AI 분석 중...</p>
              </div>
            )}

            {/* Content */}
            {!isLoading && sentiment && prediction && riskAssessment && stats && (
              <motion.div
                key={viewMode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Dashboard View */}
                {viewMode === 'dashboard' && (
                  <div className="space-y-6">
                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <SignalStatsWidget stats={stats} />
                      <div className="md:col-span-2">
                        <ActiveSignalsList signals={signals.slice(0, 5)} />
                      </div>
                    </div>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <MarketSentimentGauge sentiment={sentiment} />
                      <PricePredictionWidget prediction={prediction} />
                      <RiskAssessmentMatrix assessment={riskAssessment} />
                    </div>

                    {/* Top Signals */}
                    <div>
                      <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                        <span>🔥</span> Top Signals
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {signals.slice(0, 3).map((signal) => (
                          <SignalCard key={signal.id} signal={signal} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Signals View */}
                {viewMode === 'signals' && (
                  <div className="space-y-6">
                    {/* Active Signals Overview */}
                    <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-2xl p-6 border border-emerald-500/30">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          <span>📡</span> Active Trading Signals
                        </h2>
                        <button
                          onClick={loadData}
                          className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
                        >
                          새로고침
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-black/20 rounded-xl p-3 text-center">
                          <div className="text-2xl font-bold text-emerald-400">
                            {signals.filter(s => s.type === 'STRONG_BUY' || s.type === 'BUY').length}
                          </div>
                          <div className="text-neutral-400 text-sm">매수 신호</div>
                        </div>
                        <div className="bg-black/20 rounded-xl p-3 text-center">
                          <div className="text-2xl font-bold text-red-400">
                            {signals.filter(s => s.type === 'STRONG_SELL' || s.type === 'SELL').length}
                          </div>
                          <div className="text-neutral-400 text-sm">매도 신호</div>
                        </div>
                        <div className="bg-black/20 rounded-xl p-3 text-center">
                          <div className="text-2xl font-bold text-amber-400">
                            {signals.filter(s => s.type === 'HOLD').length}
                          </div>
                          <div className="text-neutral-400 text-sm">홀드</div>
                        </div>
                        <div className="bg-black/20 rounded-xl p-3 text-center">
                          <div className="text-2xl font-bold text-white">
                            {Math.round(signals.reduce((acc, s) => acc + s.confidence, 0) / signals.length)}%
                          </div>
                          <div className="text-neutral-400 text-sm">평균 신뢰도</div>
                        </div>
                      </div>
                    </div>

                    {/* All Signals Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {signals.map((signal) => (
                        <SignalCard key={signal.id} signal={signal} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Analysis View */}
                {viewMode === 'analysis' && (
                  <div className="space-y-6">
                    {/* Selected Asset Header */}
                    <div className="bg-[#171717] rounded-2xl p-6 border border-neutral-800">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-4xl">
                          {ProphetSignals.ASSETS.find(a => a.id === selectedAsset)?.icon}
                        </span>
                        <div>
                          <h2 className="text-xl font-bold text-white">
                            {ProphetSignals.ASSETS.find(a => a.id === selectedAsset)?.name}
                          </h2>
                          <p className="text-neutral-400">종합 분석 리포트</p>
                        </div>
                        <div className="ml-auto text-right">
                          <div className="text-2xl font-bold text-white">
                            ₩{prediction.currentPrice.toLocaleString()}
                          </div>
                          <div className={`text-sm font-medium ${
                            prediction.predictions[2]?.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {prediction.predictions[2]?.change >= 0 ? '+' : ''}
                            {prediction.predictions[2]?.change.toFixed(2)}% (1D)
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Analysis Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <PricePredictionWidget prediction={prediction} />
                      <RiskAssessmentMatrix assessment={riskAssessment} />
                    </div>

                    {/* Sentiment */}
                    <MarketSentimentGauge sentiment={sentiment} />

                    {/* Related Signals */}
                    <div>
                      <h3 className="text-white font-bold text-lg mb-4">관련 시그널</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {signals.filter(s => s.asset === selectedAsset).slice(0, 3).map((signal) => (
                          <SignalCard key={signal.id} signal={signal} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Insights View */}
                {viewMode === 'insights' && (
                  <div className="space-y-6">
                    {/* Insights Header */}
                    <div className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-2xl p-6 border border-violet-500/30">
                      <div className="flex items-center gap-4">
                        <span className="text-4xl">🧠</span>
                        <div>
                          <h2 className="text-xl font-bold text-white">Prophet Insights</h2>
                          <p className="text-neutral-400">AI가 분석한 시장 인사이트</p>
                        </div>
                        <div className="ml-auto">
                          <span className="px-3 py-1.5 bg-violet-500 text-white rounded-lg text-sm font-medium">
                            {insights.length}개 인사이트
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Insights Feed */}
                    <ProphetInsightsFeed insights={insights} />

                    {/* Signal Stats */}
                    <SignalStatsWidget stats={stats} />
                  </div>
                )}
              </motion.div>
            )}

            {/* Prophet Disclaimer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 p-4 bg-neutral-900/50 rounded-xl border border-neutral-800"
            >
              <p className="text-neutral-500 text-xs text-center">
                ⚠️ Prophet AI 시그널은 투자 권유가 아닙니다. 모든 투자 결정은 본인의 책임 하에 이루어져야 합니다.
                과거 실적이 미래 수익을 보장하지 않습니다.
              </p>
            </motion.div>
          </div>
        </main>
      </div>

      {/* Mobile: Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
