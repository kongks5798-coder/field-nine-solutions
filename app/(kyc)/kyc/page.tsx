'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function KYCPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'upload' | 'processing' | 'complete'>('upload');
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Mock 파일 업로드 처리
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      console.warn('[KYC] Invalid file type:', file.type);
      return;
    }

    // 이미지 미리보기 설정
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Processing 단계로 이동
    setStep('processing');
    setProgress(0);

    // Mock 처리: 3초 동안 프로그레스 바 애니메이션
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    // 3초 후 완료 처리
    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setStep('complete');
    }, 3000);
  };

  // 파일 드롭 처리
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  // Wallet으로 이동
  const goToWallet = () => {
    router.push('/wallet');
  };

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
          {/* Mock Mode Badge */}
          <span className="inline-block mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
            DEMO MODE - Any image will pass
          </span>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-colors ${
              step === 'upload' ? 'bg-[#0066FF] text-white' :
              step === 'processing' || step === 'complete' ? 'bg-[#00C853] text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {step === 'processing' || step === 'complete' ? '✓' : '1'}
            </div>
            <span className="text-sm mt-2 text-gray-600">Upload</span>
          </div>
          <div className={`flex-1 h-1 mx-4 transition-colors ${
            step === 'processing' || step === 'complete' ? 'bg-[#00C853]' : 'bg-gray-200'
          }`} />
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-colors ${
              step === 'processing' ? 'bg-[#0066FF] text-white' :
              step === 'complete' ? 'bg-[#00C853] text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {step === 'complete' ? '✓' : '2'}
            </div>
            <span className="text-sm mt-2 text-gray-600">Processing</span>
          </div>
          <div className={`flex-1 h-1 mx-4 transition-colors ${
            step === 'complete' ? 'bg-[#00C853]' : 'bg-gray-200'
          }`} />
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-colors ${
              step === 'complete' ? 'bg-[#00C853] text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {step === 'complete' ? '✓' : '3'}
            </div>
            <span className="text-sm mt-2 text-gray-600">Complete</span>
          </div>
        </div>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-[#0066FF] transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
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
          <div className="text-center py-8">
            {/* Image Preview */}
            {preview && (
              <div className="mb-6 relative">
                <img
                  src={preview}
                  alt="Uploaded document"
                  className="max-h-48 mx-auto rounded-lg shadow-md"
                />
                <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                  <span className="text-white text-4xl animate-pulse">🔍</span>
                </div>
              </div>
            )}

            <h3 className="text-xl font-semibold mb-2">Verifying Your Document...</h3>
            <p className="text-gray-600 mb-6">
              Our AI is analyzing your passport. This usually takes 30-60 seconds.
            </p>

            {/* Progress Bar */}
            <div className="w-full max-w-md mx-auto">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0066FF] transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">{progress}% complete</p>
            </div>

            {/* Processing Steps */}
            <div className="mt-6 text-left max-w-sm mx-auto space-y-2">
              <p className={`text-sm flex items-center gap-2 ${progress >= 30 ? 'text-green-600' : 'text-gray-400'}`}>
                {progress >= 30 ? '✓' : '○'} Extracting MRZ data...
              </p>
              <p className={`text-sm flex items-center gap-2 ${progress >= 60 ? 'text-green-600' : 'text-gray-400'}`}>
                {progress >= 60 ? '✓' : '○'} Validating passport information...
              </p>
              <p className={`text-sm flex items-center gap-2 ${progress >= 90 ? 'text-green-600' : 'text-gray-400'}`}>
                {progress >= 90 ? '✓' : '○'} Completing verification...
              </p>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <div className="text-center py-8">
            {/* Success Animation */}
            <div className="text-7xl mb-4 animate-bounce">✅</div>
            <h3 className="text-2xl font-bold mb-2 text-[#00C853]">
              Verification Complete!
            </h3>
            <p className="text-gray-600 mb-4">
              Your identity has been successfully verified.
            </p>

            {/* Mock Verified Data */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8 text-left max-w-sm mx-auto">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                <span>🛂</span> Verified Information
              </h4>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">Name:</span> <span className="font-medium">DEMO USER</span></p>
                <p><span className="text-gray-500">Passport:</span> <span className="font-medium">M12345678</span></p>
                <p><span className="text-gray-500">Nationality:</span> <span className="font-medium">KOR</span></p>
                <p><span className="text-gray-500">Status:</span> <span className="text-green-600 font-semibold">VERIFIED ✓</span></p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={goToWallet}
                className="w-full max-w-sm px-8 py-4 bg-[#0066FF] text-white rounded-xl font-semibold hover:bg-[#0052CC] transition-colors shadow-lg"
              >
                👻 Go to Ghost Wallet
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full max-w-sm px-8 py-3 bg-white text-gray-700 rounded-xl font-semibold border-2 border-gray-200 hover:bg-gray-50 transition-colors"
              >
                📊 Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
