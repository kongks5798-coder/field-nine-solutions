/**
 * Sentry Client Configuration - TrendStream
 * 
 * 비즈니스 목적:
 * - 프론트엔드 에러 추적 및 모니터링
 * - 사용자 세션 리플레이로 버그 재현
 * - 성능 메트릭 수집
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'production',
  
  // 성능 모니터링
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // 세션 리플레이 (에러 발생 시)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // 에러 필터링 (불필요한 에러 제외)
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
  
  // 사용자 컨텍스트
  beforeSend(event, hint) {
    // 프로덕션에서만 Sentry로 전송
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    return event;
  },
});
