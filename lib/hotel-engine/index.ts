/**
 * K-UNIVERSAL Hotel Engine
 * Combines Stay22 + Naver Shadowing for premium hotel booking
 *
 * Flow:
 * 1. Search Stay22 for available hotels (B2B rates)
 * 2. Match with Naver cached/crawled prices
 * 3. Apply Naver Shadowing (final price = Naver price)
 * 4. Safety Protocol if margin < 0
 */

import { searchStay22Hotels } from '../stay22/client';
import { crawlNaverPrices, matchNaverPrice } from '../naver/crawler';
import { cacheNaverPrices, searchCachedPrice, createPriceAlert } from '../naver/cache';
import { NaverHotelPrice } from '../naver/types';

// ============================================
// Types
// ============================================

export interface HotelSearchResult {
  id: string;
  name: string;
  nameKo?: string;
  brand?: string;
  starRating: number;
  location: {
    city: string;
    cityKo: string;
    country: string;
    countryKo: string;
    latitude: number;
    longitude: number;
    district?: string;
  };
  images: {
    main: string;
    gallery: string[];
  };
  amenities: string[];
  pricing: {
    displayPrice: number;        // Final price shown to user (= Naver)
    naverPrice: number;          // Naver lowest price
    wholesalePrice: number;      // Stay22 B2B price
    margin: number;              // Profit margin
    marginPercent: number;
    currency: string;
    pricePerNight: number;
    isNaverMatched: boolean;
    naverProvider?: string;
    priceSource: 'naver_realtime' | 'naver_cache' | 'markup';
  };
  reviews: {
    score: number;
    count: number;
    sentiment: 'excellent' | 'very_good' | 'good' | 'fair';
  };
  features: {
    breakfastIncluded: boolean;
    freeCancellation: boolean;
    payAtProperty: boolean;
    instantConfirmation: boolean;
  };
  affiliateLink: string;
  isAvailable: boolean;
  unavailableReason?: string;
}

export interface HotelSearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
}

export interface HotelSearchResponse {
  success: boolean;
  hotels: HotelSearchResult[];
  meta: {
    destination: string;
    destinationKo: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    totalResults: number;
    availableResults: number;
    naverMatchedCount: number;
    lowestPrice: number;
    averagePrice: number;
    searchTime: number;
    cacheHitRate: number;
  };
  filters: {
    priceRange: { min: number; max: number };
    starRatings: number[];
    amenities: string[];
  };
}

// ============================================
// Constants
// ============================================

const USD_TO_KRW = 1350;
const FALLBACK_MARKUP = 0.05; // 5% when no Naver price

const DESTINATION_NAMES: Record<string, { ko: string; en: string }> = {
  'TYO': { ko: '도쿄', en: 'Tokyo' },
  'OSA': { ko: '오사카', en: 'Osaka' },
  'FUK': { ko: '후쿠오카', en: 'Fukuoka' },
  'BKK': { ko: '방콕', en: 'Bangkok' },
  'SIN': { ko: '싱가포르', en: 'Singapore' },
  'HKG': { ko: '홍콩', en: 'Hong Kong' },
  'TPE': { ko: '타이페이', en: 'Taipei' },
  'SGN': { ko: '호치민', en: 'Ho Chi Minh' },
  'DPS': { ko: '발리', en: 'Bali' },
  'PAR': { ko: '파리', en: 'Paris' },
  'LON': { ko: '런던', en: 'London' },
  'NYC': { ko: '뉴욕', en: 'New York' },
};

// ============================================
// Main Search Function
// ============================================

