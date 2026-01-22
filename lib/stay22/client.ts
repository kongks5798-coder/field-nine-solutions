/**
 * Stay22 API Client
 * Handles all interactions with Stay22 affiliate API
 */

import {
  Stay22SearchParams,
  Stay22SearchResponse,
  Stay22HotelDetailsParams,
  Stay22HotelDetailsResponse,
  Stay22Hotel,
  Stay22Rate,
  CITY_COORDINATES,
} from './types';

// ============================================
// Configuration
// ============================================

const getConfig = () => ({
  apiKey: process.env.STAY22_API_KEY || '',
  affiliateId: process.env.STAY22_AFFILIATE_ID || 'k-universal',
  baseUrl: 'https://www.stay22.com/api/v2',
});

// ============================================
// Stay22 API Client
// ============================================

class Stay22Client {
  private config = getConfig();

  /**
   * Search hotels by location
   */
  async searchHotels(params: Stay22SearchParams): Promise<Stay22SearchResponse> {
    // If no API key, return mock data for development
    if (!this.config.apiKey) {
      return this.getMockSearchResponse(params);
    }

    try {
      const queryParams = new URLSearchParams({
        lat: params.latitude.toString(),
        lng: params.longitude.toString(),
        checkin: params.checkIn,
        checkout: params.checkOut,
        guests: params.guests.toString(),
        rooms: (params.rooms || 1).toString(),
        radius: (params.radius || 10).toString(),
        currency: params.currency || 'USD',
        lang: params.language || 'en',
        aid: this.config.affiliateId,
      });

      const response = await fetch(
        `${this.config.baseUrl}/hotels?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Stay22 API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Stay22 search error:', error);
      return this.getMockSearchResponse(params);
    }
  }

  /**
   * Search hotels by city code
   */
  async searchByCity(
    cityCode: string,
    checkIn: string,
    checkOut: string,
    guests: number,
    rooms: number = 1
  ): Promise<Stay22SearchResponse> {
    const coords = CITY_COORDINATES[cityCode.toUpperCase()];
    if (!coords) {
      return {
        success: false,
        hotels: [],
        pagination: { total: 0, page: 1, perPage: 20, totalPages: 0 },
      };
    }

    return this.searchHotels({
      latitude: coords.lat,
      longitude: coords.lng,
      checkIn,
      checkOut,
      guests,
      rooms,
    });
  }

  /**
   * Get hotel details with rates
   */
  async getHotelDetails(params: Stay22HotelDetailsParams): Promise<Stay22HotelDetailsResponse> {
    if (!this.config.apiKey) {
      return this.getMockHotelDetails(params.hotelId);
    }

    try {
      const queryParams = new URLSearchParams({
        checkin: params.checkIn,
        checkout: params.checkOut,
        guests: params.guests.toString(),
        rooms: (params.rooms || 1).toString(),
        aid: this.config.affiliateId,
      });

      const response = await fetch(
        `${this.config.baseUrl}/hotels/${params.hotelId}?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Stay22 API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Stay22 hotel details error:', error);
      return this.getMockHotelDetails(params.hotelId);
    }
  }

  /**
   * Generate affiliate booking link
   */
  generateAffiliateLink(hotelId: string, checkIn: string, checkOut: string): string {
    const baseLink = `https://www.stay22.com/allez/booking/${hotelId}`;
    const params = new URLSearchParams({
      checkin: checkIn,
      checkout: checkOut,
      aid: this.config.affiliateId,
    });
    return `${baseLink}?${params}`;
  }

  // ============================================
  // Mock Data (Development/Fallback)
  // ============================================

  private getMockSearchResponse(params: Stay22SearchParams): Stay22SearchResponse {
    const mockHotels = this.generateMockHotels(params);
    return {
      success: true,
      hotels: mockHotels,
      pagination: {
        total: mockHotels.length,
        page: 1,
        perPage: 20,
        totalPages: 1,
      },
    };
  }

  private generateMockHotels(params: Stay22SearchParams): Array<Stay22Hotel & { lowestRate: Stay22Rate; allRates: Stay22Rate[] }> {
    const hotelTemplates = [
      { name: 'Grand Hyatt', stars: 5, basePrice: 180 },
      { name: 'Hilton Garden Inn', stars: 4, basePrice: 120 },
      { name: 'Marriott Courtyard', stars: 4, basePrice: 130 },
      { name: 'Holiday Inn Express', stars: 3, basePrice: 85 },
      { name: 'Four Seasons', stars: 5, basePrice: 350 },
      { name: 'Sheraton', stars: 4, basePrice: 140 },
      { name: 'Novotel', stars: 4, basePrice: 110 },
      { name: 'ibis Styles', stars: 3, basePrice: 70 },
      { name: 'Ritz-Carlton', stars: 5, basePrice: 400 },
      { name: 'InterContinental', stars: 5, basePrice: 220 },
      { name: 'Westin', stars: 5, basePrice: 200 },
      { name: 'Renaissance', stars: 4, basePrice: 150 },
    ];

    return hotelTemplates.map((template, index) => {
      const hotelId = `stay22_${index + 1}`;
      const netRate = template.basePrice + Math.floor(Math.random() * 50);

      const lowestRate: Stay22Rate = {
        hotelId,
        roomType: 'standard',
        roomName: 'Standard Room',
        netRate,
        currency: 'USD',
        cancellationPolicy: Math.random() > 0.5 ? 'free' : 'non_refundable',
        breakfastIncluded: Math.random() > 0.6,
        maxOccupancy: 2,
        affiliateLink: this.generateAffiliateLink(hotelId, params.checkIn, params.checkOut),
      };

      return {
        id: hotelId,
        name: template.name,
        address: `123 Main Street`,
        city: 'City Center',
        country: 'JP',
        latitude: params.latitude + (Math.random() - 0.5) * 0.05,
        longitude: params.longitude + (Math.random() - 0.5) * 0.05,
        starRating: template.stars,
        reviewScore: 7.5 + Math.random() * 2,
        reviewCount: Math.floor(500 + Math.random() * 2000),
        photos: [
          `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80`,
          `https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80`,
        ],
        amenities: ['WiFi', 'Parking', 'Restaurant', 'Gym', 'Pool'].slice(0, 3 + Math.floor(Math.random() * 3)),
        lowestRate,
        allRates: [lowestRate],
      };
    });
  }

  private getMockHotelDetails(hotelId: string): Stay22HotelDetailsResponse {
    const hotel: Stay22Hotel = {
      id: hotelId,
      name: 'Mock Hotel',
      address: '123 Main Street',
      city: 'Tokyo',
      country: 'Japan',
      latitude: 35.6762,
      longitude: 139.6503,
      starRating: 4,
      reviewScore: 8.5,
      reviewCount: 1234,
      photos: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
      ],
      amenities: ['WiFi', 'Parking', 'Restaurant', 'Gym'],
    };

    const rates: Stay22Rate[] = [
      {
        hotelId,
        roomType: 'standard',
        roomName: 'Standard Room',
        netRate: 120,
        currency: 'USD',
        cancellationPolicy: 'free',
        breakfastIncluded: false,
        maxOccupancy: 2,
        affiliateLink: this.generateAffiliateLink(hotelId, '2024-01-01', '2024-01-02'),
      },
      {
        hotelId,
        roomType: 'deluxe',
        roomName: 'Deluxe Room',
        netRate: 160,
        currency: 'USD',
        cancellationPolicy: 'free',
        breakfastIncluded: true,
        maxOccupancy: 2,
        affiliateLink: this.generateAffiliateLink(hotelId, '2024-01-01', '2024-01-02'),
      },
    ];

    return {
      success: true,
      hotel,
      rates,
    };
  }
}

// Export singleton instance
export const stay22Client = new Stay22Client();

// Export helper functions
export async function searchStay22Hotels(
  cityCode: string,
  checkIn: string,
  checkOut: string,
  guests: number,
  rooms: number = 1
) {
  return stay22Client.searchByCity(cityCode, checkIn, checkOut, guests, rooms);
}

export async function getStay22HotelDetails(
  hotelId: string,
  checkIn: string,
  checkOut: string,
  guests: number
) {
  return stay22Client.getHotelDetails({
    hotelId,
    checkIn,
    checkOut,
    guests,
  });
}
