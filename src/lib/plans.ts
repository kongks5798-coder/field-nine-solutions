/**
 * 플랜 가격 중앙 정의
 * 이 파일만 수정하면 모든 API/UI에 반영됩니다.
 */

export interface PlanPrice {
  original:   number;
  discounted: number;
}

/** 플랜별 정가 / 할인가 (KRW) */
export const PLAN_PRICES: Record<string, PlanPrice> = {
  pro:  { original: 49000, discounted: 39000 },
  team: { original: 129000, discounted: 99000 },
} as const;

/**
 * 서버 측 금액 검증용: 허용된 결제 금액 목록
 * (정가·할인가 모두 허용)
 */
export const PLAN_VALID_AMOUNTS: Record<string, number[]> = {
  pro:  [39000, 49000],
  team: [99000, 129000],
} as const;

/** 플랜 표시 이름 */
export const PLAN_NAMES: Record<string, string> = {
  pro:     "Pro",
  team:    "Team",
  starter: "Starter",
} as const;

/** 플랜별 AI 호출 한도 */
export const PLAN_LIMITS: Record<string, { dailyAiCalls: number; monthlyAiCalls: number }> = {
  starter: { dailyAiCalls: 10,  monthlyAiCalls: 30   },
  pro:     { dailyAiCalls: 500, monthlyAiCalls: 9999  },
  team:    { dailyAiCalls: 999, monthlyAiCalls: 9999  },
} as const;

/** 플랜별 월 토큰 할당량 */
export const PLAN_TOKENS: Record<string, number> = {
  pro:  500_000,    // 50만 토큰 / 월
  team: 2_000_000,  // 200만 토큰 / 월
} as const;
