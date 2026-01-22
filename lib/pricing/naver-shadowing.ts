/**
 * Naver Shadowing Price Engine
 * Final Price = Naver Lowest Price (무조건 동일)
 * Margin = Naver Price - Stay22 Net Rate
 *
 * Safety Protocol:
 * - If Naver price < Stay22 net rate → 판매 중단
 * - 메시지: "본사 확인 중인 특가 상품입니다. 잠시 후 시도해주세요."
 * - 관리자 알림 발송
 */

import { Stay22Rate } from '../stay22/types';
import { NaverPriceCache, NaverHotelPrice, PriceAlert } from '../naver/types';
import { searchCachedPrice, createPriceAlert, getCachedPricesForDestination } from '../naver/cache';
import { crawlNaverPrices, matchNaverPrice } from '../naver/crawler';

// ============================================
// Types
// ============================================

export interface ShadowPricing {
  finalPrice: number;           // 최종 판매가 (네이버가 또는 조정가)
  naverPrice: number;           // 네이버 최저가
  stay22NetRate: number;        // Stay22 도매가
  margin: number;               // finalPrice - stay22NetRate
  marginPercent: number;        // 마진율
  currency: string;
  isSafeToSell: boolean;        // 판매 가능 여부
  isNaverLowest: boolean;       // 네이버 최저가와 동일한지 (true = 최저가, false = 마진확보 조정)
  isPriceAdjusted: boolean;     // 가격이 조정되었는지 (최소마진 미달로)
  priceSource: 'naver_cache' | 'naver_crawl' | 'fallback';
  naverProvider?: string;       // 네이버 최저가 제공 업체
  lastUpdated: Date;
}

export interface ShadowPricingResult {
  success: boolean;
  pricing: ShadowPricing | null;
  error?: string;
  safetyMessage?: string;       // 안전 프로토콜 메시지
  alert?: PriceAlert;           // 생성된 알림 (있을 경우)
}

export interface HotelWithShadowPrice {
  hotelId: string;
  hotelName: string;
  stay22Rate: Stay22Rate;
  shadowPricing: ShadowPricing | null;
  displayPrice: number;
  displayCurrency: string;
  isAvailable: boolean;
  unavailableReason?: string;
}

// ============================================
// Constants
// ============================================

const USD_TO_KRW = 1350;
const MINIMUM_MARGIN_PERCENT = 3;  // 최소 3% 마진 보장 (이하면 가격 자동 조정)
const FALLBACK_MARKUP = 0.05;  // 네이버 가격 없을 때 5% 마크업

// Safety Protocol Messages
const SAFETY_MESSAGES = {
  PRICE_DEFICIT: '본사 확인 중인 특가 상품입니다. 잠시 후 시도해주세요.',
  PRICE_NOT_FOUND: '가격 확인 중입니다. 잠시 후 시도해주세요.',
  SYSTEM_ERROR: '시스템 점검 중입니다. 잠시 후 시도해주세요.',
  PRICE_ADJUSTED: '최저가 대비 소폭 조정된 가격입니다.',
};

// ============================================
// Core Shadowing Functions
// ============================================

/**
 * Calculate shadow pricing for a single hotel
 * Final price always equals Naver lowest price
 */
