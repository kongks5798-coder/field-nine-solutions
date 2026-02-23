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

vi.mock("@/lib/logger", () => ({
  log: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { GET } from "@/app/api/billing/history/route";

function makeReq() {
  return new NextRequest("http://localhost/api/billing/history", { method: "GET" });
}

const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string) {
  return { data: { session: { user: { id: uid } } } };
}

const MONTHLY = [
  { billing_period: "2024-03", ai_calls: 50, amount_krw: 29900, status: "paid", stripe_invoice_id: "inv_3" },
  { billing_period: "2024-02", ai_calls: 30, amount_krw: 19900, status: "paid", stripe_invoice_id: "inv_2" },
  { billing_period: "2024-01", ai_calls: 10, amount_krw: 9900, status: "paid", stripe_invoice_id: "inv_1" },
];
const EVENTS = [
  { id: "ev-2", type: "payment_succeeded", amount: 29900, description: "3월 결제", created_at: "2024-03-01" },
  { id: "ev-1", type: "subscription_created", amount: 9900, description: "구독 시작", created_at: "2024-01-01" },
];

function setupMock(monthly: unknown, events: unknown, monthlyErr?: unknown, eventsErr?: unknown) {
  let callCount = 0;
  mockFrom.mockImplementation(() => {
    callCount++;
    const call = callCount;
    const result =
      call === 1
        ? { data: monthly, error: monthlyErr ?? null }
        : { data: events, error: eventsErr ?? null };
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(result),
          }),
        }),
      }),
    };
  });
}

describe("GET /api/billing/history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("인증 필요 — 미인증 시 401 반환", async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("사용자 결제 이력 반환 — monthly, events 배열", async () => {
    mockGetSession.mockResolvedValue(sessionOf("user-1"));
    setupMock(MONTHLY, EVENTS);
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.monthly).toHaveLength(3);
    expect(body.monthly[0].billing_period).toBe("2024-03");
    expect(body.events).toHaveLength(2);
    expect(body.events[0].id).toBe("ev-2");
  });

  it("페이지네이션 동작 — monthly limit 12, events limit 20 확인", async () => {
    mockGetSession.mockResolvedValue(sessionOf("user-page"));
    setupMock([], []);
    await GET(makeReq());

    // 첫 번째 mockFrom 호출 (monthly_usage)
    const firstCall = mockFrom.mock.results[0].value;
    const monthlyLimitFn =
      firstCall.select.mock.results[0].value
        .eq.mock.results[0].value
        .order.mock.results[0].value.limit;
    expect(monthlyLimitFn).toHaveBeenCalledWith(12);

    // 두 번째 mockFrom 호출 (billing_events)
    const secondCall = mockFrom.mock.results[1].value;
    const eventsLimitFn =
      secondCall.select.mock.results[0].value
        .eq.mock.results[0].value
        .order.mock.results[0].value.limit;
    expect(eventsLimitFn).toHaveBeenCalledWith(20);
  });

  it("Cache-Control no-store 헤더 설정", async () => {
    mockGetSession.mockResolvedValue(sessionOf("user-cache"));
    setupMock(MONTHLY, EVENTS);
    const res = await GET(makeReq());

    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("빈 이력 처리 — null 데이터 시 빈 배열 반환", async () => {
    mockGetSession.mockResolvedValue(sessionOf("user-empty"));
    setupMock(null, null);
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.monthly).toEqual([]);
    expect(body.events).toEqual([]);
  });
});
