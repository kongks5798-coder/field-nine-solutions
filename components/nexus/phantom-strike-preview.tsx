'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 55: PHANTOM STRIKE - MARKETING BAIT PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Marketing preview page for anonymous users.
 * Shows blurred preview of real data with strong CTA to login.
 * Tesla Minimalism design.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA (Partially revealed to tease users)
// ═══════════════════════════════════════════════════════════════════════════════

const PHANTOM_DATA = {
  totalApy: 13.5,
  portfolioValue: '₩••,•••,•••',
  dailyEarnings: '₩••,•••',
  stakingRewards: '•,••• KAUS',
  tradingProfit: '+•.••%',
  sovereignCount: 1247,
  liveTradingVolume: '₩4.2B',
};

const FEATURE_HIGHLIGHTS = [
  {
    icon: '💎',
    title: 'AI 자산 관리',
    description: '실시간 APY 13.5%',
    blurred: false,
  },
  {
    icon: '⚡',
    title: 'V2G 에너지 거래',
    description: '테슬라 연동 수익',
    blurred: true,
  },
  {
    icon: '🔒',
    title: 'KAUS 스테이킹',
    description: '복리 수익률',
    blurred: true,
  },
  {
    icon: '🎯',
    title: 'AI 트레이딩',
    description: '알고리즘 매매',
    blurred: true,
  },
];

