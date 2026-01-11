'use client';

import { useEffect } from 'react';

/**
 * Tesla-style Performance Monitor
 * Web Vitals 및 성능 메트릭 수집
 */
export function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Web Vitals 측정
    const measureWebVitals = async () => {
      try {
        const { onCLS, onINP, onLCP, onFCP, onTTFB } = await import('web-vitals');

        const sendToAnalytics = (metric: any) => {
          // Vercel Analytics에 전송
          if (typeof window !== 'undefined' && (window as any).va) {
            (window as any).va('track', metric.name, {
              value: Math.round(metric.value),
              id: metric.id,
              delta: Math.round(metric.delta),
            });
          }

          // 커스텀 API로 전송 (선택적)
          if (process.env.NODE_ENV === 'production') {
            fetch('/api/analytics/vitals', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(metric),
              keepalive: true,
            }).catch(() => {
              // 실패 시 무시
            });
          }
        };

        onCLS(sendToAnalytics);
        onINP(sendToAnalytics); // FID 대신 INP 사용 (최신 web-vitals)
        onLCP(sendToAnalytics);
        onFCP(sendToAnalytics);
        onTTFB(sendToAnalytics);
      } catch (error) {
        console.warn('[PerformanceMonitor] Web Vitals 측정 실패:', error);
      }
    };

    // 페이지 로드 성능 측정
    const measurePageLoad = () => {
      if ('performance' in window && 'PerformanceObserver' in window) {
        try {
          const perfData = window.performance.timing;
          const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
          const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;

          // 성능 메트릭 로깅
          if (process.env.NODE_ENV === 'development') {
            console.log('[PerformanceMonitor]', {
              pageLoadTime: `${pageLoadTime}ms`,
              domReadyTime: `${domReadyTime}ms`,
            });
          }
        } catch (error) {
          console.warn('[PerformanceMonitor] 페이지 로드 측정 실패:', error);
        }
      }
    };

    // 초기 측정
    measureWebVitals();
    
    // 페이지 로드 완료 후 측정
    if (document.readyState === 'complete') {
      measurePageLoad();
    } else {
      window.addEventListener('load', measurePageLoad);
    }

    // 메모리 사용량 모니터링 (Chrome DevTools)
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        if (process.env.NODE_ENV === 'development') {
          console.log('[PerformanceMonitor] Memory:', {
            used: `${Math.round(memory.usedJSHeapSize / 1048576)}MB`,
            total: `${Math.round(memory.totalJSHeapSize / 1048576)}MB`,
            limit: `${Math.round(memory.jsHeapSizeLimit / 1048576)}MB`,
          });
        }
      }
    };

    // 주기적으로 메모리 측정 (개발 환경만)
    if (process.env.NODE_ENV === 'development') {
      const memoryInterval = setInterval(measureMemory, 30000); // 30초마다
      return () => clearInterval(memoryInterval);
    }
  }, []);

  return null;
}
