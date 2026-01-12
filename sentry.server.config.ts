/**
 * Sentry Server Configuration - TrendStream
 * 
 * 비즈니스 목적:
 * - 서버 사이드 에러 추적
 * - API 성능 모니터링
 * - 분석 실패 원인 파악
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'production',
  
  // 성능 모니터링 (프로덕션에서는 10% 샘플링)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // 에러 필터링
  ignoreErrors: [
    'ECONNREFUSED', // 연결 거부 (개발 환경)
    'ENOTFOUND', // DNS 오류
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
