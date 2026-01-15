/**
 * K-UNIVERSAL Integrated Demo
 * Complete KYC → Ghost Wallet flow (i18n)
 */

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthStore } from '@/store/auth-store';
import { useKYCFlow } from '@/lib/hooks/use-kyc-flow';
import { useWallet } from '@/lib/hooks/use-wallet';
import { PassportUpload } from '@/components/kyc/passport-upload';
import { PaymentCard } from '@/components/wallet/payment-card';
import { TopupWidget } from '@/components/wallet/topup-widget';
import { Toaster } from 'sonner';

type DemoStep = 'welcome' | 'kyc' | 'kyc-review' | 'wallet' | 'topup' | 'complete';

export default function DemoPage() {
  const [step, setStep] = useState<DemoStep>('welcome');
  const { userProfile, wallet, setUserProfile } = useAuthStore();
  const { isProcessing: kycProcessing, ocrResult, scanPassport, submitKYC } = useKYCFlow();
  const { wallet: walletState, topUpWallet } = useWallet();
  const t = useTranslations('demo');
  const tKyc = useTranslations('kyc');
  const locale = useLocale();

  // Initialize demo user on mount
  useEffect(() => {
    if (!userProfile) {
      setUserProfile({
        id: 'demo-profile-id',
        userId: 'demo-user-123',
        kycStatus: 'not_submitted',
        kycVerifiedAt: null,
      });
    }
  }, [userProfile, setUserProfile]);

  // Auto-advance to wallet if KYC is verified
  useEffect(() => {
    if (userProfile?.kycStatus === 'verified' && step === 'kyc-review') {
      setTimeout(() => setStep('wallet'), 2000);
    }
  }, [userProfile?.kycStatus, step]);

  const handlePassportScan = async (file: File) => {
    const success = await scanPassport(file);
    if (success) {
      setStep('kyc-review');
    }
  };

  const handleKYCSubmit = async () => {
    if (!userProfile) return;
    const success = await submitKYC(userProfile.userId);
    if (success && userProfile.kycStatus === 'verified') {
      setTimeout(() => setStep('wallet'), 1500);
    }
  };

  const handleTopup = async (amount: number) => {
    const success = await topUpWallet(amount);
    if (success) {
      setStep('complete');
    }
  };

  const stepLabels = [t('steps.welcome'), t('steps.kyc'), t('steps.wallet'), t('steps.complete')];

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <Toaster position="top-center" richColors />

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            <div className="flex items-center gap-2">
              {userProfile?.kycStatus === 'verified' && (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                  ✓ {t('kycVerified')}
                </span>
              )}
              {wallet && wallet.balance > 0 && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                  ₩{wallet.balance.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2">
            {stepLabels.map((label, idx) => (
              <div key={label} className="flex items-center flex-1">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#0066FF]"
                    initial={{ width: 0 }}
                    animate={{
                      width:
                        (step === 'welcome' && idx === 0) ||
                        (step === 'kyc' && idx <= 1) ||
                        (step === 'kyc-review' && idx <= 1) ||
                        (step === 'wallet' && idx <= 2) ||
                        (step === 'topup' && idx <= 2) ||
                        (step === 'complete' && idx <= 3)
                          ? '100%'
                          : 0,
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {/* Step 1: Welcome */}
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="text-8xl mb-6">👻</div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                {t('welcome.title')}
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                {t('welcome.subtitle')}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="p-6 bg-white rounded-xl shadow-sm">
                  <div className="text-4xl mb-3">🛂</div>
                  <h3 className="font-semibold text-gray-900 mb-2">{t('welcome.step1_title')}</h3>
                  <p className="text-sm text-gray-600">{t('welcome.step1_desc')}</p>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm">
                  <div className="text-4xl mb-3">💳</div>
                  <h3 className="font-semibold text-gray-900 mb-2">{t('welcome.step2_title')}</h3>
                  <p className="text-sm text-gray-600">{t('welcome.step2_desc')}</p>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm">
                  <div className="text-4xl mb-3">⚡</div>
                  <h3 className="font-semibold text-gray-900 mb-2">{t('welcome.step3_title')}</h3>
                  <p className="text-sm text-gray-600">{t('welcome.step3_desc')}</p>
                </div>
              </div>

              <button
                onClick={() => setStep('kyc')}
                className="px-12 py-4 bg-[#0066FF] hover:bg-[#0052CC] text-white text-lg font-semibold rounded-xl transition-colors shadow-lg"
              >
                {t('welcome.start')} →
              </button>
            </motion.div>
          )}

          {/* Step 2: KYC Upload */}
          {step === 'kyc' && (
            <motion.div
              key="kyc"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {t('kycStep.title')}
                </h2>
                <p className="text-gray-600">{t('kycStep.subtitle')}</p>
              </div>

              <PassportUpload
                onSuccess={(result) => handlePassportScan(new File([], 'passport.jpg'))}
                onError={(error) => console.error(error)}
              />
            </motion.div>
          )}

          {/* Step 3: KYC Review */}
          {step === 'kyc-review' && ocrResult?.data && (
            <motion.div
              key="kyc-review"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('review.title')}</h2>
                <p className="text-gray-600">{t('review.subtitle')}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="text-sm text-gray-600 block mb-1">{tKyc('fields.fullName')}</label>
                  <p className="font-semibold text-gray-900">{ocrResult.data.fullName}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="text-sm text-gray-600 block mb-1">{tKyc('fields.passportNumber')}</label>
                  <p className="font-semibold text-gray-900">{ocrResult.data.passportNumber}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="text-sm text-gray-600 block mb-1">{tKyc('fields.nationality')}</label>
                  <p className="font-semibold text-gray-900">{ocrResult.data.nationality}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="text-sm text-gray-600 block mb-1">{tKyc('fields.expiryDate')}</label>
                  <p className="font-semibold text-gray-900">{ocrResult.data.expiryDate}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('kyc')}
                  className="flex-1 px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 rounded-xl font-semibold border-2 border-gray-200 transition-colors"
                >
                  {t('review.rescan')}
                </button>
                <button
                  onClick={handleKYCSubmit}
                  disabled={kycProcessing}
                  className="flex-1 px-6 py-3 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  {kycProcessing ? t('review.processing') : t('review.submit')}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Wallet */}
          {(step === 'wallet' || step === 'topup') && (
            <motion.div
              key="wallet"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">👻</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('walletReady.title')}</h2>
                <p className="text-gray-600">{t('walletReady.subtitle')}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Virtual Card */}
                <div>
                  <PaymentCard
                    cardholderName={ocrResult?.data?.fullName || 'K-Universal User'}
                    cardNumber="**** **** **** 1234"
                    expiryMonth="12"
                    expiryYear="27"
                    balance={walletState?.balance || 0}
                    currency="KRW"
                    status="active"
                  />
                </div>

                {/* Top-up Widget */}
                <div>
                  {step === 'wallet' ? (
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('walletReady.ready_title')}</h3>
                      <div className="space-y-4 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">✅</div>
                          <div>
                            <p className="font-semibold text-gray-900">{t('walletReady.kyc_done')}</p>
                            <p className="text-sm text-gray-600">{t('walletReady.kyc_done_desc')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">💳</div>
                          <div>
                            <p className="font-semibold text-gray-900">{t('walletReady.card_ready')}</p>
                            <p className="text-sm text-gray-600">{t('walletReady.card_ready_desc')}</p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setStep('topup')}
                        className="w-full px-6 py-4 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-semibold transition-colors"
                      >
                        {t('walletReady.topup_button')} →
                      </button>
                    </div>
                  ) : (
                    <TopupWidget
                      userId={userProfile?.userId || 'demo-user'}
                      onSuccess={handleTopup}
                      onError={(error) => console.error(error)}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 5: Complete */}
          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="text-9xl mb-6"
              >
                🎉
              </motion.div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('complete.title')}</h2>
              <p className="text-xl text-gray-600 mb-8">{t('complete.subtitle')}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-3xl mx-auto">
                <div className="p-6 bg-white rounded-xl shadow-sm">
                  <div className="text-3xl mb-2">✅</div>
                  <p className="font-semibold text-gray-900">{t('complete.kyc')}</p>
                  <p className="text-sm text-gray-600">{t('complete.kyc_status')}</p>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm">
                  <div className="text-3xl mb-2">💳</div>
                  <p className="font-semibold text-gray-900">{t('complete.card')}</p>
                  <p className="text-sm text-gray-600">{t('complete.card_status')}</p>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm">
                  <div className="text-3xl mb-2">💰</div>
                  <p className="font-semibold text-gray-900">{t('complete.balance')}</p>
                  <p className="text-sm text-gray-600">₩{(walletState?.balance || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => (window.location.href = `/${locale}/wallet`)}
                  className="px-8 py-4 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-semibold transition-colors"
                >
                  {t('complete.go_wallet')} →
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 rounded-xl font-semibold border-2 border-gray-200 transition-colors"
                >
                  {t('complete.restart')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
