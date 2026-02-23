// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Hoisted mocks ──────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/core/adminAuth', () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock('@/lib/supabase-admin', () => ({
  getAdminClient: vi.fn(() => ({ from: mocks.mockFrom })),
}));

import { GET, POST } from '@/app/api/admin/delegation/route';

// ── 인증 결과 상수 ──────────────────────────────────────────────────────────
const AUTH_OK = { ok: true as const };
const AUTH_FAIL = {
  ok: false as const,
  response: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
};

function makeGetReq() {
  return new NextRequest('http://localhost/api/admin/delegation');
}

function makePostReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/delegation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ── 체인 모킹 헬퍼 ─────────────────────────────────────────────────────────
/** sub_admins: select → eq → order */
function mockSubAdminsQuery(data: unknown[] | null) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data }),
      }),
    }),
  };
}

/** sub_admins: update → eq → eq */
function mockUpdateQuery() {
  return {
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  };
}

/** sub_admins: upsert → select */
function mockUpsertQuery(error: { message: string } | null = null) {
  return {
    upsert: vi.fn().mockResolvedValue({ error }),
  };
}

/** audit_log: insert */
function mockInsertQuery() {
  return {
    insert: vi.fn().mockResolvedValue({ error: null }),
  };
}

// ── 테스트 ──────────────────────────────────────────────────────────────────
describe('/api/admin/delegation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue(AUTH_OK);
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  describe('GET', () => {
    it('인증 실패 시 403 반환', async () => {
      mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
      const res = await GET(makeGetReq());
      expect(res.status).toBe(403);
    });

    it('서브 관리자 목록 반환', async () => {
      const subAdmins = [
        { id: 's1', user_id: 'u1', department: 'engineering', permissions: ['read', 'write'], active: true, created_at: '2024-01-15' },
        { id: 's2', user_id: 'u2', department: 'design', permissions: ['read'], active: true, created_at: '2024-01-14' },
      ];
      mocks.mockFrom.mockReturnValue(mockSubAdminsQuery(subAdmins));

      const res = await GET(makeGetReq());
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.subAdmins).toHaveLength(2);
      expect(body.subAdmins[0].department).toBe('engineering');
    });

    it('부서 목록 중복제거', async () => {
      const subAdmins = [
        { id: 's1', user_id: 'u1', department: 'engineering', permissions: ['read'], active: true, created_at: '2024-01-15' },
        { id: 's2', user_id: 'u2', department: 'engineering', permissions: ['read', 'write'], active: true, created_at: '2024-01-14' },
        { id: 's3', user_id: 'u3', department: 'design', permissions: ['read'], active: true, created_at: '2024-01-13' },
      ];
      mocks.mockFrom.mockReturnValue(mockSubAdminsQuery(subAdmins));

      const res = await GET(makeGetReq());
      const body = await res.json();

      expect(body.departments).toHaveLength(2);
      expect(body.departments).toContain('engineering');
      expect(body.departments).toContain('design');
    });
  });

  describe('POST', () => {
    it('위임 성공', async () => {
      let callIndex = 0;
      mocks.mockFrom.mockImplementation(() => {
        callIndex++;
        if (callIndex === 1) return mockUpsertQuery();
        return mockInsertQuery(); // audit_log
      });

      const res = await POST(makePostReq({ userId: 'u1', department: 'engineering', permissions: ['read', 'write'] }));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.action).toBe('delegated');
    });

    it('userId 누락 시 400 반환', async () => {
      const res = await POST(makePostReq({ department: 'engineering' }));
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toBe('userId and department required');
    });

    it('revoke 액션 처리', async () => {
      mocks.mockFrom.mockReturnValue(mockUpdateQuery());

      const res = await POST(makePostReq({ action: 'revoke', userId: 'u1', department: 'engineering' }));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.action).toBe('revoked');
    });

    it('감사 로그 생성', async () => {
      const insertFn = vi.fn().mockResolvedValue({ error: null });
      let callIndex = 0;
      mocks.mockFrom.mockImplementation(() => {
        callIndex++;
        if (callIndex === 1) return mockUpsertQuery();
        return { insert: insertFn };
      });

      await POST(makePostReq({ userId: 'u1', department: 'engineering', permissions: ['read'] }));

      expect(insertFn).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'sub_admin_delegated',
          resource: 'user:u1',
          metadata: { department: 'engineering', permissions: ['read'] },
        }),
      );
    });
  });
});
