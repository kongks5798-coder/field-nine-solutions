'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { 
  CheckCircle2, 
  ArrowRight,
  Gift,
  Users,
  Clock,
  Star,
  Sparkles,
  Target,
  Zap,
  TrendingUp
} from 'lucide-react';
import { SpatialLayers } from '../components/SpatialLayers';
import { ImperfectDesign } from '../components/ImperfectDesign';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const dynamic = 'force-dynamic';

/**
 * Field Nine Beta Page - Ultimate 2026 Edition
 * 최상급 퀄리티, 네비게이션 제거, 완벽한 미니멀 디자인
 */
export default function BetaPageUltimate() {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const [signupCount, setSignupCount] = useState(0);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, -30]);

  // GSAP Animations
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Hero content animation
    gsap.fromTo('.hero-content', 
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay: 0.3 }
    );

    // Stats counter animation
    gsap.utils.toArray('.stat-value').forEach((element: any, index: number) => {
      const endValue = element.textContent;
      const numValue = parseFloat(endValue.replace(/[^0-9.]/g, ''));
      if (isNaN(numValue)) return;

      gsap.fromTo(element,
        { textContent: 0 },
        {
          textContent: numValue,
          duration: 2,
          ease: 'power2.out',
          snap: { textContent: 1 },
          delay: 0.5 + index * 0.2,
          scrollTrigger: {
            trigger: element,
            start: 'top 90%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });

    // Benefits stagger
    gsap.fromTo('.benefit-card',
      { opacity: 0, y: 30, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.benefits-grid',
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  }, []);

  // Get signup count
  useEffect(() => {
    const count = localStorage.getItem('fieldnine-beta-signups')
      ? JSON.parse(localStorage.getItem('fieldnine-beta-signups') || '[]').length
      : 0;
    setSignupCount(count);
  }, [submitted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = {
        email,
        company,
        timestamp: new Date().toISOString(),
        source: 'beta-waitlist',
      };

      const GOOGLE_FORM_URL = process.env.NEXT_PUBLIC_GOOGLE_FORM_URL || '';
      
      if (GOOGLE_FORM_URL) {
        const formDataToSubmit = new FormData();
        formDataToSubmit.append('entry.EMAIL_FIELD_ID', email);
        formDataToSubmit.append('entry.COMPANY_FIELD_ID', company);

        await fetch(GOOGLE_FORM_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: formDataToSubmit,
        });
      }

      // 로컬 스토리지 저장
      const existing = JSON.parse(localStorage.getItem('fieldnine-beta-signups') || '[]');
      existing.push(formData);
      localStorage.setItem('fieldnine-beta-signups', JSON.stringify(existing));
      setSignupCount(existing.length);

      setSubmitted(true);
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Haptic feedback
  const triggerHaptic = (pattern: number | number[] = 50) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const stats = [
    { label: '베타 사용자', value: '100', suffix: '명', icon: Users, color: 'from-[#06B6D4] to-[#0891B2]' },
    { label: '무료 기간', value: '3', suffix: '개월', icon: Clock, color: 'from-[#0891B2] to-[#06B6D4]' },
    { label: '비용 절감', value: '98', suffix: '%', icon: TrendingUp, color: 'from-[#06B6D4] to-[#0EA5E9]', highlight: true },
    { label: '만족도', value: '4.9', suffix: '/5.0', icon: Star, color: 'from-[#0EA5E9] to-[#06B6D4]' },
  ];

  const benefits = [
    {
      icon: Gift,
      title: '첫 100명 무료 3개월',
      description: '베타 기간 동안 모든 프리미엄 기능을 무료로 사용하세요',
      stat: '3개월',
      color: 'from-[#06B6D4] to-[#0891B2]',
    },
    {
      icon: Zap,
      title: '비용 98% 절감',
      description: 'RTX 5090 로컬 AI로 클라우드 비용을 98% 절감합니다',
      stat: '98%',
      color: 'from-[#0891B2] to-[#06B6D4]',
      highlight: true
    },
    {
      icon: Target,
      title: '우선 지원',
      description: '베타 사용자는 전담 지원팀의 우선 지원을 받습니다',
      stat: '24/7',
      color: 'from-[#06B6D4] to-[#0EA5E9]',
    },
    {
      icon: Sparkles,
      title: '초기 피드백 반영',
      description: '여러분의 의견이 제품 로드맵에 직접 반영됩니다',
      stat: '100%',
      color: 'from-[#0EA5E9] to-[#06B6D4]',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#111] via-[#0A0A0A] to-[#111] text-[#F5F5F0] antialiased overflow-x-hidden">
      {/* Hero Section - No Navigation */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 lg:px-8">
        {/* Subtle Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#111] via-[#0A0A0A] to-[#111]" />
        
        {/* Spatial Layers - 3D-like depth */}
        <motion.div
          style={{ opacity, y }}
          className="absolute inset-0 -z-10"
        >
          <SpatialLayers depth={4}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl h-[700px]">
              {/* Minimal AI Visual */}
              <div className="relative w-full h-full">
                <motion.div
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 30, repeat: Infinity, ease: "linear" },
                    scale: { duration: 6, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  <div className="w-80 h-80 border border-[#06B6D4]/20 rounded-full flex items-center justify-center">
                    <div className="w-56 h-56 bg-gradient-to-br from-[#06B6D4]/10 to-[#0891B2]/5 rounded-full flex items-center justify-center">
                      <Sparkles className="w-28 h-28 text-[#06B6D4]/30" />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </SpatialLayers>
        </motion.div>

        {/* Hero Content */}
        <div className="max-w-5xl mx-auto text-center relative z-10 hero-content">
          {/* Beta Badge - Minimal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="inline-flex items-center gap-2 px-5 py-2 bg-[#06B6D4]/10 border border-[#06B6D4]/30 rounded-full mb-8"
          >
            <Sparkles className="w-4 h-4 text-[#06B6D4]" />
            <span className="text-sm font-medium text-[#06B6D4]">
              베타 런치
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-light leading-[1.1] mb-8"
          >
            Field Nine
            <br />
            <span className="font-semibold bg-gradient-to-r from-[#06B6D4] via-[#0891B2] to-[#06B6D4] bg-clip-text text-transparent">
              베타
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-2xl sm:text-3xl text-[#F5F5F0]/70 max-w-3xl mx-auto mb-16 leading-relaxed font-light"
          >
            AI 자동화로 비즈니스를 혁신하세요
            <br />
            <span className="text-[#06B6D4] font-medium">첫 100명에게 3개월 무료</span> 제공
          </motion.p>

          {/* Stats - Minimal Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <ImperfectDesign key={index}>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -4 }}
                    className={`p-6 rounded-2xl border ${
                      stat.highlight
                        ? 'border-[#06B6D4] bg-gradient-to-br from-[#06B6D4]/10 to-[#0891B2]/5'
                        : 'border-[#06B6D4]/20 bg-[#0A0A0A]/50'
                    } backdrop-blur-sm`}
                  >
                    <Icon className={`w-6 h-6 mb-3 mx-auto ${
                      stat.highlight ? 'text-[#06B6D4]' : 'text-[#06B6D4]/70'
                    }`} />
                    <div className={`text-4xl font-bold mb-1 stat-value ${
                      stat.highlight ? 'text-[#06B6D4]' : 'text-[#F5F5F0]'
                    }`}>
                      {stat.value}
                      <span className="text-lg text-[#F5F5F0]/60">{stat.suffix}</span>
                    </div>
                    <div className="text-xs text-[#F5F5F0]/50 mt-2">{stat.label}</div>
                  </motion.div>
                </ImperfectDesign>
              );
            })}
          </motion.div>

          {/* Waitlist Form - Premium */}
          {!submitted ? (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              onSubmit={handleSubmit}
              className="max-w-lg mx-auto"
            >
              <div className="space-y-4 mb-6">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일 주소"
                  required
                  className="w-full px-6 py-5 bg-[#0A0A0A]/80 backdrop-blur-sm border-2 border-[#06B6D4]/20 rounded-xl text-[#F5F5F0] placeholder:text-[#F5F5F0]/40 focus:outline-none focus:border-[#06B6D4] transition-all text-lg"
                />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="회사명 (선택)"
                  className="w-full px-6 py-5 bg-[#0A0A0A]/80 backdrop-blur-sm border-2 border-[#06B6D4]/20 rounded-xl text-[#F5F5F0] placeholder:text-[#F5F5F0]/40 focus:outline-none focus:border-[#06B6D4] transition-all text-lg"
                />
              </div>
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(6, 182, 212, 0.6)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => triggerHaptic([50, 30, 50])}
                className="w-full px-10 py-5 bg-gradient-to-r from-[#06B6D4] to-[#0891B2] text-white font-semibold text-lg rounded-xl shadow-2xl hover:shadow-[#06B6D4]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span>제출 중...</span>
                  </>
                ) : (
                  <>
                    <span>베타 대기열에 참여하기</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
              <p className="text-sm text-[#F5F5F0]/40 mt-4">
                첫 100명에게 3개월 무료 제공. 언제든지 취소 가능.
              </p>
            </motion.form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg mx-auto p-12 bg-gradient-to-br from-[#0A0A0A]/90 to-[#111]/90 backdrop-blur-xl rounded-3xl border-2 border-[#06B6D4]/30 shadow-2xl"
            >
              <div className="flex items-center justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-[#06B6D4] to-[#0891B2] rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
              </div>
              <h3 className="text-3xl font-semibold text-center mb-4">
                등록 완료
              </h3>
              <p className="text-center text-[#F5F5F0]/70 mb-8 leading-relaxed">
                베타 대기열에 성공적으로 등록되었습니다.
                <br />
                곧 이메일로 초대장을 보내드리겠습니다.
              </p>
              <div className="flex items-center justify-center gap-2 text-[#06B6D4]">
                <Users className="w-5 h-5" />
                <span className="font-medium">현재 대기열: {signupCount}명</span>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Benefits Section - Premium */}
      <section className="py-32 px-6 lg:px-8 bg-[#111]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl sm:text-6xl font-light mb-6">
              베타 혜택
            </h2>
            <p className="text-xl text-[#F5F5F0]/60 max-w-2xl mx-auto">
              첫 100명에게 특별한 혜택을 드립니다
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 benefits-grid">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <ImperfectDesign key={index}>
                  <SpatialLayers depth={2}>
                    <motion.div
                      whileHover={{ y: -8, scale: 1.02 }}
                      onClick={() => triggerHaptic()}
                      className={`p-8 rounded-2xl border-2 transition-all cursor-pointer benefit-card ${
                        benefit.highlight
                          ? 'border-[#06B6D4] bg-gradient-to-br from-[#06B6D4]/10 to-[#0891B2]/5'
                          : 'border-[#06B6D4]/20 bg-[#0A0A0A]/50 hover:border-[#06B6D4]/40'
                      } backdrop-blur-sm`}
                    >
                      <div className={`w-14 h-14 bg-gradient-to-br ${benefit.color} rounded-2xl flex items-center justify-center mb-6`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-3xl font-bold text-[#06B6D4] mb-2">{benefit.stat}</div>
                      <h3 className="text-xl font-semibold mb-3 text-[#F5F5F0]">
                        {benefit.title}
                      </h3>
                      <p className="text-sm text-[#F5F5F0]/60 leading-relaxed">
                        {benefit.description}
                      </p>
                    </motion.div>
                  </SpatialLayers>
                </ImperfectDesign>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 lg:px-8 bg-gradient-to-b from-[#111] to-[#0A0A0A]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl sm:text-6xl font-light mb-8">
              지금 바로 시작하세요
            </h2>
            <p className="text-xl text-[#F5F5F0]/60 mb-12 max-w-2xl mx-auto">
              첫 100명에게 3개월 무료 제공. 제한된 시간 동안만.
            </p>
            {!submitted && (
              <motion.a
                href="#waitlist"
                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(6, 182, 212, 0.6)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => triggerHaptic([50, 30, 50])}
                className="inline-flex items-center gap-3 px-12 py-6 bg-gradient-to-r from-[#06B6D4] to-[#0891B2] text-white font-semibold text-lg rounded-xl shadow-2xl hover:shadow-[#06B6D4]/50 transition-all"
              >
                <span>베타 대기열에 참여하기</span>
                <ArrowRight className="w-6 h-6" />
              </motion.a>
            )}
          </motion.div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-12 px-6 lg:px-8 bg-[#0A0A0A] border-t border-[#06B6D4]/10">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-[#F5F5F0]/40">
            © 2026 Field Nine. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
