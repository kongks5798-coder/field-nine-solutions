// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
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

import Footer from "@/components/Footer";

describe("Footer", () => {
  it("renders the copyright text", () => {
    render(<Footer />);
    expect(screen.getByText(/2026 Dalkak by FieldNine/)).toBeInTheDocument();
  });

  it("renders privacy link", () => {
    render(<Footer />);
    const link = screen.getByText("개인정보처리방침");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/privacy");
  });

  it("renders terms link", () => {
    render(<Footer />);
    const link = screen.getByText("이용약관");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/terms");
  });

  it("renders email link", () => {
    render(<Footer />);
    const link = screen.getByText("sales@fieldnine.io");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "mailto:sales@fieldnine.io");
  });

  it("renders the 'Powered by AI' badge", () => {
    render(<Footer />);
    expect(screen.getByText(/Powered by AI/)).toBeInTheDocument();
  });

  it("renders a footer element", () => {
    render(<Footer />);
    const footer = document.querySelector("footer");
    expect(footer).toBeTruthy();
  });
});
