/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 59: COMPREHENSIVE HEALTH CHECK SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Deep health checks for all system dependencies:
 * - Database connectivity
 * - External APIs
 * - Cache systems
 * - Blockchain connections
 * - Background jobs
 */

import { logger } from '../observability';
import { circuitBreakerRegistry } from '../resilience';
import { cache } from '../cache';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthCheckResult {
  name: string;
  status: HealthStatus;
  latency?: number;
  message?: string;
  details?: Record<string, unknown>;
  checkedAt: Date;
}

export interface SystemHealthReport {
  status: HealthStatus;
  version: string;
  uptime: number;
  timestamp: Date;
  checks: HealthCheckResult[];
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
}

export interface HealthCheckConfig {
  name: string;
  check: () => Promise<HealthCheckResult>;
  timeout?: number;
  critical?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH CHECKER
// ═══════════════════════════════════════════════════════════════════════════════

class HealthChecker {
  private checks: Map<string, HealthCheckConfig> = new Map();
  private startTime: number = Date.now();
  private version: string;

  constructor() {
    this.version = process.env.npm_package_version || '1.0.0';
    this.registerDefaultChecks();
  }

  /**
   * Register a health check
   */
  register(config: HealthCheckConfig): void {
    this.checks.set(config.name, config);
    logger.info('Health check registered', { name: config.name });
  }

  /**
   * Unregister a health check
   */
  unregister(name: string): void {
    this.checks.delete(name);
  }

  /**
   * Run a single health check with timeout
   */
  private async runCheck(config: HealthCheckConfig): Promise<HealthCheckResult> {
    const timeout = config.timeout || 5000;
    const startTime = Date.now();

    try {
      const result = await Promise.race([
        config.check(),
        new Promise<HealthCheckResult>((_, reject) =>
          setTimeout(() => reject(new Error('Health check timed out')), timeout)
        ),
      ]);

      return {
        ...result,
        latency: Date.now() - startTime,
        checkedAt: new Date(),
      };
    } catch (error) {
      return {
        name: config.name,
        status: 'unhealthy',
        latency: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Unknown error',
        checkedAt: new Date(),
      };
    }
  }

  /**
   * Run all health checks
   */
  async checkAll(): Promise<SystemHealthReport> {
    const results: HealthCheckResult[] = [];
    let overallStatus: HealthStatus = 'healthy';

    // Run all checks in parallel
    const checkPromises = Array.from(this.checks.values()).map(async (config) => {
      const result = await this.runCheck(config);
      results.push(result);

      // Update overall status
      if (result.status === 'unhealthy') {
        if (config.critical) {
          overallStatus = 'unhealthy';
        } else if (overallStatus !== 'unhealthy') {
          overallStatus = 'degraded';
        }
      } else if (result.status === 'degraded' && overallStatus === 'healthy') {
        overallStatus = 'degraded';
      }
    });

    await Promise.all(checkPromises);

    const summary = {
      total: results.length,
      healthy: results.filter((r) => r.status === 'healthy').length,
      degraded: results.filter((r) => r.status === 'degraded').length,
      unhealthy: results.filter((r) => r.status === 'unhealthy').length,
    };

    return {
      status: overallStatus,
      version: this.version,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date(),
      checks: results,
      summary,
    };
  }

  /**
   * Run a specific health check
   */
  async check(name: string): Promise<HealthCheckResult | null> {
    const config = this.checks.get(name);
    if (!config) return null;
    return this.runCheck(config);
  }

  /**
   * Quick liveness check
   */
  async liveness(): Promise<{ status: 'ok' | 'error'; timestamp: Date }> {
    return {
      status: 'ok',
      timestamp: new Date(),
    };
  }

