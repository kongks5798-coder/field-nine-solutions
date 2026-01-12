import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F9F9F7] flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-8 text-center">
        <h1 className="text-6xl font-bold text-gray-900 tracking-tight">
          K-Universal
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Production-grade passport e-KYC verification and Ghost Wallet system.
          Built with Tesla/Apple-level standards.
        </p>
        
        <div className="flex gap-4 justify-center pt-8">
          <Link
            href="/dashboard"
            className="px-8 py-4 bg-[#0066FF] text-white rounded-lg font-semibold hover:bg-[#0052CC] transition-colors"
          >
            대시보드 열기
          </Link>
          <Link
            href="/kyc"
            className="px-8 py-4 bg-white text-gray-900 rounded-lg font-semibold border-2 border-gray-200 hover:border-gray-300 transition-colors"
          >
            e-KYC 시작
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16">
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <div className="text-4xl mb-4">🛂</div>
            <h3 className="text-lg font-semibold mb-2">Passport OCR</h3>
            <p className="text-sm text-gray-600">
              Real-time passport scanning with MRZ extraction
            </p>
          </div>
          
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <div className="text-4xl mb-4">👻</div>
            <h3 className="text-lg font-semibold mb-2">Ghost Wallet</h3>
            <p className="text-sm text-gray-600">
              Non-custodial crypto wallet with biometric auth
            </p>
          </div>
          
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="text-lg font-semibold mb-2">Geospatial Dashboard</h3>
            <p className="text-sm text-gray-600">
              Google Maps integration for location services
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
