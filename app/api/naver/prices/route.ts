/**
 * Naver Cached Prices API
 * GET /api/naver/prices - Get cached Naver lowest prices
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCachedPricesForDestination, getCacheStats, searchCachedPrice } from '@/lib/naver/cache';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const destination = searchParams.get('destination');
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const hotelName = searchParams.get('hotelName');

    // Get cache stats
    if (searchParams.get('stats') === 'true') {
      const stats = getCacheStats();
      return NextResponse.json({
        success: true,
        stats,
      });
    }

    // Validate required params
    if (!destination || !checkIn || !checkOut) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: destination, checkIn, checkOut' },
        { status: 400 }
      );
    }

    // Search for specific hotel
    if (hotelName) {
      const price = searchCachedPrice(hotelName, destination, checkIn, checkOut);
      return NextResponse.json({
        success: true,
        price,
        found: !!price,
      });
    }

    // Get all cached prices for destination
    const prices = getCachedPricesForDestination(destination, checkIn, checkOut);

    return NextResponse.json({
      success: true,
      destination,
      checkIn,
      checkOut,
      count: prices.length,
      prices,
    });
  } catch (error) {
    console.error('Naver prices API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
