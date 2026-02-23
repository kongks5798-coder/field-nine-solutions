import { admin } from "@/utils/supabase/admin";

export type Permission = "read" | "write" | "deploy" | "admin" | "billing" | "delegate";
export type RoleName = "owner" | "admin" | "manager" | "developer" | "viewer";

export interface UserRole {
  role_name: RoleName;
  permissions: Permission[];
  org_id: string | null;
}

/**
 * 사용자에게 할당된 모든 역할(role)을 조회한다.
 *
 * `user_roles` 테이블에서 해당 사용자의 레코드를 가져오고,
 * 연관된 `roles` 테이블의 이름(name)과 권한(permissions)을 함께 반환한다.
 *
 * @param userId - 조회할 사용자의 UUID
 * @returns 사용자에게 할당된 {@link UserRole} 배열. 역할이 없으면 빈 배열을 반환한다.
 *
 * @example
 * ```ts
 * const roles = await getUserRoles("user-uuid-123");
 * // [{ role_name: "developer", permissions: ["read", "write"], org_id: "org-1" }]
 * ```
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const { data } = await admin
    .from("user_roles")
    .select("role_id, org_id, roles(name, permissions)")
    .eq("user_id", userId);

  if (!data) return [];
  return data.map((r: Record<string, unknown>) => {
    const roles = r.roles as { name: RoleName; permissions: Permission[] } | { name: RoleName; permissions: Permission[] }[];
    const role = Array.isArray(roles) ? roles[0] : roles;
    return {
      role_name: role.name,
      permissions: role.permissions,
      org_id: r.org_id as string | null,
    };
  });
}

/**
 * 주어진 역할 목록에 특정 권한이 포함되어 있는지 확인한다.
 *
 * `orgId`가 지정된 경우, 해당 조직에 귀속된 역할만 검사한다.
 * `orgId`가 없으면 조직 무관하게 모든 역할을 검사한다.
 *
 * @param roles - 검사할 {@link UserRole} 배열
 * @param permission - 확인할 권한 (예: `"read"`, `"write"`, `"deploy"`)
 * @param orgId - (선택) 특정 조직 범위로 제한할 조직 ID
 * @returns 해당 권한을 가진 역할이 하나라도 있으면 `true`, 없으면 `false`
 *
 * @example
 * ```ts
 * if (hasPermission(roles, "deploy", "org-abc")) {
 *   // 배포 수행
 * }
 * ```
 */
export function hasPermission(roles: UserRole[], permission: Permission, orgId?: string): boolean {
  return roles.some(r => {
    if (orgId && r.org_id && r.org_id !== orgId) return false;
    return r.permissions.includes(permission);
  });
}

/**
 * 역할 목록에서 가장 높은 우선순위의 역할 이름을 반환한다.
 *
 * 우선순위: `owner` > `admin` > `manager` > `developer` > `viewer`.
 * 역할이 비어 있거나 알 수 없는 역할만 있으면 기본값 `"viewer"`를 반환한다.
 *
 * @param roles - 검사할 {@link UserRole} 배열
 * @returns 가장 높은 우선순위의 {@link RoleName}
 *
 * @example
 * ```ts
 * const highest = getHighestRole(roles); // "admin"
 * ```
 */
export function getHighestRole(roles: UserRole[]): RoleName {
  const order: RoleName[] = ["owner", "admin", "manager", "developer", "viewer"];
  for (const roleName of order) {
    if (roles.some(r => r.role_name === roleName)) return roleName;
  }
  return "viewer";
}

/**
 * 사용자에게 역할을 부여한다.
 *
 * `roles` 테이블에서 역할 ID를 조회한 뒤 `user_roles` 테이블에 upsert한다.
 * 동일한 `(user_id, role_id, org_id)` 조합이 이미 존재하면 갱신된다.
 *
 * @param userId - 역할을 부여할 대상 사용자의 UUID
 * @param roleName - 부여할 역할 이름 (예: `"developer"`, `"admin"`)
 * @param grantedBy - 역할을 부여한 관리자의 UUID (감사 추적용)
 * @param orgId - (선택) 역할이 귀속될 조직 ID. 미지정 시 글로벌 역할로 처리됨
 * @returns Supabase upsert 결과 (PostgrestResponse)
 * @throws {Error} 지정한 `roleName`이 `roles` 테이블에 존재하지 않을 경우
 *
 * @example
 * ```ts
 * await assignRole("user-123", "developer", "admin-456", "org-789");
 * ```
 */
export async function assignRole(userId: string, roleName: RoleName, grantedBy: string, orgId?: string) {
  const { data: role } = await admin.from("roles").select("id").eq("name", roleName).single();
  if (!role) throw new Error(`Role not found: ${roleName}`);

  return admin.from("user_roles").upsert({
    user_id: userId,
    role_id: role.id,
    org_id: orgId ?? null,
    granted_by: grantedBy,
  }, { onConflict: "user_id,role_id,org_id" });
}

/**
 * 사용자로부터 특정 역할을 회수한다.
 *
 * `roles` 테이블에서 역할 ID를 조회한 뒤 `user_roles` 테이블에서 해당 레코드를 삭제한다.
 * 역할이 존재하지 않으면 아무 작업도 수행하지 않고 조기 반환한다.
 *
 * @param userId - 역할을 회수할 대상 사용자의 UUID
 * @param roleName - 회수할 역할 이름
 * @param orgId - (선택) 특정 조직 범위의 역할만 삭제. 미지정 시 `org_id IS NULL` 조건으로 글로벌 역할을 삭제
 * @returns Supabase delete 결과 또는 `undefined` (역할이 존재하지 않을 경우)
 *
 * @example
 * ```ts
 * await revokeRole("user-123", "developer", "org-789");
 * ```
 */
export async function revokeRole(userId: string, roleName: RoleName, orgId?: string) {
  const { data: role } = await admin.from("roles").select("id").eq("name", roleName).single();
  if (!role) return;

  let query = admin.from("user_roles").delete().eq("user_id", userId).eq("role_id", role.id);
  if (orgId) query = query.eq("org_id", orgId);
  else query = query.is("org_id", null);
  return query;
}
