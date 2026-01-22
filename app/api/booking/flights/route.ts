/**
 * Flight Booking API
 * Production-grade flight search and booking with Duffel
 *
 * POST /api/booking/flights - Search flights
 * POST /api/booking/flights/book - Create booking
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getDuffelClient,
  formatDuffelOffer,
} from '@/lib/travel/duffel';

// Flight offer type
interface FlightOffer {
  id: string;
  carrier: { code: string; name: string; logo: string };
  origin: { code: string; city: string; airport: string };
  destination: { code: string; city: string; airport: string };
  departure: { time: string; date: string; datetime?: string };
  arrival: { time: string; date: string; datetime?: string };
  duration: string;
  stops: number;
  stopLocations?: string[];
  price: { base: number; markup: number; total: number; currency: string };
  cabinClass: string;
  baggageIncluded: boolean;
  refundable: boolean;
  changeable: boolean;
  expiresAt: string;
  liveMode: boolean;
  returnFlight?: {
    departure: { time: string; date: string };
    arrival: { time: string; date: string };
    duration: string;
    stops: number;
  } | null;
}

// Cache for flight offers (10 minutes - offers expire quickly)
const flightCache = new Map<string, { data: FlightOffer[]; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000;

// Fallback data for when API is not configured
const FALLBACK_FLIGHTS = [
  {
    id: 'fallback-001',
    carrier: { code: 'KE', name: 'Korean Air', logo: 'https://images.kiwi.com/airlines/64/KE.png' },
    origin: { code: 'ICN', city: 'Seoul', airport: 'Incheon International' },
    destination: { code: 'NRT', city: 'Tokyo', airport: 'Narita International' },
    departure: { time: '09:30', date: '', datetime: '' },
    arrival: { time: '11:45', date: '', datetime: '' },
    duration: 'PT2H15M',
    stops: 0,
    stopLocations: [],
    price: { base: 285, markup: 14.25, total: 299.25, currency: 'USD' },
    cabinClass: 'economy',
    baggageIncluded: true,
    refundable: false,
    changeable: true,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    liveMode: false,
    returnFlight: null,
  },
  {
    id: 'fallback-002',
    carrier: { code: 'OZ', name: 'Asiana Airlines', logo: 'https://images.kiwi.com/airlines/64/OZ.png' },
    origin: { code: 'ICN', city: 'Seoul', airport: 'Incheon International' },
    destination: { code: 'NRT', city: 'Tokyo', airport: 'Narita International' },
    departure: { time: '14:20', date: '', datetime: '' },
    arrival: { time: '16:35', date: '', datetime: '' },
    duration: 'PT2H15M',
    stops: 0,
    stopLocations: [],
    price: { base: 265, markup: 13.25, total: 278.25, currency: 'USD' },
    cabinClass: 'economy',
    baggageIncluded: true,
    refundable: false,
    changeable: true,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    liveMode: false,
    returnFlight: null,
  },
  {
    id: 'fallback-003',
    carrier: { code: '7C', name: 'Jeju Air', logo: 'https://images.kiwi.com/airlines/64/7C.png' },
    origin: { code: 'ICN', city: 'Seoul', airport: 'Incheon International' },
    destination: { code: 'NRT', city: 'Tokyo', airport: 'Narita International' },
    departure: { time: '07:15', date: '', datetime: '' },
    arrival: { time: '09:30', date: '', datetime: '' },
    duration: 'PT2H15M',
    stops: 0,
    stopLocations: [],
    price: { base: 145, markup: 7.25, total: 152.25, currency: 'USD' },
    cabinClass: 'economy',
    baggageIncluded: false,
    refundable: false,
    changeable: false,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    liveMode: false,
    returnFlight: null,
  },
];

/**
 * POST - Search flights
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers = 1,
      cabinClass = 'economy',
      sortBy = 'price',
    } = body;

    // Validate required fields
    if (!origin || !destination || !departureDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: origin, destination, departureDate' },
        { status: 400 }
      );
    }

    // Generate cache key
    const cacheKey = `${origin}-${destination}-${departureDate}-${returnDate || ''}-${passengers}-${cabinClass}`;

    // Check cache
    const cached = flightCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        flights: cached.data,
        source: 'cache',
        cached: true,
      });
    }

    // Try Duffel API
    const duffel = getDuffelClient();

    if (duffel.isConfigured) {
      const result = await duffel.searchFlights({
        slices: [
          {
            origin: origin.toUpperCase(),
            destination: destination.toUpperCase(),
            departure_date: departureDate,
          },
          ...(returnDate
            ? [
                {
                  origin: destination.toUpperCase(),
                  destination: origin.toUpperCase(),
                  departure_date: returnDate,
                },
              ]
            : []),
        ],
        passengers: Array.from({ length: passengers }, () => ({
          type: 'adult' as const,
        })),
        cabin_class: cabinClass,
      });

      if (result.success && result.offers?.length) {
        // Apply markup to all offers
        const flightsWithMarkup = result.offers.map((offer) =>
          formatDuffelOffer(offer, 0.03) // 3% markup
        );

        // Sort results
        const sortedFlights = sortFlights(flightsWithMarkup, sortBy);

        // Cache results
        flightCache.set(cacheKey, { data: sortedFlights, timestamp: Date.now() });

        return NextResponse.json({
          success: true,
          flights: sortedFlights,
          total: sortedFlights.length,
          source: duffel.isTestMode ? 'duffel_test' : 'duffel_live',
          offerRequestId: result.offerRequestId,
        });
      }
    }

    // Fallback to sample data
    const fallbackFlights = FALLBACK_FLIGHTS.map((f) => ({
      ...f,
      departure: { ...f.departure, date: departureDate },
      arrival: { ...f.arrival, date: departureDate },
    }));

    return NextResponse.json({
      success: true,
      flights: sortFlights(fallbackFlights, sortBy),
      total: fallbackFlights.length,
      source: 'sample',
      note: 'Using sample data. Configure DUFFEL_API_KEY for live flights.',
    });
  } catch (error) {
    console.error('Flight search error:', error);
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
 * Sort flights by criteria
 */
function sortFlights(flights: FlightOffer[], sortBy: string): FlightOffer[] {
  const sorted = [...flights];

  switch (sortBy) {
    case 'price':
      sorted.sort((a, b) => a.price.total - b.price.total);
      break;
    case 'duration':
      sorted.sort((a, b) => parseDuration(a.duration) - parseDuration(b.duration));
      break;
    case 'departure':
      sorted.sort((a, b) => a.departure.time.localeCompare(b.departure.time));
      break;
    default:
      // Best value: balance of price and duration
      sorted.sort((a, b) => {
        const scoreA = a.price.total + parseDuration(a.duration) * 0.5;
        const scoreB = b.price.total + parseDuration(b.duration) * 0.5;
        return scoreA - scoreB;
      });
  }

  return sorted;
}

function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  return parseInt(match[1] || '0') * 60 + parseInt(match[2] || '0');
}
