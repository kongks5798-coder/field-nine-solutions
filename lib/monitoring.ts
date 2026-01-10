/**
 * 프로덕션 모니터링 유틸리티
 * 
 * Sentry 및 Vercel Analytics 통합
 * 오류 추적, 성능 모니터링, 사용자 행동 분석
 */

// Sentry 초기화 (환경 변수 있을 때만)
let sentryInitialized = false;

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  try {
    // Sentry는 브라우저에서만 초기화
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        environment: process.env.NODE_ENV || 'production',
        tracesSampleRate: 1.0,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
      });
      sentryInitialized = true;
    });
  } catch (error) {
    console.warn('[Monitoring] Sentry 초기화 실패:', error);
  }
}

/**
 * 에러 추적
 */
export function trackError(error: Error, context?: Record<string, any>) {
  if (typeof window === 'undefined') return;

  // Sentry에 에러 전송
  if (sentryInitialized && (window as any).Sentry) {
    (window as any).Sentry.captureException(error, {
      contexts: {
        custom: context || {},
      },
    });
  }

  // 로컬 로깅
  console.error('[Error Tracking]', error, context);
}

/**
 * 성능 측정
 */
export function trackPerformance(name: string, duration: number, metadata?: Record<string, any>) {
  if (typeof window === 'undefined') return;

  // Sentry에 성능 데이터 전송
  if (sentryInitialized && (window as any).Sentry) {
    (window as any).Sentry.addBreadcrumb({
      category: 'performance',
      message: name,
      level: 'info',
      data: {
        duration,
        ...metadata,
      },
    });
  }

  // 로컬 로깅
  console.log(`[Performance] ${name}: ${duration}ms`, metadata);
}

/**
 * 사용자 이벤트 추적
 */
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return;

  // Sentry에 이벤트 전송
  if (sentryInitialized && (window as any).Sentry) {
    (window as any).Sentry.addBreadcrumb({
      category: 'user',
      message: eventName,
      level: 'info',
      data: properties || {},
    });
  }

  // 로컬 로깅
  console.log(`[Event] ${eventName}`, properties);
}

/**
 * 페이지 뷰 추적
 */
export function trackPageView(path: string) {
  if (typeof window === 'undefined') return;

  trackEvent('page_view', { path });
}
