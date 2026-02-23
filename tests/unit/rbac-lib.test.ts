// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-key');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');

vi.mock('@/utils/supabase/admin', () => ({
  admin: { from: mocks.mockFrom },
}));

import { hasPermission, getHighestRole } from '@/lib/rbac';
import type { UserRole } from '@/lib/rbac';

// ── 테스트 ──────────────────────────────────────────────────────────────────
describe('rbac lib', () => {
  describe('hasPermission', () => {
    const roles: UserRole[] = [
      { role_name: 'admin', permissions: ['read', 'write', 'admin'], org_id: 'org1' },
      { role_name: 'viewer', permissions: ['read'], org_id: null },
    ];

    it('권한 있으면 true', () => {
      expect(hasPermission(roles, 'read')).toBe(true);
      expect(hasPermission(roles, 'write')).toBe(true);
      expect(hasPermission(roles, 'admin')).toBe(true);
    });

    it('권한 없으면 false', () => {
      expect(hasPermission(roles, 'deploy')).toBe(false);
      expect(hasPermission(roles, 'billing')).toBe(false);
    });

    it('orgId 필터 동작', () => {
      // org1에서 admin 역할에 write 권한이 있으므로 true
      expect(hasPermission(roles, 'write', 'org1')).toBe(true);
      // org2에서 admin 역할은 org1에만 속하므로 매칭 안 됨.
      // 하지만 viewer 역할은 org_id가 null이라 모든 org에서 통과
      expect(hasPermission(roles, 'read', 'org2')).toBe(true);
      // org2에서 write 권한: admin은 org_id 불일치, viewer는 write 없음 → false
      expect(hasPermission(roles, 'write', 'org2')).toBe(false);
    });
  });

  describe('getHighestRole', () => {
    it('owner 반환', () => {
      const roles: UserRole[] = [
        { role_name: 'developer', permissions: ['read', 'write'], org_id: null },
        { role_name: 'owner', permissions: ['read', 'write', 'admin', 'deploy', 'billing'], org_id: null },
        { role_name: 'viewer', permissions: ['read'], org_id: null },
      ];
      expect(getHighestRole(roles)).toBe('owner');
    });

    it('빈 배열 시 viewer 반환', () => {
      expect(getHighestRole([])).toBe('viewer');
    });

    it('developer만 있을 때 developer 반환', () => {
      const roles: UserRole[] = [
        { role_name: 'developer', permissions: ['read', 'write'], org_id: null },
      ];
      expect(getHighestRole(roles)).toBe('developer');
    });
  });
});
