// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetSession = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
  })),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: vi.fn().mockReturnValue([]) }),
}));

// Mock admin client — auth/me uses Promise.all with two .from().select().eq().single() calls
const mockSingle = vi.fn();
vi.mock("@/lib/supabase-admin", () => ({
  getAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockSingle,
        })),
      })),
    })),
  })),
}));

import { GET } from "@/app/api/auth/me/route";

function makeReq() {
  return new NextRequest("http://localhost/api/auth/me", { method: "GET" });
}

const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string, email: string) {
  return {
    data: {
      session: { user: { id: uid, email, user_metadata: { full_name: "Test User", avatar_url: "https://example.com/avatar.png" } } },
    },
  };
}

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: both admin profile queries return a profile row
    mockSingle.mockResolvedValue({
      data: {
        plan: "pro",
        plan_expires_at: "2025-12-31T00:00:00Z",
        name: "Test User",
        avatar_url: "https://example.com/avatar.png",
        trial_ends_at: null,
        trial_converted: false,
      },
      error: null,
    });
  });

  it("인증된 사용자 → 프로필 반환 (user.id, email, name, avatarUrl)", async () => {
    mockGetSession.mockResolvedValue(sessionOf("uid-123", "test@example.com"));
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toMatchObject({
      id: "uid-123",
      email: "test@example.com",
      name: "Test User",
      avatarUrl: "https://example.com/avatar.png",
    });
  });

  it("미인증 → { user: null } 반환", async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toBeNull();
  });

  it("트라이얼 상태 포함 — trialEndsAt, trialDaysLeft, onTrial 반환", async () => {
    // trial_ends_at을 미래 날짜로 설정
    const futureDate = new Date(Date.now() + 5 * 86_400_000).toISOString(); // 5일 후
    mockSingle.mockResolvedValue({
      data: {
        plan: "free",
        plan_expires_at: null,
        name: "Trial User",
        avatar_url: null,
        trial_ends_at: futureDate,
        trial_converted: false,
      },
      error: null,
    });
    mockGetSession.mockResolvedValue(sessionOf("uid-trial", "trial@test.com"));

    const res = await GET(makeReq());
    const body = await res.json();

    expect(body.trialEndsAt).toBe(futureDate);
    expect(body.trialDaysLeft).toBeGreaterThanOrEqual(4);
    expect(body.trialDaysLeft).toBeLessThanOrEqual(5);
    expect(body.trialConverted).toBe(false);
    expect(body.onTrial).toBe(true);
  });

  it("구독 정보 포함 — plan, planExpiresAt 반환", async () => {
    mockGetSession.mockResolvedValue(sessionOf("uid-sub", "sub@test.com"));
    const res = await GET(makeReq());
    const body = await res.json();

    expect(body.plan).toBe("pro");
    expect(body.planExpiresAt).toBe("2025-12-31T00:00:00Z");
  });

  it("Cache-Control no-store 헤더 설정", async () => {
    mockGetSession.mockResolvedValue(sessionOf("uid-cache", "cache@test.com"));
    const res = await GET(makeReq());

    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("DB 에러 시 trial 필드 기본값 반환 (에러 무시)", async () => {
    let callCount = 0;
    mockSingle.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // 첫 번째 쿼리 (profiles: plan, name 등): 성공
        return Promise.resolve({
          data: { plan: "free", plan_expires_at: null, name: "DBErr", avatar_url: null },
          error: null,
        });
      }
      // 두 번째 쿼리 (profiles: trial_ends_at 등): DB 에러
      return Promise.resolve({
        data: null,
        error: { message: "relation does not exist", code: "42P01" },
      });
    });

    mockGetSession.mockResolvedValue(sessionOf("uid-dberr", "dberr@test.com"));
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();

    // trial 에러가 발생해도 기본값으로 처리
    expect(body.trialEndsAt).toBeNull();
    expect(body.trialConverted).toBe(false);
    expect(body.trialDaysLeft).toBeNull();
    expect(body.onTrial).toBe(false);
  });
});
