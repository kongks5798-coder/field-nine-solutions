/**
 * NOMAD - Pricing Page
 * Subscription plans with detailed comparison
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  Globe,
  Check,
  X,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  MessageSquare,
  Wifi,
  Hotel,
  Plane,
  Languages,
  HeadphonesIcon,
  Shield,
  Zap,
} from 'lucide-react';
import { SUBSCRIPTION_PLANS, BRAND } from '@/lib/config/brand';

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

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

// ============================================
// Feature Comparison Data
// ============================================
const FEATURES = [
  {
    category: 'AI Concierge',
    features: [
      { name: 'AI Chat Sessions', free: '5/month', explorer: '50/month', traveler: 'Unlimited', nomad: 'Unlimited', business: 'Unlimited' },
      { name: 'Trip Planning', free: false, explorer: true, traveler: true, nomad: true, business: true },
      { name: 'Real-time Translation', free: false, explorer: true, traveler: true, nomad: true, business: true },
      { name: 'Personalized Recommendations', free: false, explorer: true, traveler: true, nomad: true, business: true },
    ]
  },
  {
    category: 'eSIM Data',
    features: [
      { name: 'Monthly Data', free: '0', explorer: '1GB', traveler: '5GB', nomad: '15GB', business: '50GB' },
      { name: 'Coverage', free: '-', explorer: '190+ countries', traveler: '190+ countries', nomad: '190+ countries', business: '190+ countries' },
      { name: 'Rollover Data', free: false, explorer: false, traveler: true, nomad: true, business: true },
      { name: 'Priority Network', free: false, explorer: false, traveler: false, nomad: true, business: true },
    ]
  },
  {
    category: 'Travel Deals',
    features: [
      { name: 'Hotel Discounts', free: 'Standard', explorer: 'Up to 10%', traveler: 'Up to 20%', nomad: 'Up to 30%', business: 'Up to 40%' },
      { name: 'Flight Alerts', free: true, explorer: true, traveler: true, nomad: true, business: true },
      { name: 'Price Match Guarantee', free: false, explorer: false, traveler: true, nomad: true, business: true },
      { name: 'Lounge Access Discounts', free: false, explorer: false, traveler: true, nomad: true, business: true },
    ]
  },
  {
    category: 'Support',
    features: [
      { name: 'Email Support', free: true, explorer: true, traveler: true, nomad: true, business: true },
      { name: '24/7 Chat Support', free: false, explorer: false, traveler: true, nomad: true, business: true },
      { name: 'Phone Support', free: false, explorer: false, traveler: false, nomad: true, business: true },
      { name: 'Dedicated Agent', free: false, explorer: false, traveler: false, nomad: false, business: true },
    ]
  },
];

// ============================================
// FAQ Data
// ============================================
const FAQ = [
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time. Your benefits will continue until the end of your current billing period.',
  },
  {
    question: 'How does the eSIM data work?',
    answer: 'Your monthly data allocation can be used in any of our 190+ supported countries. Simply activate your eSIM through our app and connect instantly.',
  },
  {
    question: 'What happens if I run out of data?',
    answer: 'You can purchase additional data packs at discounted subscriber rates. Traveler plan and above also includes rollover data for unused allocation.',
  },
  {
    question: 'Is my payment information secure?',
    answer: 'Yes, we use Stripe for secure payment processing. Your card details are never stored on our servers and all transactions are encrypted.',
  },
  {
    question: 'Can I upgrade or downgrade my plan?',
    answer: 'Yes, you can change your plan at any time. Upgrades take effect immediately, while downgrades apply at the next billing cycle.',
  },
];

// ============================================
// Pricing Page
// ============================================
export default function PricingPage() {
  const locale = useLocale();
  const [isYearly, setIsYearly] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const plans = Object.values(SUBSCRIPTION_PLANS);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/${locale}`}>
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

            <Link href={`/${locale}/auth/signup`}>
              <button className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors">
                Start Free
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-sm font-medium">Simple, Transparent Pricing</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            Choose Your
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Adventure
            </span>
          </h1>

          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-10">
            Start free, upgrade when you're ready. All plans include access to our AI concierge
            and can be cancelled anytime.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 p-1.5 bg-white/5 rounded-full">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-colors ${
                !isYearly ? 'bg-emerald-500 text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                isYearly ? 'bg-emerald-500 text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              Yearly
              <span className="text-xs bg-amber-500 text-black px-2 py-0.5 rounded-full font-bold">
                Save 17%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-24"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              variants={fadeInUp}
              className={`relative p-6 rounded-2xl border ${
                plan.popular
                  ? 'bg-gradient-to-b from-emerald-500/10 to-transparent border-emerald-500/30 lg:scale-105 lg:z-10'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-sm text-white/50">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">
                  ${isYearly && plan.priceYearly ? Math.round(plan.priceYearly / 12) : plan.price}
                </span>
                <span className="text-white/50">/month</span>
                {isYearly && plan.priceYearly && plan.price > 0 && (
                  <p className="text-xs text-white/40 mt-1">
                    Billed ${plan.priceYearly}/year
                  </p>
                )}
              </div>

              <Link href={`/${locale}/auth/signup?plan=${plan.id}`}>
                <button
                  className={`w-full py-3 rounded-xl font-medium transition-colors mb-6 ${
                    plan.popular
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {plan.price === 0 ? 'Start Free' : 'Get Started'}
                </button>
              </Link>

              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  {plan.features.aiChats === -1 ? 'Unlimited' : plan.features.aiChats} AI chats
                </li>
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <Wifi className="w-4 h-4 text-emerald-400" />
                  {plan.features.esimData === 0 ? 'No eSIM' : plan.features.esimData === -1 ? 'Unlimited' : `${plan.features.esimData}GB`} data
                </li>
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <Hotel className="w-4 h-4 text-emerald-400" />
                  Up to {plan.features.hotelDiscount}% hotel discount
                </li>
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <HeadphonesIcon className="w-4 h-4 text-emerald-400" />
                  {plan.features.prioritySupport ? '24/7 Support' : 'Email Support'}
                </li>
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* Feature Comparison Table */}
        <section className="mb-24">
          <h2 className="text-3xl font-bold text-center mb-12">
            Feature Comparison
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 font-medium text-white/50">Feature</th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="text-center py-4 px-4 font-bold">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((category) => (
                  <>
                    <tr key={category.category}>
                      <td colSpan={6} className="py-4 px-4 font-bold text-emerald-400 bg-white/5">
                        {category.category}
                      </td>
                    </tr>
                    {category.features.map((feature, idx) => (
                      <tr key={idx} className="border-b border-white/5">
                        <td className="py-3 px-4 text-white/70">{feature.name}</td>
                        {['free', 'explorer', 'traveler', 'nomad', 'business'].map((planId) => {
                          const value = feature[planId as keyof typeof feature];
                          return (
                            <td key={planId} className="text-center py-3 px-4">
                              {typeof value === 'boolean' ? (
                                value ? (
                                  <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                                ) : (
                                  <X className="w-5 h-5 text-white/20 mx-auto" />
                                )
                              ) : (
                                <span className="text-white/70">{value}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-3xl mx-auto mb-24">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {FAQ.map((item, idx) => (
              <motion.div
                key={idx}
                initial={false}
                className="border border-white/10 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                >
                  <span className="font-medium">{item.question}</span>
                  <ChevronRight
                    className={`w-5 h-5 text-white/50 transition-transform ${
                      expandedFaq === idx ? 'rotate-90' : ''
                    }`}
                  />
                </button>
                {expandedFaq === idx && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="px-5 pb-5"
                  >
                    <p className="text-white/60">{item.answer}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center py-16 px-8 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 rounded-3xl">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Travel Smarter?
          </h2>
          <p className="text-white/60 mb-8 max-w-xl mx-auto">
            Join thousands of travelers who've upgraded their journey with NOMAD.
          </p>
          <Link href={`/${locale}/auth/signup`}>
            <button className="px-10 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-lg transition-colors">
              Start Free Trial
            </button>
          </Link>
          <p className="text-white/40 text-sm mt-4">
            No credit card required. Cancel anytime.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p className="text-sm text-white/40">
            © 2025 NOMAD. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Shield className="w-4 h-4 text-white/40" />
            <span className="text-sm text-white/40">Secure payments by Stripe</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
