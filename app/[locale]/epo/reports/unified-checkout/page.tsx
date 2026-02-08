'use client';

import { useState, useEffect } from 'react';

/**
 * UNIFIED CHECKOUT SIMULATION
 *
 * K-AUS 기반 실물 결제 및 혜택 시뮬레이션
 * - Aura Sydney (패션) 10% K-AUS 보너스
 * - Nomad Monthly (여행) 10% K-AUS 보너스
 * - 실시간 결제 흐름 시뮬레이션
 */

interface CheckoutItem {
  id: string;
  name: string;
  brand: string;
  category: 'AURA_SYDNEY' | 'NOMAD_MONTHLY' | 'ENERGY_PARTNERS' | 'DINING' | 'GENERAL';
  price: number;
  image: string;
}

interface PaymentResult {
  transactionId: string;
  items: CheckoutItem[];
  subtotal: number;
  kausUsed: number;
  kausRate: number;
  baseCashback: number;
  ecosystemBonus: number;
  totalCashback: number;
  finalKausCost: number;
  savings: number;
  timestamp: number;
}

const SAMPLE_ITEMS: CheckoutItem[] = [
  // Aura Sydney (Fashion) - 10% bonus
  { id: 'AS001', name: 'Cashmere Overcoat', brand: 'Aura Sydney', category: 'AURA_SYDNEY', price: 2500, image: '🧥' },
  { id: 'AS002', name: 'Silk Evening Dress', brand: 'Aura Sydney', category: 'AURA_SYDNEY', price: 1800, image: '👗' },
  { id: 'AS003', name: 'Italian Leather Boots', brand: 'Aura Sydney', category: 'AURA_SYDNEY', price: 950, image: '👢' },
  { id: 'AS004', name: 'Diamond Watch', brand: 'Aura Sydney', category: 'AURA_SYDNEY', price: 8500, image: '⌚' },

  // Nomad Monthly (Travel) - 10% bonus
  { id: 'NM001', name: 'Dubai Suite (7 nights)', brand: 'Nomad Monthly', category: 'NOMAD_MONTHLY', price: 4200, image: '🏨' },
  { id: 'NM002', name: 'Business Class Flight', brand: 'Nomad Monthly', category: 'NOMAD_MONTHLY', price: 3500, image: '✈️' },
  { id: 'NM003', name: 'Yacht Charter Day', brand: 'Nomad Monthly', category: 'NOMAD_MONTHLY', price: 2800, image: '🛥️' },
  { id: 'NM004', name: 'Maldives Villa', brand: 'Nomad Monthly', category: 'NOMAD_MONTHLY', price: 5600, image: '🏝️' },

  // Energy Partners - 5% bonus
  { id: 'EP001', name: 'Solar Panel Set', brand: 'SolarTech', category: 'ENERGY_PARTNERS', price: 1200, image: '☀️' },
  { id: 'EP002', name: 'EV Charging Credits', brand: 'ChargeNet', category: 'ENERGY_PARTNERS', price: 500, image: '🔋' },
];

const CASHBACK_RATES = {
  AURA_SYDNEY: { base: 0.05, ecosystem: 0.10, label: '패션 (10% 보너스)' },
  NOMAD_MONTHLY: { base: 0.05, ecosystem: 0.10, label: '여행 (10% 보너스)' },
  ENERGY_PARTNERS: { base: 0.05, ecosystem: 0.05, label: '에너지 (5% 보너스)' },
  DINING: { base: 0.05, ecosystem: 0.03, label: '다이닝 (3% 보너스)' },
  GENERAL: { base: 0.05, ecosystem: 0.01, label: '일반 (1% 보너스)' },
};

