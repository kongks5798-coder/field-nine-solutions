/**
 * 토스페이먼츠 결제 실패 페이지
 * 결제 실패/취소 시 리다이렉트되는 페이지
 */

'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const errorCode = searchParams.get('code');
  const errorMessage = searchParams.get('message');

  // 에러 코드별 메시지
  const getErrorDescription = (code: string | null) => {
    switch (code) {
      case 'PAY_PROCESS_CANCELED':
        return '결제가 취소되었습니다.';
      case 'PAY_PROCESS_ABORTED':
        return '결제 진행 중 문제가 발생했습니다.';
      case 'REJECT_CARD_COMPANY':
        return '카드사에서 결제를 거절했습니다.';
      case 'INVALID_CARD_NUMBER':
        return '유효하지 않은 카드 번호입니다.';
      case 'INVALID_CARD_EXPIRATION':
        return '카드 유효기간이 올바르지 않습니다.';
      case 'EXCEED_MAX_AMOUNT':
        return '결제 한도를 초과했습니다.';
      default:
        return errorMessage || '결제 처리 중 문제가 발생했습니다.';
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="text-7xl mb-4"
        >
          😢
        </motion.div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          결제 실패
        </h1>

        <p className="text-gray-600 mb-6">
          {getErrorDescription(errorCode)}
        </p>

        {errorCode && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs text-red-600 font-mono">
              오류 코드: {errorCode}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => router.push('/wallet')}
            className="w-full px-6 py-4 bg-[#0066FF] text-white rounded-xl font-semibold hover:bg-[#0052CC] transition-colors"
          >
            💳 다시 결제하기
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>

        {/* 도움말 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl text-left">
          <p className="text-sm font-medium text-gray-700 mb-2">결제가 계속 실패하나요?</p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• 카드 정보가 올바른지 확인해주세요</li>
            <li>• 결제 한도를 확인해주세요</li>
            <li>• 다른 결제 수단을 시도해보세요</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">로딩 중...</div>
      </div>
    }>
      <PaymentFailContent />
    </Suspense>
  );
}
