// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

describe("useKeyboardShortcuts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls the handler for matching key combo", () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({ "ctrl+s": handler }),
    );

    const event = new KeyboardEvent("keydown", {
      key: "s",
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not call handler for non-matching combo", () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({ "ctrl+s": handler }),
    );

    const event = new KeyboardEvent("keydown", {
      key: "a",
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it("handles ctrl+shift combos", () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({ "ctrl+shift+p": handler }),
    );

    const event = new KeyboardEvent("keydown", {
      key: "p",
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("handles alt key combos", () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({ "alt+enter": handler }),
    );

    const event = new KeyboardEvent("keydown", {
      key: "Enter",
      altKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not fire when enabled is false", () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({ "ctrl+s": handler }, false),
    );

    const event = new KeyboardEvent("keydown", {
      key: "s",
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it("prevents default on matched shortcut", () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({ "ctrl+s": handler }),
    );

    const event = new KeyboardEvent("keydown", {
      key: "s",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it("cleans up listener on unmount", () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() =>
      useKeyboardShortcuts({ "ctrl+s": handler }),
    );

    unmount();

    const event = new KeyboardEvent("keydown", {
      key: "s",
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });
});