export default function UnifiedCheckoutPage() {
  const [cart, setCart] = useState<CheckoutItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [kausRate] = useState(0.15); // $0.15 per K-AUS
  const [kausBalance] = useState(2500000);
  const [step, setStep] = useState<'shop' | 'cart' | 'checkout' | 'result'>('shop');

  // Add to cart
  const addToCart = (item: CheckoutItem) => {
    setCart(prev => [...prev, item]);
  };

  // Remove from cart
  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const kausRequired = subtotal / kausRate;

  // Calculate cashback by category
  const cashbackBreakdown = cart.reduce((acc, item) => {
    const rates = CASHBACK_RATES[item.category];
    const kausAmount = item.price / kausRate;
    acc.base += kausAmount * rates.base;
    acc.ecosystem += kausAmount * rates.ecosystem;
    return acc;
  }, { base: 0, ecosystem: 0 });

  const totalCashback = cashbackBreakdown.base + cashbackBreakdown.ecosystem;
  const effectiveKausCost = kausRequired - totalCashback;
  const savingsPercent = (totalCashback / kausRequired) * 100;

  // Process payment
  const processPayment = () => {
    setIsProcessing(true);
    setStep('checkout');

    setTimeout(() => {
      const result: PaymentResult = {
        transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
        items: [...cart],
        subtotal,
        kausUsed: kausRequired,
        kausRate,
        baseCashback: cashbackBreakdown.base,
        ecosystemBonus: cashbackBreakdown.ecosystem,
        totalCashback,
        finalKausCost: effectiveKausCost,
        savings: totalCashback * kausRate,
        timestamp: Date.now(),
      };

      setPaymentResult(result);
      setIsProcessing(false);
      setStep('result');
    }, 3000);
  };

  // Reset
  const resetCheckout = () => {
    setCart([]);
    setPaymentResult(null);
    setStep('shop');
  };

  const categoryColors: Record<string, string> = {
    AURA_SYDNEY: 'from-purple-600 to-pink-600',
    NOMAD_MONTHLY: 'from-blue-600 to-cyan-600',
    ENERGY_PARTNERS: 'from-green-600 to-emerald-600',
    DINING: 'from-orange-600 to-red-600',
    GENERAL: 'from-gray-600 to-gray-700',
  };

  const categoryBadgeColors: Record<string, string> = {
    AURA_SYDNEY: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    NOMAD_MONTHLY: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    ENERGY_PARTNERS: 'bg-green-500/20 text-green-400 border-green-500/30',
    DINING: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    GENERAL: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-3xl shadow-lg shadow-purple-500/30">
            🛒
          </div>
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
              UNIFIED CHECKOUT
            </h1>
            <p className="text-gray-400">K-AUS 기반 실물 결제 시뮬레이션</p>
          </div>
        </div>
      </div>

      {/* Balance Display */}
      <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-500/30 rounded-xl p-4 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-gray-400">K-AUS Balance</div>
            <div className="text-2xl font-black text-amber-400">
              {kausBalance.toLocaleString()} K-AUS
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">USD Value</div>
            <div className="text-2xl font-bold text-white">
              ${(kausBalance * kausRate).toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Exchange Rate</div>
            <div className="text-xl font-bold text-green-400">
              1 K-AUS = ${kausRate}
            </div>
          </div>
        </div>
      </div>

      {/* Ecosystem Partners Banner */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl mb-2">👗</div>
          <div className="font-bold text-purple-400">Aura Sydney</div>
          <div className="text-green-400 font-bold">+10% K-AUS 보너스</div>
        </div>
        <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl mb-2">✈️</div>
          <div className="font-bold text-blue-400">Nomad Monthly</div>
          <div className="text-green-400 font-bold">+10% K-AUS 보너스</div>
        </div>
        <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl mb-2">⚡</div>
          <div className="font-bold text-green-400">Energy Partners</div>
          <div className="text-green-400 font-bold">+5% K-AUS 보너스</div>
        </div>
      </div>

      {step === 'shop' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Grid */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-bold text-white mb-4">🛍️ Shop Products</h2>
            <div className="grid grid-cols-2 gap-4">
              {SAMPLE_ITEMS.map(item => (
                <div
                  key={item.id}
                  className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-all"
                >
                  <div className={`h-32 bg-gradient-to-br ${categoryColors[item.category]} flex items-center justify-center text-6xl`}>
                    {item.image}
                  </div>
                  <div className="p-4">
                    <div className={`inline-block px-2 py-0.5 rounded text-xs font-bold border mb-2 ${categoryBadgeColors[item.category]}`}>
                      {item.brand}
                    </div>
                    <div className="font-bold text-sm mb-1">{item.name}</div>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-lg font-black text-white">${item.price.toLocaleString()}</div>
                        <div className="text-xs text-amber-400">
                          {(item.price / kausRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} K-AUS
                        </div>
                      </div>
                      <button
                        onClick={() => addToCart(item)}
                        className="px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-sm font-bold hover:opacity-90 transition-all"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4">🛒 Cart ({cart.length})</h2>
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              {cart.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  장바구니가 비어있습니다
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                    {cart.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-lg">
                        <span className="text-2xl">{item.image}</span>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.brand}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold">${item.price}</div>
                        </div>
                        <button
                          onClick={() => removeFromCart(idx)}
                          className="text-red-400 hover:text-red-300"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Cart Summary */}
                  <div className="border-t border-gray-700 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Subtotal</span>
                      <span>${subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">K-AUS Required</span>
                      <span className="text-amber-400">
                        {kausRequired.toLocaleString(undefined, { maximumFractionDigits: 0 })} K-AUS
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Base Cashback (5%)</span>
                      <span className="text-green-400">
                        +{cashbackBreakdown.base.toLocaleString(undefined, { maximumFractionDigits: 0 })} K-AUS
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Ecosystem Bonus</span>
                      <span className="text-green-400">
                        +{cashbackBreakdown.ecosystem.toLocaleString(undefined, { maximumFractionDigits: 0 })} K-AUS
                      </span>
                    </div>
                    <div className="flex justify-between font-bold pt-2 border-t border-gray-700">
                      <span>Effective Cost</span>
                      <span className="text-white">
                        {effectiveKausCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} K-AUS
                      </span>
                    </div>
                    <div className="text-center text-green-400 text-sm font-bold">
                      Save {savingsPercent.toFixed(1)}% (${(totalCashback * kausRate).toFixed(0)})
                    </div>
                  </div>

                  <button
                    onClick={processPayment}
                    disabled={kausRequired > kausBalance}
                    className="w-full mt-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl font-black text-lg hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    Pay with K-AUS
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {step === 'checkout' && (
        <div className="max-w-lg mx-auto">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4 animate-pulse">💳</div>
            <h2 className="text-2xl font-bold mb-4">Processing Payment...</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 justify-center text-green-400">
                <span className="animate-spin">⚡</span>
                <span>Verifying K-AUS balance...</span>
              </div>
              <div className="flex items-center gap-3 justify-center text-amber-400">
                <span className="animate-pulse">🔐</span>
                <span>Securing transaction...</span>
              </div>
              <div className="flex items-center gap-3 justify-center text-blue-400">
                <span className="animate-bounce">📊</span>
                <span>Calculating cashback...</span>
              </div>
            </div>
            <div className="mt-8 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse" style={{ width: '70%' }} />
            </div>
          </div>
        </div>
      )}

      {step === 'result' && paymentResult && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/50 rounded-2xl p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-black text-green-400">Payment Successful!</h2>
              <p className="text-gray-400 mt-2">
                Transaction ID: {paymentResult.transactionId}
              </p>
            </div>

            {/* Receipt */}
            <div className="bg-black/30 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-white mb-4">📝 Receipt</h3>
              <div className="space-y-2 mb-4">
                {paymentResult.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-400">{item.image} {item.name}</span>
                    <span>${item.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span>${paymentResult.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">K-AUS Used</span>
                  <span className="text-amber-400">
                    {paymentResult.kausUsed.toLocaleString(undefined, { maximumFractionDigits: 0 })} K-AUS
                  </span>
                </div>
                <div className="flex justify-between text-green-400">
                  <span>Base Cashback (5%)</span>
                  <span>+{paymentResult.baseCashback.toLocaleString(undefined, { maximumFractionDigits: 0 })} K-AUS</span>
                </div>
                <div className="flex justify-between text-green-400">
                  <span>Ecosystem Bonus</span>
                  <span>+{paymentResult.ecosystemBonus.toLocaleString(undefined, { maximumFractionDigits: 0 })} K-AUS</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-700">
                  <span>Total Cashback</span>
                  <span className="text-green-400">
                    +{paymentResult.totalCashback.toLocaleString(undefined, { maximumFractionDigits: 0 })} K-AUS
                  </span>
                </div>
              </div>
            </div>

            {/* Savings Highlight */}
            <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-500/30 rounded-xl p-6 text-center mb-6">
              <div className="text-sm text-gray-400 mb-2">You Saved</div>
              <div className="text-4xl font-black text-amber-400">
                ${paymentResult.savings.toFixed(0)}
              </div>
              <div className="text-sm text-gray-400 mt-2">
                ({paymentResult.totalCashback.toLocaleString(undefined, { maximumFractionDigits: 0 })} K-AUS returned to your wallet)
              </div>
            </div>

            <button
              onClick={resetCheckout}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold hover:opacity-90 transition-all"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-800 text-center text-gray-500 text-sm">
        <p>Unified Checkout Simulation v1.0.0 | Field Nine Solutions</p>
        <p className="text-purple-400/60 mt-2">
          &quot;K-AUS로 결제하면 더 많이 돌려받습니다&quot;
        </p>
      </div>
    </div>
  );
}
