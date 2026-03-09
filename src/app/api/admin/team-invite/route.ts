import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/core/adminAuth";
import { getAdminClient } from "@/lib/supabase-admin";
import { getResend } from "@/lib/email";
import { checkLimit, ipFromHeaders } from "@/core/rateLimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/admin/team-invite
export async function POST(req: NextRequest) {
  // 1. Admin auth check
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  // 2. Rate limit: 10/hour per IP
  const ip = ipFromHeaders(req.headers);
  const rl = checkLimit(`team-invite:${ip}`, 10, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 1시간 후 다시 시도하세요." },
      { status: 429, headers: { "Retry-After": String(rl.resetAt - Math.floor(Date.now() / 1000)) } }
    );
  }

  // 3. Parse & validate body
  let body: { email?: string; plan?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const plan  = (body.plan === "pro" || body.plan === "team") ? body.plan : "team";

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "유효한 이메일 주소를 입력하세요." }, { status: 400 });
  }

  const admin = getAdminClient();

  // 4. Look up user by email in profiles table
  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("id, email, plan")
    .eq("email", email)
    .maybeSingle();

  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  // 5. If not found → 404
  if (!profile) {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }

  // 6. Update plan + plan_expires_at (1 year from now) in profiles table
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const { error: updateErr } = await admin
    .from("profiles")
    .update({ plan, plan_expires_at: expiresAt.toISOString() })
    .eq("id", profile.id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // 7. Also update auth.users app_metadata via admin auth
  const { error: authErr } = await admin.auth.admin.updateUserById(profile.id, {
    app_metadata: { plan },
  });

  if (authErr) {
    // Non-fatal: log but continue (plan in profiles was already updated)
    console.error("[team-invite] auth.admin.updateUserById failed:", authErr.message);
  }

  // 8. Send invite email via Resend
  try {
    const planLabel = plan === "team" ? "팀(Team)" : "프로(Pro)";
    await getResend().emails.send({
      from: "noreply@fieldnine.io",
      to: email,
      subject: "[Dalkak] 팀 플랜에 초대되었습니다",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#050508;color:#d4d8e2;padding:40px 32px;border-radius:12px;">
          <h1 style="color:#60a5fa;margin-bottom:8px;">팀 플랜에 초대되었습니다 🎉</h1>
          <p style="color:#9ca3af;margin-bottom:24px;">
            회원님의 계정이 <strong style="color:#d4d8e2;">${planLabel}</strong> 플랜으로 업그레이드되었습니다.
          </p>
          <div style="background:#0b0b14;border-radius:10px;padding:20px;margin-bottom:24px;">
            <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">이제 다음 기능을 이용하실 수 있습니다:</p>
            <ul style="color:#d4d8e2;margin:8px 0 0;padding-left:20px;line-height:1.8;">
              <li>AI 요청 무제한</li>
              <li>팀 멤버 협업 (최대 10명)</li>
              <li>클라우드 스토리지 50GB</li>
              <li>GPT-4o · Claude · Gemini 통합</li>
              <li>프라이빗 앱 배포</li>
            </ul>
          </div>
          <a href="https://fieldnine.io" style="background:linear-gradient(135deg,#60a5fa,#a855f7);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:700;">
            Dalkak 시작하기 →
          </a>
          <p style="color:#374151;font-size:12px;margin-top:32px;">
            이 메일은 자동 발송되었습니다. 문의: support@fieldnine.io
          </p>
        </div>
      `,
    });
  } catch (emailErr) {
    // Non-fatal: plan was already updated
    console.error("[team-invite] email send failed:", emailErr);
  }

  // 9. Return success
  return NextResponse.json({ ok: true, email, plan });
}
