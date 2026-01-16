/**
 * K-UNIVERSAL Currency Exchange Calculator
 * Real-time exchange rates and conversion
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  ArrowLeft,
  ArrowUpDown,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Info,
  Clock,
  Banknote,
  CreditCard,
  Building2,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface Currency {
  code: string;
  name: string;
  nameKo: string;
  symbol: string;
  flag: string;
}

interface ExchangeRate {
  currency: string;
  rate: number;
  change: number;
  changePercent: number;
}

// ============================================
// Currency Data
// ============================================

const currencies: Currency[] = [
  { code: 'KRW', name: 'Korean Won', nameKo: '대한민국 원', symbol: '₩', flag: '🇰🇷' },
  { code: 'USD', name: 'US Dollar', nameKo: '미국 달러', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', nameKo: '유로', symbol: '€', flag: '🇪🇺' },
  { code: 'JPY', name: 'Japanese Yen', nameKo: '일본 엔', symbol: '¥', flag: '🇯🇵' },
  { code: 'CNY', name: 'Chinese Yuan', nameKo: '중국 위안', symbol: '¥', flag: '🇨🇳' },
  { code: 'GBP', name: 'British Pound', nameKo: '영국 파운드', symbol: '£', flag: '🇬🇧' },
  { code: 'AUD', name: 'Australian Dollar', nameKo: '호주 달러', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', nameKo: '캐나다 달러', symbol: 'C$', flag: '🇨🇦' },
  { code: 'SGD', name: 'Singapore Dollar', nameKo: '싱가포르 달러', symbol: 'S$', flag: '🇸🇬' },
  { code: 'THB', name: 'Thai Baht', nameKo: '태국 바트', symbol: '฿', flag: '🇹🇭' },
  { code: 'VND', name: 'Vietnamese Dong', nameKo: '베트남 동', symbol: '₫', flag: '🇻🇳' },
  { code: 'PHP', name: 'Philippine Peso', nameKo: '필리핀 페소', symbol: '₱', flag: '🇵🇭' },
];

// Mock exchange rates (KRW base)
const mockRates: Record<string, ExchangeRate> = {
  USD: { currency: 'USD', rate: 1320.50, change: -5.20, changePercent: -0.39 },
  EUR: { currency: 'EUR', rate: 1435.80, change: 8.30, changePercent: 0.58 },
  JPY: { currency: 'JPY', rate: 8.92, change: -0.05, changePercent: -0.56 },
  CNY: { currency: 'CNY', rate: 182.40, change: 1.20, changePercent: 0.66 },
  GBP: { currency: 'GBP', rate: 1672.30, change: -12.50, changePercent: -0.74 },
  AUD: { currency: 'AUD', rate: 864.20, change: 3.40, changePercent: 0.39 },
  CAD: { currency: 'CAD', rate: 972.80, change: -2.10, changePercent: -0.22 },
  SGD: { currency: 'SGD', rate: 985.60, change: 4.80, changePercent: 0.49 },
  THB: { currency: 'THB', rate: 37.82, change: 0.15, changePercent: 0.40 },
  VND: { currency: 'VND', rate: 0.053, change: 0.001, changePercent: 1.92 },
  PHP: { currency: 'PHP', rate: 23.45, change: -0.12, changePercent: -0.51 },
};

// ============================================
// Main Component
// ============================================

export default function ExchangePage() {
  const locale = useLocale();
  const [fromCurrency, setFromCurrency] = useState<Currency>(currencies[1]); // USD
  const [toCurrency, setToCurrency] = useState<Currency>(currencies[0]); // KRW
  const [amount, setAmount] = useState('100');
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate conversion
  const calculateConversion = useCallback(() => {
    const numAmount = parseFloat(amount) || 0;

    if (fromCurrency.code === 'KRW' && toCurrency.code !== 'KRW') {
      // KRW to foreign
      const rate = mockRates[toCurrency.code]?.rate || 1;
      setConvertedAmount(numAmount / rate);
    } else if (fromCurrency.code !== 'KRW' && toCurrency.code === 'KRW') {
      // Foreign to KRW
      const rate = mockRates[fromCurrency.code]?.rate || 1;
      setConvertedAmount(numAmount * rate);
    } else if (fromCurrency.code !== 'KRW' && toCurrency.code !== 'KRW') {
      // Foreign to foreign (via KRW)
      const fromRate = mockRates[fromCurrency.code]?.rate || 1;
      const toRate = mockRates[toCurrency.code]?.rate || 1;
      const krwAmount = numAmount * fromRate;
      setConvertedAmount(krwAmount / toRate);
    } else {
      // KRW to KRW
      setConvertedAmount(numAmount);
    }
  }, [amount, fromCurrency, toCurrency]);

  useEffect(() => {
    calculateConversion();
  }, [calculateConversion]);

  // Swap currencies
  const swapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  // Refresh rates
  const refreshRates = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLastUpdated(new Date());
    setIsRefreshing(false);
  };

  // Get current rate display
  const getCurrentRate = () => {
    if (fromCurrency.code === 'KRW') {
      const rate = mockRates[toCurrency.code]?.rate || 1;
      return `1 ${toCurrency.code} = ₩${rate.toLocaleString()}`;
    } else if (toCurrency.code === 'KRW') {
      const rate = mockRates[fromCurrency.code]?.rate || 1;
      return `1 ${fromCurrency.code} = ₩${rate.toLocaleString()}`;
    } else {
      const fromRate = mockRates[fromCurrency.code]?.rate || 1;
      const toRate = mockRates[toCurrency.code]?.rate || 1;
      const crossRate = fromRate / toRate;
      return `1 ${fromCurrency.code} = ${crossRate.toFixed(4)} ${toCurrency.code}`;
    }
  };

  // Format number for display
  const formatAmount = (num: number, currency: string) => {
    if (currency === 'KRW' || currency === 'JPY' || currency === 'VND') {
      return Math.round(num).toLocaleString();
    }
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href={`/${locale}/dashboard`}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>
          </Link>
          <div className="flex-1">
            <h1 className="text-white font-bold text-lg">
              {locale === 'ko' ? '환율 계산기' : 'Currency Exchange'}
            </h1>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={refreshRates}
            disabled={isRefreshing}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-white/50 ${isRefreshing ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-32">
        {/* Exchange Calculator Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-3xl p-6 border border-white/10">
            {/* From Currency */}
            <div className="mb-4">
              <label className="text-white/50 text-sm mb-2 block">
                {locale === 'ko' ? '보내는 금액' : 'You send'}
              </label>
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowFromPicker(true)}
                  className="flex items-center gap-2 px-4 py-3 bg-white/10 rounded-xl min-w-[120px]"
                >
                  <span className="text-2xl">{fromCurrency.flag}</span>
                  <span className="text-white font-semibold">{fromCurrency.code}</span>
                </motion.button>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-right text-2xl font-bold focus:outline-none focus:border-[#3B82F6]"
                />
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center my-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={swapCurrencies}
                className="w-12 h-12 rounded-full bg-[#3B82F6] flex items-center justify-center shadow-lg shadow-blue-500/30"
              >
                <ArrowUpDown className="w-5 h-5 text-white" />
              </motion.button>
            </div>

            {/* To Currency */}
            <div className="mt-4">
              <label className="text-white/50 text-sm mb-2 block">
                {locale === 'ko' ? '받는 금액' : 'You receive'}
              </label>
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowToPicker(true)}
                  className="flex items-center gap-2 px-4 py-3 bg-white/10 rounded-xl min-w-[120px]"
                >
                  <span className="text-2xl">{toCurrency.flag}</span>
                  <span className="text-white font-semibold">{toCurrency.code}</span>
                </motion.button>
                <div className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-right">
                  <p className="text-white text-2xl font-bold">
                    {formatAmount(convertedAmount, toCurrency.code)}
                  </p>
                </div>
              </div>
            </div>

            {/* Current Rate */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">
                  {locale === 'ko' ? '현재 환율' : 'Current Rate'}
                </span>
                <span className="text-white font-medium">{getCurrentRate()}</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <div className="flex items-center gap-1 text-white/40">
                  <Clock className="w-3 h-3" />
                  <span>
                    {locale === 'ko' ? '업데이트: ' : 'Updated: '}
                    {lastUpdated.toLocaleTimeString()}
                  </span>
                </div>
                <span className="text-white/40">
                  {locale === 'ko' ? '실시간 환율' : 'Live rates'}
                </span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Quick Amounts */}
        <section className="mt-6">
          <h3 className="text-white/50 text-sm mb-3">
            {locale === 'ko' ? '빠른 금액 선택' : 'Quick amounts'}
          </h3>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {fromCurrency.code === 'KRW'
              ? ['10000', '50000', '100000', '500000', '1000000'].map((val) => (
                  <motion.button
                    key={val}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setAmount(val)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                      amount === val
                        ? 'bg-[#3B82F6] text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    ₩{parseInt(val).toLocaleString()}
                  </motion.button>
                ))
              : ['50', '100', '500', '1000', '5000'].map((val) => (
                  <motion.button
                    key={val}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setAmount(val)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                      amount === val
                        ? 'bg-[#3B82F6] text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {fromCurrency.symbol}{parseInt(val).toLocaleString()}
                  </motion.button>
                ))}
          </div>
        </section>

        {/* Popular Rates */}
        <section className="mt-8">
          <h3 className="text-white font-bold text-lg mb-4">
            {locale === 'ko' ? '주요 환율' : 'Popular Rates'}
          </h3>
          <div className="space-y-2">
            {['USD', 'EUR', 'JPY', 'CNY'].map((code) => {
              const rate = mockRates[code];
              const currency = currencies.find((c) => c.code === code);
              if (!rate || !currency) return null;

              const isPositive = rate.change >= 0;

              return (
                <motion.div
                  key={code}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{currency.flag}</span>
                    <div>
                      <p className="text-white font-medium">{currency.code}</p>
                      <p className="text-white/40 text-xs">
                        {locale === 'ko' ? currency.nameKo : currency.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">₩{rate.rate.toLocaleString()}</p>
                    <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{isPositive ? '+' : ''}{rate.change.toFixed(2)} ({rate.changePercent.toFixed(2)}%)</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Exchange Options */}
        <section className="mt-8">
          <h3 className="text-white font-bold text-lg mb-4">
            {locale === 'ko' ? '환전 방법' : 'Exchange Options'}
          </h3>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#3B82F6]/20 to-[#8B5CF6]/20 rounded-xl border border-[#3B82F6]/30">
              <div className="w-12 h-12 rounded-full bg-[#3B82F6]/30 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">Ghost Wallet</p>
                <p className="text-white/50 text-sm">
                  {locale === 'ko' ? '수수료 0% · 즉시 환전' : '0% fee · Instant exchange'}
                </p>
              </div>
              <span className="px-3 py-1 bg-[#3B82F6] rounded-full text-white text-xs font-bold">BEST</span>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white/60" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">
                  {locale === 'ko' ? '공항 환전소' : 'Airport Exchange'}
                </p>
                <p className="text-white/50 text-sm">
                  {locale === 'ko' ? '수수료 1-3% · 대기 필요' : '1-3% fee · Wait required'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <Banknote className="w-6 h-6 text-white/60" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">
                  {locale === 'ko' ? '은행 환전' : 'Bank Exchange'}
                </p>
                <p className="text-white/50 text-sm">
                  {locale === 'ko' ? '수수료 0.5-1% · 영업시간 제한' : '0.5-1% fee · Limited hours'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Info */}
        <div className="mt-8 p-4 bg-white/5 rounded-xl">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" />
            <p className="text-white/40 text-xs leading-relaxed">
              {locale === 'ko'
                ? '환율은 실시간으로 변동됩니다. 실제 환전 시 적용되는 환율과 다를 수 있습니다. Ghost Wallet 환전은 표시된 환율이 그대로 적용됩니다.'
                : 'Exchange rates fluctuate in real-time. Actual rates may vary at the time of exchange. Ghost Wallet exchange uses the displayed rate.'}
            </p>
          </div>
        </div>
      </main>

      {/* Currency Picker Modal */}
      <AnimatePresence>
        {(showFromPicker || showToPicker) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowFromPicker(false);
                setShowToPicker(false);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-[#12121A] rounded-t-3xl border-t border-white/10 max-h-[70vh] overflow-hidden"
            >
              <div className="p-6 border-b border-white/10">
                <h3 className="text-white font-bold text-lg">
                  {locale === 'ko' ? '통화 선택' : 'Select Currency'}
                </h3>
              </div>

              <div className="overflow-y-auto max-h-[50vh] p-4">
                <div className="space-y-2">
                  {currencies.map((currency) => {
                    const isSelected = showFromPicker
                      ? fromCurrency.code === currency.code
                      : toCurrency.code === currency.code;

                    return (
                      <motion.button
                        key={currency.code}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (showFromPicker) {
                            setFromCurrency(currency);
                            setShowFromPicker(false);
                          } else {
                            setToCurrency(currency);
                            setShowToPicker(false);
                          }
                        }}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors ${
                          isSelected ? 'bg-[#3B82F6]/20 border border-[#3B82F6]/50' : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-3xl">{currency.flag}</span>
                        <div className="flex-1 text-left">
                          <p className="text-white font-semibold">{currency.code}</p>
                          <p className="text-white/50 text-sm">
                            {locale === 'ko' ? currency.nameKo : currency.name}
                          </p>
                        </div>
                        {currency.code !== 'KRW' && mockRates[currency.code] && (
                          <p className="text-white/60 text-sm">
                            ₩{mockRates[currency.code].rate.toLocaleString()}
                          </p>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
