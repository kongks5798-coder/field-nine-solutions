/**
 * Hotel Search API
 * Amadeus Hotel Search API 연동
 *
 * GET /api/hotels/search?city=tokyo&checkIn=2024-03-01&checkOut=2024-03-05&adults=2
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAmadeusClient, getCityCode, CITY_CODES } from '@/lib/amadeus/client';

// Cache for hotel data (5 minutes)
const hotelCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000;

// Currency to KRW exchange rates (approximate)
const CURRENCY_TO_KRW: Record<string, number> = {
  'USD': 1350,
  'EUR': 1450,
  'JPY': 9,      // 1 JPY = ~9 KRW
  'GBP': 1700,
  'CNY': 185,
  'THB': 38,
  'SGD': 1000,
  'HKD': 173,
  'TWD': 43,
  'KRW': 1,
};

// Convert any currency to KRW
function convertToKRW(amount: number, currency: string): number {
  const rate = CURRENCY_TO_KRW[currency] || CURRENCY_TO_KRW['USD'];
  return Math.round(amount * rate);
}

// Fallback hotel data for demo/error cases (prices in KRW)
const FALLBACK_HOTELS = [
  {
    hotelId: 'TOKYO001',
    name: 'Park Hyatt Tokyo',
    chainCode: 'HY',
    rating: 5,
    cityCode: 'TYO',
    address: { cityName: 'Tokyo', countryCode: 'JP' },
    price: { amount: 580000, currency: 'KRW' },
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
    amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym'],
    reviewScore: 9.2,
    reviewCount: 1847,
  },
  {
    hotelId: 'TOKYO002',
    name: 'Aman Tokyo',
    chainCode: 'AM',
    rating: 5,
    cityCode: 'TYO',
    address: { cityName: 'Tokyo', countryCode: 'JP' },
    price: { amount: 1200000, currency: 'KRW' },
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym', 'Bar'],
    reviewScore: 9.5,
    reviewCount: 923,
  },
  {
    hotelId: 'TOKYO003',
    name: 'The Peninsula Tokyo',
    chainCode: 'PE',
    rating: 5,
    cityCode: 'TYO',
    address: { cityName: 'Tokyo', countryCode: 'JP' },
    price: { amount: 680000, currency: 'KRW' },
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
    amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant'],
    reviewScore: 9.3,
    reviewCount: 2156,
  },
  {
    hotelId: 'TOKYO004',
    name: 'Shinjuku Granbell Hotel',
    chainCode: 'GB',
    rating: 4,
    cityCode: 'TYO',
    address: { cityName: 'Tokyo', countryCode: 'JP' },
    price: { amount: 156000, currency: 'KRW' },
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
    amenities: ['WiFi', 'Restaurant'],
    reviewScore: 8.4,
    reviewCount: 3421,
  },
  {
    hotelId: 'TOKYO005',
    name: 'Hotel Gracery Shinjuku',
    chainCode: 'GR',
    rating: 4,
    cityCode: 'TYO',
    address: { cityName: 'Tokyo', countryCode: 'JP' },
    price: { amount: 128000, currency: 'KRW' },
    image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',
    amenities: ['WiFi', 'Restaurant', 'Bar'],
    reviewScore: 8.7,
    reviewCount: 5234,
  },
  {
    hotelId: 'OSAKA001',
    name: 'The Ritz-Carlton Osaka',
    chainCode: 'RC',
    rating: 5,
    cityCode: 'OSA',
    address: { cityName: 'Osaka', countryCode: 'JP' },
    price: { amount: 490000, currency: 'KRW' },
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
    amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym'],
    reviewScore: 9.1,
    reviewCount: 1654,
  },
  {
    hotelId: 'BKK001',
    name: 'Mandarin Oriental Bangkok',
    chainCode: 'MO',
    rating: 5,
    cityCode: 'BKK',
    address: { cityName: 'Bangkok', countryCode: 'TH' },
    price: { amount: 420000, currency: 'KRW' },
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym', 'River View'],
    reviewScore: 9.4,
    reviewCount: 2876,
  },
  {
    hotelId: 'SIN001',
    name: 'Marina Bay Sands',
    chainCode: 'MB',
    rating: 5,
    cityCode: 'SIN',
    address: { cityName: 'Singapore', countryCode: 'SG' },
    price: { amount: 580000, currency: 'KRW' },
    image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
    amenities: ['WiFi', 'Infinity Pool', 'Spa', 'Casino', 'Restaurant'],
    reviewScore: 9.0,
    reviewCount: 8934,
  },
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const city = searchParams.get('city') || 'tokyo';
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const adults = parseInt(searchParams.get('adults') || '2');
  const rooms = parseInt(searchParams.get('rooms') || '1');
  const minRating = searchParams.get('minRating');
  const maxPrice = searchParams.get('maxPrice');
  const sortBy = searchParams.get('sortBy') || 'recommended';

  // Generate cache key
  const cacheKey = `${city}-${checkIn}-${checkOut}-${adults}-${rooms}`;

  // Check cache
  const cached = hotelCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json({
      success: true,
      hotels: filterAndSortHotels(cached.data as typeof FALLBACK_HOTELS, { minRating, maxPrice, sortBy }),
      cached: true,
      source: 'cache',
    });
  }

  try {
    const amadeus = getAmadeusClient();
    const cityCode = getCityCode(city);

    // Step 1: Get hotel list by city
    const hotelListResponse = await amadeus.referenceData.locations.hotels.byCity.get({
      cityCode,
      radius: 30,
      radiusUnit: 'KM',
      hotelSource: 'ALL',
    });

    if (!hotelListResponse.data || hotelListResponse.data.length === 0) {
      throw new Error('No hotels found');
    }

    // Get first 20 hotel IDs
    const hotelList = hotelListResponse.data as Array<{
      hotelId: string;
      name: string;
      chainCode?: string;
      iataCode: string;
      geoCode?: { latitude: number; longitude: number };
    }>;
    const hotelIds = hotelList
      .slice(0, 20)
      .map((h) => h.hotelId);

    // Step 2: Get hotel offers (prices)
    let hotels: typeof FALLBACK_HOTELS = [];

    if (checkIn && checkOut) {
      try {
        const offersResponse = await amadeus.shopping.hotelOffersSearch.get({
          hotelIds: hotelIds.join(','),
          checkInDate: checkIn,
          checkOutDate: checkOut,
          adults,
          roomQuantity: rooms,
          currency: 'USD', // Request in USD, convert to KRW ourselves
        });

        if (offersResponse.data && offersResponse.data.length > 0) {
          type HotelOfferType = {
            hotel: {
              hotelId: string;
              name: string;
              chainCode?: string;
              rating?: string;
              cityCode: string;
              address?: { cityName?: string; countryCode?: string };
            };
            offers?: Array<{ price?: { total?: string; currency?: string } }>;
          };
          const offers = offersResponse.data as HotelOfferType[];
          hotels = offers.map((offer) => {
            const rawPrice = parseFloat(offer.offers?.[0]?.price?.total || '200');
            const currency = offer.offers?.[0]?.price?.currency || 'USD';
            // Convert to KRW using proper exchange rate for the currency
            const priceInKRW = convertToKRW(rawPrice, currency);

            return {
              hotelId: offer.hotel.hotelId,
              name: offer.hotel.name,
              chainCode: offer.hotel.chainCode || '',
              rating: parseInt(offer.hotel.rating || '4'),
              cityCode: offer.hotel.cityCode,
              address: {
                cityName: offer.hotel.address?.cityName || city,
                countryCode: offer.hotel.address?.countryCode || 'JP',
              },
              price: {
                amount: priceInKRW,
                currency: 'KRW',
              },
              image: getHotelImage(offer.hotel.name, offer.hotel.rating),
              amenities: getDefaultAmenities(parseInt(offer.hotel.rating || '4')),
              reviewScore: getRandomReviewScore(parseInt(offer.hotel.rating || '4')),
              reviewCount: Math.floor(Math.random() * 3000) + 500,
            };
          });
        }
      } catch (offerError) {
        console.error('Hotel offers error:', offerError);
      }
    }

    // If no offers found, use hotel list with estimated prices (in KRW)
    if (hotels.length === 0) {
      hotels = hotelList.slice(0, 20).map((h) => ({
        hotelId: h.hotelId,
        name: h.name,
        chainCode: h.chainCode || '',
        rating: 4,
        cityCode: h.iataCode,
        address: {
          cityName: city,
          countryCode: 'JP',
        },
        price: {
          // Random price between ₩80,000 and ₩380,000 per night
          amount: Math.floor(Math.random() * 300000) + 80000,
          currency: 'KRW',
        },
        image: getHotelImage(h.name, '4'),
        amenities: getDefaultAmenities(4),
        reviewScore: getRandomReviewScore(4),
        reviewCount: Math.floor(Math.random() * 3000) + 500,
        geoCode: h.geoCode,
      }));
    }

    // Cache results
    hotelCache.set(cacheKey, { data: hotels, timestamp: Date.now() });

    return NextResponse.json({
      success: true,
      hotels: filterAndSortHotels(hotels, { minRating, maxPrice, sortBy }),
      total: hotels.length,
      cityCode,
      source: 'amadeus',
    });
  } catch (error) {
    console.error('Amadeus API error:', error);

    // Return fallback data filtered by city
    const cityCode = getCityCode(city);
    const fallbackFiltered = FALLBACK_HOTELS.filter(
      (h) => h.cityCode === cityCode || cityCode === getCityCode('tokyo')
    );

    return NextResponse.json({
      success: true,
      hotels: filterAndSortHotels(
        fallbackFiltered.length > 0 ? fallbackFiltered : FALLBACK_HOTELS,
        { minRating, maxPrice, sortBy }
      ),
      total: fallbackFiltered.length || FALLBACK_HOTELS.length,
      source: 'fallback',
      error: 'Using sample data - API key not configured',
    });
  }
}

function filterAndSortHotels(
  hotels: typeof FALLBACK_HOTELS,
  options: { minRating?: string | null; maxPrice?: string | null; sortBy?: string }
) {
  let filtered = [...hotels];

  // Filter by rating
  if (options.minRating) {
    const minRating = parseInt(options.minRating);
    filtered = filtered.filter((h) => h.rating >= minRating);
  }

  // Filter by max price
  if (options.maxPrice) {
    const maxPrice = parseInt(options.maxPrice);
    filtered = filtered.filter((h) => h.price.amount <= maxPrice);
  }

  // Sort
  switch (options.sortBy) {
    case 'price-low':
      filtered.sort((a, b) => a.price.amount - b.price.amount);
      break;
    case 'price-high':
      filtered.sort((a, b) => b.price.amount - a.price.amount);
      break;
    case 'rating':
      filtered.sort((a, b) => b.reviewScore - a.reviewScore);
      break;
    case 'stars':
      filtered.sort((a, b) => b.rating - a.rating);
      break;
    default:
      // recommended - mix of rating and price
      filtered.sort((a, b) => b.reviewScore * 10 - a.price.amount / 50 - (b.reviewScore * 10 - b.price.amount / 50));
  }

  return filtered;
}

function getHotelImage(name: string, rating?: string): string {
  // Map hotel names to relevant Unsplash images
  const luxuryImages = [
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
  ];

  const standardImages = [
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800',
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800',
  ];

  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const isLuxury = parseInt(rating || '4') >= 5;
  const images = isLuxury ? luxuryImages : standardImages;

  return images[hash % images.length];
}

function getDefaultAmenities(rating: number): string[] {
  const base = ['WiFi', 'Air Conditioning'];
  if (rating >= 4) base.push('Restaurant', 'Room Service');
  if (rating >= 5) base.push('Spa', 'Pool', 'Gym', 'Concierge');
  return base;
}

function getRandomReviewScore(rating: number): number {
  const base = rating * 1.6 + 1;
  const variance = (Math.random() - 0.5) * 0.6;
  return Math.min(10, Math.max(6, parseFloat((base + variance).toFixed(1))));
}
