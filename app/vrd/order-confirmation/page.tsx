'use client';

/**
 * VRD 26SS - Order Confirmation Page
 * Stripe redirect handler after successful payment
 */

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const paymentIntent = searchParams.get('payment_intent');
  const redirectStatus = searchParams.get('redirect_status');

  const [orderDetails, setOrderDetails] = useState<{
    orderId: string;
    status: string;
    paymentStatus: string;
    amount: number;
    currency: string;
    customerEmail: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrderDetails() {
      if (!orderId && !paymentIntent) {
        setError('주문 정보를 찾을 수 없습니다.');
        setIsLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams();
        if (orderId) params.set('orderId', orderId);
        if (paymentIntent) params.set('paymentIntentId', paymentIntent);

        const response = await fetch(`/api/vrd/payment?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch order details');
        }

        setOrderDetails(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrderDetails();
  }, [orderId, paymentIntent]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#171717] border-t-transparent mx-auto" />
          <p className="mt-4 text-[#171717]/60">주문 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || redirectStatus === 'failed') {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-2xl p-8 text-center shadow-lg"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-light text-[#171717] mb-4">결제 실패</h1>
          <p className="text-[#171717]/60 mb-8">
            {error || '결제 처리 중 문제가 발생했습니다. 다시 시도해 주세요.'}
          </p>
          <Link
            href="/vrd/checkout"
            className="inline-block px-8 py-3 bg-[#171717] text-[#F9F9F7] rounded-xl hover:bg-[#171717]/90 transition-colors"
          >
            다시 시도하기
          </Link>
        </motion.div>
      </div>
    );
  }

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'KRW') {
      return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        maximumFractionDigits: 0,
      }).format(amount);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      {/* Header */}
      <header className="border-b border-[#171717]/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/vrd" className="text-2xl tracking-[0.3em] font-light text-[#171717]">
            VRD
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8"
          >
            <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>

          <h1 className="text-3xl md:text-4xl font-light text-[#171717] mb-4">
            주문이 완료되었습니다
          </h1>
          <p className="text-lg text-[#171717]/60 mb-8">
            VRD와 함께해 주셔서 감사합니다.
          </p>

          {/* Order Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-8 mb-8 text-left"
          >
            <div className="space-y-6">
              {/* Order ID */}
              <div>
                <p className="text-sm text-[#171717]/50 mb-1">주문번호</p>
                <p className="text-xl font-mono font-medium text-[#171717]">
                  {orderDetails?.orderId || orderId}
                </p>
              </div>

              {/* Amount */}
              {orderDetails && (
                <div className="pt-6 border-t border-[#171717]/10">
                  <div className="flex justify-between items-center">
                    <p className="text-[#171717]/60">결제 금액</p>
                    <p className="text-2xl font-medium text-[#171717]">
                      {formatCurrency(orderDetails.amount, orderDetails.currency)}
                    </p>
                  </div>
                </div>
              )}

              {/* Email Confirmation */}
              {orderDetails?.customerEmail && (
                <div className="pt-6 border-t border-[#171717]/10">
                  <p className="text-sm text-[#171717]/50">
                    주문 확인 이메일이{' '}
                    <span className="text-[#171717] font-medium">{orderDetails.customerEmail}</span>
                    으로 발송되었습니다.
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* What's Next */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#171717]/5 rounded-2xl p-6 mb-8"
          >
            <h2 className="font-medium text-[#171717] mb-4">다음 단계</h2>
            <ul className="space-y-3 text-left text-[#171717]/70">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#171717] text-[#F9F9F7] rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                <span>주문 확인 이메일을 확인해 주세요</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#171717] text-[#F9F9F7] rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                <span>상품 준비가 완료되면 배송 시작 안내를 보내드립니다</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#171717] text-[#F9F9F7] rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                <span>배송 추적 번호로 실시간 배송 상황을 확인하세요</span>
              </li>
            </ul>
          </motion.div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/vrd"
              className="px-8 py-4 bg-[#171717] text-[#F9F9F7] rounded-xl font-medium hover:bg-[#171717]/90 transition-colors"
            >
              쇼핑 계속하기
            </Link>
            <a
              href={`mailto:support@fieldnine.io?subject=주문 문의 - ${orderDetails?.orderId || orderId}`}
              className="px-8 py-4 border border-[#171717]/20 text-[#171717] rounded-xl font-medium hover:bg-[#171717]/5 transition-colors"
            >
              문의하기
            </a>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#171717]/10 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-[#171717]/40">
            © 2026 VRD by Field Nine. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#171717] border-t-transparent" />
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
