/**
 * K-UNIVERSAL Integrated Demo
 * Complete KYC → Ghost Wallet flow
 */

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <Toaster position="top-center" richColors />
      
      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">K-Universal Demo</h1>
            <div className="flex items-center gap-2">
              {userProfile?.kycStatus === 'verified' && (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                  ✓ KYC Verified
                </span>
              )}
              {wallet && wallet.balance > 0 && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                  ${wallet.balance}
                </span>
              )}
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-2">
            {['Welcome', 'KYC', 'Wallet', 'Complete'].map((label, idx) => (
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
                K-Universal Ghost Wallet
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                여권 기반 본인인증(KYC)부터 포인트 충전까지,<br />
                완전한 금융 인프라를 체험하세요.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="p-6 bg-white rounded-xl shadow-sm">
                  <div className="text-4xl mb-3">🛂</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Step 1: KYC</h3>
                  <p className="text-sm text-gray-600">
                    여권을 스캔하여 본인인증을 완료하세요
                  </p>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm">
                  <div className="text-4xl mb-3">💳</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Step 2: Wallet</h3>
                  <p className="text-sm text-gray-600">
                    Ghost Wallet이 자동으로 생성됩니다
                  </p>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm">
                  <div className="text-4xl mb-3">⚡</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Step 3: Top-up</h3>
                  <p className="text-sm text-gray-600">
                    Stripe로 즉시 포인트 충전하세요
                  </p>
                </div>
              </div>

              <button
                onClick={() => setStep('kyc')}
                className="px-12 py-4 bg-[#0066FF] hover:bg-[#0052CC] text-white text-lg font-semibold rounded-xl transition-colors shadow-lg"
              >
                시작하기 →
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
                  여권 본인인증 (e-KYC)
                </h2>
                <p className="text-gray-600">
                  여권 데이터 페이지를 스캔해주세요
                </p>
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
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  스캔 완료!
                </h2>
                <p className="text-gray-600">
                  추출된 정보를 확인해주세요
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="text-sm text-gray-600 block mb-1">성명</label>
                  <p className="font-semibold text-gray-900">{ocrResult.data.fullName}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="text-sm text-gray-600 block mb-1">여권번호</label>
                  <p className="font-semibold text-gray-900">{ocrResult.data.passportNumber}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="text-sm text-gray-600 block mb-1">국적</label>
                  <p className="font-semibold text-gray-900">{ocrResult.data.nationality}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="text-sm text-gray-600 block mb-1">유효기간</label>
                  <p className="font-semibold text-gray-900">{ocrResult.data.expiryDate}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('kyc')}
                  className="flex-1 px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 rounded-xl font-semibold border-2 border-gray-200 transition-colors"
                >
                  다시 스캔
                </button>
                <button
                  onClick={handleKYCSubmit}
                  disabled={kycProcessing}
                  className="flex-1 px-6 py-3 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  {kycProcessing ? '처리 중...' : '확인 및 제출'}
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
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Ghost Wallet 활성화 완료!
                </h2>
                <p className="text-gray-600">
                  이제 포인트를 충전하고 결제를 시작하세요
                </p>
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
                    currency="USD"
                    status="active"
                  />
                </div>

                {/* Top-up Widget */}
                <div>
                  {step === 'wallet' ? (
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-6">
                        지갑 준비 완료!
                      </h3>
                      <div className="space-y-4 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">✅</div>
                          <div>
                            <p className="font-semibold text-gray-900">KYC 인증 완료</p>
                            <p className="text-sm text-gray-600">본인인증이 완료되었습니다</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">💳</div>
                          <div>
                            <p className="font-semibold text-gray-900">가상 카드 준비됨</p>
                            <p className="text-sm text-gray-600">결제 준비가 완료되었습니다</p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setStep('topup')}
                        className="w-full px-6 py-4 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-semibold transition-colors"
                      >
                        포인트 충전하기 →
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
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                모든 설정 완료!
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                K-Universal Ghost Wallet을 사용할 준비가 되었습니다
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-3xl mx-auto">
                <div className="p-6 bg-white rounded-xl shadow-sm">
                  <div className="text-3xl mb-2">✅</div>
                  <p className="font-semibold text-gray-900">KYC 인증</p>
                  <p className="text-sm text-gray-600">완료</p>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm">
                  <div className="text-3xl mb-2">💳</div>
                  <p className="font-semibold text-gray-900">가상 카드</p>
                  <p className="text-sm text-gray-600">활성화됨</p>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm">
                  <div className="text-3xl mb-2">💰</div>
                  <p className="font-semibold text-gray-900">잔액</p>
                  <p className="text-sm text-gray-600">${walletState?.balance || 0}</p>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => (window.location.href = '/wallet')}
                  className="px-8 py-4 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-semibold transition-colors"
                >
                  지갑으로 이동 →
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 rounded-xl font-semibold border-2 border-gray-200 transition-colors"
                >
                  데모 다시하기
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