export async function searchHotels(params: HotelSearchParams): Promise<HotelSearchResponse> {
  const startTime = Date.now();
  const { destination, checkIn, checkOut, guests, rooms } = params;

  // Calculate nights
  const nights = Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
  );

  // 1. Fetch from Stay22 (B2B rates)
  const stay22Response = await searchStay22Hotels(destination, checkIn, checkOut, guests, rooms);

  if (!stay22Response.success || stay22Response.hotels.length === 0) {
    return createEmptyResponse(params, startTime);
  }

  // 2. Crawl/Fetch Naver prices
  const naverPrices = await crawlNaverPrices(destination, checkIn, checkOut);
  cacheNaverPrices(naverPrices);

  // 3. Process each hotel with Naver shadowing
  let naverMatchedCount = 0;
  let cacheHits = 0;

  const processedHotels: HotelSearchResult[] = await Promise.all(
    stay22Response.hotels.map(async (hotel) => {
      // Try to match with Naver price
      const naverMatch = matchNaverPrice(hotel.name, naverPrices);
      const cachedPrice = searchCachedPrice(hotel.name, destination, checkIn, checkOut);

      // Determine pricing
      const wholesalePriceKrw = Math.round(hotel.lowestRate.netRate * USD_TO_KRW);
      let displayPrice: number;
      let naverPrice: number;
      let isNaverMatched = false;
      let priceSource: HotelSearchResult['pricing']['priceSource'] = 'markup';
      let naverProvider: string | undefined;

      if (naverMatch) {
        // Real-time Naver match
        displayPrice = naverMatch.lowestPriceKrw;
        naverPrice = naverMatch.lowestPriceKrw;
        isNaverMatched = true;
        priceSource = 'naver_realtime';
        naverProvider = naverMatch.providerName;
        naverMatchedCount++;
      } else if (cachedPrice) {
        // Cached Naver price
        displayPrice = cachedPrice.lowestPriceKrw;
        naverPrice = cachedPrice.lowestPriceKrw;
        isNaverMatched = true;
        priceSource = 'naver_cache';
        cacheHits++;
        naverMatchedCount++;
      } else {
        // Fallback: Apply standard markup
        displayPrice = Math.round(wholesalePriceKrw * (1 + FALLBACK_MARKUP));
        naverPrice = displayPrice;
      }

      // Calculate margin
      const margin = displayPrice - wholesalePriceKrw;
      const marginPercent = (margin / wholesalePriceKrw) * 100;

      // Safety Protocol
      const isAvailable = margin >= 0;
      if (!isAvailable) {
        createPriceAlert(hotel.name, displayPrice, wholesalePriceKrw);
      }

      // Determine review sentiment
      const sentiment = getReviewSentiment(hotel.reviewScore);

      return {
        id: hotel.id,
        name: hotel.name,
        brand: getBrandFromName(hotel.name),
        starRating: hotel.starRating,
        location: {
          city: hotel.city,
          cityKo: DESTINATION_NAMES[destination]?.ko || hotel.city,
          country: hotel.country,
          countryKo: getCountryKo(hotel.country),
          latitude: hotel.latitude,
          longitude: hotel.longitude,
        },
        images: {
          main: hotel.photos[0] || getDefaultImage(hotel.starRating),
          gallery: hotel.photos,
        },
        amenities: hotel.amenities,
        pricing: {
          displayPrice,
          naverPrice,
          wholesalePrice: wholesalePriceKrw,
          margin,
          marginPercent: Math.round(marginPercent * 100) / 100,
          currency: 'KRW',
          pricePerNight: Math.round(displayPrice / nights),
          isNaverMatched,
          naverProvider,
          priceSource,
        },
        reviews: {
          score: Math.round(hotel.reviewScore * 10) / 10,
          count: hotel.reviewCount,
          sentiment,
        },
        features: {
          breakfastIncluded: hotel.lowestRate.breakfastIncluded,
          freeCancellation: hotel.lowestRate.cancellationPolicy === 'free',
          payAtProperty: false,
          instantConfirmation: true,
        },
        affiliateLink: hotel.lowestRate.affiliateLink,
        isAvailable,
        unavailableReason: isAvailable ? undefined : '본사 확인 중인 특가 상품입니다',
      };
    })
  );

  // Filter only available hotels for display
  const availableHotels = processedHotels.filter(h => h.isAvailable);

  // Calculate stats
  const prices = availableHotels.map(h => h.pricing.displayPrice);
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const averagePrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
  const priceRange = { min: lowestPrice, max: prices.length > 0 ? Math.max(...prices) : 0 };

  // Extract unique amenities and star ratings
  const allAmenities = [...new Set(availableHotels.flatMap(h => h.amenities))];
  const starRatings = [...new Set(availableHotels.map(h => h.starRating))].sort((a, b) => b - a);

  return {
    success: true,
    hotels: availableHotels,
    meta: {
      destination,
      destinationKo: DESTINATION_NAMES[destination]?.ko || destination,
      checkIn,
      checkOut,
      nights,
      totalResults: processedHotels.length,
      availableResults: availableHotels.length,
      naverMatchedCount,
      lowestPrice,
      averagePrice,
      searchTime: Date.now() - startTime,
      cacheHitRate: processedHotels.length > 0 ? (cacheHits / processedHotels.length) * 100 : 0,
    },
    filters: {
      priceRange,
      starRatings,
      amenities: allAmenities.slice(0, 10),
    },
  };
}

