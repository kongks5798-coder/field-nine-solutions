/**
 * K-Universal Tesla-Style Landing Page
 * 다국어 지원 버전
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

export default function LandingPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const t = useTranslations('landing');
  const locale = useLocale();

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
              {t('brand')}
            </div>
          </motion.div>

          {/* Tagline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold text-gray-900 mb-6"
          >
            {t('hero.title1')}
            <br />
            <span className="bg-gradient-to-r from-[#0066FF] to-[#00C853] bg-clip-text text-transparent">
              {t('hero.title2')}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto"
          >
            {t('hero.subtitle')}
            <br />
            {t('hero.subtitle2')}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="flex gap-6 justify-center flex-wrap"
          >
            <Link
              href={`/${locale}/demo`}
              className="px-12 py-5 bg-[#0066FF] text-white text-lg font-semibold rounded-full hover:bg-[#0052CC] transition-all shadow-2xl hover:shadow-3xl transform hover:scale-105"
            >
              {t('hero.cta_demo')}
            </Link>
            <Link
              href={`/${locale}/dashboard`}
              className="px-12 py-5 bg-white text-gray-900 text-lg font-semibold rounded-full border-2 border-gray-200 hover:border-gray-300 transition-all transform hover:scale-105"
            >
              {t('hero.cta_dashboard')}
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
              <span>{t('hero.scroll')}</span>
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
  const t = useTranslations('landing.ghostWallet');

  const features = [
    {
      icon: '🔐',
      title: t('feature1_title'),
      desc: t('feature1_desc'),
    },
    {
      icon: '⚡',
      title: t('feature2_title'),
      desc: t('feature2_desc'),
    },
    {
      icon: '🌍',
      title: t('feature3_title'),
      desc: t('feature3_desc'),
    },
  ];

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
            👻 {t('title')}
          </h2>
          <p className="text-2xl text-gray-600 max-w-3xl mx-auto">
            {t('subtitle')}
            <br />
            {t('subtitle2')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
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
  const t = useTranslations('landing.ocr');

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
            🛂 {t('title')}
          </h2>
          <p className="text-2xl text-gray-600 max-w-3xl mx-auto">
            {t('subtitle')}
            <br />
            {t('subtitle2')}
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
            <div className="text-sm text-gray-600">{t('accuracy')}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="absolute -right-8 bottom-1/4 bg-white p-6 rounded-2xl shadow-xl"
          >
            <div className="text-4xl font-bold text-[#0066FF]">2s</div>
            <div className="text-sm text-gray-600">{t('processing')}</div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function KLifestyleSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const t = useTranslations('landing.kLifestyle');

  const services = [
    { icon: '🚕', title: t('taxi_title'), desc: t('taxi_desc') },
    { icon: '🍔', title: t('food_title'), desc: t('food_desc') },
    { icon: '🍜', title: t('restaurant_title'), desc: t('restaurant_desc') },
  ];

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
            🌏 {t('title')}
          </h2>
          <p className="text-2xl text-gray-600 max-w-3xl mx-auto">
            {t('subtitle')}
            <br />
            {t('subtitle2')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, idx) => (
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
              <div className="mt-6 text-[#0066FF] font-semibold">{t('coming_soon')} →</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTASection() {
  const t = useTranslations('landing.cta');
  const locale = useLocale();

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
            {t('title1')}
            <br />
            <span className="bg-gradient-to-r from-[#0066FF] to-[#00C853] bg-clip-text text-transparent">
              {t('title2')}
            </span>
          </h2>

          <p className="text-2xl text-gray-600 mb-12">
            {t('subtitle')}
          </p>

          <Link
            href={`/${locale}/demo`}
            className="inline-block px-16 py-6 bg-[#0066FF] text-white text-xl font-semibold rounded-full hover:bg-[#0052CC] transition-all shadow-2xl transform hover:scale-105"
          >
            {t('button')}
          </Link>

          <div className="mt-16 flex items-center justify-center gap-12 text-sm text-gray-500 flex-wrap">
            <div>🔒 {t('security')}</div>
            <div>⚡ {t('setup')}</div>
            <div>🌍 {t('support')}</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
