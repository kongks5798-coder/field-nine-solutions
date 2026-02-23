// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGenerateCsrfToken = vi.hoisted(() => vi.fn());

vi.mock("@/lib/csrf", () => ({
  generateCsrfToken: mockGenerateCsrfToken,
}));

import { GET } from "@/app/api/csrf/route";

describe("GET /api/csrf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateCsrfToken.mockReturnValue("test-csrf-token-abc123");
  });

  it("returns 200 status", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
  });

  it("returns csrfToken in response body", async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.csrfToken).toBe("test-csrf-token-abc123");
  });

  it("sets csrf-token cookie", async () => {
    const res = await GET();
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain("csrf-token=test-csrf-token-abc123");
  });

  it("cookie is httpOnly", async () => {
    const res = await GET();
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("HttpOnly");
  });

  it("cookie has SameSite=strict", async () => {
    const res = await GET();
    const setCookie = res.headers.get("set-cookie") || "";
    expect(setCookie.toLowerCase()).toContain("samesite=strict");
  });

  it("cookie has path=/", async () => {
    const res = await GET();
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("Path=/");
  });
});
