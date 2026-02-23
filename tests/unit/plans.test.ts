// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  PLAN_PRICES,
  PLAN_VALID_AMOUNTS,
  PLAN_NAMES,
  PLAN_LIMITS,
  PLAN_TOKENS,
} from '@/lib/plans';
import type { PlanPrice } from '@/lib/plans';

// ── PLAN_PRICES ──────────────────────────────────────────────────────────────
describe('PLAN_PRICES', () => {
  it('pro 플랜 가격이 정의되어 있다', () => {
    expect(PLAN_PRICES.pro).toBeDefined();
    expect(PLAN_PRICES.pro.original).toBe(49000);
    expect(PLAN_PRICES.pro.discounted).toBe(39000);
  });

  it('team 플랜 가격이 정의되어 있다', () => {
    expect(PLAN_PRICES.team).toBeDefined();
    expect(PLAN_PRICES.team.original).toBe(129000);
    expect(PLAN_PRICES.team.discounted).toBe(99000);
  });

  it('할인가는 정가보다 낮다', () => {
    for (const [, price] of Object.entries(PLAN_PRICES)) {
      expect(price.discounted).toBeLessThan(price.original);
    }
  });

  it('모든 가격이 양수이다', () => {
    for (const [, price] of Object.entries(PLAN_PRICES)) {
      expect(price.original).toBeGreaterThan(0);
      expect(price.discounted).toBeGreaterThan(0);
    }
  });

  it('PlanPrice 타입 구조를 만족한다', () => {
    const price: PlanPrice = PLAN_PRICES.pro;
    expect(typeof price.original).toBe('number');
    expect(typeof price.discounted).toBe('number');
  });
});

// ── PLAN_VALID_AMOUNTS ───────────────────────────────────────────────────────
describe('PLAN_VALID_AMOUNTS', () => {
  it('pro 유효 금액에 정가와 할인가가 모두 포함된다', () => {
    expect(PLAN_VALID_AMOUNTS.pro).toContain(39000);
    expect(PLAN_VALID_AMOUNTS.pro).toContain(49000);
  });

  it('team 유효 금액에 정가와 할인가가 모두 포함된다', () => {
    expect(PLAN_VALID_AMOUNTS.team).toContain(99000);
    expect(PLAN_VALID_AMOUNTS.team).toContain(129000);
  });

  it('PLAN_PRICES와 PLAN_VALID_AMOUNTS가 일치한다', () => {
    for (const plan of Object.keys(PLAN_PRICES)) {
      const price = PLAN_PRICES[plan];
      const validAmounts = PLAN_VALID_AMOUNTS[plan];
      expect(validAmounts).toBeDefined();
      expect(validAmounts).toContain(price.original);
      expect(validAmounts).toContain(price.discounted);
    }
  });
});

// ── PLAN_NAMES ───────────────────────────────────────────────────────────────
describe('PLAN_NAMES', () => {
  it('pro, team, starter 이름이 정의되어 있다', () => {
    expect(PLAN_NAMES.pro).toBe('Pro');
    expect(PLAN_NAMES.team).toBe('Team');
    expect(PLAN_NAMES.starter).toBe('Starter');
  });

  it('모든 이름이 비어있지 않은 문자열이다', () => {
    for (const [, name] of Object.entries(PLAN_NAMES)) {
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    }
  });
});

// ── PLAN_LIMITS ──────────────────────────────────────────────────────────────
describe('PLAN_LIMITS', () => {
  it('starter 플랜 AI 호출 한도가 올바르다', () => {
    expect(PLAN_LIMITS.starter.dailyAiCalls).toBe(10);
    expect(PLAN_LIMITS.starter.monthlyAiCalls).toBe(30);
  });

  it('pro 플랜 AI 호출 한도가 올바르다', () => {
    expect(PLAN_LIMITS.pro.dailyAiCalls).toBe(500);
    expect(PLAN_LIMITS.pro.monthlyAiCalls).toBe(9999);
  });

  it('team 플랜 AI 호출 한도가 올바르다', () => {
    expect(PLAN_LIMITS.team.dailyAiCalls).toBe(999);
    expect(PLAN_LIMITS.team.monthlyAiCalls).toBe(9999);
  });

  it('상위 플랜이 더 많은 일일 호출 한도를 가진다', () => {
    expect(PLAN_LIMITS.pro.dailyAiCalls).toBeGreaterThan(PLAN_LIMITS.starter.dailyAiCalls);
    expect(PLAN_LIMITS.team.dailyAiCalls).toBeGreaterThan(PLAN_LIMITS.pro.dailyAiCalls);
  });

  it('상위 플랜이 더 많은 월간 호출 한도를 가진다', () => {
    expect(PLAN_LIMITS.pro.monthlyAiCalls).toBeGreaterThan(PLAN_LIMITS.starter.monthlyAiCalls);
    expect(PLAN_LIMITS.team.monthlyAiCalls).toBeGreaterThanOrEqual(PLAN_LIMITS.pro.monthlyAiCalls);
  });
});

// ── PLAN_TOKENS ──────────────────────────────────────────────────────────────
describe('PLAN_TOKENS', () => {
  it('pro 플랜 토큰 할당량이 올바르다', () => {
    expect(PLAN_TOKENS.pro).toBe(500_000);
  });

  it('team 플랜 토큰 할당량이 올바르다', () => {
    expect(PLAN_TOKENS.team).toBe(2_000_000);
  });

  it('team 플랜이 pro보다 더 많은 토큰을 가진다', () => {
    expect(PLAN_TOKENS.team).toBeGreaterThan(PLAN_TOKENS.pro);
  });

  it('모든 토큰 할당량이 양수이다', () => {
    for (const [, tokens] of Object.entries(PLAN_TOKENS)) {
      expect(tokens).toBeGreaterThan(0);
    }
  });
});
