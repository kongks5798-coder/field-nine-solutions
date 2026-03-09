import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { sendEmailVerificationOtp } from "@/lib/email";
import { checkLimit, ipFromHeaders, headersFor } from "@/core/rateLimit";

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function makeSupabase(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
}

export async function POST(req: NextRequest) {
  const rl = checkLimit(`send-otp:${ipFromHeaders(req.headers)}`, 5, 10 * 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요." }, { status: 429, headers: headersFor(rl) });
  }

  const supabase = makeSupabase(req);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (user.email_confirmed_at) {
    return NextResponse.json({ error: "이미 인증된 이메일입니다." }, { status: 400 });
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // Store OTP in email_otps table (upsert)
  const { error: dbErr } = await supabase.from("email_otps").upsert({
    user_id: user.id,
    email: user.email,
    otp,
    expires_at: expiresAt,
  }, { onConflict: "user_id" });

  if (dbErr) {
    // If table doesn't exist, fall back to Supabase built-in resend
    await supabase.auth.resend({ type: "signup", email: user.email });
    return NextResponse.json({ ok: true, method: "supabase" });
  }

  await sendEmailVerificationOtp(user.email, otp);
  return NextResponse.json({ ok: true, method: "otp" });
}
