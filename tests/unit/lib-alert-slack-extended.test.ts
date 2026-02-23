// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn().mockResolvedValue({ ok: true });

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  mockFetch.mockClear();
  globalThis.fetch = mockFetch as unknown as typeof fetch;
});

async function loadWithWebhook(url?: string) {
  if (url) {
    process.env.SLACK_ALERT_WEBHOOK_URL = url;
  } else {
    delete process.env.SLACK_ALERT_WEBHOOK_URL;
  }
  return import("@/lib/alert-slack");
}

describe("alertIfNeeded - extended", () => {
  it("accepts an Error object, not just strings", async () => {
    const { alertIfNeeded } = await loadWithWebhook("https://hooks.slack.com/x");
    const result = await alertIfNeeded(new Error("payment processing failed"));
    expect(result.severity).toBe("critical");
    expect(result.message).toBe("payment processing failed");
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it("warning-level error does not call Slack even if webhook is set", async () => {
    const { alertIfNeeded } = await loadWithWebhook("https://hooks.slack.com/x");
    const result = await alertIfNeeded("rate limit exceeded");
    expect(result.severity).toBe("warning");
    expect(result.shouldAlert).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns classified object with context when provided", async () => {
    const { alertIfNeeded } = await loadWithWebhook(undefined);
    const ctx = { userId: "u-1", endpoint: "/api/test" };
    const result = await alertIfNeeded("database connection error", ctx);
    expect(result).toMatchObject({
      severity: "critical",
      category: "db",
      shouldAlert: true,
      context: ctx,
    });
  });

  it("error severity (e.g. auth) triggers Slack", async () => {
    const { alertIfNeeded } = await loadWithWebhook("https://hooks.slack.com/x");
    const result = await alertIfNeeded("auth failed for user");
    expect(result.severity).toBe("error");
    expect(result.shouldAlert).toBe(true);
    expect(mockFetch).toHaveBeenCalledOnce();
  });
});
