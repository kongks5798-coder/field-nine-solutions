/**
 * K-UNIVERSAL Travel Search Context
 * Data Bridging: Flight search params → Hotel search auto-population
 *
 * Features:
 * - Store flight search destination and dates
 * - Auto-populate hotel search with same params
 * - Cross-module data sharing
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

// ============================================
// Types
// ============================================

export interface TravelDestination {
  code: string;        // IATA city code (e.g., 'TYO')
  name: string;        // English name (e.g., 'Tokyo')
  nameKo: string;      // Korean name (e.g., '도쿄')
  country: string;     // Country code (e.g., 'JP')
  countryKo: string;   // Korean country name (e.g., '일본')
}

export interface TravelDates {
  checkIn: string;     // YYYY-MM-DD format
  checkOut: string;    // YYYY-MM-DD format
  nights: number;      // Number of nights
}

export interface TravelGuests {
  adults: number;
  children: number;
  infants: number;
  rooms: number;       // For hotel bookings
}

export interface FlightSearchParams {
  origin: TravelDestination | null;
  destination: TravelDestination | null;
  departureDate: string;
  returnDate: string | null;  // null for one-way
  passengers: TravelGuests;
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first';
  isRoundTrip: boolean;
}

export interface HotelSearchParams {
  destination: TravelDestination | null;
  dates: TravelDates | null;
  guests: TravelGuests;
}

export interface SelectedFlight {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  currency: string;
}

export interface SelectedHotel {
  id: string;
  name: string;
  starRating: number;
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  affiliateLink: string;
}

interface TravelSearchContextType {
  // Flight search state
  flightSearch: FlightSearchParams;
  setFlightSearch: (params: Partial<FlightSearchParams>) => void;
  clearFlightSearch: () => void;

  // Hotel search state (auto-populated from flight)
  hotelSearch: HotelSearchParams;
  setHotelSearch: (params: Partial<HotelSearchParams>) => void;
  clearHotelSearch: () => void;

  // Selected items for booking
  selectedFlight: SelectedFlight | null;
  setSelectedFlight: (flight: SelectedFlight | null) => void;
  selectedHotel: SelectedHotel | null;
  setSelectedHotel: (hotel: SelectedHotel | null) => void;

  // Data bridging functions
  bridgeFlightToHotel: () => void;
  hasFlightData: boolean;

  // Session storage
  saveToSession: () => void;
  loadFromSession: () => void;
  clearSession: () => void;
}

// ============================================
// Constants
// ============================================

const SESSION_KEY = 'k-universal-travel-search';

const DEFAULT_GUESTS: TravelGuests = {
  adults: 2,
  children: 0,
  infants: 0,
  rooms: 1,
};

const DEFAULT_FLIGHT_SEARCH: FlightSearchParams = {
  origin: null,
  destination: null,
  departureDate: '',
  returnDate: null,
  passengers: DEFAULT_GUESTS,
  cabinClass: 'economy',
  isRoundTrip: true,
};

const DEFAULT_HOTEL_SEARCH: HotelSearchParams = {
  destination: null,
  dates: null,
  guests: DEFAULT_GUESTS,
};

// Popular destinations for quick reference
export const POPULAR_DESTINATIONS: TravelDestination[] = [
  { code: 'TYO', name: 'Tokyo', nameKo: '도쿄', country: 'JP', countryKo: '일본' },
  { code: 'OSA', name: 'Osaka', nameKo: '오사카', country: 'JP', countryKo: '일본' },
  { code: 'FUK', name: 'Fukuoka', nameKo: '후쿠오카', country: 'JP', countryKo: '일본' },
  { code: 'BKK', name: 'Bangkok', nameKo: '방콕', country: 'TH', countryKo: '태국' },
  { code: 'SIN', name: 'Singapore', nameKo: '싱가포르', country: 'SG', countryKo: '싱가포르' },
  { code: 'HKG', name: 'Hong Kong', nameKo: '홍콩', country: 'HK', countryKo: '홍콩' },
  { code: 'TPE', name: 'Taipei', nameKo: '타이베이', country: 'TW', countryKo: '대만' },
  { code: 'SGN', name: 'Ho Chi Minh', nameKo: '호치민', country: 'VN', countryKo: '베트남' },
  { code: 'DPS', name: 'Bali', nameKo: '발리', country: 'ID', countryKo: '인도네시아' },
  { code: 'PAR', name: 'Paris', nameKo: '파리', country: 'FR', countryKo: '프랑스' },
];

// ============================================
// Context
// ============================================

const TravelSearchContext = createContext<TravelSearchContextType | undefined>(undefined);

// ============================================
// Provider
// ============================================

interface TravelSearchProviderProps {
  children: ReactNode;
}

export function TravelSearchProvider({ children }: TravelSearchProviderProps) {
  const [flightSearch, setFlightSearchState] = useState<FlightSearchParams>(DEFAULT_FLIGHT_SEARCH);
  const [hotelSearch, setHotelSearchState] = useState<HotelSearchParams>(DEFAULT_HOTEL_SEARCH);
  const [selectedFlight, setSelectedFlight] = useState<SelectedFlight | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<SelectedHotel | null>(null);

  // Load from session on mount
  useEffect(() => {
    loadFromSession();
  }, []);

  // Update flight search params
  const setFlightSearch = useCallback((params: Partial<FlightSearchParams>) => {
    setFlightSearchState((prev) => {
      const updated = { ...prev, ...params };
      return updated;
    });
  }, []);

  // Clear flight search
  const clearFlightSearch = useCallback(() => {
    setFlightSearchState(DEFAULT_FLIGHT_SEARCH);
    setSelectedFlight(null);
  }, []);

  // Update hotel search params
  const setHotelSearch = useCallback((params: Partial<HotelSearchParams>) => {
    setHotelSearchState((prev) => ({ ...prev, ...params }));
  }, []);

  // Clear hotel search
  const clearHotelSearch = useCallback(() => {
    setHotelSearchState(DEFAULT_HOTEL_SEARCH);
    setSelectedHotel(null);
  }, []);

  // Bridge flight data to hotel search (Data Bridging)
  const bridgeFlightToHotel = useCallback(() => {
    if (!flightSearch.destination || !flightSearch.departureDate) {
      return;
    }

    const checkIn = flightSearch.departureDate;
    const checkOut = flightSearch.returnDate || calculateDefaultCheckout(flightSearch.departureDate);

    const nights = calculateNights(checkIn, checkOut);

    setHotelSearchState({
      destination: flightSearch.destination,
      dates: {
        checkIn,
        checkOut,
        nights,
      },
      guests: {
        ...flightSearch.passengers,
        rooms: Math.ceil(flightSearch.passengers.adults / 2), // Auto-calculate rooms
      },
    });
  }, [flightSearch]);

  // Check if flight data is available for bridging
  const hasFlightData = !!(flightSearch.destination && flightSearch.departureDate);

  // Save to session storage
  const saveToSession = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const data = {
        flightSearch,
        hotelSearch,
        selectedFlight,
        selectedHotel,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
    } catch {
      // Session storage write failed
    }
  }, [flightSearch, hotelSearch, selectedFlight, selectedHotel]);

  // Load from session storage
  const loadFromSession = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (!stored) return;

      const data = JSON.parse(stored);

      // Check if session is still valid (30 minutes)
      if (Date.now() - data.timestamp > 30 * 60 * 1000) {
        sessionStorage.removeItem(SESSION_KEY);
        return;
      }

      if (data.flightSearch) setFlightSearchState(data.flightSearch);
      if (data.hotelSearch) setHotelSearchState(data.hotelSearch);
      if (data.selectedFlight) setSelectedFlight(data.selectedFlight);
      if (data.selectedHotel) setSelectedHotel(data.selectedHotel);
    } catch {
      // Invalid session data
    }
  }, []);

  // Clear session storage
  const clearSession = useCallback(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(SESSION_KEY);
    clearFlightSearch();
    clearHotelSearch();
  }, [clearFlightSearch, clearHotelSearch]);

  // Auto-save to session when state changes
  useEffect(() => {
    saveToSession();
  }, [flightSearch, hotelSearch, selectedFlight, selectedHotel, saveToSession]);

  const value: TravelSearchContextType = {
    flightSearch,
    setFlightSearch,
    clearFlightSearch,
    hotelSearch,
    setHotelSearch,
    clearHotelSearch,
    selectedFlight,
    setSelectedFlight,
    selectedHotel,
    setSelectedHotel,
    bridgeFlightToHotel,
    hasFlightData,
    saveToSession,
    loadFromSession,
    clearSession,
  };

  return (
    <TravelSearchContext.Provider value={value}>
      {children}
    </TravelSearchContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useTravelSearch(): TravelSearchContextType {
  const context = useContext(TravelSearchContext);

  if (context === undefined) {
    throw new Error('useTravelSearch must be used within a TravelSearchProvider');
  }

  return context;
}

// ============================================
// Utility Functions
// ============================================

function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function calculateDefaultCheckout(checkIn: string, nights: number = 2): string {
  const date = new Date(checkIn);
  date.setDate(date.getDate() + nights);
  return date.toISOString().split('T')[0];
}

/**
 * Get destination by code
 */
export function getDestinationByCode(code: string): TravelDestination | null {
  return POPULAR_DESTINATIONS.find((d) => d.code === code) || null;
}

/**
 * Format travel dates for display
 */
export function formatTravelDates(dates: TravelDates): string {
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const checkIn = new Date(dates.checkIn).toLocaleDateString('ko-KR', options);
  const checkOut = new Date(dates.checkOut).toLocaleDateString('ko-KR', options);
  return `${checkIn} - ${checkOut} (${dates.nights}박)`;
}

/**
 * Format guests for display
 */
export function formatGuests(guests: TravelGuests): string {
  const parts = [];
  if (guests.adults > 0) parts.push(`성인 ${guests.adults}명`);
  if (guests.children > 0) parts.push(`아동 ${guests.children}명`);
  if (guests.infants > 0) parts.push(`유아 ${guests.infants}명`);
  return parts.join(', ');
}
