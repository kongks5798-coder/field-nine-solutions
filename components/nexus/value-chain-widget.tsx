'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 42-43: VISUAL VALUE CHAIN & API SHOP
 * ═══════════════════════════════════════════════════════════════════════════════
 * Tesla/Yeongdong → API Stream → Kaus Treasury (3초 직관 이해)
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// VISUAL VALUE CHAIN - The "Aha" Moment
// ═══════════════════════════════════════════════════════════════════════════════

export function ValueChainWidget() {
  const [activeFlow, setActiveFlow] = useState(0);
  const [kausAccumulated, setKausAccumulated] = useState(0);

  useEffect(() => {
    const flowInterval = setInterval(() => {
      setActiveFlow(prev => (prev + 1) % 3);
    }, 2000);

    const kausInterval = setInterval(() => {
      setKausAccumulated(prev => prev + Math.floor(Math.random() * 50) + 10);
    }, 3000);

    return () => {
      clearInterval(flowInterval);
      clearInterval(kausInterval);
    };
  }, []);

  const nodes = [
    { id: 'asset', icon: '⚡', label: 'Physical Assets', sub: 'Tesla + Yeongdong 100K평' },
    { id: 'api', icon: '📡', label: 'API Stream', sub: 'Real-time Data Flow' },
    { id: 'treasury', icon: '💎', label: 'Kaus Treasury', sub: `+${kausAccumulated.toLocaleString()} KAUS` },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#171717] rounded-2xl p-6 relative overflow-hidden"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-cyan-500/5 to-amber-500/5" />

      {/* Header */}
      <div className="relative flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">Value Flow</h3>
          <p className="text-xs text-white/40">Asset → Data → Revenue</p>
        </div>
        <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
          <span className="text-xs text-emerald-400 font-bold">LIVE</span>
        </div>
      </div>

      {/* Flow Visualization */}
      <div className="relative flex items-center justify-between gap-4">
        {nodes.map((node, i) => (
          <div key={node.id} className="flex items-center flex-1">
            {/* Node */}
            <motion.div
              animate={{
                scale: activeFlow === i ? 1.1 : 1,
                boxShadow: activeFlow === i ? '0 0 30px rgba(16,185,129,0.4)' : 'none',
              }}
              className={`flex-1 p-4 rounded-xl text-center transition-all ${
                activeFlow === i
                  ? 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              <div className="text-3xl mb-2">{node.icon}</div>
              <div className="text-sm font-bold text-white">{node.label}</div>
              <div className={`text-xs mt-1 ${activeFlow === i ? 'text-emerald-400' : 'text-white/40'}`}>
                {node.sub}
              </div>
            </motion.div>

            {/* Arrow */}
            {i < nodes.length - 1 && (
              <motion.div
                animate={{ opacity: activeFlow === i ? 1 : 0.3 }}
                className="mx-2 text-emerald-400"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* Flowing Particles Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-emerald-400 rounded-full opacity-60"
            initial={{ x: '0%', y: '50%' }}
            animate={{ x: '100%' }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.6,
              ease: 'linear',
            }}
            style={{ top: `${40 + i * 5}%` }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// API SHOP - Monetized Product Cards
// ═══════════════════════════════════════════════════════════════════════════════

const API_PRODUCTS = [
  {
    id: 'v2g-control',
    name: 'V2G Control API',
    desc: 'Tesla 차량 충방전 원격 제어',
    price: 500,
    calls: '1,000 calls/month',
    icon: '🔌',
    hot: true,
  },
  {
    id: 'realtime-gen',
    name: 'Realtime Generation',
    desc: '영동 발전소 실시간 발전량',
    price: 300,
    calls: '10,000 calls/month',
    icon: '☀️',
    hot: false,
  },
  {
    id: 'smp-oracle',
    name: 'SMP Price Oracle',
    desc: 'KPX 실시간 전력 시장가',
    price: 200,
    calls: '50,000 calls/month',
    icon: '📊',
    hot: false,
  },
  {
    id: 'prophet-ai',
    name: 'Prophet AI Premium',
    desc: 'AI 트레이딩 시그널',
    price: 1000,
    calls: 'Unlimited',
    icon: '🔮',
    hot: true,
  },
];

export function APIShopWidget() {
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#F9F9F7] rounded-2xl p-6 border border-[#171717]/10"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-[#171717]">Energy API Shop</h3>
          <p className="text-sm text-[#171717]/60">실물 자산 기반 프리미엄 API</p>
        </div>
        <div className="px-3 py-1 bg-[#171717] text-white text-xs font-bold rounded-full">
          KAUS ONLY
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {API_PRODUCTS.map(product => (
          <motion.div
            key={product.id}
            whileHover={{ scale: 1.02 }}
            className={`p-4 rounded-xl border-2 transition-all ${
              product.hot
                ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300'
                : 'bg-white border-[#171717]/10'
            }`}
          >
            {/* Hot Badge */}
            {product.hot && (
              <div className="inline-block px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full mb-2">
                HOT
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="text-3xl">{product.icon}</div>
              <div className="flex-1">
                <h4 className="font-bold text-[#171717]">{product.name}</h4>
                <p className="text-xs text-[#171717]/60 mb-2">{product.desc}</p>
                <p className="text-[10px] text-[#171717]/40">{product.calls}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div>
                <span className="text-2xl font-black text-[#171717]">{product.price}</span>
                <span className="text-sm text-[#171717]/60 ml-1">KAUS</span>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePurchase(product.id, product.price)}
                disabled={purchasing === product.id}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  purchasing === product.id
                    ? 'bg-[#171717]/50 text-white cursor-not-allowed'
                    : 'bg-[#171717] text-white hover:bg-[#171717]/90'
                }`}
              >
                {purchasing === product.id ? '...' : 'Buy Now'}
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFIED ASSET BADGE (for Yeongdong Widget)
// ═══════════════════════════════════════════════════════════════════════════════

export function VerifiedAssetBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full shadow-lg"
    >
      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <span className="text-white font-bold text-sm">Verified Physical Asset</span>
    </motion.div>
  );
}
