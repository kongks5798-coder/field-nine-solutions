/**
 * Naver Price Cache Management
 * Handles caching of crawled Naver prices with 10-minute TTL
 */

import { NaverPriceCache, NaverHotelPrice, PriceAlert, PriceAlertStatus } from './types';

// ============================================
// In-Memory Cache (Replace with Supabase in production)
// ============================================

const priceCache: Map<string, NaverPriceCache> = new Map();
const priceAlerts: Map<string, PriceAlert> = new Map();

// Cache TTL in milliseconds (10 minutes)
const CACHE_TTL = 10 * 60 * 1000;

// ============================================
// Cache Key Generation
// ============================================

function generateCacheKey(
  hotelName: string,
  destination: string,
  checkIn: string,
  checkOut: string
): string {
  const normalized = hotelName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${destination}:${checkIn}:${checkOut}:${normalized}`;
}

function generateAlertId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// ============================================
// Cache Operations
// ============================================

/**
 * Store crawled price in cache
 */
export function cacheNaverPrice(price: NaverHotelPrice): NaverPriceCache {
  const cacheKey = generateCacheKey(
    price.hotelName,
    price.destination,
    price.checkIn,
    price.checkOut
  );

  const now = new Date();
  const cached: NaverPriceCache = {
    id: cacheKey,
    hotelName: price.hotelName,
    destination: price.destination,
    checkIn: price.checkIn,
    checkOut: price.checkOut,
    lowestPriceKrw: price.lowestPriceKrw,
    crawledAt: now,
    expiresAt: new Date(now.getTime() + CACHE_TTL),
    isActive: true,
  };

  priceCache.set(cacheKey, cached);
  return cached;
}

/**
 * Bulk cache multiple prices
 */
export function cacheNaverPrices(prices: NaverHotelPrice[]): NaverPriceCache[] {
  return prices.map(price => cacheNaverPrice(price));
}

/**
 * Get cached price
 */
export function getCachedPrice(
  hotelName: string,
  destination: string,
  checkIn: string,
  checkOut: string
): NaverPriceCache | null {
  const cacheKey = generateCacheKey(hotelName, destination, checkIn, checkOut);
  const cached = priceCache.get(cacheKey);

  if (!cached) return null;

  // Check if cache is expired
  if (new Date() > cached.expiresAt) {
    priceCache.delete(cacheKey);
    return null;
  }

  return cached;
}

/**
 * Get all cached prices for a destination
 */
export function getCachedPricesForDestination(
  destination: string,
  checkIn: string,
  checkOut: string
): NaverPriceCache[] {
  const results: NaverPriceCache[] = [];
  const now = new Date();
  const prefix = `${destination}:${checkIn}:${checkOut}:`;

  for (const [key, cached] of priceCache.entries()) {
    if (key.startsWith(prefix) && now <= cached.expiresAt) {
      results.push(cached);
    }
  }

  return results;
}

/**
 * Search cached price by hotel name (fuzzy match)
 */
export function searchCachedPrice(
  hotelName: string,
  destination: string,
  checkIn: string,
  checkOut: string
): NaverPriceCache | null {
  // Try exact match first
  const exact = getCachedPrice(hotelName, destination, checkIn, checkOut);
  if (exact) return exact;

  // Try fuzzy match
  const normalizedSearch = hotelName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const allCached = getCachedPricesForDestination(destination, checkIn, checkOut);

  for (const cached of allCached) {
    const normalizedCached = cached.hotelName.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Partial match
    if (normalizedCached.includes(normalizedSearch) || normalizedSearch.includes(normalizedCached)) {
      return cached;
    }

    // Word-based match
    const searchWords: string[] = normalizedSearch.match(/[a-z]{3,}/g) || [];
    const cachedWords: string[] = normalizedCached.match(/[a-z]{3,}/g) || [];
    const commonWords = searchWords.filter(w => cachedWords.includes(w));

    if (commonWords.length >= Math.min(2, searchWords.length)) {
      return cached;
    }
  }

  return null;
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): number {
  let cleared = 0;
  const now = new Date();

  for (const [key, cached] of priceCache.entries()) {
    if (now > cached.expiresAt) {
      priceCache.delete(key);
      cleared++;
    }
  }

  return cleared;
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  priceCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  totalEntries: number;
  activeEntries: number;
  expiredEntries: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
} {
  let active = 0;
  let expired = 0;
  let oldest: Date | null = null;
  let newest: Date | null = null;
  const now = new Date();

  for (const cached of priceCache.values()) {
    if (now <= cached.expiresAt) {
      active++;
    } else {
      expired++;
    }

    if (!oldest || cached.crawledAt < oldest) {
      oldest = cached.crawledAt;
    }
    if (!newest || cached.crawledAt > newest) {
      newest = cached.crawledAt;
    }
  }

  return {
    totalEntries: priceCache.size,
    activeEntries: active,
    expiredEntries: expired,
    oldestEntry: oldest,
    newestEntry: newest,
  };
}

// ============================================
// Price Alert Operations (Safety Protocol)
// ============================================

/**
 * Create price alert when Naver price < Stay22 net rate
 */
export function createPriceAlert(
  hotelName: string,
  naverPriceKrw: number,
  stay22NetRateKrw: number
): PriceAlert {
  const deficitKrw = stay22NetRateKrw - naverPriceKrw;
  const deficitPercent = (deficitKrw / stay22NetRateKrw) * 100;

  const alert: PriceAlert = {
    id: generateAlertId(),
    hotelName,
    naverPriceKrw,
    stay22NetRateKrw,
    deficitKrw,
    deficitPercent: Math.round(deficitPercent * 100) / 100,
    status: 'pending',
    createdAt: new Date(),
  };

  priceAlerts.set(alert.id, alert);
  return alert;
}

/**
 * Get all pending price alerts
 */
export function getPendingAlerts(): PriceAlert[] {
  return Array.from(priceAlerts.values())
    .filter(a => a.status === 'pending')
    .sort((a, b) => b.deficitKrw - a.deficitKrw);
}

/**
 * Update alert status
 */
export function updateAlertStatus(
  alertId: string,
  status: PriceAlertStatus,
  notes?: string
): PriceAlert | null {
  const alert = priceAlerts.get(alertId);
  if (!alert) return null;

  alert.status = status;
  if (notes) alert.notes = notes;
  if (status === 'resolved' || status === 'dismissed') {
    alert.resolvedAt = new Date();
  }

  return alert;
}

/**
 * Get alert statistics
 */
export function getAlertStats(): {
  total: number;
  pending: number;
  reviewed: number;
  resolved: number;
  dismissed: number;
  totalDeficitKrw: number;
} {
  let pending = 0;
  let reviewed = 0;
  let resolved = 0;
  let dismissed = 0;
  let totalDeficit = 0;

  for (const alert of priceAlerts.values()) {
    switch (alert.status) {
      case 'pending': pending++; break;
      case 'reviewed': reviewed++; break;
      case 'resolved': resolved++; break;
      case 'dismissed': dismissed++; break;
    }

    if (alert.status === 'pending') {
      totalDeficit += alert.deficitKrw;
    }
  }

  return {
    total: priceAlerts.size,
    pending,
    reviewed,
    resolved,
    dismissed,
    totalDeficitKrw: totalDeficit,
  };
}

// ============================================
// Supabase Integration (Production)
// ============================================

// In production, replace the in-memory cache with Supabase
// Example table structure is defined in the plan

export async function syncCacheToSupabase(): Promise<void> {
  // TODO: Implement Supabase sync
  // This would upsert all cache entries to naver_price_cache table
  console.log('Syncing cache to Supabase...');
}

export async function loadCacheFromSupabase(): Promise<void> {
  // TODO: Implement Supabase load
  // This would load non-expired entries from naver_price_cache table
  console.log('Loading cache from Supabase...');
}
