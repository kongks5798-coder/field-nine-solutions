// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// We need dynamic imports because alert-slack reads SLACK_ALERT_WEBHOOK_URL at module level.
// Using vi.resetModules() + dynamic import lets us control the env for each test.

const mockFetch = vi.fn().mockResolvedValue({ ok: true });

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  mockFetch.mockClear();
  globalThis.fetch = mockFetch as typeof fetch;
});

async function loadWithWebhook(url?: string) {
  if (url) {
    process.env.SLACK_ALERT_WEBHOOK_URL = url;
  } else {
    delete process.env.SLACK_ALERT_WEBHOOK_URL;
  }
  const mod = await import("@/lib/alert-slack");
  return mod;
}

describe("alertIfNeeded", () => {
  it("critical 에러 → Slack fetch 호출", async () => {
    const { alertIfNeeded } = await loadWithWebhook("https://hooks.slack.com/test");
    await alertIfNeeded("payment failed");
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith(
      "https://hooks.slack.com/test",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("info 에러 → Slack 호출 안 함", async () => {
    const { alertIfNeeded } = await loadWithWebhook("https://hooks.slack.com/test");
    await alertIfNeeded("unknown issue");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("SLACK_ALERT_WEBHOOK_URL 없으면 호출 안 함", async () => {
    const { alertIfNeeded } = await loadWithWebhook(undefined);
    await alertIfNeeded("payment failed");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("Slack fetch 실패해도 에러 안 던짐", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network error"));
    const { alertIfNeeded } = await loadWithWebhook("https://hooks.slack.com/test");
    await expect(alertIfNeeded("payment failed")).resolves.not.toThrow();
  });

  it("context 포함 시 blocks에 포함", async () => {
    const { alertIfNeeded } = await loadWithWebhook("https://hooks.slack.com/test");
    await alertIfNeeded("payment failed", { orderId: "ord-123" });
    expect(mockFetch).toHaveBeenCalledOnce();

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    // context block이 추가되어 blocks 길이가 2 (section + context)
    expect(body.blocks).toHaveLength(2);
    expect(body.blocks[1].type).toBe("context");
    expect(body.blocks[1].elements[0].text).toContain("ord-123");
  });

  it("반환값에 classified 객체 포함", async () => {
    const { alertIfNeeded } = await loadWithWebhook("https://hooks.slack.com/test");
    const result = await alertIfNeeded("payment failed", { orderId: "ord-1" });
    expect(result).toMatchObject({
      severity: "critical",
      category: "payment",
      message: "payment failed",
      shouldAlert: true,
    });
    expect(result.context).toEqual({ orderId: "ord-1" });
  });
});
