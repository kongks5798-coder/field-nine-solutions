/**
 * Hotel Booking API
 * Production-grade hotel search with multi-provider support
 *
 * POST /api/booking/hotels - Search hotels
 */

import { NextRequest, NextResponse } from 'next/server';
import { getHotelAggregator, HotelOffer } from '@/lib/travel/hotels';

// Cache for hotel results (15 minutes)
const hotelCache = new Map<string, { data: HotelOffer[]; timestamp: number }>();
const CACHE_DURATION = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      cityCode,
      checkIn,
      checkOut,
      adults = 2,
      rooms = 1,
      children = 0,
      childAges = [],
      currency = 'USD',
      minRating,
      maxPrice,
      amenities = [],
      sortBy = 'recommended',
    } = body;

    // Validate required fields
    if (!cityCode || !checkIn || !checkOut) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: cityCode, checkIn, checkOut' },
        { status: 400 }
      );
    }

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      return NextResponse.json(
        { success: false, error: 'Check-out must be after check-in' },
        { status: 400 }
      );
    }

    if (checkInDate < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Check-in cannot be in the past' },
        { status: 400 }
      );
    }

    // Generate cache key
    const cacheKey = `${cityCode}-${checkIn}-${checkOut}-${adults}-${rooms}-${currency}`;

    // Check cache
    const cached = hotelCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      const filtered = filterAndSortHotels(cached.data, {
        minRating,
        maxPrice,
        amenities,
        sortBy,
      });

      return NextResponse.json({
        success: true,
        hotels: filtered,
        total: filtered.length,
        source: 'cache',
        cached: true,
      });
    }

    // Search with aggregator
    const aggregator = getHotelAggregator();
    const result = await aggregator.search({
      cityCode,
      checkIn,
      checkOut,
      adults,
      rooms,
      children,
      childAges,
      currency,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Search failed' },
        { status: 500 }
      );
    }

    // Cache results
    hotelCache.set(cacheKey, { data: result.hotels, timestamp: Date.now() });

    // Apply filters and sorting
    const filtered = filterAndSortHotels(result.hotels, {
      minRating,
      maxPrice,
      amenities,
      sortBy,
    });

    return NextResponse.json({
      success: true,
      hotels: filtered,
      total: filtered.length,
      source: result.source,
      ...(result.error && { note: result.error }),
    });
  } catch (error) {
    console.error('Hotel search error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
      },
      { status: 500 }
    );
  }
}

/**
 * Filter and sort hotel results
 */
function filterAndSortHotels(
  hotels: HotelOffer[],
  options: {
    minRating?: number;
    maxPrice?: number;
    amenities?: string[];
    sortBy?: string;
  }
): HotelOffer[] {
  let filtered = [...hotels];

  // Filter by rating
  if (options.minRating) {
    filtered = filtered.filter((h) => h.rating >= options.minRating!);
  }

  // Filter by max price
  if (options.maxPrice) {
    filtered = filtered.filter((h) => h.price.final <= options.maxPrice!);
  }

  // Filter by amenities
  if (options.amenities?.length) {
    filtered = filtered.filter((h) =>
      options.amenities!.every((amenity) =>
        h.amenities.some((a) => a.toLowerCase().includes(amenity.toLowerCase()))
      )
    );
  }

  // Sort
  switch (options.sortBy) {
    case 'price-low':
      filtered.sort((a, b) => a.price.final - b.price.final);
      break;
    case 'price-high':
      filtered.sort((a, b) => b.price.final - a.price.final);
      break;
    case 'rating':
      filtered.sort((a, b) => b.reviewScore - a.reviewScore);
      break;
    case 'stars':
      filtered.sort((a, b) => b.rating - a.rating);
      break;
    default:
      // Recommended: balance of rating and price
      filtered.sort((a, b) => {
        const scoreA = a.reviewScore * 10 - a.price.perNight / 20;
        const scoreB = b.reviewScore * 10 - b.price.perNight / 20;
        return scoreB - scoreA;
      });
  }

  return filtered;
}
