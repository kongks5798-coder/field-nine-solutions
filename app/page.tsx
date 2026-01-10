'use client';

import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { 
  Zap, 
  Shield, 
  TrendingUp, 
  BarChart3, 
  Package, 
  ShoppingCart,
  Brain,
  ArrowRight,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const dynamic = 'force-dynamic';

/**
 * Field Nine: Tesla-Style Premium Landing Page
 * 
 * 미래지향적이고 신뢰감 있는 소개 페이지
 * - 강력한 헤드라인
 * - 기능 중심 설명
 * - 데이터 기반 신뢰성
 * - 미니멀 디자인
 */
export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  // 로그인 상태면 대시보드로 리다이렉트
  if (status === 'authenticated') {
    return null;
  }

  const features = [
    {
      icon: Brain,
      title: 'AI 기반 자동화',
      description: 'RTX 5090 로컬 AI로 재고 예측, 가격 최적화, 트렌드 분석을 자동으로 수행합니다.',
      stat: '98% 정확도'
    },
    {
      icon: Package,
      title: '실시간 재고 관리',
      description: '주문 생성 시 자동 재고 차감, 취소 시 자동 복구. 실수 없는 완벽한 재고 관리.',
      stat: '0% 오류율'
    },
    {
      icon: ShoppingCart,
      title: '멀티채널 주문 통합',
      description: '쿠팡, 네이버, 11번가 등 모든 쇼핑몰 주문을 한 곳에서 관리하고 자동으로 처리합니다.',
      stat: '무제한 채널'
    },
    {
      icon: BarChart3,
      title: '실시간 분석 대시보드',
      description: '매출, 주문, 재고를 실시간으로 분석하고 인사이트를 제공합니다.',
      stat: '실시간 업데이트'
    },
    {
      icon: Shield,
      title: '엔터프라이즈급 보안',
      description: 'Supabase 기반 암호화, RLS 정책, 자동 백업으로 데이터를 완벽하게 보호합니다.',
      stat: '99.9% 가동률'
    },
    {
      icon: TrendingUp,
      title: '수익 최적화',
      description: '플랫폼별 수수료 자동 계산, 마진 분석, 가격 최적화로 수익을 극대화합니다.',
      stat: '평균 23% 수익 증가'
    }
  ];

  const stats = [
    { value: '10,000+', label: '처리 가능 주문/일' },
    { value: '0.1초', label: '평균 응답 시간' },
    { value: '99.9%', label: '서비스 가동률' },
    { value: '24/7', label: '자동화 운영' }
  ];

  const benefits = [
    '재고 관리 시간 90% 절감',
    '주문 처리 오류 0% 달성',
    '수익 분석 자동화',
    '멀티채널 통합 관리',
    'AI 기반 수요 예측',
    '실시간 대시보드'
  ];

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-[#171717]">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A5D3F]/10 rounded-full mb-8"
            >
              <Sparkles className="w-4 h-4 text-[#1A5D3F]" />
              <span className="text-sm font-medium text-[#1A5D3F]">
                AI-Powered Commerce Platform
              </span>
            </motion.div>

            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="block">비즈니스의 미래를</span>
              <span className="block text-[#1A5D3F]">자동화하세요</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl sm:text-2xl text-[#6B6B6B] max-w-3xl mx-auto mb-12 leading-relaxed">
              Field Nine은 RTX 5090 로컬 AI와 완벽한 자동화로<br />
              재고, 주문, 수익을 실시간으로 관리하고 최적화합니다.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <motion.a
                href="/login"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-[#1A5D3F] text-white font-semibold rounded-lg shadow-lg hover:bg-[#15503A] transition-all flex items-center gap-2"
              >
                무료로 시작하기
                <ArrowRight className="w-5 h-5" />
              </motion.a>
              <motion.a
                href="/intro"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white border-2 border-[#171717] text-[#171717] font-semibold rounded-lg hover:bg-[#171717] hover:text-white transition-all"
              >
                더 알아보기
              </motion.a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                  className="text-center"
                >
                  <div className="text-3xl sm:text-4xl font-bold text-[#1A5D3F] mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-[#6B6B6B]">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Background Decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#1A5D3F]/5 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Why Field Nine Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              왜 Field Nine을 선택해야 할까요?
            </h2>
            <p className="text-xl text-[#6B6B6B] max-w-2xl mx-auto">
              수백만 개의 주문을 처리한 검증된 플랫폼으로,<br />
              당신의 비즈니스를 다음 단계로 끌어올립니다.
            </p>
          </motion.div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="flex items-start gap-3 p-6 bg-[#F9F9F7] rounded-xl border border-[#E5E5E0]"
              >
                <CheckCircle2 className="w-6 h-6 text-[#1A5D3F] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-lg text-[#171717]">
                    {benefit}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F9F9F7]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              강력한 기능으로<br />
              비즈니스를 자동화하세요
            </h2>
            <p className="text-xl text-[#6B6B6B] max-w-2xl mx-auto">
              복잡한 작업을 AI가 자동으로 처리하고,<br />
              당신은 비즈니스 성장에만 집중하세요.
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="group p-8 bg-white rounded-2xl border border-[#E5E5E0] hover:border-[#1A5D3F] hover:shadow-xl transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-[#1A5D3F]/10 rounded-lg group-hover:bg-[#1A5D3F] transition-colors">
                      <Icon className="w-6 h-6 text-[#1A5D3F] group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-xs font-semibold text-[#1A5D3F] bg-[#1A5D3F]/10 px-3 py-1 rounded-full">
                      {feature.stat}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-[#171717]">
                    {feature.title}
                  </h3>
                  <p className="text-[#6B6B6B] leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-8">
              신뢰할 수 있는 인프라
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="p-6">
                <Shield className="w-12 h-12 text-[#1A5D3F] mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">엔터프라이즈 보안</h3>
                <p className="text-[#6B6B6B]">
                  데이터 암호화, 자동 백업,<br />
                  RLS 정책으로 완벽한 보안
                </p>
              </div>
              <div className="p-6">
                <Zap className="w-12 h-12 text-[#1A5D3F] mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">99.9% 가동률</h3>
                <p className="text-[#6B6B6B]">
                  Vercel 글로벌 CDN,<br />
                  자동 스케일링으로 안정성 보장
                </p>
              </div>
              <div className="p-6">
                <TrendingUp className="w-12 h-12 text-[#1A5D3F] mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">무제한 확장</h3>
                <p className="text-[#6B6B6B]">
                  수백만 개의 주문도<br />
                  빠르고 안정적으로 처리
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#1A5D3F] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              지금 바로 시작하세요
            </h2>
            <p className="text-xl mb-8 text-white/90">
              무료로 시작하고, 비즈니스가 성장할수록<br />
              더 많은 기능을 활용하세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a
                href="/login"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white text-[#1A5D3F] font-semibold rounded-lg shadow-lg hover:bg-[#F9F9F7] transition-all flex items-center justify-center gap-2"
              >
                무료로 시작하기
                <ArrowRight className="w-5 h-5" />
              </motion.a>
              <motion.a
                href="/contact"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-all"
              >
                영업팀에 문의하기
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
