/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 58: API RESPONSE CACHING
 * ═══════════════════════════════════════════════════════════════════════════════
 * Server-side response caching for API routes
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CACHE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

// Default TTL values (in milliseconds)
const DEFAULT_TTL = {
  short: 10_000,      // 10 seconds - frequently changing data
  medium: 60_000,     // 1 minute - moderately stable data
  long: 300_000,      // 5 minutes - stable data
  extended: 900_000,  // 15 minutes - rarely changing data
};

// ═══════════════════════════════════════════════════════════════════════════════
// CACHE OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get cached value if valid
 */
export function getCached<T>(key: string): T | null {
  const entry = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;

  if (Date.now() - entry.timestamp > entry.ttl) {
    memoryCache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Set cache value with TTL
 */
export function setCache<T>(key: string, data: T, ttl: number = DEFAULT_TTL.medium): void {
  // Prevent cache from growing too large
  if (memoryCache.size > 1000) {
    cleanExpiredCache();
  }

  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

/**
 * Delete cached value
 */
export function deleteCache(key: string): void {
  memoryCache.delete(key);
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  memoryCache.clear();
}

/**
 * Clean expired cache entries
 */
function cleanExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      memoryCache.delete(key);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CACHE-AWARE FETCH WRAPPER
// ═══════════════════════════════════════════════════════════════════════════════

interface CachedFetchOptions {
  ttl?: number;
  forceRefresh?: boolean;
  staleWhileRevalidate?: boolean;
}

/**
 * Fetch with caching support
 */
export async function cachedFetch<T>(
  url: string,
  options: RequestInit & CachedFetchOptions = {}
): Promise<T> {
  const { ttl = DEFAULT_TTL.medium, forceRefresh = false, staleWhileRevalidate = false, ...fetchOptions } = options;
  const cacheKey = `fetch:${url}:${JSON.stringify(fetchOptions.body || '')}`;

  // Check cache
  if (!forceRefresh) {
    const cached = getCached<T>(cacheKey);
    if (cached !== null) {
      // Optionally revalidate in background
      if (staleWhileRevalidate) {
        revalidateInBackground(url, fetchOptions, cacheKey, ttl);
      }
      return cached;
    }
  }

  // Fetch fresh data
  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status}`);
  }

  const data = await response.json() as T;
  setCache(cacheKey, data, ttl);
  return data;
}

/**
 * Revalidate cache in background
 */
async function revalidateInBackground<T>(
  url: string,
  options: RequestInit,
  cacheKey: string,
  ttl: number
): Promise<void> {
  try {
    const response = await fetch(url, options);
    if (response.ok) {
      const data = await response.json() as T;
      setCache(cacheKey, data, ttl);
    }
  } catch {
    // Silently fail - stale data is already served
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTE-SPECIFIC CACHE CONFIGS
// ═══════════════════════════════════════════════════════════════════════════════

export const CACHE_CONFIGS = {
  // Frequently changing
  'smp-price': DEFAULT_TTL.short,
  'tvl': DEFAULT_TTL.short,
  'gas-price': DEFAULT_TTL.short,
  'trading-data': DEFAULT_TTL.short,

  // Moderately stable
  'weather': DEFAULT_TTL.medium,
  'market-data': DEFAULT_TTL.medium,
  'notifications': DEFAULT_TTL.medium,
  'user-profile': DEFAULT_TTL.medium,

  // Stable
  'membership': DEFAULT_TTL.long,
  'portfolio': DEFAULT_TTL.long,
  'referral': DEFAULT_TTL.long,

  // Rarely changing
  'config': DEFAULT_TTL.extended,
  'static-content': DEFAULT_TTL.extended,
} as const;

/**
 * Get TTL for specific route type
 */
export function getTTLForRoute(routeType: keyof typeof CACHE_CONFIGS): number {
  return CACHE_CONFIGS[routeType] || DEFAULT_TTL.medium;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CACHE HEADERS HELPER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate Cache-Control header value
 */
export function getCacheControlHeader(options: {
  maxAge?: number;
  sMaxAge?: number;
  staleWhileRevalidate?: number;
  private?: boolean;
}): string {
  const parts: string[] = [];

  if (options.private) {
    parts.push('private');
  } else {
    parts.push('public');
  }

  if (options.maxAge !== undefined) {
    parts.push(`max-age=${Math.floor(options.maxAge / 1000)}`);
  }

  if (options.sMaxAge !== undefined) {
    parts.push(`s-maxage=${Math.floor(options.sMaxAge / 1000)}`);
  }

  if (options.staleWhileRevalidate !== undefined) {
    parts.push(`stale-while-revalidate=${Math.floor(options.staleWhileRevalidate / 1000)}`);
  }

  return parts.join(', ');
}

// ═══════════════════════════════════════════════════════════════════════════════
// CACHE STATISTICS
// ═══════════════════════════════════════════════════════════════════════════════

export function getCacheStats(): {
  size: number;
  keys: string[];
  oldestEntry: number | null;
  newestEntry: number | null;
} {
  const timestamps = Array.from(memoryCache.values()).map(e => e.timestamp);

  return {
    size: memoryCache.size,
    keys: Array.from(memoryCache.keys()),
    oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
    newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null,
  };
}
