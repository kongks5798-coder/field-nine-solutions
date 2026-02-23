// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Hoisted mocks ──────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  mockFrom: vi.fn(),
  assignRole: vi.fn(),
  revokeRole: vi.fn(),
}));

vi.mock('@/core/adminAuth', () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock('@/utils/supabase/admin', () => ({
  admin: { from: mocks.mockFrom },
}));
vi.mock('@/lib/rbac', () => ({
  assignRole: mocks.assignRole,
  revokeRole: mocks.revokeRole,
}));

import { GET, POST } from '@/app/api/admin/rbac/route';

// ── 인증 결과 상수 ──────────────────────────────────────────────────────────
const AUTH_OK = { ok: true as const };
const AUTH_FAIL = {
  ok: false as const,
  response: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
};

function makeGetReq() {
  return new NextRequest('http://localhost/api/admin/rbac');
}

function makePostReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/rbac', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ── 체인 모킹 헬퍼 ─────────────────────────────────────────────────────────
/** user_roles: select → order */
function mockUserRolesQuery(data: unknown[] | null) {
  return {
    select: vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data }),
    }),
  };
}

/** roles: select → order */
function mockAllRolesQuery(data: unknown[] | null) {
  return {
    select: vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data }),
    }),
  };
}

/** audit_logs: insert */
function mockInsertQuery() {
  return {
    insert: vi.fn().mockResolvedValue({ error: null }),
  };
}

// ── 테스트 ──────────────────────────────────────────────────────────────────
describe('/api/admin/rbac', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue(AUTH_OK);
    mocks.assignRole.mockResolvedValue({ error: null });
    mocks.revokeRole.mockResolvedValue({ error: null });
  });

  describe('GET', () => {
    it('인증 실패 시 403 반환', async () => {
      mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
      const res = await GET(makeGetReq());
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe('Forbidden');
    });

    it('userRoles + allRoles 반환', async () => {
      const userRoles = [
        { user_id: 'u1', org_id: 'org1', granted_at: '2024-01-15', roles: { name: 'admin', permissions: ['read', 'write'], description: 'Admin' } },
        { user_id: 'u2', org_id: null, granted_at: '2024-01-14', roles: { name: 'viewer', permissions: ['read'], description: 'Viewer' } },
      ];
      const allRoles = [
        { id: 'r1', name: 'admin', permissions: ['read', 'write', 'admin'], description: 'Admin role' },
        { id: 'r2', name: 'viewer', permissions: ['read'], description: 'Viewer role' },
      ];

      let callIndex = 0;
      mocks.mockFrom.mockImplementation(() => {
        callIndex++;
        if (callIndex === 1) return mockUserRolesQuery(userRoles);
        return mockAllRolesQuery(allRoles);
      });

      const res = await GET(makeGetReq());
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.userRoles).toHaveLength(2);
      expect(body.roles).toHaveLength(2);
      expect(body.userRoles[0].user_id).toBe('u1');
      expect(body.roles[0].name).toBe('admin');
    });
  });

  describe('POST', () => {
    it('역할 할당 성공', async () => {
      mocks.mockFrom.mockReturnValue(mockInsertQuery());

      const res = await POST(makePostReq({ userId: 'u1', roleName: 'admin' }));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.action).toBe('assigned');
      expect(mocks.assignRole).toHaveBeenCalledWith('u1', 'admin', 'system', undefined);
    });

    it('userId 누락 시 400 반환', async () => {
      const res = await POST(makePostReq({ roleName: 'admin' }));
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toBe('userId and roleName required');
    });

    it('revoke 액션 처리', async () => {
      mocks.mockFrom.mockReturnValue(mockInsertQuery());

      const res = await POST(makePostReq({ action: 'revoke', userId: 'u1', roleName: 'admin' }));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.action).toBe('revoked');
      expect(mocks.revokeRole).toHaveBeenCalledWith('u1', 'admin', undefined);
    });

    it('감사 로그 생성 확인', async () => {
      const insertFn = vi.fn().mockResolvedValue({ error: null });
      mocks.mockFrom.mockReturnValue({ insert: insertFn });

      await POST(makePostReq({ userId: 'u1', roleName: 'developer', orgId: 'org1' }));

      expect(mocks.mockFrom).toHaveBeenCalledWith('audit_logs');
      expect(insertFn).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'role_assigned',
          target_type: 'user',
          target_id: 'u1',
          metadata: { roleName: 'developer', orgId: 'org1' },
        }),
      );
    });

    it('잘못된 요청 body 처리 — roleName 누락', async () => {
      const res = await POST(makePostReq({ userId: 'u1' }));
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toBe('userId and roleName required');
    });
  });
});
