/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 52: ADVANCED ORDER SYSTEM & SMART TRADING ENGINE
 * ═══════════════════════════════════════════════════════════════════════════════
 * - Multiple order types (Market, Limit, Stop, OCO, Trailing)
 * - Smart order routing
 * - Order book visualization
 * - Trade execution simulation
 * - Position management
 * - P&L tracking
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LIMIT' | 'STOP_MARKET' | 'OCO' | 'TRAILING_STOP' | 'ICEBERG';
export type OrderSide = 'BUY' | 'SELL';
export type OrderStatus = 'PENDING' | 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'EXPIRED' | 'REJECTED';
export type TimeInForce = 'GTC' | 'IOC' | 'FOK' | 'GTD';
export type PositionSide = 'LONG' | 'SHORT';

export interface Order {
  id: string;
  userId: string;
  asset: string;
  assetName: string;
  assetIcon: string;
  type: OrderType;
  side: OrderSide;
  status: OrderStatus;
  quantity: number;
  filledQuantity: number;
  price?: number; // For limit orders
  stopPrice?: number; // For stop orders
  trailingPercent?: number; // For trailing stop
  limitPrice?: number; // For OCO
  timeInForce: TimeInForce;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  executedAt?: Date;
  averagePrice?: number;
  fee: number;
  total: number;
  notes?: string;
}

