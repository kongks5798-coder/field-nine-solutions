/**
 * Field Nine - Next-Gen Digital WOWPASS
 * "Don't line up for cards. Just Scan, Swap, and Pay."
 *
 * Benchmarking: WOWPASS + AliPay + NFT
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  QrCode,
  ArrowRightLeft,
  Fingerprint,
  Receipt,
  Shield,
  Cpu,
  Sparkles,
  ChevronDown,
  X,
  TrendingUp,
  Globe,
  Wallet,
  ScanLine,
  BadgeCheck,
  Banknote,
} from 'lucide-react';

// ============================================
// Design Tokens
// ============================================
const colors = {
  bg: '#0A0A0F',
  surface: '#12121A',
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  accent: '#06B6D4',
  success: '#10B981',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.6)',
};

// ============================================
// Currency Exchange Rates (Mock)
// ============================================
const exchangeRates: Record<string, number> = {
  USD: 1320.50,
  EUR: 1445.30,
  JPY: 8.92,
  CNY: 182.40,
  GBP: 1678.20,
};

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
    transition: { staggerChildren: 0.12, delayChildren: 0.1 }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

// ============================================
// Main Landing Page
// ============================================
export default function LandingPage() {
  const locale = useLocale();
  const [showExchangeModal, setShowExchangeModal] = useState(false);

  return (
    <div className="bg-[#0A0A0F] min-h-screen overflow-x-hidden">
      {/* Floating QR Button - Always Visible */}
      <FloatingQRButton locale={locale} />

      {/* Main Sections */}
      <HeroSection locale={locale} onExchangeClick={() => setShowExchangeModal(true)} />
      <CoreFeaturesSection locale={locale} />
      <TechTrustSection locale={locale} />
      <FinalCTASection locale={locale} onExchangeClick={() => setShowExchangeModal(true)} />

      {/* Exchange Calculator Modal */}
      <AnimatePresence>
        {showExchangeModal && (
          <ExchangeModal onClose={() => setShowExchangeModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Floating QR Button (카카오페이 스타일)
// ============================================
function FloatingQRButton({ locale }: { locale: string }) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1.5, duration: 0.5 }}
      className="fixed bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-50"
    >
      <Link href={`/${locale}/wallet`}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] rounded-full shadow-2xl shadow-purple-500/30"
        >
          <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          <span className="text-white font-bold text-base sm:text-lg">QR 결제</span>
          <motion.div
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ScanLine className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
          </motion.div>
        </motion.button>
      </Link>
    </motion.div>
  );
}

// ============================================
// A. Hero Section - The Hook
// ============================================
function HeroSection({ locale, onExchangeClick }: { locale: string; onExchangeClick: () => void }) {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.25], [1, 0.9]);

  return (
    <motion.section
      style={{ opacity, scale }}
      className="min-h-screen flex flex-col items-center justify-center relative px-6 pt-20"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#3B82F6]/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[#8B5CF6]/10 rounded-full blur-[120px]"
        />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto text-center relative z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/70">
            <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
            Next-Gen Digital WOWPASS
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-4 sm:mb-6 leading-[1.1]"
        >
          환전,
          <br />
          <span className="bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent">
            더 이상 기다리지 마세요.
          </span>
        </motion.h1>

        {/* English Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-base sm:text-lg md:text-xl text-white/40 font-light tracking-wide mb-3 sm:mb-4"
        >
          Exchange Logic, Redefined.
        </motion.p>

        {/* Sub Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-base sm:text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-8 sm:mb-12 px-2"
        >
          공항보다 저렴한 환율, QR 스캔 한 번으로 한국 쇼핑 시작.
        </motion.p>

        {/* Currency Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mb-12"
        >
          <CurrencyFlowAnimation onExchangeClick={onExchangeClick} />
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <button
            onClick={onExchangeClick}
            className="group relative px-10 py-5 rounded-2xl font-semibold text-lg overflow-hidden"
          >
            {/* Gradient Border */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] rounded-2xl" />
            <div className="absolute inset-[2px] bg-[#0A0A0F] rounded-[14px]" />
            <span className="relative z-10 text-white flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5" />
              지금 환전하기
            </span>
          </button>

          <Link href={`/${locale}/demo`}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-semibold text-lg hover:bg-white/10 transition-colors"
            >
              서비스 둘러보기
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
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-2 text-white/30"
        >
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </motion.section>
  );
}

