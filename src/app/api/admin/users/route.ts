import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/core/adminAuth";
import { getAdminClient } from "@/lib/supabase-admin";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const admin = getAdminClient();
  const { searchParams } = req.nextUrl;
  const plan   = searchParams.get("plan");   // 필터: pro|team|null
  const search = searchParams.get("search"); // 이메일 검색
  const limit  = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const offset = parseInt(searchParams.get("offset") || "0");

  // profiles + plan 정보 조회
  let query = admin
    .from("profiles")
    .select("id, email, name, plan, plan_expires_at, plan_updated_at, created_at, stripe_customer_id")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (plan === "null") {
    query = query.is("plan", null);
  } else if (plan) {
    query = query.eq("plan", plan);
  }
  if (search) {
    query = query.ilike("email", `%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });

  // 전체 유저수
  const { count: total } = await admin.from("profiles").select("id", { count: "exact", head: true });

  return NextResponse.json({ users: data ?? [], total: total ?? 0, offset, limit });
}
