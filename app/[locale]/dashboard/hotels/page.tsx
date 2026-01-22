/**
 * K-UNIVERSAL Hotel Search - HotelsCombined Style
 * Professional metasearch experience with price comparison
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  Search,
  Calendar,
  Users,
  Star,
  Loader2,
  MapPin,
  ChevronDown,
  SlidersHorizontal,
  X,
  Building2,
  Plane,
  Banknote,
  Wifi,
  Car,
  Coffee,
  Waves,
  Dumbbell,
  UtensilsCrossed,
  Check,
  ArrowUpDown,
  Map,
  List,
  Heart,
  ExternalLink,
  BadgeCheck,
  TrendingDown,
  Globe,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface Hotel {
  id: string;
  name: string;
  brand?: string;
  starRating: number;
  location: {
    city: string;
    cityKo: string;
    country: string;
    countryKo: string;
    latitude: number;
    longitude: number;
    district?: string;
  };
  images: {
    main: string;
    gallery: string[];
  };
  amenities: string[];
  pricing: {
    displayPrice: number;
    naverPrice: number;
    wholesalePrice: number;
    margin: number;
    marginPercent: number;
    currency: string;
    pricePerNight: number;
    isNaverMatched: boolean;
    naverProvider?: string;
    priceSource: string;
  };
  reviews: {
    score: number;
    count: number;
    sentiment: 'excellent' | 'very_good' | 'good' | 'fair';
  };
  features: {
    breakfastIncluded: boolean;
    freeCancellation: boolean;
    payAtProperty: boolean;
    instantConfirmation: boolean;
  };
  affiliateLink: string;
  isAvailable: boolean;
  unavailableReason?: string;
}

interface SearchMeta {
  destination: string;
  destinationKo: string;
  nights: number;
  totalResults: number;
  availableResults: number;
  naverMatchedCount: number;
  lowestPrice: number;
  averagePrice: number;
}

interface CityOption {
  code: string;
  name: string;
  nameKo: string;
  country: string;
  countryKo: string;
  region: string;
  popular?: boolean;
  image?: string;
}

// ============================================
// Constants - Worldwide Cities
// ============================================

const CITIES: CityOption[] = [
  // Asia - Popular
  { code: 'TYO', name: 'Tokyo', nameKo: '도쿄', country: 'Japan', countryKo: '일본', region: '아시아', popular: true, image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80' },
  { code: 'OSA', name: 'Osaka', nameKo: '오사카', country: 'Japan', countryKo: '일본', region: '아시아', popular: true, image: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=400&q=80' },
  { code: 'BKK', name: 'Bangkok', nameKo: '방콕', country: 'Thailand', countryKo: '태국', region: '아시아', popular: true, image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&q=80' },
  { code: 'SIN', name: 'Singapore', nameKo: '싱가포르', country: 'Singapore', countryKo: '싱가포르', region: '아시아', popular: true, image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80' },
  { code: 'HKG', name: 'Hong Kong', nameKo: '홍콩', country: 'Hong Kong', countryKo: '홍콩', region: '아시아', popular: true, image: 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=400&q=80' },
  { code: 'DPS', name: 'Bali', nameKo: '발리', country: 'Indonesia', countryKo: '인도네시아', region: '아시아', popular: true, image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80' },
  // Asia - Others
  { code: 'FUK', name: 'Fukuoka', nameKo: '후쿠오카', country: 'Japan', countryKo: '일본', region: '아시아', image: 'https://images.unsplash.com/photo-1578271887552-5ac3a72752bc?w=400&q=80' },
  { code: 'KIX', name: 'Kyoto', nameKo: '교토', country: 'Japan', countryKo: '일본', region: '아시아' },
  { code: 'TPE', name: 'Taipei', nameKo: '타이페이', country: 'Taiwan', countryKo: '대만', region: '아시아', image: 'https://images.unsplash.com/photo-1470004914212-05527e49370b?w=400&q=80' },
  { code: 'SGN', name: 'Ho Chi Minh', nameKo: '호치민', country: 'Vietnam', countryKo: '베트남', region: '아시아', image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&q=80' },
  { code: 'HAN', name: 'Hanoi', nameKo: '하노이', country: 'Vietnam', countryKo: '베트남', region: '아시아' },
  { code: 'MNL', name: 'Manila', nameKo: '마닐라', country: 'Philippines', countryKo: '필리핀', region: '아시아' },
  { code: 'CEB', name: 'Cebu', nameKo: '세부', country: 'Philippines', countryKo: '필리핀', region: '아시아' },
  { code: 'KUL', name: 'Kuala Lumpur', nameKo: '쿠알라룸푸르', country: 'Malaysia', countryKo: '말레이시아', region: '아시아' },
  { code: 'PEK', name: 'Beijing', nameKo: '베이징', country: 'China', countryKo: '중국', region: '아시아' },
  { code: 'SHA', name: 'Shanghai', nameKo: '상하이', country: 'China', countryKo: '중국', region: '아시아' },
  { code: 'DEL', name: 'New Delhi', nameKo: '뉴델리', country: 'India', countryKo: '인도', region: '아시아' },
  // Europe
  { code: 'PAR', name: 'Paris', nameKo: '파리', country: 'France', countryKo: '프랑스', region: '유럽', popular: true, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80' },
  { code: 'LON', name: 'London', nameKo: '런던', country: 'UK', countryKo: '영국', region: '유럽', popular: true, image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=80' },
  { code: 'ROM', name: 'Rome', nameKo: '로마', country: 'Italy', countryKo: '이탈리아', region: '유럽', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=80' },
  { code: 'BCN', name: 'Barcelona', nameKo: '바르셀로나', country: 'Spain', countryKo: '스페인', region: '유럽' },
  { code: 'AMS', name: 'Amsterdam', nameKo: '암스테르담', country: 'Netherlands', countryKo: '네덜란드', region: '유럽' },
  { code: 'VIE', name: 'Vienna', nameKo: '비엔나', country: 'Austria', countryKo: '오스트리아', region: '유럽' },
  { code: 'PRG', name: 'Prague', nameKo: '프라하', country: 'Czech', countryKo: '체코', region: '유럽' },
  { code: 'IST', name: 'Istanbul', nameKo: '이스탄불', country: 'Turkey', countryKo: '터키', region: '유럽' },
  // Americas
  { code: 'NYC', name: 'New York', nameKo: '뉴욕', country: 'USA', countryKo: '미국', region: '미주', popular: true, image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&q=80' },
  { code: 'LAX', name: 'Los Angeles', nameKo: '로스앤젤레스', country: 'USA', countryKo: '미국', region: '미주' },
  { code: 'LAS', name: 'Las Vegas', nameKo: '라스베가스', country: 'USA', countryKo: '미국', region: '미주' },
  { code: 'SFO', name: 'San Francisco', nameKo: '샌프란시스코', country: 'USA', countryKo: '미국', region: '미주' },
  { code: 'MIA', name: 'Miami', nameKo: '마이애미', country: 'USA', countryKo: '미국', region: '미주' },
  { code: 'CUN', name: 'Cancun', nameKo: '칸쿤', country: 'Mexico', countryKo: '멕시코', region: '미주' },
  // Oceania & Middle East
  { code: 'SYD', name: 'Sydney', nameKo: '시드니', country: 'Australia', countryKo: '호주', region: '오세아니아', image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&q=80' },
  { code: 'DXB', name: 'Dubai', nameKo: '두바이', country: 'UAE', countryKo: 'UAE', region: '중동', popular: true, image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80' },
];

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  'WiFi': <Wifi className="w-4 h-4" />,
  'Free WiFi': <Wifi className="w-4 h-4" />,
  'Parking': <Car className="w-4 h-4" />,
  'Free Parking': <Car className="w-4 h-4" />,
  'Breakfast': <Coffee className="w-4 h-4" />,
  'Pool': <Waves className="w-4 h-4" />,
  'Fitness Center': <Dumbbell className="w-4 h-4" />,
  'Restaurant': <UtensilsCrossed className="w-4 h-4" />,
};

// ============================================
// Utility Functions
// ============================================

const formatPrice = (amount: number) => `₩${amount.toLocaleString('ko-KR')}`;

const formatDate = (date: string) => {
  const d = new Date(date);
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });
};

const getDefaultDates = () => {
  const today = new Date();
  const checkIn = new Date(today);
  checkIn.setDate(today.getDate() + 7);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkIn.getDate() + 2);
  return {
    checkIn: checkIn.toISOString().split('T')[0],
    checkOut: checkOut.toISOString().split('T')[0],
  };
};

const getScoreLabel = (score: number) => {
  if (score >= 9) return '최고';
  if (score >= 8) return '우수';
  if (score >= 7) return '좋음';
  return '보통';
};

const getScoreColor = (score: number) => {
  if (score >= 9) return 'bg-emerald-500';
  if (score >= 8) return 'bg-blue-500';
  if (score >= 7) return 'bg-yellow-500';
  return 'bg-gray-400';
};

// ============================================
// Search Bar Component
// ============================================

function SearchBar({
  destination,
  destinationDisplay,
  checkIn,
  checkOut,
  guests,
  rooms,
  onDestinationClick,
  onCheckInChange,
  onCheckOutChange,
  onGuestsChange,
  onRoomsChange,
  onSearch,
  isLoading,
}: {
  destination: string;
  destinationDisplay: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  onDestinationClick: () => void;
  onCheckInChange: (date: string) => void;
  onCheckOutChange: (date: string) => void;
  onGuestsChange: (n: number) => void;
  onRoomsChange: (n: number) => void;
  onSearch: () => void;
  isLoading: boolean;
}) {
  const [showGuestPicker, setShowGuestPicker] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2">
      <div className="flex flex-col lg:flex-row lg:items-center gap-2">
        {/* Destination */}
        <button
          onClick={onDestinationClick}
          className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
        >
          <MapPin className="w-5 h-5 text-[#0891b2]" />
          <div>
            <p className="text-xs text-gray-400 font-medium">목적지</p>
            <p className="text-gray-900 font-semibold">{destinationDisplay || '어디로 가시나요?'}</p>
          </div>
        </button>

        <div className="hidden lg:block w-px h-12 bg-gray-200" />

        {/* Check-in */}
        <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors">
          <Calendar className="w-5 h-5 text-[#0891b2]" />
          <div className="flex-1">
            <p className="text-xs text-gray-400 font-medium">체크인</p>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => onCheckInChange(e.target.value)}
              className="text-gray-900 font-semibold bg-transparent border-none outline-none w-full cursor-pointer"
            />
          </div>
        </div>

        <div className="hidden lg:block w-px h-12 bg-gray-200" />

        {/* Check-out */}
        <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors">
          <Calendar className="w-5 h-5 text-[#0891b2]" />
          <div className="flex-1">
            <p className="text-xs text-gray-400 font-medium">체크아웃</p>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => onCheckOutChange(e.target.value)}
              min={checkIn}
              className="text-gray-900 font-semibold bg-transparent border-none outline-none w-full cursor-pointer"
            />
          </div>
        </div>

        <div className="hidden lg:block w-px h-12 bg-gray-200" />

        {/* Guests & Rooms */}
        <div className="relative flex-1">
          <button
            onClick={() => setShowGuestPicker(!showGuestPicker)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
          >
            <Users className="w-5 h-5 text-[#0891b2]" />
            <div>
              <p className="text-xs text-gray-400 font-medium">객실 및 인원</p>
              <p className="text-gray-900 font-semibold">객실 {rooms}개, 성인 {guests}명</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          <AnimatePresence>
            {showGuestPicker && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">객실</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onRoomsChange(Math.max(1, rooms - 1))}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-semibold">{rooms}</span>
                      <button
                        onClick={() => onRoomsChange(Math.min(10, rooms + 1))}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">성인</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onGuestsChange(Math.max(1, guests - 1))}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-semibold">{guests}</span>
                      <button
                        onClick={() => onGuestsChange(Math.min(20, guests + 1))}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowGuestPicker(false)}
                  className="w-full mt-4 py-2 bg-[#0891b2] text-white rounded-lg font-medium hover:bg-[#0e7490] transition-colors"
                >
                  완료
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search Button */}
        <button
          onClick={onSearch}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-[#0891b2] text-white rounded-xl font-semibold hover:bg-[#0e7490] transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span>검색</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================
// Filter Sidebar Component
// ============================================

function FilterSidebar({
  selectedStars,
  setSelectedStars,
  priceRange,
  setPriceRange,
  selectedAmenities,
  setSelectedAmenities,
  freeCancellation,
  setFreeCancellation,
  breakfastIncluded,
  setBreakfastIncluded,
}: {
  selectedStars: number[];
  setSelectedStars: (stars: number[]) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  selectedAmenities: string[];
  setSelectedAmenities: (amenities: string[]) => void;
  freeCancellation: boolean;
  setFreeCancellation: (v: boolean) => void;
  breakfastIncluded: boolean;
  setBreakfastIncluded: (v: boolean) => void;
}) {
  const amenityOptions = ['WiFi', 'Parking', 'Pool', 'Fitness Center', 'Restaurant'];

  return (
    <div className="w-72 flex-shrink-0 hidden lg:block">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
        <h3 className="text-lg font-bold text-gray-900 mb-6">필터</h3>

        {/* Price Range */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">1박 요금</h4>
          <div className="space-y-2">
            <input
              type="range"
              min={0}
              max={1000000}
              step={10000}
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
              className="w-full accent-[#0891b2]"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>{formatPrice(priceRange[0])}</span>
              <span>{formatPrice(priceRange[1])}+</span>
            </div>
          </div>
        </div>

        {/* Star Rating */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">호텔 등급</h4>
          <div className="flex gap-2">
            {[5, 4, 3, 2].map((star) => (
              <button
                key={star}
                onClick={() =>
                  setSelectedStars(
                    selectedStars.includes(star)
                      ? selectedStars.filter((s) => s !== star)
                      : [...selectedStars, star]
                  )
                }
                className={`flex items-center gap-1 px-3 py-2 rounded-lg border transition-all ${
                  selectedStars.includes(star)
                    ? 'bg-[#0891b2] border-[#0891b2] text-white'
                    : 'border-gray-200 text-gray-600 hover:border-[#0891b2]'
                }`}
              >
                {star}
                <Star className={`w-3 h-3 ${selectedStars.includes(star) ? 'fill-white' : ''}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Quick Filters */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">특별 조건</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={freeCancellation}
                onChange={(e) => setFreeCancellation(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#0891b2] focus:ring-[#0891b2]"
              />
              <span className="text-gray-700">무료 취소</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={breakfastIncluded}
                onChange={(e) => setBreakfastIncluded(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#0891b2] focus:ring-[#0891b2]"
              />
              <span className="text-gray-700">조식 포함</span>
            </label>
          </div>
        </div>

        {/* Amenities */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">편의시설</h4>
          <div className="space-y-2">
            {amenityOptions.map((amenity) => (
              <label key={amenity} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedAmenities.includes(amenity)}
                  onChange={(e) =>
                    setSelectedAmenities(
                      e.target.checked
                        ? [...selectedAmenities, amenity]
                        : selectedAmenities.filter((a) => a !== amenity)
                    )
                  }
                  className="w-4 h-4 rounded border-gray-300 text-[#0891b2] focus:ring-[#0891b2]"
                />
                <span className="text-gray-700 flex items-center gap-2">
                  {AMENITY_ICONS[amenity]}
                  {amenity}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        <button
          onClick={() => {
            setSelectedStars([]);
            setPriceRange([0, 1000000]);
            setSelectedAmenities([]);
            setFreeCancellation(false);
            setBreakfastIncluded(false);
          }}
          className="w-full mt-6 py-2 text-[#0891b2] font-medium hover:underline"
        >
          필터 초기화
        </button>
      </div>
    </div>
  );
}

// ============================================
// Hotel Card Component
// ============================================

function HotelCard({
  hotel,
  nights,
  onSelect,
  index,
}: {
  hotel: Hotel;
  nights: number;
  onSelect: () => void;
  index: number;
}) {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="relative w-full md:w-72 h-52 md:h-auto flex-shrink-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${hotel.images.main})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFavorite(!isFavorite);
            }}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:bg-white transition-colors"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </button>

          {/* Badges */}
          <div className="absolute bottom-3 left-3 flex gap-2">
            {hotel.pricing.isNaverMatched && (
              <div className="flex items-center gap-1 px-2 py-1 bg-[#03C75A] text-white text-xs font-semibold rounded-md">
                <span>N</span>
                <span>최저가</span>
              </div>
            )}
            {hotel.features.freeCancellation && (
              <div className="px-2 py-1 bg-white/90 backdrop-blur text-gray-700 text-xs font-medium rounded-md">
                무료 취소
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-5">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {/* Star Rating */}
                  <div className="flex">
                    {Array.from({ length: hotel.starRating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  {hotel.brand && (
                    <span className="text-xs text-gray-400">{hotel.brand}</span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 leading-tight">{hotel.name}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {hotel.location.district || hotel.location.cityKo}, {hotel.location.countryKo}
                </p>
              </div>

              {/* Review Score */}
              <div className="text-right">
                <div className={`inline-flex items-center justify-center w-10 h-10 ${getScoreColor(hotel.reviews.score)} text-white font-bold rounded-lg`}>
                  {hotel.reviews.score.toFixed(1)}
                </div>
                <p className="text-xs text-gray-500 mt-1">{getScoreLabel(hotel.reviews.score)}</p>
                <p className="text-xs text-gray-400">{hotel.reviews.count.toLocaleString()}개 리뷰</p>
              </div>
            </div>

            {/* Amenities */}
            <div className="flex gap-3 my-3">
              {hotel.amenities.slice(0, 4).map((amenity) => (
                <div key={amenity} className="flex items-center gap-1 text-gray-500 text-sm">
                  {AMENITY_ICONS[amenity] || <Check className="w-4 h-4" />}
                  <span className="hidden sm:inline">{amenity}</span>
                </div>
              ))}
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-2 mb-4">
              {hotel.features.breakfastIncluded && (
                <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded">
                  조식 포함
                </span>
              )}
              {hotel.features.instantConfirmation && (
                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                  즉시 확정
                </span>
              )}
            </div>

            {/* Price & Book */}
            <div className="mt-auto flex items-end justify-between pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400">{nights}박 총 요금</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(hotel.pricing.displayPrice)}
                </p>
                <p className="text-sm text-gray-500">
                  1박당 {formatPrice(hotel.pricing.pricePerNight)}
                </p>
              </div>

              <button
                onClick={onSelect}
                className="flex items-center gap-2 px-6 py-3 bg-[#0891b2] text-white font-semibold rounded-xl hover:bg-[#0e7490] transition-colors"
              >
                <span>예약하기</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// City Selector Modal
// ============================================

function CitySelector({
  isOpen,
  onClose,
  onSelect,
  selectedCode,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (city: CityOption) => void;
  selectedCode: string;
}) {
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const regions = ['아시아', '유럽', '미주', '오세아니아', '중동'];

  const filteredCities = CITIES.filter((city) => {
    const matchesSearch =
      city.name.toLowerCase().includes(search.toLowerCase()) ||
      city.nameKo.includes(search) ||
      city.code.toLowerCase().includes(search.toLowerCase());
    const matchesRegion = !selectedRegion || city.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  const popularCities = filteredCities.filter((c) => c.popular);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-3xl bg-white rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">목적지 검색</h2>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="도시, 호텔, 공항 검색"
                  autoFocus
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                />
              </div>

              {/* Region Tabs */}
              <div className="flex gap-2 mt-4 overflow-x-auto">
                <button
                  onClick={() => setSelectedRegion(null)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    !selectedRegion ? 'bg-[#0891b2] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  전체
                </button>
                {regions.map((region) => (
                  <button
                    key={region}
                    onClick={() => setSelectedRegion(region)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedRegion === region ? 'bg-[#0891b2] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>

            {/* Cities */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Popular Cities */}
              {!search && !selectedRegion && popularCities.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    인기 여행지
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {popularCities.map((city) => (
                      <button
                        key={city.code}
                        onClick={() => {
                          onSelect(city);
                          onClose();
                        }}
                        className={`relative h-28 rounded-xl overflow-hidden group ${
                          selectedCode === city.code ? 'ring-2 ring-[#0891b2]' : ''
                        }`}
                      >
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-105"
                          style={{ backgroundImage: city.image ? `url(${city.image})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-3 left-3 text-left">
                          <p className="text-white font-bold">{city.nameKo}</p>
                          <p className="text-white/70 text-sm">{city.countryKo}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* All Cities */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  {search ? '검색 결과' : selectedRegion ? `${selectedRegion} 도시` : '모든 도시'}
                </h3>
                <div className="space-y-1">
                  {filteredCities.map((city) => (
                    <button
                      key={city.code}
                      onClick={() => {
                        onSelect(city);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors ${
                        selectedCode === city.code ? 'bg-[#0891b2]/5' : ''
                      }`}
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        {city.image ? (
                          <div
                            className="w-full h-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${city.image})` }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-semibold text-gray-900">{city.nameKo}</p>
                        <p className="text-sm text-gray-500">{city.name}, {city.countryKo}</p>
                      </div>
                      <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">
                        {city.code}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function HotelsPage() {
  const locale = useLocale();
  const { checkIn: defaultCheckIn, checkOut: defaultCheckOut } = getDefaultDates();

  // Search state
  const [destination, setDestination] = useState('TYO');
  const [destinationDisplay, setDestinationDisplay] = useState('도쿄, 일본');
  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);

  // Filter state
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [freeCancellation, setFreeCancellation] = useState(false);
  const [breakfastIncluded, setBreakfastIncluded] = useState(false);

  // UI state
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'recommended' | 'price-low' | 'price-high' | 'rating'>('recommended');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Calculate nights
  const nights = Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Fetch hotels
  const fetchHotels = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        city: destination,
        checkIn,
        checkOut,
        guests: guests.toString(),
        rooms: rooms.toString(),
      });

      const response = await fetch(`/api/hotels/shadowed?${params}`);
      const data = await response.json();

      if (data.success) {
        setHotels(data.hotels);
        setMeta(data.meta);
      }
    } catch (err) {
      console.error('Hotel search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [destination, checkIn, checkOut, guests, rooms]);

  // Initial load
  useEffect(() => {
    fetchHotels();
  }, []);

  // Handle city select
  const handleCitySelect = (city: CityOption) => {
    setDestination(city.code);
    setDestinationDisplay(`${city.nameKo}, ${city.countryKo}`);
  };

  // Handle hotel selection
  const handleSelectHotel = (hotel: Hotel) => {
    if (hotel.affiliateLink) {
      window.open(hotel.affiliateLink, '_blank', 'noopener,noreferrer');
    }
  };

  // Filter & sort hotels
  const filteredHotels = hotels.filter((hotel) => {
    if (selectedStars.length > 0 && !selectedStars.includes(hotel.starRating)) return false;
    if (hotel.pricing.pricePerNight < priceRange[0] || hotel.pricing.pricePerNight > priceRange[1]) return false;
    if (freeCancellation && !hotel.features.freeCancellation) return false;
    if (breakfastIncluded && !hotel.features.breakfastIncluded) return false;
    if (selectedAmenities.length > 0) {
      const hasAllAmenities = selectedAmenities.every((a) =>
        hotel.amenities.some((ha) => ha.toLowerCase().includes(a.toLowerCase()))
      );
      if (!hasAllAmenities) return false;
    }
    return true;
  });

  const sortedHotels = [...filteredHotels].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.pricing.displayPrice - b.pricing.displayPrice;
      case 'price-high':
        return b.pricing.displayPrice - a.pricing.displayPrice;
      case 'rating':
        return b.reviews.score - a.reviews.score;
      default:
        if (a.pricing.isNaverMatched && !b.pricing.isNaverMatched) return -1;
        if (!a.pricing.isNaverMatched && b.pricing.isNaverMatched) return 1;
        return b.reviews.score - a.reviews.score;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href={`/${locale}/dashboard`} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0891b2] rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">K-Universal</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href={`/${locale}/dashboard/hotels`}
                className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-full font-medium"
              >
                <Building2 className="w-4 h-4" />
                호텔
              </Link>
              <Link
                href={`/${locale}/dashboard/flights`}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full font-medium transition-colors"
              >
                <Plane className="w-4 h-4" />
                항공권
              </Link>
              <Link
                href={`/${locale}/dashboard/exchange`}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full font-medium transition-colors"
              >
                <Banknote className="w-4 h-4" />
                환전
              </Link>
            </nav>

            {/* Provider Count */}
            <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500">
              <BadgeCheck className="w-5 h-5 text-[#0891b2]" />
              <span>100개 이상의 여행사 비교</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Search */}
      <section className="bg-gradient-to-b from-[#0891b2] to-[#0e7490] py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              전 세계 호텔 최저가 비교
            </h1>
            <p className="text-white/80">
              수백 개의 여행 사이트를 한 번에 비교하세요
            </p>
          </div>

          <SearchBar
            destination={destination}
            destinationDisplay={destinationDisplay}
            checkIn={checkIn}
            checkOut={checkOut}
            guests={guests}
            rooms={rooms}
            onDestinationClick={() => setShowCitySelector(true)}
            onCheckInChange={setCheckIn}
            onCheckOutChange={setCheckOut}
            onGuestsChange={setGuests}
            onRoomsChange={setRooms}
            onSearch={fetchHotels}
            isLoading={isLoading}
          />
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-8">
          {/* Filter Sidebar */}
          <FilterSidebar
            selectedStars={selectedStars}
            setSelectedStars={setSelectedStars}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            selectedAmenities={selectedAmenities}
            setSelectedAmenities={setSelectedAmenities}
            freeCancellation={freeCancellation}
            setFreeCancellation={setFreeCancellation}
            breakfastIncluded={breakfastIncluded}
            setBreakfastIncluded={setBreakfastIncluded}
          />

          {/* Results */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {meta?.destinationKo || destinationDisplay} 호텔
                </h2>
                <p className="text-gray-500">
                  {formatDate(checkIn)} - {formatDate(checkOut)} · {nights}박 · {sortedHotels.length}개 호텔
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'map' ? 'bg-white shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    <Map className="w-5 h-5" />
                  </button>
                </div>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0891b2] cursor-pointer"
                >
                  <option value="recommended">추천순</option>
                  <option value="price-low">가격 낮은순</option>
                  <option value="price-high">가격 높은순</option>
                  <option value="rating">평점 높은순</option>
                </select>
              </div>
            </div>

            {/* Naver Match Notice */}
            {meta && meta.naverMatchedCount > 0 && (
              <div className="mb-6 p-4 bg-[#03C75A]/10 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 bg-[#03C75A] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">N</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {meta.naverMatchedCount}개 호텔 네이버 최저가 매칭
                  </p>
                  <p className="text-sm text-gray-600">네이버와 동일한 최저가로 예약하세요</p>
                </div>
                <TrendingDown className="w-5 h-5 text-[#03C75A] ml-auto" />
              </div>
            )}

            {/* Hotel List */}
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                    <div className="flex gap-6">
                      <div className="w-72 h-48 bg-gray-200 rounded-xl" />
                      <div className="flex-1 space-y-4">
                        <div className="h-6 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                        <div className="h-4 bg-gray-200 rounded w-1/3" />
                        <div className="h-10 bg-gray-200 rounded w-32 mt-auto" />
                      </div>
                    </div>
                  </div>
                ))
              ) : sortedHotels.length > 0 ? (
                sortedHotels.map((hotel, index) => (
                  <HotelCard
                    key={hotel.id}
                    hotel={hotel}
                    nights={nights}
                    onSelect={() => handleSelectHotel(hotel)}
                    index={index}
                  />
                ))
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">검색 결과가 없습니다</h3>
                  <p className="text-gray-500">필터를 조정하거나 다른 날짜를 선택해보세요</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* City Selector Modal */}
      <CitySelector
        isOpen={showCitySelector}
        onClose={() => setShowCitySelector(false)}
        onSelect={handleCitySelect}
        selectedCode={destination}
      />
    </div>
  );
}
