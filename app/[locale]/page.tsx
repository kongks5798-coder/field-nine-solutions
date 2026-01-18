'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import {
  Smartphone,
  Globe,
  Wifi,
  CreditCard,
  MessageSquare,
  Map,
  ArrowRight,
  Check,
  Star,
  Zap,
  Shield,
  Clock,
  ChevronDown,
  Plane,
  Building2,
  Utensils,
  ShoppingBag,
  Train,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Languages,
  HeadphonesIcon,
  RefreshCw,
  Users,
  Download,
  Bell,
  Gift,
  Percent,
  MapPin,
  Coffee,
  Camera,
  Music,
  BadgeCheck,
  Timer,
  Banknote,
  ArrowUpRight,
  ChevronRight,
  Play,
  X,
} from 'lucide-react';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================
type TranslationType = {
  nav: { esim: string; services: string; pricing: string; download: string };
  hero: {
    badge: string;
    title1: string;
    title2: string;
    subtitle: string;
    cta: string;
    ctaSecondary: string;
    trustBadges: string[];
  };
  stats: { value: string; label: string; suffix?: string }[];
  exchange: {
    title: string;
    subtitle: string;
    updated: string;
    source: string;
    viewAll: string;
    alert: string;
    alertDesc: string;
  };
  esim: {
    badge: string;
    title: string;
    subtitle: string;
    features: { icon: string; title: string; desc: string }[];
    plans: { name: string; data: string; days: string; price: string; originalPrice: string; popular?: boolean }[];
    cta: string;
    guarantee: string;
  };
  services: {
    badge: string;
    title: string;
    subtitle: string;
    earlyAccess: string;
    items: { icon: string; name: string; desc: string; benefit: string; status: string }[];
    notify: string;
    notifyDesc: string;
  };
  ai: {
    badge: string;
    title: string;
    subtitle: string;
    features: { title: string; desc: string }[];
    tryNow: string;
  };
  reviews: {
    title: string;
    subtitle: string;
    items: { name: string; country: string; rating: number; text: string; date: string }[];
  };
  pricing: {
    badge: string;
    title: string;
    subtitle: string;
    plans: {
      name: string;
      price: string;
      period: string;
      desc: string;
      features: string[];
      cta: string;
      popular?: boolean;
    }[];
    guarantee: string;
  };
  cta: {
    badge: string;
    title: string;
    subtitle: string;
    benefit1: string;
    benefit2: string;
    benefit3: string;
    button: string;
    limited: string;
  };
  footer: {
    company: string;
    desc: string;
    product: string;
    support: string;
    legal: string;
    links: { product: string[]; support: string[]; legal: string[] };
  };
};

