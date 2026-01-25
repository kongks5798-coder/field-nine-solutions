'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 45: SOVEREIGN MEMBERSHIP - Payment Page
 * ═══════════════════════════════════════════════════════════════════════════════
 * Platinum 멤버십 결제 및 활성화
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FinancialSidebar, PriceTicker } from '@/components/nexus/financial-terminal';

const MEMBERSHIP_TIERS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 0,
    priceKaus: 0,
    features: ['기본 대시보드 접근', 'SMP 가격 조회', 'KAUS 잔액 확인'],
    current: true,
  },
  {
    id: 'platinum',
    name: 'Platinum',
    price: 99,
    priceKaus: 1200,
    features: [
      '모든 Basic 기능',
      '에너지 구매 20% 할인',
      '영동 발전소 독점 데이터',
      'Prophet AI 프리미엄 분석',
      'Early Bird 우선 참여',
      '100 KAUS 보너스 지급',
      '전용 고객 지원',
    ],
    recommended: true,
  },
  {
    id: 'sovereign',
    name: 'Sovereign',
    price: 499,
    priceKaus: 6000,
    features: [
      '모든 Platinum 기능',
      '모든 API 무제한 접근',
      '자산 지분 투자 우선권',
      'White-label 옵션',
      '24/7 전용 지원',
      '500 KAUS 보너스 지급',
      '연간 수익 리포트',
    ],
    elite: true,
  },
];

const PAYMENT_METHODS = [
  { id: 'kaus', name: 'KAUS Coin', icon: '🪙', desc: '즉시 결제' },
  { id: 'card', name: 'Credit Card', icon: '💳', desc: 'Visa, Mastercard' },
  { id: 'paypal', name: 'PayPal', icon: '🅿️', desc: 'PayPal 계정' },
];

export default function MembershipPage() {
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState('platinum');
  const [paymentMethod, setPaymentMethod] = useState('kaus');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePurchase = async () => {
    setIsProcessing(true);

    try {
      const tier = MEMBERSHIP_TIERS.find(t => t.id === selectedTier);
      if (!tier || tier.price === 0) {
        alert('유효한 멤버십을 선택해주세요.');
        return;
      }

      const response = await fetch('/api/kaus/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'sovereign-user',
          paymentMethod,
          tier: selectedTier,
          amount: paymentMethod === 'kaus' ? tier.priceKaus : tier.price,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/ko/nexus/profile');
        }, 2000);
      } else {
        alert(data.error || '결제 처리 중 오류가 발생했습니다.');
      }
    } catch {
      alert('결제 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#F9F9F7]">
        <FinancialSidebar />
        <div className="ml-56">
          <PriceTicker />
          <main className="p-6 flex items-center justify-center min-h-[80vh]">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 1 }}
                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center"
              >
                <span className="text-5xl">👑</span>
              </motion.div>
              <h1 className="text-3xl font-black text-[#171717] mb-2">
                Welcome, Sovereign Lord!
              </h1>
              <p className="text-[#171717]/60 mb-4">
                PLATINUM 멤버십이 활성화되었습니다
              </p>
              <div className="inline-block px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-full">
                +100 KAUS 보너스 지급 완료
              </div>
            </motion.div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <FinancialSidebar />
      <div className="ml-56">
        <PriceTicker />

        <main className="p-6">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <h1 className="text-3xl font-black text-[#171717] mb-2">
                  Sovereign Membership
                </h1>
                <p className="text-[#171717]/60">
                  에너지 제국의 진정한 주인이 되십시오
                </p>
              </motion.div>
            </div>

            {/* Tier Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {MEMBERSHIP_TIERS.map((tier, index) => (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => tier.price > 0 && setSelectedTier(tier.id)}
                  className={`relative rounded-2xl p-6 cursor-pointer transition-all ${
                    selectedTier === tier.id
                      ? tier.elite
                        ? 'bg-gradient-to-br from-purple-900 to-indigo-900 text-white ring-4 ring-purple-500'
                        : 'bg-gradient-to-br from-amber-500 to-orange-500 text-white ring-4 ring-amber-500'
                      : tier.current
                      ? 'bg-white border-2 border-[#171717]/10'
                      : 'bg-white border-2 border-[#171717]/20 hover:border-amber-300'
                  }`}
                >
                  {tier.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                      RECOMMENDED
                    </div>
                  )}
                  {tier.elite && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-500 text-white text-xs font-bold rounded-full">
                      ELITE
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold">{tier.name}</h3>
                    <div className="mt-2">
                      {tier.price === 0 ? (
                        <span className="text-2xl font-black">Free</span>
                      ) : (
                        <>
                          <span className="text-3xl font-black">${tier.price}</span>
                          <span className="text-sm opacity-70">/month</span>
                        </>
                      )}
                    </div>
                    {tier.priceKaus > 0 && (
                      <div className="text-sm opacity-70 mt-1">
                        or {tier.priceKaus.toLocaleString()} KAUS
                      </div>
                    )}
                  </div>

                  <ul className="space-y-2">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className={selectedTier === tier.id ? 'text-white' : 'text-emerald-500'}>
                          ✓
                        </span>
                        <span className={selectedTier === tier.id ? 'text-white/90' : 'text-[#171717]/70'}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {tier.current && (
                    <div className="mt-4 text-center text-sm text-[#171717]/50">
                      현재 플랜
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Payment Method */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 border border-[#171717]/10 mb-6"
            >
              <h2 className="text-lg font-bold text-[#171717] mb-4">결제 방법</h2>
              <div className="grid grid-cols-3 gap-4">
                {PAYMENT_METHODS.map(method => (
                  <motion.div
                    key={method.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                      paymentMethod === method.id
                        ? 'bg-[#171717] text-white'
                        : 'bg-[#171717]/5 hover:bg-[#171717]/10'
                    }`}
                  >
                    <div className="text-2xl mb-2">{method.icon}</div>
                    <div className="font-bold">{method.name}</div>
                    <div className={`text-xs ${paymentMethod === method.id ? 'text-white/60' : 'text-[#171717]/50'}`}>
                      {method.desc}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Purchase Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handlePurchase}
                disabled={isProcessing || selectedTier === 'basic'}
                className="w-full py-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white font-bold text-xl rounded-2xl shadow-lg shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      ⏳
                    </motion.span>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>👑</span>
                    <span>Claim Your Throne</span>
                  </span>
                )}
              </motion.button>

              <div className="flex items-center justify-center gap-4 mt-4 text-[#171717]/40 text-sm">
                <span>🔒 Secure Payment</span>
                <span>|</span>
                <span>⚡ Instant Activation</span>
                <span>|</span>
                <span>💯 30-Day Guarantee</span>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
