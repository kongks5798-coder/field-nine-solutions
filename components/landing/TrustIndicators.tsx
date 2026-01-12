/**
 * TrustIndicators Component - 신뢰감 구축 시각적 요소
 * 
 * 비즈니스 목적:
 * - 3개 핵심 기능을 시각적으로 표현하여 신뢰감 구축
 * - 사용자의 구매 결정을 돕는 사회적 증거 제공
 * - Tesla Style 엄격 준수
 */
export default function TrustIndicators() {
  const features = [
    {
      icon: '📊',
      title: '인스타그램 & 틱톡',
      description: '수백만 게시물을 실시간으로 분석',
      label: '실시간 분석',
    },
    {
      icon: '🤖',
      title: '다음 주 트렌드',
      description: 'GPU 기반 비전 AI로 정확한 예측',
      label: 'AI 예측',
    },
    {
      icon: '📈',
      title: '베스트셀러 예측',
      description: '다음 주 인기 아이템 사전 파악',
      label: '판매량 예측',
    },
  ];

  return (
    <div className="mt-32 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div key={index} className="space-y-4 text-center">
            <div 
              className="h-40 bg-white border border-[#E5E5E5] flex items-center justify-center rounded-sm"
              style={{ borderRadius: '4px' }}
            >
              <div className="text-center space-y-2">
                <div 
                  className="w-16 h-16 mx-auto bg-[#F9F9F7] border border-[#E5E5E5] rounded-sm flex items-center justify-center"
                  style={{ borderRadius: '4px' }}
                >
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <p className="text-sm text-[#171717]/60 mt-2">{feature.label}</p>
              </div>
            </div>
            <h3 className="font-semibold text-[#171717]">{feature.title}</h3>
            <p className="text-sm text-[#171717]/60">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
