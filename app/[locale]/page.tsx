'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 64: MUSINSA-GRADE INTERFACE OVERWRITE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 무신사 하이엔드 브랜드관 수준의 시각적 완성도
 * - 100vh Full-Height Hero
 * - VRD 26SS Interactive Product Showcase
 * - Tesla Minimalism: #F9F9F7 / #171717
 * - 2.5x Expanded Spacing
 */

import { useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useLocale } from 'next-intl';

// ═══════════════════════════════════════════════════════════════════════════════
// VRD 26SS COLLECTION DATA
// ═══════════════════════════════════════════════════════════════════════════════

interface VRDProduct {
  id: string;
  name: string;
  nameKo: string;
  category: string;
  price: number;
  apyBonus: number;
  imageGradient: string;
  badge?: string;
}

const VRD_COLLECTION: VRDProduct[] = [
  {
    id: 'vrd-oversized-blazer',
    name: 'SOVEREIGN OVERSIZED BLAZER',
    nameKo: '소버린 오버사이즈 블레이저',
    category: 'OUTERWEAR',
    price: 890000,
    apyBonus: 13.5,
    imageGradient: 'from-neutral-900 via-neutral-800 to-neutral-700',
    badge: 'HERO PIECE',
  },
  {
    id: 'vrd-silk-shirt',
    name: 'ENERGY SILK SHIRT',
    nameKo: '에너지 실크 셔츠',
    category: 'TOPS',
    price: 450000,
    apyBonus: 13.5,
    imageGradient: 'from-slate-900 via-slate-800 to-slate-600',
  },
  {
    id: 'vrd-wide-trousers',
    name: 'NEXUS WIDE TROUSERS',
    nameKo: '넥서스 와이드 트라우저',
    category: 'BOTTOMS',
    price: 380000,
    apyBonus: 13.5,
    imageGradient: 'from-zinc-900 via-zinc-800 to-zinc-700',
  },
  {
    id: 'vrd-leather-bag',
    name: 'FIELD NINE LEATHER BAG',
    nameKo: '필드나인 레더 백',
    category: 'ACCESSORIES',
    price: 1250000,
    apyBonus: 13.5,
    imageGradient: 'from-stone-900 via-stone-800 to-stone-600',
    badge: 'LIMITED',
  },
  {
    id: 'vrd-cashmere-coat',
    name: 'SOVEREIGN CASHMERE COAT',
    nameKo: '소버린 캐시미어 코트',
    category: 'OUTERWEAR',
    price: 2100000,
    apyBonus: 13.5,
    imageGradient: 'from-gray-900 via-gray-800 to-gray-700',
    badge: 'FLAGSHIP',
  },
  {
    id: 'vrd-minimal-sneakers',
    name: 'MINIMAL LEATHER SNEAKERS',
    nameKo: '미니멀 레더 스니커즈',
    category: 'FOOTWEAR',
    price: 520000,
    apyBonus: 13.5,
    imageGradient: 'from-neutral-800 via-neutral-700 to-neutral-600',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// HERO SECTION (100vh)
// ═══════════════════════════════════════════════════════════════════════════════

function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.8], [1, 1.1]);
  const textY = useTransform(scrollYProgress, [0, 0.5], [0, -100]);

  return (
    <motion.section
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden bg-[#171717]"
    >
      {/* Background with parallax */}
      <motion.div
        style={{ scale }}
        className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#171717] to-[#1a1a1a]"
      >
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px',
          }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#171717] via-transparent to-transparent" />
      </motion.div>

      {/* Main Content */}
      <motion.div
        style={{ opacity, y: textY }}
        className="relative z-10 h-full flex flex-col justify-center items-center px-8"
      >
        {/* Top Badge */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mb-16"
        >
          <span className="text-[10px] tracking-[0.5em] text-white/40 uppercase">
            26SS Collection
          </span>
        </motion.div>

        {/* Main Title - Dramatic Tracking */}
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.4 }}
          className="text-center"
        >
          <span
            className="block text-6xl md:text-8xl lg:text-[10rem] xl:text-[12rem] font-black text-white leading-none"
            style={{ letterSpacing: '0.15em' }}
          >
            FIELD NINE
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-8 md:mt-12"
        >
          <span
            className="text-lg md:text-2xl lg:text-3xl text-white/60 font-light"
            style={{ letterSpacing: '0.4em' }}
          >
            THE SOVEREIGN ERA
          </span>
        </motion.div>

        {/* APY Badge - Elegant Gold Accent */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-20 md:mt-24"
        >
          <div className="flex items-center gap-3 px-6 py-3 border border-amber-500/30 rounded-full bg-amber-500/5 backdrop-blur-sm">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-xs tracking-[0.2em] text-amber-500/90 uppercase">
              Earn 13.5% APY on Every Purchase
            </span>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-16 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-4"
          >
            <span className="text-[10px] tracking-[0.3em] text-white/30 uppercase">
              Scroll
            </span>
            <div className="w-px h-12 bg-gradient-to-b from-white/30 to-transparent" />
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT CARD (Interactive)
// ═══════════════════════════════════════════════════════════════════════════════

function ProductCard({ product, index }: { product: VRDProduct; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const locale = useLocale();

  return (
    <motion.div
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      viewport={{ once: true, margin: '-50px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative"
    >
      <Link href={`/${locale}/vrd/${product.id}`}>
        <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
          {/* Product Image Area */}
          <motion.div
            animate={{ scale: isHovered ? 1.08 : 1 }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className={`absolute inset-0 bg-gradient-to-br ${product.imageGradient}`}
          >
            {/* Placeholder Pattern */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white/10 text-[200px] font-black">
                {product.category.charAt(0)}
              </div>
            </div>
          </motion.div>

          {/* Badge - Top Left */}
          {product.badge && (
            <div className="absolute top-6 left-6 z-10">
              <span className="text-[10px] tracking-[0.2em] text-white/80 uppercase px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">
                {product.badge}
              </span>
            </div>
          )}

          {/* APY Badge - Bottom Right (Elegant Gold/Black) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: isHovered ? 1 : 0.7, x: isHovered ? 0 : 10 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-6 right-6 z-10"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#171717]/90 backdrop-blur-sm rounded-full border border-amber-500/20">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
              <span className="text-[10px] tracking-wider text-amber-500/90 font-medium">
                Earn {product.apyBonus}% APY
              </span>
            </div>
          </motion.div>

          {/* Hover Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/20"
          />

          {/* Quick View Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center z-10"
          >
            <span className="px-8 py-3 bg-white text-[#171717] text-sm font-medium tracking-wider uppercase">
              View Details
            </span>
          </motion.div>
        </div>

        {/* Product Info - Below Image */}
        <div className="pt-8 pb-4">
          <div className="text-[10px] tracking-[0.2em] text-[#171717]/40 uppercase mb-2">
            {product.category}
          </div>
          <h3 className="text-base font-medium text-[#171717] tracking-tight mb-1">
            {product.name}
          </h3>
          <p className="text-sm text-[#171717]/50 mb-4">
            {product.nameKo}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-[#171717]">
              ₩{product.price.toLocaleString()}
            </span>
            <motion.span
              animate={{ x: isHovered ? 5 : 0 }}
              className="text-sm text-[#171717]/40 group-hover:text-[#171717] transition-colors"
            >
              →
            </motion.span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT SHOWCASE SECTION
// ═══════════════════════════════════════════════════════════════════════════════

function ProductShowcase() {
  const locale = useLocale();

  return (
    <section className="py-40 md:py-56 lg:py-64 px-8 md:px-16 lg:px-24 bg-[#F9F9F7]">
      <div className="max-w-[1800px] mx-auto">
        {/* Section Header - Luxurious Spacing */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-24 md:mb-32 lg:mb-40"
        >
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div>
              <span className="text-[10px] tracking-[0.5em] text-[#171717]/40 uppercase block mb-6">
                VRD 26SS Collection
              </span>
              <h2
                className="text-4xl md:text-5xl lg:text-6xl font-black text-[#171717] leading-none"
                style={{ letterSpacing: '-0.02em' }}
              >
                VERIFIED
                <br />
                PREMIUM
              </h2>
            </div>
            <div className="max-w-md">
              <p className="text-base text-[#171717]/60 leading-relaxed">
                패션 구매가 에너지 자산으로 전환됩니다.
                <br />
                모든 VRD 아이템에서 13.5% APY를 적립하세요.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Product Grid - 2.5x Spacing */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-16 lg:gap-20">
          {VRD_COLLECTION.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>

        {/* View All CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-32 md:mt-40 lg:mt-48 text-center"
        >
          <Link
            href={`/${locale}/vrd`}
            className="inline-flex items-center gap-4 px-12 py-5 bg-[#171717] text-white font-medium tracking-wider uppercase hover:bg-[#171717]/90 transition-colors"
          >
            <span>View Full Collection</span>
            <span className="text-xl">→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALUE PROPOSITION SECTION
// ═══════════════════════════════════════════════════════════════════════════════

function ValueProposition() {
  const locale = useLocale();

  const values = [
    {
      number: '01',
      title: 'SHOP',
      titleKo: '쇼핑',
      description: 'VRD 컬렉션에서 검증된 프리미엄 아이템을 구매하세요.',
    },
    {
      number: '02',
      title: 'EARN',
      titleKo: '적립',
      description: '구매 금액이 에너지 자산으로 자동 전환됩니다.',
    },
    {
      number: '03',
      title: 'GROW',
      titleKo: '성장',
      description: '연 13.5% APY로 당신의 자산이 성장합니다.',
    },
  ];

  return (
    <section className="py-40 md:py-56 lg:py-64 px-8 md:px-16 lg:px-24 bg-[#171717]">
      <div className="max-w-[1800px] mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-24 md:mb-32 lg:mb-40 text-center"
        >
          <span className="text-[10px] tracking-[0.5em] text-white/40 uppercase block mb-8">
            The Sovereign System
          </span>
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-none"
            style={{ letterSpacing: '0.05em' }}
          >
            FASHION BECOMES
            <br />
            <span className="text-amber-500">CAPITAL</span>
          </h2>
        </motion.div>

        {/* Value Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12 lg:gap-20">
          {values.map((value, index) => (
            <motion.div
              key={value.number}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.15 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-[80px] md:text-[100px] font-black text-white/5 leading-none mb-8">
                {value.number}
              </div>
              <h3
                className="text-2xl md:text-3xl font-black text-white mb-2"
                style={{ letterSpacing: '0.1em' }}
              >
                {value.title}
              </h3>
              <p className="text-base text-white/40 mb-6">{value.titleKo}</p>
              <p className="text-sm text-white/60 leading-relaxed max-w-xs mx-auto">
                {value.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-32 md:mt-40 lg:mt-48 text-center"
        >
          <Link
            href={`/${locale}/sovereign`}
            className="inline-flex items-center gap-4 px-12 py-5 bg-white text-[#171717] font-medium tracking-wider uppercase hover:bg-white/90 transition-colors"
          >
            <span>Become a Sovereign</span>
            <span className="text-xl">→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════════════════════════

function Footer() {
  const locale = useLocale();

  return (
    <footer className="py-32 md:py-40 lg:py-48 px-8 md:px-16 lg:px-24 bg-[#F9F9F7] border-t border-[#171717]/10">
      <div className="max-w-[1800px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 md:gap-12 mb-24">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3
              className="text-3xl md:text-4xl font-black text-[#171717] mb-6"
              style={{ letterSpacing: '0.05em' }}
            >
              FIELD NINE
            </h3>
            <p className="text-sm text-[#171717]/50 max-w-md leading-relaxed">
              패션이 자본이 되는 새로운 시대.
              <br />
              The Sovereign Era.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-[10px] tracking-[0.3em] text-[#171717]/40 uppercase mb-8">
              Platform
            </h4>
            <ul className="space-y-4">
              {['VRD Collection', 'Nexus Trading', 'Sovereign'].map((item) => (
                <li key={item}>
                  <Link
                    href={`/${locale}/${item.toLowerCase().replace(' ', '-')}`}
                    className="text-sm text-[#171717]/60 hover:text-[#171717] transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] tracking-[0.3em] text-[#171717]/40 uppercase mb-8">
              Legal
            </h4>
            <ul className="space-y-4">
              {['Terms', 'Privacy', 'Risk Disclosure'].map((item) => (
                <li key={item}>
                  <Link
                    href={`/${locale}/legal/${item.toLowerCase().replace(' ', '-')}`}
                    className="text-sm text-[#171717]/60 hover:text-[#171717] transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-12 border-t border-[#171717]/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="text-xs text-[#171717]/40">
            © 2026 Field Nine Solutions. All rights reserved.
          </span>
          <span className="text-xs text-[#171717]/40" style={{ letterSpacing: '0.2em' }}>
            THE SOVEREIGN ERA
          </span>
        </div>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function SovereignPage() {
  return (
    <div className="min-h-screen bg-[#F9F9F7]" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* 100vh Hero */}
      <HeroSection />

      {/* Product Showcase */}
      <ProductShowcase />

      {/* Value Proposition */}
      <ValueProposition />

      {/* Footer */}
      <Footer />
    </div>
  );
}
