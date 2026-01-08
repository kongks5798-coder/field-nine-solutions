export default function CasesPage() {
  return (
    <div className="bg-black text-white min-h-screen">
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl sm:text-6xl font-bold mb-6">
              고객 <span className="text-green-500">사례</span>
            </h1>
            <p className="text-xl text-gray-400">
              Field Nine과 함께 성장한 기업들의 이야기
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 사례 1 */}
            <div className="bg-gray-900/50 border border-green-500/20 rounded-xl p-8 hover:border-green-500/50 transition-all">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-green-500">A</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">테크스타트업 A사</h3>
                <p className="text-gray-400 text-sm">IT 서비스 · 직원 50명</p>
              </div>
              <p className="text-gray-300 mb-4 leading-relaxed">
                "Field Nine의 솔루션을 도입한 후 데이터 처리 속도가 300% 향상되었고, 
                고객 만족도가 크게 개선되었습니다. 특히 실시간 분석 기능이 비즈니스 의사결정에 
                큰 도움이 되고 있습니다."
              </p>
              <div className="pt-4 border-t border-green-500/20">
                <p className="text-green-500 font-semibold">주요 성과</p>
                <ul className="mt-2 space-y-1 text-sm text-gray-400">
                  <li>• 처리 속도 300% 향상</li>
                  <li>• 고객 만족도 40% 증가</li>
                  <li>• 운영 비용 25% 절감</li>
                </ul>
              </div>
            </div>

            {/* 사례 2 */}
            <div className="bg-gray-900/50 border border-green-500/20 rounded-xl p-8 hover:border-green-500/50 transition-all">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-green-500">B</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">제조업체 B사</h3>
                <p className="text-gray-400 text-sm">제조업 · 직원 200명</p>
              </div>
              <p className="text-gray-300 mb-4 leading-relaxed">
                "대규모 데이터를 안전하게 관리하고 분석할 수 있는 플랫폼이 필요했는데, 
                Field Nine의 엔터프라이즈 솔루션이 완벽하게 맞았습니다. 보안 수준도 매우 높아 
                안심하고 사용할 수 있습니다."
              </p>
              <div className="pt-4 border-t border-green-500/20">
                <p className="text-green-500 font-semibold">주요 성과</p>
                <ul className="mt-2 space-y-1 text-sm text-gray-400">
                  <li>• 데이터 처리 시간 80% 단축</li>
                  <li>• 보안 사고 0건 유지</li>
                  <li>• 생산성 35% 향상</li>
                </ul>
              </div>
            </div>

            {/* 사례 3 */}
            <div className="bg-gray-900/50 border border-green-500/20 rounded-xl p-8 hover:border-green-500/50 transition-all">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-green-500">C</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">금융 서비스 C사</h3>
                <p className="text-gray-400 text-sm">금융 · 직원 150명</p>
              </div>
              <p className="text-gray-300 mb-4 leading-relaxed">
                "금융 규제를 완벽하게 준수하면서도 혁신적인 기능을 제공하는 Field Nine의 
                솔루션 덕분에 고객 서비스 품질이 크게 향상되었습니다. 전담 지원팀의 빠른 
                대응도 매우 만족스럽습니다."
              </p>
              <div className="pt-4 border-t border-green-500/20">
                <p className="text-green-500 font-semibold">주요 성과</p>
                <ul className="mt-2 space-y-1 text-sm text-gray-400">
                  <li>• 규제 준수 100% 달성</li>
                  <li>• 고객 응대 시간 50% 단축</li>
                  <li>• 시스템 가동률 99.9% 유지</li>
                </ul>
              </div>
            </div>

            {/* 사례 4 */}
            <div className="bg-gray-900/50 border border-green-500/20 rounded-xl p-8 hover:border-green-500/50 transition-all">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-green-500">D</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">이커머스 D사</h3>
                <p className="text-gray-400 text-sm">전자상거래 · 직원 80명</p>
              </div>
              <p className="text-gray-300 mb-4 leading-relaxed">
                "트래픽이 급증하는 시즌에도 안정적으로 서비스를 제공할 수 있게 되었습니다. 
                확장 가능한 인프라 덕분에 비즈니스 성장에 집중할 수 있게 되었어요."
              </p>
              <div className="pt-4 border-t border-green-500/20">
                <p className="text-green-500 font-semibold">주요 성과</p>
                <ul className="mt-2 space-y-1 text-sm text-gray-400">
                  <li>• 피크 트래픽 대응 100%</li>
                  <li>• 페이지 로딩 속도 60% 개선</li>
                  <li>• 매출 45% 증가</li>
                </ul>
              </div>
            </div>

            {/* 사례 5 */}
            <div className="bg-gray-900/50 border border-green-500/20 rounded-xl p-8 hover:border-green-500/50 transition-all">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-green-500">E</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">헬스케어 E사</h3>
                <p className="text-gray-400 text-sm">의료 서비스 · 직원 120명</p>
              </div>
              <p className="text-gray-300 mb-4 leading-relaxed">
                "환자 데이터의 보안과 프라이버시가 가장 중요한데, Field Nine의 엔터프라이즈 
                보안 솔루션이 모든 요구사항을 충족했습니다. 의료진의 업무 효율성도 크게 
                향상되었습니다."
              </p>
              <div className="pt-4 border-t border-green-500/20">
                <p className="text-green-500 font-semibold">주요 성과</p>
                <ul className="mt-2 space-y-1 text-sm text-gray-400">
                  <li>• 데이터 보안 인증 획득</li>
                  <li>• 진료 프로세스 30% 개선</li>
                  <li>• 환자 만족도 50% 향상</li>
                </ul>
              </div>
            </div>

            {/* 사례 6 */}
            <div className="bg-gray-900/50 border border-green-500/20 rounded-xl p-8 hover:border-green-500/50 transition-all">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-green-500">F</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">교육 플랫폼 F사</h3>
                <p className="text-gray-400 text-sm">교육 서비스 · 직원 60명</p>
              </div>
              <p className="text-gray-300 mb-4 leading-relaxed">
                "온라인 교육 플랫폼의 안정성과 확장성이 크게 개선되었습니다. Field Nine의 
                솔루션으로 동시 접속자 수가 늘어도 끊김 없이 서비스를 제공할 수 있게 되었어요."
              </p>
              <div className="pt-4 border-t border-green-500/20">
                <p className="text-green-500 font-semibold">주요 성과</p>
                <ul className="mt-2 space-y-1 text-sm text-gray-400">
                  <li>• 동시 접속자 500% 증가</li>
                  <li>• 서비스 안정성 99.8% 달성</li>
                  <li>• 사용자 이탈률 40% 감소</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <p className="text-gray-400 mb-6">당신의 성공 스토리도 함께 만들어가요</p>
            <a 
              href="/contact" 
              className="inline-block px-8 py-4 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-400 transition-colors"
            >
              무료 상담 신청하기
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
