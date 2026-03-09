import { NextResponse } from "next/server";
import { getResend } from "@/lib/email";
import { ipFromHeaders, checkLimit, headersFor } from "@/core/rateLimit";
import { z } from "zod";

export const runtime = "edge";

const WelcomeSchema = z.object({
  email: z.string().email(),
  name: z.string().max(100).optional(),
});

const WELCOME_HTML = (name: string) => `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>딸깍에 오신 것을 환영합니다</title>
</head>
<body style="margin:0;padding:0;background:#07080f;font-family:'Pretendard',Inter,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#07080f;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border-radius:20px;overflow:hidden;background:linear-gradient(160deg,#0f1020 0%,#160926 100%);border:1px solid rgba(249,115,22,0.15);">

          <!-- Header -->
          <tr>
            <td style="padding:40px 40px 32px;text-align:center;background:linear-gradient(135deg,rgba(249,115,22,0.08) 0%,rgba(244,63,94,0.08) 100%);">
              <div style="display:inline-flex;align-items:center;justify-content:center;gap:10px;margin-bottom:24px;">
                <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#f97316,#f43f5e);display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:20px;color:#fff;line-height:1;">D</div>
                <span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">Dalkak</span>
              </div>
              <h1 style="margin:0 0 12px;font-size:28px;font-weight:800;color:#fff;line-height:1.3;">
                안녕하세요 ${name}!<br />
                <span style="background:linear-gradient(135deg,#f97316,#f43f5e);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">딸깍</span>에 오신 것을 환영합니다
              </h1>
              <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.6;">
                AI로 무엇이든 뚝딱 만들어드립니다. 지금 바로 시작해보세요.
              </p>
            </td>
          </tr>

          <!-- Free token badge -->
          <tr>
            <td style="padding:0 40px 32px;">
              <div style="background:linear-gradient(135deg,rgba(249,115,22,0.12),rgba(244,63,94,0.12));border:1px solid rgba(249,115,22,0.3);border-radius:12px;padding:16px 20px;text-align:center;">
                <span style="font-size:24px;">🎁</span>
                <p style="margin:8px 0 0;font-size:15px;font-weight:700;color:#f97316;">무료로 50토큰이 제공됩니다</p>
                <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.45);">바로 AI 기능을 체험해보세요 — 카드 정보 불필요</p>
              </div>
            </td>
          </tr>

          <!-- What can you build -->
          <tr>
            <td style="padding:0 40px 32px;">
              <h2 style="margin:0 0 16px;font-size:17px;font-weight:700;color:#e8eaf0;">무엇을 만들 수 있나요?</h2>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="33%" style="padding-right:8px;vertical-align:top;">
                    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px 16px;text-align:center;">
                      <div style="font-size:28px;margin-bottom:10px;">🛍️</div>
                      <div style="font-size:13px;font-weight:700;color:#e8eaf0;margin-bottom:6px;">쇼핑몰</div>
                      <div style="font-size:11px;color:rgba(255,255,255,0.4);line-height:1.5;">상품 목록·장바구니·결제 페이지를 AI가 완성</div>
                    </div>
                  </td>
                  <td width="33%" style="padding:0 4px;vertical-align:top;">
                    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px 16px;text-align:center;">
                      <div style="font-size:28px;margin-bottom:10px;">💼</div>
                      <div style="font-size:13px;font-weight:700;color:#e8eaf0;margin-bottom:6px;">포트폴리오</div>
                      <div style="font-size:11px;color:rgba(255,255,255,0.4);line-height:1.5;">나만의 개성있는 포트폴리오 사이트 즉시 제작</div>
                    </div>
                  </td>
                  <td width="33%" style="padding-left:8px;vertical-align:top;">
                    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px 16px;text-align:center;">
                      <div style="font-size:28px;margin-bottom:10px;">🎮</div>
                      <div style="font-size:13px;font-weight:700;color:#e8eaf0;margin-bottom:6px;">게임</div>
                      <div style="font-size:11px;color:rgba(255,255,255,0.4);line-height:1.5;">퍼즐·슈팅·RPG 미니 게임을 코드 없이 생성</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 40px 40px;text-align:center;">
              <a href="https://fieldnine.io/workspace"
                style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#f97316,#f43f5e);color:#fff;font-size:16px;font-weight:800;text-decoration:none;border-radius:12px;letter-spacing:-0.3px;box-shadow:0 8px 24px rgba(249,115,22,0.35);">
                지금 바로 만들기 →
              </a>
              <p style="margin:16px 0 0;font-size:12px;color:rgba(255,255,255,0.3);">버튼을 클릭하면 바로 워크스페이스가 열립니다</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:rgba(255,255,255,0.06);"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:rgba(255,255,255,0.3);">
                <a href="https://fieldnine.io" style="color:rgba(249,115,22,0.7);text-decoration:none;">fieldnine.io</a>
                &nbsp;|&nbsp;
                <a href="https://fieldnine.io/unsubscribe" style="color:rgba(255,255,255,0.25);text-decoration:none;">수신 거부</a>
              </p>
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.15);">
                © 2026 FieldNine Inc. · Seoul, Korea · 이 메일은 회원가입 시 자동 발송됩니다
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

export async function POST(req: Request) {
  // Rate limit: 3 per hour per IP
  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:welcome:${ip}`, 3, 60 * 60 * 1000);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  const parsed = WelcomeSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { email, name } = parsed.data;
  const displayName = name?.trim() || "님";

  try {
    await getResend().emails.send({
      from: "Dalkak <noreply@fieldnine.io>",
      to: email,
      subject: "[딸깍] 환영합니다! AI로 첫 앱을 만들어보세요 🚀",
      html: WELCOME_HTML(displayName),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[welcome-email] send failed:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
