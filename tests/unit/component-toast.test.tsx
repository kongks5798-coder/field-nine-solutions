// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { Toast } from "@/components/Toast";

describe("Toast", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("renders the toast message", () => {
    const onClose = vi.fn();
    render(<Toast message="Hello toast" onClose={onClose} />);
    expect(screen.getByText("Hello toast")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("auto-dismisses after the default duration (4000ms)", () => {
    const onClose = vi.fn();
    render(<Toast message="Auto dismiss" onClose={onClose} />);
    expect(onClose).not.toHaveBeenCalled();
    vi.advanceTimersByTime(4000);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("auto-dismisses after custom duration", () => {
    const onClose = vi.fn();
    render(<Toast message="Custom" onClose={onClose} duration={2000} />);
    vi.advanceTimersByTime(1999);
    expect(onClose).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not auto-dismiss when duration is 0", () => {
    const onClose = vi.fn();
    render(<Toast message="Persistent" onClose={onClose} duration={0} />);
    vi.advanceTimersByTime(10000);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(<Toast message="Closeable" onClose={onClose} />);
    fireEvent.click(screen.getByLabelText(/닫기/));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders success type with correct icon", () => {
    render(<Toast message="Success!" type="success" onClose={vi.fn()} />);
    expect(screen.getByText(/✅/)).toBeInTheDocument();
  });

  it("renders error type with correct icon", () => {
    render(<Toast message="Error!" type="error" onClose={vi.fn()} />);
    expect(screen.getByText(/❌/)).toBeInTheDocument();
  });

  it("renders warning type with correct icon", () => {
    render(<Toast message="Warning!" type="warning" onClose={vi.fn()} />);
    expect(screen.getByText(/⚠/)).toBeInTheDocument();
  });

  it("renders info type with correct icon", () => {
    render(<Toast message="Info!" type="info" onClose={vi.fn()} />);
    expect(screen.getByText(/ℹ/)).toBeInTheDocument();
  });

  it("defaults to info type when type is not specified", () => {
    render(<Toast message="Default" onClose={vi.fn()} />);
    expect(screen.getByText(/ℹ/)).toBeInTheDocument();
  });
});
