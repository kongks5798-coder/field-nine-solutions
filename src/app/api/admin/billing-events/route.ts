import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/core/adminAuth";
import { getAdminClient } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const admin = getAdminClient();
  const { searchParams } = req.nextUrl;
  const type   = searchParams.get("type");  // payment_succeeded|subscription_canceled 등
  const from   = searchParams.get("from");  // ISO date
  const to     = searchParams.get("to");
  const limit  = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
  const offset = parseInt(searchParams.get("offset") || "0");

  let query = admin
    .from("billing_events")
    .select("id, user_id, type, amount, description, metadata, created_at, profiles!inner(email, name)")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (type)  query = query.eq("type", type);
  if (from)  query = query.gte("created_at", from);
  if (to)    query = query.lte("created_at", to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to fetch billing events" }, { status: 500 });

  // 이번달 합계
  const periodStart = new Date(); periodStart.setDate(1); periodStart.setHours(0,0,0,0);
  const { data: monthData } = await admin
    .from("billing_events")
    .select("amount")
    .eq("type", "payment_succeeded")
    .gte("created_at", periodStart.toISOString());

  const monthlyRevenue = (monthData ?? []).reduce((s, e) => s + (e.amount ?? 0), 0);

  return NextResponse.json({
    events: data ?? [],
    monthlyRevenue,
    offset,
    limit,
  });
}
