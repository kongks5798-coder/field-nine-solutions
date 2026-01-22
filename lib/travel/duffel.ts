/**
 * Duffel API Client
 * Production-grade flight booking integration
 * https://duffel.com/docs/api
 */

const DUFFEL_BASE_URL = 'https://api.duffel.com';
const DUFFEL_VERSION = 'v1';

// ============================================
// Types
// ============================================

export interface DuffelPassenger {
  type: 'adult' | 'child' | 'infant_without_seat';
  given_name?: string;
  family_name?: string;
  born_on?: string; // YYYY-MM-DD
  gender?: 'm' | 'f';
  email?: string;
  phone_number?: string;
  title?: 'mr' | 'ms' | 'mrs' | 'miss' | 'dr';
  identity_documents?: Array<{
    type: 'passport';
    unique_identifier: string;
    issuing_country_code: string;
    expires_on: string;
  }>;
}

export interface DuffelSlice {
  origin: string; // IATA code
  destination: string; // IATA code
  departure_date: string; // YYYY-MM-DD
  departure_time?: {
    from: string;
    to: string;
  };
  arrival_time?: {
    from: string;
    to: string;
  };
}

export interface DuffelOfferRequest {
  slices: DuffelSlice[];
  passengers: DuffelPassenger[];
  cabin_class?: 'economy' | 'premium_economy' | 'business' | 'first';
  return_offers?: boolean;
  max_connections?: number;
}

export interface DuffelSegment {
  id: string;
  origin: {
    iata_code: string;
    name: string;
    city_name: string;
    time_zone: string;
  };
  destination: {
    iata_code: string;
    name: string;
    city_name: string;
    time_zone: string;
  };
  departing_at: string;
  arriving_at: string;
  operating_carrier: {
    iata_code: string;
    name: string;
    logo_symbol_url: string;
    logo_lockup_url: string;
  };
  marketing_carrier: {
    iata_code: string;
    name: string;
  };
  marketing_carrier_flight_number: string;
  aircraft: {
    iata_code: string;
    name: string;
  };
  duration: string;
  passengers: Array<{
    cabin_class: string;
    cabin_class_marketing_name: string;
    baggages: Array<{
      type: string;
      quantity: number;
    }>;
  }>;
}

export interface DuffelOffer {
  id: string;
  live_mode: boolean;
  created_at: string;
  updated_at: string;
  expires_at: string;
  total_amount: string;
  total_currency: string;
  base_amount: string;
  base_currency: string;
  tax_amount: string;
  tax_currency: string;
  owner: {
    iata_code: string;
    name: string;
    logo_symbol_url: string;
    logo_lockup_url: string;
  };
  slices: Array<{
    id: string;
    duration: string;
    origin: {
      iata_code: string;
      name: string;
      city_name: string;
    };
    destination: {
      iata_code: string;
      name: string;
      city_name: string;
    };
    segments: DuffelSegment[];
  }>;
  passengers: Array<{
    id: string;
    type: string;
  }>;
  payment_requirements: {
    requires_instant_payment: boolean;
    price_guarantee_expires_at: string | null;
  };
  conditions: {
    refund_before_departure: {
      allowed: boolean;
      penalty_amount: string | null;
      penalty_currency: string | null;
    };
    change_before_departure: {
      allowed: boolean;
      penalty_amount: string | null;
      penalty_currency: string | null;
    };
  };
}

export interface DuffelOrder {
  id: string;
  live_mode: boolean;
  booking_reference: string;
  created_at: string;
  total_amount: string;
  total_currency: string;
  base_amount: string;
  tax_amount: string;
  slices: DuffelOffer['slices'];
  passengers: Array<DuffelPassenger & { id: string }>;
  documents: Array<{
    type: string;
    unique_identifier: string;
  }>;
  synced_at: string;
  cancelled_at: string | null;
}

export interface DuffelError {
  meta: {
    status: number;
    request_id: string;
  };
  errors: Array<{
    type: string;
    title: string;
    message: string;
    documentation_url: string;
    code: string;
  }>;
}

// ============================================
// Client
// ============================================

class DuffelClient {
  private apiKey: string;
  private isTest: boolean;

