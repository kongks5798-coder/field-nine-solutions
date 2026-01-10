/**
 * Field Nine: 향상된 에러 모니터링 시스템
 * Sentry 완전 통합
 */

import * as Sentry from '@sentry/nextjs';

/**
 * 에러 추적 및 로깅
 */
export function trackError(error: Error, context?: Record<string, any>) {
  // Sentry에 에러 전송
  Sentry.captureException(error, {
    tags: {
      component: context?.component || 'unknown',
      action: context?.action || 'unknown',
    },
    extra: context,
  });

  // 콘솔에도 로그 출력 (개발 환경)
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Tracking]', error, context);
  }
}

/**
 * 성능 모니터링
 */
export function trackPerformance(operation: string, duration: number) {
  Sentry.addBreadcrumb({
    category: 'performance',
    message: `${operation} took ${duration}ms`,
    level: 'info',
    data: {
      operation,
      duration,
    },
  });

  // 느린 작업 알림 (1초 이상)
  if (duration > 1000) {
    Sentry.captureMessage(`Slow operation: ${operation}`, {
      level: 'warning',
      tags: {
        operation,
        duration,
      },
    });
  }
}

/**
 * 비즈니스 이벤트 추적
 */
export function trackBusinessEvent(event: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    category: 'business',
    message: event,
    level: 'info',
    data,
  });
}

/**
 * 사용자 액션 추적
 */
export function trackUserAction(action: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    category: 'user',
    message: action,
    level: 'info',
    data,
  });
}
