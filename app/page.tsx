'use client';

import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useMemo } from 'react';
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
  X,
  Lock,
  Globe,
  Cpu,
  Activity
} from 'lucide-react';

export const dynamic = 'force-dynamic';

/**
 * Field Nine: Tesla 2026 Edition
 * 
 * 2026 트렌드:
 * - AI-driven UI
 * - Neo-minimalism
 * - Brutalism elements
 * - Organic flow animations
 * - Saturation revival (cyan/blue accents)
 */
export default function LandingPage2026() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [lang, setLang] = useState<'ko' | 'en'>('ko');
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  // AI Personalization: IP-based language detection
  useEffect(() => {
    // Detect language from IP/timezone (simplified - in production use proper geolocation)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone.includes('Seoul') || timezone.includes('Asia')) {
      setLang('ko');
    } else {
      setLang('en');
    }
  }, []);

  // Background particles effect
  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1
    }));
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  // Features with overlapping cards
  const features = [
    {
      icon: Server,
      title: lang === 'ko' ? '비용 최적화' : 'Cost Optimization',
      subtitle: lang === 'ko' ? 'RTX 5090으로 98% 절감' : '98% savings with RTX',
      description: lang === 'ko' 
        ? '로컬 AI 서버로 클라우드 비용을 98% 절감하고, 0% 다운타임을 보장합니다.'
        : 'Reduce cloud costs by 98% with local AI servers and guarantee 0% downtime.',
      bullets: [
        lang === 'ko' ? 'RTX 5090 로컬 AI' : 'RTX 5090 Local AI',
        lang === 'ko' ? '자동 스케일링' : 'Auto Scaling',
        lang === 'ko' ? '실시간 모니터링' : 'Real-time Monitoring',
        lang === 'ko' ? '비용 분석 대시보드' : 'Cost Analytics Dashboard'
      ],
      color: 'from-cyan-500 to-blue-600',
      stat: '98%'
    },
    {
      icon: Shield,
      title: lang === 'ko' ? '보안' : 'Security',
      subtitle: lang === 'ko' ? 'End-to-end 암호화' : 'End-to-end encryption',
      description: lang === 'ko'
        ? '엔터프라이즈급 보안으로 데이터를 완벽하게 보호합니다. RLS 정책과 자동 백업으로 99.9% 가동률을 보장합니다.'
        : 'Enterprise-grade security protects your data perfectly. RLS policies and automatic backups guarantee 99.9% uptime.',
      bullets: [
        lang === 'ko' ? 'End-to-end 암호화' : 'End-to-end Encryption',
        lang === 'ko' ? 'RLS 정책' : 'RLS Policies',
        lang === 'ko' ? '자동 백업' : 'Auto Backup',
        lang === 'ko' ? '99.9% 가동률' : '99.9% Uptime'
      ],
      color: 'from-blue-500 to-cyan-600',
      stat: '99.9%'
    },
    {
      icon: Brain,
      title: lang === 'ko' ? 'AI 자동화' : 'AI Automation',
      subtitle: lang === 'ko' ? '완전 자동화 시스템' : 'Full Automation System',
      description: lang === 'ko'
        ? '재고 예측, 가격 최적화, 주문 처리까지 모든 것을 AI가 자동으로 처리합니다.'
        : 'AI automatically handles everything from inventory forecasting to price optimization and order processing.',
      bullets: [
        lang === 'ko' ? '재고 예측' : 'Inventory Forecasting',
        lang === 'ko' ? '가격 최적화' : 'Price Optimization',
        lang === 'ko' ? '자동 주문 처리' : 'Auto Order Processing',
        lang === 'ko' ? '트렌드 분석' : 'Trend Analysis'
      ],
      color: 'from-cyan-400 to-blue-500',
      stat: '100%'
    }
  ];

  // Metrics for proof section
  const metrics = [
    { label: lang === 'ko' ? '일일 처리 주문' : 'Daily Orders', value: 10000, suffix: '+', color: 'cyan' },
    { label: lang === 'ko' ? '비용 절감' : 'Cost Savings', value: 98, suffix: '%', color: 'blue' },
    { label: lang === 'ko' ? '가동률' : 'Uptime', value: 99.9, suffix: '%', color: 'cyan' },
    { label: lang === 'ko' ? '응답 시간' : 'Response Time', value: 0.1, suffix: 's', color: 'blue' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#0F0F0F] text-[#F5F5F0] antialiased overflow-x-hidden">
      {/* Navigation - Brutalism style */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-xl border-b-2 border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">Field Nine</span>
            </motion.div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium hover:text-cyan-400 transition-colors">
                {lang === 'ko' ? '기능' : 'Features'}
              </a>
              <a href="#proof" className="text-sm font-medium hover:text-cyan-400 transition-colors">
                {lang === 'ko' ? '증명' : 'Proof'}
              </a>
              <a href="#faq" className="text-sm font-medium hover:text-cyan-400 transition-colors">FAQ</a>
            </div>
            <div className="flex items-center gap-4">
              <a href="/login" className="text-sm font-medium hover:text-cyan-400 transition-colors">
                {lang === 'ko' ? '로그인' : 'Login'}
              </a>
              <motion.a
                href="/login"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold rounded-lg shadow-lg hover:shadow-cyan-500/50 transition-all"
              >
                {lang === 'ko' ? '시작하기' : 'Get Started'}
              </motion.a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Futuristic Cityscape */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full bg-cyan-500/20"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Futuristic Cityscape Visual (Gradient-based) */}
        <motion.div
          style={{ opacity, scale, y }}
          className="absolute inset-0 -z-10"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/20 via-blue-900/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-cyan-500/10 via-transparent to-transparent" />
          
          {/* Geometric shapes simulating cityscape */}
          <div className="absolute bottom-0 left-0 right-0 h-1/3 flex items-end justify-center gap-4">
            {Array.from({ length: 15 }).map((_, i) => (
              <motion.div
                key={i}
                className="bg-gradient-to-t from-cyan-500/30 to-blue-600/20 rounded-t-lg"
                style={{
                  width: `${20 + Math.random() * 40}px`,
                  height: `${100 + Math.random() * 200}px`,
                }}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              />
            ))}
          </div>
        </motion.div>

        {/* Hero Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-7xl mx-auto px-6 lg:px-8 py-32 text-center relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full mb-8"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-400">
              {lang === 'ko' ? 'AI 기반 커머스 플랫폼' : 'AI-Powered Commerce Platform'}
            </span>
          </motion.div>

          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-light leading-tight mb-8">
            {lang === 'ko' ? (
              <>
                당신의 비즈니스를<br />
                <span className="font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent animate-gradient">
                  AI로 혁신
                </span>
              </>
            ) : (
              <>
                Revolutionize Your Business<br />
                <span className="font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent animate-gradient">
                  with AI
                </span>
              </>
            )}
          </h1>

          <p className="text-xl sm:text-2xl text-[#F5F5F0]/70 max-w-3xl mx-auto mb-12 leading-relaxed">
            {lang === 'ko' 
              ? 'RTX 5090 로컬 AI와 완벽한 자동화로 재고, 주문, 수익을 실시간으로 관리하고 최적화합니다.'
              : 'Manage and optimize inventory, orders, and revenue in real-time with RTX 5090 local AI and perfect automation.'}
          </p>

          <motion.a
            href="#demo"
            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(6, 182, 212, 0.5)' }}
            whileTap={{ scale: 0.95, y: 2 }}
            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg rounded-xl shadow-2xl hover:shadow-cyan-500/50 transition-all"
          >
            {lang === 'ko' ? '데모 예약' : 'Schedule Demo'}
            <ArrowRight className="w-6 h-6" />
          </motion.a>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 border-cyan-500/50 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-3 bg-cyan-500 rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section - Overlapping Cards */}
      <section id="features" className="py-32 px-6 lg:px-8 bg-[#0A0A0A] relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl sm:text-6xl font-light mb-4">
              {lang === 'ko' ? '강력한 기능' : 'Powerful Features'}
            </h2>
            <p className="text-xl text-[#F5F5F0]/70 max-w-2xl mx-auto">
              {lang === 'ko' ? '모든 기능을 커버합니다' : 'Covering all features'}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50, rotateY: -15 }}
                  whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2, duration: 0.6 }}
                  whileHover={{ y: -10, scale: 1.02, zIndex: 10 }}
                  className="group relative p-8 bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] rounded-2xl border-2 border-cyan-500/20 hover:border-cyan-500/50 transition-all cursor-pointer overflow-hidden"
                  style={{
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Hover Reveal Overlay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-2xl"
                  />

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className={`p-4 bg-gradient-to-br ${feature.color} rounded-xl shadow-lg`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                        {feature.stat}
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold mb-2 text-[#F5F5F0]">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-cyan-400/80 mb-4 font-medium">
                      {feature.subtitle}
                    </p>
                    <p className="text-[#F5F5F0]/70 mb-6 leading-relaxed">
                      {feature.description}
                    </p>

                    <motion.ul
                      initial={{ opacity: 0, height: 0 }}
                      whileHover={{ opacity: 1, height: 'auto' }}
                      className="space-y-2 overflow-hidden"
                    >
                      {feature.bullets.map((bullet, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          whileHover={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-3 text-sm text-[#F5F5F0]/80"
                        >
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                          <span>{bullet}</span>
                        </motion.li>
                      ))}
                    </motion.ul>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Proof Section - Metrics Sliders */}
      <section id="proof" className="py-32 px-6 lg:px-8 bg-gradient-to-b from-[#0A0A0A] to-[#1A1A1A]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl sm:text-6xl font-light mb-4">
              {lang === 'ko' ? '검증된 성과' : 'Proven Results'}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {metrics.map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative p-8 bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] rounded-2xl border-2 border-cyan-500/20"
              >
                <div className="text-sm text-cyan-400/80 mb-4 font-medium">
                  {metric.label}
                </div>
                <div className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-4">
                  {metric.value}
                  <span className="text-2xl">{metric.suffix}</span>
                </div>
                
                {/* Animated Slider */}
                <div className="h-2 bg-[#0F0F0F] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '100%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, delay: index * 0.2 }}
                    className={`h-full bg-gradient-to-r ${
                      metric.color === 'cyan' 
                        ? 'from-cyan-500 to-cyan-400' 
                        : 'from-blue-500 to-blue-400'
                    } rounded-full`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 lg:px-8 bg-[#0A0A0A]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl sm:text-6xl font-light mb-8">
              {lang === 'ko' ? '지금 시작하세요' : 'Get Started Now'}
            </h2>
            <p className="text-xl text-[#F5F5F0]/70 mb-12">
              {lang === 'ko'
                ? '무료로 시작하고, 비즈니스가 성장할수록 더 많은 기능을 활용하세요.'
                : 'Start for free and unlock more features as your business grows.'}
            </p>
            <motion.a
              href="/login"
              whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(6, 182, 212, 0.6)' }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg rounded-xl shadow-2xl hover:shadow-cyan-500/50 transition-all"
            >
              {lang === 'ko' ? '무료로 시작하기' : 'Start Free'}
              <ArrowRight className="w-6 h-6" />
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 lg:px-8 bg-[#0A0A0A] border-t-2 border-cyan-500/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">Field Nine</span>
              </div>
              <p className="text-sm text-[#F5F5F0]/70">
                {lang === 'ko' ? 'AI로 비즈니스를 혁신하세요' : 'Revolutionize your business with AI'}
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-cyan-400">Product</h4>
              <ul className="space-y-2 text-sm text-[#F5F5F0]/70">
                <li><a href="#features" className="hover:text-cyan-400 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-cyan-400 transition-colors">Pricing</a></li>
                <li><a href="#faq" className="hover:text-cyan-400 transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-cyan-400">Company</h4>
              <ul className="space-y-2 text-sm text-[#F5F5F0]/70">
                <li><a href="/about" className="hover:text-cyan-400 transition-colors">About</a></li>
                <li><a href="/contact" className="hover:text-cyan-400 transition-colors">Contact</a></li>
                <li><a href="/blog" className="hover:text-cyan-400 transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-cyan-400">Support</h4>
              <ul className="space-y-2 text-sm text-[#F5F5F0]/70">
                <li><a href="/docs" className="hover:text-cyan-400 transition-colors">Docs</a></li>
                <li><a href="/support" className="hover:text-cyan-400 transition-colors">Support</a></li>
                <li><a href="/status" className="hover:text-cyan-400 transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-cyan-500/20 pt-8 text-center text-sm text-[#F5F5F0]/50">
            <p>&copy; 2026 Field Nine. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* AI Chat Assistant */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring" }}
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 transition-transform"
        aria-label={lang === 'ko' ? 'AI 챗봇 열기' : 'Open AI Chat'}
      >
        <MessageSquare className="w-6 h-6" />
      </motion.button>

      {/* Chat Window */}
      {chatOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="fixed bottom-24 right-8 w-96 h-[500px] bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] rounded-2xl shadow-2xl border-2 border-cyan-500/30 z-50 flex flex-col"
        >
          <div className="p-4 border-b-2 border-cyan-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-cyan-400">
                {lang === 'ko' ? 'AI 어시스턴트' : 'AI Assistant'}
              </span>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="p-1 hover:bg-cyan-500/20 rounded-lg transition-colors"
              aria-label={lang === 'ko' ? '닫기' : 'Close'}
            >
              <X className="w-5 h-5 text-[#F5F5F0]" />
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div className="bg-[#0A0A0A] rounded-lg p-3 text-sm text-[#F5F5F0] border border-cyan-500/20">
                  {lang === 'ko' 
                    ? '안녕하세요! Field Nine AI 어시스턴트입니다. 무엇을 도와드릴까요?'
                    : 'Hello! I\'m Field Nine AI Assistant. How can I help you?'}
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 border-t-2 border-cyan-500/20">
            <input
              type="text"
              placeholder={lang === 'ko' ? '메시지를 입력하세요...' : 'Type a message...'}
              className="w-full px-4 py-2 bg-[#0A0A0A] border border-cyan-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-[#F5F5F0] placeholder:text-[#F5F5F0]/50"
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
