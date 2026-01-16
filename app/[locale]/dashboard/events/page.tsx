/**
 * Events & Performances Page
 * 공연/이벤트 안내 페이지
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket,
  Calendar,
  MapPin,
  Clock,
  Star,
  Heart,
  Music,
  Theater,
  Mic2,
  Palette,
  Film,
  PartyPopper,
  ChevronRight,
  Filter,
  Search,
  ExternalLink,
  Users,
} from 'lucide-react';

// Event categories
const categories = [
  { id: 'all', name: '전체', nameEn: 'All', icon: PartyPopper },
  { id: 'kpop', name: 'K-POP', nameEn: 'K-POP', icon: Music },
  { id: 'musical', name: '뮤지컬', nameEn: 'Musical', icon: Theater },
  { id: 'concert', name: '콘서트', nameEn: 'Concert', icon: Mic2 },
  { id: 'exhibition', name: '전시', nameEn: 'Exhibition', icon: Palette },
  { id: 'show', name: '공연', nameEn: 'Show', icon: Film },
];

// Events data
const events = [
  {
    id: 1,
    title: 'BLACKPINK World Tour',
    titleKo: '블랙핑크 월드투어',
    category: 'kpop',
    image: '🎤',
    venue: '고척스카이돔',
    venueEn: 'Gocheok Sky Dome',
    date: '2026.02.15 - 02.16',
    time: '19:00',
    priceRange: '₩99,000 - ₩198,000',
    rating: 4.9,
    reviews: 2341,
    status: 'onsale',
    description: '블랙핑크 월드투어 서울 공연',
    tags: ['K-POP', 'YG', '걸그룹'],
    ticketLink: 'https://ticket.interpark.com',
    hot: true,
  },
  {
    id: 2,
    title: 'Phantom of the Opera',
    titleKo: '오페라의 유령',
    category: 'musical',
    image: '🎭',
    venue: '블루스퀘어',
    venueEn: 'Blue Square',
    date: '2026.01.10 - 04.30',
    time: '화-금 19:30 / 주말 14:00, 19:00',
    priceRange: '₩70,000 - ₩170,000',
    rating: 4.8,
    reviews: 1892,
    status: 'onsale',
    description: '세계적인 뮤지컬의 한국 공연',
    tags: ['뮤지컬', '브로드웨이', '클래식'],
    ticketLink: 'https://ticket.interpark.com',
    hot: true,
  },
  {
    id: 3,
    title: 'BTS Exhibition',
    titleKo: 'BTS 전시회',
    category: 'exhibition',
    image: '🖼️',
    venue: 'HYBE INSIGHT',
    venueEn: 'HYBE INSIGHT',
    date: '상설 전시',
    time: '10:30 - 19:30',
    priceRange: '₩22,000',
    rating: 4.7,
    reviews: 5432,
    status: 'onsale',
    description: 'BTS의 역사와 음악을 체험하는 전시',
    tags: ['전시', 'K-POP', 'BTS'],
    ticketLink: 'https://www.hybeinsight.com',
    hot: true,
  },
  {
    id: 4,
    title: 'NANTA',
    titleKo: '난타',
    category: 'show',
    image: '🥁',
    venue: '명동 난타 전용관',
    venueEn: 'Myeongdong NANTA Theater',
    date: '상설 공연',
    time: '매일 17:00, 20:00',
    priceRange: '₩40,000 - ₩70,000',
    rating: 4.6,
    reviews: 8765,
    status: 'onsale',
    description: '한국 대표 비언어 퍼포먼스',
    tags: ['난타', '퍼포먼스', '가족'],
    ticketLink: 'https://www.nanta.co.kr',
    hot: false,
  },
  {
    id: 5,
    title: 'IU Concert',
    titleKo: 'IU 콘서트',
    category: 'concert',
    image: '🎵',
    venue: '잠실종합운동장',
    venueEn: 'Jamsil Olympic Stadium',
    date: '2026.03.20 - 03.22',
    time: '18:00',
    priceRange: '₩132,000 - ₩165,000',
    rating: 4.9,
    reviews: 3421,
    status: 'upcoming',
    description: 'IU 전국 투어 서울 공연',
    tags: ['K-POP', '솔로', '발라드'],
    ticketLink: 'https://ticket.melon.com',
    hot: true,
  },
  {
    id: 6,
    title: 'JUMP',
    titleKo: '점프',
    category: 'show',
    image: '🤸',
    venue: '서울 점프 전용관',
    venueEn: 'Seoul JUMP Theater',
    date: '상설 공연',
    time: '매일 16:00, 20:00',
    priceRange: '₩40,000 - ₩60,000',
    rating: 4.5,
    reviews: 4321,
    status: 'onsale',
    description: '태권도 무술 코믹 퍼포먼스',
    tags: ['퍼포먼스', '코미디', '가족'],
    ticketLink: 'https://www.hijump.co.kr',
    hot: false,
  },
  {
    id: 7,
    title: 'Van Gogh Immersive',
    titleKo: '빈센트 반 고흐 몰입형 전시',
    category: 'exhibition',
    image: '🌻',
    venue: '디뮤지엄',
    venueEn: 'D Museum',
    date: '2026.01.01 - 05.31',
    time: '10:00 - 20:00',
    priceRange: '₩18,000 - ₩25,000',
    rating: 4.4,
    reviews: 2109,
    status: 'onsale',
    description: '반 고흐 작품의 몰입형 디지털 전시',
    tags: ['전시', '미술', '디지털아트'],
    ticketLink: 'https://www.dfriendsmuseum.com',
    hot: false,
  },
  {
    id: 8,
    title: 'Seoul Jazz Festival',
    titleKo: '서울 재즈 페스티벌',
    category: 'concert',
    image: '🎷',
    venue: '올림픽공원',
    venueEn: 'Olympic Park',
    date: '2026.05.23 - 05.25',
    time: '14:00 - 22:00',
    priceRange: '₩150,000 - ₩330,000',
    rating: 4.7,
    reviews: 1543,
    status: 'upcoming',
    description: '아시아 최대 재즈 페스티벌',
    tags: ['재즈', '페스티벌', '야외'],
    ticketLink: 'https://www.seouljazz.co.kr',
    hot: false,
  },
];

// Booking platforms
const platforms = [
  { name: 'Interpark', nameKo: '인터파크', url: 'https://ticket.interpark.com', color: 'from-red-500 to-orange-500' },
  { name: 'Yes24', nameKo: '예스24', url: 'https://ticket.yes24.com', color: 'from-blue-500 to-cyan-500' },
  { name: 'Melon Ticket', nameKo: '멜론티켓', url: 'https://ticket.melon.com', color: 'from-green-500 to-emerald-500' },
];

export default function EventsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);

  const filteredEvents = events.filter((event) => {
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    const matchesSearch =
      event.titleKo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const selectedEventData = events.find((e) => e.id === selectedEvent);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0F] via-[#0F0F1A] to-[#0A0A0F] pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
              <Ticket className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Events & Shows</h1>
              <p className="text-xs text-white/50">공연 / 이벤트</p>
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
            placeholder="공연/전시 검색..."
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-pink-500/50"
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
                    ? 'bg-pink-500/20 border-pink-500/50 text-pink-400'
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

        {/* Hot Events */}
        {selectedCategory === 'all' && !searchQuery && (
          <div className="mb-2">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-xl">🔥</span>
              HOT 공연
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {events
                .filter((e) => e.hot)
                .map((event) => (
                  <motion.div
                    key={event.id}
                    onClick={() => setSelectedEvent(event.id)}
                    className="flex-shrink-0 w-44 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-xl border border-pink-500/20 overflow-hidden cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="h-24 bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center text-5xl relative">
                      {event.image}
                      <span className="absolute top-2 right-2 px-2 py-0.5 bg-red-500 rounded-full text-[10px] text-white font-bold">
                        HOT
                      </span>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-white text-sm truncate">
                        {event.titleKo}
                      </h3>
                      <p className="text-xs text-white/50 truncate mt-1">{event.venue}</p>
                      <p className="text-xs text-pink-400 mt-1">{event.date}</p>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        )}

        {/* Ticket Platforms */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <h3 className="text-sm font-semibold text-white/70 mb-3">예매 사이트</h3>
          <div className="flex gap-2">
            {platforms.map((platform) => (
              <motion.a
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-1 py-2 bg-gradient-to-r ${platform.color} rounded-lg text-center text-white text-xs font-medium`}
                whileTap={{ scale: 0.95 }}
              >
                {platform.nameKo}
              </motion.a>
            ))}
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-pink-400" />
            {selectedCategory === 'all' ? '전체 공연' : categories.find(c => c.id === selectedCategory)?.name}
            <span className="text-sm font-normal text-white/50">({filteredEvents.length})</span>
          </h2>

          {filteredEvents.map((event) => (
            <motion.div
              key={event.id}
              onClick={() => setSelectedEvent(event.id)}
              className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden cursor-pointer"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="p-4">
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center text-4xl flex-shrink-0 relative">
                    {event.image}
                    {event.status === 'upcoming' && (
                      <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-amber-500 rounded text-[8px] text-white font-bold">
                        SOON
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-white">{event.titleKo}</h3>
                        <p className="text-xs text-white/50">{event.title}</p>
                      </div>
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(event.id);
                        }}
                        whileTap={{ scale: 0.8 }}
                        className="p-1.5"
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            favorites.includes(event.id)
                              ? 'text-red-400 fill-red-400'
                              : 'text-white/30'
                          }`}
                        />
                      </motion.button>
                    </div>

                    <div className="flex items-center gap-2 mt-2 text-xs text-white/50">
                      <MapPin className="w-3 h-3" />
                      <span>{event.venue}</span>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-pink-400">{event.date}</span>
                      <span className="text-xs text-emerald-400 font-medium">{event.priceRange.split(' - ')[0]}~</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Ticket className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/50">검색 결과가 없습니다</p>
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && selectedEventData && (
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
              onClick={() => setSelectedEvent(null)}
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
              <div className="h-44 bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center text-8xl relative">
                {selectedEventData.image}
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center"
                >
                  <span className="text-white text-xl">×</span>
                </button>
                {selectedEventData.hot && (
                  <span className="absolute top-4 left-4 px-3 py-1 bg-red-500 rounded-full text-xs text-white font-bold">
                    🔥 HOT
                  </span>
                )}
              </div>

              <div className="p-5 space-y-4">
                {/* Title */}
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedEventData.titleKo}</h2>
                  <p className="text-sm text-white/50">{selectedEventData.title}</p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {selectedEventData.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-pink-500/10 text-pink-400 text-xs rounded-lg"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="font-bold text-white">{selectedEventData.rating}</span>
                  <span className="text-white/40 text-sm">
                    ({selectedEventData.reviews.toLocaleString()} 리뷰)
                  </span>
                </div>

                {/* Description */}
                <p className="text-white/70">{selectedEventData.description}</p>

                {/* Info Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                      <Calendar className="w-3 h-3" />
                      <span>공연 일정</span>
                    </div>
                    <p className="text-white font-medium text-sm">{selectedEventData.date}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                      <Clock className="w-3 h-3" />
                      <span>공연 시간</span>
                    </div>
                    <p className="text-white font-medium text-sm">{selectedEventData.time}</p>
                  </div>
                </div>

                {/* Venue */}
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
                    <MapPin className="w-3 h-3" />
                    <span>공연장</span>
                  </div>
                  <p className="text-white font-medium">{selectedEventData.venue}</p>
                  <p className="text-sm text-white/50">{selectedEventData.venueEn}</p>
                </div>

                {/* Price */}
                <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-xl p-4 border border-pink-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/50 text-xs">
                      <Ticket className="w-3 h-3" />
                      <span>티켓 가격</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      selectedEventData.status === 'onsale'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {selectedEventData.status === 'onsale' ? '예매중' : '예매예정'}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-white mt-2">{selectedEventData.priceRange}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleFavorite(selectedEventData.id)}
                    className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center"
                  >
                    <Heart
                      className={`w-6 h-6 ${
                        favorites.includes(selectedEventData.id)
                          ? 'text-red-400 fill-red-400'
                          : 'text-white/50'
                      }`}
                    />
                  </motion.button>
                  <motion.a
                    href={selectedEventData.ticketLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl text-white font-semibold text-center flex items-center justify-center gap-2"
                  >
                    <Ticket className="w-5 h-5" />
                    예매하기
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
