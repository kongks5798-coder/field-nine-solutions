/**
 * Flight Search API
 * Amadeus Flight Offers Search API 연동
 *
 * GET /api/flights/search?origin=ICN&destination=NRT&departureDate=2024-03-01&returnDate=2024-03-05&adults=1
 *
 * Security:
 * - Rate Limit: 5 requests per minute per IP
 * - Cache: 10 minutes to reduce API costs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAmadeusClient, getAirportCode, AIRPORT_CODES } from '@/lib/amadeus/client';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/api-guard';

// Flight type definition
interface FlightData {
  id: string;
  carrier: { code: string; name: string; logo?: string | null };
  origin: { code: string; city: string; airport: string };
  destination: { code: string; city: string; airport: string };
  departure: { time: string; date: string };
  arrival: { time: string; date: string };
  duration: string;
  stops: number;
  stopLocations?: string[];
  price: { amount: number; currency: string };
  class: string;
  seatsLeft?: number | null;
  returnFlight?: {
    departure: { time: string; date: string };
    arrival: { time: string; date: string };
    duration: string;
    stops: number;
  } | null;
}

// Cache for flight data (10 minutes to reduce API costs)
const flightCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000;

// Rate limit config: 5 requests per minute per IP
const RATE_LIMIT_CONFIG = { maxRequests: 5, windowMs: 60000 };

// Carrier logos (using simple CDN)
const CARRIER_LOGOS: Record<string, string> = {
  'KE': 'https://images.kiwi.com/airlines/64/KE.png',  // Korean Air
  'OZ': 'https://images.kiwi.com/airlines/64/OZ.png',  // Asiana
  'JL': 'https://images.kiwi.com/airlines/64/JL.png',  // Japan Airlines
  'NH': 'https://images.kiwi.com/airlines/64/NH.png',  // ANA
  'SQ': 'https://images.kiwi.com/airlines/64/SQ.png',  // Singapore Airlines
  'TG': 'https://images.kiwi.com/airlines/64/TG.png',  // Thai Airways
  'CX': 'https://images.kiwi.com/airlines/64/CX.png',  // Cathay Pacific
  'BR': 'https://images.kiwi.com/airlines/64/BR.png',  // EVA Air
  'CI': 'https://images.kiwi.com/airlines/64/CI.png',  // China Airlines
  'CA': 'https://images.kiwi.com/airlines/64/CA.png',  // Air China
  'MU': 'https://images.kiwi.com/airlines/64/MU.png',  // China Eastern
  'AA': 'https://images.kiwi.com/airlines/64/AA.png',  // American Airlines
  'UA': 'https://images.kiwi.com/airlines/64/UA.png',  // United
  'DL': 'https://images.kiwi.com/airlines/64/DL.png',  // Delta
  'AF': 'https://images.kiwi.com/airlines/64/AF.png',  // Air France
  'BA': 'https://images.kiwi.com/airlines/64/BA.png',  // British Airways
  'LH': 'https://images.kiwi.com/airlines/64/LH.png',  // Lufthansa
  'EK': 'https://images.kiwi.com/airlines/64/EK.png',  // Emirates
  'QF': 'https://images.kiwi.com/airlines/64/QF.png',  // Qantas
  '7C': 'https://images.kiwi.com/airlines/64/7C.png',  // Jeju Air
  'LJ': 'https://images.kiwi.com/airlines/64/LJ.png',  // Jin Air
  'TW': 'https://images.kiwi.com/airlines/64/TW.png',  // T'way
  'ZE': 'https://images.kiwi.com/airlines/64/ZE.png',  // Eastar Jet
  'RS': 'https://images.kiwi.com/airlines/64/RS.png',  // Air Seoul
  'BX': 'https://images.kiwi.com/airlines/64/BX.png',  // Air Busan
  'MM': 'https://images.kiwi.com/airlines/64/MM.png',  // Peach
  'GK': 'https://images.kiwi.com/airlines/64/GK.png',  // Jetstar Japan
};

// Fallback flight data for demo/error cases
const FALLBACK_FLIGHTS = [
  {
    id: 'FL001',
    carrier: { code: 'KE', name: 'Korean Air' },
    origin: { code: 'ICN', city: 'Seoul', airport: 'Incheon' },
    destination: { code: 'NRT', city: 'Tokyo', airport: 'Narita' },
    departure: { time: '09:30', date: '' },
    arrival: { time: '11:45', date: '' },
    duration: 'PT2H15M',
    stops: 0,
    price: { amount: 285000, currency: 'KRW' },
    class: 'ECONOMY',
    seatsLeft: 8,
  },
  {
    id: 'FL002',
    carrier: { code: 'OZ', name: 'Asiana Airlines' },
    origin: { code: 'ICN', city: 'Seoul', airport: 'Incheon' },
    destination: { code: 'NRT', city: 'Tokyo', airport: 'Narita' },
    departure: { time: '14:20', date: '' },
    arrival: { time: '16:35', date: '' },
    duration: 'PT2H15M',
    stops: 0,
    price: { amount: 259000, currency: 'KRW' },
    class: 'ECONOMY',
    seatsLeft: 12,
  },
  {
    id: 'FL003',
    carrier: { code: 'JL', name: 'Japan Airlines' },
    origin: { code: 'ICN', city: 'Seoul', airport: 'Incheon' },
    destination: { code: 'HND', city: 'Tokyo', airport: 'Haneda' },
    departure: { time: '10:00', date: '' },
    arrival: { time: '12:10', date: '' },
    duration: 'PT2H10M',
    stops: 0,
    price: { amount: 315000, currency: 'KRW' },
    class: 'ECONOMY',
    seatsLeft: 5,
  },
  {
    id: 'FL004',
    carrier: { code: '7C', name: 'Jeju Air' },
    origin: { code: 'ICN', city: 'Seoul', airport: 'Incheon' },
    destination: { code: 'NRT', city: 'Tokyo', airport: 'Narita' },
    departure: { time: '07:15', date: '' },
    arrival: { time: '09:30', date: '' },
    duration: 'PT2H15M',
    stops: 0,
    price: { amount: 145000, currency: 'KRW' },
    class: 'ECONOMY',
    seatsLeft: 23,
  },
  {
    id: 'FL005',
    carrier: { code: 'TW', name: "T'way Air" },
    origin: { code: 'ICN', city: 'Seoul', airport: 'Incheon' },
    destination: { code: 'KIX', city: 'Osaka', airport: 'Kansai' },
    departure: { time: '08:30', date: '' },
    arrival: { time: '10:20', date: '' },
    duration: 'PT1H50M',
    stops: 0,
    price: { amount: 125000, currency: 'KRW' },
    class: 'ECONOMY',
    seatsLeft: 18,
  },
  {
    id: 'FL006',
    carrier: { code: 'SQ', name: 'Singapore Airlines' },
    origin: { code: 'ICN', city: 'Seoul', airport: 'Incheon' },
    destination: { code: 'SIN', city: 'Singapore', airport: 'Changi' },
    departure: { time: '09:45', date: '' },
    arrival: { time: '15:20', date: '' },
    duration: 'PT6H35M',
    stops: 0,
    price: { amount: 450000, currency: 'KRW' },
    class: 'ECONOMY',
    seatsLeft: 15,
  },
  {
    id: 'FL007',
    carrier: { code: 'TG', name: 'Thai Airways' },
    origin: { code: 'ICN', city: 'Seoul', airport: 'Incheon' },
    destination: { code: 'BKK', city: 'Bangkok', airport: 'Suvarnabhumi' },
    departure: { time: '11:30', date: '' },
    arrival: { time: '15:10', date: '' },
    duration: 'PT5H40M',
    stops: 0,
    price: { amount: 380000, currency: 'KRW' },
    class: 'ECONOMY',
    seatsLeft: 9,
  },
  {
    id: 'FL008',
    carrier: { code: 'CX', name: 'Cathay Pacific' },
    origin: { code: 'ICN', city: 'Seoul', airport: 'Incheon' },
    destination: { code: 'HKG', city: 'Hong Kong', airport: 'Hong Kong Intl' },
    departure: { time: '13:00', date: '' },
    arrival: { time: '15:45', date: '' },
    duration: 'PT3H45M',
    stops: 0,
    price: { amount: 290000, currency: 'KRW' },
    class: 'ECONOMY',
    seatsLeft: 7,
  },
];

export async function GET(request: NextRequest) {
  // Rate limiting: 5 requests per minute per IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'unknown';
  const rateLimitKey = `flights:${ip}`;
  const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIG);

  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult.resetIn);
  }

  const searchParams = request.nextUrl.searchParams;

  const origin = getAirportCode(searchParams.get('origin') || 'ICN');
  const destination = getAirportCode(searchParams.get('destination') || 'NRT');
  const departureDate = searchParams.get('departureDate');
  const returnDate = searchParams.get('returnDate');
  const adults = parseInt(searchParams.get('adults') || '1');
  const travelClass = searchParams.get('travelClass') || 'ECONOMY';
  const nonStop = searchParams.get('nonStop') === 'true';
  const sortBy = searchParams.get('sortBy') || 'price';

  // Validate dates
  if (!departureDate) {
    return NextResponse.json({
      success: false,
      error: 'Departure date is required',
    }, { status: 400 });
  }

  // Generate cache key
  const cacheKey = `${origin}-${destination}-${departureDate}-${returnDate || ''}-${adults}-${travelClass}`;

  // Check cache
  const cached = flightCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json({
      success: true,
      flights: sortFlights(cached.data as typeof FALLBACK_FLIGHTS, sortBy),
      cached: true,
      source: 'cache',
    });
  }

  try {
    const amadeus = getAmadeusClient();

    // Search flight offers
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate,
      ...(returnDate && { returnDate }),
      adults,
      travelClass: travelClass as 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST',
      nonStop,
      currencyCode: 'KRW',
      max: 30,
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No flights found');
    }

    type FlightOfferType = {
      id: string;
      itineraries: Array<{
        duration: string;
        segments: Array<{
          departure: { iataCode: string; at: string };
          arrival: { iataCode: string; at: string };
          carrierCode: string;
          number: string;
          aircraft?: { code: string };
          operating?: { carrierCode: string };
        }>;
      }>;
      price: {
        currency: string;
        total: string;
        base?: string;
        grandTotal?: string;
      };
      travelerPricings?: Array<{
        travelerId: string;
        fareOption: string;
        travelerType: string;
        price: { currency: string; total: string };
        fareDetailsBySegment: Array<{
          cabin: string;
          class: string;
          brandedFare?: string;
        }>;
      }>;
      numberOfBookableSeats?: number;
    };

    const offers = response.data as FlightOfferType[];
    const carriers = response.dictionaries?.carriers || {};

    const flights = offers.map((offer) => {
      const outbound = offer.itineraries[0];
      const firstSegment = outbound.segments[0];
      const lastSegment = outbound.segments[outbound.segments.length - 1];
      const carrierCode = firstSegment.carrierCode;

      return {
        id: offer.id,
        carrier: {
          code: carrierCode,
          name: carriers[carrierCode] || carrierCode,
          logo: CARRIER_LOGOS[carrierCode] || null,
        },
        origin: {
          code: firstSegment.departure.iataCode,
          city: AIRPORT_CODES[firstSegment.departure.iataCode]?.city || firstSegment.departure.iataCode,
          airport: AIRPORT_CODES[firstSegment.departure.iataCode]?.name || firstSegment.departure.iataCode,
        },
        destination: {
          code: lastSegment.arrival.iataCode,
          city: AIRPORT_CODES[lastSegment.arrival.iataCode]?.city || lastSegment.arrival.iataCode,
          airport: AIRPORT_CODES[lastSegment.arrival.iataCode]?.name || lastSegment.arrival.iataCode,
        },
        departure: {
          time: firstSegment.departure.at.split('T')[1]?.substring(0, 5) || '',
          date: firstSegment.departure.at.split('T')[0] || '',
        },
        arrival: {
          time: lastSegment.arrival.at.split('T')[1]?.substring(0, 5) || '',
          date: lastSegment.arrival.at.split('T')[0] || '',
        },
        duration: outbound.duration,
        stops: outbound.segments.length - 1,
        stopLocations: outbound.segments.length > 1
          ? outbound.segments.slice(0, -1).map(s => s.arrival.iataCode)
          : [],
        price: {
          amount: parseFloat(offer.price.total),
          currency: offer.price.currency,
        },
        class: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || travelClass,
        seatsLeft: offer.numberOfBookableSeats || null,
        returnFlight: offer.itineraries.length > 1 ? {
          departure: {
            time: offer.itineraries[1].segments[0].departure.at.split('T')[1]?.substring(0, 5) || '',
            date: offer.itineraries[1].segments[0].departure.at.split('T')[0] || '',
          },
          arrival: {
            time: offer.itineraries[1].segments[offer.itineraries[1].segments.length - 1].arrival.at.split('T')[1]?.substring(0, 5) || '',
            date: offer.itineraries[1].segments[offer.itineraries[1].segments.length - 1].arrival.at.split('T')[0] || '',
          },
          duration: offer.itineraries[1].duration,
          stops: offer.itineraries[1].segments.length - 1,
        } : null,
      };
    });

    // Cache results
    flightCache.set(cacheKey, { data: flights, timestamp: Date.now() });

    return NextResponse.json({
      success: true,
      flights: sortFlights(flights, sortBy),
      total: flights.length,
      source: 'amadeus',
      route: { origin, destination },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : (typeof error === 'object' ? JSON.stringify(error) : String(error));
    console.error('Amadeus Flight API error:', errorMessage);

    // Return fallback data filtered by route
    const fallbackFiltered = FALLBACK_FLIGHTS.filter(
      (f) =>
        (f.origin.code === origin || origin === 'ICN') &&
        (f.destination.code === destination || destination === 'NRT')
    ).map((f) => ({
      ...f,
      departure: { ...f.departure, date: departureDate },
      arrival: { ...f.arrival, date: departureDate },
      carrier: {
        ...f.carrier,
        logo: CARRIER_LOGOS[f.carrier.code] || null,
      },
    }));

    return NextResponse.json({
      success: true,
      flights: sortFlights(
        fallbackFiltered.length > 0 ? fallbackFiltered : FALLBACK_FLIGHTS.map(f => ({
          ...f,
          departure: { ...f.departure, date: departureDate },
          arrival: { ...f.arrival, date: departureDate },
          carrier: { ...f.carrier, logo: CARRIER_LOGOS[f.carrier.code] || null },
        })),
        sortBy
      ),
      total: fallbackFiltered.length || FALLBACK_FLIGHTS.length,
      source: 'fallback',
      error: errorMessage,
    });
  }
}

function sortFlights(
  flights: FlightData[],
  sortBy: string
): FlightData[] {
  const sorted = [...flights];

  switch (sortBy) {
    case 'price':
      sorted.sort((a, b) => a.price.amount - b.price.amount);
      break;
    case 'duration':
      sorted.sort((a, b) => parseDuration(a.duration) - parseDuration(b.duration));
      break;
    case 'departure':
      sorted.sort((a, b) => a.departure.time.localeCompare(b.departure.time));
      break;
    case 'arrival':
      sorted.sort((a, b) => a.arrival.time.localeCompare(b.arrival.time));
      break;
    default:
      // Best (balance of price and duration)
      sorted.sort((a, b) => {
        const scoreA = a.price.amount + parseDuration(a.duration) * 0.5;
        const scoreB = b.price.amount + parseDuration(b.duration) * 0.5;
        return scoreA - scoreB;
      });
  }

  return sorted;
}

function parseDuration(duration: string): number {
  // Parse ISO 8601 duration (e.g., "PT2H15M")
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  return hours * 60 + minutes;
}
