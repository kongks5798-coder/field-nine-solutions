// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/logger", () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), api: vi.fn(), security: vi.fn() },
}));

const mockGetSession = vi.fn();
const mockFrom = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
    from: mockFrom,
  })),
}));

import { GET } from "@/app/api/analytics/route";

function makeReq() {
  return new NextRequest("http://localhost/api/analytics", { method: "GET" });
}

describe("GET /api/analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("returns 401 when no session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns analytics data for authenticated user", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } } });
    mockFrom.mockImplementation((table: string) => {
      if (table === "published_apps") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [{ slug: "app1", name: "App1", views: 100, created_at: "2024-01-01", updated_at: "2024-01-02" }],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "projects") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [{ id: "p1", name: "Proj1", updated_at: "2024-01-01" }],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "user_tokens") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { balance: 42000 },
                error: null,
              }),
            }),
          }),
        };
      }
      return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }) };
    });

    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalViews).toBe(100);
    expect(body.appCount).toBe(1);
    expect(body.projectCount).toBe(1);
    expect(body.tokenBalance).toBe(42000);
  });

  it("returns default token balance when user_tokens is empty", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "u2" } } } });
    mockFrom.mockImplementation((table: string) => {
      if (table === "published_apps") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      }
      if (table === "projects") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      }
      if (table === "user_tokens") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      }
      return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }) };
    });

    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tokenBalance).toBe(50000);
    expect(body.totalViews).toBe(0);
  });

  it("returns 500 when query throws", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "u3" } } } });
    mockFrom.mockImplementation(() => {
      throw new Error("DB connection lost");
    });

    const res = await GET(makeReq());
    expect(res.status).toBe(500);
  });
});
