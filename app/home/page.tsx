'use client';

import { motion } from 'framer-motion';
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
  Sparkles,
  Infinity,
  Lock,
  Globe,
  Rocket
} from 'lucide-react';

/**
 * Field Nine: Premium Tesla-Style Landing Page
 * 
 * 미래지향적이고 신뢰감 있는 프리미엄 소개 페이지
 * - 강력한 비주얼 임팩트
 * - 기능 중심 설명
 * - 데이터 기반 신뢰성
 * - Tesla 스타일 미니멀 디자인
 */
export default function PremiumLandingPage() {
  const features = [
    {
      icon: Brain,
      title: 'RTX 5090 로컬 AI 엔진',
      description: '클라우드 API 없이 로컬에서 실행되는 강력한 AI로 재고 예측, 가격 최적화, 트렌드 분석을 실시간으로 수행합니다.',
      stat: '98% 정확도',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Package,
      title: '완벽한 재고 자동화',
      description: '주문 생성 시 즉시 재고 차감, 취소 시 자동 복구. PostgreSQL 트리거 기반으로 실수 없는 완벽한 재고 관리.',
      stat: '0% 오류율',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      icon: ShoppingCart,
      title: '멀티채널 주문 통합',
      description: '쿠팡, 네이버, 11번가, 지마켓 등 모든 쇼핑몰의 주문을 한 곳에서 통합 관리하고 자동으로 처리합니다.',
      stat: '무제한 채널',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: BarChart3,
      title: '실시간 분석 인사이트',
      description: '매출, 주문, 재고를 실시간으로 분석하고 AI 기반 인사이트를 제공하여 데이터 기반 의사결정을 지원합니다.',
      stat: '실시간 업데이트',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Shield,
      title: '엔터프라이즈급 보안',
      description: 'Supabase 기반 암호화, RLS 정책, 자동 백업, 감사 로그로 데이터를 완벽하게 보호하고 규정을 준수합니다.',
      stat: '99.9% 가동률',
      color: 'from-indigo-500 to-blue-500'
    },
    {
      icon: TrendingUp,
      title: '수익 최적화 엔진',
      description: '플랫폼별 수수료 자동 계산, 마진 분석, AI 기반 가격 최적화로 수익을 극대화하고 비용을 최소화합니다.',
      stat: '평균 23% 수익 증가',
      color: 'from-green-500 to-emerald-500'
    }
  ];

  const stats = [
    { value: '10,000+', label: '처리 가능 주문/일', icon: Infinity },
    { value: '0.1초', label: '평균 응답 시간', icon: Zap },
    { value: '99.9%', label: '서비스 가동률', icon: Shield },
    { value: '24/7', label: '자동화 운영', icon: Globe }
  ];

  const whyChoose = [
    {
      title: '로컬 AI로 비용 절감',
      description: '클라우드 API 비용 없이 RTX 5090에서 직접 실행되는 AI로 월 수백만 원을 절감합니다.',
      highlight: '월 500만원 절감'
    },
    {
      title: '완벽한 자동화',
      description: '재고 차감, 주문 상태 전환, 수수료 계산까지 모든 것이 자동으로 처리되어 실수를 방지합니다.',
      highlight: '0% 오류율'
    },
    {
      title: '실시간 통합 관리',
      description: '여러 쇼핑몰의 주문을 한 곳에서 실시간으로 통합 관리하고 일괄 처리합니다.',
      highlight: '무제한 채널'
    },
    {
      title: '데이터 기반 의사결정',
      description: 'AI 기반 분석과 인사이트로 언제, 무엇을, 얼마나 판매할지 최적의 결정을 내립니다.',
      highlight: '23% 수익 증가'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-[#171717]">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Premium Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#1A5D3F] to-[#2DD4BF] rounded-full mb-8 shadow-lg"
            >
              <Sparkles className="w-5 h-5 text-white" />
              <span className="text-sm font-semibold text-white">
                AI-Powered Enterprise Commerce Platform
              </span>
            </motion.div>

            {/* Main Headline */}
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
              <span className="block">비즈니스의 미래를</span>
              <span className="block bg-gradient-to-r from-[#1A5D3F] to-[#2DD4BF] bg-clip-text text-transparent">
                자동화하세요
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-2xl sm:text-3xl text-[#6B6B6B] max-w-4xl mx-auto mb-12 leading-relaxed font-light">
              Field Nine은 RTX 5090 로컬 AI와 완벽한 자동화로<br />
              <span className="font-semibold text-[#171717]">재고, 주문, 수익을 실시간으로 관리하고 최적화</span>합니다.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
              <motion.a
                href="/login"
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(26, 93, 63, 0.3)' }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 bg-gradient-to-r from-[#1A5D3F] to-[#2DD4BF] text-white font-bold text-lg rounded-xl shadow-2xl hover:shadow-[#1A5D3F]/30 transition-all flex items-center gap-3"
              >
                무료로 시작하기
                <ArrowRight className="w-6 h-6" />
              </motion.a>
              <motion.a
                href="/intro"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 bg-white border-2 border-[#171717] text-[#171717] font-bold text-lg rounded-xl hover:bg-[#171717] hover:text-white transition-all shadow-lg"
              >
                더 알아보기
              </motion.a>
            </div>

            {/* Premium Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.6 }}
                    className="p-6 bg-white rounded-2xl border border-[#E5E5E0] shadow-sm hover:shadow-lg transition-all"
                  >
                    <Icon className="w-8 h-8 text-[#1A5D3F] mx-auto mb-3" />
                    <div className="text-3xl sm:text-4xl font-bold text-[#1A5D3F] mb-2">
                      {stat.value}
                    </div>
                    <div className="text-sm text-[#6B6B6B] font-medium">
                      {stat.label}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Animated Background */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-gradient-to-r from-[#1A5D3F]/10 to-[#2DD4BF]/10 rounded-full blur-3xl"
          />
        </div>
      </section>

      {/* Why Field Nine Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl sm:text-6xl font-bold mb-6">
              왜 Field Nine을<br />
              <span className="text-[#1A5D3F]">선택해야 할까요?</span>
            </h2>
            <p className="text-2xl text-[#6B6B6B] max-w-3xl mx-auto leading-relaxed">
              수백만 개의 주문을 처리한 검증된 플랫폼으로,<br />
              당신의 비즈니스를 <span className="font-semibold text-[#171717]">다음 단계로 끌어올립니다</span>.
            </p>
          </motion.div>

          {/* Why Choose Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {whyChoose.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                className="group p-8 bg-gradient-to-br from-[#F9F9F7] to-white rounded-2xl border-2 border-[#E5E5E0] hover:border-[#1A5D3F] transition-all hover:shadow-xl"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-2xl font-bold text-[#171717] group-hover:text-[#1A5D3F] transition-colors">
                    {item.title}
                  </h3>
                  <span className="text-xs font-bold text-white bg-gradient-to-r from-[#1A5D3F] to-[#2DD4BF] px-4 py-1.5 rounded-full">
                    {item.highlight}
                  </span>
                </div>
                <p className="text-lg text-[#6B6B6B] leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#F9F9F7]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl sm:text-6xl font-bold mb-6">
              강력한 기능으로<br />
              <span className="text-[#1A5D3F]">비즈니스를 자동화하세요</span>
            </h2>
            <p className="text-2xl text-[#6B6B6B] max-w-3xl mx-auto leading-relaxed">
              복잡한 작업을 AI가 자동으로 처리하고,<br />
              당신은 <span className="font-semibold text-[#171717]">비즈니스 성장에만 집중</span>하세요.
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className="group relative p-8 bg-white rounded-2xl border-2 border-[#E5E5E0] hover:border-[#1A5D3F] transition-all hover:shadow-2xl overflow-hidden"
                >
                  {/* Gradient Background on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                  
                  <div className="relative">
                    <div className="flex items-start justify-between mb-6">
                      <div className={`p-4 bg-gradient-to-br ${feature.color} rounded-xl group-hover:scale-110 transition-transform`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <span className="text-xs font-bold text-[#1A5D3F] bg-[#1A5D3F]/10 px-3 py-1.5 rounded-full">
                        {feature.stat}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-[#171717] group-hover:text-[#1A5D3F] transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-[#6B6B6B] leading-relaxed text-lg">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust & Security Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl sm:text-6xl font-bold mb-6">
              <span className="text-[#1A5D3F]">신뢰할 수 있는</span><br />
              엔터프라이즈 인프라
            </h2>
            <p className="text-2xl text-[#6B6B6B] max-w-3xl mx-auto">
              수백만 개의 주문을 안전하게 처리하는<br />
              검증된 플랫폼입니다.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-center p-8"
            >
              <div className="inline-flex p-4 bg-[#1A5D3F]/10 rounded-2xl mb-6">
                <Lock className="w-12 h-12 text-[#1A5D3F]" />
              </div>
              <h3 className="text-2xl font-bold mb-4">엔터프라이즈 보안</h3>
              <p className="text-lg text-[#6B6B6B] leading-relaxed">
                데이터 암호화, 자동 백업,<br />
                RLS 정책으로 완벽한 보안
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-center p-8"
            >
              <div className="inline-flex p-4 bg-[#1A5D3F]/10 rounded-2xl mb-6">
                <Zap className="w-12 h-12 text-[#1A5D3F]" />
              </div>
              <h3 className="text-2xl font-bold mb-4">99.9% 가동률</h3>
              <p className="text-lg text-[#6B6B6B] leading-relaxed">
                Vercel 글로벌 CDN,<br />
                자동 스케일링으로 안정성 보장
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-center p-8"
            >
              <div className="inline-flex p-4 bg-[#1A5D3F]/10 rounded-2xl mb-6">
                <Rocket className="w-12 h-12 text-[#1A5D3F]" />
              </div>
              <h3 className="text-2xl font-bold mb-4">무제한 확장</h3>
              <p className="text-lg text-[#6B6B6B] leading-relaxed">
                수백만 개의 주문도<br />
                빠르고 안정적으로 처리
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#1A5D3F] to-[#2DD4BF] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="inline-flex p-4 bg-white/20 rounded-full mb-8"
            >
              <Rocket className="w-12 h-12 text-white" />
            </motion.div>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8">
              지금 바로 시작하세요
            </h2>
            <p className="text-2xl sm:text-3xl mb-12 text-white/90 leading-relaxed">
              무료로 시작하고, 비즈니스가 성장할수록<br />
              더 많은 기능을 활용하세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a
                href="/login"
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)' }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 bg-white text-[#1A5D3F] font-bold text-lg rounded-xl shadow-2xl hover:bg-[#F9F9F7] transition-all flex items-center justify-center gap-3"
              >
                무료로 시작하기
                <ArrowRight className="w-6 h-6" />
              </motion.a>
              <motion.a
                href="/contact"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 bg-transparent border-2 border-white text-white font-bold text-lg rounded-xl hover:bg-white/10 transition-all"
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
