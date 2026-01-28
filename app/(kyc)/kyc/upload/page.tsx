/**
 * K-UNIVERSAL KYC Upload Page
 * Apple Wallet-style passport scanning
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PassportUpload } from '@/components/kyc/passport-upload';
import type { OCRResult } from '@/lib/ocr/passport-scanner';

export default function KYCUploadPage() {
  const [step, setStep] = useState<'upload' | 'review' | 'success'>('upload');
  const [ocrData, setOcrData] = useState<OCRResult | null>(null);

  const handleSuccess = async (data: OCRResult) => {
    setOcrData(data);
    setStep('review');
  };

  const handleSubmit = async () => {
    if (!ocrData?.data) return;

    try {
      const response = await fetch('/api/kyc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user-id',
          passportData: ocrData.data,
          documentImageUrl: 'demo-image-url',
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStep('success');
      } else {
        console.error('[KYC] Submission error:', result.error);
        setStep('upload'); // Reset to upload step
      }
    } catch (error) {
      console.error('[KYC] Submission failed:', error);
      setStep('upload'); // Reset to upload step
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🛂 Identity Verification
          </h1>
          <p className="text-xl text-gray-600">
            Secure your account with passport e-KYC
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          {['Upload', 'Review', 'Complete'].map((label, index) => (
            <div key={label} className="flex items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                  ${
                    index === 0 && step === 'upload'
                      ? 'bg-[#0066FF] text-white'
                      : index === 1 && step === 'review'
                      ? 'bg-[#0066FF] text-white'
                      : index === 2 && step === 'success'
                      ? 'bg-[#00C853] text-white'
                      : 'bg-gray-200 text-gray-600'
                  }
                `}
              >
                {index + 1}
              </div>
              <span className="ml-2 mr-4 text-sm font-medium text-gray-700">
                {label}
              </span>
              {index < 2 && (
                <div className="w-12 h-1 bg-gray-200 mr-4" />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        {step === 'upload' && (
          <PassportUpload
            onSuccess={handleSuccess}
            onError={(error) => console.error('[KYC] Upload error:', error)}
          />
        )}

        {step === 'review' && ocrData?.data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Review Your Information
            </h2>

            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Full Name</label>
                  <p className="font-semibold text-gray-900">
                    {ocrData.data.fullName}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Passport Number</label>
                  <p className="font-semibold text-gray-900">
                    {ocrData.data.passportNumber}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Date of Birth</label>
                  <p className="font-semibold text-gray-900">
                    {ocrData.data.dateOfBirth}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Nationality</label>
                  <p className="font-semibold text-gray-900">
                    {ocrData.data.nationality}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Expiry Date</label>
                  <p className="font-semibold text-gray-900">
                    {ocrData.data.expiryDate}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Confidence</label>
                  <p className="font-semibold text-gray-900">
                    {Math.round(ocrData.confidence * 100)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep('upload')}
                className="flex-1 px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 rounded-xl font-semibold border-2 border-gray-200 transition-colors"
              >
                Re-scan
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-6 py-3 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-semibold transition-colors"
              >
                Confirm & Submit
              </button>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-lg p-12 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="text-8xl mb-6"
            >
              ✅
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Verification Complete!
            </h2>
            <p className="text-gray-600 mb-8">
              Your identity has been successfully verified. You can now access all Ghost Wallet features.
            </p>
            <button
              onClick={() => (window.location.href = '/wallet')}
              className="px-8 py-4 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-semibold transition-colors"
            >
              Go to Wallet →
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
