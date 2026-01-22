/**
 * K-UNIVERSAL Exchange Rate API v1
 * GET /api/v1/exchange/rates - Get current exchange rates
 *
 * Features:
 * - Live rates from ExchangeRate-API
 * - Fallback to default rates on error
 * - Intelligent caching (5 minutes for live, 1 hour for static)
 * - Currency conversion helpers
 *
 * @module app/api/v1/exchange/rates
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logging/logger';

// ============================================
// Types
// ============================================

interface ExchangeRates {
  [key: string]: number;
}

interface ExchangeRateResponse {
  success: boolean;
  rates: ExchangeRates;
  base: string;
  timestamp: number;
  source: 'live' | 'cache' | 'fallback';
  cached?: boolean;
}

// ============================================
// Constants
// ============================================

// Supported currencies (expanded list)
const SUPPORTED_CURRENCIES = [
  'USD', 'EUR', 'JPY', 'CNY', 'GBP', 'AUD', 'CAD', 'SGD',
  'THB', 'VND', 'PHP', 'HKD', 'TWD', 'MYR', 'IDR', 'CHF', 'NZD'
];

// Default rates relative to KRW (1 currency = X KRW)
const DEFAULT_RATES_KRW: ExchangeRates = {
  USD: 1472.76,
  EUR: 1709.40,
  JPY: 9.30,
  CNY: 210.88,
  GBP: 1972.39,
  AUD: 985.22,
  CAD: 1059.32,
  SGD: 1142.86,
  THB: 46.86,
  VND: 0.056,
  PHP: 24.79,
  HKD: 188.82,
  TWD: 46.72,
  MYR: 330.30,
  IDR: 0.093,
  CHF: 1673.41,
  NZD: 895.28,
  KRW: 1,
};

// Default rates relative to USD
const DEFAULT_RATES_USD: ExchangeRates = {
  USD: 1,
  KRW: 1472.76,
  EUR: 0.86,
  JPY: 158.36,
  CNY: 6.98,
  GBP: 0.75,
  AUD: 1.49,
  CAD: 1.39,
  SGD: 1.29,
  THB: 31.42,
  VND: 26300,
  PHP: 59.40,
  HKD: 7.80,
  TWD: 31.53,
  MYR: 4.46,
  IDR: 15834,
  CHF: 0.88,
  NZD: 1.64,
};

// Cache configuration
interface CacheEntry {
  rates: ExchangeRates;
  ratesKRW: ExchangeRates;
  timestamp: number;
  source: 'live' | 'fallback';
}

let ratesCache: CacheEntry | null = null;
const LIVE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for live data
const FALLBACK_CACHE_DURATION = 60 * 60 * 1000; // 1 hour for fallback

// ============================================
// API Handler
// ============================================

export async function GET(request: Request): Promise<NextResponse<ExchangeRateResponse>> {
  const { searchParams } = new URL(request.url);
  const base = searchParams.get('base')?.toUpperCase() || 'KRW';
  const requestId = `exchange_${Date.now()}`;

  try {
    const now = Date.now();
    const cacheDuration = ratesCache?.source === 'live' ? LIVE_CACHE_DURATION : FALLBACK_CACHE_DURATION;

    // Return cached data if valid
    if (ratesCache && (now - ratesCache.timestamp) < cacheDuration) {
      const rates = base === 'USD' ? ratesCache.rates : ratesCache.ratesKRW;

      return NextResponse.json({
        success: true,
        rates,
        base,
        timestamp: ratesCache.timestamp,
        source: 'cache',
        cached: true,
      });
    }

    // Fetch live rates from ExchangeRate-API
    const liveRates = await fetchLiveRates();

    if (liveRates) {
      // Convert to both KRW and USD bases
      const ratesKRW = convertRatesToBase(liveRates, 'KRW');
      const ratesUSD = convertRatesToBase(liveRates, 'USD');

      // Update cache
      ratesCache = {
        rates: ratesUSD,
        ratesKRW,
        timestamp: now,
        source: 'live',
      };

      logger.info('exchange_rates_fetched', {
        requestId,
        source: 'live',
        currencies: Object.keys(ratesKRW).length,
      });

      const rates = base === 'USD' ? ratesUSD : ratesKRW;

      return NextResponse.json({
        success: true,
        rates,
        base,
        timestamp: now,
        source: 'live',
        cached: false,
      });
    }

    // Fallback to default rates
    logger.warn('exchange_rates_fallback', { requestId, reason: 'API unavailable' });

    // Update cache with fallback
    ratesCache = {
      rates: DEFAULT_RATES_USD,
      ratesKRW: DEFAULT_RATES_KRW,
      timestamp: now,
      source: 'fallback',
    };

    const rates = base === 'USD' ? DEFAULT_RATES_USD : DEFAULT_RATES_KRW;

    return NextResponse.json({
      success: true,
      rates,
      base,
      timestamp: now,
      source: 'fallback',
      cached: false,
    });
  } catch (error) {
    logger.error('exchange_rates_error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const rates = base === 'USD' ? DEFAULT_RATES_USD : DEFAULT_RATES_KRW;

    return NextResponse.json({
      success: true,
      rates,
      base,
      timestamp: Date.now(),
      source: 'fallback',
    });
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Fetch live exchange rates from ExchangeRate-API
 */
