/**
 * Hotel Aggregator Client
 * Supports multiple providers: EPS (Expedia), Booking.com Affiliate, Amadeus
 *
 * Current implementation: Amadeus (fallback to mock for demo)
 * Future: EPS integration when partnership is established
 */

import { getAmadeusClient, getCityCode, CITY_CODES } from '@/lib/amadeus/client';
import { calculateMarkup, formatPrice } from '@/lib/pricing/markup-engine';

// ============================================
// Types
// ============================================

export interface HotelSearchParams {
  cityCode: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  adults: number;
  rooms: number;
  children?: number;
  childAges?: number[];
  currency?: string;
  minRating?: number;
  maxPrice?: number;
  amenities?: string[];
}

export interface HotelOffer {
  hotelId: string;
  providerId: string;
  providerName: string;
  name: string;
  chainCode?: string;
  rating: number;
  reviewScore: number;
  reviewCount: number;
  address: {
    line1?: string;
    city: string;
    country: string;
    postalCode?: string;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  images: string[];
  amenities: string[];
  roomTypes: RoomType[];
  price: {
    wholesale: number;
    markup: number;
    final: number;
    perNight: number;
    currency: string;
    nights: number;
  };
  cancellation: {
    free: boolean;
    deadline?: string;
    penalty?: number;
  };
  paymentOptions: {
    payNow: boolean;
    payAtHotel: boolean;
  };
  bookingDeepLink?: string;
}

export interface RoomType {
  id: string;
  name: string;
  description: string;
  bedType: string;
  maxOccupancy: number;
  sqft?: number;
  amenities: string[];
  price: {
    wholesale: number;
    final: number;
    perNight: number;
    currency: string;
  };
  available: number;
  images: string[];
}

export interface HotelBookingParams {
  hotelId: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  guests: {
    adults: number;
    children?: number;
    childAges?: number[];
  };
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  paymentMethod: 'wallet' | 'card';
  specialRequests?: string;
}

export interface HotelBooking {
  bookingId: string;
  confirmationNumber: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  totalPrice: number;
  currency: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  cancellationPolicy: string;
}

// ============================================
// Hotel Image Database
// ============================================

const HOTEL_IMAGES: Record<string, string[]> = {
  luxury: [
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
  ],
  standard: [
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80',
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80',
  ],
};

function getHotelImages(rating: number): string[] {
  const category = rating >= 4 ? 'luxury' : 'standard';
  const images = HOTEL_IMAGES[category];
  // Shuffle and return 3-5 images
  return images.sort(() => Math.random() - 0.5).slice(0, 3 + Math.floor(Math.random() * 3));
}

// ============================================
// Provider Clients
// ============================================

class AmadeusHotelClient {
  async search(params: HotelSearchParams): Promise<{
    success: boolean;
    hotels?: HotelOffer[];
    error?: string;
  }> {
    try {
      const amadeus = getAmadeusClient();
      const cityCode = getCityCode(params.cityCode);
      const nights = calculateNights(params.checkIn, params.checkOut);

      // Get hotel list
      const listResponse = await amadeus.referenceData.locations.hotels.byCity.get({
        cityCode,
        radius: 30,
        radiusUnit: 'KM',
        hotelSource: 'ALL',
      });

      if (!listResponse.data?.length) {
        return { success: false, error: 'No hotels found' };
      }

      // Type the hotel list
      type HotelListItem = {
        hotelId: string;
        name: string;
        chainCode?: string;
        iataCode: string;
        geoCode?: { latitude: number; longitude: number };
      };

      const hotelList = listResponse.data as HotelListItem[];
      const hotelIds = hotelList.slice(0, 20).map((h) => h.hotelId);

      // Get offers if dates provided
      let offers: HotelOffer[] = [];

      if (params.checkIn && params.checkOut) {
        try {
          const offersResponse = await amadeus.shopping.hotelOffersSearch.get({
            hotelIds: hotelIds.join(','),
            checkInDate: params.checkIn,
            checkOutDate: params.checkOut,
            adults: params.adults,
            roomQuantity: params.rooms,
            currency: params.currency || 'USD',
          });

          if (offersResponse.data?.length) {
            type AmadeusOffer = {
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

            offers = (offersResponse.data as AmadeusOffer[]).map((offer) =>
              this.mapAmadeusOffer(offer, params, nights)
            );
          }
        } catch (e) {
          console.error('Amadeus offers error:', e);
        }
      }

      // Fallback to list if no offers
      if (offers.length === 0) {
        offers = hotelList.slice(0, 20).map((h) =>
          this.mapAmadeusList(h, params, nights)
        );
      }

      return { success: true, hotels: offers };
    } catch (error) {
      console.error('Amadeus hotel search error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
      };
    }
  }

  private mapAmadeusOffer(
    offer: {
      hotel: {
        hotelId: string;
        name: string;
        chainCode?: string;
        rating?: string;
        cityCode: string;
        address?: { cityName?: string; countryCode?: string };
      };
      offers?: Array<{ price?: { total?: string; currency?: string } }>;
    },
    params: HotelSearchParams,
    nights: number
  ): HotelOffer {
    const rating = parseInt(offer.hotel.rating || '4');
    const wholesalePrice = parseFloat(offer.offers?.[0]?.price?.total || '200');
    const pricing = calculateMarkup(wholesalePrice, 'hotels', {
      departureDate: new Date(params.checkIn),
      currency: params.currency || 'USD',
    });

    return {
      hotelId: offer.hotel.hotelId,
      providerId: 'amadeus',
      providerName: 'Amadeus',
      name: offer.hotel.name,
      chainCode: offer.hotel.chainCode,
      rating,
      reviewScore: this.generateReviewScore(rating),
      reviewCount: Math.floor(Math.random() * 3000) + 500,
      address: {
        city: offer.hotel.address?.cityName || params.cityCode,
        country: offer.hotel.address?.countryCode || 'Unknown',
      },
      images: getHotelImages(rating),
      amenities: this.getAmenities(rating),
      roomTypes: this.generateRoomTypes(wholesalePrice, params.currency || 'USD', nights),
      price: {
        wholesale: wholesalePrice,
        markup: pricing.markup,
        final: pricing.finalPrice,
        perNight: pricing.finalPrice / nights,
        currency: pricing.currency,
        nights,
      },
      cancellation: {
        free: rating >= 4,
        deadline: rating >= 4 ? this.getCancellationDeadline(params.checkIn) : undefined,
      },
      paymentOptions: {
        payNow: true,
        payAtHotel: rating >= 4,
      },
    };
  }

  private mapAmadeusList(
    hotel: {
      hotelId: string;
      name: string;
      chainCode?: string;
      iataCode: string;
      geoCode?: { latitude: number; longitude: number };
    },
    params: HotelSearchParams,
    nights: number
  ): HotelOffer {
    const rating = 4; // Default rating
    const basePrice = Math.floor(Math.random() * 200) + 80;
    const wholesalePrice = basePrice * nights;
    const pricing = calculateMarkup(wholesalePrice, 'hotels', {
      departureDate: new Date(params.checkIn),
      currency: params.currency || 'USD',
    });

    return {
      hotelId: hotel.hotelId,
      providerId: 'amadeus',
      providerName: 'Amadeus',
      name: hotel.name,
      chainCode: hotel.chainCode,
      rating,
      reviewScore: this.generateReviewScore(rating),
      reviewCount: Math.floor(Math.random() * 2000) + 300,
      address: {
        city: hotel.iataCode,
        country: 'Unknown',
      },
      coordinates: hotel.geoCode,
      images: getHotelImages(rating),
      amenities: this.getAmenities(rating),
      roomTypes: this.generateRoomTypes(wholesalePrice, params.currency || 'USD', nights),
      price: {
        wholesale: wholesalePrice,
        markup: pricing.markup,
        final: pricing.finalPrice,
        perNight: pricing.finalPrice / nights,
        currency: pricing.currency,
        nights,
      },
      cancellation: {
        free: true,
        deadline: this.getCancellationDeadline(params.checkIn),
      },
      paymentOptions: {
        payNow: true,
        payAtHotel: true,
      },
    };
  }

  private generateReviewScore(rating: number): number {
    const base = rating * 1.6 + 1;
    const variance = (Math.random() - 0.5) * 0.6;
    return Math.min(10, Math.max(6, parseFloat((base + variance).toFixed(1))));
  }

  private getAmenities(rating: number): string[] {
    const base = ['WiFi', 'Air Conditioning'];
    if (rating >= 4) base.push('Restaurant', 'Room Service', 'Fitness Center');
    if (rating >= 5) base.push('Spa', 'Pool', 'Concierge', 'Business Center');
    return base;
  }

  private getCancellationDeadline(checkIn: string): string {
    const date = new Date(checkIn);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  }

  private generateRoomTypes(
    totalPrice: number,
    currency: string,
    nights: number
  ): RoomType[] {
    const perNight = totalPrice / nights;
    return [
      {
        id: 'standard',
        name: 'Standard Room',
        description: 'Comfortable room with all essential amenities',
        bedType: 'King or Twin',
        maxOccupancy: 2,
        amenities: ['WiFi', 'TV', 'Mini Bar', 'Safe'],
        price: {
          wholesale: totalPrice,
          final: totalPrice * 1.05,
          perNight: perNight * 1.05,
          currency,
        },
        available: Math.floor(Math.random() * 10) + 1,
        images: [HOTEL_IMAGES.standard[0]],
      },
      {
        id: 'deluxe',
        name: 'Deluxe Room',
        description: 'Spacious room with city view',
        bedType: 'King',
        maxOccupancy: 2,
        sqft: 350,
        amenities: ['WiFi', 'TV', 'Mini Bar', 'Safe', 'City View', 'Bathtub'],
        price: {
          wholesale: totalPrice * 1.3,
          final: totalPrice * 1.3 * 1.05,
          perNight: perNight * 1.3 * 1.05,
          currency,
        },
        available: Math.floor(Math.random() * 5) + 1,
        images: [HOTEL_IMAGES.luxury[0]],
      },
    ];
  }
}

// ============================================
// Mock Provider (for demo/fallback)
// ============================================

const MOCK_HOTELS: Partial<HotelOffer>[] = [
  {
    hotelId: 'mock-001',
    name: 'Grand Hyatt Tokyo',
    rating: 5,
    reviewScore: 9.2,
    reviewCount: 2847,
    address: { city: 'Tokyo', country: 'Japan' },
    amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym', 'Concierge'],
  },
  {
    hotelId: 'mock-002',
    name: 'Shinjuku Prince Hotel',
    rating: 4,
    reviewScore: 8.5,
    reviewCount: 3421,
    address: { city: 'Tokyo', country: 'Japan' },
    amenities: ['WiFi', 'Restaurant', 'Bar', 'Business Center'],
  },
  {
    hotelId: 'mock-003',
    name: 'Mandarin Oriental Bangkok',
    rating: 5,
    reviewScore: 9.4,
    reviewCount: 1876,
    address: { city: 'Bangkok', country: 'Thailand' },
    amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'River View'],
  },
  {
    hotelId: 'mock-004',
    name: 'Marina Bay Sands',
    rating: 5,
    reviewScore: 9.0,
    reviewCount: 8934,
    address: { city: 'Singapore', country: 'Singapore' },
    amenities: ['WiFi', 'Infinity Pool', 'Casino', 'Spa', 'Restaurant'],
  },
];

function getMockHotels(params: HotelSearchParams): HotelOffer[] {
  const nights = calculateNights(params.checkIn, params.checkOut);

  return MOCK_HOTELS.map((hotel) => {
    const basePrice = (hotel.rating || 4) * 50 + Math.random() * 100;
    const wholesalePrice = basePrice * nights;
    const pricing = calculateMarkup(wholesalePrice, 'hotels', {
      departureDate: new Date(params.checkIn),
      currency: params.currency || 'USD',
    });

    return {
      ...hotel,
      providerId: 'mock',
      providerName: 'Demo',
      images: getHotelImages(hotel.rating || 4),
      roomTypes: [],
      price: {
        wholesale: wholesalePrice,
        markup: pricing.markup,
        final: pricing.finalPrice,
        perNight: pricing.finalPrice / nights,
        currency: pricing.currency,
        nights,
      },
      cancellation: { free: true },
      paymentOptions: { payNow: true, payAtHotel: false },
    } as HotelOffer;
  });
}

// ============================================
// Main Hotel Client
// ============================================

class HotelAggregator {
  private amadeusClient: AmadeusHotelClient;

