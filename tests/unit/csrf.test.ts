import { describe, it, expect, vi } from "vitest";

vi.stubEnv("CSRF_SECRET", "test-csrf-secret");

const { generateCsrfToken, validateCsrfToken } = await import("@/lib/csrf");

describe("CSRF", () => {
  it("generates a valid token", () => {
    const token = generateCsrfToken();
    expect(token).toBeTruthy();
    expect(token.split(".").length).toBe(3);
  });

  it("validates a correct token", () => {
    const token = generateCsrfToken();
    expect(validateCsrfToken(token)).toBe(true);
  });

  it("rejects empty token", () => {
    expect(validateCsrfToken("")).toBe(false);
  });

  it("rejects malformed token", () => {
    expect(validateCsrfToken("invalid")).toBe(false);
  });

  it("rejects tampered token", () => {
    const token = generateCsrfToken();
    const parts = token.split(".");
    parts[2] = "0".repeat(parts[2].length);
    expect(validateCsrfToken(parts.join("."))).toBe(false);
  });

  it("rejects expired token", () => {
    const originalDateNow = Date.now;
    Date.now = () => originalDateNow() - 2 * 60 * 60 * 1000;
    const token = generateCsrfToken();
    Date.now = originalDateNow;
    expect(validateCsrfToken(token)).toBe(false);
  });
});
