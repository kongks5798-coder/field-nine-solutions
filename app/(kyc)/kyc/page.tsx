'use client';

import { useState } from 'react';

export default function KYCPage() {
  const [step, setStep] = useState<'upload' | 'processing' | 'complete'>('upload');

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Passport e-KYC Verification
          </h1>
          <p className="text-gray-600">
            Secure identity verification in under 2 minutes
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold ${
              step === 'upload' ? 'bg-[#0066FF] text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <span className="text-sm mt-2 text-gray-600">Upload</span>
          </div>
          <div className="flex-1 h-1 bg-gray-200 mx-4" />
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold ${
              step === 'processing' ? 'bg-[#0066FF] text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <span className="text-sm mt-2 text-gray-600">Processing</span>
          </div>
          <div className="flex-1 h-1 bg-gray-200 mx-4" />
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold ${
              step === 'complete' ? 'bg-[#00C853] text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
            <span className="text-sm mt-2 text-gray-600">Complete</span>
          </div>
        </div>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-[#0066FF] transition-colors cursor-pointer">
              <div className="text-6xl mb-4">🛂</div>
              <h3 className="text-lg font-semibold mb-2">Upload Passport Photo</h3>
              <p className="text-sm text-gray-600 mb-4">
                Take a clear photo of your passport's data page
              </p>
              <button className="px-6 py-3 bg-[#0066FF] text-white rounded-lg font-semibold hover:bg-[#0052CC] transition-colors">
                Choose File or Take Photo
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">📋 Requirements:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Clear, well-lit photo of passport data page</li>
                <li>• All text must be readable</li>
                <li>• No glare or shadows</li>
                <li>• Valid passport (not expired)</li>
              </ul>
            </div>
          </div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 animate-pulse">🔍</div>
            <h3 className="text-xl font-semibold mb-2">Verifying Your Document...</h3>
            <p className="text-gray-600">
              Our AI is analyzing your passport. This usually takes 30-60 seconds.
            </p>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold mb-2 text-[#00C853]">
              Verification Complete!
            </h3>
            <p className="text-gray-600 mb-8">
              Your identity has been successfully verified.
            </p>
            <button className="px-8 py-3 bg-[#0066FF] text-white rounded-lg font-semibold hover:bg-[#0052CC] transition-colors">
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
