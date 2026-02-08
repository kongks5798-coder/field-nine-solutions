'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 51: AI PROPHET TRADING SIGNALS DASHBOARD
 * ═══════════════════════════════════════════════════════════════════════════════
 * - Real-time trading signal cards
 * - Market sentiment gauge
 * - Price prediction charts
 * - Risk assessment matrix
 * - Prophet insights feed
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  type SignalType,
  type TimeFrame,
} from '@/lib/ai/prophet-signals';

// ═══════════════════════════════════════════════════════════════════════════════
// SIGNAL CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface SignalCardProps {
  signal: TradingSignal;
  onAction?: (signal: TradingSignal) => void;
}

export function SignalCard({ signal, onAction }: SignalCardProps) {
  const signalColors: Record<SignalType, { bg: string; text: string; border: string }> = {
    STRONG_BUY: { bg: 'from-emerald-500/20 to-green-500/20', text: 'text-emerald-400', border: 'border-emerald-500/50' },
    BUY: { bg: 'from-green-500/10 to-emerald-500/10', text: 'text-green-400', border: 'border-green-500/30' },
    HOLD: { bg: 'from-amber-500/10 to-yellow-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    SELL: { bg: 'from-orange-500/10 to-red-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
    STRONG_SELL: { bg: 'from-red-500/20 to-rose-500/20', text: 'text-red-400', border: 'border-red-500/50' },
  };

  const colors = signalColors[signal.type];
  const isBullish = signal.type === 'BUY' || signal.type === 'STRONG_BUY';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`relative bg-gradient-to-br ${colors.bg} rounded-2xl p-5 border ${colors.border} cursor-pointer transition-all`}
      onClick={() => onAction?.(signal)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{signal.assetIcon}</span>
          <div>
            <div className="text-white font-bold">{signal.assetName}</div>
            <div className="text-neutral-400 text-xs">{signal.source} • {signal.timeFrame}</div>
          </div>
        </div>
        <div className={`px-3 py-1.5 rounded-lg font-bold text-sm ${colors.text} bg-black/30`}>
          {signal.type.replace('_', ' ')}
        </div>
      </div>

      {/* Confidence */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-neutral-400">신뢰도</span>
          <span className={`font-bold ${colors.text}`}>{signal.confidence}%</span>
        </div>
        <div className="h-2 bg-black/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${signal.confidence}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full ${isBullish ? 'bg-emerald-500' : 'bg-red-500'}`}
          />
        </div>
      </div>

      {/* Price Targets */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-black/20 rounded-xl p-2 text-center">
          <div className="text-neutral-500 text-[10px]">진입가</div>
          <div className="text-white font-bold text-sm">₩{signal.entryPrice.toLocaleString()}</div>
        </div>
        <div className="bg-black/20 rounded-xl p-2 text-center">
          <div className="text-neutral-500 text-[10px]">목표가</div>
          <div className={`font-bold text-sm ${colors.text}`}>₩{signal.targetPrice.toLocaleString()}</div>
        </div>
        <div className="bg-black/20 rounded-xl p-2 text-center">
          <div className="text-neutral-500 text-[10px]">손절가</div>
          <div className="text-red-400 font-bold text-sm">₩{signal.stopLoss.toLocaleString()}</div>
        </div>
      </div>

      {/* Risk/Reward */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 text-sm">+{signal.potentialGain}%</span>
          <span className="text-neutral-600">/</span>
          <span className="text-red-400 text-sm">-{signal.potentialLoss}%</span>
        </div>
        <div className="text-neutral-400 text-sm">
          R:R <span className="text-white font-bold">{signal.riskReward}</span>
        </div>
      </div>

      {/* Reasoning */}
      <div className="text-neutral-400 text-xs leading-relaxed border-t border-white/10 pt-3">
        {signal.reasoning}
      </div>

      {/* Technical Indicators */}
      <div className="flex gap-1 mt-3 flex-wrap">
        {signal.technicalIndicators.slice(0, 3).map((ind, i) => (
          <span
            key={i}
            className={`px-2 py-0.5 rounded text-[10px] ${
              ind.signal === 'BULLISH' ? 'bg-emerald-500/20 text-emerald-400' :
              ind.signal === 'BEARISH' ? 'bg-red-500/20 text-red-400' :
              'bg-neutral-500/20 text-neutral-400'
            }`}
          >
            {ind.name}
          </span>
        ))}
      </div>

      {/* Expiry */}
      <div className="absolute top-3 right-3 text-neutral-600 text-[10px]">
        {Math.floor((signal.expiresAt.getTime() - Date.now()) / 3600000)}h
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARKET SENTIMENT GAUGE
// ═══════════════════════════════════════════════════════════════════════════════

interface SentimentGaugeProps {
  sentiment: MarketSentiment;
}

export function MarketSentimentGauge({ sentiment }: SentimentGaugeProps) {
  const getFearGreedLabel = (value: number) => {
    if (value < 20) return { label: 'Extreme Fear', labelKo: '극심한 공포', color: 'text-red-500' };
    if (value < 40) return { label: 'Fear', labelKo: '공포', color: 'text-orange-500' };
    if (value < 60) return { label: 'Neutral', labelKo: '중립', color: 'text-yellow-500' };
    if (value < 80) return { label: 'Greed', labelKo: '탐욕', color: 'text-green-500' };
    return { label: 'Extreme Greed', labelKo: '극심한 탐욕', color: 'text-emerald-500' };
  };

  const fgStatus = getFearGreedLabel(sentiment.fearGreedIndex);

  const conditionColors = {
    BULL: 'text-emerald-400',
    BEAR: 'text-red-400',
    SIDEWAYS: 'text-amber-400',
    VOLATILE: 'text-purple-400',
    ACCUMULATION: 'text-cyan-400',
    DISTRIBUTION: 'text-orange-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#171717] rounded-2xl p-6 border border-neutral-800"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
          <span className="text-xl">🎯</span>
        </div>
        <div>
          <h3 className="text-white font-medium">Market Sentiment</h3>
          <p className="text-neutral-500 text-sm">시장 심리 분석</p>
        </div>
      </div>

      {/* Fear & Greed Index */}
      <div className="mb-6">
        <div className="relative h-4 bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 rounded-full mb-2">
          <motion.div
            initial={{ left: '50%' }}
            animate={{ left: `${sentiment.fearGreedIndex}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute top-1/2 -translate-y-1/2 w-4 h-6 bg-white rounded shadow-lg border-2 border-neutral-300"
            style={{ marginLeft: '-8px' }}
          />
        </div>
        <div className="flex justify-between text-xs text-neutral-500">
          <span>공포</span>
          <span className={`font-bold ${fgStatus.color}`}>
            {sentiment.fearGreedIndex} - {fgStatus.labelKo}
          </span>
          <span>탐욕</span>
        </div>
      </div>

      {/* Market Condition */}
      <div className="bg-neutral-800/50 rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-neutral-400">시장 상태</span>
          <span className={`font-bold ${conditionColors[sentiment.condition]}`}>
            {sentiment.condition}
          </span>
        </div>
      </div>

      {/* Sentiment Sources */}
      <div className="space-y-3">
        {sentiment.sources.map((source, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>{source.icon}</span>
              <span className="text-neutral-300 text-sm">{source.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${source.score}%` }}
                  className={`h-full ${
                    source.score > 60 ? 'bg-emerald-500' :
                    source.score < 40 ? 'bg-red-500' : 'bg-amber-500'
                  }`}
                />
              </div>
              <span className={`text-xs font-medium w-8 text-right ${
                source.trend === 'UP' ? 'text-emerald-400' :
                source.trend === 'DOWN' ? 'text-red-400' : 'text-neutral-400'
              }`}>
                {source.trend === 'UP' ? '↑' : source.trend === 'DOWN' ? '↓' : '→'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-neutral-800">
        <div className="text-center">
          <div className={`text-lg font-bold ${
            sentiment.whaleActivity === 'ACCUMULATING' ? 'text-emerald-400' :
            sentiment.whaleActivity === 'DISTRIBUTING' ? 'text-red-400' : 'text-neutral-400'
          }`}>
            🐋
          </div>
          <div className="text-[10px] text-neutral-500">
            {sentiment.whaleActivity === 'ACCUMULATING' ? '매집중' :
             sentiment.whaleActivity === 'DISTRIBUTING' ? '매도중' : '중립'}
          </div>
        </div>
        <div className="text-center">
          <div className={`text-lg font-bold ${
            sentiment.institutionalFlow === 'INFLOW' ? 'text-emerald-400' :
            sentiment.institutionalFlow === 'OUTFLOW' ? 'text-red-400' : 'text-neutral-400'
          }`}>
            🏦
          </div>
          <div className="text-[10px] text-neutral-500">
            {sentiment.institutionalFlow === 'INFLOW' ? '유입' :
             sentiment.institutionalFlow === 'OUTFLOW' ? '유출' : '균형'}
          </div>
        </div>
        <div className="text-center">
          <div className={`text-lg font-bold ${
            sentiment.retailSentiment === 'BULLISH' ? 'text-emerald-400' :
            sentiment.retailSentiment === 'BEARISH' ? 'text-red-400' : 'text-neutral-400'
          }`}>
            👥
          </div>
          <div className="text-[10px] text-neutral-500">
            {sentiment.retailSentiment === 'BULLISH' ? '강세' :
             sentiment.retailSentiment === 'BEARISH' ? '약세' : '중립'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRICE PREDICTION WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

interface PricePredictionWidgetProps {
  prediction: PricePrediction;
}

export function PricePredictionWidget({ prediction }: PricePredictionWidgetProps) {
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('1D');
  const selectedPrediction = prediction.predictions.find(p => p.timeFrame === selectedTimeFrame);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-[#171717] rounded-2xl p-6 border border-neutral-800"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <span className="text-xl">🔮</span>
          </div>
          <div>
            <h3 className="text-white font-medium">Price Prediction</h3>
            <p className="text-neutral-500 text-sm">AI 가격 예측</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-emerald-400 text-xs">정확도</div>
          <div className="text-white font-bold">{prediction.modelAccuracy}%</div>
        </div>
      </div>

      {/* Current Price */}
      <div className="bg-neutral-800/50 rounded-xl p-4 mb-4">
        <div className="text-neutral-400 text-sm mb-1">현재 가격</div>
        <div className="text-3xl font-bold text-white">
          ₩{prediction.currentPrice.toLocaleString()}
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        {prediction.predictions.map((p) => (
          <button
            key={p.timeFrame}
            onClick={() => setSelectedTimeFrame(p.timeFrame)}
            className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${
              selectedTimeFrame === p.timeFrame
                ? 'bg-cyan-500 text-white font-medium'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
            }`}
          >
            {p.timeFrame}
          </button>
        ))}
      </div>

      {/* Prediction Details */}
      {selectedPrediction && (
        <motion.div
          key={selectedTimeFrame}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {/* Predicted Price */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-red-500/10 rounded-xl p-3 text-center">
              <div className="text-neutral-500 text-[10px]">하한</div>
              <div className="text-red-400 font-bold">₩{selectedPrediction.lowerBound.toLocaleString()}</div>
            </div>
            <div className={`${selectedPrediction.change >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'} rounded-xl p-3 text-center`}>
              <div className="text-neutral-500 text-[10px]">예측</div>
              <div className={`font-bold ${selectedPrediction.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ₩{selectedPrediction.predictedPrice.toLocaleString()}
              </div>
            </div>
            <div className="bg-emerald-500/10 rounded-xl p-3 text-center">
              <div className="text-neutral-500 text-[10px]">상한</div>
              <div className="text-emerald-400 font-bold">₩{selectedPrediction.upperBound.toLocaleString()}</div>
            </div>
          </div>

          {/* Change & Confidence */}
          <div className="flex justify-between items-center bg-neutral-800/30 rounded-xl p-3">
            <div>
              <div className="text-neutral-500 text-xs">예상 변동</div>
              <div className={`font-bold text-lg ${selectedPrediction.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {selectedPrediction.change >= 0 ? '+' : ''}{selectedPrediction.change.toFixed(2)}%
              </div>
            </div>
            <div className="text-right">
              <div className="text-neutral-500 text-xs">신뢰도</div>
              <div className="text-cyan-400 font-bold text-lg">{selectedPrediction.confidence}%</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Support & Resistance */}
      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-neutral-800">
        <div>
          <div className="text-neutral-500 text-xs mb-2">지지선</div>
          <div className="space-y-1">
            {prediction.supportLevels.map((level, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-emerald-400 text-sm font-mono">₩{level.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-neutral-500 text-xs mb-2">저항선</div>
          <div className="space-y-1">
            {prediction.resistanceLevels.map((level, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-red-400 text-sm font-mono">₩{level.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Events */}
      {prediction.keyEvents.length > 0 && (
        <div className="mt-4 pt-4 border-t border-neutral-800">
          <div className="text-neutral-500 text-xs mb-2">주요 이벤트</div>
          <div className="space-y-2">
            {prediction.keyEvents.slice(0, 2).map((event) => (
              <div key={event.id} className="flex items-center gap-2 text-sm">
                <span>{event.icon}</span>
                <span className="text-neutral-300">{event.titleKo}</span>
                <span className={`ml-auto text-xs ${
                  event.type === 'POSITIVE' ? 'text-emerald-400' :
                  event.type === 'NEGATIVE' ? 'text-red-400' : 'text-neutral-400'
                }`}>
                  {Math.ceil((event.date.getTime() - Date.now()) / 86400000)}일 후
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RISK ASSESSMENT MATRIX
// ═══════════════════════════════════════════════════════════════════════════════

interface RiskMatrixProps {
  assessment: RiskAssessment;
}

export function RiskAssessmentMatrix({ assessment }: RiskMatrixProps) {
  const riskColors = {
    LOW: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', bar: 'bg-emerald-500' },
    MEDIUM: { bg: 'bg-amber-500/20', text: 'text-amber-400', bar: 'bg-amber-500' },
    HIGH: { bg: 'bg-orange-500/20', text: 'text-orange-400', bar: 'bg-orange-500' },
    EXTREME: { bg: 'bg-red-500/20', text: 'text-red-400', bar: 'bg-red-500' },
  };

  const overallColors = riskColors[assessment.overallRisk];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-[#171717] rounded-2xl p-6 border border-neutral-800"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
          <span className="text-xl">⚠️</span>
        </div>
        <div>
          <h3 className="text-white font-medium">Risk Assessment</h3>
          <p className="text-neutral-500 text-sm">리스크 분석</p>
        </div>
      </div>

      {/* Overall Risk Score */}
      <div className={`${overallColors.bg} rounded-xl p-4 mb-4 border ${overallColors.text.replace('text', 'border')}/30`}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-neutral-400">종합 리스크</span>
          <span className={`font-bold ${overallColors.text}`}>{assessment.overallRisk}</span>
        </div>
        <div className="h-3 bg-black/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${assessment.riskScore}%` }}
            transition={{ duration: 1 }}
            className={`h-full ${overallColors.bar}`}
          />
        </div>
        <div className="text-right text-xs text-neutral-500 mt-1">{assessment.riskScore}/100</div>
      </div>

      {/* Risk Factors */}
      <div className="space-y-3 mb-4">
        {assessment.factors.map((factor, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${riskColors[factor.level].bar}`} />
              <span className="text-neutral-300 text-sm">{factor.nameKo}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${riskColors[factor.level].text}`}>{factor.level}</span>
              <span className={`text-xs ${
                factor.trend === 'INCREASING' ? 'text-red-400' :
                factor.trend === 'DECREASING' ? 'text-emerald-400' : 'text-neutral-500'
              }`}>
                {factor.trend === 'INCREASING' ? '↑' : factor.trend === 'DECREASING' ? '↓' : '→'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div className="border-t border-neutral-800 pt-4">
        <div className="text-neutral-500 text-xs mb-2">권장 사항</div>
        <div className="space-y-2">
          {assessment.recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="text-amber-400">•</span>
              <span className="text-neutral-300">{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROPHET INSIGHTS FEED
// ═══════════════════════════════════════════════════════════════════════════════

interface InsightsFeedProps {
  insights: ProphetInsight[];
}

export function ProphetInsightsFeed({ insights }: InsightsFeedProps) {
  const typeColors = {
    OPPORTUNITY: 'border-emerald-500/50 bg-emerald-500/10',
    WARNING: 'border-amber-500/50 bg-amber-500/10',
    ANALYSIS: 'border-blue-500/50 bg-blue-500/10',
    TREND: 'border-purple-500/50 bg-purple-500/10',
    NEWS: 'border-cyan-500/50 bg-cyan-500/10',
  };

  const impactBadge = {
    HIGH: 'bg-red-500 text-white',
    MEDIUM: 'bg-amber-500 text-black',
    LOW: 'bg-neutral-600 text-white',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-[#171717] rounded-2xl p-6 border border-neutral-800"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <span className="text-xl">🧠</span>
        </div>
        <div>
          <h3 className="text-white font-medium">Prophet Insights</h3>
          <p className="text-neutral-500 text-sm">AI 인사이트</p>
        </div>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        <AnimatePresence>
          {insights.map((insight, index) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-xl p-4 border-l-4 ${typeColors[insight.type]}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{insight.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium">{insight.titleKo}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${impactBadge[insight.impact]}`}>
                      {insight.impact}
                    </span>
                  </div>
                  <p className="text-neutral-400 text-sm">{insight.summaryKo}</p>

                  <div className="flex items-center gap-2 mt-2">
                    {insight.assets.map((asset, i) => (
                      <span key={i} className="px-2 py-0.5 bg-neutral-800 rounded text-xs text-neutral-300">
                        {asset}
                      </span>
                    ))}
                    <span className="text-neutral-600 text-xs ml-auto">
                      신뢰도 {insight.confidence}%
                    </span>
                  </div>

                  {insight.actionable && insight.action && (
                    <div className="mt-3 pt-2 border-t border-white/10">
                      <button className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                        insight.action.type === 'BUY' || insight.action.type === 'STRONG_BUY'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}>
                        {insight.action.type.replace('_', ' ')} {insight.action.target}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIGNAL STATS WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

interface SignalStatsWidgetProps {
  stats: SignalStats;
}

export function SignalStatsWidget({ stats }: SignalStatsWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-2xl p-6 border border-violet-500/30"
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">📊</span>
        <div>
          <h3 className="text-white font-medium">Prophet 실적</h3>
          <p className="text-neutral-400 text-sm">AI 시그널 성과</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-black/20 rounded-xl p-3 text-center">
          <div className="text-3xl font-bold text-white">{stats.accuracy}%</div>
          <div className="text-neutral-500 text-xs">정확도</div>
        </div>
        <div className="bg-black/20 rounded-xl p-3 text-center">
          <div className="text-3xl font-bold text-emerald-400">+{stats.averageGain}%</div>
          <div className="text-neutral-500 text-xs">평균 수익</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="text-lg font-bold text-white">{stats.totalSignals}</div>
          <div className="text-neutral-500 text-[10px]">총 시그널</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-emerald-400">{stats.profitableSignals}</div>
          <div className="text-neutral-500 text-[10px]">수익 시그널</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-cyan-400">{stats.activeSignals}</div>
          <div className="text-neutral-500 text-[10px]">활성 시그널</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-neutral-400 text-sm">최고 수익</span>
          <span className="text-emerald-400 font-bold">
            {stats.bestSignal.asset} +{stats.bestSignal.gain}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVE SIGNALS LIST
// ═══════════════════════════════════════════════════════════════════════════════

interface ActiveSignalsListProps {
  signals: TradingSignal[];
  onSelectSignal?: (signal: TradingSignal) => void;
}

export function ActiveSignalsList({ signals, onSelectSignal }: ActiveSignalsListProps) {
  const signalColors: Record<SignalType, string> = {
    STRONG_BUY: 'text-emerald-400',
    BUY: 'text-green-400',
    HOLD: 'text-amber-400',
    SELL: 'text-orange-400',
    STRONG_SELL: 'text-red-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-[#171717] rounded-2xl p-6 border border-neutral-800"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📡</span>
          <h3 className="text-white font-medium">Active Signals</h3>
        </div>
        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium">
          {signals.length} 활성
        </span>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {signals.map((signal, index) => (
          <motion.div
            key={signal.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => onSelectSignal?.(signal)}
            className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-xl hover:bg-neutral-800 cursor-pointer transition-colors"
          >
            <span className="text-xl">{signal.assetIcon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">{signal.asset}</span>
                <span className={`text-xs font-bold ${signalColors[signal.type]}`}>
                  {signal.type.replace('_', ' ')}
                </span>
              </div>
              <div className="text-neutral-500 text-xs">{signal.timeFrame} • {signal.confidence}%</div>
            </div>
            <div className="text-right">
              <div className="text-emerald-400 text-sm font-medium">+{signal.potentialGain}%</div>
              <div className="text-neutral-600 text-xs">목표</div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ProphetSignalsDashboard() {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [sentiment, setSentiment] = useState<MarketSentiment | null>(null);
  const [prediction, setPrediction] = useState<PricePrediction | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [insights, setInsights] = useState<ProphetInsight[]>([]);
  const [stats, setStats] = useState<SignalStats | null>(null);

  useEffect(() => {
    // Load data
    setSignals(generateTradingSignals(6));
    setSentiment(getMarketSentiment());
    setPrediction(getPricePrediction('KAUS'));
    setRiskAssessment(getRiskAssessment('KAUS'));
    setInsights(getProphetInsights(5));
    setStats(getSignalStats());

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      setSentiment(getMarketSentiment());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!sentiment || !prediction || !riskAssessment || !stats) {
    return (
      <div className="text-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="text-4xl inline-block"
        >
          🔮
        </motion.div>
        <p className="text-neutral-400 mt-2">Prophet AI 분석 중...</p>
      </div>
    );
  }

  return (
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

      {/* Signals Grid */}
      <div>
        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <span>📡</span> Trading Signals
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {signals.slice(0, 6).map((signal) => (
            <SignalCard key={signal.id} signal={signal} />
          ))}
        </div>
      </div>

      {/* Insights */}
      <ProphetInsightsFeed insights={insights} />
    </div>
  );
}
