'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 63: MARKET OVERVIEW - KAUS & Energy Markets
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 통합 시장 데이터 대시보드:
 * - KAUS 가격 차트 (Phase 62)
 * - 에너지 가격 (SMP, REC)
 * - API 상품 마켓플레이스
 * - 모바일 반응형
 *
 * @route /nexus/market
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FinancialSidebar, PriceTicker, MembershipBar } from '@/components/nexus/financial-terminal';
import { MobileBottomNav, MobileHeader } from '@/components/nexus/mobile-nav';
import { KausPriceChart, EnergyPriceChart, MiniChart } from '@/components/nexus/price-chart';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type MarketTab = 'overview' | 'kaus' | 'energy' | 'api';

interface ApiProduct {
  id: string;
  name: string;
  desc: string;
  price: number;
  period: string;
  calls: string;
  icon: string;
  features: string[];
  hot: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════════════════

const API_PRODUCTS: ApiProduct[] = [
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

const MARKET_STATS = [
  { label: 'KAUS Price', value: '₩1.00', change: '+0.0%', positive: true },
  { label: '24h Volume', value: '1.2M', change: '+12.5%', positive: true },
  { label: 'SMP Price', value: '₩127/kWh', change: '-2.3%', positive: false },
  { label: 'REC Price', value: '₩45,200', change: '+5.8%', positive: true },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function MarketOverview() {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {MARKET_STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-4 border border-[#171717]/10"
          >
            <div className="text-xs text-[#171717]/50 mb-1">{stat.label}</div>
            <div className="text-2xl font-black text-[#171717]">{stat.value}</div>
            <div className={`text-xs font-bold ${stat.positive ? 'text-emerald-500' : 'text-red-500'}`}>
              {stat.change}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KAUS Mini Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl p-4 border border-[#171717]/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-[#171717]">KAUS/KRW</h3>
              <p className="text-xs text-[#171717]/50">Energy-Backed Token</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-[#171717]">₩1.00</div>
              <div className="text-xs text-emerald-500">Stable</div>
            </div>
          </div>
          <MiniChart basePrice={1.0} volatility={0.005} color="#10b981" />
        </motion.div>

        {/* SMP Mini Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl p-4 border border-[#171717]/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-[#171717]">SMP Price</h3>
              <p className="text-xs text-[#171717]/50">System Marginal Price</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-[#171717]">₩127/kWh</div>
              <div className="text-xs text-red-500">-2.3%</div>
            </div>
          </div>
          <MiniChart basePrice={127} volatility={0.08} color="#3b82f6" />
        </motion.div>
      </div>

      {/* Market Insight */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#171717] to-[#2a2a2a] rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
            <span className="text-xl">💡</span>
          </div>
          <div>
            <h3 className="font-bold">Market Insight</h3>
            <p className="text-xs text-white/50">Prophet AI Analysis</p>
          </div>
        </div>
        <p className="text-sm text-white/80 mb-4">
          현재 SMP가 ₩127/kWh로 하락세입니다. 오후 피크 시간대(14:00-18:00)에
          ₩145-155 구간으로 반등 예상. V2G 방전 준비 권장.
        </p>
        <div className="flex gap-4">
          <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
            <div className="text-xs text-white/50">Buy Signal</div>
            <div className="text-lg font-bold text-cyan-400">HOLD</div>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
            <div className="text-xs text-white/50">Confidence</div>
            <div className="text-lg font-bold text-amber-400">78%</div>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
            <div className="text-xs text-white/50">Next Peak</div>
            <div className="text-lg font-bold text-emerald-400">14:00</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ApiMarketplace({ onPurchase }: { onPurchase: (id: string, price: number) => void }) {
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = async (productId: string, price: number) => {
    setPurchasing(productId);
    try {
      await onPurchase(productId, price);
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {API_PRODUCTS.map((product, i) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ y: -4 }}
          className={`rounded-2xl p-6 border-2 transition-all ${
            product.hot
              ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300'
              : 'bg-white border-[#171717]/10'
          }`}
        >
          {product.hot && (
            <div className="inline-block px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold rounded-full mb-3">
              POPULAR
            </div>
          )}

          <div className="flex items-start gap-3 mb-4">
            <div className="text-4xl">{product.icon}</div>
            <div>
              <h3 className="font-bold text-[#171717] text-lg">{product.name}</h3>
              <p className="text-xs text-[#171717]/60">{product.calls}</p>
            </div>
          </div>

          <p className="text-sm text-[#171717]/70 mb-4">{product.desc}</p>

          <ul className="space-y-2 mb-6">
            {product.features.map((feature, fi) => (
              <li key={fi} className="flex items-center gap-2 text-sm text-[#171717]/80">
                <span className="text-emerald-500">✓</span>
                {feature}
              </li>
            ))}
          </ul>

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
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function MarketPage() {
  const [activeTab, setActiveTab] = useState<MarketTab>('overview');

  const handleApiPurchase = async (productId: string, price: number) => {
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
    }
  };

  const tabs = [
    { id: 'overview' as MarketTab, label: '개요', icon: '📊' },
    { id: 'kaus' as MarketTab, label: 'KAUS', icon: '💎' },
    { id: 'energy' as MarketTab, label: '에너지', icon: '⚡' },
    { id: 'api' as MarketTab, label: 'API 마켓', icon: '🛒' },
  ];

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      {/* Desktop: Financial Terminal Sidebar */}
      <div className="hidden md:block">
        <FinancialSidebar />
      </div>

      {/* Mobile: Header */}
      <div className="md:hidden">
        <MobileHeader title="Market" />
      </div>

      <div className="md:ml-56">
        {/* Desktop Only */}
        <div className="hidden md:block">
          <PriceTicker />
          <MembershipBar />
        </div>

        <main className="p-4 md:p-6 pb-24 md:pb-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-2xl font-bold text-[#171717]">Market Overview</h1>
              <p className="text-sm text-[#171717]/60">KAUS & Energy Markets</p>
            </motion.div>

            {/* Tab Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#171717] text-white'
                      : 'bg-white text-[#171717]/70 border border-[#171717]/10'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </motion.button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'overview' && <MarketOverview />}

                {activeTab === 'kaus' && (
                  <KausPriceChart />
                )}

                {activeTab === 'energy' && (
                  <div className="space-y-6">
                    <EnergyPriceChart energyType="SMP" />
                    <EnergyPriceChart energyType="REC" />
                  </div>
                )}

                {activeTab === 'api' && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl p-4 border border-amber-500/20">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🚀</span>
                        <div>
                          <h3 className="font-bold text-[#171717]">Energy API Marketplace</h3>
                          <p className="text-sm text-[#171717]/60">실물 자산 기반 프리미엄 에너지 API</p>
                        </div>
                      </div>
                    </div>
                    <ApiMarketplace onPurchase={handleApiPurchase} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile: Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
