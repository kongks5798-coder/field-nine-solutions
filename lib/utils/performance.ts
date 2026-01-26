/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 58: PERFORMANCE UTILITIES
 * ═══════════════════════════════════════════════════════════════════════════════
 * Production-ready performance optimization utilities
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// DEBOUNCE & THROTTLE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Debounce function - delays execution until after wait ms
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Throttle function - limits execution to once per wait ms
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - lastTime);

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastTime = now;
      func.apply(this, args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastTime = Date.now();
        timeoutId = null;
        func.apply(this, args);
      }, remaining);
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Hook for intersection observer (lazy loading)
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefCallback<Element>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef<Element | null>(null);

  const setRef = useCallback((node: Element | null) => {
    if (targetRef.current) {
      // Cleanup previous observer
    }
    targetRef.current = node;
  }, []);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      { threshold: 0.1, ...options }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [options]);

  return [setRef, isIntersecting];
}

/**
 * Hook for debounced value
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for throttled callback
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const lastRan = useRef(Date.now());

  return useCallback(
    ((...args: Parameters<T>) => {
      if (Date.now() - lastRan.current >= delay) {
        callback(...args);
        lastRan.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEMOIZATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Simple LRU cache for expensive computations
 */
export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private readonly maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;

    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Delete oldest (first) entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * Memoize function with LRU cache
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  maxSize: number = 100
): T {
  const cache = new LRUCache<string, ReturnType<T>>(maxSize);

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    if (cached !== undefined) return cached;

    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as T;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST IDLE CALLBACK
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Schedule work during idle time
 */
export function scheduleIdleWork(
  callback: () => void,
  timeout: number = 5000
): () => void {
  if (typeof window === 'undefined') {
    callback();
    return () => {};
  }

  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(callback, { timeout });
    return () => window.cancelIdleCallback(id);
  }

  // Fallback for browsers without requestIdleCallback
  const id = setTimeout(callback, 1);
  return () => clearTimeout(id);
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRELOAD UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Preload critical resources
 */
export function preloadResource(href: string, as: string): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;

  if (as === 'font') {
    link.crossOrigin = 'anonymous';
  }

  document.head.appendChild(link);
}

/**
 * Prefetch page for faster navigation
 */
export function prefetchPage(href: string): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEB VITALS
// ═══════════════════════════════════════════════════════════════════════════════

interface WebVital {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

/**
 * Report web vitals to analytics
 */
export function reportWebVital(metric: WebVital): void {
  // Send to analytics endpoint
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/analytics/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric),
      keepalive: true,
    }).catch(() => {
      // Silently fail - don't affect user experience
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// IMAGE OPTIMIZATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate optimized image URL with sizing
 */
export function getOptimizedImageUrl(
  src: string,
  width: number,
  quality: number = 75
): string {
  // Use Next.js image optimization
  if (src.startsWith('/')) {
    return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
  }
  return src;
}

/**
 * Get responsive image srcset
 */
export function getResponsiveSrcSet(
  src: string,
  sizes: number[] = [640, 750, 828, 1080, 1200, 1920]
): string {
  return sizes
    .map((size) => `${getOptimizedImageUrl(src, size)} ${size}w`)
    .join(', ');
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUNDLE SIZE TRACKING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Log component render performance (development only)
 */
export function measureRenderTime(componentName: string): () => void {
  if (process.env.NODE_ENV !== 'development') {
    return () => {};
  }

  const start = performance.now();
  return () => {
    const duration = performance.now() - start;
    if (duration > 16) {
      // Longer than 1 frame (60fps)
      console.warn(`[Performance] ${componentName} render took ${duration.toFixed(2)}ms`);
    }
  };
}