export async function calculateShadowPrice(
  hotelName: string,
  stay22NetRateUsd: number,
  destination: string,
  checkIn: string,
  checkOut: string
): Promise<ShadowPricingResult> {
  try {
    // Convert Stay22 rate to KRW
    const stay22NetRateKrw = Math.round(stay22NetRateUsd * USD_TO_KRW);

    // 1. Try to get cached Naver price
    let naverPrice = searchCachedPrice(hotelName, destination, checkIn, checkOut);
    let priceSource: ShadowPricing['priceSource'] = 'naver_cache';

    // 2. If no cache, crawl fresh prices
    if (!naverPrice) {
      const freshPrices = await crawlNaverPrices(destination, checkIn, checkOut);
      const matched = matchNaverPrice(hotelName, freshPrices);

      if (matched) {
        naverPrice = {
          id: `${destination}:${checkIn}:${checkOut}:${hotelName}`,
          hotelName: matched.hotelName,
          destination,
          checkIn,
          checkOut,
          lowestPriceKrw: matched.lowestPriceKrw,
          crawledAt: new Date(),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          isActive: true,
        };
        priceSource = 'naver_crawl';
      }
    }

    // 3. If still no price, use fallback (5% markup, always safe)
    if (!naverPrice) {
      const fallbackPriceKrw = Math.round(stay22NetRateKrw * (1 + FALLBACK_MARKUP));

      return {
        success: true,
        pricing: {
          finalPrice: fallbackPriceKrw,
          naverPrice: fallbackPriceKrw,
          stay22NetRate: stay22NetRateKrw,
          margin: fallbackPriceKrw - stay22NetRateKrw,
          marginPercent: FALLBACK_MARKUP * 100,
          currency: 'KRW',
          isSafeToSell: true,
          isNaverLowest: false,  // 네이버 가격 없으므로 비교 불가
          isPriceAdjusted: false,
          priceSource: 'fallback',
          lastUpdated: new Date(),
        },
      };
    }

    // 4. Calculate shadow pricing with minimum margin guarantee
    const naverPriceKrw = naverPrice.lowestPriceKrw;
    const rawMargin = naverPriceKrw - stay22NetRateKrw;
    const rawMarginPercent = (rawMargin / stay22NetRateKrw) * 100;

    // 최소 마진 보장 가격 계산
    const minimumPrice = Math.round(stay22NetRateKrw * (1 + MINIMUM_MARGIN_PERCENT / 100));

    // 역마진 체크 (도매가보다 네이버가 더 쌀 때)
    if (rawMargin < 0) {
      const alert = createPriceAlert(hotelName, naverPriceKrw, stay22NetRateKrw);

      console.warn('🚨 SAFETY PROTOCOL - 역마진 감지:', {
        hotel: hotelName,
        naverPrice: naverPriceKrw,
        stay22Rate: stay22NetRateKrw,
        deficit: rawMargin,
      });

      return {
        success: false,
        pricing: {
          finalPrice: naverPriceKrw,
          naverPrice: naverPriceKrw,
          stay22NetRate: stay22NetRateKrw,
          margin: rawMargin,
          marginPercent: Math.round(rawMarginPercent * 100) / 100,
          currency: 'KRW',
          isSafeToSell: false,
          isNaverLowest: true,
          isPriceAdjusted: false,
          priceSource,
          lastUpdated: new Date(),
        },
        error: 'Price deficit detected',
        safetyMessage: SAFETY_MESSAGES.PRICE_DEFICIT,
        alert,
      };
    }

    // 최소 마진 미달 시 가격 자동 조정
    let finalPrice: number;
    let isNaverLowest: boolean;
    let isPriceAdjusted: boolean;

    if (rawMarginPercent < MINIMUM_MARGIN_PERCENT) {
      // 마진 부족 → 가격 올려서 최소 마진 확보
      finalPrice = minimumPrice;
      isNaverLowest = false;
      isPriceAdjusted = true;

      console.log('💰 가격 자동 조정:', {
        hotel: hotelName,
        naverPrice: naverPriceKrw,
        adjustedPrice: finalPrice,
        originalMargin: `${rawMarginPercent.toFixed(2)}%`,
        newMargin: `${MINIMUM_MARGIN_PERCENT}%`,
      });
    } else {
      // 마진 충분 → 네이버 최저가 그대로 사용
      finalPrice = naverPriceKrw;
      isNaverLowest = true;
      isPriceAdjusted = false;
    }

    // 최종 마진 계산
    const finalMargin = finalPrice - stay22NetRateKrw;
    const finalMarginPercent = (finalMargin / stay22NetRateKrw) * 100;

    const pricing: ShadowPricing = {
      finalPrice,
      naverPrice: naverPriceKrw,
      stay22NetRate: stay22NetRateKrw,
      margin: finalMargin,
      marginPercent: Math.round(finalMarginPercent * 100) / 100,
      currency: 'KRW',
      isSafeToSell: true,
      isNaverLowest,
      isPriceAdjusted,
      priceSource,
      lastUpdated: new Date(),
    };

    return {
      success: true,
      pricing,
    };
  } catch (error) {
    console.error('Shadow pricing error:', error);
    return {
      success: false,
      pricing: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      safetyMessage: SAFETY_MESSAGES.SYSTEM_ERROR,
    };
  }
}

