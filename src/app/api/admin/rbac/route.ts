import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/core/adminAuth";
import { admin } from "@/utils/supabase/admin";
import { assignRole, revokeRole } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: userRoles } = await admin
    .from("user_roles")
    .select("user_id, org_id, granted_at, roles(name, permissions, description)")
    .order("granted_at", { ascending: false });

  const { data: allRoles } = await admin.from("roles").select("*").order("name");

  return NextResponse.json({ userRoles: userRoles ?? [], roles: allRoles ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { action, userId, roleName, orgId } = body;

  if (!userId || !roleName) {
    return NextResponse.json({ error: "userId and roleName required" }, { status: 400 });
  }

  if (action === "revoke") {
    await revokeRole(userId, roleName, orgId);

    await admin.from("audit_logs").insert({
      actor_id: "system",
      action: "role_revoked",
      target_type: "user",
      target_id: userId,
      metadata: { roleName, orgId },
    });

    return NextResponse.json({ success: true, action: "revoked" });
  }

  // Default: assign
  await assignRole(userId, roleName, "system", orgId);

  // Audit log
  await admin.from("audit_logs").insert({
    actor_id: "system",
    action: "role_assigned",
    target_type: "user",
    target_id: userId,
    metadata: { roleName, orgId },
  });

  return NextResponse.json({ success: true, action: "assigned" });
}
