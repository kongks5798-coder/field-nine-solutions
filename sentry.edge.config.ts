/**
 * Sentry Edge Configuration
 * 
 * Edge Runtime에서 실행되는 Sentry 설정
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'production',
  tracesSampleRate: 1.0,
});
