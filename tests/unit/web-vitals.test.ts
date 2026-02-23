// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { reportWebVitals } from "@/lib/web-vitals";

describe("web-vitals - reportWebVitals", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    delete (window as any).posthog;
  });

  it("is a function", () => {
    expect(typeof reportWebVitals).toBe("function");
  });

  it("sends metric to PostHog when posthog.capture is available", () => {
    const captureSpy = vi.fn();
    (window as any).posthog = { capture: captureSpy };

    reportWebVitals({
      name: "LCP",
      value: 1200,
      rating: "good",
      id: "test-id-1",
    });

    expect(captureSpy).toHaveBeenCalledTimes(1);
    expect(captureSpy).toHaveBeenCalledWith("web_vitals", expect.objectContaining({
      metric_name: "LCP",
      metric_value: 1200,
      metric_rating: "good",
      metric_id: "test-id-1",
    }));
  });

  it("does not throw when posthog is not available", () => {
    delete (window as any).posthog;

    expect(() => {
      reportWebVitals({
        name: "FID",
        value: 50,
        rating: "good",
        id: "test-id-2",
      });
    }).not.toThrow();
  });

  it("does not throw when posthog exists but capture is missing", () => {
    (window as any).posthog = {};

    expect(() => {
      reportWebVitals({
        name: "CLS",
        value: 0.05,
        rating: "good",
        id: "test-id-3",
      });
    }).not.toThrow();
  });

  it("logs to console in development mode", () => {
    // In test env NODE_ENV is "test", but the function checks for "development".
    // We use vi.stubEnv to temporarily override it.
    vi.stubEnv("NODE_ENV", "development");
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    reportWebVitals({
      name: "TTFB",
      value: 300.567,
      rating: "needs-improvement",
      id: "test-id-4",
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[Web Vitals] TTFB")
    );
    consoleSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it("includes page_url from window.location in PostHog event", () => {
    const captureSpy = vi.fn();
    (window as any).posthog = { capture: captureSpy };

    reportWebVitals({
      name: "INP",
      value: 200,
      rating: "poor",
      id: "test-id-5",
    });

    expect(captureSpy).toHaveBeenCalledWith("web_vitals", expect.objectContaining({
      page_url: expect.any(String),
    }));
  });
});
