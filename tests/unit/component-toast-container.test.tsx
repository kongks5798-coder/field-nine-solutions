// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

import ToastContainer from "@/components/ToastContainer";
import type { ToastState } from "@/hooks/useToast";

describe("ToastContainer", () => {
  it("renders nothing when toasts array is empty", () => {
    const { container } = render(<ToastContainer toasts={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders a single toast with message", () => {
    const toasts: ToastState[] = [
      { message: "Saved!", type: "success", id: 1 },
    ];
    render(<ToastContainer toasts={toasts} />);
    expect(screen.getByText("Saved!")).toBeInTheDocument();
  });

  it("renders multiple toasts", () => {
    const toasts: ToastState[] = [
      { message: "First toast", type: "info", id: 1 },
      { message: "Second toast", type: "error", id: 2 },
      { message: "Third toast", type: "success", id: 3 },
    ];
    render(<ToastContainer toasts={toasts} />);
    expect(screen.getByText("First toast")).toBeInTheDocument();
    expect(screen.getByText("Second toast")).toBeInTheDocument();
    expect(screen.getByText("Third toast")).toBeInTheDocument();
  });

  it("renders toasts with role=alert and aria-live", () => {
    const toasts: ToastState[] = [
      { message: "Alert!", type: "error", id: 1 },
    ];
    render(<ToastContainer toasts={toasts} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "polite");
  });

  it("applies border-left style for success type", () => {
    const toasts: ToastState[] = [
      { message: "Success", type: "success", id: 1 },
    ];
    render(<ToastContainer toasts={toasts} />);
    const alert = screen.getByRole("alert");
    expect(alert.style.borderLeft).toBeTruthy();
    // JSDOM converts hex to rgb, check for either format
    const bl = alert.style.borderLeft;
    expect(bl).toContain("4px solid");
  });

  it("applies border-left style for error type", () => {
    const toasts: ToastState[] = [
      { message: "Error", type: "error", id: 1 },
    ];
    render(<ToastContainer toasts={toasts} />);
    const alert = screen.getByRole("alert");
    expect(alert.style.borderLeft).toBeTruthy();
    expect(alert.style.borderLeft).toContain("4px solid");
  });

  it("applies border-left style for info type", () => {
    const toasts: ToastState[] = [
      { message: "Info", type: "info", id: 1 },
    ];
    render(<ToastContainer toasts={toasts} />);
    const alert = screen.getByRole("alert");
    expect(alert.style.borderLeft).toBeTruthy();
    expect(alert.style.borderLeft).toContain("4px solid");
  });
});
