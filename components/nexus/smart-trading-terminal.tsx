'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 52: SMART TRADING TERMINAL UI COMPONENTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * - Advanced order form with multiple order types
 * - Order book visualization
 * - Position manager
 * - Open orders list
 * - Trade history
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  createOrder,
  cancelOrder,
  getOpenOrders,
  getOrderHistory,
  getPositions,
  closePosition,
  getOrderBook,
  getRecentTrades,
  getTradingStats,
  calculateTradePreview,
  type Order,
  type Position,
  type OrderBook,
  type Trade,
  type TradingStats,
  type OrderType,
  type OrderSide,
  type TimeInForce,
  type TradePreview,
  SmartOrders,
} from '@/lib/trading/smart-orders';

// ═══════════════════════════════════════════════════════════════════════════════
// ADVANCED ORDER FORM
// ═══════════════════════════════════════════════════════════════════════════════

interface OrderFormProps {
  selectedAsset: string;
  onOrderCreated?: (order: Order) => void;
}

export function AdvancedOrderForm({ selectedAsset, onOrderCreated }: OrderFormProps) {
  const [orderType, setOrderType] = useState<OrderType>('LIMIT');
  const [side, setSide] = useState<OrderSide>('BUY');
  const [quantity, setQuantity] = useState<string>('100');
  const [price, setPrice] = useState<string>('');
  const [stopPrice, setStopPrice] = useState<string>('');
  const [trailingPercent, setTrailingPercent] = useState<string>('5');
  const [timeInForce, setTimeInForce] = useState<TimeInForce>('GTC');
  const [preview, setPreview] = useState<TradePreview | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const asset = SmartOrders.ASSETS.find(a => a.id === selectedAsset) || SmartOrders.ASSETS[0];

  useEffect(() => {
    setPrice(asset.basePrice.toString());
  }, [asset]);

  useEffect(() => {
    if (quantity && parseFloat(quantity) > 0) {
      const priceVal = orderType === 'MARKET' ? undefined : parseFloat(price) || undefined;
      setPreview(calculateTradePreview(selectedAsset, side, parseFloat(quantity), priceVal));
    } else {
      setPreview(null);
    }
  }, [selectedAsset, side, quantity, price, orderType]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const order = createOrder({
        asset: selectedAsset,
        type: orderType,
        side,
        quantity: parseFloat(quantity),
        price: orderType !== 'MARKET' ? parseFloat(price) : undefined,
        stopPrice: ['STOP_LIMIT', 'STOP_MARKET'].includes(orderType) ? parseFloat(stopPrice) : undefined,
        trailingPercent: orderType === 'TRAILING_STOP' ? parseFloat(trailingPercent) : undefined,
        timeInForce,
      });
      onOrderCreated?.(order);
    } finally {
      setIsSubmitting(false);
    }
  };

  const orderTypes: { id: OrderType; label: string }[] = [
    { id: 'MARKET', label: '시장가' },
    { id: 'LIMIT', label: '지정가' },
    { id: 'STOP_LIMIT', label: '스탑 지정가' },
    { id: 'STOP_MARKET', label: '스탑 시장가' },
    { id: 'TRAILING_STOP', label: '추적 손절' },
    { id: 'OCO', label: 'OCO' },
  ];

  const tifOptions: { id: TimeInForce; label: string }[] = [
    { id: 'GTC', label: 'GTC' },
    { id: 'IOC', label: 'IOC' },
    { id: 'FOK', label: 'FOK' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#171717] rounded-2xl p-6 border border-neutral-800"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">{asset.icon}</span>
        <div>
          <h3 className="text-white font-medium">{asset.name}</h3>
          <p className="text-neutral-500 text-sm">₩{asset.basePrice.toLocaleString()}</p>
        </div>
      </div>

      {/* Buy/Sell Toggle */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => setSide('BUY')}
          className={`py-3 rounded-xl font-bold text-lg transition-all ${
            side === 'BUY'
              ? 'bg-emerald-500 text-white'
              : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
          }`}
        >
          매수
        </button>
        <button
          onClick={() => setSide('SELL')}
          className={`py-3 rounded-xl font-bold text-lg transition-all ${
            side === 'SELL'
              ? 'bg-red-500 text-white'
              : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
          }`}
        >
          매도
        </button>
      </div>

      {/* Order Type Selection */}
      <div className="mb-4">
        <label className="text-neutral-400 text-xs mb-2 block">주문 유형</label>
        <div className="grid grid-cols-3 gap-1">
          {orderTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setOrderType(type.id)}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                orderType === type.id
                  ? 'bg-violet-500 text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Input */}
      {orderType !== 'MARKET' && (
        <div className="mb-4">
          <label className="text-neutral-400 text-xs mb-2 block">가격</label>
          <div className="relative">
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white text-right pr-12 focus:border-violet-500 focus:outline-none"
              placeholder="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">KRW</span>
          </div>
        </div>
      )}

      {/* Stop Price (for stop orders) */}
      {['STOP_LIMIT', 'STOP_MARKET'].includes(orderType) && (
        <div className="mb-4">
          <label className="text-neutral-400 text-xs mb-2 block">스탑 가격</label>
          <div className="relative">
            <input
              type="number"
              value={stopPrice}
              onChange={(e) => setStopPrice(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white text-right pr-12 focus:border-violet-500 focus:outline-none"
              placeholder="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">KRW</span>
          </div>
        </div>
      )}

      {/* Trailing Percent (for trailing stop) */}
      {orderType === 'TRAILING_STOP' && (
        <div className="mb-4">
          <label className="text-neutral-400 text-xs mb-2 block">추적 비율</label>
          <div className="relative">
            <input
              type="number"
              value={trailingPercent}
              onChange={(e) => setTrailingPercent(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white text-right pr-12 focus:border-violet-500 focus:outline-none"
              placeholder="5"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">%</span>
          </div>
        </div>
      )}

      {/* Quantity Input */}
      <div className="mb-4">
        <label className="text-neutral-400 text-xs mb-2 block">수량</label>
        <div className="relative">
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white text-right pr-16 focus:border-violet-500 focus:outline-none"
            placeholder="0"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">{asset.id}</span>
        </div>
        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-4 gap-2 mt-2">
          {[25, 50, 75, 100].map((pct) => (
            <button
              key={pct}
              onClick={() => setQuantity((1000 * pct / 100).toString())}
              className="py-1.5 bg-neutral-800 text-neutral-400 text-xs rounded-lg hover:bg-neutral-700"
            >
              {pct}%
            </button>
          ))}
        </div>
      </div>

      {/* Time in Force */}
      <div className="mb-4">
        <label className="text-neutral-400 text-xs mb-2 block">유효 기간</label>
        <div className="flex gap-2">
          {tifOptions.map((tif) => (
            <button
              key={tif.id}
              onClick={() => setTimeInForce(tif.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                timeInForce === tif.id
                  ? 'bg-neutral-700 text-white'
                  : 'bg-neutral-800 text-neutral-500 hover:bg-neutral-700'
              }`}
            >
              {tif.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trade Preview */}
      {preview && (
        <div className="bg-neutral-800/50 rounded-xl p-4 mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">예상 가격</span>
            <span className="text-white">₩{preview.price.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">소계</span>
            <span className="text-white">₩{preview.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">수수료 (0.1%)</span>
            <span className="text-amber-400">₩{preview.fee.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-neutral-700 pt-2 mt-2">
            <span className="text-neutral-400">총액</span>
            <span className="text-white font-bold">₩{preview.total.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        disabled={isSubmitting || !quantity || parseFloat(quantity) <= 0}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
          side === 'BUY'
            ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
            : 'bg-red-500 hover:bg-red-600 text-white'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isSubmitting ? '처리 중...' : side === 'BUY' ? `${asset.id} 매수` : `${asset.id} 매도`}
      </motion.button>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ORDER BOOK VISUALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

interface OrderBookProps {
  assetId: string;
}

export function OrderBookWidget({ assetId }: OrderBookProps) {
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [precision, setPrecision] = useState(2);

  useEffect(() => {
    const loadOrderBook = () => {
      setOrderBook(getOrderBook(assetId));
    };
    loadOrderBook();
    const interval = setInterval(loadOrderBook, 2000);
    return () => clearInterval(interval);
  }, [assetId]);

  if (!orderBook) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#171717] rounded-2xl p-4 border border-neutral-800"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium">Order Book</h3>
        <div className="flex gap-1">
          {[0, 1, 2].map((p) => (
            <button
              key={p}
              onClick={() => setPrecision(p)}
              className={`w-6 h-6 rounded text-xs ${
                precision === p ? 'bg-violet-500 text-white' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              .{p}
            </button>
          ))}
        </div>
      </div>

      {/* Headers */}
      <div className="grid grid-cols-3 text-xs text-neutral-500 mb-2">
        <span>가격(KRW)</span>
        <span className="text-right">수량</span>
        <span className="text-right">누적</span>
      </div>

      {/* Asks (Sells) */}
      <div className="space-y-0.5 mb-2">
        {orderBook.asks.slice(0, 8).reverse().map((level, i) => (
          <div key={i} className="relative grid grid-cols-3 text-xs py-1">
            <div
              className="absolute right-0 top-0 bottom-0 bg-red-500/10"
              style={{ width: `${level.percentage}%` }}
            />
            <span className="text-red-400 relative z-10">{level.price.toFixed(precision)}</span>
            <span className="text-neutral-300 text-right relative z-10">{level.quantity}</span>
            <span className="text-neutral-500 text-right relative z-10">{level.total}</span>
          </div>
        ))}
      </div>

      {/* Spread */}
      <div className="text-center py-2 border-y border-neutral-800">
        <span className="text-lg font-bold text-white">₩{orderBook.lastPrice.toFixed(precision)}</span>
        <span className="text-neutral-500 text-xs ml-2">
          스프레드: {orderBook.spreadPercent}%
        </span>
      </div>

      {/* Bids (Buys) */}
      <div className="space-y-0.5 mt-2">
        {orderBook.bids.slice(0, 8).map((level, i) => (
          <div key={i} className="relative grid grid-cols-3 text-xs py-1">
            <div
              className="absolute right-0 top-0 bottom-0 bg-emerald-500/10"
              style={{ width: `${level.percentage}%` }}
            />
            <span className="text-emerald-400 relative z-10">{level.price.toFixed(precision)}</span>
            <span className="text-neutral-300 text-right relative z-10">{level.quantity}</span>
            <span className="text-neutral-500 text-right relative z-10">{level.total}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// POSITIONS LIST
// ═══════════════════════════════════════════════════════════════════════════════

interface PositionsListProps {
  onClosePosition?: (position: Position) => void;
}

export function PositionsList({ onClosePosition }: PositionsListProps) {
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    const loadPositions = () => {
      setPositions(getPositions());
    };
    loadPositions();
    const interval = setInterval(loadPositions, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleClose = (position: Position) => {
    closePosition(position.id);
    setPositions(getPositions());
    onClosePosition?.(position);
  };

  const totalUnrealizedPnL = useMemo(() =>
    positions.reduce((sum, p) => sum + p.unrealizedPnL, 0), [positions]);

  if (positions.length === 0) {
    return (
      <div className="bg-[#171717] rounded-2xl p-6 border border-neutral-800 text-center">
        <span className="text-4xl mb-2 block">📭</span>
        <p className="text-neutral-400">보유 포지션이 없습니다</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#171717] rounded-2xl p-4 border border-neutral-800"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium">Positions</h3>
        <div className={`text-sm font-bold ${totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {totalUnrealizedPnL >= 0 ? '+' : ''}₩{totalUnrealizedPnL.toLocaleString()}
        </div>
      </div>

      <div className="space-y-3">
        {positions.map((position) => (
          <motion.div
            key={position.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-4 rounded-xl border ${
              position.unrealizedPnL >= 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{position.assetIcon}</span>
                <span className="text-white font-medium">{position.asset}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  position.side === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {position.side}
                </span>
              </div>
              <button
                onClick={() => handleClose(position)}
                className="px-3 py-1 bg-neutral-800 text-neutral-400 rounded-lg text-xs hover:bg-neutral-700"
              >
                청산
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>
                <div className="text-neutral-500">수량</div>
                <div className="text-white font-medium">{position.quantity}</div>
              </div>
              <div>
                <div className="text-neutral-500">진입가</div>
                <div className="text-white font-medium">₩{position.entryPrice.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-neutral-500">현재가</div>
                <div className="text-white font-medium">₩{position.currentPrice.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-neutral-500">P&L</div>
                <div className={`font-bold ${position.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {position.unrealizedPnL >= 0 ? '+' : ''}₩{position.unrealizedPnL.toLocaleString()}
                  <span className="text-neutral-500 ml-1">({position.unrealizedPnLPercent.toFixed(2)}%)</span>
                </div>
              </div>
            </div>

            {/* Stop Loss / Take Profit */}
            {(position.stopLoss || position.takeProfit) && (
              <div className="flex gap-4 mt-2 pt-2 border-t border-neutral-800">
                {position.stopLoss && (
                  <div className="text-xs">
                    <span className="text-red-400">SL: </span>
                    <span className="text-white">₩{position.stopLoss.toLocaleString()}</span>
                  </div>
                )}
                {position.takeProfit && (
                  <div className="text-xs">
                    <span className="text-emerald-400">TP: </span>
                    <span className="text-white">₩{position.takeProfit.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPEN ORDERS LIST
// ═══════════════════════════════════════════════════════════════════════════════

interface OpenOrdersListProps {
  onCancelOrder?: (order: Order) => void;
}

export function OpenOrdersList({ onCancelOrder }: OpenOrdersListProps) {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    setOrders(getOpenOrders());
  }, []);

  const handleCancel = (order: Order) => {
    cancelOrder(order.id);
    setOrders(getOpenOrders());
    onCancelOrder?.(order);
  };

  if (orders.length === 0) {
    return (
      <div className="bg-[#171717] rounded-2xl p-6 border border-neutral-800 text-center">
        <span className="text-4xl mb-2 block">📋</span>
        <p className="text-neutral-400">대기 중인 주문이 없습니다</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#171717] rounded-2xl p-4 border border-neutral-800"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium">Open Orders</h3>
        <span className="text-neutral-500 text-sm">{orders.length}건</span>
      </div>

      <div className="space-y-2">
        {orders.map((order) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{order.assetIcon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium text-sm">{order.asset}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    order.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {order.side}
                  </span>
                  <span className="px-1.5 py-0.5 bg-violet-500/20 text-violet-400 rounded text-[10px]">
                    {order.type}
                  </span>
                </div>
                <div className="text-neutral-500 text-xs">
                  {order.quantity} @ ₩{order.price?.toLocaleString()}
                </div>
              </div>
            </div>
            <button
              onClick={() => handleCancel(order)}
              className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30"
            >
              취소
            </button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECENT TRADES
// ═══════════════════════════════════════════════════════════════════════════════

interface RecentTradesProps {
  assetId: string;
}

export function RecentTradesWidget({ assetId }: RecentTradesProps) {
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    const loadTrades = () => {
      setTrades(getRecentTrades(assetId, 15));
    };
    loadTrades();
    const interval = setInterval(loadTrades, 3000);
    return () => clearInterval(interval);
  }, [assetId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#171717] rounded-2xl p-4 border border-neutral-800"
    >
      <h3 className="text-white font-medium mb-4">Recent Trades</h3>

      <div className="space-y-1 max-h-[300px] overflow-y-auto">
        <div className="grid grid-cols-3 text-xs text-neutral-500 mb-2 sticky top-0 bg-[#171717]">
          <span>가격</span>
          <span className="text-right">수량</span>
          <span className="text-right">시간</span>
        </div>
        {trades.map((trade) => (
          <div key={trade.id} className="grid grid-cols-3 text-xs py-1">
            <span className={trade.side === 'BUY' ? 'text-emerald-400' : 'text-red-400'}>
              ₩{trade.price.toLocaleString()}
            </span>
            <span className="text-neutral-300 text-right">{trade.quantity}</span>
            <span className="text-neutral-500 text-right">
              {trade.executedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRADING STATS WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

export function TradingStatsWidget() {
  const [stats, setStats] = useState<TradingStats | null>(null);

  useEffect(() => {
    setStats(getTradingStats());
  }, []);

  if (!stats) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-2xl p-6 border border-violet-500/30"
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">📊</span>
        <h3 className="text-white font-medium">Trading Stats</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-black/20 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-white">{stats.winRate}%</div>
          <div className="text-neutral-400 text-xs">승률</div>
        </div>
        <div className="bg-black/20 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-emerald-400">
            {stats.totalPnL >= 0 ? '+' : ''}₩{(stats.totalPnL / 10000).toFixed(0)}만
          </div>
          <div className="text-neutral-400 text-xs">총 수익</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="text-center">
          <div className="text-lg font-bold text-white">{stats.totalTrades}</div>
          <div className="text-neutral-500 text-[10px]">총 거래</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-amber-400">{stats.profitFactor}</div>
          <div className="text-neutral-500 text-[10px]">손익비</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-cyan-400">{stats.currentStreak}</div>
          <div className="text-neutral-500 text-[10px]">연승</div>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ASSET SELECTOR
// ═══════════════════════════════════════════════════════════════════════════════

interface AssetSelectorProps {
  selectedAsset: string;
  onSelect: (assetId: string) => void;
}

export function AssetSelector({ selectedAsset, onSelect }: AssetSelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {SmartOrders.ASSETS.map((asset) => (
        <motion.button
          key={asset.id}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(asset.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
            selectedAsset === asset.id
              ? 'bg-violet-500 text-white'
              : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
          }`}
        >
          <span>{asset.icon}</span>
          <span className="font-medium">{asset.name}</span>
          <span className="text-xs opacity-70">₩{asset.basePrice}</span>
        </motion.button>
      ))}
    </div>
  );
}