export interface Position {
  id: string;
  userId: string;
  asset: string;
  assetName: string;
  assetIcon: string;
  side: PositionSide;
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  leverage: number;
  margin: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  realizedPnL: number;
  liquidationPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderBookLevel {
  price: number;
  quantity: number;
  total: number;
  percentage: number;
}

export interface OrderBook {
  asset: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  spreadPercent: number;
  lastPrice: number;
  lastUpdated: Date;
}

export interface Trade {
  id: string;
  orderId: string;
  asset: string;
  side: OrderSide;
  price: number;
  quantity: number;
  fee: number;
  total: number;
  executedAt: Date;
}

export interface TradingStats {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  totalPnL: number;
  totalVolume: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  currentStreak: number;
  bestStreak: number;
}

export interface OrderFormData {
  asset: string;
  type: OrderType;
  side: OrderSide;
  quantity: number;
  price?: number;
  stopPrice?: number;
  trailingPercent?: number;
  limitPrice?: number;
  timeInForce: TimeInForce;
  expiresAt?: Date;
  reduceOnly?: boolean;
  postOnly?: boolean;
}

export interface PriceAlert {
  id: string;
  asset: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  triggered: boolean;
  createdAt: Date;
  triggeredAt?: Date;
  message?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export const ASSETS = [
  { id: 'KAUS', name: 'KAUS', icon: '👑', basePrice: 120, minQty: 1, stepSize: 0.01 },
  { id: 'ENERGY', name: 'Energy Credit', icon: '⚡', basePrice: 85, minQty: 10, stepSize: 1 },
  { id: 'COMPUTE', name: 'Compute Token', icon: '🖥️', basePrice: 45, minQty: 5, stepSize: 0.5 },
  { id: 'CARBON', name: 'Carbon Credit', icon: '🌿', basePrice: 32, minQty: 100, stepSize: 10 },
  { id: 'SOLAR', name: 'Solar Power', icon: '☀️', basePrice: 67, minQty: 50, stepSize: 5 },
];

const ORDER_TYPES_INFO: Record<OrderType, { name: string; nameKo: string; description: string }> = {
  MARKET: { name: 'Market', nameKo: '시장가', description: '현재 시장 가격에 즉시 체결' },
  LIMIT: { name: 'Limit', nameKo: '지정가', description: '지정한 가격 이하(매수)/이상(매도)에서 체결' },
  STOP_LIMIT: { name: 'Stop Limit', nameKo: '스탑 지정가', description: '스탑 가격 도달 시 지정가 주문 발동' },
  STOP_MARKET: { name: 'Stop Market', nameKo: '스탑 시장가', description: '스탑 가격 도달 시 시장가 주문 발동' },
  OCO: { name: 'OCO', nameKo: 'OCO', description: '두 주문 중 하나 체결 시 다른 주문 취소' },
  TRAILING_STOP: { name: 'Trailing Stop', nameKo: '추적 손절', description: '가격 상승 시 손절가도 함께 상승' },
  ICEBERG: { name: 'Iceberg', nameKo: '아이스버그', description: '대량 주문을 소량씩 분할 체결' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// ORDER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

let orders: Order[] = [];
let positions: Position[] = [];
let trades: Trade[] = [];

function generateOrderId(): string {
  return `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

function generateTradeId(): string {
  return `TRD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export function createOrder(data: OrderFormData, userId: string = 'demo-user'): Order {
  const asset = ASSETS.find(a => a.id === data.asset) || ASSETS[0];
  const currentPrice = asset.basePrice * (1 + (Math.random() * 0.02 - 0.01));

  const order: Order = {
    id: generateOrderId(),
    userId,
    asset: asset.id,
    assetName: asset.name,
    assetIcon: asset.icon,
    type: data.type,
    side: data.side,
    status: data.type === 'MARKET' ? 'FILLED' : 'OPEN',
    quantity: data.quantity,
    filledQuantity: data.type === 'MARKET' ? data.quantity : 0,
    price: data.price,
    stopPrice: data.stopPrice,
    trailingPercent: data.trailingPercent,
    limitPrice: data.limitPrice,
    timeInForce: data.timeInForce,
    expiresAt: data.expiresAt,
    createdAt: new Date(),
    updatedAt: new Date(),
    executedAt: data.type === 'MARKET' ? new Date() : undefined,
    averagePrice: data.type === 'MARKET' ? currentPrice : undefined,
    fee: data.quantity * currentPrice * 0.001, // 0.1% fee
    total: data.quantity * (data.price || currentPrice),
  };

  orders.unshift(order);

  // Create trade for market orders
  if (data.type === 'MARKET') {
    const trade: Trade = {
      id: generateTradeId(),
      orderId: order.id,
      asset: asset.id,
      side: data.side,
      price: currentPrice,
      quantity: data.quantity,
      fee: order.fee,
      total: order.total,
      executedAt: new Date(),
    };
    trades.unshift(trade);

    // Update or create position
    updatePosition(userId, asset.id, data.side, data.quantity, currentPrice);
  }

  return order;
}

export function cancelOrder(orderId: string): Order | null {
  const order = orders.find(o => o.id === orderId);
  if (order && order.status === 'OPEN') {
    order.status = 'CANCELLED';
    order.updatedAt = new Date();
    return order;
  }
  return null;
}

export function getOrders(userId: string = 'demo-user', status?: OrderStatus): Order[] {
  let result = orders.filter(o => o.userId === userId);
  if (status) {
    result = result.filter(o => o.status === status);
  }
  return result;
}

export function getOpenOrders(userId: string = 'demo-user'): Order[] {
  return orders.filter(o => o.userId === userId && (o.status === 'OPEN' || o.status === 'PARTIALLY_FILLED'));
}

export function getOrderHistory(userId: string = 'demo-user', limit: number = 20): Order[] {
  return orders.filter(o => o.userId === userId).slice(0, limit);
}

// ═══════════════════════════════════════════════════════════════════════════════
// POSITION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

function updatePosition(userId: string, assetId: string, side: OrderSide, quantity: number, price: number): void {
  const asset = ASSETS.find(a => a.id === assetId) || ASSETS[0];
  const existingPosition = positions.find(p => p.userId === userId && p.asset === assetId);

  if (existingPosition) {
    // Update existing position
    if ((existingPosition.side === 'LONG' && side === 'BUY') || (existingPosition.side === 'SHORT' && side === 'SELL')) {
      // Adding to position
      const totalValue = existingPosition.quantity * existingPosition.entryPrice + quantity * price;
      existingPosition.quantity += quantity;
      existingPosition.entryPrice = totalValue / existingPosition.quantity;
    } else {
      // Reducing or closing position
      existingPosition.quantity -= quantity;
      if (existingPosition.quantity <= 0) {
        positions = positions.filter(p => p.id !== existingPosition.id);
        return;
      }
    }
    existingPosition.currentPrice = price;
    existingPosition.unrealizedPnL = (price - existingPosition.entryPrice) * existingPosition.quantity * (existingPosition.side === 'LONG' ? 1 : -1);
    existingPosition.unrealizedPnLPercent = (existingPosition.unrealizedPnL / (existingPosition.entryPrice * existingPosition.quantity)) * 100;
    existingPosition.updatedAt = new Date();
  } else {
    // Create new position
    const position: Position = {
      id: `POS-${Date.now()}`,
      userId,
      asset: assetId,
      assetName: asset.name,
      assetIcon: asset.icon,
      side: side === 'BUY' ? 'LONG' : 'SHORT',
      entryPrice: price,
      currentPrice: price,
      quantity,
      leverage: 1,
      margin: quantity * price,
      unrealizedPnL: 0,
      unrealizedPnLPercent: 0,
      realizedPnL: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    positions.push(position);
  }
}

export function getPositions(userId: string = 'demo-user'): Position[] {
  // Update current prices
  return positions.filter(p => p.userId === userId).map(p => {
    const asset = ASSETS.find(a => a.id === p.asset);
    if (asset) {
      const currentPrice = asset.basePrice * (1 + (Math.random() * 0.04 - 0.02));
      p.currentPrice = currentPrice;
      p.unrealizedPnL = (currentPrice - p.entryPrice) * p.quantity * (p.side === 'LONG' ? 1 : -1);
      p.unrealizedPnLPercent = (p.unrealizedPnL / (p.entryPrice * p.quantity)) * 100;
    }
    return p;
  });
}

export function closePosition(positionId: string): Position | null {
  const position = positions.find(p => p.id === positionId);
  if (position) {
    // Create closing order
    createOrder({
      asset: position.asset,
      type: 'MARKET',
      side: position.side === 'LONG' ? 'SELL' : 'BUY',
      quantity: position.quantity,
      timeInForce: 'IOC',
    }, position.userId);

    positions = positions.filter(p => p.id !== positionId);
    return position;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ORDER BOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function getOrderBook(assetId: string = 'KAUS'): OrderBook {
  const asset = ASSETS.find(a => a.id === assetId) || ASSETS[0];
  const midPrice = asset.basePrice * (1 + (Math.random() * 0.02 - 0.01));

  const generateLevels = (isBid: boolean, count: number = 15): OrderBookLevel[] => {
    const levels: OrderBookLevel[] = [];
    let cumulativeTotal = 0;

    for (let i = 0; i < count; i++) {
      const priceOffset = (i + 1) * asset.basePrice * 0.002 * (isBid ? -1 : 1);
      const price = Math.round((midPrice + priceOffset) * 100) / 100;
      const quantity = Math.floor(Math.random() * 1000 + 100);
      cumulativeTotal += quantity;

      levels.push({
        price,
        quantity,
        total: cumulativeTotal,
        percentage: 0,
      });
    }

    // Calculate percentages
    const maxTotal = cumulativeTotal;
    levels.forEach(l => {
      l.percentage = (l.total / maxTotal) * 100;
    });

    return levels;
  };

  const bids = generateLevels(true);
  const asks = generateLevels(false);
  const bestBid = bids[0].price;
  const bestAsk = asks[0].price;
  const spread = bestAsk - bestBid;

  return {
    asset: assetId,
    bids,
    asks,
    spread: Math.round(spread * 100) / 100,
    spreadPercent: Math.round((spread / midPrice) * 10000) / 100,
    lastPrice: midPrice,
    lastUpdated: new Date(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRADE HISTORY
// ═══════════════════════════════════════════════════════════════════════════════

export function getTrades(userId: string = 'demo-user', limit: number = 50): Trade[] {
  return trades.slice(0, limit);
}

export function getRecentTrades(assetId: string = 'KAUS', limit: number = 20): Trade[] {
  const asset = ASSETS.find(a => a.id === assetId) || ASSETS[0];
  const recentTrades: Trade[] = [];

  for (let i = 0; i < limit; i++) {
    const price = asset.basePrice * (1 + (Math.random() * 0.02 - 0.01));
    const quantity = Math.floor(Math.random() * 500 + 10);

    recentTrades.push({
      id: generateTradeId(),
      orderId: generateOrderId(),
      asset: assetId,
      side: Math.random() > 0.5 ? 'BUY' : 'SELL',
      price: Math.round(price * 100) / 100,
      quantity,
      fee: quantity * price * 0.001,
      total: quantity * price,
      executedAt: new Date(Date.now() - i * 30000 - Math.random() * 30000),
    });
  }

  return recentTrades;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRADING STATS
// ═══════════════════════════════════════════════════════════════════════════════

export function getTradingStats(userId: string = 'demo-user'): TradingStats {
  return {
    totalTrades: 247,
    winRate: 68.5,
    profitFactor: 2.34,
    totalPnL: 1250000,
    totalVolume: 15000000,
    averageWin: 85000,
    averageLoss: 36000,
    largestWin: 450000,
    largestLoss: 120000,
    currentStreak: 5,
    bestStreak: 12,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRICE ALERTS
// ═══════════════════════════════════════════════════════════════════════════════

let priceAlerts: PriceAlert[] = [];

export function createPriceAlert(asset: string, targetPrice: number, condition: 'ABOVE' | 'BELOW', message?: string): PriceAlert {
  const alert: PriceAlert = {
    id: `ALERT-${Date.now()}`,
    asset,
    targetPrice,
    condition,
    triggered: false,
    createdAt: new Date(),
    message,
  };
  priceAlerts.push(alert);
  return alert;
}

export function getPriceAlerts(assetId?: string): PriceAlert[] {
  if (assetId) {
    return priceAlerts.filter(a => a.asset === assetId);
  }
  return priceAlerts;
}

export function deletePriceAlert(alertId: string): boolean {
  const index = priceAlerts.findIndex(a => a.id === alertId);
  if (index !== -1) {
    priceAlerts.splice(index, 1);
    return true;
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK TRADE CALCULATOR
// ═══════════════════════════════════════════════════════════════════════════════

export interface TradePreview {
  asset: string;
  side: OrderSide;
  quantity: number;
  price: number;
  subtotal: number;
  fee: number;
  total: number;
  slippage: number;
  impact: number;
}

export function calculateTradePreview(assetId: string, side: OrderSide, quantity: number, price?: number): TradePreview {
  const asset = ASSETS.find(a => a.id === assetId) || ASSETS[0];
  const currentPrice = price || asset.basePrice * (1 + (Math.random() * 0.01 - 0.005));
  const subtotal = quantity * currentPrice;
  const fee = subtotal * 0.001;
  const slippage = subtotal * 0.0005;
  const impact = (quantity / 10000) * 0.1; // Simplified price impact

  return {
    asset: assetId,
    side,
    quantity,
    price: Math.round(currentPrice * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    fee: Math.round(fee * 100) / 100,
    total: Math.round((subtotal + fee + slippage) * 100) / 100,
    slippage: Math.round(slippage * 100) / 100,
    impact: Math.round(impact * 100) / 100,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZE WITH SAMPLE DATA
// ═══════════════════════════════════════════════════════════════════════════════

function initializeSampleData(): void {
  // Sample open orders
  const sampleOrders: OrderFormData[] = [
    { asset: 'KAUS', type: 'LIMIT', side: 'BUY', quantity: 100, price: 115, timeInForce: 'GTC' },
    { asset: 'KAUS', type: 'LIMIT', side: 'SELL', quantity: 50, price: 130, timeInForce: 'GTC' },
    { asset: 'ENERGY', type: 'STOP_LIMIT', side: 'SELL', quantity: 200, stopPrice: 80, price: 79, timeInForce: 'GTC' },
  ];

  sampleOrders.forEach(o => {
    const order = createOrder(o);
    order.status = 'OPEN';
    order.filledQuantity = 0;
  });

  // Sample positions
  positions = [
    {
      id: 'POS-001',
      userId: 'demo-user',
      asset: 'KAUS',
      assetName: 'KAUS',
      assetIcon: '👑',
      side: 'LONG',
      entryPrice: 118,
      currentPrice: 120,
      quantity: 500,
      leverage: 1,
      margin: 59000,
      unrealizedPnL: 1000,
      unrealizedPnLPercent: 1.69,
      realizedPnL: 5000,
      stopLoss: 110,
      takeProfit: 140,
      createdAt: new Date(Date.now() - 86400000 * 3),
      updatedAt: new Date(),
    },
    {
      id: 'POS-002',
      userId: 'demo-user',
      asset: 'ENERGY',
      assetName: 'Energy Credit',
      assetIcon: '⚡',
      side: 'LONG',
      entryPrice: 82,
      currentPrice: 85,
      quantity: 1000,
      leverage: 1,
      margin: 82000,
      unrealizedPnL: 3000,
      unrealizedPnLPercent: 3.66,
      realizedPnL: 2500,
      createdAt: new Date(Date.now() - 86400000 * 5),
      updatedAt: new Date(),
    },
  ];
}

// Initialize on load
initializeSampleData();

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const SmartOrders = {
  createOrder,
  cancelOrder,
  getOrders,
  getOpenOrders,
  getOrderHistory,
  getPositions,
  closePosition,
  getOrderBook,
  getTrades,
  getRecentTrades,
  getTradingStats,
  createPriceAlert,
  getPriceAlerts,
  deletePriceAlert,
  calculateTradePreview,
  ASSETS,
  ORDER_TYPES: ORDER_TYPES_INFO,
};

export default SmartOrders;
