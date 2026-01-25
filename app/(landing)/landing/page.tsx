/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 50: FIELD NINE NEXUS - PREMIUM LANDING PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 * "글로벌 에너지 제국의 합류를 권유하라"
 *
 * Tesla-style minimalism meets crypto-grade FOMO
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import Link from 'next/link';
import { LiveActivityFeed, SocialProofCounter, ActivityTicker } from '@/components/nexus/viral-engine';

// ============================================
// Animated Counter Hook
// ============================================

function useAnimatedCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const countRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(countRef, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, end, duration]);

  return { count, ref: countRef };
}

// ============================================
// Main Landing Page
// ============================================

export default function LandingPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();

  const opacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.15], [1, 0.9]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div ref={containerRef} className="bg-[#0a0d14] overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0d14]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <span className="text-xl font-black text-white">F9</span>
            </div>
            <span className="text-xl font-bold text-white">Field Nine</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-white/60 hover:text-white transition-colors">Features</a>
            <a href="#network" className="text-white/60 hover:text-white transition-colors">Network</a>
            <a href="#invest" className="text-white/60 hover:text-white transition-colors">Invest</a>
            <ActivityTicker />
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/ko/nexus/assets"
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full text-white font-bold hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
            >
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        style={{ opacity, scale }}
        className="min-h-screen flex items-center justify-center relative px-4 pt-20"
      >
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-[150px]" />
        </div>

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative max-w-6xl mx-auto text-center z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8"
          >
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm text-white/70">$778M+ Global Infrastructure Network</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight"
          >
            The Global
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Energy Empire
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-xl md:text-2xl text-white/60 mb-12 max-w-3xl mx-auto"
          >
            Invest in real-world energy infrastructure.
            <br />
            Earn up to <span className="text-emerald-400 font-bold">15% APY</span> on verified solar, wind & V2G assets.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Link
              href="/ko/nexus/assets"
              className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-lg font-bold rounded-full hover:shadow-2xl hover:shadow-emerald-500/30 transition-all transform hover:scale-105"
            >
              Start Investing
            </Link>
            <Link
              href="/ko/nexus/energy"
              className="px-10 py-5 bg-white/5 text-white text-lg font-bold rounded-full border border-white/10 hover:bg-white/10 transition-all transform hover:scale-105"
            >
              View Live Dashboard
            </Link>
          </motion.div>

          {/* Live Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.1, duration: 0.8 }}
          >
            <SocialProofCounter />
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isLoaded ? { opacity: 1 } : {}}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-white/40 text-sm flex flex-col items-center gap-2"
            >
              <span>Scroll to explore</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Live Activity Feed */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <LiveActivityFeed />
        </div>
      </section>

      {/* Features Section */}
      <FeaturesSection />

      {/* Network Section */}
      <NetworkSection />

      {/* Investment Tiers Section */}
      <InvestmentSection />

      {/* Testimonials / Social Proof */}
      <TestimonialsSection />

      {/* Final CTA */}
      <FinalCTASection />

      {/* Footer */}
      <Footer />
    </div>
  );
}

// ============================================
// Features Section
// ============================================

