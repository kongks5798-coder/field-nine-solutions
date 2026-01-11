'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { 
  Zap, 
  Shield, 
  TrendingUp,
  Brain,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Server,
  BarChart3,
  ChevronRight,
  X
} from 'lucide-react';
import { useState } from 'react';

export const dynamic = 'force-dynamic';

/**
 * Field Nine: Tesla-Style 2026 Premium Landing Page
 * 
 * 미래지향적이고 고급스러운 소개 페이지
 * - 넓은 white space
 * - 오렌지 액센트 (warmth palette)
 * - Micro-animations
 * - Asymmetry
 * - AI-ready chat assistant
 */
export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  if (status === 'authenticated') {
    return null;
  }

  // Hero 모델 데이터 (수평 스크롤용)
  const heroModels = [
    { id: 1, title: 'AI 자동화', subtitle: 'RTX 5090 기반', gradient: 'from-orange-400 to-orange-600' },
    { id: 2, title: '실시간 모니터링', subtitle: '0% 다운타임', gradient: 'from-orange-500 to-red-500' },
    { id: 3, title: '비용 최적화', subtitle: '98% 절감', gradient: 'from-red-500 to-pink-500' },
  ];

  // 3개 주요 기능
  const features = [
    {
      icon: Server,
      title: 'AI 서버: RTX 5090',
      description: '비용 98% down, 0% 다운타임. 로컬 AI로 완벽한 자동화를 경험하세요.',
      bullets: [
        '재고 예측 자동화',
        '가격 최적화',
        '트렌드 분석',
        '수요 예측'
      ],
      stat: '98% 비용 절감'
    },
    {
      icon: BarChart3,
      title: '실시간 모니터링',
      description: '문제를 예측하고 자동으로 해결합니다. 모든 기능을 커버합니다.',
      bullets: [
        '자동화 시스템',
        '비용 관리',
        '보안 모니터링',
        '스케일 관리',
        '통합 대시보드'
      ],
      stat: '0% 다운타임'
    },
    {
      icon: Brain,
      title: '완벽한 통합',
      description: '모든 쇼핑몰, 모든 플랫폼을 하나로. AI가 모든 것을 연결합니다.',
      bullets: [
        '멀티채널 통합',
        '자동 주문 처리',
        '재고 동기화',
        '수익 분석',
        '보고서 자동화'
      ],
      stat: '무제한 확장'
    }
  ];

  // Social Proof Metrics
  const metrics = [
    { value: '10,000+', label: '일일 처리 주문' },
    { value: '98%', label: '비용 절감' },
    { value: '0%', label: '다운타임' },
    { value: '24/7', label: '자동 운영' }
  ];

  // FAQ (5 objections)
  const faqs = [
    {
      question: '기존 시스템과 통합이 어렵지 않나요?',
      answer: '아니요. Field Nine은 모든 주요 쇼핑몰과 플랫폼을 지원하며, API를 통해 기존 시스템과 쉽게 연결됩니다. 마이그레이션은 평균 1일 이내 완료됩니다.'
    },
    {
      question: '비용이 얼마나 드나요?',
      answer: 'RTX 5090 로컬 AI를 사용하여 클라우드 비용을 98% 절감합니다. 기본 플랜은 월 ₩99,000부터 시작하며, 사용량에 따라 자동 스케일링됩니다.'
    },
    {
      question: '데이터 보안은 어떻게 보장되나요?',
      answer: '엔터프라이즈급 암호화, RLS 정책, 자동 백업으로 데이터를 완벽하게 보호합니다. Supabase 기반으로 99.9% 가동률을 보장합니다.'
    },
    {
      question: 'AI가 정확한가요?',
      answer: 'RTX 5090 기반 로컬 AI로 98% 이상의 정확도를 달성합니다. 실시간 학습으로 지속적으로 개선되며, 모든 예측은 투명하게 제공됩니다.'
    },
    {
      question: '지원은 어떻게 받나요?',
      answer: '24/7 AI 챗봇 지원과 전담 고객 성공 매니저가 제공됩니다. 평균 응답 시간은 5분 이내입니다.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1A] antialiased">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#F5F5F0]/80 backdrop-blur-xl border-b border-[#E5E5E0]/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg" />
              <span className="text-xl font-bold">Field Nine</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium hover:text-orange-600 transition-colors">기능</a>
              <a href="#pricing" className="text-sm font-medium hover:text-orange-600 transition-colors">가격</a>
              <a href="#faq" className="text-sm font-medium hover:text-orange-600 transition-colors">FAQ</a>
            </div>
            <div className="flex items-center gap-4">
              <a href="/login" className="text-sm font-medium hover:text-orange-600 transition-colors">로그인</a>
              <motion.a
                href="/login"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-semibold rounded-lg shadow-lg"
              >
                시작하기
              </motion.a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <motion.div style={{ opacity }} className="max-w-7xl mx-auto px-6 lg:px-8 py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-full"
              >
                <Sparkles className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-600">AI-Powered Commerce Platform</span>
              </motion.div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light leading-tight">
                당신의 비즈니스를<br />
                <span className="font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  AI로 업그레이드
                </span>
              </h1>

              <p className="text-xl text-[#6B6B6B] leading-relaxed max-w-xl">
                RTX 5090 로컬 AI와 완벽한 자동화로<br />
                재고, 주문, 수익을 실시간으로 관리하고 최적화합니다.
              </p>

              <motion.a
                href="#demo"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98, y: 2 }}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg shadow-xl hover:shadow-2xl transition-all"
              >
                데모 예약
                <ArrowRight className="w-5 h-5" />
              </motion.a>
            </motion.div>

            {/* Right: Horizontal Scroll Models */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                {heroModels.map((model, index) => (
                  <motion.div
                    key={model.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.2 }}
                    className="flex-shrink-0 w-80 h-96 rounded-2xl bg-gradient-to-br p-8 shadow-2xl snap-center"
                    style={{
                      background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                    }}
                  >
                    <div className={`bg-gradient-to-br ${model.gradient} w-full h-full rounded-xl p-8 flex flex-col justify-between text-white`}>
                      <div>
                        <div className="text-sm opacity-90 mb-2">{model.subtitle}</div>
                        <h3 className="text-3xl font-bold mb-4">{model.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span>자세히 보기</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Painterly AI Image Placeholder */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="absolute -bottom-20 -right-20 w-64 h-64 bg-gradient-to-br from-orange-200/50 to-red-200/50 rounded-full blur-3xl -z-10"
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Soft Background Shadows */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-100/30 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Features Section - 3 Cards Only */}
      <section id="features" className="py-32 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20 space-y-4"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light">
              강력한 기능으로<br />
              <span className="font-bold">비즈니스를 자동화</span>
            </h2>
            <p className="text-xl text-[#6B6B6B] max-w-2xl mx-auto">
              고급 + easy. 모든 기능을 커버합니다.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  whileHover={{ y: -8 }}
                  className="group relative p-8 bg-[#F5F5F0] rounded-2xl border-4 border-[#E5E5E0] hover:border-orange-500 transition-all cursor-pointer"
                >
                  {/* 3D Thick Border Effect */}
                  <div className="absolute inset-0 rounded-2xl border-4 border-orange-500 opacity-0 group-hover:opacity-100 transition-opacity -m-1" />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="p-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <span className="text-xs font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                        {feature.stat}
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold mb-4 text-[#1A1A1A]">
                      {feature.title}
                    </h3>
                    <p className="text-[#6B6B6B] mb-6 leading-relaxed">
                      {feature.description}
                    </p>

                    <ul className="space-y-3">
                      {feature.bullets.map((bullet, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-[#6B6B6B]">
                          <CheckCircle2 className="w-4 h-4 text-orange-600 flex-shrink-0" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 px-6 lg:px-8 bg-[#F5F5F0]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-light mb-4">
              신뢰받는 <span className="font-bold">인프라</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {metrics.map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                  {metric.value}
                </div>
                <div className="text-sm text-[#6B6B6B]">
                  {metric.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-32 px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-light mb-4">
              자주 묻는 <span className="font-bold">질문</span>
            </h2>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 bg-[#F5F5F0] rounded-xl border border-[#E5E5E0] hover:border-orange-500 transition-colors"
              >
                <h3 className="text-lg font-semibold mb-2 text-[#1A1A1A]">
                  {faq.question}
                </h3>
                <p className="text-[#6B6B6B] leading-relaxed">
                  {faq.answer}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 lg:px-8 bg-[#1A1A1A] text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg" />
                <span className="text-xl font-bold">Field Nine</span>
              </div>
              <p className="text-sm text-gray-400">
                AI로 비즈니스를 업그레이드하세요.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">제품</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-orange-500 transition-colors">기능</a></li>
                <li><a href="#pricing" className="hover:text-orange-500 transition-colors">가격</a></li>
                <li><a href="#faq" className="hover:text-orange-500 transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">회사</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/about" className="hover:text-orange-500 transition-colors">소개</a></li>
                <li><a href="/contact" className="hover:text-orange-500 transition-colors">연락처</a></li>
                <li><a href="/blog" className="hover:text-orange-500 transition-colors">블로그</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">지원</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/docs" className="hover:text-orange-500 transition-colors">문서</a></li>
                <li><a href="/support" className="hover:text-orange-500 transition-colors">지원</a></li>
                <li><a href="/status" className="hover:text-orange-500 transition-colors">상태</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2026 Field Nine. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* AI Chat Assistant (Floating) */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring" }}
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 transition-transform"
        aria-label="AI 챗봇 열기"
      >
        <MessageSquare className="w-6 h-6" />
      </motion.button>

      {/* Chat Window */}
      {chatOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-24 right-8 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-[#E5E5E0] z-50 flex flex-col"
        >
          <div className="p-4 border-b border-[#E5E5E0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full" />
              <span className="font-semibold">AI 어시스턴트</span>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div className="bg-[#F5F5F0] rounded-lg p-3 text-sm">
                  안녕하세요! Field Nine AI 어시스턴트입니다. 무엇을 도와드릴까요?
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-[#E5E5E0]">
            <input
              type="text"
              placeholder="메시지를 입력하세요..."
              className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
