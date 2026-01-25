'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 46: MULTI-ENERGY BROKERAGE EXCHANGE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 실시간 호가창 + 에너지원별 거래 + KAUS 결제
 * "제국은 모든 에너지를 중개한다"
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FinancialSidebar, PriceTicker, MembershipBar } from '@/components/nexus/financial-terminal';
import { PhysicalAssetBadge } from '@/components/nexus/yield-farming';
import { BuyKausWidget, BankGradeSecurityBadge } from '@/components/nexus/commercial';
import { StakingWidget } from '@/components/nexus/staking-widget';
import {
  ENERGY_SOURCES,
  generateOrderBook,
  OrderBook,
  generateOriginCertificate,
  OriginCertificate,
} from '@/lib/energy/sources';

export default function EnergyExchangePage() {
  const [selectedSource, setSelectedSource] = useState<string>('F9-SOLAR-001');
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [amount, setAmount] = useState<number>(1000);
  const [isProcessing, setIsProcessing] = useState(false);
  const [certificate, setCertificate] = useState<OriginCertificate | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});

  const sources = Object.values(ENERGY_SOURCES);
  const currentSource = ENERGY_SOURCES[selectedSource];

  // Update prices and order book
  useEffect(() => {
    const updateData = () => {
      // Update prices with slight variation
      const newPrices: Record<string, number> = {};
      for (const source of sources) {
        const volatility = (Math.random() - 0.5) * 0.1;
        newPrices[source.id] = source.pricing.kausPrice * (1 + volatility);
      }
      setPrices(newPrices);

      // Update order book
      setOrderBook(generateOrderBook(selectedSource));
    };

    updateData();
    const interval = setInterval(updateData, 3000);
    return () => clearInterval(interval);
  }, [selectedSource]);

  const handleOrder = async () => {
    setIsProcessing(true);

    try {
      const price = prices[selectedSource] || currentSource.pricing.kausPrice;
      const totalPrice = amount * price;

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate certificate for purchase
      if (orderType === 'BUY') {
        const cert = generateOriginCertificate(selectedSource, amount, totalPrice);
        setCertificate(cert);
      }

      alert(`${orderType === 'BUY' ? '구매' : '판매'} 완료: ${amount.toLocaleString()} kWh @ ${price.toFixed(4)} KAUS`);
    } catch {
      alert('거래 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <FinancialSidebar />
      <div className="ml-56">
        <PriceTicker />
        <MembershipBar />

        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-[#171717]">Energy Brokerage</h1>
                <p className="text-sm text-[#171717]/60">글로벌 에너지 실시간 거래</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold">LIVE TRADING</span>
              </div>
            </div>

            {/* Energy Source Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
              {sources.map(source => (
                <motion.button
                  key={source.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedSource(source.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl whitespace-nowrap transition-all ${
                    selectedSource === source.id
                      ? 'bg-[#171717] text-white'
                      : 'bg-white border border-[#171717]/10 hover:border-[#171717]/30'
                  }`}
                >
                  <span className="text-xl">{source.metadata.icon}</span>
                  <div className="text-left">
                    <div className="font-bold text-sm">{source.type}</div>
                    <div className={`text-xs ${
                      selectedSource === source.id ? 'text-white/60' : 'text-[#171717]/50'
                    }`}>
                      {(prices[source.id] || source.pricing.kausPrice).toFixed(3)} KAUS
                    </div>
                  </div>
                  <div className={`text-xs font-bold ${
                    source.pricing.priceChange24h >= 0
                      ? 'text-emerald-500'
                      : 'text-red-500'
                  }`}>
                    {source.pricing.priceChange24h >= 0 ? '+' : ''}
                    {source.pricing.priceChange24h.toFixed(1)}%
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Order Book */}
              <div className="lg:col-span-2 space-y-6">
                {/* Source Info Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-2xl text-white"
                  style={{
                    background: `linear-gradient(135deg, ${currentSource.metadata.gradientFrom}, ${currentSource.metadata.gradientTo})`,
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-3xl">{currentSource.metadata.icon}</span>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{currentSource.name}</h2>
                        <p className="text-white/70 text-sm">{currentSource.nameKo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black">
                        {(prices[selectedSource] || currentSource.pricing.kausPrice).toFixed(4)}
                      </div>
                      <div className="text-white/70 text-sm">KAUS/kWh</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                      <div className="text-lg font-bold">{currentSource.capacity.installed} MW</div>
                      <div className="text-xs text-white/60">Capacity</div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                      <div className="text-lg font-bold">{currentSource.certification.esgRating}</div>
                      <div className="text-xs text-white/60">ESG Rating</div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                      <div className="text-lg font-bold">{currentSource.certification.carbonIntensity}</div>
                      <div className="text-xs text-white/60">gCO2/kWh</div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                      <div className="text-lg font-bold">
                        {currentSource.certification.re100Certified ? '✓' : '✗'}
                      </div>
                      <div className="text-xs text-white/60">RE100</div>
                    </div>
                  </div>
                </motion.div>

                {/* Order Book Table */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl p-6 border border-[#171717]/10"
                >
                  <h3 className="font-bold text-[#171717] mb-4">Real-Time Order Book</h3>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Bids (Buy Orders) */}
                    <div>
                      <div className="text-xs text-emerald-600 font-bold mb-2">BIDS (BUY)</div>
                      <div className="space-y-1">
                        {orderBook?.bids.map((bid, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="font-mono text-emerald-600">{bid.price.toFixed(4)}</span>
                            <span className="text-[#171717]/70">{(bid.amount / 1000).toFixed(1)}K</span>
                            <div className="w-20 h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(bid.amount / 50000) * 100}%` }}
                                className="h-full bg-emerald-500"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Asks (Sell Orders) */}
                    <div>
                      <div className="text-xs text-red-600 font-bold mb-2">ASKS (SELL)</div>
                      <div className="space-y-1">
                        {orderBook?.asks.map((ask, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="font-mono text-red-600">{ask.price.toFixed(4)}</span>
                            <span className="text-[#171717]/70">{(ask.amount / 1000).toFixed(1)}K</span>
                            <div className="w-20 h-1.5 bg-red-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(ask.amount / 50000) * 100}%` }}
                                className="h-full bg-red-500"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 24h Stats */}
                  <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-[#171717]/10">
                    <div className="text-center">
                      <div className="text-xs text-[#171717]/50">Last Price</div>
                      <div className="font-bold">{orderBook?.lastPrice.toFixed(4)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-[#171717]/50">24h High</div>
                      <div className="font-bold text-emerald-600">{orderBook?.high24h.toFixed(4)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-[#171717]/50">24h Low</div>
                      <div className="font-bold text-red-600">{orderBook?.low24h.toFixed(4)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-[#171717]/50">24h Volume</div>
                      <div className="font-bold">{((orderBook?.volume24h || 0) / 1000000).toFixed(2)}M kWh</div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Order Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-[#171717] rounded-2xl p-6 text-white h-fit sticky top-24"
              >
                <h3 className="font-bold mb-4">Place Order</h3>

                {/* Buy/Sell Toggle */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setOrderType('BUY')}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                      orderType === 'BUY'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/10 text-white/50'
                    }`}
                  >
                    BUY
                  </button>
                  <button
                    onClick={() => setOrderType('SELL')}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                      orderType === 'SELL'
                        ? 'bg-red-500 text-white'
                        : 'bg-white/10 text-white/50'
                    }`}
                  >
                    SELL
                  </button>
                </div>

                {/* Amount Input */}
                <div className="mb-4">
                  <label className="text-xs text-white/50 mb-2 block">Amount (kWh)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    className="w-full p-4 bg-white/10 rounded-xl text-white font-mono text-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    min={100}
                    step={100}
                  />
                  <div className="flex gap-2 mt-2">
                    {[1000, 5000, 10000, 50000].map(val => (
                      <button
                        key={val}
                        onClick={() => setAmount(val)}
                        className="flex-1 py-1 text-xs bg-white/10 rounded-lg hover:bg-white/20"
                      >
                        {(val / 1000).toFixed(0)}K
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Display */}
                <div className="bg-white/5 rounded-xl p-4 mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/50">Price per kWh</span>
                    <span className="font-mono">
                      {(prices[selectedSource] || currentSource.pricing.kausPrice).toFixed(4)} KAUS
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/50">Amount</span>
                    <span className="font-mono">{amount.toLocaleString()} kWh</span>
                  </div>
                  <div className="border-t border-white/10 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-bold">Total</span>
                      <span className="font-bold text-xl text-amber-400">
                        {(amount * (prices[selectedSource] || currentSource.pricing.kausPrice)).toFixed(2)} KAUS
                      </span>
                    </div>
                  </div>
                </div>

                {/* RE100 Badge */}
                {currentSource.certification.re100Certified && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-500/20 rounded-xl mb-4">
                    <span className="text-emerald-400 font-bold text-sm">RE100 CERTIFIED</span>
                    <span className="text-emerald-400/60 text-xs">탄소 배출 제로</span>
                  </div>
                )}

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleOrder}
                  disabled={isProcessing}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                    orderType === 'BUY'
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                      : 'bg-gradient-to-r from-red-500 to-orange-500'
                  } disabled:opacity-50`}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        ⏳
                      </motion.span>
                      Processing...
                    </span>
                  ) : (
                    <span>
                      {orderType === 'BUY' ? 'Buy' : 'Sell'} {currentSource.type} Energy
                    </span>
                  )}
                </motion.button>

                {/* Certificate Preview */}
                <AnimatePresence>
                  {certificate && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-4 p-4 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl border border-amber-500/30"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-amber-400">📜</span>
                        <span className="text-amber-400 font-bold text-sm">Origin Certificate Issued</span>
                      </div>
                      <div className="text-xs text-white/60 font-mono">{certificate.id}</div>
                      <div className="text-xs text-white/40 mt-1">
                        View in Profile → My Energy
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Physical Asset Badge */}
                <div className="mt-4">
                  <PhysicalAssetBadge variant="compact" />
                </div>
              </motion.div>
            </div>

            {/* Buy KAUS Section */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BuyKausWidget />
              <BankGradeSecurityBadge />
            </div>

            {/* Staking & Yield Section */}
            <div className="mt-6" id="staking">
              <StakingWidget />
            </div>

            {/* Security Footer */}
            <BankGradeSecurityBadge variant="footer" />
          </div>
        </main>
      </div>
    </div>
  );
}
