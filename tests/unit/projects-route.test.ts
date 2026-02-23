// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetSession = vi.fn();
const mockFrom = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
    from: mockFrom,
  })),
}));

import { GET, POST } from "@/app/api/projects/route";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

function makeGetReq(params?: Record<string, string>) {
  const url = new URL("http://localhost/api/projects");
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  return new NextRequest(url, { method: "GET" });
}

function makePostReq(body: unknown, contentLength?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (contentLength) headers["content-length"] = contentLength;
  return new NextRequest("http://localhost/api/projects", {
    method: "POST",
    body: JSON.stringify(body),
    headers,
  });
}

describe("GET /api/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("returns empty list when no session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const res = await GET(makeGetReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.projects).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("returns projects for authenticated user", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } } });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: [{ id: "p1", name: "Project1", updated_at: "2024-01-01", created_at: "2024-01-01" }],
              error: null,
              count: 1,
            }),
          }),
        }),
      }),
    });
    const res = await GET(makeGetReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.projects).toHaveLength(1);
    expect(body.total).toBe(1);
  });

  it("respects limit and offset parameters", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } } });
    const rangeFn = vi.fn().mockResolvedValue({ data: [], error: null, count: 0 });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: rangeFn,
          }),
        }),
      }),
    });
    await GET(makeGetReq({ limit: "10", offset: "5" }));
    expect(rangeFn).toHaveBeenCalledWith(5, 14);
  });

  it("clamps limit to max 50", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } } });
    const rangeFn = vi.fn().mockResolvedValue({ data: [], error: null, count: 0 });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: rangeFn,
          }),
        }),
      }),
    });
    await GET(makeGetReq({ limit: "999" }));
    expect(rangeFn).toHaveBeenCalledWith(0, 49);
  });

  it("returns 500 when DB query fails", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } } });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" }, count: null }),
          }),
        }),
      }),
    });
    const res = await GET(makeGetReq());
    expect(res.status).toBe(500);
  });
});

describe("POST /api/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("returns 401 when no session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const res = await POST(makePostReq({ id: VALID_UUID, name: "Test" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid project id", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } } });
    const res = await POST(makePostReq({ id: "not-a-uuid", name: "Test" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when name is empty", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } } });
    const res = await POST(makePostReq({ id: VALID_UUID, name: "" }));
    expect(res.status).toBe(400);
  });

  it("returns 413 when content-length exceeds 1MB", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } } });
    const res = await POST(makePostReq({ id: VALID_UUID, name: "Test" }, "2000000"));
    expect(res.status).toBe(413);
  });

  it("upserts project successfully", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } } });
    mockFrom.mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    });
    const res = await POST(makePostReq({ id: VALID_UUID, name: "My Project", files: { "index.js": "hello" } }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("returns 500 when upsert fails", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } } });
    mockFrom.mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: { message: "Conflict" } }),
    });
    const res = await POST(makePostReq({ id: VALID_UUID, name: "Test" }));
    expect(res.status).toBe(500);
  });
});
