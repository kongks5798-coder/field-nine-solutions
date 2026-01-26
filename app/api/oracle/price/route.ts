/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 56: PRICE ORACLE API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * GET /api/oracle/price - Get all KAUS exchange rates
 * GET /api/oracle/price?currency=USD - Get specific currency rate
 * POST /api/oracle/price/refresh - Force refresh oracle (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { PriceOracle } from '@/lib/oracle/price-oracle';

export const runtime = 'nodejs';
export const revalidate = 60; // ISR: revalidate every 60 seconds

// Cache headers for CDN
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
};

/**
 * GET - Fetch KAUS exchange rates
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currency = searchParams.get('currency');
    const simple = searchParams.get('simple') === 'true';

    // Single currency lookup
    if (currency) {
      const rate = await PriceOracle.getRate(currency.toUpperCase());

      if (!rate) {
        return NextResponse.json(
          { success: false, error: `Unsupported currency: ${currency}` },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        ...rate,
      }, { headers: CACHE_HEADERS });
    }

    // Simple rates object (backward compatible)
    if (simple) {
      const rates = await PriceOracle.getSimpleRates();
      return NextResponse.json({
        success: true,
        rates,
        kausUsdPrice: PriceOracle.KAUS_BASE_USD,
        timestamp: new Date().toISOString(),
      }, { headers: CACHE_HEADERS });
    }

    // Full oracle response
    const oracle = await PriceOracle.getRates();

    return NextResponse.json({
      success: true,
      ...oracle,
    }, { headers: CACHE_HEADERS });

  } catch (error) {
    console.error('[Price Oracle API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch exchange rates',
        fallback: true,
        kausUsdPrice: PriceOracle.KAUS_BASE_USD,
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Convert KAUS to/from fiat
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency, direction } = body;

    if (!amount || !currency) {
      return NextResponse.json(
        { success: false, error: 'Missing amount or currency' },
        { status: 400 }
      );
    }

    if (direction === 'fiat_to_kaus') {
      const result = await PriceOracle.fiatToKaus(amount, currency.toUpperCase());
      return NextResponse.json({
        success: true,
        input: { amount, currency },
        output: {
          kausAmount: result.kausAmount,
          rate: result.rate,
        },
        isLive: result.isLive,
        timestamp: new Date().toISOString(),
      });
    }

    // Default: KAUS to fiat
    const result = await PriceOracle.kausToFiat(amount, currency.toUpperCase());
    return NextResponse.json({
      success: true,
      input: { kausAmount: amount },
      output: {
        fiatAmount: result.fiatAmount,
        currency: result.currency,
        rate: result.rate,
      },
      isLive: result.isLive,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Price Oracle API] Conversion error:', error);
    return NextResponse.json(
      { success: false, error: 'Conversion failed' },
      { status: 500 }
    );
  }
}

/**
 * HEAD - Health check
 */
export async function HEAD() {
  const isStale = PriceOracle.isStale();
  return new NextResponse(null, {
    status: isStale ? 503 : 200,
    headers: {
      'X-Oracle-Status': isStale ? 'stale' : 'healthy',
    },
  });
}
