// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";

// Mock @/lib/theme
vi.mock("@/lib/theme", () => ({
  T: {
    accent: "#f97316",
    text: "#e8eaf0",
    muted: "#6b7280",
  },
}));

import EmptyState from "@/components/EmptyState";

describe("EmptyState", () => {
  it("renders title", () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText("No items found")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<EmptyState title="Empty" description="Try adding something" />);
    expect(screen.getByText("Try adding something")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    render(<EmptyState title="Empty" />);
    // Description text should not appear
    expect(screen.queryByText("Try adding something")).not.toBeInTheDocument();
    // Ensure only title is present as text content (no extra description div)
    const titleEl = screen.getByText("Empty");
    expect(titleEl).toBeInTheDocument();
    // The description sibling should not exist
    const parent = titleEl.parentElement!;
    const children = Array.from(parent.children);
    const textDivs = children.filter(c => c.textContent && c.textContent.trim().length > 0 && c !== titleEl.closest("div"));
    // No description div should be rendered (only icon + title)
    const hasDescription = children.some(c => {
      const style = (c as HTMLElement).style;
      return style.maxWidth === "320px";
    });
    expect(hasDescription).toBe(false);
  });

  it("renders default icon when not specified", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.getByText(/📭/)).toBeInTheDocument();
  });

  it("renders custom icon when provided", () => {
    render(<EmptyState title="Empty" icon="🔍" />);
    expect(screen.getByText(/🔍/)).toBeInTheDocument();
  });

  it("renders action button with onAction callback", () => {
    const onAction = vi.fn();
    render(<EmptyState title="Empty" actionLabel="Add item" onAction={onAction} />);
    const btn = screen.getByText("Add item");
    expect(btn.tagName).toBe("BUTTON");
    fireEvent.click(btn);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("renders action link with actionHref", () => {
    render(<EmptyState title="Empty" actionLabel="Go home" actionHref="/home" />);
    const link = screen.getByText("Go home");
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/home");
  });

  it("does not render action when actionLabel is not provided", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("prefers onAction over actionHref when both are provided", () => {
    const onAction = vi.fn();
    render(<EmptyState title="Empty" actionLabel="Click" onAction={onAction} actionHref="/test" />);
    const btn = screen.getByText("Click");
    expect(btn.tagName).toBe("BUTTON");
  });
});
