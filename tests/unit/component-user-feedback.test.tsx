// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

import UserFeedbackWidget from "@/components/UserFeedbackWidget";

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = mocks.fetch as unknown as typeof fetch;
  mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({}) });
});

describe("UserFeedbackWidget", () => {
  it("renders the feedback form", () => {
    render(<UserFeedbackWidget />);
    expect(screen.getByText(/서비스 만족도/)).toBeInTheDocument();
    expect(screen.getByText(/의견\/피드백/)).toBeInTheDocument();
    expect(screen.getByText("피드백 제출")).toBeInTheDocument();
  });

  it("has a score selector with options 1-5", () => {
    render(<UserFeedbackWidget />);
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(5);
    expect(options[0]).toHaveValue("1");
    expect(options[4]).toHaveValue("5");
  });

  it("defaults score to 5", () => {
    render(<UserFeedbackWidget />);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("5");
  });

  it("has a textarea for feedback", () => {
    render(<UserFeedbackWidget />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeInTheDocument();
  });

  it("submits feedback and shows confirmation", async () => {
    render(<UserFeedbackWidget />);

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Great service!" } });

    const button = screen.getByText("피드백 제출");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/피드백이 제출되었습니다/)).toBeInTheDocument();
    });

    expect(mocks.fetch).toHaveBeenCalledWith("/api/user-feedback", expect.objectContaining({
      method: "POST",
    }));
  });

  it("calls onSubmit callback when provided", async () => {
    const onSubmit = vi.fn();
    render(<UserFeedbackWidget onSubmit={onSubmit} />);

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Feedback text" } });

    fireEvent.click(screen.getByText("피드백 제출"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          feedback: "Feedback text",
          score: 5,
        }),
      );
    });
  });

  it("changes score when select is changed", () => {
    render(<UserFeedbackWidget />);
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "3" } });
    expect((select as HTMLSelectElement).value).toBe("3");
  });
});