// ============================================
// Currency Flow Animation ($ → ₩ → QR)
// ============================================
function CurrencyFlowAnimation({ onExchangeClick }: { onExchangeClick: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 3);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const symbols = ['$', '₩', 'QR'];
  const colors = ['#10B981', '#3B82F6', '#8B5CF6'];
  const labels = ['USD', 'KRW', 'Pay'];

  return (
    <div
      onClick={onExchangeClick}
      className="inline-flex items-center gap-2 sm:gap-4 p-4 sm:p-6 bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
    >
      {symbols.map((symbol, idx) => (
        <div key={idx} className="flex items-center gap-2 sm:gap-4">
          <motion.div
            animate={{
              scale: step === idx ? 1.15 : 1,
              opacity: step === idx ? 1 : 0.4,
            }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <div
              className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-bold"
              style={{
                background: `linear-gradient(135deg, ${colors[idx]}20, ${colors[idx]}05)`,
                border: `2px solid ${step === idx ? colors[idx] : 'transparent'}`,
                color: colors[idx],
              }}
            >
              {symbol === 'QR' ? <QrCode className="w-6 h-6 sm:w-8 sm:h-8" /> : symbol}
            </div>
            <span className="text-[10px] sm:text-xs text-white/50 mt-1 sm:mt-2">{labels[idx]}</span>
          </motion.div>

          {idx < 2 && (
            <motion.div
              animate={{
                opacity: step > idx ? 1 : 0.3,
                x: step > idx ? [0, 5, 0] : 0,
              }}
              transition={{ duration: 0.5 }}
            >
              <ChevronDown className="w-4 h-4 sm:w-6 sm:h-6 text-white/40 -rotate-90" />
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================
// B. Core Features Section (Bento Grid)
// ============================================
function CoreFeaturesSection({ locale }: { locale: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const features = [
    {
      id: 'exchange',
      title: 'Real-time Swap',
      subtitle: '실시간 환전',
      description: '은행보다 저렴한 환율로 즉시 환전. 숨겨진 수수료 없이 투명하게.',
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-teal-500',
      size: 'large',
      component: <ExchangeRateWidget />,
    },
    {
      id: 'payment',
      title: 'Scan to Pay',
      subtitle: 'QR 결제',
      description: '편의점부터 백화점까지, QR 하나로 전국 어디서나.',
      icon: QrCode,
      gradient: 'from-blue-500 to-cyan-500',
      size: 'normal',
      component: <QRScanAnimation />,
    },
    {
      id: 'identity',
      title: 'NFT Passport',
      subtitle: '디지털 신분증',
      description: 'Soulbound Token으로 위변조 불가능한 디지털 여권.',
      icon: BadgeCheck,
      gradient: 'from-purple-500 to-pink-500',
      size: 'normal',
      component: <NFTPassportCard />,
    },
    {
      id: 'taxrefund',
      title: 'Tax Refund',
      subtitle: '즉시 환급',
      description: '쇼핑 즉시 세금 환급 신청. 공항에서 기다릴 필요 없어요.',
      icon: Receipt,
      gradient: 'from-orange-500 to-amber-500',
      size: 'wide',
      component: <TaxRefundCalculator />,
    },
  ];

  return (
    <section ref={ref} className="py-16 sm:py-32 px-4 sm:px-6 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#12121A] to-transparent" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeInUp}
          className="text-center mb-10 sm:mb-20"
        >
          <span className="text-xs sm:text-sm tracking-widest uppercase text-[#8B5CF6] font-medium">
            Core Features
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-3 sm:mt-4">
            모든 것이 하나로
          </h2>
          <p className="text-sm sm:text-base text-white/50 mt-3 sm:mt-4 max-w-xl mx-auto">
            환전, 결제, 신분증, 환급까지. 스마트폰 하나면 충분합니다.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.id}
              variants={fadeInUp}
              className={`
                group relative overflow-hidden rounded-3xl bg-[#12121A] border border-white/5
                transition-all duration-500 hover:border-white/10
                ${feature.size === 'large' ? 'md:col-span-2 md:row-span-2' : ''}
                ${feature.size === 'wide' ? 'md:col-span-4' : ''}
                ${feature.size === 'normal' ? 'md:col-span-2' : ''}
              `}
            >
              {/* Gradient Glow on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

              {/* Content */}
              <div className={`relative z-10 p-6 ${feature.size === 'large' ? 'md:p-8' : ''} ${feature.size === 'wide' ? 'md:p-8' : ''} h-full flex flex-col`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs tracking-widest uppercase text-white/40 font-medium">
                      {feature.title}
                    </p>
                    <h3 className={`font-bold text-white mt-1 ${feature.size === 'large' ? 'text-2xl' : 'text-xl'}`}>
                      {feature.subtitle}
                    </h3>
                  </div>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.gradient} bg-opacity-20 flex items-center justify-center`}>
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Description */}
                <p className="text-white/50 text-sm mb-4">
                  {feature.description}
                </p>

                {/* Interactive Component */}
                <div className="flex-1 flex items-center justify-center">
                  {feature.component}
                </div>
              </div>

              {/* Corner Accent */}
              <div className={`absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br ${feature.gradient} opacity-10 rounded-full blur-3xl`} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// Exchange Rate Widget
// ============================================
function ExchangeRateWidget() {
  const [rates, setRates] = useState(exchangeRates);

  // Simulate live rate changes
  useEffect(() => {
    const interval = setInterval(() => {
      setRates((prev) => {
        const newRates = { ...prev };
        Object.keys(newRates).forEach((key) => {
          const change = (Math.random() - 0.5) * 2;
          newRates[key] = Math.round((newRates[key] + change) * 100) / 100;
        });
        return newRates;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full space-y-3">
      {Object.entries(rates).slice(0, 4).map(([currency, rate]) => (
        <motion.div
          key={currency}
          layout
          className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-white">{currency}</span>
            <span className="text-white/40">→</span>
            <span className="text-white/60">KRW</span>
          </div>
          <motion.span
            key={rate}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg font-mono text-emerald-400"
          >
            ₩{rate.toLocaleString()}
          </motion.span>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================
// QR Scan Animation
// ============================================
function QRScanAnimation() {
  return (
    <div className="relative w-32 h-32">
      {/* QR Frame */}
      <div className="absolute inset-0 border-2 border-white/20 rounded-2xl">
        {/* Corner Accents */}
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[#3B82F6] rounded-tl" />
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[#3B82F6] rounded-tr" />
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[#3B82F6] rounded-bl" />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[#3B82F6] rounded-br" />
      </div>

      {/* Scan Line */}
      <motion.div
        animate={{ y: [0, 112, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-2 left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent"
      />

      {/* QR Icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <QrCode className="w-16 h-16 text-white/30" />
      </div>
    </div>
  );
}

// ============================================
// NFT Passport Card
// ============================================
function NFTPassportCard() {
  return (
    <motion.div
      whileHover={{ rotateY: 10, rotateX: -5 }}
      transition={{ duration: 0.3 }}
      className="relative w-full max-w-[200px] aspect-[1.586] perspective-1000"
    >
      {/* Card */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6] rounded-2xl overflow-hidden">
        {/* Holographic Effect */}
        <motion.div
          animate={{
            background: [
              'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
              'linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.1) 20%, transparent 40%)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0"
        />

        {/* Content */}
        <div className="absolute inset-0 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/80 font-medium">NFT PASSPORT</span>
            <BadgeCheck className="w-5 h-5 text-white" />
          </div>

          <div>
            <div className="w-8 h-8 bg-white/20 rounded-lg mb-2" />
            <p className="text-xs text-white/60">Soulbound Token</p>
            <p className="text-sm font-bold text-white">VIP Tourist</p>
          </div>
        </div>

        {/* Chip */}
        <div className="absolute top-1/2 left-4 -translate-y-1/2 w-8 h-6 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-sm opacity-80" />
      </div>
    </motion.div>
  );
}

// ============================================
// Tax Refund Calculator
// ============================================
function TaxRefundCalculator() {
  const [amount, setAmount] = useState(100000);
  const refundRate = 0.1; // 10% refund
  const refund = Math.floor(amount * refundRate);

  return (
    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-8">
      <div className="flex-1 w-full">
        <p className="text-xs sm:text-sm text-white/40 mb-2">구매 금액</p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-white">₩{amount.toLocaleString()}</span>
        </div>
        <input
          type="range"
          min="30000"
          max="1000000"
          step="10000"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full mt-3 sm:mt-4 accent-orange-500"
        />
      </div>

      <div className="text-center flex sm:flex-col items-center gap-3 sm:gap-0 bg-white/5 sm:bg-transparent p-3 sm:p-0 rounded-xl w-full sm:w-auto">
        <Receipt className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400 sm:mx-auto sm:mb-2" />
        <div>
          <p className="text-xs sm:text-sm text-white/40">예상 환급액</p>
          <motion.p
            key={refund}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-xl sm:text-2xl font-bold text-orange-400"
          >
            ₩{refund.toLocaleString()}
          </motion.p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// C. Tech & Trust Section
// ============================================
function TechTrustSection({ locale }: { locale: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const techStack = [
    {
      icon: Shield,
      title: 'Blockchain Security',
      description: 'NFT 기반 신원 인증으로 위변조 원천 차단',
    },
    {
      icon: Fingerprint,
      title: 'Biometric Auth',
      description: 'Face ID / Touch ID로 결제 보호',
    },
    {
      icon: Cpu,
      title: 'AI Fraud Detection',
      description: '실시간 이상 거래 감지 및 차단',
    },
    {
      icon: Globe,
      title: 'Global Network',
      description: '47개국 다국어 지원',
    },
  ];

  return (
    <section ref={ref} className="py-16 sm:py-32 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-[#12121A] to-[#0A0A0F]" />
        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[#8B5CF6] rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeInUp}
          className="text-center mb-10 sm:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 mb-4 sm:mb-6">
            <Cpu className="w-3 h-3 sm:w-4 sm:h-4 text-[#8B5CF6]" />
            <span className="text-[#8B5CF6] text-xs sm:text-sm font-medium">Powered by Blockchain & AI</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">
            기술이 신뢰를 만듭니다
          </h2>
          <p className="text-sm sm:text-base text-white/50 max-w-2xl mx-auto px-2">
            NFT가 위변조를 막고, AI가 사기를 감지하고, 생체인증이 결제를 보호합니다.
          </p>
        </motion.div>

        {/* Tech Cards */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6"
        >
          {techStack.map((tech, idx) => (
            <motion.div
              key={idx}
              variants={scaleIn}
              whileHover={{ y: -5, scale: 1.02 }}
              className="p-4 sm:p-6 bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/5 hover:border-[#8B5CF6]/30 transition-colors"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#8B5CF6]/20 to-[#3B82F6]/20 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                <tech.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#8B5CF6]" />
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-white mb-1 sm:mb-2">{tech.title}</h3>
              <p className="text-xs sm:text-sm text-white/50 leading-relaxed">{tech.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Security Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-8 sm:mt-16 flex items-center justify-center gap-3 sm:gap-8 flex-wrap"
        >
          {['PCI-DSS', 'SOC 2', 'ISO 27001', 'GDPR'].map((cert) => (
            <div key={cert} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 rounded-full">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
              <span className="text-xs sm:text-sm text-white/60">{cert}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// D. Final CTA Section
// ============================================
function FinalCTASection({ locale, onExchangeClick }: { locale: string; onExchangeClick: () => void }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-16 sm:py-32 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[1000px] h-[600px] sm:h-[1000px] bg-gradient-to-r from-[#3B82F6]/10 via-[#8B5CF6]/10 to-[#06B6D4]/10 rounded-full blur-[100px] sm:blur-[150px]" />
      </div>

      <motion.div
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={fadeInUp}
        className="max-w-4xl mx-auto text-center relative z-10"
      >
        {/* Main Message */}
        <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 sm:mb-8 leading-tight">
          줄 서지 마세요.
          <br />
          <span className="bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent">
            스캔하세요.
          </span>
        </h2>

        <p className="text-base sm:text-xl text-white/50 mb-8 sm:mb-12 max-w-2xl mx-auto px-2">
          Don't line up for cards. Just Scan, Swap, and Pay.
          <br />
          여권 하나로 시작하는 스마트한 한국 여행.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-10 sm:mb-16">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onExchangeClick}
            className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-xl sm:rounded-2xl font-semibold text-base sm:text-lg shadow-2xl shadow-purple-500/20"
          >
            지금 시작하기
          </motion.button>

          <Link href={`/${locale}/wallet`} className="w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-white/5 border border-white/10 text-white rounded-xl sm:rounded-2xl font-semibold text-base sm:text-lg hover:bg-white/10 transition-colors"
            >
              QR 결제 체험
            </motion.button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto">
          {[
            { value: '0%', label: '숨은 수수료' },
            { value: '3초', label: '환전 시간' },
            { value: '24/7', label: '서비스' },
          ].map((stat, idx) => (
            <div key={idx} className="text-center">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent">
                {stat.value}
              </p>
              <p className="text-xs sm:text-sm text-white/40 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 1, duration: 1 }}
        className="mt-16 sm:mt-32 text-center pb-20 sm:pb-24"
      >
        <p className="text-xs sm:text-sm text-white/30">
          © 2025 Field Nine. Next-Gen Digital WOWPASS.
        </p>
      </motion.div>
    </section>
  );
}

// ============================================
// Exchange Calculator Modal
// ============================================
function ExchangeModal({ onClose }: { onClose: () => void }) {
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [amount, setAmount] = useState('100');
  const rate = exchangeRates[fromCurrency] || 1320.5;
  const result = parseFloat(amount || '0') * rate;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-[#12121A] rounded-3xl border border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h3 className="text-xl font-bold text-white">환전 계산기</h3>
            <p className="text-sm text-white/50">실시간 환율 적용</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* From Currency */}
          <div>
            <label className="text-sm text-white/50 mb-2 block">보내는 금액</label>
            <div className="flex gap-3">
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#8B5CF6]"
              >
                {Object.keys(exchangeRates).map((curr) => (
                  <option key={curr} value={curr} className="bg-[#12121A]">
                    {curr}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-right text-2xl font-bold focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="p-3 bg-gradient-to-r from-[#3B82F6]/20 to-[#8B5CF6]/20 rounded-full">
              <ArrowRightLeft className="w-5 h-5 text-[#8B5CF6]" />
            </div>
          </div>

          {/* To Currency (KRW) */}
          <div>
            <label className="text-sm text-white/50 mb-2 block">받는 금액 (KRW)</label>
            <div className="p-4 bg-gradient-to-r from-[#3B82F6]/10 to-[#8B5CF6]/10 rounded-xl border border-[#8B5CF6]/20">
              <motion.p
                key={result}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold text-white text-right"
              >
                ₩{result.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}
              </motion.p>
            </div>
          </div>

          {/* Rate Info */}
          <div className="flex items-center justify-between text-sm text-white/50 bg-white/5 rounded-xl p-3">
            <span>적용 환율</span>
            <span className="text-emerald-400">1 {fromCurrency} = ₩{rate.toLocaleString()}</span>
          </div>

          {/* CTA */}
          <button className="w-full py-4 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-xl font-bold text-lg hover:opacity-90 transition-opacity">
            환전하기
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
