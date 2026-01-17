/**
 * NOMAD - Subscription Success Page
 * Displayed after successful Stripe checkout
 */

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Globe,
  ArrowRight,
  Sparkles,
  Download,
  Mail,
  MessageCircle,
  Wifi,
} from 'lucide-react';
import confetti from 'canvas-confetti';

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

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, type: 'spring' }
  }
};

// ============================================
// Subscription Success Page
// ============================================
export default function SubscriptionSuccessPage() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [subscriptionData, setSubscriptionData] = useState<{
    planId: string;
    planName: string;
  } | null>(null);

  // Trigger confetti on mount
  useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#10B981', '#06B6D4', '#8B5CF6'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }, []);

  // Fetch subscription details
  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch('/api/subscription');
        const data = await response.json();
        if (data.success && data.subscription) {
          setSubscriptionData({
            planId: data.subscription.planId,
            planName: data.subscription.plan?.name || 'Premium',
          });
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      }
    }
    fetchSubscription();
  }, []);

  const nextSteps = [
    {
      icon: Wifi,
      title: 'Activate Your eSIM',
      description: 'Download your eSIM profile and start using data instantly in 190+ countries',
      href: `/${locale}/dashboard/esim`,
      cta: 'Set Up eSIM',
    },
    {
      icon: MessageCircle,
      title: 'Meet Your AI Concierge',
      description: 'Get personalized travel recommendations and instant help with anything',
      href: `/${locale}/dashboard/concierge`,
      cta: 'Start Chatting',
    },
    {
      icon: Download,
      title: 'Download the App',
      description: 'Get the full NOMAD experience with our mobile app',
      href: '#',
      cta: 'Coming Soon',
      disabled: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">NOMAD</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16">
        {/* Success Icon & Message */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={scaleIn}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/20 mb-6">
            <CheckCircle2 className="w-14 h-14 text-emerald-400" />
          </div>

          <motion.h1
            variants={fadeInUp}
            className="text-4xl sm:text-5xl font-bold mb-4"
          >
            Welcome to{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              NOMAD {subscriptionData?.planName || 'Premium'}
            </span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg text-white/60 max-w-xl mx-auto"
          >
            Your subscription is now active. You've unlocked a world of seamless travel experiences.
          </motion.p>
        </motion.div>

        {/* Subscription Details Card */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/30 rounded-2xl p-6 mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400 font-medium">Subscription Active</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/50 text-sm">Plan</p>
              <p className="text-white font-bold text-lg">{subscriptionData?.planName || 'Premium'}</p>
            </div>
            <div>
              <p className="text-white/50 text-sm">Status</p>
              <p className="text-emerald-400 font-bold text-lg">Active</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-white/50 text-sm mb-2">A confirmation email has been sent to your registered email address.</p>
          </div>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6">Get Started</h2>

          <div className="space-y-4">
            {nextSteps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
              >
                {step.disabled ? (
                  <div className="p-5 rounded-xl bg-white/5 border border-white/10 opacity-50">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                        <step.icon className="w-6 h-6 text-white/50" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold mb-1">{step.title}</h3>
                        <p className="text-white/50 text-sm">{step.description}</p>
                      </div>
                      <span className="text-white/30 text-sm">{step.cta}</span>
                    </div>
                  </div>
                ) : (
                  <Link href={step.href}>
                    <motion.div
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                          <step.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-bold mb-1">{step.title}</h3>
                          <p className="text-white/60 text-sm">{step.description}</p>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                          {step.cta}
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Go to Dashboard Button */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="text-center"
        >
          <Link href={`/${locale}/dashboard`}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-bold text-lg"
            >
              Go to Dashboard
            </motion.button>
          </Link>
          <p className="text-white/40 text-sm mt-4">
            Explore all your premium features
          </p>
        </motion.div>
      </main>
    </div>
  );
}
