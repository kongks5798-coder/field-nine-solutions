/**
 * K-UNIVERSAL KYC Page (i18n)
 * Passport e-KYC verification with mock mode
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';

// Generate realistic mock passport data
function generateMockPassportData() {
  const firstNames = ['JOHN', 'EMMA', 'MICHAEL', 'SOPHIA', 'WILLIAM', 'OLIVIA', 'JAMES', 'AVA'];
  const lastNames = ['SMITH', 'JOHNSON', 'WILLIAMS', 'BROWN', 'JONES', 'GARCIA', 'MILLER', 'DAVIS'];
  const nationalities = ['USA', 'GBR', 'CAN', 'AUS', 'DEU', 'FRA', 'JPN', 'KOR'];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const nationality = nationalities[Math.floor(Math.random() * nationalities.length)];
  const passportNumber = `${nationality.charAt(0)}${Math.random().toString().slice(2, 10)}`;

  return {
    fullName: `${firstName} ${lastName}`,
    passportNumber,
    nationality,
    dateOfBirth: '1990-01-15',
    expiryDate: '2030-01-15',
    gender: Math.random() > 0.5 ? 'M' : 'F',
  };
}

export default function KYCPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'upload' | 'processing' | 'complete'>('upload');
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [verifiedData, setVerifiedData] = useState<ReturnType<typeof generateMockPassportData> | null>(null);
  const [scanPhase, setScanPhase] = useState<'detecting' | 'reading' | 'verifying'>('detecting');
  const [fileError, setFileError] = useState<string | null>(null);
  const t = useTranslations('kyc');
  const locale = useLocale();

  // Simulate OCR scanning phases
  useEffect(() => {
    if (step === 'processing') {
      const phases: Array<'detecting' | 'reading' | 'verifying'> = ['detecting', 'reading', 'verifying'];
      let phaseIndex = 0;

      const phaseInterval = setInterval(() => {
        phaseIndex = Math.min(phaseIndex + 1, phases.length - 1);
        setScanPhase(phases[phaseIndex]);
      }, 1000);

      return () => clearInterval(phaseInterval);
    }
  }, [step]);

  // File upload handling with OCR processing
  const handleFileSelect = async (file: File) => {
    setFileError(null);

    if (!file.type.startsWith('image/')) {
      setFileError(t('errors.invalid'));
      return;
    }

    // Set image preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Move to processing step
    setStep('processing');
    setProgress(0);
    setScanPhase('detecting');

    // OCR processing with consistent timing
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        // Consistent increment for predictable progress
        return Math.min(prev + 5, 100);
      });
    }, 200);

    // Complete after processing
    setTimeout(() => {
      clearInterval(progressInterval);
      setProgress(100);

      // Generate mock verified data
      const mockData = generateMockPassportData();
      setVerifiedData(mockData);

      setStep('complete');
    }, 3500);
  };

  // 파일 드롭 처리
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  // Wallet으로 이동
  const goToWallet = () => {
    router.push(`/${locale}/wallet`);
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
          <p className="text-gray-600">{t('subtitle')}</p>
          {/* Mock Mode Badge */}
          <span className="inline-block mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
            DEMO MODE
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
            <span className="text-sm mt-2 text-gray-600">{t('upload.title')}</span>
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
            <span className="text-sm mt-2 text-gray-600">{t('processing.title')}</span>
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
            <span className="text-sm mt-2 text-gray-600">{t('success.title')}</span>
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
              <h3 className="text-lg font-semibold mb-2">{t('upload.title')}</h3>
              <p className="text-sm text-gray-600 mb-4">{t('upload.drag')}</p>
              <button className="px-6 py-3 bg-[#0066FF] text-white rounded-lg font-semibold hover:bg-[#0052CC] transition-colors">
                {t('upload.browse')}
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">📋 {t('upload.supported')}</h4>
            </div>
          </div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="text-center py-8">
            {/* Image Preview with Scanning Effect */}
            {preview && (
              <div className="mb-6 relative">
                <img
                  src={preview}
                  alt="Uploaded document"
                  className="max-h-48 mx-auto rounded-lg shadow-md"
                />
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center overflow-hidden">
                  {/* Scanning line animation */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute left-0 right-0 h-1 bg-[#0066FF] opacity-70 animate-scan" />
                  </div>
                  <span className="text-white text-3xl">
                    {scanPhase === 'detecting' && '📷'}
                    {scanPhase === 'reading' && '📄'}
                    {scanPhase === 'verifying' && '🔐'}
                  </span>
                </div>
              </div>
            )}

            {/* Scan Phase Indicator */}
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">
                {scanPhase === 'detecting' && 'Detecting Document...'}
                {scanPhase === 'reading' && 'Reading Information...'}
                {scanPhase === 'verifying' && 'Verifying Identity...'}
              </h3>
              <div className="flex justify-center gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs ${scanPhase === 'detecting' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Detect</span>
                <span className={`px-3 py-1 rounded-full text-xs ${scanPhase === 'reading' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Read</span>
                <span className={`px-3 py-1 rounded-full text-xs ${scanPhase === 'verifying' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Verify</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-md mx-auto">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#0066FF] to-[#00C853] transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">{Math.round(progress)}%</p>
            </div>

            <style jsx>{`
              @keyframes scan {
                0% { top: 0; }
                50% { top: 100%; }
                100% { top: 0; }
              }
              .animate-scan {
                animation: scan 2s ease-in-out infinite;
              }
            `}</style>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && verifiedData && (
          <div className="text-center py-8">
            {/* Success Animation */}
            <div className="text-7xl mb-4 animate-bounce">✅</div>
            <h3 className="text-2xl font-bold mb-2 text-[#00C853]">{t('success.title')}</h3>
            <p className="text-gray-600 mb-4">{t('success.subtitle')}</p>

            {/* Verified Data Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-8 text-left max-w-sm mx-auto shadow-sm">
              <h4 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                <span className="text-xl">🛂</span> Verified Information
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-green-100">
                  <span className="text-gray-500">{t('fields.fullName')}</span>
                  <span className="font-semibold text-gray-900">{verifiedData.fullName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-green-100">
                  <span className="text-gray-500">{t('fields.passportNumber')}</span>
                  <span className="font-mono font-semibold text-gray-900">{verifiedData.passportNumber}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-green-100">
                  <span className="text-gray-500">{t('fields.nationality')}</span>
                  <span className="font-semibold text-gray-900">{verifiedData.nationality}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-500">Status</span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                    VERIFIED ✓
                  </span>
                </div>
              </div>
            </div>

            {/* Demo Badge */}
            <div className="mb-6">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                🎭 DEMO MODE - Data is simulated
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={goToWallet}
                className="w-full max-w-sm px-8 py-4 bg-[#0066FF] text-white rounded-xl font-semibold hover:bg-[#0052CC] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                👻 {t('success.goToWallet')}
              </button>
              <button
                onClick={() => router.push(`/${locale}/dashboard`)}
                className="w-full max-w-sm px-8 py-3 bg-white text-gray-700 rounded-xl font-semibold border-2 border-gray-200 hover:bg-gray-50 transition-colors"
              >
                📊 Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
