declare module 'amadeus' {
  interface AmadeusConfig {
    clientId: string;
    clientSecret: string;
    hostname?: string;
  }

  interface AmadeusResponse<T> {
    data: T;
    result: unknown;
    dictionaries?: {
      carriers?: Record<string, string>;
      aircraft?: Record<string, string>;
      currencies?: Record<string, string>;
      locations?: Record<string, { cityCode: string; countryCode: string }>;
    };
  }

  // Hotel APIs
  interface HotelsByCity {
    get(params: {
      cityCode: string;
      radius?: number;
      radiusUnit?: string;
      hotelSource?: string;
    }): Promise<AmadeusResponse<unknown[]>>;
  }

  interface Hotels {
    byCity: HotelsByCity;
  }

  interface Locations {
    hotels: Hotels;
  }

  interface ReferenceData {
    locations: Locations;
  }

  interface HotelOffersSearch {
    get(params: {
      hotelIds: string;
      checkInDate?: string;
      checkOutDate?: string;
      adults?: number;
      roomQuantity?: number;
      currency?: string;
    }): Promise<AmadeusResponse<unknown[]>>;
  }

  // Flight APIs
  interface FlightOffersSearch {
    get(params: {
      originLocationCode: string;
      destinationLocationCode: string;
      departureDate: string;
      returnDate?: string;
      adults: number;
      children?: number;
      infants?: number;
      travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
      nonStop?: boolean;
      currencyCode?: string;
      maxPrice?: number;
      max?: number;
    }): Promise<AmadeusResponse<unknown[]>>;
  }

  interface Shopping {
    hotelOffersSearch: HotelOffersSearch;
    flightOffersSearch: FlightOffersSearch;
  }

  class Amadeus {
    constructor(config: AmadeusConfig);
    referenceData: ReferenceData;
    shopping: Shopping;
  }

  export default Amadeus;
}
