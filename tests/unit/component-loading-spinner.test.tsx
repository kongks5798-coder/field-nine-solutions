// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";

// Mock @/lib/theme
vi.mock("@/lib/theme", () => ({
  T: {
    accent: "#f97316",
  },
}));

import LoadingSpinner from "@/components/LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders a spinner element", () => {
    render(<LoadingSpinner />);
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  it("has role=status for accessibility", () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders with default size of 32", () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByTestId("spinner");
    expect(spinner.style.width).toBe("32px");
    expect(spinner.style.height).toBe("32px");
  });

  it("accepts custom size prop", () => {
    render(<LoadingSpinner size={64} />);
    const spinner = screen.getByTestId("spinner");
    expect(spinner.style.width).toBe("64px");
    expect(spinner.style.height).toBe("64px");
  });

  it("accepts small size prop", () => {
    render(<LoadingSpinner size={16} />);
    const spinner = screen.getByTestId("spinner");
    expect(spinner.style.width).toBe("16px");
    expect(spinner.style.height).toBe("16px");
  });

  it("renders default aria-label", () => {
    render(<LoadingSpinner />);
    expect(screen.getByLabelText(/로딩 중/)).toBeInTheDocument();
  });

  it("renders custom label", () => {
    render(<LoadingSpinner label="Loading data..." />);
    expect(screen.getByLabelText("Loading data...")).toBeInTheDocument();
  });

  it("renders visually hidden label text for screen readers", () => {
    render(<LoadingSpinner label="Processing" />);
    expect(screen.getByText("Processing")).toBeInTheDocument();
  });
});
