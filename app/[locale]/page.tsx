/**
 * K-UNIVERSAL Premium Landing Page
 * Design Philosophy: "Digital Luxury" - The Future Standard
 *
 * Inspired by Tesla's minimalism and Apple's attention to detail
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Shield, Fingerprint, Globe, Sparkles, ChevronDown } from 'lucide-react';

// ============================================
// Design Tokens
// ============================================
const colors = {
  ivory: '#F9F9F7',
  black: '#171717',
  royalBlue: '#2563EB',
  royalBlueHover: '#1D4ED8',
};

// ============================================
// Typing Animation Hook
// ============================================
function useTypingEffect(text: string, speed: number = 80, startDelay: number = 500) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let charIndex = 0;

    const startTyping = () => {
      timeout = setTimeout(function type() {
        if (charIndex < text.length) {
          setDisplayedText(text.slice(0, charIndex + 1));
          charIndex++;
          timeout = setTimeout(type, speed);
        } else {
          setIsComplete(true);
        }
      }, startDelay);
    };

    startTyping();
    return () => clearTimeout(timeout);
  }, [text, speed, startDelay]);

  return { displayedText, isComplete };
}

// ============================================
// CountUp Animation Hook
// ============================================
function useCountUp(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (startOnView && !isInView) return;
    if (hasStarted) return;

    setHasStarted(true);
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [end, duration, isInView, startOnView, hasStarted]);

  return { count, ref };
}

// ============================================
// Animation Variants
// ============================================
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
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
    transition: { staggerChildren: 0.15 }
  }
};

// ============================================
// Main Landing Page
// ============================================
export default function LandingPage() {
  const locale = useLocale();

  return (
    <div className="bg-[#F9F9F7] overflow-x-hidden">
      <HeroSection locale={locale} />
      <FeatureShowcase locale={locale} />
      <TrustSection locale={locale} />
      <FinalCTA locale={locale} />
    </div>
  );
}

// ============================================
// A. Hero Section - 압도적인 첫인상
// ============================================
function HeroSection({ locale }: { locale: string }) {
  const { displayedText, isComplete } = useTypingEffect('금융, 국경을 지우다.', 100, 800);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

  return (
    <motion.section
      style={{ opacity, scale }}
      className="min-h-screen flex flex-col items-center justify-center relative px-6"
    >
      {/* Background Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#2563EB]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#2563EB]/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto text-center relative z-10">
        {/* Headline with Typing Effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-[#171717] tracking-tight leading-[1.1]">
            {displayedText}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
              className={`inline-block w-[3px] h-[0.9em] bg-[#2563EB] ml-1 align-middle ${isComplete ? 'hidden' : ''}`}
            />
          </h1>
        </motion.div>

        {/* English Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isComplete ? 1 : 0, y: isComplete ? 0 : 20 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl md:text-2xl text-[#171717]/60 font-light tracking-wide mb-4"
        >
          Finance, Borderless.
        </motion.p>

        {/* Sub Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isComplete ? 1 : 0, y: isComplete ? 0 : 20 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg md:text-xl text-[#171717]/50 max-w-2xl mx-auto mb-12"
        >
          여권 하나로 시작하는 글로벌 뱅킹. 3분이면 충분합니다.
        </motion.p>

        {/* Glassmorphism CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isComplete ? 1 : 0, y: isComplete ? 0 : 20 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Link href={`/${locale}/demo`}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative px-12 py-5 rounded-full font-semibold text-lg overflow-hidden"
            >
              {/* Glassmorphism Background */}
              <div className="absolute inset-0 bg-[#2563EB] rounded-full" />
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/10 rounded-full" />
              <div className="absolute inset-[1px] bg-gradient-to-b from-white/20 to-transparent rounded-full opacity-50" />

              {/* Shine Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6 }}
              />

              <span className="relative z-10 text-white flex items-center gap-2">
                시작하기
                <Sparkles className="w-5 h-5 opacity-80" />
              </span>
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isComplete ? 1 : 0 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-2 text-[#171717]/30"
        >
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </motion.section>
  );
}

// ============================================
// B. Feature Showcase - Bento Grid
// ============================================
function FeatureShowcase({ locale }: { locale: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const features = [
    {
      id: 'ai-identity',
      title: 'AI Identity',
      subtitle: '당신의 얼굴이 곧 비밀번호입니다.',
      description: 'GPT-4 Vision 기반 여권 OCR로 2초 만에 신원 확인',
      icon: Fingerprint,
      gradient: 'from-violet-500/10 to-purple-500/10',
      iconColor: 'text-violet-600',
      size: 'large', // spans 2 columns
    },
    {
      id: 'ghost-wallet',
      title: 'Ghost Wallet',
      subtitle: '보이지 않지만, 가장 안전한 지갑.',
      description: '개인 키가 외부로 절대 유출되지 않는 로컬 우선 보안',
      icon: Shield,
      gradient: 'from-emerald-500/10 to-teal-500/10',
      iconColor: 'text-emerald-600',
      size: 'normal',
    },
    {
      id: 'k-lifestyle',
      title: 'K-Lifestyle',
      subtitle: '택시, 배달, 쇼핑.',
      description: '한국의 모든 것을 누리세요',
      icon: () => <span className="text-4xl">🇰🇷</span>,
      gradient: 'from-rose-500/10 to-orange-500/10',
      iconColor: '',
      size: 'normal',
    },
    {
      id: 'global-standard',
      title: 'Global Standard',
      subtitle: '전 세계 어디서나,',
      description: '당신의 언어로',
      icon: Globe,
      gradient: 'from-blue-500/10 to-cyan-500/10',
      iconColor: 'text-blue-600',
      size: 'wide', // spans full width
    },
  ];

  return (
    <section ref={ref} className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeInUp}
          className="text-center mb-20"
        >
          <span className="text-sm tracking-widest uppercase text-[#2563EB] font-medium">
            Features
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-[#171717] mt-4">
            미래 금융의 표준
          </h2>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-4 gap-5"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.id}
              variants={fadeInUp}
              className={`
                group relative overflow-hidden rounded-3xl bg-white border border-[#171717]/5
                transition-all duration-500 hover:shadow-2xl hover:shadow-[#2563EB]/5
                ${feature.size === 'large' ? 'md:col-span-2 md:row-span-2' : ''}
                ${feature.size === 'wide' ? 'md:col-span-4' : ''}
                ${feature.size === 'normal' ? 'md:col-span-2' : ''}
              `}
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              {/* Content */}
              <div className={`relative z-10 p-8 ${feature.size === 'large' ? 'md:p-12' : ''} ${feature.size === 'wide' ? 'md:py-12 md:px-16 flex items-center justify-between' : ''}`}>
                <div className={feature.size === 'wide' ? 'flex-1' : ''}>
                  {/* Icon */}
                  <div className={`mb-6 ${feature.iconColor}`}>
                    {typeof feature.icon === 'function' && feature.icon.name === 'icon' ? (
                      <feature.icon />
                    ) : typeof feature.icon === 'function' ? (
                      <feature.icon className={`w-10 h-10 ${feature.size === 'large' ? 'w-14 h-14' : ''}`} />
                    ) : null}
                  </div>

                  {/* Text */}
                  <div className="space-y-2">
                    <p className="text-xs tracking-widest uppercase text-[#171717]/40 font-medium">
                      {feature.title}
                    </p>
                    <h3 className={`font-bold text-[#171717] ${feature.size === 'large' ? 'text-2xl md:text-3xl' : 'text-xl'}`}>
                      {feature.subtitle}
                    </h3>
                    <p className="text-[#171717]/60">
                      {feature.description}
                    </p>
                  </div>
                </div>

                {/* Arrow for wide cards */}
                {feature.size === 'wide' && (
                  <motion.div
                    initial={{ x: 0 }}
                    whileHover={{ x: 10 }}
                    className="hidden md:flex items-center gap-4 text-[#2563EB]"
                  >
                    <span className="text-sm font-medium">4개 언어 지원</span>
                    <div className="w-12 h-12 rounded-full bg-[#2563EB]/10 flex items-center justify-center">
                      <Globe className="w-6 h-6" />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Hover Border Effect */}
              <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-[#2563EB]/10 transition-colors duration-500" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// C. Trust & Authority Section
// ============================================
function TrustSection({ locale }: { locale: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const { count: transactionCount, ref: countRef1 } = useCountUp(847293, 2500);
  const { count: userCount, ref: countRef2 } = useCountUp(12847, 2000);
  const { count: uptime, ref: countRef3 } = useCountUp(99, 1500);

  return (
    <section ref={ref} className="py-32 px-6 bg-[#171717]">
      <div className="max-w-6xl mx-auto">
        {/* Security Badge */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeInUp}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 mb-8">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span className="text-white/80 text-sm">Secured by Toss Payments & Supabase</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            금융권 수준의 보안
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            PCI-DSS 인증 결제 시스템과 엔터프라이즈급 데이터베이스로<br />
            당신의 자산을 안전하게 보호합니다.
          </p>
        </motion.div>

        {/* Live Stats */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {/* Transaction Count */}
          <motion.div
            variants={fadeInUp}
            ref={countRef1}
            className="text-center p-8 rounded-3xl bg-white/5 border border-white/10"
          >
            <div className="text-5xl md:text-6xl font-bold text-white mb-2 tabular-nums">
              {transactionCount.toLocaleString()}
              <span className="text-[#2563EB]">+</span>
            </div>
            <p className="text-white/50">처리된 트랜잭션</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 text-sm">실시간 처리 중</span>
            </div>
          </motion.div>

          {/* User Count */}
          <motion.div
            variants={fadeInUp}
            ref={countRef2}
            className="text-center p-8 rounded-3xl bg-white/5 border border-white/10"
          >
            <div className="text-5xl md:text-6xl font-bold text-white mb-2 tabular-nums">
              {userCount.toLocaleString()}
            </div>
            <p className="text-white/50">등록된 사용자</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-sm">47개국</span>
            </div>
          </motion.div>

          {/* Uptime */}
          <motion.div
            variants={fadeInUp}
            ref={countRef3}
            className="text-center p-8 rounded-3xl bg-white/5 border border-white/10"
          >
            <div className="text-5xl md:text-6xl font-bold text-white mb-2 tabular-nums">
              {uptime}.<span className="text-[#2563EB]">99</span>%
            </div>
            <p className="text-white/50">서비스 가동률</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Shield className="w-4 h-4 text-violet-400" />
              <span className="text-violet-400 text-sm">엔터프라이즈 SLA</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Security Logos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-16 flex items-center justify-center gap-12 flex-wrap"
        >
          {['PCI-DSS', 'SOC 2', 'ISO 27001', 'GDPR'].map((cert) => (
            <div key={cert} className="flex items-center gap-2 text-white/30">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">{cert}</span>
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
function FinalCTA({ locale }: { locale: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-32 px-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-[#2563EB]/5 to-transparent rounded-full blur-3xl" />
      </div>

      <motion.div
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={fadeInUp}
        className="max-w-4xl mx-auto text-center relative z-10"
      >
        <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#171717] mb-8 leading-tight">
          지금 시작하세요.
          <br />
          <span className="text-[#2563EB]">미래는 기다려주지 않습니다.</span>
        </h2>

        <p className="text-xl text-[#171717]/50 mb-12 max-w-2xl mx-auto">
          여권 하나만 있으면 됩니다. 복잡한 서류도, 긴 대기 시간도 없습니다.
          <br />
          지금 바로 글로벌 금융의 자유를 경험하세요.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href={`/${locale}/demo`}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-12 py-5 bg-[#2563EB] text-white rounded-full font-semibold text-lg hover:bg-[#1D4ED8] transition-colors shadow-xl shadow-[#2563EB]/20"
            >
              무료로 시작하기
            </motion.button>
          </Link>

          <Link href={`/${locale}/wallet`}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-12 py-5 bg-transparent text-[#171717] rounded-full font-semibold text-lg border-2 border-[#171717]/10 hover:border-[#171717]/20 transition-colors"
            >
              지갑 둘러보기
            </motion.button>
          </Link>
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 flex items-center justify-center gap-8 text-sm text-[#171717]/40 flex-wrap"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>금융권 수준 보안</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>3분 가입</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span>47개국 지원</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: 1 }}
        className="mt-32 text-center"
      >
        <p className="text-sm text-[#171717]/30">
          © 2025 K-Universal. The Future Standard of Finance.
        </p>
      </motion.div>
    </section>
  );
}
