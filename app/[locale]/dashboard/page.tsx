/**
 * K-UNIVERSAL Super App Dashboard
 * WeChat-style service hub for foreigners in Korea
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  Car,
  UtensilsCrossed,
  ShoppingBag,
  MessageCircle,
  Wallet,
  QrCode,
  Bell,
  User,
  ChevronRight,
  Sparkles,
  MapPin,
  Clock,
  Star,
  TrendingUp,
  Gift,
  Ticket,
  Train,
  Plane,
  Hotel,
  Camera,
  Heart,
  X,
  Crown,
  Wifi,
  ArrowUpRight,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { SUBSCRIPTION_PLANS, PlanId } from '@/lib/config/brand';

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
// Service Data
// ============================================
const mainServices = [
  {
    id: 'taxi',
    icon: Car,
    title: 'K-Taxi',
    titleKo: '택시 호출',
    description: '목적지만 말하세요',
    gradient: 'from-yellow-400 to-orange-500',
    href: '/dashboard/taxi',
    badge: 'Popular',
  },
  {
    id: 'food',
    icon: UtensilsCrossed,
    title: 'K-Food',
    titleKo: '배달 주문',
    description: '치킨, 짜장면 배달',
    gradient: 'from-red-400 to-pink-500',
    href: '/dashboard/food',
    badge: 'New',
  },
  {
    id: 'shopping',
    icon: ShoppingBag,
    title: 'K-Shopping',
    titleKo: '쇼핑',
    description: '면세점 & 로컬샵',
    gradient: 'from-purple-400 to-indigo-500',
    href: '/dashboard/shopping',
  },
  {
    id: 'concierge',
    icon: MessageCircle,
    title: 'AI Concierge',
    titleKo: 'AI 컨시어지',
    description: '무엇이든 물어보세요',
    gradient: 'from-cyan-400 to-blue-500',
    href: '/dashboard/concierge',
    badge: 'AI',
  },
];

const quickServices = [
  { icon: Train, title: 'KTX', href: '/dashboard/ktx' },
  { icon: Plane, title: '공항', href: '/dashboard/airport' },
  { icon: Hotel, title: '호텔', href: '/dashboard/hotels' },
  { icon: Ticket, title: '공연', href: '/dashboard/events' },
  { icon: Camera, title: '관광', href: '/dashboard/attractions' },
  { icon: Gift, title: '선물', href: '/dashboard/shopping' },
  { icon: Heart, title: '찜', href: '#' },
  { icon: TrendingUp, title: '환율', href: '/dashboard/exchange' },
];

// ============================================
// Main Dashboard Component
// ============================================
export default function DashboardPage() {
  const locale = useLocale();
  const { wallet, userProfile, isAuthenticated } = useAuthStore();
  const [showConcierge, setShowConcierge] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
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
  const userName = userProfile?.passportData?.fullName?.split(' ')[0] || 'Guest';

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-white/50 text-xs">{greeting}</p>
            <h1 className="text-white font-bold text-lg">{userName} 👋</h1>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="relative p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <Bell className="w-5 h-5 text-white/70" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </motion.button>
            <Link href={`/${locale}/kyc`}>
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center"
              >
                <User className="w-5 h-5 text-white" />
              </motion.div>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-24">
        {/* Wallet Card */}
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
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-5 border border-white/10"
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#3B82F6] rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#8B5CF6] rounded-full blur-3xl" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center">
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
                    className="flex-1 py-2.5 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] rounded-xl text-white text-sm font-medium"
                  >
                    충전하기
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </Link>
        </motion.section>

        {/* Subscription Status Card */}
        {isAuthenticated && (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="mt-4"
          >
            {loadingSubscription ? (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-5 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
                <div className="h-6 bg-white/10 rounded w-1/2 mb-4" />
                <div className="h-2 bg-white/10 rounded w-full" />
              </div>
            ) : subscription ? (
              <motion.div
                whileHover={{ scale: 1.01 }}
                className={`relative overflow-hidden rounded-2xl p-5 border ${
                  subscription.planId === 'free'
                    ? 'bg-white/5 border-white/10'
                    : 'bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/30'
                }`}
              >
                {/* Background decoration for paid plans */}
                {subscription.planId !== 'free' && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-3xl opacity-10" />
                )}

                <div className="relative z-10">
                  {/* Plan header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        subscription.planId === 'free'
                          ? 'bg-white/10'
                          : 'bg-gradient-to-br from-emerald-500 to-cyan-500'
                      }`}>
                        {subscription.planId === 'free' ? (
                          <Zap className="w-4 h-4 text-white/70" />
                        ) : (
                          <Crown className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div>
                        <span className={`text-sm font-bold ${
                          subscription.planId === 'free' ? 'text-white/70' : 'text-emerald-400'
                        }`}>
                          NOMAD {subscription.plan.name}
                        </span>
                        <p className="text-white/40 text-xs">
                          {subscription.status === 'active' ? 'Active' : subscription.status}
                        </p>
                      </div>
                    </div>
                    {subscription.planId === 'free' ? (
                      <Link href={`/${locale}/pricing`}>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg text-white text-xs font-bold flex items-center gap-1"
                        >
                          Upgrade
                          <ArrowUpRight className="w-3 h-3" />
                        </motion.button>
                      </Link>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleManageSubscription}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs font-medium transition-colors"
                      >
                        Manage
                      </motion.button>
                    )}
                  </div>

                  {/* Usage stats */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* AI Chats */}
                    <div className="p-3 rounded-xl bg-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageCircle className="w-4 h-4 text-cyan-400" />
                        <span className="text-white/60 text-xs">AI Chats</span>
                      </div>
                      <p className="text-white font-bold">
                        {subscription.usage.aiChatsLimit === -1 ? (
                          <span className="text-emerald-400">Unlimited</span>
                        ) : (
                          <>
                            {subscription.usage.aiChatsUsed}
                            <span className="text-white/40 font-normal">/{subscription.usage.aiChatsLimit}</span>
                          </>
                        )}
                      </p>
                      {subscription.usage.aiChatsLimit !== -1 && (
                        <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-500 rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, (subscription.usage.aiChatsUsed / subscription.usage.aiChatsLimit) * 100)}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* eSIM Data */}
                    <div className="p-3 rounded-xl bg-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Wifi className="w-4 h-4 text-emerald-400" />
                        <span className="text-white/60 text-xs">eSIM Data</span>
                      </div>
                      <p className="text-white font-bold">
                        {subscription.usage.esimDataLimitMB === -1 ? (
                          <span className="text-emerald-400">Unlimited</span>
                        ) : subscription.usage.esimDataLimitMB === 0 ? (
                          <span className="text-white/40">Not included</span>
                        ) : (
                          <>
                            {(subscription.usage.esimDataUsedMB / 1024).toFixed(1)}GB
                            <span className="text-white/40 font-normal">/{(subscription.usage.esimDataLimitMB / 1024).toFixed(0)}GB</span>
                          </>
                        )}
                      </p>
                      {subscription.usage.esimDataLimitMB > 0 && subscription.usage.esimDataLimitMB !== -1 && (
                        <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, (subscription.usage.esimDataUsedMB / subscription.usage.esimDataLimitMB) * 100)}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </motion.section>
        )}

        {/* Main Services Grid */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mt-6"
        >
          <h2 className="text-white font-bold text-lg mb-4">K-Lifestyle Services</h2>
          <div className="grid grid-cols-2 gap-3">
            {mainServices.map((service) => (
              <motion.div key={service.id} variants={scaleIn}>
                <Link href={`/${locale}${service.href}`}>
                  <motion.div
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="relative overflow-hidden rounded-2xl bg-[#12121A] border border-white/5 p-4 h-[140px] flex flex-col justify-between group"
                  >
                    {/* Gradient Background on Hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                    {/* Badge */}
                    {service.badge && (
                      <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        service.badge === 'New' ? 'bg-red-500 text-white' :
                        service.badge === 'AI' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' :
                        'bg-yellow-500 text-black'
                      }`}>
                        {service.badge}
                      </span>
                    )}

                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.gradient} flex items-center justify-center`}>
                      <service.icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Text */}
                    <div>
                      <h3 className="text-white font-bold text-base">{service.title}</h3>
                      <p className="text-white/40 text-xs">{service.description}</p>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Quick Services */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mt-6"
        >
          <h2 className="text-white font-bold text-lg mb-4">Quick Access</h2>
          <div className="grid grid-cols-4 gap-3">
            {quickServices.map((service, idx) => (
              <Link
                key={idx}
                href={service.href === '#' ? '#' : `/${locale}${service.href}`}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <service.icon className="w-5 h-5 text-white/70" />
                  </div>
                  <span className="text-white/60 text-xs">{service.title}</span>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.section>

        {/* Recent Activity */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mt-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg">Recent Activity</h2>
            <button className="text-[#3B82F6] text-sm">View All</button>
          </div>

          {/* Empty State */}
          <div className="bg-[#12121A] rounded-2xl border border-white/5 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="text-white font-semibold mb-2">첫 주문을 해보세요!</h3>
            <p className="text-white/40 text-sm mb-4">
              택시, 배달, 쇼핑 - 한국의 모든 것을 경험하세요
            </p>
            <Link href={`/${locale}/dashboard/food`}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-2.5 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] rounded-xl text-white text-sm font-medium"
              >
                K-Food 둘러보기
              </motion.button>
            </Link>
          </div>
        </motion.section>

        {/* Promotional Banner */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mt-6"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] p-5">
            <div className="relative z-10">
              <span className="text-white/80 text-xs font-medium">Limited Offer</span>
              <h3 className="text-white font-bold text-lg mt-1">첫 택시 50% 할인!</h3>
              <p className="text-white/80 text-sm mt-1">최대 ₩5,000 할인</p>
              <button className="mt-3 px-4 py-2 bg-white text-[#FF6B6B] rounded-lg text-sm font-bold">
                쿠폰 받기
              </button>
            </div>
            <div className="absolute -right-4 -bottom-4 text-8xl opacity-20">🚕</div>
          </div>
        </motion.section>
      </main>

      {/* Floating AI Concierge Button - Adjusted for bottom nav on mobile */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowConcierge(true)}
        className="fixed bottom-24 md:bottom-6 right-4 md:right-6 w-14 h-14 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] shadow-lg shadow-purple-500/30 flex items-center justify-center z-40"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </motion.button>

      {/* AI Concierge Modal */}
      <AnimatePresence>
        {showConcierge && (
          <AIConciergeModal onClose={() => setShowConcierge(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// AI Concierge Modal Component
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
      const response = await fetch('/api/ai-concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'ai', content: data.answer || '죄송합니다. 다시 시도해주세요.' }]);
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
        className="relative w-full sm:max-w-md h-[80vh] sm:h-[600px] bg-[#12121A] rounded-t-3xl sm:rounded-3xl border border-white/10 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold">AI Concierge</h3>
              <p className="text-white/50 text-xs">Always here to help</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                    ? 'bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white'
                    : 'bg-white/10 text-white'
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/10 px-4 py-3 rounded-2xl">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#3B82F6]"
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={sendMessage}
              disabled={isLoading}
              className="px-4 py-3 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] rounded-xl text-white font-medium disabled:opacity-50"
            >
              전송
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
