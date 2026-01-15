/**
 * K-UNIVERSAL Super App Feature Showcase
 * 미래지향적, 신뢰감 있는 서비스 소개 페이지
 *
 * Features: K-Taxi, K-Food, K-Shopping, AI Concierge, Ghost Wallet
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  Car,
  UtensilsCrossed,
  ShoppingBag,
  MessageCircle,
  Wallet,
  MapPin,
  Clock,
  Shield,
  CreditCard,
  Star,
  ChevronRight,
  Sparkles,
  Zap,
  Globe,
  Check,
  ArrowRight,
  Phone,
  QrCode,
  BadgeCheck,
  TrendingUp,
  Fingerprint,
  ChevronDown,
} from 'lucide-react';

// ============================================
// Animation Variants
// ============================================
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

const slideInLeft = {
  hidden: { opacity: 0, x: -80 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

const slideInRight = {
  hidden: { opacity: 0, x: 80 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

// ============================================
// Main Page Component
// ============================================
export default function FeaturesPage() {
  const locale = useLocale();

  return (
    <div className="bg-[#0A0A0F] min-h-screen overflow-x-hidden">
      {/* Navigation */}
      <TopNav locale={locale} />

      {/* Hero Section */}
      <HeroSection locale={locale} />

      {/* Service Grid Overview */}
      <ServiceGridSection locale={locale} />

      {/* K-Taxi Feature */}
      <KTaxiSection locale={locale} />

      {/* K-Food Feature */}
      <KFoodSection locale={locale} />

      {/* Ghost Wallet Feature */}
      <GhostWalletSection locale={locale} />

      {/* AI Concierge Feature */}
      <AIConciergeSection locale={locale} />

      {/* Trust & Security */}
      <TrustSection locale={locale} />

      {/* Final CTA */}
      <FinalCTASection locale={locale} />
    </div>
  );
}

// ============================================
// Top Navigation
// ============================================
function TopNav({ locale }: { locale: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-white/5' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white text-lg">K-UNIVERSAL</span>
        </Link>

        <Link href={`/${locale}/dashboard`}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-5 py-2.5 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-full font-medium text-sm"
          >
            Start Now
          </motion.button>
        </Link>
      </div>
    </motion.nav>
  );
}

