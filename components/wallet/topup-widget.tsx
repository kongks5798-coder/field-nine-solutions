/**
 * K-UNIVERSAL Top-up Widget
 * 토스페이먼츠 결제창 연동
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadTossPayments, TossPaymentsWidgets } from '@tosspayments/tosspayments-sdk';
import { TOSS_CLIENT_KEY, generateOrderId, formatKRW } from '@/lib/toss/client';

interface TopupWidgetProps {
  userId: string;
  onSuccess: (amount: number) => void;
  onError: (error: string) => void;
}

// 프리셋 금액 (원화)
const PRESET_AMOUNTS = [5000, 10000, 30000, 50000, 100000, 200000];

export function TopupWidget({ userId, onSuccess, onError }: TopupWidgetProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [widgets, setWidgets] = useState<TossPaymentsWidgets | null>(null);
  const [isWidgetReady, setIsWidgetReady] = useState(false);

  // 토스 위젯 초기화
  useEffect(() => {
    const initTossWidgets = async () => {
      try {
        const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
        const tossWidgets = tossPayments.widgets({
          customerKey: userId || 'GUEST_USER',
        });
        setWidgets(tossWidgets);
      } catch (error) {
        console.error('토스 위젯 초기화 실패:', error);
      }
    };

    initTossWidgets();
  }, [userId]);

  // 결제 금액 변경 시 위젯 업데이트
  useEffect(() => {
    const amount = selectedAmount || parseInt(customAmount) || 0;
    if (widgets && amount >= 1000) {
      widgets.setAmount({
        currency: 'KRW',
        value: amount,
      });
    }
  }, [selectedAmount, customAmount, widgets]);

  // 결제 실행
  const handlePayment = async () => {
    const amount = selectedAmount || parseInt(customAmount);

    if (!amount || amount < 1000) {
      onError('최소 충전 금액은 1,000원입니다');
      return;
    }

    if (!widgets) {
      onError('결제 시스템 초기화 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setIsProcessing(true);

    try {
      // 주문 ID 생성
      const orderId = generateOrderId();

      // 토스 결제창 열기
      await widgets.requestPayment({
        orderId,
        orderName: `Ghost Wallet 충전 ${formatKRW(amount)}`,
        successUrl: `${window.location.origin}/wallet/success?userId=${userId}`,
        failUrl: `${window.location.origin}/wallet/fail`,
      });

    } catch (error: any) {
      // 사용자가 결제를 취소한 경우
      if (error.code === 'USER_CANCEL') {
        onError('결제가 취소되었습니다');
      } else {
        onError(error.message || '결제 처리 중 오류가 발생했습니다');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 간편 결제 (위젯 없이 바로 결제창)
  const handleQuickPayment = async () => {
    const amount = selectedAmount || parseInt(customAmount);

    if (!amount || amount < 1000) {
      onError('최소 충전 금액은 1,000원입니다');
      return;
    }

    setIsProcessing(true);

    try {
      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
      const orderId = generateOrderId();

      // 결제창 바로 열기 (SDK 타입 호환성)
      const payment = tossPayments as any;
      await payment.requestPayment('카드', {
        amount,
        orderId,
        orderName: `Ghost Wallet 충전`,
        customerName: 'K-Universal User',
        successUrl: `${window.location.origin}/wallet/success?userId=${userId}&amount=${amount}`,
        failUrl: `${window.location.origin}/wallet/fail`,
      });
    } catch (error: any) {
      if (error.code === 'USER_CANCEL') {
        onError('결제가 취소되었습니다');
      } else {
        onError(error.message || '결제 처리 중 오류가 발생했습니다');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">지갑 충전</h2>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
            토스페이먼츠
          </span>
        </div>

        {/* 프리셋 금액 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {PRESET_AMOUNTS.map((amount) => (
            <motion.button
              key={amount}
              onClick={() => {
                setSelectedAmount(amount);
                setCustomAmount('');
              }}
              className={`
                p-4 rounded-xl font-semibold transition-all text-sm
                ${
                  selectedAmount === amount
                    ? 'bg-[#0066FF] text-white shadow-lg'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }
              `}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {formatKRW(amount)}
            </motion.button>
          ))}
        </div>

        {/* 직접 입력 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            또는 직접 입력
          </label>
          <div className="relative">
            <input
              type="number"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedAmount(null);
              }}
              placeholder="0"
              className="w-full pl-4 pr-12 py-3 text-xl font-semibold border-2 border-gray-200 rounded-xl focus:border-[#0066FF] focus:outline-none transition-colors"
              min="1000"
              step="1000"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
              원
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">최소 1,000원 이상</p>
        </div>

        {/* 선택 금액 표시 */}
        <AnimatePresence>
          {(selectedAmount || customAmount) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200"
            >
              <p className="text-sm text-blue-900 mb-1">충전 금액</p>
              <p className="text-3xl font-bold text-blue-900">
                {formatKRW(selectedAmount || parseInt(customAmount) || 0)}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 결제 수단 안내 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-xl">
          <p className="text-sm font-medium text-gray-700 mb-2">지원 결제 수단</p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-white rounded border text-xs">신용카드</span>
            <span className="px-2 py-1 bg-white rounded border text-xs">체크카드</span>
            <span className="px-2 py-1 bg-white rounded border text-xs">계좌이체</span>
            <span className="px-2 py-1 bg-white rounded border text-xs">토스페이</span>
            <span className="px-2 py-1 bg-white rounded border text-xs">카카오페이</span>
            <span className="px-2 py-1 bg-white rounded border text-xs">네이버페이</span>
          </div>
        </div>

        {/* 결제 버튼 */}
        <motion.button
          onClick={handleQuickPayment}
          disabled={isProcessing || (!selectedAmount && !customAmount)}
          className={`
            w-full py-4 rounded-xl font-semibold text-lg transition-all
            ${
              isProcessing || (!selectedAmount && !customAmount)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#0066FF] text-white hover:bg-[#0052CC] shadow-lg'
            }
          `}
          whileHover={
            !isProcessing && (selectedAmount || customAmount)
              ? { scale: 1.02 }
              : {}
          }
          whileTap={
            !isProcessing && (selectedAmount || customAmount)
              ? { scale: 0.98 }
              : {}
          }
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                ⏳
              </motion.span>
              결제창 열기 중...
            </span>
          ) : (
            '💳 결제하기'
          )}
        </motion.button>

        {/* 보안 안내 */}
        <p className="text-xs text-gray-500 text-center mt-4">
          🔒 토스페이먼츠 보안 결제 | PCI-DSS 인증
        </p>

        {/* 테스트 모드 안내 */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            <span className="font-semibold">🧪 테스트 모드:</span> 실제 결제가 이루어지지 않습니다.
            <br />
            테스트 카드번호: 4330-0000-0000-0000 (유효기간/CVC 아무거나)
          </p>
        </div>
      </motion.div>
    </div>
  );
}
