// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Hoisted mocks ──────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  mockFrom: vi.fn(),
  mockSendPlanChangedEmail: vi.fn(),
  mockLogBilling: vi.fn(),
}));

vi.mock("@/core/adminAuth", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase-admin", () => ({
  getAdminClient: vi.fn(() => ({ from: mocks.mockFrom })),
}));
vi.mock("@/lib/email", () => ({
  sendPlanChangedEmail: mocks.mockSendPlanChangedEmail,
}));
vi.mock("@/lib/logger", () => ({
  log: { billing: mocks.mockLogBilling },
}));

import { PATCH } from "@/app/api/admin/users/[id]/plan/route";

// ── Auth 상수 ──────────────────────────────────────────────────────────────
const AUTH_OK = { ok: true as const };
const AUTH_FAIL = {
  ok: false as const,
  response: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
};

function makeReq(body: unknown) {
  return new NextRequest("http://localhost/api/admin/users/user-123/plan", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

// ── 체인 헬퍼 ──────────────────────────────────────────────────────────────
function mockProfilesUpdate(error: { message: string } | null = null) {
  return {
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error }),
    }),
  };
}

function mockBillingEventsInsert() {
  return {
    insert: vi.fn().mockResolvedValue({ error: null }),
  };
}

function mockProfilesSelectEmail(email: string | null) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockReturnValue(
          Promise.resolve({ data: email ? { email } : null }),
        ),
      }),
    }),
  };
}

// ── 테스트 ──────────────────────────────────────────────────────────────────
describe("PATCH /api/admin/users/[id]/plan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue(AUTH_OK);
    mocks.mockSendPlanChangedEmail.mockResolvedValue(undefined);
  });

  it("인증 실패 → 401 반환", async () => {
    mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
    const res = await PATCH(makeReq({ plan: "pro" }), makeParams("user-123"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("잘못된 plan 값 → 400 반환", async () => {
    const res = await PATCH(makeReq({ plan: "enterprise" }), makeParams("user-123"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("pro, team, 또는 null");
  });

  it("body가 없는 경우 → 400 반환", async () => {
    const req = new NextRequest("http://localhost/api/admin/users/user-123/plan", {
      method: "PATCH",
      body: "invalid-json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req, makeParams("user-123"));
    expect(res.status).toBe(400);
  });

  it("plan=pro 설정 성공 → 200 + plan_expires_at 포함", async () => {
    let callIndex = 0;
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === "profiles" && callIndex === 0) {
        callIndex++;
        return mockProfilesUpdate(null);
      }
      if (table === "billing_events") {
        return mockBillingEventsInsert();
      }
      return mockProfilesSelectEmail("user@test.com");
    });

    const res = await PATCH(makeReq({ plan: "pro" }), makeParams("user-123"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.plan).toBe("pro");
    expect(body.plan_expires_at).toBeTruthy();
    expect(mocks.mockLogBilling).toHaveBeenCalledWith("admin.plan.updated", { uid: "user-123", plan: "pro" });
  });

  it("plan=null (해제) → 200 + plan_expires_at null", async () => {
    let callIndex = 0;
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === "profiles" && callIndex === 0) {
        callIndex++;
        return mockProfilesUpdate(null);
      }
      if (table === "billing_events") {
        return mockBillingEventsInsert();
      }
      return mockProfilesSelectEmail("user@test.com");
    });

    const res = await PATCH(makeReq({ plan: null }), makeParams("user-123"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.plan).toBeNull();
    expect(body.plan_expires_at).toBeNull();
  });

  it("DB update 실패 → 500 반환", async () => {
    mocks.mockFrom.mockReturnValue(
      mockProfilesUpdate({ message: "relation does not exist" }),
    );

    const res = await PATCH(makeReq({ plan: "team" }), makeParams("user-123"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("relation does not exist");
  });

  it("billing_events에 올바른 타입으로 기록", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    let callIndex = 0;
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === "profiles" && callIndex === 0) {
        callIndex++;
        return mockProfilesUpdate(null);
      }
      if (table === "billing_events") {
        return { insert: insertMock };
      }
      return mockProfilesSelectEmail(null);
    });

    await PATCH(makeReq({ plan: "team" }), makeParams("user-456"));

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-456",
        type: "subscription_created",
        description: expect.stringContaining("team"),
        metadata: { admin_action: true },
      }),
    );
  });
});