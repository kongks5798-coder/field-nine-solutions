/**
 * K-UNIVERSAL Super App Dashboard
 * Tesla-Style Minimal Design - Warm Ivory & Deep Black
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  MessageCircle,
  Wallet,
  QrCode,
  User,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Plane,
  Hotel,
  X,
  Crown,
  ArrowUpRight,
  Zap,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { NotificationCenter } from '@/components/ui/notification-center';
import { OnboardingTutorial } from '@/components/ui/onboarding-tutorial';
import { PushNotificationPrompt } from '@/components/ui/push-notification-prompt';
import { ProductHuntBanner } from '@/components/ui/product-hunt-banner';
import { SUBSCRIPTION_PLANS, PlanId } from '@/lib/config/brand';

// ============================================
// Tesla Design System Colors
// ============================================
const tesla = {
  bg: {
    primary: '#F9F9F7',      // Warm Ivory
    secondary: '#FFFFFF',    // Pure White
    tertiary: '#F5F5F4',     // Light Gray
    inverse: '#171717',      // Deep Black
  },
  text: {
    primary: '#171717',
    secondary: 'rgba(23, 23, 23, 0.7)',
    muted: 'rgba(23, 23, 23, 0.4)',
    inverse: '#FFFFFF',
  },
  border: {
    light: 'rgba(23, 23, 23, 0.1)',
    medium: 'rgba(23, 23, 23, 0.2)',
  },
  accent: {
    naver: '#03C75A',
    success: '#22C55E',
  },
};

// ============================================
// Subscription Types
// ============================================
interface SubscriptionData {
  planId: PlanId;
  plan: typeof SUBSCRIPTION_PLANS[PlanId];
  status: string;
  usage: {
    aiChatsUsed: number;
    aiChatsLimit: number;
    esimDataUsedMB: number;
    esimDataLimitMB: number;
  };
}

// ============================================
// Exchange Rate Types
// ============================================
interface ExchangeRates {
  USD: number;
  JPY: number;
  CNY: number;
}

// ============================================
// Animation Variants
// ============================================
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
};

// ============================================
// Service Data (MVP: VIBE-ID, 호텔, 항공, 환전)
// ============================================
const mainServices = [
  {
    id: 'vibe',
    icon: Sparkles,
    title: 'VIBE-ID',
    titleKo: '내 여행 분위기',
    description: 'AI 셀피 분석',
    href: '/dashboard/vibe',
    badge: 'AI',
  },
  {
    id: 'hotels',
    icon: Hotel,
    title: '호텔 예약',
    titleKo: '호텔 예약',
    description: '최저가 호텔 검색',
    href: '/dashboard/hotels',
    badge: 'Hot',
  },
  {
    id: 'flights',
    icon: Plane,
    title: '항공권',
    titleKo: '항공권 예약',
    description: '국내/국제선 검색',
    href: '/dashboard/flights',
    badge: 'New',
  },
  {
    id: 'exchange',
    icon: TrendingUp,
    title: '환전',
    titleKo: '환전/송금',
    description: '실시간 최저 환율',
    href: '/dashboard/exchange',
    badge: 'Live',
  },
];

// ============================================
// Main Dashboard Component
// ============================================
export default function DashboardPage() {
  const locale = useLocale();
  const router = useRouter();
  const { wallet, userProfile, isAuthenticated, user, logout } = useAuthStore();
  const [showConcierge, setShowConcierge] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({ USD: 1320, JPY: 8.9, CNY: 182 });
  const [isLiveRates, setIsLiveRates] = useState(false);

  // 로그아웃 핸들러
  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      logout();
      router.push(`/${locale}/auth/login`);
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // Fetch exchange rates with auto-refresh
  useEffect(() => {
    async function fetchRates() {
      try {
        const response = await fetch('/api/v1/exchange/rates');
        const data = await response.json();
        if (data.success && data.rates) {
          setExchangeRates({
            USD: data.rates.USD || 1320,
            JPY: data.rates.JPY || 8.9,
            CNY: data.rates.CNY || 182,
          });
          setIsLiveRates(!data.fallback);
        }
      } catch {
        // Keep default rates on error
      }
    }
    fetchRates();
    const interval = setInterval(fetchRates, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch subscription data
  useEffect(() => {
    async function fetchSubscription() {
      if (!isAuthenticated) {
        setLoadingSubscription(false);
        return;
      }

      try {
        const response = await fetch('/api/subscription');
        const data = await response.json();
        if (data.success && data.subscription) {
          setSubscription(data.subscription);
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      } finally {
        setLoadingSubscription(false);
      }
    }
    fetchSubscription();
  }, [isAuthenticated]);

  // Handle billing portal
  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'portal' }),
      });
      const data = await response.json();
      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      }
    } catch (error) {
      console.error('Failed to open billing portal:', error);
    }
  };

  const balance = wallet?.balance || 0;
  const userName =
    userProfile?.passportData?.fullName?.split(' ')[0] ||
    userProfile?.name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Guest';

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      {/* Header - Tesla Style */}
      <header className="sticky top-0 z-40 bg-[#F9F9F7]/80 backdrop-blur-xl border-b border-neutral-900/10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-neutral-900/40 text-xs">{greeting}</p>
            <h1 className="text-neutral-900 font-bold text-lg">{userName} 님</h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter />
            <Link href={`/${locale}/kyc`}>
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="w-9 h-9 rounded-full bg-neutral-900 flex items-center justify-center"
              >
                <User className="w-5 h-5 text-white" />
              </motion.div>
            </Link>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="w-9 h-9 rounded-full bg-neutral-900/10 flex items-center justify-center hover:bg-red-500/20 transition-colors"
              title="로그아웃"
            >
              <LogOut className="w-4 h-4 text-neutral-900/70" />
            </motion.button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-24">
        {/* Wallet Card - Tesla Style */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mt-4"
        >
          <Link href={`/${locale}/wallet`}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden rounded-2xl bg-neutral-900 p-5"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white/70 text-sm font-medium">Ghost Wallet</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/40" />
                </div>

                <div className="mb-4">
                  <p className="text-white/50 text-xs mb-1">Available Balance</p>
                  <p className="text-3xl font-bold text-white">
                    ₩{balance.toLocaleString()}
                  </p>
                  <p className="text-white/40 text-sm">
                    ≈ ${(balance / 1320).toFixed(2)} USD
                  </p>
                </div>

                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 py-2.5 bg-white/10 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    QR 결제
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 py-2.5 bg-white rounded-xl text-neutral-900 text-sm font-medium"
                  >
                    충전하기
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </Link>
        </motion.section>

        {/* Subscription Status Card - Tesla Style */}
        {isAuthenticated && (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="mt-4"
          >
            {loadingSubscription ? (
              <div className="rounded-2xl bg-white border border-neutral-900/10 p-5 animate-pulse">
                <div className="h-4 bg-neutral-900/10 rounded w-1/3 mb-3" />
                <div className="h-6 bg-neutral-900/10 rounded w-1/2 mb-4" />
                <div className="h-2 bg-neutral-900/10 rounded w-full" />
              </div>
            ) : subscription ? (
              <motion.div
                whileHover={{ scale: 1.01 }}
                className={`relative overflow-hidden rounded-2xl p-5 border ${
                  subscription.planId === 'free'
                    ? 'bg-white border-neutral-900/10'
                    : 'bg-white border-[#03C75A]/30'
                }`}
              >
                <div className="relative z-10">
                  {/* Plan header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        subscription.planId === 'free'
                          ? 'bg-neutral-900/10'
                          : 'bg-[#03C75A]'
                      }`}>
                        {subscription.planId === 'free' ? (
                          <Zap className="w-4 h-4 text-neutral-900/70" />
                        ) : (
                          <Crown className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div>
                        <span className={`text-sm font-bold ${
                          subscription.planId === 'free' ? 'text-neutral-900/70' : 'text-[#03C75A]'
                        }`}>
                          NOMAD {subscription.plan.name}
                        </span>
                        <p className="text-neutral-900/40 text-xs">
                          {subscription.status === 'active' ? 'Active' : subscription.status}
                        </p>
                      </div>
                    </div>
                    {subscription.planId === 'free' ? (
                      <Link href={`/${locale}/pricing`}>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          className="px-3 py-1.5 bg-neutral-900 rounded-lg text-white text-xs font-bold flex items-center gap-1"
                        >
                          Upgrade
                          <ArrowUpRight className="w-3 h-3" />
                        </motion.button>
                      </Link>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleManageSubscription}
                        className="px-3 py-1.5 bg-neutral-900/10 hover:bg-neutral-900/20 rounded-lg text-neutral-900 text-xs font-medium transition-colors"
                      >
                        Manage
                      </motion.button>
                    )}
                  </div>

                  {/* Usage stats */}
                  <div className="p-3 rounded-xl bg-neutral-900/5">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="w-4 h-4 text-neutral-900" />
                      <span className="text-neutral-900/60 text-xs">AI Concierge</span>
                    </div>
                    <p className="text-neutral-900 font-bold">
                      {subscription.usage.aiChatsLimit === -1 ? (
                        <span className="text-[#03C75A]">Unlimited</span>
                      ) : (
                        <>
                          {subscription.usage.aiChatsUsed}
                          <span className="text-neutral-900/40 font-normal">/{subscription.usage.aiChatsLimit} chats</span>
                        </>
                      )}
                    </p>
                    {subscription.usage.aiChatsLimit !== -1 && (
                      <div className="mt-2 h-1.5 bg-neutral-900/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-neutral-900 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (subscription.usage.aiChatsUsed / subscription.usage.aiChatsLimit) * 100)}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : null}
          </motion.section>
        )}

        {/* Live Exchange Rates Widget - Tesla Style */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mt-4"
        >
          <Link href={`/${locale}/dashboard/exchange`}>
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="p-4 rounded-2xl bg-white border border-neutral-900/10 hover:border-neutral-900/20 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-neutral-900" />
                  <span className="text-neutral-900/70 text-sm font-medium">
                    {locale === 'ko' ? '실시간 환율' : 'Live Rates'}
                  </span>
                  {isLiveRates && (
                    <span className="w-2 h-2 bg-[#03C75A] rounded-full animate-pulse" />
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-900/40" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-neutral-900/40 text-xs mb-1">🇺🇸 USD</p>
                  <p className="text-neutral-900 font-bold text-sm">₩{exchangeRates.USD.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="text-center">
                  <p className="text-neutral-900/40 text-xs mb-1">🇯🇵 JPY</p>
                  <p className="text-neutral-900 font-bold text-sm">₩{exchangeRates.JPY.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-neutral-900/40 text-xs mb-1">🇨🇳 CNY</p>
                  <p className="text-neutral-900 font-bold text-sm">₩{exchangeRates.CNY.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}</p>
                </div>
              </div>
            </motion.div>
          </Link>
        </motion.section>

        {/* Main Services Grid - Tesla Style */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mt-6"
        >
          <h2 className="text-neutral-900 font-bold text-lg mb-4">K-Lifestyle Services</h2>
          <div className="grid grid-cols-2 gap-3">
            {mainServices.map((service) => (
              <motion.div key={service.id} variants={scaleIn}>
                <Link href={`/${locale}${service.href}`}>
                  <motion.div
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="relative overflow-hidden rounded-2xl bg-white border border-neutral-900/10 p-4 h-[140px] flex flex-col justify-between group hover:border-neutral-900/20 transition-colors"
                  >
                    {/* Badge */}
                    {service.badge && (
                      <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        service.badge === 'New' ? 'bg-neutral-900 text-white' :
                        service.badge === 'AI' ? 'bg-neutral-900 text-white' :
                        service.badge === 'Hot' ? 'bg-[#03C75A] text-white' :
                        'bg-neutral-900 text-white'
                      }`}>
                        {service.badge}
                      </span>
                    )}

                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-neutral-900 flex items-center justify-center">
                      <service.icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Text */}
                    <div>
                      <h3 className="text-neutral-900 font-bold text-base">{service.title}</h3>
                      <p className="text-neutral-900/40 text-xs">{service.description}</p>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Recent Activity - Tesla Style */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mt-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-neutral-900 font-bold text-lg">Recent Activity</h2>
            <Link href={`/${locale}/dashboard/orders`} className="text-neutral-900/70 text-sm hover:underline">
              View All
            </Link>
          </div>

          {/* Empty State */}
          <div className="bg-white rounded-2xl border border-neutral-900/10 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-900/5 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-neutral-900/20" />
            </div>
            <h3 className="text-neutral-900 font-semibold mb-2">여행을 시작하세요!</h3>
            <p className="text-neutral-900/40 text-sm mb-4">
              호텔 예약, 항공권, 환전 - 최고의 조건으로 준비하세요
            </p>
            <Link href={`/${locale}/dashboard/hotels`}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-2.5 bg-neutral-900 rounded-xl text-white text-sm font-medium"
              >
                호텔 검색하기
              </motion.button>
            </Link>
          </div>
        </motion.section>

        {/* Premium Travel Banner - Tesla Style */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mt-6"
        >
          <div className="relative overflow-hidden rounded-2xl bg-neutral-900 p-5">
            <div className="relative z-10">
              <span className="text-white/60 text-xs font-medium">Premium Service</span>
              <h3 className="text-white font-bold text-lg mt-1">여행 준비, 한 곳에서</h3>
              <p className="text-white/60 text-sm mt-1">호텔 · 항공 · 환전 최저가 보장</p>
              <Link href={`/${locale}/dashboard/hotels`}>
                <button className="mt-3 px-4 py-2 bg-white text-neutral-900 rounded-lg text-sm font-bold">
                  시작하기
                </button>
              </Link>
            </div>
            <div className="absolute -right-4 -bottom-4 text-8xl opacity-20">✈️</div>
          </div>
        </motion.section>
      </main>

      {/* Floating AI Concierge Button - Tesla Style */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowConcierge(true)}
        className="fixed bottom-24 md:bottom-6 right-4 md:right-6 w-14 h-14 rounded-full bg-neutral-900 shadow-lg shadow-neutral-900/20 flex items-center justify-center z-40"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </motion.button>

      {/* AI Concierge Modal */}
      <AnimatePresence>
        {showConcierge && (
          <AIConciergeModal onClose={() => setShowConcierge(false)} />
        )}
      </AnimatePresence>

      {/* Onboarding Tutorial for New Users */}
      <OnboardingTutorial locale={locale} />

      {/* Push Notification Prompt */}
      <PushNotificationPrompt locale={locale} />

      {/* Product Hunt Launch Banner */}
      <ProductHuntBanner variant="floating" locale={locale} />
    </div>
  );
}

// ============================================
// AI Concierge Modal Component - Tesla Style
// ============================================
function AIConciergeModal({ onClose }: { onClose: () => void }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([
    { role: 'ai', content: '안녕하세요! 👋 무엇을 도와드릴까요?\n\nHello! How can I help you today?' },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    setMessage('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/ai/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          messages: [{ role: 'user', content: userMessage }],
        }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'ai', content: data.message || data.response?.message || '죄송합니다. 다시 시도해주세요.' }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', content: '네트워크 오류가 발생했습니다.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="relative w-full sm:max-w-md h-[80vh] sm:h-[600px] bg-white rounded-t-3xl sm:rounded-3xl border border-neutral-900/10 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-900/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-neutral-900 font-bold">AI Concierge</h3>
              <p className="text-neutral-900/50 text-xs">Always here to help</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-900/10 flex items-center justify-center hover:bg-neutral-900/20 transition-colors"
          >
            <X className="w-4 h-4 text-neutral-900" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F9F9F7]">
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white border border-neutral-900/10 text-neutral-900'
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-neutral-900/10 px-4 py-3 rounded-2xl">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-neutral-900/50 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-neutral-900/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <span className="w-2 h-2 bg-neutral-900/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-neutral-900/10 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-4 py-3 bg-[#F9F9F7] border border-neutral-900/10 rounded-xl text-neutral-900 placeholder-neutral-900/30 focus:outline-none focus:border-neutral-900"
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={sendMessage}
              disabled={isLoading}
              className="px-4 py-3 bg-neutral-900 rounded-xl text-white font-medium disabled:opacity-50"
            >
              전송
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
