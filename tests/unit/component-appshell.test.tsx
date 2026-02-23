// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

// next/navigation mock
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/dashboard"),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

// next/link mock
vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// Supabase auth mock
vi.mock("@/utils/supabase/auth", () => ({
  getAuthUser: vi.fn().mockResolvedValue(null),
  authSignOut: vi.fn().mockResolvedValue(undefined),
}));

// useMediaQuery mock - default to desktop (false = not mobile)
const mockUseMediaQuery = vi.fn(() => false);
vi.mock("@/hooks/useMediaQuery", () => ({
  useMediaQuery: () => mockUseMediaQuery(),
}));

// useFocusTrap mock
vi.mock("@/hooks/useFocusTrap", () => ({
  useFocusTrap: vi.fn(() => ({ current: null })),
}));

// fetch mock
global.fetch = vi.fn().mockResolvedValue({
  ok: false,
  json: vi.fn().mockResolvedValue(null),
});

import AppShell from "@/components/AppShell";

describe("AppShell - component-appshell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMediaQuery.mockReturnValue(false);
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue(null),
    });
  });

  it("renders navigation links on desktop", () => {
    render(
      <AppShell>
        <div>content</div>
      </AppShell>
    );
    expect(screen.getByText("Studio")).toBeInTheDocument();
    expect(screen.getByText("Flow")).toBeInTheDocument();
    expect(screen.getByText("Canvas")).toBeInTheDocument();
    expect(screen.getByText("Collab")).toBeInTheDocument();
    expect(screen.getByText("CoWork")).toBeInTheDocument();
    expect(screen.getByText("LM 허브")).toBeInTheDocument();
  });

  it("has aria-label on the main nav element", () => {
    render(
      <AppShell>
        <div>content</div>
      </AppShell>
    );
    const nav = screen.getByRole("navigation", { name: "주 내비게이션" });
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveAttribute("aria-label", "주 내비게이션");
  });

  it("marks active navigation link with aria-current page", () => {
    render(
      <AppShell>
        <div>content</div>
      </AppShell>
    );
    const dashboardLink = screen.getByText("대시보드").closest("a");
    expect(dashboardLink).toHaveAttribute("aria-current", "page");

    const studioLink = screen.getByText("Studio").closest("a");
    expect(studioLink).not.toHaveAttribute("aria-current");
  });

  it("shows mobile hamburger button when in mobile mode", () => {
    mockUseMediaQuery.mockReturnValue(true);
    render(
      <AppShell>
        <div>content</div>
      </AppShell>
    );
    const hamburger = screen.getByLabelText("메뉴 열기");
    expect(hamburger).toBeInTheDocument();
    expect(hamburger).toHaveAttribute("aria-expanded", "false");
  });

  it("toggles aria-expanded when hamburger is clicked", () => {
    mockUseMediaQuery.mockReturnValue(true);
    render(
      <AppShell>
        <div>content</div>
      </AppShell>
    );
    const hamburger = screen.getByLabelText("메뉴 열기");
    fireEvent.click(hamburger);
    const closeBtn = screen.getByLabelText("메뉴 닫기");
    expect(closeBtn).toHaveAttribute("aria-expanded", "true");
  });

  it("renders login and signup links when user is not logged in on desktop", () => {
    render(
      <AppShell>
        <div>content</div>
      </AppShell>
    );
    const loginLink = screen.getByLabelText("로그인");
    expect(loginLink).toHaveAttribute("href", "/login");
    const signupLink = screen.getByLabelText("회원가입 - 무료로 시작하기");
    expect(signupLink).toHaveAttribute("href", "/signup");
  });
});
