'use client';

/**
 * VRD 26SS - Main Landing Page
 * Tesla-Style Design with Integrated Tab Navigation
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import VRDTabs from '@/components/vrd/VRDTabs';

export default function VRDPage() {
  const [showTabs, setShowTabs] = useState(false);

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(45deg, #171717 25%, transparent 25%),
              linear-gradient(-45deg, #171717 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #171717 75%),
              linear-gradient(-45deg, transparent 75%, #171717 75%)
            `,
            backgroundSize: '60px 60px',
            backgroundPosition: '0 0, 0 30px, 30px -30px, -30px 0px',
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-light tracking-[0.3em] text-[#171717]">
              VRD
            </h1>
            <p className="mt-4 text-lg md:text-xl text-[#171717]/50 tracking-[0.2em] uppercase">
              26SS Collection
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="mt-12"
          >
            <p className="text-xl md:text-2xl text-[#171717]/70 font-light">
              Versatility · Restraint · Design
            </p>
            <p className="mt-2 text-sm text-[#171717]/40">
              다용도성 · 절제 · 디자인
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => setShowTabs(true)}
              className="px-10 py-4 bg-[#171717] text-[#F9F9F7] text-lg tracking-wide hover:bg-[#171717]/90 transition-colors rounded-full"
            >
              컬렉션 보기
            </button>
            <Link
              href="/vrd/checkout"
              className="px-10 py-4 border-2 border-[#171717] text-[#171717] text-lg tracking-wide hover:bg-[#171717] hover:text-[#F9F9F7] transition-all rounded-full"
            >
              지금 구매하기
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <button
            onClick={() => setShowTabs(true)}
            className="flex flex-col items-center gap-2 text-[#171717]/40 hover:text-[#171717]/60 transition-colors"
          >
            <span className="text-xs tracking-widest uppercase">Scroll</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </motion.div>
          </button>
        </motion.div>
      </section>

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-[#171717] text-[#F9F9F7]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/vrd" className="text-2xl tracking-[0.3em] font-light">
            VRD
          </Link>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setShowTabs(!showTabs)}
              className="text-sm tracking-wide hover:text-[#F9F9F7]/80 transition-colors"
            >
              {showTabs ? 'CLOSE' : 'EXPLORE'}
            </button>
            <Link
              href="/vrd/checkout"
              className="px-6 py-2 bg-[#F9F9F7] text-[#171717] text-sm tracking-wide rounded-full hover:bg-[#F9F9F7]/90 transition-colors"
            >
              SHOP
            </Link>
          </div>
        </div>
      </nav>

      {/* Tab Content */}
      {showTabs && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <VRDTabs defaultTab="philosophy" />
        </motion.div>
      )}

      {/* Features Section */}
      {!showTabs && (
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-light text-center text-[#171717] mb-16"
            >
              Why VRD
            </motion.h2>

            <div className="grid md:grid-cols-3 gap-12">
              {[
                {
                  icon: '◇',
                  title: 'Premium Materials',
                  titleKo: '프리미엄 소재',
                  description: 'Italian-sourced fabrics with proprietary compression technology',
                },
                {
                  icon: '○',
                  title: 'Limited Edition',
                  titleKo: '리미티드 에디션',
                  description: 'Small batch production ensures exclusivity and quality',
                },
                {
                  icon: '□',
                  title: 'Bundle Savings',
                  titleKo: '번들 할인',
                  description: 'Save up to 35% with our collection bundles',
                },
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="text-center"
                >
                  <div className="text-4xl text-[#171717]/30 mb-6">{feature.icon}</div>
                  <h3 className="text-xl font-medium text-[#171717] mb-1">{feature.title}</h3>
                  <p className="text-sm text-[#171717]/40 mb-4">{feature.titleKo}</p>
                  <p className="text-[#171717]/60">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bundle Promotion */}
      {!showTabs && (
        <section className="py-24 px-4 bg-[#171717] text-[#F9F9F7]">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-light mb-8">
                Bundle & Save
              </h2>
              <div className="grid sm:grid-cols-3 gap-6 mb-12">
                {[
                  { name: 'Couple Bundle', discount: '25%', items: '2개' },
                  { name: 'Crew Bundle', discount: '30%', items: '3-4개' },
                  { name: 'Full Collection', discount: '35%', items: '5개+' },
                ].map((bundle) => (
                  <div
                    key={bundle.name}
                    className="p-6 border border-[#F9F9F7]/20 rounded-xl"
                  >
                    <p className="text-[#F9F9F7]/60 text-sm mb-2">{bundle.items}</p>
                    <p className="text-3xl font-light mb-2">{bundle.discount}</p>
                    <p className="text-[#F9F9F7]/80">{bundle.name}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/vrd/checkout"
                className="inline-block px-12 py-4 bg-[#F9F9F7] text-[#171717] text-lg tracking-wide rounded-full hover:bg-[#F9F9F7]/90 transition-colors"
              >
                지금 쇼핑하기
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-[#171717]/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <p className="text-2xl tracking-[0.3em] font-light text-[#171717]">VRD</p>
            <p className="text-sm text-[#171717]/40 mt-1">by Field Nine</p>
          </div>
          <div className="flex items-center gap-8 text-sm text-[#171717]/50">
            <Link href="/vrd/terms" className="hover:text-[#171717] transition-colors">
              이용약관
            </Link>
            <Link href="/vrd/privacy" className="hover:text-[#171717] transition-colors">
              개인정보처리방침
            </Link>
            <Link href="/vrd/contact" className="hover:text-[#171717] transition-colors">
              문의하기
            </Link>
          </div>
          <p className="text-xs text-[#171717]/30">
            © 2026 VRD. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
