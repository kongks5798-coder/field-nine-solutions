/**
 * A/B Test Hook
 * 간단한 클라이언트 사이드 A/B 테스트
 */

import { useState, useEffect } from 'react';

type Variant = 'A' | 'B';

interface ABTestConfig {
  testName: string;
  variants?: Variant[];
}

export function useABTest({ testName, variants = ['A', 'B'] }: ABTestConfig) {
  const [variant, setVariant] = useState<Variant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // localStorage에서 기존 할당 확인
    const storageKey = `ab_test_${testName}`;
    const stored = localStorage.getItem(storageKey);

    if (stored && variants.includes(stored as Variant)) {
      setVariant(stored as Variant);
      setIsLoading(false);
      return;
    }

    // 새로운 variant 할당 (50/50 split)
    const newVariant = variants[Math.floor(Math.random() * variants.length)];
    localStorage.setItem(storageKey, newVariant);
    setVariant(newVariant);
    setIsLoading(false);

    // Supabase에 기록 (비동기, 실패해도 무시)
    const visitorId = getOrCreateVisitorId();
    fetch('/api/ab-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId, testName, variant: newVariant }),
    }).catch(() => {});
  }, [testName, variants]);

  // 전환 이벤트 기록
  const trackConversion = (conversionType: string) => {
    const visitorId = getOrCreateVisitorId();
    fetch('/api/ab-test/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId, testName, conversionType }),
    }).catch(() => {});
  };

  return { variant, isLoading, trackConversion };
}

// 방문자 ID 생성/가져오기
function getOrCreateVisitorId(): string {
  const key = 'visitor_id';
  let visitorId = localStorage.getItem(key);

  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(key, visitorId);
  }

  return visitorId;
}

// 히어로 CTA A/B 테스트용 preset
export function useHeroCTATest() {
  return useABTest({ testName: 'hero_cta_2024' });
}

// 프라이싱 레이아웃 A/B 테스트용 preset
export function usePricingLayoutTest() {
  return useABTest({ testName: 'pricing_layout_2024' });
}