async function fetchLiveRates(): Promise<Record<string, number> | null> {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/KRW', {
      next: { revalidate: 300 },
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      logger.warn('exchange_api_response_error', { status: response.status });
      return null;
    }

    const data = await response.json();

    if (data.result !== 'success' || !data.rates) {
      logger.warn('exchange_api_invalid_response', { result: data.result });
      return null;
    }

    // Filter to supported currencies only
    const filteredRates: Record<string, number> = { KRW: 1 };
    for (const currency of SUPPORTED_CURRENCIES) {
      if (data.rates[currency]) {
        filteredRates[currency] = data.rates[currency];
      }
    }

    return filteredRates;
  } catch (error) {
    logger.error('exchange_api_fetch_error', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return null;
  }
}

/**
 * Convert rates to a specific base currency
 */
function convertRatesToBase(
  rawRates: Record<string, number>,
  base: string
): ExchangeRates {
  const result: ExchangeRates = {};

  if (base === 'KRW') {
    // rawRates is 1 KRW = X currency
    // We want 1 currency = X KRW
    for (const [currency, rate] of Object.entries(rawRates)) {
      if (currency === 'KRW') {
        result[currency] = 1;
      } else if (rate > 0) {
        result[currency] = Math.round((1 / rate) * 100) / 100;
      }
    }
  } else if (base === 'USD') {
    // Convert everything relative to USD
    const usdToKrw = rawRates['USD'] ? 1 / rawRates['USD'] : DEFAULT_RATES_KRW['USD'];
    result['USD'] = 1;
    result['KRW'] = usdToKrw;

    for (const [currency, rate] of Object.entries(rawRates)) {
      if (currency === 'KRW' || currency === 'USD') continue;
      if (rate > 0) {
        // 1 KRW = rate currency, so 1 USD = usdToKrw KRW = usdToKrw * rate currency
        const usdRate = rate * usdToKrw;
        result[currency] = Math.round(usdRate * 10000) / 10000;
      }
    }
  }

  return result;
}

// ============================================
// Exported Helper Functions
// ============================================

/**
 * Convert between currencies
 */
export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rates: ExchangeRates = DEFAULT_RATES_USD
): number {
  const fromRate = rates[from] || 1;
  const toRate = rates[to] || 1;

  // Convert to base (USD) first, then to target
  const baseAmount = amount / fromRate;
  const converted = baseAmount * toRate;

  // Apply appropriate precision based on currency
  const noPrecisionCurrencies = ['KRW', 'JPY', 'VND', 'IDR'];
  if (noPrecisionCurrencies.includes(to)) {
    return Math.round(converted);
  }

  return Math.round(converted * 100) / 100;
}

/**
 * Format amount in KRW
 */
export function formatKRW(amount: number): string {
  return `₩${Math.round(amount).toLocaleString('ko-KR')}`;
}

/**
 * Format amount with currency symbol
 */
export function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CNY: '¥',
    KRW: '₩',
    THB: '฿',
    VND: '₫',
  };

  const symbol = symbols[currency] || currency;
  const formatted = currency === 'KRW' || currency === 'JPY' || currency === 'VND'
    ? Math.round(amount).toLocaleString()
    : amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return `${symbol}${formatted}`;
}
