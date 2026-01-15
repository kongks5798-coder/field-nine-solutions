/**
 * 토스페이먼츠 결제 성공 페이지
 * 결제 완료 후 리다이렉트되는 페이지
 */

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { formatKRW } from '@/lib/toss/client';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(true);
  const [result, setResult] = useState<{
    success: boolean;
    amount?: number;
    message?: string;
  } | null>(null);

  useEffect(() => {
    const confirmPayment = async () => {
      const paymentKey = searchParams.get('paymentKey');
      const orderId = searchParams.get('orderId');
      const amount = searchParams.get('amount');
      const userId = searchParams.get('userId');

      if (!paymentKey || !orderId || !amount) {
        setResult({
          success: false,
          message: '결제 정보가 올바르지 않습니다',
        });
        setIsConfirming(false);
        return;
      }

      try {
        // 서버에 결제 승인 요청
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
          setResult({
            success: true,
            amount: data.amount,
            message: '충전이 완료되었습니다!',
          });
        } else {
          setResult({
            success: false,
            message: data.error || '결제 승인에 실패했습니다',
          });
        }
      } catch (error) {
        setResult({
          success: false,
          message: '결제 처리 중 오류가 발생했습니다',
        });
      } finally {
        setIsConfirming(false);
      }
    };

    confirmPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center"
      >
        {isConfirming ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="text-6xl mb-4"
            >
              ⏳
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              결제 확인 중...
            </h1>
            <p className="text-gray-600">잠시만 기다려주세요</p>
          </>
        ) : result?.success ? (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="text-7xl mb-4"
            >
              ✅
            </motion.div>
            <h1 className="text-2xl font-bold text-[#00C853] mb-2">
              충전 완료!
            </h1>
            <p className="text-gray-600 mb-4">{result.message}</p>

            {result.amount && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-green-800 mb-1">충전 금액</p>
                <p className="text-3xl font-bold text-green-900">
                  {formatKRW(result.amount)}
                </p>
              </div>
            )}

            <button
              onClick={() => router.push('/wallet')}
              className="w-full px-6 py-4 bg-[#0066FF] text-white rounded-xl font-semibold hover:bg-[#0052CC] transition-colors"
            >
              👻 지갑으로 돌아가기
            </button>
          </>
        ) : (
          <>
            <div className="text-7xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">
              결제 실패
            </h1>
            <p className="text-gray-600 mb-6">{result?.message}</p>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/wallet')}
                className="w-full px-6 py-3 bg-[#0066FF] text-white rounded-xl font-semibold hover:bg-[#0052CC] transition-colors"
              >
                다시 시도하기
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                홈으로 돌아가기
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">로딩 중...</div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
