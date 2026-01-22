/**
 * K-UNIVERSAL Flight Search
 * Tesla-Style Minimal Design - Warm Ivory & Deep Black
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  ArrowLeft,
  Search,
  Calendar,
  Users,
  Plane,
  ArrowRightLeft,
  Clock,
  Briefcase,
  MapPin,
  ChevronDown,
  X,
  ExternalLink,
  Loader2,
  Filter,
  SlidersHorizontal,
  AlertCircle,
  Check,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface Airport {
  code: string;
  name: string;
  nameKo: string;
  city: string;
  cityKo: string;
  country: string;
  countryKo: string;
}

interface Flight {
  id: string;
  airline: string;
  airlineKo?: string;
  airlineLogo: string;
  flightNumber: string;
  departure: {
    airport: string;
    city: string;
    cityKo?: string;
    time: string;
    date: string;
  };
  arrival: {
    airport: string;
    city: string;
    cityKo?: string;
    time: string;
    date: string;
  };
  duration: string;
  stops: number;
  price: number;
  currency: string;
  class: 'economy' | 'business' | 'first';
  bookingUrl: string;
  source: string;
  badge?: string;
}

interface SearchParams {
  origin: string;
  destination: string;
  departDate: string;
  returnDate: string;
  passengers: number;
  tripType: 'roundtrip' | 'oneway';
  cabinClass: 'economy' | 'business' | 'first';
}

// ============================================
// Constants
// ============================================

const POPULAR_AIRPORTS: Airport[] = [
  { code: 'ICN', name: 'Incheon International', nameKo: '인천국제공항', city: 'Seoul', cityKo: '서울', country: 'South Korea', countryKo: '대한민국' },
  { code: 'GMP', name: 'Gimpo International', nameKo: '김포국제공항', city: 'Seoul', cityKo: '서울', country: 'South Korea', countryKo: '대한민국' },
  { code: 'NRT', name: 'Narita International', nameKo: '나리타국제공항', city: 'Tokyo', cityKo: '도쿄', country: 'Japan', countryKo: '일본' },
  { code: 'HND', name: 'Haneda Airport', nameKo: '하네다공항', city: 'Tokyo', cityKo: '도쿄', country: 'Japan', countryKo: '일본' },
  { code: 'KIX', name: 'Kansai International', nameKo: '간사이국제공항', city: 'Osaka', cityKo: '오사카', country: 'Japan', countryKo: '일본' },
  { code: 'BKK', name: 'Suvarnabhumi Airport', nameKo: '수완나품공항', city: 'Bangkok', cityKo: '방콕', country: 'Thailand', countryKo: '태국' },
  { code: 'SIN', name: 'Changi Airport', nameKo: '창이공항', city: 'Singapore', cityKo: '싱가포르', country: 'Singapore', countryKo: '싱가포르' },
  { code: 'HKG', name: 'Hong Kong International', nameKo: '홍콩국제공항', city: 'Hong Kong', cityKo: '홍콩', country: 'Hong Kong', countryKo: '홍콩' },
  { code: 'TPE', name: 'Taoyuan International', nameKo: '타오위안국제공항', city: 'Taipei', cityKo: '타이베이', country: 'Taiwan', countryKo: '대만' },
];

const POPULAR_ROUTES = [
  { from: 'ICN', to: 'NRT', fromCity: '서울', toCity: '도쿄', flag: '🇯🇵' },
  { from: 'ICN', to: 'KIX', fromCity: '서울', toCity: '오사카', flag: '🇯🇵' },
  { from: 'ICN', to: 'BKK', fromCity: '서울', toCity: '방콕', flag: '🇹🇭' },
  { from: 'ICN', to: 'SIN', fromCity: '서울', toCity: '싱가포르', flag: '🇸🇬' },
  { from: 'ICN', to: 'HKG', fromCity: '서울', toCity: '홍콩', flag: '🇭🇰' },
  { from: 'ICN', to: 'TPE', fromCity: '서울', toCity: '타이베이', flag: '🇹🇼' },
];

// Sample flights (실제 API 연동 전 표시용)
const SAMPLE_FLIGHTS: Flight[] = [
  {
    id: '1',
    airline: 'Korean Air',
    airlineKo: '대한항공',
    airlineLogo: '🛫',
    flightNumber: 'KE703',
    departure: { airport: 'ICN', city: 'Seoul', cityKo: '서울', time: '09:00', date: '2026-01-26' },
    arrival: { airport: 'NRT', city: 'Tokyo', cityKo: '도쿄', time: '11:30', date: '2026-01-26' },
    duration: '2h 30m',
    stops: 0,
    price: 285000,
    currency: 'KRW',
    class: 'economy',
    bookingUrl: 'https://www.koreanair.com',
    source: 'Korean Air',
    badge: 'Best Price',
  },
  {
    id: '2',
    airline: 'Asiana Airlines',
    airlineKo: '아시아나항공',
    airlineLogo: '✈️',
    flightNumber: 'OZ101',
    departure: { airport: 'ICN', city: 'Seoul', cityKo: '서울', time: '10:30', date: '2026-01-26' },
    arrival: { airport: 'NRT', city: 'Tokyo', cityKo: '도쿄', time: '13:00', date: '2026-01-26' },
    duration: '2h 30m',
    stops: 0,
    price: 295000,
    currency: 'KRW',
    class: 'economy',
    bookingUrl: 'https://www.flyasiana.com',
    source: 'Asiana',
  },
  {
    id: '3',
    airline: 'Japan Airlines',
    airlineKo: '일본항공',
    airlineLogo: '🇯🇵',
    flightNumber: 'JL92',
    departure: { airport: 'ICN', city: 'Seoul', cityKo: '서울', time: '14:00', date: '2026-01-26' },
    arrival: { airport: 'HND', city: 'Tokyo', cityKo: '도쿄', time: '16:20', date: '2026-01-26' },
    duration: '2h 20m',
    stops: 0,
    price: 320000,
    currency: 'KRW',
    class: 'economy',
    bookingUrl: 'https://www.jal.co.jp',
    source: 'JAL',
    badge: 'Fast',
  },
  {
    id: '4',
    airline: 'Jin Air',
    airlineKo: '진에어',
    airlineLogo: '💚',
    flightNumber: 'LJ201',
    departure: { airport: 'ICN', city: 'Seoul', cityKo: '서울', time: '07:00', date: '2026-01-26' },
    arrival: { airport: 'NRT', city: 'Tokyo', cityKo: '도쿄', time: '09:30', date: '2026-01-26' },
    duration: '2h 30m',
    stops: 0,
    price: 195000,
    currency: 'KRW',
    class: 'economy',
    bookingUrl: 'https://www.jinair.com',
    source: 'Jin Air',
    badge: 'Budget',
  },
  {
    id: '5',
    airline: 'T\'way Air',
    airlineKo: '티웨이항공',
    airlineLogo: '🟠',
    flightNumber: 'TW211',
    departure: { airport: 'ICN', city: 'Seoul', cityKo: '서울', time: '08:30', date: '2026-01-26' },
    arrival: { airport: 'KIX', city: 'Osaka', cityKo: '오사카', time: '10:30', date: '2026-01-26' },
    duration: '2h 00m',
    stops: 0,
    price: 175000,
    currency: 'KRW',
    class: 'economy',
    bookingUrl: 'https://www.twayair.com',
    source: 'T\'way Air',
    badge: 'Budget',
  },
  {
    id: '6',
    airline: 'Thai Airways',
    airlineKo: '타이항공',
    airlineLogo: '🇹🇭',
    flightNumber: 'TG659',
    departure: { airport: 'ICN', city: 'Seoul', cityKo: '서울', time: '11:00', date: '2026-01-26' },
    arrival: { airport: 'BKK', city: 'Bangkok', cityKo: '방콕', time: '15:00', date: '2026-01-26' },
    duration: '6h 00m',
    stops: 0,
    price: 420000,
    currency: 'KRW',
    class: 'economy',
    bookingUrl: 'https://www.thaiairways.com',
    source: 'Thai Airways',
  },
];

// ============================================
// Utility Functions
// ============================================

const formatPrice = (price: number, currency: string = 'KRW') => {
  if (currency === 'KRW') {
    return `₩${price.toLocaleString()}`;
  }
  return `$${price.toLocaleString()}`;
};

const getDefaultDates = () => {
  const today = new Date();
  const departDate = new Date(today);
  departDate.setDate(today.getDate() + 7);
  const returnDate = new Date(departDate);
  returnDate.setDate(departDate.getDate() + 5);

  return {
    departDate: departDate.toISOString().split('T')[0],
    returnDate: returnDate.toISOString().split('T')[0],
  };
};

// ============================================
// Components
// ============================================

function FlightCard({ flight, locale }: { flight: Flight; locale: string }) {
  const isKo = locale === 'ko';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#171717]/5 rounded-2xl overflow-hidden border border-[#171717]/10 hover:border-[#171717]/20 transition-all"
    >
      <div className="p-5">
        {/* Airline Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#171717]/10 flex items-center justify-center text-xl">
              {flight.airlineLogo}
            </div>
            <div>
              <p className="text-[#171717] font-semibold">
                {isKo && flight.airlineKo ? flight.airlineKo : flight.airline}
              </p>
              <p className="text-[#171717]/40 text-sm">{flight.flightNumber}</p>
            </div>
          </div>
          {flight.badge && (
            <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              flight.badge === 'Best Price' ? 'bg-emerald-500/20 text-emerald-400' :
              flight.badge === 'Fast' ? 'bg-[#171717]/20 text-[#171717]' :
              'bg-amber-500/20 text-amber-400'
            }`}>
              {flight.badge}
            </div>
          )}
        </div>

        {/* Flight Timeline */}
        <div className="flex items-center gap-4 mb-4">
          {/* Departure */}
          <div className="flex-1">
            <p className="text-2xl font-bold text-[#171717]">{flight.departure.time}</p>
            <p className="text-[#171717]/60 text-sm">{flight.departure.airport}</p>
            <p className="text-[#171717]/40 text-xs">
              {isKo && flight.departure.cityKo ? flight.departure.cityKo : flight.departure.city}
            </p>
          </div>

          {/* Duration Line */}
          <div className="flex-1 flex flex-col items-center">
            <p className="text-[#171717]/50 text-xs mb-1">{flight.duration}</p>
            <div className="w-full flex items-center gap-1">
              <div className="h-px flex-1 bg-white/20" />
              <Plane className="w-4 h-4 text-[#171717] rotate-90" />
              <div className="h-px flex-1 bg-white/20" />
            </div>
            <p className="text-[#171717]/40 text-xs mt-1">
              {flight.stops === 0 ? (isKo ? '직항' : 'Direct') : `${flight.stops} ${isKo ? '경유' : 'stop'}`}
            </p>
          </div>

          {/* Arrival */}
          <div className="flex-1 text-right">
            <p className="text-2xl font-bold text-[#171717]">{flight.arrival.time}</p>
            <p className="text-[#171717]/60 text-sm">{flight.arrival.airport}</p>
            <p className="text-[#171717]/40 text-xs">
              {isKo && flight.arrival.cityKo ? flight.arrival.cityKo : flight.arrival.city}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#171717]/10 pt-4 flex items-center justify-between">
          {/* Class & Features */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[#171717]/50 text-sm">
              <Briefcase className="w-4 h-4" />
              <span className="capitalize">{flight.class}</span>
            </div>
          </div>

          {/* Price & Book */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[#171717] font-bold text-xl">
                {formatPrice(flight.price, flight.currency)}
              </p>
              <p className="text-[#171717]/40 text-xs">{isKo ? '1인' : 'per person'}</p>
            </div>
            <a
              href={flight.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-[#171717] hover:bg-[#171717]/90 rounded-xl text-[#171717] font-semibold flex items-center gap-1 transition-colors"
            >
              {isKo ? '예약' : 'Book'}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Source */}
        <p className="text-[#171717]/30 text-xs mt-3">
          via {flight.source}
        </p>
      </div>
    </motion.div>
  );
}

function AirportPicker({
  label,
  value,
  onChange,
  airports,
  isKo,
  isOpen,
  onToggle,
  onClose,
}: {
  label: string;
  value: string;
  onChange: (code: string) => void;
  airports: Airport[];
  isKo: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const selectedAirport = airports.find(a => a.code === value);

  return (
    <div className="relative">
      <label className="text-[#171717]/50 text-sm mb-2 block">{label}</label>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-[#171717]/5 border border-[#171717]/10 rounded-xl text-left hover:border-[#171717]/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-[#171717]/40" />
          <div>
            {selectedAirport ? (
              <>
                <p className="text-[#171717] font-semibold">{selectedAirport.code}</p>
                <p className="text-[#171717]/50 text-xs">
                  {isKo ? selectedAirport.cityKo : selectedAirport.city}
                </p>
              </>
            ) : (
              <p className="text-[#171717]/40">{isKo ? '공항 선택' : 'Select airport'}</p>
            )}
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-[#171717]/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#171717]/10 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto"
          >
            {airports.map((airport) => (
              <button
                key={airport.code}
                onClick={() => {
                  onChange(airport.code);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#171717]/5 transition-colors ${
                  value === airport.code ? 'bg-[#171717]/10' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-[#171717]/5 flex items-center justify-center">
                  <span className="text-[#171717] font-bold text-sm">{airport.code}</span>
                </div>
                <div className="text-left flex-1">
                  <p className="text-[#171717] font-medium">
                    {isKo ? airport.cityKo : airport.city}
                  </p>
                  <p className="text-[#171717]/40 text-xs">
                    {isKo ? airport.nameKo : airport.name}
                  </p>
                </div>
                {value === airport.code && (
                  <Check className="w-5 h-5 text-[#171717]" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Main Page
// ============================================

export default function FlightsPage() {
  const locale = useLocale();
  const isKo = locale === 'ko';
  const { departDate: defaultDepartDate, returnDate: defaultReturnDate } = getDefaultDates();

  const [searchParams, setSearchParams] = useState<SearchParams>({
    origin: 'ICN',
    destination: '',
    departDate: defaultDepartDate,
    returnDate: defaultReturnDate,
    passengers: 1,
    tripType: 'roundtrip',
    cabinClass: 'economy',
  });

  const [flights, setFlights] = useState<Flight[]>(SAMPLE_FLIGHTS);
  const [isLoading, setIsLoading] = useState(false);
  const [showOriginPicker, setShowOriginPicker] = useState(false);
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);
  const [sortBy, setSortBy] = useState<'price' | 'duration' | 'departure'>('price');

  // Filter and sort flights
  const filteredFlights = flights
    .filter((flight) => {
      if (!searchParams.destination) return true;
      return flight.arrival.airport === searchParams.destination ||
             flight.arrival.city.toLowerCase().includes(searchParams.destination.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'departure') return a.departure.time.localeCompare(b.departure.time);
      // Duration sort - convert "2h 30m" to minutes
      const getDurationMins = (d: string) => {
        const match = d.match(/(\d+)h\s*(\d+)?m?/);
        if (!match) return 0;
        return parseInt(match[1]) * 60 + (parseInt(match[2]) || 0);
      };
      return getDurationMins(a.duration) - getDurationMins(b.duration);
    });

  const handleSwapAirports = () => {
    setSearchParams(prev => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin,
    }));
  };

  const handleSearch = async () => {
    if (!searchParams.origin || !searchParams.destination) return;

    setIsLoading(true);
    // TODO: 실제 API 호출
    // const response = await fetch('/api/flights/search', { ... });

    // 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  const handleQuickRoute = (from: string, to: string) => {
    setSearchParams(prev => ({
      ...prev,
      origin: from,
      destination: to,
    }));
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#F9F9F7]/90 backdrop-blur-xl border-b border-[#171717]/10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/${locale}/dashboard`}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="p-2 hover:bg-[#171717]/5 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-[#171717]" />
                </motion.button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#171717] flex items-center justify-center">
                  <Plane className="w-5 h-5 text-[#171717]" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[#171717]">
                    {isKo ? '항공권 검색' : 'Flight Search'}
                  </h1>
                  <p className="text-xs text-[#171717]/50">
                    {isKo ? '최저가 항공권 비교' : 'Compare best flight prices'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Search Section */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl p-6 border border-[#171717]/10">
            {/* Trip Type & Class */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2 bg-[#171717]/5 rounded-lg p-1">
                {(['roundtrip', 'oneway'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSearchParams(prev => ({ ...prev, tripType: type }))}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      searchParams.tripType === type
                        ? 'bg-[#171717] text-[#171717]'
                        : 'text-[#171717]/60 hover:text-[#171717]'
                    }`}
                  >
                    {type === 'roundtrip' ? (isKo ? '왕복' : 'Round Trip') : (isKo ? '편도' : 'One Way')}
                  </button>
                ))}
              </div>

              <select
                value={searchParams.cabinClass}
                onChange={(e) => setSearchParams(prev => ({ ...prev, cabinClass: e.target.value as SearchParams['cabinClass'] }))}
                className="bg-[#171717]/5 border border-[#171717]/10 rounded-lg px-3 py-2 text-[#171717] text-sm focus:outline-none"
              >
                <option value="economy" className="bg-white">{isKo ? '이코노미' : 'Economy'}</option>
                <option value="business" className="bg-white">{isKo ? '비즈니스' : 'Business'}</option>
                <option value="first" className="bg-white">{isKo ? '퍼스트' : 'First'}</option>
              </select>

              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#171717]/40" />
                <select
                  value={searchParams.passengers}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, passengers: Number(e.target.value) }))}
                  className="bg-[#171717]/5 border border-[#171717]/10 rounded-lg px-3 py-2 text-[#171717] text-sm focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n} className="bg-white">
                      {n} {isKo ? '명' : n === 1 ? 'Passenger' : 'Passengers'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Airport Selection */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              {/* Origin */}
              <div className="md:col-span-2">
                <AirportPicker
                  label={isKo ? '출발지' : 'From'}
                  value={searchParams.origin}
                  onChange={(code) => setSearchParams(prev => ({ ...prev, origin: code }))}
                  airports={POPULAR_AIRPORTS}
                  isKo={isKo}
                  isOpen={showOriginPicker}
                  onToggle={() => {
                    setShowOriginPicker(!showOriginPicker);
                    setShowDestinationPicker(false);
                  }}
                  onClose={() => setShowOriginPicker(false)}
                />
              </div>

              {/* Swap Button */}
              <div className="flex items-end justify-center pb-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSwapAirports}
                  className="w-10 h-10 rounded-full bg-[#171717]/20 border border-[#171717]/30 flex items-center justify-center hover:bg-[#171717]/30 transition-colors"
                >
                  <ArrowRightLeft className="w-5 h-5 text-[#171717]" />
                </motion.button>
              </div>

              {/* Destination */}
              <div className="md:col-span-2">
                <AirportPicker
                  label={isKo ? '도착지' : 'To'}
                  value={searchParams.destination}
                  onChange={(code) => setSearchParams(prev => ({ ...prev, destination: code }))}
                  airports={POPULAR_AIRPORTS.filter(a => a.code !== searchParams.origin)}
                  isKo={isKo}
                  isOpen={showDestinationPicker}
                  onToggle={() => {
                    setShowDestinationPicker(!showDestinationPicker);
                    setShowOriginPicker(false);
                  }}
                  onClose={() => setShowDestinationPicker(false)}
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Depart Date */}
              <div>
                <label className="text-[#171717]/50 text-sm mb-2 block">
                  {isKo ? '출발일' : 'Departure'}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171717]/40" />
                  <input
                    type="date"
                    value={searchParams.departDate}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, departDate: e.target.value }))}
                    className="w-full pl-11 pr-4 py-3.5 bg-[#171717]/5 border border-[#171717]/10 rounded-xl text-[#171717] focus:outline-none focus:border-[#171717]/50 transition-colors"
                  />
                </div>
              </div>

              {/* Return Date */}
              {searchParams.tripType === 'roundtrip' && (
                <div>
                  <label className="text-[#171717]/50 text-sm mb-2 block">
                    {isKo ? '귀국일' : 'Return'}
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171717]/40" />
                    <input
                      type="date"
                      value={searchParams.returnDate}
                      onChange={(e) => setSearchParams(prev => ({ ...prev, returnDate: e.target.value }))}
                      className="w-full pl-11 pr-4 py-3.5 bg-[#171717]/5 border border-[#171717]/10 rounded-xl text-[#171717] focus:outline-none focus:border-[#171717]/50 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Search Button */}
              <div className="flex items-end">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSearch}
                  disabled={isLoading || !searchParams.origin || !searchParams.destination}
                  className="w-full px-6 py-3.5 bg-[#171717] hover:bg-[#171717]/90 disabled:bg-[#171717]/50 rounded-xl text-[#171717] font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                  {isKo ? '항공권 검색' : 'Search Flights'}
                </motion.button>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Routes */}
        {!searchParams.destination && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-[#171717] mb-4">
              {isKo ? '인기 노선' : 'Popular Routes'}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {POPULAR_ROUTES.map((route) => (
                <motion.button
                  key={`${route.from}-${route.to}`}
                  onClick={() => handleQuickRoute(route.from, route.to)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 rounded-xl bg-[#171717]/5 border border-[#171717]/10 hover:border-[#171717]/20 transition-colors text-left"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{route.flag}</span>
                  </div>
                  <p className="text-[#171717] font-medium text-sm">
                    {route.fromCity} → {route.toCity}
                  </p>
                  <p className="text-[#171717]/40 text-xs mt-1">
                    {route.from} → {route.to}
                  </p>
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {/* Sort Options */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-[#171717]/50 text-sm">
            {filteredFlights.length} {isKo ? '개의 항공편' : 'flights found'}
          </p>

          <div className="flex items-center gap-2">
            <span className="text-[#171717]/50 text-sm hidden md:block">
              {isKo ? '정렬' : 'Sort'}:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-[#171717]/5 border border-[#171717]/10 rounded-lg px-3 py-2 text-[#171717] text-sm focus:outline-none"
            >
              <option value="price" className="bg-white">
                {isKo ? '가격 낮은순' : 'Lowest Price'}
              </option>
              <option value="duration" className="bg-white">
                {isKo ? '비행시간순' : 'Shortest Duration'}
              </option>
              <option value="departure" className="bg-white">
                {isKo ? '출발시간순' : 'Departure Time'}
              </option>
            </select>
          </div>
        </div>

        {/* Flight Results */}
        <div className="space-y-4">
          {isLoading ? (
            // Loading Skeleton
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#171717]/5 rounded-2xl border border-[#171717]/10 p-5 animate-pulse"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-[#171717]/10 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-4 bg-[#171717]/10 rounded w-32 mb-2" />
                    <div className="h-3 bg-[#171717]/10 rounded w-20" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-6 bg-[#171717]/10 rounded w-16" />
                  <div className="h-4 bg-[#171717]/10 rounded w-24" />
                  <div className="h-6 bg-[#171717]/10 rounded w-16" />
                </div>
              </div>
            ))
          ) : filteredFlights.length > 0 ? (
            filteredFlights.map((flight) => (
              <FlightCard key={flight.id} flight={flight} locale={locale} />
            ))
          ) : (
            <div className="py-12 text-center">
              <Plane className="w-12 h-12 text-[#171717]/20 mx-auto mb-3" />
              <p className="text-[#171717]/50">
                {isKo ? '항공편을 찾을 수 없습니다' : 'No flights found'}
              </p>
              <p className="text-[#171717]/30 text-sm">
                {isKo ? '다른 날짜나 목적지를 시도해보세요' : 'Try different dates or destination'}
              </p>
            </div>
          )}
        </div>

        {/* Info Notice */}
        <div className="mt-8 p-4 bg-[#171717]/10 rounded-xl border border-[#171717]/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#171717] flex-shrink-0 mt-0.5" />
            <p className="text-[#171717] text-sm">
              {isKo
                ? '표시된 가격은 성인 1인 편도 기준이며, 예약 시점에 따라 변동될 수 있습니다. 수하물 요금이 별도로 부과될 수 있습니다.'
                : 'Prices shown are for one adult, one way and may vary at the time of booking. Baggage fees may apply.'}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
