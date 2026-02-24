// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { useToast } from "@/hooks/useToast";

describe("useToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with empty toasts", () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it("adds a toast when showToast is called", () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.showToast("Hello");
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe("Hello");
  });

  it("defaults toast type to info", () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.showToast("Info toast");
    });
    expect(result.current.toasts[0].type).toBe("info");
  });

  it("sets toast type correctly", () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.showToast("Success!", "success");
    });
    expect(result.current.toasts[0].type).toBe("success");
  });

  it("auto-removes toast after default duration (3000ms)", () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.showToast("Timed toast");
    });
    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it("auto-removes toast after custom duration", () => {
    const { result } = renderHook(() => useToast(5000));
    act(() => {
      result.current.showToast("Long toast");
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it("can add multiple toasts", () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.showToast("First");
      result.current.showToast("Second");
      result.current.showToast("Third");
    });
    expect(result.current.toasts).toHaveLength(3);
  });

  it("each toast has a unique ID", () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.showToast("A");
    });
    // Advance time to ensure different Date.now() value
    act(() => {
      vi.advanceTimersByTime(1);
    });
    act(() => {
      result.current.showToast("B");
    });
    const ids = result.current.toasts.map((t) => t.id);
    expect(new Set(ids).size).toBe(2);
  });
});
