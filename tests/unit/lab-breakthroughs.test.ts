// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetSession: vi.fn(),
  mockGetAgent: vi.fn(),
  mockCookiesGetAll: vi.fn(),
}));

vi.mock("@/lib/supabase-admin", () => ({
  getAdminClient: vi.fn(() => ({ from: mocks.mockFrom })),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mocks.mockGetSession },
  })),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    getAll: mocks.mockCookiesGetAll.mockReturnValue([]),
  })),
}));

vi.mock("@/lib/lab-agents", () => ({
  getAgent: mocks.mockGetAgent,
}));

import { GET } from "@/app/api/lab/breakthroughs/route";

const SESSION = {
  data: { session: { user: { id: "u1" }, access_token: "tok" } },
};
const NO_SESSION = { data: { session: null } };

function makeReq() {
  return new NextRequest("http://localhost/api/lab/breakthroughs");
}

function mockCountQuery(count: number, filterMethod?: string) {
  const terminal = { count, error: null };
  if (filterMethod === "in") {
    return { select: vi.fn().mockReturnValue({ in: vi.fn().mockResolvedValue(terminal) }) };
  }
  if (filterMethod === "eq") {
    return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue(terminal) }) };
  }
  return { select: vi.fn().mockResolvedValue(terminal) };
}

function mockInnovationsQuery(data: unknown[] | null, error: { message: string } | null = null) {
  return {
    select: vi.fn().mockReturnValue({
      in: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data, error }),
      }),
    }),
  };
}

describe("GET /api/lab/breakthroughs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockGetSession.mockResolvedValue(SESSION);
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it("미인증 사용자 -> 401 반환", async () => {
    mocks.mockGetSession.mockResolvedValueOnce(NO_SESSION);
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("정상 조회 -> kpi + breakthroughs 반환", async () => {
    let callIndex = 0;
    mocks.mockFrom.mockImplementation(() => {
      callIndex++;
      switch (callIndex) {
        case 1: return mockCountQuery(5);
        case 2: return mockCountQuery(20);
        case 3: return mockCountQuery(3, "in");
        case 4: return mockCountQuery(2, "eq");
        case 5: return mockInnovationsQuery([{
          id: "i1", title: "Innovation A", round_reached: "final",
          created_at: "2024-01-01",
          team: { id: "t1", seed: 1, agent_ids: [1, 10], team_name: "Alpha" },
          tournament: { id: "tour1", season: 1, status: "completed" },
          parent: null,
        }]);
        default: return mockCountQuery(0);
      }
    });
    mocks.mockGetAgent.mockImplementation((id: number) => {
      if (id === 1) return { id: 1, name: "Dr. Neural", field: "AI/ML" };
      if (id === 10) return { id: 10, name: "Pixel", field: "Frontend" };
      return undefined;
    });
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.kpi.totalTournaments).toBe(5);
    expect(body.kpi.totalInnovations).toBe(20);
    expect(body.kpi.breakthroughCount).toBe(3);
    expect(body.kpi.finalizedCount).toBe(2);
    expect(body.breakthroughs).toHaveLength(1);
    expect(body.breakthroughs[0].agents).toHaveLength(2);
    expect(body.breakthroughs[0].agents[0].name).toBe("Dr. Neural");
  });

  it("빈 결과 -> kpi 0 + 빈 배열", async () => {
    let callIndex = 0;
    mocks.mockFrom.mockImplementation(() => {
      callIndex++;
      if (callIndex <= 4) {
        if (callIndex === 3) return mockCountQuery(0, "in");
        if (callIndex === 4) return mockCountQuery(0, "eq");
        return mockCountQuery(0);
      }
      return mockInnovationsQuery([]);
    });
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.kpi.totalTournaments).toBe(0);
    expect(body.breakthroughs).toEqual([]);
  });

  it("DB 에러 -> 500 반환", async () => {
    let callIndex = 0;
    mocks.mockFrom.mockImplementation(() => {
      callIndex++;
      if (callIndex <= 4) {
        if (callIndex === 3) return mockCountQuery(0, "in");
        if (callIndex === 4) return mockCountQuery(0, "eq");
        return mockCountQuery(0);
      }
      return mockInnovationsQuery(null, { message: "relation does not exist" });
    });
    const res = await GET(makeReq());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("relation does not exist");
  });

  it("team이 null인 혁신 -> agents 빈 배열", async () => {
    let callIndex = 0;
    mocks.mockFrom.mockImplementation(() => {
      callIndex++;
      if (callIndex <= 4) {
        if (callIndex === 3) return mockCountQuery(1, "in");
        if (callIndex === 4) return mockCountQuery(0, "eq");
        return mockCountQuery(1);
      }
      return mockInnovationsQuery([{
        id: "i2", title: "Solo Innovation", round_reached: "semi",
        team: null,
        tournament: { id: "tour1", season: 1, status: "running" },
        parent: null,
      }]);
    });
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.breakthroughs[0].agents).toEqual([]);
  });

  it("count가 null일 때 -> kpi에 0으로 fallback", async () => {
    let callIndex = 0;
    mocks.mockFrom.mockImplementation(() => {
      callIndex++;
      if (callIndex <= 2) return { select: vi.fn().mockResolvedValue({ count: null, error: null }) };
      if (callIndex === 3) return {
        select: vi.fn().mockReturnValue({ in: vi.fn().mockResolvedValue({ count: null, error: null }) }),
      };
      if (callIndex === 4) return {
        select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ count: null, error: null }) }),
      };
      return mockInnovationsQuery([]);
    });
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.kpi.totalTournaments).toBe(0);
    expect(body.kpi.totalInnovations).toBe(0);
    expect(body.kpi.breakthroughCount).toBe(0);
    expect(body.kpi.finalizedCount).toBe(0);
  });
});
