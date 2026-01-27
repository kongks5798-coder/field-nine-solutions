/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 58: PERFORMANCE MONITORING SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Production-grade performance monitoring with:
 * - API endpoint latency tracking
 * - Database query performance
 * - Memory usage metrics
 * - Custom business metrics
 * - Sentry integration
 */

import * as Sentry from '@sentry/nextjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

// ============================================
// Types
// ============================================

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'timer';

export interface PerformanceMetric {
  name: string;
  type: MetricType;
  value: number;
  tags?: Record<string, string>;
  timestamp?: Date;
}

export interface APIMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: Date;
}

export interface DatabaseMetrics {
  operation: string;
  table: string;
  duration: number;
  rowCount?: number;
  timestamp: Date;
}

// ============================================
// Supabase Client
// ============================================

let supabaseAdmin: AnySupabaseClient | null = null;

function getSupabaseAdmin(): AnySupabaseClient | null {
  if (!supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return null;
    }

    supabaseAdmin = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });
  }
  return supabaseAdmin;
}

// ============================================
// Performance Monitor Class
// ============================================

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metricsBuffer: PerformanceMetric[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly BUFFER_SIZE = 50;
  private readonly FLUSH_INTERVAL_MS = 10000;

  private constructor() {
    // Start flush interval
    if (typeof setInterval !== 'undefined') {
      this.flushInterval = setInterval(() => this.flush(), this.FLUSH_INTERVAL_MS);
    }
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // ============================================
  // Record Metrics
  // ============================================

  /**
   * Record a generic metric
   */
  record(metric: PerformanceMetric): void {
    this.metricsBuffer.push({
      ...metric,
      timestamp: metric.timestamp || new Date(),
    });

    // Sentry custom metrics (if available in current Sentry version)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sentryMetrics = (Sentry as any).metrics;
    if (sentryMetrics && typeof sentryMetrics.increment === 'function') {
      try {
        switch (metric.type) {
          case 'counter':
            sentryMetrics.increment(metric.name, metric.value, {
              tags: metric.tags,
            });
            break;
          case 'gauge':
            sentryMetrics.gauge(metric.name, metric.value, {
              tags: metric.tags,
            });
            break;
          case 'histogram':
          case 'timer':
            sentryMetrics.distribution(metric.name, metric.value, {
              tags: metric.tags,
              unit: metric.type === 'timer' ? 'millisecond' : undefined,
            });
            break;
        }
      } catch {
        // Sentry metrics not available
      }
    }

    if (this.metricsBuffer.length >= this.BUFFER_SIZE) {
      this.flush();
    }
  }

  /**
   * Record API endpoint metrics
   */
  recordAPI(metrics: APIMetrics): void {
    this.record({
      name: 'api.request',
      type: 'timer',
      value: metrics.duration,
      tags: {
        endpoint: metrics.endpoint,
        method: metrics.method,
        status: String(metrics.statusCode),
        success: metrics.statusCode < 400 ? 'true' : 'false',
      },
    });

    // Counter for total requests
    this.record({
      name: 'api.requests.total',
      type: 'counter',
      value: 1,
      tags: {
        endpoint: metrics.endpoint,
        method: metrics.method,
      },
    });

    // Track errors separately
    if (metrics.statusCode >= 500) {
      this.record({
        name: 'api.errors',
        type: 'counter',
        value: 1,
        tags: {
          endpoint: metrics.endpoint,
          status: String(metrics.statusCode),
        },
      });
    }
  }

  /**
   * Record database query metrics
   */
  recordDatabase(metrics: DatabaseMetrics): void {
    this.record({
      name: 'db.query',
      type: 'timer',
      value: metrics.duration,
      tags: {
        operation: metrics.operation,
        table: metrics.table,
      },
    });

    if (metrics.rowCount !== undefined) {
      this.record({
        name: 'db.rows',
        type: 'histogram',
        value: metrics.rowCount,
        tags: {
          operation: metrics.operation,
          table: metrics.table,
        },
      });
    }
  }

  /**
   * Create a timer for measuring duration
   */
  startTimer(name: string, tags?: Record<string, string>): () => number {
    const start = performance.now();

    return () => {
      const duration = performance.now() - start;
      this.record({
        name,
        type: 'timer',
        value: duration,
        tags,
      });
      return duration;
    };
  }

  // ============================================
  // Business Metrics
  // ============================================

  /**
   * Record payment transaction
   */
  recordPayment(amount: number, currency: string, status: 'success' | 'failed'): void {
    this.record({
      name: 'payment.transaction',
      type: 'counter',
      value: 1,
      tags: { currency, status },
    });

    if (status === 'success') {
      this.record({
        name: 'payment.amount',
        type: 'histogram',
        value: amount,
        tags: { currency },
      });
    }
  }

  /**
   * Record user action
   */
  recordUserAction(action: string, userId?: string): void {
    this.record({
      name: 'user.action',
      type: 'counter',
      value: 1,
      tags: {
        action,
        authenticated: userId ? 'true' : 'false',
      },
    });
  }

  /**
   * Record VIBE-ID analysis
   */
  recordVibeAnalysis(archetype: string, duration: number): void {
    this.record({
      name: 'vibe.analysis',
      type: 'counter',
      value: 1,
      tags: { archetype },
    });

    this.record({
      name: 'vibe.analysis.duration',
      type: 'timer',
      value: duration,
      tags: { archetype },
    });
  }

  /**
   * Record referral event
   */
  recordReferral(type: 'signup' | 'conversion' | 'reward'): void {
    this.record({
      name: `referral.${type}`,
      type: 'counter',
      value: 1,
    });
  }

  // ============================================
  // Memory & System Metrics
  // ============================================

  /**
   * Record current memory usage
   */
  recordMemoryUsage(): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();

      this.record({
        name: 'system.memory.heap_used',
        type: 'gauge',
        value: usage.heapUsed / 1024 / 1024, // MB
      });

      this.record({
        name: 'system.memory.heap_total',
        type: 'gauge',
        value: usage.heapTotal / 1024 / 1024, // MB
      });

      this.record({
        name: 'system.memory.rss',
        type: 'gauge',
        value: usage.rss / 1024 / 1024, // MB
      });
    }
  }

  // ============================================
  // Flush & Persistence
  // ============================================

  /**
   * Flush metrics buffer to database
   */
  async flush(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    const metrics = [...this.metricsBuffer];
    this.metricsBuffer = [];

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      // Log to console if no database
      console.log('[PerformanceMonitor] Flushing metrics:', metrics.length);
      return;
    }

    try {
      const records = metrics.map((m) => ({
        metric_name: m.name,
        metric_type: m.type,
        value: m.value,
        tags: m.tags || {},
        recorded_at: m.timestamp?.toISOString() || new Date().toISOString(),
      }));

      const { error } = await supabase.from('performance_metrics').insert(records);

      if (error) {
        console.error('[PerformanceMonitor] Flush error:', error);
      }
    } catch (error) {
      console.error('[PerformanceMonitor] Flush exception:', error);
    }
  }

  /**
   * Cleanup on shutdown
   */
  async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    await this.flush();
  }
}

