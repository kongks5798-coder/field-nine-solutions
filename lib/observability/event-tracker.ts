/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 59: EVENT TRACKING SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Track user actions and system events for analytics
 * - User behavior tracking
 * - Feature usage metrics
 * - Conversion funnels
 * - Error tracking
 */

import { logger } from './logger';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type EventCategory =
  | 'user'
  | 'auth'
  | 'navigation'
  | 'feature'
  | 'transaction'
  | 'error'
  | 'performance'
  | 'system';

export interface TrackEvent {
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
  properties?: Record<string, unknown>;
}

export interface UserProperties {
  userId?: string;
  email?: string;
  name?: string;
  role?: string;
  tier?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface PageViewEvent {
  path: string;
  title?: string;
  referrer?: string;
  queryParams?: Record<string, string>;
}

export interface ConversionEvent {
  funnel: string;
  step: string;
  stepNumber: number;
  totalSteps: number;
  completed: boolean;
  properties?: Record<string, unknown>;
}

export interface FeatureUsageEvent {
  feature: string;
  action: 'view' | 'click' | 'use' | 'complete' | 'error';
  properties?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT QUEUE
// ═══════════════════════════════════════════════════════════════════════════════

interface QueuedEvent {
  type: string;
  timestamp: string;
  sessionId: string;
  userId?: string;
  data: unknown;
}

class EventQueue {
  private queue: QueuedEvent[] = [];
  private flushInterval: number = 5000; // 5 seconds
  private maxQueueSize: number = 100;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Auto-flush on server side
    if (typeof window === 'undefined') {
      this.startAutoFlush();
    }
  }

  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      if (this.queue.length > 0) {
        this.flush();
      }
    }, this.flushInterval);
  }

  push(event: QueuedEvent): void {
    this.queue.push(event);

    // Flush if queue is full
    if (this.queue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  flush(): void {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    // Log batched events
    logger.info('Event batch flushed', {
      eventCount: events.length,
      events: events.map(e => ({ type: e.type, action: (e.data as TrackEvent)?.action })),
    });

    // In production, send to analytics service
    // e.g., Mixpanel, Amplitude, PostHog, etc.
    this.sendToAnalytics(events);
  }

  private async sendToAnalytics(events: QueuedEvent[]): Promise<void> {
    // Placeholder for analytics integration
    // In production, implement:
    // - Mixpanel track
    // - Amplitude logEvent
    // - PostHog capture
    // - Custom analytics endpoint

    if (process.env.ANALYTICS_ENDPOINT) {
      try {
        await fetch(process.env.ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events }),
        });
      } catch (error) {
        logger.error('Failed to send events to analytics', error);
      }
    }
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT TRACKER
// ═══════════════════════════════════════════════════════════════════════════════

class EventTracker {
  private queue: EventQueue;
  private sessionId: string;
  private userId?: string;
  private userProperties: UserProperties = {};

  constructor() {
    this.queue = new EventQueue();
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Identify user
   */
  identify(userId: string, properties?: UserProperties): void {
    this.userId = userId;
    this.userProperties = { ...this.userProperties, ...properties, userId };

    this.queue.push({
      type: 'identify',
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId,
      data: this.userProperties,
    });
  }

  /**
   * Set user properties without identifying
   */
  setUserProperties(properties: UserProperties): void {
    this.userProperties = { ...this.userProperties, ...properties };
  }

  /**
   * Reset user (on logout)
   */
  reset(): void {
    this.userId = undefined;
    this.userProperties = {};
    this.sessionId = this.generateSessionId();
  }

  /**
   * Track a generic event
   */
  track(event: TrackEvent): void {
    this.queue.push({
      type: 'track',
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      data: event,
    });
  }

  /**
   * Track page view
   */
  pageView(event: PageViewEvent): void {
    this.queue.push({
      type: 'pageView',
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      data: event,
    });
  }

  /**
   * Track feature usage
   */
  feature(event: FeatureUsageEvent): void {
    this.track({
      category: 'feature',
      action: event.action,
      label: event.feature,
      properties: event.properties,
    });
  }

  /**
   * Track conversion funnel
   */
  conversion(event: ConversionEvent): void {
    this.queue.push({
      type: 'conversion',
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      data: event,
    });

    // Log funnel completion
    if (event.completed) {
      logger.info('Conversion funnel completed', {
        funnel: event.funnel,
        userId: this.userId,
      });
    }
  }

  /**
   * Track timing/performance
   */
  timing(category: string, name: string, duration: number): void {
    this.track({
      category: 'performance',
      action: 'timing',
      label: `${category}:${name}`,
      value: Math.round(duration),
      properties: { category, name, duration },
    });
  }

  /**
   * Track error
   */
  error(error: Error, context?: Record<string, unknown>): void {
    this.track({
      category: 'error',
      action: 'exception',
      label: error.message,
      properties: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...context,
      },
    });
  }

