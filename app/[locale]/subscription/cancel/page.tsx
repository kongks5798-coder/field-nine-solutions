/**
 * NOMAD - Subscription Cancel Page
 * Displayed when user cancels during Stripe checkout
 */

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  Globe,
  ArrowLeft,
  XCircle,
  HelpCircle,
  MessageCircle,
  ArrowRight,
} from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '@/lib/config/brand';

// ============================================
// Animation Variants
// ============================================
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

// ============================================
// Subscription Cancel Page
// ============================================
export default function SubscriptionCancelPage() {
  const locale = useLocale();

  const reasons = [
    {
      icon: '💰',
      title: 'Looking for a better price?',
      description: 'Try our yearly plan and save up to 17% on your subscription.',
      cta: 'View Yearly Plans',
      href: `/${locale}/pricing`,
    },
    {
      icon: '🤔',
      title: 'Not sure which plan is right?',
      description: 'Our team can help you find the perfect plan for your travel needs.',
      cta: 'Contact Support',
      href: 'mailto:support@nomad.travel',
    },
    {
      icon: '✨',
      title: 'Want to try before you buy?',
      description: 'Start with our free plan and upgrade when you\'re ready.',
      cta: 'Start Free',
      href: `/${locale}/auth/signup`,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/${locale}/pricing`}>
                <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </Link>
              <Link href={`/${locale}`} className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">NOMAD</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-16">
        {/* Cancel Icon & Message */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/20 mb-6">
            <XCircle className="w-12 h-12 text-amber-400" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            Payment Cancelled
          </h1>

          <p className="text-lg text-white/60 max-w-md mx-auto">
            No worries! Your payment wasn't processed and you haven't been charged.
          </p>
        </motion.div>

        {/* Helpful Options */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-12"
        >
          <h2 className="text-xl font-bold mb-6 text-center">Can we help?</h2>

          <div className="space-y-4">
            {reasons.map((reason, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
              >
                <Link href={reason.href}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">{reason.icon}</span>
                      <div className="flex-1">
                        <h3 className="text-white font-bold mb-1">{reason.title}</h3>
                        <p className="text-white/60 text-sm">{reason.description}</p>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-400 text-sm font-medium">
                        {reason.cta}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Compare Plans Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/30 rounded-2xl p-6 mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <HelpCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-white font-bold">Quick Comparison</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5">
              <p className="text-white font-bold mb-2">Explorer</p>
              <p className="text-2xl font-bold text-emerald-400">$14.99<span className="text-sm text-white/50">/mo</span></p>
              <p className="text-white/50 text-sm mt-2">3GB eSIM + AI Travel</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <p className="text-white font-bold mb-2">Traveler <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">Popular</span></p>
              <p className="text-2xl font-bold text-emerald-400">$29.99<span className="text-sm text-white/50">/mo</span></p>
              <p className="text-white/50 text-sm mt-2">10GB eSIM + 10% Hotels</p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href={`/${locale}/pricing`}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-colors"
            >
              Back to Pricing
            </motion.button>
          </Link>
          <Link href={`/${locale}`}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors"
            >
              Return Home
            </motion.button>
          </Link>
        </motion.div>

        {/* Support Link */}
        <p className="text-center text-white/40 text-sm mt-8">
          Questions? <a href="mailto:support@nomad.travel" className="text-emerald-400 hover:underline">Contact our support team</a>
        </p>
      </main>
    </div>
  );
}
