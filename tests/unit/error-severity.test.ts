// @vitest-environment node
import { describe, it, expect } from "vitest";
import { classifyError, severityEmoji } from "@/lib/error-severity";

describe("classifyError", () => {
  it('"payment failed" → critical, payment', () => {
    const result = classifyError("payment failed");
    expect(result.severity).toBe("critical");
    expect(result.category).toBe("payment");
    expect(result.shouldAlert).toBe(true);
  });

  it('"database connection error" → critical, db', () => {
    const result = classifyError("database connection error");
    expect(result.severity).toBe("critical");
    expect(result.category).toBe("db");
    expect(result.shouldAlert).toBe(true);
  });

  it('"auth fail" → error, auth', () => {
    const result = classifyError("auth fail");
    expect(result.severity).toBe("error");
    expect(result.category).toBe("auth");
    expect(result.shouldAlert).toBe(true);
  });

  it('"api timeout" → error, api', () => {
    const result = classifyError("api timeout");
    expect(result.severity).toBe("error");
    expect(result.category).toBe("api");
    expect(result.shouldAlert).toBe(true);
  });

  it('"rate limit exceeded" → warning, infra', () => {
    const result = classifyError("rate limit exceeded");
    expect(result.severity).toBe("warning");
    expect(result.category).toBe("infra");
    expect(result.shouldAlert).toBe(false);
  });

  it('"validation error" → warning, client', () => {
    const result = classifyError("validation error");
    expect(result.severity).toBe("warning");
    expect(result.category).toBe("client");
    expect(result.shouldAlert).toBe(false);
  });

  it('"unknown issue" → info, client (catch-all)', () => {
    const result = classifyError("unknown issue");
    expect(result.severity).toBe("info");
    expect(result.category).toBe("client");
    expect(result.shouldAlert).toBe(false);
  });
});

describe("severityEmoji", () => {
  it("critical → red circle, error → orange circle", () => {
    expect(severityEmoji("critical")).toBe("\uD83D\uDD34");
    expect(severityEmoji("error")).toBe("\uD83D\uDFE0");
  });
});