// ============================================
// Convenience Exports
// ============================================

export const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * Middleware helper for API route timing
 */
export function withPerformanceTracking<T>(
  endpoint: string,
  method: string,
  handler: () => Promise<T>
): Promise<T> {
  const start = performance.now();

  return handler()
    .then((result) => {
      performanceMonitor.recordAPI({
        endpoint,
        method,
        statusCode: 200,
        duration: performance.now() - start,
        timestamp: new Date(),
      });
      return result;
    })
    .catch((error) => {
      performanceMonitor.recordAPI({
        endpoint,
        method,
        statusCode: 500,
        duration: performance.now() - start,
        timestamp: new Date(),
      });
      throw error;
    });
}

/**
 * HOF for timing async functions
 */
export function withTiming<T extends (...args: unknown[]) => Promise<unknown>>(
  name: string,
  fn: T,
  tags?: Record<string, string>
): T {
  return (async (...args: Parameters<T>) => {
    const endTimer = performanceMonitor.startTimer(name, tags);
    try {
      const result = await fn(...args);
      endTimer();
      return result;
    } catch (error) {
      endTimer();
      throw error;
    }
  }) as T;
}

/**
 * Track Sentry transaction
 */
export function startTransaction(name: string, op: string): Sentry.Span | undefined {
  return Sentry.startInactiveSpan({
    name,
    op,
  });
}
