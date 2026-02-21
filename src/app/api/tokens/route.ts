import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { validateEnv } from "@/lib/env";
import { getAdminClient } from "@/lib/supabase-admin";
import { log } from "@/lib/logger";
validateEnv();

const TOK_DEFAULT = 50000;

function serverClient(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
}

// GET /api/tokens — get user's token balance
export async function GET(req: NextRequest) {
  const supabase = serverClient(req);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ balance: TOK_DEFAULT });

  const uid = session.user.id;
  const { data } = await supabase
    .from("user_tokens")
    .select("balance")
    .eq("user_id", uid)
    .single();

  if (data) return NextResponse.json({ balance: data.balance });

  // First time: upsert to safely handle concurrent requests (no duplicate key error)
  await supabase.from("user_tokens").upsert(
    { user_id: uid, balance: TOK_DEFAULT, updated_at: new Date().toISOString() },
    { onConflict: "user_id", ignoreDuplicates: true }
  );
  return NextResponse.json({ balance: TOK_DEFAULT });
}

// PATCH /api/tokens — deduct tokens (client: delta must be negative)
// Body: { delta: number }  — only negative values accepted from client
export async function PATCH(req: NextRequest) {
  const supabase = serverClient(req);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = session.user.id;
  const body = await req.json().catch(() => ({}));
  const { delta } = body as { delta?: number };

  // Only allow deductions from client (negative delta only)
  if (typeof delta !== "number" || !Number.isInteger(delta) || delta >= 0) {
    return NextResponse.json({ error: "delta must be a negative integer" }, { status: 400 });
  }

  // Cap deduction at -10000 per call to prevent abuse
  const safeD = Math.max(delta, -10000);

  const adminSb = getAdminClient();

  // 1차 시도: 원자적 DB 함수 (096_token_deduct_fn.sql 적용 시)
  const { data: rpcBalance, error: rpcError } = await adminSb
    .rpc("deduct_tokens", { p_user_id: uid, p_delta: safeD });

  if (!rpcError) {
    return NextResponse.json({ balance: rpcBalance as number });
  }

  // 2차: 낙관적 잠금(Optimistic Locking) 폴백 — DB 함수 없이 Race Condition 안전 차감
  // 최대 5회 재시도, 각 시도는 balance 일치 조건으로 충돌 감지
  const MAX_RETRIES = 5;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const { data: tok } = await adminSb
      .from("user_tokens")
      .select("balance")
      .eq("user_id", uid)
      .maybeSingle();

    if (!tok) {
      // 최초 사용자 — INSERT (동시 INSERT 충돌 시 재시도)
      const initBalance = Math.max(0, TOK_DEFAULT + safeD);
      const { data: inserted } = await adminSb
        .from("user_tokens")
        .insert({ user_id: uid, balance: initBalance, updated_at: new Date().toISOString() })
        .select("balance")
        .maybeSingle();
      if (inserted) return NextResponse.json({ balance: inserted.balance });
      continue; // INSERT 충돌(동시 요청) → 재시도
    }

    const newBalance = Math.max(0, tok.balance + safeD);
    // 낙관적 잠금: 읽은 balance와 동일할 때만 업데이트
    const { data: updated } = await adminSb
      .from("user_tokens")
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq("user_id", uid)
      .eq("balance", tok.balance) // 다른 요청이 먼저 바꿨으면 0행 = 재시도
      .select("balance")
      .maybeSingle();

    if (updated) return NextResponse.json({ balance: updated.balance });
    // 충돌(0행 업데이트) → 잠시 대기 후 재시도
  }

  log.error("[tokens] 낙관적 잠금 최대 재시도 초과", { userId: uid });
  return NextResponse.json(
    { error: "잠시 후 다시 시도해주세요." },
    { status: 409 }
  );
}