// ============================================
// Hero Section
// ============================================
function HeroSection({ locale }: { locale: string }) {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  return (
    <motion.section
      style={{ opacity, scale }}
      className="min-h-screen flex flex-col items-center justify-center relative px-4 sm:px-6 pt-20"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Main Gradient Orbs */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]"
        >
          <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[#3B82F6]/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#8B5CF6]/20 rounded-full blur-[100px]" />
        </motion.div>

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />

        {/* Floating Icons */}
        {[Car, UtensilsCrossed, ShoppingBag, Wallet, MessageCircle].map((Icon, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
              y: [0, -20, 0],
              x: [0, idx % 2 === 0 ? 10 : -10, 0],
            }}
            transition={{
              duration: 4 + idx,
              repeat: Infinity,
              delay: idx * 0.5
            }}
            className="absolute"
            style={{
              top: `${20 + (idx * 15)}%`,
              left: `${10 + (idx * 18)}%`,
            }}
          >
            <Icon className="w-8 h-8 text-white/10" />
          </motion.div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto text-center relative z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#3B82F6]/10 to-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-sm text-white/70">
            <Zap className="w-4 h-4 text-[#8B5CF6]" />
            K-Lifestyle Super App
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-[1.1]"
        >
          한국의 모든 것,
          <br />
          <span className="bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent">
            손 안에서.
          </span>
        </motion.h1>

        {/* English Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg sm:text-xl text-white/40 font-light tracking-wide mb-4"
        >
          Everything Korea, in Your Palm.
        </motion.p>

        {/* Sub Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-base sm:text-lg text-white/60 max-w-2xl mx-auto mb-12"
        >
          택시, 음식 배달, 쇼핑, AI 컨시어지까지.
          <br />
          Ghost Wallet 하나로 모든 결제를 해결하세요.
        </motion.p>

        {/* Service Icons Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex items-center justify-center gap-4 sm:gap-6 mb-12"
        >
          {[
            { icon: Car, color: 'from-yellow-400 to-orange-500', label: 'Taxi' },
            { icon: UtensilsCrossed, color: 'from-red-400 to-pink-500', label: 'Food' },
            { icon: ShoppingBag, color: 'from-purple-400 to-indigo-500', label: 'Shop' },
            { icon: MessageCircle, color: 'from-cyan-400 to-blue-500', label: 'AI' },
          ].map(({ icon: Icon, color, label }, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.1, y: -5 }}
              className="flex flex-col items-center gap-2"
            >
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <span className="text-xs text-white/40">{label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link href={`/${locale}/dashboard`}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-5 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-2xl font-bold text-lg shadow-2xl shadow-purple-500/20 flex items-center gap-2"
            >
              지금 시작하기
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-2 text-white/30"
        >
          <span className="text-xs tracking-widest uppercase">Discover More</span>
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </motion.section>
  );
}

// ============================================
// Service Grid Section
// ============================================
function ServiceGridSection({ locale }: { locale: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const services = [
    {
      id: 'taxi',
      icon: Car,
      title: 'K-Taxi',
      titleKo: '택시 호출',
      description: '실시간 위치 추적, 다양한 차량 선택, 투명한 요금',
      descriptionEn: 'Real-time tracking, vehicle options, transparent pricing',
      gradient: 'from-yellow-400 to-orange-500',
      features: ['GPS 추적', '프리미엄 차량', '예상 요금'],
      href: '/dashboard/taxi',
    },
    {
      id: 'food',
      icon: UtensilsCrossed,
      title: 'K-Food',
      titleKo: '음식 배달',
      description: '한국 맛집 직배달, 다국어 메뉴, 매운맛 조절',
      descriptionEn: 'Korean restaurants, multilingual menus, spice control',
      gradient: 'from-red-400 to-pink-500',
      features: ['치킨 & 한식', '배달 추적', '영어 메뉴'],
      href: '/dashboard/food',
    },
    {
      id: 'shopping',
      icon: ShoppingBag,
      title: 'K-Shopping',
      titleKo: '쇼핑',
      description: '무신사, 올리브영 등 한국 인기 쇼핑몰 통합',
      descriptionEn: 'Musinsa, Olive Young & more Korean shopping',
      gradient: 'from-purple-400 to-indigo-500',
      features: ['K-패션', 'K-뷰티', '면세 적용'],
      href: '/dashboard/shopping',
    },
    {
      id: 'concierge',
      icon: MessageCircle,
      title: 'AI Concierge',
      titleKo: 'AI 컨시어지',
      description: '24시간 다국어 AI 어시스턴트, 여행 정보 즉답',
      descriptionEn: '24/7 multilingual AI assistant for travel help',
      gradient: 'from-cyan-400 to-blue-500',
      features: ['47개국 언어', '실시간 응답', '맞춤 추천'],
      href: '/dashboard/concierge',
    },
  ];

  return (
    <section ref={ref} className="py-24 sm:py-32 px-4 sm:px-6 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#12121A]/50 to-transparent" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <span className="text-sm tracking-widest uppercase text-[#8B5CF6] font-medium">
            Super App Services
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold text-white mt-4">
            네 가지 핵심 서비스
          </h2>
          <p className="text-white/50 mt-4 max-w-xl mx-auto">
            외국인 관광객을 위해 설계된 통합 서비스 플랫폼
          </p>
        </motion.div>

        {/* Services Grid */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {services.map((service, idx) => (
            <motion.div
              key={service.id}
              variants={fadeInUp}
              className="group"
            >
              <Link href={`/${locale}${service.href}`}>
                <motion.div
                  whileHover={{ y: -5, scale: 1.01 }}
                  className="relative p-8 bg-[#12121A] border border-white/5 rounded-3xl overflow-hidden hover:border-white/10 transition-all duration-500"
                >
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center`}>
                        <service.icon className="w-7 h-7 text-white" />
                      </div>
                      <ChevronRight className="w-6 h-6 text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-1">{service.title}</h3>
                    <p className="text-white/40 text-sm mb-4">{service.titleKo}</p>

                    <p className="text-white/60 mb-6">{service.description}</p>
                    <p className="text-white/40 text-sm mb-6">{service.descriptionEn}</p>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2">
                      {service.features.map((feature, fidx) => (
                        <span
                          key={fidx}
                          className="px-3 py-1.5 bg-white/5 rounded-full text-xs text-white/60"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Corner Glow */}
                  <div className={`absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br ${service.gradient} opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity`} />
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// K-Taxi Feature Section
// ============================================
function KTaxiSection({ locale }: { locale: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-24 sm:py-32 px-4 sm:px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-yellow-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Content */}
          <motion.div
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={slideInLeft}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 rounded-full mb-6">
              <Car className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 text-sm font-medium">K-Taxi</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">
              언제 어디서나,
              <br />
              <span className="text-yellow-400">안전한 이동</span>
            </h2>

            <p className="text-white/60 text-lg mb-8">
              한국어가 어려워도 걱정 없어요.
              <br />
              지도에서 위치 선택만 하면 택시가 바로 도착합니다.
            </p>

            {/* Features */}
            <div className="space-y-4 mb-8">
              {[
                { icon: MapPin, text: '실시간 GPS 위치 추적', textEn: 'Real-time GPS tracking' },
                { icon: Clock, text: '평균 3분 내 배차', textEn: 'Pickup in ~3 minutes' },
                { icon: Shield, text: '운전자 신원 확인 완료', textEn: 'Verified drivers only' },
                { icon: CreditCard, text: 'Ghost Wallet 즉시 결제', textEn: 'Pay with Ghost Wallet' },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{item.text}</p>
                    <p className="text-white/40 text-sm">{item.textEn}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <Link href={`/${locale}/dashboard/taxi`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-xl font-bold text-lg flex items-center gap-2"
              >
                택시 호출하기
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </motion.div>

          {/* Right: Visual */}
          <motion.div
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={slideInRight}
            className="relative"
          >
            {/* Phone Mockup with Map */}
            <div className="relative mx-auto w-[280px] sm:w-[320px] aspect-[9/19] bg-[#1A1A24] rounded-[3rem] border-4 border-[#2A2A34] overflow-hidden shadow-2xl">
              {/* Status Bar */}
              <div className="absolute top-0 left-0 right-0 h-8 bg-black/50 flex items-center justify-center z-20">
                <div className="w-20 h-5 bg-black rounded-full" />
              </div>

              {/* Map Simulation */}
              <div className="absolute inset-0 bg-[#1A1A24]">
                {/* Grid Streets */}
                <div className="absolute inset-0 opacity-20">
                  {[...Array(8)].map((_, i) => (
                    <div key={`h-${i}`} className="absolute w-full h-px bg-white/30" style={{ top: `${(i + 1) * 12}%` }} />
                  ))}
                  {[...Array(6)].map((_, i) => (
                    <div key={`v-${i}`} className="absolute h-full w-px bg-white/30" style={{ left: `${(i + 1) * 15}%` }} />
                  ))}
                </div>

                {/* Pickup Point */}
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  <div className="w-4 h-4 bg-blue-500 rounded-full border-4 border-blue-500/30" />
                </motion.div>

                {/* Taxi Animation */}
                <motion.div
                  animate={{
                    x: [100, 0],
                    y: [50, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'easeInOut'
                  }}
                  className="absolute top-1/3 left-1/2"
                >
                  <div className="text-3xl">🚕</div>
                </motion.div>

                {/* Destination */}
                <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>

              {/* Bottom Panel */}
              <div className="absolute bottom-0 left-0 right-0 bg-[#12121A] rounded-t-3xl p-5 border-t border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white font-bold">Standard Taxi</p>
                    <p className="text-white/40 text-sm">3분 도착 예정</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">₩4,800</p>
                    <p className="text-white/40 text-sm">~$3.60 USD</p>
                  </div>
                </div>
                <div className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl text-center font-bold text-black text-sm">
                  호출 확정
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-500/10 rounded-2xl flex items-center justify-center"
            >
              <span className="text-4xl">🚕</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// K-Food Feature Section
// ============================================
function KFoodSection({ locale }: { locale: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const menuItems = [
    { name: '양념치킨', nameEn: 'Yangnyeom Chicken', price: 18000, emoji: '🍗' },
    { name: '불고기', nameEn: 'Bulgogi', price: 15000, emoji: '🥩' },
    { name: '김치찌개', nameEn: 'Kimchi Stew', price: 9000, emoji: '🥘' },
    { name: '비빔밥', nameEn: 'Bibimbap', price: 11000, emoji: '🍚' },
  ];

  return (
    <section ref={ref} className="py-24 sm:py-32 px-4 sm:px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Visual */}
          <motion.div
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={slideInLeft}
            className="order-2 lg:order-1"
          >
            {/* Menu Cards */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {menuItems.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    className="bg-[#12121A] border border-white/5 rounded-2xl p-4 hover:border-red-500/30 transition-all cursor-pointer"
                  >
                    <div className="text-4xl mb-3">{item.emoji}</div>
                    <p className="text-white font-medium">{item.name}</p>
                    <p className="text-white/40 text-sm mb-2">{item.nameEn}</p>
                    <p className="text-red-400 font-bold">₩{item.price.toLocaleString()}</p>
                  </motion.div>
                ))}
              </div>

              {/* Spicy Level Indicator */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.6 }}
                className="mt-6 p-4 bg-[#12121A] border border-white/5 rounded-2xl"
              >
                <p className="text-white/60 text-sm mb-3">매운맛 조절 / Spice Level</p>
                <div className="flex items-center gap-2">
                  {['🫑 Mild', '🌶️ Medium', '🔥 Hot', '💀 Korean'].map((level, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                        idx === 1
                          ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                          : 'bg-white/5 text-white/50 hover:bg-white/10'
                      }`}
                    >
                      {level}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right: Content */}
          <motion.div
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={slideInRight}
            className="order-1 lg:order-2"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-full mb-6">
              <UtensilsCrossed className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-sm font-medium">K-Food</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">
              한국의 맛,
              <br />
              <span className="text-red-400">문 앞까지</span>
            </h2>

            <p className="text-white/60 text-lg mb-8">
              메뉴 이름을 몰라도 사진으로 고르세요.
              <br />
              영어 설명과 매운맛 조절로 완벽한 주문.
            </p>

            {/* Features */}
            <div className="space-y-4 mb-8">
              {[
                { icon: Globe, text: '다국어 메뉴 설명', textEn: 'Menu in your language' },
                { icon: Star, text: '인기 한식 맛집 큐레이션', textEn: 'Curated Korean restaurants' },
                { icon: Clock, text: '실시간 배달 추적', textEn: 'Live delivery tracking' },
                { icon: CreditCard, text: 'Ghost Wallet 결제', textEn: 'Pay with Ghost Wallet' },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{item.text}</p>
                    <p className="text-white/40 text-sm">{item.textEn}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <Link href={`/${locale}/dashboard/food`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-red-400 to-pink-500 text-white rounded-xl font-bold text-lg flex items-center gap-2"
              >
                음식 주문하기
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// Ghost Wallet Feature Section
// ============================================
function GhostWalletSection({ locale }: { locale: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-24 sm:py-32 px-4 sm:px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-[#3B82F6]/10 via-[#8B5CF6]/10 to-[#06B6D4]/10 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#8B5CF6]/10 rounded-full mb-6">
            <Wallet className="w-4 h-4 text-[#8B5CF6]" />
            <span className="text-[#8B5CF6] text-sm font-medium">Ghost Wallet</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">
            하나의 지갑,
            <br />
            <span className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent">
              무한한 가능성
            </span>
          </h2>

          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            환전부터 결제까지, QR 스캔 한 번으로 모든 서비스를 이용하세요.
            <br />
            NFT 뱃지로 특별한 혜택도 받을 수 있어요.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            {
              icon: QrCode,
              title: 'QR 결제',
              titleEn: 'QR Payment',
              description: '편의점부터 백화점까지 전국 어디서나',
              gradient: 'from-blue-500 to-cyan-500',
            },
            {
              icon: TrendingUp,
              title: '실시간 환전',
              titleEn: 'Instant Exchange',
              description: '은행보다 저렴한 환율, 수수료 0%',
              gradient: 'from-emerald-500 to-teal-500',
            },
            {
              icon: BadgeCheck,
              title: 'NFT 뱃지',
              titleEn: 'NFT Badges',
              description: '활동에 따른 특별 혜택과 할인',
              gradient: 'from-purple-500 to-pink-500',
            },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              variants={scaleIn}
              whileHover={{ y: -5 }}
              className="relative p-8 bg-[#12121A] border border-white/5 rounded-3xl overflow-hidden group hover:border-white/10 transition-all"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />

              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-xl font-bold text-white mb-1">{feature.title}</h3>
              <p className="text-white/40 text-sm mb-3">{feature.titleEn}</p>
              <p className="text-white/60">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Wallet Card Visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="mt-16 flex justify-center"
        >
          <motion.div
            whileHover={{ rotateY: 5, rotateX: -5 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-md aspect-[1.586] perspective-1000"
          >
            {/* Card */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6] via-[#8B5CF6] to-[#06B6D4] rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/20">
              {/* Holographic Effect */}
              <motion.div
                animate={{
                  background: [
                    'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)',
                    'linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.15) 20%, transparent 40%)',
                  ],
                  backgroundPosition: ['0% 0%', '100% 100%'],
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0"
              />

              {/* Content */}
              <div className="absolute inset-0 p-8 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-white/80 font-medium tracking-wider">GHOST WALLET</span>
                  <Sparkles className="w-6 h-6 text-white/80" />
                </div>

                <div className="space-y-2">
                  <p className="text-white/60 text-sm">Available Balance</p>
                  <p className="text-4xl font-bold text-white">₩2,450,000</p>
                  <p className="text-white/60">~$1,854 USD</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/40 text-xs">MEMBER SINCE</p>
                    <p className="text-white font-medium">2025.01</p>
                  </div>
                  <div className="flex gap-1">
                    {['🏆', '⭐', '💎'].map((badge, idx) => (
                      <span key={idx} className="text-xl">{badge}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chip */}
              <div className="absolute top-1/2 left-8 -translate-y-1/2 w-12 h-9 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded opacity-90" />
            </div>
          </motion.div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          className="mt-12 text-center"
        >
          <Link href={`/${locale}/wallet`}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-4 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-xl font-bold text-lg inline-flex items-center gap-2"
            >
              지갑 열기
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// AI Concierge Feature Section
// ============================================
function AIConciergeSection({ locale }: { locale: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const chatMessages = [
    { role: 'user', text: 'Where can I get good BBQ near Gangnam?' },
    { role: 'ai', text: "I recommend 'Maple Tree House' - famous for premium Korean BBQ! It's a 5-min walk from Gangnam Station Exit 10. Shall I make a reservation?" },
    { role: 'user', text: 'Yes please, for 2 people at 7pm' },
    { role: 'ai', text: 'Done! Reservation confirmed for 2 at 7pm. I\'ve added it to your schedule. 🎉' },
  ];

  return (
    <section ref={ref} className="py-24 sm:py-32 px-4 sm:px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Content */}
          <motion.div
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={slideInLeft}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 rounded-full mb-6">
              <MessageCircle className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 text-sm font-medium">AI Concierge</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">
              24시간 AI 컨시어지,
              <br />
              <span className="text-cyan-400">당신만의 가이드</span>
            </h2>

            <p className="text-white/60 text-lg mb-8">
              여행 중 궁금한 건 뭐든 물어보세요.
              <br />
              47개 언어로 실시간 응답하는 AI 컨시어지가 도와드립니다.
            </p>

            {/* Features */}
            <div className="space-y-4 mb-8">
              {[
                { icon: Globe, text: '47개국 언어 지원', textEn: '47 languages supported' },
                { icon: Clock, text: '24시간 실시간 응답', textEn: '24/7 instant responses' },
                { icon: MapPin, text: '맛집, 관광지 추천', textEn: 'Restaurant & attraction tips' },
                { icon: Phone, text: '예약 대행 서비스', textEn: 'Booking assistance' },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{item.text}</p>
                    <p className="text-white/40 text-sm">{item.textEn}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <Link href={`/${locale}/dashboard/concierge`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-bold text-lg flex items-center gap-2"
              >
                AI에게 물어보기
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </motion.div>

          {/* Right: Chat Visual */}
          <motion.div
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={slideInRight}
          >
            <div className="bg-[#12121A] border border-white/5 rounded-3xl p-6 max-w-md mx-auto">
              {/* Chat Header */}
              <div className="flex items-center gap-3 pb-4 border-b border-white/10 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">K-Universal AI</p>
                  <p className="text-green-400 text-xs flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full" />
                    Online
                  </p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="space-y-4">
                {chatMessages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.5 + idx * 0.2 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                        msg.role === 'user'
                          ? 'bg-[#3B82F6] text-white rounded-br-none'
                          : 'bg-white/10 text-white/90 rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Input */}
              <div className="mt-4 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask anything..."
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-cyan-500/50"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center"
                >
                  <ArrowRight className="w-5 h-5 text-white" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// Trust & Security Section
// ============================================
function TrustSection({ locale }: { locale: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const trustItems = [
    { icon: Shield, title: 'Bank-Level Security', titleKo: '금융급 보안' },
    { icon: Fingerprint, title: 'Biometric Auth', titleKo: '생체 인증' },
    { icon: BadgeCheck, title: 'Verified Partners', titleKo: '검증된 파트너' },
    { icon: Globe, title: '24/7 Support', titleKo: '24시간 지원' },
  ];

  return (
    <section ref={ref} className="py-24 sm:py-32 px-4 sm:px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#12121A]/50 to-transparent" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            신뢰할 수 있는 플랫폼
          </h2>
          <p className="text-white/50">
            글로벌 보안 표준을 준수하는 안전한 서비스
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6"
        >
          {trustItems.map((item, idx) => (
            <motion.div
              key={idx}
              variants={scaleIn}
              className="p-6 bg-white/5 border border-white/5 rounded-2xl text-center hover:border-[#8B5CF6]/30 transition-colors"
            >
              <div className="w-12 h-12 mx-auto bg-gradient-to-br from-[#8B5CF6]/20 to-[#3B82F6]/20 rounded-xl flex items-center justify-center mb-4">
                <item.icon className="w-6 h-6 text-[#8B5CF6]" />
              </div>
              <p className="text-white font-medium text-sm sm:text-base">{item.title}</p>
              <p className="text-white/40 text-xs sm:text-sm">{item.titleKo}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Certifications */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="mt-12 flex items-center justify-center gap-4 sm:gap-8 flex-wrap"
        >
          {['PCI-DSS', 'SOC 2', 'ISO 27001', 'GDPR'].map((cert) => (
            <div key={cert} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-white/60 text-sm">{cert}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// Final CTA Section
// ============================================
function FinalCTASection({ locale }: { locale: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-24 sm:py-32 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-r from-[#3B82F6]/10 via-[#8B5CF6]/10 to-[#06B6D4]/10 rounded-full blur-[150px]" />
      </div>

      <motion.div
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={fadeInUp}
        className="max-w-4xl mx-auto text-center relative z-10"
      >
        <h2 className="text-4xl sm:text-6xl font-bold text-white mb-8 leading-tight">
          한국 여행의 새로운 기준,
          <br />
          <span className="bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent">
            K-UNIVERSAL
          </span>
        </h2>

        <p className="text-lg sm:text-xl text-white/50 mb-12 max-w-2xl mx-auto">
          택시, 음식, 쇼핑, AI 컨시어지까지.
          <br />
          Ghost Wallet 하나로 한국의 모든 것을 경험하세요.
        </p>

        {/* CTA Button */}
        <Link href={`/${locale}/dashboard`}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-12 py-6 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-2xl font-bold text-xl shadow-2xl shadow-purple-500/20 inline-flex items-center gap-3"
          >
            지금 시작하기
            <ArrowRight className="w-6 h-6" />
          </motion.button>
        </Link>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-xl mx-auto">
          {[
            { value: '4+', label: '핵심 서비스' },
            { value: '47', label: '지원 언어' },
            { value: '24/7', label: 'AI 서포트' },
          ].map((stat, idx) => (
            <div key={idx} className="text-center">
              <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent">
                {stat.value}
              </p>
              <p className="text-white/40 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 1 }}
        className="mt-24 text-center pb-8"
      >
        <p className="text-white/30 text-sm">
          © 2025 K-UNIVERSAL by Field Nine. All rights reserved.
        </p>
      </motion.div>
    </section>
  );
}