  /**
   * Track button click
   */
  click(elementId: string, label?: string, properties?: Record<string, unknown>): void {
    this.track({
      category: 'user',
      action: 'click',
      label: label || elementId,
      properties: { elementId, ...properties },
    });
  }

  /**
   * Track form submission
   */
  formSubmit(formName: string, success: boolean, properties?: Record<string, unknown>): void {
    this.track({
      category: 'user',
      action: success ? 'form_submit_success' : 'form_submit_error',
      label: formName,
      properties: { formName, success, ...properties },
    });
  }

  /**
   * Track search
   */
  search(query: string, resultsCount: number, properties?: Record<string, unknown>): void {
    this.track({
      category: 'user',
      action: 'search',
      label: query,
      value: resultsCount,
      properties: { query, resultsCount, ...properties },
    });
  }

  /**
   * Track purchase/transaction
   */
  purchase(params: {
    transactionId: string;
    revenue: number;
    currency: string;
    items?: Array<{ id: string; name: string; price: number; quantity: number }>;
  }): void {
    this.track({
      category: 'transaction',
      action: 'purchase',
      label: params.transactionId,
      value: params.revenue,
      properties: params,
    });
  }

  /**
   * Flush pending events
   */
  flush(): void {
    this.queue.flush();
  }

  /**
   * Destroy tracker
   */
  destroy(): void {
    this.queue.destroy();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRE-DEFINED EVENT HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export const Events = {
  // Auth events
  AUTH_LOGIN: { category: 'auth' as EventCategory, action: 'login' },
  AUTH_LOGOUT: { category: 'auth' as EventCategory, action: 'logout' },
  AUTH_REGISTER: { category: 'auth' as EventCategory, action: 'register' },
  AUTH_PASSWORD_RESET: { category: 'auth' as EventCategory, action: 'password_reset' },

  // Wallet events
  WALLET_CONNECT: { category: 'feature' as EventCategory, action: 'wallet_connect' },
  WALLET_DISCONNECT: { category: 'feature' as EventCategory, action: 'wallet_disconnect' },
  WALLET_TOPUP: { category: 'transaction' as EventCategory, action: 'wallet_topup' },

  // NFT events
  NFT_VIEW: { category: 'feature' as EventCategory, action: 'nft_view' },
  NFT_PURCHASE: { category: 'transaction' as EventCategory, action: 'nft_purchase' },
  NFT_LIST: { category: 'feature' as EventCategory, action: 'nft_list' },
  NFT_BID: { category: 'transaction' as EventCategory, action: 'nft_bid' },

  // Trading events
  TRADE_EXECUTE: { category: 'transaction' as EventCategory, action: 'trade_execute' },
  TRADE_CANCEL: { category: 'transaction' as EventCategory, action: 'trade_cancel' },

  // Subscription events
  SUBSCRIPTION_START: { category: 'transaction' as EventCategory, action: 'subscription_start' },
  SUBSCRIPTION_CANCEL: { category: 'transaction' as EventCategory, action: 'subscription_cancel' },
  SUBSCRIPTION_UPGRADE: { category: 'transaction' as EventCategory, action: 'subscription_upgrade' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════════

export const tracker = new EventTracker();

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default tracker;