  constructor() {
    this.amadeusClient = new AmadeusHotelClient();
  }

  async search(params: HotelSearchParams): Promise<{
    success: boolean;
    hotels: HotelOffer[];
    source: 'amadeus' | 'mock';
    error?: string;
  }> {
    // Try Amadeus first
    try {
      const result = await this.amadeusClient.search(params);
      if (result.success && result.hotels?.length) {
        return {
          success: true,
          hotels: result.hotels,
          source: 'amadeus',
        };
      }
    } catch (error) {
      console.error('Amadeus search failed, falling back to mock:', error);
    }

    // Fallback to mock data
    return {
      success: true,
      hotels: getMockHotels(params),
      source: 'mock',
      error: 'Using sample data - API not configured',
    };
  }

  async getHotelDetails(hotelId: string): Promise<{
    success: boolean;
    hotel?: HotelOffer;
    error?: string;
  }> {
    // In production, fetch from provider
    // For now, return mock
    const mockHotel = MOCK_HOTELS.find((h) => h.hotelId === hotelId);
    if (mockHotel) {
      return { success: true, hotel: mockHotel as HotelOffer };
    }
    return { success: false, error: 'Hotel not found' };
  }

  async bookHotel(params: HotelBookingParams): Promise<{
    success: boolean;
    booking?: HotelBooking;
    error?: string;
  }> {
    // In production, call provider's booking API
    // For now, simulate booking
    const booking: HotelBooking = {
      bookingId: `HB${Date.now()}`,
      confirmationNumber: `KUNIV${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      hotelName: 'Hotel Name', // Would come from lookup
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      roomType: params.roomTypeId,
      totalPrice: 0, // Would be calculated
      currency: 'USD',
      status: 'confirmed',
      cancellationPolicy: 'Free cancellation until 24 hours before check-in',
    };

    return { success: true, booking };
  }
}

// ============================================
// Helpers
// ============================================

function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ============================================
// Singleton Export
// ============================================

let hotelAggregator: HotelAggregator | null = null;

export function getHotelAggregator(): HotelAggregator {
  if (!hotelAggregator) {
    hotelAggregator = new HotelAggregator();
  }
  return hotelAggregator;
}
