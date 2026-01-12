/**
 * K-UNIVERSAL Tesla-Style Landing Page
 * Premium branding with overwhelming intro animation
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import Link from 'next/link';

export default function LandingPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div ref={containerRef} className="bg-[#F9F9F7] overflow-x-hidden">
      {/* Hero Section */}
      <motion.section
        style={{ opacity, scale }}
        className="min-h-screen flex items-center justify-center relative px-4"
      >
        <div className="max-w-6xl mx-auto text-center">
          {/* Animated Logo */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={isLoaded ? { scale: 1, rotate: 0 } : {}}
            transition={{ duration: 1, type: 'spring', stiffness: 100 }}
            className="mb-8"
          >
            <div className="text-8xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent">
              K-UNIVERSAL
            </div>
          </motion.div>

          {/* Tagline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold text-gray-900 mb-6"
          >
            The Future of Identity
            <br />
            <span className="bg-gradient-to-r from-[#0066FF] to-[#00C853] bg-clip-text text-transparent">
              Starts Today
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto"
          >
            Passport-grade KYC verification meets Ghost Wallet.
            <br />
            Built for global citizens. Powered by AI.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="flex gap-6 justify-center"
          >
            <Link
              href="/demo"
              className="px-12 py-5 bg-[#0066FF] text-white text-lg font-semibold rounded-full hover:bg-[#0052CC] transition-all shadow-2xl hover:shadow-3xl transform hover:scale-105"
            >
              Experience Demo
            </Link>
            <Link
              href="/dashboard"
              className="px-12 py-5 bg-white text-gray-900 text-lg font-semibold rounded-full border-2 border-gray-200 hover:border-gray-300 transition-all transform hover:scale-105"
            >
              Enter Dashboard
            </Link>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isLoaded ? { opacity: 1 } : {}}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-gray-400 text-sm flex flex-col items-center gap-2"
            >
              <span>Scroll to explore</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Ghost Wallet Interactive Section */}
      <GhostWalletSection />

      {/* Passport OCR Section */}
      <PassportOCRSection />

      {/* K-Lifestyle Section */}
      <KLifestyleSection />

      {/* Final CTA */}
      <FinalCTASection />
    </div>
  );
}

function GhostWalletSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-6xl font-bold text-gray-900 mb-6">
            👻 Ghost Wallet
          </h2>
          <p className="text-2xl text-gray-600 max-w-3xl mx-auto">
            Your money, your keys, your freedom.
            <br />
            Non-custodial wallet meets biometric security.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: '🔐',
              title: 'Zero-Knowledge',
              desc: 'Your private keys never leave your device. True self-custody.',
            },
            {
              icon: '⚡',
              title: 'Instant Topup',
              desc: 'Add funds with any card. Spend anywhere in Korea.',
            },
            {
              icon: '🌍',
              title: 'Multi-Chain',
              desc: 'Support for Ethereum, Polygon, BSC, and more.',
            },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
              className="p-8 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all"
            >
              <div className="text-6xl mb-4">{feature.icon}</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PassportOCRSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="min-h-screen flex items-center justify-center px-4 py-20 bg-gradient-to-b from-[#F9F9F7] to-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-6xl font-bold text-gray-900 mb-6">
            🛂 99% Accuracy OCR
          </h2>
          <p className="text-2xl text-gray-600 max-w-3xl mx-auto">
            Powered by GPT-4 Vision.
            <br />
            Your passport verified in 2 seconds.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative"
        >
          <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden">
            <motion.div
              animate={{ rotate: [0, 5, 0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-9xl"
            >
              🔍
            </motion.div>
          </div>

          {/* Floating Stats */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="absolute -left-8 top-1/4 bg-white p-6 rounded-2xl shadow-xl"
          >
            <div className="text-4xl font-bold text-[#00C853]">99%</div>
            <div className="text-sm text-gray-600">Accuracy</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="absolute -right-8 bottom-1/4 bg-white p-6 rounded-2xl shadow-xl"
          >
            <div className="text-4xl font-bold text-[#0066FF]">2s</div>
            <div className="text-sm text-gray-600">Processing</div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function KLifestyleSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-6xl font-bold text-gray-900 mb-6">
            🌏 K-Lifestyle
          </h2>
          <p className="text-2xl text-gray-600 max-w-3xl mx-auto">
            Live like a local. Built for global citizens.
            <br />
            Taxi, delivery, restaurants - all in one place.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: '🚕', title: 'UT Taxi', desc: 'Kakao T without Korean number' },
            { icon: '🍔', title: 'Food Delivery', desc: 'Order from any restaurant' },
            { icon: '🍜', title: 'Restaurant GPS', desc: 'Find hidden gems near you' },
          ].map((service, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
              whileHover={{ scale: 1.05, y: -10 }}
              className="p-8 bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-lg cursor-pointer"
            >
              <div className="text-6xl mb-4">{service.icon}</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{service.title}</h3>
              <p className="text-gray-600">{service.desc}</p>
              <div className="mt-6 text-[#0066FF] font-semibold">Coming Soon →</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTASection() {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-20 bg-gradient-to-b from-white to-[#F9F9F7]">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-6xl md:text-7xl font-bold text-gray-900 mb-8">
            Ready to experience
            <br />
            <span className="bg-gradient-to-r from-[#0066FF] to-[#00C853] bg-clip-text text-transparent">
              the future?
            </span>
          </h2>

          <p className="text-2xl text-gray-600 mb-12">
            Join 10,000+ global citizens who trust K-Universal
          </p>

          <Link
            href="/demo"
            className="inline-block px-16 py-6 bg-[#0066FF] text-white text-xl font-semibold rounded-full hover:bg-[#0052CC] transition-all shadow-2xl transform hover:scale-105"
          >
            Start Your Journey
          </Link>

          <div className="mt-16 flex items-center justify-center gap-12 text-sm text-gray-500">
            <div>🔒 Bank-level security</div>
            <div>⚡ 2-minute setup</div>
            <div>🌍 Global support</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
