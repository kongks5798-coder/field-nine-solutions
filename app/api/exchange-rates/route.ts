/**
 * 실시간 환율 API
 * ExchangeRate-API 무료 버전 사용
 * https://www.exchangerate-api.com/
 */

import { NextResponse } from 'next/server';

// 지원하는 통화 목록
const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'JPY', 'CNY', 'GBP', 'AUD', 'CAD', 'SGD', 'THB', 'VND', 'PHP'];

// 캐시 (5분간 유지)
let ratesCache: {
  rates: Record<string, number>;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5분

export async function GET() {
  try {
    // 캐시가 유효하면 캐시된 데이터 반환
    if (ratesCache && Date.now() - ratesCache.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        rates: ratesCache.rates,
        timestamp: ratesCache.timestamp,
        cached: true,
      });
    }

    // ExchangeRate-API 호출 (KRW 기준)
    const response = await fetch(
      'https://open.er-api.com/v6/latest/KRW',
      {
        next: { revalidate: 300 }, // 5분 캐시
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.result !== 'success') {
      throw new Error('API returned error');
    }

    // KRW 기준 환율을 KRW당 외화 가격으로 변환
    // API는 1 KRW = X USD 형태로 반환
    // 우리는 1 USD = X KRW 형태가 필요
    const rates: Record<string, { rate: number; inverseRate: number }> = {};

    for (const currency of SUPPORTED_CURRENCIES) {
      if (data.rates[currency]) {
        // 1 KRW = X USD (API 응답)
        // 1 USD = 1/X KRW (우리가 필요한 형태)
        const inverseRate = 1 / data.rates[currency];
        rates[currency] = {
          rate: inverseRate,  // 1 USD = X KRW
          inverseRate: data.rates[currency], // 1 KRW = X USD
        };
      }
    }

    // 캐시 업데이트
    ratesCache = {
      rates: Object.fromEntries(
        Object.entries(rates).map(([k, v]) => [k, v.rate])
      ),
      timestamp: Date.now(),
    };

    return NextResponse.json({
      success: true,
      rates: ratesCache.rates,
      timestamp: ratesCache.timestamp,
      cached: false,
      source: 'ExchangeRate-API',
      base: 'KRW',
    });
  } catch (error) {
    console.error('Exchange rate API error:', error);

    // 에러 시 폴백 데이터 반환 (2026-01-19 기준)
    const fallbackRates: Record<string, number> = {
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

    return NextResponse.json({
      success: true,
      rates: fallbackRates,
      timestamp: Date.now(),
      cached: false,
      fallback: true,
      error: 'Using fallback rates',
    });
  }
}
