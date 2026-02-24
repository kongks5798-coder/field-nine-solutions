// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  PLAN_PRICES,
  PLAN_VALID_AMOUNTS,
  PLAN_NAMES,
  PLAN_LIMITS,
  PLAN_TOKENS,
} from "@/lib/plans";

describe("lib/plans", () => {
  describe("PLAN_PRICES", () => {
    it("has pro plan with original and discounted prices", () => {
      expect(PLAN_PRICES.pro).toBeDefined();
      expect(PLAN_PRICES.pro.original).toBe(49000);
      expect(PLAN_PRICES.pro.discounted).toBe(39000);
    });

    it("has team plan with original and discounted prices", () => {
      expect(PLAN_PRICES.team).toBeDefined();
      expect(PLAN_PRICES.team.original).toBe(129000);
      expect(PLAN_PRICES.team.discounted).toBe(99000);
    });

    it("discounted price is always less than or equal to original", () => {
      for (const [, price] of Object.entries(PLAN_PRICES)) {
        expect(price.discounted).toBeLessThanOrEqual(price.original);
      }
    });

    it("all prices are positive", () => {
      for (const [, price] of Object.entries(PLAN_PRICES)) {
        expect(price.original).toBeGreaterThan(0);
        expect(price.discounted).toBeGreaterThan(0);
      }
    });
  });

  describe("PLAN_VALID_AMOUNTS", () => {
    it("pro allows both discounted and original amounts", () => {
      expect(PLAN_VALID_AMOUNTS.pro).toContain(39000);
      expect(PLAN_VALID_AMOUNTS.pro).toContain(49000);
    });

    it("team allows both discounted and original amounts", () => {
      expect(PLAN_VALID_AMOUNTS.team).toContain(99000);
      expect(PLAN_VALID_AMOUNTS.team).toContain(129000);
    });

    it("valid amounts match PLAN_PRICES", () => {
      for (const [plan, amounts] of Object.entries(PLAN_VALID_AMOUNTS)) {
        const price = PLAN_PRICES[plan];
        if (price) {
          expect(amounts).toContain(price.original);
          expect(amounts).toContain(price.discounted);
        }
      }
    });
  });

  describe("PLAN_NAMES", () => {
    it("has display names for pro, team, and starter", () => {
      expect(PLAN_NAMES.pro).toBe("Pro");
      expect(PLAN_NAMES.team).toBe("Team");
      expect(PLAN_NAMES.starter).toBe("Starter");
    });
  });

  describe("PLAN_LIMITS", () => {
    it("starter has lower limits than pro", () => {
      expect(PLAN_LIMITS.starter.dailyAiCalls).toBeLessThan(
        PLAN_LIMITS.pro.dailyAiCalls,
      );
      expect(PLAN_LIMITS.starter.monthlyAiCalls).toBeLessThan(
        PLAN_LIMITS.pro.monthlyAiCalls,
      );
    });

    it("team has higher or equal limits than pro", () => {
      expect(PLAN_LIMITS.team.dailyAiCalls).toBeGreaterThanOrEqual(
        PLAN_LIMITS.pro.dailyAiCalls,
      );
    });

    it("all limits are positive", () => {
      for (const [, limits] of Object.entries(PLAN_LIMITS)) {
        expect(limits.dailyAiCalls).toBeGreaterThan(0);
        expect(limits.monthlyAiCalls).toBeGreaterThan(0);
      }
    });
  });

  describe("PLAN_TOKENS", () => {
    it("pro has 500,000 tokens", () => {
      expect(PLAN_TOKENS.pro).toBe(500_000);
    });

    it("team has 2,000,000 tokens", () => {
      expect(PLAN_TOKENS.team).toBe(2_000_000);
    });

    it("team tokens exceed pro tokens", () => {
      expect(PLAN_TOKENS.team).toBeGreaterThan(PLAN_TOKENS.pro);
    });
  });
});
