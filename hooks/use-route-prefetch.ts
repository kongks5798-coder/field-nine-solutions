/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 74: USE ROUTE PREFETCH HOOK
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * React hooks for route prefetching and data caching
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  prefetchPredictedResources,
  aggressivePrefetch,
  getCachedData,
  prefetchApiData,
  createPrefetchObserver,
  RouteMetrics,
} from '@/lib/nexus/route-prefetch';

/**
 * Hook to prefetch predicted routes based on current location
 */
export function useRoutePrefetch() {
  const pathname = usePathname();

  useEffect(() => {
    prefetchPredictedResources(pathname);
  }, [pathname]);

  useEffect(() => {
    // Aggressive prefetch on idle
    if ('requestIdleCallback' in window) {
      const idleCallback = window.requestIdleCallback(() => {
        aggressivePrefetch();
      });
      return () => window.cancelIdleCallback(idleCallback);
    } else {
      // Fallback for Safari
      const timeout = setTimeout(aggressivePrefetch, 3000);
      return () => clearTimeout(timeout);
    }
  }, []);
}

/**
 * Hook to track route transition performance
 */
export function useRouteMetrics() {
  const pathname = usePathname();
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    RouteMetrics.start();

    return () => {
      RouteMetrics.end(pathname);
    };
  }, [pathname]);
}

/**
 * Hook to prefetch on link hover
 */
export function usePrefetchOnHover(href: string) {
  const prefetchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const onMouseEnter = useCallback(() => {
    prefetchTimerRef.current = setTimeout(() => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    }, 100);
  }, [href]);

  const onMouseLeave = useCallback(() => {
    if (prefetchTimerRef.current) {
      clearTimeout(prefetchTimerRef.current);
    }
  }, []);

  return { onMouseEnter, onMouseLeave };
}

/**
 * Hook to prefetch API data with caching
 */
export function usePrefetchedData<T>(
  endpoint: string,
  options?: {
    enabled?: boolean;
    refetchOnMount?: boolean;
  }
) {
  const { enabled = true, refetchOnMount = false } = options || {};

  useEffect(() => {
    if (!enabled) return;

    // Check cache first
    const cached = getCachedData<T>(endpoint);
    if (cached && !refetchOnMount) return;

    // Prefetch in background
    prefetchApiData(endpoint);
  }, [endpoint, enabled, refetchOnMount]);

  // Return cached data getter
  return useCallback(() => getCachedData<T>(endpoint), [endpoint]);
}

/**
 * Hook to observe and prefetch visible links
 */
export function usePrefetchObserver() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = createPrefetchObserver();

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const observeLink = useCallback((element: HTMLAnchorElement | null) => {
    if (element && observerRef.current) {
      observerRef.current.observe(element);
    }
  }, []);

  return { observeLink };
}

/**
 * Hook for instant navigation feedback
 */
export function useInstantNavigation() {
  const pathname = usePathname();

  useEffect(() => {
    // Add class to body for instant feedback
    document.body.classList.add('navigating');

    const timeout = setTimeout(() => {
      document.body.classList.remove('navigating');
    }, 300);

    return () => {
      clearTimeout(timeout);
      document.body.classList.remove('navigating');
    };
  }, [pathname]);
}
