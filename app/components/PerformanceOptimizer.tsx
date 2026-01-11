'use client';

import { useEffect } from 'react';

/**
 * Performance Optimizer - Load <1s
 * 2026 Trend: Instant loading experience
 */
export function PerformanceOptimizer() {
  useEffect(() => {
    // Preload critical resources
    const preloadLinks = [
      { href: '/beta', as: 'document' },
    ];

    preloadLinks.forEach(({ href, as }) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      link.as = as as any;
      document.head.appendChild(link);
    });

    // Lazy load non-critical components
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            if (target.dataset.src) {
              target.setAttribute('src', target.dataset.src);
              target.removeAttribute('data-src');
              observer.unobserve(target);
            }
          }
        });
      });

      document.querySelectorAll('[data-src]').forEach((el) => observer.observe(el));
    }

    // Service Worker for caching
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Ignore errors
      });
    }
  }, []);

  return null;
}
