/**
 * K-UNIVERSAL Payment Success Page
 * Tesla-style minimal success confirmation
 */

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { formatKRW } from '@/lib/toss/client';
import { useAuthStore } from '@/store/auth-store';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { syncWalletFromDB, addBalance } = useAuthStore();
  const [isConfirming, setIsConfirming] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const confirmPayment = async () => {
      const paymentKey = searchParams.get('paymentKey');
      const orderId = searchParams.get('orderId');
      const amount = searchParams.get('amount');
      const userId = searchParams.get('userId');

      if (!paymentKey || !orderId || !amount) {
        setSuccess(false);
        setIsConfirming(false);
        return;
      }

      try {
        const response = await fetch('/api/wallet/topup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: parseInt(amount),
            userId,
          }),
        });

        const data = await response.json();

        if (data.success) {
          addBalance(data.amount);
          await syncWalletFromDB();
          setSuccess(true);
        } else {
          setSuccess(false);
        }
      } catch {
        setSuccess(false);
      } finally {
        setIsConfirming(false);
      }
    };

    confirmPayment();
  }, [searchParams, addBalance, syncWalletFromDB]);

  // Loading state
  if (isConfirming) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-[#171717]/20 border-t-[#171717] rounded-full"
        />
      </div>
    );
  }

  // Success state - Tesla Minimal
  if (success) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex flex-col items-center justify-center px-8">
        {/* Large Check Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.4, delay: 0.1 }}
          className="w-32 h-32 mb-12 rounded-full bg-[#171717] flex items-center justify-center"
        >
          <Check className="w-16 h-16 text-white" strokeWidth={3} />
        </motion.div>

        {/* Simple Message */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-[#171717] mb-16 text-center"
        >
          결제가 완료되었습니다
        </motion.h1>

        {/* Single Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-xs"
        >
          <button
            onClick={() => router.push('/wallet')}
            className="w-full py-5 bg-[#171717] text-white text-lg font-semibold rounded-2xl hover:bg-[#171717]/90 transition-colors"
          >
            메인으로
          </button>
        </motion.div>
      </div>
    );
  }

  // Failed state - Also minimal
  return (
    <div className="min-h-screen bg-[#F9F9F7] flex flex-col items-center justify-center px-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-32 h-32 mb-12 rounded-full bg-[#171717]/10 flex items-center justify-center"
      >
        <span className="text-5xl">×</span>
      </motion.div>

      <h1 className="text-3xl font-bold text-[#171717] mb-16 text-center">
        결제에 실패했습니다
      </h1>

      <div className="w-full max-w-xs">
        <button
          onClick={() => router.push('/wallet')}
          className="w-full py-5 bg-[#171717] text-white text-lg font-semibold rounded-2xl"
        >
          다시 시도하기
        </button>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#171717]/20 border-t-[#171717] rounded-full animate-spin" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
