/**
 * One-Page Checkout Component
 * Tesla-style minimalist checkout with Naver price matching
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  CreditCard,
  Wallet,
  Lock,
  ChevronRight,
  Check,
  Calendar,
  Users,
  Building2,
} from 'lucide-react';
import { NaverPriceBadgeLarge } from '@/components/hotels/naver-price-badge';

// ============================================
// Types
// ============================================

interface BookingItem {
  type: 'hotel' | 'flight';
  id: string;
  name: string;
  details: {
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    rooms?: number;
    nights?: number;
  };
  price: {
    base: number;
    markup: number;
    total: number;
    currency: string;
    naverMatched?: boolean;
  };
  shadowPricing?: {
    finalPrice: number;
    naverPrice: number;
    priceSource: string;
    naverProvider?: string;
  } | null;
}

interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface PaymentMethod {
  id: 'ghost_wallet' | 'card' | 'paypal';
  name: string;
  icon: typeof Wallet;
  description: string;
}

interface OnePageCheckoutProps {
  item: BookingItem;
  onComplete: (bookingId: string) => void;
  onCancel: () => void;
}

// ============================================
// Constants
// ============================================

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'ghost_wallet',
    name: 'Ghost Wallet',
    icon: Wallet,
    description: '잔액: ₩2,450,000',
  },
  {
    id: 'card',
    name: '신용/체크카드',
    icon: CreditCard,
    description: 'Visa, Mastercard, Amex',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: CreditCard,
    description: '페이팔 계정 결제',
  },
];

// ============================================
// Helper Functions
// ============================================

const formatPrice = (amount: number, currency: string = 'KRW') => {
  if (currency === 'KRW') {
    return `₩${Math.round(amount).toLocaleString('ko-KR')}`;
  }
  return `$${amount.toLocaleString('en-US')}`;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
};

// ============================================
// Component
// ============================================

export default function OnePageCheckout({
  item,
  onComplete,
  onCancel,
}: OnePageCheckoutProps) {
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod['id']>('ghost_wallet');
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const isFormValid =
    guestInfo.firstName &&
    guestInfo.lastName &&
    guestInfo.email &&
    guestInfo.phone &&
    agreedToTerms;

  const handleSubmit = async () => {
    if (!isFormValid) return;

    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate booking ID
      const bookingId = `KU-${Date.now().toString(36).toUpperCase()}`;

      // In production, call payment API here
      onComplete(bookingId);
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      {/* Sticky Header with Hotel Info */}
      <div className="sticky top-0 z-40 bg-white border-b border-[#171717]/5">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
              <Image
                src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80"
                alt={item.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-[#171717] text-lg truncate">
                {item.name}
              </h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-[#171717]/50">
                {item.details.checkIn && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(item.details.checkIn)}
                  </span>
                )}
                {item.details.nights && (
                  <span>{item.details.nights}박</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-32">
        {/* Guest Information */}
        <section className="bg-white rounded-2xl p-6 border border-[#171717]/5 mb-4">
          <h2 className="font-semibold text-[#171717] text-lg mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-[#171717]/40" />
            투숙객 정보
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-[#171717]/60 mb-2">성 (영문)</label>
              <input
                type="text"
                value={guestInfo.lastName}
                onChange={(e) => setGuestInfo({ ...guestInfo, lastName: e.target.value })}
                placeholder="HONG"
                className="w-full px-4 py-3 bg-[#F9F9F7] border border-[#171717]/10 rounded-xl text-[#171717] placeholder:text-[#171717]/30 focus:outline-none focus:border-[#171717]/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-[#171717]/60 mb-2">이름 (영문)</label>
              <input
                type="text"
                value={guestInfo.firstName}
                onChange={(e) => setGuestInfo({ ...guestInfo, firstName: e.target.value })}
                placeholder="GILDONG"
                className="w-full px-4 py-3 bg-[#F9F9F7] border border-[#171717]/10 rounded-xl text-[#171717] placeholder:text-[#171717]/30 focus:outline-none focus:border-[#171717]/30 transition-all"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#171717]/60 mb-2">이메일</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#171717]/30" />
                <input
                  type="email"
                  value={guestInfo.email}
                  onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                  placeholder="hong@example.com"
                  className="w-full pl-12 pr-4 py-3 bg-[#F9F9F7] border border-[#171717]/10 rounded-xl text-[#171717] placeholder:text-[#171717]/30 focus:outline-none focus:border-[#171717]/30 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#171717]/60 mb-2">연락처</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#171717]/30" />
                <input
                  type="tel"
                  value={guestInfo.phone}
                  onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                  placeholder="010-1234-5678"
                  className="w-full pl-12 pr-4 py-3 bg-[#F9F9F7] border border-[#171717]/10 rounded-xl text-[#171717] placeholder:text-[#171717]/30 focus:outline-none focus:border-[#171717]/30 transition-all"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Payment Method */}
        <section className="bg-white rounded-2xl p-6 border border-[#171717]/5 mb-4">
          <h2 className="font-semibold text-[#171717] text-lg mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#171717]/40" />
            결제 방법
          </h2>

          <div className="space-y-3">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedPayment === method.id;

              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedPayment(method.id)}
                  className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all ${
                    isSelected
                      ? 'border-[#171717] bg-[#171717]/5'
                      : 'border-[#171717]/10 hover:border-[#171717]/20'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-[#171717]' : 'bg-[#F9F9F7]'
                  }`}>
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-[#171717]/40'}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`font-medium ${isSelected ? 'text-[#171717]' : 'text-[#171717]/70'}`}>
                      {method.name}
                    </p>
                    <p className="text-sm text-[#171717]/40">{method.description}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-[#171717] bg-[#171717]' : 'border-[#171717]/20'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Price Breakdown */}
        <section className="bg-white rounded-2xl p-6 border border-[#171717]/5 mb-4">
          <h2 className="font-semibold text-[#171717] text-lg mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#171717]/40" />
            결제 금액
          </h2>

          {/* Naver Price Badge */}
          {item.price.naverMatched && (
            <div className="mb-4">
              <NaverPriceBadgeLarge
                price={formatPrice(item.price.total, item.price.currency)}
                isMatched={true}
              />
            </div>
          )}

          {/* Price Details */}
          <div className="space-y-3 py-4 border-t border-[#171717]/5">
            <div className="flex justify-between text-sm">
              <span className="text-[#171717]/60">객실 요금 ({item.details.nights}박)</span>
              <span className="text-[#171717]">
                {formatPrice(item.price.total, item.price.currency)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#171717]/60">세금 및 수수료</span>
              <span className="text-[#171717]">포함</span>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center pt-4 border-t border-[#171717]/5">
            <span className="font-semibold text-[#171717]">총 결제 금액</span>
            <span className="font-bold text-2xl text-[#171717]">
              {formatPrice(item.price.total, item.price.currency)}
            </span>
          </div>

          {/* Naver Price Note */}
          {item.price.naverMatched && (
            <p className="mt-3 text-xs text-[#171717]/40 text-center">
              네이버 실시간 최저가와 100% 동일합니다
            </p>
          )}
        </section>

        {/* Terms Agreement */}
        <div className="mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <div
              onClick={() => setAgreedToTerms(!agreedToTerms)}
              className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                agreedToTerms
                  ? 'bg-[#171717] border-[#171717]'
                  : 'border-[#171717]/20'
              }`}
            >
              {agreedToTerms && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="text-sm text-[#171717]/60">
              <span className="text-[#171717] underline">이용약관</span> 및{' '}
              <span className="text-[#171717] underline">개인정보 처리방침</span>에 동의합니다.
              예약 확정 시 취소 및 환불 규정이 적용됩니다.
            </span>
          </label>
        </div>
      </main>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#171717]/5 p-4 z-50">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-[#171717]/40">총 결제 금액</p>
              <p className="font-bold text-xl text-[#171717]">
                {formatPrice(item.price.total, item.price.currency)}
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={!isFormValid || isProcessing}
              className={`px-8 py-4 rounded-xl font-medium flex items-center gap-2 transition-colors ${
                isFormValid && !isProcessing
                  ? 'bg-[#171717] text-white hover:bg-[#171717]/90'
                  : 'bg-[#171717]/20 text-[#171717]/40 cursor-not-allowed'
              }`}
            >
              <Lock className="w-4 h-4" />
              {isProcessing ? '결제 처리 중...' : '결제하기'}
              {!isProcessing && <ChevronRight className="w-4 h-4" />}
            </motion.button>
          </div>
          <p className="text-xs text-[#171717]/30 text-center flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" />
            안전한 SSL 암호화 결제
          </p>
        </div>
      </div>
    </div>
  );
}