  /**
   * Register default health checks
   */
  private registerDefaultChecks(): void {
    // Memory check
    this.register({
      name: 'memory',
      check: async () => {
        const used = process.memoryUsage();
        const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
        const usagePercent = (used.heapUsed / used.heapTotal) * 100;

        let status: HealthStatus = 'healthy';
        if (usagePercent > 90) status = 'unhealthy';
        else if (usagePercent > 75) status = 'degraded';

        return {
          name: 'memory',
          status,
          message: `Heap: ${heapUsedMB}MB / ${heapTotalMB}MB (${usagePercent.toFixed(1)}%)`,
          details: {
            heapUsedMB,
            heapTotalMB,
            usagePercent: Math.round(usagePercent),
            rss: Math.round(used.rss / 1024 / 1024),
            external: Math.round(used.external / 1024 / 1024),
          },
          checkedAt: new Date(),
        };
      },
      critical: false,
    });

    // Circuit breakers check
    this.register({
      name: 'circuit-breakers',
      check: async () => {
        const stats = circuitBreakerRegistry.getAllStats();
        const breakerNames = Object.keys(stats);
        const openBreakers = breakerNames.filter((name) => stats[name].state === 'OPEN');

        let status: HealthStatus = 'healthy';
        if (openBreakers.length > 0) {
          status = openBreakers.length > breakerNames.length / 2 ? 'unhealthy' : 'degraded';
        }

        return {
          name: 'circuit-breakers',
          status,
          message: `${openBreakers.length}/${breakerNames.length} circuits open`,
          details: {
            total: breakerNames.length,
            open: openBreakers,
            stats,
          },
          checkedAt: new Date(),
        };
      },
      critical: false,
    });

    // Cache check
    this.register({
      name: 'cache',
      check: async () => {
        try {
          const testKey = '__health_check__';
          const testValue = Date.now().toString();

          await cache.set(testKey, testValue, { ttl: 10 });
          const retrieved = await cache.get<string>(testKey);
          await cache.delete(testKey);

          const cacheStats = cache.getStats();

          return {
            name: 'cache',
            status: retrieved === testValue ? 'healthy' : 'degraded',
            message: `Hit rate: ${(cacheStats.hitRate * 100).toFixed(1)}%`,
            details: cacheStats as unknown as Record<string, unknown>,
            checkedAt: new Date(),
          };
        } catch (error) {
          return {
            name: 'cache',
            status: 'degraded',
            message: error instanceof Error ? error.message : 'Cache check failed',
            checkedAt: new Date(),
          };
        }
      },
      critical: false,
    });

    // Environment check
    this.register({
      name: 'environment',
      check: async () => {
        const requiredEnvVars = [
          'NEXT_PUBLIC_SUPABASE_URL',
          'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        ];

        const missing = requiredEnvVars.filter((v) => !process.env[v]);

        return {
          name: 'environment',
          status: missing.length === 0 ? 'healthy' : 'degraded',
          message: missing.length === 0 ? 'All required env vars set' : `Missing: ${missing.join(', ')}`,
          details: {
            nodeEnv: process.env.NODE_ENV,
            missing,
          },
          checkedAt: new Date(),
        };
      },
      critical: true,
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEPENDENCY HEALTH CHECKS
// ═══════════════════════════════════════════════════════════════════════════════

export const DependencyChecks = {
  /**
   * Supabase database check
   */
  supabase: async (): Promise<HealthCheckResult> => {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!url) {
        return {
          name: 'supabase',
          status: 'unhealthy',
          message: 'Supabase URL not configured',
          checkedAt: new Date(),
        };
      }

      const startTime = Date.now();
      const response = await fetch(`${url}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
      });

      return {
        name: 'supabase',
        status: response.ok ? 'healthy' : 'unhealthy',
        latency: Date.now() - startTime,
        message: response.ok ? 'Connected' : `HTTP ${response.status}`,
        checkedAt: new Date(),
      };
    } catch (error) {
      return {
        name: 'supabase',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Connection failed',
        checkedAt: new Date(),
      };
    }
  },

  /**
   * Alchemy blockchain check
   */
  alchemy: async (): Promise<HealthCheckResult> => {
    try {
      const apiKey = process.env.ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
      if (!apiKey) {
        return {
          name: 'alchemy',
          status: 'degraded',
          message: 'Alchemy API key not configured',
          checkedAt: new Date(),
        };
      }

      const startTime = Date.now();
      const response = await fetch(`https://arb-mainnet.g.alchemy.com/v2/${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_blockNumber',
          params: [],
        }),
      });

      const data = await response.json();

      return {
        name: 'alchemy',
        status: data.result ? 'healthy' : 'unhealthy',
        latency: Date.now() - startTime,
        message: data.result ? `Block: ${parseInt(data.result, 16)}` : 'No block data',
        checkedAt: new Date(),
      };
    } catch (error) {
      return {
        name: 'alchemy',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Connection failed',
        checkedAt: new Date(),
      };
    }
  },

  /**
   * Stripe API check
   */
  stripe: async (): Promise<HealthCheckResult> => {
    try {
      const secretKey = process.env.STRIPE_SECRET_KEY;
      if (!secretKey) {
        return {
          name: 'stripe',
          status: 'degraded',
          message: 'Stripe secret key not configured',
          checkedAt: new Date(),
        };
      }

      const startTime = Date.now();
      const response = await fetch('https://api.stripe.com/v1/balance', {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      });

      return {
        name: 'stripe',
        status: response.ok ? 'healthy' : 'unhealthy',
        latency: Date.now() - startTime,
        message: response.ok ? 'Connected' : `HTTP ${response.status}`,
        checkedAt: new Date(),
      };
    } catch (error) {
      return {
        name: 'stripe',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Connection failed',
        checkedAt: new Date(),
      };
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON & EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const healthChecker = new HealthChecker();

// Register dependency checks
healthChecker.register({
  name: 'supabase',
  check: DependencyChecks.supabase,
  timeout: 5000,
  critical: true,
});

healthChecker.register({
  name: 'alchemy',
  check: DependencyChecks.alchemy,
  timeout: 10000,
  critical: false,
});

healthChecker.register({
  name: 'stripe',
  check: DependencyChecks.stripe,
  timeout: 5000,
  critical: false,
});

export default healthChecker;