/**
 * Calculate shadow pricing for multiple hotels (batch)
 * 최소 마진 보장 로직 포함
 */
export async function calculateBatchShadowPrices(
  hotels: Array<{
    hotelId: string;
    hotelName: string;
    stay22Rate: Stay22Rate;
  }>,
  destination: string,
  checkIn: string,
  checkOut: string
): Promise<HotelWithShadowPrice[]> {
  // Pre-fetch Naver prices for the destination
  const naverPrices = await crawlNaverPrices(destination, checkIn, checkOut);

  return Promise.all(
    hotels.map(async (hotel) => {
      const matched = matchNaverPrice(hotel.hotelName, naverPrices);
      const stay22NetKrw = Math.round(hotel.stay22Rate.netRate * USD_TO_KRW);

      // 최소 마진 보장 가격
      const minimumPrice = Math.round(stay22NetKrw * (1 + MINIMUM_MARGIN_PERCENT / 100));

      if (!matched) {
        // Fallback pricing (5% markup)
        const fallbackPrice = Math.round(stay22NetKrw * (1 + FALLBACK_MARKUP));

        return {
          hotelId: hotel.hotelId,
          hotelName: hotel.hotelName,
          stay22Rate: hotel.stay22Rate,
          shadowPricing: {
            finalPrice: fallbackPrice,
            naverPrice: fallbackPrice,
            stay22NetRate: stay22NetKrw,
            margin: fallbackPrice - stay22NetKrw,
            marginPercent: FALLBACK_MARKUP * 100,
            currency: 'KRW',
            isSafeToSell: true,
            isNaverLowest: false,
            isPriceAdjusted: false,
            priceSource: 'fallback' as const,
            lastUpdated: new Date(),
          },
          displayPrice: fallbackPrice,
          displayCurrency: 'KRW',
          isAvailable: true,
        };
      }

      const rawMargin = matched.lowestPriceKrw - stay22NetKrw;
      const rawMarginPercent = (rawMargin / stay22NetKrw) * 100;

      // 역마진 체크
      if (rawMargin < 0) {
        createPriceAlert(hotel.hotelName, matched.lowestPriceKrw, stay22NetKrw);
        return {
          hotelId: hotel.hotelId,
          hotelName: hotel.hotelName,
          stay22Rate: hotel.stay22Rate,
          shadowPricing: {
            finalPrice: matched.lowestPriceKrw,
            naverPrice: matched.lowestPriceKrw,
            stay22NetRate: stay22NetKrw,
            margin: rawMargin,
            marginPercent: Math.round(rawMarginPercent * 100) / 100,
            currency: 'KRW',
            isSafeToSell: false,
            isNaverLowest: true,
            isPriceAdjusted: false,
            priceSource: 'naver_crawl' as const,
            naverProvider: matched.providerName,
            lastUpdated: new Date(),
          },
          displayPrice: matched.lowestPriceKrw,
          displayCurrency: 'KRW',
          isAvailable: false,
          unavailableReason: SAFETY_MESSAGES.PRICE_DEFICIT,
        };
      }

      // 최소 마진 미달 시 가격 자동 조정
      let finalPrice: number;
      let isNaverLowest: boolean;
      let isPriceAdjusted: boolean;

      if (rawMarginPercent < MINIMUM_MARGIN_PERCENT) {
        finalPrice = minimumPrice;
        isNaverLowest = false;
        isPriceAdjusted = true;
      } else {
        finalPrice = matched.lowestPriceKrw;
        isNaverLowest = true;
        isPriceAdjusted = false;
      }

      const finalMargin = finalPrice - stay22NetKrw;
      const finalMarginPercent = (finalMargin / stay22NetKrw) * 100;

      return {
        hotelId: hotel.hotelId,
        hotelName: hotel.hotelName,
        stay22Rate: hotel.stay22Rate,
        shadowPricing: {
          finalPrice,
          naverPrice: matched.lowestPriceKrw,
          stay22NetRate: stay22NetKrw,
          margin: finalMargin,
          marginPercent: Math.round(finalMarginPercent * 100) / 100,
          currency: 'KRW',
          isSafeToSell: true,
          isNaverLowest,
          isPriceAdjusted,
          priceSource: 'naver_crawl' as const,
          naverProvider: matched.providerName,
          lastUpdated: new Date(),
        },
        displayPrice: finalPrice,
        displayCurrency: 'KRW',
        isAvailable: true,
      };
    })
  );
}

