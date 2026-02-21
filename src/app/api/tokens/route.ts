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

  // 원자적 차감 — Race Condition 방지 (096_token_deduct_fn.sql RPC)
  const adminSb = getAdminClient();

  const { data: rpcBalance, error: rpcError } = await adminSb
    .rpc("deduct_tokens", { p_user_id: uid, p_delta: safeD });

  if (!rpcError) {
    return NextResponse.json({ balance: rpcBalance as number });
  }

  // RPC 미적용 환경 — race condition 방지를 위해 에러 반환
  // (마이그레이션 096_token_deduct_fn.sql 실행 필요)
  log.warn('[tokens] deduct_tokens RPC 실패 — 마이그레이션 096을 실행하세요', {
    error: rpcError.message,
    userId: uid,
  });
  return NextResponse.json(
    { error: '서비스 일시 오류. 잠시 후 다시 시도해주세요.' },
    { status: 503 }
  );
}