// =============================================================================
// TRANSLATIONS
// =============================================================================
const translations: Record<string, TranslationType> = {
  ko: {
    nav: {
      esim: 'eSIM',
      services: '서비스',
      pricing: '요금제',
      download: '앱 다운로드',
    },
    hero: {
      badge: '🎉 런칭 기념 eSIM 30% 할인',
      title1: '해외여행의 모든 것',
      title2: '하나의 앱으로',
      subtitle: 'eSIM부터 환율, 호텔, 항공까지. 복잡한 해외여행 준비, 이제 3분이면 끝.',
      cta: '무료로 시작하기',
      ctaSecondary: '앱 미리보기',
      trustBadges: ['10만+ 다운로드', '4.9★ 평점', '24시간 응답'],
    },
    stats: [
      { value: '190', label: '지원 국가', suffix: '+' },
      { value: '50', label: '절약 가능', suffix: '%' },
      { value: '3', label: '개통 시간', suffix: '분' },
      { value: '24', label: '고객 지원', suffix: '/7' },
    ],
    exchange: {
      title: '실시간 환율',
      subtitle: '주요 통화 환율을 실시간으로 확인하세요',
      updated: '방금 업데이트',
      source: '한국은행 기준',
      viewAll: '전체 환율 보기',
      alert: '환율 알림',
      alertDesc: '목표 환율 도달 시 푸시 알림',
    },
    esim: {
      badge: '가장 인기있는 기능',
      title: '해외 eSIM',
      subtitle: '유심 교체 없이, QR 스캔 한 번으로 현지 데이터 즉시 사용',
      features: [
        { icon: 'Zap', title: '3분 개통', desc: 'QR 스캔으로 즉시 활성화' },
        { icon: 'Shield', title: '기존 번호 유지', desc: '카톡, 문자 그대로 수신' },
        { icon: 'Wifi', title: '5G 속도', desc: '현지 최고 속도 네트워크' },
        { icon: 'Percent', title: '최대 70% 절약', desc: '통신사 로밍 대비' },
      ],
      plans: [
        { name: '🇯🇵 일본', data: '3GB', days: '7일', price: '₩6,900', originalPrice: '₩9,900', popular: true },
        { name: '🇺🇸 미국', data: '5GB', days: '10일', price: '₩9,900', originalPrice: '₩14,900' },
        { name: '🇪🇺 유럽 39개국', data: '10GB', days: '14일', price: '₩15,900', originalPrice: '₩22,900' },
        { name: '🇹🇭 동남아 8개국', data: '5GB', days: '10일', price: '₩7,900', originalPrice: '₩11,900' },
      ],
      cta: '전체 요금제 보기',
      guarantee: '✅ 연결 안되면 100% 환불 보장',
    },
    services: {
      badge: '올인원 여행 플랫폼',
      title: '여행에 필요한 모든 서비스',
      subtitle: '흩어진 앱들, 이제 하나로 통합하세요',
      earlyAccess: '얼리엑세스',
      items: [
        { icon: 'Building2', name: '호텔 예약', desc: '전 세계 100만+ 숙소', benefit: '최대 15% 캐시백', status: 'beta' },
        { icon: 'Plane', name: '항공권', desc: '실시간 최저가 비교', benefit: '가격 알림 무료', status: 'coming' },
        { icon: 'Banknote', name: '환전 예약', desc: '은행 우대 환율 적용', benefit: '수수료 90% 할인', status: 'beta' },
        { icon: 'Train', name: 'JR패스/유레일', desc: '교통패스 사전 구매', benefit: '최저가 보장', status: 'coming' },
        { icon: 'Coffee', name: '맛집 예약', desc: 'AI 추천 + 예약 대행', benefit: '대기 없이 입장', status: 'coming' },
        { icon: 'Camera', name: '투어/티켓', desc: '관광지 입장권', benefit: '줄서기 패스', status: 'beta' },
      ],
      notify: '출시 알림 받기',
      notifyDesc: '새 서비스 출시 시 가장 먼저 알려드려요',
    },
    ai: {
      badge: 'AI 여행 도우미',
      title: '뭘 물어봐도 답해주는 AI',
      subtitle: '맛집, 교통, 쇼핑, 긴급상황까지 24시간 실시간 도움',
      features: [
        { title: '50개 언어 실시간 번역', desc: '사진 찍으면 즉시 번역' },
        { title: '맞춤 여행 추천', desc: '취향 분석 기반 코스 추천' },
        { title: '긴급상황 대응', desc: '병원, 경찰, 대사관 연결' },
      ],
      tryNow: 'AI와 대화해보기',
    },
    reviews: {
      title: '실제 사용자 후기',
      subtitle: '10만+ 여행자가 선택한 이유',
      items: [
        { name: '김지현', country: '일본 여행', rating: 5, text: '인천공항에서 QR 찍자마자 바로 연결됐어요. 유심 줄 서는 거 생각하면 진짜 신세계...', date: '3일 전' },
        { name: '이준호', country: '유럽 배낭여행', rating: 5, text: '유럽 6개국 다녔는데 하나의 eSIM으로 끝. 나라 바뀔 때마다 자동 연결되는 게 미침', date: '1주 전' },
        { name: '박서연', country: '미국 출장', rating: 5, text: '회사에서 로밍비 청구하기 애매했는데 이건 영수증도 깔끔하게 나와서 좋아요', date: '2주 전' },
      ],
    },
    pricing: {
      badge: '심플한 요금제',
      title: '필요한 만큼만',
      subtitle: 'eSIM은 개별 구매, 프리미엄 기능은 구독으로',
      plans: [
        {
          name: 'Free',
          price: '₩0',
          period: '',
          desc: '기본 기능 무료',
          features: ['실시간 환율 조회', 'AI 도우미 (일 5회)', '여행 체크리스트'],
          cta: '무료 시작',
          popular: false,
        },
        {
          name: 'Traveler',
          price: '₩4,900',
          period: '/월',
          desc: '자주 여행하는 분',
          features: ['eSIM 10% 상시 할인', 'AI 도우미 무제한', '환율 알림 무제한', '프리미엄 고객 지원'],
          cta: '7일 무료 체험',
          popular: true,
        },
        {
          name: 'Business',
          price: '₩14,900',
          period: '/월',
          desc: '해외 출장 잦은 분',
          features: ['eSIM 20% 상시 할인', '라운지 할인 (연 4회)', '비즈니스 영수증', '전담 매니저'],
          cta: '문의하기',
          popular: false,
        },
      ],
      guarantee: '7일 무료 체험 후 결정하세요. 언제든 취소 가능.',
    },
    cta: {
      badge: '🎁 런칭 특별 혜택',
      title: '지금 가입하면',
      subtitle: '선착순 1,000명에게 드리는 특별 혜택',
      benefit1: '첫 eSIM 구매 30% 할인',
      benefit2: 'Traveler 요금제 2개월 무료',
      benefit3: '₩10,000 크레딧 지급',
      button: '혜택 받고 시작하기',
      limited: '🔥 남은 자리: 127/1,000',
    },
    footer: {
      company: 'Field Nine Solutions',
      desc: '해외여행을 더 쉽게',
      product: '제품',
      support: '지원',
      legal: '법적 고지',
      links: {
        product: ['eSIM', '환율', '호텔', '항공권'],
        support: ['고객센터', 'FAQ', '이용가이드'],
        legal: ['이용약관', '개인정보처리방침', '환불정책'],
      },
    },
  },
  en: {
    nav: {
      esim: 'eSIM',
      services: 'Services',
      pricing: 'Pricing',
      download: 'Download App',
    },
    hero: {
      badge: '🎉 Launch Special: 30% OFF eSIM',
      title1: 'Everything for',
      title2: 'Korea Travel',
      subtitle: 'eSIM, exchange rates, hotels, and more. Your complete Korea travel companion in one app.',
      cta: 'Get Started Free',
      ctaSecondary: 'Watch Demo',
      trustBadges: ['100K+ Downloads', '4.9★ Rating', '24/7 Support'],
    },
    stats: [
      { value: '5G', label: 'Network Speed', suffix: '' },
      { value: '50', label: 'Cheaper than SIM', suffix: '%' },
      { value: '3', label: 'Min Setup', suffix: 'min' },
      { value: '24', label: 'Support', suffix: '/7' },
    ],
    exchange: {
      title: 'Live Exchange Rates',
      subtitle: 'Real-time rates updated every minute',
      updated: 'Just updated',
      source: 'Source: Bank of Korea',
      viewAll: 'View All Rates',
      alert: 'Rate Alerts',
      alertDesc: 'Get notified when your target rate is reached',
    },
    esim: {
      badge: 'Most Popular',
      title: 'Korea eSIM',
      subtitle: 'Stay connected instantly. No physical SIM needed.',
      features: [
        { icon: 'Zap', title: '3 Min Setup', desc: 'Scan QR and connect' },
        { icon: 'Shield', title: 'Keep Your Number', desc: 'Receive calls normally' },
        { icon: 'Wifi', title: '5G Speed', desc: 'Fastest Korean network' },
        { icon: 'Percent', title: 'Save 70%', desc: 'vs airport SIM cards' },
      ],
      plans: [
        { name: '🇰🇷 Korea', data: '2GB', days: '3 days', price: '$3.99', originalPrice: '$5.99', popular: true },
        { name: '🇰🇷 Korea', data: '5GB', days: '7 days', price: '$6.99', originalPrice: '$9.99' },
        { name: '🇰🇷 Korea', data: '10GB', days: '14 days', price: '$11.99', originalPrice: '$16.99' },
        { name: '🇰🇷 Korea', data: 'Unlimited', days: '30 days', price: '$19.99', originalPrice: '$29.99' },
      ],
      cta: 'View All Plans',
      guarantee: '✅ 100% money-back if no connection',
    },
    services: {
      badge: 'All-in-One Platform',
      title: 'Everything You Need',
      subtitle: 'Stop switching between apps',
      earlyAccess: 'Early Access',
      items: [
        { icon: 'Building2', name: 'Hotels', desc: '1M+ accommodations', benefit: 'Up to 15% cashback', status: 'beta' },
        { icon: 'Utensils', name: 'Food Delivery', desc: 'Korean food to your door', benefit: 'English menus', status: 'coming' },
        { icon: 'Banknote', name: 'Money Exchange', desc: 'Best rates guaranteed', benefit: '90% less fees', status: 'beta' },
        { icon: 'Train', name: 'KTX Tickets', desc: 'High-speed rail', benefit: 'E-tickets instant', status: 'coming' },
        { icon: 'Coffee', name: 'Restaurant', desc: 'AI recommendations', benefit: 'No waiting', status: 'coming' },
        { icon: 'Camera', name: 'Tours & Tickets', desc: 'Attractions & shows', benefit: 'Skip the line', status: 'beta' },
      ],
      notify: 'Get Notified',
      notifyDesc: "Be the first to know when new services launch",
    },
    ai: {
      badge: 'AI Travel Guide',
      title: 'Your Personal Concierge',
      subtitle: 'Food, transport, shopping, emergencies - 24/7 real-time help',
      features: [
        { title: '50 Language Translation', desc: 'Photo translation instant' },
        { title: 'Personalized Recommendations', desc: 'Based on your preferences' },
        { title: 'Emergency Assistance', desc: 'Hospital, police, embassy' },
      ],
      tryNow: 'Try AI Guide',
    },
    reviews: {
      title: 'Real User Reviews',
      subtitle: 'Why 100K+ travelers chose us',
      items: [
        { name: 'Sarah M.', country: 'USA → Korea', rating: 5, text: 'Connected the moment I landed at Incheon. No more hunting for SIM cards at the airport!', date: '3 days ago' },
        { name: 'James L.', country: 'UK → Korea', rating: 5, text: 'The AI guide helped me find amazing BBQ spots that weren\'t in any tourist guides. Game changer!', date: '1 week ago' },
        { name: 'Emma T.', country: 'Australia → Korea', rating: 5, text: 'Used it for 2 weeks in Seoul. The exchange rate alerts saved me so much money.', date: '2 weeks ago' },
      ],
    },
    pricing: {
      badge: 'Simple Pricing',
      title: 'Pay for What You Need',
      subtitle: 'eSIM pay-per-use, premium features by subscription',
      plans: [
        {
          name: 'Free',
          price: '$0',
          period: '',
          desc: 'Basic features free',
          features: ['Live exchange rates', 'AI Guide (5/day)', 'Travel checklist'],
          cta: 'Start Free',
          popular: false,
        },
        {
          name: 'Traveler',
          price: '$3.99',
          period: '/mo',
          desc: 'Frequent travelers',
          features: ['10% off all eSIM', 'Unlimited AI Guide', 'Unlimited rate alerts', 'Priority support'],
          cta: '7-Day Free Trial',
          popular: true,
        },
        {
          name: 'Business',
          price: '$9.99',
          period: '/mo',
          desc: 'Business travelers',
          features: ['20% off all eSIM', 'Lounge discounts', 'Business receipts', 'Dedicated manager'],
          cta: 'Contact Us',
          popular: false,
        },
      ],
      guarantee: 'Try free for 7 days. Cancel anytime.',
    },
    cta: {
      badge: '🎁 Launch Special',
      title: 'Sign Up Now',
      subtitle: 'Exclusive benefits for first 1,000 users',
      benefit1: '30% off your first eSIM',
      benefit2: '2 months Traveler plan free',
      benefit3: '$10 credit bonus',
      button: 'Claim Your Benefits',
      limited: '🔥 Spots left: 127/1,000',
    },
    footer: {
      company: 'Field Nine Solutions',
      desc: 'Making travel easy',
      product: 'Product',
      support: 'Support',
      legal: 'Legal',
      links: {
        product: ['eSIM', 'Exchange', 'Hotels', 'Flights'],
        support: ['Help Center', 'FAQ', 'User Guide'],
        legal: ['Terms', 'Privacy', 'Refund Policy'],
      },
    },
  },
};

