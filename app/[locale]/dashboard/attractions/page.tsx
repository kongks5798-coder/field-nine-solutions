/**
 * Tourist Attractions Page
 * 관광 명소 안내 페이지
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Clock,
  Ticket,
  Star,
  Heart,
  Navigation,
  Camera,
  Mountain,
  Building2,
  Sparkles,
  ChevronRight,
  Filter,
  Search,
  Bookmark,
  Share2,
  Phone,
} from 'lucide-react';

// Attraction categories
const categories = [
  { id: 'all', name: '전체', nameEn: 'All', icon: Sparkles },
  { id: 'palace', name: '고궁', nameEn: 'Palace', icon: Building2 },
  { id: 'nature', name: '자연', nameEn: 'Nature', icon: Mountain },
  { id: 'modern', name: '현대', nameEn: 'Modern', icon: Camera },
  { id: 'cultural', name: '문화', nameEn: 'Culture', icon: Star },
];

// Tourist attractions data
const attractions = [
  {
    id: 1,
    name: 'Gyeongbokgung Palace',
    nameKo: '경복궁',
    category: 'palace',
    image: '🏯',
    rating: 4.8,
    reviews: 12453,
    price: '₩3,000',
    priceNote: '한복 착용시 무료',
    hours: '09:00 - 18:00',
    hoursNote: '화요일 휴관',
    location: '서울 종로구',
    description: '조선 왕조의 법궁으로 600년 역사를 자랑하는 대표 관광지',
    highlights: ['근정전', '경회루', '수문장 교대식', '야간 개장'],
    tips: '한복 대여소가 근처에 많아요',
    metro: '3호선 경복궁역 5번 출구',
    popular: true,
  },
  {
    id: 2,
    name: 'N Seoul Tower',
    nameKo: 'N서울타워',
    category: 'modern',
    image: '🗼',
    rating: 4.6,
    reviews: 8932,
    price: '₩16,000',
    priceNote: '전망대 입장료',
    hours: '10:00 - 23:00',
    hoursNote: '연중무휴',
    location: '서울 용산구 남산',
    description: '서울의 랜드마크, 360도 파노라마 전망을 즐길 수 있는 곳',
    highlights: ['전망대', '사랑의 자물쇠', '야경', '남산 케이블카'],
    tips: '야간에 방문하면 서울 야경이 환상적',
    metro: '4호선 명동역 → 케이블카',
    popular: true,
  },
  {
    id: 3,
    name: 'Bukchon Hanok Village',
    nameKo: '북촌 한옥마을',
    category: 'cultural',
    image: '🏠',
    rating: 4.5,
    reviews: 7821,
    price: '무료',
    priceNote: '일부 체험 유료',
    hours: '24시간',
    hoursNote: '주민 배려 필요',
    location: '서울 종로구',
    description: '600년 역사의 전통 한옥이 밀집한 마을',
    highlights: ['한옥 거리', '전통 체험', '포토존', '전통 찻집'],
    tips: '주민들이 거주하는 곳이니 조용히 관람해주세요',
    metro: '3호선 안국역 2번 출구',
    popular: true,
  },
  {
    id: 4,
    name: 'Lotte World Tower',
    nameKo: '롯데월드타워',
    category: 'modern',
    image: '🏙️',
    rating: 4.7,
    reviews: 6543,
    price: '₩29,000',
    priceNote: '서울스카이 입장료',
    hours: '10:00 - 22:00',
    hoursNote: '일-목 / 금-토 23:00',
    location: '서울 송파구 잠실',
    description: '555m 높이의 한국 최고층 빌딩, 서울스카이 전망대',
    highlights: ['서울스카이', '스카이브릿지', '아쿠아리움', '롯데월드몰'],
    tips: '일몰 시간에 맞춰 방문 추천',
    metro: '2호선 잠실역 1번 출구 직결',
    popular: true,
  },
  {
    id: 5,
    name: 'Changdeokgung Palace',
    nameKo: '창덕궁',
    category: 'palace',
    image: '🏛️',
    rating: 4.9,
    reviews: 5432,
    price: '₩3,000',
    priceNote: '후원 별도 ₩5,000',
    hours: '09:00 - 18:00',
    hoursNote: '월요일 휴관',
    location: '서울 종로구',
    description: 'UNESCO 세계문화유산, 비원(후원)이 아름다운 궁궐',
    highlights: ['인정전', '비원', '부용지', '달빛 기행'],
    tips: '후원은 예약제 가이드 투어로만 관람 가능',
    metro: '3호선 안국역 3번 출구',
    popular: false,
  },
  {
    id: 6,
    name: 'Namsan Park',
    nameKo: '남산공원',
    category: 'nature',
    image: '🌲',
    rating: 4.4,
    reviews: 4321,
    price: '무료',
    priceNote: '케이블카 별도',
    hours: '24시간',
    hoursNote: '연중무휴',
    location: '서울 중구',
    description: '서울 중심의 도심 속 자연, 산책과 하이킹 코스',
    highlights: ['둘레길', '팔각정', '봉수대', '야경'],
    tips: '도보로 N서울타워까지 등산 가능 (약 40분)',
    metro: '4호선 명동역 또는 회현역',
    popular: false,
  },
  {
    id: 7,
    name: 'Hongdae Street',
    nameKo: '홍대거리',
    category: 'cultural',
    image: '🎸',
    rating: 4.3,
    reviews: 9876,
    price: '무료',
    priceNote: '',
    hours: '24시간',
    hoursNote: '밤에 더 활발',
    location: '서울 마포구',
    description: '젊음과 예술의 거리, 클럽과 인디 문화의 중심지',
    highlights: ['거리 공연', '벽화거리', '클럽', '카페거리'],
    tips: '주말 저녁에 거리 공연이 많아요',
    metro: '2호선 홍대입구역 9번 출구',
    popular: true,
  },
  {
    id: 8,
    name: 'Cheonggyecheon Stream',
    nameKo: '청계천',
    category: 'nature',
    image: '💧',
    rating: 4.2,
    reviews: 3456,
    price: '무료',
    priceNote: '',
    hours: '24시간',
    hoursNote: '야간 조명 ~22:00',
    location: '서울 종로구~중구',
    description: '도심 속 복원된 하천, 산책과 휴식의 명소',
    highlights: ['청계광장', '야간 조명', '빨래터', '수표교'],
    tips: '광화문에서 동대문까지 약 5.8km 산책로',
    metro: '5호선 광화문역 5번 출구',
    popular: false,
  },
];

export default function AttractionsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedAttraction, setSelectedAttraction] = useState<number | null>(null);

  const filteredAttractions = attractions.filter((attraction) => {
    const matchesCategory = selectedCategory === 'all' || attraction.category === selectedCategory;
    const matchesSearch =
      attraction.nameKo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attraction.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const selectedAttractionData = attractions.find((a) => a.id === selectedAttraction);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0F] via-[#0F0F1A] to-[#0A0A0F] pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
              <Camera className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Tourist Attractions</h1>
              <p className="text-xs text-white/50">관광 명소</p>
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
            placeholder="명소 검색..."
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50"
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
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
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

        {/* Popular Section */}
        {selectedCategory === 'all' && !searchQuery && (
          <div className="mb-2">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              인기 명소
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {attractions
                .filter((a) => a.popular)
                .slice(0, 4)
                .map((attraction) => (
                  <motion.div
                    key={attraction.id}
                    onClick={() => setSelectedAttraction(attraction.id)}
                    className="flex-shrink-0 w-36 bg-white/5 rounded-xl border border-white/10 overflow-hidden cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="h-20 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-4xl">
                      {attraction.image}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-white text-sm truncate">
                        {attraction.nameKo}
                      </h3>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-white/60">{attraction.rating}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        )}

        {/* Attractions List */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            {selectedCategory === 'all' ? '전체 명소' : categories.find(c => c.id === selectedCategory)?.name}
            <span className="text-sm font-normal text-white/50">({filteredAttractions.length})</span>
          </h2>

          {filteredAttractions.map((attraction) => (
            <motion.div
              key={attraction.id}
              onClick={() => setSelectedAttraction(attraction.id)}
              className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden cursor-pointer"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="p-4">
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-4xl flex-shrink-0">
                    {attraction.image}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-white">{attraction.nameKo}</h3>
                        <p className="text-xs text-white/50">{attraction.name}</p>
                      </div>
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(attraction.id);
                        }}
                        whileTap={{ scale: 0.8 }}
                        className="p-1.5"
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            favorites.includes(attraction.id)
                              ? 'text-red-400 fill-red-400'
                              : 'text-white/30'
                          }`}
                        />
                      </motion.button>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Star className="w-3 h-3 fill-yellow-400" />
                        <span>{attraction.rating}</span>
                        <span className="text-white/40">({attraction.reviews.toLocaleString()})</span>
                      </div>
                      <span className="text-emerald-400 font-medium">{attraction.price}</span>
                    </div>

                    <div className="flex items-center gap-1 mt-2 text-xs text-white/50">
                      <MapPin className="w-3 h-3" />
                      <span>{attraction.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredAttractions.length === 0 && (
          <div className="text-center py-12">
            <Camera className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/50">검색 결과가 없습니다</p>
          </div>
        )}
      </div>

      {/* Attraction Detail Modal */}
      <AnimatePresence>
        {selectedAttraction && selectedAttractionData && (
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
              onClick={() => setSelectedAttraction(null)}
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
              <div className="h-40 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center text-7xl relative">
                {selectedAttractionData.image}
                <button
                  onClick={() => setSelectedAttraction(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center"
                >
                  <span className="text-white text-xl">×</span>
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Title */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedAttractionData.nameKo}</h2>
                    <p className="text-sm text-white/50">{selectedAttractionData.name}</p>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleFavorite(selectedAttractionData.id)}
                      className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          favorites.includes(selectedAttractionData.id)
                            ? 'text-red-400 fill-red-400'
                            : 'text-white/50'
                        }`}
                      />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
                    >
                      <Share2 className="w-5 h-5 text-white/50" />
                    </motion.button>
                  </div>
                </div>

                {/* Rating & Price */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold text-white">{selectedAttractionData.rating}</span>
                    <span className="text-white/40 text-sm">
                      ({selectedAttractionData.reviews.toLocaleString()} 리뷰)
                    </span>
                  </div>
                  <div className="text-emerald-400 font-bold">{selectedAttractionData.price}</div>
                </div>

                {/* Description */}
                <p className="text-white/70">{selectedAttractionData.description}</p>

                {/* Info Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                      <Clock className="w-3 h-3" />
                      <span>운영시간</span>
                    </div>
                    <p className="text-white font-medium">{selectedAttractionData.hours}</p>
                    {selectedAttractionData.hoursNote && (
                      <p className="text-xs text-amber-400 mt-1">{selectedAttractionData.hoursNote}</p>
                    )}
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                      <Ticket className="w-3 h-3" />
                      <span>입장료</span>
                    </div>
                    <p className="text-white font-medium">{selectedAttractionData.price}</p>
                    {selectedAttractionData.priceNote && (
                      <p className="text-xs text-emerald-400 mt-1">{selectedAttractionData.priceNote}</p>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
                    <MapPin className="w-3 h-3" />
                    <span>위치</span>
                  </div>
                  <p className="text-white font-medium">{selectedAttractionData.location}</p>
                  <p className="text-sm text-white/50 mt-1">{selectedAttractionData.metro}</p>
                </div>

                {/* Highlights */}
                <div>
                  <h3 className="text-sm font-semibold text-white/70 mb-2">주요 볼거리</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAttractionData.highlights.map((highlight, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-sm rounded-lg"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tips */}
                {selectedAttractionData.tips && (
                  <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
                    <p className="text-sm text-amber-400">
                      💡 <span className="font-semibold">TIP:</span> {selectedAttractionData.tips}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 bg-white/10 rounded-xl text-white font-medium flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-4 h-4" />
                    길찾기
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white font-medium"
                  >
                    티켓 예매
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
