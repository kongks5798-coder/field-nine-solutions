// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import ErrorBoundary from "@/components/ErrorBoundary";

// A component that throws on demand
function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("Test explosion");
  return <div>Children rendered safely</div>;
}

describe("ErrorBoundary", () => {
  // Suppress console.error noise from React error boundary
  const originalError = console.error;
  beforeEach(() => { console.error = vi.fn(); });
  afterEach(() => { console.error = originalError; });

  it("renders children when no error occurs", () => {
    render(<ErrorBoundary><Bomb shouldThrow={false} /></ErrorBoundary>);
    expect(screen.getByText("Children rendered safely")).toBeInTheDocument();
  });

  it("shows default fallback UI when a child throws", () => {
    render(<ErrorBoundary><Bomb shouldThrow={true} /></ErrorBoundary>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/문제가 발생했습니다/)).toBeInTheDocument();
    expect(screen.getByText("Test explosion")).toBeInTheDocument();
  });

  it("shows custom fallback when provided", () => {
    const fallback = <div>Custom fallback</div>;
    render(<ErrorBoundary fallback={fallback}><Bomb shouldThrow={true} /></ErrorBoundary>);
    expect(screen.getByText("Custom fallback")).toBeInTheDocument();
    expect(screen.queryByText(/문제가 발생/)).not.toBeInTheDocument();
  });

  it("resets and re-renders children when reset button is clicked", () => {
    let shouldThrow = true;
    function Controlled() {
      if (shouldThrow) throw new Error("Boom");
      return <div>Recovered</div>;
    }
    const { rerender } = render(<ErrorBoundary><Controlled /></ErrorBoundary>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    // Fix the error before resetting
    shouldThrow = false;
    fireEvent.click(screen.getByText(/다시 시도/));
    expect(screen.getByText("Recovered")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
