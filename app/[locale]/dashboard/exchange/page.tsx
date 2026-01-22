/**
 * K-UNIVERSAL Currency Exchange
 * Tesla-Style Minimal Design - Warm Ivory & Deep Black
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
  Info,
  Clock,
  Check,
  ChevronDown,
  Banknote,
  Zap,
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

// Default rates (fallback)
const defaultRates: Record<string, number> = {
  USD: 1472.76,
  EUR: 1709.40,
  JPY: 9.30,
  CNY: 210.88,
  GBP: 1972.39,
  AUD: 985.22,
  CAD: 1059.32,
  SGD: 1142.86,
  THB: 46.86,
  VND: 0.056,
  PHP: 24.79,
};

// ============================================
// Components - Tesla Style
// ============================================

function CurrencyPicker({
  value,
  onChange,
  excludeCode,
  isKo,
  isOpen,
  onToggle,
  onClose,
}: {
  value: Currency;
  onChange: (currency: Currency) => void;
  excludeCode?: string;
  isKo: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const filteredCurrencies = currencies.filter(c => c.code !== excludeCode);

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-3 px-4 py-3.5 bg-white border border-neutral-900/10 rounded-xl hover:border-neutral-900/30 transition-colors min-w-[140px]"
      >
        <span className="text-2xl">{value.flag}</span>
        <div className="text-left">
          <p className="text-neutral-900 font-bold">{value.code}</p>
          <p className="text-neutral-900/40 text-xs">{isKo ? value.nameKo : value.name}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-neutral-900/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 bg-white border border-neutral-900/10 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto min-w-[200px]"
          >
            {filteredCurrencies.map((currency) => (
              <button
                key={currency.code}
                onClick={() => {
                  onChange(currency);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-900/5 transition-colors ${
                  value.code === currency.code ? 'bg-[#03C75A]/10' : ''
                }`}
              >
                <span className="text-2xl">{currency.flag}</span>
                <div className="text-left flex-1">
                  <p className="text-neutral-900 font-medium">{currency.code}</p>
                  <p className="text-neutral-900/40 text-xs">
                    {isKo ? currency.nameKo : currency.name}
                  </p>
                </div>
                {value.code === currency.code && (
                  <Check className="w-4 h-4 text-[#03C75A]" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Main Component - Tesla Style
// ============================================

export default function ExchangePage() {
  const locale = useLocale();
  const isKo = locale === 'ko';

  const [fromCurrency, setFromCurrency] = useState<Currency>(currencies[1]); // USD
  const [toCurrency, setToCurrency] = useState<Currency>(currencies[0]); // KRW
  const [amount, setAmount] = useState('100');
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [rates, setRates] = useState<Record<string, number>>(defaultRates);
  const [isLiveRate, setIsLiveRate] = useState(false);

  // Fetch rates from API
  const fetchRates = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/v1/exchange/rates');
      const data = await response.json();

      if (data.success && data.rates) {
        setRates(data.rates);
        setLastUpdated(new Date(data.timestamp));
        setIsLiveRate(!data.fallback);
      }
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // Calculate conversion
  const calculateConversion = useCallback(() => {
    const numAmount = parseFloat(amount) || 0;

    if (fromCurrency.code === 'KRW' && toCurrency.code !== 'KRW') {
      const rate = rates[toCurrency.code] || 1;
      setConvertedAmount(numAmount / rate);
    } else if (fromCurrency.code !== 'KRW' && toCurrency.code === 'KRW') {
      const rate = rates[fromCurrency.code] || 1;
      setConvertedAmount(numAmount * rate);
    } else if (fromCurrency.code !== 'KRW' && toCurrency.code !== 'KRW') {
      const fromRate = rates[fromCurrency.code] || 1;
      const toRate = rates[toCurrency.code] || 1;
      const krwAmount = numAmount * fromRate;
      setConvertedAmount(krwAmount / toRate);
    } else {
      setConvertedAmount(numAmount);
    }
  }, [amount, fromCurrency, toCurrency, rates]);

  useEffect(() => {
    calculateConversion();
  }, [calculateConversion]);

  // Swap currencies
  const swapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  // Get current rate display
  const getCurrentRate = () => {
    if (fromCurrency.code === 'KRW') {
      const rate = rates[toCurrency.code] || 1;
      return `1 ${toCurrency.code} = ₩${rate.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}`;
    } else if (toCurrency.code === 'KRW') {
      const rate = rates[fromCurrency.code] || 1;
      return `1 ${fromCurrency.code} = ₩${rate.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}`;
    } else {
      const fromRate = rates[fromCurrency.code] || 1;
      const toRate = rates[toCurrency.code] || 1;
      const crossRate = fromRate / toRate;
      return `1 ${fromCurrency.code} = ${crossRate.toFixed(4)} ${toCurrency.code}`;
    }
  };

  // Format number
  const formatAmount = (num: number, currency: string) => {
    if (currency === 'KRW' || currency === 'JPY' || currency === 'VND') {
      return Math.round(num).toLocaleString();
    }
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Quick amounts
  const quickAmounts = fromCurrency.code === 'KRW'
    ? ['10000', '50000', '100000', '500000', '1000000']
    : ['50', '100', '500', '1000', '5000'];

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      {/* Header - Tesla Style */}
      <header className="sticky top-0 z-40 bg-[#F9F9F7]/80 backdrop-blur-xl border-b border-neutral-900/10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/${locale}/dashboard`}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="p-2 hover:bg-neutral-900/5 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-neutral-900" />
                </motion.button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-neutral-900">
                    {isKo ? '환율 계산기' : 'Currency Exchange'}
                  </h1>
                  <p className="text-xs text-neutral-900/50">
                    {isKo ? '실시간 환율 비교' : 'Real-time exchange rates'}
                  </p>
                </div>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={fetchRates}
              disabled={isRefreshing}
              className="p-2 hover:bg-neutral-900/5 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-neutral-900/50 ${isRefreshing ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-32">
        {/* Live Rate Badge */}
        <div className="flex items-center justify-center mb-6">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
            isLiveRate
              ? 'bg-[#03C75A]/10 text-[#03C75A] border border-[#03C75A]/20'
              : 'bg-neutral-900/5 text-neutral-900/50 border border-neutral-900/10'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isLiveRate ? 'bg-[#03C75A] animate-pulse' : 'bg-neutral-900/30'}`} />
            {isLiveRate ? (isKo ? '실시간 환율' : 'Live Rates') : (isKo ? '기본 환율' : 'Default Rates')}
          </div>
        </div>

        {/* Exchange Calculator Card - Tesla Style */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-white rounded-3xl p-6 border border-neutral-900/10 shadow-sm">
            {/* From Currency */}
            <div className="mb-4">
              <label className="text-neutral-900/50 text-sm mb-2 block">
                {isKo ? '보내는 금액' : 'You send'}
              </label>
              <div className="flex gap-3">
                <CurrencyPicker
                  value={fromCurrency}
                  onChange={setFromCurrency}
                  excludeCode={toCurrency.code}
                  isKo={isKo}
                  isOpen={showFromPicker}
                  onToggle={() => {
                    setShowFromPicker(!showFromPicker);
                    setShowToPicker(false);
                  }}
                  onClose={() => setShowFromPicker(false)}
                />
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  className="flex-1 px-4 py-3 bg-[#F9F9F7] border border-neutral-900/10 rounded-xl text-neutral-900 text-right text-2xl font-bold focus:outline-none focus:border-neutral-900 transition-colors"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center my-4">
              <motion.button
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={swapCurrencies}
                className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center shadow-lg"
              >
                <ArrowUpDown className="w-5 h-5 text-white" />
              </motion.button>
            </div>

            {/* To Currency */}
            <div>
              <label className="text-neutral-900/50 text-sm mb-2 block">
                {isKo ? '받는 금액' : 'You receive'}
              </label>
              <div className="flex gap-3">
                <CurrencyPicker
                  value={toCurrency}
                  onChange={setToCurrency}
                  excludeCode={fromCurrency.code}
                  isKo={isKo}
                  isOpen={showToPicker}
                  onToggle={() => {
                    setShowToPicker(!showToPicker);
                    setShowFromPicker(false);
                  }}
                  onClose={() => setShowToPicker(false)}
                />
                <div className="flex-1 px-4 py-3 bg-neutral-900 border border-neutral-900 rounded-xl text-right">
                  <p className="text-white text-2xl font-bold">
                    {formatAmount(convertedAmount, toCurrency.code)}
                  </p>
                </div>
              </div>
            </div>

            {/* Current Rate */}
            <div className="mt-6 pt-4 border-t border-neutral-900/10">
              <div className="flex items-center justify-between">
                <span className="text-neutral-900/50 text-sm">
                  {isKo ? '현재 환율' : 'Current Rate'}
                </span>
                <span className="text-neutral-900 font-semibold">{getCurrentRate()}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1 text-neutral-900/40 text-xs">
                  <Clock className="w-3 h-3" />
                  <span>
                    {isKo ? '업데이트: ' : 'Updated: '}
                    {lastUpdated.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Quick Amounts */}
        <section className="mt-6">
          <h3 className="text-neutral-900/50 text-sm mb-3">
            {isKo ? '빠른 금액 선택' : 'Quick amounts'}
          </h3>
          <div className="flex gap-2 flex-wrap">
            {quickAmounts.map((val) => (
              <motion.button
                key={val}
                whileTap={{ scale: 0.95 }}
                onClick={() => setAmount(val)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  amount === val
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white text-neutral-900/60 hover:bg-neutral-900/5 border border-neutral-900/10'
                }`}
              >
                {fromCurrency.code === 'KRW' ? '₩' : fromCurrency.symbol}
                {parseInt(val).toLocaleString()}
              </motion.button>
            ))}
          </div>
        </section>

        {/* Popular Rates */}
        <section className="mt-8">
          <h3 className="text-neutral-900 font-bold text-lg mb-4">
            {isKo ? '주요 환율' : 'Popular Rates'}
          </h3>
          <div className="space-y-3">
            {['USD', 'EUR', 'JPY', 'CNY'].map((code) => {
              const rate = rates[code];
              const currency = currencies.find((c) => c.code === code);
              if (!rate || !currency) return null;

              return (
                <motion.button
                  key={code}
                  onClick={() => {
                    setFromCurrency(currency);
                    setToCurrency(currencies[0]); // KRW
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-neutral-900/10 hover:border-neutral-900/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{currency.flag}</span>
                    <div className="text-left">
                      <p className="text-neutral-900 font-medium">{currency.code}</p>
                      <p className="text-neutral-900/40 text-xs">
                        {isKo ? currency.nameKo : currency.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-neutral-900 font-bold">
                      ₩{rate.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}
                    </p>
                    {isLiveRate && (
                      <span className="text-[#03C75A] text-xs flex items-center justify-end gap-1">
                        <Zap className="w-3 h-3" />
                        Live
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* Info Notice */}
        <div className="mt-8 p-4 bg-neutral-900/5 rounded-xl border border-neutral-900/10">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-neutral-900 flex-shrink-0 mt-0.5" />
            <p className="text-neutral-900/70 text-sm">
              {isKo
                ? '환율은 실시간으로 변동됩니다. 실제 환전 시 적용되는 환율과 다를 수 있습니다.'
                : 'Exchange rates fluctuate in real-time. Actual rates may vary at the time of exchange.'}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
