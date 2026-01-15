/**
 * Field Nine - Next-Gen Digital WOWPASS Wallet
 * NFT Badge + QR Payment Interface
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { PaymentCard } from '@/components/wallet/payment-card';
import { TopupWidget } from '@/components/wallet/topup-widget';
import { formatKRW } from '@/lib/toss/client';
import { useAuthStore } from '@/store/auth-store';
import {
  QrCode,
  BadgeCheck,
  Shield,
  Sparkles,
  CreditCard,
  ArrowRightLeft,
  Receipt,
  ChevronRight,
  Crown,
  Star,
  Zap,
} from 'lucide-react';

// NFT Badge Tiers
const NFT_TIERS = {
  tourist: {
    name: 'Tourist',
    nameKo: '여행자',
    color: 'from-slate-400 to-slate-600',
    borderColor: 'border-slate-400',
    icon: Star,
    benefits: ['기본 환전', 'QR 결제'],
  },
  silver: {
    name: 'Silver',
    nameKo: '실버',
    color: 'from-gray-300 to-gray-500',
    borderColor: 'border-gray-400',
    icon: Shield,
    benefits: ['환전 수수료 -10%', '우선 고객 지원'],
  },
  gold: {
    name: 'Gold',
    nameKo: '골드',
    color: 'from-yellow-400 to-amber-600',
    borderColor: 'border-yellow-400',
    icon: Zap,
    benefits: ['환전 수수료 -20%', 'VIP 라운지 접근'],
  },
  vip: {
    name: 'VIP',
    nameKo: 'VIP',
    color: 'from-purple-500 to-pink-500',
    borderColor: 'border-purple-400',
    icon: Crown,
    benefits: ['환전 수수료 무료', '전용 컨시어지'],
  },
};

type TierKey = keyof typeof NFT_TIERS;

export default function WalletPage() {
  const [showTopup, setShowTopup] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [userTier, setUserTier] = useState<TierKey>('tourist');
  const { wallet, userProfile, syncWalletFromDB } = useAuthStore();
  const t = useTranslations('wallet');
  const locale = useLocale();

  // Sync wallet on mount
  useEffect(() => {
    syncWalletFromDB();
  }, [syncWalletFromDB]);

  const balance = wallet?.balance || 0;
  const tierInfo = NFT_TIERS[userTier];

  // Demo card data
  const demoCard = {
    cardholderName: userProfile?.passportData?.fullName || 'Field Nine User',
    cardNumber: '**** **** **** 1234',
    expiryMonth: '12',
    expiryYear: '27',
    balance: balance,
    currency: 'KRW',
    status: 'active' as const,
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-8 sm:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-4">
            <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
            <span className="text-white/70 text-sm">Next-Gen Digital Wallet</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">
            Ghost Wallet
          </h1>
          <p className="text-lg text-white/50">
            QR 결제 · NFT 신분증 · 실시간 환전
          </p>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - NFT Badge */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <NFTBadgeCard
              tier={userTier}
              tierInfo={tierInfo}
              userName={userProfile?.passportData?.fullName || 'Guest User'}
              onUpgrade={() => {
                // Cycle through tiers for demo
                const tiers: TierKey[] = ['tourist', 'silver', 'gold', 'vip'];
                const currentIndex = tiers.indexOf(userTier);
                setUserTier(tiers[(currentIndex + 1) % tiers.length]);
              }}
            />
          </motion.div>

          {/* Center Column - Payment Card & Actions */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <PaymentCard {...demoCard} />

            {/* Quick Actions */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowQR(!showQR)}
                className="p-4 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] rounded-xl text-white font-semibold flex items-center justify-center gap-2"
              >
                <QrCode className="w-5 h-5" />
                QR 결제
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowTopup(!showTopup)}
                className="p-4 bg-white/10 border border-white/10 rounded-xl text-white font-semibold flex items-center justify-center gap-2 hover:bg-white/15 transition-colors"
              >
                <CreditCard className="w-5 h-5" />
                충전하기
              </motion.button>
            </div>

            {/* Action List */}
            <div className="mt-4 space-y-2">
              <ActionButton icon={ArrowRightLeft} label="환전하기" badge="실시간" />
              <ActionButton icon={Receipt} label="거래내역" />
              <ActionButton icon={Shield} label="보안 설정" />
            </div>
          </motion.div>

          {/* Right Column - Dynamic Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1"
          >
            <AnimatePresence mode="wait">
              {showQR ? (
                <QRPaymentPanel key="qr" onClose={() => setShowQR(false)} />
              ) : showTopup ? (
                <motion.div
                  key="topup"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <TopupWidget
                    userId={userProfile?.userId || 'demo-user'}
                    onSuccess={(amount) => {
                      syncWalletFromDB();
                      setShowTopup(false);
                    }}
                    onError={(error) => alert(`❌ ${error}`)}
                  />
                </motion.div>
              ) : (
                <WalletFeatures key="features" tier={userTier} />
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// NFT Badge Card Component
// ============================================
function NFTBadgeCard({
  tier,
  tierInfo,
  userName,
  onUpgrade,
}: {
  tier: TierKey;
  tierInfo: typeof NFT_TIERS[TierKey];
  userName: string;
  onUpgrade: () => void;
}) {
  const TierIcon = tierInfo.icon;

  return (
    <div className="relative">
      {/* Card */}
      <motion.div
        whileHover={{ rotateY: 5, rotateX: -5 }}
        transition={{ duration: 0.3 }}
        className="relative aspect-[1.2] rounded-2xl overflow-hidden cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={onUpgrade}
      >
        {/* Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${tierInfo.color}`} />

        {/* Holographic Overlay */}
        <motion.div
          animate={{
            background: [
              'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)',
              'linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.15) 20%, transparent 40%)',
              'linear-gradient(45deg, transparent 60%, rgba(255,255,255,0.15) 80%, transparent 100%)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0"
        />

        {/* Pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Content */}
        <div className="absolute inset-0 p-5 flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/60 text-xs font-medium tracking-wider">NFT PASSPORT</p>
              <p className="text-white text-lg font-bold mt-1">{tierInfo.name}</p>
            </div>
            <div className={`w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center`}>
              <TierIcon className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Chip */}
          <div className="w-12 h-9 rounded bg-gradient-to-br from-yellow-200 to-yellow-400 opacity-90" />

          {/* Footer */}
          <div>
            <p className="text-white/60 text-xs">SOULBOUND TOKEN</p>
            <p className="text-white font-bold truncate">{userName}</p>
            <div className="flex items-center gap-1 mt-1">
              <BadgeCheck className="w-4 h-4 text-white" />
              <span className="text-white/80 text-xs">Verified</span>
            </div>
          </div>
        </div>

        {/* Border Glow */}
        <div className={`absolute inset-0 rounded-2xl border-2 ${tierInfo.borderColor} opacity-50`} />
      </motion.div>

      {/* Tier Info */}
      <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white/50 text-sm">등급 혜택</span>
          <span className="text-xs text-[#8B5CF6]">탭하여 변경</span>
        </div>
        <div className="space-y-2">
          {tierInfo.benefits.map((benefit, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-white/80">
              <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
              {benefit}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// QR Payment Panel
// ============================================
function QRPaymentPanel({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-[#12121A] rounded-2xl border border-white/10 overflow-hidden"
    >
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">QR 결제</h3>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        <p className="text-sm text-white/50 mt-1">매장 QR을 스캔하세요</p>
      </div>

      <div className="p-8 flex flex-col items-center">
        {/* QR Scanner Frame */}
        <div className="relative w-48 h-48 mb-6">
          <div className="absolute inset-0 border-2 border-white/20 rounded-2xl">
            {/* Corner Accents */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-[#3B82F6] rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-[#3B82F6] rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-[#3B82F6] rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-[#3B82F6] rounded-br-lg" />
          </div>

          {/* Scan Line Animation */}
          <motion.div
            animate={{ y: [0, 176, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-2 left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent"
          />

          {/* QR Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <QrCode className="w-20 h-20 text-white/20" />
          </div>
        </div>

        <p className="text-white/50 text-sm text-center mb-6">
          카메라를 매장 QR코드에 맞춰주세요
        </p>

        <button className="w-full py-4 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-xl font-semibold">
          카메라 열기
        </button>
      </div>
    </motion.div>
  );
}

// ============================================
// Wallet Features Panel
// ============================================
function WalletFeatures({ tier }: { tier: TierKey }) {
  const features = [
    {
      icon: '💳',
      title: '가상 카드',
      desc: '온라인 결제용 카드를 무제한으로',
    },
    {
      icon: '🔒',
      title: '생체 인증',
      desc: 'Face ID / Touch ID로 안전하게',
    },
    {
      icon: '⚡',
      title: '즉시 충전',
      desc: '카드, 계좌이체, 간편결제',
    },
    {
      icon: '🇰🇷',
      title: '한국 결제',
      desc: '토스페이, 카카오페이, 네이버페이',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-[#12121A] rounded-2xl border border-white/10 p-6"
    >
      <h3 className="text-lg font-bold text-white mb-6">지갑 기능</h3>

      <div className="space-y-4">
        {features.map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="text-3xl">{feature.icon}</div>
            <div className="flex-1">
              <h4 className="font-semibold text-white">{feature.title}</h4>
              <p className="text-sm text-white/50">{feature.desc}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/30" />
          </motion.div>
        ))}
      </div>

      {/* Payment Methods */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <p className="text-xs text-white/40 mb-3">지원 결제 수단</p>
        <div className="flex flex-wrap gap-2">
          {['신용카드', '체크카드', '토스페이', '카카오페이', '네이버페이'].map((method) => (
            <span
              key={method}
              className="px-3 py-1.5 bg-white/5 rounded-lg text-xs text-white/60"
            >
              {method}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// Action Button Component
// ============================================
function ActionButton({
  icon: Icon,
  label,
  badge,
}: {
  icon: typeof Shield;
  label: string;
  badge?: string;
}) {
  return (
    <motion.button
      whileHover={{ x: 4 }}
      className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-white/50" />
        <span className="text-white font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="px-2 py-0.5 bg-[#8B5CF6]/20 text-[#8B5CF6] text-xs rounded-full">
            {badge}
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-white/30" />
      </div>
    </motion.button>
  );
}
