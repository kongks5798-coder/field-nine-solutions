// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const mockFetch = vi.hoisted(() =>
  vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ csrfToken: "tok-abc" }), { status: 200 }),
  ),
);

vi.stubGlobal("fetch", mockFetch);

import { useCsrf } from "@/hooks/useCsrf";

describe("useCsrf", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ csrfToken: "tok-abc" }), { status: 200 }),
    );
  });

  it("returns empty string initially before fetch resolves", () => {
    const { result } = renderHook(() => useCsrf());
    expect(result.current).toBe("");
  });

  it("fetches /api/csrf on mount", async () => {
    renderHook(() => useCsrf());
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/csrf");
    });
  });

  it("sets token after successful fetch", async () => {
    const { result } = renderHook(() => useCsrf());
    await waitFor(() => {
      expect(result.current).toBe("tok-abc");
    });
  });

  it("handles fetch error gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network error"));
    const { result } = renderHook(() => useCsrf());
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
    expect(result.current).toBe("");
  });
});
