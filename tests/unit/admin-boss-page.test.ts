// @vitest-environment node
/**
 * Boss Dashboard 페이지 추가 시나리오 테스트
 * (기본 시나리오는 admin-boss-activity.test.ts 참조)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Hoisted mocks ──────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("@/core/adminAuth", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase-admin", () => ({
  getAdminClient: vi.fn(() => ({ from: mocks.mockFrom })),
}));

import { GET } from "@/app/api/admin/boss/activity/route";

const AUTH_OK = { ok: true as const };

function makeReq() {
  return new NextRequest("http://localhost/api/admin/boss/activity");
}

/** employee_activity: select → gte → order → limit */
function mockActivityQuery(data: unknown[] | null) {
  return {
    select: vi.fn().mockReturnValue({
      gte: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data }),
        }),
      }),
    }),
  };
}

/** employee_activity feed: select → order → limit */
function mockFeedQuery(data: unknown[] | null) {
  return {
    select: vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data }),
      }),
    }),
  };
}

function setupMocks(activities: unknown[] | null, feed: unknown[] | null) {
  let callIndex = 0;
  mocks.mockFrom.mockImplementation(() => {
    callIndex++;
    if (callIndex === 1) return mockActivityQuery(activities);
    return mockFeedQuery(feed);
  });
}

describe("GET /api/admin/boss/activity — 추가 시나리오", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue(AUTH_OK);
  });

  it("다중 부서 동시 집계 — 5개 부서 정확성", () => {
    const departments = ["eng", "design", "marketing", "sales", "hr"];
    const activities = departments.flatMap((dept, i) => [
      {
        department: dept,
        action_type: "build",
        user_id: `u${i * 2}`,
        created_at: `2024-01-15T${String(10 - i).padStart(2, "0")}:00:00Z`,
        metadata: { tokens: 100 },
      },
      {
        department: dept,
        action_type: "ai_query",
        user_id: `u${i * 2 + 1}`,
        created_at: `2024-01-15T${String(10 - i).padStart(2, "0")}:30:00Z`,
        metadata: { tokens: 50 },
      },
    ]);

    setupMocks(activities, []);

    return GET(makeReq()).then(async (res) => {
      const body = await res.json();
      expect(body.departments).toHaveLength(5);
      // 각 부서에 정확히 2명, 1 build, 1 ai_query
      for (const dept of body.departments) {
        expect(dept.activeMembers).toBe(2);
        expect(dept.builds).toBe(1);
        expect(dept.aiQueries).toBe(1);
      }
      expect(body.kpi.totalUsers).toBe(10);
      expect(body.kpi.totalBuilds).toBe(5);
      expect(body.kpi.totalAiQueries).toBe(5);
    });
  });

  it("빈 metadata 처리 — metadata가 빈 객체이면 tokens 0", async () => {
    const activities = [
      {
        department: "eng",
        action_type: "ai_query",
        user_id: "u1",
        created_at: "2024-01-15T10:00:00Z",
        metadata: {},
      },
      {
        department: "eng",
        action_type: "build",
        user_id: "u2",
        created_at: "2024-01-15T09:00:00Z",
        metadata: {},
      },
    ];

    setupMocks(activities, []);

    const res = await GET(makeReq());
    const body = await res.json();
    expect(body.kpi.totalTokens).toBe(0);
  });

  it("24시간 이전 데이터 필터 — gte 호출 시 24h 전 ISO 문자열 전달", async () => {
    setupMocks([], []);

    const before = Date.now();
    await GET(makeReq());
    const after = Date.now();

    // mockFrom이 첫 번째 호출(deptStats query)에서 호출됨
    const firstFromCall = mocks.mockFrom.mock.results[0].value;
    const selectFn = firstFromCall.select;
    expect(selectFn).toHaveBeenCalledOnce();

    const gteFn = selectFn.mock.results[0].value.gte;
    expect(gteFn).toHaveBeenCalledOnce();
    const [column, isoString] = gteFn.mock.calls[0];
    expect(column).toBe("created_at");

    // 전달된 ISO 문자열이 약 24시간 전을 가리키는지 확인 (±2초 허용)
    const passedTime = new Date(isoString).getTime();
    const expectedLow = before - 24 * 60 * 60 * 1000 - 2000;
    const expectedHigh = after - 24 * 60 * 60 * 1000 + 2000;
    expect(passedTime).toBeGreaterThanOrEqual(expectedLow);
    expect(passedTime).toBeLessThanOrEqual(expectedHigh);
  });

  it("KPI 합산 중 null metadata.tokens 값 처리", async () => {
    const activities = [
      {
        department: "eng",
        action_type: "ai_query",
        user_id: "u1",
        created_at: "2024-01-15T10:00:00Z",
        metadata: { tokens: 200 },
      },
      {
        department: "eng",
        action_type: "ai_query",
        user_id: "u2",
        created_at: "2024-01-15T09:00:00Z",
        metadata: { tokens: null },
      },
      {
        department: "eng",
        action_type: "build",
        user_id: "u3",
        created_at: "2024-01-15T08:00:00Z",
        metadata: null,
      },
    ];

    setupMocks(activities, []);

    const res = await GET(makeReq());
    const body = await res.json();
    // null tokens → ?? 0 으로 처리, null metadata → metadata?.tokens → undefined → ?? 0
    expect(body.kpi.totalTokens).toBe(200);
  });

  it("feed limit 20 — mockFrom 두 번째 호출에서 limit(20) 전달", async () => {
    setupMocks([], []);
    await GET(makeReq());

    // 두 번째 mockFrom 호출이 feed 쿼리
    const feedFromCall = mocks.mockFrom.mock.results[1].value;
    const selectFn = feedFromCall.select;
    const orderFn = selectFn.mock.results[0].value.order;
    const limitFn = orderFn.mock.results[0].value.limit;

    expect(limitFn).toHaveBeenCalledWith(20);
  });
});