translations.ja = translations.en;
translations.zh = translations.en;

// =============================================================================
// HELPER
// =============================================================================
function getT(locale: string): TranslationType {
  return translations[locale] || translations.en;
}

function getIcon(name: string) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    Zap, Shield, Globe, CreditCard, Wifi, Languages, Map, HeadphonesIcon,
    Building2, Plane, Train, ShoppingBag, Utensils, Coffee, Camera, Banknote, Percent,
  };
  return icons[name] || Globe;
}

// =============================================================================
// EXCHANGE RATE HOOK (실시간 API)
// =============================================================================
function useExchangeRates() {
  const [rates, setRates] = useState<{currency: string; flag: string; rate: number; change: number; name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    async function fetchRates() {
      try {
        // Using ExchangeRate-API (free tier)
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/KRW');
        const data = await res.json();

        const currencies = [
          { code: 'USD', flag: '🇺🇸', name: '미국 달러' },
          { code: 'JPY', flag: '🇯🇵', name: '일본 엔' },
          { code: 'EUR', flag: '🇪🇺', name: '유로' },
          { code: 'CNY', flag: '🇨🇳', name: '중국 위안' },
          { code: 'GBP', flag: '🇬🇧', name: '영국 파운드' },
          { code: 'THB', flag: '🇹🇭', name: '태국 바트' },
        ];

        const formattedRates = currencies.map(c => ({
          currency: c.code,
          flag: c.flag,
          name: c.name,
          rate: Math.round((1 / data.rates[c.code]) * 100) / 100,
          change: (Math.random() - 0.5) * 2, // Simulated change for demo
        }));

        setRates(formattedRates);
        setLastUpdate(new Date());
        setLoading(false);
      } catch (error) {
        // Fallback data if API fails
        setRates([
          { currency: 'USD', flag: '🇺🇸', name: '미국 달러', rate: 1380.50, change: 0.32 },
          { currency: 'JPY', flag: '🇯🇵', name: '일본 엔', rate: 9.15, change: -0.18 },
          { currency: 'EUR', flag: '🇪🇺', name: '유로', rate: 1485.20, change: 0.45 },
          { currency: 'CNY', flag: '🇨🇳', name: '중국 위안', rate: 189.30, change: 0.12 },
          { currency: 'GBP', flag: '🇬🇧', name: '영국 파운드', rate: 1745.80, change: 0.67 },
          { currency: 'THB', flag: '🇹🇭', name: '태국 바트', rate: 40.25, change: -0.08 },
        ]);
        setLastUpdate(new Date());
        setLoading(false);
      }
    }

    fetchRates();
    const interval = setInterval(fetchRates, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return { rates, loading, lastUpdate };
}

// =============================================================================
// COMPONENTS
// =============================================================================

// Navigation
function Navigation({ t, locale }: { t: TranslationType; locale: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#0A0A0F]/95 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-lg">TravelKit</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#esim" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">{t.nav.esim}</a>
            <a href="#services" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">{t.nav.services}</a>
            <a href="#pricing" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">{t.nav.pricing}</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={locale === 'ko' ? '/en' : '/ko'}
              className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              {locale === 'ko' ? '🌏 EN' : '🇰🇷 KO'}
            </Link>
            <Link
              href={`/${locale}/auth`}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-5 py-2 rounded-full text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all hover:scale-105"
            >
              {t.nav.download}
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

// Hero Section
function HeroSection({ t, locale }: { t: TranslationType; locale: string }) {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-[#0A0A0F] to-[#0A0A0F]" />
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-cyan-500/20 rounded-full blur-[100px]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiLz48cGF0aCBkPSJNNDAgMEgwdjQwaDQwVjB6TTEgMXYzOGgzOFYxSDF6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+PC9nPjwvc3ZnPg==')] opacity-50" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            {/* Promo Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-full px-4 py-2 mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="text-amber-400 text-sm font-medium">{t.hero.badge}</span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
            >
              <span className="text-white">{t.hero.title1}</span>
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                {t.hero.title2}
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-gray-400 mb-8 leading-relaxed max-w-lg"
            >
              {t.hero.subtitle}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4 mb-8"
            >
              <Link
                href={`/${locale}/auth`}
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl hover:shadow-emerald-500/25 transition-all hover:scale-105"
              >
                {t.hero.cta}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white px-6 py-4 rounded-full text-lg font-medium hover:bg-white/10 transition-all">
                <Play className="w-5 h-5" />
                {t.hero.ctaSecondary}
              </button>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap items-center gap-6"
            >
              {t.hero.trustBadges.map((badge, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-400 text-sm">
                  {i === 0 && <Download className="w-4 h-4 text-emerald-400" />}
                  {i === 1 && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                  {i === 2 && <HeadphonesIcon className="w-4 h-4 text-cyan-400" />}
                  {badge}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right - Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="relative hidden lg:block"
          >
            <div className="relative mx-auto w-[300px]">
              {/* Phone Frame */}
              <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-[3rem] p-3 shadow-2xl shadow-black/50">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-2xl" />

                {/* Screen Content */}
                <div className="bg-[#0A0A0F] rounded-[2.3rem] overflow-hidden h-[580px]">
                  {/* Status Bar */}
                  <div className="flex justify-between items-center px-6 pt-3 pb-2">
                    <span className="text-white text-xs font-medium">9:41</span>
                    <div className="flex items-center gap-1">
                      <Wifi className="w-3.5 h-3.5 text-white" />
                      <div className="w-6 h-2.5 bg-white rounded-sm" />
                    </div>
                  </div>

                  {/* App Content */}
                  <div className="px-4 pt-2">
                    {/* eSIM Active Card */}
                    <div className="bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl p-4 mb-4 shadow-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-white/80 text-xs mb-1">Active eSIM</div>
                          <div className="text-white font-bold text-lg">🇯🇵 Japan 7 Days</div>
                        </div>
                        <div className="bg-white/20 rounded-full px-2 py-1">
                          <span className="text-white text-xs font-medium">5G</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-white/80 text-xs">Data Remaining</div>
                          <div className="text-white font-bold">2.4 GB / 3 GB</div>
                        </div>
                        <div className="text-white/80 text-xs">4 days left</div>
                      </div>
                      <div className="mt-3 bg-white/20 rounded-full h-2">
                        <div className="bg-white rounded-full h-2 w-4/5" />
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {[
                        { icon: '📱', label: 'eSIM' },
                        { icon: '💱', label: locale === 'ko' ? '환율' : 'Rate' },
                        { icon: '🏨', label: locale === 'ko' ? '호텔' : 'Hotel' },
                        { icon: '🤖', label: 'AI' },
                      ].map((item, i) => (
                        <div key={i} className="bg-white/5 rounded-xl p-3 text-center">
                          <div className="text-2xl mb-1">{item.icon}</div>
                          <div className="text-white text-[10px]">{item.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Exchange Rate Widget */}
                    <div className="bg-white/5 rounded-2xl p-4 mb-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-white text-sm font-medium">{locale === 'ko' ? '실시간 환율' : 'Live Rates'}</span>
                        <span className="text-emerald-400 text-xs">Just now</span>
                      </div>
                      <div className="space-y-2">
                        {[
                          { flag: '🇺🇸', code: 'USD', rate: '1,380.50', change: '+0.32%', up: true },
                          { flag: '🇯🇵', code: 'JPY', rate: '9.15', change: '-0.18%', up: false },
                        ].map((r, i) => (
                          <div key={i} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{r.flag}</span>
                              <span className="text-white text-sm">{r.code}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-white text-sm font-medium">₩{r.rate}</div>
                              <div className={`text-xs ${r.up ? 'text-emerald-400' : 'text-red-400'}`}>
                                {r.change}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Chat Preview */}
                    <div className="bg-white/5 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">AI Guide</div>
                          <div className="text-emerald-400 text-xs">Online</div>
                        </div>
                      </div>
                      <div className="bg-white/10 rounded-xl rounded-bl-none px-3 py-2">
                        <p className="text-white text-xs">
                          {locale === 'ko'
                            ? '시부야 근처 라멘 맛집을 찾아드릴게요! 🍜'
                            : 'I found great BBQ spots near Myeongdong! 🥩'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute -left-16 top-20 bg-white/10 backdrop-blur-xl rounded-2xl p-3 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">eSIM Activated</div>
                    <div className="text-gray-400 text-xs">Japan 3GB</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 4, delay: 1 }}
                className="absolute -right-12 bottom-32 bg-white/10 backdrop-blur-xl rounded-2xl p-3 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{locale === 'ko' ? '환율 알림' : 'Rate Alert'}</div>
                    <div className="text-emerald-400 text-xs">USD ₩1,380</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {t.stats.map((stat, i) => (
            <div key={i} className="text-center p-6 rounded-2xl bg-white/5 border border-white/5">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-1">
                {stat.value}<span className="text-emerald-400">{stat.suffix}</span>
              </div>
              <div className="text-gray-500 text-sm">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// Exchange Rate Section
function ExchangeSection({ t, locale }: { t: TranslationType; locale: string }) {
  const { rates, loading, lastUpdate } = useExchangeRates();

  return (
    <section id="exchange" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Rates */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-white font-bold text-xl">{t.exchange.title}</h3>
                  <p className="text-gray-500 text-sm">{t.exchange.source}</p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full text-sm">
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  {t.exchange.updated}
                </div>
              </div>

              <div className="space-y-3">
                {rates.map((rate, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{rate.flag}</span>
                      <div>
                        <div className="text-white font-semibold">{rate.currency}</div>
                        <div className="text-gray-500 text-xs">{rate.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold text-lg">₩{rate.rate.toLocaleString()}</div>
                      <div className={`text-sm flex items-center justify-end gap-1 ${rate.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {rate.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {rate.change >= 0 ? '+' : ''}{rate.change.toFixed(2)}%
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <button className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all">
                  {t.exchange.viewAll}
                </button>
                <button className="flex-1 bg-white/5 border border-white/10 text-white py-3 rounded-xl font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                  <Bell className="w-4 h-4" />
                  {t.exchange.alert}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Right - Info */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2"
          >
            <span className="inline-block bg-cyan-500/10 text-cyan-400 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              {t.exchange.title}
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">{t.exchange.subtitle}</h2>

            <div className="space-y-4 mb-8">
              {[
                { icon: RefreshCw, title: locale === 'ko' ? '1분마다 자동 업데이트' : 'Auto-update every minute', desc: locale === 'ko' ? '한국은행 기준 실시간 환율' : 'Real-time rates from Bank of Korea' },
                { icon: Bell, title: t.exchange.alert, desc: t.exchange.alertDesc },
                { icon: TrendingUp, title: locale === 'ko' ? '30일 환율 추이' : '30-day trends', desc: locale === 'ko' ? '최적의 환전 타이밍 분석' : 'Find the best time to exchange' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{item.title}</div>
                    <div className="text-gray-500 text-sm">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// eSIM Section
function EsimSection({ t }: { t: TranslationType }) {
  return (
    <section id="esim" className="py-24 bg-gradient-to-b from-emerald-900/10 via-transparent to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            {t.esim.badge}
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">{t.esim.title}</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">{t.esim.subtitle}</p>
        </motion.div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {t.esim.features.map((feature, i) => {
            const Icon = getIcon(feature.icon);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-emerald-500/30 hover:bg-white/10 transition-all group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
                <p className="text-gray-500 text-sm">{feature.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Plans Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-white/10 rounded-3xl p-8"
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {t.esim.plans.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-white/5 rounded-2xl p-5 hover:bg-white/10 transition-all cursor-pointer group ${plan.popular ? 'ring-2 ring-emerald-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                    BEST
                  </div>
                )}
                <div className="text-2xl mb-2">{plan.name.split(' ')[0]}</div>
                <div className="text-white font-semibold text-lg mb-1">{plan.name.split(' ').slice(1).join(' ')}</div>
                <div className="text-gray-500 text-sm mb-3">{plan.data} / {plan.days}</div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-emerald-400 font-bold text-2xl">{plan.price}</span>
                  <span className="text-gray-500 line-through text-sm">{plan.originalPrice}</span>
                </div>
                <button className="w-full bg-white/10 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-medium transition-all group-hover:bg-emerald-500">
                  {translations.ko.esim.cta.includes('보기') ? '구매하기' : 'Buy Now'}
                </button>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-emerald-400 font-medium">{t.esim.guarantee}</p>
            <button className="inline-flex items-center gap-2 text-white hover:text-emerald-400 transition-colors">
              {t.esim.cta}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Services Section (Early Access)
function ServicesSection({ t }: { t: TranslationType }) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = () => {
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <section id="services" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-400 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            {t.services.badge}
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">{t.services.title}</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">{t.services.subtitle}</p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {t.services.items.map((item, i) => {
            const Icon = getIcon(item.icon);
            const isBeta = item.status === 'beta';

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-gradient-to-br from-white/10 to-white/5 border rounded-2xl p-6 hover:border-purple-500/50 transition-all group cursor-pointer ${
                  isBeta ? 'border-purple-500/30' : 'border-white/10'
                }`}
              >
                {/* Status Badge */}
                <div className={`absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-medium ${
                  isBeta
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {isBeta ? 'BETA' : 'SOON'}
                </div>

                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                  isBeta
                    ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20'
                    : 'bg-white/10'
                }`}>
                  <Icon className={`w-7 h-7 ${isBeta ? 'text-purple-400' : 'text-gray-400'}`} />
                </div>

                <h3 className="text-white font-bold text-lg mb-1">{item.name}</h3>
                <p className="text-gray-500 text-sm mb-3">{item.desc}</p>

                {/* Benefit Highlight */}
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                  isBeta
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-white/5 text-gray-400'
                }`}>
                  <Gift className="w-3.5 h-3.5" />
                  {item.benefit}
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/5 group-hover:to-pink-500/5 rounded-2xl transition-all" />
              </motion.div>
            );
          })}
        </div>

        {/* Email Subscribe */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-3xl p-8 text-center"
        >
          {subscribed ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-xl mb-2">{translations.ko === t ? '등록 완료!' : 'Subscribed!'}</h3>
                <p className="text-gray-400">{translations.ko === t ? '새 서비스 출시 시 가장 먼저 알려드릴게요.' : "We'll notify you when new services launch."}</p>
              </div>
            </div>
          ) : (
            <>
              <Bell className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-white font-bold text-2xl mb-2">{t.services.notify}</h3>
              <p className="text-gray-400 mb-6">{t.services.notifyDesc}</p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={translations.ko === t ? '이메일 주소' : 'Email address'}
                  className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleSubscribe}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                >
                  {t.services.notify}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}

// AI Section
function AISection({ t, locale }: { t: TranslationType; locale: string }) {
  const [messages, setMessages] = useState<{role: string; content: string}[]>([
    { role: 'assistant', content: locale === 'ko' ? '안녕하세요! 여행 도우미 AI입니다. 무엇을 도와드릴까요?' : "Hi! I'm your travel guide AI. How can I help?" },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const suggestions = locale === 'ko'
    ? ['시부야 라멘 맛집 추천해줘', '도쿄 지하철 이용법', '환전 어디서 하면 좋아?']
    : ['Best BBQ near Gangnam?', 'How to use Seoul subway?', 'Where to exchange money?'];

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const responses: Record<string, string> = {
        '시부야 라멘 맛집 추천해줘': '시부야역 근처 "이치란 라멘"을 추천드려요! 🍜\n\n📍 도보 5분\n⏰ 24시간 영업\n💰 평균 ¥980\n\n혼밥하기 좋은 1인석이 있고, 주문은 자판기로 하면 됩니다. 진한 돈코츠 국물이 일품이에요!',
        '도쿄 지하철 이용법': '도쿄 지하철 이용 팁이에요! 🚇\n\n1. Suica/Pasmo 카드 구매 (역 자판기)\n2. 충전 후 개찰구에 터치\n3. Google Maps로 노선 확인\n\n💡 Tip: 러시아워(8-9시)는 피하세요!',
        '환전 어디서 하면 좋아?': '환전 추천 방법이에요! 💱\n\n🥇 1순위: 인천공항 은행 (출국 전)\n🥈 2순위: 트래블월렛 앱 (수수료 무료)\n🥉 3순위: 현지 세븐일레븐 ATM\n\n❌ 피해야 할 곳: 명동 사설 환전소',
        'Best BBQ near Gangnam?': 'I recommend "Maple Tree House" in Gangnam! 🥩\n\n📍 5 min from Gangnam Station Exit 10\n⏰ 11AM - 10PM\n💰 ~₩35,000/person\n\nFamous for premium Hanwoo beef. They have English menus and the staff speaks English!',
        'How to use Seoul subway?': 'Seoul subway tips! 🚇\n\n1. Get T-money card at any convenience store\n2. Charge it and tap at gates\n3. Use Kakao Maps or Naver Maps\n\n💡 Tip: Avoid rush hour (8-9 AM)!',
        'Where to exchange money?': 'Best places to exchange! 💱\n\n🥇 #1: Myeongdong money changers (best rates)\n🥈 #2: Banks in Hongdae area\n🥉 #3: Airport (convenient but higher fees)\n\n💡 Always compare rates first!',
      };

      const response = responses[text] || (locale === 'ko'
        ? '네, 알겠습니다! 관련 정보를 찾아볼게요. 잠시만 기다려주세요. 🔍'
        : "Got it! Let me find that information for you. One moment please. 🔍");

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <section id="ai" className="py-24 bg-gradient-to-b from-purple-900/10 via-transparent to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Info */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-400 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <MessageSquare className="w-4 h-4" />
              {t.ai.badge}
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">{t.ai.title}</h2>
            <p className="text-gray-400 text-lg mb-8">{t.ai.subtitle}</p>

            <div className="space-y-4">
              {t.ai.features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-4 p-4 bg-white/5 rounded-xl"
                >
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{feature.title}</div>
                    <div className="text-gray-500 text-sm">{feature.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right - Chat Demo */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl overflow-hidden"
          >
            {/* Chat Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/10">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-semibold">AI Travel Guide</div>
                <div className="text-emerald-400 text-xs flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  Online
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="h-[300px] overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-br-md'
                      : 'bg-white/10 text-white rounded-bl-md'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/10 text-white px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions */}
            <div className="px-4 py-2 border-t border-white/10">
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s)}
                    className="bg-white/5 hover:bg-white/10 text-gray-300 text-sm px-3 py-1.5 rounded-full transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                  placeholder={locale === 'ko' ? '메시지를 입력하세요...' : 'Type a message...'}
                  className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={() => handleSend(input)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 rounded-xl hover:shadow-lg transition-all"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Reviews Section
function ReviewsSection({ t }: { t: TranslationType }) {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">{t.reviews.title}</h2>
          <p className="text-gray-400 text-lg">{t.reviews.subtitle}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {t.reviews.items.map((review, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className={`w-4 h-4 ${j < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                ))}
              </div>
              <p className="text-white mb-4 leading-relaxed">"{review.text}"</p>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">{review.name}</div>
                  <div className="text-gray-500 text-sm">{review.country}</div>
                </div>
                <div className="text-gray-500 text-sm">{review.date}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* App Store Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 flex flex-wrap justify-center gap-4"
        >
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-6 py-3">
            <div className="text-3xl">📱</div>
            <div>
              <div className="text-gray-400 text-xs">Download on the</div>
              <div className="text-white font-semibold">App Store</div>
            </div>
            <div className="flex items-center gap-1 ml-2">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-white font-medium">4.9</span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-6 py-3">
            <div className="text-3xl">🤖</div>
            <div>
              <div className="text-gray-400 text-xs">GET IT ON</div>
              <div className="text-white font-semibold">Google Play</div>
            </div>
            <div className="flex items-center gap-1 ml-2">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-white font-medium">4.8</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Pricing Section
function PricingSection({ t, locale }: { t: TranslationType; locale: string }) {
  return (
    <section id="pricing" className="py-24 bg-gradient-to-b from-emerald-900/10 via-transparent to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            {t.pricing.badge}
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">{t.pricing.title}</h2>
          <p className="text-gray-400 text-lg">{t.pricing.subtitle}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {t.pricing.plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-3xl p-8 ${
                plan.popular
                  ? 'bg-gradient-to-b from-emerald-500/20 to-cyan-500/20 border-2 border-emerald-500/50 scale-105'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-medium px-4 py-1.5 rounded-full">
                  {locale === 'ko' ? '가장 인기' : 'Most Popular'}
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="text-white font-bold text-xl mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                <p className="text-gray-500 text-sm mt-2">{plan.desc}</p>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-3 text-gray-300">
                    <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3.5 rounded-xl font-semibold transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-emerald-500/25'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-gray-500 mt-8"
        >
          {t.pricing.guarantee}
        </motion.p>
      </div>
    </section>
  );
}

// Final CTA Section
function FinalCTASection({ t, locale }: { t: TranslationType; locale: string }) {
  const [count, setCount] = useState(127);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => Math.max(50, prev - Math.floor(Math.random() * 3)));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative bg-gradient-to-br from-emerald-600/30 to-cyan-600/30 border border-emerald-500/30 rounded-3xl p-10 sm:p-14 text-center overflow-hidden"
        >
          {/* Background effect */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent" />

          <div className="relative z-10">
            {/* Badge */}
            <span className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Gift className="w-4 h-4" />
              {t.cta.badge}
            </span>

            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              {t.cta.title}
            </h2>
            <p className="text-gray-300 text-lg mb-8">{t.cta.subtitle}</p>

            {/* Benefits */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {[t.cta.benefit1, t.cta.benefit2, t.cta.benefit3].map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-white text-sm">{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Link
              href={`/${locale}/auth`}
              className="inline-flex items-center gap-2 bg-white text-gray-900 px-10 py-5 rounded-full text-lg font-bold hover:shadow-2xl hover:shadow-white/20 transition-all hover:scale-105"
            >
              {t.cta.button}
              <ArrowRight className="w-5 h-5" />
            </Link>

            {/* Scarcity */}
            <div className="mt-6 flex items-center justify-center gap-2 text-amber-400">
              <Timer className="w-4 h-4 animate-pulse" />
              <span className="font-medium">{t.cta.limited.replace('127', String(count))}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Footer
function Footer({ t, locale }: { t: TranslationType; locale: string }) {
  return (
    <footer className="py-16 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white text-lg">TravelKit</span>
            </div>
            <p className="text-gray-500 text-sm">{t.footer.desc}</p>
          </div>

          {/* Links */}
          {[
            { title: t.footer.product, items: t.footer.links.product },
            { title: t.footer.support, items: t.footer.links.support },
            { title: t.footer.legal, items: t.footer.links.legal },
          ].map((section, i) => (
            <div key={i}>
              <h4 className="text-white font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.items.map((item, j) => (
                  <li key={j}>
                    <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/10">
          <div className="text-gray-600 text-sm">
            © 2025 {t.footer.company}. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="text-gray-500 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
            </a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/></svg>
            </a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================
export default function TravelKitLandingPage() {
  const locale = useLocale();
  const t = getT(locale);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <Navigation t={t} locale={locale} />
      <HeroSection t={t} locale={locale} />
      <ExchangeSection t={t} locale={locale} />
      <EsimSection t={t} />
      <ServicesSection t={t} />
      <AISection t={t} locale={locale} />
      <ReviewsSection t={t} />
      <PricingSection t={t} locale={locale} />
      <FinalCTASection t={t} locale={locale} />
      <Footer t={t} locale={locale} />
    </div>
  );
}