const TESTIMONIALS = [
  { sovereign: 'SOV-0042', profit: '+34.2%', period: '3개월' },
  { sovereign: 'SOV-0189', profit: '+28.7%', period: '2개월' },
  { sovereign: 'SOV-0523', profit: '+41.5%', period: '6개월' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function BlurredCard({
  children,
  isBlurred = true,
  className = '',
}: {
  children: React.ReactNode;
  isBlurred?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {children}
      {isBlurred && (
        <div className="absolute inset-0 backdrop-blur-md bg-white/30 dark:bg-black/30 flex items-center justify-center rounded-xl">
          <div className="text-center p-4">
            <span className="text-2xl mb-2 block">🔐</span>
            <span className="text-xs text-neutral-600 dark:text-neutral-400">
              로그인 필요
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function LiveIndicator() {
  return (
    <motion.div
      className="flex items-center gap-2"
      animate={{ opacity: [1, 0.5, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <span className="w-2 h-2 bg-emerald-500 rounded-full" />
      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
        LIVE
      </span>
    </motion.div>
  );
}

function StatCard({
  label,
  value,
  subValue,
  isBlurred = false,
  highlight = false,
}: {
  label: string;
  value: string;
  subValue?: string;
  isBlurred?: boolean;
  highlight?: boolean;
}) {
  return (
    <BlurredCard
      isBlurred={isBlurred}
      className={`bg-white dark:bg-neutral-900 rounded-xl p-4 border ${
        highlight
          ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10'
          : 'border-neutral-200 dark:border-neutral-800'
      }`}
    >
      <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
        {label}
      </div>
      <div
        className={`text-2xl font-bold ${
          highlight
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-neutral-900 dark:text-white'
        }`}
      >
        {value}
      </div>
      {subValue && (
        <div className="text-xs text-neutral-400 mt-1">{subValue}</div>
      )}
    </BlurredCard>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayValue((prev) => {
        const change = (Math.random() - 0.5) * 0.2;
        return Math.max(0, prev + change);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return <span>{displayValue.toFixed(1)}%</span>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function PhantomStrikePreview() {
  const [isHovered, setIsHovered] = useState(false);
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowCTA(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F9F7] dark:bg-[#0A0A0A] text-[#171717] dark:text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#F9F9F7]/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black tracking-tighter">NEXUS</span>
            <LiveIndicator />
          </div>
          <Link
            href="/ko/auth/login"
            className="px-4 py-2 bg-[#171717] dark:bg-white text-white dark:text-[#171717] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            로그인
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
              <span className="text-emerald-600 dark:text-emerald-400">
                <AnimatedNumber value={PHANTOM_DATA.totalApy} />
              </span>{' '}
              APY
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              AI 기반 자산 관리로 당신의 포트폴리오를 성장시키세요.
              <br />
              <span className="font-semibold text-neutral-900 dark:text-white">
                {PHANTOM_DATA.sovereignCount.toLocaleString()}명의 Sovereign
              </span>
              이 이미 참여하고 있습니다.
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <StatCard
              label="총 자산 가치"
              value={PHANTOM_DATA.portfolioValue}
              isBlurred={true}
            />
            <StatCard
              label="일일 수익"
              value={PHANTOM_DATA.dailyEarnings}
              isBlurred={true}
            />
            <StatCard
              label="스테이킹 보상"
              value={PHANTOM_DATA.stakingRewards}
              isBlurred={true}
            />
            <StatCard
              label="실시간 거래량"
              value={PHANTOM_DATA.liveTradingVolume}
              subValue="24H Volume"
              isBlurred={false}
              highlight={true}
            />
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {FEATURE_HIGHLIGHTS.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <BlurredCard
                  isBlurred={feature.blurred}
                  className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 h-full"
                >
                  <span className="text-3xl mb-3 block">{feature.icon}</span>
                  <h3 className="font-bold mb-1">{feature.title}</h3>
                  <p className="text-sm text-neutral-500">
                    {feature.description}
                  </p>
                </BlurredCard>
              </motion.div>
            ))}
          </div>

          {/* Live Chart Preview (Blurred) */}
          <BlurredCard
            isBlurred={true}
            className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 mb-12"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">실시간 포트폴리오 성과</h3>
              <LiveIndicator />
            </div>
            <div className="h-64 flex items-center justify-center">
              {/* Fake chart lines */}
              <svg
                className="w-full h-full"
                viewBox="0 0 400 200"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
                    id="chartGradient"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 150 Q 50 140, 100 120 T 200 100 T 300 60 T 400 40"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3"
                />
                <path
                  d="M0 150 Q 50 140, 100 120 T 200 100 T 300 60 T 400 40 L 400 200 L 0 200 Z"
                  fill="url(#chartGradient)"
                />
              </svg>
            </div>
            <div className="flex justify-between text-sm text-neutral-500 mt-4">
              <span>1개월 전</span>
              <span className="text-emerald-600 font-bold">+34.2%</span>
              <span>오늘</span>
            </div>
          </BlurredCard>

          {/* Social Proof */}
          <div className="text-center mb-12">
            <h3 className="text-sm text-neutral-500 mb-4">
              실제 Sovereign 수익률
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              {TESTIMONIALS.map((item, index) => (
                <motion.div
                  key={item.sovereign}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.2 }}
                  className="bg-white dark:bg-neutral-900 rounded-lg px-4 py-2 border border-neutral-200 dark:border-neutral-800"
                >
                  <span className="text-xs text-neutral-500">
                    {item.sovereign}
                  </span>
                  <span className="mx-2 text-emerald-600 font-bold">
                    {item.profit}
                  </span>
                  <span className="text-xs text-neutral-400">{item.period}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Floating CTA */}
      <AnimatePresence>
        {showCTA && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#F9F9F7] dark:from-[#0A0A0A] to-transparent pointer-events-none"
          >
            <div className="max-w-md mx-auto pointer-events-auto">
              <Link
                href="/ko/auth/login"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <motion.div
                  animate={{
                    scale: isHovered ? 1.02 : 1,
                    boxShadow: isHovered
                      ? '0 20px 40px rgba(16, 185, 129, 0.3)'
                      : '0 10px 30px rgba(16, 185, 129, 0.2)',
                  }}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-2xl p-6 text-center"
                >
                  <div className="text-sm opacity-80 mb-1">
                    지금 가입하고 확인하세요
                  </div>
                  <div className="text-xl font-bold mb-2">
                    로그인하고 13.5% 수익률을 확인하세요
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <span>👑</span>
                    <span>Sovereign #{PHANTOM_DATA.sovereignCount + 1} 되기</span>
                    <span className="ml-2">→</span>
                  </div>
                </motion.div>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-blue-500/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
