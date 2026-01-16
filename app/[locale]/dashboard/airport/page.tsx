/**
 * Airport Information Page
 * 공항 정보 - 인천/김포공항 안내
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane,
  Train,
  Bus,
  Car,
  Clock,
  MapPin,
  Phone,
  Wifi,
  Coffee,
  ShoppingBag,
  Luggage,
  CreditCard,
  Globe,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Navigation,
} from 'lucide-react';

// Airport data
const airports = [
  {
    id: 'icn',
    name: 'Incheon International',
    nameKo: '인천국제공항',
    code: 'ICN',
    terminals: ['T1', 'T2'],
    distance: '52km from Seoul',
    distanceKo: '서울에서 52km',
  },
  {
    id: 'gmp',
    name: 'Gimpo International',
    nameKo: '김포국제공항',
    code: 'GMP',
    terminals: ['Domestic', 'International'],
    distance: '18km from Seoul',
    distanceKo: '서울에서 18km',
  },
];

// Transportation options
const transportOptions = [
  {
    id: 'arex',
    name: 'Airport Railroad (AREX)',
    nameKo: '공항철도 (AREX)',
    icon: Train,
    color: 'from-blue-500 to-cyan-500',
    options: [
      {
        type: 'Express',
        typeKo: '직통열차',
        price: '₩11,000',
        duration: '43min',
        durationKo: '43분',
        frequency: 'Every 30-40min',
        frequencyKo: '30-40분 간격',
        route: 'ICN T1/T2 → Seoul Station',
        routeKo: '인천공항 T1/T2 → 서울역',
      },
      {
        type: 'All-Stop',
        typeKo: '일반열차',
        price: '₩4,750',
        duration: '66min',
        durationKo: '66분',
        frequency: 'Every 6-12min',
        frequencyKo: '6-12분 간격',
        route: 'ICN → Gimpo → Hongdae → Seoul',
        routeKo: '인천공항 → 김포공항 → 홍대입구 → 서울역',
      },
    ],
  },
  {
    id: 'bus',
    name: 'Airport Limousine Bus',
    nameKo: '공항 리무진 버스',
    icon: Bus,
    color: 'from-green-500 to-emerald-500',
    options: [
      {
        type: 'KAL Limousine',
        typeKo: 'KAL 리무진',
        price: '₩18,000',
        duration: '60-90min',
        durationKo: '60-90분',
        frequency: 'Every 15-30min',
        frequencyKo: '15-30분 간격',
        route: 'Major hotels in Seoul',
        routeKo: '서울 주요 호텔',
      },
      {
        type: 'City Bus',
        typeKo: '일반 공항버스',
        price: '₩10,000-15,000',
        duration: '70-100min',
        durationKo: '70-100분',
        frequency: 'Every 15-25min',
        frequencyKo: '15-25분 간격',
        route: 'Various destinations',
        routeKo: '다양한 목적지',
      },
    ],
  },
  {
    id: 'taxi',
    name: 'Taxi',
    nameKo: '택시',
    icon: Car,
    color: 'from-amber-500 to-orange-500',
    options: [
      {
        type: 'Regular Taxi',
        typeKo: '일반 택시',
        price: '₩65,000-80,000',
        duration: '50-70min',
        durationKo: '50-70분',
        frequency: '24/7',
        frequencyKo: '24시간',
        route: 'To Seoul (Gangnam/Myeongdong)',
        routeKo: '서울 (강남/명동)',
      },
      {
        type: 'International Taxi',
        typeKo: '인터내셔널 택시',
        price: '₩75,000-95,000',
        duration: '50-70min',
        durationKo: '50-70분',
        frequency: 'On demand',
        frequencyKo: '요청시',
        route: 'English-speaking driver',
        routeKo: '영어 가능 기사',
      },
    ],
  },
];

// Airport facilities
const facilities = [
  {
    icon: Wifi,
    name: 'Free Wi-Fi',
    nameKo: '무료 와이파이',
    description: 'Available throughout the airport',
    descriptionKo: '공항 전역 이용 가능',
  },
  {
    icon: Coffee,
    name: 'Lounges',
    nameKo: '라운지',
    description: 'Premium & airline lounges',
    descriptionKo: '프리미엄 & 항공사 라운지',
  },
  {
    icon: ShoppingBag,
    name: 'Duty Free',
    nameKo: '면세점',
    description: '200+ shops available',
    descriptionKo: '200개 이상 매장',
  },
  {
    icon: Luggage,
    name: 'Luggage Storage',
    nameKo: '수하물 보관',
    description: '₩5,000-15,000/day',
    descriptionKo: '₩5,000-15,000/일',
  },
  {
    icon: CreditCard,
    name: 'Currency Exchange',
    nameKo: '환전소',
    description: 'Multiple locations',
    descriptionKo: '다양한 위치',
  },
  {
    icon: Globe,
    name: 'SIM Cards',
    nameKo: 'SIM 카드',
    description: 'Prepaid data SIMs',
    descriptionKo: '선불 데이터 SIM',
  },
];

// Tips
const tips = [
  {
    title: 'Early Check-in',
    titleKo: '조기 체크인',
    description: 'Arrive 3 hours before international flights',
    descriptionKo: '국제선은 3시간 전 도착 권장',
    type: 'info',
  },
  {
    title: 'T-money Card',
    titleKo: '티머니 카드',
    description: 'Get a T-money card for all public transport',
    descriptionKo: '대중교통용 티머니 카드 구매',
    type: 'tip',
  },
  {
    title: 'Tax Refund',
    titleKo: '세금 환급',
    description: 'Complete tax refund before check-in',
    descriptionKo: '체크인 전 세금 환급 완료',
    type: 'tip',
  },
  {
    title: 'Transfer Times',
    titleKo: '환승 시간',
    description: 'Allow 2+ hours for transfers between T1 and T2',
    descriptionKo: 'T1-T2 간 환승은 2시간 이상 필요',
    type: 'warning',
  },
];

export default function AirportPage() {
  const [selectedAirport, setSelectedAirport] = useState('icn');
  const [expandedTransport, setExpandedTransport] = useState<string | null>('arex');

  const currentAirport = airports.find((a) => a.id === selectedAirport);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0F] via-[#0F0F1A] to-[#0A0A0F] pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 flex items-center justify-center">
              <Plane className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Airport Info</h1>
              <p className="text-xs text-white/50">공항 정보</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {/* Airport Selector */}
        <div className="flex gap-2">
          {airports.map((airport) => (
            <motion.button
              key={airport.id}
              onClick={() => setSelectedAirport(airport.id)}
              className={`flex-1 py-3 px-4 rounded-xl border transition-all ${
                selectedAirport === airport.id
                  ? 'bg-sky-500/20 border-sky-500/50 text-white'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-lg font-bold">{airport.code}</div>
              <div className="text-xs opacity-70">{airport.nameKo}</div>
            </motion.button>
          ))}
        </div>

        {/* Airport Info Card */}
        <motion.div
          key={selectedAirport}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-sky-500/10 to-blue-500/10 rounded-2xl p-5 border border-white/10"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">{currentAirport?.nameKo}</h2>
              <p className="text-sm text-white/60">{currentAirport?.name}</p>
            </div>
            <div className="px-3 py-1.5 bg-sky-500/20 rounded-lg">
              <span className="text-sky-400 font-mono font-bold">{currentAirport?.code}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-xl p-3">
              <div className="flex items-center gap-2 text-white/60 text-xs mb-1">
                <MapPin className="w-3 h-3" />
                <span>거리</span>
              </div>
              <p className="text-white font-medium">{currentAirport?.distanceKo}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <div className="flex items-center gap-2 text-white/60 text-xs mb-1">
                <Plane className="w-3 h-3" />
                <span>터미널</span>
              </div>
              <p className="text-white font-medium">{currentAirport?.terminals.join(' / ')}</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex gap-2 mt-4">
            <motion.a
              href="https://www.airport.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-center text-sm text-white/80 transition-colors"
              whileTap={{ scale: 0.98 }}
            >
              공식 웹사이트
            </motion.a>
            <motion.button
              className="flex-1 py-2.5 bg-sky-500/20 hover:bg-sky-500/30 rounded-xl text-center text-sm text-sky-400 transition-colors flex items-center justify-center gap-1"
              whileTap={{ scale: 0.98 }}
            >
              <Navigation className="w-4 h-4" />
              길찾기
            </motion.button>
          </div>
        </motion.div>

        {/* Transportation Options */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Train className="w-5 h-5 text-blue-400" />
            교통편 안내
          </h2>

          <div className="space-y-3">
            {transportOptions.map((transport) => {
              const Icon = transport.icon;
              const isExpanded = expandedTransport === transport.id;

              return (
                <motion.div
                  key={transport.id}
                  className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedTransport(isExpanded ? null : transport.id)}
                    className="w-full p-4 flex items-center gap-3"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${transport.color} flex items-center justify-center`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-white">{transport.nameKo}</h3>
                      <p className="text-xs text-white/50">{transport.name}</p>
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
                        transition={{ duration: 0.2 }}
                        className="px-4 pb-4"
                      >
                        <div className="space-y-3 pt-2 border-t border-white/10">
                          {transport.options.map((option, idx) => (
                            <div
                              key={idx}
                              className="bg-white/5 rounded-xl p-3 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-white">{option.typeKo}</span>
                                <span className="text-emerald-400 font-bold">{option.price}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-1 text-white/60">
                                  <Clock className="w-3 h-3" />
                                  <span>{option.durationKo}</span>
                                </div>
                                <div className="flex items-center gap-1 text-white/60">
                                  <span>⏱</span>
                                  <span>{option.frequencyKo}</span>
                                </div>
                              </div>
                              <p className="text-xs text-white/50">{option.routeKo}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Facilities */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-purple-400" />
            공항 시설
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {facilities.map((facility, idx) => {
              const Icon = facility.icon;
              return (
                <motion.div
                  key={idx}
                  className="bg-white/5 rounded-xl p-3 border border-white/10"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-white">{facility.nameKo}</span>
                  </div>
                  <p className="text-xs text-white/50">{facility.descriptionKo}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Tips */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            공항 이용 팁
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
                  ) : (
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
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

        {/* Emergency Contacts */}
        <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-2xl p-5 border border-red-500/20">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-red-400" />
            긴급 연락처
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white/5 rounded-xl p-3">
              <span className="text-white/60">인천공항 안내</span>
              <a href="tel:1577-2600" className="text-sky-400 font-mono">1577-2600</a>
            </div>
            <div className="flex items-center justify-between bg-white/5 rounded-xl p-3">
              <span className="text-white/60">김포공항 안내</span>
              <a href="tel:02-2660-2114" className="text-sky-400 font-mono">02-2660-2114</a>
            </div>
            <div className="flex items-center justify-between bg-white/5 rounded-xl p-3">
              <span className="text-white/60">관광 안내 (영어)</span>
              <a href="tel:1330" className="text-sky-400 font-mono">1330</a>
            </div>
          </div>
        </div>

        {/* Ghost Wallet Promo */}
        <motion.div
          className="bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-2xl p-5 border border-violet-500/30"
          whileHover={{ scale: 1.01 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">Ghost Wallet</h3>
              <p className="text-xs text-white/60">공항에서 환전 필요 없이 바로 결제</p>
            </div>
          </div>
          <p className="text-sm text-white/70 mb-4">
            Ghost Wallet으로 한국에서 현금 없이 어디서든 결제하세요.
            공항 환전소보다 더 좋은 환율을 제공합니다.
          </p>
          <motion.button
            className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl text-white font-semibold"
            whileTap={{ scale: 0.98 }}
          >
            Ghost Wallet 시작하기
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
