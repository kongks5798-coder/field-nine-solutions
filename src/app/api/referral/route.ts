import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

function makeSupabase(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
}

function makeAdminSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

// GET — get current user's referral code + stats
export async function GET(req: NextRequest) {
  const supabase = makeSupabase(req);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Generate referral code from user id (first 8 chars without dashes)
  const code = user.id.replace(/-/g, "").slice(0, 8).toUpperCase();
  const referralUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://fieldnine.io"}/signup?ref=${code}`;

  // Count how many people used this code successfully
  try {
    const adminSb = makeAdminSupabase();
    const { count } = await adminSb
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", user.id)
      .eq("rewarded", true);

    return NextResponse.json({ code, referralUrl, successCount: count ?? 0, bonusPerReferral: 10000 });
  } catch {
    return NextResponse.json({ code, referralUrl, successCount: 0, bonusPerReferral: 10000 });
  }
}

// POST — process a referral (called after signup with ref code)
export async function POST(req: NextRequest) {
  const supabase = makeSupabase(req);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { referralCode?: string };
  const { referralCode } = body;
  if (!referralCode || referralCode.length !== 8) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const adminSb = makeAdminSupabase();

  try {
    // Find referrer: scan profiles whose UUID (without dashes) starts with the code
    const { data: profiles } = await adminSb
      .from("profiles")
      .select("id");

    const referrer = profiles?.find(p => {
      const stripped = (p.id as string).replace(/-/g, "").slice(0, 8).toUpperCase();
      return stripped === referralCode.toUpperCase();
    });

    if (!referrer || referrer.id === user.id) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
    }

    // Check if already used referral
    const { data: existing } = await adminSb
      .from("referrals")
      .select("id")
      .eq("referred_id", user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "이미 추천인 코드를 사용했습니다" }, { status: 409 });
    }

    // Record referral
    await adminSb.from("referrals").insert({
      referrer_id: referrer.id,
      referred_id: user.id,
      code: referralCode,
      rewarded: false,
    });

    // Give bonus tokens to both via add_tokens RPC
    const BONUS = 10000;
    try { await adminSb.rpc("add_tokens", { user_id: user.id, amount: BONUS }); } catch { /* ignore */ }
    try { await adminSb.rpc("add_tokens", { user_id: referrer.id, amount: BONUS }); } catch { /* ignore */ }

    // Mark as rewarded
    await adminSb.from("referrals").update({ rewarded: true })
      .eq("referrer_id", referrer.id)
      .eq("referred_id", user.id);

    return NextResponse.json({
      ok: true,
      bonus: BONUS,
      message: `추천인 코드 적용! ${BONUS.toLocaleString()} 토큰이 지급되었습니다`,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
