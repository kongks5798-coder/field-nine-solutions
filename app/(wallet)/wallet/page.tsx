/**
 * K-UNIVERSAL Ghost Wallet Page
 * 토스페이먼츠 연동 결제 인터페이스
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PaymentCard } from '@/components/wallet/payment-card';
import { TopupWidget } from '@/components/wallet/topup-widget';
import { formatKRW } from '@/lib/toss/client';

export default function WalletPage() {
  const [showTopup, setShowTopup] = useState(false);
  const [balance, setBalance] = useState(0);

  // 데모 카드 데이터 (원화 기준)
  const demoCard = {
    cardholderName: 'K-Universal User',
    cardNumber: '**** **** **** 1234',
    expiryMonth: '12',
    expiryYear: '27',
    balance: balance,
    currency: 'KRW',
    status: 'active' as const,
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            👻 Ghost Wallet
          </h1>
          <p className="text-xl text-gray-600">
            한국 결제 시스템 연동 · 토스페이먼츠
          </p>
          <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
            테스트 모드
          </span>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Payment Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <PaymentCard {...demoCard} />

            {/* Card Actions */}
            <div className="mt-8 space-y-3">
              <button
                onClick={() => setShowTopup(!showTopup)}
                className="w-full px-6 py-4 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-semibold transition-colors shadow-lg"
              >
                {showTopup ? '✕ 닫기' : '💳 잔액 충전하기'}
              </button>
              <button className="w-full px-6 py-4 bg-white hover:bg-gray-50 text-gray-900 rounded-xl font-semibold border-2 border-gray-200 transition-colors">
                📊 거래 내역 보기
              </button>
              <button className="w-full px-6 py-4 bg-white hover:bg-gray-50 text-gray-900 rounded-xl font-semibold border-2 border-gray-200 transition-colors">
                ➕ 가상 카드 만들기
              </button>
            </div>
          </motion.div>

          {/* Top-up Widget */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {showTopup ? (
              <TopupWidget
                userId="demo-user-id"
                onSuccess={(amount) => {
                  setBalance(balance + amount);
                  setShowTopup(false);
                }}
                onError={(error) => {
                  console.error('[Wallet] Topup error:', error);
                  // Error handled in TopupWidget
                }}
              />
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  지갑 기능
                </h2>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">💳</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        가상 카드
                      </h3>
                      <p className="text-sm text-gray-600">
                        안전한 온라인 결제를 위한 가상 카드 무제한 발급
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="text-4xl">🔒</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        생체 인증
                      </h3>
                      <p className="text-sm text-gray-600">
                        Face ID / Touch ID로 모든 거래 보안 강화
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="text-4xl">⚡</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        즉시 충전
                      </h3>
                      <p className="text-sm text-gray-600">
                        카드, 계좌이체, 간편결제로 즉시 충전 가능
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="text-4xl">🇰🇷</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        한국 결제
                      </h3>
                      <p className="text-sm text-gray-600">
                        토스페이, 카카오페이, 네이버페이 지원
                      </p>
                    </div>
                  </div>
                </div>

                {/* 결제 수단 로고 */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-3">지원 결제 수단</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-medium">신용카드</span>
                    <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-medium">체크카드</span>
                    <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-medium">계좌이체</span>
                    <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-xs font-medium">토스페이</span>
                    <span className="px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg text-xs font-medium">카카오페이</span>
                    <span className="px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-xs font-medium">네이버페이</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
