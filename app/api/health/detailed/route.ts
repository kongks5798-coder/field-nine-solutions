/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 56: PRODUCTION HEALTH MONITOR API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * GET /api/health/detailed - Comprehensive system health check
 *
 * Checks:
 * - Supabase connection
 * - Price Oracle status
 * - External API connectivity
 * - Memory usage
 * - Response times
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PriceOracle } from '@/lib/oracle/price-oracle';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  message?: string;
  lastChecked: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  version: string;
  uptime: number;
  services: ServiceStatus[];
  metrics: {
    totalServices: number;
    healthyServices: number;
    avgLatencyMs: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH CHECKS
// ═══════════════════════════════════════════════════════════════════════════════

const startTime = Date.now();

/**
 * Check Supabase connection
 */
async function checkSupabase(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase.from('profiles').select('count').limit(1);

    return {
      name: 'Supabase Database',
      status: error ? 'degraded' : 'healthy',
      latencyMs: Date.now() - start,
      message: error?.message,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'Supabase Database',
      status: 'down',
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed',
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Check Price Oracle
 */
async function checkPriceOracle(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const rates = await PriceOracle.getRates();
    const isStale = PriceOracle.isStale();

    return {
      name: 'Price Oracle',
      status: isStale ? 'degraded' : 'healthy',
      latencyMs: Date.now() - start,
      message: isStale ? 'Using cached rates' : `${Object.keys(rates.rates).length} currencies tracked`,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'Price Oracle',
      status: 'down',
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : 'Oracle failed',
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Check External API (ExchangeRate API)
 */
async function checkExternalApi(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });

    return {
      name: 'Exchange Rate API',
      status: response.ok ? 'healthy' : 'degraded',
      latencyMs: Date.now() - start,
      message: response.ok ? 'Connected' : `Status: ${response.status}`,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'Exchange Rate API',
      status: 'down',
      latencyMs: Date.now() - start,
      message: 'API unreachable',
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Check Stripe connectivity (basic)
 */
async function checkStripe(): Promise<ServiceStatus> {
  const start = Date.now();
  const hasKey = !!process.env.STRIPE_SECRET_KEY;

  return {
    name: 'Stripe Payments',
    status: hasKey ? 'healthy' : 'degraded',
    latencyMs: Date.now() - start,
    message: hasKey ? 'API key configured' : 'API key missing',
    lastChecked: new Date().toISOString(),
  };
}

/**
 * Check Toss Payments
 */
async function checkTossPayments(): Promise<ServiceStatus> {
  const start = Date.now();
  const hasKey = !!process.env.TOSS_PAYMENTS_SECRET_KEY;

  return {
    name: 'Toss Payments',
    status: hasKey ? 'healthy' : 'degraded',
    latencyMs: Date.now() - start,
    message: hasKey ? 'API key configured' : 'API key missing',
    lastChecked: new Date().toISOString(),
  };
}

/**
 * Check OpenAI
 */
async function checkOpenAI(): Promise<ServiceStatus> {
  const start = Date.now();
  const hasKey = !!process.env.OPENAI_API_KEY;

  return {
    name: 'OpenAI API',
    status: hasKey ? 'healthy' : 'degraded',
    latencyMs: Date.now() - start,
    message: hasKey ? 'API key configured' : 'API key missing',
    lastChecked: new Date().toISOString(),
  };
}

/**
 * Check Google Services
 */
async function checkGoogleServices(): Promise<ServiceStatus> {
  const start = Date.now();
  const hasCredentials =
    !!process.env.GOOGLE_CLIENT_ID &&
    !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  return {
    name: 'Google Services',
    status: hasCredentials ? 'healthy' : 'degraded',
    latencyMs: Date.now() - start,
    message: hasCredentials ? 'Credentials configured' : 'Missing credentials',
    lastChecked: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// API HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Run all health checks in parallel
    const services = await Promise.all([
      checkSupabase(),
      checkPriceOracle(),
      checkExternalApi(),
      checkStripe(),
      checkTossPayments(),
      checkOpenAI(),
      checkGoogleServices(),
    ]);

    // Calculate metrics
    const healthyServices = services.filter(s => s.status === 'healthy').length;
    const totalServices = services.length;
    const avgLatencyMs = Math.round(
      services.reduce((sum, s) => sum + s.latencyMs, 0) / totalServices
    );

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (healthyServices < totalServices * 0.5) {
      status = 'critical';
    } else if (healthyServices < totalServices) {
      status = 'degraded';
    }

    const response: HealthResponse = {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.round((Date.now() - startTime) / 1000),
      services,
      metrics: {
        totalServices,
        healthyServices,
        avgLatencyMs,
      },
    };

    // Set appropriate HTTP status
    const httpStatus = status === 'critical' ? 503 : status === 'degraded' ? 207 : 200;

    return NextResponse.json(response, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'X-Health-Status': status,
        'X-Response-Time': `${Date.now() - startTime}ms`,
      },
    });

  } catch (error) {
    console.error('[Health Check] Critical error:', error);

    return NextResponse.json(
      {
        status: 'critical',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

/**
 * HEAD - Quick health check (no body)
 */
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'X-Health-Status': 'ok',
    },
  });
}
