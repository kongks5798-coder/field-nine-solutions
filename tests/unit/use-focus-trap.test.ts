// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

// jsdom 환경 필요
describe("useFocusTrap", () => {
  it("returns a ref object", () => {
    const { result } = renderHook(() => useFocusTrap(false));
    expect(result.current).toHaveProperty("current");
  });

  it("ref is initially null", () => {
    const { result } = renderHook(() => useFocusTrap(false));
    expect(result.current.current).toBeNull();
  });

  it("does not throw when active is false", () => {
    expect(() => {
      renderHook(() => useFocusTrap(false));
    }).not.toThrow();
  });

  it("does not throw when active is true with null ref", () => {
    expect(() => {
      renderHook(() => useFocusTrap(true));
    }).not.toThrow();
  });
});
