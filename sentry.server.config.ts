/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 58: Sentry Server Configuration - Field Nine Solutions
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Enterprise-grade error tracking:
 * - Server-side error capture
 * - API performance monitoring
 * - Database query tracing
 * - Payment flow tracking
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'production',
  release: process.env.NEXT_PUBLIC_APP_VERSION || 'phase-58',

  // Performance monitoring (10% in production)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Profile 10% of transactions
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Error filtering
  ignoreErrors: [
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
    'ECONNRESET',
    'AbortError',
    'Network Error',
  ],

  // Ignore certain transactions
  ignoreTransactions: [
    '/api/health',
    '/_next/static',
  ],

  // Tag important errors
  beforeSend(event, hint) {
    // Skip in development
    if (process.env.NODE_ENV === 'development') {
      return null;
    }

    // Add custom tags for business-critical errors
    const error = hint?.originalException;
    if (error instanceof Error) {
      if (error.message.includes('payment')) {
        event.tags = { ...event.tags, category: 'payment' };
        event.level = 'error';
      }
      if (error.message.includes('auth') || error.message.includes('unauthorized')) {
        event.tags = { ...event.tags, category: 'auth' };
      }
      if (error.message.includes('database') || error.message.includes('supabase')) {
        event.tags = { ...event.tags, category: 'database' };
      }
    }

    return event;
  },

  // Add user context
  beforeSendTransaction(transaction) {
    // Filter out health checks and static assets
    if (transaction.transaction?.startsWith('/api/health')) {
      return null;
    }
    return transaction;
  },
});
