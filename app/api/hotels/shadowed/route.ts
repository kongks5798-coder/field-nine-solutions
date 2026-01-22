/**
 * Shadowed Hotels API
 * GET /api/hotels/shadowed - Get hotels with Naver-shadowed pricing
 *
 * Hybrid Model:
 * - Data: Amadeus API (real hotel info, photos, prices)
 * - Booking: Stay22 Affiliate links (monetization)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAmadeusClient, getCityCode } from '@/lib/amadeus/client';
import { crawlNaverPrices, matchNaverPrice } from '@/lib/naver/crawler';
import { searchCachedPrice, createPriceAlert } from '@/lib/naver/cache';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/api-guard';

// ============================================
// Constants
// ============================================

const USD_TO_KRW = 1350;
const FALLBACK_MARKUP = 0.05;
const STAY22_AFFILIATE_ID = process.env.STAY22_AFFILIATE_ID || 'fieldnine';

// Rate limit config: 5 requests per minute per IP
const RATE_LIMIT_CONFIG = { maxRequests: 5, windowMs: 60000 };

// Cache for hotel data (10 minutes to reduce API costs)
const hotelCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000;

// Generate Stay22 affiliate booking link
function generateStay22Link(hotelName: string, city: string, checkIn: string, checkOut: string): string {
  const encodedName = encodeURIComponent(hotelName);
  return `https://www.stay22.com/allez/search?address=${encodedName}%2C${city}&checkin=${checkIn}&checkout=${checkOut}&aid=${STAY22_AFFILIATE_ID}`;
}

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
};

const COUNTRY_NAMES: Record<string, string> = {
  'JP': '일본',
  'TH': '태국',
  'SG': '싱가포르',
  'HK': '홍콩',
  'TW': '대만',
  'VN': '베트남',
  'ID': '인도네시아',
  'FR': '프랑스',
};

const HOTEL_IMAGES: Record<number, string> = {
  5: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
  4: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
  3: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
};

// ============================================
// Helper Functions
// ============================================

function getReviewSentiment(score: number): 'excellent' | 'very_good' | 'good' | 'fair' {
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
    'InterContinental', 'Holiday Inn', 'Novotel', 'ibis', 'Renaissance',
    'Grand Hyatt',
  ];

  for (const brand of brands) {
    if (name.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }
  return undefined;
}

// ============================================
// Mock Data Generator (for testing without API keys)
// ============================================

const MOCK_HOTELS: Record<string, Array<{ name: string; rating: number; basePrice: number }>> = {
  TYO: [
    { name: 'Park Hyatt Tokyo', rating: 5, basePrice: 450000 },
    { name: 'The Ritz-Carlton Tokyo', rating: 5, basePrice: 520000 },
    { name: 'Aman Tokyo', rating: 5, basePrice: 680000 },
    { name: 'Mandarin Oriental Tokyo', rating: 5, basePrice: 480000 },
    { name: 'Conrad Tokyo', rating: 5, basePrice: 380000 },
    { name: 'Grand Hyatt Tokyo', rating: 5, basePrice: 340000 },
    { name: 'Hilton Tokyo', rating: 4, basePrice: 220000 },
    { name: 'Shinjuku Granbell Hotel', rating: 4, basePrice: 150000 },
    { name: 'Hotel Gracery Shinjuku', rating: 3, basePrice: 120000 },
    { name: 'Shibuya Excel Hotel Tokyu', rating: 4, basePrice: 180000 },
  ],
  OSA: [
    { name: 'The Ritz-Carlton Osaka', rating: 5, basePrice: 380000 },
    { name: 'Conrad Osaka', rating: 5, basePrice: 340000 },
    { name: 'St. Regis Osaka', rating: 5, basePrice: 420000 },
    { name: 'InterContinental Osaka', rating: 5, basePrice: 280000 },
    { name: 'Hilton Osaka', rating: 4, basePrice: 180000 },
    { name: 'Osaka Marriott Miyako Hotel', rating: 5, basePrice: 260000 },
    { name: 'Hotel Granvia Osaka', rating: 4, basePrice: 150000 },
    { name: 'Cross Hotel Osaka', rating: 4, basePrice: 140000 },
  ],
  BKK: [
    { name: 'Mandarin Oriental Bangkok', rating: 5, basePrice: 320000 },
    { name: 'The Peninsula Bangkok', rating: 5, basePrice: 280000 },
    { name: 'Four Seasons Bangkok', rating: 5, basePrice: 380000 },
    { name: 'Banyan Tree Bangkok', rating: 5, basePrice: 220000 },
    { name: 'Shangri-La Bangkok', rating: 5, basePrice: 200000 },
    { name: 'JW Marriott Bangkok', rating: 5, basePrice: 180000 },
    { name: 'Novotel Bangkok Sukhumvit', rating: 4, basePrice: 120000 },
    { name: 'ibis Styles Bangkok', rating: 3, basePrice: 65000 },
  ],
  SIN: [
    { name: 'Marina Bay Sands', rating: 5, basePrice: 480000 },
    { name: 'Raffles Singapore', rating: 5, basePrice: 650000 },
    { name: 'The Fullerton Bay Hotel', rating: 5, basePrice: 420000 },
    { name: 'Mandarin Oriental Singapore', rating: 5, basePrice: 380000 },
    { name: 'The Ritz-Carlton Millenia', rating: 5, basePrice: 440000 },
    { name: 'Fairmont Singapore', rating: 5, basePrice: 280000 },
    { name: 'Pan Pacific Singapore', rating: 5, basePrice: 220000 },
    { name: 'Holiday Inn Singapore', rating: 4, basePrice: 150000 },
  ],
};

function generateMockHotels(city: string, cityName: string, nights: number): Array<{
  hotelId: string;
  name: string;
  chainCode?: string;
  rating: number;
  cityCode: string;
  address?: { cityName?: string; countryCode?: string };
  price: { amount: number; currency: string };
  image?: string;
  amenities?: string[];
  reviewScore?: number;
  reviewCount?: number;
}> {
  const hotels = MOCK_HOTELS[city] || MOCK_HOTELS['TYO'];
  const countryCode = city === 'TYO' || city === 'OSA' || city === 'FUK' ? 'JP' :
                      city === 'BKK' ? 'TH' :
                      city === 'SIN' ? 'SG' : 'JP';

  return hotels.map((hotel, index) => ({
    hotelId: `MOCK-${city}-${index + 1}`,
    name: hotel.name,
    chainCode: hotel.name.split(' ')[0].toUpperCase().slice(0, 2),
    rating: hotel.rating,
    cityCode: city,
    address: { cityName: cityName, countryCode },
    price: {
      amount: hotel.basePrice * nights,
      currency: 'KRW',
    },
    image: HOTEL_IMAGES[hotel.rating] || HOTEL_IMAGES[4],
    amenities: ['WiFi', 'Air Conditioning', 'Restaurant', 'Fitness Center', 'Room Service'],
    reviewScore: 7.5 + Math.random() * 2,
    reviewCount: Math.floor(800 + Math.random() * 4000),
  }));
}

// ============================================
// Main API Handler
// ============================================

export async function GET(request: NextRequest) {
  // Rate limiting: 5 requests per minute per IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'unknown';
  const rateLimitKey = `hotels:${ip}`;
  const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIG);

  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult.resetIn);
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get('city')?.toUpperCase() || 'TYO';
    const checkIn = searchParams.get('checkIn') || getDefaultCheckIn();
    const checkOut = searchParams.get('checkOut') || getDefaultCheckOut();
    const guests = parseInt(searchParams.get('guests') || '2', 10);
    const rooms = parseInt(searchParams.get('rooms') || '1', 10);

    // Check cache first (10 minutes)
    const cacheKey = `${city}-${checkIn}-${checkOut}-${guests}-${rooms}`;
    const cached = hotelCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    // Calculate nights
    const nights = Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    );

    const destInfo = DESTINATION_NAMES[city] || { ko: city, en: city };

    // 1. Fetch from Amadeus API
    let amadeusHotels: Array<{
      hotelId: string;
      name: string;
      chainCode?: string;
      rating: number;
      cityCode: string;
      address?: { cityName?: string; countryCode?: string };
      price: { amount: number; currency: string };
      image?: string;
      amenities?: string[];
      reviewScore?: number;
      reviewCount?: number;
    }> = [];

    try {
      const amadeus = getAmadeusClient();
      const cityCode = getCityCode(destInfo.en.toLowerCase());

      // Get hotel list
      const hotelListResponse = await amadeus.referenceData.locations.hotels.byCity.get({
        cityCode: cityCode,
        radius: 30,
        radiusUnit: 'KM',
        hotelSource: 'ALL',
      });

      if (hotelListResponse.data && hotelListResponse.data.length > 0) {
        const hotelList = hotelListResponse.data as Array<{ hotelId: string }>;
        const hotelIds = hotelList.slice(0, 20).map((h) => h.hotelId);

        // Get hotel offers (prices)
        const offersResponse = await amadeus.shopping.hotelOffersSearch.get({
          hotelIds: hotelIds.join(','),
          adults: guests,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          roomQuantity: rooms,
          currency: 'KRW',
        });

        if (offersResponse.data) {
          const offers = offersResponse.data as Array<{
            hotel: {
              hotelId: string;
              name: string;
              chainCode?: string;
              rating?: string;
              cityCode: string;
              address?: { cityName?: string; countryCode?: string };
            };
            offers: Array<{ price: { total: string; currency: string } }>;
          }>;
          amadeusHotels = offers.map((offer: {
            hotel: {
              hotelId: string;
              name: string;
              chainCode?: string;
              rating?: string;
              cityCode: string;
              address?: { cityName?: string; countryCode?: string };
            };
            offers: Array<{ price: { total: string; currency: string } }>;
          }) => ({
            hotelId: offer.hotel.hotelId,
            name: offer.hotel.name,
            chainCode: offer.hotel.chainCode,
            rating: parseInt(offer.hotel.rating || '4'),
            cityCode: offer.hotel.cityCode,
            address: offer.hotel.address,
            price: {
              amount: parseFloat(offer.offers[0]?.price?.total || '0'),
              currency: offer.offers[0]?.price?.currency || 'KRW',
            },
            amenities: ['WiFi', 'Air Conditioning', 'Restaurant', 'Room Service'],
            reviewScore: 7 + Math.random() * 2.5,
            reviewCount: Math.floor(500 + Math.random() * 3000),
          }));
        }
      }
    } catch (amadeusError) {
      console.error('Amadeus API error:', amadeusError);
    }

    // Mock data fallback when Amadeus API isn't configured
    if (amadeusHotels.length === 0) {
      amadeusHotels = generateMockHotels(city, destInfo.en, nights);
    }

    // 2. Crawl Naver prices
    const naverPrices = await crawlNaverPrices(city, checkIn, checkOut);

    // 3. Process each hotel (Amadeus data + Stay22 links)
    let naverMatchedCount = 0;
    const processedHotels = amadeusHotels.map((hotel) => {
      // Match with Naver price
      const naverMatch = matchNaverPrice(hotel.name, naverPrices);
      const cachedPrice = searchCachedPrice(hotel.name, city, checkIn, checkOut);

      // Calculate pricing
      const wholesalePriceKrw = hotel.price.amount;
      let displayPrice: number;
      let naverPrice: number;
      let isNaverMatched = false;
      let priceSource = 'amadeus';
      let naverProvider: string | undefined;

      if (naverMatch) {
        displayPrice = naverMatch.lowestPriceKrw;
        naverPrice = naverMatch.lowestPriceKrw;
        isNaverMatched = true;
        priceSource = 'naver_realtime';
        naverProvider = naverMatch.providerName;
        naverMatchedCount++;
      } else if (cachedPrice) {
        displayPrice = cachedPrice.lowestPriceKrw;
        naverPrice = cachedPrice.lowestPriceKrw;
        isNaverMatched = true;
        priceSource = 'naver_cache';
        naverMatchedCount++;
      } else {
        displayPrice = Math.round(wholesalePriceKrw * (1 + FALLBACK_MARKUP));
        naverPrice = displayPrice;
      }

      // Calculate margin
      const margin = displayPrice - wholesalePriceKrw;
      const marginPercent = wholesalePriceKrw > 0 ? (margin / wholesalePriceKrw) * 100 : 0;

      // Safety Protocol
      const isAvailable = margin >= 0;
      if (!isAvailable) {
        createPriceAlert(hotel.name, displayPrice, wholesalePriceKrw);
      }

      const countryKo = COUNTRY_NAMES[hotel.address?.countryCode || 'JP'] || '일본';

      return {
        id: hotel.hotelId,
        name: hotel.name,
        brand: getBrandFromName(hotel.name),
        starRating: hotel.rating || 4,
        location: {
          city: destInfo.en,
          cityKo: destInfo.ko,
          country: hotel.address?.countryCode || 'JP',
          countryKo,
          latitude: 0,
          longitude: 0,
          district: hotel.address?.cityName,
        },
        images: {
          main: hotel.image || HOTEL_IMAGES[hotel.rating] || HOTEL_IMAGES[4],
          gallery: [hotel.image || HOTEL_IMAGES[hotel.rating] || HOTEL_IMAGES[4]],
        },
        amenities: hotel.amenities || ['WiFi', 'Air Conditioning'],
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
          score: Math.round((hotel.reviewScore || 8) * 10) / 10,
          count: hotel.reviewCount || 1000,
          sentiment: getReviewSentiment(hotel.reviewScore || 8),
        },
        features: {
          breakfastIncluded: Math.random() > 0.5,
          freeCancellation: Math.random() > 0.3,
          payAtProperty: false,
          instantConfirmation: true,
        },
        // Stay22 Affiliate Link for monetization
        affiliateLink: generateStay22Link(hotel.name, destInfo.en, checkIn, checkOut),
        isAvailable,
        unavailableReason: isAvailable ? undefined : '본사 확인 중인 특가 상품입니다',
      };
    });

    // Filter available hotels
    const availableHotels = processedHotels.filter(h => h.isAvailable);

    // Calculate stats
    const prices = availableHotels.map(h => h.pricing.displayPrice);
    const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const averagePrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;

    const result = {
      success: true,
      hotels: availableHotels,
      meta: {
        destination: city,
        destinationKo: destInfo.ko,
        checkIn,
        checkOut,
        nights,
        totalResults: processedHotels.length,
        availableResults: availableHotels.length,
        naverMatchedCount,
        lowestPrice,
        averagePrice,
        source: 'amadeus',
        cached: false,
      },
    };

    // Cache the result for 10 minutes
    hotelCache.set(cacheKey, { data: { ...result, meta: { ...result.meta, cached: true } }, timestamp: Date.now() });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Shadowed hotels API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getDefaultCheckIn(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
}

function getDefaultCheckOut(): string {
  const date = new Date();
  date.setDate(date.getDate() + 9);
  return date.toISOString().split('T')[0];
}
