/**
 * K-UNIVERSAL Unified Currency Engine
 * Centralized exchange rate management with KRW as primary currency
 *
 * Features:
 * - Real-time exchange rates (cached for 1 hour)
 * - KRW as primary display currency with 1-won precision
 * - Multi-currency support for global users
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

// ============================================
// Types
// ============================================

export type CurrencyCode = 'KRW' | 'USD' | 'EUR' | 'JPY' | 'CNY' | 'THB' | 'SGD' | 'GBP' | 'VND' | 'HKD' | 'TWD';

export interface ExchangeRates {
  [key: string]: number;
}

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  nameKo: string;
  decimals: number; // 0 for KRW/JPY, 2 for others
}

export interface ConversionResult {
  amount: number;
  formatted: string;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  rate: number;
}

interface CurrencyContextType {
  // Current display currency (default: KRW)
  displayCurrency: CurrencyCode;
  setDisplayCurrency: (currency: CurrencyCode) => void;

  // Exchange rates (base: USD)
  rates: ExchangeRates;
  lastUpdated: Date | null;
  isLoading: boolean;
  error: string | null;

  // Conversion functions
  convert: (amount: number, from: CurrencyCode, to?: CurrencyCode) => ConversionResult;
  toKRW: (amount: number, from: CurrencyCode) => number;
  fromKRW: (amountKRW: number, to: CurrencyCode) => number;

  // Formatting
  formatPrice: (amount: number, currency?: CurrencyCode) => string;
  formatPriceKRW: (amount: number) => string;

  // Currency info
  getCurrencyInfo: (code: CurrencyCode) => CurrencyInfo;
  availableCurrencies: CurrencyInfo[];

  // Refresh rates
  refreshRates: () => Promise<void>;
}

// ============================================
// Constants
// ============================================

// Exchange rates relative to USD (updated rates)
const DEFAULT_RATES: ExchangeRates = {
  USD: 1,
  KRW: 1350,
  EUR: 0.92,
  JPY: 150,
  CNY: 7.25,
  THB: 35.5,
  SGD: 1.34,
  GBP: 0.79,
  VND: 24500,
  HKD: 7.82,
  TWD: 31.5,
};

const CURRENCY_INFO: Record<CurrencyCode, CurrencyInfo> = {
  KRW: { code: 'KRW', symbol: '₩', name: 'Korean Won', nameKo: '원', decimals: 0 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', nameKo: '달러', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', nameKo: '유로', decimals: 2 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', nameKo: '엔', decimals: 0 },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', nameKo: '위안', decimals: 2 },
  THB: { code: 'THB', symbol: '฿', name: 'Thai Baht', nameKo: '바트', decimals: 2 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', nameKo: '싱가포르 달러', decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', nameKo: '파운드', decimals: 2 },
  VND: { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', nameKo: '동', decimals: 0 },
  HKD: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', nameKo: '홍콩 달러', decimals: 2 },
  TWD: { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar', nameKo: '대만 달러', decimals: 0 },
};

const CACHE_KEY = 'k-universal-exchange-rates';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// ============================================
// Context
// ============================================

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// ============================================
// Provider
// ============================================

interface CurrencyProviderProps {
  children: ReactNode;
  defaultCurrency?: CurrencyCode;
}

export function CurrencyProvider({ children, defaultCurrency = 'KRW' }: CurrencyProviderProps) {
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [rates, setRates] = useState<ExchangeRates>(DEFAULT_RATES);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cached rates on mount
  useEffect(() => {
    const cached = loadCachedRates();
    if (cached) {
      setRates(cached.rates);
      setLastUpdated(new Date(cached.timestamp));
    } else {
      // Use default rates and optionally fetch fresh ones
      refreshRates();
    }
  }, []);

  // Load cached rates from localStorage
  const loadCachedRates = (): { rates: ExchangeRates; timestamp: number } | null => {
    if (typeof window === 'undefined') return null;

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_DURATION) {
        return parsed;
      }
    } catch {
      // Invalid cache
    }
    return null;
  };

  // Save rates to cache
  const cacheRates = (newRates: ExchangeRates) => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        rates: newRates,
        timestamp: Date.now(),
      }));
    } catch {
      // Cache write failed
    }
  };

  // Refresh exchange rates from API
  const refreshRates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/exchange/rates');
      if (response.ok) {
        const data = await response.json();
        if (data.rates) {
          setRates(data.rates);
          setLastUpdated(new Date());
          cacheRates(data.rates);
        }
      } else {
        // Use default rates on API failure
        setRates(DEFAULT_RATES);
        setLastUpdated(new Date());
      }
    } catch {
      // Use default rates on network failure
      setRates(DEFAULT_RATES);
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Convert between currencies
  const convert = useCallback((
    amount: number,
    from: CurrencyCode,
    to: CurrencyCode = displayCurrency
  ): ConversionResult => {
    const fromRate = rates[from] || 1;
    const toRate = rates[to] || 1;

    // Convert to USD first, then to target currency
    const usdAmount = amount / fromRate;
    const convertedAmount = usdAmount * toRate;

    // Apply appropriate precision
    const decimals = CURRENCY_INFO[to].decimals;
    const roundedAmount = decimals === 0
      ? Math.round(convertedAmount)
      : Math.round(convertedAmount * Math.pow(10, decimals)) / Math.pow(10, decimals);

    return {
      amount: roundedAmount,
      formatted: formatPriceInternal(roundedAmount, to),
      fromCurrency: from,
      toCurrency: to,
      rate: toRate / fromRate,
    };
  }, [rates, displayCurrency]);

  // Convert any currency to KRW (1-won precision)
  const toKRW = useCallback((amount: number, from: CurrencyCode): number => {
    if (from === 'KRW') return Math.round(amount);

    const fromRate = rates[from] || 1;
    const krwRate = rates['KRW'] || 1350;

    // Convert to USD first, then to KRW
    const usdAmount = amount / fromRate;
    const krwAmount = usdAmount * krwRate;

    // 1-won precision
    return Math.round(krwAmount);
  }, [rates]);

  // Convert KRW to any currency
  const fromKRW = useCallback((amountKRW: number, to: CurrencyCode): number => {
    if (to === 'KRW') return Math.round(amountKRW);

    const krwRate = rates['KRW'] || 1350;
    const toRate = rates[to] || 1;

    // Convert KRW to USD first, then to target
    const usdAmount = amountKRW / krwRate;
    const convertedAmount = usdAmount * toRate;

    const decimals = CURRENCY_INFO[to].decimals;
    return decimals === 0
      ? Math.round(convertedAmount)
      : Math.round(convertedAmount * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }, [rates]);

  // Internal format function
  const formatPriceInternal = (amount: number, currency: CurrencyCode): string => {
    const info = CURRENCY_INFO[currency];

    if (currency === 'KRW') {
      // Korean Won: ₩123,456 format
      return `₩${Math.round(amount).toLocaleString('ko-KR')}`;
    }

    // Other currencies
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: info.decimals,
      maximumFractionDigits: info.decimals,
    }).format(amount);
  };

  // Format price in specified currency
  const formatPrice = useCallback((amount: number, currency: CurrencyCode = displayCurrency): string => {
    return formatPriceInternal(amount, currency);
  }, [displayCurrency]);

  // Format price specifically in KRW (convenience function)
  const formatPriceKRW = useCallback((amount: number): string => {
    return `₩${Math.round(amount).toLocaleString('ko-KR')}`;
  }, []);

  // Get currency info
  const getCurrencyInfo = useCallback((code: CurrencyCode): CurrencyInfo => {
    return CURRENCY_INFO[code];
  }, []);

  // Available currencies list
  const availableCurrencies = Object.values(CURRENCY_INFO);

  const value: CurrencyContextType = {
    displayCurrency,
    setDisplayCurrency,
    rates,
    lastUpdated,
    isLoading,
    error,
    convert,
    toKRW,
    fromKRW,
    formatPrice,
    formatPriceKRW,
    getCurrencyInfo,
    availableCurrencies,
    refreshRates,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);

  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }

  return context;
}

// ============================================
// Utility Functions (for server-side use)
// ============================================

/**
 * Convert amount to KRW (for server-side use without context)
 */
export function convertToKRW(amount: number, fromCurrency: string): number {
  const rate = DEFAULT_RATES[fromCurrency] || 1;
  const krwRate = DEFAULT_RATES['KRW'];
  const usdAmount = amount / rate;
  return Math.round(usdAmount * krwRate);
}

/**
 * Format price in KRW (for server-side use without context)
 */
export function formatKRW(amount: number): string {
  return `₩${Math.round(amount).toLocaleString('ko-KR')}`;
}

/**
 * Get exchange rate between two currencies
 */
export function getExchangeRate(from: string, to: string): number {
  const fromRate = DEFAULT_RATES[from] || 1;
  const toRate = DEFAULT_RATES[to] || 1;
  return toRate / fromRate;
}
