'use client';

import { useEffect } from 'react';
import { initWebVitals, trackAPIResponseTime } from '@/lib/metrics';

/**
 * PerformanceMonitor Component - 성능 모니터링
 * 
 * 비즈니스 목적:
 * - Core Web Vitals 수집
 * - 사용자 경험 최적화
 * - 성능 문제 조기 발견
 */
export default function PerformanceMonitor() {
  useEffect(() => {
    // Web Vitals 초기화
    initWebVitals();

    // API 호출 시간 추적
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const response = await originalFetch(...args);
      const duration = performance.now() - startTime;
      
      // API 엔드포인트 추출
      const url = typeof args[0] === 'string' 
        ? args[0] 
        : args[0] instanceof URL 
          ? args[0].toString()
          : (args[0] as Request).url;
      if (url.startsWith('/api/')) {
        trackAPIResponseTime(url, duration);
      }
      
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null; // UI 없음, 백그라운드 모니터링만
}
