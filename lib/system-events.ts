/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 82: SYSTEM EVENT BROADCASTER - THE ECONOMIC BRAIN
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Global event system for real-time state synchronization
 * - Central Bank operations broadcast to all connected clients
 * - Jarvis receives events for proactive briefings
 * - Real-time supply/demand metrics
 */

// Event Types
export type SystemEventType =
  | 'MINT_EXECUTED'
  | 'BURN_EXECUTED'
  | 'RATE_CHANGED'
  | 'EMERGENCY_SHUTDOWN'
  | 'SYSTEM_RESTORED'
  | 'LIQUIDITY_INJECTION'
  | 'VOLATILITY_ALERT';

export interface SystemEvent {
  id: string;
  type: SystemEventType;
  data: {
    amount?: number;
    reason?: string;
    signature?: string;
    previousValue?: number;
    newValue?: number;
    executor?: string;
    impact?: 'high' | 'medium' | 'low';
  };
  timestamp: string;
}

export interface ReserveMetrics {
  totalSupply: number;
  circulatingSupply: number;
  reserveBalance: number;
  reserveRatio: number; // Reserve / Circulating
  volatilityIndex: number; // 0-100
  lastMintAmount: number;
  lastBurnAmount: number;
  supplyChangeRate: number; // % change in last 24h
}

// ═══════════════════════════════════════════════════════════════════════════════
// IN-MEMORY EVENT STORE (Server-side)
// ═══════════════════════════════════════════════════════════════════════════════

const MAX_EVENTS = 100;
const systemEvents: SystemEvent[] = [];
let currentMetrics: ReserveMetrics = {
  totalSupply: 1000000000,
  circulatingSupply: 750000000,
  reserveBalance: 200000000,
  reserveRatio: 0.267,
  volatilityIndex: 15,
  lastMintAmount: 0,
  lastBurnAmount: 0,
  supplyChangeRate: 0,
};

// Event listeners (for SSE/WebSocket connections)
type EventListener = (event: SystemEvent) => void;
const listeners: Set<EventListener> = new Set();

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT BROADCASTING
// ═══════════════════════════════════════════════════════════════════════════════

export function broadcastSystemEvent(event: SystemEvent): void {
  // Add to store
  systemEvents.unshift(event);
  if (systemEvents.length > MAX_EVENTS) {
    systemEvents.pop();
  }

  // Update metrics based on event type
  updateMetrics(event);

  // Notify all listeners
  listeners.forEach(listener => {
    try {
      listener(event);
    } catch (error) {
      console.error('[SystemEvents] Listener error:', error);
    }
  });

  console.log(`[SystemEvents] Broadcast: ${event.type}`, event.data);
}

