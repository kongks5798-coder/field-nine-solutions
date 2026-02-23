import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/core/adminAuth";
import { getAdminClient } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const admin = getAdminClient();
  const { searchParams } = req.nextUrl;
  const action = searchParams.get("action"); // rate_limited|auth.denied 등
  const ip     = searchParams.get("ip");
  const limit  = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
  const offset = parseInt(searchParams.get("offset") || "0");

  let query = admin
    .from("audit_log")
    .select("id, user_id, action, resource, ip, user_agent, status_code, metadata, created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (action) query = query.ilike("action", `%${action}%`);
  if (ip)     query = query.eq("ip", ip);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });

  return NextResponse.json({ logs: data ?? [], offset, limit });
}
