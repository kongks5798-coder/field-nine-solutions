/**
 * KTX Train Booking Guide
 * KTX 예약 안내 페이지
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Train,
  Clock,
  MapPin,
  CreditCard,
  Smartphone,
  Globe,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Ticket,
  Users,
  Wifi,
  Coffee,
  Zap,
  Calendar,
  ArrowRight,
  Info,
} from 'lucide-react';

// Popular KTX Routes
const popularRoutes = [
  {
    from: 'Seoul',
    fromKo: '서울',
    to: 'Busan',
    toKo: '부산',
    duration: '2h 30m',
    durationKo: '2시간 30분',
    price: '₩59,800',
    priceEconomy: '₩51,800',
    frequency: '매 15-30분',
    popular: true,
  },
  {
    from: 'Seoul',
    fromKo: '서울',
    to: 'Gwangju',
    toKo: '광주',
    duration: '1h 50m',
    durationKo: '1시간 50분',
    price: '₩45,800',
    priceEconomy: '₩39,600',
    frequency: '매 30분',
    popular: true,
  },
  {
    from: 'Seoul',
    fromKo: '서울',
    to: 'Daejeon',
    toKo: '대전',
    duration: '50m',
    durationKo: '50분',
    price: '₩23,700',
    priceEconomy: '₩20,500',
    frequency: '매 15분',
    popular: false,
  },
  {
    from: 'Seoul',
    fromKo: '서울',
    to: 'Daegu',
    toKo: '대구',
    duration: '1h 40m',
    durationKo: '1시간 40분',
    price: '₩43,500',
    priceEconomy: '₩37,600',
    frequency: '매 20분',
    popular: false,
  },
  {
    from: 'Seoul',
    fromKo: '서울',
    to: 'Jeonju',
    toKo: '전주',
    duration: '1h 35m',
    durationKo: '1시간 35분',
    price: '₩34,600',
    priceEconomy: '₩29,900',
    frequency: '매 1시간',
    popular: true,
  },
  {
    from: 'Seoul',
    fromKo: '서울',
    to: 'Gangneung',
    toKo: '강릉',
    duration: '1h 50m',
    durationKo: '1시간 50분',
    price: '₩27,600',
    priceEconomy: '₩23,900',
    frequency: '매 30분',
    popular: true,
  },
];

// Booking methods
const bookingMethods = [
  {
    id: 'korail',
    name: 'Korail Official',
    nameKo: '코레일 공식',
    icon: Globe,
    color: 'from-blue-500 to-cyan-500',
    pros: ['Official prices', 'Rail Pass available', 'Multi-language'],
    prosKo: ['공식 가격', '레일패스 가능', '다국어 지원'],
    cons: ['Complex interface'],
    consKo: ['복잡한 인터페이스'],
    url: 'https://www.letskorail.com',
  },
  {
    id: 'kakao',
    name: 'Kakao T',
    nameKo: '카카오 T',
    icon: Smartphone,
    color: 'from-yellow-500 to-amber-500',
    pros: ['Easy mobile app', 'Linked with Kakao Pay', 'Real-time info'],
    prosKo: ['편리한 앱', '카카오페이 연동', '실시간 정보'],
    cons: ['Korean language only'],
    consKo: ['한국어만 지원'],
    url: null,
  },
  {
    id: 'naver',
    name: 'Naver',
    nameKo: '네이버',
    icon: Globe,
    color: 'from-green-500 to-emerald-500',
    pros: ['Price comparison', 'User reviews', 'Easy booking'],
    prosKo: ['가격 비교', '사용자 리뷰', '간편 예약'],
    cons: ['Korean interface'],
    consKo: ['한국어 인터페이스'],
    url: 'https://m.map.naver.com',
  },
];

// Train amenities
const amenities = [
  {
    icon: Wifi,
    name: 'Free Wi-Fi',
    nameKo: '무료 와이파이',
    description: 'All cars equipped',
    descriptionKo: '전 객차 이용 가능',
  },
  {
    icon: Coffee,
    name: 'Cafe Car',
    nameKo: '카페 객차',
    description: 'Snacks & beverages',
    descriptionKo: '스낵 & 음료',
  },
  {
    icon: Zap,
    name: 'Power Outlets',
    nameKo: '전원 콘센트',
    description: 'Every seat',
    descriptionKo: '모든 좌석',
  },
  {
    icon: Users,
    name: 'Family Room',
    nameKo: '패밀리룸',
    description: 'For families with children',
    descriptionKo: '어린이 동반 가족용',
  },
];

// Seat classes
const seatClasses = [
  {
    name: 'First Class',
    nameKo: '특실',
    description: 'Spacious leather seats, premium service',
    descriptionKo: '넓은 가죽 좌석, 프리미엄 서비스',
    priceMultiplier: '1x',
    features: ['Wider seats', 'More legroom', 'Quieter car'],
    featuresKo: ['더 넓은 좌석', '넓은 다리 공간', '조용한 객차'],
    color: 'from-amber-500 to-orange-500',
  },
  {
    name: 'Standard',
    nameKo: '일반실',
    description: 'Comfortable standard seats',
    descriptionKo: '편안한 일반 좌석',
    priceMultiplier: '0.85x',
    features: ['Standard seats', 'Economy price', 'Most popular'],
    featuresKo: ['표준 좌석', '경제적 가격', '가장 인기'],
    color: 'from-blue-500 to-cyan-500',
  },
];

// Tips
const tips = [
  {
    title: 'Book Early',
    titleKo: '조기 예매',
    description: 'Book 1 month in advance for holidays',
    descriptionKo: '명절 시즌은 1달 전 예매 필수',
    type: 'warning',
  },
  {
    title: 'Korail Pass',
    titleKo: '코레일 패스',
    description: 'Unlimited travel pass for foreigners',
    descriptionKo: '외국인 전용 무제한 이용권',
    type: 'tip',
  },
  {
    title: 'Standing Tickets',
    titleKo: '입석',
    description: 'Available when seats are sold out',
    descriptionKo: '좌석 매진 시 입석 이용 가능',
    type: 'info',
  },
  {
    title: 'Refund Policy',
    titleKo: '환불 정책',
    description: 'Full refund up to 3 hours before departure',
    descriptionKo: '출발 3시간 전까지 전액 환불',
    type: 'info',
  },
];

export default function KTXPage() {
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
  const [expandedMethod, setExpandedMethod] = useState<string | null>('korail');

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0F] via-[#0F0F1A] to-[#0A0A0F] pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 flex items-center justify-center">
              <Train className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">KTX Guide</h1>
              <p className="text-xs text-white/50">고속열차 예약 안내</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {/* KTX Info Banner */}
        <motion.div
          className="bg-gradient-to-br from-rose-500/10 to-orange-500/10 rounded-2xl p-5 border border-rose-500/20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
              <Train className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Korea Train Express</h2>
              <p className="text-sm text-white/60">한국고속철도 KTX</p>
            </div>
          </div>
          <p className="text-sm text-white/70">
            최고 시속 305km/h로 한국 전역을 연결하는 고속철도.
            서울에서 부산까지 2시간 30분이면 도착합니다.
          </p>
        </motion.div>

        {/* Popular Routes */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-rose-400" />
            인기 노선
          </h2>

          <div className="space-y-3">
            {popularRoutes.map((route, idx) => (
              <motion.div
                key={idx}
                className={`bg-white/5 rounded-xl border transition-all cursor-pointer ${
                  selectedRoute === idx
                    ? 'border-rose-500/50 bg-rose-500/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
                onClick={() => setSelectedRoute(selectedRoute === idx ? null : idx)}
                whileTap={{ scale: 0.98 }}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-lg font-bold text-white">{route.fromKo}</p>
                        <p className="text-xs text-white/40">{route.from}</p>
                      </div>
                      <div className="flex items-center gap-2 px-3">
                        <div className="w-2 h-2 rounded-full bg-rose-400" />
                        <div className="w-12 h-0.5 bg-gradient-to-r from-rose-400 to-orange-400" />
                        <ArrowRight className="w-4 h-4 text-orange-400" />
                        <div className="w-12 h-0.5 bg-gradient-to-r from-orange-400 to-amber-400" />
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-white">{route.toKo}</p>
                        <p className="text-xs text-white/40">{route.to}</p>
                      </div>
                    </div>
                    {route.popular && (
                      <span className="px-2 py-1 bg-rose-500/20 rounded-full text-xs text-rose-400">
                        인기
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-white/60">
                      <Clock className="w-4 h-4" />
                      <span>{route.durationKo}</span>
                    </div>
                    <div className="flex items-center gap-1 text-white/60">
                      <Calendar className="w-4 h-4" />
                      <span>{route.frequency}</span>
                    </div>
                    <div className="text-emerald-400 font-bold">{route.price}</div>
                  </div>
                </div>

                <AnimatePresence>
                  {selectedRoute === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/10"
                    >
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-xs text-white/50 mb-1">특실 (First Class)</p>
                            <p className="text-white font-bold">{route.price}</p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-xs text-white/50 mb-1">일반실 (Standard)</p>
                            <p className="text-white font-bold">{route.priceEconomy}</p>
                          </div>
                        </div>
                        <motion.a
                          href="https://www.letskorail.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full py-3 bg-gradient-to-r from-rose-500 to-orange-500 rounded-xl text-white text-center font-semibold"
                          whileTap={{ scale: 0.98 }}
                        >
                          예약하기
                        </motion.a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Seat Classes */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-amber-400" />
            좌석 등급
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {seatClasses.map((seatClass, idx) => (
              <motion.div
                key={idx}
                className={`bg-gradient-to-br ${seatClass.color} p-0.5 rounded-xl`}
                whileHover={{ scale: 1.02 }}
              >
                <div className="bg-[#0A0A0F] rounded-xl p-4 h-full">
                  <h3 className="font-bold text-white mb-1">{seatClass.nameKo}</h3>
                  <p className="text-xs text-white/50 mb-3">{seatClass.name}</p>
                  <ul className="space-y-1">
                    {seatClass.featuresKo.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-white/70">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Train Amenities */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Coffee className="w-5 h-5 text-cyan-400" />
            열차 시설
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {amenities.map((amenity, idx) => {
              const Icon = amenity.icon;
              return (
                <div key={idx} className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-medium text-white">{amenity.nameKo}</span>
                  </div>
                  <p className="text-xs text-white/50">{amenity.descriptionKo}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Booking Methods */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-purple-400" />
            예약 방법
          </h2>

          <div className="space-y-3">
            {bookingMethods.map((method) => {
              const Icon = method.icon;
              const isExpanded = expandedMethod === method.id;

              return (
                <motion.div
                  key={method.id}
                  className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedMethod(isExpanded ? null : method.id)}
                    className="w-full p-4 flex items-center gap-3"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${method.color} flex items-center justify-center`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-white">{method.nameKo}</h3>
                      <p className="text-xs text-white/50">{method.name}</p>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-5 h-5 text-white/40" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4"
                      >
                        <div className="pt-3 border-t border-white/10 space-y-3">
                          <div>
                            <p className="text-xs text-emerald-400 mb-2">장점</p>
                            <div className="flex flex-wrap gap-2">
                              {method.prosKo.map((pro, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-lg"
                                >
                                  {pro}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-amber-400 mb-2">참고사항</p>
                            <div className="flex flex-wrap gap-2">
                              {method.consKo.map((con, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-lg"
                                >
                                  {con}
                                </span>
                              ))}
                            </div>
                          </div>
                          {method.url && (
                            <motion.a
                              href={method.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-full py-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-center text-sm text-white/80 transition-colors"
                              whileTap={{ scale: 0.98 }}
                            >
                              바로가기 →
                            </motion.a>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Tips */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-400" />
            예약 팁
          </h2>

          <div className="space-y-3">
            {tips.map((tip, idx) => (
              <motion.div
                key={idx}
                className={`p-4 rounded-xl border ${
                  tip.type === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : tip.type === 'tip'
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-blue-500/10 border-blue-500/30'
                }`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="flex items-start gap-3">
                  {tip.type === 'warning' ? (
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  ) : tip.type === 'tip' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className="font-semibold text-white">{tip.titleKo}</h3>
                    <p className="text-sm text-white/60 mt-1">{tip.descriptionKo}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Korail Pass Promo */}
        <motion.div
          className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl p-5 border border-indigo-500/30"
          whileHover={{ scale: 1.01 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">Korail Pass</h3>
              <p className="text-xs text-white/60">외국인 전용 무제한 이용권</p>
            </div>
          </div>
          <p className="text-sm text-white/70 mb-4">
            외국인 관광객을 위한 특별 이용권. 정해진 기간 동안 KTX를 무제한으로 이용할 수 있습니다.
          </p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <p className="text-xs text-white/50">2일권</p>
              <p className="text-lg font-bold text-white">₩121,000</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <p className="text-xs text-white/50">5일권</p>
              <p className="text-lg font-bold text-white">₩230,000</p>
            </div>
          </div>
          <motion.a
            href="https://www.letskorail.com/ebizbf/EbizBfKrPassAbout.do"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white text-center font-semibold"
            whileTap={{ scale: 0.98 }}
          >
            Korail Pass 알아보기
          </motion.a>
        </motion.div>
      </div>
    </div>
  );
}
