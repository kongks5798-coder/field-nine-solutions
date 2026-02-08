/**
 * K-Universal Sentry Integration
 * Real-time error tracking and performance monitoring
 */

import * as Sentry from '@sentry/nextjs';

export const initSentry = () => {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      
      // Performance Monitoring
      tracesSampleRate: 1.0, // Capture 100% of transactions
      
      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
      
      // Filter out known issues
      beforeSend(event, hint) {
        // Don't send CORS errors from third-party scripts
        if (event.exception?.values?.[0]?.type === 'SecurityError') {
          return null;
        }
        
        return event;
      },
    });
  }
};

// Custom error tracking functions
export const captureError = (
  error: Error,
  context?: Record<string, unknown>
) => {
  Sentry.captureException(error, {
    extra: context,
  });
};

export const captureMessage = (
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
) => {
  Sentry.captureMessage(message, level);
};

// Track user context
export const setUserContext = (user: {
  id: string;
  email?: string;
  kycStatus?: string;
}) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    kycStatus: user.kycStatus,
  });
};

// Track custom breadcrumbs
export const addBreadcrumb = (
  category: string,
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
) => {
  Sentry.addBreadcrumb({
    category,
    message,
    level,
    timestamp: Date.now() / 1000,
  });
};

// K-Universal specific error tracking
export const trackKYCError = (error: Error, step: string) => {
  captureError(error, {
    feature: 'kyc',
    step,
  });
};

export const trackOCRError = (error: Error, imageSize?: number) => {
  captureError(error, {
    feature: 'ocr',
    imageSize,
  });
};

export const trackWalletError = (error: Error, operation: string) => {
  captureError(error, {
    feature: 'wallet',
    operation,
  });
};

export const trackPaymentError = (error: Error, amount?: number) => {
  captureError(error, {
    feature: 'payment',
    amount,
  });
};

// Performance monitoring (using modern Sentry API)
export const startTransaction = (name: string, op: string) => {
  return Sentry.startSpan({ name, op }, (span) => span);
};