function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const features = [
    {
      icon: '☀️',
      title: 'Real Energy Assets',
      desc: 'Invest in verified solar farms, wind turbines, and V2G infrastructure across 12 countries.',
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: '🤖',
      title: 'Prophet AI Trading',
      desc: 'Our AI executes 800+ daily trades, optimizing your returns across global energy markets.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: '💰',
      title: 'Daily Dividends',
      desc: 'Receive your share of profits daily. No lock-ups, no hidden fees, pure passive income.',
      color: 'from-emerald-500 to-cyan-500',
    },
    {
      icon: '🔒',
      title: 'RWA Verified',
      desc: 'Every asset is backed by real-world infrastructure with on-chain verification.',
      color: 'from-blue-500 to-indigo-500',
    },
  ];

  return (
    <section ref={ref} id="features" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Why Field Nine?
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            The world's first decentralized energy investment platform with real-world asset backing.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="p-8 bg-white/5 backdrop-blur rounded-2xl border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <span className="text-2xl">{feature.icon}</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-white/60">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// Network Section
// ============================================

function NetworkSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const nodesCounter = useAnimatedCounter(19);
  const countriesCounter = useAnimatedCounter(12);
  const capacityCounter = useAnimatedCounter(618);
  const valueCounter = useAnimatedCounter(778);

  return (
    <section ref={ref} id="network" className="py-24 px-4 bg-gradient-to-b from-transparent to-white/[0.02]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Global Network
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            A borderless infrastructure empire spanning continents.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-center p-6 bg-white/5 rounded-2xl border border-white/10"
          >
            <div ref={nodesCounter.ref} className="text-4xl md:text-5xl font-black text-emerald-400">
              {nodesCounter.count}
            </div>
            <div className="text-white/50 mt-2">Active Nodes</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-center p-6 bg-white/5 rounded-2xl border border-white/10"
          >
            <div ref={countriesCounter.ref} className="text-4xl md:text-5xl font-black text-cyan-400">
              {countriesCounter.count}
            </div>
            <div className="text-white/50 mt-2">Countries</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="text-center p-6 bg-white/5 rounded-2xl border border-white/10"
          >
            <div ref={capacityCounter.ref} className="text-4xl md:text-5xl font-black text-amber-400">
              {capacityCounter.count}<span className="text-2xl">MW</span>
            </div>
            <div className="text-white/50 mt-2">Total Capacity</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4 }}
            className="text-center p-6 bg-white/5 rounded-2xl border border-white/10"
          >
            <div ref={valueCounter.ref} className="text-4xl md:text-5xl font-black text-purple-400">
              ${valueCounter.count}<span className="text-2xl">M</span>
            </div>
            <div className="text-white/50 mt-2">Network Value</div>
          </motion.div>
        </div>

        {/* Node Locations */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center gap-3"
        >
          {['Korea', 'USA', 'Japan', 'Germany', 'UK', 'Singapore', 'Australia', 'UAE', 'France', 'Switzerland', 'Hong Kong', 'Brazil'].map((country, idx) => (
            <div
              key={idx}
              className="px-4 py-2 bg-white/5 rounded-full text-white/70 text-sm border border-white/10"
            >
              {country}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// Investment Tiers Section
// ============================================

function InvestmentSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const tiers = [
    {
      name: 'Pioneer',
      apy: '12%',
      minInvest: '100 KAUS',
      color: 'from-zinc-400 to-zinc-600',
      features: ['Weekly Dividends', 'Global Network Access', 'Basic Analytics'],
    },
    {
      name: 'Sovereign',
      apy: '13.5%',
      minInvest: '1,000 KAUS',
      color: 'from-amber-400 to-amber-600',
      features: ['Daily Dividends', 'Priority Node Access', 'AI Trading Insights', 'Governance Voting'],
      popular: true,
    },
    {
      name: 'Emperor',
      apy: '15%',
      minInvest: '10,000 KAUS',
      color: 'from-purple-400 to-pink-500',
      features: ['Real-Time Dividends', 'Exclusive Allocations', 'Prophet AI Access', 'Board Seat', 'Physical Asset Tours'],
    },
  ];

  return (
    <section ref={ref} id="invest" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Choose Your Tier
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            The higher you stake, the greater your empire grows.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className={`relative p-8 bg-white/5 rounded-2xl border ${tier.popular ? 'border-amber-500/50' : 'border-white/10'} hover:border-white/20 transition-all`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-xs font-bold text-white">
                  MOST POPULAR
                </div>
              )}

              <div className={`w-12 h-12 bg-gradient-to-br ${tier.color} rounded-xl flex items-center justify-center mb-6`}>
                <span className="text-xl">
                  {tier.name === 'Pioneer' ? '🌱' : tier.name === 'Sovereign' ? '👑' : '🏆'}
                </span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
              <div className="text-4xl font-black text-emerald-400 mb-1">{tier.apy} APY</div>
              <div className="text-white/50 mb-6">Min: {tier.minInvest}</div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-white/70">
                    <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/ko/nexus/assets"
                className={`block text-center py-3 rounded-xl font-bold transition-all ${
                  tier.popular
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/30'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Get Started
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// Testimonials Section
// ============================================

function TestimonialsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const testimonials = [
    {
      quote: "15% APY on real energy assets? This is the future of investing.",
      author: "Alex K.",
      location: "New York",
      tier: "Emperor",
    },
    {
      quote: "Prophet AI made $1,200 for me last month while I slept.",
      author: "Sarah M.",
      location: "London",
      tier: "Sovereign",
    },
    {
      quote: "Finally, passive income backed by something real.",
      author: "Kenji T.",
      location: "Tokyo",
      tier: "Emperor",
    },
  ];

  return (
    <section ref={ref} className="py-24 px-4 bg-gradient-to-b from-white/[0.02] to-transparent">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Join the Empire
          </h2>
          <p className="text-xl text-white/60">
            12,000+ investors already earning daily dividends.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="p-6 bg-white/5 rounded-2xl border border-white/10"
            >
              <p className="text-white/80 text-lg mb-6">&ldquo;{item.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                  {item.author[0]}
                </div>
                <div>
                  <div className="text-white font-bold">{item.author}</div>
                  <div className="text-white/50 text-sm">{item.location} • {item.tier}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// Final CTA Section
// ============================================

function FinalCTASection() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-5xl md:text-6xl font-black text-white mb-8">
            Ready to join the
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Global Empire?
            </span>
          </h2>

          <p className="text-xl text-white/60 mb-12 max-w-2xl mx-auto">
            Start earning 15% APY on verified energy infrastructure today.
            No experience required. Prophet AI handles everything.
          </p>

          <Link
            href="/ko/nexus/assets"
            className="inline-block px-12 py-5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xl font-bold rounded-full hover:shadow-2xl hover:shadow-emerald-500/30 transition-all transform hover:scale-105"
          >
            Start Your Empire
          </Link>

          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-white/50">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              RWA Verified
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Instant Setup
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Global Access
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// Footer
// ============================================

function Footer() {
  return (
    <footer className="py-12 px-4 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <span className="text-xl font-black text-white">F9</span>
            </div>
            <span className="text-xl font-bold text-white">Field Nine Nexus</span>
          </div>

          <div className="flex items-center gap-6 text-white/50 text-sm">
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Docs</a>
            <a href="https://twitter.com/FieldNineNexus" target="_blank" rel="noopener" className="hover:text-white transition-colors">
              Twitter
            </a>
          </div>

          <div className="text-white/30 text-sm">
            © 2026 Field Nine. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
