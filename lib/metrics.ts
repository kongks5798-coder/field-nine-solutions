/**
 * Performance Metrics - 성능 메트릭 수집
 * 
 * 비즈니스 목적:
 * - 페이지 로드 시간 추적
 * - API 응답 시간 모니터링
 * - 사용자 경험 최적화
 * - Core Web Vitals 측정
 */
import { onCLS, onINP, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';

interface MetricData {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
}

/**
 * Web Vitals 메트릭 수집
 */
export function reportWebVitals(metric: Metric) {
  // 개발 환경: 콘솔 출력
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', metric.name, metric.value, metric.rating);
  }

  // 프로덕션: 외부 서비스로 전송 (예: Vercel Analytics, Google Analytics)
  // Vercel Analytics는 자동으로 수집됨
  if (process.env.NODE_ENV === 'production') {
    // TODO: 커스텀 메트릭 서비스로 전송
    // sendToMetricsService(metric);
  }
}

/**
 * Core Web Vitals 초기화
 */
export function initWebVitals() {
  if (typeof window === 'undefined') return;

  onCLS(reportWebVitals);
  onINP(reportWebVitals); // onFID 대신 onINP 사용 (최신 web-vitals)
  onFCP(reportWebVitals);
  onLCP(reportWebVitals);
  onTTFB(reportWebVitals);
}

/**
 * 커스텀 메트릭 수집
 */
export function trackCustomMetric(name: string, value: number, tags?: Record<string, string>) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Custom Metric]', name, value, tags);
  }

  // 프로덕션: 메트릭 서비스로 전송
  if (process.env.NODE_ENV === 'production') {
    // TODO: 메트릭 서비스 통합
  }
}

/**
 * API 응답 시간 추적
 */
export function trackAPIResponseTime(endpoint: string, duration: number) {
  trackCustomMetric('api_response_time', duration, {
    endpoint,
    status: duration < 1000 ? 'fast' : duration < 3000 ? 'normal' : 'slow',
  });
}
