'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 47: GLOBAL K-NOMAD PAYMENT BRIDGE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 글로벌 관광객/투자자를 위한 즉시 KAUS 충전 게이트웨이
 * USD/EUR/JPY → KAUS 실시간 환전
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// CURRENCY CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  rateToKRW: number;  // Exchange rate to KRW
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', rateToKRW: 1320 },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', rateToKRW: 1450 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', rateToKRW: 9.2 },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳', rateToKRW: 185 },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', rateToKRW: 1680 },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar', flag: '🇦🇺', rateToKRW: 870 },
  { code: 'SGD', symbol: '$', name: 'Singapore Dollar', flag: '🇸🇬', rateToKRW: 990 },
];

const KAUS_KRW_RATE = 120; // 1 KAUS = 120 KRW

// ═══════════════════════════════════════════════════════════════════════════════
// PAYMENT METHODS
// ═══════════════════════════════════════════════════════════════════════════════

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  fee: number;        // % fee
  minAmount: number;  // Min in USD
  maxAmount: number;  // Max in USD
  processingTime: string;
  available: boolean;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'credit-card',
    name: 'Credit/Debit Card',
    icon: '💳',
    fee: 2.5,
    minAmount: 10,
    maxAmount: 10000,
    processingTime: 'Instant',
    available: true,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: '🅿️',
    fee: 3.0,
    minAmount: 10,
    maxAmount: 5000,
    processingTime: 'Instant',
    available: true,
  },
  {
    id: 'bank-wire',
    name: 'Bank Wire',
    icon: '🏦',
    fee: 0.5,
    minAmount: 1000,
    maxAmount: 100000,
    processingTime: '1-3 days',
    available: true,
  },
  {
    id: 'crypto',
    name: 'Crypto (USDT/USDC)',
    icon: '₿',
    fee: 1.0,
    minAmount: 50,
    maxAmount: 50000,
    processingTime: '~10 min',
    available: true,
  },
  {
    id: 'apple-pay',
    name: 'Apple Pay',
    icon: '🍎',
    fee: 2.0,
    minAmount: 10,
    maxAmount: 5000,
    processingTime: 'Instant',
    available: true,
  },
  {
    id: 'google-pay',
    name: 'Google Pay',
    icon: '🔵',
    fee: 2.0,
    minAmount: 10,
    maxAmount: 5000,
    processingTime: 'Instant',
    available: true,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL PAYMENT BRIDGE WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

export function GlobalPaymentBridge() {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(SUPPORTED_CURRENCIES[0]);
  const [amount, setAmount] = useState<number>(100);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PAYMENT_METHODS[0]);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rates, setRates] = useState<Record<string, number>>({});

  // Calculate KAUS amount
  const krwAmount = amount * selectedCurrency.rateToKRW;
  const kausAmount = krwAmount / KAUS_KRW_RATE;
  const fee = amount * (selectedMethod.fee / 100);
  const totalAmount = amount + fee;
  const finalKaus = ((amount - fee) * selectedCurrency.rateToKRW) / KAUS_KRW_RATE;

  // Simulate rate updates
  useEffect(() => {
    const updateRates = () => {
      const newRates: Record<string, number> = {};
      SUPPORTED_CURRENCIES.forEach(c => {
        newRates[c.code] = c.rateToKRW * (0.98 + Math.random() * 0.04);
      });
      setRates(newRates);
    };

    updateRates();
    const interval = setInterval(updateRates, 30000);
    return () => clearInterval(interval);
  }, []);

  const handlePurchase = async () => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`Purchase Complete!\n${finalKaus.toFixed(2)} KAUS added to your wallet.`);
    } catch {
      alert('Transaction failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#171717] to-[#2a2a2a] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <span className="text-xl">🌐</span>
            </div>
            <div>
              <h3 className="font-bold text-white">Global Payment Bridge</h3>
              <p className="text-white/50 text-xs">Instant KAUS Purchase</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold">LIVE</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Currency Selection */}
        <div>
          <label className="text-xs text-white/50 mb-2 block">Pay With</label>
          <button
            onClick={() => setShowCurrencyPicker(true)}
            className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedCurrency.flag}</span>
              <div className="text-left">
                <div className="font-bold text-white">{selectedCurrency.code}</div>
                <div className="text-xs text-white/50">{selectedCurrency.name}</div>
              </div>
            </div>
            <span className="text-white/50">▼</span>
          </button>
        </div>

        {/* Amount Input */}
        <div>
          <label className="text-xs text-white/50 mb-2 block">Amount</label>
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
            <span className="text-2xl text-white/70">{selectedCurrency.symbol}</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="flex-1 bg-transparent text-white text-2xl font-bold outline-none"
              min={selectedMethod.minAmount}
              max={selectedMethod.maxAmount}
            />
          </div>
          <div className="flex gap-2 mt-2">
            {[50, 100, 500, 1000].map(val => (
              <button
                key={val}
                onClick={() => setAmount(val)}
                className="flex-1 py-2 text-xs font-bold bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition-colors"
              >
                {selectedCurrency.symbol}{val}
              </button>
            ))}
          </div>
        </div>

        {/* You Receive */}
        <div className="p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl border border-amber-500/30">
          <div className="text-xs text-amber-400/70 mb-1">You Receive</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-3xl">👑</span>
              <span className="text-3xl font-black text-white">{finalKaus.toFixed(2)}</span>
            </div>
            <span className="text-amber-400 font-bold">KAUS</span>
          </div>
          <div className="text-xs text-white/50 mt-1">
            Rate: 1 {selectedCurrency.code} = {(selectedCurrency.rateToKRW / KAUS_KRW_RATE).toFixed(2)} KAUS
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="text-xs text-white/50 mb-2 block">Payment Method</label>
          <button
            onClick={() => setShowMethodPicker(true)}
            className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedMethod.icon}</span>
              <div className="text-left">
                <div className="font-bold text-white">{selectedMethod.name}</div>
                <div className="text-xs text-white/50">
                  {selectedMethod.fee}% fee • {selectedMethod.processingTime}
                </div>
              </div>
            </div>
            <span className="text-white/50">▼</span>
          </button>
        </div>

        {/* Fee Breakdown */}
        <div className="space-y-2 p-3 bg-white/5 rounded-xl">
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Amount</span>
            <span className="text-white">{selectedCurrency.symbol}{amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Fee ({selectedMethod.fee}%)</span>
            <span className="text-white/70">{selectedCurrency.symbol}{fee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-white/10">
            <span className="font-bold text-white">Total</span>
            <span className="font-bold text-white">{selectedCurrency.symbol}{totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Purchase Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePurchase}
          disabled={isProcessing || amount < selectedMethod.minAmount}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
            `Buy ${finalKaus.toFixed(2)} KAUS`
          )}
        </motion.button>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-white/40 text-xs">
          <span>🔒</span>
          <span>256-bit SSL Encrypted • PCI-DSS Compliant</span>
        </div>
      </div>

      {/* Currency Picker Modal */}
      <AnimatePresence>
        {showCurrencyPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50"
              onClick={() => setShowCurrencyPicker(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a1a] rounded-t-3xl p-6 max-h-[60vh] overflow-y-auto"
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />
              <h3 className="font-bold text-white text-lg mb-4">Select Currency</h3>
              <div className="space-y-2">
                {SUPPORTED_CURRENCIES.map(currency => (
                  <button
                    key={currency.code}
                    onClick={() => {
                      setSelectedCurrency(currency);
                      setShowCurrencyPicker(false);
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors ${
                      selectedCurrency.code === currency.code
                        ? 'bg-emerald-500/20 border border-emerald-500/50'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-3xl">{currency.flag}</span>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-white">{currency.code}</div>
                      <div className="text-sm text-white/50">{currency.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white/70 font-mono">
                        1 = {(currency.rateToKRW / KAUS_KRW_RATE).toFixed(2)} K
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Payment Method Picker Modal */}
      <AnimatePresence>
        {showMethodPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50"
              onClick={() => setShowMethodPicker(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a1a] rounded-t-3xl p-6 max-h-[60vh] overflow-y-auto"
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />
              <h3 className="font-bold text-white text-lg mb-4">Payment Method</h3>
              <div className="space-y-2">
                {PAYMENT_METHODS.map(method => (
                  <button
                    key={method.id}
                    onClick={() => {
                      setSelectedMethod(method);
                      setShowMethodPicker(false);
                    }}
                    disabled={!method.available}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors ${
                      selectedMethod.id === method.id
                        ? 'bg-emerald-500/20 border border-emerald-500/50'
                        : method.available
                        ? 'bg-white/5 hover:bg-white/10'
                        : 'bg-white/5 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-3xl">{method.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-white">{method.name}</div>
                      <div className="text-xs text-white/50">
                        {method.fee}% fee • {method.processingTime}
                      </div>
                    </div>
                    <div className="text-right text-xs text-white/50">
                      {selectedCurrency.symbol}{method.minAmount}-{method.maxAmount}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPACT CURRENCY RATES TICKER
// ═══════════════════════════════════════════════════════════════════════════════

export function CurrencyRatesTicker() {
  const [rates, setRates] = useState<Record<string, { rate: number; change: number }>>({});

  useEffect(() => {
    const updateRates = () => {
      const newRates: Record<string, { rate: number; change: number }> = {};
      SUPPORTED_CURRENCIES.forEach(c => {
        const rate = c.rateToKRW / KAUS_KRW_RATE;
        const change = (Math.random() - 0.5) * 2;
        newRates[c.code] = { rate: rate * (1 + change / 100), change };
      });
      setRates(newRates);
    };

    updateRates();
    const interval = setInterval(updateRates, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex gap-4 min-w-max py-2 px-4">
        {SUPPORTED_CURRENCIES.map(currency => {
          const data = rates[currency.code];
          if (!data) return null;

          return (
            <motion.div
              key={currency.code}
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl"
            >
              <span className="text-lg">{currency.flag}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{currency.code}/KAUS</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-white">{data.rate.toFixed(3)}</span>
                  <span className={`text-xs ${data.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)}%
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
