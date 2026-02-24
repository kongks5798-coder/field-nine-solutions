// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { useMediaQuery } from "@/hooks/useMediaQuery";

describe("useMediaQuery", () => {
  let listeners: Map<string, (e: { matches: boolean }) => void>;
  let matchesMap: Map<string, boolean>;

  beforeEach(() => {
    listeners = new Map();
    matchesMap = new Map();

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn((query: string) => ({
        matches: matchesMap.get(query) ?? false,
        media: query,
        addEventListener: (_event: string, handler: (e: { matches: boolean }) => void) => {
          listeners.set(query, handler);
        },
        removeEventListener: vi.fn(),
      })),
    });
  });

  it("returns false initially for non-matching query", () => {
    const { result } = renderHook(() =>
      useMediaQuery("(min-width: 768px)"),
    );
    expect(result.current).toBe(false);
  });

  it("returns true when query matches", () => {
    matchesMap.set("(min-width: 768px)", true);
    const { result } = renderHook(() =>
      useMediaQuery("(min-width: 768px)"),
    );
    expect(result.current).toBe(true);
  });

  it("updates when media query changes", () => {
    const { result } = renderHook(() =>
      useMediaQuery("(min-width: 768px)"),
    );
    expect(result.current).toBe(false);

    // Simulate media query change
    const handler = listeners.get("(min-width: 768px)");
    if (handler) {
      act(() => {
        handler({ matches: true });
      });
    }
    expect(result.current).toBe(true);
  });

  it("handles different query strings", () => {
    matchesMap.set("(prefers-color-scheme: dark)", true);
    const { result } = renderHook(() =>
      useMediaQuery("(prefers-color-scheme: dark)"),
    );
    expect(result.current).toBe(true);
  });
});
