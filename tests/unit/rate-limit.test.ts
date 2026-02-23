import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimit, clearAllRateLimits } from "@/lib/rate-limit";

describe("rate-limit", () => {
  beforeEach(() => {
    clearAllRateLimits();
  });

  it("allows requests within limit", () => {
    const result = checkRateLimit("test-ip", { limit: 5, windowMs: 60000 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("tracks request count", () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit("test-ip-2", { limit: 5, windowMs: 60000 });
    }
    const result = checkRateLimit("test-ip-2", { limit: 5, windowMs: 60000 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it("blocks requests exceeding limit", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("test-ip-3", { limit: 5, windowMs: 60000 });
    }
    const result = checkRateLimit("test-ip-3", { limit: 5, windowMs: 60000 });
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after window expires", () => {
    const result1 = checkRateLimit("test-ip-4", { limit: 1, windowMs: 1 });
    expect(result1.success).toBe(true);
    const start = Date.now();
    while (Date.now() - start < 5) { /* busy wait 5ms */ }
    const result2 = checkRateLimit("test-ip-4", { limit: 1, windowMs: 1 });
    expect(result2.success).toBe(true);
  });

  it("uses separate limits per key", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("key-a", { limit: 5, windowMs: 60000 });
    }
    const resultA = checkRateLimit("key-a", { limit: 5, windowMs: 60000 });
    const resultB = checkRateLimit("key-b", { limit: 5, windowMs: 60000 });
    expect(resultA.success).toBe(false);
    expect(resultB.success).toBe(true);
  });

  it("resetRateLimit clears specific key", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("reset-test", { limit: 5, windowMs: 60000 });
    }
    resetRateLimit("reset-test");
    const result = checkRateLimit("reset-test", { limit: 5, windowMs: 60000 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("uses default config when none provided", () => {
    const result = checkRateLimit("default-test");
    expect(result.success).toBe(true);
    expect(result.limit).toBe(60);
    expect(result.remaining).toBe(59);
  });
});
