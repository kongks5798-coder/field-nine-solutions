/**
 * K-Universal Secure Integration Engine
 * CTO Jarvis Edition
 *
 * Features:
 * - Real-time exchange rate conversion with caching
 * - PII encryption for sensitive identifiers
 * - Stay22 affiliate link generation
 * - Security validation for incoming data
 */

import { encrypt } from '@/lib/security/encryption';

// ============================================
// Types
// ============================================

export interface TravelPrice {
  amount: number;
  currency: string;
  krwAmount?: number;
  displayPrice?: string;
}

export interface TravelItem {
  id: string;
  price: TravelPrice;
  bookingUrl?: string;
  [key: string]: unknown;
}

export interface ProcessedTravelItem extends TravelItem {
  price: TravelPrice & {
    krwAmount: number;
    displayPrice: string;
  };
  secureToken: string;
}

// ============================================
// Constants
// ============================================

const EXCHANGE_RATE_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const STAY22_AFFILIATE_ID = process.env.STAY22_AFFILIATE_ID || 'fieldnine';
const STAY22_BASE_URL = 'https://www.stay22.com/allez';

// Cache for exchange rates
let exchangeRateCache: {
  rates: Record<string, number>;
  timestamp: number;
} | null = null;

// ============================================
// Exchange Rate Engine
// ============================================

/**
 * Get real-time exchange rate with 10-minute cache
 */
async function getRealtimeExchangeRate(from: string, to: string): Promise<number> {
  const cacheKey = `${from}_${to}`;
  const now = Date.now();

  // Check cache
  if (exchangeRateCache &&
      now - exchangeRateCache.timestamp < EXCHANGE_RATE_CACHE_DURATION &&
      exchangeRateCache.rates[cacheKey]) {
    return exchangeRateCache.rates[cacheKey];
  }

  try {
    // Fetch from internal API
    const response = await fetch('/api/v1/exchange/rates');
    const data = await response.json();

    if (data.success && data.rates) {
      // Convert to target currency
      // Rates are relative to USD
      const fromRate = data.rates[from] || 1;
      const toRate = data.rates[to] || 1;
      const rate = toRate / fromRate;

      // Update cache
      if (!exchangeRateCache) {
        exchangeRateCache = { rates: {}, timestamp: now };
      }
      exchangeRateCache.rates[cacheKey] = rate;
      exchangeRateCache.timestamp = now;

      return rate;
    }
  } catch (error) {
    console.error('Exchange rate fetch error:', error);
  }

  // Fallback rates (updated periodically)
  const fallbackRates: Record<string, number> = {
    USD_KRW: 1350,
    EUR_KRW: 1470,
    JPY_KRW: 9.0,
    CNY_KRW: 186,
    THB_KRW: 38,
    SGD_KRW: 1007,
    GBP_KRW: 1710,
  };

  return fallbackRates[cacheKey] || 1350;
}

// ============================================
// Security Validation
// ============================================

/**
 * Validate incoming data for security threats
 */
function validateSecurityPattern(data: unknown): data is TravelItem[] {
  if (!data || !Array.isArray(data)) {
    return false;
  }

  return data.every(item => {
    // Must have id and price
    if (!item.id || !item.price) return false;

    // Price must have amount and currency
    if (typeof item.price.amount !== 'number' || !item.price.currency) return false;

    // Check for injection patterns in strings
    const stringValues = Object.values(item).filter(v => typeof v === 'string');
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
      /SELECT.*FROM/i,
      /INSERT.*INTO/i,
      /DROP.*TABLE/i,
    ];

    for (const value of stringValues) {
      for (const pattern of dangerousPatterns) {
        if (pattern.test(value as string)) {
          console.warn('Security: Dangerous pattern detected in data');
          return false;
        }
      }
    }

    return true;
  });
}

// ============================================
// Main Processing Engine
// ============================================

/**
 * Process raw travel data with security and price conversion
 */
export async function processSecureTravelData(
  rawData: unknown,
  type: 'flight' | 'hotel'
): Promise<ProcessedTravelItem[]> {
  // 1. Security validation
  if (!validateSecurityPattern(rawData)) {
    throw new Error('Security Alert: Invalid Data Pattern Detected');
  }

  const items = rawData as TravelItem[];

  // 2. Get exchange rate (cached)
  // Assuming prices come in USD by default
  const baseCurrency = items[0]?.price.currency || 'USD';
  const exchangeRate = await getRealtimeExchangeRate(baseCurrency, 'KRW');

  // 3. Process each item
  const processedData: ProcessedTravelItem[] = await Promise.all(
    items.map(async (item) => {
      const originalPrice = item.price.amount;
      const convertedPrice = Math.round(originalPrice * exchangeRate);

      // Generate secure token
      let secureToken = '';
      try {
        const encrypted = await encrypt(item.id);
        secureToken = encrypted.ciphertext.slice(0, 32); // Use first 32 chars
      } catch {
        secureToken = Buffer.from(item.id).toString('base64').slice(0, 32);
      }

      // Generate booking URL
      let bookingUrl = item.bookingUrl || '';
      if (type === 'hotel') {
        bookingUrl = `${STAY22_BASE_URL}/${STAY22_AFFILIATE_ID}?hotelid=${encodeURIComponent(item.id)}`;
      }

      return {
        ...item,
        bookingUrl,
        price: {
          ...item.price,
          krwAmount: convertedPrice,
          displayPrice: formatKRW(convertedPrice),
        },
        secureToken,
      };
    })
  );

  return processedData;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Format number as KRW currency
 */
export function formatKRW(amount: number): string {
  return `₩${Math.round(amount).toLocaleString('ko-KR')}`;
}

/**
 * Convert any currency to KRW
 */
export async function convertToKRW(amount: number, fromCurrency: string): Promise<number> {
  const rate = await getRealtimeExchangeRate(fromCurrency, 'KRW');
  return Math.round(amount * rate);
}

/**
 * Get current exchange rate for display
 */
export async function getCurrentRate(from: string, to: string): Promise<{
  rate: number;
  fromCurrency: string;
  toCurrency: string;
  timestamp: number;
}> {
  const rate = await getRealtimeExchangeRate(from, to);
  return {
    rate,
    fromCurrency: from,
    toCurrency: to,
    timestamp: Date.now(),
  };
}

// ============================================
// Stay22 Integration
// ============================================

/**
 * Generate Stay22 affiliate link for hotel
 */
export function generateStay22Link(hotelId: string, options?: {
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}): string {
  const baseUrl = `${STAY22_BASE_URL}/${STAY22_AFFILIATE_ID}`;
  const params = new URLSearchParams();

  params.set('hotelid', hotelId);

  if (options?.checkIn) params.set('checkin', options.checkIn);
  if (options?.checkOut) params.set('checkout', options.checkOut);
  if (options?.guests) params.set('guests', String(options.guests));

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate Stay22 map embed URL
 */
export function generateStay22MapEmbed(options: {
  latitude: number;
  longitude: number;
  zoom?: number;
}): string {
  const { latitude, longitude, zoom = 15 } = options;
  return `https://www.stay22.com/embed/${STAY22_AFFILIATE_ID}?lat=${latitude}&lng=${longitude}&zoom=${zoom}`;
}

// ============================================
// Batch Processing
// ============================================

/**
 * Process multiple travel data batches concurrently
 */
export async function processBatchTravelData(batches: {
  data: unknown;
  type: 'flight' | 'hotel';
}[]): Promise<ProcessedTravelItem[][]> {
  return Promise.all(
    batches.map(batch => processSecureTravelData(batch.data, batch.type))
  );
}
