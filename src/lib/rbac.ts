import { admin } from "@/utils/supabase/admin";

export type Permission = "read" | "write" | "deploy" | "admin" | "billing" | "delegate";
export type RoleName = "owner" | "admin" | "manager" | "developer" | "viewer";

export interface UserRole {
  role_name: RoleName;
  permissions: Permission[];
  org_id: string | null;
}

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

export function hasPermission(roles: UserRole[], permission: Permission, orgId?: string): boolean {
  return roles.some(r => {
    if (orgId && r.org_id && r.org_id !== orgId) return false;
    return r.permissions.includes(permission);
  });
}

export function getHighestRole(roles: UserRole[]): RoleName {
  const order: RoleName[] = ["owner", "admin", "manager", "developer", "viewer"];
  for (const roleName of order) {
    if (roles.some(r => r.role_name === roleName)) return roleName;
  }
  return "viewer";
}

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

export async function revokeRole(userId: string, roleName: RoleName, orgId?: string) {
  const { data: role } = await admin.from("roles").select("id").eq("name", roleName).single();
  if (!role) return;

  let query = admin.from("user_roles").delete().eq("user_id", userId).eq("role_id", role.id);
  if (orgId) query = query.eq("org_id", orgId);
  else query = query.is("org_id", null);
  return query;
}
