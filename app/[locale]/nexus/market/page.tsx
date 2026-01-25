'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 44: API MARKET - Energy API Products
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FinancialSidebar, PriceTicker, MembershipBar } from '@/components/nexus/financial-terminal';

const API_PRODUCTS = [
  {
    id: 'v2g-control',
    name: 'V2G Control API',
    desc: 'Tesla 차량 충방전 원격 제어. 실시간 배터리 상태 모니터링 및 자동 트레이딩.',
    price: 500,
    period: '/month',
    calls: '1,000 calls',
    icon: '🔌',
    features: ['실시간 SoC 모니터링', '자동 충방전 스케줄', 'SMP 연동 트레이딩'],
    hot: true,
  },
  {
    id: 'yeongdong-feed',
    name: 'Yeongdong Data Feed',
    desc: '영동 100,000평 태양광 발전소 실시간 발전량 및 수익 데이터.',
    price: 300,
    period: '/month',
    calls: '10,000 calls',
    icon: '☀️',
    features: ['실시간 발전량(MW)', 'SMP 매칭 수익', '기상 데이터 연동'],
    hot: false,
  },
  {
    id: 'smp-oracle',
    name: 'SMP Price Oracle',
    desc: 'KPX 전력거래소 실시간 시장가. 5분 단위 가격 피드.',
    price: 200,
    period: '/month',
    calls: '50,000 calls',
    icon: '📊',
    features: ['5분 단위 SMP', '시간대별 예측', 'Historical Data'],
    hot: false,
  },
  {
    id: 'prophet-ai',
    name: 'Prophet AI Premium',
    desc: 'AI 기반 에너지 트레이딩 시그널. 최적 충방전 타이밍 추천.',
    price: 1000,
    period: '/month',
    calls: 'Unlimited',
    icon: '🔮',
    features: ['BUY/SELL 시그널', '수익 최적화', '자동 실행 옵션'],
    hot: true,
  },
  {
    id: 'compliance-suite',
    name: 'Compliance Suite',
    desc: 'RE100, ESG, CBAM 규정 준수 리포팅 자동화.',
    price: 800,
    period: '/month',
    calls: '5,000 calls',
    icon: '📋',
    features: ['RE100 인증', 'ESG 리포트', 'CBAM 대응'],
    hot: false,
  },
  {
    id: 'sovereign-bundle',
    name: 'Sovereign Bundle',
    desc: '모든 API 무제한 접근 + 전용 지원. 제국의 특권.',
    price: 2500,
    period: '/month',
    calls: 'Unlimited ALL',
    icon: '👑',
    features: ['전체 API 접근', '24/7 전용 지원', 'White-label 옵션'],
    hot: true,
  },
];

export default function MarketPage() {
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = async (productId: string, price: number) => {
    setPurchasing(productId);
    try {
      const response = await fetch('/api/kaus/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'sovereign-user',
          paymentMethod: 'kaus',
          productId,
          amount: price,
        }),
      });
      const data = await response.json();
      alert(data.success ? `✅ ${price} KAUS로 구매 완료!` : data.error);
    } catch {
      alert('결제 처리 중 오류');
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <FinancialSidebar />
      <div className="ml-56">
        <PriceTicker />
        <MembershipBar />

        <main className="p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[#171717]">Energy API Market</h1>
              <p className="text-sm text-[#171717]/60">실물 자산 기반 프리미엄 에너지 API</p>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {API_PRODUCTS.map(product => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  className={`rounded-2xl p-6 border-2 transition-all ${
                    product.hot
                      ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300'
                      : 'bg-white border-[#171717]/10'
                  }`}
                >
                  {/* Hot Badge */}
                  {product.hot && (
                    <div className="inline-block px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold rounded-full mb-3">
                      POPULAR
                    </div>
                  )}

                  {/* Icon & Name */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="text-4xl">{product.icon}</div>
                    <div>
                      <h3 className="font-bold text-[#171717] text-lg">{product.name}</h3>
                      <p className="text-xs text-[#171717]/60">{product.calls}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-[#171717]/70 mb-4">{product.desc}</p>

                  {/* Features */}
                  <ul className="space-y-2 mb-6">
                    {product.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-[#171717]/80">
                        <span className="text-emerald-500">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Price & CTA */}
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-3xl font-black text-[#171717]">{product.price}</span>
                      <span className="text-sm text-[#171717]/60 ml-1">KAUS{product.period}</span>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePurchase(product.id, product.price)}
                      disabled={purchasing === product.id}
                      className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                        purchasing === product.id
                          ? 'bg-[#171717]/50 text-white'
                          : 'bg-[#171717] text-white hover:bg-[#171717]/90'
                      }`}
                    >
                      {purchasing === product.id ? '처리중...' : 'Buy Now'}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
