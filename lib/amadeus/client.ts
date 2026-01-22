/**
 * Amadeus API Client
 * https://developers.amadeus.com/
 *
 * 호텔 검색, 항공권 검색 등 여행 API 제공
 */

import Amadeus from 'amadeus';

// Lazy initialization to avoid build-time errors
let amadeusClient: Amadeus | null = null;

export function getAmadeusClient(): Amadeus {
  if (!amadeusClient) {
    const clientId = process.env.AMADEUS_CLIENT_ID;
    const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Amadeus API credentials not configured');
    }

    amadeusClient = new Amadeus({
      clientId,
      clientSecret,
      // 'test' for sandbox, 'production' for live
      hostname: process.env.AMADEUS_HOSTNAME || 'test',
    });
  }

  return amadeusClient;
}

// Hotel city codes for major destinations
export const CITY_CODES: Record<string, string> = {
  'tokyo': 'TYO',
  'osaka': 'OSA',
  'kyoto': 'UKY',
  'seoul': 'SEL',
  'bangkok': 'BKK',
  'singapore': 'SIN',
  'hong-kong': 'HKG',
  'taipei': 'TPE',
  'paris': 'PAR',
  'london': 'LON',
  'new-york': 'NYC',
  'los-angeles': 'LAX',
  'sydney': 'SYD',
  'dubai': 'DXB',
};

// Airport codes for flights (using main airports)
export const AIRPORT_CODES: Record<string, { code: string; name: string; city: string }> = {
  'ICN': { code: 'ICN', name: 'Incheon International', city: 'Seoul' },
  'GMP': { code: 'GMP', name: 'Gimpo International', city: 'Seoul' },
  'NRT': { code: 'NRT', name: 'Narita International', city: 'Tokyo' },
  'HND': { code: 'HND', name: 'Haneda International', city: 'Tokyo' },
  'KIX': { code: 'KIX', name: 'Kansai International', city: 'Osaka' },
  'BKK': { code: 'BKK', name: 'Suvarnabhumi', city: 'Bangkok' },
  'SIN': { code: 'SIN', name: 'Changi', city: 'Singapore' },
  'HKG': { code: 'HKG', name: 'Hong Kong International', city: 'Hong Kong' },
  'TPE': { code: 'TPE', name: 'Taoyuan International', city: 'Taipei' },
  'PVG': { code: 'PVG', name: 'Pudong International', city: 'Shanghai' },
  'PEK': { code: 'PEK', name: 'Beijing Capital', city: 'Beijing' },
  'LAX': { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles' },
  'JFK': { code: 'JFK', name: 'John F. Kennedy', city: 'New York' },
  'CDG': { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris' },
  'LHR': { code: 'LHR', name: 'Heathrow', city: 'London' },
  'SYD': { code: 'SYD', name: 'Sydney Kingsford Smith', city: 'Sydney' },
  'DXB': { code: 'DXB', name: 'Dubai International', city: 'Dubai' },
  'FUK': { code: 'FUK', name: 'Fukuoka', city: 'Fukuoka' },
  'CTS': { code: 'CTS', name: 'New Chitose', city: 'Sapporo' },
  'OKA': { code: 'OKA', name: 'Naha', city: 'Okinawa' },
};

// Get airport code from city name
export function getAirportCode(input: string): string {
  const normalized = input.toUpperCase();
  // If already an airport code
  if (AIRPORT_CODES[normalized]) {
    return normalized;
  }
  // Search by city name
  for (const [code, info] of Object.entries(AIRPORT_CODES)) {
    if (info.city.toUpperCase() === normalized) {
      return code;
    }
  }
  return normalized;
}

// Get city code from city name or return as-is if already a code
export function getCityCode(city: string): string {
  const normalized = city.toLowerCase().replace(/\s+/g, '-');
  return CITY_CODES[normalized] || city.toUpperCase();
}

// Type definitions for Amadeus responses
export interface HotelOffer {
  hotel: {
    hotelId: string;
    name: string;
    chainCode?: string;
    rating?: string;
    cityCode: string;
    latitude?: number;
    longitude?: number;
    address?: {
      lines?: string[];
      cityName?: string;
      countryCode?: string;
    };
    amenities?: string[];
    media?: Array<{
      uri: string;
      category: string;
    }>;
  };
  offers: Array<{
    id: string;
    checkInDate: string;
    checkOutDate: string;
    room: {
      type: string;
      description?: {
        text: string;
      };
    };
    price: {
      currency: string;
      total: string;
      base?: string;
    };
    policies?: {
      cancellation?: {
        description?: {
          text: string;
        };
      };
    };
  }>;
}

export interface HotelSearchParams {
  cityCode: string;
  checkInDate: string;  // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  adults?: number;
  roomQuantity?: number;
  priceRange?: string;  // e.g., "100-300"
  currency?: string;
  ratings?: string[];   // e.g., ["4", "5"]
  amenities?: string[];
}

export interface HotelListItem {
  hotelId: string;
  name: string;
  chainCode?: string;
  iataCode: string;
  dupeId: number;
  geoCode: {
    latitude: number;
    longitude: number;
  };
  address?: {
    countryCode: string;
  };
  distance?: {
    value: number;
    unit: string;
  };
}
