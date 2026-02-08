'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getTopTraders,
  getStrategies,
  getSocialFeed,
  followTrader,
  isFollowing,
  startCopyTrade,
  getCopyTrades,
  getCopyTradeStats,
  getTraderBadges,
  type TraderProfile,
  type TradingStrategy,
  type SocialFeedItem,
  type CopyTradeConfig,
  type ReputationBadge,
} from '@/lib/ai/social-trading';

// ============================================================
// TOP TRADERS WIDGET
// ============================================================
export function TopTradersWidget() {
  const [traders, setTraders] = useState<TraderProfile[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  useEffect(() => {
    setTraders(getTopTraders(5));
  }, []);

  const handleFollow = (traderId: string) => {
    followTrader(traderId);
    setFollowing(prev => {
      const newSet = new Set(prev);
      if (newSet.has(traderId)) {
        newSet.delete(traderId);
      } else {
        newSet.add(traderId);
      }
      return newSet;
    });
  };

  const tierStyles: Record<string, string> = {
    BRONZE: 'from-amber-900 to-amber-700',
    SILVER: 'from-neutral-400 to-neutral-300',
    GOLD: 'from-yellow-500 to-amber-400',
    PLATINUM: 'from-cyan-400 to-blue-500',
    DIAMOND: 'from-violet-500 to-purple-600',
    SOVEREIGN: 'from-amber-400 via-rose-500 to-violet-600',
  };

  const tierIcons: Record<string, string> = {
    BRONZE: '🥉',
    SILVER: '🥈',
    GOLD: '🥇',
    PLATINUM: '💎',
    DIAMOND: '👑',
    SOVEREIGN: '⚜️',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#171717] rounded-2xl p-6 border border-neutral-800"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <span className="text-xl">🏆</span>
          </div>
          <div>
            <h3 className="text-white font-medium">Top Traders</h3>
            <p className="text-neutral-500 text-sm">인기 트레이더</p>
          </div>
        </div>
        <button className="text-amber-400 text-sm hover:text-amber-300 transition-colors">
          전체보기 →
        </button>
      </div>

      <div className="space-y-4">
        {traders.map((trader, index) => (
          <motion.div
            key={trader.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-neutral-800/50 rounded-xl p-4 hover:bg-neutral-800 transition-colors"
          >
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tierStyles[trader.tier]} flex items-center justify-center text-white font-bold text-sm`}>
                {index + 1}
              </div>

              {/* Avatar */}
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-neutral-700 flex items-center justify-center text-2xl">
                  {trader.avatar}
                </div>
                {trader.isVerified && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
                {trader.isPro && (
                  <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                    <span className="text-black text-xs font-bold">P</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium truncate">{trader.username}</span>
                  <span>{tierIcons[trader.tier]}</span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-neutral-500">
                  <span>승률 {trader.stats.winRate.toFixed(0)}%</span>
                  <span>팔로워 {trader.social.followers.toLocaleString()}</span>
                </div>
              </div>

              {/* Stats & Actions */}
              <div className="text-right">
                <div className="text-emerald-400 font-bold">
                  +{trader.stats.monthlyReturn.toFixed(1)}%
                </div>
                <div className="text-neutral-500 text-xs">이번 달</div>
              </div>

              {/* Follow Button */}
              <button
                onClick={() => handleFollow(trader.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  following.has(trader.id)
                    ? 'bg-neutral-700 text-neutral-300'
                    : 'bg-amber-500 text-black hover:bg-amber-400'
                }`}
              >
                {following.has(trader.id) ? '팔로잉' : '팔로우'}
              </button>
            </div>

            {/* Trading Style */}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-neutral-700 rounded text-xs text-neutral-400">
                {trader.style.primary === 'SCALPER' ? '단타' :
                 trader.style.primary === 'DAY_TRADER' ? '데이트레이더' :
                 trader.style.primary === 'SWING' ? '스윙' :
                 trader.style.primary === 'POSITION' ? '포지션' : '장기홀더'}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs ${
                trader.style.riskLevel === 'CONSERVATIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                trader.style.riskLevel === 'MODERATE' ? 'bg-amber-500/20 text-amber-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {trader.style.riskLevel === 'CONSERVATIVE' ? '보수적' :
                 trader.style.riskLevel === 'MODERATE' ? '균형' : '공격적'}
              </span>
              {trader.featuredStrategy && (
                <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded text-xs">
                  {trader.featuredStrategy}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================
// STRATEGY MARKETPLACE
// ============================================================
export function StrategyMarketplace() {
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'>('ALL');

  useEffect(() => {
    const filterConfig = filter === 'ALL' ? undefined : { riskLevel: filter as 'LOW' | 'MEDIUM' | 'HIGH' };
    setStrategies(getStrategies(filterConfig));
  }, [filter]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-[#171717] rounded-2xl p-6 border border-neutral-800"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <span className="text-xl">🎯</span>
          </div>
          <div>
            <h3 className="text-white font-medium">Strategy Marketplace</h3>
            <p className="text-neutral-500 text-sm">검증된 전략</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['ALL', 'LOW', 'MEDIUM', 'HIGH'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              filter === f
                ? 'bg-violet-500 text-white font-medium'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
            }`}
          >
            {f === 'ALL' ? '전체' : f === 'LOW' ? '안정' : f === 'MEDIUM' ? '균형' : '공격'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {strategies.slice(0, 4).map((strategy, index) => (
          <motion.div
            key={strategy.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`rounded-xl p-4 border transition-all cursor-pointer hover:brightness-110 ${
              strategy.isFeatured
                ? 'bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/30'
                : 'bg-neutral-800/50 border-neutral-700'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{strategy.name}</span>
                  {strategy.isFeatured && (
                    <span className="px-2 py-0.5 bg-violet-500 text-white text-xs rounded font-medium">
                      Featured
                    </span>
                  )}
                </div>
                <p className="text-neutral-500 text-sm mt-1 line-clamp-1">
                  by {strategy.creator.username}
                </p>
              </div>
              <div className="text-right">
                <div className="text-emerald-400 font-bold">
                  +{strategy.performance.totalReturn.toFixed(1)}%
                </div>
                <div className="text-neutral-500 text-xs">
                  {strategy.performance.runtime}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center">
                <div className="text-white text-sm font-medium">
                  {strategy.performance.winRate.toFixed(0)}%
                </div>
                <div className="text-neutral-500 text-xs">승률</div>
              </div>
              <div className="text-center">
                <div className="text-white text-sm font-medium">
                  {strategy.copiers}
                </div>
                <div className="text-neutral-500 text-xs">카피어</div>
              </div>
              <div className="text-center">
                <div className="text-amber-400 text-sm font-medium">
                  ⭐ {strategy.rating.toFixed(1)}
                </div>
                <div className="text-neutral-500 text-xs">{strategy.reviews}개 리뷰</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {strategy.tags.map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 bg-neutral-700 rounded text-xs text-neutral-400">
                    {tag}
                  </span>
                ))}
              </div>
              <button className="px-4 py-1.5 bg-violet-500 hover:bg-violet-400 text-white text-sm font-medium rounded-lg transition-colors">
                카피하기
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================
// SOCIAL FEED
// ============================================================
export function SocialFeedWidget() {
  const [feed, setFeed] = useState<SocialFeedItem[]>([]);
  const [filterType, setFilterType] = useState<SocialFeedItem['type'] | 'ALL'>('ALL');

  useEffect(() => {
    const filterConfig = filterType === 'ALL' ? undefined : { type: filterType };
    setFeed(getSocialFeed(filterConfig as { type?: SocialFeedItem['type'] }));

    const interval = setInterval(() => {
      setFeed(getSocialFeed(filterConfig as { type?: SocialFeedItem['type'] }));
    }, 30000);

    return () => clearInterval(interval);
  }, [filterType]);

  const typeIcons: Record<SocialFeedItem['type'], string> = {
    TRADE: '📈',
    ACHIEVEMENT: '🏅',
    MILESTONE: '🎯',
    STRATEGY: '💡',
    COMMENT: '💬',
    FOLLOW: '👥',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-[#171717] rounded-2xl p-6 border border-neutral-800"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <span className="text-xl">📡</span>
          </div>
          <div>
            <h3 className="text-white font-medium">Social Feed</h3>
            <p className="text-neutral-500 text-sm">실시간 활동</p>
          </div>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        {(['ALL', 'TRADE', 'ACHIEVEMENT', 'STRATEGY'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
              filterType === type
                ? 'bg-cyan-500 text-white font-medium'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
            }`}
          >
            {type === 'ALL' ? '전체' :
             type === 'TRADE' ? '거래' :
             type === 'ACHIEVEMENT' ? '업적' : '전략'}
          </button>
        ))}
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto">
        <AnimatePresence>
          {feed.slice(0, 10).map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.03 }}
              className="bg-neutral-800/50 rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center text-lg">
                    {item.trader.avatar}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-neutral-900 rounded-full flex items-center justify-center text-xs">
                    {typeIcons[item.type]}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium truncate">{item.trader.username}</span>
                    {item.trader.isVerified && (
                      <span className="text-blue-400 text-xs">✓</span>
                    )}
                    <span className="text-neutral-500 text-xs">
                      {new Date(item.timestamp).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="mt-1">
                    <span className="text-white text-sm">{item.content.title}</span>
                    {item.content.pnlPercent !== undefined && (
                      <span className={`ml-2 text-sm font-medium ${
                        item.content.pnlPercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {item.content.pnlPercent >= 0 ? '+' : ''}{item.content.pnlPercent.toFixed(1)}%
                      </span>
                    )}
                  </div>

                  <p className="text-neutral-500 text-xs mt-1 line-clamp-2">
                    {item.content.description}
                  </p>

                  {/* Engagement */}
                  <div className="flex items-center gap-4 mt-3">
                    <button className={`flex items-center gap-1 text-xs transition-colors ${
                      item.isLiked ? 'text-rose-400' : 'text-neutral-500 hover:text-rose-400'
                    }`}>
                      <span>{item.isLiked ? '❤️' : '🤍'}</span>
                      <span>{item.engagement.likes}</span>
                    </button>
                    <button className="flex items-center gap-1 text-xs text-neutral-500 hover:text-cyan-400 transition-colors">
                      <span>💬</span>
                      <span>{item.engagement.comments}</span>
                    </button>
                    {item.type === 'TRADE' && item.engagement.copies > 0 && (
                      <button className="flex items-center gap-1 text-xs text-neutral-500 hover:text-violet-400 transition-colors">
                        <span>📋</span>
                        <span>{item.engagement.copies} 카피</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ============================================================
// COPY TRADE MODAL
// ============================================================
export function CopyTradeModal({
  trader,
  isOpen,
  onClose,
}: {
  trader: TraderProfile;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(10000);
  const [copyRatio, setCopyRatio] = useState(100);
  const [stopLoss, setStopLoss] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartCopy = () => {
    setIsSubmitting(true);

    setTimeout(() => {
      startCopyTrade({
        traderId: trader.id,
        investment: {
          amount,
          currency: 'KAUS',
          maxAllocation: 50,
          stopLoss,
          takeProfit: 30,
        },
        settings: {
          copyRatio: copyRatio / 100,
          maxPositions: 5,
          copyOpenTrades: true,
          copyCloseTrades: true,
          excludeAssets: [],
        },
      });

      setIsSubmitting(false);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#171717] rounded-2xl p-6 w-full max-w-md border border-neutral-800"
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-neutral-700 flex items-center justify-center text-3xl">
              {trader.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-lg">{trader.username}</span>
                {trader.isVerified && (
                  <span className="text-blue-400">✓</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-emerald-400 font-medium">
                  +{trader.stats.monthlyReturn.toFixed(1)}%
                </span>
                <span className="text-neutral-500">월간 수익률</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6 bg-neutral-800/50 rounded-xl p-4">
            <div className="text-center">
              <div className="text-white font-bold">{trader.stats.winRate.toFixed(0)}%</div>
              <div className="text-neutral-500 text-xs">승률</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold">{trader.social.copiers}</div>
              <div className="text-neutral-500 text-xs">카피어</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold">{trader.social.reputation}</div>
              <div className="text-neutral-500 text-xs">평판</div>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4 mb-6">
            {/* Amount */}
            <div>
              <label className="text-neutral-400 text-sm mb-2 block">투자 금액</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500">KAUS</span>
              </div>
            </div>

            {/* Copy Ratio */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-neutral-400">카피 비율</span>
                <span className="text-white">{copyRatio}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                value={copyRatio}
                onChange={(e) => setCopyRatio(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Stop Loss */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-neutral-400">손절 라인</span>
                <span className="text-red-400">-{stopLoss}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                value={stopLoss}
                onChange={(e) => setStopLoss(Number(e.target.value))}
                className="w-full accent-red-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-neutral-800 text-neutral-300 rounded-xl font-medium hover:bg-neutral-700 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleStartCopy}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-amber-500 text-black rounded-xl font-medium hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <motion.span
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  처리 중...
                </motion.span>
              ) : (
                '카피 시작'
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================
// ACTIVE COPY TRADES
// ============================================================
export function ActiveCopyTrades() {
  const [copyTrades, setCopyTrades] = useState<CopyTradeConfig[]>([]);
  const [traders, setTraders] = useState<Map<string, TraderProfile>>(new Map());

  useEffect(() => {
    // Get copy trades
    const trades = getCopyTrades();
    setCopyTrades(trades);

    // Get trader profiles
    const allTraders = getTopTraders(20);
    const traderMap = new Map<string, TraderProfile>();
    allTraders.forEach(t => traderMap.set(t.id, t));
    setTraders(traderMap);
  }, []);

  // If no active copy trades, show demo data
  const displayTrades = copyTrades.length > 0 ? copyTrades : [
    {
      id: 'demo-1',
      traderId: 'user-1',
      investment: { amount: 25000, currency: 'KAUS' as const, maxAllocation: 50, stopLoss: 10, takeProfit: 30 },
      settings: { copyRatio: 1, maxPositions: 5, copyOpenTrades: true, copyCloseTrades: true, excludeAssets: [] },
      status: 'ACTIVE' as const,
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      totalPnL: 2150,
      totalPnLPercent: 8.6,
      tradesExecuted: 23,
    },
    {
      id: 'demo-2',
      traderId: 'user-2',
      investment: { amount: 15000, currency: 'KAUS' as const, maxAllocation: 40, stopLoss: 15, takeProfit: 25 },
      settings: { copyRatio: 0.5, maxPositions: 3, copyOpenTrades: true, copyCloseTrades: true, excludeAssets: [] },
      status: 'ACTIVE' as const,
      startedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      totalPnL: 1820,
      totalPnLPercent: 12.1,
      tradesExecuted: 45,
    },
  ];

  const demoTraders = getTopTraders(5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-[#171717] rounded-2xl p-6 border border-neutral-800"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <span className="text-xl">📋</span>
          </div>
          <div>
            <h3 className="text-white font-medium">Active Copy Trades</h3>
            <p className="text-neutral-500 text-sm">진행 중인 카피</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
          {displayTrades.length} 활성
        </div>
      </div>

      <div className="space-y-4">
        {displayTrades.map((trade, index) => {
          const trader = traders.get(trade.traderId) || demoTraders[index % demoTraders.length];

          return (
            <motion.div
              key={trade.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-neutral-800/50 rounded-xl p-4"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center text-lg">
                  {trader?.avatar || '👤'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{trader?.username || 'Trader'}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      trade.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                      trade.status === 'PAUSED' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-neutral-500/20 text-neutral-400'
                    }`}>
                      {trade.status}
                    </span>
                  </div>
                  <div className="text-neutral-500 text-xs">
                    {new Date(trade.startedAt).toLocaleDateString('ko-KR')} 시작
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${trade.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {trade.totalPnL >= 0 ? '+' : ''}{trade.totalPnLPercent.toFixed(1)}%
                  </div>
                  <div className="text-neutral-500 text-xs">
                    {trade.totalPnL >= 0 ? '+' : ''}₩{trade.totalPnL.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-neutral-900/50 rounded-lg p-2">
                  <div className="text-white font-medium">{trade.investment.amount.toLocaleString()}</div>
                  <div className="text-neutral-500">투자금</div>
                </div>
                <div className="bg-neutral-900/50 rounded-lg p-2">
                  <div className="text-white font-medium">{trade.tradesExecuted}</div>
                  <div className="text-neutral-500">거래</div>
                </div>
                <div className="bg-neutral-900/50 rounded-lg p-2">
                  <div className="text-white font-medium">{(trade.settings.copyRatio * 100).toFixed(0)}%</div>
                  <div className="text-neutral-500">비율</div>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <button className="flex-1 py-2 bg-neutral-700 text-neutral-300 rounded-lg text-sm hover:bg-neutral-600 transition-colors">
                  {trade.status === 'PAUSED' ? '재개' : '일시정지'}
                </button>
                <button className="flex-1 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors">
                  중단
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ============================================================
// TRADER BADGES DISPLAY
// ============================================================
export function TraderBadgesDisplay({ traderId }: { traderId: string }) {
  const [badges, setBadges] = useState<ReputationBadge[]>([]);

  useEffect(() => {
    setBadges(getTraderBadges(traderId));
  }, [traderId]);

  const rarityColors = {
    COMMON: 'from-neutral-500 to-neutral-400',
    RARE: 'from-blue-500 to-cyan-400',
    EPIC: 'from-violet-500 to-purple-400',
    LEGENDARY: 'from-amber-500 to-orange-400',
  };

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <motion.div
          key={badge.id}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          className={`px-3 py-1.5 rounded-lg bg-gradient-to-r ${rarityColors[badge.rarity]} cursor-pointer`}
          title={badge.description}
        >
          <span className="mr-1">{badge.icon}</span>
          <span className="text-white text-xs font-medium">{badge.name}</span>
        </motion.div>
      ))}
    </div>
  );
}
