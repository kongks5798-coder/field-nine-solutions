/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 56: PRODUCTION HEALTH ENDPOINT
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Comprehensive health checks for production monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// ============================================
// Types
// ============================================

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  message?: string;
  metadata?: Record<string, unknown>;
}

interface OverallHealth {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  checks: HealthCheckResult[];
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    down: number;
  };
}

// ============================================
// Health Check Functions
// ============================================

const startTime = Date.now();

async function checkSupabase(): Promise<HealthCheckResult> {
  const start = Date.now();

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      return {
        service: 'supabase',
        status: 'down',
        latencyMs: Date.now() - start,
        message: 'Credentials not configured',
      };
    }

    const supabase = createClient(url, key);
    const { error } = await supabase.from('profiles').select('user_id').limit(1);

    const latency = Date.now() - start;

    if (error) {
      return {
        service: 'supabase',
        status: 'degraded',
        latencyMs: latency,
        message: error.message,
      };
    }

    return {
      service: 'supabase',
      status: latency > 2000 ? 'degraded' : 'healthy',
      latencyMs: latency,
      message: latency > 2000 ? 'High latency detected' : undefined,
    };
  } catch (error) {
    return {
      service: 'supabase',
      status: 'down',
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

async function checkStripe(): Promise<HealthCheckResult> {
  const start = Date.now();

  try {
    const key = process.env.STRIPE_SECRET_KEY;

    if (!key) {
      return {
        service: 'stripe',
        status: 'down',
        latencyMs: Date.now() - start,
        message: 'API key not configured',
      };
    }

    // Simple balance check
    const response = await fetch('https://api.stripe.com/v1/balance', {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });

    const latency = Date.now() - start;

    if (!response.ok) {
      return {
        service: 'stripe',
        status: 'degraded',
        latencyMs: latency,
        message: `API returned ${response.status}`,
      };
    }

    return {
      service: 'stripe',
      status: latency > 3000 ? 'degraded' : 'healthy',
      latencyMs: latency,
    };
  } catch (error) {
    return {
      service: 'stripe',
      status: 'down',
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

async function checkOpenAI(): Promise<HealthCheckResult> {
  const start = Date.now();

  try {
    const key = process.env.OPENAI_API_KEY;

    if (!key) {
      return {
        service: 'openai',
        status: 'down',
        latencyMs: Date.now() - start,
        message: 'API key not configured',
      };
    }

    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });

    const latency = Date.now() - start;

    if (!response.ok) {
      return {
        service: 'openai',
        status: 'degraded',
        latencyMs: latency,
        message: `API returned ${response.status}`,
      };
    }

    return {
      service: 'openai',
      status: latency > 5000 ? 'degraded' : 'healthy',
      latencyMs: latency,
    };
  } catch (error) {
    return {
      service: 'openai',
      status: 'down',
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

async function checkMemory(): Promise<HealthCheckResult> {
  const start = Date.now();

  try {
    const used = process.memoryUsage();
    const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
    const usagePercent = (used.heapUsed / used.heapTotal) * 100;

    return {
      service: 'memory',
      status: usagePercent > 90 ? 'degraded' : 'healthy',
      latencyMs: Date.now() - start,
      message: usagePercent > 90 ? 'High memory usage' : undefined,
      metadata: {
        heapUsedMB,
        heapTotalMB,
        usagePercent: Math.round(usagePercent),
        rssMB: Math.round(used.rss / 1024 / 1024),
      },
    };
  } catch (error) {
    return {
      service: 'memory',
      status: 'down',
      latencyMs: Date.now() - start,
      message: 'Unable to read memory stats',
    };
  }
}

function checkEnvironment(): HealthCheckResult {
  const start = Date.now();

  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const optionalVars = [
    'STRIPE_SECRET_KEY',
    'OPENAI_API_KEY',
    'GOOGLE_CLIENT_ID',
  ];

  const missingRequired = requiredVars.filter(v => !process.env[v]);
  const missingOptional = optionalVars.filter(v => !process.env[v]);

  const status = missingRequired.length > 0 ? 'degraded' : 'healthy';

  return {
    service: 'environment',
    status,
    latencyMs: Date.now() - start,
    message: missingRequired.length > 0
      ? `Missing required: ${missingRequired.join(', ')}`
      : missingOptional.length > 0
        ? `Missing optional: ${missingOptional.join(', ')}`
        : undefined,
    metadata: {
      nodeVersion: process.version,
      platform: process.platform,
      requiredConfigured: requiredVars.length - missingRequired.length,
      requiredTotal: requiredVars.length,
      optionalConfigured: optionalVars.length - missingOptional.length,
      optionalTotal: optionalVars.length,
    },
  };
}

// ============================================
// Main Endpoint
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const detailed = searchParams.get('detailed') === 'true';
  const service = searchParams.get('service');

  try {
    // Run all checks in parallel
    const checks: HealthCheckResult[] = await Promise.all([
      checkSupabase(),
      checkStripe(),
      checkOpenAI(),
      checkMemory(),
      Promise.resolve(checkEnvironment()),
    ]);

    // Filter by specific service if requested
    const filteredChecks = service
      ? checks.filter(c => c.service === service)
      : checks;

    // Calculate summary
    const summary = {
      total: filteredChecks.length,
      healthy: filteredChecks.filter(c => c.status === 'healthy').length,
      degraded: filteredChecks.filter(c => c.status === 'degraded').length,
      down: filteredChecks.filter(c => c.status === 'down').length,
    };

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'down';
    if (summary.down > 0) {
      overallStatus = summary.down >= summary.total / 2 ? 'down' : 'degraded';
    } else if (summary.degraded > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    const response: OverallHealth = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.round((Date.now() - startTime) / 1000),
      checks: detailed ? filteredChecks : filteredChecks.map(c => ({
        service: c.service,
        status: c.status,
        latencyMs: c.latencyMs,
      })),
      summary,
    };

    // Return appropriate status code
    const httpStatus = overallStatus === 'down' ? 503 :
                       overallStatus === 'degraded' ? 200 : 200;

    return NextResponse.json(response, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[Health API] Error:', error);
    return NextResponse.json(
      {
        status: 'down',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 503 }
    );
  }
}

// HEAD request for simple uptime checks
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