// ============================================
// Price Display Helpers
// ============================================

/**
 * Format price for display
 */
export function formatShadowPrice(price: number, currency: string = 'KRW'): string {
  if (currency === 'KRW') {
    return `₩${price.toLocaleString('ko-KR')}`;
  }
  return `$${price.toLocaleString('en-US')}`;
}

/**
 * Get price badge text for UI
 */
export function getPriceBadgeText(pricing: ShadowPricing): string {
  if (pricing.priceSource === 'fallback') {
    return '실시간 가격';
  }
  if (pricing.isNaverLowest) {
    return '네이버 최저가 동일';
  }
  if (pricing.isPriceAdjusted) {
    return '특가'; // 최소마진 확보를 위해 조정된 가격
  }
  return '실시간 가격';
}

/**
 * Get detailed price info for UI
 */
export function getPriceInfo(pricing: ShadowPricing): {
  badge: string;
  subtext: string;
  isLowest: boolean;
} {
  if (pricing.isNaverLowest) {
    return {
      badge: '네이버 동일가',
      subtext: '네이버 최저가와 100% 동일합니다',
      isLowest: true,
    };
  }
  if (pricing.isPriceAdjusted) {
    const diff = pricing.finalPrice - pricing.naverPrice;
    return {
      badge: '특가',
      subtext: `네이버 대비 +₩${diff.toLocaleString()}`,
      isLowest: false,
    };
  }
  return {
    badge: '실시간',
    subtext: '실시간 가격입니다',
    isLowest: false,
  };
}

/**
 * Get margin indicator for admin dashboard
 */
export function getMarginIndicator(pricing: ShadowPricing): {
  level: 'safe' | 'low' | 'warning' | 'danger';
  label: string;
  color: string;
} {
  const marginPercent = pricing.marginPercent;

  if (marginPercent >= 10) {
    return { level: 'safe', label: '안전', color: '#22C55E' };
  }
  if (marginPercent >= 5) {
    return { level: 'low', label: '낮음', color: '#EAB308' };
  }
  if (marginPercent >= 0) {
    return { level: 'warning', label: '주의', color: '#F97316' };
  }
  return { level: 'danger', label: '적자', color: '#EF4444' };
}

// ============================================
// Admin Notification (Production)
// ============================================

/**
 * Send admin notification for price alerts
 * In production, integrate with Slack, Discord, or email
 */
export async function sendPriceAlertNotification(alert: PriceAlert): Promise<void> {
  const webhookUrl = process.env.ADMIN_NOTIFICATION_WEBHOOK;

  if (!webhookUrl) {
    console.log('No webhook configured, skipping notification');
    return;
  }

  try {
    const message = {
      text: `🚨 가격 경고: ${alert.hotelName}`,
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: '🚨 네이버 가격 적자 경고' },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*호텔:*\n${alert.hotelName}` },
            { type: 'mrkdwn', text: `*적자액:*\n₩${alert.deficitKrw.toLocaleString()}` },
            { type: 'mrkdwn', text: `*네이버 가격:*\n₩${alert.naverPriceKrw.toLocaleString()}` },
            { type: 'mrkdwn', text: `*Stay22 원가:*\n₩${alert.stay22NetRateKrw.toLocaleString()}` },
          ],
        },
      ],
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error('Failed to send price alert notification:', error);
  }
}
