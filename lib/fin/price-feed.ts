/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 44: REAL-TIME KAUS PRICE ENGINE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 에너지 수요에 따라 KAUS 코인 가격 실시간 변동
 */

// Base KAUS price in KRW
const BASE_PRICE_KRW = 120;

// Price volatility factors
const VOLATILITY = {
  min: 0.95,  // -5%
  max: 1.08,  // +8%
  smpWeight: 0.3,    // SMP 영향도
  demandWeight: 0.4, // 수요 영향도
  timeWeight: 0.3,   // 시간대 영향도
};

// Get current hour factor (peak hours = higher price)
function getTimeFactor(): number {
  const hour = new Date().getHours();
  // Peak: 10-12, 18-21
  if ((hour >= 10 && hour <= 12) || (hour >= 18 && hour <= 21)) {
    return 1.05;
  }
  // Off-peak: 0-6
  if (hour >= 0 && hour <= 6) {
    return 0.97;
  }
  return 1.0;
}

// Simulate SMP price factor
function getSMPFactor(): number {
  // SMP range: 80-180 KRW/kWh, normalized to 0.9-1.1
  const smpBase = 130;
  const smpCurrent = 100 + Math.random() * 80;
  return 0.9 + (smpCurrent / smpBase) * 0.2;
}

// Simulate demand factor based on network activity
function getDemandFactor(): number {
  // Higher demand = higher price
  const baseUsers = 200;
  const currentUsers = baseUsers + Math.floor(Math.random() * 100);
  return 0.95 + (currentUsers / 500) * 0.15;
}

// Calculate current KAUS price
export function getCurrentKausPrice(): {
  priceKRW: number;
  priceUSD: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  factors: {
    time: number;
    smp: number;
    demand: number;
  };
} {
  const timeFactor = getTimeFactor();
  const smpFactor = getSMPFactor();
  const demandFactor = getDemandFactor();

  // Weighted price calculation
  const combinedFactor =
    timeFactor * VOLATILITY.timeWeight +
    smpFactor * VOLATILITY.smpWeight +
    demandFactor * VOLATILITY.demandWeight;

  // Apply volatility bounds
  const boundedFactor = Math.max(VOLATILITY.min, Math.min(VOLATILITY.max, combinedFactor));

  const priceKRW = Math.round(BASE_PRICE_KRW * boundedFactor * 100) / 100;
  const priceUSD = Math.round(priceKRW / 1320 * 1000) / 1000; // USD/KRW ~1320

  // Simulated 24h data
  const change24h = ((boundedFactor - 1) * 100);
  const volume24h = Math.floor(Math.random() * 500000) + 100000;
  const high24h = priceKRW * 1.03;
  const low24h = priceKRW * 0.97;

  return {
    priceKRW,
    priceUSD,
    change24h: Math.round(change24h * 100) / 100,
    volume24h,
    high24h: Math.round(high24h * 100) / 100,
    low24h: Math.round(low24h * 100) / 100,
    factors: {
      time: timeFactor,
      smp: smpFactor,
      demand: demandFactor,
    },
  };
}

// Generate price history for charts
export function generatePriceHistory(hours: number = 24): Array<{
  time: string;
  price: number;
  volume: number;
}> {
  const history: Array<{ time: string; price: number; volume: number }> = [];
  const now = new Date();
  let basePrice = BASE_PRICE_KRW;

  for (let i = hours; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hourStr = time.toISOString().slice(11, 16);

    // Random walk with mean reversion
    const change = (Math.random() - 0.48) * 3;
    basePrice = Math.max(110, Math.min(135, basePrice + change));

    history.push({
      time: hourStr,
      price: Math.round(basePrice * 100) / 100,
      volume: Math.floor(Math.random() * 50000) + 10000,
    });
  }

  return history;
}

// Price alert thresholds
export const PRICE_ALERTS = {
  bullish: 125,  // Above this = strong buy signal
  bearish: 115,  // Below this = accumulation zone
  neutral: { min: 115, max: 125 },
};

// Get trading signal
export function getTradingSignal(price: number): 'BUY' | 'SELL' | 'HOLD' {
  if (price < PRICE_ALERTS.bearish) return 'BUY';
  if (price > PRICE_ALERTS.bullish) return 'SELL';
  return 'HOLD';
}