// ============================================
// Helper Functions
// ============================================

function createEmptyResponse(params: HotelSearchParams, startTime: number): HotelSearchResponse {
  const nights = Math.ceil(
    (new Date(params.checkOut).getTime() - new Date(params.checkIn).getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    success: true,
    hotels: [],
    meta: {
      destination: params.destination,
      destinationKo: DESTINATION_NAMES[params.destination]?.ko || params.destination,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      nights,
      totalResults: 0,
      availableResults: 0,
      naverMatchedCount: 0,
      lowestPrice: 0,
      averagePrice: 0,
      searchTime: Date.now() - startTime,
      cacheHitRate: 0,
    },
    filters: {
      priceRange: { min: 0, max: 0 },
      starRatings: [],
      amenities: [],
    },
  };
}

function getReviewSentiment(score: number): HotelSearchResult['reviews']['sentiment'] {
  if (score >= 9) return 'excellent';
  if (score >= 8) return 'very_good';
  if (score >= 7) return 'good';
  return 'fair';
}

function getBrandFromName(name: string): string | undefined {
  const brands = [
    'Hilton', 'Marriott', 'Hyatt', 'IHG', 'Accor', 'Wyndham',
    'Four Seasons', 'Ritz-Carlton', 'St. Regis', 'W Hotels',
    'Sheraton', 'Westin', 'Conrad', 'Waldorf', 'Mandarin Oriental',
    'Peninsula', 'Aman', 'Banyan Tree', 'Shangri-La', 'Fairmont',
  ];

  for (const brand of brands) {
    if (name.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }
  return undefined;
}

function getCountryKo(country: string): string {
  const countryMap: Record<string, string> = {
    'JP': '일본', 'Japan': '일본',
    'TH': '태국', 'Thailand': '태국',
    'SG': '싱가포르', 'Singapore': '싱가포르',
    'HK': '홍콩', 'Hong Kong': '홍콩',
    'TW': '대만', 'Taiwan': '대만',
    'VN': '베트남', 'Vietnam': '베트남',
    'ID': '인도네시아', 'Indonesia': '인도네시아',
    'FR': '프랑스', 'France': '프랑스',
    'GB': '영국', 'United Kingdom': '영국',
    'US': '미국', 'United States': '미국',
  };
  return countryMap[country] || country;
}

function getDefaultImage(starRating: number): string {
  if (starRating >= 5) {
    return 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80';
  }
  if (starRating >= 4) {
    return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80';
  }
  return 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80';
}

// ============================================
// Price Formatting Utilities
// ============================================

export function formatPrice(amount: number, options?: { compact?: boolean }): string {
  if (options?.compact && amount >= 10000) {
    return `₩${Math.round(amount / 10000)}만`;
  }
  return `₩${amount.toLocaleString('ko-KR')}`;
}

export function formatPriceRange(min: number, max: number): string {
  return `${formatPrice(min, { compact: true })} - ${formatPrice(max, { compact: true })}`;
}
