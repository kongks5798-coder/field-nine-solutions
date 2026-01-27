/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 60: OBSERVABILITY API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Unified observability endpoint for admin dashboard
 * Exposes data from: Health, Cache, Rate Limiter, Circuit Breaker
 */

import { NextResponse } from 'next/server';
import { healthChecker } from '@/lib/health';
import { cache } from '@/lib/cache';
import { rateLimiter } from '@/lib/security';
import { circuitBreakerRegistry } from '@/lib/resilience';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const startTime = Date.now();

    // Gather all observability data in parallel
    const [healthReport, cacheStats, blockedIPs, circuitBreakerStats] = await Promise.all([
      healthChecker.checkAll(),
      Promise.resolve(cache.getStats()),
      Promise.resolve(rateLimiter.getBlockedIPs()),
      Promise.resolve(circuitBreakerRegistry.getAllStats()),
    ]);

    const responseTime = Date.now() - startTime;

    // Build comprehensive observability report
    const report = {
      timestamp: new Date().toISOString(),
      responseTime,

      // System Health
      health: {
        status: healthReport.status,
        uptime: healthReport.uptime,
        version: healthReport.version,
        checks: healthReport.checks.map((check) => ({
          name: check.name,
          status: check.status,
          latency: check.latency,
          message: check.message,
        })),
        summary: healthReport.summary,
      },

      // Cache Metrics
      cache: {
        ...cacheStats,
        hitRatePercent: (cacheStats.hitRate * 100).toFixed(1),
      },

      // Rate Limiting & DDoS
      security: {
        blockedIPs: blockedIPs.length,
        blockedIPsList: blockedIPs.slice(0, 10), // Top 10 for security
      },

      // Circuit Breakers
      circuitBreakers: Object.entries(circuitBreakerStats).map(([name, stats]) => ({
        name,
        state: stats.state,
        failures: stats.failures,
        successes: stats.successes,
        lastFailure: stats.lastFailure,
        isHealthy: stats.state === 'CLOSED',
      })),

      // Summary counts
      summary: {
        healthyServices: healthReport.summary.healthy,
        degradedServices: healthReport.summary.degraded,
        unhealthyServices: healthReport.summary.unhealthy,
        openCircuits: Object.values(circuitBreakerStats).filter(
          (s) => s.state === 'OPEN'
        ).length,
        halfOpenCircuits: Object.values(circuitBreakerStats).filter(
          (s) => s.state === 'HALF_OPEN'
        ).length,
        closedCircuits: Object.values(circuitBreakerStats).filter(
          (s) => s.state === 'CLOSED'
        ).length,
        cacheHitRate: cacheStats.hitRate,
        blockedIPs: blockedIPs.length,
      },
    };

    return NextResponse.json(report, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'X-Response-Time': `${responseTime}ms`,
      },
    });
  } catch (error) {
    console.error('Observability API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to gather observability data',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