function updateMetrics(event: SystemEvent): void {
  const amount = event.data.amount || 0;

  switch (event.type) {
    case 'MINT_EXECUTED':
    case 'LIQUIDITY_INJECTION':
      currentMetrics.totalSupply += amount;
      currentMetrics.circulatingSupply += amount;
      currentMetrics.lastMintAmount = amount;
      currentMetrics.supplyChangeRate = (amount / currentMetrics.totalSupply) * 100;
      // Large mints increase volatility temporarily
      if (amount >= 1000000) {
        currentMetrics.volatilityIndex = Math.min(100, currentMetrics.volatilityIndex + 10);
      }
      break;

    case 'BURN_EXECUTED':
      currentMetrics.totalSupply -= amount;
      currentMetrics.circulatingSupply -= amount;
      currentMetrics.lastBurnAmount = amount;
      currentMetrics.supplyChangeRate = -(amount / currentMetrics.totalSupply) * 100;
      // Burns stabilize the market
      currentMetrics.volatilityIndex = Math.max(0, currentMetrics.volatilityIndex - 5);
      break;

    case 'VOLATILITY_ALERT':
      currentMetrics.volatilityIndex = event.data.newValue || currentMetrics.volatilityIndex;
      break;
  }

  // Recalculate reserve ratio
  currentMetrics.reserveRatio = currentMetrics.reserveBalance / currentMetrics.circulatingSupply;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LISTENER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export function subscribeToEvents(listener: EventListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRecentEvents(limit: number = 20): SystemEvent[] {
  return systemEvents.slice(0, limit);
}

export function getCurrentMetrics(): ReserveMetrics {
  return { ...currentMetrics };
}

// ═══════════════════════════════════════════════════════════════════════════════
// JARVIS BRIEFING GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

export interface JarvisBriefing {
  priority: 'critical' | 'high' | 'normal';
  title: string;
  message: string;
  recommendation?: string;
  timestamp: string;
}

export function generateJarvisBriefing(event: SystemEvent): JarvisBriefing {
  const amount = event.data.amount || 0;
  const formattedAmount = amount.toLocaleString();

  switch (event.type) {
    case 'MINT_EXECUTED':
    case 'LIQUIDITY_INJECTION':
      const isLargeInjection = amount >= 1000000;
      return {
        priority: isLargeInjection ? 'high' : 'normal',
        title: 'System: Massive Liquidity Injected by Emperor',
        message: isLargeInjection
          ? `보스, 유동성이 풍부해졌습니다. ${formattedAmount} KAUS가 시장에 투입되었습니다. 지금이 매수 적기입니다.`
          : `${formattedAmount} KAUS가 시스템에 추가되었습니다. 시장 유동성이 개선되었습니다.`,
        recommendation: isLargeInjection
          ? 'BUY - 유동성 증가로 가격 안정성 향상'
          : undefined,
        timestamp: event.timestamp,
      };

    case 'BURN_EXECUTED':
      const isLargeBurn = amount >= 500000;
      return {
        priority: isLargeBurn ? 'high' : 'normal',
        title: 'System: Token Supply Reduced',
        message: `${formattedAmount} KAUS가 소각되었습니다. ${
          isLargeBurn ? '공급량 감소로 희소성이 증가했습니다.' : '시장 안정화 조치가 완료되었습니다.'
        }`,
        recommendation: isLargeBurn
          ? 'HOLD - 희소성 증가로 가치 상승 예상'
          : undefined,
        timestamp: event.timestamp,
      };

    case 'VOLATILITY_ALERT':
      return {
        priority: 'critical',
        title: '⚠️ Volatility Alert',
        message: `시장 변동성 지수가 ${event.data.newValue}%로 상승했습니다. 신중한 거래가 필요합니다.`,
        recommendation: 'CAUTION - 급격한 가격 변동 가능성',
        timestamp: event.timestamp,
      };

    case 'EMERGENCY_SHUTDOWN':
      return {
        priority: 'critical',
        title: '🚨 Emergency Shutdown',
        message: `시스템이 긴급 정지되었습니다. 사유: ${event.data.reason || 'Unknown'}`,
        timestamp: event.timestamp,
      };

    case 'SYSTEM_RESTORED':
      return {
        priority: 'high',
        title: '✅ System Restored',
        message: '시스템이 정상 복구되었습니다. 모든 기능이 활성화되었습니다.',
        timestamp: event.timestamp,
      };

    default:
      return {
        priority: 'normal',
        title: 'System Update',
        message: `${event.type}: ${JSON.stringify(event.data)}`,
        timestamp: event.timestamp,
      };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: CREATE SYSTEM EVENT
// ═══════════════════════════════════════════════════════════════════════════════

export function createSystemEvent(
  type: SystemEventType,
  data: SystemEvent['data']
): SystemEvent {
  return {
    id: `EVT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    data,
    timestamp: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// VOLATILITY PHYSICS ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export function calculateVolatility(
  supplyChange: number,
  reserveRatio: number,
  externalFactors: number = 0
): number {
  // Base volatility from supply change (0-30)
  const supplyImpact = Math.min(30, Math.abs(supplyChange) * 0.00001);

  // Reserve ratio impact (lower ratio = higher volatility)
  // Healthy ratio is 0.2-0.3, below 0.15 is risky
  const reserveImpact = reserveRatio < 0.15
    ? 30
    : reserveRatio < 0.2
    ? 15
    : reserveRatio > 0.35
    ? -5
    : 0;

  // External factors (market conditions, etc)
  const externalImpact = Math.min(20, Math.max(-10, externalFactors));

  // Calculate final volatility (0-100)
  const baseVolatility = currentMetrics.volatilityIndex;
  const newVolatility = baseVolatility + supplyImpact + reserveImpact + externalImpact;

  return Math.min(100, Math.max(0, newVolatility));
}
