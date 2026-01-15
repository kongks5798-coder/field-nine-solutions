/**
 * K-UNIVERSAL Ghost Wallet Page
 * 토스페이먼츠 연동 결제 인터페이스 (다국어 지원)
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { PaymentCard } from '@/components/wallet/payment-card';
import { TopupWidget } from '@/components/wallet/topup-widget';
import { formatKRW } from '@/lib/toss/client';

export default function WalletPage() {
  const [showTopup, setShowTopup] = useState(false);
  const [balance, setBalance] = useState(0);
  const t = useTranslations('wallet');
  const tTopup = useTranslations('topup');
  const locale = useLocale();

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
            👻 {t('title')}
          </h1>
          <p className="text-xl text-gray-600">
            {t('subtitle')}
          </p>
          <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
            {t('testMode')}
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
                {showTopup ? `✕ ${t('closeButton')}` : `💳 ${t('topupButton')}`}
              </button>
              <button className="w-full px-6 py-4 bg-white hover:bg-gray-50 text-gray-900 rounded-xl font-semibold border-2 border-gray-200 transition-colors">
                📊 {t('transactions')}
              </button>
              <button className="w-full px-6 py-4 bg-white hover:bg-gray-50 text-gray-900 rounded-xl font-semibold border-2 border-gray-200 transition-colors">
                ➕ {t('createCard')}
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
                  alert(`❌ ${error}`);
                }}
              />
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {t('features.title')}
                </h2>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">💳</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {t('features.virtualCard.title')}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {t('features.virtualCard.desc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="text-4xl">🔒</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {t('features.biometric.title')}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {t('features.biometric.desc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="text-4xl">⚡</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {t('features.instant.title')}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {t('features.instant.desc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="text-4xl">🇰🇷</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {t('features.korea.title')}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {t('features.korea.desc')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 결제 수단 로고 */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-3">{t('paymentMethods')}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-medium">{t('methods.creditCard')}</span>
                    <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-medium">{t('methods.debitCard')}</span>
                    <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-medium">{t('methods.bankTransfer')}</span>
                    <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-xs font-medium">{t('methods.tossPay')}</span>
                    <span className="px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg text-xs font-medium">{t('methods.kakaoPay')}</span>
                    <span className="px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-xs font-medium">{t('methods.naverPay')}</span>
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
