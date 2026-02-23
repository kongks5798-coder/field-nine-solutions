import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/core/adminAuth";
import { getAdminClient } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const sb = getAdminClient();

  const { data: subAdmins } = await sb
    .from("sub_admins")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });

  // 부서 목록 집계
  const departments = [...new Set((subAdmins ?? []).map((s: Record<string, unknown>) => s.department as string))];

  return NextResponse.json({ subAdmins: subAdmins ?? [], departments });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const sb = getAdminClient();
  const body = await req.json();
  const { action, userId, department, permissions } = body;

  if (!userId || !department) {
    return NextResponse.json({ error: "userId and department required" }, { status: 400 });
  }

  if (action === "revoke") {
    await sb
      .from("sub_admins")
      .update({ active: false })
      .eq("user_id", userId)
      .eq("department", department);
    return NextResponse.json({ success: true, action: "revoked" });
  }

  // Delegate
  const { error } = await sb.from("sub_admins").upsert(
    {
      user_id: userId,
      department,
      permissions: permissions ?? ["read"],
      delegated_by: "system",
      active: true,
    },
    { onConflict: "user_id,department" },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit
  await sb.from("audit_log").insert({
    action: "sub_admin_delegated",
    resource: "user:" + userId,
    metadata: { department, permissions },
  });

  return NextResponse.json({ success: true, action: "delegated" });
}
