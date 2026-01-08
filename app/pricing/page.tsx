import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="bg-black text-white min-h-screen">
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl sm:text-6xl font-bold mb-6">
              요금 <span className="text-green-500">안내</span>
            </h1>
            <p className="text-xl text-gray-400">
              비즈니스 규모에 맞는 최적의 플랜을 선택하세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Basic Plan */}
            <div className="bg-gray-900/50 border border-green-500/20 rounded-xl p-8 hover:border-green-500/50 transition-all">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Basic</h3>
                <p className="text-gray-400 mb-4">스타트업을 위한 시작 플랜</p>
                <div className="mb-4">
                  <span className="text-4xl font-bold">₩99,000</span>
                  <span className="text-gray-400">/월</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-300">최대 10명 사용자</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-300">기본 분석 도구</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-300">이메일 지원</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-300">50GB 저장 공간</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-300">기본 보안 기능</span>
                </li>
              </ul>
              <Link href="/login" className="block w-full px-6 py-3 border-2 border-green-500 text-green-500 font-semibold rounded-lg hover:bg-green-500/10 transition-all text-center">
                시작하기
              </Link>
            </div>

            {/* Pro Plan - 추천 */}
            <div className="bg-gray-900/50 border-2 border-green-500 rounded-xl p-8 hover:border-green-400 transition-all relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-black px-4 py-1 rounded-full text-sm font-semibold">
                  추천
                </span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <p className="text-gray-400 mb-4">성장하는 기업을 위한 플랜</p>
                <div className="mb-4">
                  <span className="text-4xl font-bold">₩299,000</span>
                  <span className="text-gray-400">/월</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-300">최대 50명 사용자</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-300">고급 분석 도구</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-300">우선 지원 (24시간 내 응답)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-300">500GB 저장 공간</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-300">고급 보안 및 백업</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-300">API 접근 권한</span>
                </li>
              </ul>
              <Link href="/login" className="block w-full px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-400 transition-all text-center">
                시작하기
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-gray-900/50 border border-green-500/20 rounded-xl p-8 hover:border-green-500/50 transition-all">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                <p className="text-gray-400 mb-4">대규모 기업을 위한 맞춤 플랜</p>
                <div className="mb-4">
                  <span className="text-4xl font-bold">맞춤</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-300">무제한 사용자</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-300">전문가 분석 및 컨설팅</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-300">전담 지원팀 (24/7)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-300">무제한 저장 공간</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-300">최고 수준 보안 및 규정 준수</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-300">맞춤형 통합 및 개발</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-300">SLA 보장</span>
                </li>
              </ul>
              <Link href="/contact" className="block w-full px-6 py-3 border-2 border-green-500 text-green-500 font-semibold rounded-lg hover:bg-green-500/10 transition-all text-center">
                영업팀 문의
              </Link>
            </div>
          </div>

          <div className="mt-16 text-center">
            <p className="text-gray-400 mb-4">모든 플랜에는 14일 무료 체험이 포함됩니다</p>
            <p className="text-sm text-gray-500">신용카드 없이 바로 시작할 수 있습니다</p>
          </div>
        </div>
      </section>
    </div>
  );
}
