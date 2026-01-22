/**
 * Stay22 API Types
 * Affiliate hotel booking integration
 */

// ============================================
// API Request Types
// ============================================

export interface Stay22SearchParams {
  latitude: number;
  longitude: number;
  checkIn: string;  // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  guests: number;
  rooms?: number;
  radius?: number;  // km
  currency?: string;
  language?: string;
}

export interface Stay22HotelDetailsParams {
  hotelId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms?: number;
}

// ============================================
// API Response Types
// ============================================

export interface Stay22Hotel {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  starRating: number;
  reviewScore: number;
  reviewCount: number;
  photos: string[];
  amenities: string[];
  description?: string;
}

export interface Stay22Rate {
  hotelId: string;
  roomType: string;
  roomName: string;
  netRate: number;       // B2B wholesale price
  currency: string;
  cancellationPolicy: 'free' | 'non_refundable' | 'partial';
  cancellationDeadline?: string;
  breakfastIncluded: boolean;
  maxOccupancy: number;
  affiliateLink: string;
}

export interface Stay22SearchResponse {
  success: boolean;
  hotels: Array<Stay22Hotel & {
    lowestRate: Stay22Rate;
    allRates: Stay22Rate[];
  }>;
  pagination: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export interface Stay22HotelDetailsResponse {
  success: boolean;
  hotel: Stay22Hotel;
  rates: Stay22Rate[];
}

// ============================================
// Internal Types
// ============================================

export interface Stay22Config {
  apiKey: string;
  affiliateId: string;
  baseUrl: string;
}

export interface CachedStay22Rate {
  hotelId: string;
  hotelName: string;
  netRateKrw: number;
  netRateUsd: number;
  affiliateLink: string;
  cachedAt: Date;
  expiresAt: Date;
}

// ============================================
// City Coordinates (for Stay22 geo-search)
// ============================================

export const CITY_COORDINATES: Record<string, { lat: number; lng: number; name: string; nameKo: string }> = {
  'TYO': { lat: 35.6762, lng: 139.6503, name: 'Tokyo', nameKo: '도쿄' },
  'OSA': { lat: 34.6937, lng: 135.5023, name: 'Osaka', nameKo: '오사카' },
  'FUK': { lat: 33.5904, lng: 130.4017, name: 'Fukuoka', nameKo: '후쿠오카' },
  'BKK': { lat: 13.7563, lng: 100.5018, name: 'Bangkok', nameKo: '방콕' },
  'SIN': { lat: 1.3521, lng: 103.8198, name: 'Singapore', nameKo: '싱가포르' },
  'HKG': { lat: 22.3193, lng: 114.1694, name: 'Hong Kong', nameKo: '홍콩' },
  'TPE': { lat: 25.0330, lng: 121.5654, name: 'Taipei', nameKo: '타이페이' },
  'SGN': { lat: 10.8231, lng: 106.6297, name: 'Ho Chi Minh', nameKo: '호치민' },
  'DPS': { lat: -8.3405, lng: 115.0920, name: 'Bali', nameKo: '발리' },
  'PAR': { lat: 48.8566, lng: 2.3522, name: 'Paris', nameKo: '파리' },
  'LON': { lat: 51.5074, lng: -0.1278, name: 'London', nameKo: '런던' },
  'NYC': { lat: 40.7128, lng: -74.0060, name: 'New York', nameKo: '뉴욕' },
};
