/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 61: PERFORMANCE METRICS TRACKING
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * API performance monitoring and metrics collection
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../observability';

// Types
export interface APIMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
  error?: string;
}

export interface EndpointStats {
  endpoint: string;
  requestCount: number;
  avgResponseTime: number;
  p50: number;
  p95: number;
  p99: number;
  errorRate: number;
  successCount: number;
  errorCount: number;
  lastRequest: Date;
}

export interface PerformanceReport {
  timestamp: Date;
  period: string;
  totalRequests: number;
  avgResponseTime: number;
  errorRate: number;
  endpoints: EndpointStats[];
  slowestEndpoints: EndpointStats[];
  errorProne: EndpointStats[];
}

// Performance Metrics Store
class MetricsStore {
  private metrics: APIMetric[] = [];
  private maxSize: number = 10000;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Clean up old metrics every 5 minutes
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  record(metric: APIMetric): void {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxSize) {
      this.metrics.shift();
    }
  }

  getMetrics(since?: Date): APIMetric[] {
    if (!since) return [...this.metrics];
    return this.metrics.filter((m) => m.timestamp >= since);
  }

  getEndpointStats(endpoint?: string, since?: Date): EndpointStats[] {
    let filtered = this.getMetrics(since);

    if (endpoint) {
      filtered = filtered.filter((m) => m.endpoint === endpoint);
    }

    // Group by endpoint
    const grouped: Record<string, APIMetric[]> = {};
    filtered.forEach((m) => {
      if (!grouped[m.endpoint]) grouped[m.endpoint] = [];
      grouped[m.endpoint].push(m);
    });

    // Calculate stats for each endpoint
    return Object.entries(grouped).map(([ep, metrics]) => {
      const responseTimes = metrics.map((m) => m.responseTime).sort((a, b) => a - b);
      const successCount = metrics.filter((m) => m.statusCode < 400).length;
      const errorCount = metrics.length - successCount;

      return {
        endpoint: ep,
        requestCount: metrics.length,
        avgResponseTime: this.calculateAvg(responseTimes),
        p50: this.calculatePercentile(responseTimes, 50),
        p95: this.calculatePercentile(responseTimes, 95),
        p99: this.calculatePercentile(responseTimes, 99),
        errorRate: metrics.length > 0 ? (errorCount / metrics.length) * 100 : 0,
        successCount,
        errorCount,
        lastRequest: new Date(Math.max(...metrics.map((m) => m.timestamp.getTime()))),
      };
    });
  }

  generateReport(periodMinutes: number = 60): PerformanceReport {
    const since = new Date(Date.now() - periodMinutes * 60 * 1000);
    const metrics = this.getMetrics(since);
    const endpointStats = this.getEndpointStats(undefined, since);

    const responseTimes = metrics.map((m) => m.responseTime);
    const errorCount = metrics.filter((m) => m.statusCode >= 400).length;

    // Sort for slowest and error-prone
    const slowest = [...endpointStats].sort((a, b) => b.avgResponseTime - a.avgResponseTime).slice(0, 5);
    const errorProne = [...endpointStats].sort((a, b) => b.errorRate - a.errorRate).slice(0, 5);

    return {
      timestamp: new Date(),
      period: `${periodMinutes} minutes`,
      totalRequests: metrics.length,
      avgResponseTime: this.calculateAvg(responseTimes),
      errorRate: metrics.length > 0 ? (errorCount / metrics.length) * 100 : 0,
      endpoints: endpointStats.sort((a, b) => b.requestCount - a.requestCount),
      slowestEndpoints: slowest,
      errorProne,
    };
  }

  private calculateAvg(values: number[]): number {
    if (values.length === 0) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }

  private calculatePercentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }

  private cleanup(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    this.metrics = this.metrics.filter((m) => m.timestamp >= oneHourAgo);
  }

  clear(): void {
    this.metrics = [];
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Singleton instance
export const metricsStore = new MetricsStore();

// Helper to get client IP
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

/**
 * Middleware to track API performance
 */
export function withPerformanceTracking(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options?: { endpoint?: string }
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const endpoint = options?.endpoint || new URL(request.url).pathname;
    const method = request.method;

    let statusCode = 200;
    let error: string | undefined;

    try {
      const response = await handler(request);
      statusCode = response.status;
      return response;
    } catch (err) {
      statusCode = 500;
      error = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      const responseTime = Date.now() - startTime;

      const metric: APIMetric = {
        endpoint,
        method,
        statusCode,
        responseTime,
        timestamp: new Date(),
        userAgent: request.headers.get('user-agent') || undefined,
        ip: getClientIP(request),
        error,
      };

      metricsStore.record(metric);

      // Log slow requests
      if (responseTime > 3000) {
        logger.warn('Slow API response', {
          endpoint,
          method,
          responseTime,
          statusCode,
        });
      }
    }
  };
}

/**
 * Record a metric manually
 */
export function recordMetric(metric: Omit<APIMetric, 'timestamp'>): void {
  metricsStore.record({
    ...metric,
    timestamp: new Date(),
  });
}

/**
 * Get performance report
 */
export function getPerformanceReport(periodMinutes: number = 60): PerformanceReport {
  return metricsStore.generateReport(periodMinutes);
}

/**
 * Get endpoint stats
 */
export function getEndpointStats(endpoint?: string, since?: Date): EndpointStats[] {
  return metricsStore.getEndpointStats(endpoint, since);
}

export default metricsStore;
