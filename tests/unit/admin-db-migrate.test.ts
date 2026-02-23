// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Hoisted mocks ──────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  runMigrations: vi.fn(),
}));

vi.mock("@/core/adminAuth", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/migrate", () => ({
  runMigrations: mocks.runMigrations,
}));

import { POST, GET } from "@/app/api/admin/db-migrate/route";

// ── Auth 상수 ──────────────────────────────────────────────────────────────
const AUTH_OK = { ok: true as const };
const AUTH_FAIL = {
  ok: false as const,
  response: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
};

function makeReq(method = "POST") {
  return new NextRequest("http://localhost/api/admin/db-migrate", { method });
}

// ── POST 테스트 ─────────────────────────────────────────────────────────────
describe("POST /api/admin/db-migrate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    mocks.requireAdmin.mockResolvedValue(AUTH_OK);
  });

  it("인증 실패 → 401 반환", async () => {
    mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
    const res = await POST(makeReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("SUPABASE_DATABASE_URL 미설정 → ok: false + hint 반환", async () => {
    delete process.env.SUPABASE_DATABASE_URL;
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abcdef.supabase.co");

    const res = await POST(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.message).toContain("미설정");
    expect(body.hint).toBeTruthy();
    expect(body.projectRef).toBe("abcdef");
  });

  it("마이그레이션 전체 성공 → ok: true + summary", async () => {
    vi.stubEnv("SUPABASE_DATABASE_URL", "postgresql://localhost:5432/db");
    mocks.runMigrations.mockResolvedValue([
      { id: "097", label: "collab_docs", status: "ok", message: "Created" },
      { id: "098", label: "trial_columns", status: "ok", message: "Created" },
    ]);

    const res = await POST(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.summary.total).toBe(2);
    expect(body.summary.ok).toBe(2);
    expect(body.summary.errors).toBe(0);
  });

  it("일부 skip + ok → ok: true", async () => {
    vi.stubEnv("SUPABASE_DATABASE_URL", "postgresql://localhost:5432/db");
    mocks.runMigrations.mockResolvedValue([
      { id: "097", label: "collab_docs", status: "skip", message: "Already exists" },
      { id: "098", label: "trial_columns", status: "ok", message: "Created" },
    ]);

    const res = await POST(makeReq());
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.summary.skipped).toBe(1);
    expect(body.summary.ok).toBe(1);
  });

  it("마이그레이션 에러 포함 → ok: false", async () => {
    vi.stubEnv("SUPABASE_DATABASE_URL", "postgresql://localhost:5432/db");
    mocks.runMigrations.mockResolvedValue([
      { id: "097", label: "collab_docs", status: "ok" },
      { id: "098", label: "trial_columns", status: "error", message: "syntax error" },
    ]);

    const res = await POST(makeReq());
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.summary.errors).toBe(1);
  });
});

// ── GET 테스트 ──────────────────────────────────────────────────────────────
describe("GET /api/admin/db-migrate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    mocks.requireAdmin.mockResolvedValue(AUTH_OK);
  });

  it("인증 실패 → 401 반환", async () => {
    mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
    const res = await GET(makeReq("GET"));
    expect(res.status).toBe(401);
  });

  it("DB URL 설정됨 + 모든 마이그레이션 적용 → allApplied: true", async () => {
    vi.stubEnv("SUPABASE_DATABASE_URL", "postgresql://localhost:5432/db");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://ref123.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ status: 200 })
      .mockResolvedValueOnce({ status: 200, text: () => Promise.resolve("[]") });
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET(makeReq("GET"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dbUrlConfigured).toBe(true);
    expect(body.allApplied).toBe(true);
    expect(body.hint).toBeUndefined();

    vi.unstubAllGlobals();
  });
});