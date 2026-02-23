import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/core/adminAuth";
import { getAdminClient } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const admin = getAdminClient();
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status"); // active|canceled|past_due
  const limit  = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const offset = parseInt(searchParams.get("offset") || "0");

  let query = admin
    .from("subscriptions")
    .select(`
      id, user_id, plan, status,
      stripe_subscription_id, stripe_customer_id,
      toss_payment_key, toss_order_id,
      original_price, discounted_price,
      current_period_start, current_period_end,
      cancel_at_period_end, canceled_at,
      created_at, updated_at,
      profiles!inner(email, name)
    `)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });

  // 각 구독에 provider 필드 추가
  const enriched = (data ?? []).map(sub => ({
    ...sub,
    provider: sub.toss_payment_key ? "toss" : sub.stripe_subscription_id ? "stripe" : "unknown",
  }));

  return NextResponse.json({ subscriptions: enriched, offset, limit });
}
