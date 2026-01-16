/**
 * Hotels Guide Page
 * 호텔 안내 페이지
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hotel,
  MapPin,
  Star,
  Heart,
  Wifi,
  Car,
  Coffee,
  Dumbbell,
  Waves,
  UtensilsCrossed,
  Search,
  Filter,
  ChevronRight,
  ExternalLink,
  Navigation,
  Phone,
  Globe,
  Sparkles,
  Building2,
  Home,
  Tent,
} from 'lucide-react';

// Hotel categories
const categories = [
  { id: 'all', name: '전체', nameEn: 'All', icon: Sparkles },
  { id: 'luxury', name: '럭셔리', nameEn: 'Luxury', icon: Star },
  { id: 'business', name: '비즈니스', nameEn: 'Business', icon: Building2 },
  { id: 'boutique', name: '부티크', nameEn: 'Boutique', icon: Home },
  { id: 'hanok', name: '한옥', nameEn: 'Hanok', icon: Tent },
];

// Areas
const areas = [
  { id: 'all', name: '전체 지역' },
  { id: 'myeongdong', name: '명동' },
  { id: 'gangnam', name: '강남' },
  { id: 'hongdae', name: '홍대' },
  { id: 'itaewon', name: '이태원' },
  { id: 'jongno', name: '종로/인사동' },
];

// Hotels data
const hotels = [
  {
    id: 1,
    name: 'Signiel Seoul',
    nameKo: '시그니엘 서울',
    category: 'luxury',
    area: 'gangnam',
    image: '🏨',
    rating: 4.9,
    reviews: 2341,
    priceRange: '₩500,000 - ₩2,000,000',
    priceNote: '/박',
    stars: 5,
    location: '서울 송파구 잠실',
    description: '롯데월드타워 76-101층에 위치한 초럭셔리 호텔',
    amenities: ['wifi', 'pool', 'gym', 'restaurant', 'parking'],
    highlights: ['서울 최고층 호텔', '미슐랭 레스토랑', '스카이 바'],
    bookingUrl: 'https://www.lottehotel.com/signielseoul',
    featured: true,
  },
  {
    id: 2,
    name: 'The Shilla Seoul',
    nameKo: '신라호텔 서울',
    category: 'luxury',
    area: 'itaewon',
    image: '🏛️',
    rating: 4.8,
    reviews: 3456,
    priceRange: '₩400,000 - ₩1,500,000',
    priceNote: '/박',
    stars: 5,
    location: '서울 중구 장충동',
    description: '한국 최고의 명품 호텔, 전통과 현대의 조화',
    amenities: ['wifi', 'pool', 'gym', 'restaurant', 'parking', 'spa'],
    highlights: ['신라면세점', '한국정원', '럭셔리 스파'],
    bookingUrl: 'https://www.shilla.net/seoul',
    featured: true,
  },
  {
    id: 3,
    name: 'Four Seasons Seoul',
    nameKo: '포시즌스 서울',
    category: 'luxury',
    area: 'jongno',
    image: '⭐',
    rating: 4.9,
    reviews: 1892,
    priceRange: '₩450,000 - ₩1,800,000',
    priceNote: '/박',
    stars: 5,
    location: '서울 종로구 광화문',
    description: '광화문 중심에 위치한 글로벌 럭셔리 호텔',
    amenities: ['wifi', 'pool', 'gym', 'restaurant', 'parking', 'spa'],
    highlights: ['광화문 뷰', '미슐랭 다이닝', '럭셔리 스파'],
    bookingUrl: 'https://www.fourseasons.com/seoul',
    featured: true,
  },
  {
    id: 4,
    name: 'Lotte Hotel Seoul',
    nameKo: '롯데호텔 서울',
    category: 'luxury',
    area: 'myeongdong',
    image: '🌟',
    rating: 4.7,
    reviews: 4567,
    priceRange: '₩300,000 - ₩800,000',
    priceNote: '/박',
    stars: 5,
    location: '서울 중구 명동',
    description: '명동 중심, 쇼핑과 관광의 최적 위치',
    amenities: ['wifi', 'pool', 'gym', 'restaurant', 'parking'],
    highlights: ['명동 접근성', '면세점 연결', '다양한 레스토랑'],
    bookingUrl: 'https://www.lottehotel.com/seoul-hotel',
    featured: false,
  },
  {
    id: 5,
    name: 'Grand Hyatt Seoul',
    nameKo: '그랜드 하얏트 서울',
    category: 'business',
    area: 'itaewon',
    image: '🏢',
    rating: 4.6,
    reviews: 2345,
    priceRange: '₩250,000 - ₩600,000',
    priceNote: '/박',
    stars: 5,
    location: '서울 용산구 한남동',
    description: '남산 전망과 넓은 정원을 갖춘 비즈니스 호텔',
    amenities: ['wifi', 'pool', 'gym', 'restaurant', 'parking'],
    highlights: ['남산 전망', '야외 수영장', '테니스코트'],
    bookingUrl: 'https://www.hyatt.com/grand-hyatt/seoul',
    featured: false,
  },
  {
    id: 6,
    name: 'RYSE Hotel',
    nameKo: '라이즈 호텔',
    category: 'boutique',
    area: 'hongdae',
    image: '🎨',
    rating: 4.5,
    reviews: 1234,
    priceRange: '₩180,000 - ₩350,000',
    priceNote: '/박',
    stars: 4,
    location: '서울 마포구 홍대',
    description: '홍대 아트씬을 담은 디자인 부티크 호텔',
    amenities: ['wifi', 'gym', 'restaurant', 'parking'],
    highlights: ['아트 갤러리', '루프탑 바', '홍대 중심'],
    bookingUrl: 'https://www.rysehotel.com',
    featured: false,
  },
  {
    id: 7,
    name: 'Bukchon Maru Hanok',
    nameKo: '북촌마루 한옥호텔',
    category: 'hanok',
    area: 'jongno',
    image: '🏠',
    rating: 4.8,
    reviews: 567,
    priceRange: '₩150,000 - ₩300,000',
    priceNote: '/박',
    stars: 4,
    location: '서울 종로구 북촌',
    description: '전통 한옥에서의 특별한 숙박 경험',
    amenities: ['wifi'],
    highlights: ['전통 한옥', '한복 체험', '전통 조식'],
    bookingUrl: '#',
    featured: false,
  },
  {
    id: 8,
    name: 'Novotel Ambassador',
    nameKo: '노보텔 앰배서더 강남',
    category: 'business',
    area: 'gangnam',
    image: '🏬',
    rating: 4.4,
    reviews: 3456,
    priceRange: '₩150,000 - ₩280,000',
    priceNote: '/박',
    stars: 4,
    location: '서울 강남구',
    description: '강남 비즈니스 중심가의 실속 호텔',
    amenities: ['wifi', 'gym', 'restaurant', 'parking'],
    highlights: ['강남역 도보 5분', '비즈니스 센터', '합리적 가격'],
    bookingUrl: 'https://www.ambatel.com',
    featured: false,
  },
];

// Amenity icons
const amenityIcons: Record<string, { icon: typeof Wifi; label: string }> = {
  wifi: { icon: Wifi, label: 'Wi-Fi' },
  pool: { icon: Waves, label: '수영장' },
  gym: { icon: Dumbbell, label: '피트니스' },
  restaurant: { icon: UtensilsCrossed, label: '레스토랑' },
  parking: { icon: Car, label: '주차' },
  spa: { icon: Sparkles, label: '스파' },
};

// Booking platforms
const bookingPlatforms = [
  { name: 'Agoda', url: 'https://www.agoda.com', color: 'from-red-500 to-rose-500' },
  { name: 'Booking.com', url: 'https://www.booking.com', color: 'from-blue-600 to-blue-500' },
  { name: '야놀자', url: 'https://www.yanolja.com', color: 'from-pink-500 to-rose-500' },
  { name: '여기어때', url: 'https://www.goodchoice.kr', color: 'from-cyan-500 to-blue-500' },
];

export default function HotelsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArea, setSelectedArea] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<number | null>(null);

  const filteredHotels = hotels.filter((hotel) => {
    const matchesCategory = selectedCategory === 'all' || hotel.category === selectedCategory;
    const matchesArea = selectedArea === 'all' || hotel.area === selectedArea;
    const matchesSearch =
      hotel.nameKo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hotel.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesArea && matchesSearch;
  });

  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const selectedHotelData = hotels.find((h) => h.id === selectedHotel);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0F] via-[#0F0F1A] to-[#0A0A0F] pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
              <Hotel className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Hotels</h1>
              <p className="text-xs text-white/50">호텔 / 숙소</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="호텔 검색..."
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <motion.button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedCategory === category.id
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                } border`}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{category.name}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Area Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {areas.map((area) => (
            <motion.button
              key={area.id}
              onClick={() => setSelectedArea(area.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-sm transition-all ${
                selectedArea === area.id
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              {area.name}
            </motion.button>
          ))}
        </div>

        {/* Booking Platforms */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <h3 className="text-sm font-semibold text-white/70 mb-3">예약 사이트</h3>
          <div className="grid grid-cols-4 gap-2">
            {bookingPlatforms.map((platform) => (
              <motion.a
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`py-2 bg-gradient-to-r ${platform.color} rounded-lg text-center text-white text-xs font-medium`}
                whileTap={{ scale: 0.95 }}
              >
                {platform.name}
              </motion.a>
            ))}
          </div>
        </div>

        {/* Featured Hotels */}
        {selectedCategory === 'all' && selectedArea === 'all' && !searchQuery && (
          <div className="mb-2">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              추천 호텔
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {hotels
                .filter((h) => h.featured)
                .map((hotel) => (
                  <motion.div
                    key={hotel.id}
                    onClick={() => setSelectedHotel(hotel.id)}
                    className="flex-shrink-0 w-44 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20 overflow-hidden cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="h-24 bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center text-5xl relative">
                      {hotel.image}
                      <div className="absolute top-2 right-2 flex">
                        {Array.from({ length: Math.min(hotel.stars, 3) }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-white text-sm truncate">
                        {hotel.nameKo}
                      </h3>
                      <p className="text-xs text-white/50 truncate mt-1">{hotel.location}</p>
                      <p className="text-xs text-amber-400 mt-1">{hotel.priceRange.split(' - ')[0]}~</p>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        )}

        {/* Hotels List */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Hotel className="w-5 h-5 text-amber-400" />
            {selectedCategory === 'all' ? '전체 호텔' : categories.find(c => c.id === selectedCategory)?.name}
            <span className="text-sm font-normal text-white/50">({filteredHotels.length})</span>
          </h2>

          {filteredHotels.map((hotel) => (
            <motion.div
              key={hotel.id}
              onClick={() => setSelectedHotel(hotel.id)}
              className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden cursor-pointer"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="p-4">
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center text-4xl flex-shrink-0">
                    {hotel.image}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white">{hotel.nameKo}</h3>
                          <div className="flex">
                            {Array.from({ length: Math.min(hotel.stars, 3) }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-white/50">{hotel.name}</p>
                      </div>
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(hotel.id);
                        }}
                        whileTap={{ scale: 0.8 }}
                        className="p-1.5"
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            favorites.includes(hotel.id)
                              ? 'text-red-400 fill-red-400'
                              : 'text-white/30'
                          }`}
                        />
                      </motion.button>
                    </div>

                    <div className="flex items-center gap-2 mt-2 text-xs text-white/50">
                      <MapPin className="w-3 h-3" />
                      <span>{hotel.location}</span>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs text-white">{hotel.rating}</span>
                        <span className="text-xs text-white/40">({hotel.reviews.toLocaleString()})</span>
                      </div>
                      <span className="text-xs text-amber-400 font-medium">{hotel.priceRange.split(' - ')[0]}~</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredHotels.length === 0 && (
          <div className="text-center py-12">
            <Hotel className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/50">검색 결과가 없습니다</p>
          </div>
        )}
      </div>

      {/* Hotel Detail Modal */}
      <AnimatePresence>
        {selectedHotel && selectedHotelData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedHotel(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-[#12121A] rounded-t-3xl max-h-[85vh] overflow-y-auto"
            >
              {/* Header Image */}
              <div className="h-44 bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center text-8xl relative">
                {selectedHotelData.image}
                <button
                  onClick={() => setSelectedHotel(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center"
                >
                  <span className="text-white text-xl">×</span>
                </button>
                <div className="absolute top-4 left-4 flex gap-1">
                  {Array.from({ length: selectedHotelData.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Title */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedHotelData.nameKo}</h2>
                    <p className="text-sm text-white/50">{selectedHotelData.name}</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleFavorite(selectedHotelData.id)}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        favorites.includes(selectedHotelData.id)
                          ? 'text-red-400 fill-red-400'
                          : 'text-white/50'
                      }`}
                    />
                  </motion.button>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span className="font-bold text-white">{selectedHotelData.rating}</span>
                  <span className="text-white/40 text-sm">
                    ({selectedHotelData.reviews.toLocaleString()} 리뷰)
                  </span>
                </div>

                {/* Description */}
                <p className="text-white/70">{selectedHotelData.description}</p>

                {/* Location */}
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
                    <MapPin className="w-3 h-3" />
                    <span>위치</span>
                  </div>
                  <p className="text-white font-medium">{selectedHotelData.location}</p>
                </div>

                {/* Price */}
                <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-4 border border-amber-500/20">
                  <p className="text-xs text-white/50 mb-1">객실 가격</p>
                  <p className="text-xl font-bold text-white">
                    {selectedHotelData.priceRange}
                    <span className="text-sm font-normal text-white/50">{selectedHotelData.priceNote}</span>
                  </p>
                </div>

                {/* Amenities */}
                <div>
                  <h3 className="text-sm font-semibold text-white/70 mb-3">시설 및 서비스</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedHotelData.amenities.map((amenity) => {
                      const amenityInfo = amenityIcons[amenity];
                      if (!amenityInfo) return null;
                      const Icon = amenityInfo.icon;
                      return (
                        <div
                          key={amenity}
                          className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg"
                        >
                          <Icon className="w-4 h-4 text-amber-400" />
                          <span className="text-sm text-white/70">{amenityInfo.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Highlights */}
                <div>
                  <h3 className="text-sm font-semibold text-white/70 mb-2">주요 특징</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedHotelData.highlights.map((highlight, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-amber-500/10 text-amber-400 text-sm rounded-lg"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 bg-white/10 rounded-xl text-white font-medium flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-4 h-4" />
                    길찾기
                  </motion.button>
                  <motion.a
                    href={selectedHotelData.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white font-semibold text-center flex items-center justify-center gap-2"
                  >
                    예약하기
                    <ExternalLink className="w-4 h-4" />
                  </motion.a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
