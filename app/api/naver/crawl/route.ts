/**
 * Naver Price Crawl API
 * POST /api/naver/crawl - Trigger price crawling
 *
 * Protected by CRON_SECRET for Vercel Cron jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { crawlNaverPrices, crawlAllNaverPrices } from '@/lib/naver/crawler';
import { cacheNaverPrices, clearExpiredCache } from '@/lib/naver/cache';
import { DEFAULT_CRAWL_SCHEDULE } from '@/lib/naver/types';

// Verify cron secret for scheduled jobs
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) return true; // Allow if not configured (dev mode)
  return authHeader === `Bearer ${cronSecret}`;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication for scheduled jobs
    if (!verifyCronSecret(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { destination, checkIn, checkOut, crawlAll } = body;

    // Clear expired cache first
    const expiredCleared = clearExpiredCache();

    // Crawl all destinations (scheduled job)
    if (crawlAll) {
      const today = new Date();
      const results = [];

      for (const offset of DEFAULT_CRAWL_SCHEDULE.checkInOffsets) {
        const checkInDate = new Date(today);
        checkInDate.setDate(today.getDate() + offset);
        const checkOutDate = new Date(checkInDate);
        checkOutDate.setDate(checkInDate.getDate() + 1);

        const checkInStr = checkInDate.toISOString().split('T')[0];
        const checkOutStr = checkOutDate.toISOString().split('T')[0];

        const crawlResults = await crawlAllNaverPrices(checkInStr, checkOutStr);

        // Cache all crawled prices
        for (const result of crawlResults) {
          if (result.hotelsScraped > 0) {
            const prices = await crawlNaverPrices(result.destination, checkInStr, checkOutStr);
            cacheNaverPrices(prices);
          }
        }

        results.push({
          checkIn: checkInStr,
          checkOut: checkOutStr,
          crawlResults,
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Crawl completed for all destinations',
        expiredCleared,
        results,
      });
    }

    // Crawl specific destination
    if (destination && checkIn && checkOut) {
      const prices = await crawlNaverPrices(destination, checkIn, checkOut);
      const cached = cacheNaverPrices(prices);

      return NextResponse.json({
        success: true,
        destination,
        checkIn,
        checkOut,
        pricesCrawled: prices.length,
        pricesCached: cached.length,
        expiredCleared,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Missing required parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Naver crawl API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for Vercel Cron
export async function GET(request: NextRequest) {
  // Vercel Cron uses GET requests
  return POST(request);
}
