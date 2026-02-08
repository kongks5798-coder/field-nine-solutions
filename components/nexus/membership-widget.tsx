'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 41: SOVEREIGN MEMBERSHIP WIDGET
 * ═══════════════════════════════════════════════════════════════════════════════
 * K-Nomad Membership Pass: $99 or 1,200 KAUS
 * Tesla Platinum Style: #F9F9F7 / #171717
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const MEMBERSHIP_CONFIG = {
  price: { usd: 99, kaus: 1200 },
  benefits: [
    { icon: '⚡', text: '에너지 구매 20% 할인' },
    { icon: '📊', text: '영동 발전소 지분 데이터 독점 열람' },
    { icon: '🔮', text: 'Prophet AI 프리미엄 분석' },
    { icon: '🎯', text: 'Early Bird 프로모션 우선 참여' },
  ],
};

export function SovereignMembershipWidget() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'kaus' | 'usd'>('kaus');

  const handlePurchase = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/kaus/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'sovereign-user',
          paymentMethod,
        }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success(data.message || 'PLATINUM 멤버십 활성화 완료!');
      } else {
        toast.error(data.error || '결제 실패');
      }
    } catch (error) {
      toast.error('결제 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#F9F9F7] rounded-2xl p-6 border-2 border-[#171717]/10 relative overflow-hidden"
    >
      {/* Premium Badge */}
      <div className="absolute top-4 right-4">
        <div className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full">
          PLATINUM
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 bg-[#171717] rounded-2xl flex items-center justify-center">
          <span className="text-2xl">👑</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-[#171717]">Sovereign Membership</h3>
          <p className="text-sm text-[#171717]/60">K-Nomad 글로벌 패스</p>
        </div>
      </div>

      {/* Benefits */}
      <div className="space-y-3 mb-6">
        {MEMBERSHIP_CONFIG.benefits.map((benefit, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl">
            <span className="text-lg">{benefit.icon}</span>
            <span className="text-sm text-[#171717]">{benefit.text}</span>
          </div>
        ))}
      </div>

      {/* Pricing Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setPaymentMethod('kaus')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
            paymentMethod === 'kaus'
              ? 'bg-[#171717] text-white'
              : 'bg-white text-[#171717] border border-[#171717]/10'
          }`}
        >
          1,200 KAUS
        </button>
        <button
          onClick={() => setPaymentMethod('usd')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
            paymentMethod === 'usd'
              ? 'bg-[#171717] text-white'
              : 'bg-white text-[#171717] border border-[#171717]/10'
          }`}
        >
          $99 USD
        </button>
      </div>

      {/* Price Display */}
      <div className="text-center mb-4">
        <div className="text-4xl font-black text-[#171717]">
          {paymentMethod === 'kaus' ? '1,200 KAUS' : '$99'}
        </div>
        <div className="text-sm text-[#171717]/40">
          {paymentMethod === 'kaus' ? '≈ ₩144,000' : '≈ ₩132,000'}
        </div>
      </div>

      {/* CTA Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handlePurchase}
        disabled={isProcessing}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
          isProcessing
            ? 'bg-[#171717]/50 text-white cursor-not-allowed'
            : 'bg-[#171717] text-white hover:bg-[#171717]/90'
        }`}
      >
        {isProcessing ? '처리 중...' : '🚀 PLATINUM 멤버십 시작하기'}
      </motion.button>

      {/* Trust Badge */}
      <div className="mt-4 text-center text-xs text-[#171717]/40">
        안전한 결제 · 즉시 활성화 · 언제든 취소 가능
      </div>
    </motion.div>
  );
}
