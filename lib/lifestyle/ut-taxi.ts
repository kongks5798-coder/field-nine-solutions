/**
 * K-UNIVERSAL UT (Universal Taxi) API Integration
 * Kakao T alternative for foreigners without Korean phone number
 */

export interface TaxiRequest {
  pickup: {
    latitude: number;
    longitude: number;
    address: string;
  };
  destination: {
    latitude: number;
    longitude: number;
    address: string;
  };
  userId: string;
  paymentMethod: 'ghost_wallet' | 'card';
}

export interface TaxiResponse {
  success: boolean;
  bookingId?: string;
  estimatedArrival?: number; // minutes
  estimatedFare?: number; // KRW
  driverInfo?: {
    name: string;
    carModel: string;
    plateNumber: string;
    rating: number;
  };
  error?: string;
}

/**
 * Request UT taxi ride
 */
export async function requestTaxi(request: TaxiRequest): Promise<TaxiResponse> {
  // Integration with UT API (mock for now)
  // Production: Integrate with Kakao Mobility API or similar

  try {
    // Calculate estimated fare based on distance
    const distance = calculateDistance(
      request.pickup.latitude,
      request.pickup.longitude,
      request.destination.latitude,
      request.destination.longitude
    );

    const baseFare = 4000; // KRW
    const perKmRate = 1000; // KRW
    const estimatedFare = Math.round(baseFare + distance * perKmRate);

    // Mock response
    return {
      success: true,
      bookingId: `UT-${Date.now()}`,
      estimatedArrival: Math.floor(Math.random() * 10) + 3, // 3-12 minutes
      estimatedFare,
      driverInfo: {
        name: 'Driver Kim',
        carModel: 'Hyundai Sonata',
        plateNumber: '서울 12가 3456',
        rating: 4.8,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Taxi booking failed',
    };
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Get taxi ride status
 */
export async function getTaxiStatus(bookingId: string): Promise<{
  status: 'pending' | 'en_route' | 'arrived' | 'completed' | 'cancelled';
  location?: { latitude: number; longitude: number };
  eta?: number;
}> {
  // Mock status
  return {
    status: 'en_route',
    location: {
      latitude: 37.5665,
      longitude: 126.9780,
    },
    eta: 5,
  };
}

/**
 * Cancel taxi booking
 */
export async function cancelTaxi(bookingId: string): Promise<{ success: boolean }> {
  // Mock cancellation
  return { success: true };
}