  constructor() {
    this.apiKey = process.env.DUFFEL_API_KEY || '';
    this.isTest = this.apiKey.startsWith('duffel_test_');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T } | DuffelError> {
    if (!this.apiKey) {
      throw new Error('Duffel API key not configured');
    }

    const url = `${DUFFEL_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Duffel-Version': DUFFEL_VERSION,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Duffel API error:', data);
      return data as DuffelError;
    }

    return data;
  }

  /**
   * Search for flight offers
   */
  async searchFlights(params: DuffelOfferRequest): Promise<{
    success: boolean;
    offers?: DuffelOffer[];
    offerRequestId?: string;
    error?: string;
  }> {
    try {
      const result = await this.request<{
        id: string;
        offers: DuffelOffer[];
        slices: DuffelSlice[];
        created_at: string;
      }>('/air/offer_requests', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            ...params,
            return_offers: true,
          },
        }),
      });

      if ('errors' in result) {
        return {
          success: false,
          error: result.errors[0]?.message || 'Search failed',
        };
      }

      return {
        success: true,
        offers: result.data.offers,
        offerRequestId: result.data.id,
      };
    } catch (error) {
      console.error('Duffel search error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
      };
    }
  }

  /**
   * Get a specific offer by ID
   */
  async getOffer(offerId: string): Promise<{
    success: boolean;
    offer?: DuffelOffer;
    error?: string;
  }> {
    try {
      const result = await this.request<DuffelOffer>(`/air/offers/${offerId}`);

      if ('errors' in result) {
        return {
          success: false,
          error: result.errors[0]?.message || 'Failed to get offer',
        };
      }

      return {
        success: true,
        offer: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get offer',
      };
    }
  }

  /**
   * Create a booking order
   */
  async createOrder(params: {
    selectedOffers: string[];
    passengers: DuffelPassenger[];
    payments?: Array<{
      type: 'balance';
      amount: string;
      currency: string;
    }>;
    metadata?: Record<string, string>;
  }): Promise<{
    success: boolean;
    order?: DuffelOrder;
    error?: string;
  }> {
    try {
      const result = await this.request<DuffelOrder>('/air/orders', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            type: 'instant',
            selected_offers: params.selectedOffers,
            passengers: params.passengers.map((p, i) => ({
              ...p,
              id: `pas_${i}`,
            })),
            payments: params.payments,
            metadata: params.metadata,
          },
        }),
      });

      if ('errors' in result) {
        return {
          success: false,
          error: result.errors[0]?.message || 'Booking failed',
        };
      }

      return {
        success: true,
        order: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Booking failed',
      };
    }
  }

  /**
   * Get order details
   */
  async getOrder(orderId: string): Promise<{
    success: boolean;
    order?: DuffelOrder;
    error?: string;
  }> {
    try {
      const result = await this.request<DuffelOrder>(`/air/orders/${orderId}`);

      if ('errors' in result) {
        return {
          success: false,
          error: result.errors[0]?.message || 'Failed to get order',
        };
      }

      return {
        success: true,
        order: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get order',
      };
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<{
    success: boolean;
    refundAmount?: string;
    error?: string;
  }> {
    try {
      const result = await this.request<{
        id: string;
        refund_amount: string;
        refund_currency: string;
      }>(`/air/order_cancellations`, {
        method: 'POST',
        body: JSON.stringify({
          data: {
            order_id: orderId,
          },
        }),
      });

      if ('errors' in result) {
        return {
          success: false,
          error: result.errors[0]?.message || 'Cancellation failed',
        };
      }

      return {
        success: true,
        refundAmount: result.data.refund_amount,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Cancellation failed',
      };
    }
  }

  /**
   * Get seat map for an offer
   */
  async getSeatMap(offerId: string): Promise<{
    success: boolean;
    seatMaps?: Array<{
      sliceId: string;
      segmentId: string;
      cabins: Array<{
        rows: Array<{
          sections: Array<{
            seats: Array<{
              id: string;
              name: string;
              available: boolean;
              price?: string;
            }>;
          }>;
        }>;
      }>;
    }>;
    error?: string;
  }> {
    try {
      const result = await this.request<Array<{
        slice_id: string;
        segment_id: string;
        cabins: Array<{
          rows: Array<{
            sections: Array<{
              elements: Array<{
                type: string;
                designator?: string;
                available_services?: Array<{
                  id: string;
                  total_amount: string;
                }>;
              }>;
            }>;
          }>;
        }>;
      }>>(`/air/seat_maps?offer_id=${offerId}`);

      if ('errors' in result) {
        return {
          success: false,
          error: result.errors[0]?.message || 'Failed to get seat map',
        };
      }

      return {
        success: true,
        seatMaps: result.data.map((sm) => ({
          sliceId: sm.slice_id,
          segmentId: sm.segment_id,
          cabins: sm.cabins.map((cabin) => ({
            rows: cabin.rows.map((row) => ({
              sections: row.sections.map((section) => ({
                seats: section.elements
                  .filter((el) => el.type === 'seat')
                  .map((el) => ({
                    id: el.designator || '',
                    name: el.designator || '',
                    available: (el.available_services?.length || 0) > 0,
                    price: el.available_services?.[0]?.total_amount,
                  })),
              })),
            })),
          })),
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get seat map',
      };
    }
  }

  get isTestMode(): boolean {
    return this.isTest;
  }

  get isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Singleton instance
let duffelClient: DuffelClient | null = null;

export function getDuffelClient(): DuffelClient {
  if (!duffelClient) {
    duffelClient = new DuffelClient();
  }
  return duffelClient;
}

// Helper to convert Duffel offer to our app format
export function formatDuffelOffer(offer: DuffelOffer, markup: number = 0) {
  const outbound = offer.slices[0];
  const firstSegment = outbound.segments[0];
  const lastSegment = outbound.segments[outbound.segments.length - 1];

  const basePrice = parseFloat(offer.total_amount);
  const finalPrice = basePrice * (1 + markup);

  return {
    id: offer.id,
    carrier: {
      code: offer.owner.iata_code,
      name: offer.owner.name,
      logo: offer.owner.logo_symbol_url,
    },
    origin: {
      code: firstSegment.origin.iata_code,
      city: firstSegment.origin.city_name,
      airport: firstSegment.origin.name,
    },
    destination: {
      code: lastSegment.destination.iata_code,
      city: lastSegment.destination.city_name,
      airport: lastSegment.destination.name,
    },
    departure: {
      time: firstSegment.departing_at.split('T')[1]?.substring(0, 5) || '',
      date: firstSegment.departing_at.split('T')[0] || '',
      datetime: firstSegment.departing_at,
    },
    arrival: {
      time: lastSegment.arriving_at.split('T')[1]?.substring(0, 5) || '',
      date: lastSegment.arriving_at.split('T')[0] || '',
      datetime: lastSegment.arriving_at,
    },
    duration: outbound.duration,
    stops: outbound.segments.length - 1,
    stopLocations: outbound.segments.length > 1
      ? outbound.segments.slice(0, -1).map((s) => s.destination.iata_code)
      : [],
    price: {
      base: basePrice,
      markup: finalPrice - basePrice,
      total: finalPrice,
      currency: offer.total_currency,
    },
    cabinClass: firstSegment.passengers[0]?.cabin_class || 'economy',
    baggageIncluded: firstSegment.passengers[0]?.baggages?.some(
      (b) => b.type === 'checked' && b.quantity > 0
    ) || false,
    refundable: offer.conditions.refund_before_departure.allowed,
    changeable: offer.conditions.change_before_departure.allowed,
    expiresAt: offer.expires_at,
    liveMode: offer.live_mode,
    // Return flight if exists
    returnFlight: offer.slices.length > 1 ? {
      departure: {
        time: offer.slices[1].segments[0].departing_at.split('T')[1]?.substring(0, 5) || '',
        date: offer.slices[1].segments[0].departing_at.split('T')[0] || '',
      },
      arrival: {
        time: offer.slices[1].segments[offer.slices[1].segments.length - 1].arriving_at.split('T')[1]?.substring(0, 5) || '',
        date: offer.slices[1].segments[offer.slices[1].segments.length - 1].arriving_at.split('T')[0] || '',
      },
      duration: offer.slices[1].duration,
      stops: offer.slices[1].segments.length - 1,
    } : null,
  };
}
