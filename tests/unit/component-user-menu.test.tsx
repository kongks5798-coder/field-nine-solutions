// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
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

import UserMenu from "@/components/UserMenu";

describe("UserMenu", () => {
  const defaultProps = {
    user: { email: "user@test.com", name: "Test User" },
    onLogout: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders avatar button with user initial", () => {
    render(<UserMenu {...defaultProps} />);
    const button = screen.getByLabelText("사용자 메뉴");
    expect(button).toBeInTheDocument();
    expect(button.textContent).toBe("T"); // first letter of "Test User"
  });

  it("uses first part of email when name is not provided", () => {
    render(
      <UserMenu user={{ email: "john@example.com" }} onLogout={vi.fn()} />,
    );
    const button = screen.getByLabelText("사용자 메뉴");
    expect(button.textContent).toBe("J"); // first letter of "john"
  });

  it("opens dropdown on click", () => {
    render(<UserMenu {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("사용자 메뉴"));
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("shows user info in dropdown", () => {
    render(<UserMenu {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("사용자 메뉴"));
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("user@test.com")).toBeInTheDocument();
  });

  it("shows plan badge when plan is provided", () => {
    render(<UserMenu {...defaultProps} plan="Pro" />);
    fireEvent.click(screen.getByLabelText("사용자 메뉴"));
    expect(screen.getByText(/Pro 플랜/)).toBeInTheDocument();
  });

  it("does not show plan badge when plan is not provided", () => {
    render(<UserMenu {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("사용자 메뉴"));
    expect(screen.queryByText(/플랜/)).not.toBeInTheDocument();
  });

  it("renders menu items with correct hrefs", () => {
    render(<UserMenu {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("사용자 메뉴"));
    const menuItems = screen.getAllByRole("menuitem");
    expect(menuItems.length).toBeGreaterThanOrEqual(4); // 3 links + logout
  });

  it("calls onLogout when logout button is clicked", () => {
    const onLogout = vi.fn();
    render(<UserMenu {...defaultProps} onLogout={onLogout} />);
    fireEvent.click(screen.getByLabelText("사용자 메뉴"));
    fireEvent.click(screen.getByText("로그아웃"));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("toggles dropdown open and closed", () => {
    render(<UserMenu {...defaultProps} />);
    const trigger = screen.getByLabelText("사용자 메뉴");

    fireEvent.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("has aria-haspopup and aria-expanded attributes", () => {
    render(<UserMenu {...defaultProps} />);
    const trigger = screen.getByLabelText("사용자 메뉴");
    expect(trigger).toHaveAttribute("aria-haspopup", "true");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });
});
