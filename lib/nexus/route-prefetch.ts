/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 74: ROUTE PREFETCH & OPTIMIZATION
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Nexus 앱 라우트 프리페치 및 최적화
 * - 예측적 라우트 로딩
 * - API 데이터 프리페치
 * - 캐시 전략
 */

// Core Nexus Routes
export const NEXUS_ROUTES = {
  energy: '/nexus/energy',
  exchange: '/nexus/exchange',
  market: '/nexus/market',
  profile: '/nexus/profile',
  membership: '/nexus/membership',
} as const;

// API endpoints to prefetch
export const PREFETCH_APIS = {
  kausBalance: '/api/kaus/balance',
  kausPrice: '/api/kaus/price',
  teslaLive: '/api/live/tesla',
  yeongdongLive: '/api/live/yeongdong',
  smpPrice: '/api/energy/smp-price',
} as const;

// Route prediction based on current route
export const ROUTE_PREDICTIONS: Record<string, string[]> = {
  '/nexus/energy': ['/nexus/exchange', '/nexus/market'],
  '/nexus/exchange': ['/nexus/profile', '/nexus/market'],
  '/nexus/market': ['/nexus/exchange', '/nexus/energy'],
  '/nexus/profile': ['/nexus/membership', '/nexus/exchange'],
  '/nexus/membership': ['/nexus/profile'],
};

// Prefetch delay (ms) - wait for initial render
const PREFETCH_DELAY = 1000;

/**
 * Prefetch a route using Next.js Link prefetching
 */
export function prefetchRoute(href: string): void {
  if (typeof window === 'undefined') return;

  // Create invisible link to trigger Next.js prefetch
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  link.as = 'document';
  document.head.appendChild(link);
}

/**
 * Prefetch API data and cache it
 */
export async function prefetchApiData(endpoint: string): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { 'X-Prefetch': 'true' },
    });

    if (response.ok) {
      const data = await response.json();
      // Store in sessionStorage for quick access
      const cacheKey = `prefetch:${endpoint}`;
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now(),
        ttl: 30000, // 30 seconds
      }));
    }
  } catch {
    // Silently fail - prefetch is best-effort
  }
}

/**
 * Get cached prefetch data
 */
export function getCachedData<T>(endpoint: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const cacheKey = `prefetch:${endpoint}`;
    const cached = sessionStorage.getItem(cacheKey);

    if (!cached) return null;

    const { data, timestamp, ttl } = JSON.parse(cached);

    if (Date.now() - timestamp > ttl) {
      sessionStorage.removeItem(cacheKey);
      return null;
    }

    return data as T;
  } catch {
    return null;
  }
}

/**
 * Prefetch predicted routes and APIs based on current route
 */
export function prefetchPredictedResources(currentRoute: string): void {
  if (typeof window === 'undefined') return;

  // Normalize route (remove locale prefix)
  const normalizedRoute = currentRoute.replace(/^\/[a-z]{2}/, '');

  // Wait for initial render
  setTimeout(() => {
    // Prefetch predicted routes
    const predictedRoutes = ROUTE_PREDICTIONS[normalizedRoute] || [];
    predictedRoutes.forEach((route) => {
      prefetchRoute(route);
    });

    // Prefetch common APIs
    prefetchApiData(PREFETCH_APIS.kausBalance);
    prefetchApiData(PREFETCH_APIS.kausPrice);
  }, PREFETCH_DELAY);
}

/**
 * Aggressive prefetch - load all Nexus routes and data
 */
export function aggressivePrefetch(): void {
  if (typeof window === 'undefined') return;

  // Check if user has good connection
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  const isSlowConnection = connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g';

  if (isSlowConnection) return; // Skip on slow connections

  setTimeout(() => {
    // Prefetch all routes
    Object.values(NEXUS_ROUTES).forEach((route) => {
      prefetchRoute(route);
    });

    // Prefetch all APIs
    Object.values(PREFETCH_APIS).forEach((api) => {
      prefetchApiData(api);
    });
  }, PREFETCH_DELAY * 2);
}

/**
 * Intersection Observer for visible elements
 * Prefetches links when they become visible
 */
export function createPrefetchObserver(): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const link = entry.target as HTMLAnchorElement;
          const href = link.getAttribute('href');
          if (href && href.startsWith('/nexus')) {
            prefetchRoute(href);
          }
        }
      });
    },
    {
      rootMargin: '100px',
    }
  );
}

// Type declaration for Network Information API
interface NetworkInformation {
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
}

/**
 * Route transition metrics
 */
export const RouteMetrics = {
  startTime: 0,

  start(): void {
    this.startTime = performance.now();
  },

  end(route: string): void {
    const duration = performance.now() - this.startTime;
    console.log(`[Route] ${route} loaded in ${duration.toFixed(0)}ms`);

    // Track slow routes
    if (duration > 2000) {
      console.warn(`[Route] Slow navigation to ${route}: ${duration.toFixed(0)}ms`);
    }
  },
};
