import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { admin } from "@/utils/supabase/admin";
import { checkLimit, ipFromHeaders, headersFor } from "@/core/rateLimit";

function makeSupabase(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
}

export async function POST(req: NextRequest) {
  const rl = checkLimit(`verify-otp:${ipFromHeaders(req.headers)}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "너무 많은 요청입니다." }, { status: 429, headers: headersFor(rl) });
  }

  const { otp } = await req.json();
  if (!otp || !/^\d{6}$/.test(otp)) {
    return NextResponse.json({ error: "올바른 6자리 코드를 입력해주세요." }, { status: 400 });
  }

  const supabase = makeSupabase(req);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { data: record, error } = await supabase
    .from("email_otps")
    .select("otp, expires_at")
    .eq("user_id", user.id)
    .single();

  if (error || !record) {
    return NextResponse.json({ error: "인증 코드를 먼저 요청해주세요." }, { status: 400 });
  }

  if (new Date(record.expires_at) < new Date()) {
    return NextResponse.json({ error: "인증 코드가 만료되었습니다. 다시 요청해주세요." }, { status: 400 });
  }

  if (record.otp !== otp) {
    return NextResponse.json({ error: "인증 코드가 올바르지 않습니다." }, { status: 400 });
  }

  // Mark email as confirmed via admin client
  const { error: updateErr } = await admin.auth.admin.updateUserById(user.id, {
    email_confirm: true,
  });

  if (updateErr) {
    // Fallback: delete OTP and treat as verified at app level
    await supabase.from("email_otps").delete().eq("user_id", user.id);
    return NextResponse.json({ ok: true, fallback: true });
  }

  await supabase.from("email_otps").delete().eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
