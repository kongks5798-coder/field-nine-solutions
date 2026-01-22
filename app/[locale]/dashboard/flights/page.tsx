/**
 * K-UNIVERSAL Flight Search
 * Tesla-Style Minimal Design - Warm Ivory & Deep Black
 *
 * Features:
 * - Tesla color scheme (#F9F9F7 Warm Ivory, #171717 Deep Black)
 * - Filter sidebar with airlines, stops, times, price
 * - Flight cards with comparison pricing
 * - Worldwide airport coverage
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  ArrowLeft,
  Search,
  Calendar,
  Users,
  Plane,
  MapPin,
  Loader2,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Briefcase,
  ArrowLeftRight,
  TrendingUp,
  Shield,
  Star,
  Check,
  X,
  ChevronDown,
  Clock,
  Filter,
  SlidersHorizontal,
  Globe,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Zap,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface Flight {
  id: string;
  carrier: {
    code: string;
    name: string;
    logo?: string | null;
  };
  origin: {
    code: string;
    city: string;
    airport: string;
  };
  destination: {
    code: string;
    city: string;
    airport: string;
  };
  departure: {
    time: string;
    date: string;
  };
  arrival: {
    time: string;
    date: string;
  };
  duration: string;
  stops: number;
  stopLocations?: string[];
  price: {
    amount: number;
    currency: string;
  };
  class: string;
  seatsLeft?: number | null;
  returnFlight?: {
    departure: { time: string; date: string };
    arrival: { time: string; date: string };
    duration: string;
    stops: number;
  } | null;
}

interface Airport {
  iataCode: string;
  name: string;
  cityName: string;
  cityCode: string;
  countryCode: string;
  countryName: string;
  type: 'airport' | 'city';
}

interface SearchParams {
  origin: string;
  originName: string;
  destination: string;
  destinationName: string;
  departureDate: string;
  returnDate: string;
  passengers: number;
  travelClass: string;
  tripType: 'roundtrip' | 'oneway';
}

interface FilterState {
  priceRange: [number, number];
  stops: string[];
  airlines: string[];
  departureTime: string[];
  arrivalTime: string[];
}

interface PopularRoute {
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  price: number;
  image: string;
}

// ============================================
// Constants
// ============================================

const TRAVEL_CLASSES = [
  { value: 'ECONOMY', label: '일반석', labelEn: 'Economy' },
  { value: 'PREMIUM_ECONOMY', label: '프리미엄 일반석', labelEn: 'Premium Economy' },
  { value: 'BUSINESS', label: '비즈니스석', labelEn: 'Business' },
  { value: 'FIRST', label: '일등석', labelEn: 'First' },
];

const POPULAR_AIRPORTS = [
  // Korea
  { code: 'ICN', city: '인천', cityEn: 'Seoul Incheon', country: '대한민국' },
  { code: 'GMP', city: '김포', cityEn: 'Seoul Gimpo', country: '대한민국' },
  { code: 'PUS', city: '부산', cityEn: 'Busan', country: '대한민국' },
  { code: 'CJU', city: '제주', cityEn: 'Jeju', country: '대한민국' },
  // Japan
  { code: 'NRT', city: '도쿄 나리타', cityEn: 'Tokyo Narita', country: '일본' },
  { code: 'HND', city: '도쿄 하네다', cityEn: 'Tokyo Haneda', country: '일본' },
  { code: 'KIX', city: '오사카', cityEn: 'Osaka Kansai', country: '일본' },
  { code: 'FUK', city: '후쿠오카', cityEn: 'Fukuoka', country: '일본' },
  { code: 'CTS', city: '삿포로', cityEn: 'Sapporo', country: '일본' },
  { code: 'OKA', city: '오키나와', cityEn: 'Okinawa', country: '일본' },
  // China
  { code: 'PEK', city: '베이징', cityEn: 'Beijing', country: '중국' },
  { code: 'PVG', city: '상하이 푸동', cityEn: 'Shanghai Pudong', country: '중국' },
  { code: 'HKG', city: '홍콩', cityEn: 'Hong Kong', country: '홍콩' },
  // Southeast Asia
  { code: 'BKK', city: '방콕', cityEn: 'Bangkok', country: '태국' },
  { code: 'SGN', city: '호치민', cityEn: 'Ho Chi Minh', country: '베트남' },
  { code: 'HAN', city: '하노이', cityEn: 'Hanoi', country: '베트남' },
  { code: 'DAD', city: '다낭', cityEn: 'Da Nang', country: '베트남' },
  { code: 'SIN', city: '싱가포르', cityEn: 'Singapore', country: '싱가포르' },
  { code: 'MNL', city: '마닐라', cityEn: 'Manila', country: '필리핀' },
  { code: 'CEB', city: '세부', cityEn: 'Cebu', country: '필리핀' },
  { code: 'DPS', city: '발리', cityEn: 'Bali', country: '인도네시아' },
  { code: 'KUL', city: '쿠알라룸푸르', cityEn: 'Kuala Lumpur', country: '말레이시아' },
  // Americas
  { code: 'LAX', city: '로스앤젤레스', cityEn: 'Los Angeles', country: '미국' },
  { code: 'JFK', city: '뉴욕', cityEn: 'New York JFK', country: '미국' },
  { code: 'SFO', city: '샌프란시스코', cityEn: 'San Francisco', country: '미국' },
  { code: 'SEA', city: '시애틀', cityEn: 'Seattle', country: '미국' },
  { code: 'HNL', city: '호놀룰루', cityEn: 'Honolulu', country: '미국' },
  { code: 'YVR', city: '밴쿠버', cityEn: 'Vancouver', country: '캐나다' },
  { code: 'YYZ', city: '토론토', cityEn: 'Toronto', country: '캐나다' },
  // Europe
  { code: 'CDG', city: '파리', cityEn: 'Paris CDG', country: '프랑스' },
  { code: 'LHR', city: '런던', cityEn: 'London Heathrow', country: '영국' },
  { code: 'FRA', city: '프랑크푸르트', cityEn: 'Frankfurt', country: '독일' },
  { code: 'AMS', city: '암스테르담', cityEn: 'Amsterdam', country: '네덜란드' },
  { code: 'FCO', city: '로마', cityEn: 'Rome', country: '이탈리아' },
  { code: 'BCN', city: '바르셀로나', cityEn: 'Barcelona', country: '스페인' },
  { code: 'MAD', city: '마드리드', cityEn: 'Madrid', country: '스페인' },
  { code: 'IST', city: '이스탄불', cityEn: 'Istanbul', country: '튀르키예' },
  // Oceania
  { code: 'SYD', city: '시드니', cityEn: 'Sydney', country: '호주' },
  { code: 'MEL', city: '멜버른', cityEn: 'Melbourne', country: '호주' },
  { code: 'AKL', city: '오클랜드', cityEn: 'Auckland', country: '뉴질랜드' },
  // Middle East
  { code: 'DXB', city: '두바이', cityEn: 'Dubai', country: 'UAE' },
  { code: 'DOH', city: '도하', cityEn: 'Doha', country: '카타르' },
];

const POPULAR_ROUTES: PopularRoute[] = [
  { origin: 'ICN', originCity: '인천', destination: 'NRT', destinationCity: '도쿄', price: 189000, image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400' },
  { origin: 'ICN', originCity: '인천', destination: 'BKK', destinationCity: '방콕', price: 289000, image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400' },
  { origin: 'ICN', originCity: '인천', destination: 'DAD', destinationCity: '다낭', price: 199000, image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400' },
  { origin: 'ICN', originCity: '인천', destination: 'SIN', destinationCity: '싱가포르', price: 329000, image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400' },
  { origin: 'ICN', originCity: '인천', destination: 'HKG', destinationCity: '홍콩', price: 249000, image: 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=400' },
  { origin: 'ICN', originCity: '인천', destination: 'KIX', destinationCity: '오사카', price: 179000, image: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=400' },
];

const AIRLINES = [
  { code: 'KE', name: '대한항공', nameEn: 'Korean Air' },
  { code: 'OZ', name: '아시아나항공', nameEn: 'Asiana Airlines' },
  { code: 'LJ', name: '진에어', nameEn: 'Jin Air' },
  { code: 'TW', name: '티웨이항공', nameEn: "T'way Air" },
  { code: '7C', name: '제주항공', nameEn: 'Jeju Air' },
  { code: 'BX', name: '에어부산', nameEn: 'Air Busan' },
  { code: 'RS', name: '에어서울', nameEn: 'Air Seoul' },
  { code: 'ZE', name: '이스타항공', nameEn: 'Eastar Jet' },
  { code: 'JL', name: '일본항공', nameEn: 'Japan Airlines' },
  { code: 'NH', name: '전일본공수', nameEn: 'ANA' },
  { code: 'CX', name: '캐세이퍼시픽', nameEn: 'Cathay Pacific' },
  { code: 'SQ', name: '싱가포르항공', nameEn: 'Singapore Airlines' },
  { code: 'TG', name: '타이항공', nameEn: 'Thai Airways' },
  { code: 'VN', name: '베트남항공', nameEn: 'Vietnam Airlines' },
  { code: 'VJ', name: '비엣젯', nameEn: 'VietJet Air' },
  { code: 'CA', name: '중국국제항공', nameEn: 'Air China' },
  { code: 'MU', name: '중국동방항공', nameEn: 'China Eastern' },
  { code: 'EK', name: '에미레이트', nameEn: 'Emirates' },
  { code: 'QR', name: '카타르항공', nameEn: 'Qatar Airways' },
];

const TIME_SLOTS = [
  { id: 'early_morning', label: '새벽 (00:00-06:00)', icon: Moon, start: 0, end: 6 },
  { id: 'morning', label: '오전 (06:00-12:00)', icon: Sunrise, start: 6, end: 12 },
  { id: 'afternoon', label: '오후 (12:00-18:00)', icon: Sun, start: 12, end: 18 },
  { id: 'evening', label: '저녁 (18:00-24:00)', icon: Sunset, start: 18, end: 24 },
];

// ============================================
// Utility Functions
// ============================================

const formatPrice = (amount: number, currency: string = 'KRW') => {
  if (currency === 'KRW') {
    return `₩${Math.round(amount).toLocaleString()}`;
  }
  return `$${amount.toLocaleString()}`;
};

const formatDuration = (duration: string) => {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return duration;
  const hours = match[1] || '0';
  const minutes = match[2] || '0';
  return `${hours}시간 ${minutes}분`;
};

const formatDurationShort = (duration: string) => {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return duration;
  const hours = match[1] || '0';
  const minutes = match[2] || '0';
  return `${hours}h ${minutes}m`;
};

const getDurationMinutes = (duration: string): number => {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  return hours * 60 + minutes;
};

const getTimeHour = (timeStr: string): number => {
  const match = timeStr.match(/^(\d{1,2}):/);
  return match ? parseInt(match[1]) : 0;
};

const getDefaultDates = () => {
  const today = new Date();
  const departure = new Date(today);
  departure.setDate(today.getDate() + 14);
  const returnDate = new Date(departure);
  returnDate.setDate(departure.getDate() + 7);

  return {
    departure: departure.toISOString().split('T')[0],
    return: returnDate.toISOString().split('T')[0],
  };
};

// ============================================
// Airport Search Component
// ============================================

function AirportSearch({
  value,
  displayValue,
  placeholder,
  onSelect,
  label,
}: {
  value: string;
  displayValue: string;
  placeholder: string;
  onSelect: (code: string, name: string) => void;
  label: string;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<typeof POPULAR_AIRPORTS>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 1) {
      setResults(POPULAR_AIRPORTS.slice(0, 15));
      return;
    }

    const searchTerm = query.toLowerCase();
    const filtered = POPULAR_AIRPORTS.filter(
      (airport) =>
        airport.code.toLowerCase().includes(searchTerm) ||
        airport.city.toLowerCase().includes(searchTerm) ||
        airport.cityEn.toLowerCase().includes(searchTerm) ||
        airport.country.toLowerCase().includes(searchTerm)
    );
    setResults(filtered);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative flex-1">
      <label className="text-neutral-600 text-xs font-medium mb-1 block">{label}</label>
      <div className="relative">
        <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171717]" />
        <input
          type="text"
          value={isOpen ? query : displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setQuery('');
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-200 hover:border-[#171717]/30 focus:border-[#171717] focus:ring-2 focus:ring-[#171717]/10 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-all text-sm font-medium"
        />
        {isOpen && (
          <button
            onClick={() => {
              setIsOpen(false);
              setQuery('');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-100 rounded-full"
          >
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-neutral-200 overflow-hidden z-50 max-h-72 overflow-y-auto"
          >
            {results.length > 0 ? (
              results.map((airport) => (
                <button
                  key={airport.code}
                  onClick={() => {
                    onSelect(airport.code, `${airport.city} (${airport.code})`);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-[#171717]/5 transition-colors flex items-center gap-3 border-b border-neutral-100 last:border-0"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#171717]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#171717] text-xs font-bold">{airport.code}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-900 text-sm">{airport.city}</span>
                      <span className="text-neutral-400 text-xs">{airport.cityEn}</span>
                    </div>
                    <p className="text-neutral-500 text-xs">{airport.country}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-neutral-500 text-sm">
                검색 결과가 없습니다
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Search Bar Component
// ============================================

function SearchBar({
  searchParams,
  setSearchParams,
  onSearch,
  isLoading,
}: {
  searchParams: SearchParams;
  setSearchParams: (params: SearchParams) => void;
  onSearch: () => void;
  isLoading: boolean;
}) {
  const swapLocations = () => {
    setSearchParams({
      ...searchParams,
      origin: searchParams.destination,
      originName: searchParams.destinationName,
      destination: searchParams.origin,
      destinationName: searchParams.originName,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-neutral-200 p-4">
      {/* Trip Type Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSearchParams({ ...searchParams, tripType: 'roundtrip' })}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            searchParams.tripType === 'roundtrip'
              ? 'bg-[#171717] text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4 inline-block mr-1.5" />
          왕복
        </button>
        <button
          onClick={() => setSearchParams({ ...searchParams, tripType: 'oneway' })}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            searchParams.tripType === 'oneway'
              ? 'bg-[#171717] text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          <ArrowRight className="w-4 h-4 inline-block mr-1.5" />
          편도
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        {/* Origin & Destination */}
        <div className="flex flex-1 gap-2 items-end">
          <AirportSearch
            value={searchParams.origin}
            displayValue={searchParams.originName}
            placeholder="출발지"
            label="출발"
            onSelect={(code, name) => setSearchParams({ ...searchParams, origin: code, originName: name })}
          />

          <button
            onClick={swapLocations}
            className="mb-1 p-2 bg-neutral-100 hover:bg-[#171717]/5 rounded-lg transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4 text-neutral-600" />
          </button>

          <AirportSearch
            value={searchParams.destination}
            displayValue={searchParams.destinationName}
            placeholder="도착지"
            label="도착"
            onSelect={(code, name) => setSearchParams({ ...searchParams, destination: code, destinationName: name })}
          />
        </div>

        {/* Dates */}
        <div className="flex gap-2 lg:w-64">
          <div className="flex-1">
            <label className="text-neutral-600 text-xs font-medium mb-1 block">출발일</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171717]" />
              <input
                type="date"
                value={searchParams.departureDate}
                onChange={(e) => setSearchParams({ ...searchParams, departureDate: e.target.value })}
                className="w-full pl-10 pr-2 py-3 bg-white border border-neutral-200 hover:border-[#171717]/30 focus:border-[#171717] focus:ring-2 focus:ring-[#171717]/10 rounded-lg text-neutral-900 focus:outline-none transition-all text-sm"
              />
            </div>
          </div>
          {searchParams.tripType === 'roundtrip' && (
            <div className="flex-1">
              <label className="text-neutral-600 text-xs font-medium mb-1 block">귀국일</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171717]" />
                <input
                  type="date"
                  value={searchParams.returnDate}
                  onChange={(e) => setSearchParams({ ...searchParams, returnDate: e.target.value })}
                  className="w-full pl-10 pr-2 py-3 bg-white border border-neutral-200 hover:border-[#171717]/30 focus:border-[#171717] focus:ring-2 focus:ring-[#171717]/10 rounded-lg text-neutral-900 focus:outline-none transition-all text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Passengers & Class */}
        <div className="flex gap-2 lg:w-48">
          <div className="flex-1">
            <label className="text-neutral-600 text-xs font-medium mb-1 block">승객</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171717]" />
              <select
                value={searchParams.passengers}
                onChange={(e) => setSearchParams({ ...searchParams, passengers: Number(e.target.value) })}
                className="w-full pl-10 pr-8 py-3 bg-white border border-neutral-200 hover:border-[#171717]/30 focus:border-[#171717] focus:ring-2 focus:ring-[#171717]/10 rounded-lg text-neutral-900 focus:outline-none transition-all text-sm appearance-none cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <option key={n} value={n}>{n}명</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Search Button */}
        <div className="flex items-end">
          <button
            onClick={onSearch}
            disabled={isLoading}
            className="w-full lg:w-auto px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            검색
          </button>
        </div>
      </div>

      {/* Class Selector */}
      <div className="mt-3 flex items-center gap-2">
        <Briefcase className="w-4 h-4 text-neutral-400" />
        <div className="flex gap-1">
          {TRAVEL_CLASSES.map((cls) => (
            <button
              key={cls.value}
              onClick={() => setSearchParams({ ...searchParams, travelClass: cls.value })}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                searchParams.travelClass === cls.value
                  ? 'bg-[#171717] text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {cls.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Filter Sidebar Component
// ============================================

function FilterSidebar({
  filters,
  setFilters,
  flights,
  minPrice,
  maxPrice,
}: {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  flights: Flight[];
  minPrice: number;
  maxPrice: number;
}) {
  const [isExpanded, setIsExpanded] = useState({
    price: true,
    stops: true,
    airlines: true,
    departureTime: true,
  });

  // Get unique airlines from flights
  const flightAirlines = useMemo(() => {
    const codes = [...new Set(flights.map((f) => f.carrier.code))];
    return AIRLINES.filter((a) => codes.includes(a.code));
  }, [flights]);

  const allAirlines = flightAirlines.length > 0 ? flightAirlines : AIRLINES.slice(0, 8);

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      <div className="p-4 border-b border-neutral-200 flex items-center gap-2">
        <SlidersHorizontal className="w-5 h-5 text-[#171717]" />
        <span className="font-semibold text-neutral-900">필터</span>
      </div>

      {/* Price Range */}
      <div className="border-b border-neutral-100">
        <button
          onClick={() => setIsExpanded({ ...isExpanded, price: !isExpanded.price })}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-50"
        >
          <span className="font-medium text-neutral-900 text-sm">가격</span>
          <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isExpanded.price ? 'rotate-180' : ''}`} />
        </button>
        {isExpanded.price && (
          <div className="px-4 pb-4">
            <div className="flex justify-between text-xs text-neutral-500 mb-2">
              <span>{formatPrice(filters.priceRange[0])}</span>
              <span>{formatPrice(filters.priceRange[1])}</span>
            </div>
            <input
              type="range"
              min={minPrice}
              max={maxPrice}
              value={filters.priceRange[1]}
              onChange={(e) => setFilters({ ...filters, priceRange: [minPrice, Number(e.target.value)] })}
              className="w-full accent-[#171717]"
            />
          </div>
        )}
      </div>

      {/* Stops */}
      <div className="border-b border-neutral-100">
        <button
          onClick={() => setIsExpanded({ ...isExpanded, stops: !isExpanded.stops })}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-50"
        >
          <span className="font-medium text-neutral-900 text-sm">경유</span>
          <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isExpanded.stops ? 'rotate-180' : ''}`} />
        </button>
        {isExpanded.stops && (
          <div className="px-4 pb-4 space-y-2">
            {[
              { id: 'direct', label: '직항' },
              { id: '1stop', label: '경유 1회' },
              { id: '2stop', label: '경유 2회 이상' },
            ].map((option) => (
              <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.stops.includes(option.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFilters({ ...filters, stops: [...filters.stops, option.id] });
                    } else {
                      setFilters({ ...filters, stops: filters.stops.filter((s) => s !== option.id) });
                    }
                  }}
                  className="w-4 h-4 rounded border-neutral-300 text-[#171717] focus:ring-[#171717]"
                />
                <span className="text-sm text-neutral-700">{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Departure Time */}
      <div className="border-b border-neutral-100">
        <button
          onClick={() => setIsExpanded({ ...isExpanded, departureTime: !isExpanded.departureTime })}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-50"
        >
          <span className="font-medium text-neutral-900 text-sm">출발 시간</span>
          <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isExpanded.departureTime ? 'rotate-180' : ''}`} />
        </button>
        {isExpanded.departureTime && (
          <div className="px-4 pb-4 grid grid-cols-2 gap-2">
            {TIME_SLOTS.map((slot) => {
              const Icon = slot.icon;
              const isSelected = filters.departureTime.includes(slot.id);
              return (
                <button
                  key={slot.id}
                  onClick={() => {
                    if (isSelected) {
                      setFilters({ ...filters, departureTime: filters.departureTime.filter((t) => t !== slot.id) });
                    } else {
                      setFilters({ ...filters, departureTime: [...filters.departureTime, slot.id] });
                    }
                  }}
                  className={`p-2 rounded-lg border text-xs flex flex-col items-center gap-1 transition-colors ${
                    isSelected
                      ? 'border-[#171717] bg-[#171717]/5 text-[#171717]'
                      : 'border-neutral-200 hover:border-[#171717]/30 text-neutral-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-center leading-tight">{slot.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Airlines */}
      <div>
        <button
          onClick={() => setIsExpanded({ ...isExpanded, airlines: !isExpanded.airlines })}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-50"
        >
          <span className="font-medium text-neutral-900 text-sm">항공사</span>
          <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isExpanded.airlines ? 'rotate-180' : ''}`} />
        </button>
        {isExpanded.airlines && (
          <div className="px-4 pb-4 space-y-2 max-h-60 overflow-y-auto">
            {allAirlines.map((airline) => (
              <label key={airline.code} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.airlines.includes(airline.code)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFilters({ ...filters, airlines: [...filters.airlines, airline.code] });
                    } else {
                      setFilters({ ...filters, airlines: filters.airlines.filter((a) => a !== airline.code) });
                    }
                  }}
                  className="w-4 h-4 rounded border-neutral-300 text-[#171717] focus:ring-[#171717]"
                />
                <span className="text-sm text-neutral-700">{airline.name}</span>
                <span className="text-xs text-neutral-400 ml-auto">{airline.code}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Clear Filters */}
      {(filters.stops.length > 0 || filters.airlines.length > 0 || filters.departureTime.length > 0 || filters.priceRange[1] < maxPrice) && (
        <div className="p-4 border-t border-neutral-200">
          <button
            onClick={() => setFilters({
              priceRange: [minPrice, maxPrice],
              stops: [],
              airlines: [],
              departureTime: [],
              arrivalTime: [],
            })}
            className="w-full py-2 text-[#171717] hover:text-[#171717] text-sm font-medium"
          >
            필터 초기화
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// Flight Card Component
// ============================================

function FlightCard({
  flight,
  onSelect,
  isLowest,
  isFastest,
}: {
  flight: Flight;
  onSelect: (flight: Flight) => void;
  isLowest?: boolean;
  isFastest?: boolean;
}) {
  const [imageError, setImageError] = useState(false);

  const getStopsText = (stops: number) => {
    if (stops === 0) return '직항';
    return `경유 ${stops}회`;
  };

  const getStopsColor = (stops: number) => {
    if (stops === 0) return 'text-green-600';
    if (stops === 1) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-neutral-200 hover:border-[#171717]/30 hover:shadow-lg transition-all overflow-hidden"
    >
      {/* Badges */}
      {(isLowest || isFastest) && (
        <div className="flex gap-2 px-4 pt-3">
          {isLowest && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
              <TrendingUp className="w-3 h-3" />
              최저가
            </span>
          )}
          {isFastest && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#171717]/10 text-[#171717] rounded text-xs font-medium">
              <Zap className="w-3 h-3" />
              최단시간
            </span>
          )}
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center gap-4">
          {/* Airline Logo & Info */}
          <div className="flex items-center gap-3 w-36 flex-shrink-0">
            {flight.carrier.logo && !imageError ? (
              <Image
                src={flight.carrier.logo}
                alt={flight.carrier.name}
                width={40}
                height={40}
                className="rounded"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-10 h-10 rounded bg-neutral-100 flex items-center justify-center">
                <Plane className="w-5 h-5 text-neutral-400" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-neutral-900 font-medium text-sm truncate">{flight.carrier.name}</p>
              <p className="text-neutral-400 text-xs">{flight.carrier.code}</p>
            </div>
          </div>

          {/* Flight Times */}
          <div className="flex-1 flex items-center gap-4">
            {/* Departure */}
            <div className="text-center">
              <p className="text-neutral-900 text-xl font-bold">{flight.departure.time}</p>
              <p className="text-neutral-500 text-xs">{flight.origin.code}</p>
            </div>

            {/* Duration Line */}
            <div className="flex-1 flex flex-col items-center px-4">
              <p className="text-neutral-400 text-xs mb-1">{formatDurationShort(flight.duration)}</p>
              <div className="relative w-full h-[2px] bg-neutral-200">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-neutral-400" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-neutral-400" />
                {flight.stops > 0 && (
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-orange-400" />
                )}
              </div>
              <p className={`text-xs mt-1 font-medium ${getStopsColor(flight.stops)}`}>
                {getStopsText(flight.stops)}
              </p>
              {flight.stopLocations && flight.stopLocations.length > 0 && (
                <p className="text-neutral-400 text-xs">{flight.stopLocations.join(', ')}</p>
              )}
            </div>

            {/* Arrival */}
            <div className="text-center">
              <p className="text-neutral-900 text-xl font-bold">{flight.arrival.time}</p>
              <p className="text-neutral-500 text-xs">{flight.destination.code}</p>
            </div>
          </div>

          {/* Price & Book */}
          <div className="w-40 flex-shrink-0 text-right">
            <p className="text-orange-500 text-2xl font-bold">
              {formatPrice(flight.price.amount, flight.price.currency)}
            </p>
            <p className="text-neutral-400 text-xs mb-2">1인 기준</p>
            {flight.seatsLeft && flight.seatsLeft <= 10 && (
              <p className="text-red-500 text-xs mb-2">잔여 {flight.seatsLeft}석</p>
            )}
            <button
              onClick={() => onSelect(flight)}
              className="w-full py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-white text-sm font-semibold transition-colors"
            >
              선택
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// Popular Routes Component
// ============================================

function PopularRoutes({
  onSelect,
}: {
  onSelect: (origin: string, originCity: string, destination: string, destinationCity: string) => void;
}) {
  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
        <Star className="w-5 h-5 text-orange-500" />
        인기 노선
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {POPULAR_ROUTES.map((route, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(route.origin, route.originCity, route.destination, route.destinationCity)}
            className="group relative aspect-[4/3] rounded-xl overflow-hidden"
          >
            <Image
              src={route.image}
              alt={route.destinationCity}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-white font-semibold text-sm">
                {route.originCity} → {route.destinationCity}
              </p>
              <p className="text-white/80 text-xs">
                {formatPrice(route.price)}~
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Main Page
// ============================================

export default function FlightsPage() {
  const locale = useLocale();
  const router = useRouter();
  const { departure: defaultDeparture, return: defaultReturn } = getDefaultDates();

  const [searchParams, setSearchParams] = useState<SearchParams>({
    origin: 'ICN',
    originName: '인천 (ICN)',
    destination: 'NRT',
    destinationName: '도쿄 나리타 (NRT)',
    departureDate: defaultDeparture,
    returnDate: defaultReturn,
    passengers: 1,
    travelClass: 'ECONOMY',
    tripType: 'roundtrip',
  });

  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string>('');
  const [sortBy, setSortBy] = useState<'price' | 'duration' | 'departure'>('price');
  const [hasSearched, setHasSearched] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const minPrice = useMemo(() => flights.length > 0 ? Math.min(...flights.map((f) => f.price.amount)) : 0, [flights]);
  const maxPrice = useMemo(() => flights.length > 0 ? Math.max(...flights.map((f) => f.price.amount)) : 1000000, [flights]);

  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 10000000],
    stops: [],
    airlines: [],
    departureTime: [],
    arrivalTime: [],
  });

  // Reset price range when flights change
  useEffect(() => {
    if (flights.length > 0) {
      setFilters((prev) => ({
        ...prev,
        priceRange: [minPrice, maxPrice],
      }));
    }
  }, [flights, minPrice, maxPrice]);

  const fetchFlights = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({
        origin: searchParams.origin,
        destination: searchParams.destination,
        departureDate: searchParams.departureDate,
        adults: searchParams.passengers.toString(),
        travelClass: searchParams.travelClass,
        sortBy,
        ...(searchParams.tripType === 'roundtrip' && { returnDate: searchParams.returnDate }),
      });

      const response = await fetch(`/api/flights/search?${params}`);
      const data = await response.json();

      if (data.success) {
        setFlights(data.flights);
        setDataSource(data.source);
      } else {
        setError(data.error || '검색에 실패했습니다');
      }
    } catch (err) {
      console.error('Flight search error:', err);
      setError('네트워크 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, sortBy]);

  const handleSearch = () => {
    fetchFlights();
  };

  const handlePopularRouteSelect = (origin: string, originCity: string, destination: string, destinationCity: string) => {
    setSearchParams({
      ...searchParams,
      origin,
      originName: `${originCity} (${origin})`,
      destination,
      destinationName: `${destinationCity} (${destination})`,
    });
  };

  const handleSelectFlight = (flight: Flight) => {
    const bookingItem = {
      type: 'flight' as const,
      id: flight.id,
      name: `${flight.carrier.name} ${flight.carrier.code}`,
      details: {
        origin: flight.origin.code,
        destination: flight.destination.code,
        date: flight.departure.date,
        time: flight.departure.time,
        duration: formatDuration(flight.duration),
        carrier: flight.carrier.name,
      },
      price: {
        base: flight.price.amount * 0.97,
        markup: flight.price.amount * 0.03,
        total: flight.price.amount,
        currency: flight.price.currency,
      },
    };

    const itemParam = encodeURIComponent(JSON.stringify(bookingItem));
    router.push(`/${locale}/checkout?type=flight&item=${itemParam}`);
  };

  // Apply filters
  const filteredFlights = useMemo(() => {
    return flights.filter((flight) => {
      // Price filter
      if (flight.price.amount < filters.priceRange[0] || flight.price.amount > filters.priceRange[1]) {
        return false;
      }

      // Stops filter
      if (filters.stops.length > 0) {
        const matchesStops =
          (filters.stops.includes('direct') && flight.stops === 0) ||
          (filters.stops.includes('1stop') && flight.stops === 1) ||
          (filters.stops.includes('2stop') && flight.stops >= 2);
        if (!matchesStops) return false;
      }

      // Airlines filter
      if (filters.airlines.length > 0 && !filters.airlines.includes(flight.carrier.code)) {
        return false;
      }

      // Departure time filter
      if (filters.departureTime.length > 0) {
        const hour = getTimeHour(flight.departure.time);
        const matchesTime = filters.departureTime.some((slot) => {
          const timeSlot = TIME_SLOTS.find((t) => t.id === slot);
          return timeSlot && hour >= timeSlot.start && hour < timeSlot.end;
        });
        if (!matchesTime) return false;
      }

      return true;
    });
  }, [flights, filters]);

  // Sort flights
  const sortedFlights = useMemo(() => {
    const sorted = [...filteredFlights];
    switch (sortBy) {
      case 'price':
        sorted.sort((a, b) => a.price.amount - b.price.amount);
        break;
      case 'duration':
        sorted.sort((a, b) => getDurationMinutes(a.duration) - getDurationMinutes(b.duration));
        break;
      case 'departure':
        sorted.sort((a, b) => a.departure.time.localeCompare(b.departure.time));
        break;
    }
    return sorted;
  }, [filteredFlights, sortBy]);

  const lowestPrice = sortedFlights.length > 0 ? Math.min(...sortedFlights.map((f) => f.price.amount)) : 0;
  const fastestDuration = sortedFlights.length > 0 ? Math.min(...sortedFlights.map((f) => getDurationMinutes(f.duration))) : 0;

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/${locale}/dashboard`}>
                <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                  <ArrowLeft className="w-5 h-5 text-neutral-600" />
                </button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#171717] flex items-center justify-center">
                  <Plane className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-neutral-900">항공권 검색</h1>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="hidden md:flex items-center gap-2 text-neutral-500">
                <Globe className="w-4 h-4 text-[#171717]" />
                <span>전세계 500+ 항공사</span>
              </div>
              <div className="hidden md:flex items-center gap-2 text-neutral-500">
                <Shield className="w-4 h-4 text-green-600" />
                <span>최저가 보장</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <section className="bg-[#171717] py-6">
        <div className="max-w-7xl mx-auto px-4">
          <SearchBar
            searchParams={searchParams}
            setSearchParams={setSearchParams}
            onSearch={handleSearch}
            isLoading={isLoading}
          />
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Error Notice */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded-xl flex items-start gap-3 border border-red-200">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {hasSearched ? (
          <div className="flex gap-6">
            {/* Filters Sidebar - Desktop */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <FilterSidebar
                filters={filters}
                setFilters={setFilters}
                flights={flights}
                minPrice={minPrice}
                maxPrice={maxPrice}
              />
            </div>

            {/* Results */}
            <div className="flex-1">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Mobile Filter Button */}
                  <button
                    onClick={() => setShowMobileFilters(true)}
                    className="lg:hidden flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm"
                  >
                    <Filter className="w-4 h-4" />
                    필터
                  </button>

                  <div>
                    <p className="text-neutral-900 font-semibold">
                      {searchParams.originName.split(' (')[0]} → {searchParams.destinationName.split(' (')[0]}
                    </p>
                    <p className="text-neutral-500 text-sm">
                      {sortedFlights.length}개 항공편
                      {sortedFlights.length > 0 && ` • 최저 ${formatPrice(lowestPrice)}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Data Source Badge */}
                  <div className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
                    dataSource === 'amadeus'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      dataSource === 'amadeus' ? 'bg-green-500' : 'bg-orange-500'
                    } animate-pulse`} />
                    {dataSource === 'amadeus' ? '실시간' : '샘플'}
                  </div>

                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-[#171717]"
                  >
                    <option value="price">가격순</option>
                    <option value="duration">소요시간순</option>
                    <option value="departure">출발시간순</option>
                  </select>

                  <button
                    onClick={fetchFlights}
                    disabled={isLoading}
                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    <RefreshCw className={`w-5 h-5 text-neutral-500 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Flight List */}
              <div className="space-y-3">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 animate-pulse border border-neutral-200">
                      <div className="flex items-center gap-4">
                        <div className="w-36 flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-neutral-200" />
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-neutral-200 rounded w-20" />
                            <div className="h-3 bg-neutral-200 rounded w-10" />
                          </div>
                        </div>
                        <div className="flex-1 flex items-center gap-4">
                          <div className="h-6 bg-neutral-200 rounded w-16" />
                          <div className="flex-1 h-1 bg-neutral-200" />
                          <div className="h-6 bg-neutral-200 rounded w-16" />
                        </div>
                        <div className="w-40 space-y-2">
                          <div className="h-8 bg-neutral-200 rounded w-full" />
                          <div className="h-8 bg-neutral-200 rounded w-full" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : sortedFlights.length > 0 ? (
                  sortedFlights.map((flight) => (
                    <FlightCard
                      key={flight.id}
                      flight={flight}
                      onSelect={handleSelectFlight}
                      isLowest={flight.price.amount === lowestPrice}
                      isFastest={getDurationMinutes(flight.duration) === fastestDuration}
                    />
                  ))
                ) : (
                  <div className="py-16 text-center bg-white rounded-xl border border-neutral-200">
                    <Plane className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
                    <p className="text-neutral-900 font-semibold">검색 결과가 없습니다</p>
                    <p className="text-neutral-500 mt-2 text-sm">다른 날짜나 조건을 선택해보세요</p>
                  </div>
                )}
              </div>

              {/* Price Notice */}
              {sortedFlights.length > 0 && (
                <div className="mt-6 p-4 bg-neutral-100 rounded-xl flex items-start gap-3">
                  <Shield className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-0.5" />
                  <p className="text-neutral-600 text-sm">
                    표시된 가격은 1인 기준이며, 세금 및 수수료가 포함되어 있습니다.
                    실제 결제 금액은 환율 변동에 따라 달라질 수 있습니다.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Initial State - Popular Routes */
          <div>
            <div className="text-center py-12">
              <Plane className="w-16 h-16 text-[#171717]/30 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-neutral-900 mb-2">어디로 떠나시나요?</h2>
              <p className="text-neutral-500">전세계 500개 이상의 항공사에서 최저가를 비교하세요</p>
            </div>
            <PopularRoutes onSelect={handlePopularRouteSelect} />
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-neutral-400 text-sm">
            Powered by Amadeus Global Travel API
          </p>
        </div>
      </main>

      {/* Mobile Filters Modal */}
      <AnimatePresence>
        {showMobileFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={() => setShowMobileFilters(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="absolute left-0 top-0 bottom-0 w-80 max-w-[85%] bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-neutral-200">
                <h2 className="font-semibold text-neutral-900">필터</h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 hover:bg-neutral-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto h-[calc(100%-60px)]">
                <FilterSidebar
                  filters={filters}
                  setFilters={setFilters}
                  flights={flights}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
