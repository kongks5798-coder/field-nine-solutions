/**
 * K-UNIVERSAL Restaurant GPS Agent
 * AI-powered restaurant discovery for foreigners
 */

export interface RestaurantSpot {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  rating: number;
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  distance: number; // km
  location: {
    latitude: number;
    longitude: number;
    address: string;
    addressEn: string;
  };
  specialties: string[];
  foreignerFriendly: boolean;
  hasEnglishMenu: boolean;
  imageUrl?: string;
  aiRecommendation?: string;
}

export interface RestaurantSearchParams {
  latitude: number;
  longitude: number;
  radius?: number; // km, default 2
  category?: string;
  priceRange?: string;
  foreignerFriendly?: boolean;
  query?: string; // AI-powered search
}

/**
 * Search restaurants with AI recommendations
 */
export async function searchRestaurantsGPS(
  params: RestaurantSearchParams
): Promise<RestaurantSpot[]> {
  // Mock restaurant data (Seoul hidden gems)
  const mockSpots: RestaurantSpot[] = [
    {
      id: 'spot-1',
      name: '을지로 갈매기살',
      nameEn: 'Euljiro Galmaegisal',
      category: 'Korean BBQ',
      rating: 4.8,
      priceRange: '$$',
      distance: 0.3,
      location: {
        latitude: 37.5665,
        longitude: 126.9910,
        address: '서울 중구 을지로 123',
        addressEn: '123 Euljiro, Jung-gu, Seoul',
      },
      specialties: ['Pork skirt meat', 'Soju pairing'],
      foreignerFriendly: true,
      hasEnglishMenu: true,
      aiRecommendation: 'Hidden gem popular with locals. Try the galmaegisal with garlic!',
    },
    {
      id: 'spot-2',
      name: '망원동 칼국수',
      nameEn: 'Mangwon Kalguksu',
      category: 'Korean Noodles',
      rating: 4.9,
      priceRange: '$',
      distance: 1.5,
      location: {
        latitude: 37.5557,
        longitude: 126.9024,
        address: '서울 마포구 망원동 456',
        addressEn: '456 Mangwon-dong, Mapo-gu, Seoul',
      },
      specialties: ['Hand-cut noodles', 'Kimchi'],
      foreignerFriendly: true,
      hasEnglishMenu: false,
      aiRecommendation: 'Authentic experience! Staff is friendly to foreigners despite no English menu.',
    },
    {
      id: 'spot-3',
      name: '익선동 한옥 카페',
      nameEn: 'Ikseon Hanok Cafe',
      category: 'Cafe',
      rating: 4.6,
      priceRange: '$$',
      distance: 0.8,
      location: {
        latitude: 37.5721,
        longitude: 126.9856,
        address: '서울 종로구 익선동 789',
        addressEn: '789 Ikseon-dong, Jongno-gu, Seoul',
      },
      specialties: ['Traditional tea', 'Korean desserts'],
      foreignerFriendly: true,
      hasEnglishMenu: true,
      aiRecommendation: 'Instagram-worthy hanok cafe in historic neighborhood.',
    },
  ];

  // Filter by parameters
  let results = mockSpots;

  if (params.radius) {
    results = results.filter((spot) => spot.distance <= params.radius!);
  }

  if (params.category) {
    results = results.filter((spot) =>
      spot.category.toLowerCase().includes(params.category!.toLowerCase())
    );
  }

  if (params.foreignerFriendly) {
    results = results.filter((spot) => spot.foreignerFriendly);
  }

  return results;
}

/**
 * Get AI-powered restaurant recommendation
 */
export async function getAIRecommendation(params: {
  userPreferences: string[]; // e.g., ['spicy', 'meat', 'authentic']
  location: { latitude: number; longitude: number };
  budget?: number; // max price per person
}): Promise<{
  recommendations: RestaurantSpot[];
  reasoning: string;
}> {
  const restaurants = await searchRestaurantsGPS({
    latitude: params.location.latitude,
    longitude: params.location.longitude,
    foreignerFriendly: true,
  });

  // Simple preference matching (production: use GPT-4 for better recommendations)
  const scored = restaurants.map((r) => ({
    restaurant: r,
    score: Math.random() * 5, // Mock scoring
  }));

  scored.sort((a, b) => b.score - a.score);

  return {
    recommendations: scored.slice(0, 3).map((s) => s.restaurant),
    reasoning:
      'Based on your preferences for authentic Korean food and budget, these spots offer the best value and experience for foreigners.',
  };
}

/**
 * Make restaurant reservation
 */
export async function makeReservation(params: {
  restaurantId: string;
  userId: string;
  date: string;
  time: string;
  partySize: number;
  specialRequests?: string;
}): Promise<{
  success: boolean;
  reservationId?: string;
  confirmationNumber?: string;
  error?: string;
}> {
  try {
    // Mock reservation
    return {
      success: true,
      reservationId: `RES-${Date.now()}`,
      confirmationNumber: `CONF-${Math.random().toString(36).substring(7).toUpperCase()}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Reservation failed',
    };
  }
}
