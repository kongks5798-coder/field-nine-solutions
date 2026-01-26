'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 64: MULTI-ENERGY BROKERAGE EXCHANGE (MOBILE OPTIMIZED)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 실시간 호가창 + 에너지원별 거래 + KAUS 결제
 * 모바일 완벽 반응형
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FinancialSidebar, PriceTicker, MembershipBar } from '@/components/nexus/financial-terminal';
import { MobileBottomNav, MobileHeader } from '@/components/nexus/mobile-nav';
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
import {
  EnergySwapWidget,
  IntegratedAssetWidget,
  MultiSourcePriceTicker,
} from '@/components/nexus/energy-swap-widget';

export default function EnergyExchangePage() {
  const [selectedSource, setSelectedSource] = useState<string>('F9-SOLAR-001');
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [amount, setAmount] = useState<number>(1000);
  const [isProcessing, setIsProcessing] = useState(false);
  const [certificate, setCertificate] = useState<OriginCertificate | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [showOrderForm, setShowOrderForm] = useState(false);

  const sources = Object.values(ENERGY_SOURCES);
  const currentSource = ENERGY_SOURCES[selectedSource];

  // Update prices and order book
  useEffect(() => {
    const updateData = () => {
      const newPrices: Record<string, number> = {};
      for (const source of sources) {
        const volatility = (Math.random() - 0.5) * 0.1;
        newPrices[source.id] = source.pricing.kausPrice * (1 + volatility);
      }
      setPrices(newPrices);
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

      await new Promise(resolve => setTimeout(resolve, 1500));

      if (orderType === 'BUY') {
        const cert = generateOriginCertificate(selectedSource, amount, totalPrice);
        setCertificate(cert);
      }

      alert(`${orderType === 'BUY' ? '구매' : '판매'} 완료: ${amount.toLocaleString()} kWh @ ${price.toFixed(4)} KAUS`);
      setShowOrderForm(false);
    } catch {
      alert('거래 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      {/* Desktop: Financial Terminal Sidebar */}
      <div className="hidden md:block">
        <FinancialSidebar />
      </div>

      {/* Mobile: Header */}
      <div className="md:hidden">
        <MobileHeader title="Exchange" />
      </div>

      <div className="md:ml-56">
        {/* Desktop Only */}
        <div className="hidden md:block">
          <PriceTicker />
          <MembershipBar />
        </div>

        <main className="p-4 md:p-6 pb-32 md:pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-[#171717]">Energy Brokerage</h1>
                <p className="text-xs md:text-sm text-[#171717]/60">글로벌 에너지 실시간 거래</p>
              </div>
              <div className="flex items-center gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-emerald-100 text-emerald-700 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] md:text-xs font-bold">LIVE</span>
              </div>
            </div>

            {/* Energy Source Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-4 md:mb-6 scrollbar-hide">
              {sources.map(source => (
                <motion.button
                  key={source.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedSource(source.id)}
                  className={`flex items-center gap-2 px-3 md:px-4 py-2 md:py-3 rounded-xl whitespace-nowrap transition-all ${
                    selectedSource === source.id
                      ? 'bg-[#171717] text-white'
                      : 'bg-white border border-[#171717]/10 hover:border-[#171717]/30'
                  }`}
                >
                  <span className="text-lg md:text-xl">{source.metadata.icon}</span>
                  <div className="text-left">
                    <div className="font-bold text-xs md:text-sm">{source.type}</div>
                    <div className={`text-[10px] md:text-xs ${
                      selectedSource === source.id ? 'text-white/60' : 'text-[#171717]/50'
                    }`}>
                      {(prices[source.id] || source.pricing.kausPrice).toFixed(3)} K
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Order Book */}
              <div className="lg:col-span-2 space-y-4 md:space-y-6">
                {/* Source Info Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 md:p-6 rounded-2xl text-white"
                  style={{
                    background: `linear-gradient(135deg, ${currentSource.metadata.gradientFrom}, ${currentSource.metadata.gradientTo})`,
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-10 h-10 md:w-14 md:h-14 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl md:text-3xl">{currentSource.metadata.icon}</span>
                      </div>
                      <div>
                        <h2 className="text-base md:text-xl font-bold">{currentSource.name}</h2>
                        <p className="text-white/70 text-xs md:text-sm">{currentSource.nameKo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl md:text-3xl font-black">
                        {(prices[selectedSource] || currentSource.pricing.kausPrice).toFixed(4)}
                      </div>
                      <div className="text-white/70 text-xs md:text-sm">KAUS/kWh</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 md:gap-4">
                    <div className="bg-white/10 rounded-xl p-2 md:p-3 text-center">
                      <div className="text-sm md:text-lg font-bold">{currentSource.capacity.installed} MW</div>
                      <div className="text-[10px] md:text-xs text-white/60">Capacity</div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-2 md:p-3 text-center">
                      <div className="text-sm md:text-lg font-bold">{currentSource.certification.esgRating}</div>
                      <div className="text-[10px] md:text-xs text-white/60">ESG</div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-2 md:p-3 text-center">
                      <div className="text-sm md:text-lg font-bold">{currentSource.certification.carbonIntensity}</div>
                      <div className="text-[10px] md:text-xs text-white/60">gCO2</div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-2 md:p-3 text-center">
                      <div className="text-sm md:text-lg font-bold">
                        {currentSource.certification.re100Certified ? '✓' : '✗'}
                      </div>
                      <div className="text-[10px] md:text-xs text-white/60">RE100</div>
                    </div>
                  </div>
                </motion.div>

                {/* Order Book Table */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl p-4 md:p-6 border border-[#171717]/10"
                >
                  <h3 className="font-bold text-[#171717] mb-4 text-sm md:text-base">Real-Time Order Book</h3>

                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {/* Bids (Buy Orders) */}
                    <div>
                      <div className="text-[10px] md:text-xs text-emerald-600 font-bold mb-2">BIDS (BUY)</div>
                      <div className="space-y-1">
                        {orderBook?.bids.slice(0, 5).map((bid, i) => (
                          <div key={i} className="flex items-center justify-between text-xs md:text-sm">
                            <span className="font-mono text-emerald-600">{bid.price.toFixed(3)}</span>
                            <span className="text-[#171717]/70 text-[10px] md:text-xs">{(bid.amount / 1000).toFixed(0)}K</span>
                            <div className="w-12 md:w-20 h-1 md:h-1.5 bg-emerald-100 rounded-full overflow-hidden">
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
                      <div className="text-[10px] md:text-xs text-red-600 font-bold mb-2">ASKS (SELL)</div>
                      <div className="space-y-1">
                        {orderBook?.asks.slice(0, 5).map((ask, i) => (
                          <div key={i} className="flex items-center justify-between text-xs md:text-sm">
                            <span className="font-mono text-red-600">{ask.price.toFixed(3)}</span>
                            <span className="text-[#171717]/70 text-[10px] md:text-xs">{(ask.amount / 1000).toFixed(0)}K</span>
                            <div className="w-12 md:w-20 h-1 md:h-1.5 bg-red-100 rounded-full overflow-hidden">
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
                  <div className="grid grid-cols-4 gap-2 md:gap-4 mt-4 md:mt-6 pt-4 border-t border-[#171717]/10">
                    <div className="text-center">
                      <div className="text-[10px] md:text-xs text-[#171717]/50">Last</div>
                      <div className="font-bold text-xs md:text-sm">{orderBook?.lastPrice.toFixed(3)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] md:text-xs text-[#171717]/50">High</div>
                      <div className="font-bold text-xs md:text-sm text-emerald-600">{orderBook?.high24h.toFixed(3)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] md:text-xs text-[#171717]/50">Low</div>
                      <div className="font-bold text-xs md:text-sm text-red-600">{orderBook?.low24h.toFixed(3)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] md:text-xs text-[#171717]/50">Volume</div>
                      <div className="font-bold text-xs md:text-sm">{((orderBook?.volume24h || 0) / 1000000).toFixed(1)}M</div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Order Form - Desktop */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden lg:block bg-[#171717] rounded-2xl p-6 text-white h-fit sticky top-24"
              >
                <OrderForm
                  orderType={orderType}
                  setOrderType={setOrderType}
                  amount={amount}
                  setAmount={setAmount}
                  currentSource={currentSource}
                  selectedSource={selectedSource}
                  prices={prices}
                  isProcessing={isProcessing}
                  handleOrder={handleOrder}
                  certificate={certificate}
                />
              </motion.div>
            </div>

            {/* Multi-Source Price Ticker */}
            <div className="mt-4 md:mt-6">
              <MultiSourcePriceTicker />
            </div>

            {/* Energy Swap & Asset Integration Section */}
            <div className="mt-4 md:mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <EnergySwapWidget />
              <IntegratedAssetWidget />
            </div>

            {/* Buy KAUS Section */}
            <div className="mt-4 md:mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <BuyKausWidget />
              <div className="hidden md:block">
                <BankGradeSecurityBadge />
              </div>
            </div>

            {/* Staking & Yield Section */}
            <div className="mt-4 md:mt-6" id="staking">
              <StakingWidget />
            </div>

            {/* Security Footer */}
            <BankGradeSecurityBadge variant="footer" />
          </div>
        </main>
      </div>

      {/* Mobile: Floating Trade Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowOrderForm(true)}
        className="fixed bottom-20 right-4 z-40 md:hidden w-14 h-14 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full shadow-lg flex items-center justify-center"
      >
        <span className="text-xl">💱</span>
      </motion.button>

      {/* Mobile: Order Form Modal */}
      <AnimatePresence>
        {showOrderForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50 md:hidden"
              onClick={() => setShowOrderForm(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#171717] rounded-t-3xl p-6 md:hidden max-h-[80vh] overflow-y-auto"
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
              <OrderForm
                orderType={orderType}
                setOrderType={setOrderType}
                amount={amount}
                setAmount={setAmount}
                currentSource={currentSource}
                selectedSource={selectedSource}
                prices={prices}
                isProcessing={isProcessing}
                handleOrder={handleOrder}
                certificate={certificate}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile: Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ORDER FORM COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface OrderFormProps {
  orderType: 'BUY' | 'SELL';
  setOrderType: (type: 'BUY' | 'SELL') => void;
  amount: number;
  setAmount: (amount: number) => void;
  currentSource: (typeof ENERGY_SOURCES)[keyof typeof ENERGY_SOURCES];
  selectedSource: string;
  prices: Record<string, number>;
  isProcessing: boolean;
  handleOrder: () => void;
  certificate: OriginCertificate | null;
}

function OrderForm({
  orderType,
  setOrderType,
  amount,
  setAmount,
  currentSource,
  selectedSource,
  prices,
  isProcessing,
  handleOrder,
  certificate,
}: OrderFormProps) {
  return (
    <>
      <h3 className="font-bold mb-4 text-white">Place Order</h3>

      {/* Buy/Sell Toggle */}
      <div className="flex gap-2 mb-4 md:mb-6">
        <button
          onClick={() => setOrderType('BUY')}
          className={`flex-1 py-2.5 md:py-3 rounded-xl font-bold transition-all ${
            orderType === 'BUY'
              ? 'bg-emerald-500 text-white'
              : 'bg-white/10 text-white/50'
          }`}
        >
          BUY
        </button>
        <button
          onClick={() => setOrderType('SELL')}
          className={`flex-1 py-2.5 md:py-3 rounded-xl font-bold transition-all ${
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
          className="w-full p-3 md:p-4 bg-white/10 rounded-xl text-white font-mono text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          min={100}
          step={100}
        />
        <div className="flex gap-2 mt-2">
          {[1000, 5000, 10000, 50000].map(val => (
            <button
              key={val}
              onClick={() => setAmount(val)}
              className="flex-1 py-1.5 md:py-1 text-xs bg-white/10 rounded-lg hover:bg-white/20"
            >
              {(val / 1000).toFixed(0)}K
            </button>
          ))}
        </div>
      </div>

      {/* Price Display */}
      <div className="bg-white/5 rounded-xl p-3 md:p-4 mb-4">
        <div className="flex justify-between text-xs md:text-sm mb-2">
          <span className="text-white/50">Price per kWh</span>
          <span className="font-mono text-white">
            {(prices[selectedSource] || currentSource.pricing.kausPrice).toFixed(4)} KAUS
          </span>
        </div>
        <div className="flex justify-between text-xs md:text-sm mb-2">
          <span className="text-white/50">Amount</span>
          <span className="font-mono text-white">{amount.toLocaleString()} kWh</span>
        </div>
        <div className="border-t border-white/10 pt-2 mt-2">
          <div className="flex justify-between">
            <span className="font-bold text-white">Total</span>
            <span className="font-bold text-lg md:text-xl text-amber-400">
              {(amount * (prices[selectedSource] || currentSource.pricing.kausPrice)).toFixed(2)} KAUS
            </span>
          </div>
        </div>
      </div>

      {/* RE100 Badge */}
      {currentSource.certification.re100Certified && (
        <div className="flex items-center gap-2 p-2 md:p-3 bg-emerald-500/20 rounded-xl mb-4">
          <span className="text-emerald-400 font-bold text-xs md:text-sm">RE100 CERTIFIED</span>
          <span className="text-emerald-400/60 text-[10px] md:text-xs">탄소 배출 제로</span>
        </div>
      )}

      {/* Submit Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleOrder}
        disabled={isProcessing}
        className={`w-full py-3 md:py-4 rounded-xl font-bold text-base md:text-lg transition-all ${
          orderType === 'BUY'
            ? 'bg-gradient-to-r from-emerald-500 to-cyan-500'
            : 'bg-gradient-to-r from-red-500 to-orange-500'
        } disabled:opacity-50 text-white`}
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
            className="mt-4 p-3 md:p-4 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl border border-amber-500/30"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-amber-400">📜</span>
              <span className="text-amber-400 font-bold text-xs md:text-sm">Origin Certificate Issued</span>
            </div>
            <div className="text-[10px] md:text-xs text-white/60 font-mono">{certificate.id}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Physical Asset Badge */}
      <div className="mt-4">
        <PhysicalAssetBadge variant="compact" />
      </div>
    </>
  );
}
