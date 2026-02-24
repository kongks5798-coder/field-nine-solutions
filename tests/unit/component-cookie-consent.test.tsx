// @vitest-environment jsdom
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";

vi.mock("@/lib/theme", () => ({
  T: {
    accent: "#f97316",
    red: "#dc2626",
    text: "#e8eaf0",
    muted: "#6b7280",
    card: "#111827",
    surface: "#1e293b",
    border: "rgba(255,255,255,0.08)",
    bg: "#07080f",
  },
}));

import CookieConsent from "@/components/CookieConsent";

describe("CookieConsent", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("becomes visible after delay when no consent stored", () => {
    render(<CookieConsent />);
    // Not visible yet
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Advance past the 800ms delay
    act(() => {
      vi.advanceTimersByTime(900);
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not show if consent already stored", () => {
    localStorage.setItem("f9_cookie_consent", "true");
    render(<CookieConsent />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the consent message text", () => {
    render(<CookieConsent />);
    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(
      screen.getByText(/Dalkak은 서비스 개선을 위해 쿠키를 사용합니다/),
    ).toBeInTheDocument();
  });

  it("shows privacy link", () => {
    render(<CookieConsent />);
    act(() => {
      vi.advanceTimersByTime(900);
    });
    const link = screen.getByText("자세히");
    expect(link.closest("a")).toHaveAttribute("href", "/privacy");
  });

  it("hides and stores consent when accept button clicked", () => {
    render(<CookieConsent />);
    act(() => {
      vi.advanceTimersByTime(900);
    });

    fireEvent.click(screen.getByText("동의"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(localStorage.getItem("f9_cookie_consent")).toBe("true");
  });
});
