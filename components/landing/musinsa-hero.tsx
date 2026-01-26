'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 56: MUSINSA-GRADE HERO SECTION
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * High-end brand experience with:
 * - Premium visual assets
 * - Smooth scroll interactions
 * - Tesla Minimalism (#F9F9F7, #171717)
 * - Luxurious whitespace
 */

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════════
// BRAND COLLECTIONS (Fashion → Energy Investment)
// ═══════════════════════════════════════════════════════════════════════════════

interface Collection {
  id: string;
  name: string;
  tagline: string;
  description: string;
  energyBonus: string;
  sovereignBonus: number;
  imageUrl: string;
  videoUrl?: string;
  cta: string;
  href: string;
}

const COLLECTIONS: Collection[] = [
  {
    id: 'vrd-26ss',
    name: 'VRD 26SS',
    tagline: 'VERIFIED PREMIUM FASHION',
    description: '패션 구매가 에너지 자산으로 전환되는 새로운 쇼핑 경험',
    energyBonus: '+2.5% Energy Credit',
    sovereignBonus: 500,
    imageUrl: '/images/vrd-hero.jpg',
    cta: 'Shop Now',
    href: '/vrd',
  },
  {
    id: 'sovereign-collection',
    name: 'SOVEREIGN',
    tagline: 'EXCLUSIVE MEMBERSHIP',
    description: '제국의 시민이 되어 에너지 수익을 공유하세요',
    energyBonus: '13.5% Annual Yield',
    sovereignBonus: 1000,
    imageUrl: '/images/sovereign-hero.jpg',
    cta: 'Join Empire',
    href: '/sovereign',
  },
  {
    id: 'nexus-trading',
    name: 'NEXUS',
    tagline: 'AI-POWERED TRADING',
    description: 'AI가 관리하는 에너지 자산 포트폴리오',
    energyBonus: 'Real-time APY',
    sovereignBonus: 0,
    imageUrl: '/images/nexus-hero.jpg',
    cta: 'Start Trading',
    href: '/nexus',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// LIVE STATS
// ═══════════════════════════════════════════════════════════════════════════════

interface LiveStat {
  label: string;
  value: string;
  suffix?: string;
  change?: string;
  positive?: boolean;
}

function useLiveStats(): LiveStat[] {
  const [stats, setStats] = useState<LiveStat[]>([
    { label: 'Total Value Locked', value: '4.2', suffix: 'B KRW', change: '+12.5%', positive: true },
    { label: 'Active Sovereigns', value: '1,247', change: '+42', positive: true },
    { label: 'Energy Generated', value: '2.4', suffix: 'GWh', change: 'Today' },
    { label: 'Average APY', value: '13.5', suffix: '%', change: 'Yield' },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => prev.map(stat => {
        if (stat.label === 'Active Sovereigns') {
          const current = parseInt(stat.value.replace(',', ''));
          const newValue = current + Math.floor(Math.random() * 3);
          return { ...stat, value: newValue.toLocaleString() };
        }
        return stat;
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return stats;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function StatBadge({ stat }: { stat: LiveStat }) {
  return (
    <div className="text-center px-6 py-4 border-l border-neutral-200 dark:border-neutral-800 first:border-l-0">
      <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-1">
        {stat.label}
      </div>
      <div className="text-2xl md:text-3xl font-black text-[#171717] dark:text-white">
        {stat.value}
        {stat.suffix && <span className="text-lg ml-1">{stat.suffix}</span>}
      </div>
      {stat.change && (
        <div className={`text-xs mt-1 ${stat.positive ? 'text-emerald-600' : 'text-neutral-400'}`}>
          {stat.change}
        </div>
      )}
    </div>
  );
}

function CollectionCard({ collection, index }: { collection: Collection; index: number }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: index * 0.15 }}
      viewport={{ once: true, margin: '-100px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative"
    >
      <Link href={collection.href}>
        <div className="relative aspect-[3/4] md:aspect-[4/5] overflow-hidden bg-neutral-100 dark:bg-neutral-900 rounded-none md:rounded-2xl">
          {/* Background placeholder - In production, use actual images */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-900"
            style={{
              backgroundImage: `linear-gradient(135deg, ${
                collection.id === 'vrd-26ss' ? '#1a1a1a, #2d2d2d' :
                collection.id === 'sovereign-collection' ? '#0d1117, #161b22' :
                '#0a0a0a, #171717'
              })`,
            }}
          />

          {/* Hover overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-10">
            {/* Top: Tagline */}
            <div>
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-block text-[10px] md:text-xs tracking-[0.3em] text-white/60 uppercase"
              >
                {collection.tagline}
              </motion.span>
            </div>

            {/* Center: Energy Bonus Badge */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: isHovered ? 1 : 0.9, opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className="self-center text-center"
            >
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-6 py-4">
                <div className="text-emerald-400 text-lg font-bold">{collection.energyBonus}</div>
                {collection.sovereignBonus > 0 && (
                  <div className="text-white/60 text-xs mt-1">
                    +{collection.sovereignBonus} KAUS Bonus
                  </div>
                )}
              </div>
            </motion.div>

            {/* Bottom: Title & CTA */}
            <div>
              <h3 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">
                {collection.name}
              </h3>
              <p className="text-white/60 text-sm md:text-base max-w-xs mb-4">
                {collection.description}
              </p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: isHovered ? 1 : 0.7, y: isHovered ? 0 : 10 }}
                className="inline-flex items-center gap-2 text-white font-medium"
              >
                <span>{collection.cta}</span>
                <motion.span
                  animate={{ x: isHovered ? 5 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  →
                </motion.span>
              </motion.div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HERO COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function MusinsaHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, -50]);

  const stats = useLiveStats();

  return (
    <div ref={containerRef} className="relative bg-[#F9F9F7] dark:bg-[#0A0A0A]">
      {/* Hero Section */}
      <motion.section
        style={{ opacity, scale, y }}
        className="relative min-h-screen flex flex-col justify-center px-4 md:px-8 lg:px-16"
      >
        {/* Main Title */}
        <div className="max-w-7xl mx-auto w-full pt-24 pb-12 md:pt-32 md:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-[#171717] dark:text-white leading-[0.9]">
              FASHION
              <br />
              <span className="text-emerald-600 dark:text-emerald-400">BECOMES</span>
              <br />
              ENERGY
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-xl mb-12"
          >
            패션 구매가 에너지 자산 투자로 전환되는 Field Nine.
            <br />
            당신의 스타일이 곧 수익이 됩니다.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-wrap gap-4"
          >
            <Link
              href="/vrd"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#171717] dark:bg-white text-white dark:text-[#171717] font-bold rounded-full hover:opacity-90 transition-opacity"
            >
              Shop VRD Collection
            </Link>
            <Link
              href="/nexus"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-[#171717] dark:border-white text-[#171717] dark:text-white font-bold rounded-full hover:bg-[#171717] hover:text-white dark:hover:bg-white dark:hover:text-[#171717] transition-colors"
            >
              Explore Nexus
            </Link>
          </motion.div>
        </div>

        {/* Live Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="max-w-7xl mx-auto w-full"
        >
          <div className="flex flex-wrap justify-center md:justify-between bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800">
            {stats.map((stat, index) => (
              <StatBadge key={index} stat={stat} />
            ))}
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-neutral-300 dark:border-neutral-700 flex items-start justify-center p-2"
          >
            <motion.div className="w-1.5 h-3 bg-neutral-400 dark:bg-neutral-600 rounded-full" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Collections Grid */}
      <section className="py-16 md:py-24 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 md:mb-20"
          >
            <h2 className="text-sm md:text-base tracking-[0.3em] text-neutral-500 dark:text-neutral-400 uppercase mb-4">
              Featured Collections
            </h2>
            <p className="text-3xl md:text-5xl font-black text-[#171717] dark:text-white tracking-tight">
              쇼핑이 투자가 되는 순간
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {COLLECTIONS.map((collection, index) => (
              <CollectionCard key={collection.id} collection={collection} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 md:py-24 px-4 md:px-8 lg:px-16 bg-[#171717] dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
              How It Works
            </h2>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
              패션 구매가 에너지 자산으로 전환되는 원리
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                step: '01',
                title: 'Shop Premium',
                description: 'VRD 컬렉션에서 검증된 프리미엄 제품을 구매하세요',
                icon: '🛍️',
              },
              {
                step: '02',
                title: 'Earn KAUS',
                description: '구매 금액의 2-5%가 KAUS 에너지 토큰으로 전환됩니다',
                icon: '⚡',
              },
              {
                step: '03',
                title: 'Grow Wealth',
                description: 'KAUS를 스테이킹하여 연 13.5% 수익을 받으세요',
                icon: '📈',
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-5xl mb-6">{item.icon}</div>
                <div className="text-emerald-400 text-sm font-bold tracking-widest mb-2">
                  STEP {item.step}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-neutral-400">{item.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <Link
              href="/sovereign"
              className="inline-flex items-center justify-center px-10 py-5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-lg rounded-full hover:opacity-90 transition-opacity"
            >
              Become a Sovereign →
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export { MusinsaHero };
